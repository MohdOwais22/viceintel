import { 
  Client, 
  Interaction, 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  PermissionsBitField,
  ButtonBuilder,
  ButtonStyle,
  ModalSubmitInteraction,
  ButtonInteraction
} from 'discord.js';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { grantWhitelistRole } from '../services/role-grant';
import { BotGuildConfig, WhitelistApplication } from '../types';
import { getGuildConfig, checkGuildRateLimit } from '../client';

/**
 * Main interactionCreate event dispatcher handling slash commands, B2B buttons, and review modals.
 */
export async function handleInteractionCreate(client: Client, interaction: Interaction) {
  try {
    // Check local guild & user rate limiter
    if (interaction.guildId) {
      const rateLimit = checkGuildRateLimit(interaction.guildId, interaction.user?.id);
      if (!rateLimit.allowed) {
        const secondsRemaining = Math.ceil(rateLimit.retryAfterMs / 1000);
        const limitTypeMsg = rateLimit.reason === 'guild_limit'
          ? `⚠️ **Server Rate Limit Exceeded**: This Discord server has exceeded the command limit (30 requests/min). Please try again in ${secondsRemaining} seconds.`
          : `⏳ **Too Fast**: You are sending commands too quickly. Please slow down and try again in ${secondsRemaining} seconds.`;

        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: limitTypeMsg,
            ephemeral: true
          });
        }
        return;
      }
    }
    // 1. Slash Commands dispatching
    if (interaction.isChatInputCommand()) {
      const commandName = interaction.commandName;
      let cmdModule: any;
      try {
        if (commandName === 'vcc-setup') {
          cmdModule = await import('../commands/setup');
        } else if (commandName === 'status') {
          cmdModule = await import('../commands/status');
        } else if (commandName === 'apply') {
          cmdModule = await import('../commands/apply');
        }
      } catch (err) {
        console.warn(`Command module load error for /${commandName}:`, err);
      }

      if (cmdModule) {
        await cmdModule.execute(interaction);
      }
      return;
    }

    // 2. Interactive Buttons for Application approvals and rejections
    if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId.startsWith('btn_approve_') || customId.startsWith('btn_reject_')) {
        await handleReviewButton(client, interaction);
      }
      return;
    }

    // 3. Interactive Modals for Rejection notes
    if (interaction.isModalSubmit()) {
      const customId = interaction.customId;

      if (customId.startsWith('modal_reject_')) {
        await handleRejectionModalSubmit(client, interaction);
      }
      return;
    }

  } catch (error) {
    console.error('[VCC Bot Interaction Dispatch Fail]:', error);
  }
}

/**
 * Handles 1-Click Approve and Reject Buttons with permission safeguards
 */
async function handleReviewButton(client: Client, interaction: ButtonInteraction) {
  const customId = interaction.customId;
  const isApprove = customId.startsWith('btn_approve_');
  const appId = customId.replace(isApprove ? 'btn_approve_' : 'btn_reject_', '');

  const member = interaction.member as any;

  // Authorization Shield: Verify if moderator has elevated administrative or staff permissions
  const hasAuth = 
    member?.permissions?.has(PermissionsBitField.Flags.Administrator) ||
    member?.permissions?.has(PermissionsBitField.Flags.ManageGuild) ||
    member?.permissions?.has(PermissionsBitField.Flags.ManageRoles);

  if (!hasAuth) {
    return interaction.reply({
      content: '❌ **Access Denied**: You must have `Manage Roles` or `Manage Server` permissions to review applications.',
      ephemeral: true
    });
  }

  // Fetch application document from Firestore to prevent double-reviews
  const appDocRef = doc(db, 'whitelist_applications', appId);
  const appSnap = await getDoc(appDocRef);

  if (!appSnap.exists()) {
    return interaction.reply({
      content: '❌ **Error**: This application dossier was not found in our Firestore database.',
      ephemeral: true
    });
  }

  const appData = appSnap.data() as WhitelistApplication;
  if (appData.status !== 'pending' && appData.status !== 'under_review') {
    return interaction.reply({
      content: `⚠️ **Already Reviewed**: This application has already been processed and is currently marked as **${appData.status.toUpperCase()}**.`,
      ephemeral: true
    });
  }

  if (isApprove) {
    // Execute instant Approval Pipeline
    await interaction.deferReply({ ephemeral: true });
    const success = await executeApprovePipeline(client, interaction, appId, appData);
    if (success) {
      await interaction.editReply({ content: '✅ **Application approved successfully!** The player has been whitelisted.' });
    } else {
      await interaction.editReply({ content: '❌ **Approval pipeline encountered an issue**. Check server logs.' });
    }
  } else {
    // Open an interactive modal prompting for rejection reasons
    const modal = new ModalBuilder()
      .setCustomId(`modal_reject_${appId}`)
      .setTitle('Reject Whitelist Application');

    const feedbackInput = new TextInputBuilder()
      .setCustomId('reject_feedback')
      .setLabel('REJECTION REASON / FEEDBACK')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter feedback (e.g. Backstory too short, fails realism rule, etc.)')
      .setRequired(true)
      .setMaxLength(500);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(feedbackInput);
    modal.addComponents(firstRow);

    await interaction.showModal(modal);
  }
}

/**
 * Executes Firestore changes, grants Discord roles, and updates message view atomically
 */
