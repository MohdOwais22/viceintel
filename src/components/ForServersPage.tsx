'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Zap, 
  FileCode2, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  DollarSign, 
  Users, 
  Clock, 
  Sparkles, 
  Terminal, 
  Download, 
  TrendingUp, 
  Lock,
  ChevronRight,
  X,
  CreditCard,
  Crown,
  Server,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Check,
  Globe
} from 'lucide-react';
import { B2B_PLAN_TIERS } from '../lib/stripe';
import { validateServerSlug, checkSlugAvailabilityApi } from '../lib/whitelist-service';
import { PaymentGatewayModal, PaymentItemPackage } from './PaymentGatewayModal';

interface ForServersPageProps {
  onNavigate?: (tab: string, targetId?: string) => void;
  onOpenAuth?: () => void;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    discordUsername?: string;
    discordId?: string;
    discordConnected?: boolean;
  } | null;
}

export const ForServersPage: React.FC<ForServersPageProps> = ({
  onNavigate,
  onOpenAuth,
  currentUser
}) => {
  // Interactive ROI Calculator State
  const [appsPerMonth, setAppsPerMonth] = useState<number>(350);
  const [staffReviewTimeMins, setStaffReviewTimeMins] = useState<number>(12);
  const [staffHourlyWage, setStaffHourlyWage] = useState<number>(18);
  const [serverTier, setServerTier] = useState<'community' | 'mega_server' | 'enterprise'>('mega_server');

  // Unified Payment Gateway Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentPackage, setPaymentPackage] = useState<PaymentItemPackage>({
    itemType: 'server_pro_pass',
    tierName: '14-Day Free Pro Pass ($0 Today)',
    faceValue: 49.00,
    netPrice: 0.00,
    discountAmount: 49.00,
    discountPercent: 100,
    isTrial: true,
    trialDays: 14,
    planTier: 'mega_server'
  });

  const handleOpenPaymentModal = (tier: 'trial' | 'community' | 'mega_server' | 'enterprise') => {
    if (!currentUser) {
      if (onOpenAuth) {
        onOpenAuth();
      }
      return;
    }

    if (tier === 'trial') {
      setPaymentPackage({
        itemType: 'server_pro_pass',
        tierName: '14-Day Free Pro Pass ($0 Today)',
        faceValue: 49.00,
        netPrice: 0.00,
        discountAmount: 49.00,
        discountPercent: 100,
        isTrial: true,
        trialDays: 14,
        planTier: 'mega_server'
      });
    } else if (tier === 'community') {
      setPaymentPackage({
        itemType: 'server_pro_pass',
        tierName: 'Community Server Pass ($29/mo)',
        faceValue: 29.00,
        netPrice: 29.00,
        discountAmount: 0.00,
        discountPercent: 0,
        isTrial: false,
        planTier: 'community'
      });
    } else if (tier === 'mega_server') {
      setPaymentPackage({
        itemType: 'server_pro_pass',
        tierName: 'Mega-Server Pro Tier ($49/mo)',
        faceValue: 49.00,
        netPrice: 49.00,
        discountAmount: 0.00,
        discountPercent: 0,
        isTrial: false,
        planTier: 'mega_server'
      });
    } else if (tier === 'enterprise') {
      setPaymentPackage({
        itemType: 'server_pro_pass',
        tierName: 'Enterprise Multi-Server Network ($99/mo)',
        faceValue: 99.00,
        netPrice: 99.00,
        discountAmount: 0.00,
        discountPercent: 0,
        isTrial: false,
        planTier: 'enterprise'
      });
    }
    setIsPaymentModalOpen(true);
  };

  // ROI Math
  const totalStaffHoursPerMonth = (appsPerMonth * staffReviewTimeMins) / 60;
  const manualLaborCost = totalStaffHoursPerMonth * staffHourlyWage;
  const subscriptionCost = serverTier === 'enterprise' ? 99 : serverTier === 'mega_server' ? 49 : 29;
  const automatedReviewHours = (appsPerMonth * 1.5) / 60; // 90% time saved
  const automatedLaborCost = automatedReviewHours * staffHourlyWage;
  const netMonthlySavings = Math.max(0, manualLaborCost - automatedLaborCost - subscriptionCost);
  const hoursSavedPerMonth = Math.max(0, Math.round(totalStaffHoursPerMonth - automatedReviewHours));
  const estimatedRoiPercent = Math.round((netMonthlySavings / subscriptionCost) * 100);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white pb-24">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-16 pb-20">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            Commercial SaaS for FiveM & GTA RP Communities
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Automate Whitelist Screening, <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-rose-400 to-amber-300">
              Role Syncing & Lua Economy
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate 20+ hours of tedious staff application reviews every week. Auto-screen player backstories with AI lore audits, sync Discord roles in real-time, and download ready-to-run QBCore/ESX Lua bundles.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleOpenPaymentModal('trial')}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-600/25 hover:shadow-rose-600/40 transition-all flex items-center justify-center gap-2.5 group cursor-pointer border border-rose-400/30 shrink-0"
            >
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">Start 14-Day Pro Pass ($49/mo)</span>
              <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const elem = document.getElementById('roi-calculator-section');
                elem?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 font-extrabold text-sm sm:text-base hover:bg-slate-800 transition-colors flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
            >
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Calculate Staff ROI</span>
            </button>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400">92%</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-medium">Review Time Saved</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-rose-400">0.4s</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-medium">Discord Role Sync</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">100%</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-medium">Valid QBCore/ESX Lua</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">&lt; 5 min</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-medium">Fast Onboarding</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Matrix Pillars */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-white">Engineered for FiveM Server Staff & Owners</h2>
          <p className="mt-3 text-slate-400 text-base max-w-xl mx-auto">
            Stop losing qualified roleplayers to multi-day review backlogs. Give your community an automated, enterprise-grade application portal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI Lore & Backstory Grader</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
              Gemini 3.7 Flash analyzes applicant backstories against powergaming, metagaming, and server rules. Flags low-effort copy-paste submissions instantly for staff review.
            </p>
            <div className="pt-4 border-t border-slate-800/60 text-xs text-cyan-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4" /> 90%+ Accuracy vs Rule Violations
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Discord Bot Role Sync</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
              When staff clicks "Approve" (or when AI score exceeds 90%), our Discord REST gateway instantly assigns your server's "Whitelisted Citizen" role and sends custom DMs.
            </p>
            <div className="pt-4 border-t border-slate-800/60 text-xs text-rose-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Automated Guild Role Assignment
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <FileCode2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Zero-Error Lua ZIP Bundles</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
              Export complete economy balance configurations, multi-job hierarchies, and vehicle handling parameters directly into production-ready QBCore & ESX files.
            </p>
            <div className="pt-4 border-t border-slate-800/60 text-xs text-amber-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Validated Syntax & ZIP Downloads
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Staff ROI Calculator */}
      <div id="roi-calculator-section" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 scroll-mt-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <DollarSign className="w-3.5 h-3.5" /> Interactive Staff Savings Model
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Calculate Your Server's Monthly ROI</h2>
              <p className="text-slate-400 text-sm mt-1">See how much staff time and labor cost you save with automated screening.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start">
              <button
                onClick={() => setServerTier('community')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  serverTier === 'community'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Community ($29/mo)
              </button>
              <button
                onClick={() => setServerTier('mega_server')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  serverTier === 'mega_server'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mega-Server ($49/mo)
              </button>
              <button
                onClick={() => setServerTier('enterprise')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  serverTier === 'enterprise'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Enterprise ($99/mo)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
            {/* Sliders Area */}
            <div className="lg:col-span-7 space-y-6">
              {/* Slider 1: Applications */}
              <div>
                <div className="flex justify-between items-center mb-2 text-sm font-medium">
                  <span className="text-slate-300">Monthly Whitelist Applications</span>
                  <span className="text-cyan-400 font-bold text-base">{appsPerMonth} apps / mo</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="3000"
                  step="25"
                  value={appsPerMonth}
                  onChange={(e) => setAppsPerMonth(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>50 (Small Hub)</span>
                  <span>500 (Growing RP)</span>
                  <span>1,500+ (Major Community)</span>
                  <span>3,000+ (Network)</span>
                </div>
              </div>

              {/* Slider 2: Review Time */}
              <div>
                <div className="flex justify-between items-center mb-2 text-sm font-medium">
                  <span className="text-slate-300">Staff Time per Manual Review</span>
                  <span className="text-rose-400 font-bold text-base">{staffReviewTimeMins} minutes</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={staffReviewTimeMins}
                  onChange={(e) => setStaffReviewTimeMins(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>5 mins (Quick Scan)</span>
                  <span>15 mins (Deep Backstory)</span>
                  <span>30 mins (Full Interview)</span>
                </div>
              </div>

              {/* Slider 3: Hourly Wage */}
              <div>
                <div className="flex justify-between items-center mb-2 text-sm font-medium">
                  <span className="text-slate-300">Estimated Staff Value / Hourly Rate</span>
                  <span className="text-emerald-400 font-bold text-base">${staffHourlyWage} / hr</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="1"
                  value={staffHourlyWage}
                  onChange={(e) => setStaffHourlyWage(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>$10 / hr (Volunteer Staff)</span>
                  <span>$20 / hr (Standard Admin)</span>
                  <span>$40 / hr (Senior Manager)</span>
                </div>
              </div>
            </div>

            {/* Live Results Card */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Estimated Monthly Impact</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Manual Staff Time Spent:</span>
                    <span className="font-semibold text-slate-200">{Math.round(totalStaffHoursPerMonth)} hrs / mo</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Manual Labor Value:</span>
                    <span className="font-semibold text-rose-400">${Math.round(manualLaborCost).toLocaleString()} / mo</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">
                      Vice City Central ({serverTier === 'enterprise' ? 'Enterprise' : serverTier === 'mega_server' ? 'Mega-Server' : 'Community'}):
                    </span>
                    <span className="font-semibold text-cyan-400">-${subscriptionCost} / mo</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Net Monthly Staff Value Saved</div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
                    ${Math.round(netMonthlySavings).toLocaleString()}
                    <span className="text-sm font-semibold text-slate-400"> / mo</span>
                  </div>
                  <div className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {hoursSavedPerMonth} hours saved ({estimatedRoiPercent}% ROI)
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenPaymentModal(serverTier === 'mega_server' ? 'trial' : serverTier)}
                className={`mt-6 w-full py-4 px-6 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xl ${
                  serverTier === 'enterprise'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20'
                    : serverTier === 'mega_server'
                      ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white shadow-rose-600/25 border border-rose-400/30'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                <span className="whitespace-nowrap sm:whitespace-normal text-center">
                  {serverTier === 'mega_server' 
                    ? '⚡ Claim 14-Day Pro Pass ($49/mo • $0 Today)' 
                    : `Claim This ROI for ${serverTier === 'enterprise' ? 'Enterprise ($99/mo)' : 'Community ($29/mo)'}`
                  }
                </span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tier Matrix */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        {/* Sentinel AI Growth & Marketing Suite Feature Showcase Banner */}
        <div className="mb-16 p-8 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Included in All Pro & Mega Server Packages
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Server Growth & Operating Suite</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Complete enterprise-grade player acquisition toolkit designed to scale your FiveM / GTA RP player base automatically.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Streamer Sponsorship CRM</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Twitch, Kick & YouTube creator CRM with Gemini AI pitch generator offering queue passes, custom MLOs, and stream safety guarantees.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>9:16 Short Video Studio</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Viral script blueprint generator for TikTok, Shorts & Reels detailing 0–3s hooks, scene storyboards, and audio vibes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Referral Quests & Leaderboard</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vanity referral links (`/join/server?ref=user`) tracking click-to-whitelisted-join conversions with Discord rewards.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>Multi-Platform Launch & pSEO</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Anti-spam Reddit launch threads, rich Discord webhook embeds, Twitter posts, and programmatic Google search pages.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> 14-Day Pro Trial Active
          </div>
          <h2 className="text-3xl font-extrabold text-white">Transparent Commercial Pricing</h2>
          <p className="mt-3 text-slate-400 text-base max-w-xl mx-auto">
            Choose the subscription tier that matches your community's active player count. Every Pro tier includes an instant 14-day zero-risk trial and full Growth Suite features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Tier 1: Community Server Tier ($29/mo) */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between relative">
            <div>
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Community Server Tier</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-white">$29</span>
                <span className="text-slate-400 text-sm font-medium">/ month</span>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Ideal for growing 32–64 slot FiveM roleplay servers looking to automate applicant screening and economy balance.
              </p>

              <div className="space-y-3 pt-6 border-t border-slate-800/80 text-sm">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Up to <strong>250 applications / month</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>AI Backstory & Lore Rule Grader</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Automated Discord Role Assignment</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Full QBCore/ESX Lua Generator</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 font-semibold text-purple-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>Server Growth Suite</strong> (Basic Referrals & pSEO)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Private Discord VIP Support Channel</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenPaymentModal('community')}
              className="mt-8 w-full py-3.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Select Community ($29/mo)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tier 2: Mega-Server Pro Tier ($49/mo) - Highlighted */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.2)] flex flex-col justify-between relative scale-105 z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 14-Day Free Trial Available
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Mega-Server Pro Tier</div>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold">14 Days Free</span>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-black text-white">$49</span>
                <span className="text-slate-400 text-sm font-medium">/ month after trial</span>
              </div>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Full-scale automation for 128–2048 slot mega-servers with custom forms, deep lore grading, priority ranking & Server Growth Suite.
              </p>

              <div className="space-y-3.5 pt-6 border-t border-slate-800 text-sm">
                <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span><strong>Unlimited</strong> player applications / month</span>
                </div>
                <div className="flex items-center gap-2.5 text-purple-300 font-bold bg-purple-950/40 p-2 rounded-lg border border-purple-500/30">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span><strong>Full Server Growth Suite</strong> (Streamer CRM, 9:16 Shorts Studio, Referral Quests & Copywriter)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>AI Deep Lore & Rule Violation Audits</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Multi-Job Economy Balance ZIP Bundle Export</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span><strong>#1 Priority Directory Ranking</strong> with Gold Badge</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Custom Application Slug & White-Label Meta</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Dedicated 1-on-1 Discord Bot Provisioning</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenPaymentModal('trial')}
              className="mt-8 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm tracking-wide transition-all shadow-xl shadow-rose-600/25 hover:shadow-rose-600/40 border border-rose-400/30 flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Sparkles className="w-4.5 h-4.5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap sm:whitespace-normal text-center">Start 14-Day Pro Pass ($49/mo)</span>
              <ArrowRight className="w-4.5 h-4.5 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Tier 3: Enterprise Multi-Server ($99/mo) */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between relative">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Enterprise Multi-Server Network</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-white">$99</span>
                <span className="text-slate-400 text-sm font-medium">/ month</span>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Tailored for multi-server gaming networks running 3+ connected FiveM cities with cross-server staff synchronization.
              </p>

              <div className="space-y-3 pt-6 border-t border-slate-800/80 text-sm">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Up to <strong>5 Linked Server Communities</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-purple-300 font-bold bg-purple-950/30 p-2 rounded-lg border border-purple-500/30">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>Multi-Server Growth Suite</strong> (Multi-Server Growth & Cross-Network Campaign Analytics)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Cross-Server Unified Whitelist Database</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Custom Webhook Dispatcher & REST API Keys</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Dedicated Enterprise SLA & Phone Escalation</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenPaymentModal('enterprise')}
              className="mt-8 w-full py-3.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Deploy Network ($99/mo)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Steps Visualizer */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Up & Running in Under 5 Minutes</h2>
          <p className="mt-2 text-slate-400 text-sm">Simple self-serve onboarding that doesn't require developer skills.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-sm flex items-center justify-center mx-auto mb-3">1</div>
            <h4 className="font-bold text-white text-sm mb-1">Select Subscription</h4>
            <p className="text-xs text-slate-400">Choose Community ($29), Mega-Server ($49), or Enterprise ($99) on Stripe checkout.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 font-black text-sm flex items-center justify-center mx-auto mb-3">2</div>
            <h4 className="font-bold text-white text-sm mb-1">Link Discord Guild</h4>
            <p className="text-xs text-slate-400">Invite our verified bot and link your server's Whitelisted Role ID.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center mx-auto mb-3">3</div>
            <h4 className="font-bold text-white text-sm mb-1">Customize Form</h4>
            <p className="text-xs text-slate-400">Pick from pre-built question templates (LSPD, EMS, Gangs, Civilians).</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mx-auto mb-3">4</div>
            <h4 className="font-bold text-white text-sm mb-1">Go Live</h4>
            <p className="text-xs text-slate-400">Share your branded portal URL with prospective players.</p>
          </div>
        </div>
      </div>

      {/* Unified Reusable Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        checkoutPackage={paymentPackage}
        currentUser={currentUser}
        onNavigate={onNavigate}
        onPaymentSuccess={(orderId) => {
          console.log('Payment/Trial successfully processed:', orderId);
        }}
      />
    </div>
  );
};
