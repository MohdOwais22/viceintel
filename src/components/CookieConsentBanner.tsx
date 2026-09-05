'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cookie, 
  Check, 
  X, 
  Settings2, 
  Lock, 
  Activity, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  getCookiePreferences, 
  saveCookiePreferences, 
  acceptAllCookies, 
  acceptEssentialOnly,
  subscribeOpenPreferencesModal,
  CookiePreferences 
} from '../lib/cookieConsent';

interface CookieConsentBannerProps {
  onNavigatePrivacy?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onNavigatePrivacy
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(getCookiePreferences);

  // Form toggle in compact preferences modal
  const [allowAnalytics, setAllowAnalytics] = useState<boolean>(true);

  useEffect(() => {
    const current = getCookiePreferences();
    setPreferences(current);
    setAllowAnalytics(current.analytics);

    if (!current.hasChosen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for requests to re-open preferences (e.g. from footer)
  useEffect(() => {
    const unsubscribe = subscribeOpenPreferencesModal(() => {
      const current = getCookiePreferences();
      setPreferences(current);
      setAllowAnalytics(current.analytics);
      setIsModalOpen(true);
    });
    return unsubscribe;
  }, []);

  const handleAcceptAll = () => {
    const updated = acceptAllCookies();
    setPreferences(updated);
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleEssentialOnly = () => {
    const updated = acceptEssentialOnly();
    setPreferences(updated);
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleSaveCustom = () => {
    const updated = saveCookiePreferences({
      essential: true,
      analytics: allowAnalytics,
      functional: true,
      marketing: true // Preserves publisher ad revenue & sponsorships
    });
    setPreferences(updated);
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleOpenPrivacy = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onNavigatePrivacy) {
      onNavigatePrivacy();
    }
    setIsModalOpen(false);
  };

  return (
    <>
      {/* 1. SLEEK, COMPACT FLOATING BANNER */}
      {isVisible && !isModalOpen && (
        <aside
          aria-label="Cookie and Privacy Consent"
          className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-[80] w-[calc(100%-2rem)] sm:w-[380px] max-w-full animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto"
        >
          <div className="p-4 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-md text-zinc-200 text-xs relative overflow-hidden">
            {/* Ambient accent */}
            <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 blur-xl pointer-events-none rounded-full" />

            <div className="relative z-10 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400">
                    <Cookie className="w-4 h-4 shrink-0" />
                  </div>
                  <h3 className="font-bold text-white text-xs tracking-tight">
                    Cookie & Storage Notice
                  </h3>
                </div>

                <button
                  id="cookie-banner-quick-close"
                  onClick={handleAcceptAll}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md hover:bg-zinc-900 transition cursor-pointer"
                  title="Accept and close"
                  aria-label="Accept and close notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Concise Notice */}
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                We use cookies and local storage to keep your session active, cache offline databases, and support our community platform.
              </p>

              {/* Compact Buttons */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  id="cookie-accept-all-btn"
                  onClick={handleAcceptAll}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Accept</span>
                </button>

                <button
                  id="cookie-open-preferences-btn"
                  onClick={() => setIsModalOpen(true)}
                  className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  title="View options"
                >
                  <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Preferences</span>
                </button>
              </div>

              <div className="text-right pt-0.5">
                <button
                  id="cookie-view-privacy-link"
                  onClick={handleOpenPrivacy}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 transition cursor-pointer inline-flex items-center gap-0.5"
                >
                  <span>Privacy Policy</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 2. COMPACT, LIGHTWEIGHT PREFERENCES MODAL */}
      {isModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 text-zinc-200 space-y-4 relative ring-1 ring-white/5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400">
                  <Cookie className="w-4 h-4 shrink-0" />
                </div>
                <div>
                  <h2 id="cookie-modal-title" className="text-sm font-bold text-white tracking-tight">
                    Cookie Preferences
                  </h2>
                  <p className="text-[10px] text-zinc-400">Manage data stored on your device</p>
                </div>
              </div>

              <button
                id="cookie-modal-close-btn"
                onClick={() => {
                  setIsModalOpen(false);
                  if (!preferences.hasChosen) setIsVisible(true);
                }}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Concise Toggles */}
            <div className="space-y-2.5 text-xs">
              {/* Item 1: Essential Storage */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block text-xs">Essential & Security</span>
                    <span className="text-[10px] text-zinc-400 block">Sign-in session & offline vehicle caching</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20 shrink-0">
                  Required
                </span>
              </div>

              {/* Item 2: Analytics & Performance */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block text-xs">Performance Telemetry</span>
                    <span className="text-[10px] text-zinc-400 block">Anonymous metrics to monitor speed & latency</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    id="cookie-toggle-analytics"
                    type="checkbox"
                    checked={allowAnalytics}
                    onChange={(e) => setAllowAnalytics(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* VIP Note regarding ads */}
              <div className="px-3 py-2 rounded-xl bg-zinc-900/30 border border-zinc-800/60 flex items-center gap-2 text-[10px] text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Ad-free experience is unlocked with a VIP Pass.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="cookie-modal-save-custom-btn"
                onClick={handleSaveCustom}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-bold text-xs transition cursor-pointer"
              >
                Save
              </button>

              <button
                id="cookie-modal-accept-all-btn"
                onClick={handleAcceptAll}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-rose-600/20"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
