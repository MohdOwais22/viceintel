import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
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
}

const COOLDOWN_24H_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STREAK_RESET_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
const BASE_DAILY_REWARD_CREDITS = 25;
const VIP_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days in milliseconds

/**
  * Helper to parse timestamp from ISO date string or numeric timestamp.
  */
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

/**
 * Calculates remaining time in milliseconds until next daily reward can be claimed.
 */
export function getRewardCooldown(lastLoginTimestamp: number, lastClaimDateStr?: string): number {
  const lastClaimTimeMs = getTimestampFromClaimDate(lastClaimDateStr, lastLoginTimestamp);
  if (!lastClaimTimeMs || lastClaimTimeMs <= 0) return 0;
  const elapsed = Date.now() - lastClaimTimeMs;
  if (elapsed >= COOLDOWN_24H_MS) return 0;
  return COOLDOWN_24H_MS - elapsed;
}

/**
 * Service function to check user's daily reward status and reset rewardStreak if > 48 hours have passed.
 * Called on component mount or view load.
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

  const now = Date.now();
  const userDocRef = doc(db, 'userProfiles', userId);

  let currentVcBalance = 0;
  let lastLogin = 0;
  let dailyStreak = 0;
  let rewardStreak = 0;
  let lastClaimDate = '';
  let isVip = false;

  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.vcBalance === 'number') currentVcBalance = data.vcBalance;
      else if (typeof data.credits === 'number') currentVcBalance = data.credits;
      if (typeof data.lastLogin === 'number') lastLogin = data.lastLogin;
      if (typeof data.dailyStreak === 'number') dailyStreak = data.dailyStreak;
      if (typeof data.rewardStreak === 'number') rewardStreak = data.rewardStreak;
      else rewardStreak = dailyStreak;

      if (data.lastClaimDate) lastClaimDate = String(data.lastClaimDate);

      if (data.isVip === true) {
        if (data.vipUntil) {
          const expiry = typeof data.vipUntil === 'number' ? data.vipUntil : new Date(data.vipUntil).getTime();
          isVip = expiry > now;
        } else {
          isVip = true;
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching reward status from Firestore:', err);
  }

  const lastClaimTimeMs = getTimestampFromClaimDate(lastClaimDate, lastLogin);
  const timeSinceLastClaim = lastClaimTimeMs === 0 ? Infinity : now - lastClaimTimeMs;

  const isStreakBroken = lastClaimTimeMs > 0 && timeSinceLastClaim >= STREAK_RESET_WINDOW_MS;
  const canClaim = lastClaimTimeMs === 0 || timeSinceLastClaim >= COOLDOWN_24H_MS;
  const timeRemainingMs = canClaim ? 0 : COOLDOWN_24H_MS - timeSinceLastClaim;

  let effectiveRewardStreak = rewardStreak;
  let effectiveDailyStreak = dailyStreak;

  // If delta > 48h, reset streak to 0 in database and return reset state
  if (isStreakBroken) {
    effectiveRewardStreak = 0;
    effectiveDailyStreak = 0;

    if (rewardStreak > 0 || dailyStreak > 0) {
      try {
        await setDoc(
          userDocRef,
          {
            rewardStreak: 0,
            dailyStreak: 0,
            updatedAt: new Date(now).toISOString()
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Failed to update streak reset in Firestore:', err);
      }

      try {
        localStorage.setItem(`gtavi_rewardStreak_${userId}`, '0');
        localStorage.setItem(`gtavi_streak_${userId}`, '0');
      } catch (e) {
        console.warn('Failed to update local storage streak cache:', e);
      }
    }
  }

  return {
    canClaim,
    timeRemainingMs,
    rewardStreak: effectiveRewardStreak,
    dailyStreak: effectiveDailyStreak,
    lastClaimDate,
    lastLogin,
    isStreakBroken,
    vcBalance: currentVcBalance,
    isVip
  };
}

/**
  * Service function to check user's lastLogin in Firestore and claim daily reward if >= 24 hours have passed.
  * Exact comparison with lastClaimDate:
  * - Delta < 24h: Cooldown active
  * - 24h <= Delta < 48h: Increment streak
  * - Delta >= 48h: Missed day, reset streak to 1
  * Scaled based on user level/clearance, consecutive daily streak, and active VIP membership.
  * Automatically grants 30-Day VIP Pass when reaching a 30-day reward streak!
  */
