/**
 * Tiered Directory Weighted Ranking & Deterministic Daily Rotation Algorithm
 * Implements Top 5 Mega Spotlights, Daily Pro Rotation, and Strict Tiered Placement.
 */

export type SubscriptionTierType = 'mega' | 'pro' | 'starter' | 'unclaimed';

export interface DirectoryRankingOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  region?: string;
  framework?: string;
  tier?: string;
  whitelistMode?: string;
  claimedOnly?: boolean;
  dateSeed?: string; // Optional YYYY-MM-DD override for deterministic rotation testing
}

export interface RankedServerItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  framework: string;
  region: string;
  playerCount: number;
  maxPlayers: number;
  ping: number;
  connectUrl: string;
  tags: string[];
  isWhitelisted: boolean;
  whitelistMode?: string;
  isClaimed: boolean;
  ownerDiscordId?: string;
  ownerDiscordUsername?: string;
  ownerUid?: string;
  tier: SubscriptionTierType;
  tierWeight: number;
  isSubscriptionActive: boolean;
  isMegaSpotlight?: boolean;
  isProVerified?: boolean;
  isStarterVerified?: boolean;
  isUnclaimed?: boolean;
  rankingScore: number;
  dailyRotationScore: number;
  reviewSla?: string;
  logoUrl?: string;
  bannerUrl?: string;
  priorityPlacement?: {
    isBoosted?: boolean;
    badge?: string;
    expiresAt?: string;
  };
  [key: string]: any;
}

export interface DirectoryRankingResult {
  servers: RankedServerItem[];
  topSpotlightServers: RankedServerItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalServers: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  tierDistribution: {
    mega: number;
    pro: number;
    starter: number;
    unclaimed: number;
  };
  rotationDateSeed: string;
}

/**
 * Returns canonical tier classification
 */
export function resolveServerTier(server: any): SubscriptionTierType {
  if (!server) return 'unclaimed';

  const raw = String(server.tier || server.planTier || '').toLowerCase().trim();
  const isActive = Boolean(
    server.isSubscriptionActive === true ||
    (server.tierWeight && server.tierWeight > 0) ||
    ['mega', 'mega_plan', 'pro', 'pro_plan', 'starter', 'starter_plan'].includes(raw)
  );

  if (!isActive) {
    return 'unclaimed';
  }

  if (raw.includes('mega')) return 'mega';
  if (raw.includes('pro')) return 'pro';
  if (raw.includes('starter')) return 'starter';

  // Fallback by tier weight
  const weight = Number(server.tierWeight) || 0;
  if (weight >= 300) return 'mega';
  if (weight >= 200) return 'pro';
  if (weight >= 100) return 'starter';

  return 'unclaimed';
}

/**
 * Maps tier level to master priority weight
 */
export function getTierPriorityWeight(tier: SubscriptionTierType): number {
  switch (tier) {
    case 'mega':
      return 300;
    case 'pro':
      return 200;
    case 'starter':
      return 100;
    case 'unclaimed':
    default:
      return 0;
  }
}

/**
 * Simple 32-bit deterministic string hash (FNV-1a variant)
 */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0);
}

/**
 * Generates a deterministic daily rotation score [0.0 - 1.0)
 * Allows Pro ($49) and Starter ($29) tier subscribers to rotate positions
 * equitably every 24 hours at UTC midnight without jitter or database mutations.
 */
export function calculateDailyRotationScore(serverId: string, dateSeed?: string): number {
  const seedDate = dateSeed || new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const compositeKey = `${seedDate}_rotation_${serverId}`;
  const rawHash = hashString(compositeKey);
  return (rawHash % 10000) / 10000;
}

/**
 * Computes composite ranking score for deterministic ordering:
 * - Mega Tier ($199): 300,000 + player score (Guaranteed top positions)
 * - Pro Tier ($49): 200,000 + daily rotation (0-10,000) + player bonus
 * - Starter Tier ($29): 100,000 + daily rotation (0-5,000) + player bonus
 * - Unclaimed / Free: Player score only (< 50,000)
 */
export function computeServerRankingScore(
  server: any,
  tier: SubscriptionTierType,
  dailyRotationScore: number
): number {
  const baseTierWeight = getTierPriorityWeight(tier);
  const baseScore = baseTierWeight * 1000; // 300k, 200k, 100k, 0

  const playerCount = Number(server.playerCount) || 0;
  const isBoosted = server.priorityPlacement?.isBoosted ? 500 : 0;

  // Rotation weight applies to Pro (up to 10k points) and Starter (up to 5k points)
  let rotationBonus = 0;
  if (tier === 'pro') {
    rotationBonus = Math.round(dailyRotationScore * 9999);
  } else if (tier === 'starter') {
    rotationBonus = Math.round(dailyRotationScore * 4999);
  }

  // Player activity bonus (capped to prevent unverified free servers from surpassing paid tiers)
  const activityBonus = Math.min(playerCount, 999) + isBoosted;

  return baseScore + rotationBonus + activityBonus;
}

/**
 * Core Ranking and Pagination Pipeline
 */