async function executeApprovePipeline(
  client: Client,
  interaction: ButtonInteraction,
  appId: string,
  appData: WhitelistApplication
): Promise<boolean> {
  try {
    const guildId = interaction.guildId!;
    const reviewerUser = interaction.user;

    // Load Bot Guild config for role ID from memory cache
    const config = await getGuildConfig(guildId);

    if (!config) {
      return false;
    }

    const roleId = config.whitelistRoleId;
    const applicantTargetId = appData.applicantDiscordId || appData.discordId;

    // 1. Atomically update Firestore WhitelistApplication
    const appDocRef = doc(db, 'whitelist_applications', appId);
    await setDoc(appDocRef, {
      status: 'approved',
      reviewedBy: reviewerUser.tag,
      reviewedByDiscordId: reviewerUser.id,
      reviewedAt: Date.now()
    }, { merge: true });

    // 2. Grant whitelisting role in Discord (if autoRoleEnabled)
    if (config.autoRoleEnabled && applicantTargetId) {
      await grantWhitelistRole(
        client,
        guildId,
        applicantTargetId,
        roleId,
        config.logsChannelId
      );
    }

    // 3. Send automated Direct Message alert to candidate
    if (applicantTargetId) {
      try {
        const applicantUser = await client.users.fetch(applicantTargetId);
        if (applicantUser) {
          const dmMesg = `🟢 **Whitelist Approved**: Your whitelist application for **${interaction.guild!.name}** has been approved! The whitelist role has been assigned to your Discord profile. Have fun!`;
          await applicantUser.send(dmMesg);
        }
      } catch (dmErr) {
        console.warn(`[VCC Bot DM Failed]: Could not DM approved player ${applicantTargetId}:`, dmErr);
      }
    }

    // 4. Update review embed to locked green approved state
    const originalMessage = interaction.message;
    const oldEmbed = originalMessage.embeds[0];

    const approvedEmbed = EmbedBuilder.from(oldEmbed)
      .setColor(0x10b981)
      .setTitle(`✅ Whitelist Approved — ${appData.applicantDiscordTag || appData.discordTag || 'Player'}`)
      .addFields(
        { name: '🛡️ Reviewed By', value: `<@${reviewerUser.id}>`, inline: true },
        { name: '⚡ Status', value: `Approved & Auto-Role Assigned`, inline: true }
      );

    await originalMessage.edit({
      embeds: [approvedEmbed],
      components: [] // Lock and remove active buttons
    });

    return true;
  } catch (error) {
    console.error('[Approve Pipeline Exception]:', error);
    return false;
  }
}

/**
 * Handles rejection modals, records notes, and locks interaction view into red rejected state
 */
async function handleRejectionModalSubmit(client: Client, interaction: ModalSubmitInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const appId = interaction.customId.replace('modal_reject_', '');
    const rejectionFeedback = interaction.fields.getTextInputValue('reject_feedback');
    const reviewerUser = interaction.user;
    const guildId = interaction.guildId!;

    // Fetch original application
    const appDocRef = doc(db, 'whitelist_applications', appId);
    const appSnap = await getDoc(appDocRef);

    if (!appSnap.exists()) {
      return interaction.editReply({ content: '❌ **Error**: Application dossier not found.' });
    }

    const appData = appSnap.data() as WhitelistApplication;

    // Load logs channel ID from configs memory cache
    const config = await getGuildConfig(guildId);

    // 1. Update Firestore state with feedback notes
    await setDoc(appDocRef, {
      status: 'rejected',
      rejectionReason: rejectionFeedback,
      reviewerNotes: rejectionFeedback,
      reviewedBy: reviewerUser.tag,
      reviewedByDiscordId: reviewerUser.id,
      reviewedAt: Date.now()
    }, { merge: true });

    const applicantTargetId = appData.applicantDiscordId || appData.discordId;

    // 2. DM Candidate detailing feedback and reapplication guidelines
    if (applicantTargetId) {
      try {
        const applicantUser = await client.users.fetch(applicantTargetId);
        if (applicantUser) {
          const cooldownDays = config.reapplyCooldownDays ?? 3;
          const reapplyDateStr = new Date(Date.now() + cooldownDays * 24 * 60 * 60 * 1000).toLocaleDateString();
          const dmMesg = `🔴 **Whitelist Application Rejected**: Your application for **${interaction.guild!.name}** has been rejected by staff.\n\n💬 **Staff Feedback**: *"${rejectionFeedback}"*\n\n⏱️ You may submit a brand-new application starting **${reapplyDateStr}** on Vice City Central.`;
          await applicantUser.send(dmMesg);
        }
      } catch (dmErr) {
        console.warn(`[VCC Bot DM Failed]: Could not DM rejected player ${applicantTargetId}:`, dmErr);
      }
    }

    // 3. Edit original review message to locked red rejected state
    const originalMessage = interaction.message;
    if (originalMessage) {
      const oldEmbed = originalMessage.embeds[0];
      const rejectedEmbed = EmbedBuilder.from(oldEmbed)
        .setColor(0xef4444)
        .setTitle(`❌ Whitelist Rejected — ${appData.applicantDiscordTag || appData.discordTag || 'Player'}`)
        .addFields(
          { name: '🛡️ Reviewed By', value: `<@${reviewerUser.id}>`, inline: true },
          { name: '💬 Feedback Notes', value: `*"${rejectionFeedback}"*`, inline: false }
        );

      await originalMessage.edit({
        embeds: [rejectedEmbed],
        components: [] // Lock and remove interactive buttons
      });
    }

    await interaction.editReply({ content: '❌ **Application rejected successfully!** Notification and feedback dispatched.' });
  } catch (error: any) {
    console.error('[Rejection Modal Submit Exception]:', error);
    await interaction.editReply({ content: `❌ **Failed to reject application**: ${error?.message || 'Unknown error'}` });
  }
}
