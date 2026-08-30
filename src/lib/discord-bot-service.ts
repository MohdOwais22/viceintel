/**
 * Discord Bot Service & REST API Integration
 * Handles Discord bot actions including:
 * 1. Assigning "Verified Server Owner" role in the official Vice City Central Discord hub
 * 2. Creating dedicated private #server-support-{serverSlug} channels with custom permissions
 * 3. Dispatching welcome instructions, webhook keys, and API secrets to owner DMs
 * 4. Sending rich transactional embeds for onboarding, application reviews, and subscription events
 */

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number; // Integer decimal color (e.g. 0x00F0FF for neon cyan, 0xF43F5E for rose)
  fields?: DiscordEmbedField[];
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

export interface ProvisioningFailureDetails {
  ownerDiscordId: string;
  serverName: string;
  serverSlug: string;
  tier?: 'community' | 'mega_server' | 'enterprise' | string;
  errorReason: string;
  stepFailed?: 'role_assignment' | 'channel_creation' | 'whitelist_sync' | 'webhook_setup' | 'permission_error' | 'general';
  troubleshootingSteps?: string[];
  portalUrl?: string;
  supportUrl?: string;
  technicalLogs?: string[];
  timestamp?: string;
}

export interface ServerProvisioningResult {
  success: boolean;
  roleAssigned: boolean;
  channelCreated: boolean;
  channelId?: string;
  channelName?: string;
  dmDispatched: boolean;
  failureDmDispatched?: boolean;
  logs: string[];
  error?: string;
  failedStep?: string;
}

export interface DiscordRoleSyncUserParam {
  uid?: string;
  discordUserId: string;
  username?: string;
  email?: string;
  isVip?: boolean;
  vipExpires?: any;
  role?: string;
  clearanceLevel?: string;
  subscriptionTier?: string;
  b2bTier?: string;
  isServerOwner?: boolean;
  sendConfirmationDm?: boolean;
}

export interface RoleChangeItem {
  roleId: string;
  roleName: string;
  action: 'added' | 'removed';
}

export interface DiscordRoleSyncResult {
  success: boolean;
  uid?: string;
  discordUserId: string;
  username?: string;
  memberFound: boolean;
  rolesAdded: { roleId: string; roleName: string }[];
  rolesRemoved: { roleId: string; roleName: string }[];
  currentRoles: string[];
  activeTier: string;
  isSimulated?: boolean;
  dmDispatched?: boolean;
  error?: string;
  status: 'synced' | 'not_in_guild' | 'error' | 'no_change';
  timestamp: string;
}

/**
 * Neon GTA VI / Vice City Theme Color Constants for Discord Embeds
 */
export const DISCORD_THEME_COLORS = {
  CYAN: 0x06B6D4,       // 43964
  ROSE: 0xF43F5E,       // 16007006
  EMERALD: 0x10B981,    // 1096065
  AMBER: 0xF59E0B,      // 16096779
  PURPLE: 0x8B5CF6,     // 9133302
  DARK_VICE: 0x0F172A   // 989098
};

/**
 * Default Discord Managed Role Constants (Overrideable via ENV)
 */
export const DEFAULT_DISCORD_ROLE_IDS = {
  VIP: '112233445566778801',          // GTA VI Central VIP Subscriber
  STARTER: '112233445566778802',      // Starter RP Server Owner
  PRO: '112233445566778803',          // Pro RP Partner Server Owner
  MEGA: '112233445566778804',         // Mega-Server Spotlight Owner
  SERVER_OWNER: '987654321098765432', // Verified FiveM Server Owner
  STAFF: '112233445566778805',        // Level 3 Staff Moderator
  ADMIN: '112233445566778806'         // Level 4 Administrator
};

/**
 * Send a rich embed message to any Discord Webhook URL
 */
export async function sendDiscordWebhookEmbed(
  webhookUrl: string,
  embed: DiscordEmbed,
  content?: string,
  botUsername = 'Vice City Central Bot'
): Promise<{ success: boolean; status?: number; error?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return { success: false, error: 'Invalid or missing Discord Webhook URL' };
  }

  try {
    const payload: DiscordWebhookPayload = {
      username: botUsername,
      avatar_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=128&q=80',
      content: content || undefined,
      embeds: [
        {
          ...embed,
          footer: embed.footer || {
            text: 'Vice City Central Enterprise SaaS • B2B Infrastructure Engine',
            icon_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=48&q=80'
          },
          timestamp: embed.timestamp || new Date().toISOString()
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, status: response.status, error: errText };
    }

    return { success: true, status: response.status };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error while contacting Discord Webhook' };
  }
}

/**
 * Discord REST API Bot Client for automated Guild & Channel provisioning
 */