export async function claimDailyReward(userId: string): Promise<ClaimRewardResult> {
  if (!userId) {
    throw new Error('User ID is required to claim daily reward');
  }

  const now = Date.now();
  const userDocRef = doc(db, 'userProfiles', userId);

  let currentVcBalance = 0;
  let lastLogin = 0;
  let dailyStreak = 0;
  let rewardStreak = 0;
  let lastClaimDate = '';
  let isVipActive = false;
  let currentVipUntilMs = 0;
  let userLevel = 'L1';

  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (typeof data.vcBalance === 'number') currentVcBalance = data.vcBalance;
      else if (typeof data.credits === 'number') currentVcBalance = data.credits;
      if (typeof data.lastLogin === 'number') lastLogin = data.lastLogin;
      if (typeof data.dailyStreak === 'number') dailyStreak = data.dailyStreak;
      if (typeof data.rewardStreak === 'number') rewardStreak = data.rewardStreak;
      else rewardStreak = dailyStreak; // fallback

      if (data.lastClaimDate) lastClaimDate = String(data.lastClaimDate);

      if (data.userLevel) userLevel = String(data.userLevel);
      else if (data.clearanceLevel) userLevel = String(data.clearanceLevel);
      else if (data.isAdmin) userLevel = 'Admin';
      else if (data.isMod) userLevel = 'Staff';

      // Check VIP status
      if (data.isVip === true) {
        if (data.vipUntil) {
          const expiry = typeof data.vipUntil === 'number' ? data.vipUntil : new Date(data.vipUntil).getTime();
          currentVipUntilMs = expiry;
          isVipActive = expiry > now;
        } else {
          isVipActive = true;
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch existing profile, using fallback values:', err);
  }

  // Exact comparison with lastClaimDate / lastLogin server timestamp
  const lastClaimTimeMs = getTimestampFromClaimDate(lastClaimDate, lastLogin);
  const timeSinceLastClaim = lastClaimTimeMs === 0 ? Infinity : now - lastClaimTimeMs;

  // Check 24-hour cooldown (Delta < 24h)
  if (timeSinceLastClaim < COOLDOWN_24H_MS) {
    const timeRemainingMs = COOLDOWN_24H_MS - timeSinceLastClaim;
    return {
      success: false,
      vcBalance: currentVcBalance,
      rewardAmount: 0,
      lastLogin,
      dailyStreak,
      rewardStreak,
      lastClaimDate,
      timeRemainingMs,
      message: `Reward cooldown active. Available in ${Math.ceil(timeRemainingMs / (1000 * 60))} minutes.`
    };
  }

  // Check if streak was broken (Delta >= 48h) or consecutive (24h <= Delta < 48h)
  const isStreakBroken = lastClaimTimeMs !== 0 && timeSinceLastClaim >= STREAK_RESET_WINDOW_MS;
  const newStreak = isStreakBroken || rewardStreak === 0 ? 1 : rewardStreak + 1;
  const newClaimDate = new Date(now).toISOString();

  // Account Level Scaling
  let levelBonus = 0;
  if (userLevel === 'L2') levelBonus = 10;
  else if (userLevel === 'L3') levelBonus = 20;
  else if (userLevel === 'L4' || userLevel === 'Staff' || userLevel === 'Admin' || userLevel === 'VIP') levelBonus = 30;

  // Long-Term Active Member Streak Bonus (+2 VC per streak day, max +50 VC bonus)
  const streakBonus = Math.min(50, newStreak * 2);

  const baseSubtotal = BASE_DAILY_REWARD_CREDITS + levelBonus + streakBonus;
  const rewardUnits = isVipActive ? baseSubtotal * 2 : baseSubtotal;
  const newVcBalance = currentVcBalance + rewardUnits;

  // Auto Grant VIP Pass on reaching 30 Days Streak!
  let autoUnlockedVip = false;
  let newVipUntilIso: string | undefined;
  let newVipExpiresDateStr: string | undefined;

  if (newStreak >= 30) {
    autoUnlockedVip = true;
    const baseStartMs = currentVipUntilMs > now ? currentVipUntilMs : now;
    const newVipUntilMs = baseStartMs + VIP_30_DAYS_MS;
    newVipUntilIso = new Date(newVipUntilMs).toISOString();
    newVipExpiresDateStr = newVipUntilIso.split('T')[0];
    isVipActive = true;
  }

  const breakdownText = `Base: ${BASE_DAILY_REWARD_CREDITS} VC | Level (${userLevel}): +${levelBonus} VC | Streak (Day ${newStreak}): +${streakBonus} VC${isVipActive ? ' | 2x VIP Multiplier' : ''}`;

  // Persist updated vcBalance, lastLogin, dailyStreak, rewardStreak, and lastClaimDate to Firestore
  try {
    const updatePayload: Record<string, any> = {
      vcBalance: newVcBalance,
      lastLogin: now,
      dailyStreak: newStreak,
      rewardStreak: newStreak,
      lastClaimDate: newClaimDate,
      updatedAt: new Date().toISOString()
    };

    if (autoUnlockedVip && newVipUntilIso && newVipExpiresDateStr) {
      updatePayload.isVip = true;
      updatePayload.userLevel = 'VIP';
      updatePayload.vipUntil = newVipUntilIso;
      updatePayload.vipExpires = newVipExpiresDateStr;
      updatePayload.claimed30DayVip = true;
      updatePayload.lastClaimed30DayVipStreak = newStreak;
    }

    await setDoc(userDocRef, updatePayload, { merge: true });
  } catch (err: any) {
    console.error('Error updating Firestore daily reward:', err);
    throw new Error('Failed to update reward in database: ' + (err.message || 'Unknown error'));
  }

  // Sync to local storage for instant offline availability
  try {
    localStorage.setItem(`gtavi_vcBalance_${userId}`, String(newVcBalance));
    localStorage.setItem(`gtavi_lastLogin_${userId}`, String(now));
    localStorage.setItem(`gtavi_streak_${userId}`, String(newStreak));
    localStorage.setItem(`gtavi_rewardStreak_${userId}`, String(newStreak));
    localStorage.setItem(`gtavi_lastClaimDate_${userId}`, newClaimDate);
    if (autoUnlockedVip && newVipUntilIso) {
      localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
      localStorage.setItem(`gtavi_vipUntil_${userId}`, newVipUntilIso);
    }
  } catch (e) {
    console.warn('Failed to update local storage cache', e);
  }

  let finalMsg = `Success! Granted ${rewardUnits} VC credits.`;
  if (autoUnlockedVip) {
    finalMsg += ` 🎉 30-Day Streak Reached! 30-Day VIP Pass Granted!`;
  }

  return {
    success: true,
    vcBalance: newVcBalance,
    rewardAmount: rewardUnits,
    lastLogin: now,
    dailyStreak: newStreak,
    rewardStreak: newStreak,
    lastClaimDate: newClaimDate,
    timeRemainingMs: COOLDOWN_24H_MS,
    message: finalMsg,
    breakdown: breakdownText,
    userLevel: autoUnlockedVip ? 'VIP' : userLevel,
    levelBonus,
    streakBonus,
    isVip: isVipActive,
    autoUnlockedVip
  };
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

/**
 * Service function to claim the 30-Day Streak VIP Pass reward.
 * Grants 30 Days of VIP Pass Membership (stacks/extends existing active VIP by +30 days) and 250 VC bonus.
 */
export async function claim30DayVipPass(userId: string): Promise<MilestoneClaimResult> {
  if (!userId) {
    throw new Error('User ID is required to claim the 30-Day Streak VIP Pass.');
  }

  const userDocRef = doc(db, 'userProfiles', userId);
  const now = Date.now();
  let currentVcBalance = 0;
  let dailyStreak = 30;
  let currentVipUntilMs = 0;
  let lastClaimed30DayVipStreak = 0;

  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.vcBalance === 'number') currentVcBalance = data.vcBalance;
      else if (typeof data.credits === 'number') currentVcBalance = data.credits;
      if (typeof data.dailyStreak === 'number') dailyStreak = data.dailyStreak;
      if (data.lastClaimed30DayVipStreak) lastClaimed30DayVipStreak = data.lastClaimed30DayVipStreak;

      if (data.vipUntil) {
        currentVipUntilMs = typeof data.vipUntil === 'number' ? data.vipUntil : new Date(data.vipUntil).getTime();
      }
    }
  } catch (err) {
    console.warn('Error reading profile for VIP Pass claim:', err);
  }

  if (dailyStreak < 30) {
    return {
      success: false,
      vcBalance: currentVcBalance,
      isVip: currentVipUntilMs > now,
      milestoneDays: 30,
      rewardBonus: 0,
      message: `You need a 30-day streak to unlock or extend your VIP Pass (Current Streak: ${dailyStreak} days).`
    };
  }

  // Determine new VIP Expiry date (extend existing active expiry if in future, or now + 30 days)
  const baseStartMs = currentVipUntilMs > now ? currentVipUntilMs : now;
  const newVipUntilMs = baseStartMs + VIP_30_DAYS_MS;
  const newVipUntilIso = new Date(newVipUntilMs).toISOString();
  const vipExpiresDateStr = newVipUntilIso.split('T')[0];

  const rewardBonus = 250;
  const newVcBalance = currentVcBalance + rewardBonus;

  try {
    await setDoc(
      userDocRef,
      {
        isVip: true,
        userLevel: 'VIP',
        vipUntil: newVipUntilIso,
        vipExpires: vipExpiresDateStr,
        vcBalance: newVcBalance,
        claimed30DayVip: true,
        lastClaimed30DayVipStreak: dailyStreak,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err: any) {
    console.error('Error granting 30-Day VIP Pass in Firestore:', err);
    throw new Error('Failed to update VIP status: ' + (err.message || 'Unknown error'));
  }

  try {
    localStorage.setItem(`gtavi_vcBalance_${userId}`, String(newVcBalance));
    localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
    localStorage.setItem(`gtavi_vipUntil_${userId}`, newVipUntilIso);
    localStorage.setItem(`gtavi_claimed30DayVip_${userId}`, 'true');
  } catch (e) {
    console.warn('Failed to update local storage cache for VIP Pass', e);
  }

  const formattedDate = new Date(newVipUntilMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    success: true,
    vcBalance: newVcBalance,
    isVip: true,
    milestoneDays: 30,
    rewardBonus,
    vipUntilIso: newVipUntilIso,
    message: `🎉 Success! Unlocked +30 Days of VIP Pass Membership & +${rewardBonus} VC Cash Bonus! Valid through ${formattedDate}.`
  };
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

  if (milestoneDays === 30) {
    return claim30DayVipPass(userId);
  }

  const userDocRef = doc(db, 'userProfiles', userId);
  let currentVcBalance = 0;
  let dailyStreak = 0;

  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.vcBalance === 'number') currentVcBalance = data.vcBalance;
      else if (typeof data.credits === 'number') currentVcBalance = data.credits;
      if (typeof data.dailyStreak === 'number') dailyStreak = data.dailyStreak;
      const claimedKey = `claimedMilestone${milestoneDays}`;
      if (data[claimedKey]) {
        return {
          success: false,
          vcBalance: currentVcBalance,
          isVip: !!data.isVip,
          milestoneDays,
          rewardBonus: 0,
          message: `The ${milestoneDays}-Day Streak Milestone bonus has already been claimed for this cycle!`
        };
      }
    }
  } catch (err) {
    console.warn('Error reading profile for milestone claim:', err);
  }

  if (dailyStreak < milestoneDays) {
    return {
      success: false,
      vcBalance: currentVcBalance,
      isVip: false,
      milestoneDays,
      rewardBonus: 0,
      message: `You need a ${milestoneDays}-day streak to claim this reward (Current Streak: ${dailyStreak} days).`
    };
  }

  const rewardBonus = milestoneDays === 7 ? 50 : 100;
  const newVcBalance = currentVcBalance + rewardBonus;
  const claimedKey = `claimedMilestone${milestoneDays}`;

  try {
    await setDoc(
      userDocRef,
      {
        vcBalance: newVcBalance,
        [claimedKey]: true,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err: any) {
    console.error(`Error claiming ${milestoneDays}-day milestone:`, err);
    throw new Error('Failed to update milestone reward: ' + (err.message || 'Unknown error'));
  }

  try {
    localStorage.setItem(`gtavi_vcBalance_${userId}`, String(newVcBalance));
    localStorage.setItem(`gtavi_claimedMilestone${milestoneDays}_${userId}`, 'true');
  } catch (e) {
    console.warn('Failed to cache milestone claim in localStorage', e);
  }

  return {
    success: true,
    vcBalance: newVcBalance,
    isVip: false,
    milestoneDays,
    rewardBonus,
    message: `🎉 Success! Claimed ${milestoneDays}-Day Streak Milestone Bonus (+${rewardBonus} VC)!`
  };
}

/**
 * Service function to convert 3,999 VC in-game credits directly into a $3.99 30-Day VIP Pass.
 */
export async function convertVcToVipPass(userId: string): Promise<MilestoneClaimResult> {
  if (!userId) {
    throw new Error('User ID is required to convert VC to VIP Pass.');
  }

  const VC_COST = Math.round(getVipVcGrantedNumber() * 0.2);
  const VIP_PRICE = getVipPriceNumber();
  const userDocRef = doc(db, 'userProfiles', userId);
  const now = Date.now();
  let currentVcBalance = 0;
  let currentVipUntilMs = 0;

  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.vcBalance === 'number') currentVcBalance = data.vcBalance;
      else if (typeof data.credits === 'number') currentVcBalance = data.credits;
      if (data.vipUntil) {
        currentVipUntilMs = typeof data.vipUntil === 'number' ? data.vipUntil : new Date(data.vipUntil).getTime();
      }
    }
  } catch (err) {
    console.warn('Error reading profile for VC to VIP Pass conversion:', err);
  }

  if (currentVcBalance < VC_COST) {
    return {
      success: false,
      vcBalance: currentVcBalance,
      isVip: currentVipUntilMs > now,
      milestoneDays: 0,
      rewardBonus: 0,
      message: `You need ${VC_COST.toLocaleString()} VC to convert to a $${VIP_PRICE.toFixed(2)} 30-Day VIP Pass (Current Balance: ${currentVcBalance.toLocaleString()} VC).`
    };
  }

  const baseStartMs = currentVipUntilMs > now ? currentVipUntilMs : now;
  const newVipUntilMs = baseStartMs + VIP_30_DAYS_MS;
  const newVipUntilIso = new Date(newVipUntilMs).toISOString();
  const vipExpiresDateStr = newVipUntilIso.split('T')[0];
  const newVcBalance = currentVcBalance - VC_COST;

  try {
    await setDoc(
      userDocRef,
      {
        isVip: true,
        userLevel: 'VIP',
        vipUntil: newVipUntilIso,
        vipExpires: vipExpiresDateStr,
        vcBalance: newVcBalance,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err: any) {
    console.error('Error converting VC to VIP Pass in Firestore:', err);
    throw new Error('Failed to convert VC to VIP Pass: ' + (err.message || 'Unknown error'));
  }

  try {
    localStorage.setItem(`gtavi_vcBalance_${userId}`, String(newVcBalance));
    localStorage.setItem(`gtavi_isVip_${userId}`, 'true');
    localStorage.setItem(`gtavi_vipUntil_${userId}`, newVipUntilIso);
  } catch (e) {
    console.warn('Failed to update local storage cache for VC conversion', e);
  }

  const formattedDate = new Date(newVipUntilMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    success: true,
    vcBalance: newVcBalance,
    isVip: true,
    milestoneDays: 30,
    rewardBonus: 0,
    vipUntilIso: newVipUntilIso,
    message: `🎉 Success! Converted ${VC_COST.toLocaleString()} VC into a $${VIP_PRICE.toFixed(2)} 30-Day VIP Pass Membership! Valid through ${formattedDate}.`
  };
}

