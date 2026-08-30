import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, Sparkles, RefreshCw, Mail, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

interface EmailVerificationStepProps {
  email: string;
  username: string;
  devCodePreview?: string | null;
  codeSentNotice?: string | null;
  onVerifySuccess: (code: string) => Promise<void>;
  onResendCode: () => Promise<void>;
  onEditEmail: () => void;
  isVerifying: boolean;
  isResending: boolean;
  error: string | null;
  setError: (err: string | null) => void;
}

export const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  email,
  username,
  devCodePreview,
  codeSentNotice,
  onVerifySuccess,
  onResendCode,
  onEditEmail,
  isVerifying,
  isResending,
  error,
  setError,
}) => {
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(val);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit numeric verification code.');
      return;
    }
    await onVerifySuccess(code);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    await onResendCode();
    setResendCooldown(20);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* HEADER BADGE */}
      <div className="p-3 bg-zinc-950/90 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-rose-300 font-extrabold text-[11px]">
          <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Secondary Email Verification Active</span>
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

      {/* SUCCESS NOTICE */}
      {codeSentNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{codeSentNotice}</span>
        </div>
      )}

      {/* TARGET EMAIL DISPATCH SUMMARY */}
      <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs">
          <Mail className="w-3.5 h-3.5 text-rose-400" />
          <span>Verification Code Sent To:</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/40 py-1 px-3 rounded-lg border border-rose-500/30">
            {email}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 font-sans">
          Welcome <span className="text-white font-bold">@{username}</span>! Check your inbox for the 6-digit access code (valid for 15 minutes).
        </p>

        {/* DEV MODE CODE PREVIEW BANNER */}
        {devCodePreview && (
          <div className="pt-2.5 mt-2 border-t border-zinc-800/80">
            <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">
              ⚡ Live Dev Code Preview (Automatic Inbox Intercept)
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-base font-mono font-extrabold text-amber-300 tracking-[0.2em] bg-amber-500/10 px-4 py-1 rounded-lg border border-amber-500/30">
                {devCodePreview}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCode(devCodePreview);
                  if (error) setError(null);
                }}
                className="text-[10px] px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-md font-bold transition cursor-pointer"
              >
                Auto-Fill Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FORM STEP */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 text-center uppercase tracking-wider">
            Enter 6-Digit Verification Code
          </label>

          <div className="relative">
            <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              maxLength={6}
              required
              placeholder="123456"
              value={code}
              onChange={handleInputChange}
              className="w-full bg-zinc-950 border border-rose-500/40 rounded-xl pl-10 pr-4 py-2.5 text-xl font-mono font-black text-rose-300 tracking-[0.3em] text-center focus:border-rose-400 focus:ring-1 focus:ring-rose-500/50 outline-none transition"
            />
          </div>
          
          {/* VISUAL DIGIT INDICATOR */}
          <div className="flex justify-center gap-1.5 mt-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const filled = code.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-3 h-1 rounded-full transition-all duration-200 ${
                    filled ? 'bg-rose-500 shadow-sm shadow-rose-500/50 scale-110' : 'bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isVerifying || code.length !== 6}
          className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-rose-200" />
              <span>Verifying Code & Creating Account...</span>
            </span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Verify Code & Complete Registration</span>
            </>
          )}
        </button>

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
                ? 'Sending Code...'
                : resendCooldown > 0
                ? `Resend Code (${resendCooldown}s)`
                : 'Resend 6-Digit Code'}
            </span>
          </button>

          <button
            type="button"
            onClick={onEditEmail}
            className="text-zinc-400 hover:text-white transition text-[11px] flex items-center gap-1 cursor-pointer underline"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Edit Email Address</span>
          </button>
        </div>
      </form>
    </div>
  );
};
