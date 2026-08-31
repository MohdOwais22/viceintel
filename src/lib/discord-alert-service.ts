/**
 * Discord Custom Webhook & API Bot Alert Service
 * Connects Next.js and Express backends to push instant formatted alerts
 * to Discord channels (#announcements or #verified-news) whenever new database entries or articles drop.
 */

import { ENV } from './envConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type AlertTargetChannel = '#announcements' | '#verified-news' | 'announcements' | 'verified-news' | string;

export type AlertEventType = 
  | 'article_drop'
  | 'database_entry'
  | 'vehicle_drop'
  | 'weapon_drop'
  | 'map_location_drop'
  | 'business_drop'
  | 'leak_verified'
  | 'newswire_update'
  | 'tuning_challenge'
  | 'system_announcement'
  | 'custom';

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
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

export interface DiscordAlertPayload {
  targetChannel?: AlertTargetChannel;
  webhookUrl?: string; // Optional custom override
  eventType: AlertEventType;
  title: string;
  description: string;
  url?: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
  authorName?: string;
  authorAvatar?: string;
  fields?: DiscordEmbedField[];
  color?: number;
  mentionRole?: string; // e.g. '@everyone', '@here', or role ID '<@&123>'
  metadata?: Record<string, any>;
}

export interface WebhookDispatchResult {
  success: boolean;
  targetChannel: string;
  dispatchedAt: string;
  statusText: string;
  statusCode?: number;
  messageId?: string;
  webhookUsed: string;
  error?: string;
  embed: DiscordEmbed;
}

export interface WebhookLogEntry extends WebhookDispatchResult {
  id: string;
  eventType: AlertEventType;
  title: string;
}

// In-memory telemetry log of recently dispatched webhook alerts
export const webhookDispatchHistory: WebhookLogEntry[] = [];

export interface GlobalBotWebhookConfig {
  announcementsWebhook?: string;
  newsWebhook?: string;
  autoPseoBroadcast?: boolean;
  autoBlogBroadcast?: boolean;
  botSecret?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// In-memory cached Firestore webhooks
export const cachedFirestoreWebhooks: GlobalBotWebhookConfig = {
  announcementsWebhook: '',
  newsWebhook: '',
  autoPseoBroadcast: true,
  autoBlogBroadcast: true
};

let isFirestoreWebhooksLoaded = false;

/**
 * Fetch global webhook configuration from Firestore collection `bot_guild_configs`, doc `global_alerts`
 */
export async function fetchWebhooksFromFirestore(): Promise<GlobalBotWebhookConfig> {
  try {
    const docRef = doc(db, 'bot_guild_configs', 'global_alerts');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as GlobalBotWebhookConfig;
      if (data) {
        if (data.announcementsWebhook) cachedFirestoreWebhooks.announcementsWebhook = data.announcementsWebhook;
        if (data.newsWebhook) cachedFirestoreWebhooks.newsWebhook = data.newsWebhook;
        if (typeof data.autoPseoBroadcast === 'boolean') cachedFirestoreWebhooks.autoPseoBroadcast = data.autoPseoBroadcast;
        if (typeof data.autoBlogBroadcast === 'boolean') cachedFirestoreWebhooks.autoBlogBroadcast = data.autoBlogBroadcast;
        if (data.updatedAt) cachedFirestoreWebhooks.updatedAt = data.updatedAt;
        if (data.updatedBy) cachedFirestoreWebhooks.updatedBy = data.updatedBy;
        isFirestoreWebhooksLoaded = true;
        return { ...cachedFirestoreWebhooks };
      }
    }
  } catch (err) {
    // Silent fail / offline fallback
  }

  // Fallback to local storage if in browser
  if (typeof window !== 'undefined') {
    const savedAnnouncements = localStorage.getItem('gtavi_discord_announcements_webhook');
    const savedNews = localStorage.getItem('gtavi_discord_news_webhook');
    if (savedAnnouncements) cachedFirestoreWebhooks.announcementsWebhook = savedAnnouncements;
    if (savedNews) cachedFirestoreWebhooks.newsWebhook = savedNews;
  }

