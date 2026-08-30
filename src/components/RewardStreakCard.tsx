'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle,
  Flame,
  Zap,
  ShieldCheck,
  Award,
  Crown,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Gift
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { claimDailyReward, claim30DayVipPass } from '../lib/rewardUtils';
import { usePricingConfig } from '../lib/vipConfig';

export interface RewardStreakCardProps {
  userId: string;
  initialLevel?: 'L1' | 'L2';
  initialVcBalance?: number;
  initialStreakCount?: number;
  initialLastClaimedTimestamp?: number | null;
  initialIsVipUnlockReady?: boolean;
  initialVipUnlockTriggeredAt?: number | null;
  initialIsVipMember?: boolean;
  initialVipExpiresAt?: number | null;
  onRewardClaimed?: (data: any) => void;
  onVipClaimed?: () => void;
}

const COOLDOWN_24H_MS = 24 * 60 * 60 * 1000;
const VIP_OFFER_WINDOW_72H_MS = 72 * 60 * 60 * 1000;

export const RewardStreakCard: React.FC<RewardStreakCardProps> = ({
  userId,
  initialLevel = 'L1',
  initialVcBalance = 0,
  initialStreakCount = 0,
  initialLastClaimedTimestamp = null,
  initialIsVipUnlockReady = false,
  initialVipUnlockTriggeredAt = null,
  initialIsVipMember = false,
  initialVipExpiresAt = null,
  onRewardClaimed,
  onVipClaimed
}) => {
  const pricing = usePricingConfig();
  const [level, setLevel] = useState<'L1' | 'L2'>(initialLevel);
  const [vcBalance, setVcBalance] = useState<number>(initialVcBalance);
  const [streakCount, setStreakCount] = useState<number>(initialStreakCount);
  const [lastClaimedTimestamp, setLastClaimedTimestamp] = useState<number | null>(initialLastClaimedTimestamp);
  const [isVipUnlockReady, setIsVipUnlockReady] = useState<boolean>(initialIsVipUnlockReady);
  const [vipUnlockTriggeredAt, setVipUnlockTriggeredAt] = useState<number | null>(initialVipUnlockTriggeredAt);
  const [isVipMember, setIsVipMember] = useState<boolean>(initialIsVipMember);
  const [vipExpiresAt, setVipExpiresAt] = useState<number | null>(initialVipExpiresAt);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const [now, setNow] = useState<number>(Date.now());

  // Real-time ticking clock for timers
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Firestore Sync
  useEffect(() => {
    if (!userId) return;

    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.level === 'L1' || data.level === 'L2') setLevel(data.level);
          if (typeof data.vcBalance === 'number') setVcBalance(data.vcBalance);
          if (typeof data.streakCount === 'number') setStreakCount(data.streakCount);
          if (data.lastClaimedTimestamp) setLastClaimedTimestamp(data.lastClaimedTimestamp);
          if (typeof data.isVipUnlockReady === 'boolean') setIsVipUnlockReady(data.isVipUnlockReady);
          if (data.vipUnlockTriggeredAt) setVipUnlockTriggeredAt(data.vipUnlockTriggeredAt);
          if (typeof data.isVipMember === 'boolean') setIsVipMember(data.isVipMember);
          if (data.vipExpiresAt) setVipExpiresAt(data.vipExpiresAt);
        }
      },
      (err) => {
        console.warn('Firestore subscription fallback:', err);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Calculations
  const timeSinceLastClaim = lastClaimedTimestamp ? now - lastClaimedTimestamp : Infinity;
  const isCooldownActive = timeSinceLastClaim < COOLDOWN_24H_MS;
  const cooldownRemainingMs = isCooldownActive ? COOLDOWN_24H_MS - timeSinceLastClaim : 0;

  // 72-Hour Timer Calculation
  const timeSinceVipTriggered = isVipUnlockReady && vipUnlockTriggeredAt ? now - vipUnlockTriggeredAt : 0;
  const is72hOfferActive = isVipUnlockReady && vipUnlockTriggeredAt && timeSinceVipTriggered < VIP_OFFER_WINDOW_72H_MS;
  const offerTimeRemainingMs = is72hOfferActive ? VIP_OFFER_WINDOW_72H_MS - timeSinceVipTriggered : 0;

  // Helper formatting for timers
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00h 00m 00s';
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  // VC Earnings per claim:
  // L1: 50 base + 0 level + streak -> ~66 VC/day average (60 days to 3,999 VC)
  // L2: 50 base + 22 level + streak -> ~88 VC/day average (45 days to 3,999 VC)
  const nextStreakValue = streakCount >= 30 ? 30 : Math.min(30, streakCount + 1);
  const baseVc = 50;
  const levelBonus = level === 'L2' ? 22 : 0;
  const nextClaimRewardVc = baseVc + levelBonus + Math.min(nextStreakValue, 30);

  // Handle Daily VC Claim
  const handleDailyClaim = async () => {
    if (!userId) return;
    setIsLoading(true);
    setFeedback(null);

    try {
      const data = await claimDailyReward(userId);

      if (!data.success) {
        setFeedback({
          type: 'error',
          message: data.message || 'Failed to claim daily reward. Please try again.'
        });
        if (data.timeRemainingMs && data.timeRemainingMs > 0) {
          setLastClaimedTimestamp(Date.now() - (COOLDOWN_24H_MS - data.timeRemainingMs));
        }
        return;
      }

      setVcBalance(data.vcBalance);
      setStreakCount(data.rewardStreak || data.dailyStreak);
      setLastClaimedTimestamp(data.lastLogin || Date.now());
      setIsVipUnlockReady((data.rewardStreak || data.dailyStreak) >= 30);
      if (data.autoUnlockedVip) {
        setIsVipMember(true);
      }

      setFeedback({
        type: 'success',
        message: data.message || `Claimed +${data.rewardAmount} VC! Daily streak at ${data.dailyStreak}/30.`
      });

      onRewardClaimed?.({
        vcBalance: data.vcBalance,
        streakCount: data.rewardStreak || data.dailyStreak,
        rewardVcAmount: data.rewardAmount,
        lastClaimedTimestamp: data.lastLogin
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Error claiming daily reward.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle VIP Membership Claim
  const handleClaimVip = async () => {
    if (!userId) return;
    setIsLoading(true);
    setFeedback(null);

    try {
      const data = await claim30DayVipPass(userId);

      if (!data.success) {
        setFeedback({
          type: 'error',
          message: data.message || 'VIP offer expired or unavailable.'
        });
        return;
      }

      setIsVipMember(true);
      if (data.vipUntilIso) {
        setVipExpiresAt(new Date(data.vipUntilIso).getTime());
      }
      setVcBalance(data.vcBalance);
      setIsVipUnlockReady(false);
      setVipUnlockTriggeredAt(null);

      setFeedback({
        type: 'success',
        message: data.message || '🎉 30-Day VIP Pass activated!'
      });

      onVipClaimed?.();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Error claiming VIP pass.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md text-zinc-100 space-y-5 relative overflow-hidden">
      {/* Background Neon Accent Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & User Tier Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black tracking-wide bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-400 bg-clip-text text-transparent">
              GTA VI DAILY VC & VIP STREAK REWARDS
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Build consecutive daily logins up to Day 30 to unlock a 30-Day VIP Pass.
          </p>
        </div>

        {/* User Assigned Level Badge (Read-only) */}
        <div className="flex items-center bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 self-start sm:self-auto">
          {level === 'L2' ? (
            <span className="text-amber-300 font-extrabold text-xs flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Engaged Tier (~88 VC/d)
            </span>
          ) : (
            <span className="text-cyan-400 font-extrabold text-xs flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-400" /> Standard Tier (~66 VC/d)
            </span>
          )}
        </div>
      </div>

      {/* Main Stats Grid: VC Balance & Streak Count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* VC Balance Tile */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Accumulated Balance
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight flex items-center gap-1">
              {vcBalance.toLocaleString('en-US')} <span className="text-xs text-emerald-500">VC</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        {/* Current Daily Streak */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Daily Streak Count
            </span>
            <div className="text-2xl font-black text-rose-400 font-mono tracking-tight flex items-center gap-1">
              {streakCount} <span className="text-xs text-zinc-500">/ 30 Days</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* Earning Speed & Days to Dynamic VC Milestone */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              Tier Earning Pace
            </span>
            <div className="text-sm font-bold text-amber-300 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              {(() => {
                const targetVc = Math.round((pricing.vipVcValue || 19995) * 0.2);
                const days = level === 'L1' ? Math.round(targetVc / 66) : Math.round(targetVc / 88);
                const label = (targetVc / 1000).toFixed(1) + 'k';
                const rate = level === 'L1' ? '~66 VC/Day' : '~88 VC/Day';
                return `${rate} (${days}d to ${label})`;
              })()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Progress Bar (streakCount / 30) */}
      <div className="space-y-2 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="text-zinc-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500" /> Day 30 VIP Streak Progress:
          </span>
          <span className="text-amber-400 font-mono">
            {streakCount} / 30 Days ({Math.min(100, Math.round((streakCount / 30) * 100))}%)
          </span>
        </div>

        {/* Progress Fill */}
        <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5 relative">
          <div
            className={`h-full rounded-full transition-all duration-1000 shadow-md ${
              streakCount >= 30
                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 shadow-amber-500/40 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 shadow-cyan-500/20'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (streakCount / 30) * 100))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 font-semibold">
          <span>Day 1 (Start)</span>
          <span>Day 15 (Midway)</span>
          <span className="text-amber-400 font-bold">Day 30 (Hard Stop / VIP Unlock)</span>
        </div>
      </div>

      {/* 72-Hour VIP Warning Countdown Banner (When Day 30 Reached) */}
      {is72hOfferActive && (
        <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-zinc-900 border-2 border-amber-500/60 rounded-xl p-4 space-y-3 relative overflow-hidden animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" /> 72-HOUR VIP OFFER COUNTDOWN
                </h4>
                <span className="text-base font-black text-amber-400 font-mono bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-amber-500/40">
                  {formatCountdown(offerTimeRemainingMs)}
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                You reached Day 30! <strong className="text-amber-300">Claim 30-Day VIP Pass within 72 hours</strong> or the VIP offer expires.
                If unclaimed, your streak resets to 0 but <strong className="text-emerald-400">your accumulated VC balance will stay safe!</strong>
              </p>
            </div>
          </div>

          {/* Primary Claim VIP Membership Button */}
          <button
            onClick={handleClaimVip}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5 fill-zinc-950" />
            {isLoading ? 'Processing VIP Activation...' : 'Claim 30-Day VIP Membership & Reset Streak'}
          </button>
        </div>
      )}

      {/* VIP Active Status Badge */}
      {isVipMember && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-emerald-300">30-Day VIP Membership Active</span>
              {vipExpiresAt && (
                <p className="text-[10px] text-zinc-400">
                  Expires: {new Date(vipExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase rounded-md">
            VIP ACTIVE
          </span>
        </div>
      )}

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Action Bar: Claim Today's Reward */}
      {!is72hOfferActive && (
        <div className="pt-2">
          {isCooldownActive ? (
            <button
              disabled
              className="w-full py-3.5 px-4 bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 font-bold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-zinc-500" />
              Daily Claim Cooldown Active ({formatCountdown(cooldownRemainingMs)} remaining)
            </button>
          ) : (
            <button
              onClick={handleDailyClaim}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 fill-zinc-950" />
              {isLoading ? 'Claiming Daily VC...' : `Claim Today's VC Reward (+${nextClaimRewardVc} VC)`}
            </button>
          )}
        </div>
      )}

      {/* Rules Footer */}
      <div className="text-[11px] text-zinc-500 space-y-1 pt-1 border-t border-zinc-800/60">
        <p className="flex items-center gap-1 text-zinc-400 font-semibold">
          <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> System Rules & Constraints:
        </p>
        <ul className="list-disc list-inside space-y-0.5 text-[10px] pl-1">
          <li>Daily streak hard stops at Day 30 and cannot exceed Day 30.</li>
          <li>At Day 30, a 72-hour VIP claim window unlocks.</li>
          <li>Claiming VIP grants 30 days VIP, a +250 VC cash bonus, and keeps your accumulated VC balance safe!</li>
          <li>If 72 hours expire unclaimed, streak resets to 0 but accumulated VC balance remains safe.</li>
        </ul>
      </div>
    </div>
  );
};

export default RewardStreakCard;
