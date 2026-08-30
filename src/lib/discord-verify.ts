/**
 * Discord OAuth2 & Guild Administrator Permission Verification Module
 * Principal Backend Security implementation with bitwise permission evaluation.
 */

// Discord OAuth2 Scopes Configuration
export const DISCORD_OAUTH_SCOPES = [
  'identify',
  'email',
  'guilds',
  'guilds.join'
] as const;

export const DISCORD_OAUTH_SCOPE_STRING = DISCORD_OAUTH_SCOPES.join(' ');

/**
 * Generate standard Discord OAuth2 Authorization URL with guilds & guilds.join scopes
 */
export function getDiscordOAuthAuthorizeUrl(options?: {
  clientId?: string;
  redirectUri?: string;
  state?: string;
  scopes?: string[];
  prompt?: 'consent' | 'none';
}): string {
  const clientId = options?.clientId || process.env.DISCORD_CLIENT_ID || '123456789012345678';
  const scopes = options?.scopes && options.scopes.length > 0 ? options.scopes.join(' ') : DISCORD_OAUTH_SCOPE_STRING;
  const redirectUri = options?.redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/api/auth/discord/callback` : 'http://localhost:3000/api/auth/discord/callback');
  const prompt = options?.prompt || 'consent';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    prompt: prompt
  });

  if (options?.state) {
    params.set('state', options.state);
  }

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

// Discord Bitwise Permission Flags (BigInt)
export const DISCORD_PERMISSIONS = {
  CREATE_INSTANT_INVITE: 0x1n,
  KICK_MEMBERS: 0x2n,
  BAN_MEMBERS: 0x4n,
  ADMINISTRATOR: 0x8n, // Bit 3 - Grants all permissions
  MANAGE_CHANNELS: 0x10n,
  MANAGE_GUILD: 0x20n,
  ADD_REACTIONS: 0x40n,
  VIEW_AUDIT_LOG: 0x80n,
  PRIORITY_SPEAKER: 0x100n,
  STREAM: 0x200n,
  VIEW_CHANNEL: 0x400n,
  SEND_MESSAGES: 0x800n,
  SEND_TTS_MESSAGES: 0x1000n,
  MANAGE_MESSAGES: 0x2000n,
  EMBED_LINKS: 0x4000n,
  ATTACH_FILES: 0x8000n,
  READ_MESSAGE_HISTORY: 0x10000n,
  MENTION_EVERYONE: 0x20000n,
  USE_EXTERNAL_EMOJIS: 0x4000n,
  VIEW_GUILD_INSIGHTS: 0x80000n,
  CONNECT: 0x100000n,
  SPEAK: 0x200000n,
  MUTE_MEMBERS: 0x400000n,
  DEAFEN_MEMBERS: 0x800000n,
  MOVE_MEMBERS: 0x1000000n,
  USE_VAD: 0x2000000n,
  CHANGE_NICKNAME: 0x4000000n,
  MANAGE_NICKNAMES: 0x8000000n,
  MANAGE_ROLES: 0x10000000n,
  MANAGE_WEBHOOKS: 0x20000000n,
  MANAGE_GUILD_EXPRESSIONS: 0x40000000n,
  USE_APPLICATION_COMMANDS: 0x80000000n,
  REQUEST_TO_SPEAK: 0x100000000n,
  MANAGE_EVENTS: 0x200000000n,
  MANAGE_THREADS: 0x400000000n,
  CREATE_PUBLIC_THREADS: 0x800000000n,
  CREATE_PRIVATE_THREADS: 0x1000000000n,
  USE_EXTERNAL_STICKERS: 0x2000000000n,
  SEND_MESSAGES_IN_THREADS: 0x4000000000n,
  USE_EMBEDDED_ACTIVITIES: 0x8000000000n,
  MODERATE_MEMBERS: 0x10000000000n,
} as const;

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string | number;
  features?: string[];
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar?: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  email?: string | null;
  verified?: boolean;
}

export interface VerificationResult {
  success: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  hasManageGuild: boolean;
  guild?: DiscordGuild;
  user?: DiscordUser;
  error?: string;
  code?: 'GUILD_NOT_FOUND' | 'MISSING_ADMIN_PERMISSION' | 'INVALID_TOKEN' | 'API_ERROR' | 'MOCK_VERIFIED';
  permissionsBitmask?: string;
  diagnostics?: {
    checkedGuildId: string;
    matchedGuildName?: string;
    permissionDecimal?: string;
    isOwner: boolean;
    hasAdminFlag: boolean;
  };
}

/**
 * Checks if a permissions bitmask integer contains Administrator (0x8)
 * Formula: (BigInt(permissions) & 0x8n) === 0x8n
 */
export function hasAdminPermission(permissions: string | number | bigint): boolean {
  try {
    const permBigInt = typeof permissions === 'bigint' ? permissions : BigInt(permissions || '0');
    return (permBigInt & DISCORD_PERMISSIONS.ADMINISTRATOR) === DISCORD_PERMISSIONS.ADMINISTRATOR;
  } catch {
    return false;
  }
}

/**
 * Checks if permissions contain Manage Guild (0x20)
 */
export function hasManageGuildPermission(permissions: string | number | bigint): boolean {
  try {
    const permBigInt = typeof permissions === 'bigint' ? permissions : BigInt(permissions || '0');
    return (permBigInt & DISCORD_PERMISSIONS.MANAGE_GUILD) === DISCORD_PERMISSIONS.MANAGE_GUILD;
  } catch {
    return false;
  }
}

/**
 * Verifies that the authenticated user possesses Administrator (0x8) or Owner status on the target Discord Guild.
 * 
 * @param accessToken - Discord OAuth2 bearer token from `identify guilds` scope
 * @param targetGuildId - Numeric snowflake ID of the RP server's Discord guild
 * @param simulatedUser - Optional mock payload for development / sandbox testing
 */
export async function verifyDiscordGuildAdmin(
  accessToken: string,
  targetGuildId: string,
  simulatedUser?: { discordId: string; username: string; mockAdmin?: boolean }
): Promise<VerificationResult> {
  const cleanGuildId = (targetGuildId || '').trim().replace(/[^0-9]/g, '');

  if (!cleanGuildId) {
    return {
      success: false,
      isAdmin: false,
      isOwner: false,
      hasManageGuild: false,
      code: 'API_ERROR',
      error: 'Invalid target Discord Guild ID provided.'
    };
  }

  if (!accessToken) {
    if (simulatedUser) {
      return {
        success: true,
        isAdmin: true,
        isOwner: true,
        hasManageGuild: true,
        user: {
          id: simulatedUser.discordId || '849204918294028190',
          username: simulatedUser.username || 'VerifiedServerOwner',
          discriminator: '0',
          avatar: null
        },
        code: 'MOCK_VERIFIED',
        diagnostics: {
          checkedGuildId: cleanGuildId,
          matchedGuildName: 'Verified Vice City RP Guild',
          permissionDecimal: '8',
          isOwner: true,
          hasAdminFlag: true
        }
      };
    }
    return {
      success: false,
      isAdmin: false,
      isOwner: false,
      hasManageGuild: false,
      code: 'INVALID_TOKEN',
      error: 'Discord OAuth2 authentication required. Please click "Connect with Discord OAuth2" to authenticate your Discord account and verify your Administrator (0x8) permissions.'
    };
  }

  try {
    // 2. Fetch authenticated Discord User Profile (@me)
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ViceIntel-SecurityVerifier/2.0'
      }
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      return {
        success: false,
        isAdmin: false,
        isOwner: false,
        hasManageGuild: false,
        code: 'INVALID_TOKEN',
        error: `Discord OAuth token verification failed (${userRes.status}): ${errText}`
      };
    }

    const discordUser: DiscordUser = await userRes.json();

    // 3. Query Discord REST API for User's Guilds (@me/guilds)
    const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ViceIntel-SecurityVerifier/2.0'
      }
    });

    if (!guildsRes.ok) {
      const errText = await guildsRes.text();
      return {
        success: false,
        isAdmin: false,
        isOwner: false,
        hasManageGuild: false,
        code: 'API_ERROR',
        error: `Failed to query Discord guilds (${guildsRes.status}): ${errText}`
      };
    }

    const guilds: DiscordGuild[] = await guildsRes.json();

    // 4. Match target server's discordGuildId
    const matchedGuild = guilds.find((g) => g.id === cleanGuildId);

    if (!matchedGuild) {
      return {
        success: false,
        isAdmin: false,
        isOwner: false,
        hasManageGuild: false,
        user: discordUser,
        code: 'GUILD_NOT_FOUND',
        error: `Your Discord account (@${discordUser.username}) was not found in Discord Guild ID ${cleanGuildId}. Please join or invite your Discord account to the target server's guild first.`,
        diagnostics: {
          checkedGuildId: cleanGuildId,
          isOwner: false,
          hasAdminFlag: false
        }
      };
    }

    // 5. Verify bitwise administrator permission:
    // (BigInt(guild.permissions) & BigInt(0x8)) === BigInt(0x8) || guild.owner === true
    const isGuildOwner = matchedGuild.owner === true;
    const hasAdminFlag = hasAdminPermission(matchedGuild.permissions);
    const hasManageGuildFlag = hasManageGuildPermission(matchedGuild.permissions);

    const isVerifiedAdmin = isGuildOwner || hasAdminFlag;

    if (!isVerifiedAdmin) {
      return {
        success: false,
        isAdmin: false,
        isOwner: isGuildOwner,
        hasManageGuild: hasManageGuildFlag,
        guild: matchedGuild,
        user: discordUser,
        code: 'MISSING_ADMIN_PERMISSION',
        error: `Insufficient Discord Permissions: Account @${discordUser.username} belongs to "${matchedGuild.name}", but lacks the Administrator (0x8) permission. Only Discord Guild Owners or Administrators can claim this listing.`,
        permissionsBitmask: String(matchedGuild.permissions),
        diagnostics: {
          checkedGuildId: cleanGuildId,
          matchedGuildName: matchedGuild.name,
          permissionDecimal: String(matchedGuild.permissions),
          isOwner: isGuildOwner,
          hasAdminFlag: false
        }
      };
    }

    return {
      success: true,
      isAdmin: true,
      isOwner: isGuildOwner,
      hasManageGuild: hasManageGuildFlag,
      guild: matchedGuild,
      user: discordUser,
      permissionsBitmask: String(matchedGuild.permissions),
      diagnostics: {
        checkedGuildId: cleanGuildId,
        matchedGuildName: matchedGuild.name,
        permissionDecimal: String(matchedGuild.permissions),
        isOwner: isGuildOwner,
        hasAdminFlag
      }
    };
  } catch (err: any) {
    return {
      success: false,
      isAdmin: false,
      isOwner: false,
      hasManageGuild: false,
      code: 'API_ERROR',
      error: err?.message || 'Unexpected exception during Discord permission challenge.'
    };
  }
}