  isFirestoreWebhooksLoaded = true;
  return { ...cachedFirestoreWebhooks };
}

/**
 * Save global webhook configuration to Cloud Firestore `bot_guild_configs/global_alerts`
 */
export async function saveWebhooksToFirestore(config: {
  announcementsWebhook?: string;
  newsWebhook?: string;
  autoPseoBroadcast?: boolean;
  autoBlogBroadcast?: boolean;
  botSecret?: string;
  updatedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: GlobalBotWebhookConfig = {
      announcementsWebhook: (config.announcementsWebhook || '').trim(),
      newsWebhook: (config.newsWebhook || '').trim(),
      autoPseoBroadcast: config.autoPseoBroadcast !== undefined ? config.autoPseoBroadcast : true,
      autoBlogBroadcast: config.autoBlogBroadcast !== undefined ? config.autoBlogBroadcast : true,
      updatedAt: new Date().toISOString(),
      updatedBy: config.updatedBy || 'ViceIntel_Admin'
    };

    if (config.botSecret) {
      payload.botSecret = config.botSecret;
    }

    // 1. Write directly to Firestore
    const docRef = doc(db, 'bot_guild_configs', 'global_alerts');
    await setDoc(docRef, payload, { merge: true });

    // 2. Update local memory cache
    cachedFirestoreWebhooks.announcementsWebhook = payload.announcementsWebhook;
    cachedFirestoreWebhooks.newsWebhook = payload.newsWebhook;
    cachedFirestoreWebhooks.autoPseoBroadcast = payload.autoPseoBroadcast;
    cachedFirestoreWebhooks.autoBlogBroadcast = payload.autoBlogBroadcast;
    cachedFirestoreWebhooks.updatedAt = payload.updatedAt;
    cachedFirestoreWebhooks.updatedBy = payload.updatedBy;
    isFirestoreWebhooksLoaded = true;

    // 3. Update localStorage if browser
    if (typeof window !== 'undefined') {
      if (payload.announcementsWebhook) localStorage.setItem('gtavi_discord_announcements_webhook', payload.announcementsWebhook);
      if (payload.newsWebhook) localStorage.setItem('gtavi_discord_news_webhook', payload.newsWebhook);
      
      // Also notify backend server to update process.env & server memory cache
      try {
        await fetch('/api/bot/save-webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        // Backend notified
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[saveWebhooksToFirestore Error]:', err);
    return { success: false, error: err?.message || 'Firestore write error' };
  }
}

// Color Palette Constants
export const EMBED_COLORS = {
  VERIFIED_NEWS: 0x06B6D4,       // Cyan #06B6D4
  BREAKING_NEWS: 0xF59E0B,       // Amber Gold #F59E0B
  ANNOUNCEMENTS: 0xEC4899,       // Hot Magenta #EC4899
  DATABASE_ENTRY: 0x8B5CF6,      // Purple #8B5CF6
  VEHICLE_DROP: 0x3B82F6,        // Electric Blue #3B82F6
  WEAPON_DROP: 0xEF4444,         // Crimson Red #EF4444
  MAP_LOCATION: 0x10B981,        // Emerald Green #10B981
  CHALLENGE: 0xF97316,           // Sunset Orange #F97316
  LEAK_VERIFIED: 0xA855F7,       // Neon Violet #A855F7
};

/**
 * Get active Webhook URL for a specific target channel.
 * Checks custom override -> Cloud Firestore cached config -> runtime environment variables -> localStorage.
 */
export function resolveWebhookUrl(targetChannel: AlertTargetChannel, customUrl?: string): string {
  if (customUrl && customUrl.startsWith('https://discord.com/api/webhooks/')) {
    return customUrl;
  }

  const normalized = targetChannel.toLowerCase().replace('#', '').trim();
  const isNews = normalized === 'verified-news' || normalized === 'news' || normalized === 'breaking-news';
  const isAnnouncements = normalized === 'announcements' || normalized === 'database-drops' || normalized === 'updates';

  // 1. Check in-memory Firestore cache
  if (isNews && cachedFirestoreWebhooks.newsWebhook && cachedFirestoreWebhooks.newsWebhook.startsWith('https://discord.com/api/webhooks/')) {
    return cachedFirestoreWebhooks.newsWebhook;
  }
  if (isAnnouncements && cachedFirestoreWebhooks.announcementsWebhook && cachedFirestoreWebhooks.announcementsWebhook.startsWith('https://discord.com/api/webhooks/')) {
    return cachedFirestoreWebhooks.announcementsWebhook;
  }

  // 2. Check process.env (Node server) or import.meta.env (client)
  if (isNews) {
    if (ENV.DISCORD_VERIFIED_NEWS_WEBHOOK_URL && ENV.DISCORD_VERIFIED_NEWS_WEBHOOK_URL.startsWith('http')) {
      return ENV.DISCORD_VERIFIED_NEWS_WEBHOOK_URL;
    }
  }

  if (isAnnouncements) {
    if (ENV.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL && ENV.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL.startsWith('http')) {
      return ENV.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL;
    }
  }

  // 3. Check browser localStorage
  if (typeof window !== 'undefined') {
    const savedAnnouncements = localStorage.getItem('gtavi_discord_announcements_webhook');
    const savedNews = localStorage.getItem('gtavi_discord_news_webhook');
    if (isNews && savedNews && savedNews.startsWith('http')) {
      return savedNews;
    }
    if (isAnnouncements && savedAnnouncements && savedAnnouncements.startsWith('http')) {
      return savedAnnouncements;
    }
    if (savedAnnouncements && savedAnnouncements.startsWith('http')) {
      return savedAnnouncements;
    }
  }

  // 4. Fallbacks
  return cachedFirestoreWebhooks.announcementsWebhook || cachedFirestoreWebhooks.newsWebhook || ENV.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL || ENV.DISCORD_VERIFIED_NEWS_WEBHOOK_URL || '';
}

/**
 * Build rich Discord embed based on event type and metadata
 */
export function buildDiscordAlertEmbed(payload: DiscordAlertPayload): DiscordEmbed {
  const portalUrl = ENV.APP_URL || 'https://viceintel.app';
  const targetUrl = payload.url 
    ? (payload.url.startsWith('http') ? payload.url : `${portalUrl}${payload.url.startsWith('/') ? '' : '/'}${payload.url}`)
    : portalUrl;

  let defaultColor = EMBED_COLORS.ANNOUNCEMENTS;
  let defaultAuthor = 'GTA VI Central • Verified Intel Network';
  let defaultIcon = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=128&q=80';

  switch (payload.eventType) {
    case 'article_drop':
    case 'newswire_update':
      defaultColor = EMBED_COLORS.VERIFIED_NEWS;
      defaultAuthor = '⚡ ROCKSTAR NEWSWIRE & INTEL DROP';
      break;
    case 'leak_verified':
      defaultColor = EMBED_COLORS.LEAK_VERIFIED;
      defaultAuthor = '🔍 100% VERIFIED VICE CITY LEAK';
      break;
    case 'vehicle_drop':
      defaultColor = EMBED_COLORS.VEHICLE_DROP;
      defaultAuthor = '🏎️ NEW VEHICLE DATABASE ENTRY';
      break;
    case 'weapon_drop':
      defaultColor = EMBED_COLORS.WEAPON_DROP;
      defaultAuthor = '🎯 NEW WEAPON DATABASE ENTRY';
      break;
    case 'map_location_drop':
      defaultColor = EMBED_COLORS.MAP_LOCATION;
      defaultAuthor = '📍 NEW MAP LOCATION DISCOVERY';
      break;
    case 'database_entry':
      defaultColor = EMBED_COLORS.DATABASE_ENTRY;
      defaultAuthor = '💾 DATABASE CATALOG UPDATE';
      break;
    case 'tuning_challenge':
      defaultColor = EMBED_COLORS.CHALLENGE;
      defaultAuthor = '🏆 TUNING CHAMPIONSHIP EVENT';
      break;
    case 'system_announcement':
      defaultColor = EMBED_COLORS.ANNOUNCEMENTS;
      defaultAuthor = '📢 OFFICIAL SYSTEM ANNOUNCEMENT';
      break;
  }

  const fields: DiscordEmbedField[] = payload.fields ? [...payload.fields] : [];

  if (payload.category) {
    fields.unshift({
      name: '📂 Category',
      value: `\`${payload.category}\``,
      inline: true
    });
  }

  if (payload.tags && payload.tags.length > 0) {
    fields.push({
      name: '🏷️ Tags',
      value: payload.tags.map(t => `\`#${t.replace(/^#/, '')}\``).slice(0, 6).join(' '),
      inline: true
    });
  }

  fields.push({
    name: '🔗 Access Intel',
    value: `[Open in ViceIntel Portal](${targetUrl})`,
    inline: false
  });

  const embed: DiscordEmbed = {
    title: payload.title,
    description: payload.description,
    url: targetUrl,
    color: payload.color || defaultColor,
    author: {
      name: payload.authorName || defaultAuthor,
      icon_url: payload.authorAvatar || defaultIcon,
      url: portalUrl
    },
    fields,
    footer: {
      text: 'ViceIntel Automated Discord Webhook Relay • Next.js & Express Real-Time Bot',
      icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80'
    },
    timestamp: new Date().toISOString()
  };

  if (payload.imageUrl) {
    embed.image = { url: payload.imageUrl };
  }

  if (payload.thumbnailUrl) {
    embed.thumbnail = { url: payload.thumbnailUrl };
  } else if (!payload.imageUrl) {
    embed.thumbnail = { url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80' };
  }

  return embed;
}

/**
 * Dispatch alert payload to Discord via custom webhook or proxy API endpoint
 */
export async function dispatchDiscordAlert(payload: DiscordAlertPayload): Promise<WebhookDispatchResult> {
  const targetChannel = payload.targetChannel || '#announcements';
  const webhookUrl = resolveWebhookUrl(targetChannel, payload.webhookUrl);

  const embed = buildDiscordAlertEmbed(payload);
  const nowIso = new Date().toISOString();

  // If executing in browser environment and direct webhook is not supplied or needs CORS proxying,
  // dispatch via backend endpoint `/api/bot/push-alert`
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    try {
      const res = await fetch('/api/bot/push-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          webhookUrl: webhookUrl || undefined
        })
      });

      const data = await res.json();
      const result: WebhookDispatchResult = {
        success: data.success || false,
        targetChannel: String(targetChannel),
        dispatchedAt: nowIso,
        statusText: data.message || (data.success ? 'Delivered via ViceIntel API Bot' : data.error || 'Failed to dispatch'),
        statusCode: res.status,
        webhookUsed: webhookUrl ? (webhookUrl.slice(0, 35) + '...') : 'Configured Backend Webhook Relay',
        error: data.success ? undefined : (data.error || 'Dispatch error'),
        embed
      };

      recordDispatchHistory(result, payload);
      return result;
    } catch (err: any) {
      console.warn('[Discord Alert Service] Client fetch exception, attempting direct fallback:', err);
    }
  }

  // Server-side direct dispatch to Discord Webhook
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    const fallbackResult: WebhookDispatchResult = {
      success: false,
      targetChannel: String(targetChannel),
      dispatchedAt: nowIso,
      statusText: `No webhook configured for channel ${targetChannel}. Configure DISCORD_ANNOUNCEMENTS_WEBHOOK_URL or DISCORD_VERIFIED_NEWS_WEBHOOK_URL in .env.`,
      webhookUsed: 'None',
      error: 'WEBHOOK_NOT_CONFIGURED',
      embed
    };
    recordDispatchHistory(fallbackResult, payload);
    return fallbackResult;
  }

  try {
    const discordBody = {
      username: 'ViceIntel Bot',
      avatar_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=128&q=80',
      content: payload.mentionRole ? `${payload.mentionRole} 🚨 **New Intel Alert Drop**` : undefined,
      embeds: [embed]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordBody)
    });

    const isSuccess = response.status >= 200 && response.status < 300;
    const responseText = isSuccess ? 'Delivered to Discord Webhook' : await response.text();

    const result: WebhookDispatchResult = {
      success: isSuccess,
      targetChannel: String(targetChannel),
      dispatchedAt: nowIso,
      statusText: isSuccess ? 'Delivered to Discord channel' : `Discord returned HTTP ${response.status}: ${responseText}`,
      statusCode: response.status,
      webhookUsed: webhookUrl.slice(0, 35) + '...',
      error: isSuccess ? undefined : responseText,
      embed
    };

    recordDispatchHistory(result, payload);
    return result;
  } catch (err: any) {
    const errorResult: WebhookDispatchResult = {
      success: false,
      targetChannel: String(targetChannel),
      dispatchedAt: nowIso,
      statusText: `Network fetch failed: ${err?.message || 'Unknown network error'}`,
      webhookUsed: webhookUrl.slice(0, 35) + '...',
      error: err?.message || 'Network exception',
      embed
    };
    recordDispatchHistory(errorResult, payload);
    return errorResult;
  }
}