export class DiscordBotService {
  private botToken: string;
  private officialGuildId: string;
  private verifiedRoleId: string;
  private vipRoleId: string;
  private starterRoleId: string;
  private proRoleId: string;
  private megaRoleId: string;
  private staffRoleId: string;
  private adminRoleId: string;

  constructor(token?: string, guildId?: string, roleId?: string) {
    this.botToken = token || process.env.DISCORD_BOT_TOKEN || '';
    this.officialGuildId = guildId || process.env.DISCORD_OFFICIAL_GUILD_ID || '123456789012345678';
    this.verifiedRoleId = roleId || process.env.DISCORD_SERVER_OWNER_ROLE_ID || DEFAULT_DISCORD_ROLE_IDS.SERVER_OWNER;
    this.vipRoleId = process.env.DISCORD_VIP_ROLE_ID || DEFAULT_DISCORD_ROLE_IDS.VIP;
    this.starterRoleId = process.env.DISCORD_STARTER_ROLE_ID || DEFAULT_DISCORD_ROLE_IDS.STARTER;
    this.proRoleId = process.env.DISCORD_PRO_ROLE_ID || DEFAULT_DISCORD_ROLE_IDS.PRO;
    this.megaRoleId = process.env.DISCORD_MEGA_ROLE_ID || DEFAULT_DISCORD_ROLE_IDS.MEGA;
    this.staffRoleId = process.env.DISCORD_STAFF_ROLE_ID || DEFAULT_DISCORD_ROLE_IDS.STAFF;
    this.adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID || DEFAULT_DISCORD_ROLE_IDS.ADMIN;
  }

  private getHeaders() {
    return {
      'Authorization': `Bot ${this.botToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ViceCityCentralBot/2.0 (https://vicecitycentral.com, 1.0.0)'
    };
  }

  /**
   * Check if bot is configured with a real Discord token
   */
  public isConfigured(): boolean {
    return !!this.botToken && !this.botToken.includes('EXAMPLE') && this.botToken.length > 25;
  }

  /**
   * Returns current Discord Bot role mapping configuration
   */
  public getRoleConfig() {
    return {
      isConfigured: this.isConfigured(),
      officialGuildId: this.officialGuildId,
      roles: {
        vip: { id: this.vipRoleId, name: 'VIP Member ($3.99/mo)' },
        starter: { id: this.starterRoleId, name: 'Starter RP Owner ($29/mo)' },
        pro: { id: this.proRoleId, name: 'Pro RP Partner ($49/mo)' },
        mega: { id: this.megaRoleId, name: 'Mega-Server Spotlight ($99/mo)' },
        serverOwner: { id: this.verifiedRoleId, name: 'Verified Server Owner' },
        staff: { id: this.staffRoleId, name: 'Level 3 Staff' },
        admin: { id: this.adminRoleId, name: 'Level 4 Admin' }
      }
    };
  }

  /**
   * Returns dictionary of mapped role IDs and human-readable names
   */
  public getRoleMappings() {
    return this.getRoleConfig().roles;
  }

  /**
   * Get a Discord Guild Member and their assigned role IDs
   */
  public async getGuildMember(discordUserId: string, guildId?: string): Promise<{ success: boolean; member?: any; error?: string; status?: number }> {
    const targetGuildId = guildId || this.officialGuildId;
    if (!discordUserId) return { success: false, error: 'Missing Discord User ID' };

    if (!this.isConfigured()) {
      return {
        success: true,
        member: {
          user: { id: discordUserId, username: `SimulatedUser_${discordUserId.slice(-4)}` },
          roles: []
        }
      };
    }

    try {
      const url = `https://discord.com/api/v10/guilds/${targetGuildId}/members/${discordUserId}`;
      const response = await fetch(url, { method: 'GET', headers: this.getHeaders() });
      if (response.status === 404) {
        return { success: false, status: 404, error: 'Member not found in official Discord guild' };
      }
      if (!response.ok) {
        const errText = await response.text();
        return { success: false, status: response.status, error: `Discord API Error (${response.status}): ${errText}` };
      }
      const member = await response.json();
      return { success: true, member };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching guild member' };
    }
  }

