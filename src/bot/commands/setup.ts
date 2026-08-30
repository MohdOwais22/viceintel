import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  TextChannel, 
  Role 
} from 'discord.js';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { BotGuildConfig } from '../types';
import { setCachedGuildConfig } from '../client';

export const data = new SlashCommandBuilder()
  .setName('vcc-setup')
  .setDescription('Set up and verify Vice City Central (VCC) auto-whitelist integration.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption(option =>
    option
      .setName('server_id_or_slug')
      .setDescription('Linked Vice City Central Server ID or Web URL Slug')
      .setRequired(true)
  )
  .addRoleOption(option =>
    option
      .setName('whitelist_role')
      .setDescription('Role awarded automatically to approved applicants')
      .setRequired(true)
  )
  .addChannelOption(option =>
    option
      .setName('review_channel')
      .setDescription('Channel where staff reviews applications with 1-click buttons')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('min_account_age_days')
      .setDescription('Minimum age of applicant Discord account (Default: 14 days)')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('reapply_cooldown_days')
      .setDescription('Days a user must wait before reapplying after rejection (Default: 3 days)')
      .setRequired(false)
  )
  .addChannelOption(option =>
    option
      .setName('logs_channel')
      .setDescription('Optional channel for moderator and system logging')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guildId!;
    const serverIdentifier = interaction.options.getString('server_id_or_slug', true);
    const targetRole = interaction.options.getRole('whitelist_role', true) as Role;
    const reviewChannel = interaction.options.getChannel('review_channel', true) as TextChannel;
    const minAccountAgeDays = interaction.options.getInteger('min_account_age_days') ?? 14;
    const reapplyCooldownDays = interaction.options.getInteger('reapply_cooldown_days') ?? 3;
    const logsChannel = interaction.options.getChannel('logs_channel') as TextChannel | null;

    // Validate review channel type
    if (!reviewChannel.isTextBased()) {
      return interaction.editReply({
        content: '❌ **Error**: The review channel must be a text-based channel.'
      });
    }

    if (logsChannel && !logsChannel.isTextBased()) {
      return interaction.editReply({
        content: '❌ **Error**: The logs channel must be a text-based channel.'
      });
    }

    // Determine target server slug/id in Firestore
    let serverId = serverIdentifier.trim();
    let serverName = 'Vice City Central Server';
    let isSubscribed = false;
    let tier: 'starter' | 'pro' | 'mega' = 'starter';

    // Query whitelist_forms or rp_servers to verify linked server exists
    const wlQuery = query(collection(db, 'whitelist_forms'), where('serverSlug', '==', serverId.toLowerCase()));
    const wlSnap = await getDocs(wlQuery);

    let formExists = false;
    if (!wlSnap.empty) {
      const docData = wlSnap.docs[0].data();
      serverId = docData.serverId || serverId;
      serverName = docData.serverName || serverName;
      isSubscribed = docData.isSubscriptionActive || false;
      tier = (docData.tier as 'starter' | 'pro' | 'mega') || 'starter';
      formExists = true;
    } else {
      // Try direct ID match
      const docRef = doc(db, 'whitelist_forms', serverId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docData = docSnap.data();
        serverName = docData.serverName || serverName;
        isSubscribed = docData.isSubscriptionActive || false;
        tier = (docData.tier as 'starter' | 'pro' | 'mega') || 'starter';
        formExists = true;
      }
    }

    if (!formExists) {
      return interaction.editReply({
        content: `❌ **VCC Integration Error**: Could not find a whitelisting form for server: \`${serverIdentifier}\` on Vice City Central.\n\nPlease claim your server on the website first and ensure you have configured custom whitelist questions.`
      });
    }

    // Role hierarchy verify
    const botMember = await interaction.guild!.members.fetch(interaction.client.user!.id);
    const botRoleHighest = botMember.roles.highest;
    const hierarchyValid = botRoleHighest.position > targetRole.position;

    const embed = new EmbedBuilder()
      .setTitle('🎮 VCC B2B Integration Setup Sentinel')
      .setColor(hierarchyValid ? 0x10b981 : 0xef4444)
      .setDescription(`Onboarding results for **${serverName}**`)
      .addFields(
        { name: '🌐 Linked Web Server', value: `\`${serverName}\` (ID: \`${serverId}\`)`, inline: false },
        { name: '🛡️ Whitelist Role', value: `<@&${targetRole.id}>`, inline: true },
        { name: '📨 Review Queue Channel', value: `<#${reviewChannel.id}>`, inline: true },
        { name: '⚙️ Alt Prevention Guard', value: `\`${minAccountAgeDays} Days Account Age\``, inline: true },
        { name: '⏳ Reapply Cooldown', value: `\`${reapplyCooldownDays} Days\``, inline: true },
        { name: '👑 Bot Role Hierarchy', value: hierarchyValid ? '✅ **PERFECT (Role sits above Whitelist Role)**' : '⚠️ **CRITICAL: BOT ROLE IS BELOW TARGET ROLE! (Hierarchy Fail)**', inline: false }
      )
      .setTimestamp();

    if (!hierarchyValid) {
      embed.addFields({
        name: '🚨 Hierarchy Solution',
        value: 'Please open your **Discord Server Settings -> Roles** and drag the **Vice City Central Bot** role to be **ABOVE** the whitelisted role, then run `/vcc-setup` again.'
      });
    }

    // Write BotGuildConfig document to Firestore
    const guildConfig: BotGuildConfig = {
      guildId,
      serverId,
      ownerDiscordId: interaction.user.id,
      whitelistRoleId: targetRole.id,
      reviewChannelId: reviewChannel.id,
      logsChannelId: logsChannel?.id || '',
      minAccountAgeDays,
      reapplyCooldownDays,
      autoRoleEnabled: true,
      isSubscriptionActive: isSubscribed,
      tier,
      updatedAt: Date.now()
    };

    const configDocRef = doc(db, 'bot_guild_configs', guildId);
    await setDoc(configDocRef, guildConfig, { merge: true });

    // Prime in-memory cache to eliminate subsequent database reads
    setCachedGuildConfig(guildId, guildConfig);

    // Also update whitelist_forms to record the verified Discord integration
    const formDocRef = doc(db, 'whitelist_forms', serverId);
    await setDoc(formDocRef, {
      discordGuildId: guildId,
      discordRoleId: targetRole.id,
      discordWebhookUrl: `https://discord.com/api/webhooks/... (Integrated via Bot)`,
      updatedAt: Date.now()
    }, { merge: true });

    await interaction.editReply({
      embeds: [embed]
    });
  } catch (error: any) {
    console.error('[vcc-setup command execution error]:', error);
    await interaction.editReply({
      content: `❌ **Error during configuration execution**: ${error?.message || 'Unknown server error.'}`
    });
  }
}
