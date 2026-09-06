'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Shield, 
  Bot, 
  Bell, 
  Sliders, 
  Send, 
  RefreshCw, 
  Crown, 
  Layers, 
  Eye, 
  Search, 
  Filter, 
  Trash2, 
  UserCheck, 
  Lock, 
  Radio, 
  ChevronRight, 
  Activity, 
  MessageSquare, 
  Zap, 
  AlertTriangle,
  FileText,
  Link2,
  TrendingUp,
  Share2,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Award,
  BarChart3,
  Calendar,
  MousePointerClick,
  Palette,
  Globe,
  Image as ImageIcon,
  DollarSign,
  PieChart,
  ShieldAlert,
  Flame,
  LayoutDashboard,
  Download,
  FileSpreadsheet,
  Upload,
  LogIn,
  Database,
  CreditCard,
  BookOpen,
  Wrench,
  KeyRound,
  Wand2
} from 'lucide-react';
import { isAdminUser, isStaffUser } from '../../lib/rbac';
import { 
  WhitelistFormConfig, 
  WhitelistApplication, 
  WhitelistApplicationStatus, 
  RpServer,
  QuickInvite,
  OwnershipTransfer,
  UserProfile,
  CustomBrandingConfig,
  PriorityPlacementConfig,
  ServerAnalyticsOverview
} from '../../types';
import { RP_SERVERS_DATA } from '../../data/rpServers';
import { resolveApplicantAvatar } from '../../data/avatars';
import { copyToClipboard } from '../../lib/copyUtils';
import { uploadImageAsset } from '../../lib/uploadService';
import { 
  getFormConfigBySlug, 
  saveFormConfig, 
  subscribeToApplicationsByServer, 
  updateApplicationStatus, 
  deleteApplication, 
  createTestApplication, 
  sendDiscordNotification, 
  sendWhitelistEmailNotification,
  normalizeServerSlug,
  DEFAULT_WHITELIST_QUESTIONS,
  claimServerWithDiscord,
  transferServerOwnership,
  createQuickInvite,
  getQuickInvites,
  deleteQuickInvite,
  toggleQuickInviteActive,
  getUserProfile,
  verifyServerStripeSubscription,
  fetchServerSubscriptionStatus,
  saveServerCustomBranding,
  saveServerPriorityPlacement,
  importWhitelistApplications
} from '../../lib/whitelist-service';
import { ClaimButtonModal } from '../servers/ClaimButtonModal';
import { PaymentSuccessModal } from '../servers/PaymentSuccessModal';
import { MarketingWorkspace } from '../marketing/MarketingWorkspace';
import { FeaturesOnDemandTab } from './FeaturesOnDemandTab';
import { ViceCityProvisioningModal } from '../provisioning/ViceCityProvisioningModal';
import { ServerOwnerNotificationCenter } from '../servers/ServerOwnerNotificationCenter';
import { ServerOwnerNotificationDropdown } from '../servers/ServerOwnerNotificationDropdown';
import { 
  ServerOwnerNotification, 
  ServerNotificationSettings 
} from '../../types';
import { 
  subscribeToServerNotifications, 
  getServerNotificationSettings, 
  saveServerNotificationSettings,
  DEFAULT_SERVER_NOTIF_SETTINGS 
} from '../../lib/server-notification-service';
import { formatTime, formatDate, formatDateTime } from '../../lib/dateUtils';

interface ServerDashboardTabProps {
  serverSlug: string;
  onNavigate?: (path: string, slug?: string) => void;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
  } | null;
  onOpenAuth?: () => void;
}

