import { getVipVcGrantedNumber, getVipPriceNumber } from './vipConfig';

export interface ClaimRewardResult {
  success: boolean;
  vcBalance: number;
  rewardAmount: number;
  lastLogin: number;
  dailyStreak: number;
  rewardStreak: number;
  lastClaimDate: string;
  timeRemainingMs: number;
  message: string;
  breakdown?: string;
  userLevel?: string;
  levelBonus?: number;
  streakBonus?: number;
  isVip?: boolean;
  autoUnlockedVip?: boolean;
}

export interface UserRewardStatus {
  canClaim: boolean;
  timeRemainingMs: number;
  rewardStreak: number;
  dailyStreak: number;
  lastClaimDate: string;
  lastLogin: number;
  isStreakBroken: boolean;
  vcBalance: number;
  isVip: boolean;
  discordId?: string | null;
  discordUsername?: string | null;
  discordConnected?: boolean;
}

export interface MilestoneClaimResult {
  success: boolean;
  vcBalance: number;
  isVip: boolean;
  milestoneDays: number;
  rewardBonus: number;
  vipUntilIso?: string;
  message: string;
}

const COOLDOWN_24H_MS = 24 * 60 * 60 * 1000;

export function getTimestampFromClaimDate(claimDateStr?: string, fallbackTimestamp?: number): number {
  if (claimDateStr) {
    const parsed = Date.parse(claimDateStr);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (typeof fallbackTimestamp === 'number' && fallbackTimestamp > 0) {
    return fallbackTimestamp;
  }
  return 0;
}

export function getRewardCooldown(lastLoginTimestamp: number, lastClaimDateStr?: string): number {
  const lastClaimTimeMs = getTimestampFromClaimDate(lastClaimDateStr, lastLoginTimestamp);
  if (!lastClaimTimeMs || lastClaimTimeMs <= 0) return 0;
  const elapsed = Date.now() - lastClaimTimeMs;
  if (elapsed >= COOLDOWN_24H_MS) return 0;
  return COOLDOWN_24H_MS - elapsed;
}

/**
 * Service function to check user's daily reward status and reset rewardStreak.
 * Now securely hitting our MongoDB endpoints to bypass Firestore quota limitations!
 */
export async function checkUserRewardStatus(userId: string): Promise<UserRewardStatus> {
  if (!userId) {
    return {
      canClaim: false,
      timeRemainingMs: 0,
      rewardStreak: 0,
      dailyStreak: 0,
      lastClaimDate: '',
      lastLogin: 0,
      isStreakBroken: false,
      vcBalance: 0,
      isVip: false
    };
  }

  try {
    const res = await fetch(`/api/user/reward-status?uid=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const payload = await res.json();
      if (payload.success) {
        // Sync local storage for offline view without overwriting non-zero values with zero
        try {
          localStorage.setItem(`gtavi_vcBalance_${userId}`, String(payload.vcBalance));
          if (typeof payload.dailyStreak === 'number' && payload.dailyStreak > 0) {
            localStorage.setItem(`gtavi_streak_${userId}`, String(payload.dailyStreak));
          }
          if (typeof payload.rewardStreak === 'number' && payload.rewardStreak > 0) {
            localStorage.setItem(`gtavi_rewardStreak_${userId}`, String(payload.rewardStreak));
          }
          if (payload.lastClaimDate) {
            localStorage.setItem(`gtavi_lastClaimDate_${userId}`, payload.lastClaimDate);
          }
          localStorage.setItem(`gtavi_isVip_${userId}`, String(payload.isVip));
          if (payload.discordId) {
            localStorage.setItem('gtavi_discord_user_id', payload.discordId);
          }
          if (payload.discordUsername) {
            localStorage.setItem('gtavi_discord_username', payload.discordUsername);
          }
        } catch (e) {
          console.warn('Failed to cache reward status in localStorage', e);
        }
        return payload;
      }
    }
  } catch (err) {
    console.warn('Error fetching reward status from MongoDB API, falling back:', err);
  }

  // Safe fallback to localStorage if database API is offline
  try {
    const vcBalance = Number(localStorage.getItem(`gtavi_vcBalance_${userId}`) || '0');
    const rewardStreak = Number(localStorage.getItem(`gtavi_rewardStreak_${userId}`) || '0');
    const dailyStreak = Number(localStorage.getItem(`gtavi_streak_${userId}`) || '0');
    const lastClaimDate = localStorage.getItem(`gtavi_lastClaimDate_${userId}`) || '';
    const isVip = localStorage.getItem(`gtavi_isVip_${userId}`) === 'true';

    return {
      canClaim: false,
      timeRemainingMs: COOLDOWN_24H_MS,
      rewardStreak,
      dailyStreak,
      lastClaimDate,
      lastLogin: 0,
      isStreakBroken: false,
      vcBalance,
      isVip
    };
  } catch (err) {
    // Ultimate default
    return {
      canClaim: false,
      timeRemainingMs: COOLDOWN_24H_MS,
      rewardStreak: 0,
      dailyStreak: 0,
      lastClaimDate: '',
      lastLogin: 0,
      isStreakBroken: false,
      vcBalance: 0,
      isVip: false
    };
  }
}

/**
 * Service function to claim daily reward.
 * Hits our custom MongoDB endpoint to dodge any Firestore quota issues!
 */
export async function claimDailyReward(userId: string): Promise<ClaimRewardResult> {
  if (!userId) {
    throw new Error('User ID is required to claim daily reward');
  }

  try {
    const res = await fetch('/api/user/claim-daily-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userId })
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.success) {
        // Sync to local storage
        try {
          localStorage.setItem(`gtavi_vcBalance_${userId}`, String(payload.vcBalance));
          localStorage.setItem(`gtavi_lastLogin_${userId}`, String(payload.lastLogin));
          localStorage.setItem(`gtavi_streak_${userId}`, String(payload.dailyStreak));
          localStorage.setItem(`gtavi_rewardStreak_${userId}`, String(payload.rewardStreak));
          localStorage.setItem(`gtavi_lastClaimDate_${userId}`, payload.lastClaimDate);
          if (payload.autoUnlockedVip) {
            localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
          }
        } catch (e) {
          console.warn('Failed to update localStorage daily reward cache', e);
        }
        return payload;
      } else {
        return {
          success: false,
          vcBalance: payload.vcBalance || 0,
          rewardAmount: 0,
          lastLogin: payload.lastLogin || 0,
          dailyStreak: payload.dailyStreak || 0,
          rewardStreak: payload.rewardStreak || 0,
          lastClaimDate: payload.lastClaimDate || '',
          timeRemainingMs: payload.timeRemainingMs || COOLDOWN_24H_MS,
          message: payload.message || 'Failed to claim daily reward'
        };
      }
    }
  } catch (err: any) {
    console.error('Error claiming daily reward:', err);
  }

  throw new Error('Failed to claim daily reward from server. Please try again.');
}

/**
 * Service function to claim 30-Day Streak VIP Pass.
 * Now routed to our high-performance MongoDB endpoint!
 */
export async function claim30DayVipPass(userId: string): Promise<MilestoneClaimResult> {
  return claimStreakMilestone(userId, 30);
}

/**
 * Service function to claim streak milestone rewards (7, 14, 30 days).
 * Hits our MongoDB API endpoint!
 */
export async function claimStreakMilestone(
  userId: string,
  milestoneDays: 7 | 14 | 30
): Promise<MilestoneClaimResult> {
  if (!userId) {
    throw new Error('User ID is required to claim streak milestone.');
  }

  try {
    const res = await fetch('/api/user/claim-milestone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userId, milestoneDays })
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.success) {
        try {
          localStorage.setItem(`gtavi_vcBalance_${userId}`, String(payload.vcBalance));
          localStorage.setItem(`gtavi_claimedMilestone${milestoneDays}_${userId}`, 'true');
          if (milestoneDays === 30) {
            localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
            if (payload.vipUntilIso) {
              localStorage.setItem(`gtavi_vipUntil_${userId}`, payload.vipUntilIso);
            }
            localStorage.setItem(`gtavi_claimed30DayVip_${userId}`, 'true');
          }
        } catch (e) {
          console.warn('Failed to cache milestone claim in localStorage', e);
        }
        return payload;
      } else {
        return {
          success: false,
          vcBalance: payload.vcBalance || 0,
          isVip: payload.isVip || false,
          milestoneDays,
          rewardBonus: 0,
          message: payload.message || 'Failed to claim milestone bonus'
        };
      }
    }
  } catch (err: any) {
    console.error(`Error claiming ${milestoneDays}-day milestone:`, err);
  }

  throw new Error('Failed to claim milestone bonus from server. Please try again.');
}

/**
 * Service function to convert VC in-game credits directly into a 30-Day VIP Pass.
 * Fully backed by MongoDB REST API!
 */
export async function convertVcToVipPass(userId: string): Promise<MilestoneClaimResult> {
  if (!userId) {
    throw new Error('User ID is required to convert VC to VIP Pass.');
  }

  try {
    const res = await fetch('/api/user/convert-vc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userId })
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.success) {
        try {
          localStorage.setItem(`gtavi_vcBalance_${userId}`, String(payload.vcBalance));
          localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
          if (payload.vipUntilIso) {
            localStorage.setItem(`gtavi_vipUntil_${userId}`, payload.vipUntilIso);
          }
        } catch (e) {
          console.warn('Failed to update local storage cache for VC conversion', e);
        }
        return payload;
      } else {
        return {
          success: false,
          vcBalance: payload.vcBalance || 0,
          isVip: payload.isVip || false,
          milestoneDays: 0,
          rewardBonus: 0,
          message: payload.message || 'Failed to convert VC credits'
        };
      }
    }
  } catch (err: any) {
    console.error('Error converting VC to VIP Pass:', err);
  }

  throw new Error('Failed to convert VC credits. Please try again.');
}
