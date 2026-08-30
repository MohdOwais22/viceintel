import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  ActivityType,
  Partials,
  Interaction
} from 'discord.js';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { handleInteractionCreate } from './events/interactionCreate';
import { BotGuildConfig } from './types';

// Global singleton client reference for server runtime integration
let clientInstance: Client | null = null;

// ============================================================================
// MEMORY-CACHING LAYER FOR BOT GUILD CONFIGS
// Reduces Firestore database read operations and latency on high-traffic bot traffic
// ============================================================================

interface CachedConfigEntry {
  config: BotGuildConfig;
  cachedAt: number;
}

const guildConfigCache = new Map<string, CachedConfigEntry>();
// Cache TTL: 5 minutes (300,000 ms) by default
export const GUILD_CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Retrieves a BotGuildConfig from local memory cache if valid and unexpired;
 * otherwise performs a single Firestore lookup and primes the cache.
 */
export async function getGuildConfig(
  guildId: string, 
  forceRefresh = false
): Promise<BotGuildConfig | null> {
  if (!guildId) return null;

  const now = Date.now();
  const cached = guildConfigCache.get(guildId);

  if (!forceRefresh && cached && (now - cached.cachedAt) < GUILD_CONFIG_CACHE_TTL_MS) {
    return cached.config;
  }

  try {
    const configDocRef = doc(db, 'bot_guild_configs', guildId);
    const configDocSnap = await getDoc(configDocRef);

    if (!configDocSnap.exists()) {
      guildConfigCache.delete(guildId);
      return null;
    }

    const config = configDocSnap.data() as BotGuildConfig;
    guildConfigCache.set(guildId, {
      config,
      cachedAt: now
    });

    return config;
  } catch (error) {
    console.error(`[VCC Bot Cache]: Error fetching guild config for ${guildId}:`, error);
    // If Firestore fails but stale cache exists, return stale cache gracefully
    if (cached) {
      console.warn(`[VCC Bot Cache]: Returning stale cached config for ${guildId} due to database error`);
      return cached.config;
    }
    return null;
  }
}

/**
 * Directly writes or updates a BotGuildConfig in memory cache (e.g. after /vcc-setup or webhook updates).
 */
export function setCachedGuildConfig(guildId: string, config: BotGuildConfig): void {
  if (!guildId || !config) return;
  guildConfigCache.set(guildId, {
    config,
    cachedAt: Date.now()
  });
}

/**
 * Evicts a specific guild configuration from memory cache.
 */
export function invalidateGuildConfigCache(guildId: string): boolean {
  return guildConfigCache.delete(guildId);
}

/**
 * Clears the entire guild configuration memory cache.
 */
export function clearGuildConfigCache(): void {
  guildConfigCache.clear();
}

/**
 * Returns cache telemetry for observability and debugging.
 */
export function getGuildConfigCacheStats(): { size: number; cachedGuildIds: string[] } {
  return {
    size: guildConfigCache.size,
    cachedGuildIds: Array.from(guildConfigCache.keys())
  };
}

// ============================================================================
// LOCAL RATE-LIMITER FOR BOT COMMAND EXECUTION PER GUILD
// Prevents API spam, bot throttling, and ensures Discord Gateway compliance
// ============================================================================

interface RateLimitBucket {
  timestamps: number[];
  userTimestamps: Map<string, number[]>;
}

const guildRateLimitBuckets = new Map<string, RateLimitBucket>();

// Guild-wide limit: Maximum 30 commands/interactions per guild in a 60-second window
export const GUILD_RATE_LIMIT_MAX = 30;
export const GUILD_RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Per-user cooldown within a guild: Maximum 6 commands per 10-second window to stop individual user bursts
export const USER_RATE_LIMIT_MAX = 6;
export const USER_RATE_LIMIT_WINDOW_MS = 10 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
  reason?: 'guild_limit' | 'user_limit';
}

/**
 * Evaluates and records command execution for a given guild and optional user.
 * Returns whether execution is permitted, remaining limit, and retry delay.
 */
export function checkGuildRateLimit(guildId: string, userId?: string): RateLimitResult {
  if (!guildId) {
    return { allowed: true, retryAfterMs: 0, remaining: GUILD_RATE_LIMIT_MAX };
  }

  const now = Date.now();
  let bucket = guildRateLimitBuckets.get(guildId);

  if (!bucket) {
    bucket = {
      timestamps: [],
      userTimestamps: new Map()
    };
    guildRateLimitBuckets.set(guildId, bucket);
  }

  // 1. Prune expired guild-wide timestamps
  bucket.timestamps = bucket.timestamps.filter(ts => (now - ts) < GUILD_RATE_LIMIT_WINDOW_MS);

  // 2. Check guild-wide rate ceiling
  if (bucket.timestamps.length >= GUILD_RATE_LIMIT_MAX) {
    const oldest = bucket.timestamps[0] || (now - GUILD_RATE_LIMIT_WINDOW_MS);
    const retryAfterMs = Math.max(1000, GUILD_RATE_LIMIT_WINDOW_MS - (now - oldest));
    return {
      allowed: false,
      retryAfterMs,
      remaining: 0,
      reason: 'guild_limit'
    };
  }

  // 3. Check per-user rate ceiling if userId is provided
  if (userId) {
    let userTs = bucket.userTimestamps.get(userId) || [];
    userTs = userTs.filter(ts => (now - ts) < USER_RATE_LIMIT_WINDOW_MS);
    bucket.userTimestamps.set(userId, userTs);

    if (userTs.length >= USER_RATE_LIMIT_MAX) {
      const oldestUser = userTs[0] || (now - USER_RATE_LIMIT_WINDOW_MS);
      const retryAfterMs = Math.max(1000, USER_RATE_LIMIT_WINDOW_MS - (now - oldestUser));
      return {
        allowed: false,
        retryAfterMs,
        remaining: 0,
        reason: 'user_limit'
      };
    }

    userTs.push(now);
  }

  // Record valid command execution timestamp
  bucket.timestamps.push(now);

  const remaining = Math.max(0, GUILD_RATE_LIMIT_MAX - bucket.timestamps.length);
  return {
    allowed: true,
    retryAfterMs: 0,
    remaining
  };
}