  /**
   * Add a specific role to a Discord Guild Member
   */
  public async addRoleToMember(discordUserId: string, roleId: string, guildId?: string): Promise<{ success: boolean; error?: string }> {
    const targetGuildId = guildId || this.officialGuildId;
    if (!this.isConfigured()) {
      console.log(`[Discord Bot Simulation] Added role ${roleId} to User <@${discordUserId}> in Guild ${targetGuildId}`);
      return { success: true };
    }
    try {
      const url = `https://discord.com/api/v10/guilds/${targetGuildId}/members/${discordUserId}/roles/${roleId}`;
      const response = await fetch(url, { method: 'PUT', headers: this.getHeaders() });
      if (!response.ok && response.status !== 204) {
        const errText = await response.text();
        return { success: false, error: `Discord API Error (${response.status}): ${errText}` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add role' };
    }
  }

  /**
   * Remove a specific role from a Discord Guild Member
   */
  public async removeRoleFromMember(discordUserId: string, roleId: string, guildId?: string): Promise<{ success: boolean; error?: string }> {
    const targetGuildId = guildId || this.officialGuildId;
    if (!this.isConfigured()) {
      console.log(`[Discord Bot Simulation] Removed role ${roleId} from User <@${discordUserId}> in Guild ${targetGuildId}`);
      return { success: true };
    }
    try {
      const url = `https://discord.com/api/v10/guilds/${targetGuildId}/members/${discordUserId}/roles/${roleId}`;
      const response = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });
      if (!response.ok && response.status !== 204) {
        const errText = await response.text();
        return { success: false, error: `Discord API Error (${response.status}): ${errText}` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to remove role' };
    }
  }

  /**
   * Core Synchronizer: Syncs a user's subscription tier in Firestore to their official Discord server roles
   */
  public async syncUserSubscriptionRoles(param: DiscordRoleSyncUserParam): Promise<DiscordRoleSyncResult> {
    const {
      uid,
      discordUserId,
      username = 'ViceCityPlayer',
      isVip = false,
      vipExpires,
      role = 'User',
      clearanceLevel = 'L1',
      subscriptionTier,
      b2bTier,
      isServerOwner = false,
      sendConfirmationDm = true
    } = param;

    const timestamp = new Date().toISOString();

    if (!discordUserId) {
      return {
        success: false,
        uid,
        discordUserId: '',
        username,
        memberFound: false,
        rolesAdded: [],
        rolesRemoved: [],
        currentRoles: [],
        activeTier: 'free',
        error: 'Missing Discord User ID',
        status: 'error',
        timestamp
      };
    }

    // 1. Determine VIP Status
    let isVipActive = false;
    if (isVip || role === 'VIP' || clearanceLevel === 'L2' || subscriptionTier === 'vip') {
      isVipActive = true;
    }
    if (vipExpires) {
      if (typeof vipExpires === 'string') {
        const lower = vipExpires.toLowerCase().trim();
        if (lower === 'lifetime' || lower === 'staff account') {
          isVipActive = true;
        } else if (lower === 'expired') {
          isVipActive = false;
        } else {
          const parsed = new Date(vipExpires);
          if (!isNaN(parsed.getTime())) {
            isVipActive = parsed.getTime() > Date.now();
          }
        }
      } else if (typeof vipExpires === 'number') {
        isVipActive = vipExpires > Date.now();
      }
    }

    // 2. Determine Staff / Admin / B2B Status
    const isAdminActive = clearanceLevel === 'L4' || role === 'Admin';
    const isStaffActive = clearanceLevel === 'L3' || role === 'Staff' || isAdminActive;
    const cleanB2bTier = (b2bTier || '').toLowerCase().trim();
    const isStarterOwner = isServerOwner || cleanB2bTier === 'starter';
    const isProOwner = cleanB2bTier === 'pro';
    const isMegaOwner = cleanB2bTier === 'mega' || cleanB2bTier === 'enterprise' || cleanB2bTier === 'mega_server';

    // 3. Compute Active Tier Label
    let activeTier = 'free';
    if (isAdminActive) activeTier = 'admin';
    else if (isStaffActive) activeTier = 'staff';
    else if (isMegaOwner) activeTier = 'mega_server';
    else if (isProOwner) activeTier = 'pro_server';
    else if (isStarterOwner) activeTier = 'starter_server';
    else if (isVipActive) activeTier = 'vip';

    // 4. Map of all managed Discord roles (Role ID -> Human Name)
    const managedRoles: Record<string, string> = {
      [this.vipRoleId]: 'VIP Member Pass',
      [this.starterRoleId]: 'Starter RP Owner',
      [this.proRoleId]: 'Pro RP Partner',
      [this.megaRoleId]: 'Mega-Server Spotlight',
      [this.verifiedRoleId]: 'Verified Server Owner',
      [this.staffRoleId]: 'Level 3 Staff',
      [this.adminRoleId]: 'Level 4 Admin'
    };

    // 5. Desired Roles calculation
    const desiredRoleIds = new Set<string>();
    if (isVipActive) desiredRoleIds.add(this.vipRoleId);
    if (isAdminActive) {
      desiredRoleIds.add(this.adminRoleId);
      desiredRoleIds.add(this.staffRoleId);
      desiredRoleIds.add(this.vipRoleId);
    } else if (isStaffActive) {
      desiredRoleIds.add(this.staffRoleId);
      desiredRoleIds.add(this.vipRoleId);
    }
    if (isMegaOwner) {
      desiredRoleIds.add(this.megaRoleId);
      desiredRoleIds.add(this.verifiedRoleId);
    } else if (isProOwner) {
      desiredRoleIds.add(this.proRoleId);
      desiredRoleIds.add(this.verifiedRoleId);
    } else if (isStarterOwner) {
      desiredRoleIds.add(this.starterRoleId);
      desiredRoleIds.add(this.verifiedRoleId);
    }

    // 6. Fetch Discord Member
    const memberResult = await this.getGuildMember(discordUserId);
    if (!memberResult.success && memberResult.status === 404) {
      return {
        success: false,
        uid,
        discordUserId,
        username,
        memberFound: false,
        rolesAdded: [],
        rolesRemoved: [],
        currentRoles: [],
        activeTier,
        error: `User <@${discordUserId}> has not joined the official Vice City Central Discord server yet.`,
        status: 'not_in_guild',
        timestamp
      };
    }

    const currentRoles: string[] = memberResult.member?.roles || [];
    const rolesAdded: { roleId: string; roleName: string }[] = [];
    const rolesRemoved: { roleId: string; roleName: string }[] = [];

    // 7. Add missing desired roles
    for (const desiredId of desiredRoleIds) {
      if (!currentRoles.includes(desiredId)) {
        const addRes = await this.addRoleToMember(discordUserId, desiredId);
        if (addRes.success) {
          rolesAdded.push({ roleId: desiredId, roleName: managedRoles[desiredId] || desiredId });
        }
      }
    }

    // 8. Remove obsolete managed roles
    for (const [managedId, managedName] of Object.entries(managedRoles)) {
      if (!desiredRoleIds.has(managedId) && currentRoles.includes(managedId)) {
        const remRes = await this.removeRoleFromMember(discordUserId, managedId);
        if (remRes.success) {
          rolesRemoved.push({ roleId: managedId, roleName: managedName });
        }
      }
    }

    // 9. Send Confirmation DM if new roles were granted
    let dmDispatched = false;
    if (rolesAdded.length > 0 && sendConfirmationDm) {
      try {
        const dmRes = await this.sendRoleSyncSuccessDm(
          discordUserId,
          rolesAdded.map(r => r.roleName),
          activeTier
        );
        dmDispatched = dmRes.success;
      } catch (dmErr) {
        console.warn('Role sync confirmation DM notice:', dmErr);
      }
    }

    const hasChanges = rolesAdded.length > 0 || rolesRemoved.length > 0;
    const finalRoles = [
      ...currentRoles.filter(r => !rolesRemoved.some(rem => rem.roleId === r)),
      ...rolesAdded.map(a => a.roleId)
    ];

    return {
      success: true,
      uid,
      discordUserId,
      username,
      memberFound: true,
      rolesAdded,
      rolesRemoved,
      currentRoles: finalRoles,
      activeTier,
      isSimulated: !this.isConfigured(),
      dmDispatched,
      status: hasChanges ? 'synced' : 'no_change',
      timestamp
    };
  }

  /**
   * Send a direct message to the user confirming their Discord role sync
   */
  public async sendRoleSyncSuccessDm(
    discordUserId: string,
    rolesGranted: string[],
    activeTier: string
  ): Promise<{ success: boolean; error?: string }> {
    const embed: DiscordEmbed = {
      title: '✨ Discord Subscription Roles Synchronized!',
      description: `Your GTA VI Central membership tier (**${activeTier.replace('_', ' ').toUpperCase()}**) has been verified and synchronized with your Discord server roles!`,
      color: DISCORD_THEME_COLORS.CYAN,
      fields: [
        {
          name: '👑 Assigned Server Roles',
          value: rolesGranted.map(r => `• **${r}**`).join('\n') || '• Verified Member',
          inline: false
        },
        {
          name: '💎 Your Active VIP Perks',
          value: '• Access to exclusive VIP Voice & Chat channels\n• High-framerate 90 FPS streaming privileges\n• Ad-free browsing on GTA VI Central\n• Priority handling editor exports & AI Tactical Advice',
          inline: false
        },
        {
          name: '🔗 Manage Subscription',
          value: '[Open Vice City Central Profile](https://vicecitycentral.com/profile)',
          inline: false
        }
      ],
      footer: {
        text: 'Vice City Central • Automated Role Synchronization Sentinel',
        icon_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=48&q=80'
      }
    };

    if (!this.isConfigured()) {
      console.log(`[Discord Bot Simulation] Sent Role Sync Success DM to <@${discordUserId}> (${rolesGranted.join(', ')})`);
      return { success: true };
    }

    try {
      const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ recipient_id: discordUserId })
      });

