'use client';
import React, { useState, useEffect } from 'react';
import { RP_SERVERS_DATA } from '../data/rpServers';
import { RpServer, ActiveTab, SpotlightRentalBooking } from '../types';
import { getCachedRpServers, setCachedRpServers } from '../lib/offlineStorage';
import { normalizeServerSlug, linkDiscordToUser } from '../lib/whitelist-service';
import { 
  Server, 
  Users, 
  ShieldCheck, 
  Wifi, 
  Copy, 
  Check, 
  ExternalLink, 
  HelpCircle, 
  Info, 
  Terminal, 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  Flame, 
  Activity, 
  Clock, 
  Settings, 
  FileText, 
  Crown, 
  Lock,
  BrainCircuit,
  Globe,
  Zap,
  Calendar,
  DollarSign,
  ArrowRight,
  Ban,
  Trash2,
  ShieldAlert,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  TrendingUp
} from 'lucide-react';
import { AiPracticeExamModal } from './whitelist/AiPracticeExamModal';
import { SpotlightRentalModal } from './SpotlightRentalModal';
import { formatAutoCrawlTime } from '../lib/dateUtils';
import { VpnOptimizerWidget } from './affiliates/VpnOptimizerWidget';
import { ClaimButtonModal } from './servers/ClaimButtonModal';
import { copyToClipboard } from '../lib/copyUtils';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, query, where, limit } from 'firebase/firestore';
import { subscribeRtdbFivemServers } from '../lib/firebase/rtdbChatService';
import { normalizeTier, getTierWeight } from '../lib/stripe-subscriptions';

interface RpServerDirectoryProps {
  onNavigate?: (tab: ActiveTab, targetId?: string) => void;
  isVipActive?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
  } | null;
  onOpenAuth?: () => void;
}