export function rankAndPaginateServers(
  rawServers: any[],
  options: DirectoryRankingOptions = {}
): DirectoryRankingResult {
  const {
    page = 1,
    pageSize = 12,
    search = '',
    region = '',
    framework = '',
    tier: filterTier = '',
    whitelistMode = '',
    claimedOnly = false,
    dateSeed
  } = options;

  const currentSeed = dateSeed || new Date().toISOString().slice(0, 10);

  // 1. Enrich & Classify each server document, while accumulating tier statistics
  const tierDistribution = {
    mega: 0,
    pro: 0,
    starter: 0,
    unclaimed: 0
  };

  const enrichedServers: RankedServerItem[] = rawServers.map((raw) => {
    const id = String(raw.id || raw.slug || Math.random().toString(36).substring(2, 9));
    const slug = String(raw.slug || raw.id || id);
    const tier = resolveServerTier(raw);
    const tierWeight = getTierPriorityWeight(tier);
    const dailyRotationScore = calculateDailyRotationScore(id, currentSeed);
    const rankingScore = computeServerRankingScore(raw, tier, dailyRotationScore);

    // Track tier distribution in single pass
    tierDistribution[tier]++;

    const isClaimed = Boolean(raw.isClaimed || raw.ownerDiscordId || raw.claimedByDiscordId || tierWeight > 0);
    const isSubscriptionActive = Boolean(raw.isSubscriptionActive || tierWeight > 0);

    return {
      ...raw,
      id,
      slug,
      name: raw.name || 'GTA VI RP Community Server',
      description: raw.description || 'Verified FiveM Roleplay server for GTA VI enthusiasts.',
      framework: raw.framework || 'QB-Core',
      region: raw.region || 'North America (US-East)',
      playerCount: Number(raw.playerCount) || 0,
      maxPlayers: Number(raw.maxPlayers) || 128,
      ping: Number(raw.ping) || 32,
      connectUrl: raw.connectUrl || 'play.viceintel.net:30120',
      tags: Array.isArray(raw.tags) ? raw.tags : ['RealisticEconomy', 'CustomCars', 'ActivePolice'],
      isWhitelisted: raw.isWhitelisted !== false,
      whitelistMode: raw.whitelistMode || (raw.isWhitelisted ? 'ai_fast_track' : 'open_public'),
      isClaimed,
      ownerDiscordId: raw.ownerDiscordId || raw.claimedByDiscordId,
      ownerDiscordUsername: raw.ownerDiscordUsername || raw.claimedByDiscordUsername,
      tier,
      tierWeight,
      isSubscriptionActive,
      isMegaSpotlight: tier === 'mega',
      isProVerified: tier === 'pro',
      isStarterVerified: tier === 'starter',
      isUnclaimed: tier === 'unclaimed',
      rankingScore,
      dailyRotationScore,
      reviewSla: raw.reviewSla || (tier === 'mega' ? 'Instant AI (15s)' : tier === 'pro' ? '1–2 Hours' : '24–48 Hours')
    };
  });

  // 2. Filter Pipeline with pre-normalized search tokens
  const queryLower = search ? search.toLowerCase().trim() : '';
  const regionLower = region && region !== 'all' ? region.toLowerCase() : '';
  const frameworkLower = framework && framework !== 'all' ? framework.toLowerCase() : '';

  const filtered = enrichedServers.filter((server) => {
    if (queryLower) {
      const matchName = server.name.toLowerCase().includes(queryLower);
      const matchDesc = server.description.toLowerCase().includes(queryLower);
      const matchTags = server.tags.some((t: string) => t.toLowerCase().includes(queryLower));
      if (!matchName && !matchDesc && !matchTags) return false;
    }

    if (regionLower) {
      if (!server.region.toLowerCase().includes(regionLower)) return false;
    }

    if (frameworkLower) {
      if (server.framework.toLowerCase() !== frameworkLower) return false;
    }

    if (filterTier && filterTier !== 'all') {
      if (server.tier !== filterTier) return false;
    }

    if (whitelistMode && whitelistMode !== 'all') {
      if (whitelistMode === 'open_public' && server.isWhitelisted) return false;
      if (whitelistMode === 'whitelisted' && !server.isWhitelisted) return false;
    }

    if (claimedOnly && !server.isClaimed) {
      return false;
    }

    return true;
  });

  // 3. Strict Tiered Sorting Algorithm
  // Tier 300 (Mega) -> Tier 200 (Pro rotated) -> Tier 100 (Starter rotated) -> Tier 0 (Unclaimed)
  const sorted = [...filtered].sort((a, b) => {
    if (b.rankingScore !== a.rankingScore) {
      return b.rankingScore - a.rankingScore;
    }
    return (b.playerCount || 0) - (a.playerCount || 0);
  });

  // 4. Extract Top 5 Mega Spotlights (early exit after 5)
  const topSpotlightServers: RankedServerItem[] = [];
  for (const s of sorted) {
    if (s.tier === 'mega') {
      topSpotlightServers.push(s);
      if (topSpotlightServers.length === 5) break;
    }
  }

  // 5. Pagination
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 12);
  const totalServers = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalServers / safePageSize));
  const startIndex = (safePage - 1) * safePageSize;
  const paginatedServers = sorted.slice(startIndex, startIndex + safePageSize);

  return {
    servers: paginatedServers,
    topSpotlightServers,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalServers,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1
    },
    tierDistribution,
    rotationDateSeed: currentSeed
  };
}