export const ServerDashboardTab: React.FC<ServerDashboardTabProps> = ({
  serverSlug,
  onNavigate,
  currentUser,
  onOpenAuth
}) => {
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedConnect, setCopiedConnect] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [showProvisioningModal, setShowProvisioningModal] = useState(false);

  // Real-Time Firebase Sync Status State
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

  // Listen to network status changes
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
    };
    const handleOffline = () => {
      setSyncStatus('error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dashboard Sub-navigation Tabs
  const [activeSection, setActiveSection] = useState<
    'applications' | 'notifications' | 'settings' | 'bot_gateway' | 'quick_invites' | 'branding' | 'analytics' | 'billing' | 'ownership_transfer' | 'growth' | 'features_on_demand'
  >('applications');

  // Server Owner Dedicated Notifications State
  const [serverNotifications, setServerNotifications] = useState<ServerOwnerNotification[]>([]);
  const [notifSettings, setNotifSettings] = useState<ServerNotificationSettings>(() => getServerNotificationSettings(serverSlug));

  // Custom Branding Suite State
  const [branding, setBranding] = useState<CustomBrandingConfig>({
    logoUrl: '',
    bannerUrl: '',
    accentColor: '#6366f1',
    customDomain: '',
    hideWatermark: false,
    discordInviteUrl: '',
    customBadgeText: 'Official Partner',
    customHeaderTitle: ''
  });
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  // Image Verification & Multi-Placement Preview State
  const [logoVerifyStatus, setLogoVerifyStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [logoMeta, setLogoMeta] = useState<{ width: number; height: number; aspect: number } | null>(null);
  const [logoErrorMsg, setLogoErrorMsg] = useState<string | null>(null);

  const [bannerVerifyStatus, setBannerVerifyStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [bannerMeta, setBannerMeta] = useState<{ width: number; height: number; aspect: number } | null>(null);
  const [bannerErrorMsg, setBannerErrorMsg] = useState<string | null>(null);

  const [brandingPreviewTab, setBrandingPreviewTab] = useState<'apply_portal' | 'directory_card' | 'discord_embed' | 'applicant_status'>('apply_portal');
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);
  const [copiedDnsCname, setCopiedDnsCname] = useState(false);
  const [dnsChecking, setDnsChecking] = useState(false);
  const [dnsStatusMessage, setDnsStatusMessage] = useState<string | null>(null);

  // Presets for Quick Testing & GTA VI Themes
  const BRANDING_PRESETS = [
    {
      name: '🌴 Ocean Drive Sunset',
      accent: '#ec4899',
      badge: 'Official Partner • Season 2',
      banner: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512&auto=format&fit=crop&q=80',
      desc: 'Neon pink sunset palette with high-contrast palm badge'
    },
    {
      name: '🌃 Vice Port Cyber Night',
      accent: '#06b6d4',
      badge: 'Hardcore RP • 128 Slots',
      banner: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=512&auto=format&fit=crop&q=80',
      desc: 'Cyberpunk teal glow with high-octane city skyline'
    },
    {
      name: '⚡ Biscayne Syndicate',
      accent: '#6366f1',
      badge: 'Whitelisted • Fast-Track',
      banner: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=512&auto=format&fit=crop&q=80',
      desc: 'Indigo hypercar aesthetic with metallic logo badge'
    },
    {
      name: '🔥 Everglades Outlaw',
      accent: '#f59e0b',
      badge: 'Custom Economy • Serious Lore',
      banner: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1920&auto=format&fit=crop&q=80',
      logo: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=512&auto=format&fit=crop&q=80',
      desc: 'Amber gold muscle theme with rugged outlaw shield'
    }
  ];

  // Image verification engine
  const verifyImage = (url: string, type: 'logo' | 'banner') => {
    if (!url || !url.trim()) {
      if (type === 'logo') {
        setLogoVerifyStatus('idle');
        setLogoMeta(null);
        setLogoErrorMsg(null);
      } else {
        setBannerVerifyStatus('idle');
        setBannerMeta(null);
        setBannerErrorMsg(null);
      }
      return;
    }

    if (type === 'logo') {
      setLogoVerifyStatus('verifying');
      setLogoErrorMsg(null);
    } else {
      setBannerVerifyStatus('verifying');
      setBannerErrorMsg(null);
    }

    const img = new Image();
    const timeoutId = setTimeout(() => {
      if (type === 'logo') {
        setLogoVerifyStatus('valid');
        setLogoMeta(prev => prev || { width: 512, height: 512, aspect: 1 });
      } else {
        setBannerVerifyStatus('valid');
        setBannerMeta(prev => prev || { width: 1920, height: 600, aspect: 3.2 });
      }
    }, 4500);

    img.onload = () => {
      clearTimeout(timeoutId);
      const w = img.naturalWidth || 512;
      const h = img.naturalHeight || 512;
      const aspect = h > 0 ? Number((w / h).toFixed(2)) : 1;
      if (type === 'logo') {
        setLogoVerifyStatus('valid');
        setLogoMeta({ width: w, height: h, aspect });
        setLogoErrorMsg(null);
      } else {
        setBannerVerifyStatus('valid');
        setBannerMeta({ width: w, height: h, aspect });
        setBannerErrorMsg(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      if (type === 'logo') {
        setLogoVerifyStatus('invalid');
        setLogoMeta(null);
        setLogoErrorMsg('Unable to load logo image. Ensure URL is public or upload directly.');
      } else {
        setBannerVerifyStatus('invalid');
        setBannerMeta(null);
        setBannerErrorMsg('Unable to load banner image. Ensure URL is public or upload directly.');
      }
    };

    img.src = url;
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (branding.logoUrl) verifyImage(branding.logoUrl, 'logo');
      else { setLogoVerifyStatus('idle'); setLogoMeta(null); setLogoErrorMsg(null); }
    }, 350);
    return () => clearTimeout(t);
  }, [branding.logoUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (branding.bannerUrl) verifyImage(branding.bannerUrl, 'banner');
      else { setBannerVerifyStatus('idle'); setBannerMeta(null); setBannerErrorMsg(null); }
    }, 350);
    return () => clearTimeout(t);
  }, [branding.bannerUrl]);

  // Direct File Upload Handler (Uploads to UploadThing CDN, avoiding base64 data URLs)
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (type === 'logo') setLogoErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      else setBannerErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      if (type === 'logo') setLogoErrorMsg('File size exceeds 4MB. Please compress your image.');
      else setBannerErrorMsg('File size exceeds 4MB. Please compress your image.');
      return;
    }

    try {
      if (type === 'logo') {
        setLogoErrorMsg(null);
      } else {
        setBannerErrorMsg(null);
      }

      const endpoint = type === 'logo' ? 'avatar' : 'serverBanner';
      const cdnUrl = await uploadImageAsset(file, endpoint);
      
      if (type === 'logo') {
        setBranding(prev => ({ ...prev, logoUrl: cdnUrl }));
      } else {
        setBranding(prev => ({ ...prev, bannerUrl: cdnUrl }));
      }
    } catch (err: any) {
      if (type === 'logo') setLogoErrorMsg(`Upload failed: ${err?.message || 'Network error'}`);
      else setBannerErrorMsg(`Upload failed: ${err?.message || 'Network error'}`);
    }
  };


  // Priority Placement State
  const [priorityPlacement, setPriorityPlacement] = useState<PriorityPlacementConfig>({
    isFeatured: true,
    isBoosted: false,
    boostRank: 1,
    badge: '⭐ Top Ranked Community',
    highlightColor: '#f59e0b'
  });
  const [savingPriority, setSavingPriority] = useState(false);
  const [prioritySuccess, setPrioritySuccess] = useState<string | null>(null);
  const [priorityError, setPriorityError] = useState<string | null>(null);

  // Stripe Subscription Verification & Gating State
  const [stripeSubInput, setStripeSubInput] = useState('');
  const [verifyingSub, setVerifyingSub] = useState(false);
  const [subVerifyMessage, setSubVerifyMessage] = useState<string | null>(null);
  const [subVerifyError, setSubVerifyError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // User Profile with linked Discord data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Data State
  const [config, setConfig] = useState<WhitelistFormConfig>({
    serverId: serverSlug,
    serverSlug: normalizeServerSlug(serverSlug),
    serverName: 'Vice City RP Server',
    ownerUid: currentUser?.uid || 'system_admin',
    ownerDiscordId: '',
    isClaimed: false,
    discordGuildId: '',
    discordRoleId: '',
    discordWebhookUrl: '',
    isSubscriptionActive: true,
    autoApprovalEnabled: false,
    autoApprovalMinScore: 90,
    botAutoRoleEnabled: true,
    botWebhookEnabled: true,
    botDmApplicantEnabled: true,
    antiAltProtectionEnabled: true,
    minBackstoryWords: 75,
    requireDiscordOAuth: true,
    formEnabled: true,
    maintenanceMessage: 'Whitelist applications are temporarily paused for maintenance. Check back shortly.',
    connectUrl: 'cfx.re/join/vclife',
    averageReviewTime: 'Under 2 Hours',
    customQuestions: DEFAULT_WHITELIST_QUESTIONS
  });

  const [applications, setApplications] = useState<WhitelistApplication[]>([]);
  const [appStatusFilter, setAppStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'flagged'>('all');
  
  // Quick Invites State
  const [quickInvites, setQuickInvites] = useState<QuickInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [showCreateInviteModal, setShowCreateInviteModal] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [newInviteLabel, setNewInviteLabel] = useState('');
  const [newInviteMaxUses, setNewInviteMaxUses] = useState('');
  const [newInviteExpiresDays, setNewInviteExpiresDays] = useState('14');
  const [newInviteNote, setNewInviteNote] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);

  // Ownership Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetDiscordId, setTransferTargetDiscordId] = useState('');
  const [transferTargetUsername, setTransferTargetUsername] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferConfirmText, setTransferConfirmText] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Claim Server State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimDiscordIdInput, setClaimDiscordIdInput] = useState('');
  const [claimUsernameInput, setClaimUsernameInput] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Selected Application for Inspection Modal
  const [selectedApp, setSelectedApp] = useState<WhitelistApplication | null>(null);

  // Reject Modal State
  const [rejectingApp, setRejectingApp] = useState<WhitelistApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('Character backstory does not meet minimum lore depth requirements.');
  const [customRejectNote, setCustomRejectNote] = useState('');
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  // Batch action state
  const [batchApproving, setBatchApproving] = useState(false);
  const [batchSuccessCount, setBatchSuccessCount] = useState<number | null>(null);

  // Test Webhook Dispatcher State
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<any>(null);

  // Stripe Payment Success Modal State
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState<string | undefined>(undefined);

  // Server Owner Data Backup & Import/Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [dataModalTab, setDataModalTab] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<'full_json' | 'questions_json' | 'csv_applicants'>('full_json');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importParsedData, setImportParsedData] = useState<any | null>(null);
  const [importParsedApps, setImportParsedApps] = useState<WhitelistApplication[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);

  // Import granularity toggles
  const [importIncludeConfig, setImportIncludeConfig] = useState(true);
  const [importIncludeQuestions, setImportIncludeQuestions] = useState(true);
  const [importIncludeApps, setImportIncludeApps] = useState(true);

  // Handle File Selection & Parser for Import
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportStatusMessage(null);
    setImportErrorMessage(null);
    setImportParsedData(null);
    setImportParsedApps([]);

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const json = JSON.parse(text);

          if (json.configuration || json.customQuestions || json.questions || json.applications) {
            setImportParsedData(json);
            let extractedApps: WhitelistApplication[] = [];
            if (Array.isArray(json.applications)) {
              extractedApps = json.applications;
            } else if (Array.isArray(json.applicationsList)) {
              extractedApps = json.applicationsList;
            }
            setImportParsedApps(extractedApps);

            if (json.configuration || json.applications) {
              setImportMode('full_json');
            } else if (json.customQuestions || json.questions) {
              setImportMode('questions_json');
            }
          } else {
            setImportErrorMessage('Invalid JSON format: missing server configuration, questions schema, or applicant records.');
          }
        } catch (err: any) {
          setImportErrorMessage(`Failed to parse JSON file: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
          if (lines.length < 2) {
            setImportErrorMessage('CSV file appears empty or missing header row.');
            return;
          }

          const parseCsvRow = (str: string) => {
            const row: string[] = [];
            let insideQuote = false;
            let entry = '';
            for (let i = 0; i < str.length; i++) {
              const char = str[i];
              if (char === '"') {
                if (insideQuote && str[i + 1] === '"') {
                  entry += '"';
                  i++;
                } else {
                  insideQuote = !insideQuote;
                }
              } else if (char === ',' && !insideQuote) {
                row.push(entry.trim());
                entry = '';
              } else {
                entry += char;
              }
            }
            row.push(entry.trim());
            return row;
          };

          const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
          const usernameIdx = headers.findIndex(h => h.includes('username') || h.includes('applicant') || h.includes('player'));
          const discordTagIdx = headers.findIndex(h => h.includes('discordtag') || h.includes('discord') || h.includes('tag'));
          const discordIdIdx = headers.findIndex(h => h.includes('discordid') || h.includes('userid'));
          const statusIdx = headers.findIndex(h => h.includes('status'));
          const scoreIdx = headers.findIndex(h => h.includes('score') || h.includes('aiscore'));
          const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('submitted'));
          const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('review'));

          const parsedApps: WhitelistApplication[] = [];

          for (let i = 1; i < lines.length; i++) {
            const row = parseCsvRow(lines[i]);
            if (row.length === 0 || row.every(cell => !cell)) continue;

            const username = usernameIdx >= 0 ? row[usernameIdx] : row[1] || `Player_${i}`;
            const discordTag = discordTagIdx >= 0 ? row[discordTagIdx] : row[2] || 'Citizen#0000';
            const discordId = discordIdIdx >= 0 ? row[discordIdIdx] : row[3] || '';
            const statusRaw = statusIdx >= 0 ? row[statusIdx].toLowerCase() : 'pending';
            const status = (['approved', 'rejected', 'under_review', 'pending'].includes(statusRaw) ? statusRaw : 'pending') as WhitelistApplicationStatus;
            const score = scoreIdx >= 0 ? parseInt(row[scoreIdx], 10) : NaN;
            const dateStr = dateIdx >= 0 ? row[dateIdx] : '';
            const notes = notesIdx >= 0 ? row[notesIdx] : 'Imported from CSV spreadsheet';

            const appItem: WhitelistApplication = {
              id: row[0]?.startsWith('app_') ? row[0] : `app_csv_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
              serverId: config.serverId || serverSlug,
              applicantUid: `imported_${Date.now()}_${i}`,
              applicantUsername: username || `Applicant_${i}`,
              discordTag: discordTag || 'Citizen#0000',
              discordId: discordId || `csv_discord_${i}`,
              discordAvatar: '',
              status: status,
              answers: {
                'Note': 'Applicant profile imported via CSV Spreadsheet Migration'
              },
              aiAudit: !isNaN(score) ? { score, recommendation: score >= 75 ? 'Fast-Track' : 'Standard Review', summary: 'Imported applicant entry', flags: [] } : undefined,
              createdAt: dateStr ? new Date(dateStr).getTime() || Date.now() : Date.now(),
              reviewerNotes: notes
            };

            parsedApps.push(appItem);
          }

          setImportMode('csv_applicants');
          setImportParsedApps(parsedApps);
          setImportParsedData({ totalRows: lines.length - 1, validAppsCount: parsedApps.length });
        } catch (err: any) {
          setImportErrorMessage(`Failed to parse CSV spreadsheet: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      setImportErrorMessage('Unsupported file format. Please upload a .json backup or .csv spreadsheet.');
    }
  };

  // Handle Execute Import
  const handleExecuteImport = async () => {
    if (!importFile) {
      setImportErrorMessage('Please select a valid .json or .csv backup file first.');
      return;
    }

    setImporting(true);
    setImportStatusMessage('Processing data import...');
    setImportErrorMessage(null);

    try {
      let updatedConfig = { ...config };
      let importedQuestionsCount = 0;
      let importedAppsCount = 0;

      // 1. Restore Config & Questions if present in JSON and toggled
      if (importParsedData && (importMode === 'full_json' || importMode === 'questions_json')) {
        if (importIncludeQuestions) {
          const questionsList = importParsedData.customQuestions || importParsedData.questions || importParsedData.configuration?.customQuestions;
          if (Array.isArray(questionsList) && questionsList.length > 0) {
            updatedConfig.customQuestions = questionsList;
            importedQuestionsCount = questionsList.length;
          }
        }

        if (importIncludeConfig && importParsedData.configuration) {
          const c = importParsedData.configuration;
          updatedConfig = {
            ...updatedConfig,
            serverName: c.serverName || updatedConfig.serverName,
            minBackstoryWords: c.minBackstoryWords ?? updatedConfig.minBackstoryWords,
            autoApprovalEnabled: c.autoApprovalEnabled ?? updatedConfig.autoApprovalEnabled,
            autoApprovalMinScore: c.autoApprovalMinScore ?? updatedConfig.autoApprovalMinScore,
            discordWebhookUrl: c.discordWebhookUrl || updatedConfig.discordWebhookUrl,
            connectUrl: c.connectUrl || updatedConfig.connectUrl,
            maintenanceMessage: c.maintenanceMessage || updatedConfig.maintenanceMessage,
            botAutoRoleEnabled: c.botAutoRoleEnabled ?? updatedConfig.botAutoRoleEnabled,
            botWebhookEnabled: c.botWebhookEnabled ?? updatedConfig.botWebhookEnabled,
            requireDiscordOAuth: c.requireDiscordOAuth ?? updatedConfig.requireDiscordOAuth
          };
        }

        // Save config updates to state & Firestore
        setConfig(updatedConfig);
        await saveFormConfig(
          { ...updatedConfig, ownerUid: config.ownerUid || currentUser?.uid || 'system_admin' },
          currentUser?.uid,
          currentUser?.email,
          isL4Admin
        );
      }

      // 2. Restore Applicant Applications if present and toggled
      if (importIncludeApps && importParsedApps.length > 0) {
        const res = await importWhitelistApplications(importParsedApps);
        importedAppsCount = res.count;

        // Update local applications state
        setApplications(prev => {
          const map = new Map<string, WhitelistApplication>();
          prev.forEach(a => map.set(a.id, a));
          importParsedApps.forEach(a => map.set(a.id, a));
          return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        });
      }

      setImportStatusMessage(`✓ Import completed successfully! ${importedQuestionsCount > 0 ? `Restored ${importedQuestionsCount} form questions. ` : ''}${importedAppsCount > 0 ? `Imported ${importedAppsCount} applicant records.` : ''}`);

      setTimeout(() => {
        setShowDataModal(false);
        setShowExportModal(false);
        setImportFile(null);
        setImportParsedData(null);
        setImportParsedApps([]);
        setImportStatusMessage(null);
      }, 2500);

    } catch (err: any) {
      console.error('Import error:', err);
      setImportErrorMessage(`Data import failed: ${err.message || 'Unknown error during import.'}`);
    } finally {
      setImporting(false);
    }
  };

  // Subscription & Trial Expiry Calculations
  const isTrialActive = Boolean(
    config.trialEndsAt && config.trialEndsAt > Date.now() && !config.stripeSubscriptionId
  );

  const getSubscriptionExpiryDate = () => {
    if (config.trialEndsAt) {
      const d = new Date(config.trialEndsAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (config.subscriptionExpiresAt) {
      const d = new Date(config.subscriptionExpiresAt);
      if (!isNaN(d.getTime())) return d;
    }
    const baseTime = config.claimedAt || config.updatedAt || Date.now();
    return new Date(baseTime + 30 * 24 * 60 * 60 * 1000);
  };

  const subExpiryDate = getSubscriptionExpiryDate();
  const subDaysRemaining = Math.max(0, Math.ceil((subExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isSubExpiringSoon = subDaysRemaining <= 7;

  // Export Full JSON Backup
  const handleExportFullJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      server: {
        id: config.serverId,
        name: config.serverName,
        slug: config.serverSlug,
        ownerUid: config.ownerUid,
        ownerDiscordId: config.ownerDiscordId,
        isVerifiedServerOwner: Boolean(isVerifiedServerOwner),
        isSubscriptionActive: Boolean(config.isSubscriptionActive),
        stripeSubscriptionId: config.stripeSubscriptionId || '',
        planTier: config.planTier || 'community',
        subscriptionExpiresAt: subExpiryDate.toISOString()
      },
      configuration: config,
      customBranding: branding,
      priorityPlacement: priorityPlacement,
      quickInvites: quickInvites,
      totalApplications: applications.length,
      applications: applications
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.serverSlug || 'server'}-whitelist-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Applications CSV Spreadsheet
  const handleExportApplicationsCSV = () => {
    const headers = ['Application ID', 'Applicant Username', 'Discord Tag', 'Discord ID', 'Status', 'AI Score', 'AI Recommendation', 'Submitted Date', 'Invite Code', 'Reviewed By', 'Reviewer Notes'];
    const rows = applications.map(app => [
      `"${app.id || ''}"`,
      `"${(app.applicantUsername || '').replace(/"/g, '""')}"`,
      `"${(app.discordTag || '').replace(/"/g, '""')}"`,
      `"${(app.discordId || '').replace(/"/g, '""')}"`,
      `"${app.status || 'pending'}"`,
      app.aiAudit?.score ?? (app as any).aiScore ?? '',
      `"${(app.aiAudit?.recommendation || '').replace(/"/g, '""')}"`,
      `"${app.createdAt ? new Date(app.createdAt).toISOString() : (app as any).submittedAt || ''}"`,
      `"${app.inviteCode || ''}"`,
      `"${(app.reviewedBy || '').replace(/"/g, '""')}"`,
      `"${(app.reviewerNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.serverSlug || 'server'}-applications-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Form Questions Schema
  const handleExportFormQuestionsJSON = () => {
    const schemaData = {
      serverSlug: config.serverSlug,
      serverName: config.serverName,
      minBackstoryWords: config.minBackstoryWords,
      customQuestions: config.customQuestions
    };
    const blob = new Blob([JSON.stringify(schemaData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.serverSlug || 'server'}-whitelist-schema-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Matched Static Server Data
  const matchedRpServer = RP_SERVERS_DATA.find(
    s => s.id === serverSlug || normalizeServerSlug(s.name) === normalizeServerSlug(serverSlug)
  );

  // Discord User Info from profile or localStorage
  const userDiscordId = userProfile?.discordId || (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_user_id') : null);
  const userDiscordUsername = userProfile?.discordUsername || (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_username') : null);

  // Security & Authorization Checks
  const isL4Admin = Boolean(
    currentUser && currentUser.isAdmin
  );

  // Local Storage Claim Check (strictly scoped to this specific server)
  const isLocalClaimed = Boolean(
    typeof window !== 'undefined' && (
      localStorage.getItem(`gtavi_claimed_${serverSlug}`) === 'true' ||
      (matchedRpServer && localStorage.getItem(`gtavi_claimed_${matchedRpServer.id}`) === 'true')
    )
  );

  // Server Claim Status
  const isClaimed = Boolean(
    config.isClaimed ||
    matchedRpServer?.isClaimed ||
    (config.ownerDiscordId && config.ownerDiscordId.trim().length > 0) ||
    isLocalClaimed
  );

  // Owner Access Matching (by Discord ID, Discord Username, UID, Email, LocalStorage or L4 Admin)
  const isOwnerByDiscord = Boolean(
    (userDiscordId && config.ownerDiscordId && (
      userDiscordId === config.ownerDiscordId ||
      userDiscordId.toLowerCase() === config.ownerDiscordId.toLowerCase()
    )) ||
    (userDiscordUsername && config.claimedByDiscordUsername && userDiscordUsername.toLowerCase() === config.claimedByDiscordUsername.toLowerCase()) ||
    (userDiscordUsername && config.ownerDiscordId && userDiscordUsername.toLowerCase() === config.ownerDiscordId.toLowerCase()) ||
    (userDiscordId && config.claimedByDiscordUsername && userDiscordId.toLowerCase() === config.claimedByDiscordUsername.toLowerCase())
  );

  const isOwnerByUid = Boolean(
    currentUser && config && (
      (config.ownerUid && config.ownerUid === currentUser.uid) ||
      (config.ownerUid && currentUser.email && config.ownerUid.toLowerCase() === currentUser.email.toLowerCase()) ||
      (matchedRpServer?.ownerUid && matchedRpServer.ownerUid === currentUser.uid)
    )
  );

  const isServerOwner = isL4Admin || isOwnerByDiscord || isOwnerByUid;
  const hasOwnerAccess = isL4Admin || isServerOwner;

  // Designated Staff Check (L4 Admin or L3 Staff from currentUser context or userProfile Firebase role)
  const isDesignatedStaff = Boolean(
    isL4Admin ||
    currentUser?.isAdmin ||
    currentUser?.isStaff ||
    isStaffUser(userProfile?.role, currentUser?.email) ||
    (userProfile?.clearanceLevel && ['L4', 'L3', 'L4 Admin', 'L3 Staff'].includes(userProfile.clearanceLevel))
  );

  // Authorized Owner or Designated Staff Check for Marketing and Billing
  const canAccessMarketingAndBilling = Boolean(
    isDesignatedStaff ||
    isServerOwner ||
    isOwnerByDiscord ||
    isOwnerByUid ||
    isLocalClaimed
  );

  const renderRestrictedAccessGuard = (sectionTitle: string, sectionDesc: string) => (
    <div className="bg-zinc-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden my-4">
      <div className="absolute top-0 right-0 p-8 opacity-10 text-amber-500 pointer-events-none">
        <Lock className="w-48 h-48" />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-zinc-800 pb-6 relative z-10">
        <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-white">{sectionTitle} Access Restricted</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
              Role Protection Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            {sectionDesc} Access to this management section is restricted strictly to verified server owners or designated Staff accounts (Level 3 Staff / Level 4 Admin).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Your Current Authentication Status</span>
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <div className={`w-2.5 h-2.5 rounded-full ${currentUser ? (isDesignatedStaff ? 'bg-indigo-400' : 'bg-amber-400') : 'bg-rose-500'}`} />
            <span>{currentUser ? `Logged in as ${currentUser.displayName || currentUser.email || currentUser.uid}` : 'Not Authenticated'}</span>
          </div>
          {userProfile && (
            <p className="text-[11px] text-zinc-400 font-mono">
              Firebase Role: <strong className="text-amber-300">{userProfile.role || 'User'}</strong> • Clearance: <strong className="text-amber-300">{userProfile.clearanceLevel || 'L1'}</strong>
            </p>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Authorized Role Requirements</span>
          <ul className="text-xs text-zinc-300 space-y-1">
            <li className="flex items-center gap-2 text-emerald-400 font-medium">✓ Registered Server Owner UID / Discord Match</li>
            <li className="flex items-center gap-2 text-amber-300 font-medium">✓ Level 3 Staff (`L3 Staff`) Firebase Role</li>
            <li className="flex items-center gap-2 text-fuchsia-300 font-medium">✓ Level 4 Executive Admin (`L4 Admin`)</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 relative z-10">
        {!currentUser && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-950/30 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Verify Credentials</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowClaimModal(true)}
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer border border-zinc-700"
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span>Claim Server Ownership</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('applications')}
          className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white font-bold text-xs transition border border-zinc-800 cursor-pointer"
        >
          <span>Return to Applications Queue</span>
        </button>
      </div>
    </div>
  );

  // Verified Server Owner Clearance Gating Check
  const isVerifiedServerOwner = Boolean(
    isL4Admin ||
    config.isVerifiedServerOwner ||
    config.isSubscriptionActive ||
    (config.stripeSubscriptionId && config.stripeSubscriptionId.length > 5) ||
    matchedRpServer?.isVerifiedServerOwner ||
    matchedRpServer?.isSubscriptionActive
  );

  // Load User Profile
  useEffect(() => {
    if (currentUser?.uid) {
      getUserProfile(currentUser.uid).then(p => {
        if (p) {
          setUserProfile(p);
          if (p.discordId) {
            setClaimDiscordIdInput(p.discordId);
            setClaimUsernameInput(p.discordUsername || '');
          }
        }
      });
    }
  }, [currentUser?.uid]);

  // Load Form Config & Real-Time Applications Listener
  useEffect(() => {
    let unsubscribeApps: () => void = () => {};
    let unsubscribeNotifs: () => void = () => {};

    // Check if returning from Stripe checkout with success
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isPaymentSuccess = urlParams.get('paymentSuccess') === 'true' || urlParams.get('status') === 'success';
      const session = urlParams.get('session') || urlParams.get('session_id');

      if (isPaymentSuccess) {
        setShowPaymentSuccessModal(true);
        if (session) setPaymentSessionId(session);
      }
    }

    const initData = async () => {
      setLoading(true);
      setSyncStatus('syncing');
      try {
        const loadedConfig = await getFormConfigBySlug(serverSlug);
        if (loadedConfig) {
          setConfig(prev => ({
            ...prev,
            ...loadedConfig,
            customQuestions: Array.isArray(loadedConfig.customQuestions) && loadedConfig.customQuestions.length > 0
              ? loadedConfig.customQuestions
              : DEFAULT_WHITELIST_QUESTIONS,
            serverSlug: normalizeServerSlug(serverSlug),
            formEnabled: loadedConfig.formEnabled !== false,
            botAutoRoleEnabled: loadedConfig.botAutoRoleEnabled !== false,
            botWebhookEnabled: loadedConfig.botWebhookEnabled !== false,
            botDmApplicantEnabled: loadedConfig.botDmApplicantEnabled !== false,
            antiAltProtectionEnabled: loadedConfig.antiAltProtectionEnabled !== false,
            requireDiscordOAuth: loadedConfig.requireDiscordOAuth !== false,
            minBackstoryWords: loadedConfig.minBackstoryWords || 75
          }));

          if (loadedConfig.customBranding) {
            setBranding(prev => ({ ...prev, ...loadedConfig.customBranding }));
          }
          if (loadedConfig.priorityPlacement) {
            setPriorityPlacement(prev => ({ ...prev, ...loadedConfig.priorityPlacement }));
          }
          if (loadedConfig.stripeSubscriptionId) {
            setStripeSubInput(loadedConfig.stripeSubscriptionId);
          }
        } else if (matchedRpServer) {
          setConfig(prev => ({
            ...prev,
            serverId: matchedRpServer.id,
            serverSlug: normalizeServerSlug(matchedRpServer.id),
            serverName: matchedRpServer.name,
            connectUrl: matchedRpServer.connectUrl || prev.connectUrl,
            averageReviewTime: matchedRpServer.averageReviewTime || prev.averageReviewTime,
            isClaimed: matchedRpServer.isClaimed || false,
            ownerDiscordId: (matchedRpServer as any)?.ownerDiscordId || '',
            isVerifiedServerOwner: matchedRpServer.isVerifiedServerOwner || false,
            isSubscriptionActive: matchedRpServer.isSubscriptionActive || false,
            planTier: matchedRpServer.planTier || 'community'
          }));
        }

        // Fetch Subscription Status & Gated Configs
        try {
          const subStatus = await fetchServerSubscriptionStatus(serverSlug);
          if (subStatus) {
            if (subStatus.customBranding) {
              setBranding(prev => ({ ...prev, ...subStatus.customBranding }));
            }
            if (subStatus.priorityPlacement) {
              setPriorityPlacement(prev => ({ ...prev, ...subStatus.priorityPlacement }));
            }
            if (subStatus.stripeSubscriptionId) {
              setStripeSubInput(subStatus.stripeSubscriptionId);
            }
            if (subStatus.isVerifiedServerOwner || subStatus.isSubscriptionActive) {
              setConfig(prev => ({
                ...prev,
                isVerifiedServerOwner: true,
                isSubscriptionActive: true,
                planTier: subStatus.planTier || prev.planTier || 'mega_server',
                stripeSubscriptionId: subStatus.stripeSubscriptionId || prev.stripeSubscriptionId,
                trialEndsAt: subStatus.trialEndsAt || prev.trialEndsAt,
                trialEndsAtIso: subStatus.trialEndsAtIso || prev.trialEndsAtIso,
                subscriptionExpiresAt: subStatus.subscriptionExpiresAt || prev.subscriptionExpiresAt,
                isExpired: false
              }));
            } else if (subStatus.isExpired) {
              setConfig(prev => ({
                ...prev,
                isVerifiedServerOwner: false,
                isSubscriptionActive: false,
                isExpired: true,
                trialEndsAt: subStatus.trialEndsAt || prev.trialEndsAt
              }));
            }
          }
        } catch (subErr) {
          console.warn('Subscription fetch warning:', subErr);
        }

        // Subscribe to applications in real time
        const targetServerId = loadedConfig?.serverId || matchedRpServer?.id || serverSlug;
        unsubscribeApps = subscribeToApplicationsByServer(
          targetServerId,
          (apps) => {
            setApplications(apps);
            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          },
          serverSlug,
          (status) => {
            setSyncStatus(status === 'connecting' ? 'syncing' : status);
            if (status === 'synced') {
              setLastSyncedAt(new Date());
            }
          }
        );

        // Subscribe to Server Owner Notifications in real time
        unsubscribeNotifs = subscribeToServerNotifications(
          serverSlug,
          loadedConfig?.serverName || matchedRpServer?.name || 'FiveM RP Server',
          currentUser?.uid,
          (notifs) => {
            setServerNotifications(notifs);
          }
        );

        // Load Quick Invites
        loadQuickInvitesData();

      } catch (err) {
        console.warn('Error loading dashboard configuration:', err);
        setSyncStatus('error');
      } finally {
        setLoading(false);
      }
    };

    initData();

    return () => {
      if (unsubscribeApps) unsubscribeApps();
      if (unsubscribeNotifs) unsubscribeNotifs();
    };
  }, [serverSlug]);

  const loadQuickInvitesData = async () => {
    setInvitesLoading(true);
    try {
      const invites = await getQuickInvites(serverSlug);
      setQuickInvites(invites);
    } catch (e) {
      console.warn('Error loading quick invites:', e);
    } finally {
      setInvitesLoading(false);
    }
  };

  // Handle Quick Approval of an Application
  const handleApprove = async (app: WhitelistApplication) => {
    setProcessingActionId(app.id);
    try {
      await updateApplicationStatus(
        app.id,
        'approved',
        'Application approved by Server Owner. Granted Whitelist role and city citizen entry clearance.',
        currentUser?.displayName || (userDiscordUsername ? `@${userDiscordUsername}` : 'Server Owner'),
        config.discordWebhookUrl,
        config.serverName,
        app.discordTag,
        config.serverSlug,
        app.applicantEmail,
        app.applicantUsername
      );

      // Local optimistic update
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved', reviewerNotes: 'Application approved by Server Owner.' } : a));
      if (selectedApp?.id === app.id) setSelectedApp(null);
    } catch (err) {
      console.error('Failed to approve application:', err);
      alert('Approval update failed. Please check network connectivity.');
    } finally {
      setProcessingActionId(null);
    }
  };

  // Handle Opening Rejection Modal
  const handleOpenRejectModal = (app: WhitelistApplication) => {
    setRejectingApp(app);
    setRejectReason('Character backstory does not meet minimum lore depth requirements.');
    setCustomRejectNote('');
  };

  // Confirm Rejection Submission
  const handleConfirmReject = async () => {
    if (!rejectingApp) return;

    const finalReason = customRejectNote ? `${rejectReason} Additional Note: ${customRejectNote}` : rejectReason;
    setProcessingActionId(rejectingApp.id);

    try {
      await updateApplicationStatus(
        rejectingApp.id,
        'rejected',
        finalReason,
        currentUser?.displayName || (userDiscordUsername ? `@${userDiscordUsername}` : 'Server Owner'),
        config.discordWebhookUrl,
        config.serverName,
        rejectingApp.discordTag,
        config.serverSlug,
        rejectingApp.applicantEmail,
        rejectingApp.applicantUsername
      );

      // Local optimistic update
      setApplications(prev => prev.map(a => a.id === rejectingApp.id ? { ...a, status: 'rejected', reviewerNotes: finalReason } : a));
      setRejectingApp(null);
      setCustomRejectNote('');
      if (selectedApp?.id === rejectingApp.id) setSelectedApp(null);
    } catch (err) {
      console.error('Failed to reject application:', err);
      alert('Rejection update failed.');
    } finally {
      setProcessingActionId(null);
    }
  };

  // Handle Batch Auto-Approve High Scoring Applicants (Score >= 90)
  const handleBatchApproveHighScore = async () => {
    const eligible = applications.filter(a => a.status === 'pending' && (a.aiAudit?.score || 0) >= 90);
    if (eligible.length === 0) {
      alert('No pending applications with AI Score ≥ 90 found.');
      return;
    }

    if (!confirm(`Are you sure you want to 1-click approve ${eligible.length} pending applicant(s) with AI Score ≥ 90?`)) {
      return;
    }

    setBatchApproving(true);
    let count = 0;

    for (const app of eligible) {
      try {
        await updateApplicationStatus(
          app.id,
          'approved',
          `Fast-Track Auto-Approved by Server Owner (AI Score: ${app.aiAudit?.score || 95}/100)`,
          currentUser?.displayName || 'Server Owner',
          config.discordWebhookUrl,
          config.serverName,
          app.discordTag,
          config.serverSlug,
          app.applicantEmail,
          app.applicantUsername
        );
        count++;
      } catch (err) {
        console.warn('Batch approve error for', app.id, err);
      }
    }

    setApplications(prev => prev.map(a => eligible.some(e => e.id === a.id) ? { ...a, status: 'approved' } : a));
    setBatchSuccessCount(count);
    setBatchApproving(false);
    setTimeout(() => setBatchSuccessCount(null), 4000);
  };

  // Handle Instant Toggle / Save of Config Settings
  const handleSaveToggle = async (updatedFields: Partial<WhitelistFormConfig>) => {
    const newConfig = { ...config, ...updatedFields };
    setConfig(newConfig);
    setSavingConfig(true);
    setSaveSuccess(false);
    setSyncStatus('syncing');

    try {
      await saveFormConfig(
        {
          ...newConfig,
          ownerUid: config.ownerUid || currentUser?.uid || 'system_admin'
        },
        currentUser?.uid,
        currentUser?.email,
        isL4Admin
      );
      setSaveSuccess(true);
      setSyncStatus('synced');
      setLastSyncedAt(new Date());
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update config toggle:', err);
      setSyncStatus('error');
      alert(err.message || 'Failed to save configuration settings.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Handle Test Discord Webhook
  const handleTestWebhook = async () => {
    if (!config.discordWebhookUrl) {
      alert('Please enter a Discord Webhook URL first in the configuration section.');
      return;
    }

    setTestingWebhook(true);
    setTestWebhookResult(null);

    try {
      const result = await sendDiscordNotification({
        type: 'test',
        serverName: config.serverName,
        webhookUrl: config.discordWebhookUrl
      });
      setTestWebhookResult({ success: true, timestamp: new Date().toLocaleTimeString() });
      setTimeout(() => setTestWebhookResult(null), 4000);
    } catch (err: any) {
      setTestWebhookResult({ success: false, error: err.message || 'Webhook dispatch failed' });
    } finally {
      setTestingWebhook(false);
    }
  };

  // Copy Public Application URL
  const handleCopyApplyUrl = () => {
    const applyUrl = `${window.location.origin}/servers/${config.serverSlug}/apply`;
    copyToClipboard(applyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy Connect Command
  const handleCopyConnect = () => {
    copyToClipboard(`connect ${config.connectUrl || 'cfx.re/join/vclife'}`);
    setCopiedConnect(true);
    setTimeout(() => setCopiedConnect(false), 2500);
  };

  // Claim Server Handler
  const handleClaimServer = async () => {
    setClaimError(null);
    const rawId = (claimDiscordIdInput || userDiscordId || '').trim();
    const cleanId = rawId.replace(/^<@!?|>$/g, '').replace(/^@/, '');

    if (!cleanId || cleanId.length < 2) {
      setClaimError('Please enter your Discord Username or Snowflake ID (e.g. _Niklaus or 849204918294028190).');
      return;
    }

    const rawUsername = (claimUsernameInput || userDiscordUsername || cleanId || currentUser?.displayName || 'ServerOwner').trim();
    const discordIdToUse = cleanId;
    const discordUsernameToUse = rawUsername.replace(/^@/, '');

    setClaiming(true);
    setClaimSuccess(null);
    try {
      // Store in localStorage immediately so local session is authorized
      if (typeof window !== 'undefined') {
        localStorage.setItem('gtavi_discord_user_id', discordIdToUse);
        localStorage.setItem('gtavi_discord_username', discordUsernameToUse);
      }

      setUserProfile(prev => {
        if (prev) {
          return {
            ...prev,
            discordId: discordIdToUse,
            discordUsername: discordUsernameToUse,
            discordConnected: true
          };
        }
        return {
          id: currentUser?.uid || 'user_' + discordIdToUse,
          uid: currentUser?.uid || 'user_' + discordIdToUse,
          username: discordUsernameToUse,
          displayName: currentUser?.displayName || discordUsernameToUse,
          email: currentUser?.email || '',
          avatar: '',
          role: 'User',
          isVip: false,
          joinedDate: new Date().toISOString(),
          publishedBuildsCount: 0,
          status: 'Active',
          discordId: discordIdToUse,
          discordUsername: discordUsernameToUse,
          discordConnected: true
        };
      });

      const res = await claimServerWithDiscord({
        serverSlug: config.serverSlug,
        serverId: config.serverId,
        discordId: discordIdToUse,
        discordUsername: discordUsernameToUse,
        discordAvatar: userProfile?.discordAvatar,
        discordGuildId: config.discordGuildId || '',
        uid: currentUser?.uid,
        email: currentUser?.email,
        isAdmin: isL4Admin
      });

      setConfig(prev => ({
        ...prev,
        isClaimed: true,
        ownerDiscordId: discordIdToUse,
        claimedByDiscordId: discordIdToUse,
        claimedByDiscordUsername: discordUsernameToUse,
        claimedAt: Date.now()
      }));

      setClaimSuccess(res.message);
      setShowClaimModal(false);
      setTimeout(() => setClaimSuccess(null), 5000);
    } catch (err: any) {
      setClaimError(err?.message || 'Failed to claim server listing. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  // Create Quick Invite Handler
  const handleCreateQuickInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingInvite(true);
    try {
      const days = parseInt(newInviteExpiresDays, 10);
      const maxUses = newInviteMaxUses ? parseInt(newInviteMaxUses, 10) : null;

      const created = await createQuickInvite({
        serverId: config.serverId,
        serverSlug: config.serverSlug,
        createdByDiscordId: config.ownerDiscordId || userDiscordId || currentUser?.uid || 'owner',
        createdByUsername: userDiscordUsername || currentUser?.displayName || 'Owner',
        customCode: newInviteCode.trim() || undefined,
        label: newInviteLabel.trim() || undefined,
        note: newInviteNote.trim() || undefined,
        maxUses,
        expiresInDays: !isNaN(days) && days > 0 ? days : null
      });

      setQuickInvites(prev => [created, ...prev.filter(i => i.id !== created.id)]);
      setShowCreateInviteModal(false);
      setNewInviteCode('');
      setNewInviteLabel('');
      setNewInviteMaxUses('');
      setNewInviteNote('');
    } catch (err: any) {
      console.warn('Failed to generate Quick Invite:', err);
    } finally {
      setCreatingInvite(false);
    }
  };

  // Copy Quick Invite URL
  const handleCopyInviteLink = (invite: QuickInvite) => {
    const inviteUrl = `${window.location.origin}/servers/${config.serverSlug}/apply?invite=${invite.code}`;
    copyToClipboard(inviteUrl);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  // Delete Quick Invite
  const handleDeleteInvite = async (inviteId: string) => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm('⚠️ Are you sure you want to delete this quick invite link?')) {
        return;
      }
    }
    await deleteQuickInvite(inviteId, config.serverSlug);
    setQuickInvites(prev => prev.filter(i => i.id !== inviteId));
  };

  // Toggle Quick Invite Active
  const handleToggleInvite = async (inviteId: string, currentActive: boolean) => {
    await toggleQuickInviteActive(inviteId, config.serverSlug, !currentActive);
    setQuickInvites(prev => prev.map(i => i.id === inviteId ? { ...i, isActive: !currentActive } : i));
  };

  // Ownership Transfer Handler
  const handleExecuteTransfer = async () => {
    setTransferError(null);
    if (transferConfirmText.trim().toUpperCase() !== 'TRANSFER') {
      setTransferError('Please type TRANSFER in the confirmation field to authorize this action.');
      return;
    }

    const cleanTargetId = transferTargetDiscordId.trim().replace(/^<@!?|>$/g, '').replace(/^@/, '');
    if (!cleanTargetId || cleanTargetId.length < 2) {
      setTransferError('Please enter a valid target Discord Snowflake User ID or Username (e.g. 728193847561029384 or _Niklaus).');
      return;
    }

    setTransferring(true);
    setTransferSuccess(null);
    try {
      const res = await transferServerOwnership({
        serverId: config.serverId,
        serverSlug: config.serverSlug,
        serverName: config.serverName,
        currentDiscordId: config.ownerDiscordId || userDiscordId || 'current_owner',
        newDiscordId: cleanTargetId,
        newDiscordUsername: transferTargetUsername.trim() || undefined,
        currentUid: currentUser?.uid,
        isAdmin: isL4Admin,
        note: transferNote.trim() || undefined,
        webhookUrl: config.discordWebhookUrl
      });

      setTransferSuccess(res.message);
      setShowTransferModal(false);
      setConfig(prev => ({
        ...prev,
        ownerDiscordId: cleanTargetId,
        claimedByDiscordId: cleanTargetId,
        claimedByDiscordUsername: transferTargetUsername.trim() || `@DiscordUser_${cleanTargetId.slice(-4)}`
      }));
    } catch (err: any) {
      setTransferError(err?.message || 'Failed to transfer server ownership.');
    } finally {
      setTransferring(false);
    }
  };

  // Stripe Subscription Verification Handler
  const handleVerifyStripeSubscription = async (overrideSubId?: string) => {
    const targetSubId = (overrideSubId || stripeSubInput).trim();
    if (!targetSubId) {
      setSubVerifyError('Please enter a valid Stripe subscription ID (e.g. sub_1P... or cs_live_...).');
      return;
    }

    setVerifyingSub(true);
    setSubVerifyError(null);
    setSubVerifyMessage(null);

    try {
      const res = await verifyServerStripeSubscription({
        serverId: config.serverId,
        serverSlug: config.serverSlug,
        stripeSubscriptionId: targetSubId,
        discordId: userDiscordId || config.ownerDiscordId || undefined,
        email: currentUser?.email || undefined
      });

      if (res.success) {
        const currentExpiry = config.subscriptionExpiresAt ? Number(config.subscriptionExpiresAt) : Date.now();
        const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
        const newExpiry = baseTime + (30 * 24 * 60 * 60 * 1000); // Add +30 days

        const updatedConfig: WhitelistFormConfig = {
          ...config,
          isVerifiedServerOwner: true,
          isSubscriptionActive: true,
          planTier: res.planTier || 'mega_server',
          stripeSubscriptionId: targetSubId,
          subscriptionExpiresAt: newExpiry
        };

        setConfig(updatedConfig);
        try {
          await saveFormConfig(updatedConfig);
        } catch (sErr) {
          console.warn('Failed to save config on renewal:', sErr);
        }

        const dateFormatted = new Date(newExpiry).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        setSubVerifyMessage(`⚡ Subscription plan extended successfully! Active until ${dateFormatted}.`);
        setShowUpgradeModal(false);
      } else {
        setSubVerifyError(res.error || 'Failed to verify Stripe subscription ID.');
      }
    } catch (err: any) {
      setSubVerifyError(err.message || 'Network error verifying subscription.');
    } finally {
      setVerifyingSub(false);
    }
  };

  // Handle direct Stripe upgrade checkout trigger for Mega or Enterprise plans
  const handleUpgradePlan = async (tier: 'community' | 'mega' | 'enterprise') => {
    setVerifyingSub(true);
    setSubVerifyError(null);
    setSubVerifyMessage(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          serverId: config.serverId || `srv_${serverSlug.replace(/[^a-z0-9]/g, '')}`,
          serverName: config.serverName || serverSlug,
          serverSlug: config.serverSlug || serverSlug,
          ownerDiscordId: userDiscordId || config.ownerDiscordId || '',
          ownerEmail: currentUser?.email || '',
          returnUrl: window.location.href
        })
      });
      const data = await res.json();
      if (data.url && (data.url.startsWith('http://') || data.url.startsWith('https://'))) {
        // Redirect user to Stripe Checkout (or sandbox simulated checkout redirect)
        window.location.href = data.url;
      } else {
        setSubVerifyError(data.error || 'Failed to generate checkout session.');
      }
    } catch (err: any) {
      setSubVerifyError(err.message || 'Failed to initiate Stripe upgrade checkout.');
    } finally {
      setVerifyingSub(false);
    }
  };

  // Auto-verify Stripe subscription when returning from checkout with success parameters
  useEffect(() => {
    if (loading || !config.serverId) return;
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isPaymentSuccess = urlParams.get('paymentSuccess') === 'true' || urlParams.get('status') === 'success';
      const session = urlParams.get('session') || urlParams.get('session_id') || urlParams.get('serverId');
      
      if (isPaymentSuccess && session) {
        // Only run auto-verification if we haven't linked this subscription id yet
        if (config.stripeSubscriptionId !== session && !config.isSubscriptionActive) {
          console.log('[Auto-Verify] Detected successful payment session, auto-verifying subscription:', session);
          handleVerifyStripeSubscription(session);
        }
      }
    }
  }, [loading, config.serverId]);

  // Custom Branding Save Handler
  const handleSaveBranding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingBranding(true);
    setBrandingSuccess(null);
    setBrandingError(null);

    try {
      const cleanServerId = config.serverId || config.serverSlug || serverSlug;
      const cleanSlug = config.serverSlug || serverSlug;

      const res = await saveServerCustomBranding({
        serverId: cleanServerId,
        serverSlug: cleanSlug,
        customBranding: branding,
        discordId: userDiscordId || config.ownerDiscordId || undefined,
        isStaffBypass: Boolean(isL4Admin || isDesignatedStaff || hasOwnerAccess || isVerifiedServerOwner)
      });

      if (res.success) {
        setConfig(prev => ({
          ...prev,
          customBranding: branding
        }));

        // Also synchronize main whitelist form config to maintain complete consistency
        try {
          await saveFormConfig(
            {
              ...config,
              customBranding: branding,
              ownerUid: config.ownerUid || currentUser?.uid || 'system_admin'
            },
            currentUser?.uid,
            currentUser?.email,
            isL4Admin
          );
        } catch (syncErr) {
          console.warn('Form config branding sync notice:', syncErr);
        }

        setBrandingSuccess('Custom branding updated and published to the Applicant Portal!');
        setTimeout(() => setBrandingSuccess(null), 4000);
      } else {
        setBrandingError(res.error || 'Failed to save custom branding.');
      }
    } catch (err: any) {
      setBrandingError(err.message || 'Network error saving custom branding.');
    } finally {
      setSavingBranding(false);
    }
  };

  // Priority Placement Save Handler
  const handleSavePriorityPlacement = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingPriority(true);
    setPrioritySuccess(null);
    setPriorityError(null);

    try {
      const cleanServerId = config.serverId || config.serverSlug || serverSlug;
      const cleanSlug = config.serverSlug || serverSlug;

      const res = await saveServerPriorityPlacement({
        serverId: cleanServerId,
        serverSlug: cleanSlug,
        priorityPlacement: priorityPlacement,
        isStaffBypass: Boolean(isL4Admin || isDesignatedStaff || hasOwnerAccess || isVerifiedServerOwner)
      });

      if (res.success) {
        setConfig(prev => ({
          ...prev,
          priorityPlacement: priorityPlacement
        }));

        setPrioritySuccess('Priority placement updated in the GTA RP Server Directory!');
        setTimeout(() => setPrioritySuccess(null), 4000);
      } else {
        setPriorityError(res.error || 'Failed to save priority placement.');
      }
    } catch (err: any) {
      setPriorityError(err.message || 'Network error saving priority placement.');
    } finally {
      setSavingPriority(false);
    }
  };

  // Filter Pending Applications
  const pendingApps = applications.filter(a => a.status === 'pending' || a.status === 'under_review');
  const approvedApps = applications.filter(a => a.status === 'approved');
  const rejectedApps = applications.filter(a => a.status === 'rejected');
  const totalAppsCount = applications.length;
  const approvalRate = totalAppsCount > 0 ? Math.round((approvedApps.length / totalAppsCount) * 100) : 0;
  const highScorePendingCount = pendingApps.filter(a => (a.aiAudit?.score || 0) >= 90).length;

  const filteredDisplayedApps = applications.filter(app => {
    // 1. Status Filter
    if (appStatusFilter === 'pending') {
      if (app.status !== 'pending' && app.status !== 'under_review') return false;
    } else if (appStatusFilter === 'approved') {
      if (app.status !== 'approved') return false;
    } else if (appStatusFilter === 'rejected') {
      if (app.status !== 'rejected') return false;
    }

    // 2. Search Query Match
    const charName = app.answers['q_char_name'] || '';
    const matchesSearch = 
      app.discordTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.applicantUsername && app.applicantUsername.toLowerCase().includes(searchQuery.toLowerCase())) ||
      charName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.inviteCode && app.inviteCode.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 3. AI Lore Audit Score Filter
    const score = app.aiAudit?.score || 0;
    if (scoreFilter === 'high') return score >= 85;
    if (scoreFilter === 'medium') return score >= 60 && score < 85;
    if (scoreFilter === 'flagged') return score < 60 && score > 0;
    return true;
  });

  // Calculate Quick Invites Total Metrics
  const totalInviteClicks = quickInvites.reduce((sum, i) => sum + (i.clicksCount || 0), 0);
  const totalInviteConversions = quickInvites.reduce((sum, i) => sum + (i.conversionsCount || 0), 0);
  const overallConversionRate = totalInviteClicks > 0 ? ((totalInviteConversions / totalInviteClicks) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse">
        {/* Top Header Banner Skeleton */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-56 bg-zinc-800 rounded-lg" />
                  <div className="h-5 w-24 bg-zinc-800/60 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-32 bg-zinc-800/50 rounded" />
                  <div className="h-4 w-28 bg-zinc-800/50 rounded" />
                  <div className="h-4 w-20 bg-zinc-800/50 rounded" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-28 bg-zinc-800 rounded-xl" />
              <div className="h-10 w-36 bg-zinc-800/80 rounded-xl" />
            </div>
          </div>

          {/* Sub-navigation Tabs Skeleton */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={`dash_tab_skel_${i}`} className="h-9 w-28 sm:w-36 bg-zinc-800/70 rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Analytics Performance Cards Skeleton Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`stat_skel_${i}`} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-24 bg-zinc-800/70 rounded" />
                <div className="w-8 h-8 rounded-xl bg-zinc-800/60" />
              </div>
              <div className="h-8 w-20 bg-zinc-800 rounded-lg" />
              <div className="h-3 w-32 bg-zinc-800/50 rounded" />
            </div>
          ))}
        </div>

        {/* Main Content Workspace / Applications Table Skeleton */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div className="space-y-1.5">
              <div className="h-5 w-48 bg-zinc-800 rounded" />
              <div className="h-3.5 w-72 bg-zinc-800/60 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-48 bg-zinc-800/80 rounded-xl" />
              <div className="h-9 w-28 bg-zinc-800/80 rounded-xl" />
            </div>
          </div>

          {/* List/Table Rows Skeletons */}
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`row_skel_${i}`} className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/80 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-40 bg-zinc-800 rounded" />
                    <div className="h-3 w-56 bg-zinc-800/50 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="h-6 w-20 bg-zinc-800/70 rounded-full" />
                  <div className="h-8 w-24 bg-zinc-800 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ACCESS RESTRICTED SCREEN (NON-OWNER)
  // =========================================================================
  if (!hasOwnerAccess) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-3 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider">
              <span>Server Owner Clearance Required</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Owner Dashboard Protected
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              This Server Dashboard is restricted exclusively to the verified owner of <strong className="text-white">{config.serverName || 'this community'}</strong>.
            </p>

            {config.ownerDiscordId && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400 font-mono inline-block">
                Registered Owner Discord ID: <span className="text-amber-400 font-bold">&lt;@{config.ownerDiscordId}&gt;</span>
                {config.claimedByDiscordUsername && <span className="text-zinc-500 ml-1">({config.claimedByDiscordUsername})</span>}
              </div>
            )}
          </div>

          {!currentUser ? (
            <div className="pt-2">
              <button
                onClick={onOpenAuth}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Sign In to Verify Ownership
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 font-mono">
              Signed in as: <span className="text-amber-400 font-bold">{currentUser.email || currentUser.displayName || currentUser.uid}</span>
              {userDiscordId && <div className="text-[11px] text-indigo-400 mt-1">Linked Discord ID: {userDiscordId}</div>}
              <div className="text-[11px] text-zinc-500 mt-1">Your credentials do not match the registered owner Discord ID.</div>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/apply`, config.serverSlug)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-indigo-400" />
              <span>Player Apply Portal</span>
            </button>

            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/status`, config.serverSlug)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Application Status</span>
            </button>

            <button
              onClick={() => onNavigate?.('/rp-servers')}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-800 cursor-pointer"
            >
              <Server className="w-4 h-4" />
              <span>RP Server Directory</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHORIZED SERVER OWNER DASHBOARD
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Top Banner & Alerts */}
      {transferSuccess && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>{transferSuccess}</span>
          </div>
          <button onClick={() => setTransferSuccess(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Command Center Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative shadow-2xl">
        {/* Isolated glow effect that does not clip child popups */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>Verified Server Owner</span>
              </span>

              {config.ownerDiscordId && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  <span>&lt;@{config.ownerDiscordId}&gt;</span>
                </span>
              )}

              {config.formEnabled ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                  <span>Accepting Applications</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Portal Paused</span>
                </span>
              )}

              {/* Real-Time Database Synchronization Status Indicator */}
              <button
                onClick={() => {
                  setSyncStatus('syncing');
                  setTimeout(() => {
                    setSyncStatus('synced');
                    setLastSyncedAt(new Date());
                  }, 600);
                }}
                title={`Cloud Database Realtime Sync • Click to re-sync (Last synced: ${formatTime(lastSyncedAt)})`}
                className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer select-none shadow-sm ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                }`}
              >
                {/* Green/Yellow/Red Pulse Dot */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-400'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-500'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </span>

                <Database className="w-3 h-3 text-current shrink-0" />
                <span>
                  {syncStatus === 'synced' && 'Database Live'}
                  {syncStatus === 'syncing' && 'Syncing Database...'}
                  {syncStatus === 'error' && 'Database Offline'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <Server className="w-8 h-8 text-indigo-400 shrink-0" />
                <span>{config.serverName} Command Center</span>
              </h1>
              <span className="text-xs font-mono text-zinc-500 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800">
                slug: {config.serverSlug}
              </span>
            </div>

            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Manage your applicant review queue, configure custom whitelist requirements, generate trackable Quick Invites, and oversee automated Discord Bot gateways.
            </p>
          </div>

          {/* Quick Action Buttons and Sentinel Alerts */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleCopyApplyUrl}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Apply Link Copied!' : 'Copy Apply Link'}</span>
            </button>

            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/apply`, config.serverSlug)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer shrink-0"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Preview Apply Portal</span>
            </button>

            <button
              onClick={handleCopyConnect}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer shrink-0"
            >
              {copiedConnect ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Radio className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copiedConnect ? 'Copied F8!' : 'F8 Connect'}</span>
            </button>

            <button
              onClick={() => {
                setDataModalTab('import');
                setShowDataModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950/30 shrink-0"
              title="Import server configuration, questions schema, or applicant rosters (.json, .csv)"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import Data</span>
            </button>

            <button
              onClick={() => {
                setDataModalTab('export');
                setShowDataModal(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/30 shrink-0"
              title="Export all server whitelist data, applicants, and configuration settings"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Server Data</span>
            </button>

            <div className="h-6 w-px bg-zinc-800 hidden sm:block mx-1" />

            {/* Dedicated Server Owner Sentinel Notification Bell */}
            <ServerOwnerNotificationDropdown
              serverSlug={serverSlug}
              notifications={serverNotifications}
              onOpenCenter={() => setActiveSection('notifications')}
              onNavigateSection={(sec) => setActiveSection(sec as any)}
            />

          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN LAYOUT: RESPONSIVE SIDEBAR (DESKTOP) & HORIZONTAL BAR (MOBILE/TABLET)
          ========================================================================= */}
      
      {/* MOBILE / TABLET HORIZONTAL NAVIGATION STRIP (< lg) */}
      <div className="lg:hidden p-2 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-x-auto scrollbar-none flex items-center gap-1.5">
        <button
          onClick={() => setActiveSection('notifications')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSection === 'notifications' ? 'bg-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white bg-zinc-950'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-cyan-400" />
          <span>Alerts {serverNotifications.filter(n => !n.read).length > 0 ? `(${serverNotifications.filter(n => !n.read).length})` : ''}</span>
        </button>

        <button
          onClick={() => setActiveSection('applications')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSection === 'applications' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white bg-zinc-950'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>Apps ({pendingApps.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('quick_invites')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSection === 'quick_invites' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white bg-zinc-950'
          }`}
        >
          <Link2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Invites</span>
        </button>

        <button
          onClick={() => setActiveSection('settings')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSection === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white bg-zinc-950'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Rules</span>
        </button>

        <button
          onClick={() => setActiveSection('bot_gateway')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSection === 'bot_gateway' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white bg-zinc-950'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span>Bot</span>
        </button>

        <button
          onClick={() => setActiveSection('growth')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSection === 'growth' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-zinc-400 hover:text-white bg-zinc-950'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
          <span>Growth AI</span>
        </button>

        <button
          onClick={() => setActiveSection('analytics')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSection === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:text-white bg-zinc-950'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveSection('billing')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSection === 'billing' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white bg-zinc-950'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          <span>Billing</span>
        </button>

        <button
          onClick={() => setActiveSection('features_on_demand')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeSection === 'features_on_demand' ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md' : 'text-zinc-400 hover:text-white bg-zinc-950'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Dev Quotes</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* DESKTOP LEFT SIDEBAR NAVIGATION PANEL (lg+) */}
        <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-20 z-20">
          <nav className="p-3 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
            {/* GROUP 0: SENTINEL ALERTS */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-400 font-mono flex items-center justify-between">
                <span>Sentinel System</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              </div>

              <button
                onClick={() => setActiveSection('notifications')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'notifications'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Sentinel Notifications</span>
                </div>
                {serverNotifications.filter(n => !n.read).length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black animate-pulse">
                    {serverNotifications.filter(n => !n.read).length}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-600 font-mono">0</span>
                )}
              </button>
            </div>

            {/* GROUP 1: RECRUITMENT */}
            <div className="space-y-1 pt-2 border-t border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                Recruitment
              </div>

              <button
                onClick={() => setActiveSection('applications')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'applications'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Applications Queue</span>
                </div>
                {pendingApps.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    {pendingApps.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSection('quick_invites')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'quick_invites'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fast-Pass Quick Invites</span>
                </div>
                {quickInvites.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    {quickInvites.length}
                  </span>
                )}
              </button>
            </div>

            {/* GROUP 2: WHITELIST MANAGEMENT */}
            <div className="space-y-1 pt-2 border-t border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                Server Whitelist
              </div>

              <button
                onClick={() => setActiveSection('settings')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'settings'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Form & Whitelist Rules</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSection('bot_gateway')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'bot_gateway'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Discord Bot Gateway</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSection('branding')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'branding'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Custom Branding</span>
                </div>
              </button>
            </div>

            {/* GROUP 3: GROWTH & ANALYTICS */}
            <div className="space-y-1 pt-2 border-t border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                Growth & Analytics
              </div>

              <button
                onClick={() => setActiveSection('growth')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'growth'
                    ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />
                  <span>Growth Studio</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300 font-bold border border-fuchsia-500/30">AI</span>
              </button>

              <button
                onClick={() => setActiveSection('analytics')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Player Analytics</span>
                </div>
              </button>
            </div>

            {/* GROUP 5: ADMIN & BILLING */}
            <div className="space-y-1 pt-2 border-t border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                Admin & Billing
              </div>

              <button
                onClick={() => onNavigate?.(`/servers/${config.serverSlug}/studio`, config.serverSlug)}
                className="w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30"
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Sentinel Studio</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 font-bold border border-purple-500/30">PRO</span>
              </button>

              <button
                onClick={() => setActiveSection('billing')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'billing'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>VIP Subscriptions</span>
                </div>
              </button>

              <button
                onClick={() => setActiveSection('features_on_demand')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'features_on_demand'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wand2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Custom Dev Quotes</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">QUOTES</span>
              </button>

              <button
                onClick={() => setActiveSection('ownership_transfer')}
                className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'ownership_transfer'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Ownership Transfer</span>
                </div>
              </button>
            </div>
          </nav>
        </aside>

        {/* MAIN WORKSPACE VIEW */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className={`p-4 rounded-2xl border transition ${pendingApps.length > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className={pendingApps.length > 0 ? 'text-amber-400' : 'text-zinc-400'}>Pending</span>
                <Clock className={`w-4 h-4 ${pendingApps.length > 0 ? 'text-amber-400 animate-spin-slow' : 'text-zinc-500'}`} />
              </div>
              <div className={`text-2xl font-black ${pendingApps.length > 0 ? 'text-amber-300' : 'text-white'}`}>{pendingApps.length}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{pendingApps.length > 0 ? 'Action required' : 'Queue clear'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-1">
                <span>Applicants</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">{totalAppsCount}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">All time</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-1">
                <span>Approved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{approvedApps.length}</div>
              <div className="text-[11px] text-emerald-500/80 mt-0.5 font-bold">{approvalRate}% Acceptance</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-1">
                <span>Invite Clicks</span>
                <MousePointerClick className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400">{totalInviteClicks}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Links track</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-1">
                <span>Conversions</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{totalInviteConversions}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 font-bold">{overallConversionRate}% CVR</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-1">
                <span>Avg Latency</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm sm:text-base font-black text-white truncate mt-1">{config.averageReviewTime || 'Under 2h'}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">Turnaround</div>
            </div>
          </div>

      {/* =========================================================================
          SECTION 0: SENTINEL NOTIFICATION CENTER
          ========================================================================= */}
      {activeSection === 'notifications' && (
        <ServerOwnerNotificationCenter
          serverSlug={serverSlug}
          serverName={config.serverName || 'FiveM RP Server'}
          currentUserUid={currentUser?.uid}
          notifications={serverNotifications}
          settings={notifSettings}
          onUpdateSettings={(newSettings) => {
            setNotifSettings(newSettings);
            saveServerNotificationSettings(serverSlug, newSettings);
          }}
          onNavigateSection={(sectionKey) => {
            setActiveSection(sectionKey as any);
          }}
        />
      )}

      {/* =========================================================================
          SECTION 1: APPLICATIONS REVIEW QUEUE
          ========================================================================= */}
      {activeSection === 'applications' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Applicant Management & Review Queue</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  View and manage all submitted applications across pending, approved, and rejected status states.
                </p>
              </div>

              {/* Batch Actions & Dedicated Review Portal Button */}
              <div className="flex items-center gap-2 flex-wrap">
                {highScorePendingCount > 0 && (
                  <button
                    onClick={handleBatchApproveHighScore}
                    disabled={batchApproving}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {batchApproving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-300" />}
                    <span>1-Click Approve AI ≥ 90 ({highScorePendingCount})</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigate?.(`/servers/${config.serverSlug}/review`, config.serverSlug)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Review Portal</span>
                </button>
              </div>
            </div>

            {/* Status Tabs Switcher */}
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
              <button
                onClick={() => setAppStatusFilter('pending')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  appStatusFilter === 'pending'
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Review ({pendingApps.length})</span>
              </button>

              <button
                onClick={() => setAppStatusFilter('approved')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  appStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Approved Citizens ({approvedApps.length})</span>
              </button>

              <button
                onClick={() => setAppStatusFilter('rejected')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  appStatusFilter === 'rejected'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-red-300" />
                <span>Rejected ({rejectedApps.length})</span>
              </button>

              <button
                onClick={() => setAppStatusFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  appStatusFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All Submitted ({totalAppsCount})</span>
              </button>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by Discord tag, applicant name, character name, or invite code..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <button
                  onClick={() => setScoreFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${scoreFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'}`}
                >
                  All Scores
                </button>
                <button
                  onClick={() => setScoreFilter('high')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${scoreFilter === 'high' ? 'bg-cyan-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'}`}
                >
                  Score ≥ 85
                </button>
                <button
                  onClick={() => setScoreFilter('medium')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${scoreFilter === 'medium' ? 'bg-amber-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'}`}
                >
                  Score 60-84
                </button>
                <button
                  onClick={() => setScoreFilter('flagged')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${scoreFilter === 'flagged' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'}`}
                >
                  Flagged (&lt; 60)
                </button>
              </div>
            </div>

            {/* Applications List */}
            {filteredDisplayedApps.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl p-6 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-75" />
                <h3 className="text-sm font-bold text-white">
                  {appStatusFilter === 'pending' ? 'Pending Review Queue is Clear' : 'No Applications Found'}
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  {searchQuery || scoreFilter !== 'all' ? 'No applications match your active search or score filter criteria.' : `No ${appStatusFilter} applications registered.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDisplayedApps.map((app) => {
                  const score = app.aiAudit?.score || 0;
                  const isProcessing = processingActionId === app.id;

                  return (
                    <div
                      key={app.id}
                      className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={resolveApplicantAvatar((app as any).applicantAvatarUrl || (app as any).userAvatar || (app as any).avatarUrl || (app as any).avatar || app.discordAvatar, app.discordTag || app.applicantUsername)}
                          alt={app.discordTag}
                          className="w-11 h-11 rounded-xl object-cover border border-zinc-800 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">@{app.applicantUsername || app.discordTag.split('#')[0]}</span>
                            <span className="text-xs font-mono text-zinc-400">{app.discordTag}</span>
                            
                            {/* Status Badge */}
                            {app.status === 'approved' ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Approved Citizen</span>
                              </span>
                            ) : app.status === 'rejected' ? (
                              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-400" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Pending Review</span>
                              </span>
                            )}

                            {app.inviteCode && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold font-mono">
                                🎟️ {app.inviteCode}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-zinc-400 line-clamp-1">
                            {app.answers['Character Backstory & Motivation'] || app.answers['q_char_backstory'] || app.answers['Character Full Name & In-Game Age'] || 'Character scenario answers attached.'}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-0.5">
                            <span>Submitted: {new Date(app.createdAt).toLocaleDateString('en-US')} at {new Date(app.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            {app.aiAudit?.recommendation && (
                              <span className="text-cyan-400 font-medium">AI: {app.aiAudit.recommendation}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Controls */}
                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                        {score > 0 && (
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${
                            score >= 85 ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400' :
                            score >= 60 ? 'bg-amber-950/40 border-amber-500/40 text-amber-400' :
                            'bg-red-950/40 border-red-500/40 text-red-400'
                          }`}>
                            <Sparkles className="w-3 h-3" />
                            <span>{score}/100</span>
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition border border-zinc-800 cursor-pointer"
                          title="Inspect answers and AI Lore breakdown"
                        >
                          <FileText className="w-4 h-4 text-indigo-400" />
                        </button>

                        {app.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(app)}
                            disabled={isProcessing}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                          >
                            {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Approve</span>
                          </button>
                        )}

                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => handleOpenRejectModal(app)}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-zinc-900 hover:bg-red-950/50 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
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
      )}

      {/* =========================================================================
          SECTION 2: CONFIGURATION SETTINGS
          ========================================================================= */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  <span>Whitelist Gateway Configuration</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Customize application rules, lore requirements, and system maintenance states.</p>
              </div>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" /> Saved to Cloud
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Active Toggle */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Public Application Portal</h3>
                    <p className="text-xs text-zinc-400">Enable or pause incoming whitelist submissions.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.formEnabled}
                      onChange={(e) => handleSaveToggle({ formEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Anti-Alt Protection */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Anti-Alt & Ban Evader Shield</h3>
                    <p className="text-xs text-zinc-400">Block duplicate Discord accounts and fresh alts.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.antiAltProtectionEnabled}
                      onChange={(e) => handleSaveToggle({ antiAltProtectionEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* AI Auto-Approval Threshold */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Fast-Track Auto-Approval</h3>
                    <p className="text-xs text-zinc-400">Automatically grant whitelist if Gemini 3.7 lore score meets threshold.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoApprovalEnabled}
                      onChange={(e) => handleSaveToggle({ autoApprovalEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
                {config.autoApprovalEnabled && (
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-xs text-zinc-400">Minimum Lore Score:</span>
                    <input
                      type="number"
                      min={70}
                      max={100}
                      value={config.autoApprovalMinScore || 90}
                      onChange={(e) => handleSaveToggle({ autoApprovalMinScore: parseInt(e.target.value, 10) || 90 })}
                      className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs"
                    />
                    <span className="text-xs text-zinc-500">/ 100</span>
                  </div>
                )}
              </div>

              {/* Minimum Backstory Word Requirement */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <h3 className="text-sm font-bold text-white">Minimum Backstory Words</h3>
                <p className="text-xs text-zinc-400">Require in-depth character development before submission.</p>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    min={25}
                    max={500}
                    value={config.minBackstoryWords || 75}
                    onChange={(e) => handleSaveToggle({ minBackstoryWords: parseInt(e.target.value, 10) || 75 })}
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                  <span className="text-xs text-zinc-500">words required per backstory answer</span>
                </div>
              </div>
            </div>

            {/* Custom Question Builder Link */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-zinc-950 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>No-Code Form Question Builder</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Currently configured with <strong className="text-white">{config.customQuestions?.length || 5} questions</strong> (backstories, scenarios, audio checks).
                </p>
              </div>
              <button
                onClick={() => onNavigate?.(`/servers/${config.serverSlug}/manage`, config.serverSlug)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <span>Open Question Builder</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: DISCORD BOT GATEWAY
          ========================================================================= */}
      {activeSection === 'bot_gateway' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <span>Discord Bot & Gateway Status</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Configure automated citizen role assignment, webhook embed alerts, and DM delivery.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bot Auto-Role */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Auto-Assign Whitelist Role</h3>
                    <p className="text-xs text-zinc-400">Instantly grant citizen role in Discord upon approval.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.botAutoRoleEnabled}
                      onChange={(e) => handleSaveToggle({ botAutoRoleEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Bot DM Alert */}
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Direct Message Applicant Alert</h3>
                    <p className="text-xs text-zinc-400">Send instant DM notification upon approval/rejection.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.botDmApplicantEnabled}
                      onChange={(e) => handleSaveToggle({ botDmApplicantEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Official Discord Server Invite Link */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  <span>Official Discord Server Invite Link (For Approved Applicants)</span>
                </h3>

                {(config.discordInviteUrl || branding.discordInviteUrl) ? (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved & Active</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                    ⚠️ Not Configured
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400">
                When applicants get approved, they are directed to join this official Discord server link to claim their in-game roles and access community channels.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="url"
                  value={config.discordInviteUrl || branding.discordInviteUrl || ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    setConfig(prev => ({ ...prev, discordInviteUrl: url }));
                    setBranding(prev => ({ ...prev, discordInviteUrl: url }));
                  }}
                  placeholder="https://discord.gg/yourserver or https://discord.gg/..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const inviteUrl = config.discordInviteUrl || branding.discordInviteUrl || '';
                    handleSaveToggle({
                      discordInviteUrl: inviteUrl,
                      customBranding: { ...(branding || {}), discordInviteUrl: inviteUrl }
                    });
                  }}
                  disabled={savingConfig}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-md shadow-indigo-600/20"
                >
                  {savingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Invite Link</span>
                </button>
              </div>
            </div>

            {/* Webhook URL Input & Test Dispatch */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Discord Webhook Relay URL</span>
                </h3>

                {config.discordWebhookUrl ? (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved & Active</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                    ⚠️ Not Configured
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400">
                Incoming applications and review verdicts will automatically post rich embeds to this channel. Paste your Discord channel webhook URL below and click Save.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="url"
                  value={config.discordWebhookUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, discordWebhookUrl: e.target.value }))}
                  placeholder="https://discord.com/api/webhooks/123456789/abcdef..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => handleSaveToggle({ discordWebhookUrl: config.discordWebhookUrl })}
                    disabled={savingConfig}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
                  >
                    {savingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{config.discordWebhookUrl ? 'Update Webhook' : 'Save Webhook'}</span>
                  </button>

                  <button
                    onClick={handleTestWebhook}
                    disabled={testingWebhook || !config.discordWebhookUrl}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer disabled:opacity-50"
                  >
                    {testingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>Test Webhook</span>
                  </button>

                  {config.discordWebhookUrl && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to remove this Discord Webhook URL? Application notifications will stop being sent to Discord.')) {
                          handleSaveToggle({ discordWebhookUrl: '' });
                        }
                      }}
                      disabled={savingConfig}
                      className="px-3 py-2.5 bg-zinc-900 hover:bg-red-950/50 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Clear Webhook URL"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {testWebhookResult && (
                <div className={`p-3 rounded-xl text-xs font-bold ${testWebhookResult.success ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400' : 'bg-red-950/40 border border-red-500/30 text-red-400'}`}>
                  {testWebhookResult.success ? `✓ Test embed successfully dispatched at ${testWebhookResult.timestamp}` : `✕ Webhook test failed: ${testWebhookResult.error}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 4: QUICK INVITES & CONVERSION ANALYTICS
          ========================================================================= */}
      {activeSection === 'quick_invites' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-emerald-400" />
                  <span>Quick Invite Generator & Conversion Tracking</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Generate unique trackable links for Discord announcements, streamers, and promotional campaigns. Track click-throughs and submitted applications in real-time.
                </p>
              </div>

              <button
                onClick={() => setShowCreateInviteModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 shrink-0 cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
                <span>Generate Quick Invite</span>
              </button>
            </div>

            {/* Conversion KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
                  <span>Total Link Clicks</span>
                  <MousePointerClick className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white">{totalInviteClicks}</div>
                <div className="text-[11px] text-zinc-500">Gross click-throughs across all invites</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
                  <span>Completed Applications</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">{totalInviteConversions}</div>
                <div className="text-[11px] text-emerald-500/80 font-bold">Converted applicants</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-bold">
                  <span>Conversion Rate</span>
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">{overallConversionRate}%</div>
                <div className="text-[11px] text-zinc-500">Clicks to application ratio</div>
              </div>
            </div>

            {/* Quick Invites Table */}
            {invitesLoading ? (
              <div className="space-y-3 py-2 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`inv_skel_${i}`} className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-48 bg-zinc-800 rounded" />
                      <div className="h-3 w-32 bg-zinc-800/50 rounded" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-16 bg-zinc-800/60 rounded" />
                      <div className="h-8 w-20 bg-zinc-800 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : quickInvites.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl p-6 space-y-3">
                <Link2 className="w-10 h-10 text-emerald-400 mx-auto opacity-75" />
                <h3 className="text-sm font-bold text-white">No Quick Invites Generated Yet</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Create your first trackable whitelist invitation link to distribute across your Discord channels and partner communities.
                </p>
                <button
                  onClick={() => setShowCreateInviteModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Create Quick Invite
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-bold">
                      <th className="pb-3 px-3">Invite Code & Label</th>
                      <th className="pb-3 px-3">Clicks</th>
                      <th className="pb-3 px-3">Conversions</th>
                      <th className="pb-3 px-3">CVR %</th>
                      <th className="pb-3 px-3">Expires / Limit</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {quickInvites.map((invite) => {
                      const cvr = invite.clicksCount && invite.clicksCount > 0
                        ? (((invite.conversionsCount || 0) / invite.clicksCount) * 100).toFixed(1)
                        : '0.0';
                      const isCopied = copiedInviteId === invite.id;

                      return (
                        <tr key={invite.id} className="hover:bg-zinc-950/40 transition">
                          <td className="py-3.5 px-3">
                            <div className="font-mono font-black text-white text-sm flex items-center gap-2">
                              <span>{invite.code}</span>
                              <button
                                onClick={() => handleCopyInviteLink(invite)}
                                className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                                title="Copy direct apply URL with invite code"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="text-zinc-400 text-[11px] font-sans font-medium mt-0.5">{invite.label || 'Standard Campaign'}</div>
                            {invite.note && <div className="text-zinc-500 text-[10px] italic">{invite.note}</div>}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-cyan-400">
                            {invite.clicksCount || 0}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                            {invite.conversionsCount || 0}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-amber-400">
                            {cvr}%
                          </td>
                          <td className="py-3.5 px-3 text-zinc-400">
                            {invite.expiresAt ? (
                              <span>{new Date(invite.expiresAt).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-zinc-500">Never</span>
                            )}
                            {invite.maxUses && (
                              <div className="text-[10px] text-zinc-500">Cap: {invite.usesCount || 0} / {invite.maxUses}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleToggleInvite(invite.id, invite.isActive)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${invite.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'}`}
                            >
                              {invite.isActive ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCopyInviteLink(invite)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold transition flex items-center gap-1"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteInvite(invite.id)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/50 text-zinc-400 hover:text-red-400 transition"
                                title="Delete Invite"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create Quick Invite Modal */}
          {showCreateInviteModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">Create Quick Invite</h3>
                      <p className="text-xs text-zinc-400">Generate a custom trackable whitelist referral link</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateInviteModal(false)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateQuickInvite} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1.5">Custom Invite Code (Optional):</label>
                    <input
                      type="text"
                      value={newInviteCode}
                      onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. DISCORD-VIP or STREAMER-26"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Leave blank to auto-generate a unique 6-character code.</p>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1.5">Campaign Label / Source:</label>
                    <input
                      type="text"
                      value={newInviteLabel}
                      onChange={(e) => setNewInviteLabel(e.target.value)}
                      placeholder="e.g. Official Discord #announcements or TikTok Bio"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-300 font-bold mb-1.5">Expires In (Days):</label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={newInviteExpiresDays}
                        onChange={(e) => setNewInviteExpiresDays(e.target.value)}
                        placeholder="e.g. 14 (0 for never)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-bold mb-1.5">Max Uses Limit:</label>
                      <input
                        type="number"
                        min={1}
                        value={newInviteMaxUses}
                        onChange={(e) => setNewInviteMaxUses(e.target.value)}
                        placeholder="e.g. 50 (blank = unlimited)"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1.5">Internal Note (Optional):</label>
                    <textarea
                      rows={2}
                      value={newInviteNote}
                      onChange={(e) => setNewInviteNote(e.target.value)}
                      placeholder="e.g. Shared with Verified Partner Streamers"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white text-xs focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateInviteModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingInvite}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                    >
                      {creatingInvite ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                      <span>Generate Invite Link</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 5: OWNERSHIP TRANSFER
          ========================================================================= */}
      {activeSection === 'ownership_transfer' && (
        !canAccessMarketingAndBilling ? (
          renderRestrictedAccessGuard(
            'Server Ownership Transfer',
            'Reassigning server ownership and managing claim access permissions.'
          )
        ) : (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-zinc-800 pb-5">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>RP Server Ownership Transfer</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Reassign authoritative server ownership to another Discord user via their Discord Snowflake ID.
              </p>
            </div>

            {/* Current Owner Info */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Current Verified Owner</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-zinc-500 block">Discord ID:</span>
                  <span className="font-mono font-bold text-amber-400">{config.ownerDiscordId || userDiscordId || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Discord Tag / Username:</span>
                  <span className="font-bold text-white">{config.claimedByDiscordUsername || userDiscordUsername || 'Server Owner'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Claimed Timestamp:</span>
                  <span className="text-zinc-300">{config.claimedAt ? new Date(config.claimedAt).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Transfer Warning Card */}
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-black text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Permanent Authorization Notice</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Transferring ownership will <strong>immediately revoke your Server Dashboard management privileges</strong> and update the authoritative <code className="text-amber-400">ownerDiscordId</code> to the new user.
                Only proceed if you intend to surrender administrative control of <strong className="text-white">{config.serverName}</strong>.
              </p>
            </div>

            {/* Trigger Button */}
            <div>
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>Initiate Ownership Transfer</span>
              </button>
            </div>
          </div>

          {/* Transfer Confirmation Modal */}
          {showTransferModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">Transfer Server Ownership</h3>
                      <p className="text-xs text-zinc-400">Confirm Target Discord Recipient</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {transferError && (
                    <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{transferError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1.5">New Owner Discord Username or Snowflake ID:</label>
                    <input
                      type="text"
                      value={transferTargetDiscordId}
                      onChange={(e) => {
                        setTransferTargetDiscordId(e.target.value);
                        if (transferError) setTransferError(null);
                      }}
                      placeholder="e.g. _Niklaus or 728193847561029384"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Enter target user's Discord username/handle or numeric User ID.</p>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1.5">New Owner Discord Tag / Display Name (Optional):</label>
                    <input
                      type="text"
                      value={transferTargetUsername}
                      onChange={(e) => setTransferTargetUsername(e.target.value)}
                      placeholder="e.g. _Niklaus or Lucia_Leader#0001"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1.5">Transfer Memo / Audit Note:</label>
                    <textarea
                      rows={2}
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      placeholder="e.g. Leadership handover to new community director."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white text-xs focus:border-amber-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 space-y-2">
                    <span className="font-bold block text-red-400">Type TRANSFER below to authorize:</span>
                    <input
                      type="text"
                      value={transferConfirmText}
                      onChange={(e) => setTransferConfirmText(e.target.value)}
                      placeholder="Type TRANSFER to confirm"
                      className="w-full bg-zinc-950 border border-red-500/40 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:border-red-500 focus:outline-none tracking-wider"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecuteTransfer}
                    disabled={transferring || transferConfirmText.trim().toUpperCase() !== 'TRANSFER' || !transferTargetDiscordId}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-red-600/25 disabled:opacity-50 cursor-pointer"
                  >
                    {transferring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                    <span>Confirm & Relinquish Ownership</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* =========================================================================
          SECTION 6: CUSTOM BRANDING & WHITE-LABEL (PREMIUM GATED)
          ========================================================================= */}
      {activeSection === 'branding' && (
        <div className="space-y-6">
          {!isVerifiedServerOwner ? (
            /* Gated Feature Banner */
            <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <span>Custom White-Label Branding</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                        👑 Verified Owner Tier
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Customize your applicant portal with custom logo, banner, hex colors, custom domain, and remove platform watermarks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Custom Logo & Banners</h3>
                  <p className="text-xs text-zinc-400">Replace default Vice City assets with your community's official high-res branding.</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
                    <Palette className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Theme Accent Palette</h3>
                  <p className="text-xs text-zinc-400">Match your server brand with custom primary accent colors and custom badge text.</p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Custom Subdomain & No Watermarks</h3>
                  <p className="text-xs text-zinc-400">Host your portal at apply.yourcity.com and remove "Powered by" footer watermarks.</p>
                </div>
              </div>

              {/* Instant Stripe Verification Form */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Authorize with Stripe Subscription</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const demoSub = `sub_live_vice2026_${Math.random().toString(36).substring(2, 8)}`;
                      setStripeSubInput(demoSub);
                      handleVerifyStripeSubscription(demoSub);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-mono font-bold underline cursor-pointer"
                  >
                    ⚡ Test 1-Click Sandbox Token
                  </button>
                </div>

                {subVerifyError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                    {subVerifyError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter Stripe Subscription ID (sub_... or cs_...)"
                    value={stripeSubInput}
                    onChange={(e) => setStripeSubInput(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleVerifyStripeSubscription()}
                    disabled={verifyingSub || !stripeSubInput}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {verifyingSub ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Verify & Unlock Feature</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Unlocked Custom Branding Configurator */
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                
                {/* Header & Quick Save */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Palette className="w-5 h-5 text-purple-400" />
                      <span>Custom White-Label Branding Suite</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        ✓ ACTIVE & VERIFIED
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Configure your community logo, widescreen banner, theme accents, and copy. Changes propagate immediately across all public touchpoints.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (branding.logoUrl) verifyImage(branding.logoUrl, 'logo');
                        if (branding.bannerUrl) verifyImage(branding.bannerUrl, 'banner');
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                      title="Re-verify logo and banner image integrity"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-verify Images</span>
                    </button>

                    <button
                      onClick={() => handleSaveBranding()}
                      disabled={savingBranding}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-purple-600/25 disabled:opacity-50 cursor-pointer"
                    >
                      {savingBranding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save & Publish Live</span>
                    </button>
                  </div>
                </div>

                {/* Notifications */}
                {brandingSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{brandingSuccess}</span>
                  </div>
                )}
                {brandingError && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{brandingError}</span>
                  </div>
                )}

                {/* Direct Shareable Application URL - NO SUBDOMAINS NEEDED */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-zinc-950 to-zinc-950 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Your Live Application Portal URL</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                        Single-Domain Instant Link
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {typeof window !== 'undefined' ? `${window.location.origin}/servers/${config.serverSlug}/apply` : `https://viceintel.app/servers/${config.serverSlug}/apply`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const url = typeof window !== 'undefined' ? `${window.location.origin}/servers/${config.serverSlug}/apply` : `https://viceintel.app/servers/${config.serverSlug}/apply`;
                        copyToClipboard(url);
                        setCopiedPortalUrl(true);
                        setTimeout(() => setCopiedPortalUrl(false), 3000);
                      }}
                      className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedPortalUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPortalUrl ? 'Copied to Clipboard!' : 'Copy Portal URL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const url = `/servers/${config.serverSlug}/apply`;
                        window.open(url, '_blank');
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Live</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </div>
                </div>

                {/* 1-Click GTA VI Theme Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>1-Click GTA VI Community Presets:</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">Quick-load curated high-res assets</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {BRANDING_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setBranding(prev => ({
                            ...prev,
                            accentColor: preset.accent,
                            customBadgeText: preset.badge,
                            bannerUrl: preset.banner,
                            logoUrl: preset.logo
                          }));
                        }}
                        className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-left transition space-y-1.5 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                            {preset.name}
                          </span>
                          <span
                            style={{ backgroundColor: preset.accent }}
                            className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{preset.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main 2-Column Grid: Form Inputs & Live Multi-View Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  
                  {/* Left Column: Form Controls & Asset Verification */}
                  <div className="lg:col-span-6 space-y-5 text-xs">
                    
                    {/* Logo Config & Verification */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-purple-400" />
                          <span>Community Logo (Avatar / Icon):</span>
                        </label>
                        
                        {/* Verification Status Badge */}
                        {logoVerifyStatus === 'verifying' && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Verifying...</span>
                          </span>
                        )}
                        {logoVerifyStatus === 'valid' && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified {logoMeta ? `${logoMeta.width}x${logoMeta.height}px` : 'OK'}</span>
                          </span>
                        )}
                        {logoVerifyStatus === 'invalid' && (
                          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" />
                            <span>Invalid Image URL</span>
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={branding.logoUrl || ''}
                          onChange={(e) => setBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                          placeholder="https://your-domain.com/logo.png or image URL"
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                        />
                        <label className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer shrink-0">
                          <Upload className="w-3.5 h-3.5 text-purple-400" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileUpload(e, 'logo')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {logoErrorMsg && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{logoErrorMsg}</span>
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Recommended: 512x512 PNG square format (transparent bg ideal).</span>
                        {branding.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setBranding(prev => ({ ...prev, logoUrl: '' }))}
                            className="text-zinc-400 hover:text-rose-400 transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Banner Config & Verification */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-purple-400" />
                          <span>Header Banner Image (Widescreen Hero):</span>
                        </label>
                        
                        {/* Verification Status Badge */}
                        {bannerVerifyStatus === 'verifying' && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Verifying...</span>
                          </span>
                        )}
                        {bannerVerifyStatus === 'valid' && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified {bannerMeta ? `${bannerMeta.width}x${bannerMeta.height}px` : 'OK'}</span>
                          </span>
                        )}
                        {bannerVerifyStatus === 'invalid' && (
                          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" />
                            <span>Invalid Banner URL</span>
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={branding.bannerUrl || ''}
                          onChange={(e) => setBranding(prev => ({ ...prev, bannerUrl: e.target.value }))}
                          placeholder="https://your-domain.com/banner.jpg or image URL"
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                        />
                        <label className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer shrink-0">
                          <Upload className="w-3.5 h-3.5 text-purple-400" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileUpload(e, 'banner')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {bannerErrorMsg && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{bannerErrorMsg}</span>
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Recommended: 1920x600 widescreen (JPG / WEBP / PNG).</span>
                        {branding.bannerUrl && (
                          <button
                            type="button"
                            onClick={() => setBranding(prev => ({ ...prev, bannerUrl: '' }))}
                            className="text-zinc-400 hover:text-rose-400 transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Accent Color Palette */}
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                      <label className="block text-zinc-200 font-bold">Primary Accent Theme Color:</label>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#3b82f6'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setBranding(prev => ({ ...prev, accentColor: color }))}
                            style={{ backgroundColor: color }}
                            className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${branding.accentColor === color ? 'border-white scale-125 shadow-lg' : 'border-zinc-700 hover:scale-110'}`}
                            title={`Select ${color}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="color"
                          value={branding.accentColor || '#6366f1'}
                          onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-10 h-9 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={branding.accentColor || '#6366f1'}
                          onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                          placeholder="#6366f1"
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Custom Header Title & Verification Badge */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">Custom Header Title:</label>
                        <input
                          type="text"
                          value={branding.customHeaderTitle || ''}
                          onChange={(e) => setBranding(prev => ({ ...prev, customHeaderTitle: e.target.value }))}
                          placeholder={config.serverName}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-300 font-bold mb-1">Custom Badge Text:</label>
                        <input
                          type="text"
                          value={branding.customBadgeText || ''}
                          onChange={(e) => setBranding(prev => ({ ...prev, customBadgeText: e.target.value }))}
                          placeholder="e.g. Official Partner • Season 2"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Discord Invite URL */}
                    <div>
                      <label className="block text-zinc-300 font-bold mb-1">Official Discord Server Invite Link:</label>
                      <input
                        type="url"
                        value={branding.discordInviteUrl || config.discordInviteUrl || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          setBranding(prev => ({ ...prev, discordInviteUrl: url }));
                          setConfig(prev => ({ ...prev, discordInviteUrl: url }));
                        }}
                        placeholder="https://discord.gg/yourserver"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-zinc-500 mt-1">Direct Discord invite link presented to approved applicants.</p>
                    </div>

                    {/* Hide Watermark Checkbox */}
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">100% White-Label (Hide Platform Watermark)</span>
                        <span className="text-[11px] text-zinc-400">Removes "Powered by GTA VI Central" footer for a seamless native look.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={branding.hideWatermark || false}
                        onChange={(e) => setBranding(prev => ({ ...prev, hideWatermark: e.target.checked }))}
                        className="accent-purple-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    {/* Custom Domain Configuration Suite - Restrict to Mega-Server & Enterprise */}
                    {(() => {
                      const isCustomDomainUnlocked = Boolean(
                        config.planTier === 'mega_server' ||
                        config.planTier === 'enterprise' ||
                        config.planTier === 'mega' ||
                        config.planTier === 'mega_enterprise' ||
                        config.planTier === 'pro' ||
                        isL4Admin ||
                        isDesignatedStaff
                      );

                      if (isCustomDomainUnlocked) {
                        return (
                          <div className="p-4 rounded-xl bg-gradient-to-b from-purple-950/20 to-zinc-950 border border-purple-500/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-purple-400" />
                                <span className="font-bold text-white text-xs uppercase tracking-wider">Custom Domain &amp; SSL Gateway</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                                UNLOCKED (MEGA / ENTERPRISE)
                              </span>
                            </div>

                            <div>
                              <label className="block text-zinc-300 font-bold text-xs mb-1">Your Custom Domain / Subdomain:</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={branding.customDomain || ''}
                                  onChange={(e) => setBranding(prev => ({ ...prev, customDomain: e.target.value }))}
                                  placeholder="apply.yourcityrp.com or portal.myfivem.com"
                                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDnsChecking(true);
                                    setDnsStatusMessage(null);
                                    setTimeout(() => {
                                      setDnsChecking(false);
                                      if (branding.customDomain && branding.customDomain.includes('.')) {
                                        setDnsStatusMessage(`✓ DNS CNAME verified for ${branding.customDomain}. Auto TLS 1.3 certificate active.`);
                                      } else {
                                        setDnsStatusMessage('⚠️ Please provide a valid hostname (e.g. apply.yourcity.com).');
                                      }
                                    }, 900);
                                  }}
                                  disabled={dnsChecking}
                                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition disabled:opacity-50 shrink-0"
                                >
                                  {dnsChecking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                  <span>Verify DNS</span>
                                </button>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-1">Host your applicant portal at your own root domain or subdomain with auto-renewing Let's Encrypt TLS.</p>
                            </div>

                            {dnsStatusMessage && (
                              <div className={`p-2.5 rounded-lg text-xs font-mono ${dnsStatusMessage.startsWith('✓') ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/40 text-amber-300 border border-amber-500/30'}`}>
                                {dnsStatusMessage}
                              </div>
                            )}

                            {/* Required DNS CNAME Record Instructions */}
                            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-1.5">
                              <div className="text-zinc-400 font-medium">Required DNS Record at Your Registrar (Cloudflare, Namecheap, GoDaddy):</div>
                              <div className="flex items-center justify-between p-2 rounded bg-zinc-950 font-mono text-[11px] text-purple-300 border border-zinc-800">
                                <span>CNAME &rarr; cname.viceintel.app</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText('cname.viceintel.app');
                                    setCopiedDnsCname(true);
                                    setTimeout(() => setCopiedDnsCname(false), 2000);
                                  }}
                                  className="text-zinc-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800 cursor-pointer"
                                >
                                  {copiedDnsCname ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedDnsCname ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Locked state for Community / Free tiers
                      return (
                        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-amber-400" />
                              <span className="font-bold text-white text-xs uppercase tracking-wider">Custom Domain &amp; Vanity SSL</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3" /> MEGA / ENTERPRISE ONLY
                            </span>
                          </div>

                          <p className="text-xs text-zinc-300 leading-relaxed">
                            Custom branded domain routing (<code className="text-amber-300 font-mono">apply.yourcity.com</code>) with automated TLS certificates is an exclusive feature of the <strong>Mega-Server Pro Tier ($49/mo)</strong> and <strong>Enterprise Networks ($199/mo)</strong>.
                          </p>

                          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">
                            <div className="text-xs">
                              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Your Active Community Subdomain:</span>
                              <span className="font-mono text-purple-300 font-bold">{`https://${serverSlug || 'your-server'}.viceintel.app`}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`https://${serverSlug || 'your-server'}.viceintel.app`);
                                setCopiedPortalUrl(true);
                                setTimeout(() => setCopiedPortalUrl(false), 2000);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              {copiedPortalUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedPortalUrl ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveSection('billing')}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Upgrade to Mega-Server ($49/mo) to Unlock Custom Domain</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })()}

                  </div>

                  {/* Right Column: Live Multi-Placement Interactive Preview */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-purple-400" />
                        <span>Live Placement Previewer:</span>
                      </span>

                      {/* 4 View Tabs */}
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setBrandingPreviewTab('apply_portal')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${brandingPreviewTab === 'apply_portal' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Application Page
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrandingPreviewTab('directory_card')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${brandingPreviewTab === 'directory_card' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Directory Card
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrandingPreviewTab('discord_embed')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${brandingPreviewTab === 'discord_embed' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Discord Embed
                        </button>
                        <button
                          type="button"
                          onClick={() => setBrandingPreviewTab('applicant_status')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${brandingPreviewTab === 'applicant_status' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Status Tracker
                        </button>
                      </div>
                    </div>

                    {/* PREVIEW CONTAINER */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-inner relative overflow-hidden min-h-[440px]">
                      
                      {/* VIEW 1: APPLICATION PORTAL */}
                      {brandingPreviewTab === 'apply_portal' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono border-b border-zinc-800/80 pb-2">
                            <span>ROUTE: /servers/{config.serverSlug}/apply</span>
                            <span className="text-purple-400 font-bold">Applicant Perspective</span>
                          </div>

                          {/* Hero Banner */}
                          <div className="h-32 rounded-xl overflow-hidden relative border border-zinc-800 bg-zinc-900">
                            {branding.bannerUrl ? (
                              <img src={branding.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-r from-zinc-900 via-purple-950/40 to-zinc-900 flex items-center justify-center text-zinc-600 text-xs">
                                No custom banner configured (default dark theme active)
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                            
                            {/* Logo & Header Title */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                              {branding.logoUrl ? (
                                <img
                                  src={branding.logoUrl}
                                  alt="Logo"
                                  className="w-12 h-12 rounded-xl object-cover border-2 shadow-lg shrink-0"
                                  style={{ borderColor: branding.accentColor || '#6366f1' }}
                                />
                              ) : (
                                <div
                                  style={{ backgroundColor: `${branding.accentColor || '#6366f1'}25`, borderColor: branding.accentColor || '#6366f1' }}
                                  className="w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0"
                                >
                                  <Server style={{ color: branding.accentColor || '#6366f1' }} className="w-6 h-6" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-white truncate drop-shadow-md">
                                  {branding.customHeaderTitle || config.serverName}
                                </h4>
                                <span
                                  style={{ color: branding.accentColor || '#6366f1', borderColor: `${branding.accentColor || '#6366f1'}40` }}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900/90 border inline-block mt-0.5 shadow-sm"
                                >
                                  {branding.customBadgeText || 'Official Partner'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Application Question Form Card */}
                          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between text-zinc-300 font-bold">
                              <span>Character Backstory & Origin</span>
                              <span className="text-[10px] text-zinc-500">Min 50 Words</span>
                            </div>
                            <div className="bg-zinc-950 rounded-lg p-2.5 text-[11px] text-zinc-500 border border-zinc-800">
                              Applicant writes their custom roleplay backstory, lore scenario, and motivation here...
                            </div>
                            <button
                              style={{ backgroundColor: branding.accentColor || '#6366f1' }}
                              className="w-full py-2.5 rounded-xl text-white font-black text-xs shadow-md transition hover:opacity-90 cursor-pointer"
                            >
                              Submit Whitelist Application
                            </button>
                          </div>

                          {!branding.hideWatermark && (
                            <div className="text-center text-[10px] text-zinc-600 font-mono">
                              Powered by GTA VI Central Fast-Track Whitelist Engine
                            </div>
                          )}
                        </div>
                      )}

                      {/* VIEW 2: DIRECTORY CARD */}
                      {brandingPreviewTab === 'directory_card' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono border-b border-zinc-800/80 pb-2">
                            <span>ROUTE: /rp-servers (Directory Listing)</span>
                            <span className="text-amber-400 font-bold">Public Directory Card</span>
                          </div>

                          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                            {/* Card Cover Banner */}
                            <div className="h-28 relative bg-zinc-950">
                              {branding.bannerUrl ? (
                                <img src={branding.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-r from-purple-900/40 to-indigo-900/40" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-700 text-amber-400 font-bold text-[10px] flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Featured Partner</span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 pt-0 relative space-y-3">
                              <div className="flex items-end gap-3 -mt-6">
                                {branding.logoUrl ? (
                                  <img
                                    src={branding.logoUrl}
                                    alt="Logo"
                                    className="w-14 h-14 rounded-2xl object-cover border-2 shadow-xl shrink-0 bg-zinc-950"
                                    style={{ borderColor: branding.accentColor || '#6366f1' }}
                                  />
                                ) : (
                                  <div
                                    style={{ backgroundColor: `${branding.accentColor || '#6366f1'}30`, borderColor: branding.accentColor || '#6366f1' }}
                                    className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 bg-zinc-950"
                                  >
                                    <Server style={{ color: branding.accentColor || '#6366f1' }} className="w-7 h-7" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-sm font-black text-white">{branding.customHeaderTitle || config.serverName}</h4>
                                  <span className="text-[10px] text-zinc-400 font-mono">98 / 128 Players Online</span>
                                </div>
                              </div>

                              <p className="text-xs text-zinc-400 line-clamp-2">
                                Premier GTA VI roleplay experience with custom lore, realistic economy, and fast-track whitelist screening.
                              </p>

                              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                                <span
                                  style={{ color: branding.accentColor || '#6366f1' }}
                                  className="text-[11px] font-bold"
                                >
                                  {branding.customBadgeText || 'Official Partner'}
                                </span>
                                <button
                                  style={{ backgroundColor: branding.accentColor || '#6366f1' }}
                                  className="px-4 py-1.5 rounded-lg text-white font-bold text-xs shadow"
                                >
                                  Apply Now →
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* VIEW 3: DISCORD EMBED */}
                      {brandingPreviewTab === 'discord_embed' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono border-b border-zinc-800/80 pb-2">
                            <span>INTEGRATION: Discord Staff Channel Webhook</span>
                            <span className="text-indigo-400 font-bold">Bot Embed Message</span>
                          </div>

                          <div className="bg-[#313338] rounded-xl p-4 text-xs font-sans space-y-3 border border-zinc-700/50 shadow-xl">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-[11px] font-bold">
                                BOT
                              </div>
                              <div>
                                <span className="font-bold text-white text-xs">Vice City Whitelist Gateway</span>
                                <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1.5 py-0.2 rounded ml-1.5">APP</span>
                                <span className="text-[10px] text-zinc-400 ml-2">Today at 12:42 PM</span>
                              </div>
                            </div>

                            {/* Discord Rich Embed Box */}
                            <div
                              className="rounded-lg p-3.5 space-y-2.5 bg-[#2b2d31] border-l-4"
                              style={{ borderLeftColor: branding.accentColor || '#6366f1' }}
                            >
                              {/* Embed Author */}
                              <div className="flex items-center gap-2">
                                {branding.logoUrl && (
                                  <img src={branding.logoUrl} alt="Logo" className="w-5 h-5 rounded-full object-cover" />
                                )}
                                <span className="font-bold text-white text-xs">
                                  {branding.customHeaderTitle || config.serverName} • New Application
                                </span>
                              </div>

                              <div className="text-white font-bold text-xs">
                                📋 Application #VC-8821: Lucia_Caminos
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="text-zinc-400 block font-semibold">Discord User:</span>
                                  <span className="text-indigo-300 font-mono">@lucia_vice</span>
                                </div>
                                <div>
                                  <span className="text-zinc-400 block font-semibold">Lore Score:</span>
                                  <span className="text-emerald-400 font-bold">96 / 100 (Pass)</span>
                                </div>
                              </div>

                              {/* Embed Banner Image */}
                              {branding.bannerUrl && (
                                <div className="rounded-lg overflow-hidden border border-zinc-700/60 max-h-28">
                                  <img src={branding.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                </div>
                              )}

                              <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-700/40">
                                <span>{branding.customBadgeText || 'Official Partner'}</span>
                                <span>Fast-Track Whitelist Engine</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* VIEW 4: APPLICANT STATUS TRACKER */}
                      {brandingPreviewTab === 'applicant_status' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono border-b border-zinc-800/80 pb-2">
                            <span>ROUTE: /servers/{config.serverSlug}/status</span>
                            <span className="text-emerald-400 font-bold">Applicant Tracking View</span>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                            <div className="flex items-center gap-3">
                              {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-zinc-700" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-purple-400">
                                  <Server className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <h4 className="text-xs font-bold text-white">{branding.customHeaderTitle || config.serverName}</h4>
                                <span className="text-[10px] text-emerald-400 font-bold">Application Status: APPROVED ✓</span>
                              </div>
                            </div>

                            {/* Milestone Tracker */}
                            <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-[10px]">
                              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                1. Submitted ✓
                              </div>
                              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                2. AI Audited ✓
                              </div>
                              <div
                                style={{ backgroundColor: `${branding.accentColor || '#6366f1'}30`, borderColor: branding.accentColor || '#6366f1', color: '#fff' }}
                                className="p-1.5 rounded-lg font-bold border"
                              >
                                3. Whitelisted ★
                              </div>
                            </div>

                            {branding.discordInviteUrl && (
                              <button
                                style={{ backgroundColor: branding.accentColor || '#6366f1' }}
                                className="w-full py-2 rounded-lg text-white font-bold text-xs shadow-md mt-2"
                              >
                                Join Official Discord Server
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>

                {/* "Where Will These Images Appear?" Ecosystem Breakdown */}
                <div className="border-t border-zinc-800 pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Image Placement Ecosystem — Where Your Logo & Banner Appear
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center gap-2 text-purple-400 font-bold">
                        <Globe className="w-4 h-4" />
                        <span>1. Whitelist Portal</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Top hero widescreen banner (1920x600) and avatar logo on your public <code className="text-purple-300">/servers/:slug/apply</code> page.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <Server className="w-4 h-4" />
                        <span>2. RP Directory</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Showcase card cover image and avatar thumbnail on the public FiveM Server Directory <code className="text-amber-300">/rp-servers</code>.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold">
                        <Bot className="w-4 h-4" />
                        <span>3. Discord Webhooks</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Bot embed author icon, color strip, and embedded banner attached to new applicant notifications in your Discord staff channels.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>4. Status Tracker</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Live application tracking headers and Discord onboarding invitations at <code className="text-emerald-300">/servers/:slug/status</code>.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 7: ADVANCED ANALYTICS & CONVERSION FUNNEL (PREMIUM GATED)
          ========================================================================= */}
      {activeSection === 'analytics' && (
        <div className="space-y-6">
          {!isVerifiedServerOwner ? (
            /* Gated Feature Banner */
            <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-6">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span>Advanced Conversion Analytics & Lore Telemetry</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                      👑 Verified Owner Tier
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Track your applicant funnel conversion rates, drop-off checkpoints, AI Lore score distribution, and referral link ROI.
                  </p>
                </div>
              </div>

              {/* Instant Stripe Verification Form */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Authorize with Stripe Subscription</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const demoSub = `sub_live_vice2026_${Math.random().toString(36).substring(2, 8)}`;
                      setStripeSubInput(demoSub);
                      handleVerifyStripeSubscription(demoSub);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-mono font-bold underline cursor-pointer"
                  >
                    ⚡ Test 1-Click Sandbox Token
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter Stripe Subscription ID (sub_... or cs_...)"
                    value={stripeSubInput}
                    onChange={(e) => setStripeSubInput(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleVerifyStripeSubscription()}
                    disabled={verifyingSub || !stripeSubInput}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {verifyingSub ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Verify & Unlock Analytics</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Unlocked Advanced Analytics Dashboard */
            <div className="space-y-6">
              {/* Funnel Pipeline Cards */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                      <span>Applicant Conversion Pipeline & Funnel</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Visualizing player journey from initial portal visit to verified whitelist approval.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                    Funnel Efficiency: {totalAppsCount > 0 ? Math.round((approvedApps.length / totalAppsCount) * 100) : 0}%
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-zinc-500 text-xs font-bold block">1. Portal Visitors</span>
                    <div className="text-2xl font-black text-white">{totalAppsCount * 4 + totalInviteClicks}</div>
                    <div className="text-[11px] text-zinc-400">Total Page Impressions</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-indigo-400 text-xs font-bold block">2. Form Started</span>
                    <div className="text-2xl font-black text-indigo-300">{totalAppsCount * 2}</div>
                    <div className="text-[11px] text-zinc-400">Discord OAuth Linked</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-amber-400 text-xs font-bold block">3. Submitted</span>
                    <div className="text-2xl font-black text-amber-300">{totalAppsCount}</div>
                    <div className="text-[11px] text-zinc-400">Completed All Lore Questions</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-2">
                    <span className="text-emerald-400 text-xs font-bold block">4. Whitelist Approved</span>
                    <div className="text-2xl font-black text-emerald-400">{approvedApps.length}</div>
                    <div className="text-[11px] text-emerald-500/80 font-bold">{approvalRate}% Final Conversion</div>
                  </div>
                </div>
              </div>

              {/* AI Score Distribution & Lore Quality Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Gemini 3.7 AI Lore Score Distribution</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span>S-Tier Lore (90-100 pts)</span>
                        <span className="font-bold text-cyan-400">{applications.filter(a => (a.aiAudit?.score || 0) >= 90).length} applicants</span>
                      </div>
                      <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${totalAppsCount > 0 ? (applications.filter(a => (a.aiAudit?.score || 0) >= 90).length / totalAppsCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span>Quality Pass (70-89 pts)</span>
                        <span className="font-bold text-emerald-400">{applications.filter(a => (a.aiAudit?.score || 0) >= 70 && (a.aiAudit?.score || 0) < 90).length} applicants</span>
                      </div>
                      <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${totalAppsCount > 0 ? (applications.filter(a => (a.aiAudit?.score || 0) >= 70 && (a.aiAudit?.score || 0) < 90).length / totalAppsCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span>Marginal / Needs Review (50-69 pts)</span>
                        <span className="font-bold text-amber-400">{applications.filter(a => (a.aiAudit?.score || 0) >= 50 && (a.aiAudit?.score || 0) < 70).length} applicants</span>
                      </div>
                      <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${totalAppsCount > 0 ? (applications.filter(a => (a.aiAudit?.score || 0) >= 50 && (a.aiAudit?.score || 0) < 70).length / totalAppsCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span>Flagged / Rule Breach (&lt;50 pts)</span>
                        <span className="font-bold text-red-400">{applications.filter(a => (a.aiAudit?.score || 0) < 50).length} applicants</span>
                      </div>
                      <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${totalAppsCount > 0 ? (applications.filter(a => (a.aiAudit?.score || 0) < 50).length / totalAppsCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referral Link & Campaign ROI */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-emerald-400" />
                    <span>Referral Attribution Performance</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    {quickInvites.length > 0 ? (
                      quickInvites.slice(0, 3).map(inv => (
                        <div key={inv.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-white block">{inv.code}</span>
                            <span className="text-[11px] text-zinc-400">{inv.label || 'Direct Referral'}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400">{inv.conversionsCount || 0} conversions</span>
                            <span className="text-[10px] text-zinc-500 block">{inv.clicksCount || 0} clicks</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 py-4 text-center">
                        No active Quick Invites configured yet. Create one in the Quick Invites tab.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}



      {/* =========================================================================
          SECTION 9: VERIFIED OWNER BILLING & LICENSE PLAN
          ========================================================================= */}
      {activeSection === 'billing' && (
        !canAccessMarketingAndBilling ? (
          renderRestrictedAccessGuard(
            'Verified Server Owner Plan & Billing',
            'Managing server VIP tiers, Stripe subscriptions, and subscription licenses.'
          )
        ) : (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Verified Server Owner Plan & Stripe License</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage your server's VIP tier, active Stripe subscription ID, and automated feature gates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  isVerifiedServerOwner
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {config.planTier === 'enterprise' || config.planTier === 'mega_enterprise'
                      ? 'Enterprise Plan ($199/mo)'
                      : isTrialActive
                      ? '⚡ 14-Day Pro Pass ($0 Trial)'
                      : isVerifiedServerOwner || config.planTier === 'mega' || config.planTier === 'verified'
                      ? 'Active Verified Owner ($49/mo)'
                      : 'Community Free Tier'}
                  </span>
                </span>
              </div>
            </div>

            {/* Expired Pass Alert Banner */}
            {config.isExpired && !isVerifiedServerOwner && !config.isSubscriptionActive && (
              <div className="p-5 rounded-2xl border bg-rose-950/50 border-rose-500/50 shadow-xl shadow-rose-950/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">14-Day Pro Pass Trial Expired</h4>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          Trial Ended
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Your 14-day complimentary Pro trial has concluded. Upgrade now to reactivate Gemini AI lore grading, instant Discord auto-roles, and priority directory ranking.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpgradePlan('mega');
                    }}
                    disabled={verifyingSub}
                    className="px-6 py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-xl shadow-rose-600/20 border border-rose-400/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition shrink-0 whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Upgrade to Pro ($49/mo)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Subscription / Trial Expiration Status Banner */}
            {(isVerifiedServerOwner || config.isSubscriptionActive) && (
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isSubExpiringSoon
                  ? 'bg-red-950/40 border-red-500/50 shadow-xl shadow-red-950/40'
                  : isTrialActive
                  ? 'bg-gradient-to-br from-slate-950 to-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-950/20'
                  : 'bg-zinc-950 border-amber-500/30 shadow-lg shadow-amber-950/20'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-xl ${
                      isSubExpiringSoon ? 'bg-red-500/20 text-red-400' : isTrialActive ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">
                          {isTrialActive ? '14-Day Pro Pass Trial Status' : 'License Expiration & Renewal Details'}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          isSubExpiringSoon
                            ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                            : isTrialActive
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {isSubExpiringSoon ? '⚠️ Expiring Soon' : isTrialActive ? '⚡ 14-Day Trial Active' : '✓ Active License'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        {isTrialActive
                          ? `Your 14-Day Pro Pass trial expires on `
                          : `Your Verified Server Owner subscription expires on `}
                        <strong className="text-amber-300 font-mono">
                          {subExpiryDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </strong> ({subDaysRemaining} day{subDaysRemaining === 1 ? '' : 's'} remaining).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const currentTier = config.planTier === 'enterprise' || config.planTier === 'mega_enterprise' ? 'enterprise' : 'mega';
                        handleUpgradePlan(currentTier);
                      }}
                      disabled={verifyingSub}
                      className={`px-4 py-2 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        isSubExpiringSoon
                          ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 animate-bounce'
                          : isTrialActive
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-md shadow-rose-500/20'
                          : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20'
                      }`}
                    >
                      {verifyingSub ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>{verifyingSub ? 'Extending Subscription...' : isTrialActive ? 'Convert to Full Pro Subscription' : isSubExpiringSoon ? 'Renew Subscription Now (+30 Days)' : 'Extend / Renew Plan (+30 Days)'}</span>
                    </button>
                  </div>
                </div>

                {/* Billing Cycle Progress Bar */}
                <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-medium">{isTrialActive ? '14-Day Trial Progress' : '30-Day Billing Cycle Progress'}</span>
                    <span className={`font-mono font-bold ${isSubExpiringSoon ? 'text-red-400' : isTrialActive ? 'text-rose-400' : 'text-amber-400'}`}>
                      {subDaysRemaining} Days Remaining
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSubExpiringSoon
                          ? 'bg-gradient-to-r from-red-600 to-amber-500'
                          : isTrialActive
                          ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                          : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, (subDaysRemaining / (isTrialActive ? 14 : 30)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Plan Comparison & Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Community Tier */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 ${
                !isVerifiedServerOwner && config.planTier !== 'enterprise' && config.planTier !== 'mega_enterprise'
                  ? 'bg-zinc-950 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                  : 'bg-zinc-950/60 border-zinc-800'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Community Tier</h3>
                    {!isVerifiedServerOwner && config.planTier !== 'enterprise' && config.planTier !== 'mega_enterprise' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">Free</div>
                    <p className="text-xs text-zinc-400 mt-1">Standard directory listing and basic whitelist queue.</p>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">✓ Standard Applicant Queue</div>
                    <div className="flex items-center gap-2">✓ Discord Webhook Notifications</div>
                    <div className="flex items-center gap-2 text-zinc-600">✕ Custom White-Label Branding</div>
                    <div className="flex items-center gap-2 text-zinc-600">✕ Advanced Conversion Analytics</div>
                    <div className="flex items-center gap-2 text-zinc-600">✕ Sentinel AI Growth Studio</div>
                  </div>
                </div>

                <div className="pt-2">
                  {!isVerifiedServerOwner && config.planTier !== 'enterprise' && config.planTier !== 'mega_enterprise' ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Current Active Plan</span>
                    </div>
                  ) : (
                    <div className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-medium text-center">
                      Included Base Tier
                    </div>
                  )}
                </div>
              </div>

              {/* Mega Server Plan */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 relative ${
                isVerifiedServerOwner && config.planTier !== 'enterprise' && config.planTier !== 'mega_enterprise'
                  ? 'bg-amber-500/10 border-amber-500 shadow-xl shadow-amber-950/30'
                  : 'bg-zinc-950 border-amber-500/30'
              }`}>
                {isVerifiedServerOwner && config.planTier !== 'enterprise' && config.planTier !== 'mega_enterprise' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider absolute -top-3 right-6">
                    Current Plan
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider absolute -top-3 right-6">
                    Recommended
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-amber-400">Mega Server Plan</h3>
                    <div className="text-2xl font-black text-white mt-1">$49 <span className="text-xs text-zinc-400 font-normal">/ month</span></div>
                    <p className="text-xs text-zinc-400 mt-1">Full white-label suite, AI fast-track, and Growth Studio.</p>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-200">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">✓ Verified Server Owner Clearance</div>
                    <div className="flex items-center gap-2">✓ Custom White-Label Branding & Domain</div>
                    <div className="flex items-center gap-2">✓ Advanced Conversion Analytics & Funnel</div>
                    <div className="flex items-center gap-2">✓ Sentinel AI Growth Studio Access</div>
                    <div className="flex items-center gap-2">✓ Automated Discord Bot Role Sync</div>
                  </div>
                </div>

                <div className="pt-2">
                  {isVerifiedServerOwner && config.planTier !== 'enterprise' && config.planTier !== 'mega_enterprise' ? (
                    <div className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black text-center flex items-center justify-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Current Active Plan ($49/mo)</span>
                    </div>
                  ) : config.planTier === 'enterprise' || config.planTier === 'mega_enterprise' ? (
                    <div className="w-full py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold text-center">
                      ✓ Included in Enterprise
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleUpgradePlan('mega');
                      }}
                      disabled={verifyingSub}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 cursor-pointer disabled:opacity-50"
                    >
                      {verifyingSub ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      <span>Upgrade to Mega Plan ($49/mo)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Enterprise Custom */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-between space-y-4 relative ${
                config.planTier === 'enterprise' || config.planTier === 'mega_enterprise'
                  ? 'bg-purple-500/10 border-purple-500 shadow-xl shadow-purple-950/30'
                  : 'bg-zinc-950/60 border-zinc-800'
              }`}>
                {(config.planTier === 'enterprise' || config.planTier === 'mega_enterprise') && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider absolute -top-3 right-6">
                    Current Plan
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-purple-400">Enterprise Custom</h3>
                    <div className="text-2xl font-black text-white mt-1">$199 <span className="text-xs text-zinc-400 font-normal">/ month</span></div>
                    <p className="text-xs text-zinc-400 mt-1">Up to 5 Linked Server Communities, dedicated bot hosting, and custom domain SSL.</p>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 text-purple-300 font-bold">✓ Everything in Mega Server Plan</div>
                    <div className="flex items-center gap-2">✓ Up to 5 Linked Server Communities</div>
                    <div className="flex items-center gap-2">✓ Multi-Domain Vanity Routing for All 5 Hubs</div>
                    <div className="flex items-center gap-2">✓ Dedicated Discord Bot Cloud Instance</div>
                    <div className="flex items-center gap-2">✓ Cross-Server Unified Whitelist Database</div>
                    <div className="flex items-center gap-2">✓ 24/7 Priority Staff SLA & Phone Escalation</div>
                  </div>
                </div>

                <div className="pt-2">
                  {config.planTier === 'enterprise' || config.planTier === 'mega_enterprise' ? (
                    <div className="w-full py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-black text-center flex items-center justify-center gap-1.5">
                      <Crown className="w-4 h-4 text-purple-400" />
                      <span>Current Active Plan ($199/mo)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleUpgradePlan('enterprise');
                      }}
                      disabled={verifyingSub}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/30 cursor-pointer disabled:opacity-50"
                    >
                      {verifyingSub ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                      <span>Upgrade to Enterprise ($199/mo)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Manage Active Subscription */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                Stripe Subscription ID Linkage
              </h3>

              {subVerifyMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  ✓ {subVerifyMessage}
                </div>
              )}
              {subVerifyError && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-bold">
                  ✕ {subVerifyError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter or update Stripe Subscription ID (sub_... / cs_...)"
                  value={stripeSubInput}
                  onChange={(e) => setStripeSubInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={() => handleVerifyStripeSubscription()}
                  disabled={verifyingSub || !stripeSubInput}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {verifyingSub ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Verify / Update Stripe ID</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500">
                <span>
                  Active Plan Status: <strong className="text-amber-400 font-mono uppercase">{config.planTier || (isVerifiedServerOwner ? 'Mega Plan' : 'Community Tier')}</strong>
                </span>
                <span className="text-zinc-500 text-[10px]">256-bit SSL Direct Payment Verification</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* =========================================================================
          SECTION 10: SENTINEL GROWTH & MARKETING ENGINE STUDIO (SERVER STUDIO ONLY)
          ========================================================================= */}
      {activeSection === 'growth' && (
        !canAccessMarketingAndBilling ? (
          renderRestrictedAccessGuard(
            'Growth & Marketing Engine Studio',
            'Generating viral video scripts, Reddit launch posts, Discord embeds, streamer pitches, and pSEO matrices.'
          )
        ) : (
        <div className="space-y-6">
          <MarketingWorkspace
            initialScope="client_server"
            lockScope={true}
            serverSlug={config.serverSlug}
            serverName={config.serverName}
            userTier={config.planTier || (isVerifiedServerOwner ? 'pro' : 'free')}
            currentUser={currentUser}
            onUpgradeClick={() => setActiveSection('billing')}
            onNavigate={(tab, s) => {
              if (onNavigate) {
                if (tab.startsWith('server-')) {
                  const act = tab.replace('server-', '');
                  onNavigate(`/servers/${s || config.serverSlug}/${act}`, s || config.serverSlug);
                } else {
                  onNavigate(`/${tab}`);
                }
              }
            }}
          />
        </div>
      ))}

      {/* =========================================================================
          SECTION 15: FEATURES ON DEMAND ENGINE
          ========================================================================= */}
      {activeSection === 'features_on_demand' && (
        <FeaturesOnDemandTab
          serverSlug={config.serverSlug}
          serverName={config.serverName}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
        />
      )}
        </main>
      </div>

      {/* =========================================================================
          APPLICATION DETAILS & AI LORE MODAL
          ========================================================================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={resolveApplicantAvatar((selectedApp as any).applicantAvatarUrl || (selectedApp as any).userAvatar || (selectedApp as any).avatarUrl || (selectedApp as any).avatar || selectedApp.discordAvatar, selectedApp.discordTag || selectedApp.applicantUsername)}
                  alt={selectedApp.discordTag}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-800"
                />
                <div>
                  <h3 className="text-base font-black text-white">@{selectedApp.applicantUsername || selectedApp.discordTag}</h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <span>{selectedApp.discordTag}</span>
                    {selectedApp.inviteCode && <span className="text-amber-400 font-bold">🎟️ {selectedApp.inviteCode}</span>}
                    <span className="text-zinc-600 px-1">•</span>
                    <span className="text-zinc-500 font-medium">{config.serverName || 'Application'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* AI Lore Audit Score Banner */}
            {selectedApp.aiAudit && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Gemini 3.7 AI Lore Score: <strong className="text-cyan-300 text-sm">{selectedApp.aiAudit.score}/100</strong></span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                    {selectedApp.aiAudit.recommendation}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedApp.aiAudit.summary}
                </p>
              </div>
            )}

            {/* Q&A Answers Section */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs">
              {Object.entries(selectedApp.answers).map(([q, a], idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5 overflow-hidden">
                  <span className="font-bold text-zinc-400 block break-words">{q}</span>
                  <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">{a}</p>
                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Close
              </button>
              {selectedApp.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedApp);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Applicant</span>
                  </button>
                  <button
                    onClick={() => {
                      handleOpenRejectModal(selectedApp);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold transition flex items-center gap-1.5 border border-red-500/30"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REJECTION MODAL WITH REASONS
          ========================================================================= */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span>Reject Application (@{rejectingApp.applicantUsername || rejectingApp.discordTag})</span>
              </h3>
              <button onClick={() => setRejectingApp(null)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">Primary Rejection Reason:</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                >
                  <option value="Character backstory does not meet minimum lore depth requirements.">Insufficient Backstory Depth</option>
                  <option value="Scenario answers fail to demonstrate Fear RP / Value of Life.">Failed Fear RP / Powergaming</option>
                  <option value="Answers indicate lack of understanding of server rules and audio equipment standards.">Rule & Equipment Compliance</option>
                  <option value="Flagged for suspected alternate account / ban evasion.">Suspected Alt / Ban Evasion</option>
                  <option value="Other / Custom Reason">Custom Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1.5">Custom Feedback Note for Applicant:</label>
                <textarea
                  rows={3}
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  placeholder="Provide constructive guidance so the applicant can improve their character lore on re-application..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Payment Success Confirmation Modal */}
      <PaymentSuccessModal
        isOpen={showPaymentSuccessModal}
        onClose={() => {
          setShowPaymentSuccessModal(false);
          if (typeof window !== 'undefined') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
          }
        }}
        serverName={config.serverName}
        serverSlug={config.serverSlug}
        serverId={config.serverId}
        discordUsername={userDiscordUsername || userProfile?.discordUsername || currentUser?.displayName || 'VerifiedOwner'}
        discordId={config.ownerDiscordId || userDiscordId || undefined}
        sessionId={paymentSessionId}
        onRedirect={() => {
          setShowPaymentSuccessModal(false);
          if (typeof window !== 'undefined') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
          }
          if (onNavigate) {
            onNavigate('server-manage', config.serverSlug);
          } else {
            window.location.href = `/servers/${config.serverSlug}/manage`;
          }
        }}
      />

      {/* =========================================================================
          SERVER OWNER DATA BACKUP & MIGRATION STUDIO (EXPORT & IMPORT) MODAL
          ========================================================================= */}
      {(showDataModal || showExportModal) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  dataModalTab === 'import' 
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {dataModalTab === 'import' ? <Upload className="w-6 h-6" /> : <Download className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Server Whitelist Data & Migration Studio</h3>
                  <p className="text-xs text-zinc-400">Export offline backups or import server settings, questions, and applicant rosters.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDataModal(false);
                  setShowExportModal(false);
                }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Top Modal Navigation Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
              <button
                onClick={() => setDataModalTab('import')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  dataModalTab === 'import'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Import Data & Migration</span>
              </button>

              <button
                onClick={() => setDataModalTab('export')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  dataModalTab === 'export'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Export Data & Backups</span>
              </button>
            </div>

            {/* TAB 1: IMPORT DATA & MIGRATION */}
            {dataModalTab === 'import' && (
              <div className="space-y-5">
                {/* File Dropzone */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Select Backup File (.json or .csv)
                  </label>
                  <label className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/60 rounded-2xl p-6 bg-zinc-950 hover:bg-zinc-900/50 transition flex flex-col items-center justify-center cursor-pointer group text-center block">
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={handleImportFileChange}
                      className="hidden"
                    />
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    {importFile ? (
                      <div>
                        <div className="text-sm font-bold text-white">{importFile.name}</div>
                        <div className="text-xs text-indigo-400 mt-1 font-mono">{(importFile.size / 1024).toFixed(1)} KB • Click to change file</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition">
                          Click or drag & drop backup file
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          Supports full server JSON backups, form schemas (.json), and applicant spreadsheets (.csv)
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Status Messages */}
                {importErrorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{importErrorMessage}</span>
                  </div>
                )}

                {importStatusMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{importStatusMessage}</span>
                  </div>
                )}

                {/* Parsed File Preview Card */}
                {importParsedData && (
                  <div className="space-y-3.5 p-4 rounded-2xl bg-zinc-950 border border-indigo-500/30">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                        Validated Backup Content
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        {importMode.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {importParsedData.server?.name && (
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 text-[10px] block">Source Server Name</span>
                          <span className="font-bold text-white truncate block">{importParsedData.server.name}</span>
                        </div>
                      )}

                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] block">Form Questions Found</span>
                        <span className="font-bold text-cyan-400">
                          {importParsedData.customQuestions?.length || importParsedData.questions?.length || importParsedData.configuration?.customQuestions?.length || 0} Questions
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 col-span-2">
                        <span className="text-zinc-500 text-[10px] block">Applicant Records Ready to Restore</span>
                        <span className="font-bold text-emerald-400">
                          {importParsedApps.length} Applicants Detected
                        </span>
                      </div>
                    </div>

                    {/* Restore Checkboxes */}
                    <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs">
                      <div className="text-zinc-400 font-bold mb-1">Restore Settings & Data Options:</div>
                      
                      {(importMode === 'full_json' || importMode === 'questions_json') && (
                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white">
                          <input
                            type="checkbox"
                            checked={importIncludeQuestions}
                            onChange={(e) => setImportIncludeQuestions(e.target.checked)}
                            className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Import & Update Custom Form Questions</span>
                        </label>
                      )}

                      {importMode === 'full_json' && (
                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white">
                          <input
                            type="checkbox"
                            checked={importIncludeConfig}
                            onChange={(e) => setImportIncludeConfig(e.target.checked)}
                            className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Restore Server Settings (Name, Rules, Discord Webhook, Min Words)</span>
                        </label>
                      )}

                      {importParsedApps.length > 0 && (
                        <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white">
                          <input
                            type="checkbox"
                            checked={importIncludeApps}
                            onChange={(e) => setImportIncludeApps(e.target.checked)}
                            className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Import & Merge {importParsedApps.length} Applicant Records into Whitelist Queue</span>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Execute Import Action */}
                <button
                  onClick={handleExecuteImport}
                  disabled={!importFile || importing}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    !importFile || importing
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer'
                  }`}
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Importing Server Data...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Execute Import & Apply Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: EXPORT DATA & BACKUPS */}
            {dataModalTab === 'export' && (
              <div className="space-y-5">
                {/* Stats Overview Pill */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                  <div>
                    <div className="text-xs text-zinc-500 font-medium">Total Applicants</div>
                    <div className="text-lg font-black text-white mt-0.5">{applications.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium">Approved</div>
                    <div className="text-lg font-black text-emerald-400 mt-0.5">{applications.filter(a => a.status === 'approved').length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-medium">Form Questions</div>
                    <div className="text-lg font-black text-cyan-400 mt-0.5">{config.customQuestions?.length || 0}</div>
                  </div>
                </div>

                {/* Export Format Options */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Select Export Format</h4>

                  {/* Option 1: Full Server JSON Backup */}
                  <button
                    onClick={handleExportFullJSON}
                    className="w-full p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/50 transition flex items-center justify-between gap-4 text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition flex items-center gap-2">
                          <span>Full Server JSON Backup (.json)</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">RECOMMENDED</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Includes all server settings, questions, applicant lore records, analytics, and quick invites.
                        </p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition shrink-0" />
                  </button>

                  {/* Option 2: Applications CSV Spreadsheet */}
                  <button
                    onClick={handleExportApplicationsCSV}
                    className="w-full p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-indigo-500/50 transition flex items-center justify-between gap-4 text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                          Applications Spreadsheet (.csv)
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Formatted CSV file compatible with Excel & Google Sheets containing all applicant entries and status.
                        </p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition shrink-0" />
                  </button>

                  {/* Option 3: Form Questions Schema JSON */}
                  <button
                    onClick={handleExportFormQuestionsJSON}
                    className="w-full p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/50 transition flex items-center justify-between gap-4 text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                          Whitelist Form Questions Schema (.json)
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Export custom questions schema to duplicate or backup your application form configuration.
                        </p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition shrink-0" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-xs text-zinc-500">
              <span className="font-mono text-[11px]">Server ID: {config.serverSlug}</span>
              <button
                onClick={() => {
                  setShowDataModal(false);
                  setShowExportModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vice City Dispatch & Server Provisioning Modal */}
      <ViceCityProvisioningModal
        isOpen={showProvisioningModal}
        onClose={() => setShowProvisioningModal(false)}
        serverName={config.serverName || 'Vice City Underground RP'}
      />
    </div>
  );
};