export const RpServerDirectory: React.FC<RpServerDirectoryProps> = ({ 
  onNavigate,
  isVipActive = false,
  isAdmin = false,
  isStaff = false,
  currentUser = null,
  onOpenAuth
}) => {
  const [copiedConnectId, setCopiedConnectId] = useState<string | null>(null);
  const [servers, setServers] = useState<RpServer[]>(RP_SERVERS_DATA);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSubmitComingSoonModal, setShowSubmitComingSoonModal] = useState(false);
  const [showClaimComingSoonModal, setShowClaimComingSoonModal] = useState(false);
  const [showVipRequiredModal, setShowVipRequiredModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showSpotlightModal, setShowSpotlightModal] = useState(false);
  const [todaySpotlight, setTodaySpotlight] = useState<SpotlightRentalBooking | null>(null);
  const [spotlightDailyRate, setSpotlightDailyRate] = useState<number>(12.0);
  const [forceShowAdBanner, setForceShowAdBanner] = useState<boolean>(false);
  const [isPinging, setIsPinging] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  
  // Whitelist Simulator & Filter State
  const [practiceModalServer, setPracticeModalServer] = useState<RpServer | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'whitelisted' | 'open_public' | 'my_servers'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [isLoadingServers, setIsLoadingServers] = useState<boolean>(true);
  const [submittedServerSuccess, setSubmittedServerSuccess] = useState<RpServer | null>(null);
  const [ownerDiscordInput, setOwnerDiscordInput] = useState('');
  const [claimingServer, setClaimingServer] = useState<RpServer | null>(null);

  // Admin L4 Action Modals
  const [deleteModalTarget, setDeleteModalTarget] = useState<RpServer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [blacklistModalTarget, setBlacklistModalTarget] = useState<RpServer | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('Violation of GTA VI Central Directory Terms & Verification Guidelines');
  const [isBlacklisting, setIsBlacklisting] = useState(false);
  const [adminSuccessNotice, setAdminSuccessNotice] = useState<string | null>(null);

  const canSubmitServer = Boolean(isVipActive || isAdmin || isStaff);

  const userProfileMemo = React.useMemo(() => {
    if (!currentUser) return undefined;
    return {
      id: currentUser.uid,
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'VicePlayer',
      email: currentUser.email || '',
      role: isAdmin ? 'Admin' : isStaff ? 'Staff' : isVipActive ? 'VIP' : 'User'
    };
  }, [currentUser?.uid, currentUser?.displayName, currentUser?.email, isAdmin, isStaff, isVipActive]);

  const isL4Admin = Boolean(
    isAdmin ||
    (currentUser as any)?.userLevel === 'L4' ||
    (currentUser as any)?.role === 'L4 Admin' ||
    (currentUser as any)?.role === 'Admin' ||
    (currentUser as any)?.isAdmin ||
    (currentUser?.email && ['admin@vicecity.app', 'l4_admin@vicecity.app'].includes(currentUser.email.toLowerCase()))
  );

  const isL3Staff = Boolean(
    isStaff ||
    (currentUser as any)?.userLevel === 'L3' ||
    (currentUser as any)?.userLevel === 'L4' ||
    (currentUser as any)?.role === 'L3 Staff' ||
    (currentUser as any)?.role === 'L4 Admin' ||
    isL4Admin
  );

  const handleDeleteServer = (serverToDelete: RpServer) => {
    setDeleteModalTarget(serverToDelete);
  };

  const confirmDeleteServer = async () => {
    if (!deleteModalTarget) return;
    setIsDeleting(true);
    const serverToDelete = deleteModalTarget;

    try {
      const res = await fetch(`/api/rp-servers/${encodeURIComponent(serverToDelete.id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);

      if (res.ok || data?.success) {
        const normTarget = (serverToDelete.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
        const normName = (serverToDelete.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

        setServers((prev) => prev.filter((s) => {
          const sId = (s.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
          const sName = (s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
          return s.id !== serverToDelete.id && sId !== normTarget && sName !== normName;
        }));

        setAdminSuccessNotice(`Server "${serverToDelete.name}" was permanently removed from the directory.`);
        setDeleteModalTarget(null);
      } else {
        throw new Error(data?.error || 'Failed to delete server');
      }
    } catch (err: any) {
      console.error('Failed to delete server:', err);
      alert(`Error deleting server: ${err?.message || 'Network error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleBlacklist = (serverToBlacklist: RpServer) => {
    setBlacklistModalTarget(serverToBlacklist);
    setBlacklistReason('Violation of GTA VI Central Directory Terms & Verification Guidelines');
  };

  const confirmToggleBlacklist = async () => {
    if (!blacklistModalTarget) return;
    setIsBlacklisting(true);
    const serverToBlacklist = blacklistModalTarget;
    const isCurrentlyBlacklisted = Boolean(serverToBlacklist.isBlacklisted || serverToBlacklist.status === 'blacklisted');
    const newBlacklistState = !isCurrentlyBlacklisted;

    try {
      const res = await fetch('/api/rp-servers/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: serverToBlacklist.id,
          isBlacklisted: newBlacklistState,
          reason: blacklistReason || 'Violation of community guidelines'
        })
      });

      const data = await res.json().catch(() => null);

      if (res.ok || data?.success) {
        const normTarget = (serverToBlacklist.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
        const normName = (serverToBlacklist.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

        setServers((prev) =>
          prev.map((s) => {
            const sId = (s.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
            const sName = (s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
            if (s.id === serverToBlacklist.id || sId === normTarget || sName === normName) {
              return { ...s, isBlacklisted: newBlacklistState, status: newBlacklistState ? 'blacklisted' : 'online' };
            }
            return s;
          })
        );

        setAdminSuccessNotice(`Server "${serverToBlacklist.name}" is now ${newBlacklistState ? 'BLACKLISTED' : 'RESTORED (UNBLACKLISTED)'}.`);
        setBlacklistModalTarget(null);
      } else {
        throw new Error(data?.error || 'Failed to update blacklist status');
      }
    } catch (err: any) {
      console.error('Failed to toggle blacklist status:', err);
      alert(`Error updating blacklist status: ${err?.message || 'Network error'}`);
    } finally {
      setIsBlacklisting(false);
    }
  };

  const handleOpenSubmitModal = () => {
    // Server submissions are temporarily paused for maintenance
    setShowSubmitComingSoonModal(true);
  };

  // Form state
  const [serverName, setServerName] = useState('');
  const [framework, setFramework] = useState<'FiveM' | 'VMP' | 'Custom C#'>('FiveM');
  const [region, setRegion] = useState<'NA East' | 'NA West' | 'EU Central' | 'SA'>('NA East');
  const [connectUrl, setConnectUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isWhitelisted, setIsWhitelisted] = useState(true);
  const [planTier, setPlanTier] = useState<'community' | 'mega_server' | 'enterprise'>('mega_server');
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState('');
  const [submittingServer, setSubmittingServer] = useState(false);

  const handlePingTraffic = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/rp-servers/ping', { method: 'POST' });
      const data = await res.json();
      if (data.success && Array.isArray(data.servers)) {
        setServers(data.servers);
        setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to ping FiveM servers:', err);
    } finally {
      setTimeout(() => setIsPinging(false), 600);
    }
  };

  // Fetch today's spotlight reservation
  const fetchTodaySpotlight = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    fetch('/api/spotlight-rentals/today')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.booking && data.booking.status !== 'cancelled') {
          setTodaySpotlight(data.booking);
        } else {
          setTodaySpotlight(null);
        }
      })
      .catch((err) => console.warn('Spotlight fetch notice:', err));
  };

  useEffect(() => {
    setIsLoadingServers(true);
    fetch('/api/rp-servers')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setServers(data.data);
          if (data.lastSyncIso) {
            setLastSyncTime(formatAutoCrawlTime(data.lastSyncIso));
          }
        } else {
          return getCachedRpServers().then(cached => {
            if (cached && cached.length > 0) setServers(cached);
          });
        }
      })
      .catch(() => {
        return getCachedRpServers().then(cached => {
          if (cached && cached.length > 0) setServers(cached);
        });
      })
      .finally(() => {
        setIsLoadingServers(false);
      });

    fetchTodaySpotlight();

    // 1. Fetch live pricing from availability API
    fetch('/api/spotlight-rentals/availability')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.dailyRateUsd === 'number' && data.dailyRateUsd > 0) {
          setSpotlightDailyRate(data.dailyRateUsd);
        }
      })
      .catch(() => {});

    // 2. Firestore listener for real-time spotlight pricing configuration
    let unsubPricing: (() => void) | null = null;
    try {
      unsubPricing = onSnapshot(
        doc(db, 'system_config', 'spotlight_pricing'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && typeof data.dailyRateUsd === 'number' && data.dailyRateUsd > 0) {
              setSpotlightDailyRate(data.dailyRateUsd);
            }
          }
        },
        (err) => console.warn('Directory pricing onSnapshot notice:', err)
      );
    } catch (e) {
      // offline
    }

    // 3. Firestore listener for real-time spotlight sync
    let unsubRentals: (() => void) | null = null;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const spotlightQ = query(collection(db, 'spotlight_rentals'), where('date', '==', todayStr), limit(10));
      unsubRentals = onSnapshot(spotlightQ, (snapshot) => {
        let matched: SpotlightRentalBooking | null = null;
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as SpotlightRentalBooking;
          if (d.date === todayStr && d.status !== 'cancelled') {
            matched = { ...d, id: docSnap.id };
          }
        });
        setTodaySpotlight(matched);
      });
    } catch (e) {
      // offline
    }

    // 4. Realtime Database subscription for live FiveM server player counts & latency
    let unsubFivemRtdb: (() => void) | null = null;
    try {
      unsubFivemRtdb = subscribeRtdbFivemServers((rtdbMap) => {
        if (rtdbMap && Object.keys(rtdbMap).length > 0) {
          setServers((prev) =>
            prev.map((s) => {
              const rtdbData = rtdbMap[s.id];
              if (rtdbData) {
                return { ...s, ...rtdbData };
              }
              return s;
            })
          );
        }
      });
    } catch (e) {
      // offline fallback
    }

    // Auto refresh traffic rankings every 60 seconds
    const interval = setInterval(() => {
      fetch('/api/rp-servers')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setServers(data.data);
          }
        }).catch(() => {});
    }, 60000);

    return () => {
      clearInterval(interval);
      if (unsubPricing) unsubPricing();
      if (unsubRentals) unsubRentals();
      if (unsubFivemRtdb) unsubFivemRtdb();
    };
  }, []);

  // Handle Discord OAuth return redirect and automatic claim modal reopening
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const discordLinked = urlParams.get('discordLinked');
    const discordId = urlParams.get('discordId');
    const discordUsername = urlParams.get('discordUsername');
    const discordAvatar = urlParams.get('discordAvatar');
    const claimServerSlug = urlParams.get('claimServer');
    const serverId = urlParams.get('serverId');

    if (discordLinked === 'true' && discordId) {
      try {
        localStorage.setItem('gtavi_discord_user_id', discordId);
        if (discordUsername) localStorage.setItem('gtavi_discord_username', discordUsername);
        if (discordAvatar) localStorage.setItem('gtavi_discord_avatar', discordAvatar);

        if (currentUser?.uid) {
          linkDiscordToUser(currentUser.uid, {
            discordId,
            discordUsername: discordUsername || '',
            discordAvatar: discordAvatar || ''
          }).catch((err) => console.warn('Sync discord to user failed:', err));
        }
      } catch (err) {
        console.warn('Local storage write warning:', err);
      }
    }

    if (claimServerSlug || serverId) {
      const targetSlug = normalizeServerSlug(claimServerSlug || serverId || '');
      const found = servers.find((s) => 
        (s.serverSlug && normalizeServerSlug(s.serverSlug) === targetSlug) ||
        ((s as any).slug && normalizeServerSlug((s as any).slug) === targetSlug) ||
        s.id === serverId ||
        s.id === claimServerSlug ||
        normalizeServerSlug(s.name) === targetSlug
      );
      if (found) {
        setClaimingServer(found);
      }
    }

    if (discordLinked || claimServerSlug || serverId) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [servers, currentUser]);

  const handleCopyConnect = async (id: string, url: string) => {
    await copyToClipboard(`connect ${url}`);
    setCopiedConnectId(id);
    setTimeout(() => setCopiedConnectId(null), 2000);
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName || !connectUrl || submittingServer) return;

    const storedDiscordId = typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_user_id') : null;
    const storedDiscordUsername = typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_username') : null;
    const resolvedOwnerDiscord = (ownerDiscordInput || storedDiscordId || currentUser?.displayName || '').trim();
    const cleanSubId = (stripeSubscriptionId || '').trim();
    const isSubscribed = Boolean(cleanSubId && cleanSubId.length >= 6);

    setSubmittingServer(true);

    try {
      const res = await fetch('/api/rp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serverName,
          framework,
          region,
          maxPlayers: 128,
          connectUrl,
          cfxCode: connectUrl,
          description,
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean) || ['Roleplay', 'Vice City'],
          isWhitelisted,
          whitelistMode: isWhitelisted ? 'ai_fast_track' : 'open_public',
          planTier,
          stripeSubscriptionId: cleanSubId,
          isSubscriptionActive: isSubscribed,
          isVerifiedServerOwner: isSubscribed,
          ownerDiscordId: resolvedOwnerDiscord,
          ownerUsername: storedDiscordUsername || currentUser?.displayName,
          uid: currentUser?.uid,
          email: currentUser?.email
        })
      });
      const data = await res.json();
      if (data.success && data.server) {
        const createdServer: RpServer = data.server;
        const updatedList = [createdServer, ...servers.filter(s => s.id !== createdServer.id)];
        setServers(updatedList);
        setCachedRpServers(updatedList);
        setSubmittedServerSuccess(createdServer);
      } else {
        // Fallback local creation
        const fallbackServer: RpServer = {
          id: `rp_${Date.now()}`,
          name: serverName,
          framework,
          playerCount: Math.floor(Math.random() * 40) + 15,
          maxPlayers: 128,
          ping: Math.floor(Math.random() * 25) + 15,
          isWhitelisted,
          whitelistMode: isWhitelisted ? 'ai_fast_track' : 'open_public',
          isManagedPartner: true,
          planTier,
          stripeSubscriptionId: cleanSubId || undefined,
          isSubscriptionActive: isSubscribed,
          isVerifiedServerOwner: isSubscribed,
          isClaimed: Boolean(resolvedOwnerDiscord),
          ownerDiscordId: resolvedOwnerDiscord,
          ownerUid: currentUser?.uid,
          averageReviewTime: isWhitelisted ? '< 60s (Instant AI Fast-Track)' : 'Instant Connect',
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean) || ['Roleplay', 'Vice City'],
          region,
          connectUrl,
          description: description || 'High performance GTA 6 Vice City roleplay server with custom economy and jobs.'
        };
        const updatedList = [fallbackServer, ...servers];
        setServers(updatedList);
        setCachedRpServers(updatedList);
        setSubmittedServerSuccess(fallbackServer);
      }
    } catch (err) {
      console.error(err);
      const fallbackServer: RpServer = {
        id: `rp_${Date.now()}`,
        name: serverName,
        framework,
        playerCount: Math.floor(Math.random() * 40) + 15,
        maxPlayers: 128,
        ping: Math.floor(Math.random() * 25) + 15,
        isWhitelisted,
        whitelistMode: isWhitelisted ? 'ai_fast_track' : 'open_public',
        isManagedPartner: true,
        planTier,
        stripeSubscriptionId: cleanSubId || undefined,
        isSubscriptionActive: isSubscribed,
        isVerifiedServerOwner: isSubscribed,
        isClaimed: Boolean(resolvedOwnerDiscord),
        ownerDiscordId: resolvedOwnerDiscord,
        ownerUid: currentUser?.uid,
        averageReviewTime: isWhitelisted ? '< 60s (Instant AI Fast-Track)' : 'Instant Connect',
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean) || ['Roleplay', 'Vice City'],
        region,
        connectUrl,
        description: description || 'High performance GTA 6 Vice City roleplay server with custom economy and jobs.'
      };
      const updatedList = [fallbackServer, ...servers];
      setServers(updatedList);
      setCachedRpServers(updatedList);
      setSubmittedServerSuccess(fallbackServer);
    } finally {
      setSubmittingServer(false);
    }

    setServerName('');
    setConnectUrl('');
    setDescription('');
    setTagsInput('');
    setOwnerDiscordInput('');
    setShowSubmitModal(false);
  };

  // Deduplicate servers by ID, name, and connectUrl so duplicate cards are never rendered
  const uniqueServers = React.useMemo(() => {
    const map = new Map<string, RpServer>();
    for (const s of servers) {
      if (!s) continue;
      const isBaseServer = ['rp1', 'rp2', 'rp3', 'rp4', 'rp5', 'rp6'].includes((s.id || '').toLowerCase());
      const normName = (s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      const normConnect = (s.connectUrl || (s as any).cfxCode || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      const key = isBaseServer ? s.id : (normName ? `dedupe_${normName}_${normConnect}` : s.id);
      if (!map.has(key)) {
        map.set(key, s);
      } else {
        const existing = map.get(key)!;
        map.set(key, { ...existing, ...s, id: existing.id || s.id });
      }
    }
    return Array.from(map.values());
  }, [servers]);

  // Filter and sort servers based on selected tab and SaaS subscription tier ranking
  const filteredServers = uniqueServers.filter(s => {
    // Hide blacklisted servers for regular non-L4 users
    if (!isL4Admin && (s.isBlacklisted || s.status === 'blacklisted')) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.name?.toLowerCase().includes(q);
      const matchFw = s.framework?.toLowerCase().includes(q);
      const matchRegion = s.region?.toLowerCase().includes(q);
      const matchTags = (s.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchFw && !matchRegion && !matchTags) return false;
    }
    if (activeFilterTab === 'whitelisted') {
      if (!s.isWhitelisted) return false;
    }
    if (activeFilterTab === 'open_public') {
      if (!(!s.isWhitelisted || s.whitelistMode === 'open_public')) return false;
    }
    if (activeFilterTab === 'my_servers') {
      const isMine =
        (s.ownerUid && currentUser?.uid && s.ownerUid === currentUser.uid) ||
        (s.ownerDiscordId && currentUser && (s.ownerDiscordId === currentUser.displayName || s.ownerDiscordId === currentUser.uid)) ||
        (s.claimedByDiscordId && currentUser && (s.claimedByDiscordId === currentUser.displayName || s.claimedByDiscordId === currentUser.uid));
      if (!isMine) return false;
    }

    // Category / Genre filter
    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase().trim();
      const matchTag = (s.tags || []).some(t => {
        const tLower = t.toLowerCase();
        if (catLower === 'serious' && (tLower.includes('serious') || tLower.includes('hardcore') || tLower.includes('strict'))) return true;
        if (catLower === 'semi-serious' && (tLower.includes('semi-serious') || tLower.includes('beginner') || tLower.includes('casual'))) return true;
        if (catLower === 'economy' && (tLower.includes('economy') || tLower.includes('business') || tLower.includes('real estate') || tLower.includes('jobs'))) return true;
        if (catLower === 'crime' && (tLower.includes('crime') || tLower.includes('heist') || tLower.includes('gang') || tLower.includes('cartel') || tLower.includes('mafia'))) return true;
        if (catLower === 'lore' && (tLower.includes('lore') || tLower.includes('custom c#') || tLower.includes('vmp') || tLower.includes('scripts'))) return true;
        if (catLower === 'survival' && (tLower.includes('survival') || tLower.includes('swamp') || tLower.includes('everglades') || tLower.includes('off-road'))) return true;
        return tLower.includes(catLower);
      });
      const matchDesc = s.description?.toLowerCase().includes(catLower) || s.name?.toLowerCase().includes(catLower);
      if (!matchTag && !matchDesc) return false;
    }

    // Region filter
    if (selectedRegion !== 'all') {
      const regLower = selectedRegion.toLowerCase().trim();
      const sRegLower = (s.region || '').toLowerCase().trim();
      if (regLower === 'na') {
        if (!sRegLower.includes('na') && !sRegLower.includes('us') && !sRegLower.includes('canada')) return false;
      } else if (regLower === 'eu') {
        if (!sRegLower.includes('eu') && !sRegLower.includes('europe') && !sRegLower.includes('uk')) return false;
      } else if (regLower === 'sa') {
        if (!sRegLower.includes('sa') && !sRegLower.includes('latam') && !sRegLower.includes('south america') && !sRegLower.includes('brazil') && !sRegLower.includes('spanish')) return false;
      } else if (regLower === 'oceania') {
        if (!sRegLower.includes('oc') && !sRegLower.includes('au') && !sRegLower.includes('australia') && !sRegLower.includes('oceania')) return false;
      } else {
        if (!sRegLower.includes(regLower)) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const rawTierA = (a as any).tier || a.planTier;
    const rawTierB = (b as any).tier || b.planTier;
    const weightA = (a as any).tierWeight || (a.isSubscriptionActive ? getTierWeight(normalizeTier(rawTierA)) : 0);
    const weightB = (b as any).tierWeight || (b.isSubscriptionActive ? getTierWeight(normalizeTier(rawTierB)) : 0);

    if (weightA !== weightB) {
      return weightB - weightA;
    }

    if (a.priorityPlacement?.isBoosted !== b.priorityPlacement?.isBoosted) {
      return (b.priorityPlacement?.isBoosted ? 1 : 0) - (a.priorityPlacement?.isBoosted ? 1 : 0);
    }

    return (b.playerCount || 0) - (a.playerCount || 0);
  });

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredServers.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedServers = filteredServers.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const totalActivePlayers = servers.reduce((sum, s) => sum + (s.playerCount || 0), 0);
  const peakServersCount = servers.filter(s => s.isPeakTraffic || s.status === 'busy').length;
  const whitelistedCount = servers.filter(s => s.isWhitelisted).length;
  const publicCount = servers.filter(s => !s.isWhitelisted || s.whitelistMode === 'open_public').length;
  const myServersCount = uniqueServers.filter(s =>
    (s.ownerUid && currentUser?.uid && s.ownerUid === currentUser.uid) ||
    (s.ownerDiscordId && currentUser && (s.ownerDiscordId === currentUser.displayName || s.ownerDiscordId === currentUser.uid)) ||
    (s.claimedByDiscordId && currentUser && (s.claimedByDiscordId === currentUser.displayName || s.claimedByDiscordId === currentUser.uid))
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">GTA VI Roleplay (RP) Server Directory</h2>
              <button
                onClick={() => setShowGuideModal(true)}
                className="p-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition border border-indigo-500/20 cursor-pointer"
                title="What is Whitelist & How to Connect?"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">Live directory & automated AI whitelist pre-screening for FiveM, VMP, and custom C# Leonida servers.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <button
            onClick={handlePingTraffic}
            disabled={isPinging}
            className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-rose-400 font-bold text-xs rounded-xl transition flex items-center gap-2 border border-rose-500/20 shrink-0 cursor-pointer disabled:opacity-50"
            title="Ping all FiveM servers and rank by active traffic"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-rose-400' : ''}`} />
            <span>{isPinging ? 'Pinging Servers...' : '⚡ Ping & Sync High Traffic'}</span>
          </button>

          <button
            onClick={handleOpenSubmitModal}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer border border-zinc-700 shadow-sm"
            title="Server submissions are temporarily paused for maintenance"
          >
            <Server className="w-4 h-4 text-amber-400" />
            <span>Submit Your Server</span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Paused</span>
          </button>
        </div>
      </div>

      {/* #1 Top Position Spotlight Spot (Reserved Rental vs Open For Booking Ad Banner) */}
      <div className="relative space-y-3">
        {/* Toggle Switcher Bar when a booking is currently active */}
        {todaySpotlight && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-zinc-950/80 px-4 py-2 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-zinc-300 font-bold">Active Today: <span className="text-amber-300">{todaySpotlight.serverName}</span></span>
            </div>
            <button
              onClick={() => setForceShowAdBanner(!forceShowAdBanner)}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{forceShowAdBanner ? 'Show Active Booked Server' : '👁️ Preview "Rent Now" Ad Showcase Banner'}</span>
            </button>
          </div>
        )}

        {(!todaySpotlight || forceShowAdBanner) ? (
          /* HIGH-IMPACT "RENT THIS SPOT NOW" AD SHOWCASE BANNER FOR UNBOOKED SPOTS */
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-zinc-950 via-amber-950/25 to-indigo-950/40 p-6 lg:p-8 shadow-2xl shadow-amber-500/20 backdrop-blur-2xl space-y-6">
            {/* Background Animated Neon Mesh & Particle Glow */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Ribbon Header */}
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 text-[11px] font-black uppercase tracking-wider rounded-bl-2xl shadow-lg border-b border-l border-amber-300/40 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 fill-zinc-950 animate-bounce" />
              <span>#1 SPOTLIGHT AD SLOT AVAILABLE FOR RENT</span>
            </div>

            {/* Main Banner Header Info */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-3 lg:pt-0">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>🟢 UNBOOKED OPEN SLOT • GET FEATURED TODAY</span>
                  </span>

                  <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>${spotlightDailyRate.toFixed(2)} USD / 24 Hours</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Promote Your Server Here — Claim the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">#1 Vice City Spotlight Spot!</span>
                </h3>

                <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                  Skyrocket your server's player count! Your server gets sticky top placement above the entire Vice City directory, direct 1-click F8 connect code, and instant exposure to 250,000+ monthly roleplay gamers.
                </p>
              </div>

              {/* Action Buttons & Rate Box */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-3 shrink-0">
                <div className="bg-zinc-950/90 border border-amber-500/40 rounded-xl p-3 text-center lg:text-right shadow-inner space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400/90 block">Top Spot Daily Rate</span>
                  <div className="text-xl font-black text-white font-mono flex items-center justify-center lg:justify-end gap-1">
                    <span className="text-amber-400">${spotlightDailyRate.toFixed(2)}</span>
                    <span className="text-xs font-normal text-zinc-400">/ 24 Hours</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowSpotlightModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 cursor-pointer border border-amber-300/40"
                  >
                    <Sparkles className="w-4 h-4 text-zinc-950" />
                    <span>Rent Spot Now (${spotlightDailyRate.toFixed(2)})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Advantage Benefit Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="bg-zinc-950/70 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">850+ CCU Player Boost</div>
                  <div className="text-[10px] text-zinc-400">Guaranteed top directory visibility</div>
                </div>
              </div>

              <div className="bg-zinc-950/70 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">1-Click Direct Join</div>
                  <div className="text-[10px] text-zinc-400">Custom F8 console command bar</div>
                </div>
              </div>

              <div className="bg-zinc-950/70 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">Custom Gold Badge</div>
                  <div className="text-[10px] text-zinc-400">Verified gold halo & custom tags</div>
                </div>
              </div>

              <div className="bg-zinc-950/70 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">Instant Activation</div>
                  <div className="text-[10px] text-zinc-400">Live in &lt; 30s after reservation</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE BOOKED SERVER VIEW */
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 p-6 lg:p-7 shadow-2xl shadow-amber-500/15 backdrop-blur-xl">
            {/* Ambient Background Gold Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Premium Gold Header Ribbon */}
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 text-[11px] font-black uppercase tracking-wider rounded-bl-2xl shadow-lg border-b border-l border-amber-300/40 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 fill-zinc-950" />
              <span>OFFICIAL SPOTLIGHT FEATURE</span>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2 lg:pt-0">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{todaySpotlight.customBadge || '🌟 #1 FEATURED ROLEPLAY SERVER'}</span>
                  </span>

                  <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                    {todaySpotlight.framework} • {todaySpotlight.region}
                  </span>

                  <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Verified Spot Active</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{todaySpotlight.serverName}</span>
                </h3>

                <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                  {todaySpotlight.description || 'High performance GTA VI roleplay server featured exclusively at the #1 position in the Vice City directory.'}
                </p>

                {todaySpotlight.tags && todaySpotlight.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {todaySpotlight.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 text-[11px] rounded-md bg-zinc-950/90 text-amber-300/90 border border-amber-500/20 font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Console Command & Copy Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
                <div className="bg-zinc-950/90 border border-amber-500/30 rounded-xl p-2.5 space-y-1 text-center lg:text-right shadow-inner">
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 block">F8 Console Connect Address</span>
                  <code className="text-xs text-amber-300 font-mono font-bold block px-2">
                    connect {todaySpotlight.connectUrl}
                  </code>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                  <button
                    onClick={() => handleCopyConnect('spotlight-today', todaySpotlight.connectUrl)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer flex-1 sm:flex-initial border border-amber-300/40"
                  >
                    {copiedConnectId === 'spotlight-today' ? (
                      <>
                        <Check className="w-4 h-4 text-zinc-950" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-zinc-950" />
                        <span>Copy F8 Connect</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowSpotlightModal(true)}
                    className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 text-xs font-bold rounded-xl transition border border-zinc-800 hover:border-amber-500/40 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    title="Rent future open dates for your server"
                  >
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Reserve Dates</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Server Network Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500">Network Status</div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Servers Online
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500">Active Players</div>
            <div className="text-xs font-bold text-white">{totalActivePlayers} Online Now</div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500">Peak Traffic</div>
            <div className="text-xs font-bold text-rose-400">{peakServersCount} at Capacity</div>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500">Whitelist Active</div>
            <div className="text-xs font-bold text-indigo-300">{whitelistedCount} Verified Hubs</div>
          </div>
        </div>
      </div>

      {/* Directory Filter Tabs & Search Bar */}
      <div className="space-y-3 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              id="filter-tab-all"
              onClick={() => {
                setActiveFilterTab('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilterTab === 'all'
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              🌐 All Access Ports ({servers.length})
            </button>

            <button
              id="filter-tab-whitelisted"
              onClick={() => {
                setActiveFilterTab('whitelisted');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFilterTab === 'whitelisted'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Whitelisted ({whitelistedCount})</span>
            </button>

            <button
              id="filter-tab-public"
              onClick={() => {
                setActiveFilterTab('open_public');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilterTab === 'open_public'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              🎮 Public (No Whitelist Required) ({publicCount})
            </button>

            <button
              id="filter-tab-my-servers"
              onClick={() => {
                setActiveFilterTab('my_servers');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeFilterTab === 'my_servers'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                  : 'bg-zinc-900 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span>Your Servers ({myServersCount})</span>
            </button>
          </div>

          {/* Directory Search Input */}
          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search server name, tag, feature..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition"
            />
          </div>
        </div>

        {/* rpservers.net Inspired Multi-Faceted Sub-Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/50">
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Gameplay Genre / Category</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: 'All Genres', value: 'all' },
                { label: 'Serious RP', value: 'serious' },
                { label: 'Semi-Serious', value: 'semi-serious' },
                { label: 'Economy & Jobs', value: 'economy' },
                { label: 'Crime & Gangs', value: 'crime' },
                { label: 'Custom Lore', value: 'lore' },
                { label: 'Swamp & Survival', value: 'survival' }
              ].map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.value);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    selectedCategory === cat.value
                      ? 'bg-zinc-800 text-amber-400 border border-amber-500/30'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Regional Gateway</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: 'All Regions', value: 'all' },
                { label: 'North America (NA)', value: 'na' },
                { label: 'Europe (EU)', value: 'eu' },
                { label: 'South America (SA)', value: 'sa' },
                { label: 'Oceania (OC)', value: 'oceania' }
              ].map((reg) => (
                <button
                  key={reg.value}
                  type="button"
                  onClick={() => {
                    setSelectedRegion(reg.value);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    selectedRegion === reg.value
                      ? 'bg-zinc-800 text-cyan-400 border border-cyan-500/30'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-900'
                  }`}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Status & Per-Page Controls Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 px-4 py-2 rounded-xl">
        <div>
          Showing <strong className="text-white">{filteredServers.length > 0 ? (safeCurrentPage - 1) * itemsPerPage + 1 : 0}</strong>–
          <strong className="text-white">{Math.min(safeCurrentPage * itemsPerPage, filteredServers.length)}</strong> of{' '}
          <strong className="text-amber-400">{filteredServers.length}</strong> Servers
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">Servers Per Page:</span>
          {[6, 8, 12, 16].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setItemsPerPage(num);
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                itemsPerPage === num
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Servers Grid */}
      <div id="servers-grid-container" className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoadingServers ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`srv_skel_${idx}`}
              className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4 animate-pulse relative overflow-hidden shadow-lg"
            >
              {/* Header: Rank, Server Avatar, Title, Region */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 bg-zinc-800/80 rounded-md" />
                      <div className="h-4 w-12 bg-zinc-800/60 rounded" />
                    </div>
                    <div className="h-5 w-44 bg-zinc-800 rounded-lg" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-zinc-800/70 rounded-full shrink-0" />
              </div>

              {/* Tags Row Skeleton */}
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-zinc-800/60 rounded-md" />
                <div className="h-5 w-20 bg-zinc-800/60 rounded-md" />
                <div className="h-5 w-14 bg-zinc-800/60 rounded-md" />
              </div>

              {/* Player Count Progress Bar Skeleton */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-28 bg-zinc-800/60 rounded" />
                  <div className="h-3 w-16 bg-zinc-800/60 rounded" />
                </div>
                <div className="h-2 w-full bg-zinc-800/80 rounded-full" />
              </div>

              {/* Description Skeleton */}
              <div className="space-y-1.5 pt-1">
                <div className="h-3.5 w-full bg-zinc-800/70 rounded" />
                <div className="h-3.5 w-4/5 bg-zinc-800/50 rounded" />
              </div>

              {/* Action Buttons Row Skeleton */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="h-9 w-24 bg-zinc-800 rounded-xl" />
                <div className="flex items-center gap-2">
                  <div className="h-9 w-24 bg-zinc-800 rounded-xl" />
                  <div className="h-9 w-28 bg-zinc-800/80 rounded-xl" />
                </div>
              </div>
            </div>
          ))
        ) : paginatedServers.length === 0 ? (
          <div className="col-span-1 md:col-span-2 p-12 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <Server className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">
              {activeFilterTab === 'my_servers' ? 'No Deployed Servers Found' : 'No RP Servers Found'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {activeFilterTab === 'my_servers'
                ? "You haven't registered or claimed any RP servers under your account yet."
                : `No community listings match your active filters or search query "${searchQuery}".`}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              {activeFilterTab === 'my_servers' ? (
                <button
                  type="button"
                  onClick={handleOpenSubmitModal}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-zinc-950 transition cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  + List Your RP Server
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilterTab('all');
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-amber-400 transition cursor-pointer"
                >
                  Clear Directory Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          paginatedServers.map((server, idx) => {
            const absoluteRank = (safeCurrentPage - 1) * itemsPerPage + idx + 1;
          const isCopied = copiedConnectId === server.id;
          const isBusy = server.status === 'busy' || (server.playerCount >= server.maxPlayers - 5);
          const isPublicServer = !server.isWhitelisted || server.whitelistMode === 'open_public';
          const slug = normalizeServerSlug(server.name);

          // Compute Claim & Ownership State Strictly
          const isClaimed = Boolean(server.isClaimed || server.ownerDiscordId || server.claimedByDiscordId);
          const isMyServer = Boolean(
            currentUser && (
              (server.ownerUid && server.ownerUid === currentUser.uid) ||
              (server.ownerDiscordId && (server.ownerDiscordId === currentUser.displayName || server.ownerDiscordId === currentUser.uid)) ||
              (server.claimedByDiscordId && (server.claimedByDiscordId === currentUser.displayName || server.claimedByDiscordId === currentUser.uid))
            )
          );
          const claimedOwnerDisplay = server.claimedByDiscordUsername || server.ownerDiscordId;

          const rawTier = (server as any).tier || server.planTier;
          const currentTier = normalizeTier(rawTier);
          const isMegaServer = server.isSubscriptionActive && currentTier === 'mega';
          const isProServer = server.isSubscriptionActive && currentTier === 'pro';
          const isStarterServer = server.isSubscriptionActive && currentTier === 'starter';

          return (
            <div
              key={server.id}
              className={`bg-zinc-900/90 border rounded-2xl p-6 space-y-4 transition-all flex flex-col justify-between ${
                isMegaServer
                  ? 'border-amber-500/80 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-amber-950/20 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/30'
                  : isProServer
                  ? 'border-indigo-500/60 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-indigo-950/20 shadow-lg shadow-indigo-950/20'
                  : isMyServer
                  ? 'border-amber-500/50 bg-gradient-to-b from-zinc-900/95 to-amber-950/20 shadow-lg shadow-amber-950/20'
                  : server.isPeakTraffic
                  ? 'border-rose-500/40 shadow-lg shadow-rose-950/20'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        #{absoluteRank} {server.framework}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-800 text-zinc-300">
                        {server.region}
                      </span>

                      {/* Tier Badges */}
                      {(server.isBlacklisted || server.status === 'blacklisted') && (
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded bg-rose-950 text-rose-300 border border-rose-500/60 flex items-center gap-1 animate-pulse">
                          <Ban className="w-3 h-3 text-rose-400" />
                          <span>🚫 BLACKLISTED</span>
                        </span>
                      )}

                      {isMegaServer && (
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-sm">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Top 5 Spotlight</span>
                        </span>
                      )}

                      {isProServer && (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-indigo-400" />
                          <span>Verified Partner</span>
                        </span>
                      )}

                      {/* Explicit Ownership & Partner Badges */}
                      {isMyServer ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>👑 Managed by You</span>
                        </span>
                      ) : isClaimed ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1" title={claimedOwnerDisplay ? `Claimed by @${claimedOwnerDisplay}` : undefined}>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Verified Community {claimedOwnerDisplay ? `(@${claimedOwnerDisplay})` : ''}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-800/80 text-amber-400/90 border border-amber-500/20 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>Unclaimed Listing</span>
                        </span>
                      )}

                      {server.priorityPlacement?.isBoosted && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>{server.priorityPlacement.badge || '⭐ Directory Boosted'}</span>
                        </span>
                      )}

                      {server.isPeakTraffic && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                          <Flame className="w-3 h-3 text-rose-400" /> Peak
                        </span>
                      )}

                      {server.isWhitelisted || server.whitelistMode === 'ai_fast_track' ? (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>⚡ Whitelist Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Public (Fast-Track)</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-2">{server.name}</h3>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`flex items-center justify-end gap-1 text-xs font-bold ${isBusy ? 'text-rose-400' : 'text-emerald-400'}`}>
                      <Users className="w-3.5 h-3.5" />
                      <span>{server.playerCount}/{server.maxPlayers}</span>
                    </div>
                    {server.queue ? (
                      <div className="text-[10px] text-amber-400 font-medium mt-0.5">
                        Queue: {server.queue} players
                      </div>
                    ) : null}
                    <span className="text-[10px] text-zinc-500 flex items-center justify-end gap-1 mt-0.5">
                      <Wifi className="w-3 h-3 text-emerald-400" /> {server.ping}ms
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{server.description}</p>

                {/* Review Time SLA Badge */}
                {server.averageReviewTime && (
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-zinc-800/60 w-fit">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Review SLA: <strong className="text-zinc-200">{server.averageReviewTime}</strong></span>
                  </div>
                )}

                {/* Tags */}
                {Array.isArray(server.tags) && server.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {server.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-[10px] rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Rows - Clean, structured action layout */}
              <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                {/* 1. Connect Command Bar with embedded Copy F8 button */}
                <div className="flex items-center justify-between gap-2 bg-zinc-950 p-1.5 pl-3 rounded-xl border border-zinc-800/80">
                  <code className="text-xs text-indigo-300 font-mono truncate min-w-0 flex-1">
                    connect {server.connectUrl}
                  </code>
                  <button
                    id={`btn-copy-connect-${server.id}`}
                    onClick={() => handleCopyConnect(server.id, server.connectUrl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                    }`}
                    title="Copy F8 FiveM console connect command"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy F8'}</span>
                  </button>
                </div>

                {/* 2. Main Player & Server Action Buttons */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Whitelist Application Portal - Available on ALL servers */}
                    <button
                      id={`btn-apply-whitelist-${server.id}`}
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('server-apply', slug);
                        } else {
                          window.location.href = `/servers/${slug}/apply`;
                        }
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                      title="Submit Whitelist / Fast-Track Application"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Apply for Whitelist</span>
                    </button>

                    {/* Server Owner Access: Show Manage Server if owned by current user */}
                    {isMyServer && (
                      <button
                        id={`btn-manage-server-${server.id}`}
                        onClick={() => {
                          if (onNavigate) {
                            onNavigate('server-dashboard', slug);
                          } else {
                            window.location.href = `/servers/${slug}/dashboard`;
                          }
                        }}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                        title="Manage your verified server listing, review queue, and form builder"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>⚙️ Manage Server</span>
                      </button>
                    )}
                  </div>

                  {/* Admin L4 Controls: Blacklist & Delete Server */}
                  {isL4Admin && (
                    <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
                      <button
                        id={`btn-admin-blacklist-${server.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBlacklist(server);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1 cursor-pointer ${
                          server.isBlacklisted || server.status === 'blacklisted'
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-500/40 hover:bg-rose-900'
                        }`}
                        title={server.isBlacklisted || server.status === 'blacklisted' ? 'L4 Admin: Unblacklist Server' : 'L4 Admin: Blacklist Server'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{server.isBlacklisted || server.status === 'blacklisted' ? 'Unblacklist' : 'Blacklist'}</span>
                      </button>

                      <button
                        id={`btn-admin-delete-${server.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteServer(server);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        title="L4 Admin: Permanently Delete Server"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Small Claim Button at Bottom of Unclaimed Cards */}
              {!isClaimed && !isMyServer && (
                <div className="pt-2 mt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Are you the owner of this server?</span>
                  <button
                    id={`btn-claim-server-${server.id}`}
                    onClick={() => setShowClaimComingSoonModal(true)}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 font-bold text-[11px] rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Claim server feature coming soon"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>👑 Claim Server (Coming Soon)</span>
                  </button>
                </div>
              )}
            </div>
          );
        }))}
      </div>

      {/* Directory Pagination Navigation Controls Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl mt-6">
          <div className="text-xs text-zinc-400">
            Page <strong className="text-amber-400">{safeCurrentPage}</strong> of <strong className="text-white">{totalPages}</strong> ({filteredServers.length} Total Listings)
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Previous Button */}
            <button
              type="button"
              disabled={safeCurrentPage === 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                const el = document.getElementById('servers-grid-container');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                safeCurrentPage === 1
                  ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }).map((_, pIdx) => {
              const pageNum = pIdx + 1;
              const isCurrent = pageNum === safeCurrentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    setCurrentPage(pageNum);
                    const el = document.getElementById('servers-grid-container');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-8 h-8 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              type="button"
              disabled={safeCurrentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                const el = document.getElementById('servers-grid-container');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                safeCurrentPage === totalPages
                  ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Ping & Network Routing Optimization Widget in Responsive Grid Container */}
      <div className="w-full my-6 sm:my-8 px-1 sm:px-2 grid grid-cols-1 min-h-[140px] overflow-hidden transition-all">
        <VpnOptimizerWidget
          serverName="Vice City RP Network"
          placement="server_directory_footer"
        />
      </div>

      {/* GTA 6 / Leonida Roleplay Informational Guide (Inspired by rpservers.net) */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
        <div className="border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-base font-black uppercase tracking-wider text-white">Grand Theft Auto VI • Leonida Roleplay Portal Guide</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Get to know the fundamentals of Leonida (Vice City) roleplay, whitelists, and connection methods.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Guide Section 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-amber-500/10 text-amber-400 text-xs font-black font-mono">01</span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">What is Leonida (GTA 6) Roleplay?</h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Leonida Roleplay allows you to step into the upcoming virtual sandbox of Vice City, Port Gellhorn, and the Everglades as a custom fictional character. Rather than standard chaotic gameplay, players act out realistic lives: run legal businesses, enforce laws as police officers, provide critical trauma care as paramedics, or orchestrate high-stakes criminal syndicates. Staying in character (IC) and preserving realism is paramount to serious roleplay.
            </p>
          </div>

          {/* Guide Section 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 text-xs font-black font-mono">02</span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Serious RP vs Semi-Serious RP</h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong>Serious RP</strong> centers on heavy storytelling, strict character development, realistic economics, and robust value-of-life (NVL) rules, where actions have genuine consequences. <strong>Semi-Serious RP</strong> or casual RP reduces administrative strictness, allowing players to enjoy custom supercars, action-packed turf wars, and high-intensity robberies with shorter jail times and relaxed narrative requirements.
            </p>
          </div>

          {/* Guide Section 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-black font-mono">03</span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Why Do Servers Require a Whitelist?</h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              The highest quality roleplay environments utilize a "whitelist" application system. This process ensures that joining players have read the community rules, understand basic roleplay terminologies (e.g., Metagaming, Powergaming), and are committed to mature narrative-driven interaction. Whitelisting keeps trolls out. Our portal offers an <strong>Instant AI Fast-Track Whitelist Engine</strong> to bypass multi-day staff review delays.
            </p>
          </div>
        </div>

        {/* Step-by-Step Connection Banner */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase">How to Connect to Any Listing Instantly</span>
            </div>
            <p className="text-[11px] text-zinc-400 max-w-2xl leading-relaxed">
              Ensure you have your multiplayer client (FiveM or custom C# launcher) booted. Click any card's <strong className="text-zinc-200">"Copy F8"</strong> button to copy the direct connect address. Open your game, tap <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700 font-mono">F8</kbd> to open the developer console, paste (<kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700 font-mono">Ctrl + V</kbd>), and press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700 font-mono">Enter</kbd> to connect!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-zinc-500">Need Assistance?</span>
            <button
              onClick={() => setShowGuideModal(true)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-800 cursor-pointer"
            >
              Open Direct Help Guide
            </button>
          </div>
        </div>
      </div>

      {/* VIP Required Modal for Non-VIP Users */}
      {showVipRequiredModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <Crown className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">VIP Membership Required</h3>
              </div>
              <button
                onClick={() => setShowVipRequiredModal(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <p className="leading-relaxed">
                To prevent spam and maintain high-quality FiveM & RP community listings, <strong className="text-white">Roleplay Server Directory Submissions</strong> are exclusive to <strong className="text-amber-400">VIP Members</strong> and verified Server Staff.
              </p>

              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                  VIP Membership Perks:
                </span>
                <ul className="space-y-1 text-zinc-300 list-disc list-inside">
                  <li>List custom FiveM / VMP servers with live player sync</li>
                  <li>No-code whitelist application form builder</li>
                  <li>Discord webhook dispatch for player approvals</li>
                  <li>Ad-free experience across all utility tools</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowVipRequiredModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVipRequiredModal(false);
                  if (onNavigate) onNavigate('monetization');
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Unlock VIP Pass ($3.99/mo)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Server Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative my-auto bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">List Your Roleplay Server</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-zinc-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={handleAddServer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Server Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vice City Underground RP"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Framework</label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="FiveM">FiveM</option>
                    <option value="VMP">VMP</option>
                    <option value="Custom C#">Custom C#</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Region</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="NA East">NA East</option>
                    <option value="NA West">NA West</option>
                    <option value="EU Central">EU Central</option>
                    <option value="SA">SA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Connect IP / Domain</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cfx.re/join/v6vc77"
                  value={connectUrl}
                  onChange={(e) => setConnectUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Economy, Custom Cars, Realistic Jobs"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Server Owner Discord ID / GamerTag</label>
                <input
                  type="text"
                  placeholder="e.g. _niklaus or 849204918294028190"
                  value={ownerDiscordInput}
                  onChange={(e) => setOwnerDiscordInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">This Discord user will be designated the verified owner with access to the Whitelist & Form Builder dashboard.</p>
              </div>

              {/* Plan Tier & Stripe Verification Suite */}
              <div className="p-3.5 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Plan Tier & Verified Owner Clearance</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Stripe B2B
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlanTier('mega_server')}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      planTier === 'mega_server'
                        ? 'bg-amber-500/20 border-amber-500/60 text-white shadow-sm'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-amber-300">Mega Server Plan</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">$49/mo • Verified Owner</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanTier('community')}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      planTier === 'community'
                        ? 'bg-indigo-500/20 border-indigo-500/60 text-white shadow-sm'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-indigo-300">Community Tier</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Free • Standard Queue</div>
                  </button>
                </div>

                {planTier === 'mega_server' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-300">
                        Stripe Subscription ID (<code className="text-amber-400 font-mono">sub_...</code> / <code className="text-amber-400 font-mono">cs_...</code>):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const demoToken = `sub_live_vice2026_${Math.random().toString(36).substring(2, 8)}`;
                          setStripeSubscriptionId(demoToken);
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                      >
                        ⚡ Auto-Generate Subscription Key
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. sub_1P... or cs_live_..."
                      value={stripeSubscriptionId}
                      onChange={(e) => setStripeSubscriptionId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Active subscriptions unlock <strong className="text-white">Custom Branding Suite</strong>, <strong className="text-white">Advanced Conversion Analytics</strong>, and <strong className="text-white">Sentinel AI Growth Studio</strong>.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="whitelist"
                  checked={isWhitelisted}
                  onChange={(e) => setIsWhitelisted(e.target.checked)}
                  className="accent-indigo-600 rounded"
                />
                <label htmlFor="whitelist" className="text-xs text-zinc-300 font-medium">Requires Whitelist / Application</label>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Server Description</label>
                <textarea
                  rows={2}
                  placeholder="Tell players about your features, custom scripts, and community..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Submit & Publish Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Server Submitted Successfully Modal */}
      {submittedServerSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Server Published Live!</h3>
              </div>
              <button
                onClick={() => setSubmittedServerSuccess(null)}
                className="text-zinc-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <p className="leading-relaxed">
                <strong className="text-white">{submittedServerSuccess.name}</strong> has been saved and published in the Roleplay Directory and synchronized to the cloud database.
              </p>
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Server Slug:</span>
                  <span className="font-mono text-emerald-400 font-bold">{normalizeServerSlug(submittedServerSuccess.name)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Owner Discord:</span>
                  <span className="font-mono text-amber-300">{submittedServerSuccess.ownerDiscordId || 'Attached to your account'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  const slug = normalizeServerSlug(submittedServerSuccess.name);
                  setSubmittedServerSuccess(null);
                  if (onNavigate) onNavigate('server-dashboard', slug);
                  else window.location.href = `/servers/${slug}/dashboard`;
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span>Open Owner Management Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const slug = normalizeServerSlug(submittedServerSuccess.name);
                  setSubmittedServerSuccess(null);
                  if (onNavigate) onNavigate('server-manage', slug);
                  else window.location.href = `/servers/${slug}/manage`;
                }}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Configure Whitelist Questions</span>
              </button>

              <button
                type="button"
                onClick={() => setSubmittedServerSuccess(null)}
                className="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium cursor-pointer"
              >
                Stay in Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal: How to Connect & What Whitelist Means */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">FiveM Server Connection & Whitelist Guide</h3>
                  <p className="text-xs text-zinc-400">Step-by-step instructions for connecting to GTA VI roleplay servers.</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-zinc-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              {/* Whitelist Explained Section */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>What does "Whitelisted" mean?</span>
                </div>
                <p>
                  A <strong className="text-white">Whitelisted Server</strong> requires players to submit a character backstory and answer roleplay scenario questions before gaining access. This ensures high immersion, eliminates trolls and rule-breakers, and maintains a serious roleplay environment.
                </p>
                <p className="text-zinc-400">
                  ⚡ On <strong className="text-amber-400">Instant AI Fast-Track</strong> servers, our integrated Gemini 3.7 Flash lore engine reviews and approves high-quality applications within 60 seconds!
                </p>
              </div>

              {/* Step-by-Step Connection Instructions */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>How to Connect via the FiveM Console (F8)</span>
                </h4>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <div>
                      <span className="font-bold text-white block">Copy the Connect Command</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        On any server card in this directory, click the <strong className="text-indigo-400">Copy F8</strong> button. This copies the exact string (e.g., <code className="text-indigo-300 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800 font-mono">connect cfx.re/join/vclife1</code>) to your clipboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <div>
                      <span className="font-bold text-white block">Launch FiveM Application</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Open the FiveM client on your PC. Ensure your Steam or Discord client is running in the background for account authentication.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                    <div>
                      <span className="font-bold text-white block">Open the FiveM Console</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Inside the FiveM client, press <kbd className="px-1.5 py-0.5 bg-zinc-800 text-white rounded font-mono text-[10px] border border-zinc-700">F8</kbd> or the tilde key <kbd className="px-1.5 py-0.5 bg-zinc-800 text-white rounded font-mono text-[10px] border border-zinc-700">~</kbd> to bring up the command console overlay.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                    <div>
                      <span className="font-bold text-white block">Paste & Press Enter</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Press <kbd className="px-1.5 py-0.5 bg-zinc-800 text-white rounded font-mono text-[10px] border border-zinc-700">Ctrl + V</kbd> to paste the command, then hit <kbd className="px-1.5 py-0.5 bg-zinc-800 text-white rounded font-mono text-[10px] border border-zinc-700">Enter</kbd> to initiate direct connection to Vice City!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Got It!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AI Whitelist Simulator & Lore Coach Modal */}
      {practiceModalServer && (
        <AiPracticeExamModal
          server={practiceModalServer}
          isOpen={!!practiceModalServer}
          onClose={() => setPracticeModalServer(null)}
        />
      )}

      {/* #1 Top Position Spotlight Rental Modal */}
      <SpotlightRentalModal
        isOpen={showSpotlightModal}
        onClose={() => {
          setShowSpotlightModal(false);
          fetchTodaySpotlight();
        }}
        availableServers={servers}
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
      />

      {/* Claim Server Coming Soon Modal */}
      {showClaimComingSoonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Crown className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Server Claiming — Coming Soon</h3>
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400">Under Active Development</span>
                </div>
              </div>
              <button
                onClick={() => setShowClaimComingSoonModal(false)}
                className="text-zinc-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                The automated <strong className="text-white">Server Ownership & Verification Engine</strong> is undergoing system upgrades and will be launched in an upcoming platform update.
              </p>

              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Upcoming Server Claim Features:
                </span>
                <ul className="space-y-1.5 text-zinc-400 list-disc list-inside text-[11px]">
                  <li>0x8 Discord Guild bot ownership handshake</li>
                  <li>Instant transfers to verified Discord usernames</li>
                  <li>Full Whitelist & Review Queue dashboard access</li>
                  <li>Automated FiveM player sync telemetry</li>
                </ul>
              </div>

              <p className="text-[11px] text-zinc-400">
                If you are a server owner and need immediate verification, please reach out via Vice City HQ Support.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowClaimComingSoonModal(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Server Coming Soon Modal */}
      {showSubmitComingSoonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-indigo-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Server className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Server Submissions — Temporarily Paused</h3>
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400">Scheduled Directory Maintenance</span>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitComingSoonModal(false)}
                className="text-zinc-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <p>
                Server submissions are currently paused while we upgrade our <strong className="text-white">FiveM Auto-Ping & Traffic Ranker</strong> system and onboarding verification pipeline.
              </p>

              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Directory Status:
                </span>
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Submissions Paused For Maintenance</span>
                </div>
                <p className="text-[11px] text-zinc-400 pt-1">
                  Directory updates and verification protocols are being upgraded to ensure high listing quality and instant FiveM console connection accuracy. We will reopen submissions shortly!
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowSubmitComingSoonModal(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl border border-zinc-700 shadow-lg cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secure Server Claim & Paywall Modal */}
      {claimingServer && (
        <ClaimButtonModal
          server={claimingServer}
          isOpen={!!claimingServer}
          onClose={() => setClaimingServer(null)}
          userProfile={userProfileMemo}
          onClaimInitiated={(claimData) => {
            if (claimData?.redirectUrl && claimData?.stage === 'checkout_redirect') {
              window.location.href = claimData.redirectUrl;
            }
          }}
        />
      )}

      {/* Admin L4 Delete Confirmation Modal */}
      {deleteModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-950 border border-red-500/40 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black tracking-wide uppercase">Permanent Delete Warning (Admin)</h3>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{deleteModalTarget.name}</strong> from the directory? This action removes the server listing completely and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteServer}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Server'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin L4 Blacklist Modal */}
      {blacklistModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-950 border border-rose-500/40 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Ban className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black tracking-wide uppercase">
                {blacklistModalTarget.isBlacklisted || blacklistModalTarget.status === 'blacklisted' ? 'Lift Blacklist' : 'Blacklist Server'}
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Target Server: <strong className="text-white">{blacklistModalTarget.name}</strong> ({blacklistModalTarget.id})
            </p>

            {!(blacklistModalTarget.isBlacklisted || blacklistModalTarget.status === 'blacklisted') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 block">Reason for Blacklisting:</label>
                <textarea
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  placeholder="Enter reason for blacklisting this server..."
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBlacklistModalTarget(null)}
                disabled={isBlacklisting}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmToggleBlacklist}
                disabled={isBlacklisting}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer ${
                  blacklistModalTarget.isBlacklisted || blacklistModalTarget.status === 'blacklisted'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {isBlacklisting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                <span>
                  {isBlacklisting
                    ? 'Updating...'
                    : blacklistModalTarget.isBlacklisted || blacklistModalTarget.status === 'blacklisted'
                    ? 'Unblacklist & Restore'
                    : 'Confirm Blacklist'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Success Toast / Alert Notice */}
      {adminSuccessNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <span>{adminSuccessNotice}</span>
          <button onClick={() => setAdminSuccessNotice(null)} className="text-emerald-400 hover:text-white font-black text-sm cursor-pointer">✕</button>
        </div>
      )}
    </div>
  );
};
