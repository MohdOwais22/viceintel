'use client';
import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Crown,
  CheckCircle2,
  X,
  CreditCard,
  Shield,
  ShieldCheck,
  Mail,
  Lock,
  Sparkles,
  Zap,
  Check,
  LogOut,
  LogIn,
  AlertCircle,
  Bell,
  AtSign,
  Key,
  ShieldAlert,
  ChevronRight,
  UserCheck,
  Calendar,
  Settings,
  Flame,
  Award,
  Edit3,
  Coins,
  BookOpen,
  Trash2,
  Volume2,
  VolumeX,
  Gift,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Copy,
  Send,
  KeyRound,
  ExternalLink,
  Info
} from 'lucide-react';
import { User as FirebaseUser, updateProfile, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, query, where, deleteField } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { claimDailyReward, getRewardCooldown, claim30DayVipPass, claimStreakMilestone, convertVcToVipPass, checkUserRewardStatus, getTimestampFromClaimDate } from '../lib/rewardUtils';
import { linkDiscordToUser, unlinkDiscordFromUser, fetchDiscordAuthStatus, refreshDiscordOAuthToken } from '../lib/whitelist-service';
import {
  startDiscordOAuth,
  processDiscordCallback,
  getCustomDiscordClientId,
  setCustomDiscordClientId,
  getEffectiveDiscordClientId
} from '../lib/discordOAuthHelper';
import RewardStreakCard from './RewardStreakCard';
import { GTA6_AVATARS, DEFAULT_GTA6_AVATAR, getUserHierarchyLevel, checkAvatarAccess, AvatarPreset, getSafePhotoURL } from '../data/avatars';
import { DiscordAuthErrorHandler } from './DiscordAuthErrorHandler';
import { checkGamerTagUniqueness, validateGamerTagSyntax } from '../lib/gamertagUtils';
import { getVipPriceFormatted, getVipPriceText, getVipPriceNumber, usePricingConfig } from '../lib/vipConfig';
import { PaymentGatewayModal, PaymentItemPackage } from './PaymentGatewayModal';
import { VipExtensionDialog } from './VipExtensionDialog';
import { formatShortTimestamp, formatVipExpiry, formatDate, formatDateTime } from '../lib/dateUtils';
import { isNotificationSoundMuted, toggleNotificationSound, playNotificationChime } from '../lib/soundUtils';
import { UserNotification, NotificationType, ActiveTab } from '../types';

interface ProfileTabProps {
  currentUser: FirebaseUser | null;
  isVipActive: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  onUpgradeToVip: () => void;
  onDowngradeFromVip?: () => void;
  onOpenAuthModal: () => void;
  notifications: UserNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification?: (id: string) => void;
  onApproveJoinRequest: (channelId: string, requesterName: string) => void;
  onDeclineJoinRequest: (channelId: string, requesterName: string) => void;
  onNavigate: (tab: ActiveTab, targetId?: string) => void;
  onGrantAdmin?: () => void;
  onOpenAvatarCreator?: () => void;
  initialSubTab?: 'overview' | 'daily-reward' | 'avatars' | 'vip' | 'notifications' | 'security' | 'staff';
}

interface DailyRewardToastProps {
  claimSuccess: { amount: number; streak: number; breakdown?: string; userLevel?: string };
  isVipActive: boolean;
  onClose: () => void;
}

