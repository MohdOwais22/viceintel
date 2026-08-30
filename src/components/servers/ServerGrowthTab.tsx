import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Server,
  ArrowLeft,
  Crown,
  Lock,
  Layers,
  Zap,
  TrendingUp,
  Globe,
  Radio,
  FileCode,
  Search,
  Video,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  LogIn
} from 'lucide-react';
import { MarketingWorkspace } from '../marketing/MarketingWorkspace';
import { getFormConfigBySlug, getUserProfile } from '../../lib/whitelist-service';
import { WhitelistFormConfig, UserProfile } from '../../types';
import { resolveMarketingTier } from '../../lib/marketing-auth';
import { isStaffUser } from '../../lib/rbac';

interface ServerGrowthTabProps {
  serverSlug: string;
  onNavigate?: (tab: string, slug?: string) => void;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
  } | null;
  onOpenAuth?: () => void;
}

export const ServerGrowthTab: React.FC<ServerGrowthTabProps> = ({
  serverSlug,
  onNavigate,
  currentUser,
  onOpenAuth
}) => {
  const [formConfig, setFormConfig] = useState<WhitelistFormConfig | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const serverDisplayName = formConfig?.serverName || (
    serverSlug
      ? serverSlug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : 'Vice City Server'
  );

  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        setLoading(true);
        const cfg = await getFormConfigBySlug(serverSlug);
        if (isMounted && cfg) {
          setFormConfig(cfg);
        }
        if (currentUser?.uid) {
          const profile = await getUserProfile(currentUser.uid);
          if (isMounted && profile) {
            setUserProfile(profile);
          }
        }
      } catch (err) {
        console.warn('Notice: Could not load server config or user profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, [serverSlug, currentUser?.uid]);

  const isDesignatedStaff = Boolean(
    currentUser?.isAdmin ||
    currentUser?.isStaff ||
    isStaffUser(userProfile?.role, currentUser?.email) ||
    (userProfile?.clearanceLevel && ['L4', 'L3', 'L4 Admin', 'L3 Staff'].includes(userProfile.clearanceLevel))
  );

  const isLocalClaimed = typeof window !== 'undefined' && localStorage.getItem(`gtavi_claimed_${serverSlug}`) === 'true';

  const isAuthorizedOwner = Boolean(
    isDesignatedStaff ||
    (formConfig && (
      (formConfig.ownerUid && formConfig.ownerUid === currentUser?.uid) ||
      (formConfig.ownerUid && currentUser?.email && formConfig.ownerUid.toLowerCase() === currentUser.email.toLowerCase())
    )) ||
    isLocalClaimed
  );

  const effectiveTier = (formConfig as any)?.subscriptionTier || (formConfig as any)?.tier || 'pro';
  const tierConfig = resolveMarketingTier({
    isAdmin: currentUser?.isAdmin,
    isStaff: currentUser?.isStaff,
    serverTier: effectiveTier
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.('server-dashboard', serverSlug)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <span className="text-zinc-600">/</span>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{serverDisplayName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 flex items-center gap-1">
              {!isAuthorizedOwner && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
              <span>Growth Studio</span>
            </span>
          </div>
        </div>

        {/* Quick Links Group */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onNavigate?.('server-manage', serverSlug)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
          >
            Edit Form
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('server-review', serverSlug)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
          >
            Review Queue
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('server-billing', serverSlug)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 font-bold hover:bg-amber-500/30 transition cursor-pointer"
          >
            Plan: {tierConfig.label}
          </button>
        </div>
      </div>

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
                <h2 className="text-xl font-black text-white">Marketing Studio Access Restricted</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  Role Protection Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Access to the Server Growth Engine Studio is restricted strictly to verified server owners or designated Staff accounts (Level 3 Staff / Level 4 Admin).
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
        /* Main Marketing Workspace Component (Strictly Server Studio Only) */
        <MarketingWorkspace
          initialScope="client_server"
          lockScope={true}
          serverSlug={serverSlug}
          serverName={serverDisplayName}
          userTier={effectiveTier}
          currentUser={currentUser}
          onUpgradeClick={() => onNavigate?.('server-billing', serverSlug)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
