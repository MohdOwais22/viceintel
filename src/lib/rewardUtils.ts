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
 * Service function to check user's daily reward status.
 * Queries server API with fallback to local client storage.
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

  // 1. Try server API
  try {
    const res = await fetch(`/api/user/reward-status?uid=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const payload = await res.json();
      if (payload.success) {
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
        } catch (e) {}
        return payload;
      }
    }
  } catch (err) {
    console.warn('Server reward status API unavailable, using local cache:', err);
  }

  // 2. Local cache fallback
  const vcBalance = Number(localStorage.getItem(`gtavi_vcBalance_${userId}`) || '100');
  const rewardStreak = Number(localStorage.getItem(`gtavi_rewardStreak_${userId}`) || '0');
  const dailyStreak = Number(localStorage.getItem(`gtavi_streak_${userId}`) || '0');
  const lastClaimDate = localStorage.getItem(`gtavi_lastClaimDate_${userId}`) || '';
  const lastLogin = Number(localStorage.getItem(`gtavi_lastLogin_${userId}`) || 0);
  const lastClaimTimeMs = getTimestampFromClaimDate(lastClaimDate, lastLogin);
  const canClaim = lastClaimTimeMs <= 0 || (Date.now() - lastClaimTimeMs >= COOLDOWN_24H_MS);
  const timeRemainingMs = canClaim ? 0 : Math.max(0, COOLDOWN_24H_MS - (Date.now() - lastClaimTimeMs));
  const isVip = localStorage.getItem(`gtavi_isVip_${userId}`) === 'true';

  return {
    canClaim,
    timeRemainingMs,
    rewardStreak,
    dailyStreak,
    lastClaimDate,
    lastLogin,
    isStreakBroken: false,
    vcBalance,
    isVip
  };
}

/**
 * Service function to claim daily reward.
 * Hits the server API endpoint first, and provides full offline calculation fallback.
 */
export async function claimDailyReward(userId: string): Promise<ClaimRewardResult> {
  if (!userId) {
    throw new Error('User ID is required to claim daily reward');
  }

  // 1. Try server API
  try {
    const res = await fetch('/api/user/claim-daily-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userId })
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.success) {
        try {
          localStorage.setItem(`gtavi_vcBalance_${userId}`, String(payload.vcBalance));
          localStorage.setItem(`gtavi_lastLogin_${userId}`, String(payload.lastLogin));
          localStorage.setItem(`gtavi_streak_${userId}`, String(payload.dailyStreak));
          localStorage.setItem(`gtavi_rewardStreak_${userId}`, String(payload.rewardStreak));
          localStorage.setItem(`gtavi_lastClaimDate_${userId}`, payload.lastClaimDate);
          if (payload.autoUnlockedVip) {
            localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gtavi_profile_updated', { detail: { uid: userId, vcBalance: payload.vcBalance, dailyStreak: payload.dailyStreak } }));
          }
        } catch (e) {}
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
          message: payload.message || 'Reward cooldown active'
        };
      }
    }
  } catch (err: any) {
    console.warn('Server claim-daily-reward API offline, using resilient local calculation:', err);
  }

  // 2. Client-side fallback calculation
  const now = Date.now();
  const lastClaimDate = localStorage.getItem(`gtavi_lastClaimDate_${userId}`) || '';
  const lastLogin = Number(localStorage.getItem(`gtavi_lastLogin_${userId}`) || 0);
  const lastClaimTimeMs = getTimestampFromClaimDate(lastClaimDate, lastLogin);

  // Check 24-hour cooldown
  if (lastClaimTimeMs > 0 && (now - lastClaimTimeMs < COOLDOWN_24H_MS)) {
    const remaining = COOLDOWN_24H_MS - (now - lastClaimTimeMs);
    const curBal = Number(localStorage.getItem(`gtavi_vcBalance_${userId}`) || 100);
    return {
      success: false,
      vcBalance: curBal,
      rewardAmount: 0,
      lastLogin,
      dailyStreak: Number(localStorage.getItem(`gtavi_streak_${userId}`) || 0),
      rewardStreak: Number(localStorage.getItem(`gtavi_rewardStreak_${userId}`) || 0),
      lastClaimDate,
      timeRemainingMs: remaining,
      message: `Reward cooldown active. Available in ${Math.ceil(remaining / 60000)} minutes.`
    };
  }

  // Cooldown passed: calculate streak and rewards
  const isStreakBroken = lastClaimTimeMs > 0 && (now - lastClaimTimeMs >= 48 * 60 * 60 * 1000);
  const prevStreak = isStreakBroken ? 0 : Number(localStorage.getItem(`gtavi_streak_${userId}`) || 0);
  const newStreak = Math.min(30, prevStreak + 1);

  const isVip = localStorage.getItem(`gtavi_isVip_${userId}`) === 'true';
  const levelBonus = isVip ? 10 : 0;
  const streakBonus = Math.min(50, newStreak * 2);
  const baseSubtotal = 25 + levelBonus + streakBonus;
  const rewardAmount = isVip ? baseSubtotal * 2 : baseSubtotal;

  const currentBal = Number(localStorage.getItem(`gtavi_vcBalance_${userId}`) || 100);
  const newBalance = currentBal + rewardAmount;
  const newClaimIso = new Date(now).toISOString();
  const autoUnlockedVip = newStreak >= 30;

  // Update localStorage
  try {
    localStorage.setItem(`gtavi_vcBalance_${userId}`, String(newBalance));
    localStorage.setItem(`gtavi_lastLogin_${userId}`, String(now));
    localStorage.setItem(`gtavi_streak_${userId}`, String(newStreak));
    localStorage.setItem(`gtavi_rewardStreak_${userId}`, String(newStreak));
    localStorage.setItem(`gtavi_lastClaimDate_${userId}`, newClaimIso);
    if (isVip || autoUnlockedVip) {
      localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
    }
  } catch (e) {}

  return {
    success: true,
    vcBalance: newBalance,
    rewardAmount,
    lastLogin: now,
    dailyStreak: newStreak,
    rewardStreak: newStreak,
    lastClaimDate: newClaimIso,
    timeRemainingMs: COOLDOWN_24H_MS,
    message: `Claimed +${rewardAmount} VC! Daily streak at ${newStreak}/30.`,
    breakdown: `Base (25) + Level (${levelBonus}) + Streak (${streakBonus})${isVip ? ' x2 VIP Multiplier' : ''}`,
    userLevel: isVip ? 'L2 VIP' : 'L1 Citizen',
    levelBonus,
    streakBonus,
    isVip: isVip || autoUnlockedVip,
    autoUnlockedVip
  };
}

/**
 * Service function to claim 30-Day Streak VIP Pass.
 */
export async function claim30DayVipPass(userId: string): Promise<MilestoneClaimResult> {
  return claimStreakMilestone(userId, 30);
}

/**
 * Service function to claim streak milestone rewards (7, 14, 30 days).
 */
export async function claimStreakMilestone(
  userId: string,
  milestoneDays: 7 | 14 | 30
): Promise<MilestoneClaimResult> {
  if (!userId) {
    throw new Error('User ID is required to claim streak milestone.');
  }

  // 1. Try server API
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
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gtavi_profile_updated', { detail: { uid: userId, vcBalance: payload.vcBalance } }));
          }
        } catch (e) {}
        return payload;
      }
    }
  } catch (err) {
    console.warn('Server claim-milestone API offline, using local calculation:', err);
  }

  // 2. Client-side fallback
  const bonusMap: Record<number, number> = { 7: 150, 14: 350, 30: 1000 };
  const bonus = bonusMap[milestoneDays] || 100;
  const curBal = Number(localStorage.getItem(`gtavi_vcBalance_${userId}`) || 100);
  const newBalance = curBal + bonus;
  const now = Date.now();
  const vipUntilIso = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    localStorage.setItem(`gtavi_vcBalance_${userId}`, String(newBalance));
    localStorage.setItem(`gtavi_claimedMilestone${milestoneDays}_${userId}`, 'true');
    if (milestoneDays === 30) {
      localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
      localStorage.setItem(`gtavi_vipUntil_${userId}`, vipUntilIso);
      localStorage.setItem(`gtavi_claimed30DayVip_${userId}`, 'true');
    }
  } catch (e) {}

  return {
    success: true,
    vcBalance: newBalance,
    isVip: milestoneDays === 30 || localStorage.getItem(`gtavi_isVip_${userId}`) === 'true',
    milestoneDays,
    rewardBonus: bonus,
    vipUntilIso: milestoneDays === 30 ? vipUntilIso : undefined,
    message: `🎉 Successfully claimed ${milestoneDays}-Day Milestone bonus of +${bonus} VC!${milestoneDays === 30 ? ' VIP Pass activated for 30 Days!' : ''}`
  };
}

/**
 * Service function to convert VC in-game credits directly into a 30-Day VIP Pass.
 */
export async function convertVcToVipPass(userId: string): Promise<MilestoneClaimResult> {
  if (!userId) {
    throw new Error('User ID is required to convert VC to VIP Pass.');
  }

  // 1. Try server API
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
        } catch (e) {}
        return payload;
      }
    }
  } catch (err) {
    console.warn('Server convert-vc API offline, using local fallback:', err);
  }

  // 2. Client-side fallback
  const VIP_COST_VC = 500;
  const curBal = Number(localStorage.getItem(`gtavi_vcBalance_${userId}`) || 100);
  if (curBal < VIP_COST_VC) {
    return {
      success: false,
      vcBalance: curBal,
      isVip: localStorage.getItem(`gtavi_isVip_${userId}`) === 'true',
      milestoneDays: 0,
      rewardBonus: 0,
      message: `Insufficient VC balance. Requires ${VIP_COST_VC} VC.`
    };
  }

  const newBalance = curBal - VIP_COST_VC;
  const now = Date.now();
  const vipUntilIso = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    localStorage.setItem(`gtavi_vcBalance_${userId}`, String(newBalance));
    localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
    localStorage.setItem(`gtavi_vipUntil_${userId}`, vipUntilIso);
  } catch (e) {}

  return {
    success: true,
    vcBalance: newBalance,
    isVip: true,
    milestoneDays: 30,
    rewardBonus: 0,
    vipUntilIso,
    message: '🎉 Successfully converted 500 VC into a 30-Day VIP Pass!'
  };
}
