/**
 * Sentinel Growth & Marketing Engine — Commercial Access & Paywall Control
 * Handles tier capabilities, quota enforcement, and permission verification for Platform & Server Modes.
 */

export type MarketingTier = 'free' | 'starter' | 'pro' | 'mega' | 'internal_admin';

export interface TierCapabilities {
  tier: MarketingTier;
  label: string;
  priceMonthly: number;
  monthlyKeywordAudits: number; // -1 for unlimited
  monthlyCampaignDrafts: number; // -1 for unlimited
  canExportPseoMatrix: boolean;
  canGenerateViralVideoScripts: boolean;
  canGenerateRedditCampaigns: boolean;
  canGenerateDiscordEmbeds: boolean;
  canGenerateStreamerPitchKits: boolean;
  canAccessPlatformMode: boolean;
  hasPriorityDirectorySpotlight: boolean;
}

export const MARKETING_TIER_CONFIGS: Record<MarketingTier, TierCapabilities> = {
  free: {
    tier: 'free',
    label: 'Free Community Preview',
    priceMonthly: 0,
    monthlyKeywordAudits: 2,
    monthlyCampaignDrafts: 1,
    canExportPseoMatrix: false,
    canGenerateViralVideoScripts: false,
    canGenerateRedditCampaigns: true,
    canGenerateDiscordEmbeds: true,
    canGenerateStreamerPitchKits: false,
    canAccessPlatformMode: false,
    hasPriorityDirectorySpotlight: false,
  },
  starter: {
    tier: 'starter',
    label: 'Growth Starter',
    priceMonthly: 29,
    monthlyKeywordAudits: 10,
    monthlyCampaignDrafts: 5,
    canExportPseoMatrix: false,
    canGenerateViralVideoScripts: true,
    canGenerateRedditCampaigns: true,
    canGenerateDiscordEmbeds: true,
    canGenerateStreamerPitchKits: false,
    canAccessPlatformMode: false,
    hasPriorityDirectorySpotlight: false,
  },
  pro: {
    tier: 'pro',
    label: 'Growth Pro',
    priceMonthly: 49,
    monthlyKeywordAudits: -1, // Unlimited
    monthlyCampaignDrafts: -1, // Unlimited
    canExportPseoMatrix: true,
    canGenerateViralVideoScripts: true,
    canGenerateRedditCampaigns: true,
    canGenerateDiscordEmbeds: true,
    canGenerateStreamerPitchKits: false,
    canAccessPlatformMode: false,
    hasPriorityDirectorySpotlight: false,
  },
  mega: {
    tier: 'mega',
    label: 'Sentinel Mega & Streamer Studio',
    priceMonthly: 99,
    monthlyKeywordAudits: -1, // Unlimited
    monthlyCampaignDrafts: -1, // Unlimited
    canExportPseoMatrix: true,
    canGenerateViralVideoScripts: true,
    canGenerateRedditCampaigns: true,
    canGenerateDiscordEmbeds: true,
    canGenerateStreamerPitchKits: true,
    canAccessPlatformMode: true,
    hasPriorityDirectorySpotlight: true,
  },
  internal_admin: {
    tier: 'internal_admin',
    label: 'Platform Executive (Internal Admin)',
    priceMonthly: 0,
    monthlyKeywordAudits: -1,
    monthlyCampaignDrafts: -1,
    canExportPseoMatrix: true,
    canGenerateViralVideoScripts: true,
    canGenerateRedditCampaigns: true,
    canGenerateDiscordEmbeds: true,
    canGenerateStreamerPitchKits: true,
    canAccessPlatformMode: true,
    hasPriorityDirectorySpotlight: true,
  }
};

/**
 * Resolves the effective marketing tier based on user roles and server subscription status.
 */
export function resolveMarketingTier(params: {
  isAdmin?: boolean;
  isStaff?: boolean;
  serverTier?: string;
  isSubscriptionActive?: boolean;
}): TierCapabilities {
  if (params.isAdmin || params.isStaff) {
    return MARKETING_TIER_CONFIGS.internal_admin;
  }

  const rawTier = (params.serverTier || '').toLowerCase();
  
  if (params.isSubscriptionActive || rawTier) {
    if (rawTier.includes('mega') || rawTier.includes('enterprise') || rawTier === '99') {
      return MARKETING_TIER_CONFIGS.mega;
    }
    if (rawTier.includes('pro') || rawTier.includes('49')) {
      return MARKETING_TIER_CONFIGS.pro;
    }
    if (rawTier.includes('starter') || rawTier.includes('community') || rawTier === '29') {
      return MARKETING_TIER_CONFIGS.starter;
    }
  }

  return MARKETING_TIER_CONFIGS.free;
}

/**
 * Validates whether a specific marketing action is allowed for the given tier.
 */
export function verifyMarketingAccess(
  tier: TierCapabilities,
  feature: 'keyword_audit' | 'campaign_draft' | 'pseo_matrix' | 'viral_videos' | 'reddit_copy' | 'discord_copy' | 'streamer_pitch' | 'platform_mode',
  currentUsageCount = 0
): { allowed: boolean; reason?: string; requiredTier?: MarketingTier } {
  if (tier.tier === 'internal_admin') {
    return { allowed: true };
  }

  switch (feature) {
    case 'platform_mode':
      if (!tier.canAccessPlatformMode) {
        return {
          allowed: false,
          reason: 'Platform Mode is restricted to Platform Admins and Mega Enterprise subscribers.',
          requiredTier: 'mega'
        };
      }
      return { allowed: true };

    case 'streamer_pitch':
      if (!tier.canGenerateStreamerPitchKits) {
        return {
          allowed: false,
          reason: 'Streamer Outreach & Pitch Kit Studio requires the Mega Tier ($99/mo).',
          requiredTier: 'mega'
        };
      }
      return { allowed: true };

    case 'pseo_matrix':
      if (!tier.canExportPseoMatrix) {
        return {
          allowed: false,
          reason: 'Bulk pSEO matrix and Schema.org export requires the Pro Tier ($49/mo) or higher.',
          requiredTier: 'pro'
        };
      }
      return { allowed: true };

    case 'viral_videos':
      if (!tier.canGenerateViralVideoScripts) {
        return {
          allowed: false,
          reason: 'Viral Short-Form Video & Scene-by-Scene Studio requires a Growth Starter Tier ($29/mo) or higher.',
          requiredTier: 'starter'
        };
      }
      return { allowed: true };

    case 'keyword_audit':
      if (tier.monthlyKeywordAudits !== -1 && currentUsageCount >= tier.monthlyKeywordAudits) {
        return {
          allowed: false,
          reason: `Monthly keyword audit limit reached (${tier.monthlyKeywordAudits}/${tier.monthlyKeywordAudits}). Upgrade to Pro for unlimited audits.`,
          requiredTier: 'pro'
        };
      }
      return { allowed: true };

    case 'campaign_draft':
      if (tier.monthlyCampaignDrafts !== -1 && currentUsageCount >= tier.monthlyCampaignDrafts) {
        return {
          allowed: false,
          reason: `Monthly campaign draft limit reached (${tier.monthlyCampaignDrafts}/${tier.monthlyCampaignDrafts}). Upgrade to Pro for unlimited campaign generation.`,
          requiredTier: 'pro'
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}
