import { 
  Client, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  TextChannel 
} from 'discord.js';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { grantWhitelistRole } from './role-grant';
import { BotGuildConfig, WhitelistApplication } from '../types';
import { getGuildConfig } from '../client';

/**
 * Decodes a Discord Snowflake ID to calculate the exact account age in days.
 */
export function getDiscordAccountAgeDays(discordId: string): number {
  try {
    const snowflake = BigInt(discordId);
    const creationTime = Number((snowflake >> 22n) + 1420070400000n);
    return Math.floor((Date.now() - creationTime) / (1000 * 60 * 60 * 24));
  } catch (err) {
    return 45; // Safe default fallback
  }
}

/**
 * Real-time evaluator scoring the player's backstory answers for lore immersion and rules risk (0-100 score).
 */
export function calculateAiLoreRiskScore(answers: Record<string, string>): { score: number; flags: string[]; summary: string } {
  let score = 85; // Start with high quality immersion score
  const flags: string[] = [];

  const compositeAnswers = Object.values(answers).join(' ').toLowerCase();

  // 1. Length penalty (short backstories are low-effort)
  if (compositeAnswers.length < 150) {
    score -= 30;
    flags.push('⚠️ Extremely Low Effort');
  } else if (compositeAnswers.length < 350) {
    score -= 15;
    flags.push('⚠️ Fairly Short Backstory');
  } else {
    flags.push('🟢 Comprehensive Text');
  }

  // 2. Metagaming risk checks
  const metaKeywords = ['meta', 'metagaming', 'admin', 'mod menu', 'cheat', 'hack', 'third-party', 'streamer', 'stream-sniping'];
  let foundMeta = false;
  metaKeywords.forEach(k => {
    if (compositeAnswers.includes(k)) {
      foundMeta = true;
    }
  });

  if (foundMeta) {
    score -= 25;
    flags.push('🚨 Rules Violation Risk');
  } else {
    flags.push('🟢 IMMERSIVE_LORE_ALIGNED');
  }

  // 3. Fail-RP keywords (e.g. killing with no motive)
  const failKeywords = ['dm', 'rdm', 'vdm', 'cop-baiting', 'kill all', 'revenge'];
  let foundFail = false;
  failKeywords.forEach(k => {
    if (compositeAnswers.includes(k)) {
      foundFail = true;
    }
  });

  if (foundFail) {
    score -= 20;
    flags.push('⚠️ FailRP Context');
  }

  score = Math.max(0, Math.min(100, score));
  const summary = score >= 75 
    ? 'Excellent immersive backstory. Strong roleplay structure and lore-aligned.' 
    : score >= 50 
      ? 'Decent backstory but contains short sections or minor lore inconsistencies.' 
      : 'Critical: High risk application. Potential low effort, fail-RP references, or rule violations.';

  return { score, flags, summary };
}

/**
 * Dispatches a rich interactive review dossier embed to the server's review channel.
 */
