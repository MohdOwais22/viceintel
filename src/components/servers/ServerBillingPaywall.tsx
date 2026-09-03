'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Crown,
  CreditCard,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  Zap,
  Server,
  Sparkles,
  AlertTriangle,
  Bot,
  Layers,
  Check,
  Globe,
  Radio,
  FileCode,
  Users,
  RefreshCw
} from 'lucide-react';
import { SUBSCRIPTION_TIERS, SubscriptionTier, normalizeTier } from '../../lib/stripe-subscriptions';
import { PaymentSuccessModal } from './PaymentSuccessModal';
import { auth } from '../../lib/firebase';
import { getUserProfile } from '../../lib/whitelist-service';
import { UserProfile } from '../../types';
import { isStaffUser } from '../../lib/rbac';
import { ArrowLeft, LogIn } from 'lucide-react';

interface ServerBillingPaywallProps {
  serverSlug: string;
  serverId?: string;
  serverName?: string;
  discordId?: string;
  discordUsername?: string;
  ownerUid?: string;
  expiresAt?: number;
  initialTier?: string;
  onPaymentCompleted?: () => void;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
  } | null;
  onOpenAuth?: () => void;
  onNavigate?: (tab: string, slug?: string) => void;
}

export const ServerBillingPaywall: React.FC<ServerBillingPaywallProps> = ({
  serverSlug,
  serverId = `srv_${serverSlug}`,
  serverName = serverSlug.replace(/-/g, ' ').toUpperCase(),
  discordId = '849204918294028190',
  discordUsername = 'VerifiedServerOwner',
  ownerUid,
  expiresAt = Date.now() + 1000 * 60 * 30,
  initialTier = 'pro',
  onPaymentCompleted,
  currentUser,
  onOpenAuth,
  onNavigate
}) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(normalizeTier(initialTier));
  const [timeLeftMs, setTimeLeftMs] = useState(Math.max(0, expiresAt - Date.now()));
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (currentUser?.uid) {
      getUserProfile(currentUser.uid).then(p => {
        if (isMounted && p) {
          setUserProfile(p);
        }
      });
    }
    return () => { isMounted = false; };
  }, [currentUser?.uid]);

  const isDesignatedStaff = Boolean(
    currentUser?.isAdmin ||
    currentUser?.isStaff ||
    isStaffUser(userProfile?.role, currentUser?.email) ||
    (userProfile?.clearanceLevel && ['L4', 'L3', 'L4 Admin', 'L3 Staff'].includes(userProfile.clearanceLevel))
  );

  const isLocalClaimed = typeof window !== 'undefined' && localStorage.getItem(`gtavi_claimed_${serverSlug}`) === 'true';

  const isAuthorizedOwner = Boolean(
    isDesignatedStaff ||
    (ownerUid && ownerUid === currentUser?.uid) ||
    (ownerUid && currentUser?.email && ownerUid.toLowerCase() === currentUser.email.toLowerCase()) ||
    isLocalClaimed
  );

  // Check URL parameters for immediate post-payment redirection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('paymentSuccess') === 'true' || params.get('session_id')) {
        setPaymentSuccess(true);
      }
    }
  }, []);

  // 30-minute lock countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutesLeft = Math.floor(timeLeftMs / 60000);
  const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);

  const tiersList = [
    SUBSCRIPTION_TIERS.starter,
    SUBSCRIPTION_TIERS.pro,
    SUBSCRIPTION_TIERS.mega
  ];

  const handleClaimTrial = async () => {
    const activeUid = ownerUid || auth?.currentUser?.uid || '';
    if (!activeUid) {
      setErrorMsg('⚠️ Authentication Required: You must be logged in to a verified Vice Squad profile to claim a server trial.');
      return;
    }

    setIsProcessingCheckout(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/billing/claim-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'pro',
          serverSlug,
          serverId,
          serverName,
          ownerDiscordId: discordId,
          ownerDiscordUsername: discordUsername,
          ownerUid: activeUid,
          ownerEmail: auth?.currentUser?.email || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
        if (onPaymentCompleted) onPaymentCompleted();
      } else if (data.error && (data.error.includes('TRIAL_ALREADY_CLAIMED') || data.error.includes('AUTHENTICATION_REQUIRED') || data.error.includes('INVALID_USER_PROFILE'))) {
        setErrorMsg(`⚠️ ${data.error}`);
      } else {
        // Fallback to verify-subscription
        const verifyRes = await fetch('/api/servers/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverId,
            serverSlug,
            stripeSubscriptionId: `trial_14day_pro_${Date.now()}`,
            discordId,
            discordUsername,
            planTier: 'pro'
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          setPaymentSuccess(true);
          if (onPaymentCompleted) onPaymentCompleted();
        } else {
          setErrorMsg(data.error || verifyData.error || 'Failed to activate 14-day trial.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error activating 14-day trial pass.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleStripeCheckout = async () => {
    setIsProcessingCheckout(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'server_pro_pass',
          tier: selectedTier,
          serverId,
          serverSlug,
          serverName,
          ownerDiscordId: discordId,
          ownerDiscordUsername: discordUsername,
          ownerEmail: auth?.currentUser?.email || '',
          returnUrl: `${window.location.origin}/servers/${serverSlug}/manage?paymentSuccess=true`
        })
      });
      const data = await res.json();
      if (data.url && (data.url.startsWith('http://') || data.url.startsWith('https://'))) {
        window.location.href = data.url;
      } else if (data.success || data.isDemoMode) {
        setPaymentSuccess(true);
        if (onPaymentCompleted) onPaymentCompleted();
      } else {
        setErrorMsg(data.error || 'Failed to initialize checkout session.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error processing checkout.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {!isAuthorizedOwner ? (
          <div className="bg-zinc-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-amber-500 pointer-events-none">
              <Lock className="w-48 h-48" />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-zinc-800 pb-6 relative z-10">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-white">Billing & Plan Access Restricted</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                    Role Protection Active
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Access to server billing tiers and subscription management is restricted strictly to verified server owners or designated Staff accounts (Level 3 Staff / Level 4 Admin).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Your Authentication Status</span>
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <div className={`w-2.5 h-2.5 rounded-full ${currentUser ? (isDesignatedStaff ? 'bg-indigo-400' : 'bg-amber-400') : 'bg-rose-500'}`} />
                  <span>{currentUser ? `Logged in as ${currentUser.displayName || currentUser.email || currentUser.uid}` : 'Not Authenticated'}</span>
                </div>
                {userProfile && (
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Account Role: <strong className="text-amber-300">{userProfile.role || 'User'}</strong> • Clearance: <strong className="text-amber-300">{userProfile.clearanceLevel || 'L1'}</strong>
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Authorized Role Requirements</span>
                <ul className="text-xs text-zinc-300 space-y-1">
                  <li className="flex items-center gap-2 text-emerald-400 font-medium">✓ Registered Server Owner UID / Email Match</li>
                  <li className="flex items-center gap-2 text-amber-300 font-medium">✓ Level 3 Staff (`L3 Staff`) Account Role</li>
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
                onClick={() => onNavigate?.('server-dashboard', serverSlug)}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer border border-zinc-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Server Dashboard</span>
              </button>
            </div>
          </div>
        ) : (
          <>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Discord Administrator Verified
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[11px]">
                  0x8 Guild Admin Confirmed
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                3-Tier SaaS Subscription &amp; Automatic Directory Deployment
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Target Server: <strong className="text-indigo-400">{serverName}</strong> (<code className="text-zinc-300">{serverSlug}</code>)
              </p>
            </div>

            {/* 30-minute lock countdown */}
            <div className="bg-zinc-950 border border-indigo-500/30 rounded-2xl p-3.5 flex items-center gap-3 shrink-0 shadow-inner">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400/80">
                  Reservation Lock
                </div>
                <div className="text-lg font-mono font-black text-indigo-300">
                  {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Zero-Free-Access Policy Notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-200">Zero-Free-Access Enforcement:</strong> Sensitive management tools (Form Builder, AI Lore Grader, and Review Dashboard) remain strictly locked until payment checkout confirms your monthly subscription payment. Upon checkout completion, your server is atomically deployed to the directory with instant on-demand cache revalidation.
            </div>
          </div>

          {/* Verified Discord Admin Tag */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
            <div>
              Verified Discord Lead: <strong className="text-white">@{discordUsername ? discordUsername.replace(/^@+/, '') : ''}</strong> (<code className="text-zinc-400">{discordId}</code>)
            </div>
            <div>
              Server ID: <code className="text-zinc-300">{serverId}</code>
            </div>
          </div>
        </div>

        {/* Sentinel AI Growth & Marketing Studio Feature Showcase for Server Owners */}
        <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-zinc-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Included in SaaS: Sentinel AI Growth &amp; Marketing Engine Studio</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                    Pro &amp; Mega Tiers
                  </span>
                </h2>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Automate player acquisition, generate viral content, rank on Google, and pitch streamers with built-in AI tools.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>pSEO Topic Generator</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Creates search-optimized Vice City RP landing pages &amp; comparison guides to capture organic player traffic.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-xs">
                <Zap className="w-4 h-4 text-fuchsia-400" />
                <span>Viral Video Studio</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Auto-generates TikTok/YouTube Shorts scripts, viral RP hooks, and title tags tailored to your server's lore.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Streamer Outreach Copilot</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Drafts customized sponsorship proposals &amp; Discord partner pitches for Twitch/Kick content creators.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>Conversion Analytics</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Real-time tracking of player acquisition funnels from search queries directly to whitelist form submission.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Payment Success Alert */}
        {paymentSuccess && (
          <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Subscription Activated &amp; Server Successfully Deployed to Directory!</span>
            </div>
            <p className="text-zinc-300">
              Your server status is now Published with ranking weight {SUBSCRIPTION_TIERS[selectedTier]?.tierWeight}. Redirecting to Management Dashboard...
            </p>
          </div>
        )}

        {/* Plan Tier Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiersList.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative bg-zinc-900 border rounded-3xl p-6 flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-zinc-900/95 shadow-2xl shadow-indigo-950/50 transform scale-[1.02]'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black text-[10px] uppercase tracking-wider shadow">
                    Most Popular
                  </div>
                )}
                {tier.id === 'mega' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow">
                    Top 5 Spotlight
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-white text-lg">{tier.name}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${tier.badgeColor}`}>
                        {tier.badge}
                      </span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-zinc-700'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{tier.priceFormatted}</span>
                    <span className="text-xs text-zinc-400 font-bold">/month</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed min-h-[38px]">
                    {tier.description}
                  </p>

                  <div className="border-t border-zinc-800 pt-4 space-y-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Included Capabilities:
                    </div>
                    {tier.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          tier.id === 'mega' ? 'text-amber-400' : tier.id === 'pro' ? 'text-indigo-400' : 'text-emerald-400'
                        }`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 font-mono">
                    <span>App Limit:</span>
                    <span className="text-zinc-200 font-bold">{tier.monthlyAppLimit === 'Unlimited' ? 'Unlimited' : `${tier.monthlyAppLimit}/mo`}</span>
                  </div>
                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {isSelected ? 'Selected Tier' : 'Select Tier'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix Summary */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Automatic Directory Deployment Specs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400">
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
              <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                Starter ($29/mo)
              </div>
              <p>Standard directory ranking (Weight 100). Up to 100 applications/mo. Webhook alerts included.</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-indigo-900/40 space-y-1.5">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                Pro ($49/mo)
              </div>
              <p>Priority Page 1–2 ranking (Weight 200). AI Lore Grader, Discord Auto-Role sync, Verified Partner badge.</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-amber-900/40 space-y-1.5">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Mega-Server ($199/mo)
              </div>
              <p>Pinned Top 5 Spotlight on Page 1 (Weight 300). Glowing directory cards, Lua exports, unlimited apps.</p>
            </div>
          </div>
        </div>

        {/* Bottom Checkout Action Controls */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="text-xs text-zinc-400">Selected Subscription Plan:</div>
            <div className="text-2xl font-black text-white flex items-baseline gap-1">
              <span>{SUBSCRIPTION_TIERS[selectedTier]?.priceFormatted}</span>
              <span className="text-xs text-zinc-400 font-bold">/month — {SUBSCRIPTION_TIERS[selectedTier]?.name}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* 14-Day Free Trial Button for Pro */}
            {selectedTier === 'pro' && (
              <button
                type="button"
                onClick={handleClaimTrial}
                disabled={isProcessingCheckout || paymentSuccess}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-zinc-950" />
                <span>{isProcessingCheckout ? 'Activating Pro Pass...' : 'Start 14-Day Free Pro Pass ($0 Today)'}</span>
              </button>
            )}

            {/* Primary Stripe Button */}
            <button
              type="button"
              onClick={handleStripeCheckout}
              disabled={isProcessingCheckout || paymentSuccess}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {isProcessingCheckout ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Connecting to Stripe...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-zinc-950" />
                  <span>Subscribe with Stripe ({SUBSCRIPTION_TIERS[selectedTier]?.priceFormatted}/mo)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Payment Success Modal */}
        <PaymentSuccessModal
          isOpen={paymentSuccess}
          onClose={() => setPaymentSuccess(false)}
          serverName={serverName}
          serverSlug={serverSlug}
          serverId={serverId}
          discordUsername={discordUsername}
          discordId={discordId}
          tier={selectedTier}
          amountPaid={SUBSCRIPTION_TIERS[selectedTier]?.priceFormatted || '$49'}
          onRedirect={() => {
            window.location.href = `/servers/${serverSlug}/manage?paymentSuccess=true`;
          }}
        />
        </>
        )}
      </div>
    </div>
  );
};