/**
 * Record dispatch in memory telemetry history
 */
function recordDispatchHistory(result: WebhookDispatchResult, payload: DiscordAlertPayload) {
  const logEntry: WebhookLogEntry = {
    ...result,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    eventType: payload.eventType,
    title: payload.title
  };

  webhookDispatchHistory.unshift(logEntry);
  if (webhookDispatchHistory.length > 50) {
    webhookDispatchHistory.pop();
  }
}

// -------------------------------------------------------------
// High-Level Automated Helpers for Specific Dropped Content
// -------------------------------------------------------------

/**
 * Push an instant alert to #verified-news when an article or pSEO guide drops
 */
export async function notifyArticleDrop(article: {
  title: string;
  summary?: string;
  metaDescription?: string;
  slug: string;
  category?: string;
  imageUrl?: string;
  tags?: string[];
  isVerified?: boolean;
}): Promise<WebhookDispatchResult> {
  return await dispatchDiscordAlert({
    targetChannel: '#verified-news',
    eventType: 'article_drop',
    title: `📰 ${article.title}`,
    description: article.summary || article.metaDescription || 'New verified GTA VI intelligence guide published to ViceIntel database.',
    url: `/blog/${article.slug}`,
    category: article.category || 'Verified Intel',
    imageUrl: article.imageUrl,
    tags: article.tags || ['GTA6', 'VerifiedNews', 'RockstarGames', 'ViceCity'],
    fields: [
      {
        name: '🛡️ Verification Status',
        value: article.isVerified !== false ? '✅ **100% Fact-Checked by ViceIntel AI Spider**' : '⚠️ Community Intel / Leaks',
        inline: true
      },
      {
        name: '⚡ Access Speed',
        value: 'Instant Web Preview & Live Discussion',
        inline: true
      }
    ]
  });
}