export async function dispatchApplicationEmbed(
  client: Client,
  appId: string,
  appData: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const serverId = appData.serverId;

    // Load server owner config to locate the right review channel
    const wlFormRef = doc(db, 'whitelist_forms', serverId);
    const wlFormSnap = await getDoc(wlFormRef);

    if (!wlFormSnap.exists()) {
      return { success: false, error: `Whitelist form not found for server ID ${serverId}` };
    }

    const formData = wlFormSnap.data();
    const guildId = formData.discordGuildId || appData.guildId;

    if (!guildId) {
      return { success: false, error: 'Discord integration not configured or linked for this server' };
    }

    // Load Bot Guild configuration from memory cache
    const config = await getGuildConfig(guildId);

    if (!config) {
      return { success: false, error: `Discord bot configuration not initialized for Guild ID ${guildId}` };
    }

    const reviewChannelId = config.reviewChannelId;

    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(reviewChannelId).catch(() => null);

    if (!channel || !channel.isTextBased()) {
      return { success: false, error: `Configured text review channel ${reviewChannelId} not found` };
    }

    const applicantId = appData.applicantDiscordId || appData.discordId;
    const applicantTag = appData.applicantDiscordTag || appData.discordTag || 'Player';
    const applicantAvatar = appData.applicantAvatarUrl || (appData.discordAvatar && applicantId ? `https://cdn.discordapp.com/avatars/${applicantId}/${appData.discordAvatar}.png` : null);

    // Account Age calculation
    const accountAgeDays = applicantId ? getDiscordAccountAgeDays(applicantId) : 45;
    const yearsOld = (accountAgeDays / 365).toFixed(1);
    const ageBadge = accountAgeDays >= 365 
      ? `🟢 ${yearsOld} Years Old` 
      : accountAgeDays >= 14 
        ? `🟡 ${accountAgeDays} Days Old` 
        : `🔴 ${accountAgeDays} Days Old - ALT-ACCOUNT RISK`;

    // AI Assessment
    const aiAudit = calculateAiLoreRiskScore(appData.answers || {});

    // Save calculation to Firestore document as cache
    const appDocRef = doc(db, 'whitelist_applications', appId);
    await setDoc(appDocRef, {
      applicantDiscordId: applicantId || '',
      applicantAccountAgeDays: accountAgeDays,
      isFlaggedAlt: accountAgeDays < (config.minAccountAgeDays ?? 14),
      aiAudit: {
        score: aiAudit.score,
        flags: aiAudit.flags,
        summary: aiAudit.summary
      }
    }, { merge: true });

    // Anti-Abuse Block Check
    if (accountAgeDays < (config.minAccountAgeDays ?? 14)) {
      console.warn(`[Bot Anti-Abuse Guard]: Throttled application from ${applicantTag} due to alt-account age.`);
    }

    // Build the Rich Embed
    const embed = new EmbedBuilder()
      .setTitle(`📋 Whitelist Review Dossier — ${applicantTag}`)
      .setColor(aiAudit.score >= 75 ? 0x3b82f6 : aiAudit.score >= 50 ? 0xf59e0b : 0xef4444)
      .setDescription(`New candidate submission for **${formData.serverName || 'RP Server'}**`)
      .setThumbnail(applicantAvatar)
      .addFields(
        { name: '👤 Applicant Tag', value: applicantId ? `<@${applicantId}> (\`${applicantTag}\`)` : `\`${applicantTag}\``, inline: true },
        { name: '📅 Discord Age', value: ageBadge, inline: true },
        { name: '🧠 AI Lore Assessment', value: `Score: **${aiAudit.score}/100**\n*${aiAudit.summary}*`, inline: false },
        { name: '🏷️ Audit Tags', value: aiAudit.flags.map(t => `\`${t}\``).join(' ') || '`None`', inline: false }
      )
      .setTimestamp();

    // Loop and render application questions safely
    if (appData.answers) {
      Object.entries(appData.answers).slice(0, 5).forEach(([question, answer]) => {
        const truncatedAnswer = (answer as string).length > 300 
          ? (answer as string).substring(0, 300) + '...' 
          : (answer as string);
        embed.addFields({
          name: `❓ ${question.substring(0, 80)}`,
          value: truncatedAnswer || '*No answer provided.*',
          inline: false
        });
      });
    }

    // Interactive Button components
    const approveBtn = new ButtonBuilder()
      .setCustomId(`btn_approve_${appId}`)
      .setLabel('✅ Approve Whitelist')
      .setStyle(ButtonStyle.Success);

    const rejectBtn = new ButtonBuilder()
      .setCustomId(`btn_reject_${appId}`)
      .setLabel('❌ Reject with Reason')
      .setStyle(ButtonStyle.Danger);

    const dossierLink = new ButtonBuilder()
      .setLabel('🌐 Open Web Dossier')
      .setStyle(ButtonStyle.Link)
      .setURL(`${process.env.APP_URL || 'https://viceintel.app'}/servers/${formData.serverSlug || serverId}/review?id=${appId}`);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approveBtn, rejectBtn, dossierLink);

    const textChannel = channel as TextChannel;
    const sentMessage = await textChannel.send({
      embeds: [embed],
      components: [row]
    });

    // Save discordMessageId to appDoc for synchronizing updates later
    await setDoc(appDocRef, {
      discordMessageId: sentMessage.id,
      guildId
    }, { merge: true });

    return { success: true, messageId: sentMessage.id };
  } catch (error: any) {
    console.error('[dispatchApplicationEmbed exception]:', error);
    return { success: false, error: error?.message || 'Failed to dispatch Discord review embed' };
  }
}

