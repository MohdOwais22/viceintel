import React from 'react';
import { Lock, AlertCircle, Clock, ShieldCheck, MessageSquare, ArrowLeft } from 'lucide-react';

interface PaymentMaintenanceNoticeProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  compact?: boolean;
}

export const PaymentMaintenanceNotice: React.FC<PaymentMaintenanceNoticeProps> = ({
  title = 'Payments Temporarily Locked',
  subtitle = 'We are currently upgrading our payment processing systems and security infrastructure. Checkout and payments are temporarily disabled — we will get back soon!',
  onBack,
  compact = false
}) => {
  if (compact) {
    return (
      <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
        <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{title}</span>
        </div>
        <p className="text-zinc-300 text-[11px] leading-relaxed">{subtitle}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400/90 font-mono font-bold pt-1">
          <Clock className="w-3 h-3" />
          <span>Maintenance in progress • Check back shortly</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/90 border border-amber-500/40 shadow-2xl relative overflow-hidden text-center space-y-5">
      {/* Glow background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Lock Icon */}
      <div className="relative inline-flex items-center justify-center p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
        <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
      </div>

      {/* Text Content */}
      <div className="space-y-2 max-w-md mx-auto relative z-10">
        <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider mb-1">
          System Maintenance Notice
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Details Card */}
      <div className="max-w-md mx-auto p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left space-y-2.5 text-xs text-zinc-300 relative z-10">
        <div className="flex items-center justify-between text-[11px] border-b border-zinc-800 pb-2">
          <span className="text-zinc-400">Gateway Status:</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
            TEMPORARILY PAUSED
          </span>
        </div>
        <div className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>All active subscriptions, VIP passes, and verified server privileges remain fully active during this maintenance window.</span>
        </div>
        <div className="flex items-start gap-2 text-[11px] text-zinc-400 leading-relaxed">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>We are finalizing routine gateway upgrades. We will get back soon!</span>
        </div>
      </div>

      {/* Action Buttons */}
      {onBack && (
        <div className="pt-2 relative z-10">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Close &amp; Return</span>
          </button>
        </div>
      )}
    </div>
  );
};