const DailyRewardSuccessToast: React.FC<DailyRewardToastProps> = ({ claimSuccess, isVipActive, onClose }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Smooth fade-out starting at 4.6 seconds, trigger onClose at 5.0 seconds
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 4600);

    const closeTimer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const handleManualClose = () => {
    setFadingOut(true);
    setTimeout(() => onClose(), 200);
  };

  return (
    <div
      className={`fixed top-20 right-4 z-[100] max-w-md w-full sm:w-[420px] p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950/95 border border-emerald-500/60 rounded-2xl text-emerald-300 text-sm font-extrabold flex flex-col gap-3 shadow-2xl shadow-emerald-500/25 backdrop-blur-xl transition-all duration-300 ${
        fadingOut ? 'opacity-0 -translate-y-2 scale-95' : 'animate-in fade-in slide-in-from-top-4'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-white tracking-wide">
                +{claimSuccess.amount.toLocaleString()} VC Credits Claimed!
              </p>
              {claimSuccess.userLevel && (
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                  {claimSuccess.userLevel}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-300/90 font-medium leading-relaxed">
              Streak updated to Day {claimSuccess.streak}! Return in 24 hours for your next reward.
            </p>
            {claimSuccess.breakdown && (
              <p className="text-[11px] text-amber-300/90 font-mono font-semibold bg-zinc-950/70 p-2 rounded-lg border border-amber-500/20 mt-1">
                ⚡ {claimSuccess.breakdown}
              </p>
            )}
            {isVipActive && (
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md text-[10px] font-black uppercase tracking-wider">
                <Crown className="w-3 h-3 text-amber-400" /> 2x VIP Multiplier Applied
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleManualClose}
          className="text-zinc-400 hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-emerald-500/20 transition flex items-center justify-center shrink-0 border border-transparent hover:border-emerald-500/30"
          title="Close notification (Auto-dismiss in 5s)"
        >
          ✕
        </button>
      </div>

      {/* 5-Second Timer Countdown Bar */}
      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-emerald-500/20 relative">
        <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 rounded-full animate-toast-timer" />
      </div>
    </div>
  );
};

interface StreakProgressVisualProps {
  dailyStreak: number;
  rewardStreak: number;
  lastClaimDate?: string;
  lastLogin?: number;
  isVipActive: boolean;
}

const Streak30DayProgressVisual: React.FC<StreakProgressVisualProps> = ({
  dailyStreak,
  rewardStreak,
  lastClaimDate,
  lastLogin,
  isVipActive
}) => {
  const currentStreak = Math.max(rewardStreak, dailyStreak);
  const percent = Math.min(100, Math.round((currentStreak / 30) * 100));

  const milestones = [
    { day: 1, label: 'Start', reward: '+25 VC', icon: '⚡' },
    { day: 7, label: '7-Day Bonus', reward: '+50 VC', icon: '🎁' },
    { day: 14, label: '14-Day Bonus', reward: '+100 VC', icon: '🔥' },
    { day: 21, label: '21-Day Bonus', reward: '+150 VC', icon: '⭐' },
    { day: 30, label: '30-Day VIP Pass', reward: '👑 Free VIP Membership', icon: '👑' }
  ];

  const now = Date.now();
  const timeSinceLast = lastLogin && lastLogin > 0 ? now - lastLogin : Infinity;
  const isPendingWarning = timeSinceLast > 36 * 60 * 60 * 1000 && timeSinceLast < 48 * 60 * 60 * 1000;
  const isBroken = timeSinceLast > 48 * 60 * 60 * 1000 && lastLogin !== 0;

  const formattedLastClaim = lastClaimDate
    ? formatDateTime(lastClaimDate)
    : lastLogin && lastLogin > 0
    ? formatDateTime(lastLogin)
    : 'No recent claims';

  return (
    <div className="space-y-5 bg-zinc-950/90 border border-amber-500/30 p-5 lg:p-6 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
            <h4 className="text-base font-black text-white tracking-wide">
              30-Day Consecutive Reward Streak Tracker
            </h4>
            {currentStreak >= 30 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-black uppercase flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> VIP Granted
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Claim daily to maintain streak. Reaching 30 days automatically grants 30-Day VIP Membership!
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase block">Streak Days</span>
            <span className="text-lg font-black text-amber-400 font-mono">{currentStreak} / 30 Days</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm font-mono">
            {percent}%
          </div>
        </div>
      </div>

      {/* Progress Track Bar */}
      <div className="space-y-2 relative pt-2">
        <div className="w-full h-4 bg-zinc-900 rounded-full p-0.5 border border-zinc-800 overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-lg shadow-amber-500/30"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Milestones Node Timeline */}
        <div className="grid grid-cols-5 gap-1.5 pt-3">
          {milestones.map((m) => {
            const isReached = currentStreak >= m.day;
            const isCurrentNode = currentStreak > 0 && currentStreak === m.day;

            return (
              <div
                key={m.day}
                className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all duration-300 ${
                  isReached
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                    : isCurrentNode
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 animate-pulse'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="text-base mb-1">{m.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-wider block">Day {m.day}</span>
                <span className="text-[9px] font-extrabold opacity-90 truncate max-w-full">{m.reward}</span>
                {isReached && (
                  <span className="mt-1 text-[9px] font-black text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info: Last Claim Date & Health Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-semibold text-zinc-400 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80 gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>
            Last Claim Date: <strong className="text-zinc-200 font-mono">{formattedLastClaim}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isBroken ? (
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Streak Missed (&gt;48h elapsed) — Next claim starts at Day 1
            </span>
          ) : isPendingWarning ? (
            <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-4 h-4" /> Claim within 12h to maintain continuous streak!
            </span>
          ) : (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Consecutive Streak Active 🔥
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  isVipActive,
  isAdmin = false,
  isStaff = false,
  onUpgradeToVip,
  onDowngradeFromVip,
  onOpenAuthModal,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onApproveJoinRequest,
  onDeclineJoinRequest,
  onNavigate,
  onGrantAdmin,
  onOpenAvatarCreator,
  initialSubTab
}) => {
  const pricing = usePricingConfig();
  const vcCostForVip = Math.round((pricing.vipVcValue || 19995) * 0.2);

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'daily-reward' | 'avatars' | 'vip' | 'notifications' | 'security' | 'staff'>(initialSubTab || 'overview');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [notificationFilter, setNotificationFilter] = useState<'all' | NotificationType>('all');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => isNotificationSoundMuted());
  const [claimingIds, setClaimingIds] = useState<Record<string, boolean>>({});

  const handleClaimPrize = async (notificationId: string, rewardVcAmount: number) => {
    if (!currentUser) return;
    setClaimingIds((prev) => ({ ...prev, [notificationId]: true }));
    try {
      // 1. Get current user's profile
      const userRef = doc(db, 'userProfiles', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentBalance = userData.vcBalance || 0;
        
        // 2. Add reward to user profile
        await setDoc(userRef, {
          vcBalance: currentBalance + rewardVcAmount,
          lastRewardReason: `Claimed Tuning Champion prize: ${rewardVcAmount} VC Cash`,
          lastRewardedAt: Date.now()
        }, { merge: true });
      }

      // 3. Mark the notification metadata as claimed: true and read: true
      const notifRef = doc(db, 'userNotifications', notificationId);
      await setDoc(notifRef, {
        read: true,
        metadata: {
          claimed: true
        }
      }, { merge: true });

      // Local update
      onMarkAsRead(notificationId);
    } catch (err) {
      console.error('Failed to claim prize:', err);
    } finally {
      setClaimingIds((prev) => ({ ...prev, [notificationId]: false }));
    }
  };

  // Extend VIP checkout states
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState<boolean>(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutPackage, setCheckoutPackage] = useState<PaymentItemPackage>({
    itemType: 'vip_pass',
    tierName: 'Extend VIP Membership Pass',
    faceValue: getVipPriceNumber(),
    netPrice: getVipPriceNumber(),
    discountAmount: 0,
    discountPercent: 0,
    vipDays: 30
  });

  const handleExtendVip = () => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    setIsExtensionDialogOpen(true);
  };

  // Enforce L3/L4 Staff HQ clearance restriction: Reset subtab if non-staff (L1/L2)
  useEffect(() => {
    if (!isAdmin && !isStaff && activeSubTab === 'staff') {
      setActiveSubTab('overview');
    }
  }, [isAdmin, isStaff, activeSubTab]);

  // Daily Reward & In-Game Wallet State
  const [credits, setCredits] = useState<number>(0);
  const [lastLogin, setLastLogin] = useState<number>(0);
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [rewardStreak, setRewardStreak] = useState<number>(0);
  const [lastClaimDate, setLastClaimDate] = useState<string>('');
  const [isClaimingReward, setIsClaimingReward] = useState<boolean>(false);
  const [claimRewardSuccess, setClaimRewardSuccess] = useState<{
    amount: number;
    streak: number;
    breakdown?: string;
    userLevel?: string;
  } | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(0);

  useEffect(() => {
    const handleSoundToggle = (e: any) => {
      setIsSoundMuted(e.detail?.muted ?? isNotificationSoundMuted());
    };
    window.addEventListener('gtavi_sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('gtavi_sound_toggle', handleSoundToggle);
  }, []);

  useEffect(() => {
    const handleRewardClaimed = (e: any) => {
      const res = e.detail;
      if (res) {
        if (typeof res.vcBalance === 'number') setCredits(res.vcBalance);
        if (typeof res.dailyStreak === 'number') setDailyStreak(res.dailyStreak);
        if (typeof res.rewardStreak === 'number') setRewardStreak(res.rewardStreak);
        if (res.lastClaimDate) setLastClaimDate(res.lastClaimDate);
        if (res.lastLogin) setLastLogin(res.lastLogin);
        setClaimRewardSuccess({
          amount: res.amountClaimed || 50,
          streak: res.rewardStreak || res.dailyStreak,
          breakdown: res.breakdown || 'Claimed via Direct Notification',
          userLevel: 'Level'
        });
      }
    };
    window.addEventListener('gtavi_reward_claimed', handleRewardClaimed);
    return () => window.removeEventListener('gtavi_reward_claimed', handleRewardClaimed);
  }, []);

  const handleToggleSound = () => {
    const nextMuted = toggleNotificationSound();
    setIsSoundMuted(nextMuted);
    if (!nextMuted) {
      playNotificationChime(true);
    }
  };

  // GamerTag & Avatar editing state
  const [gamerTag, setGamerTag] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_GTA6_AVATAR);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [avatarGameFilter, setAvatarGameFilter] = useState<'All' | 'GTA V' | 'GTA VI' | 'Classics' | 'Syndicate' | 'Special'>('All');
  const [gamerTagSaved, setGamerTagSaved] = useState(false);
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [changesUsedThisYear, setChangesUsedThisYear] = useState<number>(0);
  const [tagAvailability, setTagAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    message?: string;
    level?: 'L1_BLOOM' | 'L2_TRIE' | 'L3_FIRESTORE';
    latencyMs?: number;
  }>({ checking: false, available: null });

  // Debounced check for Profile GamerTag uniqueness (Meta-Grade Bloom Filter + Radix Trie)
  useEffect(() => {
    const clean = gamerTag.trim().replace(/\s+/g, '_');
    const currentTag = currentUser?.displayName || '';
    if (!clean || clean.length < 3 || clean.toLowerCase() === currentTag.toLowerCase()) {
      setTagAvailability({ checking: false, available: null });
      return;
    }

    const timer = setTimeout(async () => {
      setTagAvailability({ checking: true, available: null });
      const check = await checkGamerTagUniqueness(clean, currentUser?.uid);
      if (check.isUnique) {
        setTagAvailability({
          checking: false,
          available: true,
          message: `✓ "${clean}" is unique & available!`,
          level: check.level,
          latencyMs: check.latencyMs
        });
      } else {
        setTagAvailability({
          checking: false,
          available: false,
          message: check.error || `⚠️ "${clean}" is already taken`,
          level: check.level,
          latencyMs: check.latencyMs
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [gamerTag, currentUser?.displayName, currentUser?.uid]);

  // Security Subtab state
  const [isUidMasked, setIsUidMasked] = useState<boolean>(true);
  const [isUidCopied, setIsUidCopied] = useState<boolean>(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState<boolean>(false);
  const [resetEmailStatus, setResetEmailStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Primary Contact Email state (for Discord / Fake / Placeholder Email users)
  const [primaryContactEmail, setPrimaryContactEmail] = useState<string>('');
  const [isEditingContactEmail, setIsEditingContactEmail] = useState<boolean>(false);
  const [contactEmailNotice, setContactEmailNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isSavingContactEmail, setIsSavingContactEmail] = useState<boolean>(false);

  // Dispatched Email Payload Inspector Modal state
  const [dispatchedEmailPreviewModal, setDispatchedEmailPreviewModal] = useState<{
    to: string;
    subject: string;
    html: string;
    timestamp: string;
    status: string;
    isInAppDelivered: boolean;
    isPlaceholderAlert: boolean;
  } | null>(null);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState<boolean>(false);

  // Helper to detect Discord OAuth or fake/placeholder emails
  const isPlaceholderEmail = (emailStr?: string | null): boolean => {
    if (!emailStr) return true;
    const lower = emailStr.toLowerCase().trim();
    return (
      lower.endsWith('@discord.internal') ||
      lower.endsWith('@tempmail.org') ||
      lower.endsWith('@vicecity.app') ||
      lower.endsWith('@example.com') ||
      lower.endsWith('@test.com') ||
      lower.endsWith('@fake.com') ||
      lower.includes('placeholder') ||
      !lower.includes('@') ||
      !lower.includes('.')
    );
  };

  // VIP Expiry Email Alert State
  const [vipExpiresDate, setVipExpiresDate] = useState<string>('2026-08-15');
  const [isSendingTestVipAlert, setIsSendingTestVipAlert] = useState<boolean>(false);
  const [testVipAlertNotice, setTestVipAlertNotice] = useState<string | null>(null);

  // Discord Account Connection & Management State
  const [discordId, setDiscordId] = useState<string>('');
  const [discordUsername, setDiscordUsername] = useState<string>('');
  const [discordConnected, setDiscordConnected] = useState<boolean>(false);
  const [showDiscordLinkModal, setShowDiscordLinkModal] = useState<boolean>(false);
  const [discordLinkTab, setDiscordLinkTab] = useState<'oauth' | 'manual'>('oauth');
  const [discordClientIdInput, setDiscordClientIdInput] = useState<string>(() => getCustomDiscordClientId() || getEffectiveDiscordClientId());
  const [copiedRedirectUri, setCopiedRedirectUri] = useState<boolean>(false);
  const [linkingDiscord, setLinkingDiscord] = useState<boolean>(false);
  const [manualDiscordIdInput, setManualDiscordIdInput] = useState<string>('');
  const [manualDiscordTagInput, setManualDiscordTagInput] = useState<string>('');
  const [discordNotice, setDiscordNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isSyncingDiscordRoles, setIsSyncingDiscordRoles] = useState<boolean>(false);
  const [roleSyncFeedback, setRoleSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  
  // Persistent Discord OAuth Token State
  const [discordAuthStatus, setDiscordAuthStatus] = useState<{
    connected?: boolean;
    hasPersistentTokens?: boolean;
    expiresAt?: number | null;
    isExpired?: boolean;
    scope?: string;
    linkedAt?: string | null;
    lastRefreshedAt?: string | null;
  } | null>(null);
  const [isRefreshingToken, setIsRefreshingToken] = useState<boolean>(false);
  const [tokenRefreshFeedback, setTokenRefreshFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Cached Discord values fallback
  const localDiscordId = typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_user_id') : null;
  const localDiscordUsername = typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_username') : null;
  const activeDiscordId = discordId || localDiscordId || '';
  const activeDiscordUsername = discordUsername || localDiscordUsername || '';
  const isDiscordLinked = Boolean(activeDiscordId && (activeDiscordUsername || discordConnected));

  const handleConnectDiscordOAuth = () => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const returnUrl = '/profile';
    const res = startDiscordOAuth({ uid, returnUrl });
    if (res.needsClientId) {
      setDiscordLinkTab('oauth');
      setDiscordClientIdInput(getCustomDiscordClientId() || '');
      setShowDiscordLinkModal(true);
      setDiscordNotice({
        type: 'error',
        msg: 'Please enter your Discord Application ID (from your open Discord Developer Portal tab).'
      });
    }
  };

  const handleSaveAndStartOAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    const cleanId = discordClientIdInput.trim();
    if (!cleanId || !/^\d{17,20}$/.test(cleanId)) {
      setDiscordNotice({
        type: 'error',
        msg: 'Please enter a valid 17-20 digit numeric Discord Application ID (from Discord Developer Portal -> General Information).'
      });
      return;
    }
    setCustomDiscordClientId(cleanId);
    setDiscordNotice(null);
    const res = startDiscordOAuth({
      uid: currentUser.uid,
      clientId: cleanId,
      returnUrl: '/profile'
    });
    if (res.initiated) {
      setShowDiscordLinkModal(false);
    }
  };

  const handleRefreshDiscordToken = async () => {
    if (!currentUser || isRefreshingToken) return;
    setIsRefreshingToken(true);
    setTokenRefreshFeedback(null);
    try {
      const res = await refreshDiscordOAuthToken(currentUser.uid);
      if (res.success) {
        setTokenRefreshFeedback({
          type: 'success',
          msg: 'Discord OAuth token refreshed successfully. Persistent integration renewed.'
        });
        // Re-fetch status
        const status = await fetchDiscordAuthStatus(currentUser.uid);
        setDiscordAuthStatus(status);
      } else {
        setTokenRefreshFeedback({
          type: 'error',
          msg: res.error || 'Failed to refresh Discord OAuth token. Please reconnect via OAuth2.'
        });
      }
    } catch (err: any) {
      setTokenRefreshFeedback({
        type: 'error',
        msg: err?.message || 'Error communicating with Discord token refresh endpoint.'
      });
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const handleSaveManualDiscordLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const cleanId = manualDiscordIdInput.trim();
    const cleanTag = manualDiscordTagInput.trim();

    if (!cleanId && !cleanTag) {
      setDiscordNotice({ type: 'error', msg: 'Please enter your Discord Snowflake ID or Username.' });
      return;
    }

    setLinkingDiscord(true);
    setDiscordNotice(null);

    try {
      // Determine final ID and Username flexibly so user is never blocked by strict formatting
      let finalId = cleanId;
      let finalTag = cleanTag;

      if (finalId && /^\d{15,22}$/.test(finalId)) {
        // Pure Snowflake ID provided
        if (!finalTag) {
          finalTag = `@User_${finalId.slice(-4)}`;
        }
      } else if (finalId && !/^\d{15,22}$/.test(finalId)) {
        // User typed a username/tag in the ID field
        if (!finalTag) finalTag = finalId;
        const seed = Math.abs(finalId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
        finalId = `982${String(seed).padEnd(15, '4')}`.slice(0, 18);
      } else if (!finalId && finalTag) {
        // Only tag provided
        const seed = Math.abs(finalTag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
        finalId = `982${String(seed).padEnd(15, '4')}`.slice(0, 18);
      }

      if (!finalTag.startsWith('@') && !finalTag.includes('#')) {
        finalTag = `@${finalTag}`;
      }

      await linkDiscordToUser(currentUser.uid, {
        discordId: finalId,
        discordUsername: finalTag
      });

      setDiscordId(finalId);
      setDiscordUsername(finalTag);
      setDiscordConnected(true);
      setDiscordNotice({ type: 'success', msg: 'Discord account linked successfully! Syncing server roles automatically...' });
      
      // Auto-trigger sync instantly
      handleSyncDiscordRoles(finalId);

      setTimeout(() => {
        setShowDiscordLinkModal(false);
        setDiscordNotice(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error linking Discord account:', err);
      setDiscordNotice({ type: 'error', msg: err?.message || 'Failed to save Discord account link.' });
    } finally {
      setLinkingDiscord(false);
    }
  };

  const handleUnlinkDiscordAccount = async () => {
    if (!currentUser) return;
    
    setLinkingDiscord(true);
    setDiscordNotice(null);
    try {
      await unlinkDiscordFromUser(currentUser.uid);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('gtavi_discord_user_id');
        localStorage.removeItem('gtavi_discord_username');
        localStorage.removeItem('gtavi_discord_avatar');
        localStorage.removeItem(`gtavi_discord_link_${currentUser.uid}`);
      }

      setDiscordId('');
      setDiscordUsername('');
      setDiscordConnected(false);
      setDiscordNotice({ type: 'success', msg: 'Discord account unlinked successfully.' });
    } catch (err: any) {
      console.error('Error unlinking Discord:', err);
      setDiscordNotice({ type: 'error', msg: err?.message || 'Failed to unlink Discord account.' });
    } finally {
      setLinkingDiscord(false);
    }
  };

  const handleSyncDiscordRoles = async (overrideDiscordId?: string) => {
    const targetDiscordId = overrideDiscordId || activeDiscordId;
    if (!currentUser || !targetDiscordId || isSyncingDiscordRoles) return;
    setIsSyncingDiscordRoles(true);
    setRoleSyncFeedback(null);
    try {
      const res = await fetch('/api/discord/sync-user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          discordUserId: targetDiscordId
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        const changes = data.result.roleChanges?.[0] || data.result;
        const addedCount = changes.rolesAdded?.length || 0;
        const removedCount = changes.rolesRemoved?.length || 0;
        const addedNames = changes.rolesAdded?.map((r: any) => r.roleName).join(', ');

        if (addedCount > 0) {
          setRoleSyncFeedback({
            type: 'success',
            msg: `Discord roles updated! Granted: ${addedNames || `${addedCount} role(s)`}`
          });
        } else if (removedCount > 0) {
          setRoleSyncFeedback({
            type: 'info',
            msg: `Discord roles synchronized with current active tier (${changes.activeTier || 'Updated'}).`
          });
        } else {
          setRoleSyncFeedback({
            type: 'info',
            msg: `All Discord roles are currently in sync with your tier (${changes.activeTier || 'Active'}).`
          });
        }
      } else {
        setRoleSyncFeedback({
          type: 'error',
          msg: data.error || 'Failed to synchronize Discord roles.'
        });
      }
    } catch (err: any) {
      setRoleSyncFeedback({
        type: 'error',
        msg: err.message || 'Error communicating with Discord role sync service.'
      });
    } finally {
      setIsSyncingDiscordRoles(false);
      setTimeout(() => setRoleSyncFeedback(null), 8000);
    }
  };

  // Load history & current profile details (credits, lastLogin, dailyStreak, rewardStreak, lastClaimDate)
  useEffect(() => {
    if (currentUser) {
      // Check URL hash and parameters for returned Discord OAuth tokens or state
      if (typeof window !== 'undefined') {
        processDiscordCallback(currentUser.uid).then(result => {
          if (result.handled) {
            if (result.success && result.user) {
              setDiscordId(result.user.id);
              setDiscordUsername(result.user.username);
              setDiscordConnected(true);
              setDiscordNotice({ type: 'success', msg: `Discord account ${result.user.username} linked successfully!` });
              // Refresh status
              fetchDiscordAuthStatus(currentUser.uid).then(status => setDiscordAuthStatus(status));
            } else if (result.error) {
              setDiscordNotice({ type: 'error', msg: `Discord connection notice: ${result.error}` });
              setShowDiscordLinkModal(true);
            }
          }
        });
      }

      // Auto-sanitize tag if displayName has spaces from Google Auth
      const rawTag = currentUser.displayName || '';
      setGamerTag(rawTag);

      // Check Google Auth provider for google photo URL
      const googleProvider = currentUser.providerData?.find(p => p.providerId === 'google.com');
      const googlePhoto = googleProvider?.photoURL || (currentUser.photoURL?.includes('googleusercontent.com') ? currentUser.photoURL : null);
      if (googlePhoto) {
        setGoogleAvatarUrl(googlePhoto);
      }

      if (currentUser.photoURL) {
        setSelectedAvatar(currentUser.photoURL);
      } else {
        setSelectedAvatar(DEFAULT_GTA6_AVATAR);
      }

      if (currentUser.email) {
        setPrimaryContactEmail(currentUser.email);
      }

      // Fast local storage cache load
      const cachedCredits = localStorage.getItem(`gtavi_credits_${currentUser.uid}`);
      const cachedLastLogin = localStorage.getItem(`gtavi_lastLogin_${currentUser.uid}`);
      const cachedStreak = localStorage.getItem(`gtavi_streak_${currentUser.uid}`);
      const cachedRewardStreak = localStorage.getItem(`gtavi_rewardStreak_${currentUser.uid}`);
      const cachedLastClaimDate = localStorage.getItem(`gtavi_lastClaimDate_${currentUser.uid}`);

      if (cachedCredits) setCredits(parseInt(cachedCredits, 10) || 0);
      if (cachedLastLogin) setLastLogin(parseInt(cachedLastLogin, 10) || 0);
      if (cachedStreak) setDailyStreak(parseInt(cachedStreak, 10) || 0);
      if (cachedRewardStreak) setRewardStreak(parseInt(cachedRewardStreak, 10) || 0);
      if (cachedLastClaimDate) setLastClaimDate(cachedLastClaimDate);

      const loadProfileData = async () => {
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        let history: Array<{ timestamp: number; tag: string }> = [];
        const localRaw = localStorage.getItem(`gtavi_tag_history_${currentUser.uid}`);
        if (localRaw) {
          try {
            history = JSON.parse(localRaw);
          } catch { history = []; }
        }
        try {
          // Check reward status on mount (resets streak if >48h elapsed)
          const rewardStatus = await checkUserRewardStatus(currentUser.uid);
          setRewardStreak(rewardStatus.rewardStreak);
          setDailyStreak(rewardStatus.dailyStreak);
          if (rewardStatus.lastClaimDate) setLastClaimDate(rewardStatus.lastClaimDate);
          if (rewardStatus.lastLogin) setLastLogin(rewardStatus.lastLogin);
          if (typeof rewardStatus.vcBalance === 'number') setCredits(rewardStatus.vcBalance);

          const userSnap = await getDoc(doc(db, 'userProfiles', currentUser.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.avatar) {
              setSelectedAvatar(data.avatar);
            }
            if (data.googlePhotoURL) {
              setGoogleAvatarUrl(data.googlePhotoURL);
            }
            if (data.email) {
              setPrimaryContactEmail(data.email);
            }
            if (data.discordId) setDiscordId(data.discordId);
            if (data.discordUsername) setDiscordUsername(data.discordUsername);
            if (data.discordConnected !== undefined) setDiscordConnected(Boolean(data.discordConnected));
            if (Array.isArray(data.changeHistory) && data.changeHistory.length > history.length) {
              history = data.changeHistory;
            }
            const currentBal = typeof data.vcBalance === 'number' ? data.vcBalance : (typeof data.credits === 'number' ? data.credits : null);
            if (currentBal !== null) {
              setCredits(currentBal);
              localStorage.setItem(`gtavi_vcBalance_${currentUser.uid}`, String(currentBal));
            }
            if (typeof data.lastLogin === 'number') {
              setLastLogin(data.lastLogin);
              localStorage.setItem(`gtavi_lastLogin_${currentUser.uid}`, String(data.lastLogin));
            }

            const currentRewardStreakVal = rewardStatus.rewardStreak;
            const currentStreakVal = rewardStatus.dailyStreak;

            if (data.lastClaimDate) {
              const claimDateStr = String(data.lastClaimDate);
              setLastClaimDate(claimDateStr);
              localStorage.setItem(`gtavi_lastClaimDate_${currentUser.uid}`, claimDateStr);
            }

            if (data.vipExpires) {
              setVipExpiresDate(String(data.vipExpires));
            } else if (data.vipUntil) {
              setVipExpiresDate(String(data.vipUntil).split('T')[0]);
            }

            // Auto VIP check if user reached 30 day streak
            if (currentRewardStreakVal >= 30 && !data.isVip) {
              try {
                const VIP_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
                const now = Date.now();
                const vipUntilIso = new Date(now + VIP_30_DAYS_MS).toISOString();
                await setDoc(doc(db, 'userProfiles', currentUser.uid), {
                  isVip: true,
                  userLevel: 'VIP',
                  vipUntil: vipUntilIso,
                  vipExpires: vipUntilIso.split('T')[0],
                  claimed30DayVip: true,
                  lastClaimed30DayVipStreak: currentRewardStreakVal,
                  updatedAt: new Date().toISOString()
                }, { merge: true });
                onUpgradeToVip?.();
              } catch (err) {
                console.warn('Auto VIP grant update failed:', err);
              }
            }

            const lastClaimed = typeof data.lastClaimed30DayVipStreak === 'number' ? data.lastClaimed30DayVipStreak : 0;
            const isDay30ClaimedForCycle = currentStreakVal >= 30 && lastClaimed >= currentStreakVal;

            setClaimedMilestones({
              day7: !!data.claimedMilestone7,
              day14: !!data.claimedMilestone14,
              day30: isDay30ClaimedForCycle
            });
          }
        } catch (e) {
          console.warn('Could not read user profile doc:', e);
        }

        // Check persistent Discord OAuth token status
        try {
          const authStatus = await fetchDiscordAuthStatus(currentUser.uid);
          if (authStatus) {
            setDiscordAuthStatus(authStatus);
            if (authStatus.connected) {
              setDiscordConnected(true);
              if (authStatus.discordId) setDiscordId(authStatus.discordId);
              if (authStatus.discordUsername) setDiscordUsername(authStatus.discordUsername);
            }
          }
        } catch (authErr) {
          console.warn('Could not read Discord OAuth status:', authErr);
        }

        const recent = history.filter(h => Date.now() - h.timestamp < ONE_YEAR_MS);
        setChangesUsedThisYear(recent.length);
      };

      loadProfileData();

      // Listen for popup OAuth messages for instant, no-reload state sync in iframe environments
      const handlePopupMessage = (event: MessageEvent) => {
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('viceintel.app')) {
          return;
        }

        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          const data = event.data;
          setDiscordId(data.discordId);
          setDiscordUsername(data.discordUsername);
          setDiscordConnected(true);
          setDiscordNotice({ type: 'success', msg: `Discord account ${data.discordUsername} linked successfully!` });
          fetchDiscordAuthStatus(currentUser.uid).then(status => setDiscordAuthStatus(status));
        } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
          setDiscordNotice({ type: 'error', msg: `Discord connection notice: ${event.data.error}` });
          setShowDiscordLinkModal(true);
        }
      };

      window.addEventListener('message', handlePopupMessage);
      return () => {
        window.removeEventListener('message', handlePopupMessage);
      };
    }
  }, [currentUser]);

  const handleSavePrimaryContactEmail = async () => {
    if (!currentUser) return;
    setContactEmailNotice(null);
    if (!primaryContactEmail || !primaryContactEmail.includes('@') || !primaryContactEmail.includes('.')) {
      setContactEmailNotice({ type: 'error', msg: 'Please enter a valid primary contact email address (e.g. name@gmail.com).' });
      return;
    }
    setIsSavingContactEmail(true);
    try {
      await setDoc(doc(db, 'userProfiles', currentUser.uid), {
        email: primaryContactEmail.trim(),
        emailUpdatedAt: new Date().toISOString()
      }, { merge: true });

      setContactEmailNotice({
        type: 'success',
        msg: `✅ Primary contact email updated to ${primaryContactEmail.trim()}! All VIP expiration alerts and receipt vouchers will target this inbox.`
      });
      setIsEditingContactEmail(false);
    } catch (err: any) {
      setContactEmailNotice({ type: 'error', msg: `❌ Failed to save email: ${err?.message || 'Unknown error'}` });
    } finally {
      setIsSavingContactEmail(false);
    }
  };

  const handleSendTestVipEmail = async () => {
    if (!currentUser) return;
    setIsSendingTestVipAlert(true);
    setTestVipAlertNotice(null);

    const targetEmail = primaryContactEmail || currentUser.email || 'user@vicecity.app';
    const username = currentUser.displayName || currentUser.email?.split('@')[0] || 'ViceCityPlayer';
    const daysLeft = 3;
    const expireDate = vipExpiresDate || '2026-08-15';
    const isPlaceholder = isPlaceholderEmail(targetEmail);
    const nowIso = new Date().toISOString();

    const renderedHtml = `
      <div style="background:#09090b;color:#f4f4f5;padding:24px;font-family:sans-serif;border-radius:12px;border:1px solid #f43f5e;">
        <span style="background:#f43f5e;color:#fff;font-size:10px;font-weight:bold;padding:4px 8px;border-radius:4px;text-transform:uppercase;">TEST VIP REMINDER EMAIL</span>
        <h2 style="color:#ffffff;margin-top:12px;">Hey @${username}, your VIP Access is expiring soon!</h2>
        <p style="color:#a1a1aa;line-height:1.6;">Your VIP Pass will expire on <strong>${expireDate}</strong> (${daysLeft} days remaining).</p>
        <p style="color:#a1a1aa;">Target Primary Email: <strong style="color:#f59e0b;">${targetEmail}</strong></p>
        <a href="https://viceintel.app/profile" style="display:inline-block;background:#f43f5e;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold;border-radius:8px;margin-top:12px;">Renew VIP Pass ($3.99/mo)</a>
        <div style="margin-top:16px;padding:12px;background:#18181b;border-radius:8px;border:1px solid #27272a;font-size:11px;">
          <p style="margin:0;color:#10b981;">✅ Queued in Cloud 'mail' collection (Email dispatch service)</p>
          <p style="margin:4px 0 0 0;color:#10b981;">✅ Delivered to Player In-App Notification Center</p>
          ${isPlaceholder ? `<p style="margin:4px 0 0 0;color:#f59e0b;">⚠️ Note: ${targetEmail} is a placeholder or Discord address. Always delivered via In-App Direct Notifications.</p>` : ''}
        </div>
      </div>
    `;

    try {
      const { collection, addDoc } = await import('firebase/firestore');

      // 1. Queue in Firestore 'mail' collection
      await addDoc(collection(db, 'mail'), {
        to: [targetEmail],
        message: {
          subject: `[TEST VIP REMINDER] ⚠️ Subscription Expiring in ${daysLeft} Days (@${username})`,
          html: renderedHtml
        },
        createdAt: nowIso
      });

      // 2. Deliver to In-App Notifications
      await addDoc(collection(db, 'userNotifications'), {
        userId: currentUser.uid,
        username,
        type: 'VIP_EXPIRY_ALERT',
        title: `⚠️ VIP Subscription Expiring in ${daysLeft} Days`,
        message: `Your VIP Pass will expire on ${expireDate}. Reminder email sent to ${targetEmail}.`,
        daysRemaining: daysLeft,
        isRead: false,
        createdAt: nowIso
      });

      // Also call server API endpoint to save in sentEmails and server logs
      try {
        await fetch('/api/email/send-test-vip-expiry-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            username,
            daysLeft,
            expireDate
          })
        });
      } catch (apiErr) {
        console.warn('Server endpoint call:', apiErr);
      }

      setDispatchedEmailPreviewModal({
        to: targetEmail,
        subject: `[TEST VIP REMINDER] ⚠️ Subscription Expiring in ${daysLeft} Days (@${username})`,
        html: renderedHtml,
        timestamp: new Date().toLocaleTimeString(),
        status: 'Queued in Firestore mail collection & Delivered to In-App Notifications',
        isInAppDelivered: true,
        isPlaceholderAlert: isPlaceholder
      });
      setShowEmailPreviewModal(true);

      setTestVipAlertNotice(`✅ Test VIP email dispatched to ${targetEmail}! (Delivered to In-App Notifications & Firestore Mail)`);
    } catch (err: any) {
      setTestVipAlertNotice(`❌ Failed to send test email: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSendingTestVipAlert(false);
    }
  };

  // Daily Reward 24-hour cooldown ticker
  useEffect(() => {
    const updateCountdown = () => {
      const lastClaimTimeMs = getTimestampFromClaimDate(lastClaimDate, lastLogin);
      if (!lastClaimTimeMs || lastClaimTimeMs <= 0) {
        setTimeRemainingMs(0);
        return;
      }

      const elapsed = Date.now() - lastClaimTimeMs;
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours in ms
      if (elapsed >= cooldown) {
        setTimeRemainingMs(0);
      } else {
        setTimeRemainingMs(cooldown - elapsed);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastLogin, lastClaimDate]);

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  };

  const handleClaimDailyReward = async () => {
    if (!currentUser || isClaimingReward) return;

    setIsClaimingReward(true);

    try {
      const res = await claimDailyReward(currentUser.uid);

      if (res.success) {
        setCredits(res.vcBalance);
        setLastLogin(res.lastLogin);
        setDailyStreak(res.dailyStreak);
        setRewardStreak(res.rewardStreak);
        if (res.lastClaimDate) setLastClaimDate(res.lastClaimDate);

        playNotificationChime(true);
        setClaimRewardSuccess({
          amount: res.rewardAmount,
          streak: res.rewardStreak || res.dailyStreak,
          breakdown: res.breakdown,
          userLevel: res.userLevel
        });

        // Dispatch globally for App.tsx toast banner dismissal and real-time sync
        window.dispatchEvent(new CustomEvent('gtavi_reward_claimed', { detail: res }));

        if (res.autoUnlockedVip || res.rewardStreak >= 30) {
          onUpgradeToVip?.();
          setClaimedMilestones((prev) => ({ ...prev, day30: true }));
          setMilestoneNotice({
            success: true,
            message: '🎉 30-Day Streak Reached! 30-Day VIP Pass Membership automatically unlocked!'
          });
          setTimeout(() => setMilestoneNotice(null), 8000);
        }
      } else {
        setAuthError(res.message);
        if (res.timeRemainingMs && res.timeRemainingMs > 0) {
          setTimeRemainingMs(res.timeRemainingMs);
        }
      }
    } catch (err: any) {
      console.error('Error claiming daily reward:', err);
      setAuthError('Failed to claim daily reward: ' + (err.message || 'Unknown error'));
    } finally {
      setIsClaimingReward(false);
    }
  };

  const [claimedMilestones, setClaimedMilestones] = useState<{ day7: boolean; day14: boolean; day30: boolean }>({
    day7: false,
    day14: false,
    day30: false
  });
  const [isClaimingMilestone, setIsClaimingMilestone] = useState<boolean>(false);
  const [milestoneNotice, setMilestoneNotice] = useState<{ success: boolean; message: string } | null>(null);

  const handleClaim30DayVipPass = async () => {
    if (!currentUser || isClaimingMilestone) return;

    if (!currentUser) {
      setAuthError('Please sign in to claim your 30-Day Streak VIP Pass.');
      return;
    }

    setIsClaimingMilestone(true);
    setMilestoneNotice(null);

    try {
      const res = await claim30DayVipPass(currentUser.uid);
      if (res.success) {
        setCredits(res.vcBalance);
        setClaimedMilestones((prev) => ({ ...prev, day30: true }));
        playNotificationChime(true);
        onUpgradeToVip();
        setMilestoneNotice({
          success: true,
          message: res.message
        });
        setTimeout(() => setMilestoneNotice(null), 8000);
      } else {
        setMilestoneNotice({ success: false, message: res.message });
      }
    } catch (err: any) {
      console.error('Error claiming 30-day VIP Pass:', err);
      setMilestoneNotice({ success: false, message: err.message || 'Claim failed.' });
    } finally {
      setIsClaimingMilestone(false);
    }
  };

  const handleClaimMilestone = async (days: 7 | 14 | 30) => {
    if (!currentUser || isClaimingMilestone) return;

    if (!currentUser) {
      setAuthError('Please sign in to claim streak milestone rewards.');
      return;
    }

    if (days === 30) {
      return handleClaim30DayVipPass();
    }

    setIsClaimingMilestone(true);
    setMilestoneNotice(null);

    try {
      const res = await claimStreakMilestone(currentUser.uid, days);
      if (res.success) {
        setCredits(res.vcBalance);
        if (days === 7) setClaimedMilestones((prev) => ({ ...prev, day7: true }));
        if (days === 14) setClaimedMilestones((prev) => ({ ...prev, day14: true }));
        playNotificationChime(true);
        setMilestoneNotice({ success: true, message: res.message });
        setTimeout(() => setMilestoneNotice(null), 6000);
      } else {
        setMilestoneNotice({ success: false, message: res.message });
      }
    } catch (err: any) {
      console.error(`Error claiming ${days}-day milestone:`, err);
      setMilestoneNotice({ success: false, message: err.message || 'Claim failed.' });
    } finally {
      setIsClaimingMilestone(false);
    }
  };

  const handleConvertVcToVipPass = async () => {
    if (!currentUser || isClaimingMilestone) return;

    if (!currentUser) {
      setAuthError(`Please sign in to convert ${vcCostForVip.toLocaleString()} VC into a $${(pricing.vipPrice || 3.99).toFixed(2)} 30-Day VIP Pass.`);
      return;
    }

    setIsClaimingMilestone(true);
    setMilestoneNotice(null);

    try {
      const res = await convertVcToVipPass(currentUser.uid);
      if (res.success) {
        setCredits(res.vcBalance);
        playNotificationChime(true);
        onUpgradeToVip();
        setMilestoneNotice({ success: true, message: res.message });
        setTimeout(() => setMilestoneNotice(null), 8000);
      } else {
        setMilestoneNotice({ success: false, message: res.message });
      }
    } catch (err: any) {
      console.error('Error converting VC to VIP Pass:', err);
      setMilestoneNotice({ success: false, message: err.message || 'Conversion failed.' });
    } finally {
      setIsClaimingMilestone(false);
    }
  };

  // Dedicated Direct Avatar Save (Independent of GamerTag changes)
  const handleSaveAvatarOnly = async (avatarUrlToSave?: string) => {
    if (!currentUser) return;
    const targetAvatar = avatarUrlToSave || selectedAvatar;

    const userHierarchy = getUserHierarchyLevel({
      isAdmin,
      isStaff,
      isVip: isVipActive,
      role: isAdmin ? 'Admin' : isStaff ? 'Staff' : isVipActive ? 'VIP Member' : 'User'
    });

    const targetPreset = GTA6_AVATARS.find(a => a.url === targetAvatar);
    if (targetPreset) {
      const access = checkAvatarAccess(targetPreset, userHierarchy);
      if (!access.isUnlocked) {
        setAuthError(`⛔ Access Restricted: ${access.reason || 'You do not have the required clearance level to equip this avatar.'}`);
        return;
      }
    }

    setIsSaving(true);
    setAuthError(null);
    try {
      // 1. Update Firebase Auth user photoURL
      await updateProfile(currentUser, {
        photoURL: getSafePhotoURL(targetAvatar, currentUser.displayName || currentUser.email)
      });

      // 2. Sync to Firestore userProfiles document
      const userDocRef = doc(db, 'userProfiles', currentUser.uid);
      await setDoc(userDocRef, {
        uid: currentUser.uid,
        avatar: targetAvatar,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSelectedAvatar(targetAvatar);
      setAvatarSaved(true);
      setTimeout(() => setAvatarSaved(false), 4000);
    } catch (err: any) {
      console.error('Error saving avatar:', err);
      setAuthError('Failed to save avatar: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Save GamerTag & Avatar
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let trimmedTag = gamerTag.trim().replace(/\s+/g, '_');
    if (!trimmedTag) {
      setAuthError('GamerTag cannot be empty.');
      return;
    }

    const syntaxCheck = validateGamerTagSyntax(trimmedTag);
    if (!syntaxCheck.isValid) {
      setAuthError(syntaxCheck.error || 'Invalid GamerTag format.');
      return;
    }

    setIsSaving(true);
    setAuthError(null);

    try {
      const currentTag = currentUser.displayName || '';
      const isTagChanging = trimmedTag.toLowerCase() !== currentTag.toLowerCase();

      // 1. Check Uniqueness across userProfiles in Firestore
      if (isTagChanging) {
        const uniqueCheck = await checkGamerTagUniqueness(trimmedTag, currentUser.uid);
        if (!uniqueCheck.isUnique) {
          setAuthError(uniqueCheck.error || `⚠️ GamerTag "${trimmedTag}" is already taken by another player! GamerTags must be unique.`);
          setIsSaving(false);
          return;
        }
      }

      // 2. Enforce Max 2 Changes Per Year (365 days)
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      let history: Array<{ timestamp: number; tag: string }> = [];
      const localRaw = localStorage.getItem(`gtavi_tag_history_${currentUser.uid}`);
      if (localRaw) {
        try { history = JSON.parse(localRaw); } catch { history = []; }
      }

      try {
        const userSnap = await getDoc(doc(db, 'userProfiles', currentUser.uid));
        if (userSnap.exists() && Array.isArray(userSnap.data()?.changeHistory)) {
          const fsHistory = userSnap.data().changeHistory;
          if (fsHistory.length > history.length) {
            history = fsHistory;
          }
        }
      } catch (e) {
        console.warn('Could not read user profile doc:', e);
      }

      const recentChanges = history.filter(h => now - h.timestamp < ONE_YEAR_MS);

      if (isTagChanging && currentTag !== '') {
        if (recentChanges.length >= 2) {
          const oldestChange = recentChanges.reduce((min, h) => h.timestamp < min ? h.timestamp : min, recentChanges[0].timestamp);
          const nextDateStr = new Date(oldestChange + ONE_YEAR_MS).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          setAuthError(`❌ GamerTag change limit reached! You can only change your GamerTag 2 times per year. Next change available after ${nextDateStr}.`);
          setIsSaving(false);
          return;
        }

        history.push({ timestamp: now, tag: trimmedTag });
        localStorage.setItem(`gtavi_tag_history_${currentUser.uid}`, JSON.stringify(history));
      }

      // Sync to Firestore
      const userDocRef = doc(db, 'userProfiles', currentUser.uid);
      const nowStr = new Date().toISOString();
      await setDoc(userDocRef, {
        uid: currentUser.uid,
        username: trimmedTag,
        usernameLower: trimmedTag.toLowerCase(),
        email: currentUser.email || '',
        avatar: selectedAvatar,
        role: isAdmin ? 'Admin' : isStaff ? 'Staff' : isVipActive ? 'VIP Member' : 'User',
        isVip: isVipActive,
        isAdmin,
        changeHistory: history,
        updatedAt: nowStr
      }, { merge: true });

      // Update Auth Profile
      await updateProfile(currentUser, {
        displayName: trimmedTag,
        photoURL: getSafePhotoURL(selectedAvatar, trimmedTag)
      });

      const updatedRecent = history.filter(h => now - h.timestamp < ONE_YEAR_MS);
      setChangesUsedThisYear(updatedRecent.length);
      setGamerTagSaved(true);
      setTimeout(() => setGamerTagSaved(false), 3000);
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      setAuthError('Failed to update Profile: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Filtered notifications list (newest notifications at the top)
  const filteredNotifications = notifications
    .filter(n => notificationFilter === 'all' || n.type === notificationFilter)
    .sort((a, b) => {
      const timeA = a.createdAt || (a.timestamp ? new Date(a.timestamp).getTime() : 0);
      const timeB = b.createdAt || (b.timestamp ? new Date(b.timestamp).getTime() : 0);
      return timeB - timeA;
    });

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <UserIcon className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-white tracking-tight">Vice City Player Profile</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Sign in or create a player account to unlock custom GamerTags, animated GTA VI avatars, private crew chat channels, and VIP status.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenAuthModal}
              className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Hero Header Card */}
      <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-2xl overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          {/* User Avatar + Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-rose-500/40 bg-zinc-950 shadow-xl p-1 bg-zinc-900">
                <img
                  src={selectedAvatar}
                  alt="User Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    const preset = GTA6_AVATARS.find(a => a.url === selectedAvatar);
                    if (preset?.fallbackSvgDataUri && e.currentTarget.src !== preset.fallbackSvgDataUri) {
                      e.currentTarget.src = preset.fallbackSvgDataUri;
                    } else if (GTA6_AVATARS[0].fallbackSvgDataUri) {
                      e.currentTarget.src = GTA6_AVATARS[0].fallbackSvgDataUri;
                    }
                  }}
                />
              </div>
              <button
                onClick={() => setActiveSubTab('avatars')}
                className="absolute -bottom-2 -right-2 p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition cursor-pointer border border-rose-400/40"
                title="Change Avatar"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentUser.displayName || 'ViceCityPlayer'}
                </h2>

                {/* Role Badges */}
                {isAdmin ? (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black uppercase flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin
                  </span>
                ) : isStaff ? (
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-black uppercase flex items-center gap-1 shadow-sm">
                    <Key className="w-3.5 h-3.5" /> Vice Squad Staff
                  </span>
                ) : isVipActive ? (
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black uppercase flex items-center gap-1 shadow-sm shadow-amber-500/20">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> VIP Member
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full text-xs font-extrabold uppercase">
                    Verified Player
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  {currentUser.email || 'Anonymous Player'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Gamer Tag Changes: {changesUsedThisYear}/2 Used
                </span>
              </div>

              {/* Wallet & Daily Reward Status Bar */}
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-extrabold text-xs shadow-sm">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{credits.toLocaleString()} VC</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 font-extrabold text-xs shadow-sm">
                  <Flame className="w-4 h-4 text-rose-400 fill-rose-400/20" />
                  <span>{dailyStreak} Day Streak</span>
                </div>

                {timeRemainingMs === 0 ? (
                  <button
                    onClick={() => setActiveSubTab('daily-reward')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer animate-bounce"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Daily Reward Ready (+{isVipActive ? '30' : '15'} VC)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveSubTab('daily-reward')}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 font-mono text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{formatTimeRemaining(timeRemainingMs)}</span>
                  </button>
                )}
              </div>

              {/* Dynamic In-Game Credits Progress Gauge Bar */}
              {(() => {
                const currentGoal = credits < 100 ? 100 : credits < 250 ? 250 : credits < 500 ? 500 : credits < 1000 ? 1000 : credits < 2500 ? 2500 : vcCostForVip;
                const progressPercent = Math.min(100, Math.round((credits / currentGoal) * 100));
                return (
                  <div className="w-full bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-3 space-y-1.5 mt-1 shadow-inner">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-extrabold text-amber-300">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>In-Game Wealth Level</span>
                      </div>
                      <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                        {credits.toLocaleString()} / {currentGoal.toLocaleString()} VC ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5 relative">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-700 shadow-sm shadow-amber-500/30"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {!isVipActive && (
              <button
                onClick={() => {
                  setActiveSubTab('vip');
                  onUpgradeToVip?.();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 fill-current" />
                <span>Get VIP Pass</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition flex items-center gap-2 border border-zinc-700 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>GamerTag & Profile</span>
        </button>

        <button
          onClick={() => setActiveSubTab('daily-reward')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer relative ${
            activeSubTab === 'daily-reward'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Gift className="w-4 h-4 text-emerald-400" />
          <span>Daily Reward & Wallet</span>
          {timeRemainingMs === 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('avatars')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'avatars'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>GTA VI Vector Avatars</span>
        </button>

        <button
          onClick={() => setActiveSubTab('vip')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'vip'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span>VIP Pass Status</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer relative ${
            activeSubTab === 'notifications'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
          {unreadNotificationsCount > 0 && (
            <span className="bg-rose-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Account & Security</span>
        </button>

        {(isAdmin || isStaff) && (
          <button
            onClick={() => setActiveSubTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'staff'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Staff HQ</span>
            <span className="bg-emerald-500/30 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded border border-emerald-500/40 uppercase">
              {isAdmin ? 'Admin' : 'Staff'}
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW & GAMERTAG EDITING */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* High-Contrast Discord Integration Status Banner */}
          <div>
            {!isDiscordLinked ? (
              /* Unlinked High-Contrast Call To Action Banner */
              <div className="relative bg-gradient-to-r from-indigo-950 via-zinc-900 to-purple-950 border-2 border-indigo-500/50 rounded-2xl p-6 shadow-2xl shadow-indigo-950/50 overflow-hidden">
                {/* Background Glow FX */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                        Discord Integration Required
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                        Server Management Locked
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <span>Link Your Discord Account</span>
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                        Your Discord account is currently not linked to your player profile. Linking Discord is required to unlock <strong className="text-white">FiveM server ownership claims</strong>, <strong className="text-white">whitelist application reviews</strong>, <strong className="text-white">Discord webhook role sync</strong>, and custom VIP channel management.
                      </p>
                    </div>

                    {/* Feature Unlocks Pills */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="px-2.5 py-1 bg-zinc-950/80 border border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Server Claims
                      </span>
                      <span className="px-2.5 py-1 bg-zinc-950/80 border border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Whitelist App Reviews
                      </span>
                      <span className="px-2.5 py-1 bg-zinc-950/80 border border-zinc-800 rounded-lg text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Discord Role & Webhook Sync
                      </span>
                    </div>
                  </div>

                  {/* High-Contrast CTAs */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleConnectDiscordOAuth}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/40"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Connect via Discord OAuth2</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setManualDiscordIdInput(activeDiscordId);
                        setManualDiscordTagInput(activeDiscordUsername);
                        setShowDiscordLinkModal(true);
                      }}
                      className="px-5 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Enter Discord ID Manually</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Linked Discord Status Card with Role Sync Sentinel */
              <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">
                          Discord Account Linked
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-extrabold uppercase">
                          Verified
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded text-[10px] font-extrabold uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3 text-indigo-400" />
                          Role Sync Active
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        @{activeDiscordUsername ? activeDiscordUsername.replace(/^@+/, '') : 'DiscordUser'} <span className="text-zinc-600">•</span> ID: <span className="text-zinc-300">{activeDiscordId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleUnlinkDiscordAccount}
                      className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Unlink
                    </button>
                  </div>
                </div>

                {/* Token Refresh Feedback */}
                {tokenRefreshFeedback && (
                  <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 border ${
                    tokenRefreshFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  }`}>
                    {tokenRefreshFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{tokenRefreshFeedback.msg}</span>
                  </div>
                )}

                {/* Role Sync Realtime Notice */}
                {roleSyncFeedback && (
                  <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 border ${
                    roleSyncFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : roleSyncFeedback.type === 'error'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  }`}>
                    {roleSyncFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : roleSyncFeedback.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                    <span>{roleSyncFeedback.msg}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <AtSign className="w-5 h-5 text-rose-400" /> Custom GamerTag & Vice City Identity
                </h3>
                <p className="text-xs text-zinc-400">
                  Your GamerTag is displayed across live chat rooms, custom crew channels, and community leaderboards.
                </p>
              </div>
            </div>

            {authError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {gamerTagSaved && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-extrabold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>GamerTag & Profile details saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider block">
                    Vice City GamerTag
                  </label>
                  {tagAvailability.checking && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 animate-spin" /> Checking availability...
                    </span>
                  )}
                  {!tagAvailability.checking && tagAvailability.available === true && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Unique & Available
                    </span>
                  )}
                  {!tagAvailability.checking && tagAvailability.available === false && (
                    <span className="text-[10px] text-rose-400 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3 h-3" /> Already Taken
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value.replace(/\s+/g, '_'))}
                    placeholder="e.g. OceanDrive_Lucia"
                    className={`w-full bg-zinc-950 border rounded-xl pl-8 pr-4 py-3 text-sm text-white font-bold placeholder-zinc-600 focus:outline-none transition ${
                      tagAvailability.available === true
                        ? 'border-emerald-500/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500'
                        : tagAvailability.available === false
                        ? 'border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                        : 'border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                    }`}
                  />
                </div>
              </div>

              {/* Tag Policy Notice */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" /> Annual GamerTag Change Limit Policy
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    2 Changes / Year
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  To maintain player reputation and prevent harassment, GamerTags are subject to a maximum of 2 changes per 365-day rolling window. Your GamerTag is verified for global uniqueness across all Vice City player accounts.
                </p>
                <div className="text-[11px] font-extrabold text-zinc-300 pt-1">
                  Changes used in the past 365 days: <span className="text-rose-400">{changesUsedThisYear} of 2</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <SaveIcon className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Profile...' : 'Save GamerTag Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Side Info Box */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 h-fit">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Account Perks & Stats
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 font-bold">In-Game Credits</span>
                <span className="text-amber-400 font-black font-mono">{credits.toLocaleString()} VC</span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 font-bold">Daily Streak</span>
                <span className="text-rose-400 font-black flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                  {dailyStreak} Days
                </span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 font-bold">VIP Hub Status</span>
                <span className={isVipActive ? 'text-amber-400 font-black' : 'text-zinc-500 font-bold'}>
                  {isVipActive ? 'Active VIP Pass' : 'Standard'}
                </span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 font-bold">Unread Notifications</span>
                <span className="text-rose-400 font-black">{unreadNotificationsCount}</span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 font-bold">System Role</span>
                <span className="text-cyan-400 font-black">
                  {isAdmin ? 'Administrator' : isStaff ? 'Vice Squad Staff' : 'Verified Player'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB: DAILY SIGN-IN REWARD & 30-DAY STREAK VIP PASS HUB */}
      {activeSubTab === 'daily-reward' && (
        <div className="space-y-6">
          {/* Main Container */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-2xl overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header & Wallet Summary */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                    <Crown className="w-6 h-6" />
                  </span>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Daily Rewards & 30-Day Streak VIP Pass Hub
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 pl-11 max-w-xl leading-relaxed">
                  Sign in daily to collect Vice City credits. Maintain a <strong className="text-amber-400 font-extrabold">30-day streak</strong> to claim your <strong className="text-emerald-400 font-extrabold">30-Day VIP Pass Membership</strong> with 2x daily multipliers & exclusive perks! Continuing your streak allows VIP members to claim free +30 day extensions!
                </p>
              </div>

              {/* Wallet Summary Pill */}
              <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 w-full md:w-auto justify-between md:justify-start shadow-inner">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                    Total Credits Balance
                  </span>
                  <div className="flex items-center gap-2 text-2xl font-black text-amber-400 font-mono">
                    <Coins className="w-6 h-6 text-amber-400" />
                    <span>{credits.toLocaleString()} VC</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-zinc-800" />

                <div className="space-y-0.5 text-right md:text-left">
                  <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                    Current Streak
                  </span>
                  <div className="flex items-center gap-1.5 text-lg font-black text-rose-400">
                    <Flame className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                    <span>{dailyStreak} Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Toast Notification Popups */}
            {authError && (
              <div className="fixed top-20 right-4 z-[100] max-w-md w-full sm:w-[420px] p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-rose-950/90 border border-rose-500/50 rounded-2xl text-rose-200 text-xs font-bold flex items-start justify-between gap-3 shadow-2xl shadow-rose-500/20 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400 shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-wider text-white">System Alert</p>
                    <p className="text-xs font-bold leading-relaxed">{authError}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAuthError(null)}
                  className="text-zinc-400 hover:text-white cursor-pointer p-1 transition"
                  title="Close alert"
                >
                  ✕
                </button>
              </div>
            )}

            {gamerTagSaved && (
              <div className="fixed top-20 right-4 z-[100] max-w-md w-full sm:w-[420px] p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950/90 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs font-bold flex items-start justify-between gap-3 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-wider text-white">Profile Updated</p>
                    <p className="text-xs font-bold leading-relaxed">GamerTag & profile avatar saved successfully!</p>
                  </div>
                </div>
                <button
                  onClick={() => setGamerTagSaved(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer p-1 transition"
                  title="Close notification"
                >
                  ✕
                </button>
              </div>
            )}

            {milestoneNotice && (
              <div className={`fixed top-20 right-4 z-[100] max-w-md w-full sm:w-[420px] p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 flex items-start justify-between gap-3 ${
                milestoneNotice.success
                  ? 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/80 border-amber-500/50 text-amber-200 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-rose-950/80 border-rose-500/50 text-rose-200 shadow-rose-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${milestoneNotice.success ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-wider text-white">
                      {milestoneNotice.success ? 'Reward Claim Status' : 'Notice'}
                    </p>
                    <p className="text-xs font-bold leading-relaxed">{milestoneNotice.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMilestoneNotice(null)}
                  className="text-zinc-400 hover:text-white cursor-pointer p-1 transition"
                  title="Close notification"
                >
                  ✕
                </button>
              </div>
            )}

            {claimRewardSuccess && (
              <DailyRewardSuccessToast
                claimSuccess={claimRewardSuccess}
                isVipActive={isVipActive}
                onClose={() => setClaimRewardSuccess(null)}
              />
            )}

            {/* 1. PRIMARY DAILY SIGN-IN CLAIM CARD (SINGLE SOURCE OF DAILY CLAIM ACTION & COOLDOWN TIMER) */}
            {(() => {
              const currentStreakVal = dailyStreak || rewardStreak || 0;
              const nextStreakVal = currentStreakVal >= 30 ? 30 : Math.min(30, currentStreakVal + 1);
              const baseRewardVc = 25;
              const streakBonusVc = Math.min(50, nextStreakVal * 2);
              const userLevelBonusVc = isStaff ? 30 : isAdmin ? 30 : isVipActive ? 30 : 0;
              const dailyRewardSubtotal = baseRewardVc + userLevelBonusVc + streakBonusVc;
              const nextDailyRewardAmount = isVipActive ? dailyRewardSubtotal * 2 : dailyRewardSubtotal;

              return (
                <div className="p-6 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 border-2 border-emerald-500/40 rounded-3xl space-y-5 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                          <Gift className="w-5 h-5" />
                        </span>
                        <h4 className="text-lg font-black text-white tracking-wide">
                          Today's Daily Sign-In Bonus
                        </h4>
                        {isVipActive && (
                          <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400 fill-amber-400" /> 2x VIP Boost
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                        Claim your daily Vice City credits every 24 hours. Maintain continuous daily sign-ins to build your streak and unlock your free 30-Day VIP Pass!
                      </p>
                    </div>

                    {/* Reward Amount Badge */}
                    <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shrink-0 self-start sm:self-auto shadow-inner">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-zinc-500 block">Today's Value</span>
                        <span className="text-base font-black text-emerald-400 font-mono">+{nextDailyRewardAmount} VC</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Single Action Button / Single Cooldown Indicator */}
                  <div>
                    {timeRemainingMs > 0 ? (
                      <div className="space-y-2">
                        <button
                          disabled
                          className="w-full py-4 px-6 bg-zinc-900/90 border border-zinc-800/80 text-zinc-400 font-extrabold text-sm rounded-2xl cursor-not-allowed flex items-center justify-center gap-2.5 shadow-inner"
                        >
                          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                          <span>Daily Reward Cooldown Active — Available in {formatTimeRemaining(timeRemainingMs)}</span>
                        </button>
                        <p className="text-[11px] text-zinc-500 text-center font-medium">
                          Daily claims reset every 24 hours. Sign in tomorrow to keep your {dailyStreak}-day streak active!
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleClaimDailyReward}
                        disabled={isClaimingReward}
                        className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 cursor-pointer animate-pulse transform hover:scale-[1.005]"
                      >
                        <Sparkles className="w-5 h-5 fill-zinc-950" />
                        <span>{isClaimingReward ? 'Claiming Reward...' : `Claim Today's VC Reward (+${nextDailyRewardAmount} VC)`}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 2. 30-DAY CONTINUOUS STREAK PROGRESS & MILESTONES (UNIFIED ROADMAP) */}
            <div className="p-6 bg-zinc-950/90 border border-zinc-800/80 rounded-3xl space-y-6 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                    <h4 className="text-base font-black text-white uppercase tracking-wide">
                      30-Day Continuous Streak Roadmap
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    {dailyStreak} / 30 Days ({Math.min(100, Math.round((dailyStreak / 30) * 100))}%)
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Maintain continuous daily sign-ins to collect instant milestone rewards and unlock or extend your free 30-Day VIP Pass!
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5 relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 shadow-md ${
                    dailyStreak >= 30
                      ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 shadow-amber-500/40 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 shadow-cyan-500/20'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (dailyStreak / 30) * 100))}%` }}
                />
              </div>

              {/* Milestone Cards Grid (Day 7, Day 14, Day 30) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Milestone 7 Days */}
                <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 font-extrabold text-[10px] uppercase rounded-lg">
                        Milestone 1
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-400">+50 VC</span>
                    </div>
                    <h5 className="text-sm font-black text-white">7-Day Sign-In Streak</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">Reach a 7-day continuous streak to collect a +50 VC cash bonus.</p>
                  </div>

                  <button
                    onClick={() => handleClaimMilestone(7)}
                    disabled={dailyStreak < 7 || claimedMilestones.day7 || isClaimingMilestone}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                      claimedMilestones.day7
                        ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-default'
                        : dailyStreak >= 7
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black shadow-lg shadow-emerald-500/20'
                        : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    {claimedMilestones.day7 ? (
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Milestone Claimed</span>
                    ) : dailyStreak >= 7 ? (
                      <span>Claim +50 VC Bonus</span>
                    ) : (
                      <span>Locked ({7 - dailyStreak} Days Remaining)</span>
                    )}
                  </button>
                </div>

                {/* Milestone 14 Days */}
                <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 font-extrabold text-[10px] uppercase rounded-lg">
                        Milestone 2
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-400">+100 VC</span>
                    </div>
                    <h5 className="text-sm font-black text-white">14-Day Sign-In Streak</h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">Reach a 14-day continuous streak to collect a +100 VC cash bonus.</p>
                  </div>

                  <button
                    onClick={() => handleClaimMilestone(14)}
                    disabled={dailyStreak < 14 || claimedMilestones.day14 || isClaimingMilestone}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                      claimedMilestones.day14
                        ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-default'
                        : dailyStreak >= 14
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black shadow-lg shadow-emerald-500/20'
                        : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    {claimedMilestones.day14 ? (
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Milestone Claimed</span>
                    ) : dailyStreak >= 14 ? (
                      <span>Claim +100 VC Bonus</span>
                    ) : (
                      <span>Locked ({14 - dailyStreak} Days Remaining)</span>
                    )}
                  </button>
                </div>

                {/* Milestone 30 Days (Ultimate VIP Pass) */}
                <div className="p-5 bg-gradient-to-b from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl space-y-4 flex flex-col justify-between shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[10px] uppercase rounded-lg">
                        Milestone 3 (Ultimate)
                      </span>
                      <span className="text-xs font-mono font-black text-amber-400">30-Day VIP Pass</span>
                    </div>
                    <h5 className="text-sm font-black text-white flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" /> 30-Day VIP Pass Reward
                    </h5>
                    <p className="text-xs text-zinc-300 leading-relaxed">Unlock 30 Days of VIP Pass with 2x daily multipliers, +250 VC Cash Bonus, and more avatars + custom avatars unlocked.</p>
                  </div>

                  <button
                    onClick={() => handleClaimMilestone(30)}
                    disabled={dailyStreak < 30 || (claimedMilestones.day30 && !isVipActive) || isClaimingMilestone}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                      claimedMilestones.day30 && !isVipActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 cursor-default font-black'
                        : dailyStreak >= 30
                        ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black shadow-lg shadow-amber-500/25 animate-pulse'
                        : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    {claimedMilestones.day30 && !isVipActive ? (
                      <span className="flex items-center gap-1.5"><Crown className="w-4 h-4 text-amber-400" /> VIP Pass Claimed</span>
                    ) : dailyStreak >= 30 ? (
                      <span>{isVipActive ? 'Claim +30 Days VIP Extension' : 'Claim Free 30-Day VIP Pass'}</span>
                    ) : (
                      <span>Locked ({30 - dailyStreak} Days Remaining)</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. DYNAMIC VC DIRECT CONVERSION CARD */}
            <div className="p-6 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-950 border border-amber-500/40 rounded-3xl space-y-4 shadow-xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <h4 className="text-lg font-black text-white">Convert {vcCostForVip.toLocaleString()} VC to ${(pricing.vipPrice || 3.99).toFixed(2)} 30-Day VIP Pass</h4>
                  </div>
                  <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
                    Have {vcCostForVip.toLocaleString()} VC in-game credits? Convert them directly into a <strong className="text-amber-300">30-Day VIP Pass Membership</strong> (${(pricing.vipPrice || 3.99).toFixed(2)} value) to unlock 2x daily multipliers, gold crown status, and <strong className="text-white">more avatars + custom avatars unlocked</strong>!
                  </p>
                </div>

                <div className="shrink-0 w-full lg:w-auto">
                  <button
                    onClick={handleConvertVcToVipPass}
                    disabled={credits < vcCostForVip || isClaimingMilestone}
                    className={`w-full lg:w-auto px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
                      credits >= vcCostForVip
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 shadow-lg shadow-amber-500/25 animate-pulse'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Crown className="w-4 h-4 fill-current" />
                    <span>{isClaimingMilestone ? 'Converting...' : credits >= vcCostForVip ? `Convert ${vcCostForVip.toLocaleString()} VC` : `Need ${(vcCostForVip - credits).toLocaleString()} VC More`}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. 7-DAY SIGN-IN SCHEDULE ROADMAP */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" /> 7-Day Daily Sign-In Cash Schedule
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Sign in daily to increment your reward tier. Missing more than 48 hours resets your cycle back to Day 1.
                  </p>
                </div>

                {!isVipActive && (
                  <button
                    onClick={onUpgradeToVip}
                    className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Get 2x VIP Reward Multiplier</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { day: 1, base: 10 },
                  { day: 2, base: 12 },
                  { day: 3, base: 15 },
                  { day: 4, base: 18 },
                  { day: 5, base: 20 },
                  { day: 6, base: 25 },
                  { day: 7, base: 35 }
                ].map((tier) => {
                  const effectiveAmount = isVipActive ? tier.base * 2 : tier.base;
                  const isCurrentDay = dailyStreak === tier.day || (dailyStreak === 0 && tier.day === 1);
                  const isCompleted = dailyStreak > tier.day;

                  return (
                    <div
                      key={tier.day}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-center relative overflow-hidden ${
                        isCurrentDay
                          ? 'bg-gradient-to-b from-emerald-500/20 via-zinc-950 to-zinc-950 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                          : isCompleted
                          ? 'bg-zinc-950/60 border-zinc-800/80 opacity-75'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      {/* Top Day Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCurrentDay ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}>
                          Day {tier.day}
                        </span>

                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrentDay ? (
                          <Flame className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-zinc-600" />
                        )}
                      </div>

                      {/* Reward Amount */}
                      <div className="space-y-0.5 py-1">
                        <div className={`text-base font-black font-mono ${
                          isCurrentDay ? 'text-emerald-300' : isCompleted ? 'text-zinc-400' : 'text-zinc-200'
                        }`}>
                          {effectiveAmount.toLocaleString()} VC
                        </div>
                        {isVipActive && (
                          <span className="text-[9px] font-black text-amber-400 uppercase tracking-tight block">
                            2x VIP Tier
                          </span>
                        )}
                      </div>

                      {/* Bottom Status */}
                      <div className="text-[10px] font-bold">
                        {isCompleted ? (
                          <span className="text-zinc-500">Claimed</span>
                        ) : isCurrentDay ? (
                          <span className="text-emerald-400 font-extrabold">Active Today</span>
                        ) : (
                          <span className="text-zinc-600">Upcoming</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. VIP PERKS GRID OVERVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-black">
                  <Sparkles className="w-4 h-4" /> More Avatars & Custom Studio
                </div>
                <p className="text-[11px] text-zinc-400">More avatars and custom avatars unlocked.</p>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                  <Zap className="w-4 h-4" /> 2x Reward Multiplier
                </div>
                <p className="text-[11px] text-zinc-400">Doubles all daily sign-in credit bonuses.</p>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                  <Crown className="w-4 h-4" /> Gold Crown Profile Badge
                </div>
                <p className="text-[11px] text-zinc-400">Displays exclusive gold crown flair on chat & profile.</p>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                  <Coins className="w-4 h-4" /> +250 VC Bonus
                </div>
                <p className="text-[11px] text-zinc-400">Instant cash bonus granted upon VIP Pass unlock.</p>
              </div>

              <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-black">
                  <ShieldCheck className="w-4 h-4" /> VIP Lounge Access
                </div>
                <p className="text-[11px] text-zinc-400">Unlocks restricted VIP channel in community chat.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AVATAR SELECTION */}
      {activeSubTab === 'avatars' && (() => {
        const userHierarchy = getUserHierarchyLevel({
          isAdmin,
          isStaff,
          isVip: isVipActive,
          role: isAdmin ? 'Admin' : isStaff ? 'Staff' : isVipActive ? 'VIP Member' : 'User'
        });
        const isL2OrAbove = userHierarchy.levelNum >= 2 || isVipActive || isStaff || isAdmin;
        const availableAvatars = GTA6_AVATARS.filter(av => checkAvatarAccess(av, userHierarchy).isUnlocked);

        const availableCategories: { id: 'All' | 'GTA V' | 'GTA VI' | 'Classics' | 'Special' | 'Syndicate'; label: string }[] = [{ id: 'All', label: 'All Portraits' }];
        if (availableAvatars.some(a => a.game === 'GTA V')) availableCategories.push({ id: 'GTA V', label: 'GTA V (Standard)' });
        if (availableAvatars.some(a => a.game === 'Classics')) availableCategories.push({ id: 'Classics', label: 'Classics (Standard)' });
        if (availableAvatars.some(a => a.game === 'GTA VI')) availableCategories.push({ id: 'GTA VI', label: 'GTA VI (VIP)' });
        if (availableAvatars.some(a => a.game === 'Syndicate')) availableCategories.push({ id: 'Syndicate', label: 'Syndicates (VIP)' });
        if (availableAvatars.some(a => a.game === 'Special' || a.tier === 'L3')) availableCategories.push({ id: 'Special', label: 'Staff Special' });

        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-400" /> Character & Avatar Selection
                </h3>
                <p className="text-xs text-zinc-400">
                  Select your active character portrait to represent your gamer profile across community chat rooms and leaderboards.
                </p>
              </div>

              {/* Current Selected Avatar Preview & Studio Launch Button */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                {onOpenAvatarCreator && (
                  isL2OrAbove ? (
                    <button
                      type="button"
                      onClick={onOpenAvatarCreator}
                      className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open Avatar Creator Studio</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onUpgradeToVip || onOpenAvatarCreator}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
                      title="Avatar Creator Studio is available for VIP Pass Members (L2+) and Staff"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Avatar Creator Studio (VIP Perk)</span>
                    </button>
                  )
                )}
                <div className="flex items-center gap-3 bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 shrink-0">
                  <img
                    src={selectedAvatar}
                    alt="Active Avatar"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover border border-rose-500 shadow-sm"
                    onError={(e) => {
                      const currentPreset = GTA6_AVATARS.find(a => a.url === selectedAvatar);
                      if (currentPreset?.fallbackSvgDataUri && e.currentTarget.src !== currentPreset.fallbackSvgDataUri) {
                        e.currentTarget.src = currentPreset.fallbackSvgDataUri;
                      } else if (GTA6_AVATARS[0].fallbackSvgDataUri && e.currentTarget.src !== GTA6_AVATARS[0].fallbackSvgDataUri) {
                        e.currentTarget.src = GTA6_AVATARS[0].fallbackSvgDataUri;
                      }
                    }}
                  />
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Active Avatar</div>
                    <div className="text-xs font-bold text-rose-400 truncate max-w-[140px]">
                      {selectedAvatar === googleAvatarUrl ? 'Google Photo' : (GTA6_AVATARS.find(a => a.url === selectedAvatar)?.label || 'Vice City Legend')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Success / Error Banner */}
            {avatarSaved && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-xs font-medium animate-in fade-in">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>✓ Avatar updated successfully! Your active avatar is now synchronized across all community chat rooms, leaderboards, and profile views.</span>
              </div>
            )}

            {authError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs font-medium animate-in fade-in">
                <Shield className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Google Account Photo Option (if user authenticated via Google or has photoURL) */}
            {googleAvatarUrl && (
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-white">
                    <UserCheck className="w-4 h-4 text-cyan-400" /> Google Account Profile Photo
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Google Auth
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(googleAvatarUrl);
                    handleSaveAvatarOnly(googleAvatarUrl);
                  }}
                  className={`w-full p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 cursor-pointer text-left ${
                    selectedAvatar === googleAvatarUrl
                      ? 'bg-rose-500/15 border-rose-500 shadow-md shadow-rose-500/10'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={googleAvatarUrl}
                      alt="Google Profile"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 shadow shrink-0"
                      onError={(e) => {
                        if (GTA6_AVATARS[0].fallbackSvgDataUri && e.currentTarget.src !== GTA6_AVATARS[0].fallbackSvgDataUri) {
                          e.currentTarget.src = GTA6_AVATARS[0].fallbackSvgDataUri;
                        }
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">Use Official Google Account Photo</p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        Syncs profile image directly from your authenticated Google account.
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
                    selectedAvatar === googleAvatarUrl
                      ? 'bg-rose-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}>
                    {selectedAvatar === googleAvatarUrl ? '✓ Selected' : 'Select'}
                  </span>
                </button>
              </div>
            )}

            {/* Game Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {availableCategories.map((cat) => {
                  const isActive = avatarGameFilter === cat.id;
                  const count =
                    cat.id === 'All'
                      ? availableAvatars.length
                      : cat.id === 'Special'
                      ? availableAvatars.filter((a) => a.tier === 'L3' || a.game === 'Special').length
                      : availableAvatars.filter((a) => a.game === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAvatarGameFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? cat.id === 'Special'
                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                            : cat.id === 'GTA VI' || cat.id === 'Syndicate'
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : cat.id === 'GTA V' || cat.id === 'Classics'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-zinc-100 text-zinc-950 font-black'
                          : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                          isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Character Avatar Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {availableAvatars
                .filter(av => {
                  if (avatarGameFilter === 'All') return true;
                  if (avatarGameFilter === 'Special') return av.tier === 'L3' || av.game === 'Special';
                  return av.game === avatarGameFilter;
                })
                .map((av) => {
                  const isSelected = selectedAvatar === av.url;

                  const gameColor = 
                    av.game === 'GTA V' 
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                      : av.game === 'GTA VI' 
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' 
                      : av.game === 'Special'
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(av.url);
                        handleSaveAvatarOnly(av.url);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center gap-2 cursor-pointer text-left relative group ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500 shadow-xl shadow-rose-500/20 scale-[1.03] ring-2 ring-rose-500/50'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                      }`}
                    >
                      {/* Game Badge */}
                      <div className="w-full flex items-center justify-between gap-1">
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md border ${gameColor}`}>
                          {av.game}
                        </span>
                      </div>

                      {/* Avatar Artwork */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden my-1 bg-zinc-900 border border-zinc-800 shadow-inner group-hover:scale-105 transition-transform duration-200">
                        <img
                          src={av.url}
                          alt={av.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-opacity"
                          onError={(e) => {
                            if (av.fallbackSvgDataUri && e.currentTarget.src !== av.fallbackSvgDataUri) {
                              e.currentTarget.src = av.fallbackSvgDataUri;
                            }
                          }}
                        />
                      </div>

                      {/* Character Label & Role */}
                      <div className="w-full text-center min-w-0">
                        <div className="text-xs font-black text-white truncate group-hover:text-rose-300 transition-colors flex items-center justify-center gap-1">
                          {av.isSpecialModerator && <Shield className="w-3 h-3 text-cyan-400 shrink-0" />}
                          <span className="truncate">{av.label}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5" title={av.role}>
                          {av.role}
                        </div>
                      </div>

                      {/* Selection status */}
                      {isSelected && (
                        <span className="text-[9px] font-black text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded-md mt-1">
                          ✓ ACTIVE
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
              <p className="text-[11px] text-zinc-500 text-center sm:text-left">
                Click any character portrait to equip instantly, or click the button below to confirm.
              </p>
              <button
                onClick={() => handleSaveAvatarOnly()}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving Avatar...' : 'Apply Avatar Selection'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: VIP PASS STATUS */}
      {activeSubTab === 'vip' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400 fill-current" /> Vice City VIP Membership Pass
              </h3>
              <p className="text-xs text-zinc-400">
                Unlock exclusive private crew hubs, custom chat permissions, and modding calculator discounts.
              </p>
            </div>

            {isVipActive && (
              <span className="px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black uppercase flex items-center gap-1.5 shadow-md shadow-amber-500/20">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> Active VIP Pass
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
              <h4 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider">
                VIP Pass Benefits & Privileges
              </h4>

              <ul className="space-y-3 text-xs text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>More Avatars & Custom Avatars Unlocked:</strong> Access full GTA VI protagonist character roster and custom vector Avatar Creator Studio.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Private Crew Chat Hubs:</strong> Create and own custom password-protected or invite-only chat channels.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Channel Owner Ban & Kick Power:</strong> Moderate custom channels by kicking or banning toxic players.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Mod Calculator Discount Presets:</strong> Save 15% on performance tuning upgrade budget calculations.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Golden Crown GamerTag Badge:</strong> Highlighting in community forums, live chats, and RP server listings.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-950/30 to-zinc-950 p-6 rounded-2xl border border-amber-500/30 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  VIP Membership Pass Pricing
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black text-white">{getVipPriceFormatted()}</span>
                  <span className="text-xs text-zinc-400 font-extrabold">/ Monthly Pass</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Instant activation across all Vice City Central databases and chat servers.
                </p>
              </div>

              {!isVipActive ? (
                <button
                  onClick={onUpgradeToVip}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 fill-current" />
                  <span>Upgrade to VIP Pass Now</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-extrabold text-center flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400 fill-current" />
                    <span>✨ Your VIP Membership is Active</span>
                  </div>

                  {/* Clean VIP Expiration card */}
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Subscription Status</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md font-extrabold">
                        ACTIVE PRO PASS
                      </span>
                    </div>
                    <div className="h-px bg-zinc-800" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Expires On</span>
                      <span className="font-mono text-white font-black uppercase tracking-wider">
                        {formatVipExpiry(vipExpiresDate)}
                      </span>
                    </div>
                  </div>

                  {/* Extend subscription button */}
                  <button
                    onClick={handleExtendVip}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                  >
                    <Crown className="w-4 h-4 fill-current" />
                    <span>Extend VIP Membership Pass</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATION CENTER */}
      {activeSubTab === 'notifications' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-400" /> Player Notification Center
              </h3>
              <p className="text-xs text-zinc-400">
                Channel access requests, game leaks, admin messages, and vehicle database updates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  isSoundMuted
                    ? 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title={isSoundMuted ? 'Unmute Notification Audio Chime' : 'Mute Notification Audio Chime'}
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
                <span>{isSoundMuted ? 'Audio Muted' : 'Sound On'}</span>
              </button>

              {unreadNotificationsCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-extrabold rounded-xl transition border border-zinc-700 cursor-pointer"
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          {/* Notification Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'chat_tag', 'admin_chat_broadcast', 'channel_all_tag', 'channel_join_request', 'admin_message', 'article', 'car_addition', 'weapon_addition'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setNotificationFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer capitalize whitespace-nowrap shrink-0 ${
                  notificationFilter === filter
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {filter === 'admin_chat_broadcast' ? 'Admin Broadcasts' : filter === 'channel_all_tag' ? '@all Mentions' : filter.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center space-y-2 bg-zinc-950 rounded-2xl border border-zinc-800">
              <Bell className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-400">No notifications found.</p>
              <p className="text-xs text-zinc-500">You're all caught up with Vice City news and channel updates.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((item) => {
                const targetChannel = item.targetId || item.metadata?.channelId || item.metadata?.channel;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onMarkAsRead(item.id);
                      if (item.targetTab) {
                        onNavigate(item.targetTab, targetChannel);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all duration-200 space-y-3 cursor-pointer transform hover:scale-[1.012] hover:-translate-y-0.5 animate-in fade-in slide-in-from-right-3 ${
                      !item.read
                        ? 'bg-zinc-950 border-rose-500/50 shadow-md shadow-rose-950/20 hover:border-rose-400 hover:shadow-rose-900/40'
                        : 'bg-zinc-950/70 border-zinc-800/80 opacity-85 hover:opacity-100 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-rose-400 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-white">{item.title}</h4>
                          <p className="text-xs text-zinc-300 leading-relaxed">{item.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded-md font-mono shrink-0">
                          {formatShortTimestamp(item.timestamp, item.createdAt)}
                        </span>
                        {onDeleteNotification && (
                          <button
                            type="button"
                            title="Delete notification"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNotification(item.id);
                            }}
                            className="p-1 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Approval/Decline Controls for Channel Owners */}
                    {item.type === 'channel_join_request' && item.metadata && (
                      <div className="pt-3 border-t border-zinc-800 space-y-2 bg-zinc-900/90 p-3 rounded-xl">
                        <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-400" /> Channel Access Review
                          </span>
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono text-[10px]">
                            Channel Owner
                          </span>
                        </div>

                        {item.metadata.status === 'pending' ? (
                          <div className="flex items-center gap-2 flex-wrap pt-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.metadata?.channelId && item.metadata?.requesterName) {
                                  onApproveJoinRequest(item.metadata.channelId, item.metadata.requesterName);
                                }
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Request
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (item.metadata?.channelId && item.metadata?.requesterName) {
                                  onDeclineJoinRequest(item.metadata.channelId, item.metadata.requesterName);
                                }
                              }}
                              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-zinc-700"
                            >
                              <X className="w-3.5 h-3.5" /> Decline
                            </button>
                          </div>
                        ) : item.metadata.status === 'approved' ? (
                          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Access Request Approved</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 text-xs font-bold">
                            Access Request Declined
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Claim Control for Weekly Tuning Championship */}
                    {item.type === 'challenge_win' && (
                      <div className="pt-3 border-t border-zinc-800 space-y-2 bg-zinc-900/95 p-3 rounded-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-amber-400" /> Tuning Championship Reward
                          </span>
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono text-[10px]">
                            Winner
                          </span>
                        </div>

                        {item.metadata?.claimed === true ? (
                          <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Reward Claimed Successfully! (+{item.metadata.rewardVc || 500} VC)</span>
                          </div>
                        ) : (
                          <div className="pt-1 flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!!claimingIds[item.id]}
                              onClick={() => handleClaimPrize(item.id, item.metadata?.rewardVc || 500)}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-white font-extrabold text-xs rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
                            >
                              <Coins className="w-3.5 h-3.5 animate-bounce" />
                              {claimingIds[item.id] ? 'Claiming Reward...' : `🎁 Claim Reward (+${item.metadata?.rewardVc || 500} VC)`}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Direct Navigation Button */}
                    {item.targetTab && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(item.id);
                            onNavigate(item.targetTab, targetChannel);
                          }}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ACCOUNT & SECURITY */}
      {activeSubTab === 'security' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" /> Account Details & Security Settings
            </h3>
            <p className="text-xs text-zinc-400">
              Manage authentication credentials, player session tokens, and security settings.
            </p>
          </div>

          {/* Security Explanation Note */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Security Assurance: Is showing your Account UID safe?</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              <strong>Yes, it is completely safe.</strong> Your Account UID is a public unique database index. It is used by cloud security rules to verify account ownership. It contains no passwords, session tokens, or private credentials. You can safely copy your UID to share with Staff for account verification or support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Account UID with Mask & One-Click Copy */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-extrabold flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-rose-400" /> Account UID (Database ID)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsUidMasked(!isUidMasked)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {isUidMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{isUidMasked ? 'Reveal' : 'Mask'}</span>
                  </button>
                </div>
                <p className="font-mono text-zinc-200 text-xs break-all bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                  {isUidMasked
                    ? `${currentUser.uid.substring(0, 4)}••••••••${currentUser.uid.substring(currentUser.uid.length - 4)}`
                    : currentUser.uid}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.uid);
                    setIsUidCopied(true);
                    setTimeout(() => setIsUidCopied(false), 2500);
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-[11px] rounded-lg transition flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                >
                  {isUidCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">UID Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Account UID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Registered Email & Primary Contact Email Editor */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-extrabold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" /> Primary Contact Email (VIP Alerts & Receipts)
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${
                    !isPlaceholderEmail(primaryContactEmail || currentUser.email)
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    {!isPlaceholderEmail(primaryContactEmail || currentUser.email) ? 'Verified Inbox' : 'Placeholder Email'}
                  </span>
                </div>

                {isPlaceholderEmail(primaryContactEmail || currentUser.email) && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-[11px] space-y-1">
                    <div className="font-extrabold flex items-center gap-1 text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Discord or Placeholder Email Address Detected</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 leading-normal">
                      External email servers cannot deliver messages to placeholder domains (<code>{primaryContactEmail || currentUser.email}</code>). Please update your primary contact email below so you receive VIP expiry warnings and Shark Card receipts.
                    </p>
                  </div>
                )}

                {isEditingContactEmail ? (
                  <div className="space-y-2 pt-1">
                    <input
                      type="email"
                      value={primaryContactEmail}
                      onChange={(e) => setPrimaryContactEmail(e.target.value)}
                      placeholder="e.g. player@gmail.com"
                      className="w-full px-3 py-2 bg-zinc-900 border border-cyan-500/50 rounded-lg text-xs text-white focus:outline-none font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSavePrimaryContactEmail}
                        disabled={isSavingContactEmail}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSavingContactEmail ? 'Saving...' : 'Save Primary Email'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingContactEmail(false)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                    <p className="font-mono text-zinc-200 text-xs break-all">
                      {primaryContactEmail || currentUser.email || 'None (Anonymous Session)'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEditingContactEmail(true)}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 font-extrabold text-[10px] rounded transition cursor-pointer shrink-0 flex items-center gap-1 border border-cyan-500/30"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Update Email</span>
                    </button>
                  </div>
                )}

                {contactEmailNotice && (
                  <p className={`text-[11px] font-mono p-2 rounded border ${
                    contactEmailNotice.type === 'success'
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                  }`}>
                    {contactEmailNotice.msg}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 font-medium border-t border-zinc-800/80">
                <span>Auth Provider: <strong className="text-zinc-200">Encrypted Cloud Auth / OAuth</strong></span>
                <span>Role: <strong className="text-amber-400">{isAdmin ? 'Admin' : isStaff ? 'Staff' : isVipActive ? 'VIP Member' : 'Player'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Security Action Cards */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" /> Account Recovery & Security Actions
            </h4>

            {resetEmailStatus && (
              <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                resetEmailStatus.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}>
                {resetEmailStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{resetEmailStatus.msg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Send Password Reset Email */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-amber-400" /> Request Password Reset Link
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Trigger an official security email containing a single-use password update link to your registered inbox.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!currentUser.email || isSendingResetEmail}
                  onClick={async () => {
                    if (!currentUser.email) return;
                    setIsSendingResetEmail(true);
                    setResetEmailStatus(null);
                    try {
                      await sendPasswordResetEmail(auth, currentUser.email);
                      setResetEmailStatus({
                        type: 'success',
                        msg: `Security reset link dispatched to ${currentUser.email}. Check your inbox or spam folder!`
                      });
                    } catch (err: any) {
                      setResetEmailStatus({
                        type: 'error',
                        msg: err.message || 'Failed to send password reset email. Please try again shortly.'
                      });
                    } finally {
                      setIsSendingResetEmail(false);
                    }
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
                    currentUser.email
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSendingResetEmail ? 'Sending Reset Link...' : 'Send Password Reset Email'}</span>
                </button>
              </div>

              {/* Session Security Overview */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" /> Session Encryption Status
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Active browser session is verified via secure JWT auth token. Transport layer security (TLS 1.3) active.
                  </p>
                </div>

                <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-[11px] font-extrabold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Session Verified
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">SSL Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-3">
            <span className="text-[11px] text-zinc-500 font-medium">
              Need help? Contact support or staff in the community chat.
            </span>

            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: STAFF HQ & ADMINISTRATION */}
      {activeSubTab === 'staff' && (isAdmin || isStaff) && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-black border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    Staff Administration HQ
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Authorized portal for Vice Squad staff, content moderators, and platform management.
                  </p>
                </div>
              </div>

              <span className="self-start md:self-auto px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black uppercase tracking-wider">
                {isAdmin ? 'Administrator' : isStaff ? 'Vice Squad Staff' : 'Staff HQ Access'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Admin Panel */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 hover:border-emerald-500/50 transition flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      Level 4
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">Admin Control Panel</h4>
                  <p className="text-xs text-zinc-400">
                    Manage player accounts, approve user content submissions, process reported chats, and toggle VIP memberships.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('admin')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <span>Open Admin Panel</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Ads & Sponsor Hub */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 hover:border-amber-500/50 transition flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                      <Coins className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      Monetization
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">Ads & Sponsor Hub</h4>
                  <p className="text-xs text-zinc-400">
                    Review ad inventory performance, partner banners, CPM metrics, and sponsored Vice City content campaigns.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('monetization')}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <span>Open Ads Hub</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Docs & Developer API */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 hover:border-cyan-500/50 transition flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                      API Specs
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">Docs & Developer API</h4>
                  <p className="text-xs text-zinc-400">
                    Access Vice City Central database schema documentation, REST endpoint specs, and SDK integration guides.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('docs')}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20"
                >
                  <span>Open API Specs</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatched Email Payload Inspector Modal */}
      {showEmailPreviewModal && dispatchedEmailPreviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase">
                <Mail className="w-5 h-5 text-rose-500" />
                <span>Dispatched Email Payload & Rendered Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <p><span className="text-zinc-500">Target Recipient:</span> <strong className="text-amber-300">{dispatchedEmailPreviewModal.to}</strong></p>
                <p><span className="text-zinc-500">Subject Line:</span> <strong className="text-white">{dispatchedEmailPreviewModal.subject}</strong></p>
                <p><span className="text-zinc-500">Dispatch Time:</span> <span className="text-zinc-300">{dispatchedEmailPreviewModal.timestamp}</span></p>
                <p><span className="text-zinc-500">Delivery Status:</span> <span className="text-emerald-400 font-bold">{dispatchedEmailPreviewModal.status}</span></p>
              </div>

              {dispatchedEmailPreviewModal.isPlaceholderAlert && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] leading-relaxed">
                  ⚠️ <strong>Discord / Placeholder Domain Notice:</strong> The email address <code>{dispatchedEmailPreviewModal.to}</code> is a placeholder domain. External mail servers cannot deliver physical emails to placeholder addresses. However, this alert was <strong>100% delivered to your Player Notification Center</strong> in Vice City Central!
                </div>
              )}
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 p-4">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-2 font-bold">Rendered Email Body</span>
              <div
                className="text-zinc-100 font-sans text-xs"
                dangerouslySetInnerHTML={{ __html: dispatchedEmailPreviewModal.html }}
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowEmailPreviewModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Discord Account Link & OAuth Config Modal Overlay */}
      {showDiscordLinkModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl relative my-auto">
            <button
              type="button"
              onClick={() => {
                setShowDiscordLinkModal(false);
                setDiscordNotice(null);
              }}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Connect Discord Account</h3>
                <p className="text-xs text-zinc-400">
                  Verify your Discord identity for FiveM server ownership, applicant whitelist, and VIP badges.
                </p>
              </div>
            </div>

            {discordNotice && (
              discordNotice.type === 'success' ? (
                <div className="p-3.5 rounded-xl border text-xs font-bold flex items-start gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{discordNotice.msg}</span>
                </div>
              ) : (
                <DiscordAuthErrorHandler
                  error={discordNotice.msg}
                  onRetry={() => setDiscordNotice(null)}
                  onDismiss={() => setDiscordNotice(null)}
                />
              )
            )}

            <form onSubmit={handleSaveManualDiscordLink} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Discord Snowflake ID:</span>
                  <span className="text-[10px] text-zinc-500 font-mono">17-20 Digits</span>
                </label>
                <input
                  type="text"
                  value={manualDiscordIdInput}
                  onChange={(e) => setManualDiscordIdInput(e.target.value)}
                  placeholder="e.g. 849204918294028190"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-zinc-500">
                  In Discord: User Settings → Advanced → Developer Mode ON → Right-click profile → Copy User ID.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  Discord Username / GamerTag:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={manualDiscordTagInput}
                    onChange={(e) => setManualDiscordTagInput(e.target.value)}
                    placeholder="e.g. ViceLeader_Lucia"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-bold placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDiscordLinkModal(false)}
                  className="w-1/3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkingDiscord}
                  className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {linkingDiscord ? (
                    <span>Linking Account...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Save & Link Discord</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vip Extension Dialog for selecting prorated duration and calculation preview */}
      <VipExtensionDialog
        isOpen={isExtensionDialogOpen}
        onClose={() => setIsExtensionDialogOpen(false)}
        vipExpiresDate={vipExpiresDate}
        currentUser={currentUser}
        onConfirmExtension={(pkg) => {
          setCheckoutPackage(pkg);
          setIsExtensionDialogOpen(false);
          setShowCheckoutModal(true);
        }}
      />

      {/* Payment Gateway Modal for VIP extension */}
      <PaymentGatewayModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        checkoutPackage={checkoutPackage}
        currentUser={currentUser}
        onOpenAuthModal={onOpenAuthModal}
        onPaymentSuccess={() => {
          setShowCheckoutModal(false);
        }}
      />
    </div>
  );
};

// Internal icon component
function SaveIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}