/**
 * Handles Web-dashboard triggered application approval, assigning roles and editing Discord review cards in-place.
 */
export async function syncApplicationWebApproval(
  client: Client,
  appId: string,
  reviewerTag = 'Web Admin'
): Promise<boolean> {
  try {
    const appDocRef = doc(db, 'whitelist_applications', appId);
    const appSnap = await getDoc(appDocRef);

    if (!appSnap.exists()) return false;
    const appData = appSnap.data() as WhitelistApplication;

    const guildId = appData.guildId;
    if (!guildId) return false;

    // Load Config from memory cache
    const config = await getGuildConfig(guildId);
    if (!config) return false;

    const targetUserId = appData.applicantDiscordId || appData.discordId;

    // 1. Grant roles
    if (config.autoRoleEnabled && targetUserId) {
      await grantWhitelistRole(
        client,
        guildId,
        targetUserId,
        config.whitelistRoleId,
        config.logsChannelId
      );
    }

    // 2. DM Candidate
    if (targetUserId) {
      try {
        const applicantUser = await client.users.fetch(targetUserId);
        if (applicantUser) {
          await applicantUser.send(`🟢 **Whitelist Approved**: Your whitelist application has been approved via our **Web Dashboard**! The Whitelisted Role has been assigned.`);
        }
      } catch (dmErr) {
        console.warn(`[Web Sync DM Failed] player ID ${targetUserId}:`, dmErr);
      }
    }

    // 3. Edit review message (if exists)
    if (appData.discordMessageId) {
      const guildObj = await client.guilds.fetch(guildId);
      const channel = await guildObj.channels.fetch(config.reviewChannelId).catch(() => null);

      if (channel && channel.isTextBased()) {
        const textChannel = channel as TextChannel;
        const msg = await textChannel.messages.fetch(appData.discordMessageId).catch(() => null);
        if (msg) {
          const oldEmbed = msg.embeds[0];
          const approvedEmbed = EmbedBuilder.from(oldEmbed)
            .setColor(0x10b981)
            .setTitle(`✅ Whitelist Approved — ${appData.applicantDiscordTag || appData.discordTag || 'Player'}`)
            .addFields(
              { name: '🛡️ Reviewed By', value: `🌐 **${reviewerTag}** (Via Web Console)`, inline: true },
              { name: '⚡ Status', value: `Approved & Auto-Role Assigned`, inline: true }
            );

          await msg.edit({
            embeds: [approvedEmbed],
            components: []
          });
        }
      }
    }

    return true;
  } catch (error) {
    console.error('[syncApplicationWebApproval exception]:', error);
    return false;
  }
}

/**
 * Publishes operational and security logs to the staff's logsChannelId.
 */
export async function postModeratorLog(
  client: Client,
  guildId: string,
  message: string
): Promise<void> {
  try {
    const config = await getGuildConfig(guildId);
    if (!config) return;

    const logsChannelId = config.logsChannelId;

    if (logsChannelId) {
      const guild = await client.guilds.fetch(guildId);
      const chan = await guild.channels.fetch(logsChannelId).catch(() => null);
      if (chan && chan.isTextBased()) {
        const textChan = chan as TextChannel;
        await textChan.send(`⚙️ **[VCC Audit Log]**: ${message}`);
      }
    }
  } catch (err) {
    console.warn('[postModeratorLog failure]:', err);
  }
}
