'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  ExternalLink, 
  Send, 
  Copy, 
  Check, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  Settings, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Download,
  Upload,
  Activity
} from 'lucide-react';
import { WhitelistFormConfig, WhitelistQuestion, WhitelistQuestionType } from '../../types';
import { RP_SERVERS_DATA } from '../../data/rpServers';
import { 
  getFormConfigBySlug, 
  saveFormConfig, 
  sendDiscordNotification, 
  DEFAULT_WHITELIST_QUESTIONS,
  normalizeServerSlug,
  checkSlugAvailabilityApi
} from '../../lib/whitelist-service';
import { copyToClipboard } from '../../lib/copyUtils';
import { isDiscordSnowflakeValid, isDiscordWebhookUrlValid } from '../ServerOnboardingWizard';
import { Lock, LogIn, Crown } from 'lucide-react';
import { ClaimButtonModal } from '../servers/ClaimButtonModal';
import { PaymentSuccessModal } from '../servers/PaymentSuccessModal';

interface ServerManageFormTabProps {
  serverSlug: string;
  onNavigate?: (path: string, slug?: string) => void;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
    discordUsername?: string;
    discordId?: string;
  } | null;
  onOpenAuth?: () => void;
}

export const ServerManageFormTab: React.FC<ServerManageFormTabProps> = ({
  serverSlug,
  onNavigate,
  currentUser,
  onOpenAuth
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'discord' | 'advanced'>('questions');

  // Discord Bot Provisioning & Failure Alert Test State
  const [provisioning, setProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<any>(null);
  const [testFailureSending, setTestFailureSending] = useState(false);
  const [testFailureResult, setTestFailureResult] = useState<any>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState<string | undefined>(undefined);
  const [paymentPlanTier, setPaymentPlanTier] = useState<string>('b2b_spotlight_whitelist');

  // Config State
  const [config, setConfig] = useState<WhitelistFormConfig>({
    serverId: serverSlug,
    serverSlug: normalizeServerSlug(serverSlug),
    serverName: 'Vice City RP Server',
    ownerUid: currentUser?.uid || 'system_admin',
    discordGuildId: '',
    discordRoleId: '',
    discordWebhookUrl: '',
    isSubscriptionActive: true,
    customQuestions: DEFAULT_WHITELIST_QUESTIONS
  });

  const isL4Admin = Boolean(currentUser && currentUser.isAdmin);

  const matchedRpServer = RP_SERVERS_DATA.find(
    s => s.id === serverSlug || normalizeServerSlug(s.name) === normalizeServerSlug(serverSlug)
  );

  const userDiscordId = currentUser?.discordId || (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_user_id') : null);
  const userDiscordUsername = currentUser?.discordUsername || (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_username') : null);

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
    config.isSubscriptionActive ||
    config.isVerifiedServerOwner ||
    (config.stripeSubscriptionId && config.stripeSubscriptionId.length > 5) ||
    matchedRpServer?.isSubscriptionActive ||
    matchedRpServer?.isVerifiedServerOwner
  );

  // Strict authorization: ONLY L4 Global Admins OR verified paid Server Owners can edit/manage the form builder
  const hasManageAccess = isL4Admin || (isServerOwner && isVerifiedPayment);

  // Portal URL slug checking state
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [slugError, setSlugError] = useState<string>('');

  useEffect(() => {
    if (!config.serverSlug) {
      setSlugStatus('idle');
      setSlugError('');
      return;
    }

    if (config.serverSlug === normalizeServerSlug(serverSlug)) {
      // It's the current slug of this server, so it is definitely available/fine
      setSlugStatus('available');
      setSlugError('');
      return;
    }

    setSlugStatus('checking');
    setSlugError('');

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await checkSlugAvailabilityApi(
          config.serverSlug,
          currentUser?.uid || undefined,
          currentUser?.email || undefined
        );
        if (res.available) {
          setSlugStatus('available');
          setSlugError('');
        } else if (res.taken) {
          setSlugStatus('taken');
          setSlugError(res.error || 'This slug is already claimed by another server.');
        } else {
          setSlugStatus('invalid');
          setSlugError(res.error || 'Invalid slug format.');
        }
      } catch (err: any) {
        setSlugStatus('idle');
        console.warn('Slug check error:', err);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [config.serverSlug, serverSlug, currentUser]);

  // Load Form Config & Check Stripe Return Params on Mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Check if returning from Stripe payment with success
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isPaymentSuccess = urlParams.get('paymentSuccess') === 'true' || urlParams.get('status') === 'success';
      const session = urlParams.get('session') || urlParams.get('session_id');
      const tier = urlParams.get('tier');

      if (isPaymentSuccess) {
        setShowPaymentSuccessModal(true);
        if (session) setPaymentSessionId(session);
        if (tier) setPaymentPlanTier(tier);
      }
    }

    getFormConfigBySlug(serverSlug).then((fetched) => {
      if (isMounted && fetched) {
        setConfig({
          ...fetched,
          customQuestions: Array.isArray(fetched.customQuestions) && fetched.customQuestions.length > 0
            ? fetched.customQuestions
            : DEFAULT_WHITELIST_QUESTIONS
        });
      }
      if (isMounted) setLoading(false);
    }).catch((err) => {
      console.warn('Error loading form config:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [serverSlug]);

  // Handle Question Changes
  const handleUpdateQuestion = (index: number, updates: Partial<WhitelistQuestion>) => {
    const list = Array.isArray(config.customQuestions) ? config.customQuestions : DEFAULT_WHITELIST_QUESTIONS;
    const updated = [...list];
    updated[index] = { ...updated[index], ...updates };
    setConfig({ ...config, customQuestions: updated });
  };

  const handleAddQuestion = (type: WhitelistQuestionType = 'text') => {
    const newQ: WhitelistQuestion = {
      id: `q_${Date.now()}`,
      question: 'New Question Title',
      type,
      required: true,
      placeholder: 'Enter response here...',
      options: type === 'multiple_choice' ? ['Option 1', 'Option 2', 'Option 3'] : undefined
    };
    const list = Array.isArray(config.customQuestions) ? config.customQuestions : DEFAULT_WHITELIST_QUESTIONS;
    setConfig({
      ...config,
      customQuestions: [...list, newQ]
    });
  };

  const handleDeleteQuestion = (index: number) => {
    const list = Array.isArray(config.customQuestions) ? config.customQuestions : DEFAULT_WHITELIST_QUESTIONS;
    if (list.length <= 1) {
      alert('Your whitelist application must have at least one question.');
      return;
    }
    const targetQ = list[index];
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm(`⚠️ Are you sure you want to delete question "${targetQ?.question || `Question #${index + 1}`}"?`)) {
        return;
      }
    }
    const updated = list.filter((_, i) => i !== index);
    setConfig({ ...config, customQuestions: updated });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const list = Array.isArray(config.customQuestions) ? config.customQuestions : DEFAULT_WHITELIST_QUESTIONS;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const updated = [...list];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setConfig({ ...config, customQuestions: updated });
  };

  const handleAddOption = (questionIndex: number) => {
    const list = Array.isArray(config.customQuestions) ? config.customQuestions : DEFAULT_WHITELIST_QUESTIONS;
    const q = list[questionIndex];
    if (!q) return;
    const options = q.options ? [...q.options, `Option ${q.options.length + 1}`] : ['Option 1', 'Option 2'];
    handleUpdateQuestion(questionIndex, { options });
  };

  const handleUpdateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const list = Array.isArray(config.customQuestions) ? config.customQuestions : DEFAULT_WHITELIST_QUESTIONS;
    const q = list[questionIndex];
    if (!q || !q.options) return;
    const options = [...q.options];
    options[optionIndex] = value;
    handleUpdateQuestion(questionIndex, { options });
  };

  const handleDeleteOption = (questionIndex: number, optionIndex: number) => {
    const list = Array.isArray(config.customQuestions) ? config.customQuestions : DEFAULT_WHITELIST_QUESTIONS;
    const q = list[questionIndex];
    if (!q || !q.options || q.options.length <= 2) {
      alert('Multiple choice questions require at least 2 options.');
      return;
    }
    if (typeof window !== 'undefined' && window.confirm) {
      if (!window.confirm(`⚠️ Delete option "${q.options[optionIndex]}"?`)) {
        return;
      }
    }
    const options = q.options.filter((_, i) => i !== optionIndex);
    handleUpdateQuestion(questionIndex, { options });
  };

  const handleSave = async () => {
    if (slugStatus === 'taken') {
      alert(`⚠️ Cannot save: ${slugError || 'This public URL slug is already claimed.'}`);
      return;
    }
    if (slugStatus === 'invalid') {
      alert(`⚠️ Cannot save: ${slugError || 'Please fix the public URL slug format.'}`);
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      if (config.serverSlug && config.serverSlug !== normalizeServerSlug(serverSlug)) {
        const slugCheck = await checkSlugAvailabilityApi(
          config.serverSlug,
          currentUser?.uid || undefined,
          currentUser?.email || undefined
        );
        if (!slugCheck.available) {
          throw new Error(slugCheck.error || 'This public URL slug is taken by another community.');
        }
      }

      const result = await saveFormConfig(
        {
          ...config,
          ownerUid: config.ownerUid || currentUser?.uid || 'system_admin'
        },
        currentUser?.uid,
        currentUser?.email,
        isL4Admin
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration. Check network connection or permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestDiscordWebhook = async () => {
    if (!config.discordWebhookUrl) {
      alert('Please enter a valid Discord Webhook URL first.');
      return;
    }

    setTestSending(true);
    try {
      const success = await sendDiscordNotification({
        type: 'test',
        serverName: config.serverName,
        webhookUrl: config.discordWebhookUrl
      });
      if (success) {
        alert('✅ Test Discord notification dispatched successfully! Check your Discord channel.');
      } else {
        alert('⚠️ Webhook request was sent. If no message appeared, verify your Discord Webhook URL is active.');
      }
    } catch (err: any) {
      alert(`Webhook error: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleRunProvisioning = async (forceFailure = false) => {
    const ownerId = (currentUser as any)?.discordId || config.ownerUid || '123456789012345678';
    setProvisioning(true);
    setProvisionResult(null);

    try {
      const res = await fetch('/api/servers/whitelist/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: config.serverId,
          serverName: config.serverName,
          serverSlug: config.serverSlug,
          ownerDiscordId: ownerId,
          tier: 'community',
          webhookUrl: config.discordWebhookUrl,
          forceFailureForTesting: forceFailure
        })
      });

      const data = await res.json();
      setProvisionResult(data);
    } catch (err: any) {
      setProvisionResult({
        success: false,
        error: err?.message || 'Provisioning API request failed',
        failureDmDispatched: false,
        logs: [`[Client Error]: ${err?.message}`]
      });
    } finally {
      setProvisioning(false);
    }
  };

  const handleTestFailureDm = async () => {
    const ownerId = (currentUser as any)?.discordId || '123456789012345678';
    setTestFailureSending(true);
    setTestFailureResult(null);

    try {
      const res = await fetch('/api/discord/test-provisioning-failure-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerDiscordId: ownerId,
          serverName: config.serverName,
          serverSlug: config.serverSlug,
          tier: 'community',
          errorReason: 'Discord API 50013: Missing Permissions (Bot requires MANAGE_ROLES and MANAGE_CHANNELS to automate whitelist provisioning)',
          stepFailed: 'permission_error'
        })
      });

      const data = await res.json();
      setTestFailureResult(data);
    } catch (err: any) {
      setTestFailureResult({
        success: false,
        error: err?.message || 'Failed to dispatch test failure DM'
      });
    } finally {
      setTestFailureSending(false);
    }
  };

  const handleCopyApplyLink = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/servers/${config.serverSlug}/apply`;
    copyToClipboard(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset custom questions to the default GTA VI Vice City standard template?')) {
      setConfig({
        ...config,
        customQuestions: DEFAULT_WHITELIST_QUESTIONS
      });
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${config.serverSlug}-whitelist-config.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400 text-sm">Loading Whitelist Portal Builder...</p>
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
              <span>Curated Directory Listing</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              External Community Listing
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              <strong className="text-white">{matchedRpServer.name}</strong> is listed as a curated external community. 
              To prevent duplicate forms or unauthorized access, on-platform whitelist forms cannot be modified unless claimed by the verified server owner.
            </p>
          </div>

          {/* Navigation CTA Options */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowClaimModal(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>Claim Listing (Verify Discord 0x8)</span>
            </button>

            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/billing`)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Billing &amp; Paywall ($49/mo)</span>
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

        <ClaimButtonModal
          server={matchedRpServer || {
            id: config.serverId,
            name: config.serverName,
            serverSlug: config.serverSlug,
            discordGuildId: config.discordGuildId
          }}
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          onClaimInitiated={(data) => {
            if (data?.redirectUrl && data?.stage === 'checkout_redirect') {
              window.location.href = data.redirectUrl;
            }
          }}
        />
      </div>
    );
  }

  // ACCESS RESTRICTED SCREEN
  if (!hasManageAccess) {
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
              You do not have permission to manage form configuration for{' '}
              <strong className="text-white">{config.serverName || 'this server'}</strong>.
              To protect server integration settings and webhook security, this area is restricted to verified administrators and active subscribers.
            </p>
          </div>

          {/* Navigation CTA Options */}
          <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowClaimModal(true)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>Claim Listing (Verify Discord 0x8)</span>
            </button>

            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/billing`)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Billing &amp; Paywall</span>
            </button>

            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/apply`, config.serverSlug)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Player Apply Portal</span>
            </button>

            <button
              onClick={() => onNavigate?.('/rp-servers')}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-zinc-800 cursor-pointer"
            >
              <Server className="w-4 h-4" />
              <span>Directory</span>
            </button>
          </div>
        </div>

        <ClaimButtonModal
          server={matchedRpServer || {
            id: config.serverId,
            name: config.serverName,
            serverSlug: config.serverSlug,
            discordGuildId: config.discordGuildId
          }}
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          onClaimInitiated={(data) => {
            if (data?.redirectUrl && data?.stage === 'checkout_redirect') {
              window.location.href = data.redirectUrl;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Banner Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> B2B Whitelist SaaS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live Automation Active
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Server className="w-7 h-7 text-indigo-400 shrink-0" />
              <span>{config.serverName} Whitelist Builder</span>
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              No-code dynamic application form builder, Discord OAuth player verification gate, and automated staff queue dispatcher.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/dashboard`, config.serverSlug)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 border border-amber-500/30 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Owner Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/apply`, config.serverSlug)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Player Apply Portal</span>
            </button>

            <button
              onClick={() => onNavigate?.(`/servers/${config.serverSlug}/review`, config.serverSlug)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Review Queue</span>
            </button>

            <button
              onClick={handleCopyApplyLink}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
              title="Copy direct shareable apply link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Subtabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-zinc-800/80">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Application Questions ({(config.customQuestions || DEFAULT_WHITELIST_QUESTIONS).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('discord')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'discord'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>Discord & Webhook Integration</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'advanced'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings & Export</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Center: Question Schema Builder */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Form Questions Schema</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetDefaults}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                >
                  Reset to Vice City Template
                </button>
              </div>
            </div>

            {/* List of Questions */}
            <div className="space-y-4">
              {(config.customQuestions || DEFAULT_WHITELIST_QUESTIONS).map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition rounded-xl p-4.5 space-y-3.5 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(idx, { question: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-bold focus:border-indigo-500 focus:outline-none"
                        placeholder="Question title / prompt..."
                      />
                    </div>

                    {/* Question Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        disabled={idx === (config.customQuestions || DEFAULT_WHITELIST_QUESTIONS).length - 1}
                        className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 transition cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(idx)}
                        className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer ml-1"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Type & Required Toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">Answer Field Type</label>
                      <select
                        value={q.type}
                        onChange={(e) => handleUpdateQuestion(idx, { 
                          type: e.target.value as WhitelistQuestionType,
                          options: e.target.value === 'multiple_choice' ? (q.options || ['Option 1', 'Option 2']) : undefined
                        })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="text">Single Line Text Input</option>
                        <option value="textarea">Paragraph / Essay Textarea (Backstories / Scenarios)</option>
                        <option value="multiple_choice">Multiple Choice (Radio / Selection)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 block mb-1">Placeholder / Instructions</label>
                      <input
                        type="text"
                        value={q.placeholder || ''}
                        onChange={(e) => handleUpdateQuestion(idx, { placeholder: e.target.value })}
                        placeholder="Hint text displayed inside field..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Multiple Choice Options Builder */}
                  {q.type === 'multiple_choice' && (
                    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-300">Answer Options</span>
                        <button
                          onClick={() => handleAddOption(idx)}
                          className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Option
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono">#{optIdx + 1}</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              onClick={() => handleDeleteOption(idx, optIdx)}
                              className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                              title="Delete option"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Checkbox */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300 font-medium">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleUpdateQuestion(idx, { required: e.target.checked })}
                        className="rounded accent-indigo-600 w-3.5 h-3.5"
                      />
                      <span>Mandatory Question (Required for submission)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Question Row */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleAddQuestion('text')}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-dashed border-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Text Question
              </button>

              <button
                onClick={() => handleAddQuestion('textarea')}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-dashed border-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Essay / Backstory Question
              </button>

              <button
                onClick={() => handleAddQuestion('multiple_choice')}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-dashed border-zinc-700 text-zinc-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Multiple Choice
              </button>
            </div>
          </div>

          {/* Right Column: Live Form Inspector & Save Card */}
          <div className="space-y-6">
            {/* Save Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 sticky top-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Publish Whitelist Schema</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Saving updates your server's live applicant form instantly in Firestore. All incoming submissions will adhere to this schema.
              </p>

              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Form Schema Saved & Published!</span>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing to Cloud...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Deploy Form</span>
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Questions count:</span>
                  <span className="font-bold text-white">{(config.customQuestions || DEFAULT_WHITELIST_QUESTIONS).length}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Discord gate:</span>
                  <span className="font-bold text-indigo-400">Enforced</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Webhook delivery:</span>
                  <span className={`font-bold ${config.discordWebhookUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {config.discordWebhookUrl ? 'Configured' : 'Needs Webhook'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4.5 space-y-2.5">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Best Practice Guidelines
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                • Always include at least 1 scenario question to assess Value of Life / FearRP comprehension.
                <br />• Use paragraph textareas for character background to discourage low-effort single-sentence submissions.
                <br />• Whitelist applications automatically capture verified Discord ID, Tag, and Avatar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Discord & Webhook Integration */}
      {activeTab === 'discord' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-400" />
              <span>Discord Guild & Webhook Automation</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Connect your Discord community server to receive instant rich embed notifications when players submit applications, and automate role delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5 flex items-center justify-between">
                  <span>Official Discord Server Invite Link</span>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase">Required for Approved Applicants</span>
                </label>
                <input
                  type="url"
                  value={config.discordInviteUrl || config.customBranding?.discordInviteUrl || ''}
                  onChange={(e) => {
                    const url = e.target.value;
                    setConfig({
                      ...config,
                      discordInviteUrl: url,
                      customBranding: {
                        ...(config.customBranding || {}),
                        discordInviteUrl: url
                      }
                    });
                  }}
                  placeholder="https://discord.gg/yourserver or https://discord.gg/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[11px] text-zinc-500 block mt-1">
                  Applicants who are approved will receive this link on their status page and in approval emails to join your server.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    Discord Webhook URL
                  </label>
                  {config.discordWebhookUrl?.trim() && (
                    isDiscordWebhookUrlValid(config.discordWebhookUrl) ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid Webhook
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Invalid Webhook URL
                      </span>
                    )
                  )}
                </div>
                <input
                  type="url"
                  value={config.discordWebhookUrl}
                  onChange={(e) => setConfig({ ...config, discordWebhookUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/1234567890/abcdef..."
                  className={`w-full bg-zinc-950 border rounded-xl p-3 text-xs text-white font-mono focus:outline-none transition ${
                    !config.discordWebhookUrl?.trim()
                      ? 'border-zinc-800 focus:border-indigo-500'
                      : isDiscordWebhookUrlValid(config.discordWebhookUrl)
                      ? 'border-emerald-500/70 bg-emerald-950/20 text-emerald-200 focus:border-emerald-400'
                      : 'border-rose-500/70 bg-rose-950/20 text-rose-200 focus:border-rose-400'
                  }`}
                />
                {config.discordWebhookUrl?.trim() && !isDiscordWebhookUrlValid(config.discordWebhookUrl) ? (
                  <p className="text-[11px] text-rose-400 block mt-1 font-medium">
                    Must be a valid Discord Webhook endpoint (e.g. https://discord.com/api/webhooks/...).
                  </p>
                ) : (
                  <span className="text-[11px] text-zinc-500 block mt-1">
                    In Discord: Server Settings &gt; Integrations &gt; Webhooks &gt; New Webhook &gt; Copy Webhook URL.
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    Discord Guild ID (Server ID)
                  </label>
                  {config.discordGuildId?.trim() && (
                    isDiscordSnowflakeValid(config.discordGuildId) ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid Guild ID
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Must be 17-20 digits
                      </span>
                    )
                  )}
                </div>
                <input
                  type="text"
                  value={config.discordGuildId}
                  onChange={(e) => setConfig({ ...config, discordGuildId: e.target.value })}
                  placeholder="e.g. 109876543210987654"
                  className={`w-full bg-zinc-950 border rounded-xl p-3 text-xs text-white font-mono focus:outline-none transition ${
                    !config.discordGuildId?.trim()
                      ? 'border-zinc-800 focus:border-indigo-500'
                      : isDiscordSnowflakeValid(config.discordGuildId)
                      ? 'border-emerald-500/70 bg-emerald-950/20 text-emerald-200 focus:border-emerald-400'
                      : 'border-rose-500/70 bg-rose-950/20 text-rose-200 focus:border-rose-400'
                  }`}
                />
                {config.discordGuildId?.trim() && !isDiscordSnowflakeValid(config.discordGuildId) ? (
                  <p className="text-[11px] text-rose-400 block mt-1 font-medium">
                    Invalid Guild ID. Letters and special characters are not allowed. Must be 17-20 digits.
                  </p>
                ) : (
                  <span className="text-[11px] text-zinc-500 block mt-1">
                    Enable Developer Mode in Discord, right click your server icon and select "Copy Server ID".
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300 block">
                    Whitelisted Role ID (Granted on Approval)
                  </label>
                  {config.discordRoleId?.trim() && (
                    isDiscordSnowflakeValid(config.discordRoleId) ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid Role ID
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Must be 17-20 digits
                      </span>
                    )
                  )}
                </div>
                <input
                  type="text"
                  value={config.discordRoleId}
                  onChange={(e) => setConfig({ ...config, discordRoleId: e.target.value })}
                  placeholder="e.g. 109876543210987655"
                  className={`w-full bg-zinc-950 border rounded-xl p-3 text-xs text-white font-mono focus:outline-none transition ${
                    !config.discordRoleId?.trim()
                      ? 'border-zinc-800 focus:border-indigo-500'
                      : isDiscordSnowflakeValid(config.discordRoleId)
                      ? 'border-emerald-500/70 bg-emerald-950/20 text-emerald-200 focus:border-emerald-400'
                      : 'border-rose-500/70 bg-rose-950/20 text-rose-200 focus:border-rose-400'
                  }`}
                />
                {config.discordRoleId?.trim() && !isDiscordSnowflakeValid(config.discordRoleId) ? (
                  <p className="text-[11px] text-rose-400 block mt-1 font-medium">
                    Invalid Role ID. Letters and special characters are not allowed. Must be 17-20 digits.
                  </p>
                ) : (
                  <span className="text-[11px] text-zinc-500 block mt-1">
                    Role ID of the "Whitelisted Citizen" role in your Discord server.
                  </span>
                )}
              </div>
            </div>

            {/* Right: Test Webhook & Embed Preview */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Discord Rich Embed Preview</span>
                </span>

                {/* Simulated Discord Embed */}
                <div className="bg-[#2B2D31] rounded-lg p-3.5 border-l-4 border-[#6366F1] space-y-2 text-left font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">VC</div>
                    <span className="font-bold text-white text-[11px]">{config.serverName} Whitelist HQ</span>
                    <span className="bg-[#5865F2] text-[9px] text-white font-bold px-1.5 py-0.5 rounded uppercase">BOT</span>
                  </div>
                  <div className="text-indigo-400 font-bold text-xs">📝 New Whitelist Application Submitted</div>
                  <p className="text-zinc-300 text-[11px]">
                    <strong>Applicant:</strong> @ViceRacer_Tony (<code>849204918294028190</code>)<br />
                    <strong>Server:</strong> {config.serverName}
                  </p>
                  <div className="bg-[#1E1F22] rounded p-2 text-[10px] text-zinc-400 font-mono">
                    Character: Antonio "Tony" Vercetti (Age: 31)<br />
                    Faction: Criminal Syndicate / Chop Shop
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <button
                  onClick={handleTestDiscordWebhook}
                  disabled={testSending || !config.discordWebhookUrl}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  {testSending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Test Webhook...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Live Test Embed to Discord</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSave}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Integration Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Automated Provisioning & Failure Alert Sentinel Diagnostic Suite */}
          <div className="pt-6 border-t border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Automated Whitelist Provisioning & Discord Failure Sentinel</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  When a server subscribes or is re-provisioned, the bot assigns owner roles, opens private VIP support channels, and binds whitelist schemas. If anything fails, an automated Direct Message (DM) is instantly dispatched to the server owner.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleTestFailureDm}
                  disabled={testFailureSending}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Dispatches a test failure alert direct message to verify Discord DM delivery"
                >
                  {testFailureSending ? (
                    <div className="w-3 h-3 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>Test Failure Alert DM</span>
                </button>

                <button
                  onClick={() => handleRunProvisioning(false)}
                  disabled={provisioning}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {provisioning ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  )}
                  <span>Re-Run Provisioning</span>
                </button>
              </div>
            </div>

            {/* Test Failure DM Response Banner */}
            {testFailureResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                testFailureResult.success 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {testFailureResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    {testFailureResult.message || (testFailureResult.success ? 'Failure DM Alert Dispatched' : 'Failure DM Error')}
                  </span>
                  <button 
                    onClick={() => setTestFailureResult(null)}
                    className="text-zinc-400 hover:text-white text-[11px] cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-[11px] text-zinc-300">
                  {testFailureResult.isSimulated 
                    ? '⚡ Dispatched in Discord Simulation Mode (Logged to server console). In production with active bot token, this delivers a direct rich embed to your Discord DMs.'
                    : 'Dispatched directly via Discord REST API to recipient.'}
                </p>
              </div>
            )}

            {/* Provisioning Run Results */}
            {provisionResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-3 ${
                provisionResult.success 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-200' 
                  : 'bg-rose-950/20 border-rose-500/40 text-zinc-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <span className={`w-2.5 h-2.5 rounded-full ${provisionResult.success ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-white text-xs">{provisionResult.message}</span>
                  </div>
                  {provisionResult.failureDmDispatched && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/40">
                      🚨 Owner Failure DM Dispatched: YES
                    </span>
                  )}
                </div>

                {/* Provisioning Steps Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Owner Role:</span>
                    <span className={`text-[11px] font-bold ${provisionResult.roleAssigned ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {provisionResult.roleAssigned ? 'Assigned ✅' : 'Pending / Skipped'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">VIP Channel:</span>
                    <span className={`text-[11px] font-bold ${provisionResult.channelCreated ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {provisionResult.channelCreated ? `#${provisionResult.channelName || 'vip'} ✅` : 'Pending / Skipped'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Owner DM Sentinel:</span>
                    <span className={`text-[11px] font-bold ${provisionResult.dmDispatched ? 'text-emerald-400' : provisionResult.failureDmDispatched ? 'text-rose-400' : 'text-zinc-400'}`}>
                      {provisionResult.dmDispatched ? 'Delivered ✅' : provisionResult.failureDmDispatched ? 'Failure Alert Sent 🚨' : 'Ready'}
                    </span>
                  </div>
                </div>

                {/* Provisioning Logs Console */}
                {provisionResult.logs && provisionResult.logs.length > 0 && (
                  <div className="bg-black/60 rounded-lg p-3 border border-zinc-800/80 font-mono text-[10px] text-zinc-300 space-y-1 max-h-36 overflow-y-auto">
                    <div className="text-zinc-500 font-bold uppercase tracking-wider text-[9px] mb-1">Execution Diagnostic Trace:</div>
                    {provisionResult.logs.map((log: string, lIdx: number) => (
                      <div key={lIdx} className="leading-tight">{log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Advanced Settings & Export */}
      {activeTab === 'advanced' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span>Server Whitelist Configuration</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Manage server identification, URL slugs, and export JSON schemas for external backup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Server Display Name</label>
                <input
                  type="text"
                  value={config.serverName}
                  onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Public URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono">/servers/</span>
                  <input
                    type="text"
                    value={config.serverSlug}
                    onChange={(e) => setConfig({ ...config, serverSlug: normalizeServerSlug(e.target.value) })}
                    className={`w-full bg-zinc-950 border rounded-xl p-3 text-xs text-white font-mono focus:outline-none ${
                      slugStatus === 'available' ? 'border-emerald-500/50 focus:border-emerald-500' :
                      slugStatus === 'taken' ? 'border-rose-500/50 focus:border-rose-500' :
                      slugStatus === 'invalid' ? 'border-amber-500/50 focus:border-amber-500' :
                      'border-zinc-800 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {/* Visual Status Indicator */}
                <div className="mt-1.5 min-h-[18px] flex items-center">
                  {slugStatus === 'checking' && (
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      Checking availability...
                    </span>
                  )}
                  {slugStatus === 'available' && (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      ✓ Slug is available!
                    </span>
                  )}
                  {slugStatus === 'taken' && (
                    <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
                      ✗ Taken: {slugError || 'This slug is already claimed.'}
                    </span>
                  )}
                  {slugStatus === 'invalid' && (
                    <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                      ⚠️ {slugError || 'Invalid format.'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>Backup & Migration</span>
              </span>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleExportJson}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export Schema as JSON</span>
                </button>

                <button
                  onClick={handleResetDefaults}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-rose-500/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset All to Default Schema</span>
                </button>
              </div>
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
        discordUsername={currentUser?.displayName || currentUser?.email?.split('@')[0] || 'VerifiedOwner'}
        discordId={config.ownerDiscordId}
        tier={paymentPlanTier}
        sessionId={paymentSessionId}
        onRedirect={() => {
          setShowPaymentSuccessModal(false);
          if (typeof window !== 'undefined') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
          }
        }}
      />
    </div>
  );
};
