'use client';

import React, { useState } from 'react';
import { ShieldAlert, HeartHandshake, CheckCircle2, Copy, X, Crown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { copyToClipboard } from '../../lib/copyUtils';

export interface AdBlockSupportBannerProps {
  onOpenVipCheckout?: () => void;
  className?: string;
  variant?: 'compact' | 'full' | 'inline';
}

export const AdBlockSupportBanner: React.FC<AdBlockSupportBannerProps> = ({
  onOpenVipCheckout,
  className = '',
  variant = 'compact'
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showWhitelistGuide, setShowWhitelistGuide] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (isDismissed) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'viceintel.app';

  const handleCopyDomain = async () => {
    const success = await copyToClipboard(currentHost);
    if (success) {
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/30 p-4 sm:p-5 shadow-xl shadow-amber-500/5 ${className}`}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Icon & Narrative */}
          <div className="flex items-start gap-3.5 max-w-2xl">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-black uppercase tracking-wider">
                  Support ViceIntel
                </span>
                <span className="text-xs font-bold text-white">
                  We noticed you're using an ad-blocker
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Vice City Central is independently hosted, updated daily with high-precision telemetry, handling calculators, and interactive map intelligence. Ads help keep this suite free for the entire community.
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={() => setShowWhitelistGuide(!showWhitelistGuide)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-zinc-700"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>{showWhitelistGuide ? 'Hide Guide' : 'How to Whitelist'}</span>
            </button>

            {onOpenVipCheckout && (
              <button
                onClick={onOpenVipCheckout}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Crown className="w-3.5 h-3.5 text-zinc-950" />
                <span>Go VIP (Ad-Free)</span>
              </button>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss banner"
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Step-by-Step Whitelist Instructions */}
        {showWhitelistGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 pt-4 border-t border-zinc-800/80 text-xs space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold block">1. Open Extension</span>
                <p className="text-zinc-400 text-[11px]">Click your ad-blocker icon (uBlock, AdGuard, Brave Shields) in the browser toolbar.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold block">2. Disable for Site</span>
                <p className="text-zinc-400 text-[11px]">Toggle the power switch or select "Don't run on pages on this domain".</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold block">3. Refresh Page</span>
                <p className="text-zinc-400 text-[11px]">Reload the page to experience full telemetry data feeds with our gratitude!</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] text-zinc-400">
                Target Domain: <code className="text-amber-300 font-mono font-bold">{currentHost}</code>
              </span>
              <button
                onClick={handleCopyDomain}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                {copiedDomain ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy Domain</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
