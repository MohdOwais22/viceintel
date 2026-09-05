'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  X,
  CreditCard,
  Crown,
  Server,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Check,
  Globe,
  Radio,
  Copy,
  ExternalLink,
  Flame,
  Activity,
  Award,
  Shield,
  Key,
  Compass,
  Laptop,
  RefreshCw,
  Wand2,
  Star,
  MessageSquare,
  HelpCircle,
  Video,
  Share2,
  Target
} from 'lucide-react';
import { B2B_PLAN_TIERS } from '../lib/stripe';
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
  // Active Interactive Preview Studio Tab (Police & EMS MDT tab removed as requested)
  const [activeStudioTab, setActiveStudioTab] = useState<'whitelist' | 'domain' | 'growth' | 'lua' | 'ondemand'>('whitelist');
  
  // Custom Domain Live Simulator State
  const [customDomainInput, setCustomDomainInput] = useState<string>('apply.miamividarp.com');
  const [isDnsTesting, setIsDnsTesting] = useState<boolean>(false);
  const [dnsTestResult, setDnsTestResult] = useState<{
    status: 'idle' | 'verified' | 'propagating';
    ssl: 'active' | 'generating';
    cnameTarget: string;
    latencyMs: number;
  }>({
    status: 'idle',
    ssl: 'active',
    cnameTarget: 'cname.viceintel.app',
    latencyMs: 14
  });
  const [copiedCname, setCopiedCname] = useState<boolean>(false);

  // Growth Studio Simulator State
  const [streamerPlatform, setStreamerPlatform] = useState<'twitch' | 'kick' | 'tiktok'>('twitch');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Interactive ROI Calculator State
  const [appsPerMonth, setAppsPerMonth] = useState<number>(450);
  const [staffReviewTimeMins, setStaffReviewTimeMins] = useState<number>(14);
  const [staffHourlyWage, setStaffHourlyWage] = useState<number>(20);
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
        tierName: 'Enterprise Multi-Server Network ($199/mo)',
        faceValue: 199.00,
        netPrice: 199.00,
        discountAmount: 0.00,
        discountPercent: 0,
        isTrial: false,
        planTier: 'enterprise'
      });
    }
    setIsPaymentModalOpen(true);
  };

  const handleRunDnsTest = () => {
    setIsDnsTesting(true);
    setTimeout(() => {
      setIsDnsTesting(false);
      setDnsTestResult({
        status: 'verified',
        ssl: 'active',
        cnameTarget: 'cname.viceintel.app',
        latencyMs: Math.floor(Math.random() * 12) + 8
      });
    }, 850);
  };

  const handleCopyCname = () => {
    navigator.clipboard.writeText('cname.viceintel.app');
    setCopiedCname(true);
    setTimeout(() => setCopiedCname(false), 2500);
  };

  // ROI Math
  const totalStaffHoursPerMonth = (appsPerMonth * staffReviewTimeMins) / 60;
  const manualLaborCost = totalStaffHoursPerMonth * staffHourlyWage;
  const subscriptionCost = serverTier === 'enterprise' ? 199 : serverTier === 'mega_server' ? 49 : 29;
  const automatedReviewHours = (appsPerMonth * 1.5) / 60; // 90% time saved
  const automatedLaborCost = automatedReviewHours * staffHourlyWage;
  const netMonthlySavings = Math.max(0, manualLaborCost - automatedLaborCost - subscriptionCost);
  const hoursSavedPerMonth = Math.max(0, Math.round(totalStaffHoursPerMonth - automatedReviewHours));
  const estimatedRoiPercent = Math.round((netMonthlySavings / subscriptionCost) * 100);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-rose-500 selection:text-white pb-28">
      
      {/* 1. TOP HERO BANNER: HIGH-CONVERTING VALUE HOOK */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-16 pb-20">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:28px_28px]"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-r from-rose-500/15 via-purple-500/15 to-cyan-500/15 blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          
          {/* High-Converting Social Proof Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.25)] mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Over 14,800+ Applications Audited • Trusted by 120+ FiveM & GTA RP Communities</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-tight sm:leading-none">
            The Operating System For <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-rose-400 to-amber-300">
              Elite GTA RP Communities
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-sans">
            Stop losing players to slow, tedious Google Forms. Automate applicant screening with <strong>Gemini 3.7 AI Lore Audits</strong>, assign Discord roles in <strong>&lt; 350ms</strong>, launch on your own <strong>Custom Domain</strong> (<code className="text-cyan-300 text-sm font-mono">apply.yourcity.com</code>), and scale your player queue 24/7 on autopilot.
          </p>

          {/* Friction-Free Dual Conversion CTAs */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleOpenPaymentModal('trial')}
              className="px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm sm:text-base shadow-2xl shadow-rose-600/40 hover:shadow-rose-600/60 transition-all flex items-center justify-center gap-2.5 group cursor-pointer border border-rose-400/50 shrink-0 transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">Start 14-Day Free Pro Pass ($0 Today)</span>
              <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const elem = document.getElementById('interactive-studio-section');
                elem?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-7 sm:px-8 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-cyan-500 text-slate-200 font-extrabold text-sm sm:text-base hover:bg-slate-800 transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 shadow-lg"
            >
              <Laptop className="w-5 h-5 text-cyan-400 shrink-0" />
              <span className="whitespace-nowrap">Try Interactive Sandbox</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Instant 2-Minute Setup</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 14-Day Zero-Risk Trial</span>
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-amber-400" /> Cancel Anytime In 1 Click</span>
          </div>

          {/* Social Proof Metric Highlights */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400">94%</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Staff Hours Saved</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-rose-400">&lt; 350ms</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Discord Auto-Role Speed</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">3.4x</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Higher Player Retention</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">$1,240/mo</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Average Labor Savings</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE COST OF INACTION: WHY 82% OF FIVEM SERVERS DIE IN 60 DAYS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-b border-slate-900">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> The Hidden Growth Killer
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">Why Great RP Servers Struggle To Grow</h2>
          <p className="mt-3 text-slate-400 text-base max-w-2xl mx-auto font-sans">
            Server owners invest hundreds of dollars into maps, custom cars, and hosting — only to bleed players through a broken, frustrating onboarding experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* The Broken Old Way */}
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-rose-400 font-extrabold text-lg">
                <X className="w-5 h-5 bg-rose-500/20 p-1 rounded-full text-rose-300" />
                <span>The Traditional Way (Manual & Broken)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Relying on cluttered Google Forms, slow manual staff reviews, and disconnected Discord bots creates severe friction that pushes enthusiastic players straight to rival servers.
              </p>
              <div className="space-y-3 pt-2 text-xs sm:text-sm">
                <div className="flex items-start gap-2 text-rose-300">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>48–72 Hour Review Delays:</strong> Eager applicants lose interest and join another server while waiting for staff.</span>
                </div>
                <div className="flex items-start gap-2 text-rose-300">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Severe Staff Burnout:</strong> Admins spend 3+ hours every night reading boring paragraphs instead of playing or running events.</span>
                </div>
                <div className="flex items-start gap-2 text-rose-300">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Toxic Trolls Slip Through:</strong> Tired reviewers miss copied backstories and powergamers who quickly ruin in-game roleplay.</span>
                </div>
                <div className="flex items-start gap-2 text-rose-300">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><strong>Fragmented Tech Bill ($120+/mo):</strong> Paying for a form builder, separate Discord bot, and web hosting with zero integration.</span>
                </div>
              </div>
            </div>
            <div className="mt-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
              Result: High player drop-off, exhausted staff, and an empty queue.
            </div>
          </div>

          {/* The ViceIntel Way */}
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/40 flex flex-col justify-between relative shadow-[0_0_40px_rgba(16,185,129,0.1)]">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-400 font-extrabold text-lg">
                <CheckCircle2 className="w-5 h-5 bg-emerald-500/20 p-1 rounded-full text-emerald-300" />
                <span>The ViceIntel SaaS Way (Automated & Scalable)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                A unified, self-running community portal that evaluates backstories in 30 seconds, assigns Discord roles instantly, and scales your player count effortlessly.
              </p>
              <div className="space-y-3 pt-2 text-xs sm:text-sm">
                <div className="flex items-start gap-2 text-emerald-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>30-Second Instant Onboarding:</strong> Gemini 3.7 AI audits backstory lore and checks FearRP/NLR rules in real time.</span>
                </div>
                <div className="flex items-start gap-2 text-emerald-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Instant Discord Role Sync (&lt; 350ms):</strong> Approved players receive citizen roles and welcome instructions immediately.</span>
                </div>
                <div className="flex items-start gap-2 text-emerald-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>White-Labeled Custom Domain:</strong> Launch on <code className="text-cyan-300 font-mono text-xs">apply.yourcity.com</code> with automatic SSL certificate generation.</span>
                </div>
                <div className="flex items-start gap-2 text-emerald-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Built-In Server Growth CRM:</strong> Tap into top Twitch/Kick streamers and generate viral 9:16 TikTok scripts to flood your queue.</span>
                </div>
              </div>
            </div>
            <div className="mt-6 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
              Result: 24/7 automated player queue, happy staff, and explosive server growth.
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE LIVE PLATFORM STUDIO (SANDBOX SIMULATOR) */}
      <div id="interactive-studio-section" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 scroll-mt-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Laptop className="w-3.5 h-3.5" /> Interactive Sandbox Preview
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Experience The Infrastructure Live</h2>
          <p className="mt-2 text-slate-400 text-base max-w-2xl mx-auto font-sans">
            Test-drive the exact high-framerate interface your staff and applicants will use before starting your free trial.
          </p>
        </div>

        {/* Tab Switcher (Without MDT Tab) */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto mb-8 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveStudioTab('whitelist')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeStudioTab === 'whitelist'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Whitelist Builder</span>
          </button>
          <button
            onClick={() => setActiveStudioTab('domain')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeStudioTab === 'domain'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Custom Domain Engine</span>
          </button>
          <button
            onClick={() => setActiveStudioTab('growth')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeStudioTab === 'growth'
                ? 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Server Growth Suite</span>
          </button>
          <button
            onClick={() => setActiveStudioTab('lua')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeStudioTab === 'lua'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Lua Script Studio</span>
          </button>
          <button
            onClick={() => setActiveStudioTab('ondemand')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeStudioTab === 'ondemand'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-black shadow-lg shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wand2 className="w-4 h-4 text-cyan-300" />
            <span>Features On Demand</span>
          </button>
        </div>

        {/* Studio Viewport Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
          
          {/* TAB 1: AI WHITELIST BUILDER */}
          {activeStudioTab === 'whitelist' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <span>No-Code Dynamic Application Portal & AI Lore Auditor</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">GEMINI 3.7 FLASH</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Custom questions, character backstory word counters, and automatic powergaming/FearRP violation detection.</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold shrink-0 self-start sm:self-auto">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>&lt; 350ms Discord Auto-Role</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <span>Real-Time Applicant Submission (Live Demo)</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">1. Character Backstory (Min 150 words)</label>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed text-xs">
                        "Jason grew up in Port Gellhorn working at his uncle’s boat engine shop. After the 2024 economic downturn, he took a high-risk cargo run across Biscayne Bay. When federal agents intercepted the docks, Jason escaped without firing a single shot..."
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-semibold">2. FearRP Scenario Definition</label>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed text-xs">
                        "If two armed robbers have guns aimed at my back while I am withdrawing cash, I must value my character’s life, comply with demands, and roleplay distress rather than drawing a weapon."
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Instant AI Lore & Rule Audit Output</span>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Score: 96 / 100 (Passed)
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> High-Quality Lore Cohesion</div>
                      <p className="text-[11px] text-slate-300">Grounding references Leonida locations (Port Gellhorn) and realistic character motivations.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Zero Powergaming Flags</div>
                      <p className="text-[11px] text-slate-300">Character acknowledges realistic vulnerabilities and complies with server FearRP standards.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Discord Auto-Role Triggered</div>
                      <p className="text-[11px] text-slate-300">Assigned role "Whitelisted Citizen" to applicant Discord account in 0.38 seconds.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM DOMAIN ENGINE */}
          {activeStudioTab === 'domain' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <span>1-Click Automated Custom Domain & SSL Gateway</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">AUTO TLS / LET'S ENCRYPT</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Give your server its own branded URL (e.g. apply.miamirp.com) with automated multi-tenant routing.</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shrink-0 self-start sm:self-auto">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Mega-Server ($49/mo) & Enterprise ($199/mo) Feature</span>
                </div>
              </div>

              {/* Informational banner about Community vs Mega/Enterprise domain routing */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200">Domain Tier Policy:</strong> Community Server Tier ($29/mo) provides instant zero-config subdomains (<code className="text-cyan-300 font-mono">slug.viceintel.app</code>). White-labeled dedicated custom domains with automated Let's Encrypt TLS certificates are exclusively available on <strong>Mega-Server Pro Tier</strong> ($49/mo) and <strong>Enterprise Networks</strong> ($199/mo).
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Configure Server Domain</div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Your Custom Subdomain or Root Domain</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customDomainInput}
                          onChange={(e) => setCustomDomainInput(e.target.value)}
                          placeholder="apply.yourcity.com"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          onClick={handleRunDnsTest}
                          disabled={isDnsTesting}
                          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50 shrink-0"
                        >
                          {isDnsTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          <span>Test CNAME</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                      <div className="text-slate-400 font-semibold">Required DNS Record at Your Registrar (Namecheap, Cloudflare, GoDaddy):</div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800">
                        <span>CNAME &rarr; cname.viceintel.app</span>
                        <button
                          onClick={handleCopyCname}
                          className="text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                        >
                          {copiedCname ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCname ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Domain Routing Live Status</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {dnsTestResult.latencyMs}ms Ingress
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">Incoming Host Header:</span>
                        <span className="font-mono text-white font-bold">{customDomainInput || 'apply.miamividarp.com'}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">SSL Certificate:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> Auto-Provisioned (TLS 1.3)</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400">In-Game NUI Compatibility:</span>
                        <span className="text-cyan-400 font-bold">100% (No CORS / Frame Lock)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SERVER GROWTH & STREAMER CRM SUITE */}
          {activeStudioTab === 'growth' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-400" />
                    <span>Server Growth Engine & Streamer CRM</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">VIRAL REACH</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Scale past 500+ active players with automated Twitch/Kick streamer outreach and 9:16 viral TikTok/Reels clip script studio.</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span>3.4x Player Growth Multiplier</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Growth Card 1 */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <Radio className="w-4 h-4 text-rose-400" />
                      <span>Streamer Outreach Pipeline</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">CRM Mode</span>
                  </div>
                  <p className="text-xs text-slate-400">Track and invite verified Twitch/Kick creators with custom starter packages and VIP queue priority tags.</p>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="font-semibold text-white">Top Target Creators:</div>
                    <div className="flex justify-between text-slate-400"><span>• Twitch GTA RP Partners</span><span className="text-emerald-400">12 Contacted</span></div>
                    <div className="flex justify-between text-slate-400"><span>• Kick Leonida Streamers</span><span className="text-emerald-400">8 Active</span></div>
                  </div>
                </div>

                {/* Growth Card 2 */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                      <Video className="w-4 h-4 text-cyan-400" />
                      <span>9:16 Shorts & TikTok Studio</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">AI Hooks</span>
                  </div>
                  <p className="text-xs text-slate-400">Generate high-converting 15-second viral video hooks based on your server's unique custom lore, police chases, and drug cartel events.</p>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="font-semibold text-white">Suggested Viral Hook:</div>
                    <div className="text-cyan-300 italic">"The only Vice City server where cops have to warrant search your private yacht..."</div>
                  </div>
                </div>

                {/* Growth Card 3 */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Share2 className="w-4 h-4 text-emerald-400" />
                      <span>Player Referral Quests</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Viral Loop</span>
                  </div>
                  <p className="text-xs text-slate-400">Reward your existing citizens with in-game vehicle cosmetics and priority queue for inviting their friends.</p>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="font-semibold text-white">Viral Referral Loop:</div>
                    <div className="flex justify-between text-slate-400"><span>Invite 3 Friends</span><span className="text-amber-300">+ Priority Pass</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LUA SCRIPT STUDIO */}
          {activeStudioTab === 'lua' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <span>Export Ready-To-Run QBCore & ESX Lua Code</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">ZERO SYNTAX ERRORS</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Export configured economy tables, vehicle handling configs, and whitelist hooks in 1 click.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto max-h-60 leading-relaxed">
                <pre>{`-- [[ Generated via ViceIntel SaaS Suite for FiveM QBCore / ESX ]] --
local Config = {}
Config.ServerSlug = "miami-vida-rp"
Config.WebhookGateway = "https://viceintel.app/api/discord/webhook"
Config.AutoKickUnwhitelisted = true

RegisterNetEvent('viceintel:onPlayerJoin', function(source, citizenId)
    local src = source
    local isWhitelisted = exports['viceintel-core']:VerifyCitizenStatus(citizenId)
    if not isWhitelisted then
        DropPlayer(src, "Application Required: Please apply at https://${customDomainInput || 'apply.miamirp.com'}")
    end
end)`}</pre>
              </div>
            </div>
          )}

          {/* TAB 5: ON-DEMAND CUSTOM FEATURE ENGINE */}
          {activeStudioTab === 'ondemand' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-cyan-400" />
                    <span>On-Demand Custom Feature Request Portal</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">DIRECT ENGINEER QUEUE</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Need a custom Lua script, Discord bot integration, or bespoke web feature? Request it directly from your server owner dashboard.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span>1. Submit Feature Request</span>
                  </div>
                  <p className="text-xs text-slate-300">Specify feature category (Lua Script, Discord Bot, Web UI, Database), priority, and requirements.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                  <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                    <span>2. Real-Time Staff Sync</span>
                  </div>
                  <p className="text-xs text-slate-300">Requests sync instantly via secure cloud database to ViceIntel Control Panel for review and milestone scoping.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>3. Delivery & Activation</span>
                  </div>
                  <p className="text-xs text-slate-300">Track real-time status updates (Under Review &rarr; In Development &rarr; Deployed) with direct engineering notes.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 4. INTERACTIVE STAFF ROI CALCULATOR */}
      <div id="roi-calculator-section" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 scroll-mt-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <DollarSign className="w-3.5 h-3.5" /> Interactive Staff Savings Model
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Calculate Your Server's Monthly ROI</h2>
              <p className="text-slate-400 text-sm mt-1">See how much staff time and labor cost you save with automated AI screening.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start">
              <button
                onClick={() => setServerTier('community')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  serverTier === 'community'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Community ($29/mo)
              </button>
              <button
                onClick={() => setServerTier('mega_server')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  serverTier === 'mega_server'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mega-Server ($49/mo)
              </button>
              <button
                onClick={() => setServerTier('enterprise')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  serverTier === 'enterprise'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Enterprise ($199/mo)
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
                      ViceIntel ({serverTier === 'enterprise' ? 'Enterprise' : serverTier === 'mega_server' ? 'Mega-Server' : 'Community'}):
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
                    : `Claim This ROI for ${serverTier === 'enterprise' ? 'Enterprise ($199/mo)' : 'Community ($29/mo)'}`
                  }
                </span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRICING TIER MATRIX: COMMERCIALLY PACKAGED FOR HIGH SALES */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> 14-Day Pro Trial Active
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-slate-400 text-base max-w-xl mx-auto font-sans">
            Choose the subscription tier that matches your community's active player count. Every Pro tier includes an instant 14-day zero-risk trial.
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
              <p className="text-slate-400 text-sm mb-6 leading-relaxed font-sans">
                Ideal for upstart 32–64 slot FiveM roleplay communities looking to automate applicant screening and eliminate manual staff review backlogs.
              </p>

              <div className="space-y-3 pt-6 border-t border-slate-800/80 text-sm">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Up to <strong>250 applications / month</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>AI Backstory & Lore Rule Grader (Gemini 3.7)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Automated Discord Role Assignment</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Full QBCore/ESX Lua Config Generator</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Standard Subdomain (<code className="text-cyan-300 text-xs">slug.viceintel.app</code>)</span>
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
          <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-rose-500/80 shadow-[0_0_40px_rgba(244,63,94,0.25)] flex flex-col justify-between relative scale-105 z-10">
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
              <p className="text-slate-300 text-sm mb-6 leading-relaxed font-sans">
                Full-scale automation for 128–2048 slot mega-servers with custom domains, deep lore grading, priority directory ranking, and the complete Server Growth Suite.
              </p>

              <div className="space-y-3.5 pt-6 border-t border-slate-800 text-sm">
                <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span><strong>Unlimited</strong> player applications / month</span>
                </div>
                <div className="flex items-center gap-2.5 text-emerald-300 font-bold bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>1-Click Custom Domain + Auto TLS</strong> (<code className="text-xs">apply.yourcity.com</code>)</span>
                </div>
                <div className="flex items-center gap-2.5 text-purple-300 font-bold bg-purple-950/40 p-2 rounded-lg border border-purple-500/30">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span><strong>Full Server Growth Suite</strong> (Streamer CRM, 9:16 Shorts Studio & Referral Quests)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>AI Deep Lore & Rule Violation Audits (Gemini 3.7)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span><strong>#1 Priority Directory Ranking</strong> with Gold Badge</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Dedicated 1-on-1 Discord Bot Provisioning</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenPaymentModal('trial')}
              className="mt-8 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm tracking-wide transition-all shadow-xl shadow-rose-600/30 hover:shadow-rose-600/50 border border-rose-400/40 flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <Sparkles className="w-4.5 h-4.5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap sm:whitespace-normal text-center">Start 14-Day Free Pro Pass ($49/mo)</span>
              <ArrowRight className="w-4.5 h-4.5 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Tier 3: Enterprise Multi-Server ($199/mo) */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between relative">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Enterprise Multi-Server Network</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-white">$199</span>
                <span className="text-slate-400 text-sm font-medium">/ month</span>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed font-sans">
                Tailored for multi-server gaming networks running up to 5 connected FiveM cities with cross-server staff and player ban synchronization.
              </p>

              <div className="space-y-3 pt-6 border-t border-slate-800/80 text-sm">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Up to <strong>5 Linked Server Communities</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Multi-Domain Routing for all 5 Hubs</span>
                </div>
                <div className="flex items-center gap-2.5 text-purple-300 font-bold bg-purple-950/30 p-2 rounded-lg border border-purple-500/30">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>Multi-Server Growth Suite</strong> & Cross-Network Analytics</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Cross-Server Unified Whitelist Database</span>
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
              <span>Deploy Network ($199/mo)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. REAL COMMUNITY CASE STUDIES & TESTIMONIALS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-900">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Proven Track Record
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Loved by Leading Community Directors</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mt-1">Real results from server owners who eliminated their application backlog.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 text-xs gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                "We cut our whitelist wait time from 4 days down to 45 seconds. Our active player queue tripled within the first two weeks of switching."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">MN</div>
              <div>
                <div className="font-bold text-white text-xs">Miami Nights RP</div>
                <div className="text-[11px] text-slate-500">256-Slot FiveM Community</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 text-xs gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                "Our staff used to burn out reading 500 Google Forms every month. Now the Gemini AI filters out low-effort applicants automatically, leaving us time to actually host roleplay events."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-300 font-bold flex items-center justify-center text-xs">LS</div>
              <div>
                <div className="font-bold text-white text-xs">Leonida State Stories</div>
                <div className="text-[11px] text-slate-500">128-Slot Serious RP</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex text-amber-400 text-xs gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                "Connecting our custom domain took 60 seconds. Our members immediately noticed how much more professional our server felt compared to other cities."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">VP</div>
              <div>
                <div className="font-bold text-white text-xs">Vice Port Syndicate</div>
                <div className="text-[11px] text-slate-500">64-Slot Custom Framework</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. FREQUENTLY ASKED QUESTIONS (OBJECTION DESTROYER) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Everything You Need To Know
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "How does the 14-day free trial work?",
              a: "When you select the Mega-Server Pro Pass, you get instant full access for 14 days with zero commitment ($0 today). You can invite your players, connect your domain, and test the AI grader. If you decide not to continue, you can cancel in 1 click in your billing dashboard before the trial ends without being charged."
            },
            {
              q: "Do I need any coding knowledge to set this up?",
              a: "None at all! The whitelist portal, application questions, Discord bot role sync, and custom domain connection are completely no-code. You can configure everything through a clean, visual interface in under 5 minutes."
            },
            {
              q: "Can I use my own custom domain (e.g. apply.mycityrp.com)?",
              a: "Yes! Mega-Server and Enterprise tiers include automated 1-click custom domain routing. You simply create a CNAME record pointing to cname.viceintel.app at your domain registrar, and our edge network automatically provisions and renews your free Let's Encrypt TLS certificate."
            },
            {
              q: "How does the AI grade character backstories?",
              a: "Our engine uses Gemini 3.7 Flash trained on standard serious roleplay rules. It evaluates word count, lore coherence, realistic character vulnerabilities, and strictly flags powergaming, metagaming, or FearRP violations. Your staff still retains full override authority to manually approve or reject any applicant."
            },
            {
              q: "Does this integrate directly with Discord?",
              a: "Yes. When an applicant is approved (either by AI or by your staff), our edge bot syncs with your Discord guild in under 350ms, assigns the configured role (e.g. 'Whitelisted Citizen'), and sends the user a direct message with your FiveM connection command."
            },
            {
              q: "Is it compatible with QBCore, ESX, and custom C# frameworks?",
              a: "100% compatible. Because our system operates via webhook events and lightweight Lua export hooks, it works flawlessly across QBCore, ESX Legacy, and custom standalone frameworks."
            }
          ].map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <span className="font-bold text-white text-sm sm:text-base">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans border-t border-slate-800/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 8. FINAL CLOSING CONVERSION CTA BANNER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative rounded-3xl bg-gradient-to-r from-rose-950/60 via-purple-950/40 to-cyan-950/60 border border-rose-500/40 p-8 sm:p-14 text-center overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider border border-rose-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Start Automating In 2 Minutes
            </span>

            <h2 className="text-3xl sm:text-5xl font-black text-white max-w-2xl mx-auto">
              Ready To Fill Your Server's Queue On Autopilot?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Join over 120+ FiveM & GTA RP communities saving 90% of their staff time while offering players an instant, professional onboarding experience.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => handleOpenPaymentModal('trial')}
                className="px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm sm:text-base shadow-2xl shadow-rose-600/40 hover:shadow-rose-600/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 border border-rose-400/50"
              >
                <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                <span>Claim 14-Day Free Pro Pass ($0 Today)</span>
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-center gap-4 pt-2">
              <span>✓ No commitment</span>
              <span>✓ Cancel anytime</span>
              <span>✓ 2-minute setup</span>
            </div>
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
