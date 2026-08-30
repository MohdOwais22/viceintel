'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Crown, 
  Server, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Bot, 
  Layers, 
  ExternalLink,
  Copy,
  Check,
  Zap,
  CreditCard
} from 'lucide-react';
import { copyToClipboard } from '../../lib/copyUtils';

export interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose?: () => void;
  serverName: string;
  serverSlug: string;
  serverId?: string;
  discordUsername?: string;
  discordId?: string;
  tier?: string;
  sessionId?: string;
  amountPaid?: string;
  onRedirect?: () => void;
  autoRedirectSeconds?: number;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  serverName,
  serverSlug,
  serverId,
  discordUsername = 'VerifiedOwner',
  discordId,
  tier = 'b2b_spotlight_whitelist',
  sessionId,
  amountPaid = '$49.00/mo',
  onRedirect,
  autoRedirectSeconds = 5
}) => {
  const [countdown, setCountdown] = useState(autoRedirectSeconds);
  const [copiedSession, setCopiedSession] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const cleanSlug = (serverSlug || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const resolvedServerId = serverId || `srv_${cleanSlug.replace(/[^a-z0-9]/g, '')}`;
  const displayReceiptId = sessionId || `cs_live_${resolvedServerId}_${Math.random().toString(36).substring(2, 9)}`;

  const tierNames: Record<string, string> = {
    community_whitelist: 'Starter Whitelist ($19.99/mo)',
    b2b_spotlight_whitelist: 'B2B Pro + AI Grader ($49.00/mo)',
    enterprise_network: 'Enterprise Network ($99.00/mo)',
    b2b_sponsor: 'B2B Pro + AI Grader ($49.00/mo)',
    b2b_sponsored: 'B2B Sponsored RP Server ($49.00/mo)'
  };

  const currentTierName = tierNames[tier] || 'B2B Pro + AI Grader ($49.00/mo)';

  // Countdown timer for automatic dashboard redirect
  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoRedirectSeconds);
      setIsRedirecting(false);
      return;
    }

    if (countdown <= 0) {
      handleExecuteRedirect();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, countdown, autoRedirectSeconds]);

  const handleExecuteRedirect = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    if (onRedirect) {
      onRedirect();
    } else {
      window.location.href = `/servers/${cleanSlug}/manage`;
    }
  };

  const handleCopyReceipt = () => {
    copyToClipboard(displayReceiptId);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  if (!isOpen) return null;

  const progressPercentage = ((autoRedirectSeconds - countdown) / autoRedirectSeconds) * 100;

  return (
    <div 
      id="payment-success-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div 
        id="payment-success-modal-card"
        className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl shadow-emerald-950/40 relative overflow-hidden my-auto"
      >
        {/* Glowing Background Radial Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge & Animated Check */}
        <div className="text-center space-y-3 relative z-10">
          <div className="relative inline-block">
            <div className="w-18 h-18 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce-short">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-amber-500 text-zinc-950 shadow-md">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Payment Confirmed • Server Linked</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Server Successfully Claimed!
          </h2>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Your subscription is officially active and <strong className="text-zinc-100">{serverName}</strong> has been linked to your verified Discord credentials.
          </p>
        </div>

        {/* Linked Server & Identity Details Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-3 relative z-10 shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">{serverName}</h4>
                <p className="text-[11px] font-mono text-zinc-500">/servers/{cleanSlug}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Verified Owner:
              </span>
              <span className="font-bold text-white font-mono">@{discordUsername}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                Plan Tier:
              </span>
              <span className="font-bold text-amber-400 text-[11px]">{currentTierName.split('(')[0].trim()}</span>
            </div>

            {discordId && (
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between sm:col-span-2">
                <span className="text-zinc-400">Discord Snowflake ID:</span>
                <span className="font-mono text-zinc-300 text-[11px]">{discordId}</span>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between sm:col-span-2">
              <span className="text-zinc-400">Billing Session ID:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-emerald-400 text-[11px] truncate max-w-[180px] sm:max-w-[240px]">
                  {displayReceiptId}
                </span>
                <button
                  onClick={handleCopyReceipt}
                  className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
                  title="Copy session receipt ID"
                >
                  {copiedSession ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Unlocked SaaS Features Highlights */}
        <div className="space-y-2 relative z-10">
          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Unlocked Owner Privileges</span>
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2 text-zinc-300">
              <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span>No-Code Form Builder</span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2 text-zinc-300">
              <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span>Gemini 3.7 AI Whitelist Grader</span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2 text-zinc-300">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Discord Bot Auto-Provisioning</span>
            </div>

            <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2 text-zinc-300">
              <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <span>Staff Review &amp; Decision Queue</span>
            </div>
          </div>
        </div>

        {/* Countdown Progress Bar & Actions */}
        <div className="pt-2 space-y-3 relative z-10 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Redirecting to Manage Dashboard...</span>
            <span className="font-mono font-bold text-amber-400">{countdown}s</span>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              id="redirect-to-manage-btn"
              onClick={handleExecuteRedirect}
              disabled={isRedirecting}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 hover:from-emerald-400 hover:to-amber-300 text-zinc-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <span>{isRedirecting ? 'Launching Dashboard...' : 'Go to Manage Dashboard Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition cursor-pointer border border-zinc-700 text-center"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