/**
 * Checks whether an authenticated Discord user is a member of the specified Discord Guild
 * utilizing the 'guilds' OAuth scope.
 */
export async function verifyUserGuildMembership(
  accessToken: string,
  targetGuildId: string
): Promise<{ isMember: boolean; guild?: DiscordGuild; error?: string }> {
  const cleanGuildId = (targetGuildId || '').trim().replace(/[^0-9]/g, '');
  if (!cleanGuildId || !accessToken) {
    return { isMember: false, error: 'Missing guild ID or access token' };
  }

  try {
    const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ViceIntel-SecurityVerifier/2.0'
      }
    });

    if (!res.ok) {
      return { isMember: false, error: `Failed to fetch guilds (${res.status})` };
    }

    const guilds: DiscordGuild[] = await res.json();
    const matched = guilds.find((g) => g.id === cleanGuildId);

    return {
      isMember: Boolean(matched),
      guild: matched
    };
  } catch (err: any) {
    return { isMember: false, error: err?.message || 'Guild check error' };
  }
}

/**
 * Adds the authenticated user to a Discord guild using the 'guilds.join' OAuth2 scope.
 * Requires a Discord Bot Token with CREATE_INSTANT_INVITE / Administrator permissions on the guild.
 */
export async function addMemberToDiscordGuild(
  botToken: string,
  guildId: string,
  userId: string,
  userAccessToken: string,
  options?: {
    roles?: string[];
    nickname?: string;
    mute?: boolean;
    deaf?: boolean;
  }
): Promise<{ success: boolean; joined: boolean; alreadyMember: boolean; error?: string }> {
  const cleanGuildId = (guildId || '').trim().replace(/[^0-9]/g, '');
  const cleanUserId = (userId || '').trim().replace(/[^0-9]/g, '');

  if (!cleanGuildId || !cleanUserId || !userAccessToken || !botToken) {
    return {
      success: false,
      joined: false,
      alreadyMember: false,
      error: 'Missing required parameters (botToken, guildId, userId, userAccessToken)'
    };
  }

  try {
    const body: Record<string, any> = {
      access_token: userAccessToken
    };

    if (options?.roles && options.roles.length > 0) body.roles = options.roles;
    if (options?.nickname) body.nick = options.nickname;
    if (typeof options?.mute === 'boolean') body.mute = options.mute;
    if (typeof options?.deaf === 'boolean') body.deaf = options.deaf;

    const res = await fetch(`https://discord.com/api/v10/guilds/${cleanGuildId}/members/${cleanUserId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ViceIntel-Bot/2.0'
      },
      body: JSON.stringify(body)
    });

    if (res.status === 201) {
      // 201 Created: user joined successfully
      return { success: true, joined: true, alreadyMember: false };
    } else if (res.status === 204) {
      // 204 No Content: user was already in the guild
      return { success: true, joined: false, alreadyMember: true };
    } else {
      const errData = await res.text();
      return {
        success: false,
        joined: false,
        alreadyMember: false,
        error: `Discord API returned ${res.status}: ${errData}`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      joined: false,
      alreadyMember: false,
      error: err?.message || 'Failed to add member to Discord guild'
    };
  }
}

