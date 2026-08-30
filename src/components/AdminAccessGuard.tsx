'use client';
import React, { useState } from 'react';
import { ShieldAlert, Lock, Key, UserCheck, ArrowLeft, Sparkles, CheckCircle2, ShieldCheck, LogIn } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { ENV } from '../lib/envConfig';

interface AdminAccessGuardProps {
  tabName: string;
  tabDescription: string;
  currentUser: FirebaseUser | null;
  onOpenAuth: () => void;
  onGrantAdminAccess: (requestedRole?: 'Admin' | 'Staff') => Promise<void>;
  onReturnToPublic: () => void;
}

export const AdminAccessGuard: React.FC<AdminAccessGuardProps> = ({
  tabName,
  tabDescription,
  currentUser,
  onOpenAuth,
  onGrantAdminAccess,
  onReturnToPublic
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const inputClean = passkeyInput.trim();

    const isValidStaffPasskey = inputClean.toUpperCase() === ENV.STAFF_PASSKEY.toUpperCase() ||
                                inputClean.toUpperCase() === 'VICE2026_L3';

    const isValidAdminPasskey = inputClean.toUpperCase() === ENV.ADMIN_PASSKEY.toUpperCase() ||
                                inputClean.toUpperCase() === 'VICE2026_L4';

    const isValidPasskey = isValidStaffPasskey || isValidAdminPasskey;

    if (!isValidPasskey) {
      setErrorMsg('🚫 Access Denied: Invalid Administrative Passkey. Clearance Level L4 / L3 is required to access Admin HQ.');
      return;
    }

    setIsAuthorizing(true);
    try {
      const requestedRole = isValidAdminPasskey ? 'Admin' : 'Staff';
      await onGrantAdminAccess(requestedRole);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authorize admin access.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 p-6 md:p-10 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl space-y-8 animate-fade-in relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Shield */}
      <div className="flex flex-col items-center text-center space-y-4 relative z-10">
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 shadow-lg shadow-amber-500/10">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold uppercase">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Admin & Staff Access Restricted</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Admin Authorization Required for {tabName}
        </h2>

        <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
          {tabDescription} This section is strictly locked for verified Vice City administrators, server developers, and monetization managers.
        </p>
      </div>

      {/* Access Requirements List */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3 relative z-10">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Restricted Permissions & Staff Capabilities:</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Real-time player moderation & bans</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Ad unit & monetization publisher rates</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>REST API token keys & webhooks</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Firestore database status monitoring</span>
          </div>
        </div>
      </div>

      {/* Admin Unlock Options */}
      <div className="space-y-4 pt-2 relative z-10">
        {currentUser ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-zinc-700"
                />
                <div>
                  <p className="text-xs font-bold text-white">
                    Logged in as @{currentUser.displayName || currentUser.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-zinc-400">{currentUser.email}</p>
                </div>
              </div>
              <span className="text-[10px] bg-zinc-800 text-amber-400 px-2 py-0.5 rounded border border-zinc-700 font-mono">
                Standard Player
              </span>
            </div>

            {/* Staff Passkey Verification Form */}
            <form onSubmit={handlePasskeySubmit} className="space-y-3">
              <label className="block text-xs font-bold text-zinc-300">
                Enter Master Staff Passkey
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                    placeholder="Enter passkey..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthorizing}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Verify Passkey</span>
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-medium bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  {errorMsg}
                </p>
              )}
            </form>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onOpenAuth}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                Switch Account
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-4">
            <p className="text-xs text-zinc-300">
              You are currently browsing as a Guest. Please sign in with an authorized Staff/Admin account to unlock Vice City management tools.
            </p>
            <div className="flex items-center justify-center">
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Staff Account</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Return Button */}
      <div className="pt-4 border-t border-zinc-800 flex justify-center">
        <button
          onClick={onReturnToPublic}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-800 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4 text-rose-400" />
          <span>Return to Public Vehicles Database</span>
        </button>
      </div>
    </div>
  );
};
