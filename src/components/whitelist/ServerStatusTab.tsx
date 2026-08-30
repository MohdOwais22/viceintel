'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  AlertCircle, 
  Terminal, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Mail,
  Send,
  BellRing,
  X
} from 'lucide-react';
import { WhitelistApplication, WhitelistFormConfig, UserProfile } from '../../types';
import { 
  getUserApplicationForServer, 
  getFormConfigBySlug,
  normalizeServerSlug,
  sendWhitelistEmailNotification,
  getUserProfile
} from '../../lib/whitelist-service';
import { copyToClipboard } from '../../lib/copyUtils';
import { RP_SERVERS_DATA } from '../../data/rpServers';

interface ServerStatusTabProps {
  serverSlug: string;
  onNavigate?: (path: string, slug?: string) => void;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
  } | null;
  onOpenAuth?: () => void;
}

export const ServerStatusTab: React.FC<ServerStatusTabProps> = ({
  serverSlug,
  onNavigate,
  currentUser,
  onOpenAuth
}) => {
  const [config, setConfig] = useState<WhitelistFormConfig | null>(null);
  const [application, setApplication] = useState<WhitelistApplication | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const isDiscordMismatch = Boolean(
    application &&
    application.status === 'approved' &&
    application.discordId &&
    (!userProfile?.discordConnected || !userProfile?.discordId || String(userProfile.discordId).trim() !== String(application.discordId).trim())
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedConnect, setCopiedConnect] = useState(false);

  // Email Notification Trigger States
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailNotificationNotice, setEmailNotificationNotice] = useState<{
    type: 'success' | 'error';
    message: string;
    timestamp?: number;
  } | null>(null);
  const [lastEmailSentAt, setLastEmailSentAt] = useState<number | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Function to trigger automated or manual transactional email notification
  const triggerStatusEmailNotification = async (
    appToNotify: WhitelistApplication,
    oldStatus?: string | null,
    newStatus?: string | null,
    isManualTrigger = false
  ) => {
    if (!appToNotify || !appToNotify.id) return;
    setIsSendingEmail(true);

    try {
      const recipientEmail = (appToNotify.applicantEmail || currentUser?.email || `${appToNotify.discordTag?.split('#')[0] || 'citizen'}@vicecity.app`).trim();
      const recipientUsername = appToNotify.applicantUsername || currentUser?.displayName || appToNotify.discordTag?.split('#')[0] || 'ViceCitizen';

      const res = await sendWhitelistEmailNotification({
        applicationId: appToNotify.id,
        status: appToNotify.status,
        serverName: config?.serverName || appToNotify.serverId || 'FiveM RP Server',
        serverSlug: config?.serverSlug || serverSlug,
        applicantUid: appToNotify.applicantUid || currentUser?.uid,
        applicantEmail: recipientEmail,
        applicantUsername: recipientUsername,
        discordTag: appToNotify.discordTag,
        reviewerNotes: appToNotify.reviewerNotes || '',
        reviewedBy: appToNotify.reviewedBy || 'Server Staff',
        connectUrl: rpServer?.connectUrl || 'cfx.re/join/vclife1',
        discordInviteUrl: config?.discordInviteUrl || config?.customBranding?.discordInviteUrl || rpServer?.officialDiscordUrl || 'https://discord.gg/vicecity'
      });

      const now = Date.now();
      if (res.success) {
        setLastEmailSentAt(now);
        setApplication(prev => prev ? { ...prev, emailSentAt: now } : null);

        const statusLabel = appToNotify.status.toUpperCase().replace('_', ' ');
        const triggerMode = isManualTrigger ? 'Manual Dispatch' : 'Automated Status Change Trigger';
        const msg = `⚡ ${triggerMode}: Email notification successfully delivered to ${res.recipient || recipientEmail} for status '${statusLabel}'.`;

        setEmailNotificationNotice({
          type: 'success',
          message: msg,
          timestamp: now
        });
      } else {
        setEmailNotificationNotice({
          type: 'error',
          message: `Email trigger attempt: ${res.error || 'Failed to send notification email.'}`
        });
      }
    } catch (err: any) {
      console.warn('[ServerStatusTab] Exception triggering status email:', err);
      setEmailNotificationNotice({
        type: 'error',
        message: `Email notification exception: ${err?.message || 'Network communication error'}`
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const formConfig = await getFormConfigBySlug(serverSlug);
      const resolvedConfig = formConfig || {
        serverId: serverSlug,
        serverSlug: normalizeServerSlug(serverSlug),
        serverName: serverSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        ownerUid: 'system_admin',
        discordGuildId: '',
        discordRoleId: '',
        discordWebhookUrl: '',
        isSubscriptionActive: true,
        customQuestions: []
      };
      setConfig(resolvedConfig);

      if (currentUser?.uid) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (profileErr) {
          console.warn('Error fetching profile in ServerStatusTab:', profileErr);
        }

        const targetServerId = resolvedConfig.serverId || serverSlug;
        const app = await getUserApplicationForServer(targetServerId, currentUser.uid, serverSlug);
        
        if (app) {
          if (!prevStatusRef.current) {
            prevStatusRef.current = app.status;
          } else if (prevStatusRef.current !== app.status) {
            // Status updated since last fetch! Trigger automated email
            console.log(`[ServerStatusTab] Status change detected on load: '${prevStatusRef.current}' -> '${app.status}'`);
            triggerStatusEmailNotification(app, prevStatusRef.current, app.status, false);
            prevStatusRef.current = app.status;
          }
        }
        setApplication(app);
      }
    } catch (err) {
      console.warn('Error loading application status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [serverSlug, currentUser?.uid]);

  // Set up real-time listener for the user's application document in Firestore with Automated Status Change Trigger
  useEffect(() => {
    if (!application?.id) return;

    try {
      const { doc, onSnapshot } = require('firebase/firestore');
      const { db } = require('../../lib/firebase');
      const docRef = doc(db, 'whitelist_applications', application.id);

      const unsubscribe = onSnapshot(docRef, (snap: any) => {
        if (snap.exists()) {
          const updated = snap.data() as WhitelistApplication;
          if (updated) {
            const oldStatus = prevStatusRef.current;
            const newStatus = updated.status;

            // Trigger automated email whenever status transitions to a new state
            if (oldStatus && oldStatus !== newStatus) {
              console.log(`[ServerStatusTab] Real-time status update detected: '${oldStatus}' -> '${newStatus}'. Firing automated email trigger.`);
              triggerStatusEmailNotification(updated, oldStatus, newStatus, false);
            }

            prevStatusRef.current = newStatus;
            setApplication(updated);
          }
        }
      }, (err: any) => {
        console.warn('Real-time status listener notice:', err);
      });

      return () => unsubscribe();
    } catch {}
  }, [application?.id]);

  // Look up connect URL from RP servers data
  const rpServer = RP_SERVERS_DATA.find(
    s => s.id === config?.serverId || normalizeServerSlug(s.name) === normalizeServerSlug(serverSlug)
  );

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (timestamp?: number) => {
    if (!timestamp) return '';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleCopyConnect = () => {
    const connectCmd = `connect ${rpServer?.connectUrl || 'cfx.re/join/vclife1'}`;
    copyToClipboard(connectCmd);
    setCopiedConnect(true);
    setTimeout(() => setCopiedConnect(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Checking Whitelist Status...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In to Track Whitelist Status</h2>
        <p className="text-xs text-zinc-400">
          Sign in with your account to view the real-time review progress of your whitelist application.
        </p>
        <button
          onClick={() => onOpenAuth?.()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/25 cursor-pointer"
        >
          Sign In with Account
        </button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Active Application Found</h2>
        <p className="text-xs text-zinc-400">
          You have not submitted a whitelist application for <strong>{config?.serverName || serverSlug}</strong> yet.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => onNavigate?.(`/servers/${config?.serverSlug || serverSlug}/apply`, config?.serverSlug || serverSlug)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            Submit Application Now
          </button>
          <button
            onClick={() => onNavigate?.('/rp-servers')}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-xl transition cursor-pointer"
          >
            RP Servers Directory
          </button>
        </div>
      </div>
    );
  }

  const status = application.status;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" /> Live Status Tracker
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Server className="w-7 h-7 text-indigo-400 shrink-0" />
              <span>{config?.serverName}</span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono">Application ID: {application.id}</p>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition flex items-center gap-2 border border-zinc-700 self-start sm:self-center cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Visual Stepper Component */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Application Journey
            </span>
            <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold border ${
              status === 'approved'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : status === 'rejected'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : status === 'under_review'
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {status === 'approved' && '● Stage 3/3 — Whitelisted'}
              {status === 'rejected' && '● Stage 3/3 — Decision Finalized'}
              {status === 'under_review' && '● Stage 2/3 — Under Active Review'}
              {status === 'pending' && '● Stage 1/3 — Submitted to Queue'}
            </span>
          </div>

          {/* Stepper Track & Nodes */}
          <div className="relative px-3 sm:px-6 py-5 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 shadow-inner">
            {/* Background Connector Bar (Desktop) */}
            <div className="absolute top-10 left-16 right-16 h-1 bg-zinc-800 rounded-full hidden sm:block pointer-events-none" />
            
            {/* Active Progress Connector Fill (Desktop) */}
            <div 
              className={`absolute top-10 left-16 h-1 rounded-full hidden sm:block transition-all duration-700 pointer-events-none ${
                status === 'approved'
                  ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 shadow-sm shadow-emerald-500/50'
                  : status === 'rejected'
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500'
                  : status === 'under_review'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-sm shadow-cyan-400/50'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-500'
              }`}
              style={{
                width: status === 'approved' || status === 'rejected' 
                  ? 'calc(100% - 8rem)' 
                  : status === 'under_review' 
                  ? 'calc(50% - 4rem)' 
                  : 'calc(25% - 2rem)'
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 relative z-10">
              {/* Step 1: Submitted */}
              <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2.5">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 border-2 border-emerald-300 text-zinc-950 font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5 text-zinc-950" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-zinc-950 flex items-center justify-center text-[9px] font-bold text-zinc-950">✓</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center sm:justify-center gap-1.5">
                    <span className="text-xs font-black text-white">1. Submitted</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">Done</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-medium">{formatDate(application.createdAt)}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">({getTimeAgo(application.createdAt)})</p>
                </div>
              </div>

              {/* Step 2: Under Review */}
              <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2.5">
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full border-2 font-black text-sm flex items-center justify-center transition shadow-lg ${
                    status === 'under_review'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-4 ring-cyan-500/20 shadow-cyan-500/30 animate-pulse'
                      : status === 'approved' || status === 'rejected'
                      ? 'bg-emerald-500 border-emerald-300 text-zinc-950 shadow-emerald-500/25'
                      : 'bg-amber-500/20 border-amber-500/60 text-amber-400 shadow-amber-500/20'
                  }`}>
                    {status === 'approved' || status === 'rejected' ? (
                      <CheckCircle2 className="w-5 h-5 text-zinc-950" />
                    ) : status === 'under_review' ? (
                      <Clock className="w-5 h-5 text-cyan-300 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center sm:justify-center gap-1.5">
                    <span className={`text-xs font-black ${
                      status === 'under_review' ? 'text-cyan-300' : 'text-white'
                    }`}>
                      2. Staff Review
                    </span>
                    <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded border ${
                      status === 'under_review'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                        : status === 'approved' || status === 'rejected'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {status === 'pending' ? 'In Queue' : status === 'under_review' ? 'Reviewing' : 'Completed'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-medium">
                    {status === 'pending'
                      ? 'Awaiting Staff Pickup'
                      : status === 'under_review'
                      ? `Reviewed by ${application.reviewedBy || 'Staff'}`
                      : 'Review Completed'}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">Turnaround ~2-6 hrs</p>
                </div>
              </div>

              {/* Step 3: Decision */}
              <div className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2.5">
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full border-2 font-black text-sm flex items-center justify-center transition shadow-lg ${
                    status === 'approved'
                      ? 'bg-emerald-500 border-emerald-300 text-zinc-950 ring-4 ring-emerald-500/20 shadow-emerald-500/30'
                      : status === 'rejected'
                      ? 'bg-rose-500 border-rose-400 text-white ring-4 ring-rose-500/20 shadow-rose-500/30'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                  }`}>
                    {status === 'approved' ? (
                      <CheckCircle2 className="w-5 h-5 text-zinc-950" />
                    ) : status === 'rejected' ? (
                      <XCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center sm:justify-center gap-1.5">
                    <span className={`text-xs font-black ${
                      status === 'approved'
                        ? 'text-emerald-400'
                        : status === 'rejected'
                        ? 'text-rose-400'
                        : 'text-zinc-400'
                    }`}>
                      3. Decision Reached
                    </span>
                    <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded border ${
                      status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>
                      {status === 'approved' ? 'Passed' : status === 'rejected' ? 'Declined' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-medium">
                    {status === 'approved'
                      ? 'Whitelisted & Role Granted'
                      : status === 'rejected'
                      ? 'Application Declined'
                      : 'Decision Pending'}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {status === 'approved' || status === 'rejected' ? 'Finalized' : 'Awaiting Action'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Status Detail Box */}
      {status === 'approved' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-zinc-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">Congratulations! You are Whitelisted.</h2>
              <p className="text-xs text-zinc-200 leading-relaxed">
                Your character application has been approved by <strong>{application.reviewedBy || 'Server Administration'}</strong>. The Whitelisted Citizen role has been granted to your Discord account (<code className="text-emerald-300 font-mono">@{application.discordTag}</code>).
              </p>
            </div>
          </div>

          {isDiscordMismatch ? (
            <div className="bg-zinc-950/90 border border-amber-500/40 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-sm font-extrabold text-amber-400 block">⚠️ DISCORD IDENTITY MISMATCH DETECTED</span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    To protect server integrity and prevent whitelist bypass/spoofing, server connection commands and community invite links are strictly locked. You can only view these details when logged in with the matching Discord account that submitted this application.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">Whitelisted Discord Account</span>
                  <div className="font-bold text-white font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>@{application.discordTag}</span>
                  </div>
                  <span className="text-zinc-500 text-[10px] block font-mono">ID: {application.discordId}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block">Your Connected Discord Account</span>
                  <div className={`font-bold font-mono flex items-center gap-1.5 ${userProfile?.discordConnected ? 'text-rose-400' : 'text-zinc-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${userProfile?.discordConnected ? 'bg-rose-500' : 'bg-zinc-500'}`} />
                    <span>{userProfile?.discordConnected ? `@${userProfile?.discordUsername}` : 'Not Connected'}</span>
                  </div>
                  <span className="text-zinc-500 text-[10px] block font-mono">ID: {userProfile?.discordId || 'N/A'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate?.('/profile')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Connect / Switch Discord Account</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Connect Command Box */}
              <div className="bg-zinc-950 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" /> Server Direct Connect Command
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-indigo-300 font-mono bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800 truncate flex-1">
                    connect {rpServer?.connectUrl || 'cfx.re/join/vclife1'}
                  </code>
                  <button
                    onClick={handleCopyConnect}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    {copiedConnect ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedConnect ? 'Copied!' : 'Copy Command'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Launch FiveM &gt; Press F8 on your keyboard &gt; Paste the connect command and press Enter.
                </p>
              </div>

              {/* Official Discord Channel Join Box */}
              <div className="bg-zinc-950 border border-indigo-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" /> Official Discord Server & Community Channels
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono">
                    Role Granted: @{application.discordTag || 'Citizen'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Click below to join the official <strong>{config?.serverName || rpServer?.name || 'FiveM RP'}</strong> Discord community, verify your Whitelisted Citizen role in-game, and access private voice comms.
                </p>
                <div>
                  <a
                    href={config?.discordInviteUrl || config?.customBranding?.discordInviteUrl || rpServer?.officialDiscordUrl || 'https://discord.gg/vicecity'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-900/30 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Join Official {config?.serverName || rpServer?.name || 'Community'} Discord</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="block text-[11px] font-mono text-indigo-400 mt-2 truncate">
                    🔗 {config?.discordInviteUrl || config?.customBranding?.discordInviteUrl || rpServer?.officialDiscordUrl || 'https://discord.gg/vicecity'}
                  </span>
                </div>
              </div>
            </>
          )}

          {application.reviewerNotes && (
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-1 text-xs">
              <span className="text-zinc-400 font-bold block">Staff Note:</span>
              <p className="text-zinc-200">{application.reviewerNotes}</p>
            </div>
          )}
        </div>
      )}

      {status === 'under_review' && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-cyan-400 animate-spin" />
            <h2 className="text-lg font-bold text-white">Application Under Active Review</h2>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            A staff member ({application.reviewedBy || 'Staff Reviewer'}) is currently reading your backstory and scenario answers. Keep your Discord DMs open for interview coordination.
          </p>
          {application.reviewerNotes && (
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-1 text-xs">
              <span className="text-cyan-400 font-bold block">Staff Note:</span>
              <p className="text-zinc-200">{application.reviewerNotes}</p>
            </div>
          )}
        </div>
      )}

      {status === 'pending' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Application Queued for Review</h2>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Your application has been received and added to the review queue. Most applications are reviewed within 2 to 6 hours.
          </p>
        </div>
      )}

      {status === 'rejected' && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Application Not Accepted</h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Your application was declined at this time. Please review the staff feedback below before submitting an updated application.
              </p>
            </div>
          </div>

          {application.reviewerNotes && (
            <div className="bg-zinc-950 border border-rose-500/30 rounded-xl p-4 space-y-1 text-xs">
              <span className="text-rose-400 font-bold block">Staff Feedback:</span>
              <p className="text-zinc-200">{application.reviewerNotes}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => onNavigate?.(`/servers/${config?.serverSlug || serverSlug}/apply`, config?.serverSlug || serverSlug)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Re-Apply with Updates
            </button>
          </div>
        </div>
      )}

      {/* Automated Email Notification Trigger Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        {/* Email Dispatch Result Notification Toast / Alert */}
        {emailNotificationNotice && (
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs animate-fadeIn ${
            emailNotificationNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-start gap-2.5">
              <BellRing className={`w-4 h-4 shrink-0 mt-0.5 ${
                emailNotificationNotice.type === 'success' ? 'text-emerald-400 animate-bounce' : 'text-rose-400'
              }`} />
              <div className="space-y-1">
                <span className="font-bold block uppercase tracking-wider text-[10px]">
                  {emailNotificationNotice.type === 'success' ? '⚡ Email Notification Triggered' : '⚠️ Email Notification Notice'}
                </span>
                <p className="leading-relaxed">{emailNotificationNotice.message}</p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotificationNotice(null)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Automated Email Trigger Engine</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
                  ● ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Decision notifications automatically fire whenever your application status updates. Linked inbox: <strong className="text-zinc-200">{application.applicantEmail || currentUser.email || 'your registered email'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Automated Dispatch Active</span>
            </span>

            {(application.emailSentAt || lastEmailSentAt) && (
              <span className="px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold rounded-xl flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Confirmation Dispatched</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Submitted Answers Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Your Submitted Responses</span>
        </h3>

        <div className="space-y-3">
          {Object.entries(application.answers).map(([q, ans], idx) => (
            <div key={idx} className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-1.5 text-xs">
              <span className="text-zinc-400 font-bold block">{q}</span>
              <p className="text-zinc-100 whitespace-pre-wrap leading-relaxed">{ans}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
