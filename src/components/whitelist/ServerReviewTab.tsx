'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Users, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Check, 
  X, 
  RefreshCw, 
  Send, 
  FileText, 
  Lock, 
  Trash2, 
  LogIn,
  Crown,
  ArrowRight,
  Mail,
  Eye,
  Zap,
  Bot,
  AlertTriangle,
  Award,
  Activity,
  Globe
} from 'lucide-react';
import { WhitelistApplication, WhitelistFormConfig, WhitelistApplicationStatus } from '../../types';
import { resolveApplicantAvatar } from '../../data/avatars';
import { RP_SERVERS_DATA } from '../../data/rpServers';
import { 
  getApplicationsByServer, 
  subscribeToApplicationsByServer, 
  getFormConfigBySlug, 
  updateApplicationStatus, 
  updateApplicationAudit,
  deleteApplication, 
  createTestApplication, 
  sendDiscordNotification,
  sendWhitelistEmailNotification,
  normalizeServerSlug
} from '../../lib/whitelist-service';

interface ServerReviewTabProps {
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

export const ServerReviewTab: React.FC<ServerReviewTabProps> = ({
  serverSlug,
  onNavigate,
  currentUser,
  onOpenAuth
}) => {
  const [config, setConfig] = useState<WhitelistFormConfig | null>(null);
  const [applications, setApplications] = useState<WhitelistApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<WhitelistApplicationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  // Email Preview Modal State
  const [previewModalApp, setPreviewModalApp] = useState<WhitelistApplication | null>(null);
  const [previewModalHtml, setPreviewModalHtml] = useState<string | null>(null);
  const [previewModalRecipient, setPreviewModalRecipient] = useState<string>('');
  const [isDispatchingEmail, setIsDispatchingEmail] = useState(false);

  // Check if current authenticated user is a Level 4 (L4) Global Administrator
  const isL4Admin = Boolean(
    currentUser && (
      currentUser.isAdmin ||
      (currentUser.email && [
        'admin@vicecity.app',
        'lucia.vice@outlook.com',
        'l4_admin@vicecity.app'
      ].includes(currentUser.email.toLowerCase()))
    )
  );

  const matchedRpServer = RP_SERVERS_DATA.find(
    s => s.id === serverSlug || normalizeServerSlug(s.name) === normalizeServerSlug(serverSlug)
  );

  const userDiscordId = (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_user_id') : null);
  const userDiscordUsername = (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_username') : null);

  // Check if current authenticated user is the registered Server Owner of this specific server
  const isServerOwner = Boolean(
    isL4Admin ||
    (currentUser && config && (
      (config.ownerUid && config.ownerUid === currentUser.uid) ||
      (config.ownerUid && currentUser.email && config.ownerUid.toLowerCase() === currentUser.email.toLowerCase()) ||
      (userDiscordId && config.ownerDiscordId && (userDiscordId === config.ownerDiscordId || userDiscordId.toLowerCase() === config.ownerDiscordId.toLowerCase())) ||
      (userDiscordUsername && config.claimedByDiscordUsername && userDiscordUsername.toLowerCase() === config.claimedByDiscordUsername.toLowerCase())
    ))
  );

  const isVerifiedPayment = Boolean(
    isL4Admin ||
    config?.isSubscriptionActive ||
    config?.isVerifiedServerOwner ||
    (config?.stripeSubscriptionId && config.stripeSubscriptionId.length > 5) ||
    matchedRpServer?.isSubscriptionActive ||
    matchedRpServer?.isVerifiedServerOwner
  );

  // Strict authorization: ONLY L4 Global Admins OR verified paid Server Owners can view & review applications
  const hasReviewAccess = isL4Admin || (isServerOwner && isVerifiedPayment);

  // Staff note and rejection modal state
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [rejectingApp, setRejectingApp] = useState<WhitelistApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('Insufficient backstory detail. Please elaborate on character motivations, realistic backstory, and submit again.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [gradingAppId, setGradingAppId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunAiAudit = async (app: WhitelistApplication) => {
    setGradingAppId(app.id);
    try {
      const res = await fetch('/api/servers/whitelist/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: app.id,
          answers: app.answers,
          questions: config?.customQuestions || [],
          serverName: config?.serverName || serverSlug,
          serverSlug,
          applicantUsername: app.applicantUsername || app.discordTag,
          discordTag: app.discordTag
        })
      });

      const data = await res.json();
      const audit = data.aiAudit || data.audit;
      if (data.success && audit) {
        // Update local state immediately
        setApplications(prev => prev.map(a => a.id === app.id ? { ...a, aiAudit: audit, status: data.status || a.status } : a));
        // Persist to Firestore and local storage cache so it persists on page refresh
        await updateApplicationAudit(app.id, audit, data.status || app.status);
        showToast(`⚡ AI Pre-Screening completed: Score ${audit.score}/100 (${audit.recommendation})`);
      } else {
        alert(`AI Audit notice: ${data.message || data.error || 'Failed to grade application.'}`);
      }
    } catch (err: any) {
      alert(`AI Audit error: ${err.message}`);
    } finally {
      setGradingAppId(null);
    }
  };