/**
 * Resets or clears rate limit history for a specific guild.
 */
export function resetGuildRateLimit(guildId: string): boolean {
  return guildRateLimitBuckets.delete(guildId);
}

/**
 * Cleans up empty / expired rate limit records from memory.
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [guildId, bucket] of guildRateLimitBuckets.entries()) {
    bucket.timestamps = bucket.timestamps.filter(ts => (now - ts) < GUILD_RATE_LIMIT_WINDOW_MS);
    for (const [userId, uTimestamps] of bucket.userTimestamps.entries()) {
      const active = uTimestamps.filter(ts => (now - ts) < USER_RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        bucket.userTimestamps.delete(userId);
      } else {
        bucket.userTimestamps.set(userId, active);
      }
    }
    if (bucket.timestamps.length === 0 && bucket.userTimestamps.size === 0) {
      guildRateLimitBuckets.delete(guildId);
    }
  }
}

/**
 * Returns rate limit telemetry for debugging and monitoring.
 */
export function getGuildRateLimitStats(): { activeGuilds: number } {
  return {
    activeGuilds: guildRateLimitBuckets.size
  };
}

// Periodic cleanup timer every 2 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupExpiredRateLimits();
  }, 2 * 60 * 1000);
}

// ============================================================================
// BOT GATEWAY INITIALIZATION & RUNTIME
// ============================================================================

/**
 * Boots the Discord.js v14 client securely with required Gateway Intents.
 * Registers slash commands and initializes event listeners.
 */
export async function startDiscordBot(): Promise<Client | null> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || token.includes('ExampleKey') || token.includes('abcdefghijklmnopqrst')) {
    console.warn('[VCC Bot Gateway]: Skipping bot bootstrap. DISCORD_BOT_TOKEN is not configured or using placeholders.');
    return null;
  }

  if (clientInstance) {
    return clientInstance;
  }

  console.log('[VCC Bot Gateway]: Constructing high-resilience bot client with memory cache & rate-limiter...');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message] // Required for DM & un-cached message handling
  });

  client.once('ready', async () => {
    console.log(`[VCC Bot Gateway]: Logged in securely as "${client.user?.tag}"! Ready for multi-tenant B2B operations.`);

    // Set interactive bot status
    client.user?.setPresence({
      activities: [{ name: 'GTA VI Vice City Whitelisting', type: ActivityType.Watching }],
      status: 'online'
    });

    // Deploy and register Slash Commands globally
    try {
      if (clientId) {
        console.log('[VCC Bot Gateway]: Registering slash commands globally with Discord REST API...');
        const rest = new REST({ version: '10' }).setToken(token);

        // Dynamically import command builders
        const setupModule = await import('./commands/setup');
        const statusModule = await import('./commands/status');
        const applyModule = await import('./commands/apply');

        const commands = [
          setupModule.data.toJSON(),
          statusModule.data.toJSON(),
          applyModule.data.toJSON()
        ];

        await rest.put(
          Routes.applicationCommands(clientId),
          { body: commands }
        );
        console.log('[VCC Bot Gateway]: All Slash Commands (/vcc-setup, /status, /apply) registered successfully!');
      } else {
        console.warn('[VCC Bot Gateway]: DISCORD_CLIENT_ID missing; skipping command registration.');
      }
    } catch (deployError) {
      console.error('[VCC Bot Gateway]: Failed to register slash commands:', deployError);
    }
  });

  // Handle incoming interactions (slash commands, buttons, modal submissions)
  client.on('interactionCreate', async (interaction: Interaction) => {
    try {
      await handleInteractionCreate(client, interaction);
    } catch (err) {
      console.error('[VCC Bot Gateway]: Unhandled interaction error:', err);
    }
  });

  // Start connection to Discord Gateway
  try {
    await client.login(token);
    clientInstance = client;
    return client;
  } catch (err) {
    console.error('[VCC Bot Gateway]: Failed to authenticate with Discord API:', err);
    return null;
  }
}

/**
 * Retrieves the currently active client instance, or null if offline.
 */
export function getBotClient(): Client | null {
  return clientInstance;
}