/**
 * Push an instant alert to #announcements when a new vehicle drops
 */
export async function notifyVehicleDrop(vehicle: {
  name: string;
  category: string;
  topSpeed?: number | string;
  price?: string | number;
  acceleration?: number;
  description?: string;
  image?: string;
  drivetrain?: string;
  isConfirmedInGTA6?: boolean;
}): Promise<WebhookDispatchResult> {
  return await dispatchDiscordAlert({
    targetChannel: '#announcements',
    eventType: 'vehicle_drop',
    title: `🏎️ New Vehicle Drop: ${vehicle.name}`,
    description: vehicle.description || `New ${vehicle.category} class vehicle indexed in the GTA VI Vice City telemetry database.`,
    url: `/vehicles`,
    category: `Vehicle Database • ${vehicle.category}`,
    imageUrl: vehicle.image,
    tags: ['GTA6Vehicles', vehicle.category.replace(/\s+/g, ''), 'ViceCityMotors'],
    fields: [
      {
        name: '🏁 Class & Drivetrain',
        value: `**${vehicle.category}** • \`${vehicle.drivetrain || 'RWD'}\``,
        inline: true
      },
      {
        name: '⚡ Top Speed',
        value: vehicle.topSpeed ? `**${vehicle.topSpeed} MPH**` : 'Under Telemetry Review',
        inline: true
      },
      {
        name: '💰 Estimated MSRP',
        value: vehicle.price ? `\`${vehicle.price}\`` : 'Classified',
        inline: true
      },
      {
        name: '🎯 Confirmation',
        value: vehicle.isConfirmedInGTA6 !== false ? '✅ Confirmed in Trailer / Leak Footage' : 'Speculative Prototype',
        inline: true
      }
    ]
  });
}