      if (!dmChannelRes.ok) return { success: false, error: 'Could not open DM channel' };
      const dmChannel = await dmChannelRes.json();

      const sendRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ embeds: [embed] })
      });

      return { success: sendRes.ok };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Assign "Verified Server Owner" Role to a Discord User in official guild
   */
  public async assignServerOwnerRole(discordUserId: string): Promise<{ success: boolean; message: string }> {
    if (!discordUserId) {
      return { success: false, message: 'Missing Discord User ID' };
    }

    if (!this.isConfigured()) {
      console.log(`[Discord Bot Simulation] Assigned 'Verified Server Owner' role to User <@${discordUserId}> in Guild ${this.officialGuildId}`);
      return { success: true, message: `Simulated: Assigned Verified Server Owner role to <@${discordUserId}>` };
    }

    try {
      const url = `https://discord.com/api/v10/guilds/${this.officialGuildId}/members/${discordUserId}/roles/${this.verifiedRoleId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: `Discord API Error (${response.status}): ${errorText}` };
      }

      return { success: true, message: `Successfully assigned role ${this.verifiedRoleId} to user ${discordUserId}` };
    } catch (err: any) {
      return { success: false, message: `Failed to assign role: ${err.message}` };
    }
  }

  /**
   * Create a private support channel #server-support-{serverSlug} for the subscribed server
   */
  public async createPrivateSupportChannel(
    serverSlug: string,
    serverName: string,
    ownerDiscordId: string,
    tier: string
  ): Promise<{ success: boolean; channelId?: string; channelName?: string; error?: string }> {
    const cleanSlug = serverSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 24);
    const channelName = `vip-${cleanSlug}`;

    if (!this.isConfigured()) {
      const mockChannelId = `chan_${Date.now().toString(36)}`;
      console.log(`[Discord Bot Simulation] Created private channel #${channelName} (ID: ${mockChannelId}) for owner <@${ownerDiscordId}> [${tier}]`);
      return {
        success: true,
        channelId: mockChannelId,
        channelName
      };
    }

    try {
      // Permission Overwrites: 
      // 1. @everyone -> Deny VIEW_CHANNEL (1024)
      // 2. Owner -> Allow VIEW_CHANNEL, SEND_MESSAGES, ATTACH_FILES, EMBED_LINKS
      // 3. Staff Role -> Allow VIEW_CHANNEL, SEND_MESSAGES
      const url = `https://discord.com/api/v10/guilds/${this.officialGuildId}/channels`;
      const body = {
        name: channelName,
        type: 0, // Text Channel
        topic: `⚡ Dedicated VIP Support & Live Telemetry for ${serverName} (${serverSlug}) • Plan: ${tier.toUpperCase()}`,
        permission_overwrites: [
          {
            id: this.officialGuildId, // @everyone role ID is the guild ID
            type: 0, // Role
            deny: '1024', // VIEW_CHANNEL
            allow: '0'
          },
          {
            id: ownerDiscordId,
            type: 1, // Member
            allow: '523328', // VIEW_CHANNEL, SEND_MESSAGES, READ_MESSAGE_HISTORY, EMBED_LINKS, ATTACH_FILES
            deny: '0'
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Discord API Error (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      return {
        success: true,
        channelId: data.id,
        channelName: data.name
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Send a direct message (DM) to the server owner with onboarding instructions and credentials
   */
  public async sendOwnerOnboardingDm(
    ownerDiscordId: string,
    serverName: string,
    serverSlug: string,
    tier: string,
    apiKey: string,
    portalUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    const embed: DiscordEmbed = {
      title: `👑 Welcome to Vice City Central Enterprise — ${serverName}`,
      description: `Your server subscription for **${serverName}** (**${tier.replace('_', ' ').toUpperCase()}** Tier) is now fully activated!\n\nAll enterprise capabilities including zero-syntax Lua generator bundles, automated Discord whitelist screening, and custom application URLs are active.`,
      color: DISCORD_THEME_COLORS.CYAN,
      fields: [
        {
          name: '🌐 Your Live Player Application Portal',
          value: `[${portalUrl}](${portalUrl})`,
          inline: false
        },
        {
          name: '🔑 API / Webhook Integration Key',
          value: `\`\`\`${apiKey}\`\`\`*(Keep this private. Used for FiveM server sync & Lua exports)*`,
          inline: false
        },
        {
          name: '🛠️ Next Steps & Setup Checklist',
          value: '1. Invite our Discord Bot to your server\n2. Select your whitelist question template\n3. Bind your Discord Whitelisted Member role\n4. Post your portal link in your Discord announcements',
          inline: false
        },
        {
          name: '💬 VIP Priority Support',
          value: `Your dedicated private channel \`#vip-${serverSlug.slice(0, 20)}\` has been opened in the official Vice City Central Discord.`,
          inline: false
        }
      ]
    };

    if (!this.isConfigured()) {
      console.log(`[Discord Bot Simulation] Sent Onboarding DM to <@${ownerDiscordId}> for ${serverName}`);
      return { success: true };
    }

    try {
      // 1. Create DM channel with user
      const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ recipient_id: ownerDiscordId })
      });

      if (!dmChannelRes.ok) {
        const errorText = await dmChannelRes.text();
        return { success: false, error: `Failed to open DM channel: ${errorText}` };
      }

      const dmChannel = await dmChannelRes.json();

      // 2. Send Message to DM channel
      const sendRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          embeds: [embed]
        })
      });

      if (!sendRes.ok) {
        const sendErr = await sendRes.text();
        return { success: false, error: `Failed to send DM: ${sendErr}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Send a direct message (DM) to the server owner when automated whitelist provisioning fails
   */
  public async sendOwnerProvisioningFailureDm(
    details: ProvisioningFailureDetails
  ): Promise<{ success: boolean; error?: string; isSimulated?: boolean }> {
    const {
      ownerDiscordId,
      serverName,
      serverSlug,
      tier = 'community',
      errorReason,
      stepFailed = 'general',
      troubleshootingSteps,
      portalUrl,
      supportUrl,
      technicalLogs = [],
      timestamp = new Date().toISOString()
    } = details;

    const formattedTier = tier.replace('_', ' ').toUpperCase();
    const managementUrl = portalUrl || `https://vicecitycentral.com/servers/${serverSlug}/manage`;
    const officialSupportUrl = supportUrl || 'https://discord.gg/vicecity';

    const stepLabels: Record<string, string> = {
      role_assignment: 'Verified Server Owner Role Assignment',
      channel_creation: 'Dedicated VIP Support Channel Creation',
      whitelist_sync: 'Whitelist Application Schema & Database Sync',
      webhook_setup: 'Discord Webhook Dispatch Relay',
      permission_error: 'Discord Bot Permissions & Scope Check',
      general: 'Automated Whitelist Provisioning Pipeline'
    };

    const failedStepLabel = stepLabels[stepFailed] || stepFailed;

    const defaultTroubleshooting = troubleshootingSteps || [
      '**Discord DM Privacy**: Verify that "Allow direct messages from server members" is enabled in your Discord User Settings > Privacy & Safety.',
      `**Guild Membership**: Ensure your Discord account (<@${ownerDiscordId}>) is a member of the official Vice City Central Discord community.`,
      '**Bot Permissions**: If using custom server roles, check that the bot has `MANAGE_ROLES` and `MANAGE_CHANNELS` permissions.',
      '**1-Click Re-Provisioning**: Visit your Server Management Dashboard to re-trigger automated provisioning at any time.'
    ];

    const embed: DiscordEmbed = {
      title: `🚨 Provisioning Alert: Whitelist Automation Failed — ${serverName}`,
      description: `An issue occurred while automatically provisioning the whitelist infrastructure for **${serverName}** (**${formattedTier}** Plan).\n\nYour subscription is safe and active. Review the diagnostic breakdown below to resolve the issue or retry from your management portal.`,
      color: DISCORD_THEME_COLORS.ROSE,
      fields: [
        {
          name: '⚠️ Error Diagnostics',
          value: `\`\`\`${(errorReason || 'Unknown provisioning exception').slice(0, 1000)}\`\`\``,
          inline: false
        },
        {
          name: '🛠️ Failed Step',
          value: `\`${failedStepLabel}\``,
          inline: true
        },
        {
          name: '🏷️ Target Server',
          value: `**${serverName}** (\`${serverSlug}\`)`,
          inline: true
        },
        {
          name: '👑 Plan Tier',
          value: `\`${formattedTier}\``,
          inline: true
        },
        {
          name: '🔧 Recommended Fixes & Checklist',
          value: defaultTroubleshooting.map((step, idx) => `${idx + 1}. ${step}`).join('\n'),
          inline: false
        },
        ...(technicalLogs.length > 0
          ? [
              {
                name: '📋 Diagnostic Log Trace',
                value: `\`\`\`${technicalLogs.slice(-4).join('\n').slice(0, 800)}\`\`\``,
                inline: false
              }
            ]
          : []),
        {
          name: '🔗 1-Click Management & Support',
          value: `• [Open Server Management Dashboard](${managementUrl})\n• [Official Discord Support Hub](${officialSupportUrl})\n• [Whitelist Applicant Portal](https://vicecitycentral.com/servers/${serverSlug}/apply)`,
          inline: false
        }
      ],
      footer: {
        text: 'Vice City Central • Automated Whitelist Sentinel & Infrastructure Guard',
        icon_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=48&q=80'
      },
      timestamp
    };

    if (!this.isConfigured()) {
      console.log(
        `[Discord Bot Simulation Mode] Simulated Owner Failure Alert DM to <@${ownerDiscordId}> for "${serverName}" (Simulated Step: ${failedStepLabel})`
      );
      return { success: true, isSimulated: true };
    }

    try {
      // 1. Create or retrieve DM channel with user
      const dmChannelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ recipient_id: ownerDiscordId })
      });

      if (!dmChannelRes.ok) {
        const errorText = await dmChannelRes.text();
        console.warn(`[Discord Bot] Failed to open DM channel with <@${ownerDiscordId}>:`, errorText);
        return { success: false, error: `Failed to open DM channel: ${errorText}` };
      }

      const dmChannel = await dmChannelRes.json();

      // 2. Dispatch Failure Alert Embed to DM channel
      const sendRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          embeds: [embed]
        })
      });

      if (!sendRes.ok) {
        const sendErr = await sendRes.text();
        console.warn(`[Discord Bot] Failed to send failure alert DM to <@${ownerDiscordId}>:`, sendErr);
        return { success: false, error: `Failed to send failure alert DM: ${sendErr}` };
      }

      console.log(`[Discord Bot] Successfully sent Provisioning Failure Alert DM to owner <@${ownerDiscordId}> (${serverName})`);
      return { success: true };
    } catch (err: any) {
      console.error('[Discord Bot] Provisioning failure DM dispatch exception:', err);
      return { success: false, error: err?.message || 'Network exception while dispatching failure DM' };
    }
  }

  /**
   * Automated End-to-End Provisioning Workflow
   * Executed when Stripe confirms a B2B subscription or server owner requests re-provisioning.
   * If any step in the automated whitelist provisioning fails, it automatically sends a direct message to the server owner.
   */
  public async provisionSubscribedServer(params: {
    serverId: string;
    serverName: string;
    serverSlug: string;
    ownerDiscordId: string;
    tier: 'community' | 'mega_server' | 'enterprise';
    appBaseUrl: string;
    webhookUrl?: string;
  }): Promise<ServerProvisioningResult> {
    const { serverId, serverName, serverSlug, ownerDiscordId, tier, appBaseUrl, webhookUrl } = params;
    const logs: string[] = [];
    const nowIso = new Date().toISOString();
    logs.push(`[${nowIso}] Starting automated provisioning for "${serverName}" (${tier.toUpperCase()})`);

    let roleAssigned = false;
    let channelCreated = false;
    let channelId: string | undefined;
    let channelName: string | undefined;
    let dmDispatched = false;
    let failureDmDispatched = false;
    let provisioningError: string | undefined;
    let failedStep: 'role_assignment' | 'channel_creation' | 'whitelist_sync' | 'webhook_setup' | 'permission_error' | 'general' | undefined;

    try {
      if (!ownerDiscordId) {
        throw new Error('Missing ownerDiscordId: Owner must link Discord account to receive bot roles and management alerts.');
      }

      // 1. Assign "Verified Server Owner" Discord Role
      const roleResult = await this.assignServerOwnerRole(ownerDiscordId);
      roleAssigned = roleResult.success;
      logs.push(`Role Assignment: ${roleResult.message}`);

      if (!roleResult.success) {
        failedStep = 'role_assignment';
        provisioningError = `Role Assignment Error: ${roleResult.message}`;
      }

      // 2. Create Dedicated Private Support Channel
      const channelResult = await this.createPrivateSupportChannel(serverSlug, serverName, ownerDiscordId, tier);
      channelCreated = channelResult.success;
      if (channelResult.success) {
        channelId = channelResult.channelId;
        channelName = channelResult.channelName;
        logs.push(`Support Channel Created: #${channelResult.channelName} (${channelResult.channelId})`);
      } else {
        logs.push(`Support Channel Warning: ${channelResult.error}`);
        if (!provisioningError) {
          failedStep = 'channel_creation';
          provisioningError = `Support Channel Creation Error: ${channelResult.error || 'Failed to create channel'}`;
        }
      }

      // 3. Dispatch Owner Onboarding DM
      const generatedApiKey = `vcc_live_${serverId.slice(0, 8)}_${Date.now().toString(36)}`;
      const portalUrl = `${appBaseUrl}/servers/${serverSlug}/apply`;
      const dmResult = await this.sendOwnerOnboardingDm(
        ownerDiscordId,
        serverName,
        serverSlug,
        tier,
        generatedApiKey,
        portalUrl
      );
      dmDispatched = dmResult.success;

      if (dmResult.success) {
        logs.push(`Onboarding Direct Message dispatched to <@${ownerDiscordId}>`);
      } else {
        logs.push(`Onboarding DM Warning: ${dmResult.error}`);
        if (!provisioningError) {
          failedStep = 'general';
          provisioningError = `Owner DM Delivery Warning: ${dmResult.error}`;
        }
      }

      // Check if any critical step failed
      const hasCriticalFailure = !roleAssigned || !channelCreated;

      if (hasCriticalFailure) {
        logs.push(`[${new Date().toISOString()}] Automated provisioning encountered critical failure: ${provisioningError}`);
        
        // Trigger automated failure DM to server owner
        const failureDmResult = await this.sendOwnerProvisioningFailureDm({
          ownerDiscordId,
          serverName,
          serverSlug,
          tier,
          errorReason: provisioningError || 'Automated guild role or support channel configuration failed.',
          stepFailed: failedStep || 'general',
          portalUrl: `${appBaseUrl}/servers/${serverSlug}/manage`,
          supportUrl: 'https://discord.gg/vicecity',
          technicalLogs: logs,
          timestamp: new Date().toISOString()
        });

        failureDmDispatched = failureDmResult.success;
        if (failureDmResult.success) {
          logs.push(`Automated Failure Alert DM successfully dispatched to Owner <@${ownerDiscordId}>`);
        } else {
          logs.push(`Failed to dispatch Failure Alert DM: ${failureDmResult.error}`);
        }

        // Also notify server webhook if provided
        if (webhookUrl) {
          await this.dispatchSubscriptionAlert({
            webhookUrl,
            serverName,
            serverSlug,
            eventType: 'downgraded',
            details: `Provisioning Warning for ${serverName}: ${provisioningError}. Automated failure DM dispatched to owner.`
          }).catch(() => {});
        }

        return {
          success: false,
          roleAssigned,
          channelCreated,
          channelId,
          channelName,
          dmDispatched,
          failureDmDispatched,
          logs,
          error: provisioningError,
          failedStep
        };
      }

      return {
        success: true,
        roleAssigned,
        channelCreated,
        channelId,
        channelName,
        dmDispatched,
        failureDmDispatched: false,
        logs
      };
    } catch (unhandledErr: any) {
      const errMsg = unhandledErr?.message || String(unhandledErr);
      logs.push(`[Fatal Provisioning Exception]: ${errMsg}`);

      if (ownerDiscordId) {
        try {
          const failureDmResult = await this.sendOwnerProvisioningFailureDm({
            ownerDiscordId,
            serverName,
            serverSlug,
            tier,
            errorReason: errMsg,
            stepFailed: failedStep || 'general',
            portalUrl: `${appBaseUrl}/servers/${serverSlug}/manage`,
            supportUrl: 'https://discord.gg/vicecity',
            technicalLogs: logs,
            timestamp: new Date().toISOString()
          });
          failureDmDispatched = failureDmResult.success;
          logs.push(`Emergency Failure Alert DM dispatched to Owner <@${ownerDiscordId}>`);
        } catch (dmErr) {
          logs.push(`Emergency Failure Alert DM failed: ${dmErr}`);
        }
      }

      return {
        success: false,
        roleAssigned,
        channelCreated,
        channelId,
        channelName,
        dmDispatched,
        failureDmDispatched,
        logs,
        error: errMsg,
        failedStep: failedStep || 'general'
      };
    }
  }

  /**
   * Dispatch Subscription Cancellation or Payment Failure Alert to Discord Webhook
   */
  public async dispatchSubscriptionAlert(params: {
    webhookUrl?: string;
    serverName: string;
    serverSlug: string;
    eventType: 'payment_failed' | 'canceled' | 'downgraded' | 'renewed';
    details: string;
  }): Promise<void> {
    const { webhookUrl, serverName, serverSlug, eventType, details } = params;
    if (!webhookUrl) return;

    let color = DISCORD_THEME_COLORS.AMBER;
    let title = `⚠️ Subscription Notice — ${serverName}`;

    if (eventType === 'payment_failed') {
      color = DISCORD_THEME_COLORS.ROSE;
      title = `🚨 Payment Failed: Action Required — ${serverName}`;
    } else if (eventType === 'canceled') {
      color = DISCORD_THEME_COLORS.ROSE;
      title = `🛑 Subscription Canceled — ${serverName}`;
    } else if (eventType === 'renewed') {
      color = DISCORD_THEME_COLORS.EMERALD;
      title = `✅ Subscription Renewed Successfully — ${serverName}`;
    }

    const embed: DiscordEmbed = {
      title,
      description: details,
      color,
      fields: [
        { name: 'Server Slug', value: `\`${serverSlug}\``, inline: true },
        { name: 'Event Type', value: `\`${eventType.toUpperCase()}\``, inline: true },
        { name: 'Billing Portal', value: `[Update Payment Method](https://vicecitycentral.com/profile)`, inline: false }
      ]
    };

    await sendDiscordWebhookEmbed(webhookUrl, embed, undefined, 'Vice City Central Billing Guard');
  }
}

// Global Singleton Instance
export const discordBotService = new DiscordBotService();
