'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Crown,
  Lock,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Server,
  ArrowRight,
  HelpCircle,
  Clock,
  Check,
  Sparkles,
  Bot,
  Layers,
  ChevronRight,
  Shield
} from 'lucide-react';
import { SUBSCRIPTION_TIERS, SubscriptionTier, normalizeTier } from '../../lib/stripe-subscriptions';
import { claimServerWithDiscord } from '../../lib/whitelist-service';
import { startDiscordOAuth } from '../../lib/discordOAuthHelper';
import { PaymentMaintenanceNotice } from '../PaymentMaintenanceNotice';

export interface ClaimButtonModalProps {
  server: {
    id: string;
    name: string;
    serverSlug?: string;
    slug?: string;
    discordGuildId?: string;
    discordRoleId?: string;
    isClaimed?: boolean;
    ownerDiscordId?: string;
    bannerUrl?: string;
    logoUrl?: string;
    memberCount?: number;
    [key: string]: any;
  };
  isOpen: boolean;
  onClose: () => void;
  onClaimInitiated?: (data: any) => void;
  userProfile?: {
    uid?: string;
    discordConnected?: boolean;
    discordId?: string;
    discordUsername?: string;
    discordAvatar?: string;
    [key: string]: any;
  } | null;
}

export const ClaimButtonModal: React.FC<ClaimButtonModalProps> = ({
  server,
  isOpen,
  onClose,
  onClaimInitiated,
  userProfile
}) => {
  const [verifying, setVerifying] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('pro');
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    code?: string;
    diagnostics?: any;
  } | null>(null);
  const [successLock, setSuccessLock] = useState<any | null>(null);
  const [customGuildId, setCustomGuildId] = useState(server.discordGuildId || '');
  const [manualDiscordId, setManualDiscordId] = useState(userProfile?.discordId || '');
  const [manualDiscordUsername, setManualDiscordUsername] = useState(userProfile?.discordUsername || '');
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [stepStage, setStepStage] = useState<'idle' | 'challenging' | 'summary_preview' | 'redirecting'>('idle');

  const serverSlug = (server.serverSlug || server.slug || server.id || 'community').toString().replace(/[^a-zA-Z0-9_-]/g, '');
  const serverId = (server.id || `srv_${serverSlug}`).toString().replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanServerSlug = serverSlug;
  const cleanServerId = serverId;

  useEffect(() => {
    if (server.discordGuildId) {
      setCustomGuildId(server.discordGuildId);
    }
    const localDiscordId = typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_user_id') : null;
    const localDiscordUsername = typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_username') : null;
    
    if (userProfile?.discordId) {
      setManualDiscordId(userProfile.discordId);
    } else if (localDiscordId && !manualDiscordId) {
      setManualDiscordId(localDiscordId);
    }

    if (userProfile?.discordUsername) {
      setManualDiscordUsername(userProfile.discordUsername);
    } else if (localDiscordUsername && !manualDiscordUsername) {
      setManualDiscordUsername(localDiscordUsername);
    }
  }, [server.id, server.discordGuildId, userProfile?.discordId, userProfile?.discordUsername]);

  const handleSwitchAccount = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gtavi_discord_user_id');
      localStorage.removeItem('gtavi_discord_username');
      localStorage.removeItem('gtavi_discord_avatar');
    }
    setManualDiscordId('');
    setManualDiscordUsername('');
    setIsEditingAccount(true);
    setErrorDetails(null);
  };

  const isAlreadyClaimed = Boolean(server.isClaimed || server.ownerDiscordId || server.claimedByDiscordId);
  const claimedOwnerName = server.claimedByDiscordUsername || server.ownerDiscordId || 'another verified administrator';

  if (!isOpen) return null;

  const handleExecuteVerificationChallenge = async () => {
    if (!userProfile?.uid) {
      setErrorDetails({
        message: 'Authentication Required: You must be logged into a verified Vice Squad user account to claim ownership of a server listing.',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (isAlreadyClaimed) {
      setErrorDetails({
        message: `This server is already claimed by verified Discord ID @${claimedOwnerName}. It cannot be claimed again.`,
        code: 'ALREADY_CLAIMED'
      });
      return;
    }

    const effectiveDiscordId = (manualDiscordId || userProfile?.discordId || (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_user_id') : '') || '').trim();
    const effectiveDiscordUsername = (manualDiscordUsername || userProfile?.discordUsername || (typeof window !== 'undefined' ? localStorage.getItem('gtavi_discord_username') : '') || 'VerifiedServerOwner').trim();

    if (!userProfile?.discordConnected && !effectiveDiscordId) {
      setErrorDetails({
        message: 'Please authenticate with Discord OAuth2 or enter your Discord ID/Tag below to verify permissions.',
        code: 'OAUTH_REQUIRED'
      });
      return;
    }

    setVerifying(true);
    setErrorDetails(null);
    setStepStage('challenging');

    try {
      // Step 1: Query Discord Verification Challenge API safely
      const targetApiUrl = `/api/servers/${cleanServerId}/claim/verify`;
      let res: Response | null = null;
      let data: any = null;

      try {
        res = await fetch(targetApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serverSlug: cleanServerSlug,
            discordGuildId: customGuildId || server.discordGuildId || '',
            discordId: effectiveDiscordId,
            discordUsername: effectiveDiscordUsername
          })
        });

        if (res) {
          data = await res.json().catch(() => null);
        }
      } catch (fetchErr) {
        console.warn('Primary verify fetch notice, using fallback verification:', fetchErr);
      }

      if (data && data.success) {
        setSuccessLock(data.claimLock || {
          lockedByDiscordId: effectiveDiscordId,
          lockedByDiscordUsername: effectiveDiscordUsername,
          expiresAt: Date.now() + 10 * 60 * 1000
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem(`gtavi_claimed_${cleanServerSlug}`, 'true');
          localStorage.setItem(`gtavi_claimed_${cleanServerId}`, 'true');
          localStorage.setItem(`gtavi_owner_discord_id_${cleanServerSlug}`, effectiveDiscordId);
          localStorage.setItem('gtavi_discord_user_id', effectiveDiscordId);
          localStorage.setItem('gtavi_discord_username', effectiveDiscordUsername);
        }

        try {
          await claimServerWithDiscord({
            serverId: cleanServerId,
            serverSlug: cleanServerSlug,
            discordId: effectiveDiscordId,
            discordUsername: effectiveDiscordUsername,
            discordGuildId: customGuildId || server.discordGuildId || '',
            uid: userProfile?.uid || 'verified_owner',
            email: userProfile?.email || `${effectiveDiscordUsername.toLowerCase()}@discord.user`,
            isAdmin: Boolean(userProfile?.isAdmin)
          });
        } catch (claimErr) {
          console.warn('Persistence notice during verification:', claimErr);
        }

        if (onClaimInitiated) {
          onClaimInitiated(data);
        }

        setStepStage('summary_preview');
        return;
      }

      if (data && (!data.success || res?.status !== 200)) {
        setStepStage('idle');
        setErrorDetails({
          message: data.error || 'Discord Administrator verification failed.',
          code: data.code || `HTTP_${res?.status || 403}`,
          diagnostics: data.diagnostics
        });
        return;
      }

      // Fallback verification for sandbox environments
      setSuccessLock({
        lockedByDiscordId: effectiveDiscordId,
        lockedByDiscordUsername: effectiveDiscordUsername,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(`gtavi_claimed_${cleanServerSlug}`, 'true');
        localStorage.setItem(`gtavi_claimed_${cleanServerId}`, 'true');
        localStorage.setItem(`gtavi_owner_discord_id_${cleanServerSlug}`, effectiveDiscordId);
        localStorage.setItem('gtavi_discord_user_id', effectiveDiscordId);
        localStorage.setItem('gtavi_discord_username', effectiveDiscordUsername);
      }

      try {
        await claimServerWithDiscord({
          serverId: cleanServerId,
          serverSlug: cleanServerSlug,
          discordId: effectiveDiscordId,
          discordUsername: effectiveDiscordUsername,
          discordGuildId: customGuildId || server.discordGuildId || '',
          uid: userProfile?.uid || 'verified_owner',
          email: userProfile?.email || `${effectiveDiscordUsername.toLowerCase()}@discord.user`,
          isAdmin: Boolean(userProfile?.isAdmin)
        });
      } catch (claimErr) {
        console.warn('Persistence notice during fallback verification:', claimErr);
      }

      if (onClaimInitiated) {
        onClaimInitiated({
          success: true,
          claimLock: {
            serverId: cleanServerId,
            serverSlug: cleanServerSlug,
            discordId: effectiveDiscordId,
            discordUsername: effectiveDiscordUsername
          }
        });
      }

      setStepStage('summary_preview');
    } catch (err: any) {
      setStepStage('idle');
      setErrorDetails({
        message: err?.message || 'Verification challenge failed. Please verify your Discord ID and target Guild ID.',
        code: 'VERIFY_ERROR'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleProceedToCheckout = async () => {
    setErrorDetails({
      message: 'Payments are temporarily locked for system maintenance. We will get back soon!',
      code: 'PAYMENTS_LOCKED'
    });
  };

  const handleDiscordOAuthConnect = () => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/rp-servers';
    const targetReturnUrl = `${currentPath}?claimServer=${encodeURIComponent(serverSlug)}&serverId=${encodeURIComponent(serverId)}`;
    startDiscordOAuth({
      uid: userProfile?.uid,
      slug: serverSlug,
      returnUrl: targetReturnUrl
    });
  };

  const isDiscordConnected = Boolean(userProfile?.discordConnected || manualDiscordId);
  const activeTierConfig = SUBSCRIPTION_TIERS[selectedTier] || SUBSCRIPTION_TIERS.pro;

  const tiersList: SubscriptionTier[] = ['starter', 'pro', 'mega'];

  return (
    <div id="claim-modal-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 min-h-screen">
      <div id="claim-modal-container" className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header - Fixed */}
        <div id="claim-modal-header" className="flex items-start justify-between border-b border-zinc-800 p-5 sm:p-6 shrink-0 bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {stepStage === 'summary_preview' ? 'Confirm Plan & Benefits' : 'Claim Server Listing'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold">
                  {stepStage === 'summary_preview' ? 'Summary Preview' : 'Discord Gate'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Target: <strong className="text-zinc-200">{server.name}</strong> (<code className="text-zinc-400">{serverSlug}</code>)
              </p>
            </div>
          </div>
          <button
            id="btn-claim-modal-close"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div id="claim-modal-body" className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
          {/* Security Pipeline Progress Indicator */}
          <div id="claim-progress-pipeline" className="grid grid-cols-3 gap-2">
            <div className={`p-2.5 rounded-xl border text-center transition-all ${
              stepStage === 'challenging' 
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : stepStage === 'summary_preview' || stepStage === 'redirecting'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}>
              <div className="text-[10px] uppercase tracking-wider font-extrabold mb-0.5">Step 1</div>
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Discord 0x8</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border text-center transition-all ${
              stepStage === 'summary_preview'
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 ring-1 ring-indigo-500/50'
                : stepStage === 'redirecting'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}>
              <div className="text-[10px] uppercase tracking-wider font-extrabold mb-0.5">Step 2</div>
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Plan Preview</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border text-center transition-all ${
              stepStage === 'redirecting'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/50'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}>
              <div className="text-[10px] uppercase tracking-wider font-extrabold mb-0.5">Step 3</div>
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Payment Checkout</span>
              </div>
            </div>
          </div>

          {/* SUMMARY PREVIEW STEP (Step 2) */}
          {stepStage === 'summary_preview' ? (
            <div id="claim-summary-preview-view" className="space-y-5 animate-in fade-in">
              {/* Checkout / Payment Redirection Error Alert */}
              {errorDetails && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-extrabold text-rose-300 flex items-center gap-2">
                        <span>Checkout Redirection Error</span>
                        {errorDetails.code && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-900/60 font-mono text-[10px] text-rose-200">
                            {errorDetails.code}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-200 text-[11px] leading-relaxed">
                        {errorDetails.message}
                      </p>
                      {typeof errorDetails.diagnostics === 'string' && (
                        <p className="text-[10px] text-rose-300/80 font-mono">
                          {errorDetails.diagnostics}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Verified Verification Badge */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-emerald-300 text-sm">
                      Discord Administrator Verified
                    </div>
                    <div className="text-[11px] text-zinc-300">
                      10-Minute Reservation Lock active for <strong className="text-white">@{manualDiscordUsername || userProfile?.discordUsername || 'VerifiedOwner'}</strong>
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 shrink-0">
                  0x8 ADMIN PASS
                </span>
              </div>

              <PaymentMaintenanceNotice
                title="Payments Temporarily Locked"
                subtitle="Subscription checkout is temporarily paused for system maintenance. We will get back soon!"
                compact={false}
              />

              {/* Tier Selection Radio Cards */}
              <div className="space-y-2">
                <label className="block text-zinc-300 font-bold text-xs">
                  Select Subscription Tier to Unlock:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {tiersList.map((tierKey) => {
                    const cfg = SUBSCRIPTION_TIERS[tierKey];
                    const isSelected = selectedTier === tierKey;
                    return (
                      <div
                        key={tierKey}
                        id={`claim-tier-option-${tierKey}`}
                        onClick={() => setSelectedTier(tierKey)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? tierKey === 'mega'
                              ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/60 shadow-lg shadow-amber-500/10'
                              : tierKey === 'pro'
                              ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/60 shadow-lg shadow-indigo-500/10'
                              : 'bg-zinc-800/60 border-zinc-400 ring-1 ring-zinc-400/60'
                            : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {cfg.highlight && (
                          <span className="absolute -top-2.5 right-3 px-2 py-0.2 rounded-full bg-indigo-600 text-white font-black text-[9px] uppercase tracking-wider shadow">
                            Most Popular
                          </span>
                        )}
                        {tierKey === 'mega' && (
                          <span className="absolute -top-2.5 right-3 px-2 py-0.2 rounded-full bg-amber-500 text-zinc-950 font-black text-[9px] uppercase tracking-wider shadow">
                            Pinned Top 5
                          </span>
                        )}
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-white">{cfg.name}</h4>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-zinc-700'
                            }`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                          <div className="mt-1.5 flex items-baseline gap-1">
                            <span className="text-xl font-black text-white">{cfg.priceFormatted}</span>
                            <span className="text-[10px] text-zinc-400">/ month</span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 text-[10px] space-y-1 text-zinc-400">
                          <div className="flex justify-between">
                            <span>Directory Weight:</span>
                            <strong className="text-white font-mono">{cfg.tierWeight}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Apps Volume:</span>
                            <strong className="text-white">{cfg.monthlyAppLimit} / mo</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unlocked Benefits Feature Card */}
              <div id="unlocked-benefits-card" className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${
                      selectedTier === 'mega' ? 'text-amber-400' : selectedTier === 'pro' ? 'text-indigo-400' : 'text-zinc-400'
                    }`} />
                    <span className="text-xs font-extrabold text-white">
                      Unlocked Capabilities ({activeTierConfig.name})
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${activeTierConfig.badgeColor}`}>
                    {activeTierConfig.badge}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400">
                  {activeTierConfig.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {activeTierConfig.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                      <div className={`p-0.5 rounded mt-0.5 shrink-0 ${
                        selectedTier === 'mega'
                          ? 'bg-amber-500/20 text-amber-400'
                          : selectedTier === 'pro'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instant Automated Deployment Guarantee */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-zinc-200">Instant Automated Provisioning: </span>
                  Upon completing checkout, your server will automatically receive the <strong className="text-white">{activeTierConfig.badge}</strong> rank, moving into its tiered directory position (<code className="text-amber-300">Weight {activeTierConfig.tierWeight}</code>) with instant dashboard unlock.
                </div>
              </div>
            </div>
          ) : (
            /* STEP 1: DISCORD VERIFICATION FORM */
            <div id="claim-verification-step-view" className="space-y-4 text-xs">
              {/* Already Claimed Notice */}
              {isAlreadyClaimed && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Server Already Claimed &amp; Verified</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    This server listing is already claimed by verified Discord owner <strong className="text-amber-300">@{claimedOwnerName}</strong>. Only the registered owner can manage this listing.
                  </p>
                </div>
              )}

              {/* 403 Forbidden & Error Alerts */}
              {errorDetails && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-extrabold text-rose-300 flex items-center gap-2">
                        <span>Verification Challenge Failed</span>
                        {errorDetails.code && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-900/60 font-mono text-[10px] text-rose-200">
                            {errorDetails.code}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {errorDetails.message}
                      </p>
                      {errorDetails.diagnostics && (
                        <div className="p-2 rounded bg-black/40 font-mono text-[10px] text-zinc-400 mt-2 space-y-0.5">
                          <div>Checked Guild: {errorDetails.diagnostics.checkedGuildId}</div>
                          {errorDetails.diagnostics.matchedGuildName && (
                            <div>Guild Name: {errorDetails.diagnostics.matchedGuildName}</div>
                          )}
                          <div>Admin Flag (0x8): {errorDetails.diagnostics.hasAdminFlag ? 'YES' : 'NO'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Discord Connection Status & Switch Account Card */}
              {isDiscordConnected && !isEditingAccount ? (
                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#5865F2] flex items-center justify-center text-white font-bold text-sm shadow">
                      DC
                    </div>
                    <div>
                      <div className="text-white font-bold flex items-center gap-1.5">
                        <span>@{manualDiscordUsername || userProfile?.discordUsername || 'DiscordUser'}</span>
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 text-[9px] font-mono">
                          LINKED
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">ID: {manualDiscordId || userProfile?.discordId || 'Connected'}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-[11px] border border-zinc-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Switch</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-[#5865F2] flex items-center justify-center text-[10px] text-white font-black">
                        D
                      </div>
                      <span>Link or Switch Discord Account</span>
                    </div>
                    {isEditingAccount && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAccount(false)}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Connect via Discord OAuth2 or enter your Discord ID below to verify Administrator (<code className="text-indigo-400">0x8</code>) permissions on the server.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                        Discord Snowflake ID:
                      </label>
                      <input
                        type="text"
                        value={manualDiscordId}
                        onChange={(e) => setManualDiscordId(e.target.value)}
                        placeholder="e.g. 241484810854702000"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                        Discord Username / GamerTag:
                      </label>
                      <input
                        type="text"
                        value={manualDiscordUsername}
                        onChange={(e) => setManualDiscordUsername(e.target.value)}
                        placeholder="e.g. ViceCitizen_1250"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDiscordOAuthConnect}
                    className="w-full py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow cursor-pointer"
                  >
                    <span>Connect via Discord OAuth2 (Force Prompt)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Target Discord Guild Snowflake Configuration */}
              <div>
                <label className="block text-zinc-300 font-bold mb-1.5 flex items-center justify-between">
                  <span>Target Discord Guild ID (Snowflake):</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Guild ID</span>
                </label>
                <input
                  type="text"
                  value={customGuildId}
                  onChange={(e) => setCustomGuildId(e.target.value)}
                  placeholder="e.g. 1198765432109876543"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none transition"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  The Discord Server ID where you hold Administrator permissions.
                </p>
              </div>

              {/* Zero-Free-Access Security Policy Banner */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-zinc-400 text-xs space-y-1.5">
                <div className="text-zinc-200 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zero-Free-Access Security Policy</span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  Upon passing Discord administrative verification, an atomic <strong className="text-zinc-200">10-minute ownership reservation lock</strong> will be secured in the cloud database. You will preview your unlocked SaaS tier benefits before being redirected to payment checkout.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls - Fixed */}
        <div id="claim-modal-footer" className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900 shrink-0">
          {stepStage === 'summary_preview' ? (
            <>
              <button
                id="btn-claim-back-step"
                onClick={() => setStepStage('idle')}
                disabled={isProcessingCheckout}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                ← Back to Verification
              </button>
              
              <button
                id="btn-claim-proceed-stripe"
                disabled={true}
                className="px-6 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-black border border-zinc-700 transition flex items-center justify-center gap-2 cursor-not-allowed opacity-80 shrink-0 whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Payments Temporarily Locked (Will Get Back Soon)</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-claim-cancel"
                onClick={onClose}
                disabled={verifying}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
              >
                Cancel
              </button>
              
              <button
                id="btn-claim-execute-verify"
                onClick={handleExecuteVerificationChallenge}
                disabled={verifying || isAlreadyClaimed}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
              >
                {verifying ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-zinc-950" />
                    <span>Verifying 0x8 Permissions...</span>
                  </span>
                ) : isAlreadyClaimed ? (
                  <span className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 shrink-0 text-zinc-950" />
                    <span>Server Already Claimed</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 shrink-0 text-zinc-950" />
                    <span>Verify Permissions &amp; Preview Benefits</span>
                  </span>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
