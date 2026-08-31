import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, RefreshCw, Mail, ArrowLeft, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';

interface EmailVerificationStepProps {
  email: string;
  username: string;
  codeSentNotice?: string | null;
  onCheckVerified: () => Promise<void>;
  onResendLink: () => Promise<void>;
  onEditEmail: () => void;
  onContinue: () => void;
  isVerifying: boolean;
  isResending: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

export const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  email,
  username,
  codeSentNotice,
  onCheckVerified,
  onResendLink,
  onEditEmail,
  onContinue,
  isVerifying,
  isResending,
  error,
  setError,
}) => {
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    await onResendLink();
    setResendCooldown(45);
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (error) setError(null);
    await onCheckVerified();
  };

  return (
    <div className="space-y-4 font-sans">
      {/* HEADER BADGE */}
      <div className="p-3 bg-zinc-950/90 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-rose-300 font-extrabold text-[11px]">
          <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Firebase Native Email Verification</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          Step 2 of 2
        </span>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* SUCCESS / SENT NOTICE */}
      {codeSentNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{codeSentNotice}</span>
        </div>
      )}

      {/* TARGET EMAIL DISPATCH SUMMARY */}
      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/40">
          <Mail className="w-6 h-6 animate-pulse" />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold text-zinc-300">Verification Link Sent To:</p>
          <div className="inline-block px-3 py-1 bg-zinc-900 border border-rose-500/30 rounded-lg text-xs font-mono font-extrabold text-rose-300">
            {email}
          </div>
        </div>

        <div className="p-3 bg-zinc-900/70 rounded-xl border border-zinc-800 text-left space-y-1.5 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2 text-zinc-200 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>How to complete verification:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-zinc-400 pl-1 leading-relaxed">
            <li>Open your email inbox (check <strong>Spam / Junk / Promotions</strong> too).</li>
            <li>Click the verification link from <strong>Google Firebase / ViceIntel</strong>.</li>
            <li>Return here and click <strong>"I Have Verified My Email"</strong> below.</li>
          </ol>
        </div>
      </div>

      {/* ACTIONS */}
      <form onSubmit={handleCheck} className="space-y-2.5">
        <button
          type="submit"
          disabled={isVerifying}
          className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-rose-200" />
              <span>Checking Verification Status with Firebase...</span>
            </span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>I Have Verified My Email (Check Status)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-zinc-800 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue to Portal (Verify Later)</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </form>

      {/* FOOTER CONTROLS */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending}
          className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
            resendCooldown > 0 || isResending ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-rose-300'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
          <span>
            {isResending
              ? 'Sending Link...'
              : resendCooldown > 0
              ? `Resend Link (${resendCooldown}s)`
              : 'Resend Verification Email'}
          </span>
        </button>

        <button
          type="button"
          onClick={onEditEmail}
          className="text-zinc-400 hover:text-white transition text-[11px] flex items-center gap-1 cursor-pointer underline"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Back to Registration</span>
        </button>
      </div>
    </div>
  );
};
