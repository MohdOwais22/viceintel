'use client';
import React from 'react';
import {
  Shield,
  Flame,
  Database,
  Radio,
  Car,
  Crosshair,
  MapPin,
  Calculator,
  Building2,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  Lock,
  CheckCircle2,
  BookOpen,
  Bug,
  Info,
  TrendingUp
} from 'lucide-react';
import { ActiveTab } from '../types';
import { getDocsNavigationTarget, getAdminNavigationTarget } from '../lib/subdomainRouter';

interface FooterProps {
  onNavigate?: (tab: ActiveTab) => void;
  onOpenReportModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenReportModal }) => {
  const handleNav = (tab: ActiveTab, e: React.MouseEvent) => {
    e.preventDefault();
    if (tab === 'docs') {
      const target = getDocsNavigationTarget();
      if (target.isExternal && typeof window !== 'undefined') {
        window.location.href = target.url;
        return;
      }
    } else if (tab === 'admin') {
      const target = getAdminNavigationTarget();
      if (target.isExternal && typeof window !== 'undefined') {
        window.location.href = target.url;
        return;
      }
    }
    if (onNavigate) {
      onNavigate(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/80 px-4 lg:px-8 pt-12 pb-8 mt-16 text-zinc-400 text-xs font-sans relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-rose-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* BRAND COLUMN (2 Cols wide on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 text-white font-black text-lg shadow-lg shadow-rose-600/30 border border-rose-400/30">
                VI
              </div>
              <div>
                <h3 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                  <span>ViceIntel</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold">
                    v2026.4
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Leonida & Vice City Fan Database & Utility Suite
                </p>
              </div>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed font-sans max-w-md">
              The ultimate non-commercial fan companion for Grand Theft Auto VI. Features real-time vehicle telemetry, weapon comparison matrices, business ROI calculators, custom vehicle tuning, interactive map waypoints, and low-latency community voice channels.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={(e) => handleNav('about', e)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-rose-400" />
                <span>About Us</span>
              </button>
              <button
                onClick={(e) => handleNav('pitch', e)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Investor Deck</span>
              </button>
            </div>

            {/* LIVE SYSTEM STATUS */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between gap-3 max-w-md">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-mono font-bold text-zinc-300">Network Status: Operational</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                99.9% Uptime
              </span>
            </div>
          </div>

          {/* COLUMN 1: UTILITIES & DATABASES */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-rose-400" />
              <span>Databases</span>
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <button
                  onClick={(e) => handleNav('about', e)}
                  className="hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer text-rose-300 font-semibold"
                >
                  <Info className="w-3 h-3 text-rose-400" />
                  <span>About Us & Platform Overview</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNav('vehicles', e)}
                  className="hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Car className="w-3 h-3 text-zinc-500" />
                  <span>Vehicle Telemetry Catalog</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNav('weapons', e)}
                  className="hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Crosshair className="w-3 h-3 text-zinc-500" />
                  <span>Armory & Weapon Specs</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNav('comparison', e)}
                  className="hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-3 h-3 text-zinc-500" />
                  <span>1v1 Spec Comparison Matrix</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNav('map', e)}
                  className="hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-zinc-500" />
                  <span>Vice City Interactive Map</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNav('rp-servers', e)}
                  className="hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-3 h-3 text-zinc-500" />
                  <span>FiveM RP Server Directory</span>
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 2: CALCULATORS & TOOLS */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Calculators</span>
            </h4>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <button
                  onClick={(e) => handleNav('handling-editor', e)}
                  className="hover:text-amber-400 transition flex items-center gap-1.5 cursor-pointer text-amber-300 font-semibold"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>handling.meta 3D Physics Editor</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNav('mod-calculator', e)}
                  className="hover:text-cyan-400 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Calculator className="w-3 h-3 text-zinc-500" />
                  <span>Performance Mod Calculator</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNav('roi-calculator', e)}
                  className="hover:text-cyan-400 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3 h-3 text-zinc-500" />
                  <span>Business Empire ROI Yields</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNav('chat', e)}
                  className="hover:text-cyan-400 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3 h-3 text-zinc-500" />
                  <span>Vice Squad Live Comms</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNav('seo-hub', e)}
                  className="hover:text-cyan-400 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3 text-zinc-500" />
                  <span>AI Midnight News Spider</span>
                </button>
              </li>
              <li>
                <div className="text-zinc-400 flex items-center gap-1.5 cursor-default select-none">
                  <Award className="w-3 h-3 text-zinc-500" />
                  <span>VIP Pass & Sponsorships</span>
                </div>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: KNOWLEDGE & POPULAR TAGS */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Leonida Directory</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Vice City Map
              </span>
              <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Ocean Drive
              </span>
              <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Grassriver
              </span>
              <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Grotti Furia
              </span>
              <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Banshee GTS
              </span>
              <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                Cheats Directory
              </span>
              <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                PC System Specs
              </span>
            </div>
          </div>
        </div>

        {/* LEGAL DISCLAIMER & COPYRIGHT PROTECTION NOTICE */}
        <div className="pt-8 border-t border-zinc-800/80 space-y-4">
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed space-y-2">
            <div className="flex items-center justify-between font-bold text-zinc-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Trademark & Copyright Notice</span>
              </div>
              <button
                onClick={(e) => handleNav('privacy', e)}
                className="text-[10px] font-mono text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <span>Read Full Legal & Privacy Policy</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <p>
              <strong className="text-zinc-300">ViceIntel</strong> is an independent, non-commercial fan-created database, news aggregator, and interactive gaming utility suite. This application is <strong className="text-zinc-300">NOT affiliated with, sponsored by, endorsed by, or associated with Rockstar Games, Take-Two Interactive Software, Inc., or any of their parent companies, subsidiaries, or affiliates.</strong>
            </p>
            <p className="text-zinc-500">
              Grand Theft Auto, GTA, Vice City, and all associated logos, titles, character names, vehicle models, and artwork are registered trademarks or copyrights of Take-Two Interactive Software, Inc. All game content and materials belong to their respective copyright holders.
            </p>
          </div>

          {/* BOTTOM BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 pt-2">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} ViceIntel Network. Created for the global gaming community.</span>
            </div>

            <div className="flex items-center gap-4 text-zinc-400">
              <button
                onClick={(e) => handleNav('about', e)}
                className="text-zinc-300 hover:text-white font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5 text-rose-400" />
                <span>About Us</span>
              </button>
              <span>•</span>
              <button
                onClick={(e) => handleNav('pitch', e)}
                className="text-amber-300 hover:text-amber-200 font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Investor Deck</span>
              </button>
              <span>•</span>
              <button
                onClick={(e) => handleNav('privacy', e)}
                className="text-zinc-300 hover:text-white font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Copyright & Privacy Policy</span>
              </button>
              {onOpenReportModal && (
                <>
                  <span>•</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenReportModal();
                    }}
                    className="text-rose-400 hover:text-rose-300 font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <Bug className="w-3 h-3" />
                    <span>Report a Bug / Issue</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