/**
 * Push an instant alert to #announcements when a new weapon drops
 */
export async function notifyWeaponDrop(weapon: {
  name: string;
  category: string;
  damage?: number;
  fireRate?: number;
  price?: string | number;
  description?: string;
  image?: string;
}): Promise<WebhookDispatchResult> {
  return await dispatchDiscordAlert({
    targetChannel: '#announcements',
    eventType: 'weapon_drop',
    title: `🎯 New Weapon Drop: ${weapon.name}`,
    description: weapon.description || `New ${weapon.category} weapon specs indexed in Vice City armory.`,
    url: `/weapons`,
    category: `Armory Database • ${weapon.category}`,
    imageUrl: weapon.image,
    tags: ['GTA6Weapons', 'Armory', 'ViceCityCombat'],
    fields: [
      {
        name: '⚔️ Category',
        value: `**${weapon.category}**`,
        inline: true
      },
      {
        name: '💥 Damage Rating',
        value: weapon.damage ? `**${weapon.damage}/100**` : 'Calibrating',
        inline: true
      },
      {
        name: '💵 Black Market Cost',
        value: weapon.price ? `\`${weapon.price}\`` : 'Ammu-Nation Pricing Pending',
        inline: true
      }
    ]
  });
}

/**
 * Push an instant alert to #announcements when a tuning championship starts
 */
export async function notifyTuningChampionshipDrop(challenge: {
  title: string;
  vehicleName: string;
  trackName: string;
  targetMetric: string;
  prizePool: string;
  expiresAt: string;
}): Promise<WebhookDispatchResult> {
  return await dispatchDiscordAlert({
    targetChannel: '#announcements',
    eventType: 'tuning_challenge',
    title: `🏆 New Tuning Championship Launched: ${challenge.title}`,
    description: `Compete on the live handling physics simulator! Tune the **${challenge.vehicleName}** for **${challenge.trackName}** and claim the championship prize pool.`,
    url: `/admin?subtab=challenge-cms`,
    category: 'Tuning Championship',
    tags: ['HandlingMeta', 'Championship', 'ViceCitySpeed'],
    fields: [
      {
        name: '🏎️ Competition Vehicle',
        value: `**${challenge.vehicleName}**`,
        inline: true
      },
      {
        name: '🏁 Target Metric',
        value: `\`${challenge.targetMetric.toUpperCase()}\``,
        inline: true
      },
      {
        name: '🎁 1st Place Bounty',
        value: `💎 **${challenge.prizePool}**`,
        inline: true
      }
    ]
  });
}
