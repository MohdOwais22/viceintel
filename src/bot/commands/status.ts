import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { WhitelistApplication } from '../types';
import { getGuildConfig } from '../client';

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Check your active whitelist application status and review cooldowns.');

export async function execute(interaction: CommandInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guildId!;
    const userDiscordId = interaction.user.id;

    // Load Bot Guild configuration from memory cache / Firestore
    const config = await getGuildConfig(guildId);

    if (!config) {
      return interaction.editReply({
        content: '⚠️ **Server Configuration Pending**: VCC integration has not been set up yet on this Discord server. Please ask an Administrator to run `/vcc-setup` first.'
      });
    }

    const serverId = config.serverId;

    // Search for the applicant's applications under this server ID (checking both applicantDiscordId and discordId)
    const appsQueryPrimary = query(
      collection(db, 'whitelist_applications'),
      where('serverId', '==', serverId),
      where('applicantDiscordId', '==', userDiscordId)
    );

    let appsSnap = await getDocs(appsQueryPrimary);

    if (appsSnap.empty) {
      // Fallback query for legacy compatibility
      const appsQueryFallback = query(
        collection(db, 'whitelist_applications'),
        where('serverId', '==', serverId),
        where('discordId', '==', userDiscordId)
      );
      appsSnap = await getDocs(appsQueryFallback);
    }

    if (appsSnap.empty) {
      const applyEmbed = new EmbedBuilder()
        .setTitle('✍️ No Active Application Found')
        .setColor(0xf59e0b)
        .setDescription(`You haven't submitted a whitelist application for our server yet!\n\nUse our web portal link to fill out the form:\n🌐 **[Apply on Vice City Central](${process.env.APP_URL || 'https://viceintel.app'}/servers/${serverId}/apply)**`)
        .setFooter({ text: 'Ensure your Discord is linked before submitting.' });

      return interaction.editReply({ embeds: [applyEmbed] });
    }

    // Sort applications by createdAt descending to inspect the latest one
    const applications = appsSnap.docs.map(docSnap => ({
      ...docSnap.data(),
      id: docSnap.id
    } as WhitelistApplication)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const latestApp = applications[0];
    const status = latestApp.status;

    const embed = new EmbedBuilder()
      .setTitle('🔍 Whitelist Application Status Dossier')
      .setTimestamp();

    if (status === 'pending' || status === 'under_review') {
      embed.setColor(0x3b82f6)
        .setDescription(`Your application for **VCC Whitelist** is currently **PENDING STAFF REVIEW**.`)
        .addFields(
          { name: '👤 Applicant', value: `<@${userDiscordId}>`, inline: true },
          { name: '⚡ Status', value: `⏳ Pending Review`, inline: true },
          { name: '📅 Submitted At', value: latestApp.createdAt ? new Date(latestApp.createdAt).toLocaleString() : 'Recently', inline: false }
        )
        .setFooter({ text: 'Our staff will review your application soon.' });
    } else if (status === 'approved') {
      embed.setColor(0x10b981)
        .setDescription(`🎉 **CONGRATULATIONS!** Your whitelist application has been **APPROVED**!`)
        .addFields(
          { name: '👤 Applicant', value: `<@${userDiscordId}>`, inline: true },
          { name: '⚡ Status', value: `🟢 Approved & Synced`, inline: true },
          { name: '🔑 Whitelisted Role', value: `<@&${config.whitelistRoleId}>`, inline: false }
        )
        .setFooter({ text: 'Have fun roleplaying!' });
    } else if (status === 'rejected') {
      const cooldownDays = config.reapplyCooldownDays ?? 3;
      const reapplyAtMs = (latestApp.reviewedAt || latestApp.createdAt || Date.now()) + cooldownDays * 24 * 60 * 60 * 1000;
      const cooldownExpired = Date.now() >= reapplyAtMs;
      const feedbackNotes = latestApp.rejectionReason || latestApp.reviewerNotes;

      embed.setColor(0xef4444)
        .setDescription(`❌ Your whitelist application was **REJECTED** by a staff reviewer.`)
        .addFields(
          { name: '👤 Applicant', value: `<@${userDiscordId}>`, inline: true },
          { name: '⚡ Status', value: `🔴 Rejected`, inline: true },
          { name: '💬 Reviewer Feedback', value: feedbackNotes ? `*"${feedbackNotes}"*` : '*No feedback provided.*', inline: false }
        );

      if (!cooldownExpired) {
        embed.addFields({
          name: '⏳ Reapplication Lockout',
          value: `You are currently on a reapplication cooldown. You can apply again on **${new Date(reapplyAtMs).toLocaleDateString()}** at **${new Date(reapplyAtMs).toLocaleTimeString()}**.`
        });
      } else {
        embed.addFields({
          name: '✅ Cooldown Expired',
          value: `Your reapplication cooldown has expired! You may submit a fresh application on our web portal now:\n🌐 **[Submit Fresh Application](${process.env.APP_URL || 'https://viceintel.app'}/servers/${serverId}/apply)**`
        });
      }
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('[status command execution error]:', error);
    await interaction.editReply({
      content: `❌ **Error verifying application status**: ${error?.message || 'Internal database check failure.'}`
    });
  }
}
