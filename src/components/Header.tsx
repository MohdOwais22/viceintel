'use client';
import React, { useState } from 'react';
import {
  Database,
  Sparkles,
  Flame,
  Shield,
  Search,
  User as UserIcon,
  Crown,
  Bell,
  Share2,
  Twitter,
  MessageCircle,
  Link2,
  Check,
  Globe,
  ExternalLink
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: string;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenAiAdvisor?: () => void;
  isVipActive: boolean;
  isAdmin?: boolean;
  currentUser?: FirebaseUser | null;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  activeTab,
  onOpenAuth,
  onOpenProfile,
  onOpenAiAdvisor,
  isVipActive,
  isAdmin = false,
  currentUser,
  unreadCount = 0
}) => {
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleCopyCurrentLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareTwitter = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const text = document.title || 'Check out GTA VI Central — Vice City Master Utility Suite!';
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&via=ViceIntelApp`, '_blank', 'noopener,noreferrer');
      setShowShareMenu(false);
    }
  };

  const handleShareReddit = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const title = document.title || 'GTA VI Central — Vice City Master Utility Suite';
      window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank', 'noopener,noreferrer');
      setShowShareMenu(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      const text = `${document.title || 'GTA VI Central'} — ${url}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      setShowShareMenu(false);
    }
  };

  const handleDeviceShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href
        });
        setShowShareMenu(false);
      } catch (e) {}
    } else {
      handleCopyCurrentLink();
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-600 text-white font-black text-xl shadow-lg shadow-rose-500/20">
            <span className="tracking-tighter">VI</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                GTA VI Central
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Vice City DB v2.5
              </span>
            </div>
            <p className="text-xs text-zinc-400">Leonida & Vice City Database • Utility Suite • Verified Specs</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vehicles, weapons, ROI, RP..."
            className="w-full bg-zinc-900/90 border border-zinc-700/60 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              ×
            </button>
          )}
        </div>

        {/* User Account & VIP Pass Button */}
        <div className="flex items-center gap-2.5">
          {onOpenAiAdvisor && (
            <button
              onClick={onOpenAiAdvisor}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI</span>
            </button>
          )}

          {/* Quick Social Share Popover */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                showShareMenu
                  ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-fuchsia-600/30'
                  : 'bg-gradient-to-r from-fuchsia-950/40 to-pink-950/40 hover:from-fuchsia-900/60 hover:to-pink-900/60 text-fuchsia-200 border-fuchsia-700/60 hover:border-fuchsia-500'
              }`}
              title="Share this page to social media or copy link"
              id="header-social-share-btn"
            >
              <Share2 className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
              <span className="inline font-semibold">Share</span>
            </button>

            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-2.5 py-1">
                  Share GTA VI Central
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={handleShareTwitter}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900 hover:text-white rounded-lg transition text-left"
                  >
                    <Twitter className="w-3.5 h-3.5 text-sky-400" />
                    <span>Share to X (Twitter)</span>
                  </button>

                  <button
                    onClick={handleShareReddit}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900 hover:text-white rounded-lg transition text-left"
                  >
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>Post to Reddit</span>
                  </button>

                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900 hover:text-white rounded-lg transition text-left"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Send via WhatsApp</span>
                  </button>

                  <button
                    onClick={handleDeviceShare}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900 hover:text-white rounded-lg transition text-left"
                  >
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Device Share...</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-zinc-800">
                    <button
                      onClick={handleCopyCurrentLink}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900 hover:text-white rounded-lg transition text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                      </div>
                      {copiedLink && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (currentUser && onOpenProfile) {
                onOpenProfile();
              } else {
                onOpenAuth();
              }
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border relative ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                : isVipActive
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                : currentUser
                ? 'bg-rose-950/60 text-rose-200 border-rose-500/40 hover:bg-rose-900/80'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
            }`}
          >
            {isAdmin ? (
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            ) : isVipActive ? (
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="truncate max-w-[120px]">
              {currentUser
                ? `${currentUser.displayName || currentUser.email?.split('@')[0]}${isAdmin ? ' (Admin)' : ''}`
                : 'Sign In / VIP Pass'}
            </span>
            {unreadCount > 0 && (
              <span className="flex items-center gap-1 bg-rose-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse shadow-md shadow-rose-500/40">
                <Bell className="w-2.5 h-2.5 fill-current" />
                {unreadCount}
              </span>
            )}
          </button>

          <div className="hidden xl:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Status: <strong className="text-emerald-400">Production Live</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};


