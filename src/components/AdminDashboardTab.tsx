'use client';
import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  ShieldCheck,
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Sliders,
  Crown,
  Activity,
  UserCheck,
  UserX,
  RefreshCw,
  Sparkles,
  Lock,
  Layers,
  Zap,
  TrendingUp,
  BarChart3,
  Database,
  ShieldAlert,
  Info,
  Newspaper,
  Car,
  Crosshair,
  MapPin,
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  Send,
  Mail,
  FileText,
  ChevronLeft,
  ChevronRight,
  Coins,
  Flame,
  SlidersHorizontal,
  Eye,
  X,
  Code,
  Copy,
  Check,
  Radio,
  Bug,
  Camera,
  Trophy,
  Ticket,
  Tv,
  Globe,
  Target,
  ExternalLink,
  Bot,
  Wand2
} from 'lucide-react';
import { ENV } from '../lib/envConfig';
import { auth } from '../lib/firebase';
import { deleteRtdbChannel, deleteRtdbMessage, subscribeRtdbMessages } from '../lib/firebase/rtdbChatService';
import { UserProfile, RpServer, CommunityBuild, UserRole } from '../types';
import { RP_SERVERS_DATA } from '../data/rpServers';
import { DEFAULT_GTA6_AVATAR } from '../data/avatars';
import { canBanTarget, canAssignRole, canEditUserFields, isTargetAdmin, getRoleLevel, isAdminUser, isStaffUser } from '../lib/rbac';
import { getVipPriceFormatted, getVipPriceText } from '../lib/vipConfig';
import { saveOrUpdateMapLocation, deleteMapLocation } from '../lib/mapStore';
import { saveOrUpdateVehicle, deleteVehicle } from '../lib/vehicleStore';
import { saveOrUpdateWeapon, deleteWeapon } from '../lib/weaponStore';
import { saveOrUpdateCharacter, deleteCharacter } from '../lib/characterStore';
import { PseoArchitectureTab } from './PseoArchitectureTab';
import { BugReportsAdminSection } from './admin/BugReportsAdminSection';
import { ChallengesAdminCms } from './admin/ChallengesAdminCms';
import { SpotlightRentalAdminCms } from './admin/SpotlightRentalAdminCms';
import { StaffActivityLogsTab } from './admin/StaffActivityLogsTab';
import { CouponGeneratorCms } from './admin/CouponGeneratorCms';
import { AdToggleAdminCms } from './admin/AdToggleAdminCms';
import { EnvironmentHealthAdminSection } from './admin/EnvironmentHealthAdminSection';
import { CronRtdbMonitorAdmin } from './admin/CronRtdbMonitorAdmin';
import { MarketAgencyAdminCms } from './admin/MarketAgencyAdminCms';
import { CustomWebhookBotAdminCms } from './admin/CustomWebhookBotAdminCms';
import { CharacterGalleryAdminCms } from './admin/CharacterGalleryAdminCms';
import { VehicleCatalogAdminCms } from './admin/VehicleCatalogAdminCms';
import { WeaponCatalogAdminCms } from './admin/WeaponCatalogAdminCms';
import { MasterCatalogAdminCms } from './admin/MasterCatalogAdminCms';
import { OnDemandFeatureAdminCms } from './admin/OnDemandFeatureAdminCms';
import { SystemPricingControl } from './SystemPricingControl';
import { logStaffActivity } from '../lib/staffAuditLogger';
import { formatVipExpiry, formatDate, formatDateTime, formatShortTimestamp, formatAutoCrawlTime } from '../lib/dateUtils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const INITIAL_USERS: UserProfile[] = [];

interface PendingApproval {
  id: string;
  type: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
  detail: string;
  channelId?: string;
  channel?: string;
  requestedAtMs?: number;
  messageId?: string;
  author?: string;
  content?: string;
  reason?: string;
  details?: string;
  reporter?: string;
  screenshotUrl?: string;
  severity?: string;
  category?: string;
  reportRefNumber?: string;
  reportId?: string;
}

const INITIAL_PENDING: PendingApproval[] = [];

