'use client';

import React, { useState } from 'react';
import {
  Crown,
  Lock,
  CheckCircle2,
  Zap,
  ArrowRight,
  Check,
  RefreshCw,
  ShieldAlert,
  Clock,
  Sparkles,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { SUBSCRIPTION_TIERS, SubscriptionTier, normalizeTier } from '../../lib/stripe-subscriptions';

export interface ReusableStripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverSlug: string;
  serverId?: string;
  serverName?: string;
  ownerDiscordId?: string;
  ownerDiscordUsername?: string;
  initialTier?: string;
  title?: string;
  subtitle?: string;
  lockExpiresAt?: number;
  onCheckoutSuccessUrl?: (url: string) => void;
}

export const ReusableStripeCheckoutModal: React.FC<ReusableStripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  serverSlug,
  serverId = `srv_${serverSlug}`,
  serverName = serverSlug.replace(/-/g, ' ').toUpperCase(),
  ownerDiscordId = '849204918294028190',
  ownerDiscordUsername = 'VerifiedServerOwner',
  initialTier = 'pro',
  title = 'Server Subscription & Benefits',
  subtitle = 'Select your directory rank tier and proceed to secure Stripe Checkout.',
  lockExpiresAt = Date.now() + 10 * 60 * 1000,
  onCheckoutSuccessUrl
}) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(normalizeTier(initialTier));
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeTierConfig = SUBSCRIPTION_TIERS[selectedTier] || SUBSCRIPTION_TIERS.pro;
  const tiersList: SubscriptionTier[] = ['starter', 'pro', 'mega'];

  const handleProceedToStripe = async () => {
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
          ownerDiscordId,
          ownerDiscordUsername,
          returnUrl: typeof onCheckoutSuccessUrl === 'string' ? onCheckoutSuccessUrl : `${window.location.origin}/servers/${serverSlug}/manage?paymentSuccess=true`
        })
      });
      const data = await res.json();
      if (data.url && (data.url.startsWith('http://') || data.url.startsWith('https://'))) {
        window.location.href = data.url;
      } else if (data.success || data.isDemoMode) {
        if (typeof onCheckoutSuccessUrl === 'function') {
          onCheckoutSuccessUrl(`/servers/${serverSlug}/manage?paymentSuccess=true`);
        } else if (typeof onCheckoutSuccessUrl === 'string') {
          window.location.href = onCheckoutSuccessUrl;
        } else {
          window.location.href = `/servers/${serverSlug}/manage?paymentSuccess=true`;
        }
      } else {
        setErrorMsg(data.error || 'Failed to initialize Stripe checkout session.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error processing checkout.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 min-h-screen animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl relative my-auto overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 p-5 sm:p-6 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{title}</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                  STRIPE SECURE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessingCheckout}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer text-sm font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-rose-300 mb-0.5">Checkout Interrupted</div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Verified Admin Owner Badge */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-emerald-300 text-sm">
                  Verified Owner Lock
                </div>
                <div className="text-[11px] text-zinc-300">
                  Linked to <strong className="text-white">@{ownerDiscordUsername}</strong> (<code className="text-emerald-300">{ownerDiscordId}</code>)
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 shrink-0">
              0x8 VERIFIED
            </span>
          </div>

          {/* Tier Selection Radio Grid */}
          <div className="space-y-2">
            <label className="block text-zinc-300 font-bold text-xs">
              Select Subscription Plan Tier:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {tiersList.map((tierKey) => {
                const cfg = SUBSCRIPTION_TIERS[tierKey];
                const isSelected = selectedTier === tierKey;
                return (
                  <div
                    key={tierKey}
                    onClick={() => setSelectedTier(tierKey)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? tierKey === 'mega'
                          ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/60 shadow-lg shadow-amber-500/10'
                          : tierKey === 'pro'
                          ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/60 shadow-lg shadow-indigo-500/10'
                          : 'bg-zinc-800/60 border-zinc-400 ring-1 ring-zinc-400/60'
                        : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
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
                        <span className="text-[10px] text-zinc-400">/ mo</span>
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

          {/* Features Card */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${
                  selectedTier === 'mega' ? 'text-amber-400' : selectedTier === 'pro' ? 'text-indigo-400' : 'text-zinc-400'
                }`} />
                <span className="text-xs font-extrabold text-white">
                  Unlocked Benefits ({activeTierConfig.name})
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${activeTierConfig.badgeColor}`}>
                {activeTierConfig.badge}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {activeTierConfig.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {activeTierConfig.features.map((feat, idx) => (
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
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Automated Provisioning Notice */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-200">Instant Automated Provisioning: </span>
              Upon completing checkout, your server listing (<code className="text-amber-300">{serverSlug}</code>) will automatically unlock its <strong className="text-white">{activeTierConfig.badge}</strong> position with full owner dashboard privileges.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessingCheckout}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleProceedToStripe}
            disabled={isProcessingCheckout}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            {isProcessingCheckout ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950 shrink-0" />
                <span>Redirecting to Stripe...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
                <span>Proceed to Stripe ({activeTierConfig.priceFormatted}/mo)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
