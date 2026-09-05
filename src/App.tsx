'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import { playNotificationChime } from './lib/soundUtils';
import { DEFAULT_GTA6_AVATAR } from './data/avatars';
import { ActiveTab, Vehicle, UserNotification } from './types';
import { VEHICLES_DATA } from './data/vehicles';
import { getCachedVehicles } from './lib/offlineStorage';
import { Navbar } from './components/Navbar';
import { MasterPortalHome } from './components/MasterPortalHome';
import { VehiclesTab } from './components/VehiclesTab';
import { WeaponsTab } from './components/WeaponsTab';
import { CharactersTab } from './components/CharactersTab';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { ModBuilderCalculator } from './components/ModBuilderCalculator';
import { BusinessRoiCalculator } from './components/BusinessRoiCalculator';
import { MapLockedModal, MapLockedScreen } from './components/map/MapLockedModal';
import { RpServerDirectory } from './components/RpServerDirectory';
import { MonetizationTab } from './components/MonetizationTab';
import { CommunityChatTab } from './components/CommunityChatTab';
import { AdminDashboardTab } from './components/AdminDashboardTab';
import { DocumentationTab } from './components/DocumentationTab';
import { PseoArchitectureTab } from './components/PseoArchitectureTab';
import { BlogTab } from './components/BlogTab';
import { ProfileTab } from './components/ProfileTab';
import { GiftCardTab } from './components/GiftCardTab';
import { TuningChallengesTab } from './components/challenges/TuningChallengesTab';
import { HandlingEditorTab } from './components/HandlingEditorTab';
import { EconomyBalancerTab } from './components/EconomyBalancerTab';
import { ScriptsGeneratorStudio } from './components/scripts/ScriptsGeneratorStudio';
import { CadMdtTerminal } from './components/cad/CadMdtTerminal';
import { IdentityCardGenerator } from './components/identity/IdentityCardGenerator';
import { RulesAndEventGenerator } from './components/generator/RulesAndEventGenerator';
import { DynastyEconomyDirectory } from './components/economy/DynastyEconomyDirectory';
import { GtaSeoKnowledgeHub } from './components/GtaSeoKnowledgeHub';
import { AdminAccessGuard } from './components/AdminAccessGuard';
import { AuthModal } from './components/AuthModal';
import { AvatarCreatorModal } from './components/AvatarCreatorModal';
import { AiTacticalAssistant } from './components/AiTacticalAssistant';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { ServerManageFormTab } from './components/whitelist/ServerManageFormTab';
import { ServerApplyTab } from './components/whitelist/ServerApplyTab';
import { ServerReviewTab } from './components/whitelist/ServerReviewTab';
import { ServerStatusTab } from './components/whitelist/ServerStatusTab';
import { ServerDashboardTab } from './components/whitelist/ServerDashboardTab';
import { ServerBillingPaywall } from './components/servers/ServerBillingPaywall';
import { ServerGrowthTab } from './components/servers/ServerGrowthTab';
import { SentinelStudioDashboard } from './components/studio/SentinelStudioDashboard';
import { MarketingWorkspace } from './components/marketing/MarketingWorkspace';
import { CopyrightPrivacyTab } from './components/CopyrightPrivacyTab';
import { AboutUsTab } from './components/AboutUsTab';
import { InvestorPitchTab } from './components/InvestorPitchTab';
import { ForServersPage } from './components/ForServersPage';
import { ServerOnboardingWizard } from './components/ServerOnboardingWizard';
import { AdminBusinessDashboard } from './components/AdminBusinessDashboard';
import { NotFoundPage } from './components/NotFoundPage';
import { Footer } from './components/Footer';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { registerServiceWorker, preloadAllCriticalData } from './lib/offlineStorage';
import { syncDiscordConfigFromServer } from './lib/discordOAuthHelper';
import { getTabFromPath, updatePageSeoMeta, TAB_TO_PATH, PATH_TO_TAB } from './lib/seoRouting';
import { initSeoRealtimeSync } from './lib/seoStore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Gift, Bug, Camera, CheckCircle2, AlertTriangle, XCircle, Sparkles, Coins, Mail } from 'lucide-react';
import { getRewardCooldown, claimDailyReward, getTimestampFromClaimDate, checkUserRewardStatus } from './lib/rewardUtils';
import { motion, AnimatePresence } from 'motion/react';
import { AdScriptLoader } from './components/ads/AdScriptLoader';
import { detectSubdomainMode, SubdomainMode } from './lib/subdomainRouter';
import { SubdomainBanner } from './components/SubdomainBanner';
import { logStaffActivity } from './lib/staffAuditLogger';
import { isAdminUser, isStaffUser, isVipUser } from './lib/rbac';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Always scroll window to top whenever activeTab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [activeTab]);
  const [currentServerSlug, setCurrentServerSlug] = useState<string>('vice-city-life-rp');
  const [activeChatChannel, setActiveChatChannel] = useState<string>('general');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState<boolean>(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState<boolean>(false);
  const [isOfflineSyncOpen, setIsOfflineSyncOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isMapLockedModalOpen, setIsMapLockedModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/map') || window.location.search.includes('tab=map');
    }
    return false;
  });
  const [isVipActive, setIsVipActive] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  
  // Subdomain Isolation & Multi-Tenant Mode State
  const [subdomainState, setSubdomainState] = useState<{
    mode: SubdomainMode;
    hostname: string;
    isSimulated: boolean;
    subdomainPrefix: string;
  }>({
    mode: 'portal',
    hostname: '',
    isSimulated: false,
    subdomainPrefix: ''
  });

  // Helper for Client-Side URL History Routing & SEO Schema Injection
  const handleTabChange = (rawTab: ActiveTab | string, targetId?: string, pushState: boolean = true) => {
    let newTab: ActiveTab = rawTab as ActiveTab;
    if (rawTab === 'whitelist' || rawTab === 'whitelist-review') newTab = 'server-review';
    else if (rawTab === 'whitelist-manage') newTab = 'server-manage';
    else if (rawTab === 'whitelist-apply') newTab = 'server-apply';
    else if (rawTab === 'whitelist-status') newTab = 'server-status';

    window.scrollTo(0, 0);
    setActiveTab(newTab);
    if (newTab === 'map') {
      setIsMapLockedModalOpen(true);
    }
    if (newTab !== 'profile') {
      setProfileSubTab('overview');
    }
    if (newTab === 'chat' && targetId) {
      setActiveChatChannel(targetId);
    }
    if ((newTab.startsWith('server-') || newTab.startsWith('whitelist-')) && targetId) {
      setCurrentServerSlug(targetId);
    }
    updatePageSeoMeta(newTab);
    if (pushState && typeof window !== 'undefined') {
      let targetPath = TAB_TO_PATH[newTab] || '/';
      if (newTab === 'server-manage') targetPath = `/servers/${targetId || currentServerSlug}/manage`;
      else if (newTab === 'server-apply') targetPath = `/servers/${targetId || currentServerSlug}/apply`;
      else if (newTab === 'server-review') targetPath = `/servers/${targetId || currentServerSlug}/review`;
      else if (newTab === 'server-status') targetPath = `/servers/${targetId || currentServerSlug}/status`;
      else if (newTab === 'server-dashboard') targetPath = `/servers/${targetId || currentServerSlug}/dashboard`;
      else if (newTab === 'server-studio') targetPath = `/servers/${targetId || currentServerSlug}/studio`;

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab: newTab, targetId: targetId || currentServerSlug }, '', targetPath);
      }
    }
  };

  // Sync Initial URL Route on Mount, Hydrate Session State from localStorage & Register SW
  useEffect(() => {
    registerServiceWorker();
    syncDiscordConfigFromServer();
    const unsubSeo = initSeoRealtimeSync();
    preloadAllCriticalData().catch((err) => {
      console.warn('Initial offline cache preload notice:', err);
    });

    // Hydrate tab state from initial window path & check popout URL params
    const { tab: initialTab, slug: initialSlug } = getTabFromPath(window.location.pathname);
    if (initialSlug) {
      setCurrentServerSlug(initialSlug);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const isPopoutMode = urlParams.get('popout') === 'true';
    const popoutChannel = urlParams.get('channel');
    const tabParam = urlParams.get('tab') || urlParams.get('page');

    // Detect Subdomain Isolation Mode (e.g. docs.domain.com or admin.domain.com or ?subdomain=docs)
    const detectedSubdomain = detectSubdomainMode();
    setSubdomainState(detectedSubdomain);

    let effectiveTab = initialTab;
    if (tabParam && (PATH_TO_TAB[`/${tabParam}`] || PATH_TO_TAB[tabParam] || tabParam === 'home')) {
      effectiveTab = (PATH_TO_TAB[`/${tabParam}`] || PATH_TO_TAB[tabParam] || tabParam) as ActiveTab;
    } else if (detectedSubdomain.mode === 'docs' && (window.location.pathname === '/' || window.location.pathname === '')) {
      effectiveTab = 'docs';
    } else if (detectedSubdomain.mode === 'admin' && (window.location.pathname === '/' || window.location.pathname === '')) {
      effectiveTab = 'admin';
    }

    if (isPopoutMode) {
      setActiveTab('chat');
      if (popoutChannel) {
        setActiveChatChannel(popoutChannel);
      }
      setIsVoiceModalOpen(true);
      updatePageSeoMeta('chat');
    } else {
      setActiveTab(effectiveTab);
      updatePageSeoMeta(effectiveTab);
    }

    // Restore saved session workflow state from localStorage (only if in standard portal mode)
    try {
      const savedSession = localStorage.getItem('gtavi_app_session_state');
      if (savedSession && !isPopoutMode && detectedSubdomain.mode === 'portal') {
        const parsed = JSON.parse(savedSession);
        if (parsed.activeChatChannel && typeof parsed.activeChatChannel === 'string') {
          setActiveChatChannel(parsed.activeChatChannel);
        }
        // We do not restore the active voice call modal state on initial load to prevent premature mic prompts on boot.
        setIsVoiceModalOpen(false);
      }
    } catch (err) {
      console.warn('Failed to restore app session state from localStorage:', err);
    }

    // Handle browser Back / Forward & client-side route changes seamlessly
    const handlePopState = (e: PopStateEvent) => {
      const result = getTabFromPath(window.location.pathname);
      const tabFromState = e.state?.tab || result.tab;
      if (result.slug || e.state?.targetId) {
        setCurrentServerSlug(result.slug || e.state?.targetId);
      }
      setActiveTab(tabFromState);
      updatePageSeoMeta(tabFromState);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save current session state (activeTab, chat channel, voice modal status) to localStorage on state changes
  useEffect(() => {
    try {
      const sessionData = {
        activeTab,
        activeChatChannel,
        isVoiceModalOpen,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('gtavi_app_session_state', JSON.stringify(sessionData));
    } catch (err) {
      console.warn('Unable to persist session state to localStorage:', err);
    }
  }, [activeTab, activeChatChannel, isVoiceModalOpen]);
  
  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfileRecord, setUserProfileRecord] = useState<any>(null);

  // Helper to apply user permissions instantaneously from profile object
  const applyUserPermissions = (data: any, userEmail?: string | null) => {
    if (!data) return;
    const admin = isAdminUser(data, userEmail);
    const staff = isStaffUser(data, userEmail);
    const isVip = isVipUser(data.role, Boolean(data.isVip));

    setIsAdmin(admin);
    setIsStaff(staff);
    setIsVipActive(isVip || admin || staff);
    setUserProfileRecord(data);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          let data: any = null;

          // 1. Fetch from Server Profile API
          try {
            const emailParam = user.email ? `&email=${encodeURIComponent(user.email)}` : '';
            const apiRes = await fetch(`/api/user/profile?uid=${encodeURIComponent(user.uid)}${emailParam}`);
            if (apiRes.ok) {
              const payload = await apiRes.json();
              if (payload.success && payload.data) {
                data = payload.data;
              }
            }
          } catch (apiErr) {
            console.warn('Server profile API unavailable:', apiErr);
          }

          // 2. Auto-initialize new profile if missing
          if (!data) {
            const rawName = user.displayName || user.email?.split('@')[0] || 'ViceCityPlayer_2026';
            const defaultName = rawName.replace(/\s+/g, '_');
            const isInitialAdmin = isAdminUser({ email: user.email || '', username: defaultName }, user.email);
            const isInitialStaff = isStaffUser({ email: user.email || '', username: defaultName }, user.email);

            const initRole = isInitialAdmin ? 'Admin' : isInitialStaff ? 'Staff' : 'User';
            const initClearance = isInitialAdmin ? 'L4' : isInitialStaff ? 'L3' : 'Member';
            const initVc = isInitialAdmin ? 2500 : isInitialStaff ? 1000 : 100;

            data = {
              uid: user.uid,
              username: defaultName,
              usernameLower: defaultName.toLowerCase(),
              email: user.email || '',
              avatar: user.photoURL || DEFAULT_GTA6_AVATAR,
              role: initRole,
              isAdmin: isInitialAdmin,
              isStaff: isInitialStaff,
              clearanceLevel: initClearance,
              userLevel: initClearance,
              isVip: isInitialAdmin || isInitialStaff,
              vipExpires: isInitialAdmin ? 'Lifetime' : isInitialStaff ? 'Staff Account' : undefined,
              vcBalance: initVc,
              status: 'Active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Save to server API asynchronously
            fetch('/api/user/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            }).catch(() => {});
          }

          // Apply permissions immediately
          applyUserPermissions(data, user.email);

          const bestStreak = Math.max(
            data.dailyStreak || 0,
            data.rewardStreak || 0,
            data.streakCount || 0
          );

          setUserProfileRecord((prev: any) => ({
            ...(prev || {}),
            ...data,
            dailyStreak: bestStreak,
            rewardStreak: bestStreak,
            vcBalance: data.vcBalance ?? data.credits ?? prev?.vcBalance ?? 100
          }));

          const lastClaimMs = getTimestampFromClaimDate(
            data.lastClaimDate ? String(data.lastClaimDate) : undefined,
            typeof data.lastLogin === 'number' ? data.lastLogin : undefined
          );
          const cooldownRemaining = getRewardCooldown(lastClaimMs, data.lastClaimDate ? String(data.lastClaimDate) : undefined);
          setIsDailyRewardReady(lastClaimMs === 0 || cooldownRemaining === 0);

          // Non-blocking VIP expiry check
          const now = Date.now();
          if (data.vipUntil) {
            const expiry = typeof data.vipUntil === 'number' ? data.vipUntil : new Date(data.vipUntil).getTime();
            if (expiry <= now && data.isVip && !data.isAdmin && !data.isStaff) {
              fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid, isVip: false })
              }).catch(() => {});
            }
          }
        } catch (e) {
          console.warn('Could not bootstrap user profile:', e);
        }
      } else {
        setIsVipActive(false);
        setIsAdmin(false);
        setIsStaff(false);
        setUserProfileRecord(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Poll profile changes and synchronize Daily Reward readiness
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    const fetchLatestProfile = async () => {
      try {
        const emailParam = currentUser.email ? `&email=${encodeURIComponent(currentUser.email)}` : '';
        const apiRes = await fetch(`/api/user/profile?uid=${encodeURIComponent(currentUser.uid)}${emailParam}`);
        if (apiRes.ok && isMounted) {
          const payload = await apiRes.json();
          if (payload.success && payload.data) {
            const data = payload.data;
            applyUserPermissions(data, currentUser.email);

            const bestStreak = Math.max(
              data.dailyStreak || 0,
              data.rewardStreak || 0,
              data.streakCount || 0
            );

            setUserProfileRecord((prev: any) => ({
              ...(prev || {}),
              ...data,
              discordId: data.discordId || data.claimedByDiscordId || data.discordAuth?.discordId || prev?.discordId,
              discordUsername: data.discordUsername || data.claimedByDiscordUsername || data.discordTag || data.discordAuth?.discordUsername || prev?.discordUsername,
              discordConnected: Boolean(data.discordConnected || data.discordId || data.discordUsername || prev?.discordConnected),
              dailyStreak: bestStreak,
              rewardStreak: bestStreak,
              streakCount: bestStreak,
              vcBalance: data.vcBalance ?? data.credits ?? prev?.vcBalance ?? 0
            }));

            // Real-time synchronization of Daily Reward readiness from profile
            const lastClaimMs = getTimestampFromClaimDate(
              data.lastClaimDate ? String(data.lastClaimDate) : undefined,
              typeof data.lastLogin === 'number' ? data.lastLogin : (typeof data.lastClaimedTimestamp === 'number' ? data.lastClaimedTimestamp : undefined)
            );
            const cooldownRemaining = getRewardCooldown(lastClaimMs, data.lastClaimDate ? String(data.lastClaimDate) : undefined);
            const rewardReady = lastClaimMs === 0 || cooldownRemaining === 0;
            setIsDailyRewardReady(rewardReady);
          }
        }
      } catch (err) {
        console.warn('Failed to poll latest profile:', err);
      }
    };

    fetchLatestProfile();
    const interval = setInterval(fetchLatestProfile, 10000);

    const handleProfileUpdated = () => {
      fetchLatestProfile();
    };
    window.addEventListener('gtavi_discord_linked', handleProfileUpdated);
    window.addEventListener('gtavi_profile_updated', handleProfileUpdated);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('gtavi_discord_linked', handleProfileUpdated);
      window.removeEventListener('gtavi_profile_updated', handleProfileUpdated);
    };
  }, [currentUser?.uid]);

  const fullCurrentUser = useMemo(() => {
    if (!currentUser) return null;
    const localDiscordId = typeof window !== 'undefined' ? (localStorage.getItem('gtavi_discord_user_id') || undefined) : undefined;
    const localDiscordUsername = typeof window !== 'undefined' ? (localStorage.getItem('gtavi_discord_username') || undefined) : undefined;

    const resolvedDiscordId = userProfileRecord?.discordId || userProfileRecord?.claimedByDiscordId || userProfileRecord?.discordAuth?.discordId || userProfileRecord?.ownerDiscordId || localDiscordId || undefined;
    const resolvedDiscordUsername = userProfileRecord?.discordUsername || userProfileRecord?.claimedByDiscordUsername || userProfileRecord?.discordTag || userProfileRecord?.discordAuth?.discordUsername || localDiscordUsername || undefined;
    const isConnected = Boolean(userProfileRecord?.discordConnected || resolvedDiscordId || resolvedDiscordUsername);

    const bestStreak = Math.max(
      userProfileRecord?.dailyStreak || 0,
      userProfileRecord?.rewardStreak || 0,
      userProfileRecord?.streakCount || 0
    );

    return {
      uid: currentUser.uid,
      displayName: currentUser.displayName || userProfileRecord?.username || userProfileRecord?.gamerTag || currentUser.email?.split('@')[0],
      email: currentUser.email || undefined,
      discordUsername: resolvedDiscordUsername,
      discordId: resolvedDiscordId,
      discordConnected: isConnected,
      gamerTag: userProfileRecord?.gamerTag || userProfileRecord?.username || undefined,
      dailyStreak: bestStreak,
      rewardStreak: bestStreak,
      vcBalance: userProfileRecord?.vcBalance ?? userProfileRecord?.credits ?? 0
    };
  }, [currentUser, userProfileRecord]);

  // Daily Reward Ready State & Local Toast Notification
  const [profileSubTab, setProfileSubTab] = useState<'overview' | 'daily-reward' | 'avatars' | 'vip' | 'notifications' | 'security' | 'staff'>('overview');
  const [isDailyRewardReady, setIsDailyRewardReady] = useState<boolean>(false);
  const [hasDismissedRewardToast, setHasDismissedRewardToast] = useState<boolean>(false);
  const [isClaimingDaily, setIsClaimingDaily] = useState<boolean>(false);

  // Global event listener to dismiss toast when reward is claimed anywhere in the application
  useEffect(() => {
    const handleGlobalRewardClaimed = () => {
      setIsDailyRewardReady(false);
      setHasDismissedRewardToast(true);
      if (currentUser?.uid) {
        try {
          sessionStorage.setItem(`gtavi_reward_toast_dismissed_${currentUser.uid}`, 'true');
        } catch (e) {}
      }
    };
    window.addEventListener('gtavi_reward_claimed', handleGlobalRewardClaimed);
    return () => window.removeEventListener('gtavi_reward_claimed', handleGlobalRewardClaimed);
  }, [currentUser]);

  const handleDirectClaim = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the outer click from changing tabs
    if (!currentUser) return;
    setIsClaimingDaily(true);
    try {
      const res = await claimDailyReward(currentUser.uid);
      setIsDailyRewardReady(false);
      setHasDismissedRewardToast(true);
      try {
        sessionStorage.setItem(`gtavi_reward_toast_dismissed_${currentUser.uid}`, 'true');
      } catch (e) {}

      if (res.success) {
        // Dispatch event for real-time synchronization across tabs and components
        window.dispatchEvent(new CustomEvent('gtavi_reward_claimed', { detail: res }));
      } else {
        console.warn('Daily Reward Status:', res.message);
      }
    } catch (err: any) {
      console.error('Error claiming daily reward directly:', err);
      setIsDailyRewardReady(false);
      setHasDismissedRewardToast(true);
      if (currentUser?.uid) {
        try {
          sessionStorage.setItem(`gtavi_reward_toast_dismissed_${currentUser.uid}`, 'true');
        } catch (e) {}
      }
    } finally {
      setIsClaimingDaily(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setIsDailyRewardReady(false);
      return;
    }

    const checkRewardExpiry = async () => {
      try {
        const isDismissed = sessionStorage.getItem(`gtavi_reward_toast_dismissed_${currentUser.uid}`) === 'true';
        const rewardStatus = await checkUserRewardStatus(currentUser.uid);

        if (!rewardStatus.canClaim || isDismissed) {
          setIsDailyRewardReady(false);
          setHasDismissedRewardToast(true);
          return;
        }

        setIsDailyRewardReady(true);

        // Send browser push notification if permitted
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            try {
              new Notification('🎁 Vice City Daily Reward Ready!', {
                body: 'Your +50 Vice City Credits sign-in bonus is available to claim now!',
                icon: '/favicon.ico'
              });
            } catch (err) {
              console.warn('Browser push notification error:', err);
            }
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                try {
                  new Notification('🎁 Vice City Daily Reward Ready!', {
                    body: 'Your +50 Vice City Credits sign-in bonus is available to claim now!',
                    icon: '/favicon.ico'
                  });
                } catch (err) {
                  console.warn('Browser push notification permission error:', err);
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn('Could not check daily reward status:', e);
      }
    };

    checkRewardExpiry();
  }, [currentUser]);

  // Notifications State
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const isInitialNotificationsLoadRef = useRef(true);

  // Listen to User Notifications from MongoDB REST API
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      isInitialNotificationsLoadRef.current = true;
      return;
    }

    isInitialNotificationsLoadRef.current = true;
    const userTag = currentUser.displayName || currentUser.email?.split('@')[0] || '';

    let isMounted = true;
    let prevIds = new Set<string>();

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/user/notifications?uid=${encodeURIComponent(currentUser.uid)}&username=${encodeURIComponent(userTag)}`);
        if (res.ok && isMounted) {
          const payload = await res.json();
          if (payload.success && Array.isArray(payload.data)) {
            const rawList: UserNotification[] = payload.data;

            // Load local read & deleted IDs for instant client consistency
            const localReadIds = new Set<string>();
            const localDeletedIds = new Set<string>();
            try {
              const storedReads = JSON.parse(localStorage.getItem(`read_notifs_${currentUser.uid}`) || '[]');
              if (Array.isArray(storedReads)) storedReads.forEach((id: string) => localReadIds.add(id));
              
              const storedDeletes = JSON.parse(localStorage.getItem(`deleted_notifs_${currentUser.uid}`) || '[]');
              if (Array.isArray(storedDeletes)) storedDeletes.forEach((id: string) => localDeletedIds.add(id));
            } catch (e) {}

            // Deduplicate: only keep the most recent notification with a unique combination of title and message
            const seenKeys = new Set<string>();
            const uniqueList: UserNotification[] = [];
            for (const item of rawList) {
              if (item.id && localDeletedIds.has(item.id)) continue;

              const isRead = Boolean(item.read || (item as any).isRead || (item.id && localReadIds.has(item.id)));
              const normalizedItem = { ...item, read: isRead };

              const key = `${(item.title || '').trim().toLowerCase()}_${(item.message || '').trim().toLowerCase()}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueList.push(normalizedItem);
              }
            }

            if (isInitialNotificationsLoadRef.current) {
              isInitialNotificationsLoadRef.current = false;
              prevIds = new Set(uniqueList.map(n => n.id));
            } else {
              const hasNewUnread = uniqueList.some(n => !n.read && !prevIds.has(n.id));
              if (hasNewUnread) {
                playNotificationChime();
              }
              prevIds = new Set(uniqueList.map(n => n.id));
            }

            setNotifications(uniqueList);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch notifications from MongoDB:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (currentUser?.uid) {
      const userTag = currentUser.displayName || currentUser.email?.split('@')[0] || '';

      try {
        const stored = JSON.parse(localStorage.getItem(`read_notifs_${currentUser.uid}`) || '[]');
        const updated = Array.from(new Set([...stored, id]));
        localStorage.setItem(`read_notifs_${currentUser.uid}`, JSON.stringify(updated));
      } catch (e) {}

      try {
        await fetch('/api/user/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, uid: currentUser.uid, username: userTag })
        });
      } catch (err) {
        console.warn('Could not mark notification as read:', err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (currentUser?.uid) {
      const userTag = currentUser.displayName || currentUser.email?.split('@')[0] || '';

      try {
        const stored = JSON.parse(localStorage.getItem(`read_notifs_${currentUser.uid}`) || '[]');
        const allIds = notifications.map(n => n.id);
        const updated = Array.from(new Set([...stored, ...allIds]));
        localStorage.setItem(`read_notifs_${currentUser.uid}`, JSON.stringify(updated));
      } catch (e) {}

      try {
        await fetch('/api/user/notifications/read-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: currentUser.uid, username: userTag })
        });
      } catch (err) {
        console.warn('Could not mark all notifications as read:', err);
      }
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (currentUser?.uid) {
      try {
        const stored = JSON.parse(localStorage.getItem(`deleted_notifs_${currentUser.uid}`) || '[]');
        const updated = Array.from(new Set([...stored, id]));
        localStorage.setItem(`deleted_notifs_${currentUser.uid}`, JSON.stringify(updated));
      } catch (e) {}
    }

    try {
      await fetch(`/api/user/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Could not delete notification:', err);
    }
  };

  const handleApproveJoinRequest = async (channelId: string, requesterName: string) => {
    try {
      const chanRes = await fetch(`/api/admin/cms/customChannels/${encodeURIComponent(channelId)}`);
      if (chanRes.ok) {
        const data = await chanRes.json();
        const members = Array.isArray(data.members) ? data.members : [];
        const pending = Array.isArray(data.pendingRequests) ? data.pendingRequests : [];

        if (!members.includes(requesterName)) members.push(requesterName);
        const updatedPending = pending.filter((m: string) => m !== requesterName);

        await fetch(`/api/admin/cms/customChannels/${encodeURIComponent(channelId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            members,
            pendingRequests: updatedPending,
            updatedAt: Date.now()
          })
        });

        // Update notification metadata status
        const reqNotif = notifications.find(
          n => n.type === 'channel_join_request' && n.metadata?.channelId === channelId && n.metadata?.requesterName === requesterName
        );
        if (reqNotif) {
          await fetch('/api/user/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: reqNotif.id })
          });
        }
      }
    } catch (err) {
      console.error('Approve request error:', err);
    }
  };

  const handleDeclineJoinRequest = async (channelId: string, requesterName: string) => {
    try {
      const chanRes = await fetch(`/api/admin/cms/customChannels/${encodeURIComponent(channelId)}`);
      if (chanRes.ok) {
        const data = await chanRes.json();
        const pending = Array.isArray(data.pendingRequests) ? data.pendingRequests : [];
        const updatedPending = pending.filter((m: string) => m !== requesterName);

        await fetch(`/api/admin/cms/customChannels/${encodeURIComponent(channelId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            pendingRequests: updatedPending,
            updatedAt: Date.now()
          })
        });

        const reqNotif = notifications.find(
          n => n.type === 'channel_join_request' && n.metadata?.channelId === channelId && n.metadata?.requesterName === requesterName
        );
        if (reqNotif) {
          await fetch('/api/user/notifications/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: reqNotif.id })
          });
        }
      }
    } catch (err) {
      console.error('Decline request error:', err);
    }
  };

  const handleNavigateFromNotification = (tab: ActiveTab, targetId?: string) => {
    handleTabChange(tab, targetId);
    setIsAuthOpen(false);
  };

  const handleGrantAdminAccess = async (requestedRole?: 'Admin' | 'Staff') => {
    const targetRole = requestedRole === 'Admin' ? 'Admin' : 'Staff';
    const targetClearance = targetRole === 'Admin' ? 'L4' : 'L3';
    const targetVc = targetRole === 'Admin' ? 50000 : 15000;

    if (currentUser) {
      try {
        let existingData: any = {};
        let oldRole = 'User';
        let oldVc = 0;

        // Fetch existing data from MongoDB profile API first
        try {
          const apiRes = await fetch(`/api/user/profile?uid=${encodeURIComponent(currentUser.uid)}`);
          if (apiRes.ok) {
            const payload = await apiRes.json();
            if (payload.success && payload.data) {
              existingData = payload.data;
              oldRole = existingData.role || 'User';
              oldVc = typeof existingData.vcBalance === 'number' ? existingData.vcBalance : 0;
            }
          }
        } catch (apiErr) {
          console.warn('MongoDB profile fetch failed in grant admin, using local fallbacks:', apiErr);
        }

        const finalVc = Math.max(oldVc, targetVc);
        const updatePayload = {
          uid: currentUser.uid,
          role: targetRole,
          isAdmin: targetRole === 'Admin',
          isStaff: true,
          isVip: true,
          clearanceLevel: targetClearance,
          userLevel: targetClearance,
          vcBalance: finalVc,
          credits: finalVc,
          updatedAt: new Date().toISOString()
        };

        // Save via POST to MongoDB profile API
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });

        // Update local user profile state
        setUserProfileRecord((prev: any) => ({ ...prev, ...updatePayload }));

        await logStaffActivity({
          actionType: 'USER_ROLE_CHANGE',
          actionCategory: 'User Management',
          targetId: currentUser.uid,
          targetName: `@${existingData.username || currentUser.displayName || 'Admin_User'}`,
          targetType: 'user',
          severity: 'CRITICAL',
          details: `Administrative passkey authorization granted ${targetRole} (${targetClearance}) clearance level to @${existingData.username || currentUser.displayName || 'Admin_User'} (${currentUser.email || 'authorized_admin'}). VC balance set to ${finalVc.toLocaleString()} VC.`,
          changes: [
            { field: 'role', oldValue: oldRole, newValue: targetRole, fieldLabel: 'Account Role' },
            { field: 'clearanceLevel', oldValue: existingData.clearanceLevel || 'Member', newValue: targetClearance, fieldLabel: 'Clearance Level' },
            { field: 'vcBalance', oldValue: oldVc, newValue: finalVc, fieldLabel: 'Vice City Balance' }
          ],
          actorOverride: {
            actorId: currentUser.uid,
            actorEmail: currentUser.email || 'admin@vicecity.app',
            actorUsername: existingData.username || (targetRole === 'Admin' ? 'Admin_L4_Lucia' : 'Staff_L3_Marco'),
            actorRole: targetRole,
            actorClearance: targetClearance
          }
        });
      } catch (err) {
        console.warn('MongoDB staff update exception (operating with local state):', err);
      }
      setIsAdmin(targetRole === 'Admin');
      setIsStaff(true);
      setIsVipActive(true);
    } else {
      const isStaffReq = requestedRole === 'Staff';
      const adminEmail = isStaffReq ? 'l3_staff@vicecity.app' : 'l4_admin@vicecity.app';
      const adminPass = isStaffReq ? 'ViceCityStaff2026!' : 'ViceCityAdmin2026!';
      const targetRole = isStaffReq ? 'Staff' : 'Admin';
      const targetClearance = isStaffReq ? 'L3' : 'L4';
      const targetVc = isStaffReq ? 15000 : 50000;

      let userCred;
      try {
        userCred = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      } catch (signInErr: any) {
        try {
          userCred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        } catch (createErr: any) {
          console.warn('Staff/Admin fallback auth notice:', createErr?.message || createErr);
        }
      }
      if (userCred?.user) {
        try {
          const updatePayload = {
            uid: userCred.user.uid,
            username: targetRole === 'Admin' ? 'Admin_L4_Lucia' : 'Staff_L3_Marco',
            usernameLower: targetRole === 'Admin' ? 'admin_l4_lucia' : 'staff_l3_marco',
            email: adminEmail,
            avatar: DEFAULT_GTA6_AVATAR,
            role: targetRole,
            isAdmin: targetRole === 'Admin',
            isStaff: true,
            isVip: true,
            clearanceLevel: targetClearance,
            userLevel: targetClearance,
            vcBalance: targetVc,
            credits: targetVc,
            status: 'Active',
            updatedAt: new Date().toISOString()
          };

          // Save fallback Admin credentials via MongoDB profile API
          await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
          });

          await logStaffActivity({
            actionType: 'USER_ROLE_CHANGE',
            actionCategory: 'User Management',
            targetId: userCred.user.uid,
            targetName: targetRole === 'Admin' ? '@Admin_L4_Lucia' : '@Staff_L3_Marco',
            targetType: 'user',
            severity: 'CRITICAL',
            details: `System fallback authenticated ${targetRole} (${targetClearance}) account ${adminEmail} with ${targetVc.toLocaleString()} VC.`,
            changes: [
              { field: 'role', oldValue: 'None', newValue: targetRole, fieldLabel: 'Account Role' },
              { field: 'clearanceLevel', oldValue: 'None', newValue: targetClearance, fieldLabel: 'Clearance Level' },
              { field: 'vcBalance', oldValue: 0, newValue: targetVc, fieldLabel: 'Vice City Balance' }
            ],
            actorOverride: {
              actorId: userCred.user.uid,
              actorEmail: adminEmail,
              actorUsername: targetRole === 'Admin' ? 'Admin_L4_Lucia' : 'Staff_L3_Marco',
              actorRole: targetRole,
              actorClearance: targetClearance
            }
          });
        } catch (err) {
          console.warn('MongoDB staff signup creation exception:', err);
        }
      }
      setIsAdmin(targetRole === 'Admin');
      setIsStaff(true);
      setIsVipActive(true);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Selected comparison state
  const [compareVehicleA, setCompareVehicleA] = useState<Vehicle>(VEHICLES_DATA[0]);
  const [compareVehicleB, setCompareVehicleB] = useState<Vehicle>(VEHICLES_DATA[1]);

  const handleSelectForCompare = (vehicle: Vehicle) => {
    setCompareVehicleA(compareVehicleB);
    setCompareVehicleB(vehicle);
    handleTabChange('comparison');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white overflow-x-hidden max-w-full">
      {/* Context-Aware Third-Party Ad Script Injector */}
      <AdScriptLoader user={{ isVip: isVipActive, isAdmin, isStaff }} />

      {/* Subdomain Mode Indicator Banner (Active when on docs.*, admin.*, or simulated testing) */}
      <SubdomainBanner
        mode={subdomainState.mode}
        isSimulated={subdomainState.isSimulated}
        hostname={subdomainState.hostname}
        onExitSimulation={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('subdomain');
            url.searchParams.delete('subdomain_mode');
            window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
            setSubdomainState({
              mode: 'portal',
              hostname: window.location.hostname,
              isSimulated: false,
              subdomainPrefix: ''
            });
            handleTabChange('home');
          }
        }}
        onNavigateTab={handleTabChange}
      />

      {/* Header Navigation with Dropdowns & Quick Map Access */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => handleTabChange('profile')}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
        onOpenOfflineSync={() => setIsOfflineSyncOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAvatarCreator={() => setIsAvatarCreatorOpen(true)}
        isVipActive={isVipActive}
        isAdmin={isAdmin}
        isStaff={isStaff}
        currentUser={currentUser}
        unreadCount={unreadCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 pb-20 lg:pb-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {activeTab === 'home' && (
              <MasterPortalHome
                setActiveTab={handleTabChange}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectForCompare={handleSelectForCompare}
                isAuthenticated={!!currentUser}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthOpen(true)}
                isVipActive={isVipActive}
                isAdmin={isAdmin}
                isStaff={isStaff}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesTab searchQuery={searchQuery} onSelectForCompare={handleSelectForCompare} />
            )}

            {activeTab === 'weapons' && (
              <WeaponsTab searchQuery={searchQuery} onNavigateTab={handleTabChange} />
            )}

            {activeTab === 'characters' && (
              <CharactersTab searchQuery={searchQuery} />
            )}

            {activeTab === 'comparison' && (
              <ComparisonMatrix initialVehicleA={compareVehicleA} initialVehicleB={compareVehicleB} />
            )}

            {activeTab === 'mod-calculator' && (
              <ModBuilderCalculator onSwitchTab={handleTabChange} />
            )}

            {activeTab === 'roi-calculator' && (
              <BusinessRoiCalculator onSwitchTab={handleTabChange} />
            )}

            {activeTab === 'handling-editor' && (
              <HandlingEditorTab
                userProfile={
                  currentUser
                    ? {
                        id: currentUser.uid,
                        username: currentUser.displayName || currentUser.email?.split('@')[0] || 'ViceRacer',
                        email: currentUser.email || '',
                        avatar: currentUser.photoURL || DEFAULT_GTA6_AVATAR,
                        role: isAdmin ? 'Admin' : isStaff ? 'Staff' : isVipActive ? 'VIP Member' : 'User',
                        isAdmin,
                        isStaff,
                        isVip: isVipActive,
                        joinedDate: '2026-01-01',
                        publishedBuildsCount: 0,
                        status: 'Active'
                      }
                    : null
                }
                isVipActive={isVipActive}
                onOpenAuthModal={() => setIsAuthOpen(true)}
                onSelectVehicle={async (slug) => {
                  const storedVehicles = await getCachedVehicles();
                  const v = storedVehicles.find((item) => item.slug === slug) || VEHICLES_DATA.find((item) => item.slug === slug);
                  if (v) handleSelectForCompare(v);
                }}
              />
            )}

            {activeTab === 'economy-balancer' && (
              <EconomyBalancerTab
                userProfile={
                  currentUser
                    ? {
                        id: currentUser.uid,
                        username: currentUser.displayName || currentUser.email?.split('@')[0] || 'ServerAdmin',
                        email: currentUser.email || '',
                        avatar: currentUser.photoURL || DEFAULT_GTA6_AVATAR,
                        role: isAdmin ? 'Admin' : isStaff ? 'Staff' : isVipActive ? 'VIP Member' : 'User',
                        isAdmin,
                        isStaff,
                        isVip: isVipActive,
                        joinedDate: '2026-01-01',
                        publishedBuildsCount: 0,
                        status: 'Active'
                      }
                    : null
                }
                onOpenAuthModal={() => setIsAuthOpen(true)}
                onSwitchTab={handleTabChange}
              />
            )}

            {activeTab === 'script-generator' && (
              <ScriptsGeneratorStudio
                onNavigateToAuth={() => setIsAuthOpen(true)}
                onNavigateTab={handleTabChange}
              />
            )}

            {activeTab === 'cad-mdt' && (
              <CadMdtTerminal />
            )}

            {activeTab === 'identity' && (
              <IdentityCardGenerator />
            )}

            {(activeTab === 'rules-generator' || activeTab === 'generator') && (
              <RulesAndEventGenerator />
            )}

            {activeTab === 'economy' && (
              <DynastyEconomyDirectory />
            )}

            {activeTab === 'map' && (
              <MapLockedScreen
                onOpenModal={() => setIsMapLockedModalOpen(true)}
                onNavigate={handleTabChange}
              />
            )}

            {activeTab === 'blog' && (
              <BlogTab
                searchQuery={searchQuery}
                currentUser={currentUser}
                initialSlug={currentServerSlug}
                isAdmin={isAdmin}
                isStaff={isStaff}
                onOpenAuth={() => setIsAuthOpen(true)}
                onNavigateToMap={(x, y) => handleTabChange('map')}
                onNavigateTab={(tab, targetId) => handleTabChange(tab as any, targetId)}
                onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
              />
            )}

            {activeTab === 'rp-servers' && (
              <RpServerDirectory
                onNavigate={handleTabChange}
                isVipActive={isVipActive}
                isAdmin={isAdmin}
                isStaff={isStaff}
                currentUser={currentUser ? {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'VicePlayer',
                  email: currentUser.email || undefined
                } : null}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'server-manage' && (
              <ServerManageFormTab
                serverSlug={currentServerSlug}
                onNavigate={(path, slug) => {
                  if (path.includes('/dashboard')) handleTabChange('server-dashboard', slug || currentServerSlug);
                  else if (path.includes('/apply')) handleTabChange('server-apply', slug || currentServerSlug);
                  else if (path.includes('/review')) handleTabChange('server-review', slug || currentServerSlug);
                  else if (path.includes('/status')) handleTabChange('server-status', slug || currentServerSlug);
                  else handleTabChange('rp-servers');
                }}
                currentUser={currentUser ? {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                  email: currentUser.email || undefined,
                  isAdmin,
                  isStaff,
                  discordUsername: fullCurrentUser?.discordUsername,
                  discordId: fullCurrentUser?.discordId
                } : null}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'server-apply' && (
              <ServerApplyTab
                serverSlug={currentServerSlug}
                onNavigate={(path, slug) => {
                  if (path.includes('/dashboard')) handleTabChange('server-dashboard', slug || currentServerSlug);
                  else if (path.includes('/status')) handleTabChange('server-status', slug || currentServerSlug);
                  else if (path.includes('/manage')) handleTabChange('server-manage', slug || currentServerSlug);
                  else if (path.includes('/review')) handleTabChange('server-review', slug || currentServerSlug);
                  else handleTabChange('rp-servers');
                }}
                currentUser={currentUser ? {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                  email: currentUser.email || undefined,
                  avatar: currentUser.photoURL || undefined
                } : null}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'server-review' && (
              <ServerReviewTab
                serverSlug={currentServerSlug}
                onNavigate={(path, slug) => {
                  if (path.includes('/dashboard')) handleTabChange('server-dashboard', slug || currentServerSlug);
                  else if (path.includes('/manage')) handleTabChange('server-manage', slug || currentServerSlug);
                  else if (path.includes('/apply')) handleTabChange('server-apply', slug || currentServerSlug);
                  else if (path.includes('/status')) handleTabChange('server-status', slug || currentServerSlug);
                  else handleTabChange('rp-servers');
                }}
                currentUser={currentUser ? {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                  email: currentUser.email || undefined,
                  isAdmin,
                  isStaff
                } : null}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'server-status' && (
              <ServerStatusTab
                serverSlug={currentServerSlug}
                onNavigate={(path, slug) => {
                  if (path.includes('/dashboard')) handleTabChange('server-dashboard', slug || currentServerSlug);
                  else if (path.includes('/apply')) handleTabChange('server-apply', slug || currentServerSlug);
                  else if (path.includes('/manage')) handleTabChange('server-manage', slug || currentServerSlug);
                  else if (path.includes('/review')) handleTabChange('server-review', slug || currentServerSlug);
                  else if (path.includes('/profile')) handleTabChange('profile');
                  else handleTabChange('rp-servers');
                }}
                currentUser={currentUser ? {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                  email: currentUser.email || undefined
                } : null}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'server-dashboard' && (
              <ServerDashboardTab
                serverSlug={currentServerSlug}
                onNavigate={(path, slug) => {
                  if (path.includes('/manage')) handleTabChange('server-manage', slug || currentServerSlug);
                  else if (path.includes('/apply')) handleTabChange('server-apply', slug || currentServerSlug);
                  else if (path.includes('/review')) handleTabChange('server-review', slug || currentServerSlug);
                  else if (path.includes('/status')) handleTabChange('server-status', slug || currentServerSlug);
                  else if (path.includes('/billing')) handleTabChange('server-billing', slug || currentServerSlug);
                  else if (path.includes('/growth')) handleTabChange('server-growth', slug || currentServerSlug);
                  else if (path.includes('/studio')) handleTabChange('server-studio', slug || currentServerSlug);
                  else handleTabChange('rp-servers');
                }}
                currentUser={currentUser ? {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                  email: currentUser.email || undefined,
                  isAdmin,
                  isStaff
                } : null}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'server-growth' && (
              <ServerGrowthTab
                serverSlug={currentServerSlug}
                onNavigate={(tab, slug) => {
                  if (tab.startsWith('server-')) {
                    handleTabChange(tab as ActiveTab, slug || currentServerSlug);
                  } else {
                    handleTabChange(tab as ActiveTab, slug);
                  }
                }}
                currentUser={currentUser ? {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                  email: currentUser.email || undefined,
                  isAdmin,
                  isStaff
                } : null}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'server-studio' && (
              <SentinelStudioDashboard
                serverSlug={currentServerSlug}
                serverName={currentServerSlug ? currentServerSlug.replace(/-/g, ' ').toUpperCase() : 'Vice City Central Roleplay'}
                serverId={`srv_${currentServerSlug}`}
                onNavigateTab={(tab) => handleTabChange(tab as ActiveTab, currentServerSlug)}
              />
            )}

            {activeTab === 'marketing' && (
              <div className="max-w-7xl mx-auto space-y-6">
                <MarketingWorkspace
                  initialScope="internal_platform"
                  serverSlug={currentServerSlug}
                  userTier={isAdmin || isStaff ? 'internal_admin' : 'enterprise'}
                  currentUser={currentUser ? {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                    email: currentUser.email || undefined,
                    isAdmin,
                    isStaff
                  } : null}
                  onUpgradeClick={() => handleTabChange('server-billing', currentServerSlug)}
                  onNavigate={(tab, s) => {
                    if (tab.startsWith('server-')) {
                      handleTabChange(tab as ActiveTab, s || currentServerSlug);
                    } else {
                      handleTabChange(tab as ActiveTab, s);
                    }
                  }}
                />
              </div>
            )}

            {activeTab === 'server-billing' && (
              <ServerBillingPaywall
                serverSlug={currentServerSlug}
                serverId={`srv_${currentServerSlug}`}
                currentUser={currentUser ? {
                  uid: currentUser.uid,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                  email: currentUser.email || undefined,
                  isAdmin,
                  isStaff
                } : null}
                onOpenAuth={() => setIsAuthOpen(true)}
                onNavigate={(tab, slug) => handleTabChange(tab as ActiveTab, slug || currentServerSlug)}
              />
            )}

            {activeTab === 'chat' && (
              <CommunityChatTab
                isAuthenticated={!!currentUser}
                currentUser={currentUser}
                onOpenAuth={() => setIsAuthOpen(true)}
                isVipActive={isVipActive}
                isAdmin={isAdmin}
                isStaff={isStaff}
                initialChannel={activeChatChannel}
                isVoiceModalOpen={isVoiceModalOpen}
                onVoiceModalChange={setIsVoiceModalOpen}
                onChannelChange={(chan) => setActiveChatChannel(chan)}
                onOpenAvatarCreator={() => setIsAvatarCreatorOpen(true)}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab
                currentUser={currentUser}
                isVipActive={isVipActive}
                isAdmin={isAdmin}
                isStaff={isStaff}
                initialSubTab={profileSubTab}
                onUpgradeToVip={() => setIsAuthOpen(true)}
                onDowngradeFromVip={() => setIsVipActive(false)}
                onOpenAuthModal={() => setIsAuthOpen(true)}
                onOpenAvatarCreator={() => setIsAvatarCreatorOpen(true)}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDeleteNotification={handleDeleteNotification}
                onApproveJoinRequest={handleApproveJoinRequest}
                onDeclineJoinRequest={handleDeclineJoinRequest}
                onNavigate={(tab, targetId) => handleTabChange(tab, targetId)}
              />
            )}

            {activeTab === 'monetization' && (
              <MonetizationTab
                currentUser={currentUser}
                onOpenAuthModal={() => setIsAuthOpen(true)}
              />
            )}

            {(activeTab === 'admin' || activeTab === 'market-agency' || activeTab === 'marketagency') && (
              (isAdmin || isStaff) ? (
                <AdminDashboardTab initialSubTab={activeTab === 'market-agency' || activeTab === 'marketagency' ? 'market-agency' : undefined} />
              ) : (
                <AdminAccessGuard
                  tabName="AI Agent Console & Admin Control Panel"
                  tabDescription="Access global user profile management, AI agent console, subdomain routing, and system analytics."
                  currentUser={currentUser}
                  onOpenAuth={() => setIsAuthOpen(true)}
                  onGrantAdminAccess={handleGrantAdminAccess}
                  onReturnToPublic={() => handleTabChange('vehicles')}
                />
              )
            )}

            {activeTab === 'docs' && <DocumentationTab onNavigate={handleTabChange} />}

            {activeTab === 'pseo' && <PseoArchitectureTab />}

            {activeTab === 'seo-hub' && (
              <GtaSeoKnowledgeHub
                onNavigateTab={handleTabChange}
                currentUser={currentUser}
                isAdmin={isAdmin}
                isStaff={isStaff}
                onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
              />
            )}

            {activeTab === 'giftcards' && (
              <GiftCardTab
                currentUser={currentUser}
                isVipActive={isVipActive}
                isAdmin={isAdmin}
                isStaff={isStaff}
                onOpenAuthModal={() => setIsAuthOpen(true)}
                onNavigate={(tab, targetId) => handleTabChange(tab, targetId)}
              />
            )}

            {activeTab === 'challenges' && (
              <TuningChallengesTab
                currentUser={currentUser}
                isVipActive={isVipActive}
                isAdmin={isAdmin}
                isStaff={isStaff}
                onOpenAuthModal={() => setIsAuthOpen(true)}
                onNavigateToHandlingEditor={() => handleTabChange('handling-editor')}
              />
            )}

            {activeTab === 'about' && (
              <AboutUsTab onNavigate={(tab) => handleTabChange(tab as ActiveTab)} />
            )}

            {(activeTab === 'pitch' || activeTab === 'investors') && (
              <InvestorPitchTab onNavigate={(tab) => handleTabChange(tab as ActiveTab)} />
            )}

            {(activeTab === 'privacy' || activeTab === 'copyright') && (
              <CopyrightPrivacyTab onNavigate={(tab) => handleTabChange(tab as ActiveTab)} />
            )}

            {activeTab === 'for-servers' && (
              <ForServersPage
                onNavigate={handleTabChange}
                onOpenAuth={() => setIsAuthOpen(true)}
                currentUser={fullCurrentUser}
              />
            )}

            {activeTab === 'servers-onboarding' && (
              <ServerOnboardingWizard
                initialServerSlug={currentServerSlug}
                onNavigate={handleTabChange}
                currentUser={fullCurrentUser}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'admin-business' && (
              (isAdmin || isStaff) ? (
                <AdminBusinessDashboard
                  onNavigate={handleTabChange}
                  currentUser={currentUser ? {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName || currentUser.email?.split('@')[0],
                    email: currentUser.email || undefined
                  } : null}
                />
              ) : (
                <AdminAccessGuard
                  tabName="B2B SaaS Executive Control Plane"
                  tabDescription="Access real-time MRR analytics, active subscribed FiveM servers, churn metrics, and manual billing overrides."
                  currentUser={currentUser}
                  onOpenAuth={() => setIsAuthOpen(true)}
                  onGrantAdminAccess={handleGrantAdminAccess}
                  onReturnToPublic={() => handleTabChange('for-servers')}
                />
              )
            )}

            {activeTab === 'not-found' && (
              <NotFoundPage
                onNavigate={handleTabChange}
                currentPath={typeof window !== 'undefined' ? window.location.pathname : undefined}
                onOpenReport={() => setIsReportModalOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* User Account & VIP Checkout Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        isVipActive={isVipActive}
        onUpgradeToVip={() => setIsVipActive(true)}
        onDowngradeVip={() => setIsVipActive(false)}
        currentUser={currentUser}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
        onApproveJoinRequest={handleApproveJoinRequest}
        onDeclineJoinRequest={handleDeclineJoinRequest}
        onNavigate={handleNavigateFromNotification}
      />

      {/* GTA Avatar Studio & Creator Modal */}
      <AvatarCreatorModal
        isOpen={isAvatarCreatorOpen}
        onClose={() => setIsAvatarCreatorOpen(false)}
        currentUser={currentUser}
        currentAvatar={currentUser?.photoURL || undefined}
        isVipActive={isVipActive}
        isStaff={isStaff}
        isAdmin={isAdmin}
        onUpgradeToVip={() => setIsVipActive(true)}
        onSaveAvatar={(newAvatar) => {
          console.log('Avatar updated:', newAvatar);
        }}
      />

      {/* AI Tactical Advisor Modal */}
      <AiTacticalAssistant
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        onNavigate={(tab) => handleTabChange(tab as ActiveTab)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Offline Storage & Service Worker Cache Modal */}
      <OfflineSyncModal
        isOpen={isOfflineSyncOpen}
        onClose={() => setIsOfflineSyncOpen(false)}
      />

      {/* User Issue & Bug Report Modal with 1-Click Screenshot Capture */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentUser={currentUser}
        activeTab={activeTab}
        isVipActive={isVipActive}
      />

      {/* Map Locked Security & Maintenance Modal */}
      <MapLockedModal
        isOpen={isMapLockedModalOpen || activeTab === 'map'}
        onClose={() => {
          setIsMapLockedModalOpen(false);
          if (activeTab === 'map') {
            handleTabChange('home');
          }
        }}
        onNavigate={handleTabChange}
      />

      {/* Quick 1-Click Floating Report Trigger */}
      <div className={`fixed bottom-4 left-4 z-40 transition-all ${activeTab === 'handling-editor' ? 'hidden' : 'hidden sm:block'}`}>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="group flex items-center gap-2 px-2.5 py-1.5 bg-zinc-900/95 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-700/80 hover:border-rose-500/50 rounded-full shadow-xl backdrop-blur-md text-xs font-bold transition-all duration-200 cursor-pointer shadow-black/50 hover:shadow-rose-500/10 active:scale-95"
          title="Report a bug, error or issue with 1-click screenshot capture"
        >
          <div className="p-1 rounded-full bg-rose-500/15 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition">
            <Bug className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono pr-1">Report Bug</span>
        </button>
      </div>

      {/* 24-Hour Daily Reward Expired Notification Toast */}
      {isDailyRewardReady && !hasDismissedRewardToast && (
        <div 
          onClick={() => {
            setProfileSubTab('daily-reward');
            setIsDailyRewardReady(false);
            setHasDismissedRewardToast(true);
            if (currentUser?.uid) {
              try {
                sessionStorage.setItem(`gtavi_reward_toast_dismissed_${currentUser.uid}`, 'true');
              } catch (e) {}
            }
            handleTabChange('profile');
          }}
          className="fixed bottom-6 right-6 z-50 max-w-md bg-zinc-950/95 border border-emerald-500/60 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 animate-bounce shadow-emerald-500/20 cursor-pointer hover:border-emerald-400 hover:bg-zinc-900/95 transition-all group"
          title="Click anywhere to open the Daily Rewards Hub!"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
              <Gift className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">Daily Sign-In Reward Ready!</h4>
              <p className="text-xs text-emerald-400 font-extrabold">+50 Vice City Credits available to claim now!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={isClaimingDaily}
              onClick={handleDirectClaim}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:cursor-not-allowed text-zinc-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition whitespace-nowrap"
            >
              {isClaimingDaily ? 'Claiming...' : 'Claim'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent trigger tab navigation
                setIsDailyRewardReady(false);
                setHasDismissedRewardToast(true);
                if (currentUser?.uid) {
                  try {
                    sessionStorage.setItem(`gtavi_reward_toast_dismissed_${currentUser.uid}`, 'true');
                  } catch (err) {}
                }
              }}
              className="text-zinc-500 hover:text-zinc-300 text-xs font-bold p-1 cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      {activeTab !== 'weapons' && (
        <Footer
          onNavigate={(tab) => handleTabChange(tab)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenOfflineSync={() => setIsOfflineSyncOpen(true)}
        />
      )}

      {/* Global Cookie & Privacy Consent Banner */}
      <CookieConsentBanner
        onNavigatePrivacy={() => handleTabChange('privacy')}
      />


    </div>
  );
}
