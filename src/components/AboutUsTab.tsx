'use client';
import React from 'react';
import {
  Info,
  Zap,
  Users,
  Target,
  CheckCircle2,
  Sparkles,
  Car,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Radio,
  Gamepad2,
  Tv,
  Database,
  MessageSquare,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab } from '../types';
import { ENV } from '../lib/envConfig';

interface AboutUsTabProps {
  onNavigate?: (tab: ActiveTab) => void;
}

export const AboutUsTab: React.FC<AboutUsTabProps> = ({ onNavigate }) => {
  const discordUrl = ENV.DISCORD_INVITE_URL || '';

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12 space-y-12 animate-fade-in">
      {/* HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-rose-950/30 border border-rose-500/30 p-8 lg:p-12 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-2 shadow-sm">
              <Info className="w-3.5 h-3.5 text-rose-400" /> Official Platform Manifesto
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800/80 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Community Edition
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">{ENV.APP_NAME || 'ViceIntel'}</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-sans max-w-2xl">
            The definitive fan-built companion application and community operations hub for Grand Theft Auto VI and Leonida Vice City roleplay ecosystems.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            {onNavigate && (
              <button
                onClick={() => onNavigate('vehicles')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-rose-600/25 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Car className="w-4 h-4" />
                <span>Explore Telemetry Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {discordUrl ? (
              <a
                id="about-join-discord-hero-btn"
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-[#5865F2]/25 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Join Official Discord</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* THREE CORE SPECIFICATION CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        
        {/* CARD 1: WHAT THE PLATFORM IS FOR */}
        <div className="relative group rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 border border-zinc-800/80 hover:border-rose-500/50 p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-rose-950/20 hover:-translate-y-1 overflow-hidden">
          {/* Subtle Top Accent Glow Bar */}
          <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest bg-rose-500/10 text-rose-300 border border-rose-500/30">
                SECTION 01
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                What The Platform Is For
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed mt-2">
                <strong>{ENV.APP_NAME || 'ViceIntel'}</strong> is a high-precision, non-commercial fan database and real-time community operations platform engineered for GTA VI players, tuners, and FiveM / AltV communities.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-rose-500/30 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Real-Time Telemetry & Armory</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">Comprehensive vehicle physics data, 1v1 spec comparison matrices, and weapon DPS metrics.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-rose-500/30 transition-colors">
                <Sliders className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">3D Physics Handling Simulator</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">Live simulation of top speed, 0-60 ET, slip angles, and instant XML export.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-rose-500/30 transition-colors">
                <Database className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">RP Server Whitelist Engine</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">Dynamic form creation, Discord OAuth identity verification, and AI lore grading.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-rose-500/30 transition-colors">
                <Radio className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Live Voice & Tactical Comms</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">Low-latency WebRTC squad comms with camera video feeds and PiP popout capabilities.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span className="text-zinc-500">Platform Access</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">100% Free & Open</span>
          </div>
        </div>

        {/* CARD 2: WHO CAN USE IT */}
        <div className="relative group rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 border border-zinc-800/80 hover:border-cyan-500/50 p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-cyan-950/20 hover:-translate-y-1 overflow-hidden">
          {/* Subtle Top Accent Glow Bar */}
          <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                SECTION 02
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Who Can Use It
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed mt-2">
                Designed specifically for three core user communities across the global Grand Theft Auto ecosystem.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-cyan-500/30 transition-colors space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Gamepad2 className="w-3 h-3 text-cyan-400" /> Players
                  </span>
                  <h4 className="text-xs font-bold text-white">GTA VI Gamers</h4>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal pl-0.5">
                  Search vehicle stats, calculate business ROI yields, explore interactive map waypoints, and join live squads.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-cyan-500/30 transition-colors space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3 text-amber-400" /> Server Staff
                  </span>
                  <h4 className="text-xs font-bold text-white">FiveM & RP Owners</h4>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal pl-0.5">
                  Automate whitelist approvals, build custom dynamic applicant forms, and generate FiveM Lua scripts.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-cyan-500/30 transition-colors space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <Tv className="w-3 h-3 text-emerald-400" /> Creators
                  </span>
                  <h4 className="text-xs font-bold text-white">Media & Content Creators</h4>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal pl-0.5">
                  Track game updates, test custom vehicle builds, and showcase RP server highlights.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span className="text-zinc-500">Target Audience</span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">3 Core Groups</span>
          </div>
        </div>

        {/* CARD 3: WHAT PROBLEM WE ARE SOLVING */}
        <div className="relative group rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 border border-zinc-800/80 hover:border-amber-500/50 p-6 lg:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-950/20 hover:-translate-y-1 overflow-hidden">
          {/* Subtle Top Accent Glow Bar */}
          <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30">
                SECTION 03
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                What Problem We Are Solving
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed mt-2">
                Addressing key friction points in community gaming, vehicle tuning, and multiplayer server administration.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-amber-500/30 transition-colors">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Scattered Data</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">Eliminates unverified leaks by aggregating telemetry into a single, standardized, real-time catalog.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-amber-500/30 transition-colors">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">RP Onboarding Delays</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">Replaces manual Google Forms with automated Discord OAuth identity verification & AI lore scoring.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-amber-500/30 transition-colors">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Trial-and-Error Tuning</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">Simulates physics (top speed, drag, slip angle) in real-time before writing raw XML handling files.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-amber-500/30 transition-colors">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Isolated Gaming</h4>
                  <p className="text-[11px] text-zinc-400 leading-normal">Provides built-in WebRTC voice channels and weekly tuning competitions with live leaderboards.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span className="text-zinc-500">Friction Elimination</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">95% Time Saved</span>
          </div>
        </div>

      </div>

      {/* DEDICATED OFFICIAL DISCORD COMMUNITY HEADQUARTERS CARD */}
      {discordUrl ? (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#5865F2]/15 via-zinc-900/90 to-zinc-950/90 border border-[#5865F2]/40 p-6 lg:p-10 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#5865F2]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#5865F2]/20 text-[#8ea1e1] border border-[#5865F2]/40 flex items-center gap-2 shadow-sm">
                  <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" /> Official Community Hub
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live & Active
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Join the Official Discord Server
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed mt-2">
                  Connect with thousands of GTA VI roleplayers, FiveM server developers, car tuners, and creators. Get instant patch announcements, early telemetry drops, squad voice lobbies, and live whitelist application notifications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#5865F2] shrink-0" />
                  <span>Verified FiveM Server Staff & Developer Hub</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Instant GTA VI Newswire & Leak Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Squad Voice Channels & 90 FPS Screen Shares</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Weekly Tuning Championship Payouts</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto shrink-0">
              <a
                id="about-join-discord-cta-btn"
                href={discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-[#5865F2]/30 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Join Official Discord Server</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>

              <span className="text-[11px] font-mono text-zinc-400">
                Invite: <span className="text-zinc-200">{discordUrl}</span>
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* NON-COMMERCIAL FAN DISCLAIMER FOOTER NOTICE */}
      <div className="relative rounded-3xl bg-zinc-950/80 border border-zinc-800/80 p-6 lg:p-8 space-y-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono tracking-wider">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Non-Commercial Fan Database Declaration</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          <strong>ViceIntel</strong> is an open fan community project created for enthusiasts of Grand Theft Auto VI. This site is not affiliated with, endorsed by, or sponsored by Rockstar Games, Take-Two Interactive Software, Inc., or any of their subsidiaries. All trademarks, character names, location names, logos, and vehicle artwork belong strictly to their respective copyright holders.
        </p>
      </div>
    </div>
  );
};