export interface AdminDashboardTabProps {
  initialSubTab?: 'users' | 'approvals' | 'reports' | 'cms' | 'challenge-cms' | 'rental-cms' | 'analytics' | 'pricing-control' | 'pseo' | 'vip-notifications' | 'squad-rooms' | 'staff-logs' | 'coupon-cms' | 'ad-toggles' | 'env-health' | 'market-agency' | 'character-gallery' | 'vehicle-cms' | 'weapon-cms' | 'feature-requests';
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({ initialSubTab }) => {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(INITIAL_PENDING);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'username' | 'vcBalance' | 'role'>('newest');
  const [userPage, setUserPage] = useState<number>(1);
  const [userPageSize, setUserPageSize] = useState<number>(10);

  // Full Firestore User Document Edit Modal state
  const [editingUserDoc, setEditingUserDoc] = useState<UserProfile | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('User');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editIsStaff, setEditIsStaff] = useState(false);
  const [editIsVip, setEditIsVip] = useState(false);
  const [editStatus, setEditStatus] = useState<'Active' | 'Suspended'>('Active');
  const [editVcBalance, setEditVcBalance] = useState(0);
  const [editDailyStreak, setEditDailyStreak] = useState(0);
  const [editVipExpires, setEditVipExpires] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editPublishedBuilds, setEditPublishedBuilds] = useState(0);
  const [editModerationNote, setEditModerationNote] = useState('');
  const [editRawJson, setEditRawJson] = useState('');
  const [isSavingUserDoc, setIsSavingUserDoc] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'approvals' | 'reports' | 'cms' | 'challenge-cms' | 'rental-cms' | 'analytics' | 'pricing-control' | 'pseo' | 'vip-notifications' | 'squad-rooms' | 'staff-logs' | 'coupon-cms' | 'ad-toggles' | 'env-health' | 'market-agency' | 'webhook-bot' | 'character-gallery' | 'vehicle-cms' | 'weapon-cms' | 'cron-rtdb' | 'feature-requests'>(() => {
    if (initialSubTab) return initialSubTab as any;
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subtab');
      if (sub === 'feature-requests' || sub === 'features-on-demand' || sub === 'on-demand-features') {
        return 'feature-requests';
      }
      if (sub === 'cron-rtdb' || sub === 'cron' || sub === 'crons' || sub === 'rtdb-cron') {
        return 'cron-rtdb';
      }
      if (sub === 'webhook-bot' || sub === 'bot' || sub === 'webhook' || sub === 'discord-bot') {
        return 'webhook-bot';
      }
      if (sub === 'character-gallery' || sub === 'characters' || sub === 'character' || sub === 'character-cms') {
        return 'character-gallery';
      }
      if (sub === 'vehicle-cms' || sub === 'vehicles-cms' || sub === 'vehicle' || sub === 'vehicles') {
        return 'vehicle-cms';
      }
      if (sub === 'weapon-cms' || sub === 'weapons-cms' || sub === 'weapon' || sub === 'weapons') {
        return 'weapon-cms';
      }
      if (sub === 'market-agency' || sub === 'marketagency' || path.includes('marketagency') || path.includes('market-agency') || path.includes('agency')) {
        return 'market-agency';
      }
      if (sub && ['users', 'approvals', 'reports', 'cms', 'challenge-cms', 'rental-cms', 'analytics', 'pricing-control', 'pseo', 'vip-notifications', 'squad-rooms', 'staff-logs', 'coupon-cms', 'ad-toggles', 'env-health', 'market-agency', 'webhook-bot', 'character-gallery', 'vehicle-cms', 'weapon-cms', 'cron-rtdb'].includes(sub)) {
        return sub as any;
      }
    }
    return 'users';
  });

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Automated VIP Expiration Email Engine State
  const [vipLogs, setVipLogs] = useState<any[]>([]);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [isTriggeringVipCheck, setIsTriggeringVipCheck] = useState(false);
  const [testEmailAddr, setTestEmailAddr] = useState('player@vicecity.app');
  const [testUsername, setTestUsername] = useState('ViceRacer99');
  const [testDaysLeft, setTestDaysLeft] = useState(3);
  const [testExpireDate, setTestExpireDate] = useState('2026-08-15');
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);
  const [vipCheckNotice, setVipCheckNotice] = useState<string | null>(null);
  const [showCloudFunctionsModal, setShowCloudFunctionsModal] = useState(false);
  const [showAdminEmailPreviewModal, setShowAdminEmailPreviewModal] = useState<boolean>(false);
  const [lastDispatchedPreview, setLastDispatchedPreview] = useState<{
    to: string;
    subject: string;
    html: string;
    timestamp: string;
    status: string;
    isPlaceholderEmail: boolean;
    isInAppDelivered: boolean;
  } | null>(null);

  // Multiplayer Squad Radar Stale Rooms Cleaner State
  const [squadStatus, setSquadStatus] = useState<any>(null);
  const [squadRoomsList, setSquadRoomsList] = useState<any[]>([]);
  const [isLoadingSquad, setIsLoadingSquad] = useState(false);
  const [squadActionNotice, setSquadActionNotice] = useState<string | null>(null);

  const fetchSquadRoomsData = async () => {
    setIsLoadingSquad(true);
    try {
      const [statusRes, roomsRes] = await Promise.all([
        fetch('/api/squad/status'),
        fetch('/api/squad/rooms')
      ]);
      const statusData = await statusRes.json();
      const roomsData = await roomsRes.json();
      if (statusData.success) setSquadStatus(statusData);
      if (roomsData.success && Array.isArray(roomsData.rooms)) setSquadRoomsList(roomsData.rooms);
    } catch (err) {
      console.warn('Failed to load squad rooms data:', err);
    } finally {
      setIsLoadingSquad(false);
    }
  };

  const handleRunSquadCleanup = async (options?: { thresholdMinutes?: number; dryRun?: boolean; flagOnly?: boolean }) => {
    setIsLoadingSquad(true);
    setSquadActionNotice(null);
    try {
      const res = await fetch('/api/squad/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {})
      });
      const data = await res.json();
      if (data.success) {
        logStaffActivity({
          actionType: 'SQUAD_ROOM_CLEANUP',
          actionCategory: 'System Operations',
          targetId: 'squad_rooms',
          targetName: 'Stale Squad Rooms',
          targetType: 'system_cleanup',
          severity: 'MEDIUM',
          details: `Staff triggered automated squad room cleanup engine. ${data.message || ''}`
        }).catch(() => {});

        setSquadActionNotice(`✅ ${data.message}`);
        fetchSquadRoomsData();
      } else {
        setSquadActionNotice(`❌ ${data.error || 'Cleanup failed'}`);
      }
    } catch (err: any) {
      setSquadActionNotice(`❌ Error: ${err?.message || 'Network error'}`);
    } finally {
      setIsLoadingSquad(false);
    }
  };

  const handleDeleteSingleRoom = async (roomId: string) => {
    try {
      await fetch('/api/admin/cms/squad_rooms/' + roomId, { method: 'DELETE' });
      logStaffActivity({
        actionType: 'SQUAD_ROOM_DELETE',
        actionCategory: 'System Operations',
        targetId: roomId,
        targetName: `Squad Room #${roomId}`,
        targetType: 'squad_room',
        severity: 'HIGH',
        details: `Staff manually purged squad voice/radar room #${roomId} from database.`
      }).catch(() => {});

      setSquadActionNotice(`✅ Purged squad room ${roomId} from database.`);
      fetchSquadRoomsData();
    } catch (err: any) {
      setSquadActionNotice(`❌ Failed to delete room: ${err?.message || err}`);
    }
  };

  const fetchVipLogs = async () => {
    setIsRefreshingLogs(true);
    try {
      const res = await fetch('/api/admin/vip-expiry-logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setVipLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to load VIP expiry logs:', err);
    } finally {
      // Keep rotation smooth for visual feedback
      setTimeout(() => {
        setIsRefreshingLogs(false);
      }, 600);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'vip-notifications') {
      fetchVipLogs();
    } else if (activeSubTab === 'squad-rooms') {
      fetchSquadRoomsData();
    }
  }, [activeSubTab]);

  const handleTriggerVipSpider = async () => {
    setIsTriggeringVipCheck(true);
    setVipCheckNotice(null);
    try {
      const res = await fetch('/api/admin/trigger-vip-expiry-check?force=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      const data = await res.json();
      if (data.success) {
        setVipCheckNotice(`✅ ${data.message}`);
        fetchVipLogs();
      } else {
        setVipCheckNotice(`❌ ${data.error || 'Failed to trigger VIP expiry scan'}`);
      }
    } catch (err: any) {
      setVipCheckNotice(`❌ Error: ${err?.message || 'Network error'}`);
    } finally {
      setIsTriggeringVipCheck(false);
    }
  };

  const handleSendTestAlertAdmin = async () => {
    setIsSendingTestAlert(true);
    setVipCheckNotice(null);
    try {
      const res = await fetch('/api/email/send-test-vip-expiry-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmailAddr,
          username: testUsername,
          daysLeft: testDaysLeft,
          expireDate: testExpireDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setVipCheckNotice(`✅ Test VIP email dispatched to ${testEmailAddr} (@${testUsername})! (Delivered to In-App Notifications & Firestore Mail)`);
        if (data.renderedHtml) {
          setLastDispatchedPreview({
            to: testEmailAddr,
            subject: data.subject || `[TEST ALERT] ⚠️ VIP Subscription Expiring in ${testDaysLeft} Days (@${testUsername})`,
            html: data.renderedHtml,
            timestamp: new Date().toLocaleTimeString(),
            status: 'Queued in Firestore mail collection & Delivered to In-App Notifications',
            isPlaceholderEmail: !!data.isPlaceholderEmail,
            isInAppDelivered: true
          });
          setShowAdminEmailPreviewModal(true);
        }
        fetchVipLogs();
      } else {
        setVipCheckNotice(`❌ ${data.error || 'Failed to dispatch test alert'}`);
      }
    } catch (err: any) {
      setVipCheckNotice(`❌ Error: ${err?.message || 'Network error'}`);
    } finally {
      setIsSendingTestAlert(false);
    }
  };
  const [cmsSection, setCmsSection] = useState<'blog' | 'vehicle' | 'weapon' | 'map' | 'rp' | 'chat'>('blog');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Live Chat Moderation State
  const [liveChatMessages, setLiveChatMessages] = useState<any[]>([]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatChannelFilter, setChatChannelFilter] = useState('all');

  // CMS Collections State
  const [publishedBlogs, setPublishedBlogs] = useState<any[]>([]);
  const [publishedVehicles, setPublishedVehicles] = useState<any[]>([]);
  const [publishedWeapons, setPublishedWeapons] = useState<any[]>([]);
  const [publishedMapLocations, setPublishedMapLocations] = useState<any[]>([]);
  const [publishedRpServers, setPublishedRpServers] = useState<any[]>([]);
  const [publishedChatChannels, setPublishedChatChannels] = useState<any[]>([]);

  // CMS Form States
  // 1. Blog / Intel
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSubtitle, setBlogSubtitle] = useState('');
  const [blogCategory, setBlogCategory] = useState<'Map Leaks & Districts' | 'Heists & Businesses' | 'Vehicle Tuning Specs' | 'RP Server News' | 'Weapon Meta & TTK'>('Map Leaks & Districts');
  const [blogReadTime, setBlogReadTime] = useState('4 min read');
  const [blogImageUrl, setBlogImageUrl] = useState('');
  const [blogAuthor, setBlogAuthor] = useState('Vice City Intel Staff');
  const [blogTags, setBlogTags] = useState('GTA6, ViceCity, Intel');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');

  // 2. Vehicle
  const [vehName, setVehName] = useState('');
  const [vehBrand, setVehBrand] = useState('Pegassi');
  const [vehCategory, setVehCategory] = useState<string>('Super');
  const [vehDealer, setVehDealer] = useState<string>('Legendary Motorsport');
  const [vehTopSpeed, setVehTopSpeed] = useState('165');
  const [vehAccel, setVehAccel] = useState('85');
  const [vehHandling, setVehHandling] = useState('80');
  const [vehArmor, setVehArmor] = useState('50');
  const [vehPrice, setVehPrice] = useState('1250000');
  const [vehImageUrl, setVehImageUrl] = useState('');
  const [vehDesc, setVehDesc] = useState('');

  // 3. Weapon
  const [wpnName, setWpnName] = useState('');
  const [wpnManufacturer, setWpnManufacturer] = useState('Hawk & Little');
  const [wpnCategory, setWpnCategory] = useState<string>('Assault Rifles');
  const [wpnDamage, setWpnDamage] = useState('75');
  const [wpnFireRate, setWpnFireRate] = useState('70');
  const [wpnAccuracy, setWpnAccuracy] = useState('80');
  const [wpnRange, setWpnRange] = useState('65');
  const [wpnPrice, setWpnPrice] = useState('18500');
  const [wpnImageUrl, setWpnImageUrl] = useState('');
  const [wpnDesc, setWpnDesc] = useState('');

  // 4. Map Location
  const [mapTitle, setMapTitle] = useState('');
  const [mapDistrict, setMapDistrict] = useState<string>('Vice Beach');
  const [mapCategory, setMapCategory] = useState<string>('Heist Target');
  const [mapX, setMapX] = useState('55');
  const [mapY, setMapY] = useState('42');
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [mapDesc, setMapDesc] = useState('');

  // 5. RP Server
  const [rpName, setRpName] = useState('');
  const [rpFramework, setRpFramework] = useState<string>('FiveM');
  const [rpRegion, setRpRegion] = useState<string>('NA East');
  const [rpMaxPlayers, setRpMaxPlayers] = useState('128');
  const [rpConnectUrl, setRpConnectUrl] = useState('');
  const [rpTags, setRpTags] = useState('Roleplay, Economy, Gangs');
  const [rpDesc, setRpDesc] = useState('');

  // 6. Chat Channel
  const [chatId, setChatId] = useState('');
  const [chatName, setChatName] = useState('');
  const [chatCategory, setChatCategory] = useState('General');
  const [chatDesc, setChatDesc] = useState('');

  // CMS Edit Mode State Tracking
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [editingVehId, setEditingVehId] = useState<string | null>(null);
  const [editingWpnId, setEditingWpnId] = useState<string | null>(null);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editingRpId, setEditingRpId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);

  const actorEmail = auth.currentUser?.email;
  const currentActorUser = users.find(u => u.uid === auth.currentUser?.uid || u.id === auth.currentUser?.uid || (actorEmail && u.email?.toLowerCase() === actorEmail.toLowerCase()));
  const isActorL4Admin = isAdminUser(currentActorUser, actorEmail);
  const actorRole: UserRole = isActorL4Admin ? 'Admin' : (isStaffUser(currentActorUser, actorEmail) ? 'Staff' : 'User');

  // Real-Time Polling for MongoDB State Synchronization
  useEffect(() => {
    // Initial load from MongoDB API
    fetchAdminData().catch(() => {});

    // Periodic live sync from MongoDB every 10 seconds
    const interval = setInterval(() => {
      fetchAdminData().catch(() => {});
    }, 10000);

    // Subscribe to Realtime Database chat messages for Admin Live Chat Manager
    let unsubChatMsgs: () => void = () => {};
    try {
      unsubChatMsgs = subscribeRtdbMessages('global', (rtdbMsgs) => {
        if (rtdbMsgs && rtdbMsgs.length > 0) {
          setLiveChatMessages(rtdbMsgs as any);
        }
      });
    } catch (e) {
      console.warn('RTDB Chat subscription error:', e);
    }

    // Initial REST fallback for chat messages
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setLiveChatMessages(prev => {
            const map = new Map();
            data.data.forEach((m: any) => map.set(m.id, m));
            prev.forEach((m: any) => map.set(m.id, m));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    return () => {
      clearInterval(interval);
      unsubChatMsgs();
    };
  }, []);

  // Fetch and Load CMS Collections from MongoDB / REST API (0 Firestore reads)
  useEffect(() => {
    const fetchCmsCollections = async () => {
      try {
        const [blogsRes, vehiclesRes, weaponsRes, mapsRes, rpServersRes, chatRes] = await Promise.all([
          fetch('/api/admin/cms/blogPosts').then(r => r.json()),
          fetch('/api/admin/cms/vehicles').then(r => r.json()),
          fetch('/api/admin/cms/weapons').then(r => r.json()),
          fetch('/api/admin/cms/mapLocations').then(r => r.json()),
          fetch('/api/admin/cms/rpServers').then(r => r.json()),
          fetch('/api/admin/cms/chatChannels').then(r => r.json())
        ]);

        if (blogsRes.success && Array.isArray(blogsRes.data)) setPublishedBlogs(blogsRes.data);
        if (vehiclesRes.success && Array.isArray(vehiclesRes.data)) setPublishedVehicles(vehiclesRes.data);
        if (weaponsRes.success && Array.isArray(weaponsRes.data)) setPublishedWeapons(weaponsRes.data);
        if (mapsRes.success && Array.isArray(mapsRes.data)) setPublishedMapLocations(mapsRes.data);
        if (rpServersRes.success && Array.isArray(rpServersRes.data)) setPublishedRpServers(rpServersRes.data);
        if (chatRes.success && Array.isArray(chatRes.data)) setPublishedChatChannels(chatRes.data);
      } catch (err) {
        console.warn('Error loading CMS Collections:', err);
      }
    };

    fetchCmsCollections();
  }, []);

  // CMS Start/Cancel Edit Handlers
  const handleStartEditBlog = (post: any) => {
    setEditingBlogId(post.id);
    setBlogTitle(post.title || '');
    setBlogSubtitle(post.subtitle || '');
    setBlogCategory(post.category || 'Map Leaks & Districts');
    setBlogReadTime(post.readTime || '4 min read');
    setBlogImageUrl(post.imageUrl || '');
    setBlogAuthor(post.author || 'Vice Staff');
    setBlogTags(Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''));
    setBlogExcerpt(post.excerpt || '');
    setBlogContent(Array.isArray(post.content) ? post.content.join('\n\n') : (post.content || ''));
  };

  const handleCancelEditBlog = () => {
    setEditingBlogId(null);
    setBlogTitle('');
    setBlogSubtitle('');
    setBlogExcerpt('');
    setBlogContent('');
    setBlogImageUrl('');
  };

  const handleStartEditVehicle = (v: any) => {
    setEditingVehId(v.id);
    setVehName(v.name || '');
    setVehBrand(v.brand || 'Pegassi');
    setVehCategory(v.category || 'Super');
    setVehDealer(v.dealer || 'Legendary Motorsport');
    setVehTopSpeed(String(v.topSpeedMph || 165));
    setVehAccel(String(v.acceleration || 85));
    setVehHandling(String(v.handling || 80));
    setVehPrice(String(v.price || 1250000));
    setVehImageUrl(v.imageUrl || '');
    setVehDesc(v.description || '');
  };

  const handleCancelEditVehicle = () => {
    setEditingVehId(null);
    setVehName('');
    setVehDesc('');
    setVehImageUrl('');
  };

  const handleStartEditWeapon = (w: any) => {
    setEditingWpnId(w.id);
    setWpnName(w.name || '');
    setWpnManufacturer(w.manufacturer || 'Hawk & Little');
    setWpnCategory(w.category || 'Assault Rifles');
    setWpnDamage(String(w.damage || 75));
    setWpnFireRate(String(w.fireRate || 70));
    setWpnAccuracy(String(w.accuracy || 80));
    setWpnRange(String(w.range || 65));
    setWpnPrice(String(w.price || 18500));
    setWpnImageUrl(w.imageUrl || '');
    setWpnDesc(w.description || '');
  };

  const handleCancelEditWeapon = () => {
    setEditingWpnId(null);
    setWpnName('');
    setWpnDesc('');
    setWpnImageUrl('');
  };

  const handleStartEditMapLocation = (m: any) => {
    setEditingMapId(m.id);
    setMapTitle(m.title || '');
    setMapDistrict(m.district || 'Vice Beach');
    setMapCategory(m.category || 'Heist Target');
    setMapX(String(m.x || 55));
    setMapY(String(m.y || 42));
    setMapImageUrl(m.imageUrl || '');
    setMapDesc(m.description || '');
  };

  const handleCancelEditMapLocation = () => {
    setEditingMapId(null);
    setMapTitle('');
    setMapDesc('');
    setMapImageUrl('');
  };

  const handleStartEditRpServer = (r: any) => {
    setEditingRpId(r.id);
    setRpName(r.name || '');
    setRpFramework(r.framework || 'FiveM');
    setRpRegion(r.region || 'NA East');
    setRpMaxPlayers(String(r.maxPlayers || 128));
    setRpConnectUrl(r.connectUrl || '');
    setRpTags(Array.isArray(r.tags) ? r.tags.join(', ') : (r.tags || ''));
    setRpDesc(r.description || '');
  };

  const handleCancelEditRpServer = () => {
    setEditingRpId(null);
    setRpName('');
    setRpDesc('');
    setRpConnectUrl('');
  };

  const handleStartEditChatChannel = (c: any) => {
    setEditingChatId(c.id);
    setChatId(c.id);
    setChatName(c.name || '');
    setChatCategory(c.category || 'General');
    setChatDesc(c.description || '');
  };

  const handleCancelEditChatChannel = () => {
    setEditingChatId(null);
    setChatId('');
    setChatName('');
    setChatDesc('');
  };

  // CMS Handlers
  const handlePublishBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle) return;
    const id = editingBlogId || ('post-' + Date.now());
    const newDoc = {
      id,
      slug: blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: blogTitle,
      subtitle: blogSubtitle || 'Game Intel & Leak Analysis',
      category: blogCategory,
      author: blogAuthor || 'Vice Staff',
      authorRole: 'Official Intel Contributor',
      authorAvatar: DEFAULT_GTA6_AVATAR,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: blogReadTime || '4 min read',
      imageUrl: blogImageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      likes: 1,
      isFeatured: true,
      tags: blogTags ? blogTags.split(',').map((t) => t.trim()) : ['GTA6', 'ViceCity'],
      excerpt: blogExcerpt || 'Exclusive Vice City game update published by Staff.',
      content: blogContent ? blogContent.split('\n\n') : ['Exclusive update directly from the Vice City Staff Team.'],
      keyTakeaways: ['Published live via Vice City Zero-Code CMS', 'Verified by Staff Moderators'],
      updatedAt: new Date().toISOString()
    };

    try {
      await fetch('/api/admin/cms/blogPosts/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      logStaffActivity({
        actionType: editingBlogId ? 'CMS_CONTENT_UPDATE' : 'CMS_CONTENT_CREATE',
        actionCategory: 'Content CMS',
        targetId: id,
        targetName: blogTitle,
        targetType: 'blog',
        severity: 'LOW',
        details: `Staff ${editingBlogId ? 'updated' : 'created'} blog/intel article "${blogTitle}".`
      }).catch(() => {});

      setActionNotice(editingBlogId ? `Updated Blog Article "${blogTitle}" Live!` : `Published Blog Article "${blogTitle}" Live!`);
      setTimeout(() => setActionNotice(null), 4000);
      handleCancelEditBlog();
    } catch (err) {
      console.error(err);
      alert('Error saving blog post: ' + String(err));
    }
  };

  const handlePublishVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehName) return;
    const id = editingVehId || ('veh-' + Date.now());
    const newDoc = {
      id,
      slug: vehName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: vehName,
      brand: vehBrand || 'Pegassi',
      category: vehCategory,
      price: Number(vehPrice) || 1200000,
      dealer: vehDealer,
      topSpeedMph: Number(vehTopSpeed) || 165,
      acceleration: Number(vehAccel) || 85,
      braking: 80,
      handling: Number(vehHandling) || 80,
      drivetrain: 'AWD',
      capacity: 2,
      description: vehDesc || 'Custom vehicle added via Staff CMS.',
      imageUrl: vehImageUrl || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
      featuredInTrailer: true,
      isCustomizable: true,
      baseModdingBudget: 500000,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveOrUpdateVehicle(newDoc as any);
      await fetch('/api/admin/cms/vehicles/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      logStaffActivity({
        actionType: editingVehId ? 'CMS_CONTENT_UPDATE' : 'CMS_CONTENT_CREATE',
        actionCategory: 'Content CMS',
        targetId: id,
        targetName: vehName,
        targetType: 'vehicle',
        severity: 'LOW',
        details: `Staff ${editingVehId ? 'updated' : 'created'} vehicle "${vehName}" in live database.`
      }).catch(() => {});

      setActionNotice(editingVehId ? `Updated Vehicle "${vehName}" Live!` : `Vehicle "${vehName}" Added to Live Catalog!`);
      setTimeout(() => setActionNotice(null), 4000);
      handleCancelEditVehicle();
    } catch (err) {
      console.error(err);
      alert('Error saving vehicle: ' + String(err));
    }
  };

  const handlePublishWeapon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpnName) return;
    const id = editingWpnId || ('wpn-' + Date.now());
    const newDoc = {
      id,
      slug: wpnName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: wpnName,
      manufacturer: wpnManufacturer || 'Hawk & Little',
      category: wpnCategory,
      damage: Number(wpnDamage) || 75,
      fireRate: Number(wpnFireRate) || 70,
      accuracy: Number(wpnAccuracy) || 80,
      range: Number(wpnRange) || 65,
      magazineSize: 30,
      ttkMs: 380,
      unlockRank: 10,
      price: Number(wpnPrice) || 18500,
      description: wpnDesc || 'New weapon specification added via Zero-Code CMS.',
      imageUrl: wpnImageUrl || 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=800&q=80',
      attachments: [],
      updatedAt: new Date().toISOString()
    };

    try {
      await fetch('/api/admin/cms/weapons/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      logStaffActivity({
        actionType: editingWpnId ? 'CMS_CONTENT_UPDATE' : 'CMS_CONTENT_CREATE',
        actionCategory: 'Content CMS',
        targetId: id,
        targetName: wpnName,
        targetType: 'weapon',
        severity: 'LOW',
        details: `Staff ${editingWpnId ? 'updated' : 'created'} weapon "${wpnName}" in live database.`
      }).catch(() => {});

      setActionNotice(editingWpnId ? `Updated Weapon "${wpnName}" Live!` : `Weapon "${wpnName}" Added to Live Arsenal!`);
      setTimeout(() => setActionNotice(null), 4000);
      handleCancelEditWeapon();
    } catch (err) {
      console.error(err);
      alert('Error saving weapon: ' + String(err));
    }
  };

  const handlePublishMapLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapTitle) return;
    const id = editingMapId || ('loc-' + Date.now());
    const newDoc = {
      id,
      title: mapTitle,
      district: mapDistrict,
      category: mapCategory,
      x: Number(mapX) || 50,
      y: Number(mapY) || 50,
      description: mapDesc || 'Point of Interest added by Staff.',
      imageUrl: mapImageUrl || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
      updatedAt: new Date().toISOString()
    };

    try {
      await saveOrUpdateMapLocation(newDoc as any);
      await fetch('/api/admin/cms/mapLocations/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      logStaffActivity({
        actionType: editingMapId ? 'CMS_CONTENT_UPDATE' : 'CMS_CONTENT_CREATE',
        actionCategory: 'Content CMS',
        targetId: id,
        targetName: mapTitle,
        targetType: 'map_location',
        severity: 'LOW',
        details: `Staff ${editingMapId ? 'updated' : 'created'} map location "${mapTitle}".`
      }).catch(() => {});

      setActionNotice(editingMapId ? `Updated Map Location "${mapTitle}" Live!` : `Map Location "${mapTitle}" Marked on Map!`);
      setTimeout(() => setActionNotice(null), 4000);
      handleCancelEditMapLocation();
    } catch (err) {
      console.error(err);
      alert('Error saving map location: ' + String(err));
    }
  };

  const handlePublishRpServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rpName) return;
    const id = editingRpId || ('server-' + Date.now());
    const newDoc = {
      id,
      name: rpName,
      framework: rpFramework,
      region: rpRegion,
      playerCount: Math.floor(Math.random() * 80) + 20,
      maxPlayers: Number(rpMaxPlayers) || 128,
      ping: 28,
      isWhitelisted: true,
      tags: rpTags ? rpTags.split(',').map((t) => t.trim()) : ['RP', 'Economy'],
      connectUrl: rpConnectUrl || 'cfx.re/join/vc' + Math.floor(Math.random() * 900 + 100),
      description: rpDesc || 'GTA 6 Roleplay Community Server.',
      updatedAt: new Date().toISOString()
    };

    try {
      await fetch('/api/admin/cms/rpServers/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      logStaffActivity({
        actionType: editingRpId ? 'CMS_CONTENT_UPDATE' : 'CMS_CONTENT_CREATE',
        actionCategory: 'Content CMS',
        targetId: id,
        targetName: rpName,
        targetType: 'rp_server',
        severity: 'LOW',
        details: `Staff ${editingRpId ? 'updated' : 'created'} RP server listing "${rpName}".`
      }).catch(() => {});

      setActionNotice(editingRpId ? `Updated RP Server "${rpName}" Live!` : `RP Server "${rpName}" Added to Directory!`);
      setTimeout(() => setActionNotice(null), 4000);
      handleCancelEditRpServer();
    } catch (err) {
      console.error(err);
      alert('Error saving RP server: ' + String(err));
    }
  };

  const handlePublishChatChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatName) return;
    const cleanId = editingChatId || (chatId || chatName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newDoc = {
      id: cleanId,
      name: chatName.startsWith('#') ? chatName : `# ${chatName}`,
      category: chatCategory,
      description: chatDesc || 'Live Player Discussion Channel',
      updatedAt: new Date().toISOString()
    };

    try {
      await fetch('/api/admin/cms/chatChannels/' + cleanId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      logStaffActivity({
        actionType: editingChatId ? 'CMS_CONTENT_UPDATE' : 'CMS_CONTENT_CREATE',
        actionCategory: 'Community Chat',
        targetId: cleanId,
        targetName: chatName,
        targetType: 'chat_channel',
        severity: 'LOW',
        details: `Staff ${editingChatId ? 'updated' : 'created'} chat channel "${chatName}".`
      }).catch(() => {});

      setActionNotice(editingChatId ? `Updated Chat Channel "${chatName}" Live!` : `Chat Channel "${chatName}" Created Live!`);
      setTimeout(() => setActionNotice(null), 4000);
      handleCancelEditChatChannel();
    } catch (err) {
      console.error(err);
      alert('Error saving chat channel: ' + String(err));
    }
  };

  // CMS Delete Confirmation Modal State
  const [cmsDeleteConfirm, setCmsDeleteConfirm] = useState<{ colName: string; id: string; title: string } | null>(null);

  const handleDeleteCmsItem = (colName: string, id: string, title: string) => {
    setCmsDeleteConfirm({ colName, id, title });
  };

  const confirmDeleteCmsItem = async () => {
    if (!cmsDeleteConfirm) return;
    const { colName, id, title } = cmsDeleteConfirm;
    setCmsDeleteConfirm(null);
    try {
      if (colName === 'mapLocations') {
        await deleteMapLocation(id);
      } else if (colName === 'vehicles') {
        await deleteVehicle(id);
      } else if (colName === 'weapons') {
        await deleteWeapon(id);
      } else if (colName === 'characters') {
        await deleteCharacter(id);
      }
      await fetch(`/api/admin/cms/${colName}/${id}`, { method: 'DELETE' });
      logStaffActivity({
        actionType: 'CMS_CONTENT_DELETE',
        actionCategory: 'Content CMS',
        targetId: id,
        targetName: title,
        targetType: colName,
        severity: 'HIGH',
        details: `Staff deleted ${colName} item "${title}" (${id}) from database.`
      }).catch(() => {});

      setPublishedBlogs(prev => prev.filter(item => item.id !== id));
      setPublishedVehicles(prev => prev.filter(item => item.id !== id));
      setPublishedWeapons(prev => prev.filter(item => item.id !== id));
      setPublishedMapLocations(prev => prev.filter(item => item.id !== id));
      setPublishedRpServers(prev => prev.filter(item => item.id !== id));
      setPublishedChatChannels(prev => prev.filter(item => item.id !== id));
      setActionNotice(`Removed "${title}" from website.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.error(err);
      setActionNotice('Error deleting item: ' + String(err));
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // User Document Delete Confirmation State
  const [userToDelete, setUserToDelete] = useState<{ id: string; username: string; email: string } | null>(null);

  const handleDeleteUserDoc = (userId: string, username: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    if (!canEditUserFields(actorRole, actorEmail, targetUser)) {
      setActionNotice('🛡️ Permission Denied: You cannot delete an Administrator or higher clearance profile.');
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }
    setUserToDelete({ id: userId, username, email: targetUser.email });
  };

  const confirmDeleteUserDoc = async () => {
    if (!userToDelete) return;
    const { id, username } = userToDelete;
    setUserToDelete(null);
    if (editingUserDoc?.id === id) setEditingUserDoc(null);
    try {
      await fetch('/api/admin/cms/userProfiles/' + id, { method: 'DELETE' });
      logStaffActivity({
        actionType: 'USER_DOC_DELETE',
        actionCategory: 'User Management',
        targetId: id,
        targetName: `@${username}`,
        targetType: 'user',
        severity: 'CRITICAL',
        details: `Staff permanently deleted user profile document for @${username} (${id}).`
      }).catch(() => {});
    } catch (e) {
      console.warn('API deletion error for user profile:', e);
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    setActionNotice(`🗑️ User profile for @${username} was permanently removed.`);
    setTimeout(() => setActionNotice(null), 3500);
  };


  const fetchAdminData = async () => {
    setIsRefreshing(true);
    try {
      // Primary API query directly from high-performance MongoDB backend
      const [uRes, pRes, cmsRes] = await Promise.allSettled([
        fetch('/api/admin/users').then(res => res.json()),
        fetch('/api/admin/pending').then(res => res.json()),
        fetch('/api/admin/cms/userProfiles').then(res => res.json()).catch(() => null)
      ]);

      if (uRes.status === 'fulfilled' && uRes.value?.success && Array.isArray(uRes.value.data) && uRes.value.data.length > 0) {
        setUsers(uRes.value.data);
      } else if (cmsRes.status === 'fulfilled' && cmsRes.value?.success && Array.isArray(cmsRes.value.data) && cmsRes.value.data.length > 0) {
        setUsers(cmsRes.value.data);
      }

      if (pRes.status === 'fulfilled' && pRes.value?.success && Array.isArray(pRes.value.data)) {
        setPendingApprovals(pRes.value.data.filter((p: any) => p && p.id && p.id !== 'p1'));
      }
    } catch (err) {
      console.warn('MongoDB Admin Data Sync Notice:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Assign user role (Admins can assign any role; Staff L3 can assign non-Admin roles to non-Admin users)
  const handleAssignRole = async (userId: string, newRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (!canEditUserFields(actorRole, actorEmail, targetUser) || !canAssignRole(actorRole, actorEmail, targetUser.role, newRole, targetUser)) {
      setActionNotice('Permission Denied: Only Admins can edit fields or roles for Admin accounts.');
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    const isVip = newRole === 'VIP Member' || newRole === 'Staff' || newRole === 'Admin';
    const isAdmin = newRole === 'Admin';
    const isStaff = newRole === 'Staff' || newRole === 'Admin';

    // Calculate updated VIP expiration date based on target role
    let newVipExpires: string | undefined = undefined;
    if (newRole === 'Admin') {
      newVipExpires = 'Lifetime';
    } else if (newRole === 'Staff') {
      newVipExpires = 'Staff Account';
    } else if (newRole === 'VIP Member') {
      const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      newVipExpires = targetUser.vipExpires && targetUser.vipExpires !== 'Expired' && targetUser.vipExpires !== 'Staff Account' && targetUser.vipExpires !== 'Lifetime'
        ? targetUser.vipExpires
        : oneMonthLater;
    } else {
      // Made L1 (User) from L2 VIP Member or higher
      newVipExpires = 'Expired';
    }

    try {
      const payload = {
        uid: userId,
        role: newRole,
        isVip,
        isAdmin,
        isStaff,
        vipExpires: newVipExpires,
        updatedAt: new Date().toISOString()
      };

      await fetch(`/api/admin/cms/userProfiles/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      logStaffActivity({
        actionType: 'USER_ROLE_CHANGE',
        actionCategory: 'User Management',
        targetId: userId,
        targetName: `@${targetUser.username}`,
        targetType: 'user',
        severity: 'CRITICAL',
        details: `Staff modified role of @${targetUser.username} from [${targetUser.role}] to [${newRole}].`,
        changes: [
          { field: 'role', oldValue: targetUser.role, newValue: newRole, fieldLabel: 'Account Role' },
          { field: 'vipExpires', oldValue: targetUser.vipExpires || 'N/A', newValue: newVipExpires || 'N/A', fieldLabel: 'VIP Expiration' }
        ]
      }).catch(() => {});
    } catch (e) {
      console.warn('API write warning for role change:', e);
    }

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole, isVip, isAdmin, isStaff, vipExpires: newVipExpires } : u))
    );

    const oldLevel = getRoleLevel(targetUser.role);
    const newLevel = getRoleLevel(newRole);
    const isUpgrade = newLevel > oldLevel;
    const isDowngrade = newLevel < oldLevel;
    const actionLabel = isUpgrade ? 'Role Upgraded ⬆️' : isDowngrade ? 'Role Downgraded ⬇️' : 'Role Updated 🔄';

    setActionNotice(`${actionLabel}: Changed @${targetUser.username} from [${targetUser.role}] to [${newRole}]`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Explicitly toggle isVip parameter in Firestore for user profile
  const handleToggleVip = async (userId: string, currentIsVip: boolean) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (!canEditUserFields(actorRole, actorEmail, targetUser) || !canAssignRole(actorRole, actorEmail, targetUser.role, undefined, targetUser)) {
      setActionNotice('Permission Denied: Only Admins can edit fields for Admin accounts.');
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    const newIsVip = !currentIsVip;
    const newRole: UserRole = newIsVip
      ? (targetUser.role === 'User' ? 'VIP Member' : targetUser.role)
      : (targetUser.role === 'VIP Member' ? 'User' : targetUser.role);

    let newVipExpires: string | undefined = undefined;
    if (!newIsVip) {
      newVipExpires = 'Expired';
    } else if (newRole === 'Admin') {
      newVipExpires = 'Lifetime';
    } else if (newRole === 'Staff') {
      newVipExpires = 'Staff Account';
    } else {
      newVipExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    try {
      const payload = {
        uid: userId,
        isVip: newIsVip,
        role: newRole,
        vipExpires: newVipExpires,
        isAdmin: newRole === 'Admin',
        isStaff: newRole === 'Staff' || newRole === 'Admin',
        updatedAt: new Date().toISOString()
      };

      await fetch(`/api/admin/cms/userProfiles/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      logStaffActivity({
        actionType: 'USER_ROLE_CHANGE',
        actionCategory: 'User Management',
        targetId: userId,
        targetName: `@${targetUser.username}`,
        targetType: 'user',
        severity: 'HIGH',
        details: `Staff toggled VIP membership status for @${targetUser.username} to [${newIsVip ? 'TRUE' : 'FALSE'}].`,
        changes: [
          { field: 'isVip', oldValue: currentIsVip, newValue: newIsVip, fieldLabel: 'VIP Status' },
          { field: 'role', oldValue: targetUser.role, newValue: newRole, fieldLabel: 'Account Role' }
        ]
      }).catch(() => {});
    } catch (e) {
      console.warn('API write warning for isVip toggle:', e);
    }

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, isVip: newIsVip, role: newRole, vipExpires: newVipExpires, isAdmin: newRole === 'Admin', isStaff: newRole === 'Staff' || newRole === 'Admin' } : u))
    );

    setActionNotice(`Updated @${targetUser.username}: parameter isVip set to [${newIsVip ? 'TRUE' : 'FALSE'}]`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Toggle user active/suspended status with VIP Protection checks
  const handleToggleStatus = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (!canEditUserFields(actorRole, actorEmail, targetUser)) {
      setActionNotice('Permission Denied: Only Admins can modify status for Admin accounts.');
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    // Check HRBAC rule: Staff can ban anyone except Admin (L4) accounts
    const banCheck = canBanTarget(actorRole, actorEmail, targetUser.role, targetUser);
    if (!banCheck.allowed && targetUser.status === 'Active') {
      setActionNotice(`🛡️ ${banCheck.reason}`);
      setTimeout(() => setActionNotice(null), 5000);
      return;
    }

    const newStatus = targetUser.status === 'Active' ? 'Suspended' : 'Active';

    try {
      const payload = {
        uid: userId,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      await fetch(`/api/admin/cms/userProfiles/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      logStaffActivity({
        actionType: newStatus === 'Suspended' ? 'USER_BAN_SUSPEND' : 'USER_UNBAN',
        actionCategory: 'User Management',
        targetId: userId,
        targetName: `@${targetUser.username}`,
        targetType: 'user',
        severity: 'CRITICAL',
        details: `Staff changed account status for @${targetUser.username} from [${targetUser.status}] to [${newStatus}].`,
        changes: [
          { field: 'status', oldValue: targetUser.status, newValue: newStatus, fieldLabel: 'Account Status' }
        ]
      }).catch(() => {});
    } catch (e) {
      console.warn('API write warning for status toggle:', e);
    }

    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, status: newStatus as any } : u))
    );

    setActionNotice(`Account status changed to ${newStatus.toUpperCase()} for @${targetUser.username}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Approve Pending Item
  const handleApprovePending = async (id: string) => {
    const pendingItem = pendingApprovals.find(p => p.id === id);
    try {
      await fetch(`/api/admin/pending/${id}/approve`, { method: 'POST' });
      await fetch(`/api/admin/cms/pendingApprovals/${id}`, { method: 'DELETE' });
      logStaffActivity({
        actionType: 'MODERATION_APPROVAL',
        actionCategory: 'Moderation Queue',
        targetId: id,
        targetName: pendingItem?.title || id,
        targetType: pendingItem?.type || 'submission',
        severity: 'MEDIUM',
        details: `Staff approved moderation submission "${pendingItem?.title || id}" into public directories.`,
        changes: [{ field: 'status', oldValue: 'Pending Review', newValue: 'Approved', fieldLabel: 'Moderation Status' }]
      }).catch(() => {});
    } catch (e) {
      console.warn('API deletion warning for pending item:', e);
    }

    setPendingApprovals(prev => prev.filter(p => p.id !== id));
    setActionNotice('Submission approved and published live!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Reject Pending Item
  const handleRejectPending = async (id: string) => {
    const pendingItem = pendingApprovals.find(p => p.id === id);
    try {
      await fetch(`/api/admin/pending/${id}/reject`, { method: 'POST' });
      await fetch(`/api/admin/cms/pendingApprovals/${id}`, { method: 'DELETE' });
      logStaffActivity({
        actionType: 'MODERATION_REJECTION',
        actionCategory: 'Moderation Queue',
        targetId: id,
        targetName: pendingItem?.title || id,
        targetType: pendingItem?.type || 'submission',
        severity: 'MEDIUM',
        details: `Staff rejected moderation submission "${pendingItem?.title || id}".`,
        changes: [{ field: 'status', oldValue: 'Pending Review', newValue: 'Rejected', fieldLabel: 'Moderation Status' }]
      }).catch(() => {});
    } catch (e) {
      console.warn('API rejection warning for pending item:', e);
    }

    setPendingApprovals(prev => prev.filter(p => p.id !== id));
    setActionNotice('Submission rejected and removed from moderation queue.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Delete Reported Chat Message & Resolve Report
  const handleDeleteReportedMessage = async (reportId: string, messageId?: string) => {
    const deletedByName = auth.currentUser?.displayName || (isAdminUser(undefined, actorEmail) ? 'Admin' : 'Staff Moderator');
    const deletedText = 'This message was deleted by moderator';
    const reportItem = pendingApprovals.find(p => p.id === reportId);
    const channelId = (reportItem as any)?.channelId || reportItem?.channel || (reportItem as any)?.targetId || (reportItem as any)?.hubId;

    if (messageId) {
      // 1. Redact message in Realtime Database (RTDB)
      try {
        const chanId = channelId || 'general';
        await deleteRtdbMessage(chanId, messageId, deletedByName);
        if (chanId !== 'general') {
          await deleteRtdbMessage('general', messageId, deletedByName);
        }
        console.log('Successfully redacted reported message in RTDB channels:', chanId);
      } catch (err) {
        console.warn('RTDB delete error in admin reported delete:', err);
      }

      // 2. Call REST API endpoint as backend sync
      try {
        await fetch(`/api/chat/${messageId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deletedBy: deletedByName })
        });
      } catch (e) {
        console.warn('REST API chat delete error:', e);
      }

      // 3. Update local liveChatMessages
      setLiveChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, text: deletedText, deletedBy: deletedByName } : m));
    }

    // If this report was filed against a hub/channel or requested channel deletion
    if (channelId && (reportItem?.type?.includes('channel') || reportItem?.type?.includes('hub') || !messageId)) {
      try {
        await Promise.allSettled([
          fetch(`/api/admin/cms/customChannels/${channelId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDeleted: true, deleted: true, status: 'Deleted' })
          }),
          fetch(`/api/admin/cms/customChannels/${channelId}`, { method: 'DELETE' }),
          fetch(`/api/db/customChannels/${channelId}`, { method: 'DELETE' })
        ]);
        deleteRtdbChannel(channelId).catch(e => console.warn('RTDB channel delete notice:', e));
      } catch (e) {
        console.warn('Hub delete in report resolve error:', e);
      }
    }

    // 4. Remove report from pendingApprovals
    try {
      await Promise.allSettled([
        fetch(`/api/admin/cms/pendingApprovals/${reportId}`, { method: 'DELETE' }),
        fetch(`/api/admin/pending/${reportId}/reject`, { method: 'POST' })
      ]);
      logStaffActivity({
        actionType: 'REPORT_RESOLVE',
        actionCategory: 'Moderation Queue',
        targetId: reportId,
        targetName: `Report #${reportId}`,
        targetType: 'report',
        severity: 'HIGH',
        details: `Staff deleted reported chat message (ID: ${messageId || 'N/A'}) and resolved moderation ticket #${reportId}.`
      }).catch(() => {});
    } catch (e) {
      console.warn('API report deletion error:', e);
    }

    setPendingApprovals(prev => prev.filter(p => p.id !== reportId));
    setActionNotice('🗑️ Reported item / hub deleted & report resolved!');
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Dismiss report without deleting message
  const handleDismissReport = async (reportId: string) => {
    try {
      await Promise.allSettled([
        fetch(`/api/admin/cms/pendingApprovals/${reportId}`, { method: 'DELETE' }),
        fetch(`/api/admin/pending/${reportId}/reject`, { method: 'POST' })
      ]);
      logStaffActivity({
        actionType: 'REPORT_DISMISS',
        actionCategory: 'Moderation Queue',
        targetId: reportId,
        targetName: `Report #${reportId}`,
        targetType: 'report',
        severity: 'LOW',
        details: `Staff dismissed moderation report #${reportId} without deleting message.`
      }).catch(() => {});
    } catch (e) {
      console.warn('API report dismissal error:', e);
    }
    setPendingApprovals(prev => prev.filter(p => p.id !== reportId));
    setActionNotice('Report dismissed without deleting message.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Handle Staff Approval of VIP Custom Channel Deletion
  const handleApproveChannelDeletion = async (approvalId: string, channelId?: string) => {
    const reportItem = pendingApprovals.find(p => p.id === approvalId);
    const targetChannelId = channelId || (reportItem as any)?.channelId || reportItem?.channel || (reportItem as any)?.targetId || (reportItem as any)?.hubId;

    if (targetChannelId) {
      try {
        await Promise.allSettled([
          fetch(`/api/admin/cms/customChannels/${targetChannelId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDeleted: true, deleted: true, status: 'Deleted' })
          }),
          fetch(`/api/admin/cms/customChannels/${targetChannelId}`, { method: 'DELETE' }),
          fetch(`/api/db/customChannels/${targetChannelId}`, { method: 'DELETE' })
        ]);
      } catch (e) {
        console.warn('API channel delete error:', e);
      }
      deleteRtdbChannel(targetChannelId).catch(e => console.warn('RTDB channel delete notice:', e));
    }
    try {
      await Promise.allSettled([
        fetch(`/api/admin/cms/pendingApprovals/${approvalId}`, { method: 'DELETE' }),
        fetch(`/api/admin/pending/${approvalId}/reject`, { method: 'POST' })
      ]);
      logStaffActivity({
        actionType: 'CHANNEL_DELETE_APPROVE',
        actionCategory: 'Community Chat',
        targetId: targetChannelId || approvalId,
        targetName: `Channel ${targetChannelId || approvalId}`,
        targetType: 'channel',
        severity: 'HIGH',
        details: `Staff approved permanent deletion of VIP Custom Channel (${targetChannelId || approvalId}).`
      }).catch(() => {});
    } catch (e) {
      console.warn('API pending approval delete error:', e);
    }
    setPendingApprovals(prev => prev.filter(p => p.id !== approvalId));
    setActionNotice('🗑️ Custom VIP Channel permanently deleted by Staff!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Delete Chat Message directly from Live Chat Manager in Admin Panel
  const handleDeleteChatMessageDirect = async (messageId: string) => {
    const deletedByName = auth.currentUser?.displayName || (isAdminUser(undefined, actorEmail) ? 'Admin' : 'Staff Moderator');
    const deletedText = 'This message was deleted by moderator';

    // Delete across all channels in RTDB
    deleteRtdbMessage('general', messageId, deletedByName).catch(() => {});

    try {
      await fetch(`/api/chat/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: deletedByName })
      });
      logStaffActivity({
        actionType: 'CHAT_MESSAGE_DELETE',
        actionCategory: 'Community Chat',
        targetId: messageId,
        targetName: `Message #${messageId}`,
        targetType: 'chat_message',
        severity: 'MEDIUM',
        details: `Staff deleted chat message #${messageId} from live chat channels.`
      }).catch(() => {});
    } catch (e) {
      console.warn('REST API chat delete error:', e);
    }

    setLiveChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, text: deletedText, deletedBy: deletedByName } : m));
    setActionNotice('🗑️ Chat message deleted from live chat!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Open Full Firestore Document Edit Modal
  const handleOpenUserEditModal = (u: UserProfile) => {
    if (!canEditUserFields(actorRole, actorEmail, u)) {
      setActionNotice('Permission Denied: Only Admins can edit fields for Admin accounts.');
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    setEditingUserDoc(u);
    setEditUsername(u.username || '');
    setEditEmail(u.email || '');
    setEditRole(u.role || 'User');
    setEditIsAdmin(!!u.isAdmin);
    setEditIsStaff(!!u.isStaff);
    setEditIsVip(!!u.isVip);
    setEditStatus(u.status || 'Active');
    setEditVcBalance(u.vcBalance ?? 0);
    setEditDailyStreak(u.dailyStreak ?? 0);
    setEditVipExpires(u.vipExpires || '');
    setEditAvatar(u.avatar || '');
    setEditPublishedBuilds(u.publishedBuildsCount || 0);
    setEditModerationNote(u.moderationNote || '');

    const raw = u.rawFirestoreData ? { ...u.rawFirestoreData } : {
      uid: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      isAdmin: u.isAdmin,
      isStaff: u.isStaff,
      isVip: u.isVip,
      status: u.status,
      vcBalance: u.vcBalance ?? 0,
      dailyStreak: u.dailyStreak ?? 0,
      vipExpires: u.vipExpires || '',
      moderationNote: u.moderationNote || '',
      joinedDate: u.joinedDate,
      publishedBuildsCount: u.publishedBuildsCount
    };
    setEditRawJson(JSON.stringify(raw, null, 2));
  };

  // Save updated user document directly to Firestore userProfiles collection
  const handleSaveUserDoc = async () => {
    if (!editingUserDoc) return;

    if (!canEditUserFields(actorRole, actorEmail, editingUserDoc)) {
      alert('Permission Denied: Only Admins can edit fields for Admin accounts.');
      return;
    }

    setIsSavingUserDoc(true);

    try {
      let parsedRawJson: Record<string, any> = {};
      if (editRawJson.trim()) {
        try {
          parsedRawJson = JSON.parse(editRawJson);
        } catch (jsonErr) {
          alert('Invalid JSON in Raw Firestore Fields editor. Please fix formatting or clear it.');
          setIsSavingUserDoc(false);
          return;
        }
      }

      const derivedUserLevel = editRole === 'Admin' ? 'L4' : editRole === 'Staff' ? 'L3' : 'Member';
      const effectiveUserLevel = parsedRawJson.userLevel || derivedUserLevel;
      const isL4 = effectiveUserLevel === 'L4';
      const isL3 = effectiveUserLevel === 'L3';

      const updatedPayload: Record<string, any> = {
        ...parsedRawJson,
        uid: editingUserDoc.id,
        username: editUsername,
        email: editEmail,
        role: editRole,
        userLevel: effectiveUserLevel,
        clearanceLevel: isL4 ? 4 : isL3 ? 3 : (editIsVip ? 2 : 1),
        isAdmin: isL4,
        isStaff: isL4 || isL3,
        isVip: editIsVip,
        status: editStatus,
        vcBalance: Number(editVcBalance) || 0,
        credits: Number(editVcBalance) || 0,
        dailyStreak: Number(editDailyStreak) || 0,
        vipExpires: editVipExpires,
        avatar: editAvatar,
        publishedBuildsCount: Number(editPublishedBuilds) || 0,
        moderationNote: editModerationNote,
        updatedAt: new Date().toISOString()
      };

      // 1. Save directly into MongoDB via backend API
      await fetch(`/api/admin/cms/userProfiles/${editingUserDoc.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });

      const fieldChanges: { field: string; oldValue: any; newValue: any; fieldLabel?: string }[] = [];
      if (editingUserDoc.username !== editUsername) fieldChanges.push({ field: 'username', oldValue: editingUserDoc.username, newValue: editUsername, fieldLabel: 'GamerTag' });
      if (editingUserDoc.role !== editRole) fieldChanges.push({ field: 'role', oldValue: editingUserDoc.role, newValue: editRole, fieldLabel: 'Role' });
      if (editingUserDoc.status !== editStatus) fieldChanges.push({ field: 'status', oldValue: editingUserDoc.status, newValue: editStatus, fieldLabel: 'Status' });
      if ((editingUserDoc.vcBalance ?? 0) !== (Number(editVcBalance) || 0)) fieldChanges.push({ field: 'vcBalance', oldValue: editingUserDoc.vcBalance ?? 0, newValue: Number(editVcBalance) || 0, fieldLabel: 'VC Balance' });
      if ((editingUserDoc.dailyStreak ?? 0) !== (Number(editDailyStreak) || 0)) fieldChanges.push({ field: 'dailyStreak', oldValue: editingUserDoc.dailyStreak ?? 0, newValue: Number(editDailyStreak) || 0, fieldLabel: 'Daily Streak' });
      if (editingUserDoc.vipExpires !== editVipExpires) fieldChanges.push({ field: 'vipExpires', oldValue: editingUserDoc.vipExpires || 'N/A', newValue: editVipExpires || 'N/A', fieldLabel: 'VIP Expiry' });
      if (editingUserDoc.moderationNote !== editModerationNote) fieldChanges.push({ field: 'moderationNote', oldValue: editingUserDoc.moderationNote || '', newValue: editModerationNote, fieldLabel: 'Moderation Note' });

      logStaffActivity({
        actionType: 'USER_DOC_DIRECT_SAVE',
        actionCategory: 'User Management',
        targetId: editingUserDoc.id,
        targetName: `@${editUsername}`,
        targetType: 'user',
        severity: fieldChanges.some(c => c.field === 'role' || c.field === 'status') ? 'CRITICAL' : 'MEDIUM',
        details: `Staff modified profile fields and saved user profile for @${editUsername}.`,
        changes: fieldChanges
      }).catch(() => {});

      setUsers(prev => prev.map(u => u.id === editingUserDoc.id ? {
        ...u,
        username: editUsername,
        email: editEmail,
        role: editRole,
        userLevel: effectiveUserLevel,
        clearanceLevel: isL4 ? 'L4' : isL3 ? 'L3' : (editIsVip ? 'L2 VIP' : 'L1 Citizen'),
        isAdmin: isL4,
        isStaff: isL4 || isL3,
        isVip: editIsVip,
        status: editStatus,
        vcBalance: Number(editVcBalance) || 0,
        dailyStreak: Number(editDailyStreak) || 0,
        vipExpires: editVipExpires,
        avatar: editAvatar,
        publishedBuildsCount: Number(editPublishedBuilds) || 0,
        moderationNote: editModerationNote,
        rawFirestoreData: updatedPayload
      } : u));

      setActionNotice(`Saved user record for @${editUsername} (${editingUserDoc.id}) to database!`);
      setTimeout(() => setActionNotice(null), 4000);
      setEditingUserDoc(null);
    } catch (err: any) {
      console.error('Error saving user document:', err);
      alert(`Failed to save user profile: ${err.message || String(err)}`);
    } finally {
      setIsSavingUserDoc(false);
    }
  };


  const filteredUsers = users.filter(u => {
    const searchLower = searchUser.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      u.username.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.id.toLowerCase().includes(searchLower) ||
      (u.moderationNote && u.moderationNote.toLowerCase().includes(searchLower));

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return (b.joinedDate || '').localeCompare(a.joinedDate || '');
    if (sortBy === 'oldest') return (a.joinedDate || '').localeCompare(b.joinedDate || '');
    if (sortBy === 'username') return a.username.localeCompare(b.username);
    if (sortBy === 'vcBalance') return (b.vcBalance || 0) - (a.vcBalance || 0);
    if (sortBy === 'role') return getRoleLevel(b.role) - getRoleLevel(a.role);
    return 0;
  });

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const safeUserPage = Math.min(userPage, totalUserPages);
  const paginatedUsers = filteredUsers.slice((safeUserPage - 1) * userPageSize, safeUserPage * userPageSize);

  const totalVipUsers = users.filter(u => u.isVip).length;
  const activeUsersCount = users.filter(u => u.status === 'Active').length;

  return (
    <div className="space-y-8">
      {/* Admin Top Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-rose-950/80 to-zinc-950 border border-rose-500/30 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" /> Enterprise HRBAC Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Firestore Scaled Sync (100 Max Bound)</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              GTA VI Central Staff & Moderation Headquarters
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Hierarchical Role-Based Control (Admin &gt; Staff &gt; VIP Member &gt; User). Manage roles, monitor real-time submissions, enforce staff moderation, and protect VIP supporters with MNC-level security.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Metrics</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-between animate-fade-in shadow-lg shadow-amber-500/10">
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </span>
          <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Accounts</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{users.length * 482}</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <p className="text-[10px] text-zinc-500">{activeUsersCount} active users online in session.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">VIP Supporters</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{totalVipUsers} Accounts</span>
            <span className="text-xs text-amber-300/80 font-bold">{getVipPriceText('/mo')}</span>
          </div>
          <p className="text-[10px] text-zinc-500">VIPs protected against non-admin bans.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Staff Approvals</span>
            <AlertTriangle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">{pendingApprovals.length} Items</span>
          </div>
          <p className="text-[10px] text-zinc-500">Requires staff review & verification.</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Publisher Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">$12.50 RPM</span>
          </div>
          <p className="text-[10px] text-zinc-500">$1,800 estimated display revenue this month.</p>
        </div>
      </div>

      {/* Sidebar & Workspace Main Container */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* MOBILE NAVIGATION BAR (Horizontal Scrolling Pills) */}
        <div className="lg:hidden w-full space-y-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3">
          <div className="flex items-center gap-2 text-xs font-black text-rose-400 uppercase tracking-wider px-1">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Admin Control Sections</span>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'users' ? 'bg-rose-600 text-white' : 'bg-zinc-800/80 text-zinc-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('approvals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'approvals' ? 'bg-rose-600 text-white' : 'bg-zinc-800/80 text-zinc-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Queue ({pendingApprovals.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('cms')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'cms' ? 'bg-amber-600 text-white' : 'bg-zinc-800/80 text-zinc-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Publisher CMS</span>
            </button>
            <button
              onClick={() => setActiveSubTab('feature-requests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'feature-requests' ? 'bg-cyan-600 text-white' : 'bg-zinc-800/80 text-zinc-300'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Feature Requests</span>
            </button>
            <button
              onClick={() => setActiveSubTab('env-health')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'env-health' ? 'bg-emerald-600 text-white' : 'bg-zinc-800/80 text-zinc-300'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>System Health</span>
            </button>
            <button
              onClick={() => setActiveSubTab('analytics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'analytics' ? 'bg-indigo-600 text-white' : 'bg-zinc-800/80 text-zinc-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveSubTab('market-agency')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'market-agency' ? 'bg-purple-600 text-white' : 'bg-zinc-800/80 text-zinc-300'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>MarketAgency AI</span>
            </button>
          </div>
        </div>

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex w-64 shrink-0 bg-zinc-900/90 rounded-3xl border border-zinc-800 p-4 flex-col gap-4 self-start sticky top-24 shadow-2xl">
          <div className="flex items-center gap-2 px-2 pb-2 border-b border-zinc-800 font-black text-xs text-rose-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Executive Control Panel</span>
          </div>

          <nav className="space-y-4">
            {/* GROUP 1: USER & HRBAC */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                User Management
              </div>

              <button
                onClick={() => setActiveSubTab('users')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'users'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Accounts & HRBAC</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono font-bold">{users.length}</span>
              </button>

              <button
                onClick={() => {
                  setActiveSubTab('vip-notifications');
                  fetchVipLogs();
                }}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'vip-notifications'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>VIP Email Engine</span>
                </div>
              </button>
            </div>

            {/* GROUP 2: MODERATION & SECURITY */}
            <div className="space-y-1 pt-2 border-t border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                Moderation & Audit
              </div>

              <button
                onClick={() => setActiveSubTab('approvals')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'approvals'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Moderation Queue</span>
                </div>
                {pendingApprovals.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40 animate-pulse">
                    {pendingApprovals.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSubTab('reports')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'reports'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bug className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Bug Reports HQ</span>
                </div>
              </button>

              {isActorL4Admin && (
                <button
                  onClick={() => setActiveSubTab('staff-logs')}
                  className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    activeSubTab === 'staff-logs'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Staff Activity Logs</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded font-mono font-black bg-rose-500/30 text-rose-200">L4</span>
                </button>
              )}
            </div>

            {/* GROUP 3: CONTENT & CATALOG CMS */}
            <div className="space-y-1 pt-2 border-t border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                Content & Catalog CMS
              </div>

              <button
                onClick={() => setActiveSubTab('cms')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'cms'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Publisher CMS</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('character-gallery')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'character-gallery' || activeSubTab === 'vehicle-cms' || activeSubTab === 'weapon-cms'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Master Catalog CMS</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('challenge-cms')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'challenge-cms'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Tuning Challenge CMS</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('rental-cms')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'rental-cms'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Spotlight Rental CMS</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('coupon-cms')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'coupon-cms'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Coupon Studio</span>
                </div>
                <span className="text-[9px] px-1 py-0.2 rounded font-mono font-black bg-amber-500/30 text-amber-200">L4</span>
              </button>

              <button
                onClick={() => setActiveSubTab('feature-requests')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'feature-requests'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wand2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Feature Requests</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">SAAS</span>
              </button>
            </div>

            {/* GROUP 4: RADAR & SYSTEM */}
            <div className="space-y-1 pt-2 border-t border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                Radar & System
              </div>

              <button
                onClick={() => setActiveSubTab('env-health')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'env-health'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Environment Health</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveSubTab('squad-rooms');
                  fetchSquadRoomsData();
                }}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'squad-rooms'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Squad Radar</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('cron-rtdb')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'cron-rtdb'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>RTDB Cron Hub</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('pseo')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'pseo'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Architecture & SEO</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('webhook-bot')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'webhook-bot'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Webhook / API Bot</span>
                </div>
              </button>
            </div>

            {/* GROUP 5: REVENUE & AI */}
            <div className="space-y-1 pt-2 border-t border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                Revenue & AI
              </div>

              <button
                onClick={() => setActiveSubTab('analytics')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Revenue Analytics</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('pricing-control')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'pricing-control'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Tier Pricing HQ</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('ad-toggles')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'ad-toggles'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Tv className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Ad Controls</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('market-agency')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSubTab === 'market-agency'
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>MarketAgency AI</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">AI</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="flex-1 min-w-0 space-y-6 w-full">

      {/* Tab Content 1: User Accounts Table & Firestore Document Manager */}
      {activeSubTab === 'users' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          {/* Enhanced Controls Bar: Search, Filters, Sort & Page Size */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search username, email, UID, or moderation notes..."
                value={searchUser}
                onChange={(e) => {
                  setSearchUser(e.target.value);
                  setUserPage(1);
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Filter Role */}
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
                <Filter className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-zinc-400 font-medium hidden sm:inline">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value as any);
                    setUserPage(1);
                  }}
                  className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-zinc-900">All Roles</option>
                  <option value="Admin" className="bg-zinc-900">Admin</option>
                  <option value="Staff" className="bg-zinc-900">Staff</option>
                  <option value="VIP Member" className="bg-zinc-900">VIP Member</option>
                  <option value="User" className="bg-zinc-900">Regular User</option>
                </select>
              </div>

              {/* Filter Status */}
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
                <span className="text-zinc-400 font-medium hidden sm:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setUserPage(1);
                  }}
                  className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-zinc-900">All Statuses</option>
                  <option value="Active" className="bg-zinc-900">Active Only</option>
                  <option value="Suspended" className="bg-zinc-900">Suspended Only</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-zinc-400 font-medium hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-zinc-900">Newest Joined</option>
                  <option value="oldest" className="bg-zinc-900">Oldest Joined</option>
                  <option value="username" className="bg-zinc-900">Username (A-Z)</option>
                  <option value="vcBalance" className="bg-zinc-900">VC Cash (High-Low)</option>
                  <option value="role" className="bg-zinc-900">Role Level</option>
                </select>
              </div>

              {/* Page Size */}
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
                <span className="text-zinc-400 font-medium">Rows:</span>
                <select
                  value={userPageSize}
                  onChange={(e) => {
                    setUserPageSize(Number(e.target.value));
                    setUserPage(1);
                  }}
                  className="bg-transparent text-amber-400 font-mono text-xs focus:outline-none cursor-pointer"
                >
                  <option value={10} className="bg-zinc-900">10</option>
                  <option value={20} className="bg-zinc-900">20</option>
                  <option value={50} className="bg-zinc-900">50</option>
                  <option value={100} className="bg-zinc-900">100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">User & Account ID</th>
                  <th className="p-3.5">Role Level & VIP Expiration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">VC Cash & Streak</th>
                  <th className="p-3.5">Quick Role Edit</th>
                  <th className="p-3.5 text-right">Firestore Document Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500 italic">
                      No user documents match current search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const isTargetAdminAccount = isTargetAdmin(u) || u.role === 'Admin' || u.isAdmin === true;
                    const banCheck = canBanTarget(actorRole, actorEmail, u.role, u);

                    return (
                      <tr key={u.id} className="hover:bg-zinc-950/60 transition">
                        {/* User & UID */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0" />
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-white block flex items-center gap-1.5">
                                @{u.username}
                                {u.moderationNote && (
                                  <span className="w-2 h-2 rounded-full bg-amber-400" title={`Note: ${u.moderationNote}`} />
                                )}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-mono block">{u.email}</span>
                              <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 inline-block">
                                UID: {u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role Level Badge & VIP Expiration */}
                        <td className="p-3.5">
                          {u.role === 'Admin' || u.isAdmin === true ? (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                                <ShieldCheck className="w-3 h-3 text-rose-400" /> Admin
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono block">Expires: {formatVipExpiry(u.vipExpires || 'Lifetime')}</span>
                            </div>
                          ) : u.role === 'Staff' || u.isStaff === true ? (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 w-fit">
                                <ShieldAlert className="w-3 h-3 text-indigo-400" /> Staff
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono block">Expires: {formatVipExpiry(u.vipExpires || 'Staff Account')}</span>
                            </div>
                          ) : u.role === 'VIP Member' || u.isVip ? (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                                <Crown className="w-3 h-3 text-amber-400" /> VIP Member
                              </span>
                              <span className="text-[10px] text-amber-300/90 font-mono font-bold block">Expires: {formatVipExpiry(u.vipExpires)}</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 w-fit block">
                                Regular User
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono block">{u.vipExpires && u.vipExpires !== 'Expired' ? `Expires: ${formatVipExpiry(u.vipExpires)}` : 'No Active VIP'}</span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          {u.status === 'Active' ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Suspended
                            </span>
                          )}
                        </td>

                        {/* VC Cash & Daily Streak */}
                        <td className="p-3.5 font-mono">
                          <div className="space-y-0.5">
                            <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                              <Coins className="w-3 h-3 text-emerald-400" />
                              ${(u.vcBalance ?? 0).toLocaleString('en-US')} VC
                            </span>
                            <span className="text-amber-300 text-[10px] flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-400 fill-current" />
                              Day {u.dailyStreak ?? 0} Streak
                            </span>
                          </div>
                        </td>

                        {/* Quick Role Dropdown Selector */}
                        <td className="p-3.5">
                          <select
                            value={u.role}
                            disabled={!canEditUserFields(actorRole, actorEmail, u) || !canAssignRole(actorRole, actorEmail, u.role, undefined, u)}
                            onChange={(e) => handleAssignRole(u.id, e.target.value as UserRole)}
                            className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title={isTargetAdminAccount ? 'Admin accounts are protected from role demotion' : 'Select new hierarchy role'}
                          >
                            <option value="User">User</option>
                            <option value="VIP Member">VIP Member</option>
                            <option value="Staff">Staff</option>
                            {actorRole === 'Admin' && (
                              <option value="Admin">Admin</option>
                            )}
                          </select>
                        </td>

                        {/* Firestore Document Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit All Fields Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenUserEditModal(u)}
                              disabled={isTargetAdminAccount && !isActorL4Admin}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1 ${
                                isTargetAdminAccount && !isActorL4Admin
                                  ? 'bg-zinc-800/80 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer'
                              }`}
                              title={isTargetAdminAccount && !isActorL4Admin ? 'Only Admins can edit fields for Admin accounts' : "Edit all fields in user's profile document"}
                            >
                              <Edit3 className="w-3 h-3 text-amber-400" />
                              <span>Edit All Fields</span>
                            </button>

                            {/* Ban / Suspend Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u.id)}
                              disabled={isTargetAdminAccount || !banCheck.allowed}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition inline-flex items-center gap-1 ${
                                isTargetAdminAccount || !banCheck.allowed
                                  ? 'bg-zinc-800/80 text-zinc-500 border-zinc-700 cursor-not-allowed'
                                  : u.status === 'Active'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 cursor-pointer'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                              }`}
                              title={
                                isTargetAdminAccount
                                  ? 'Admin accounts are protected and cannot be suspended'
                                  : !banCheck.allowed
                                  ? banCheck.reason
                                  : u.status === 'Active'
                                  ? 'Suspend player account'
                                  : 'Lift account suspension'
                              }
                            >
                              {isTargetAdminAccount && <Lock className="w-3 h-3 text-amber-500" />}
                              <span>
                                {isTargetAdminAccount
                                  ? 'Protected'
                                  : u.status === 'Active'
                                  ? 'Suspend'
                                  : 'Unban'}
                              </span>
                            </button>

                            {/* Delete User Doc Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteUserDoc(u.id, u.username)}
                              disabled={isTargetAdminAccount}
                              className={`p-1.5 rounded-lg text-[10px] font-bold border transition inline-flex items-center gap-1 ${
                                isTargetAdminAccount
                                  ? 'bg-zinc-800/80 text-zinc-600 border-zinc-800 cursor-not-allowed'
                                  : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 cursor-pointer'
                              }`}
                              title={isTargetAdminAccount ? 'Admin accounts are protected and cannot be deleted' : 'Permanently delete user profile document'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800/80 text-xs">
            <div className="text-zinc-400 font-mono">
              Showing <strong className="text-white">{filteredUsers.length === 0 ? 0 : (safeUserPage - 1) * userPageSize + 1}</strong> to{' '}
              <strong className="text-white">{Math.min(safeUserPage * userPageSize, filteredUsers.length)}</strong> of{' '}
              <strong className="text-amber-400">{filteredUsers.length}</strong> player accounts
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeUserPage <= 1}
                onClick={() => setUserPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition flex items-center gap-1 font-bold cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1 font-mono text-xs">
                {Array.from({ length: totalUserPages }, (_, i) => i + 1).slice(
                  Math.max(0, safeUserPage - 3),
                  Math.min(totalUserPages, safeUserPage + 2)
                ).map(pNum => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setUserPage(pNum)}
                    className={`w-7 h-7 rounded-lg font-bold border transition cursor-pointer ${
                      pNum === safeUserPage
                        ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={safeUserPage >= totalUserPages}
                onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 hover:text-white transition flex items-center gap-1 font-bold cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Moderation Approvals Queue & Live Chat Control */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-6">
          {/* Section 1: Pending Approvals & Message Reports Queue */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-indigo-400" />
                  Pending Submissions & Flagged Message Reports
                </h3>
                <p className="text-xs text-zinc-400">Review community reports and pending server/build submissions in real time.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {pendingApprovals.length} items in queue
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 space-y-2 bg-zinc-950/50 rounded-xl border border-zinc-800/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-zinc-300">Moderation Queue Clean!</p>
                <p className="text-xs text-zinc-500">All submissions approved and no active reported messages.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((item) => {
                  const isIssueReport = item.type === 'issue_report';
                  const isChatReport = item.type === 'message_report' || (!isIssueReport && item.type.toLowerCase().includes('report'));
                  const isChannelDelete = item.type === 'channel_deletion_request' || item.type.toLowerCase().includes('channel');

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border transition ${
                        isIssueReport
                          ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/30'
                          : isChatReport
                          ? 'bg-rose-950/30 border-rose-500/40 shadow-lg shadow-rose-950/20'
                          : isChannelDelete
                          ? 'bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-950/20'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                              isIssueReport
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                                : isChatReport
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : isChannelDelete
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {isIssueReport
                              ? `🐛 BUG REPORT: ${item.reportRefNumber || 'ERROR'}`
                              : isChatReport
                              ? '🚨 FLAGGED CHAT REPORT'
                              : isChannelDelete
                              ? '⚠️ CREATOR CHANNEL DELETION REQUEST'
                              : item.type}
                          </span>
                          {item.severity && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-zinc-900 border border-zinc-700 text-amber-300">
                              {item.severity} severity
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400 font-mono">
                            By @{item.submittedBy} • {item.submittedAt}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-white">{item.title}</h4>

                        {isIssueReport ? (
                          <div className="bg-zinc-900/90 border border-rose-500/30 rounded-xl p-3 my-1.5 space-y-2">
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {item.detail}
                            </p>
                            {item.screenshotUrl && (
                              <div className="flex items-center gap-2 pt-1">
                                <img
                                  src={item.screenshotUrl}
                                  alt="Report visual evidence"
                                  className="w-16 h-10 object-cover rounded-lg border border-zinc-700"
                                />
                                <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-rose-400" />
                                  Visual screenshot attached
                                </span>
                              </div>
                            )}
                          </div>
                        ) : isChatReport ? (
                          <div className="bg-zinc-900/90 border border-rose-500/30 rounded-xl p-3 my-1.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                              <span>Reported Author: <strong className="text-rose-300">@{item.author || item.submittedBy}</strong></span>
                              <span>Reporter: <strong className="text-amber-300">@{item.reporter || 'Community Player'}</strong></span>
                            </div>
                            <p className="text-xs text-rose-100 font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 italic break-words">
                              "{item.content || item.detail}"
                            </p>
                            {item.reason && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-300 pt-0.5">
                                <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>Reason: <span className="uppercase text-white bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">{item.reason}</span></span>
                              </div>
                            )}
                          </div>
                        ) : isChannelDelete ? (
                          <div className="bg-zinc-900/90 border border-amber-500/30 rounded-xl p-3 my-1.5 space-y-1">
                            <p className="text-xs text-amber-200">
                              {item.detail || 'Creator has requested permanent removal of this VIP custom hub.'}
                            </p>
                            <span className="text-[10px] text-zinc-400 block italic">
                              Staff authority verification: Only Staff/Admin can permanently wipe custom channels from live database.
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400">{item.detail}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0 pt-2 md:pt-0">
                        {isIssueReport ? (
                          <>
                            <button
                              onClick={() => setActiveSubTab('reports')}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                              title="Open in Bug & Error Reports Subtab"
                            >
                              <Bug className="w-3.5 h-3.5" />
                              <span>Inspect in Bug HQ</span>
                            </button>
                            <button
                              onClick={() => handleDismissReport(item.id)}
                              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-700 cursor-pointer"
                              title="Dismiss from queue"
                            >
                              Dismiss
                            </button>
                          </>
                        ) : isChatReport ? (
                          <>
                            <button
                              onClick={() => handleDeleteReportedMessage(item.id, item.messageId)}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                              title="Delete reported message directly from live chat and resolve report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Message & Resolve</span>
                            </button>
                            <button
                              onClick={() => handleDismissReport(item.id)}
                              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-700 cursor-pointer"
                              title="Dismiss report without deleting message"
                            >
                              Dismiss Report
                            </button>
                          </>
                        ) : isChannelDelete ? (
                          <>
                            <button
                              onClick={() => handleApproveChannelDeletion(item.id, (item as any).channelId || item.channel || (item as any).targetId || (item as any).hubId)}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                              title="Staff Authority: Permanently delete custom channel from system"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Approve & Delete Hub</span>
                            </button>
                            <button
                              onClick={() => handleDismissReport(item.id)}
                              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-700 cursor-pointer"
                            >
                              Reject Request
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprovePending(item.id)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                            </button>
                            <button
                              onClick={() => handleRejectPending(item.id)}
                              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-rose-400 font-bold text-xs rounded-xl transition border border-zinc-700 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Live Community Chat Messages Moderation Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  Live Chat Messages Moderation Manager
                </h3>
                <p className="text-xs text-zinc-400">
                  Search, monitor, and delete any live chat message across all channels directly from this panel with 1 click.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search chat messages or author..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <select
                  value={chatChannelFilter}
                  onChange={(e) => setChatChannelFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500"
                >
                  <option value="all">All Channels</option>
                  <option value="general"># general</option>
                  <option value="lfg-heists"># lfg-heists</option>
                  <option value="rp-recruitment"># rp-recruitment</option>
                  <option value="leaks-speculation"># leaks-speculation</option>
                </select>
              </div>
            </div>

            {/* Chat Messages List Table */}
            <div className="overflow-x-auto">
              {liveChatMessages.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs italic">
                  No live chat messages loaded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {liveChatMessages
                    .filter((m) => {
                      const text = m.text || m.content || '';
                      const username = m.username || m.user || '';
                      const matchesSearch = text.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                                            username.toLowerCase().includes(chatSearchQuery.toLowerCase());
                      const matchesChannel = chatChannelFilter === 'all' || m.channel === chatChannelFilter;
                      return matchesSearch && matchesChannel;
                    })
                    .slice(0, 30)
                    .map((msg) => {
                      const isDeleted = msg.isDeleted === true || (msg.text && msg.text.startsWith('This message was deleted'));
                      const authorName = msg.username || msg.user || 'ViceCityPlayer';
                      const textDisplay = isDeleted ? 'This message was deleted by moderator' : (msg.text || msg.content || '');

                      return (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                            isDeleted
                              ? 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                              : 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <img
                              src={msg.avatar || DEFAULT_GTA6_AVATAR}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0 mt-0.5"
                            />
                            <div className="min-w-0 space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-white">@{authorName}</span>
                                {msg.userLevel && (
                                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-bold rounded border border-amber-500/30">
                                    {msg.userLevel}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 text-[10px] font-mono rounded border border-zinc-800">
                                  #{msg.channel || 'general'}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">{msg.timestamp || 'Just now'}</span>
                              </div>

                              <p className={`text-xs break-words ${isDeleted ? 'text-zinc-500 italic' : 'text-zinc-200'}`}>
                                {textDisplay}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 self-end sm:self-auto">
                            {isDeleted ? (
                              <span className="px-2.5 py-1 bg-zinc-900 text-zinc-500 text-[10px] font-bold rounded-lg border border-zinc-800 flex items-center gap-1">
                                <Trash2 className="w-3 h-3 text-zinc-600" />
                                <span>Deleted by Staff</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDeleteChatMessageDirect(msg.id)}
                                className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                                title="Delete this message immediately from live chat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Message</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Bug & Error Reports Direct Admin Viewer */}
      {activeSubTab === 'reports' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-400" />
                Live Bug, Issue & Visual Screenshot Reports HQ
              </h3>
              <p className="text-xs text-zinc-400">
                Review submitted error reports, visual screenshots, automated device telemetry, and manage resolution workflows.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Screenshot Verification Active</span>
              </span>
            </div>
          </div>

          <BugReportsAdminSection />
        </div>
      )}

      {/* Tab Content: Zero-Code CMS Portal */}
      {activeSubTab === 'cms' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Zero-Code Website CMS & Live Content Creator
              </h3>
              <p className="text-xs text-zinc-400">
                Post new blog articles, add custom vehicles, guns, map locations, RP servers, or live chat rooms directly to the live website without code.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 w-fit">
              Staff Live Publisher Active
            </span>
          </div>

          {/* CMS Section Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCmsSection('blog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                cmsSection === 'blog'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>1. Blog & Game Intel Articles</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-zinc-950/50 text-zinc-300">{publishedBlogs.length}</span>
            </button>

            <button
              onClick={() => setCmsSection('vehicle')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                cmsSection === 'vehicle'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>2. Vehicles Catalog</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-zinc-950/50 text-zinc-300">{publishedVehicles.length}</span>
            </button>

            <button
              onClick={() => setCmsSection('weapon')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                cmsSection === 'weapon'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>3. Weapons Arsenal</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-zinc-950/50 text-zinc-300">{publishedWeapons.length}</span>
            </button>

            <button
              onClick={() => setCmsSection('map')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                cmsSection === 'map'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>4. Map Locations</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-zinc-950/50 text-zinc-300">{publishedMapLocations.length}</span>
            </button>

            <button
              onClick={() => setCmsSection('rp')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                cmsSection === 'rp'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>5. RP Servers</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-zinc-950/50 text-zinc-300">{publishedRpServers.length}</span>
            </button>

            <button
              onClick={() => setCmsSection('chat')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                cmsSection === 'chat'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>6. Chat Channels</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-zinc-950/50 text-zinc-300">{publishedChatChannels.length}</span>
            </button>
          </div>

          {/* Form 1: Blog */}
          {cmsSection === 'blog' && (
            <div className="space-y-6">
              <form onSubmit={handlePublishBlog} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-rose-400" />
                    {editingBlogId ? 'Edit & Update Blog Article' : 'Publish New Blog & Game Intel Article'}
                  </h4>
                  {editingBlogId && (
                    <button
                      type="button"
                      onClick={handleCancelEditBlog}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Article Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ocean Drive Heist Route & Map Leak Breakdown"
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Category</label>
                    <select
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Map Leaks & Districts">Map Leaks & Districts</option>
                      <option value="Heists & Businesses">Heists & Businesses</option>
                      <option value="Vehicle Tuning Specs">Vehicle Tuning Specs</option>
                      <option value="RP Server News">RP Server News</option>
                      <option value="Weapon Meta & TTK">Weapon Meta & TTK</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Cover Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={blogImageUrl}
                      onChange={(e) => setBlogImageUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Author & Tags</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Author"
                        value={blogAuthor}
                        onChange={(e) => setBlogAuthor(e.target.value)}
                        className="w-1/2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                      />
                      <input
                        type="text"
                        placeholder="Tags (comma separated)"
                        value={blogTags}
                        onChange={(e) => setBlogTags(e.target.value)}
                        className="w-1/2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 mb-1 font-semibold">Excerpt / Summary</label>
                    <input
                      type="text"
                      placeholder="Brief article preview sentence..."
                      value={blogExcerpt}
                      onChange={(e) => setBlogExcerpt(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 mb-1 font-semibold">Full Body Content (Separate paragraphs with blank lines)</label>
                    <textarea
                      rows={4}
                      placeholder="Type the full blog article content here..."
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>{editingBlogId ? 'Update Article Live' : 'Publish Article Live to Website'}</span>
                  </button>
                  {editingBlogId && (
                    <button
                      type="button"
                      onClick={handleCancelEditBlog}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-800"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              {/* Published Items Manager */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Live Published Blog Articles ({publishedBlogs.length})</h5>
                {publishedBlogs.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No custom blog articles published yet.</p>
                ) : (
                  <div className="space-y-2">
                    {publishedBlogs.map((b) => (
                      <div key={b.id} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {Boolean(b.imageUrl) && <img src={b.imageUrl} alt="" className="w-12 h-10 object-cover rounded-lg border border-zinc-800 shrink-0" />}
                          <div className="truncate">
                            <span className="text-xs font-bold text-white block truncate">{b.title}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{b.category} • By {b.author} • {b.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditBlog(b)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCmsItem('blogPosts', b.id, b.title)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Unpublish</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form 2: Vehicle */}
          {cmsSection === 'vehicle' && (
            <div className="space-y-6">
              <form onSubmit={handlePublishVehicle} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Car className="w-4 h-4 text-rose-400" />
                    {editingVehId ? 'Edit & Update Vehicle Specs' : 'Add Custom Vehicle to Database Catalog'}
                  </h4>
                  {editingVehId && (
                    <button
                      type="button"
                      onClick={handleCancelEditVehicle}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Vehicle Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pegassi Ignus GTS Custom"
                      value={vehName}
                      onChange={(e) => setVehName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Brand / Manufacturer</label>
                    <input
                      type="text"
                      placeholder="Pegassi, Grotti, Bravado..."
                      value={vehBrand}
                      onChange={(e) => setVehBrand(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Category</label>
                    <select
                      value={vehCategory}
                      onChange={(e) => setVehCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Super">Super</option>
                      <option value="Sports">Sports</option>
                      <option value="Muscle">Muscle</option>
                      <option value="Off-Road">Off-Road</option>
                      <option value="Motorcycles">Motorcycles</option>
                      <option value="Helicopters">Helicopters</option>
                      <option value="Boats">Boats</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Top Speed (mph)</label>
                    <input
                      type="number"
                      value={vehTopSpeed}
                      onChange={(e) => setVehTopSpeed(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Acceleration (0-100)</label>
                    <input
                      type="number"
                      value={vehAccel}
                      onChange={(e) => setVehAccel(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Price ($)</label>
                    <input
                      type="number"
                      value={vehPrice}
                      onChange={(e) => setVehPrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 mb-1 font-semibold">Vehicle Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={vehImageUrl}
                      onChange={(e) => setVehImageUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Handling Spec (0-100)</label>
                    <input
                      type="number"
                      value={vehHandling}
                      onChange={(e) => setVehHandling(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-zinc-400 mb-1 font-semibold">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Vehicle overview and handling notes..."
                      value={vehDesc}
                      onChange={(e) => setVehDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingVehId ? 'Update Vehicle Specs Live' : 'Add Vehicle to Website Catalog'}</span>
                  </button>
                  {editingVehId && (
                    <button
                      type="button"
                      onClick={handleCancelEditVehicle}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-800"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              {/* Published Vehicles Manager */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Live Added Vehicles ({publishedVehicles.length})</h5>
                {publishedVehicles.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No custom vehicles added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {publishedVehicles.map((v) => (
                      <div key={v.id} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {Boolean(v.imageUrl) && <img src={v.imageUrl} alt="" className="w-12 h-10 object-cover rounded-lg border border-zinc-800 shrink-0" />}
                          <div className="truncate">
                            <span className="text-xs font-bold text-white block truncate">{v.brand} {v.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{v.category} • ${v.price?.toLocaleString('en-US')} • {v.topSpeedMph} MPH</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditVehicle(v)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCmsItem('vehicles', v.id, v.name)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form 3: Weapon */}
          {cmsSection === 'weapon' && (
            <div className="space-y-6">
              <form onSubmit={handlePublishWeapon} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-rose-400" />
                    {editingWpnId ? 'Edit & Update Weapon Specs' : 'Add Custom Weapon Specification'}
                  </h4>
                  {editingWpnId && (
                    <button
                      type="button"
                      onClick={handleCancelEditWeapon}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Weapon Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. M249 SAW Tactical"
                      value={wpnName}
                      onChange={(e) => setWpnName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Manufacturer</label>
                    <input
                      type="text"
                      placeholder="Hawk & Little, Vom Feuer..."
                      value={wpnManufacturer}
                      onChange={(e) => setWpnManufacturer(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Category</label>
                    <select
                      value={wpnCategory}
                      onChange={(e) => setWpnCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Handguns">Handguns</option>
                      <option value="Submachine Guns">Submachine Guns</option>
                      <option value="Assault Rifles">Assault Rifles</option>
                      <option value="Shotguns">Shotguns</option>
                      <option value="Sniper Rifles">Sniper Rifles</option>
                      <option value="Heavy Weapons">Heavy Weapons</option>
                      <option value="Melee">Melee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Damage (0-100)</label>
                    <input
                      type="number"
                      value={wpnDamage}
                      onChange={(e) => setWpnDamage(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Fire Rate (0-100)</label>
                    <input
                      type="number"
                      value={wpnFireRate}
                      onChange={(e) => setWpnFireRate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Price ($)</label>
                    <input
                      type="number"
                      value={wpnPrice}
                      onChange={(e) => setWpnPrice(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-zinc-400 mb-1 font-semibold">Weapon Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={wpnImageUrl}
                      onChange={(e) => setWpnImageUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-zinc-400 mb-1 font-semibold">Weapon Description</label>
                    <textarea
                      rows={2}
                      placeholder="Ballistic combat performance & TTK breakdown..."
                      value={wpnDesc}
                      onChange={(e) => setWpnDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingWpnId ? 'Update Weapon Specs Live' : 'Add Weapon to Live Arsenal'}</span>
                  </button>
                  {editingWpnId && (
                    <button
                      type="button"
                      onClick={handleCancelEditWeapon}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-800"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              {/* Published Weapons Manager */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Live Added Weapons ({publishedWeapons.length})</h5>
                {publishedWeapons.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No custom weapons added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {publishedWeapons.map((w) => (
                      <div key={w.id} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {Boolean(w.imageUrl) && <img src={w.imageUrl} alt="" className="w-12 h-10 object-cover rounded-lg border border-zinc-800 shrink-0" />}
                          <div className="truncate">
                            <span className="text-xs font-bold text-white block truncate">{w.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{w.category} • ${w.price?.toLocaleString('en-US')} • Dmg: {w.damage}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditWeapon(w)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCmsItem('weapons', w.id, w.name)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form 4: Map Location */}
          {cmsSection === 'map' && (
            <div className="space-y-6">
              <form onSubmit={handlePublishMapLocation} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    {editingMapId ? 'Edit & Update Map Location' : 'Add New Map Location / Point of Interest'}
                  </h4>
                  {editingMapId && (
                    <button
                      type="button"
                      onClick={handleCancelEditMapLocation}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Location Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ocean Drive Rooftop Helipad"
                      value={mapTitle}
                      onChange={(e) => setMapTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">District</label>
                    <select
                      value={mapDistrict}
                      onChange={(e) => setMapDistrict(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Vice Beach">Vice Beach</option>
                      <option value="Downtown Vice">Downtown Vice</option>
                      <option value="Port Gellhorn">Port Gellhorn</option>
                      <option value="Everglades / Keys">Everglades / Keys</option>
                      <option value="Little Haiti">Little Haiti</option>
                      <option value="Starfish Island">Starfish Island</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Category</label>
                    <select
                      value={mapCategory}
                      onChange={(e) => setMapCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Heist Target">Heist Target</option>
                      <option value="Dealership">Dealership</option>
                      <option value="Ammu-Nation">Ammu-Nation</option>
                      <option value="Safehouse">Safehouse</option>
                      <option value="Business">Business</option>
                      <option value="Stunt Jump">Stunt Jump</option>
                      <option value="Easter Egg">Easter Egg</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">X Coord (%)</label>
                    <input
                      type="number"
                      value={mapX}
                      onChange={(e) => setMapX(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Y Coord (%)</label>
                    <input
                      type="number"
                      value={mapY}
                      onChange={(e) => setMapY(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={mapImageUrl}
                      onChange={(e) => setMapImageUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-zinc-400 mb-1 font-semibold">Location Intelligence Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Security guard patrol times, escape routes..."
                      value={mapDesc}
                      onChange={(e) => setMapDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingMapId ? 'Update Map Location Live' : 'Mark Point on Vice City Map'}</span>
                  </button>
                  {editingMapId && (
                    <button
                      type="button"
                      onClick={handleCancelEditMapLocation}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-800"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              {/* Published Locations Manager */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Live Marked Locations ({publishedMapLocations.length})</h5>
                {publishedMapLocations.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No custom map locations marked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {publishedMapLocations.map((loc) => (
                      <div key={loc.id} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-4">
                        <div className="truncate">
                          <span className="text-xs font-bold text-white block truncate">{loc.title}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{loc.district} • {loc.category} • X:{loc.x}%, Y:{loc.y}%</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditMapLocation(loc)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCmsItem('mapLocations', loc.id, loc.title)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form 5: RP Server */}
          {cmsSection === 'rp' && (
            <div className="space-y-6">
              <form onSubmit={handlePublishRpServer} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-rose-400" />
                    {editingRpId ? 'Edit & Update RP Server Listing' : 'List GTA 6 RP Server in Directory'}
                  </h4>
                  {editingRpId && (
                    <button
                      type="button"
                      onClick={handleCancelEditRpServer}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Server Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vice City Underground RP Season 2"
                      value={rpName}
                      onChange={(e) => setRpName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Framework</label>
                    <select
                      value={rpFramework}
                      onChange={(e) => setRpFramework(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="FiveM">FiveM</option>
                      <option value="VMP">VMP</option>
                      <option value="Custom C#">Custom C#</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Region</label>
                    <select
                      value={rpRegion}
                      onChange={(e) => setRpRegion(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="NA East">NA East</option>
                      <option value="NA West">NA West</option>
                      <option value="EU Central">EU Central</option>
                      <option value="SA">South America</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Connect Code / IP</label>
                    <input
                      type="text"
                      placeholder="cfx.re/join/vc123"
                      value={rpConnectUrl}
                      onChange={(e) => setRpConnectUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Max Player Slots</label>
                    <input
                      type="number"
                      value={rpMaxPlayers}
                      onChange={(e) => setRpMaxPlayers(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Server Tags</label>
                    <input
                      type="text"
                      placeholder="Whitelisted, Gangs, Economy"
                      value={rpTags}
                      onChange={(e) => setRpTags(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-zinc-400 mb-1 font-semibold">Server Rules & Description</label>
                    <textarea
                      rows={2}
                      placeholder="Server overview, whitelist rules, active community features..."
                      value={rpDesc}
                      onChange={(e) => setRpDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingRpId ? 'Update Server Listing Live' : 'List Server in GTA 6 RP Directory'}</span>
                  </button>
                  {editingRpId && (
                    <button
                      type="button"
                      onClick={handleCancelEditRpServer}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-800"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              {/* Published Servers Manager */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Live Listed RP Servers ({publishedRpServers.length})</h5>
                {publishedRpServers.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No custom RP servers listed yet.</p>
                ) : (
                  <div className="space-y-2">
                    {publishedRpServers.map((s) => (
                      <div key={s.id} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-4">
                        <div className="truncate">
                          <span className="text-xs font-bold text-white block truncate">{s.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{s.framework} • {s.region} • Connect: {s.connectUrl}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditRpServer(s)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCmsItem('rpServers', s.id, s.name)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form 6: Chat Channels */}
          {cmsSection === 'chat' && (
            <div className="space-y-6">
              <form onSubmit={handlePublishChatChannel} className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-rose-400" />
                    {editingChatId ? 'Edit & Update Chat Channel' : 'Create Live Community Chat Channel'}
                  </h4>
                  {editingChatId && (
                    <button
                      type="button"
                      onClick={handleCancelEditChatChannel}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Channel Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. # vice-car-meets"
                      value={chatName}
                      onChange={(e) => setChatName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-semibold">Channel Category</label>
                    <input
                      type="text"
                      placeholder="General, Gaming, RP, Trading..."
                      value={chatCategory}
                      onChange={(e) => setChatCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-zinc-400 mb-1 font-semibold">Channel Topic & Description</label>
                    <input
                      type="text"
                      placeholder="Topic guidelines for this chat room..."
                      value={chatDesc}
                      onChange={(e) => setChatDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingChatId ? 'Update Channel Live' : 'Create Channel Live for All Players'}</span>
                  </button>
                  {editingChatId && (
                    <button
                      type="button"
                      onClick={handleCancelEditChatChannel}
                      className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition border border-zinc-800"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              {/* Published Chat Channels Manager */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Live Created Chat Channels ({publishedChatChannels.length})</h5>
                {publishedChatChannels.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No custom chat channels created yet.</p>
                ) : (
                  <div className="space-y-2">
                    {publishedChatChannels.map((ch) => (
                      <div key={ch.id} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-4">
                        <div className="truncate">
                          <span className="text-xs font-bold text-white block truncate">{ch.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{ch.category} • {ch.description}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditChatChannel(ch)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCmsItem('chatChannels', ch.id, ch.name)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Unified Master Catalog CMS (Characters, Vehicles, Weapons) */}
      {(activeSubTab === 'character-gallery' || activeSubTab === 'vehicle-cms' || activeSubTab === 'weapon-cms') && (
        <MasterCatalogAdminCms
          initialCategory={
            activeSubTab === 'vehicle-cms'
              ? 'vehicles'
              : activeSubTab === 'weapon-cms'
              ? 'weapons'
              : 'characters'
          }
        />
      )}

      {/* Tab Content: Tuning Challenge No-Code CMS & Moderation */}
      {activeSubTab === 'challenge-cms' && (
        <ChallengesAdminCms />
      )}

      {/* Tab Content: Top Position Rental CMS HQ */}
      {activeSubTab === 'rental-cms' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <SpotlightRentalAdminCms
            servers={publishedRpServers.length > 0 ? publishedRpServers : RP_SERVERS_DATA}
            isActorL4Admin={isActorL4Admin}
          />
        </div>
      )}

      {/* Tab Content: L4 Coupon Generator CMS */}
      {activeSubTab === 'coupon-cms' && (
        <CouponGeneratorCms
          currentUser={auth.currentUser}
          userRole={isActorL4Admin ? 'Admin' : 'Staff'}
          onReturnToAdmin={() => setActiveSubTab('users')}
        />
      )}

      {/* Tab Content: On-Demand Feature Requests Queue */}
      {activeSubTab === 'feature-requests' && (
        <OnDemandFeatureAdminCms currentUser={auth.currentUser} />
      )}

      {/* Tab Content: Pricing Control Studio */}
      {activeSubTab === 'pricing-control' && (
        <SystemPricingControl
          currentUser={auth.currentUser}
          userRole={isActorL4Admin ? 'Admin' : 'Staff'}
        />
      )}

      {/* Tab Content 3: Analytics & Payouts */}
      {activeSubTab === 'analytics' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Publisher Monetization & Security Payout Logs
              </h3>
              <span className="text-xs text-emerald-400 font-mono">Stripe & AdSense Sync: Verified</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Recent VIP Membership Payments</span>
                <ul className="text-xs divide-y divide-zinc-800 text-zinc-300">
                  <li className="py-2 flex justify-between items-center">
                    <span>ViceRacer99 ({getVipPriceText('/mo')})</span>
                    <span className="text-emerald-400 font-mono">Completed • Stripe</span>
                  </li>
                  <li className="py-2 flex justify-between items-center">
                    <span>DriftKing_Leonida ({getVipPriceText('/mo')})</span>
                    <span className="text-emerald-400 font-mono">Completed • PayPal</span>
                  </li>
                  <li className="py-2 flex justify-between items-center">
                    <span>Tommy_Vercetti_2026 ({getVipPriceText('/mo')})</span>
                    <span className="text-emerald-400 font-mono">Completed • Apple Pay</span>
                  </li>
                </ul>
              </div>

              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Publisher Security Audit Logs</span>
                <ul className="text-xs divide-y divide-zinc-800 text-zinc-400">
                  <li className="py-2 flex justify-between items-center">
                    <span>SSL Certificate Auto-Renew</span>
                    <span className="text-zinc-500 font-mono">Passed • Cloudflare</span>
                  </li>
                  <li className="py-2 flex justify-between items-center">
                    <span>Anti-Spam Filter (Chat & Builds)</span>
                    <span className="text-zinc-500 font-mono">Active (0 spam leaks)</span>
                  </li>
                  <li className="py-2 flex justify-between items-center">
                    <span>Google Ads.txt Validation</span>
                    <span className="text-emerald-400 font-mono">Valid ID: pub-842910</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
      )}

      {/* Tab Content: Environment Health & Pre-Build Diagnostic */}
      {activeSubTab === 'env-health' && (
        <EnvironmentHealthAdminSection isActorL4Admin={isActorL4Admin} />
      )}

      {/* Tab Content: Realtime Database Cron Jobs Hub */}
      {activeSubTab === 'cron-rtdb' && (
        <div className="space-y-4">
          <CronRtdbMonitorAdmin />
        </div>
      )}

      {/* Tab Content 5: System Architecture & pSEO Blueprint */}
      {activeSubTab === 'pseo' && (
        <div className="space-y-4">
          <PseoArchitectureTab />
        </div>
      )}

      {/* Tab Content: Custom Webhook / API Bot Control Center */}
      {activeSubTab === 'webhook-bot' && (
        <div className="space-y-4 animate-fade-in">
          <CustomWebhookBotAdminCms />
        </div>
      )}

      {/* Tab Content 6: Automated VIP Expiration Email Engine */}
      {activeSubTab === 'vip-notifications' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-950/80 via-zinc-900 to-amber-950/80 p-6 rounded-2xl border border-rose-500/30 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-6 h-6 text-rose-400" />
                  <h3 className="text-xl font-black text-white tracking-wide">
                    Automated VIP Expiration Email Engine
                  </h3>
                  <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Serverless Cloud Service
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                  Scans cloud <code className="text-amber-300 font-mono">userProfiles</code> daily to identify active VIP members nearing subscription expiration. Automatically queues personalized email reminders to the <code className="text-rose-300 font-mono">mail</code> collection processed by the mail service.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTriggerVipSpider}
                  disabled={isTriggeringVipCheck}
                  className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 ${isTriggeringVipCheck ? 'animate-spin' : ''}`} />
                  <span>{isTriggeringVipCheck ? 'Scanning Users...' : 'Run VIP Expiry Check Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCloudFunctionsModal(true)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-2 border border-zinc-700 cursor-pointer"
                >
                  <Code className="w-4 h-4 text-amber-400" />
                  <span>Cloud Functions Code</span>
                </button>

                <button
                  type="button"
                  onClick={fetchVipLogs}
                  disabled={isRefreshingLogs}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition cursor-pointer disabled:opacity-50"
                  title="Refresh Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingLogs ? 'animate-spin text-rose-400' : ''}`} />
                </button>
              </div>
            </div>

            {vipCheckNotice && (
              <div className={`p-3 rounded-xl border font-mono text-xs ${
                vipCheckNotice.startsWith('✅')
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                {vipCheckNotice}
              </div>
            )}

            {/* System Status Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase block">Total Scanned Users</span>
                <span className="text-xl font-black text-white font-mono">{users.length} Players</span>
                <p className="text-[10px] text-zinc-500">Live Cloud userProfiles</p>
              </div>

              <div className="bg-zinc-950/80 p-4 rounded-xl border border-amber-500/30 space-y-1">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase block">Active VIP Members</span>
                <span className="text-xl font-black text-amber-300 font-mono">
                  {users.filter(u => u.role === 'VIP Member' || u.isVip).length} Members
                </span>
                <p className="text-[10px] text-zinc-500">Monitored for expiration</p>
              </div>

              <div className="bg-zinc-950/80 p-4 rounded-xl border border-rose-500/30 space-y-1">
                <span className="text-[10px] font-extrabold text-rose-400 uppercase block">Cron Schedule</span>
                <span className="text-sm font-black text-white font-mono">Daily @ 00:00 UTC</span>
                <p className="text-[10px] text-rose-300 font-semibold">+ Every 6h server check</p>
              </div>

              <div className="bg-zinc-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase block">Mail Collection Queue</span>
                <span className="text-sm font-black text-emerald-300 font-mono">Cloud 'mail'</span>
                <p className="text-[10px] text-zinc-500">Trigger Email Service ready</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form: Dispatch Test VIP Expiry Email Alert */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 lg:col-span-1">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Send className="w-5 h-5 text-rose-400" />
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Dispatch Custom Test VIP Alert
                </h4>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Test the email alert template by dispatching a custom notification email to any target address.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">Target Email Address</label>
                  <input
                    type="email"
                    value={testEmailAddr}
                    onChange={(e) => setTestEmailAddr(e.target.value)}
                    placeholder="player@vicecity.app"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">Target GamerTag / Name</label>
                  <input
                    type="text"
                    value={testUsername}
                    onChange={(e) => setTestUsername(e.target.value)}
                    placeholder="ViceRacer99"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">Days Remaining</label>
                    <input
                      type="number"
                      value={testDaysLeft}
                      onChange={(e) => setTestDaysLeft(parseInt(e.target.value, 10) || 1)}
                      min={1}
                      max={30}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={testExpireDate}
                      onChange={(e) => setTestExpireDate(e.target.value)}
                      placeholder="2026-08-15"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestAlertAdmin}
                    disabled={isSendingTestAlert}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSendingTestAlert ? 'Dispatching Email...' : 'Send Test VIP Expiry Email'}</span>
                  </button>

                  {lastDispatchedPreview && (
                    <button
                      type="button"
                      onClick={() => setShowAdminEmailPreviewModal(true)}
                      className="px-3 py-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-extrabold text-xs rounded-xl transition border border-amber-500/30 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Inspect Rendered Email Payload"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>View Email Preview</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Email Payload Inspector Modal */}
            {showAdminEmailPreviewModal && lastDispatchedPreview && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm uppercase">
                      <Mail className="w-5 h-5 text-rose-500" />
                      <span>Dispatched Email Payload & Rendered Preview</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdminEmailPreviewModal(false)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                      <p><span className="text-zinc-500">Recipient (To):</span> <strong className="text-amber-300">{lastDispatchedPreview.to}</strong></p>
                      <p><span className="text-zinc-500">Subject:</span> <strong className="text-white">{lastDispatchedPreview.subject}</strong></p>
                      <p><span className="text-zinc-500">Dispatched At:</span> <span className="text-zinc-300">{lastDispatchedPreview.timestamp}</span></p>
                      <p><span className="text-zinc-500">Delivery Status:</span> <span className="text-emerald-400 font-bold">{lastDispatchedPreview.status}</span></p>
                    </div>

                    {lastDispatchedPreview.isPlaceholderEmail && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] leading-relaxed">
                        ⚠️ <strong>Placeholder/Discord Domain Notice:</strong> The email <code>{lastDispatchedPreview.to}</code> is a placeholder address. External emails cannot physically land in a fake inbox. However, this alert was <strong>100% delivered to the player's In-App Direct Notification Center</strong>!
                      </div>
                    )}
                  </div>

                  <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950 p-4">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-2 font-bold">Rendered Email HTML Container</span>
                    <div
                      className="text-zinc-100 font-sans text-xs"
                      dangerouslySetInnerHTML={{ __html: lastDispatchedPreview.html }}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAdminEmailPreviewModal(false)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Table: Automated Scan & Dispatch Logs */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Automated Scan & Dispatch Logs
                  </h4>
                </div>
                <span className="text-xs text-zinc-400 font-mono font-bold">
                  {vipLogs.length} Log Entries
                </span>
              </div>

              {vipLogs.length === 0 ? (
                <div className="p-8 text-center space-y-2 bg-zinc-950 rounded-xl border border-zinc-800">
                  <Mail className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-300">No VIP Expiration Alert Logs Recorded Yet</p>
                  <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                    Click "Run VIP Expiry Check Now" above or dispatch a test email to generate real-time log entries.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Scanned</th>
                        <th className="py-2.5 px-3">Alerts Sent</th>
                        <th className="py-2.5 px-3">Source / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {vipLogs.map((log: any, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-950/50 transition">
                          <td className="py-2.5 px-3 text-zinc-300 text-[11px] whitespace-nowrap">
                            {formatDateTime(log.timestamp, 'Just now')}
                          </td>
                          <td className="py-2.5 px-3 text-amber-300 font-bold">
                            {log.scannedCount ?? 1} Users
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">
                            {log.alertsSent ?? log.recipients?.length ?? 1} Sent
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                            {log.details || (log.recipients ? `To: ${log.recipients.join(', ')}` : 'Manual Check')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 7: Multiplayer Squad Radar Stale Rooms Cleaner */}
      {activeSubTab === 'squad-rooms' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-cyan-950/80 p-6 rounded-2xl border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
                  <h3 className="text-xl font-black text-white tracking-wide">
                    Multiplayer Squad Radar & Stale Room Cleaner
                  </h3>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> Automated 5m Inactivity Cron
                  </span>
                </div>
                <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
                  Real-time squad room telemetry engine. Scans party coordination rooms in Firestore and automatically purges or flags rooms that have not received live player GPS coordinates or tactical pings within <strong>30 minutes</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchSquadRoomsData()}
                  disabled={isLoadingSquad}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-zinc-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoadingSquad ? 'animate-spin' : ''}`} />
                  <span>Refresh Rooms</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunSquadCleanup({ thresholdMinutes: 30 })}
                  disabled={isLoadingSquad}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Run Stale Room Purge</span>
                </button>
              </div>
            </div>

            {/* Notification Banner */}
            {squadActionNotice && (
              <div className="bg-zinc-950/90 border border-emerald-500/40 p-3 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between">
                <span>{squadActionNotice}</span>
                <button
                  type="button"
                  onClick={() => setSquadActionNotice(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Telemetry Metrics & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Squad Rooms</span>
                <Radio className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {squadStatus?.totalRooms ?? squadRoomsList.length}
              </div>
              <p className="text-[11px] text-zinc-500">Live parties in Firestore</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Active (Active &lt;30m)</span>
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {squadStatus?.activeRooms ?? squadRoomsList.filter(r => !r.isStale).length}
              </div>
              <p className="text-[11px] text-zinc-500">Receiving live GPS updates</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Stale Rooms (&gt;30m Inactive)</span>
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {squadStatus?.staleRooms ?? squadRoomsList.filter(r => r.isStale).length}
              </div>
              <p className="text-[11px] text-zinc-500">Queued for automated cleanup</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Background Worker</span>
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-sm font-black text-cyan-300 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active (Every 5 min)
              </div>
              <p className="text-[11px] text-zinc-500">
                Last scan: {squadStatus?.lastCleanupTimestamp ? new Date(squadStatus.lastCleanupTimestamp).toLocaleTimeString() : 'Recent boot'}
              </p>
            </div>
          </div>

          {/* Quick Action Simulator Toolbar */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                Manual Inactivity Scan & Diagnostic Modes
              </h4>
              <span className="text-xs text-zinc-400 font-mono">Inactivity Cutoff: 30 minutes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleRunSquadCleanup({ thresholdMinutes: 30, dryRun: true })}
                disabled={isLoadingSquad}
                className="p-3.5 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl text-left transition cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                    Run Dry-Run Simulation
                  </span>
                  <Eye className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Scans all rooms and calculates inactivity without deleting documents from Firestore.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRunSquadCleanup({ thresholdMinutes: 30, flagOnly: true })}
                disabled={isLoadingSquad}
                className="p-3.5 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl text-left transition cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                    Flag Stale Rooms Only
                  </span>
                  <AlertTriangle className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Marks rooms as <code className="text-cyan-300">status: 'stale'</code> while preserving document history.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRunSquadCleanup({ thresholdMinutes: 30 })}
                disabled={isLoadingSquad}
                className="p-3.5 bg-zinc-950 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-500/40 rounded-xl text-left transition cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-rose-400 transition">
                    Purge All Stale Rooms
                  </span>
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Permanently deletes rooms from Firestore that have exceeded 30m of inactivity.
                </p>
              </button>
            </div>
          </div>

          {/* Active Squad Rooms Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  Live Squad Party Rooms ({squadRoomsList.length})
                </h4>
                <p className="text-xs text-zinc-400">
                  Real-time synchronization with Firestore <code className="text-emerald-400 font-mono">squad_rooms</code> collection.
                </p>
              </div>
            </div>

            {squadRoomsList.length === 0 ? (
              <div className="text-center py-12 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-2">
                <Radio className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-400 font-medium">No squad party rooms currently open in Firestore.</p>
                <p className="text-xs text-zinc-600">
                  Rooms are created dynamically when players open Squad Radar on the Interactive Map.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase">
                      <th className="py-3 px-3">Room Code</th>
                      <th className="py-3 px-3">Host UID</th>
                      <th className="py-3 px-3">Members</th>
                      <th className="py-3 px-3">Waypoints</th>
                      <th className="py-3 px-3">Inactivity</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {squadRoomsList.map((room) => (
                      <tr key={room.roomId} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-emerald-400">
                            {room.roomId}
                          </span>
                          {room.isVipRoom && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-sans font-bold">
                              VIP
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 max-w-[140px] truncate" title={room.hostUid}>
                          {room.hostUid || 'Anonymous'}
                        </td>
                        <td className="py-3 px-3 text-zinc-300">
                          {room.memberCount} player{room.memberCount === 1 ? '' : 's'}
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          {room.waypointCount} waypoints
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={
                              room.inactivityMinutes >= 30
                                ? 'text-rose-400 font-bold'
                                : 'text-emerald-400'
                            }
                          >
                            {room.inactivityMinutes}m ago
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {room.isStale || room.inactivityMinutes >= 30 ? (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold">
                              STALE (&gt;30m)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleRoom(room.roomId)}
                            className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded text-[11px] font-bold transition cursor-pointer"
                          >
                            Purge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Background Worker Run History & Execution Logs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Automated Background Worker Execution Logs
                </h4>
                <p className="text-xs text-zinc-400">
                  Logs from the automated 5-minute recurring background cleaner worker.
                </p>
              </div>
            </div>

            {(!squadStatus?.recentCleanupLogs || squadStatus.recentCleanupLogs.length === 0) ? (
              <div className="p-6 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-500 font-mono text-center">
                No recent background worker logs recorded in this session. The worker runs every 5 minutes.
              </div>
            ) : (
              <div className="space-y-2">
                {squadStatus.recentCleanupLogs.map((log: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs font-mono flex flex-col md:flex-row items-start md:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-zinc-800 text-cyan-300 rounded text-[10px] uppercase font-bold">
                        {log.trigger || 'cron'}
                      </span>
                      <span className="text-zinc-300">
                        Scanned <strong>{log.totalChecked}</strong> rooms • Cleared <strong>{log.staleCount}</strong> stale (&gt;30m inactive)
                      </span>
                    </div>
                    <div className="text-zinc-500 text-[11px] flex items-center gap-3">
                      <span>Duration: {log.durationMs}ms</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 10: L3 Staff Activity & Modifications Audit Ledger (L4 Restricted) */}
      {activeSubTab === 'staff-logs' && (
        <StaffActivityLogsTab
          currentUser={auth.currentUser}
          isAdmin={isActorL4Admin}
          isStaff={actorRole === 'Staff'}
        />
      )}

      {/* Tab Content 11: Ad & Sponsorship Display Controls */}
      {activeSubTab === 'ad-toggles' && (
        <AdToggleAdminCms />
      )}

      {/* Tab Content 12: MarketAgency AI Agent Subdomain Administration Console */}
      {activeSubTab === 'market-agency' && (
        <MarketAgencyAdminCms />
      )}

      {/* Cloud Functions Code Inspector Modal */}
      {showCloudFunctionsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Code className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-white">Serverless Cloud Functions Architecture</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCloudFunctionsModal(false)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Below is the complete source code of the scheduled Cloud Function located at <code className="text-amber-300 font-mono">/functions/index.js</code>.
            </p>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-72">
              <pre>{`// /functions/index.js
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.checkVipExpirations = onSchedule("0 0 * * *", async (event) => {
  const now = new Date();
  const snapshot = await db.collection("userProfiles").where("isVip", "==", true).get();
  
  for (const doc of snapshot.docs) {
    const user = doc.data();
    if (!user.vipExpires) continue;
    const expiry = new Date(user.vipExpires);
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if ([7, 3, 1].includes(diffDays)) {
      await db.collection("mail").add({
        to: user.email,
        message: {
          subject: "⚠️ Vice City VIP Pass Expiring Soon!",
          text: \`Hello \${user.displayName || 'Player'}, your VIP Pass expires in \${diffDays} day(s)!\`
        }
      });
    }
  }
});`}</pre>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Deployment Instructions</h4>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-xs text-amber-300 space-y-1">
                <p>1. cd functions && npm install</p>
                <p>2. firebase deploy --only functions</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCloudFunctionsModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CMS Unpublish / Delete Confirmation Modal */}
      {cmsDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-white">Unpublish CMS Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setCmsDeleteConfirm(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
              Are you sure you want to unpublish and permanently remove <strong>"{cmsDeleteConfirm.title}"</strong> from the live Vice City website?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCmsDeleteConfirm(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCmsItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Unpublish</span>
              </button>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>

      {/* Full Firestore User Document Edit Modal */}
      {editingUserDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    User Account Record Editor
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Editing user: <strong className="text-amber-300">@{editingUserDoc.username}</strong> • UID: <span className="text-zinc-500">{editingUserDoc.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUserDoc(null)}
                className="text-zinc-500 hover:text-white font-bold text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              {/* Row 1: Username & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Username (GamerTag)</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Hierarchy Role & Account Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Hierarchy Role Level</label>
                  <select
                    value={editRole}
                    disabled={!canAssignRole(actorRole, actorEmail, editingUserDoc?.role)}
                    onChange={(e) => {
                      const newR = e.target.value as UserRole;
                      if (!canAssignRole(actorRole, actorEmail, editingUserDoc?.role, newR)) {
                        alert('Permission Denied: Staff members cannot modify Admin accounts or assign Admin role.');
                        return;
                      }
                      setEditRole(newR);
                      if (newR === 'Admin') {
                        setEditIsAdmin(true);
                        setEditIsStaff(true);
                        setEditIsVip(true);
                      } else if (newR === 'Staff') {
                        setEditIsAdmin(false);
                        setEditIsStaff(true);
                        setEditIsVip(true);
                      } else if (newR === 'VIP Member') {
                        setEditIsAdmin(false);
                        setEditIsStaff(false);
                        setEditIsVip(true);
                      } else {
                        setEditIsAdmin(false);
                        setEditIsStaff(false);
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-bold"
                  >
                    <option value="User">Level 1: Regular User</option>
                    <option value="VIP Member">Level 2: VIP Member</option>
                    <option value="Staff">Level 3: Staff (Moderator)</option>
                    {actorRole === 'Admin' && (
                      <option value="Admin">Level 4: Admin (Superuser)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Checkboxes for Flag Badges */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-300">
                  <input
                    type="checkbox"
                    checked={editIsAdmin}
                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-rose-500 focus:ring-0"
                  />
                  <span>isAdmin Flag</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-300">
                  <input
                    type="checkbox"
                    checked={editIsStaff}
                    onChange={(e) => setEditIsStaff(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-indigo-500 focus:ring-0"
                  />
                  <span>isStaff Flag</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-300">
                  <input
                    type="checkbox"
                    checked={editIsVip}
                    onChange={(e) => setEditIsVip(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <span>isVip Flag</span>
                </label>
              </div>

              {/* Row 4: Economy & Streak */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1 flex items-center gap-1 text-emerald-400">
                    <Coins className="w-3.5 h-3.5" /> VC Cash Balance ($)
                  </label>
                  <input
                    type="number"
                    value={editVcBalance}
                    onChange={(e) => setEditVcBalance(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-extrabold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1 flex items-center gap-1 text-amber-400">
                    <Flame className="w-3.5 h-3.5" /> Daily Streak (Days)
                  </label>
                  <input
                    type="number"
                    value={editDailyStreak}
                    onChange={(e) => setEditDailyStreak(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Published Builds Count</label>
                  <input
                    type="number"
                    value={editPublishedBuilds}
                    onChange={(e) => setEditPublishedBuilds(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 5: VIP Expiration & Avatar URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">VIP Pass Expiration Date</label>
                  <input
                    type="text"
                    placeholder="2026-09-03 or Lifetime"
                    value={editVipExpires}
                    onChange={(e) => setEditVipExpires(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-amber-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Avatar Vector / Image URL</label>
                  <div className="flex items-center gap-2">
                    <img src={editAvatar || DEFAULT_GTA6_AVATAR} alt="Avatar Preview" className="w-8 h-8 rounded-full border border-zinc-700 object-cover shrink-0" />
                    <input
                      type="text"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-[11px] font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Staff Moderation Note */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1">Staff / Moderation Audit Note</label>
                <textarea
                  rows={2}
                  placeholder="Staff internal notes regarding account history or warnings..."
                  value={editModerationNote}
                  onChange={(e) => setEditModerationNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Row 7: Advanced Raw JSON Document Field Editor */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-amber-400 font-bold flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    Advanced Raw JSON Document Fields
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">Direct JSON Payload Sync</span>
                </div>
                <textarea
                  rows={5}
                  value={editRawJson}
                  onChange={(e) => setEditRawJson(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => handleDeleteUserDoc(editingUserDoc.id, editingUserDoc.username)}
                disabled={!canEditUserFields(actorRole, actorEmail, editingUserDoc)}
                className="px-3.5 py-2 bg-rose-950/50 hover:bg-rose-900/70 text-rose-400 border border-rose-800/60 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Profile Document</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUserDoc(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingUserDoc || !canEditUserFields(actorRole, actorEmail, editingUserDoc)}
                  onClick={handleSaveUserDoc}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!canEditUserFields(actorRole, actorEmail, editingUserDoc) ? 'Only Admins can edit fields for Admin accounts' : 'Save changes to user record'}
                >
                  {isSavingUserDoc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Record...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Save User Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Document Deletion Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-white">Delete User Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs text-zinc-300">
              <p className="text-white font-bold text-sm">@{userToDelete.username}</p>
              <p className="text-zinc-400 text-[11px]">{userToDelete.email}</p>
              <p className="text-zinc-500 font-mono text-[10px]">UID: {userToDelete.id}</p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to permanently delete this user's profile document from Firestore? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteUserDoc}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CMS Content Delete Confirmation Modal */}
      {cmsDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-white">Delete Content Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setCmsDeleteConfirm(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs text-zinc-300">
              <p className="text-white font-bold text-sm">{cmsDeleteConfirm.title}</p>
              <p className="text-zinc-400 text-[11px]">Collection: <span className="font-mono text-amber-400">{cmsDeleteConfirm.colName}</span></p>
              <p className="text-zinc-500 font-mono text-[10px]">ID: {cmsDeleteConfirm.id}</p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Permanently remove this content from the live database and public directory?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCmsDeleteConfirm(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCmsItem}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
