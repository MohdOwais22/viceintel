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
  Globe,
  Radio,
  Copy,
  ExternalLink,
  Flame,
  Activity,
  FileSpreadsheet,
  Building,
  Award,
  Shield,
  Siren,
  Stethoscope,
  Key,
  Compass,
  Laptop,
  RefreshCw,
  Wand2
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
  // Active Interactive Preview Studio Tab
  const [activeStudioTab, setActiveStudioTab] = useState<'mdt' | 'whitelist' | 'domain' | 'lua' | 'ondemand'>('mdt');
  
  // MDT Interactive Simulator State
  const [mdtMode, setMdtMode] = useState<'police' | 'ems'>('police');
  const [mdtSearchQuery, setMdtSearchQuery] = useState<string>('Lucia Caminos');
  const [mdtActiveRecord, setMdtActiveRecord] = useState({
    name: 'Lucia Caminos',
    citizenId: 'CIT-892401',
    dob: '1998-04-12',
    licenses: ['Driver (Valid)', 'Concealed Carry (Revoked)', 'Commercial Pilot (Valid)'],
    warrants: 1,
    priors: [
      { charge: 'Grand Theft Auto - Class A', date: '2026-06-14', fine: '$12,500', sentence: '45 Months', officer: 'Officer Ramirez #402' },
      { charge: 'Evading Police in High-Performance Vessel', date: '2026-08-02', fine: '$8,000', sentence: '20 Months', officer: 'Sgt. Callahan #108' }
    ],
    vehicles: [
      { plate: '66VIC401', model: 'Grotti Cheetah Classic', color: 'Vice Pink / White', status: 'Impounded' },
      { plate: '99LEO772', model: 'Bravado Buffalo STX', color: 'Matte Obsidian', status: 'Clean' }
    ],
    medicalNotes: 'Blood Type: O-. Allergy to Penicillin. Recent gunshot trauma stabilized at Ocean Drive General.'
  });

  // Custom Domain Live Simulator State
  const [customDomainInput, setCustomDomainInput] = useState<string>('portal.miamividarp.com');
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
    }, 900);
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
      {/* 1. TOP HERO BANNER & NEXT-GEN PROMISE */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-16 pb-20">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:28px_28px]"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-rose-500/15 via-purple-500/15 to-cyan-500/15 blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Top Platform Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              FiveM 2.0 & GTA VI RP Ready
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Full CAD / MDT Suite Included
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Automated Custom Domains & SSL
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-tight sm:leading-none">
            The All-In-One SaaS Engine <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-rose-400 to-amber-300">
              For Elite GTA RP Communities
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-sans">
            Replace 5 separate paid subscriptions. Experience <strong>No-Code Whitelist Screening</strong> with Gemini AI lore audits, instant <strong>Police & Hospital MDT/CAD</strong>, live <strong>Discord Bot Role Sync</strong>, and <strong>Custom Domain Mapping</strong>.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => handleOpenPaymentModal('trial')}
              className="px-7 sm:px-9 py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm sm:text-base shadow-xl shadow-rose-600/30 hover:shadow-rose-600/50 transition-all flex items-center justify-center gap-2.5 group cursor-pointer border border-rose-400/40 shrink-0 transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">Start 14-Day Free Pro Pass ($0 Today)</span>
              <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const elem = document.getElementById('comparison-matrix-section');
                elem?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 sm:px-8 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-cyan-500 text-slate-200 font-extrabold text-sm sm:text-base hover:bg-slate-800 transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
            >
              <Award className="w-5 h-5 text-cyan-400 shrink-0" />
              <span className="whitespace-nowrap">Explore Full Platform Comparison</span>
            </button>
          </div>

          {/* Social Proof Stats Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400">94%</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Staff Review Time Saved</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-rose-400">&lt; 350ms</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">Discord Role Sync Speed</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">0 Setup Code</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">1-Click Custom Domains</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">5-in-1</div>
              <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">CAD + MDT + Whitelist + Lua</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE LIVE PLATFORM STUDIO (SANDBOX SIMULATOR) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Laptop className="w-3.5 h-3.5" /> Interactive Sandbox Preview
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Experience The Power Before You Buy</h2>
          <p className="mt-2 text-slate-400 text-base max-w-2xl mx-auto font-sans">
            Test-drive the exact high-framerate interface your players and staff will use in-game and on web.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-8 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveStudioTab('mdt')}
            className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeStudioTab === 'mdt'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Siren className="w-4 h-4" />
            <span>Police & EMS MDT</span>
          </button>
          <button
            onClick={() => setActiveStudioTab('whitelist')}
            className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
            className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeStudioTab === 'domain'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Custom Domain Engine</span>
          </button>
          <button
            onClick={() => setActiveStudioTab('lua')}
            className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
            className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
          
          {/* TAB 1: POLICE & EMS CAD / MDT */}
          {activeStudioTab === 'mdt' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${mdtMode === 'police' ? 'bg-blue-950/80 border-blue-500/40 text-blue-400' : 'bg-red-950/80 border-red-500/40 text-red-400'}`}>
                    {mdtMode === 'police' ? <Siren className="w-6 h-6 animate-pulse" /> : <Stethoscope className="w-6 h-6 animate-pulse" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                      <span>{mdtMode === 'police' ? 'Vice City Police Department (VCPD) MDT' : 'Ocean Drive General Hospital EMS Terminal'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">LIVE DISPATCH ONLINE</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time citizen record lookup, active warrants, DMV vehicle registration & hospital triage.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setMdtMode('police')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mdtMode === 'police' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    VCPD Police MDT
                  </button>
                  <button
                    onClick={() => setMdtMode('ems')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mdtMode === 'ems' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    EMS Hospital CAD
                  </button>
                </div>
              </div>

              {/* MDT Record Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Profile Overview */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                      LC
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-white">{mdtActiveRecord.name}</div>
                      <div className="text-xs text-cyan-400 font-mono">{mdtActiveRecord.citizenId}</div>
                      <div className="text-[11px] text-slate-400">DOB: {mdtActiveRecord.dob}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Licenses Status</div>
                    <div className="flex flex-wrap gap-1.5">
                      {mdtActiveRecord.licenses.map((lic, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold ${lic.includes('Revoked') ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'}`}>
                          {lic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {mdtMode === 'police' && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-rose-300">
                        <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Active Felony Warrant</span>
                        <span className="font-mono text-rose-400">#W-8802</span>
                      </div>
                      <p className="text-[11px] text-slate-300">Armed Bank Robbery & Hostage Taking at Little Haiti Vault. Armed & dangerous.</p>
                    </div>
                  )}

                  {mdtMode === 'ems' && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs space-y-1">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Activity className="w-4 h-4" /> Medical Triage Dossier
                      </div>
                      <p className="text-[11px] text-slate-300">{mdtActiveRecord.medicalNotes}</p>
                    </div>
                  )}
                </div>

                {/* Prior Offenses & Registered Vehicles */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Criminal History & Incident Reports</span>
                      <span className="text-[11px] text-rose-400 font-mono font-bold">2 Prior Convictions</span>
                    </div>
                    <div className="space-y-2">
                      {mdtActiveRecord.priors.map((pr, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="font-bold text-white">{pr.charge}</div>
                            <div className="text-[11px] text-slate-400">{pr.date} • Arresting: {pr.officer}</div>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-auto font-mono">
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">{pr.fine}</span>
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">{pr.sentence}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Registered DMV Vehicles</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mdtActiveRecord.vehicles.map((vh, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">{vh.model}</div>
                            <div className="text-[11px] text-slate-400">{vh.color}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-cyan-400 font-bold">{vh.plate}</span>
                            <div className={`text-[10px] font-bold ${vh.status === 'Impounded' ? 'text-rose-400' : 'text-emerald-400'}`}>{vh.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI WHITELIST BUILDER */}
          {activeStudioTab === 'whitelist' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <span>No-Code Dynamic Application Portal & AI Lore Auditor</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">GEMINI 3.7 FLASH</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Custom questions, character backstory word counters & automatic powergaming detection.</p>
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
                      Score: 96 / 100 (Pass)
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

          {/* TAB 3: CUSTOM DOMAIN ENGINE */}
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
                  <span>Mega-Server ($49/mo) & Enterprise ($199/mo) Tier Feature</span>
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
                          placeholder="portal.yourserver.com"
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
                          className="text-slate-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800"
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
                        <span className="font-mono text-white font-bold">{customDomainInput || 'portal.miamividarp.com'}</span>
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">REAL-TIME SYNCED TO CONTROL PANEL</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Need a custom Lua script, Discord bot integration, CAD/MDT module, or custom website feature? Request it directly from your server owner dashboard.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span>1. Submit Feature Request</span>
                  </div>
                  <p className="text-xs text-slate-300">Specify feature category (Script, Bot, CAD/MDT, Web), priority, and detailed specifications directly from your dashboard tab.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                  <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                    <span>2. Real-Time Staff Sync</span>
                  </div>
                  <p className="text-xs text-slate-300">Requests sync instantly via secure cloud database to ViceIntel Control Panel for staff review, cost estimation, and milestone planning.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>3. Delivery & Activation</span>
                  </div>
                  <p className="text-xs text-slate-300">Track real-time status updates (Under Review &rarr; In Development &rarr; Deployed) with direct developer notes and deployment updates.</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3. HEAD-TO-HEAD COMPARISON MATRIX (THE "CLEAR WINNER" PROOF) */}
      <div id="comparison-matrix-section" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 scroll-mt-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Award className="w-3.5 h-3.5" /> Architecture & Feature Comparison
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">Why Modern Communities Choose ViceIntel</h2>
          <p className="mt-3 text-slate-400 text-base max-w-2xl mx-auto font-sans">
            Compare our unified, all-in-one suite against traditional fragmented server tools and manual review workflows.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90 text-xs uppercase tracking-wider">
                <th className="py-5 px-6 font-extrabold text-slate-300">Capability / Feature</th>
                <th className="py-5 px-6 font-black text-rose-400 bg-rose-950/30 border-x border-rose-500/30 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>ViceIntel Server Suite</span>
                  </div>
                </th>
                <th className="py-5 px-6 font-bold text-slate-400 text-center">Standard RP Panels</th>
                <th className="py-5 px-6 font-bold text-slate-400 text-center">Legacy CAD Systems</th>
                <th className="py-5 px-6 font-bold text-slate-400 text-center">Manual Google Forms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              
              {/* Feature 1 */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-4 px-6 font-bold text-white">
                  Gemini AI Lore & Powergaming Backstory Grader
                  <span className="block text-[11px] text-slate-400 font-normal mt-0.5">Analyzes character backstories vs. server rules & flags rulebreaks</span>
                </td>
                <td className="py-4 px-6 text-center font-bold text-emerald-400 bg-rose-950/20 border-x border-rose-500/30">
                  <div className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> Included (Gemini 3.7)</div>
                </td>
                <td className="py-4 px-6 text-center text-slate-500 font-medium">Basic Rule Gen Only</td>
                <td className="py-4 px-6 text-center text-slate-500 font-medium">❌ None</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ 100% Manual Reading</td>
              </tr>

              {/* Feature 2 */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-4 px-6 font-bold text-white">
                  Full Police & Hospital EMS CAD / MDT Suite
                  <span className="block text-[11px] text-slate-400 font-normal mt-0.5">Warrants, citations, vehicle impounds & medical triage in 1 tab</span>
                </td>
                <td className="py-4 px-6 text-center font-bold text-emerald-400 bg-rose-950/20 border-x border-rose-500/30">
                  <div className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> Included in Pro Tier</div>
                </td>
                <td className="py-4 px-6 text-center text-emerald-400 font-medium">✓ Included</td>
                <td className="py-4 px-6 text-center text-emerald-400 font-medium">✓ Included ($19–$39/mo extra)</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None</td>
              </tr>

              {/* Feature 3 */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-4 px-6 font-bold text-white">
                  Automated Custom Domain + Auto-Renewing SSL
                  <span className="block text-[11px] text-slate-400 font-normal mt-0.5">e.g. portal.yourcity.com or apply.yourcity.com</span>
                </td>
                <td className="py-4 px-6 text-center font-bold text-emerald-400 bg-rose-950/20 border-x border-rose-500/30">
                  <div className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> Mega-Server &amp; Enterprise</div>
                </td>
                <td className="py-4 px-6 text-center text-amber-400 font-medium">Manual Setup Required</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ Extra Add-on Fee</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ Impossible (docs.google.com)</td>
              </tr>

              {/* Feature 4 */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-4 px-6 font-bold text-white">
                  Real-Time Discord Bot Role Sync
                  <span className="block text-[11px] text-slate-400 font-normal mt-0.5">Instant role assignment & applicant DM notification upon approval</span>
                </td>
                <td className="py-4 px-6 text-center font-bold text-emerald-400 bg-rose-950/20 border-x border-rose-500/30">
                  <div className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> &lt; 350ms Sync</div>
                </td>
                <td className="py-4 px-6 text-center text-emerald-400 font-medium">✓ Webhooks Only</td>
                <td className="py-4 px-6 text-center text-emerald-400 font-medium">✓ Plugin Required</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None (Manual Invite)</td>
              </tr>

              {/* Feature 5 */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-4 px-6 font-bold text-white">
                  FiveM QBCore / ESX Ready-to-Run Lua Bundles
                  <span className="block text-[11px] text-slate-400 font-normal mt-0.5">No-code economy configs, job tables, and handling.meta ZIP presets</span>
                </td>
                <td className="py-4 px-6 text-center font-bold text-emerald-400 bg-rose-950/20 border-x border-rose-500/30">
                  <div className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> Instant Preset Export</div>
                </td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None</td>
              </tr>

              {/* Feature 6 */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-4 px-6 font-bold text-white">
                  Server Growth & Streamer CRM Suite
                  <span className="block text-[11px] text-slate-400 font-normal mt-0.5">Twitch/Kick streamer outreach CRM & 9:16 viral TikTok script studio</span>
                </td>
                <td className="py-4 px-6 text-center font-bold text-emerald-400 bg-rose-950/20 border-x border-rose-500/30">
                  <div className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> Included Free</div>
                </td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None</td>
              </tr>

              {/* Feature 7 */}
              <tr className="hover:bg-slate-800/30 transition">
                <td className="py-4 px-6 font-bold text-white">
                  On-Demand Custom Feature Application Engine
                  <span className="block text-[11px] text-slate-400 font-normal mt-0.5">Direct 1-on-1 custom feature requests (custom scripts, CAD modules, bots) synced to Control Panel</span>
                </td>
                <td className="py-4 px-6 text-center font-bold text-emerald-400 bg-rose-950/20 border-x border-rose-500/30">
                  <div className="inline-flex items-center gap-1"><Check className="w-4 h-4 text-emerald-400" /> Real-Time Synced</div>
                </td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ Custom Dev Fees ($500+)</td>
                <td className="py-4 px-6 text-center text-rose-500 font-medium">❌ None</td>
              </tr>

              {/* Pricing Row */}
              <tr className="bg-slate-950 font-bold border-t-2 border-slate-800">
                <td className="py-5 px-6 text-white text-sm">Monthly Total Cost For All Modules</td>
                <td className="py-5 px-6 text-center font-black text-emerald-400 text-sm bg-rose-950/30 border-x border-rose-500/30">
                  $29 – $49 / mo <br />
                  <span className="text-[10px] text-amber-300 font-semibold font-sans">(14-Day Free Pass)</span>
                </td>
                <td className="py-5 px-6 text-center text-slate-300 text-sm">$35 – $70 / mo</td>
                <td className="py-5 px-6 text-center text-slate-300 text-sm">$49 – $120+ / mo</td>
                <td className="py-5 px-6 text-center text-rose-400 text-sm">Free (High Staff Wage Cost)</td>
              </tr>

            </tbody>
          </table>
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
              <p className="text-slate-400 text-sm mt-1">See how much staff time and labor cost you save with automated screening.</p>
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

      {/* 5. PRICING TIER MATRIX */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> 14-Day Pro Trial Active
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Transparent Commercial Pricing</h2>
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
                Ideal for growing 32–64 slot FiveM roleplay servers looking to automate applicant screening, CAD records, and economy balance.
              </p>

              <div className="space-y-3 pt-6 border-t border-slate-800/80 text-sm">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Up to <strong>250 applications / month</strong></span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Police & EMS Hospital MDT Terminal</span>
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
              <p className="text-slate-300 text-sm mb-6 leading-relaxed font-sans">
                Full-scale automation for 128–2048 slot mega-servers with custom domains, full CAD/MDT, deep lore grading, priority directory ranking & Server Growth Suite.
              </p>

              <div className="space-y-3.5 pt-6 border-t border-slate-800 text-sm">
                <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span><strong>Unlimited</strong> player applications / month</span>
                </div>
                <div className="flex items-center gap-2.5 text-emerald-300 font-bold bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30">
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>1-Click Custom Domain + Auto TLS</strong> (`apply.yourserver.com`)</span>
                </div>
                <div className="flex items-center gap-2.5 text-purple-300 font-bold bg-purple-950/40 p-2 rounded-lg border border-purple-500/30">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span><strong>Full Server Growth Suite</strong> (Streamer CRM, 9:16 Shorts Studio & Referral Quests)</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Police & EMS Hospital MDT with Live Dispatch</span>
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
              className="mt-8 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm tracking-wide transition-all shadow-xl shadow-rose-600/25 hover:shadow-rose-600/40 border border-rose-400/30 flex items-center justify-center gap-2.5 cursor-pointer group"
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
                Tailored for multi-server gaming networks running up to 5 connected FiveM cities with cross-server staff synchronization.
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
              <span>Deploy Network ($199/mo)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. ONBOARDING STEPS VISUALIZER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Up & Running in Under 5 Minutes</h2>
          <p className="mt-2 text-slate-400 text-sm font-sans">Simple self-serve onboarding that doesn't require developer skills.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-black text-sm flex items-center justify-center mx-auto mb-3">1</div>
            <h4 className="font-bold text-white text-sm mb-1">Select Subscription</h4>
            <p className="text-xs text-slate-400">Choose Community ($29), Mega-Server ($49), or Enterprise ($199) on Stripe checkout.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 font-black text-sm flex items-center justify-center mx-auto mb-3">2</div>
            <h4 className="font-bold text-white text-sm mb-1">Link Discord Guild</h4>
            <p className="text-xs text-slate-400">Invite our verified bot and link your server's Whitelisted Role ID.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center mx-auto mb-3">3</div>
            <h4 className="font-bold text-white text-sm mb-1">Set Custom Domain</h4>
            <p className="text-xs text-slate-400">Connect `portal.yourcity.com` with our automated 1-click CNAME proxy.</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center mx-auto mb-3">4</div>
            <h4 className="font-bold text-white text-sm mb-1">Go Live</h4>
            <p className="text-xs text-slate-400">Open your CAD/MDT and whitelist portal to players across the globe.</p>
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