  // 1. Initial Load & Conditional Live Subscription (Only for authorized L4 or Server Owner)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    setLoading(true);

    const init = async () => {
      try {
        const formConfig = await getFormConfigBySlug(serverSlug);
        if (!isMounted) return;
        setConfig(formConfig);

        // Check authorization after fetching config
        const userIsL4 = Boolean(
          currentUser && (
            currentUser.isAdmin ||
            (currentUser.email && [
              'admin@vicecity.app',
              'lucia.vice@outlook.com',
              'l4_admin@vicecity.app'
            ].includes(currentUser.email.toLowerCase()))
          )
        );
        const userIsOwner = Boolean(
          currentUser && formConfig && (
            (formConfig.ownerUid && formConfig.ownerUid === currentUser.uid) ||
            (formConfig.ownerUid && currentUser.email && formConfig.ownerUid.toLowerCase() === currentUser.email.toLowerCase())
          )
        );

        if (formConfig && (userIsL4 || userIsOwner)) {
          // Subscribe to real-time updates ONLY if authorized
          unsubscribe = subscribeToApplicationsByServer(formConfig.serverId, (liveApps) => {
            if (!isMounted) return;
            setApplications(liveApps);

            // Populate notes map
            setNotesState(prev => {
              const updated = { ...prev };
              liveApps.forEach(a => {
                if (a.reviewerNotes !== undefined && updated[a.id] === undefined) {
                  updated[a.id] = a.reviewerNotes;
                }
              });
              return updated;
            });

            if (liveApps.length > 0 && !expandedAppId) {
              setExpandedAppId(liveApps[0].id);
            }
          }, serverSlug);
        }
      } catch (err) {
        console.warn('Failed to load review queue:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [serverSlug, currentUser?.uid, currentUser?.email, currentUser?.isAdmin]);

  const handleManualRefresh = async () => {
    if (!config || !hasReviewAccess) return;
    setRefreshing(true);
    try {
      const apps = await getApplicationsByServer(config.serverId, serverSlug);
      setApplications(apps);
      showToast(`Refreshed queue: ${apps.length} applications loaded`);
    } catch (err) {
      console.warn('Manual refresh failed:', err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleStatusChange = async (
    applicationId: string, 
    newStatus: WhitelistApplicationStatus, 
    customNote?: string
  ) => {
    if (!hasReviewAccess) {
      alert('Access Denied: Only the verified Server Owner or Level 4 Administrators can review applications.');
      return;
    }

    setActionInProgressId(applicationId);
    try {
      const reviewerName = currentUser?.displayName || (isL4Admin ? 'L4 Administrator' : isServerOwner ? 'Server Owner' : 'Staff');
      const noteToSave = customNote !== undefined ? customNote : (notesState[applicationId] || '');
      const targetApp = applications.find(a => a.id === applicationId);

      const res = await updateApplicationStatus(
        applicationId,
        newStatus,
        noteToSave,
        reviewerName,
        config?.discordWebhookUrl,
        config?.serverName,
        targetApp?.discordTag,
        config?.serverSlug || serverSlug,
        targetApp?.applicantEmail,
        targetApp?.applicantUsername
      );

      // Update local state immediately
      setApplications(prev => prev.map(a => {
        if (a.id === applicationId) {
          return {
            ...a,
            status: newStatus,
            reviewerNotes: noteToSave,
            reviewedBy: reviewerName,
            reviewedAt: Date.now(),
            emailSentAt: Date.now(),
            emailSentStatus: newStatus,
            emailSentRecipient: res?.emailResult?.recipient || a.applicantEmail || `${(a.discordTag || 'applicant').split('#')[0].toLowerCase()}@vicecity.app`
          };
        }
        return a;
      }));

      if (rejectingApp?.id === applicationId) {
        setRejectingApp(null);
      }

      const emailRecipient = res?.emailResult?.recipient || targetApp?.applicantEmail || 'Applicant Email';
      showToast(`✅ Status marked as ${newStatus.toUpperCase()}! Discord notification & Status Email dispatched to ${emailRecipient}.`);
    } catch (err: any) {
      alert(`Failed to update application status: ${err.message}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handlePreviewAndSendEmail = async (app: WhitelistApplication, forcedStatus?: WhitelistApplicationStatus) => {
    setIsDispatchingEmail(true);
    try {
      const statusToUse = forcedStatus || app.status;
      const reviewerName = currentUser?.displayName || (isL4Admin ? 'L4 Administrator' : isServerOwner ? 'Server Owner' : 'Staff');
      const reviewerNote = notesState[app.id] || app.reviewerNotes || '';

      const res = await sendWhitelistEmailNotification({
        applicationId: app.id,
        status: statusToUse,
        serverName: config?.serverName || 'Vice City Life RP',
        serverSlug: config?.serverSlug || serverSlug,
        applicantUid: app.applicantUid,
        applicantEmail: app.applicantEmail,
        applicantUsername: app.applicantUsername || (app.discordTag ? app.discordTag.split('#')[0] : 'Applicant'),
        discordTag: app.discordTag,
        reviewerNotes: reviewerNote,
        reviewedBy: reviewerName
      });

      if (res.success) {
        setPreviewModalApp(app);
        setPreviewModalHtml(res.renderedHtml || null);
        setPreviewModalRecipient(res.recipient || app.applicantEmail || 'Applicant Email');
        showToast(`✉️ Whitelist status email dispatched to ${res.recipient}!`);
        
        // Update local app state
        setApplications(prev => prev.map(a => a.id === app.id ? {
          ...a,
          emailSentAt: Date.now(),
          emailSentStatus: statusToUse,
          emailSentRecipient: res.recipient
        } : a));
      } else {
        alert(`Email trigger error: ${res.error || 'Failed to dispatch email'}`);
      }
    } catch (err: any) {
      alert(`Email dispatch error: ${err.message}`);
    } finally {
      setIsDispatchingEmail(false);
    }
  };

  const handleSaveNote = async (applicationId: string) => {
    if (!hasReviewAccess) return;
    const note = notesState[applicationId] || '';
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    await handleStatusChange(applicationId, app.status, note);
    showToast('Reviewer note saved successfully!');
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!hasReviewAccess) return;

    if (!confirm('Are you sure you want to permanently delete this application record from the queue?')) {
      return;
    }

    setActionInProgressId(applicationId);
    try {
      await deleteApplication(applicationId);
      setApplications(prev => prev.filter(a => a.id !== applicationId));
      showToast('Application deleted successfully.');
    } catch (err: any) {
      alert(`Failed to delete application: ${err.message}`);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleGenerateTestApplicant = async () => {
    if (!config || !hasReviewAccess) return;
    setGeneratingTest(true);
    try {
      const newApp = await createTestApplication(config.serverId, config.serverName);
      setApplications(prev => [newApp, ...prev.filter(a => a.id !== newApp.id)]);
      setExpandedAppId(newApp.id);
      showToast(`⚡ Generated test applicant (${newApp.discordTag})!`);
    } catch (err: any) {
      alert(`Failed to create test application: ${err.message}`);
    } finally {
      setGeneratingTest(false);
    }
  };

  // Filtered Applications
  const filteredApps = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSearch = 
      app.discordTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.discordId.includes(searchQuery) ||
      Object.values(app.answers).some(ans => ans.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalApps = applications.length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const underReviewCount = applications.filter(a => a.status === 'under_review').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;
  const approvalRate = totalApps > 0 ? Math.round((approvedCount / totalApps) * 100) : 0;

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Verifying Server Ownership & Clearance...</p>
      </div>
    );
  }

  // UNCLAIMED OR UNPAID SERVER LISTING SCREEN (ZERO-FREE-ACCESS PAYWALL GATING)
  if (!isL4Admin && (!isServerOwner || !isVerifiedPayment)) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 space-y-6">
        <div className="bg-zinc-900 border border-violet-500/30 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Crown Icon */}
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-300 flex items-center justify-center mx-auto shadow-inner">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>

          {/* Heading and Description */}
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider">
              <span>External Directory Listing</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Official External Community
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              <strong className="text-white">{matchedRpServer.name}</strong> processes whitelist applications directly through their official portal. There is no on-platform applicant queue for this listing unless claimed by the verified server owner.
            </p>
          </div>

          {/* Navigation CTA Options */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate?.('servers-onboarding', matchedRpServer.id)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>Claim & Activate Whitelist SaaS ($29/mo)</span>
            </button>

            <button
              onClick={() => onNavigate?.('/rp-servers')}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
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
  // ACCESS RESTRICTED SCREEN
  // =========================================================================
  if (!hasReviewAccess) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>

          {/* Heading and Description */}
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider">
              <span>Authorization Required</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Access Restricted
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              You do not have permission to view or manage applicant submissions for{' '}
              <strong className="text-white">{config?.serverName || 'this server'}</strong>.
              To protect applicant data privacy and confidential citizen records, this area is restricted to authorized personnel.
            </p>
          </div>

          {/* Player & Applicant Navigation CTA Options */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate?.(`/servers/${config?.serverSlug || serverSlug}/apply`, config?.serverSlug || serverSlug)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Apply for Whitelist</span>
            </button>

            <button
              onClick={() => onNavigate?.(`/servers/${config?.serverSlug || serverSlug}/status`, config?.serverSlug || serverSlug)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Check My Application Status</span>
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
  // AUTHORIZED QUEUE DASHBOARD
  // =========================================================================
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-indigo-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Whitelist Review Queue
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">
                {config?.serverName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Authorized Access
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-indigo-400 shrink-0" />
              <span>Applicant Review Queue</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Review applicant character submissions, inspect backstory answers, append staff feedback, and trigger 1-click approvals with Discord webhook role dispatches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate?.(`/servers/${config?.serverSlug || serverSlug}/dashboard`, config?.serverSlug || serverSlug)}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Owner Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate?.(`/servers/${config?.serverSlug || serverSlug}/manage`, config?.serverSlug || serverSlug)}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <span>Manage Form Schema</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition flex items-center justify-center border border-zinc-700 cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Submissions</span>
            <span className="text-lg font-black text-white">{totalApps}</span>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Pending Review</span>
            <span className="text-lg font-black text-amber-400">{pendingCount}</span>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Under Review</span>
            <span className="text-lg font-black text-cyan-400">{underReviewCount}</span>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Approved Citizens</span>
            <span className="text-lg font-black text-emerald-400">{approvedCount}</span>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Acceptance Rate</span>
            <span className="text-lg font-black text-indigo-400">{approvalRate}%</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'under_review', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab === 'all' && `All (${totalApps})`}
              {tab === 'pending' && `Pending (${pendingCount})`}
              {tab === 'under_review' && `In Review (${underReviewCount})`}
              {tab === 'approved' && `Approved (${approvedCount})`}
              {tab === 'rejected' && `Rejected (${rejectedCount})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Discord tag, ID, or answers..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Applications Feed */}
      <div className="space-y-4">
        {filteredApps.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center space-y-4">
            <Users className="w-12 h-12 text-zinc-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Applications Found</h3>
              <p className="text-xs text-zinc-400">There are currently no applicant records matching your search or status filter.</p>
            </div>
          </div>
        ) : (
          filteredApps.map((app) => {
            const isExpanded = expandedAppId === app.id;
            const isActioning = actionInProgressId === app.id;

            return (
              <div
                key={app.id}
                className={`bg-zinc-900 border transition-all duration-200 rounded-2xl overflow-hidden ${
                  isExpanded ? 'border-indigo-500/50 shadow-xl' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header Card Row */}
                <div
                  onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-800/30 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={resolveApplicantAvatar(app.discordAvatar, app.discordTag || app.applicantUsername)}
                      alt={app.discordTag}
                      className="w-11 h-11 rounded-full border border-zinc-700 object-cover shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-white">{app.discordTag}</span>
                        
                        {/* Status Badge */}
                        {app.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase">
                            Pending Review
                          </span>
                        )}
                        {app.status === 'under_review' && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-extrabold uppercase">
                            Under Review
                          </span>
                        )}
                        {app.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <Check className="w-3 h-3" /> Approved Citizen
                          </span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <X className="w-3 h-3" /> Declined
                          </span>
                        )}

                        {/* AI Whitelist Pre-Screen Badge */}
                        {app.aiAudit ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 border ${
                              app.aiAudit.recommendation === 'Fast-Track'
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : app.aiAudit.recommendation === 'Flagged'
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            }`}
                            title={`AI Pre-Screen: ${app.aiAudit.score}/100 - ${app.aiAudit.recommendation}`}
                          >
                            <Bot className="w-3 h-3" />
                            <span>AI {app.aiAudit.recommendation} ({app.aiAudit.score})</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-mono flex items-center gap-1">
                            <Bot className="w-2.5 h-2.5 text-zinc-500" />
                            <span>AI Pending</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-mono flex-wrap">
                        <span>Discord ID: {app.discordId}</span>
                        <span>•</span>
                        <span>{new Date(app.createdAt).toLocaleString()}</span>
                        {app.reviewedBy && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400">Reviewed by {app.reviewedBy}</span>
                          </>
                        )}
                        {app.applicantEmail && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-300 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-indigo-400 inline" /> {app.applicantEmail}
                            </span>
                          </>
                        )}
                        {app.emailSentAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">✉️ Email Dispatched</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Header Controls */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewAndSendEmail(app);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold flex items-center gap-1 border border-amber-500/20 transition cursor-pointer"
                      title="Inspect / Send Status Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Trigger</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedAppId(isExpanded ? null : app.id);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Answers & Actions Section */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 p-5 sm:p-6 bg-zinc-950/40 space-y-6">
                    {/* AI Whitelist Pre-Screening Insights Panel */}
                    <div className="bg-zinc-900/90 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                                AI Lore & Rule Pre-Screening Audit
                              </h4>
                              {app.aiAudit?.modelUsed && (
                                <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                                  {app.aiAudit.modelUsed}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400">
                              Automated analysis of NLR comprehension, Metagaming, Powergaming, and backstory depth.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRunAiAudit(app)}
                          disabled={gradingAppId === app.id}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 disabled:cursor-not-allowed shrink-0"
                        >
                          {gradingAppId === app.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Analyzing Lore & Rules...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                              <span>{app.aiAudit ? 'Re-run AI Pre-Screen' : 'Run AI Pre-Screening'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {app.aiAudit ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          {/* Score & Recommendation Card */}
                          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Overall Score</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                  app.aiAudit.recommendation === 'Fast-Track'
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                    : app.aiAudit.recommendation === 'Flagged'
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                }`}
                              >
                                {app.aiAudit.recommendation}
                              </span>
                            </div>
                            <div className="my-2 flex items-baseline gap-2">
                              <span className="text-3xl font-black text-white">{app.aiAudit.score}</span>
                              <span className="text-xs font-medium text-zinc-500">/ 100 PTS</span>
                            </div>
                            <div className="space-y-1 text-[11px] text-zinc-400">
                              <div className="flex justify-between">
                                <span>Character Lore:</span>
                                <strong className="text-zinc-200">{app.aiAudit.loreScore ?? app.aiAudit.score}/100</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Rules Mastery:</span>
                                <strong className="text-zinc-200">{app.aiAudit.rulesScore ?? app.aiAudit.score}/100</strong>
                              </div>
                            </div>
                          </div>

                          {/* Summary Brief */}
                          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between md:col-span-2">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                              Staff Brief & Lore Verdict
                            </span>
                            <p className="text-xs text-zinc-200 leading-relaxed italic mb-3">
                              "{app.aiAudit.summary}"
                            </p>
                            
                            {/* Flags Checklist */}
                            <div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                                Rule Flags & Observations:
                              </span>
                              {app.aiAudit.flags && app.aiAudit.flags.length > 0 ? (
                                <ul className="space-y-1">
                                  {app.aiAudit.flags.map((flag, fIdx) => (
                                    <li key={fIdx} className="text-[11px] text-rose-400 flex items-start gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                                      <span>{flag}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>No Powergaming, Metagaming, or Fail RP flags detected.</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-950/60 border border-dashed border-zinc-800 rounded-xl p-4 text-center">
                          <p className="text-xs text-zinc-400">
                            This application has not been pre-screened yet. Click <strong>"Run AI Pre-Screening"</strong> to evaluate roleplay lore and rule compliance automatically.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Answers Breakdown */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Submitted Application Answers</span>
                      </h4>

                      <div className="space-y-3">
                        {Object.entries(app.answers).map(([questionText, answerText], ansIdx) => (
                          <div key={ansIdx} className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-4 space-y-1.5">
                            <span className="text-xs font-bold text-zinc-300 block">{questionText}</span>
                            <p className="text-xs text-zinc-100 whitespace-pre-wrap leading-relaxed">
                              {answerText}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Email Notification & Webhook Status Box */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-white">Transactional Email Delivery Trigger</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Destination: <strong className="text-zinc-200 font-mono">{app.applicantEmail || `${(app.discordTag || 'applicant').split('#')[0].toLowerCase()}@vicecity.app`}</strong> • Auto-triggered upon status decision.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePreviewAndSendEmail(app)}
                          disabled={isDispatchingEmail}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview & Dispatch Email</span>
                        </button>
                      </div>
                    </div>

                    {/* Reviewer Notes & Decision Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-800">
                      {/* Left: Staff Note Input */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Internal Reviewer Note</span>
                        </label>
                        <textarea
                          rows={3}
                          value={notesState[app.id] || ''}
                          onChange={(e) => setNotesState({ ...notesState, [app.id]: e.target.value })}
                          placeholder="e.g. Backstory approved, voice interview verified, passed Fear RP test..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveNote(app.id)}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition cursor-pointer"
                          >
                            Save Reviewer Note
                          </button>

                          <button
                            onClick={() => handleDeleteApplication(app.id)}
                            disabled={isActioning}
                            className="px-3 py-1.5 bg-zinc-900 hover:bg-rose-900/30 text-rose-400 border border-rose-900/30 text-xs font-medium rounded-lg transition cursor-pointer flex items-center gap-1"
                            title="Delete application record"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Right: 1-Click Status Action Triggers */}
                      <div className="space-y-3 flex flex-col justify-between">
                        <div>
                          <label className="text-xs font-bold text-zinc-300 block mb-1">
                            Decision & Live Notification
                          </label>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            Selecting Approve or Reject will immediately update citizen records and dispatch a formatted notification to your server's live webhook.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Mark In Review Button */}
                          <button
                            onClick={() => handleStatusChange(app.id, 'under_review')}
                            disabled={isActioning}
                            className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                            title="Mark as under review"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mark In Review</span>
                          </button>

                          {/* Decline / Reject Button */}
                          <button
                            onClick={() => setRejectingApp(app)}
                            disabled={isActioning}
                            className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                            title="Decline whitelist application"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline / Reject</span>
                          </button>

                          {/* Approve Whitelist Button */}
                          <button
                            onClick={() => handleStatusChange(app.id, 'approved')}
                            disabled={isActioning}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-40"
                            title="Approve whitelist & grant role"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Whitelist</span>
                          </button>

                          {/* Reset to Pending (if already decided) */}
                          {(app.status === 'approved' || app.status === 'rejected') && (
                            <button
                              onClick={() => handleStatusChange(app.id, 'pending')}
                              disabled={isActioning}
                              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition flex items-center gap-1 cursor-pointer"
                              title="Reset status back to Pending"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Reset to Pending</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setRejectingApp(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400">
                <XCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Decline Whitelist Application</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Applicant: <strong className="text-white">{rejectingApp.discordTag}</strong> (ID: {rejectingApp.discordId})
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">Quick Reason Preset</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Insufficient backstory depth / character motivation',
                  'Failed Fear RP scenario question',
                  'Unrealistic character name for serious roleplay',
                  'Suspected troll or rule-breaker history',
                  'Incomplete answers to mandatory questions'
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(reason)}
                    className={`p-2 rounded-xl text-left text-[11px] transition border cursor-pointer ${
                      rejectReason === reason
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">Feedback / Instructions for Applicant</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why the application was declined and what the player should adjust..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(rejectingApp.id, 'rejected', rejectReason)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection & Trigger Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewModalApp && previewModalHtml && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => {
                setPreviewModalApp(null);
                setPreviewModalHtml(null);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400">
                <Mail className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Rendered Transactional Email</h3>
              </div>
              <p className="text-xs text-zinc-400">
                Target: <strong className="text-white">{previewModalRecipient}</strong> • Trigger: Whitelist Status ({previewModalApp.status.toUpperCase()})
              </p>
            </div>

            {/* Email HTML Container */}
            <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-2 min-h-[350px]">
              <iframe
                srcDoc={previewModalHtml}
                title="Email Preview"
                className="w-full h-full min-h-[350px] border-0 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-[11px] text-zinc-400">
                Dispatched to Firestore <code className="text-indigo-400">mail</code> & <code className="text-indigo-400">sentEmails</code> + Transactional Webhook
              </span>
              <button
                onClick={() => {
                  setPreviewModalApp(null);
                  setPreviewModalHtml(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
