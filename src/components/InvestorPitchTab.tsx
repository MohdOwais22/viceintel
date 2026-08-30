import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Zap,
  Target,
  Building2,
  PieChart,
  ShieldCheck,
  Award,
  ArrowRight,
  FileText,
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  Sliders,
  Database,
  Radio,
  Lock,
  Globe,
  ChevronRight,
  MessageSquare,
  Phone,
  Clock,
  HelpCircle,
  Printer,
  Download,
  BarChart3,
  Layers,
  Server,
  Activity,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ActiveTab } from '../types';
import { ENV } from '../lib/envConfig';
import { generateInvestorPitchPdf } from '../lib/pdfGenerator';

interface InvestorPitchTabProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const InvestorPitchTab: React.FC<InvestorPitchTabProps> = ({ onNavigate }) => {
  // Interactive Valuation & Financial Projection Simulator State
  const [projectedMau, setProjectedMau] = useState<number>(250000);
  const [vipConversionRate, setVipConversionRate] = useState<number>(2.5); // %
  const [sponsoredServersCount, setSponsoredServersCount] = useState<number>(120);
  
  // Quick Investor Inquiry Modal state
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [investorName, setInvestorName] = useState<string>('');
  const [investorEmail, setInvestorEmail] = useState<string>('');
  const [investorFirm, setInvestorFirm] = useState<string>('');
  const [investorType, setInvestorType] = useState<string>('Angel Investor');
  const [inquirySubmitted, setInquirySubmitted] = useState<boolean>(false);

  // PDF Export Loading State
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Dedicated Embedded Contact Us Form State
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactFirm, setContactFirm] = useState<string>('');
  const [contactRole, setContactRole] = useState<string>('Venture Capitalist (VC)');
  const [contactInterest, setContactInterest] = useState<string>('Series Seed Term Sheet / Participation');
  const [contactCheckSize, setContactCheckSize] = useState<string>('$50,000 - $250,000');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [requestNda, setRequestNda] = useState<boolean>(true);
  const [inlineSubmitting, setInlineSubmitting] = useState<boolean>(false);
  const [inlineSubmitted, setInlineSubmitted] = useState<boolean>(false);
  const [submittedRefId, setSubmittedRefId] = useState<string>('');

  // Financial Calculations
  const vipPrice = parseFloat(String(ENV.VIP_PRICE ?? '3.99'));
  const serverSponsorPrice = parseFloat(String(ENV.B2B_SPONSOR_PRICE ?? '49.00'));

  const projectedVipSubscribers = Math.round((projectedMau * vipConversionRate) / 100);
  const b2cMonthlyRevenue = projectedVipSubscribers * vipPrice;
  const b2bMonthlyRevenue = sponsoredServersCount * serverSponsorPrice;
  const estimatedAdRevenue = (projectedMau / 1000) * 1.50; // $1.50 RPM estimate
  const totalMrr = b2cMonthlyRevenue + b2bMonthlyRevenue + estimatedAdRevenue;
  const totalArr = totalMrr * 12;

  // Chart Metric View Selector State
  const [chartMetricView, setChartMetricView] = useState<'mrr_and_mau' | 'revenue_breakdown' | 'user_conversion'>('mrr_and_mau');

  // Dynamic 24-Month Financial & User Growth Projection Data for Recharts
  const chartData24Months = useMemo(() => {
    const data = [];
    for (let m = 1; m <= 24; m++) {
      // S-Curve adoption progression towards target inputs
      const ratio = Math.pow(m / 24, 1.25);
      const mauVal = Math.max(2500, Math.round(projectedMau * (0.04 + ratio * 0.96)));
      const vipVal = Math.round((mauVal * vipConversionRate) / 100);
      const b2bVal = Math.max(2, Math.round(sponsoredServersCount * (0.05 + ratio * 0.95)));

      const b2cRev = Math.round(vipVal * vipPrice);
      const b2bRev = Math.round(b2bVal * serverSponsorPrice);
      const adYield = Math.round((mauVal / 1000) * 1.50);
      const totalMrrVal = b2cRev + b2bRev + adYield;

      data.push({
        monthKey: `M${m}`,
        monthLabel: m === 1 ? 'M1 (Beta)' : m === 3 ? 'M3 (GTA VI Release)' : m === 6 ? 'M6 (Expansion)' : m === 12 ? 'M12 (PC Edition & DLC)' : m === 24 ? 'M24 (Scale)' : `M${m}`,
        rawMonth: m,
        mau: mauVal,
        vipUsers: vipVal,
        b2bServers: b2bVal,
        mrr: totalMrrVal,
        arr: totalMrrVal * 12,
        b2cRev,
        b2bRev,
        adYield
      });
    }
    return data;
  }, [projectedMau, vipConversionRate, sponsoredServersCount, vipPrice, serverSponsorPrice]);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitted(true);
    setTimeout(() => {
      setInquirySubmitted(false);
      setShowInquiryModal(false);
      setInvestorName('');
      setInvestorEmail('');
      setInvestorFirm('');
    }, 3000);
  };

  const handleInlineContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInlineSubmitting(true);
    const generatedRefId = `IR-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    setTimeout(() => {
      setInlineSubmitting(false);
      setInlineSubmitted(true);
      setSubmittedRefId(generatedRefId);
    }, 1000);
  };

  const scrollToContactForm = () => {
    const el = document.getElementById('investor-contact-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    setTimeout(() => {
      try {
        generateInvestorPitchPdf({
          appName: ENV.APP_NAME || 'ViceIntel',
          projectedMau,
          vipConversionRate,
          sponsoredServersCount,
          totalMrr,
          totalArr,
          vipPrice,
          serverSponsorPrice
        });
      } catch (err) {
        console.error('PDF generation error, falling back to window.print():', err);
        window.print();
      } finally {
        setIsExportingPdf(false);
      }
    }, 150);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12 space-y-12 animate-fade-in text-zinc-100 font-sans printable-paper">
      {/* PRINT-ONLY EXECUTIVE MEMORANDUM HEADER */}
      <div className="print-report-header text-left border-b-2 border-zinc-900 pb-4 mb-6 hidden print:block">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">
              {ENV.APP_NAME || 'ViceIntel'} — Executive Investor Memorandum
            </h1>
            <p className="text-xs text-zinc-700 font-mono mt-0.5">
              Series Seed Growth Deck & Unit Economics Projections
            </p>
          </div>
          <div className="text-right text-[11px] text-zinc-600 font-mono">
            <p className="font-bold text-rose-700">CONFIDENTIAL & PROPRIETARY</p>
            <p>Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* EXECUTIVE HERO DECK HEADER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-rose-950/40 border border-rose-500/30 p-8 lg:p-12 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none no-print" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none no-print" />
        
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-2 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" /> Executive Growth Deck
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> $8.4B+ Addressable Market
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Series Seed Confidential
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Monetizing the <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">GTA VI Ecosystem</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-sans max-w-3xl">
            <strong>{ENV.APP_NAME || 'ViceIntel'}</strong> is building the definitive enterprise fan companion & community infrastructure platform for Grand Theft Auto VI. Combining real-time physics telemetry, automated RP server onboarding, low-latency squad voice comms, and autonomous AI pSEO distribution.
          </p>

          <div className="pt-4 flex flex-wrap gap-4 items-center no-print">
            <button
              onClick={scrollToContactForm}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-rose-600/30 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Investor Relations Team</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xl shadow-amber-600/20 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                  <span>Generating Pitch Deck PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export Pitch Deck (PDF)</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('unit-economics');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <PieChart className="w-4 h-4 text-cyan-400" />
              <span>Explore Unit Economics</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE FINANCIAL & METRICS STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-3 shadow-xl hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400">Total TAM</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">$8.4B+</p>
          <p className="text-xs text-zinc-400">Estimated GTA VI Launch & Creator Economy Market Size.</p>
        </div>

        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-3 shadow-xl hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">Addressable Audience</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">150M+</p>
          <p className="text-xs text-zinc-400">Active gamers across PS5, Xbox Series X/S, PC & FiveM/AltV roleplay.</p>
        </div>

        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-3 shadow-xl hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">Efficiency Yield</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">95%</p>
          <p className="text-xs text-zinc-400">Time saved for RP server owners using automated Discord OAuth & AI lore scoring.</p>
        </div>

        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-3 shadow-xl hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">Revenue Engines</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white">4 Pillars</p>
          <p className="text-xs text-zinc-400">B2C Passes ($3.99), B2B Server Spotlights ($49.00), pSEO Ads & White-labeling.</p>
        </div>
      </div>

      {/* THE INVESTMENT THESIS & CORE VALUE DRIVERS */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">Market Thesis</span>
            <h2 className="text-2xl font-black text-white tracking-tight mt-1">
              Why Invest in ViceIntel Now?
            </h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-md">
            Grand Theft Auto VI is projected to break all entertainment revenue records. ViceIntel captures this traffic spike with proprietary utility software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 space-y-4 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">1. High-Margin B2C & B2B Dual Engine</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                We combine recurring $3.99/mo individual player VIP subscriptions (ad-free UI, custom profile badges, annual GamerTag protection) with $49.00/mo enterprise B2B RP server spotlight packages.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">Gross Margins</span>
              <span className="text-emerald-400 font-bold">~88% Estimated</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 space-y-4 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">2. Proprietary Physics & Comms Tech</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Our 3D <code className="text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded font-mono">handling.meta</code> physics simulator and low-latency WebRTC squad comms create high user retention and strong network effects across RP server communities.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">User Retention</span>
              <span className="text-cyan-400 font-bold">Daily Active Habits</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 space-y-4 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">3. Autonomous AI pSEO Traffic Engine</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Our automated midnight crawler leverages Gemini 3.7 Flash to crawl Rockstar Games Newswires and GTA VI leaks, automatically generating indexed high-intent keyword pages at zero manual content cost.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">Acquisition CAC</span>
              <span className="text-amber-400 font-bold">Near-Zero Organic CAC</span>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE FINANCIAL PROJECTION & UNIT ECONOMICS SIMULATOR */}
      <div id="unit-economics" className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-10 space-y-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Interactive Financial Model
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-rose-400" />
              <span>Unit Economics & Revenue Projection Simulator</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Adjust user traction, conversion rate, and server partnerships to simulate Monthly & Annual Recurring Revenue (MRR/ARR).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono text-xs font-bold">
              VIP: ${vipPrice}/mo | Server: ${serverSponsorPrice}/mo
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* SLIDERS COLUMN (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 bg-zinc-950/80 p-6 rounded-2xl border border-zinc-800/80">
            {/* Slider 1: MAU */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-300">Projected Monthly Active Users (MAU)</span>
                <span className="text-rose-400 font-mono text-sm">{projectedMau.toLocaleString()} Users</span>
              </div>
              <input
                type="range"
                min="10000"
                max="2000000"
                step="10000"
                value={projectedMau}
                onChange={(e) => setProjectedMau(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>10K (Launch)</span>
                <span>500K (Mid-scale)</span>
                <span>2M (Peak)</span>
              </div>
            </div>

            {/* Slider 2: VIP Conversion % */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-300">B2C VIP Pass Conversion Rate</span>
                <span className="text-amber-400 font-mono text-sm">{vipConversionRate}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={vipConversionRate}
                onChange={(e) => setVipConversionRate(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>0.5% Conservative</span>
                <span>2.5% Benchmark</span>
                <span>10% Optimized</span>
              </div>
            </div>

            {/* Slider 3: Sponsored RP Servers */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-300">B2B Sponsored RP Server Clients ($49/mo)</span>
                <span className="text-cyan-400 font-mono text-sm">{sponsoredServersCount} Servers</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={sponsoredServersCount}
                onChange={(e) => setSponsoredServersCount(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>10 Servers</span>
                <span>250 Servers</span>
                <span>1,000 Servers</span>
              </div>
            </div>
          </div>

          {/* SIMULATED REVENUE RESULTS CARDS (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-rose-500/40 space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400">
                Simulated Output
              </span>

              <div className="space-y-1">
                <p className="text-xs text-zinc-400">Monthly Recurring Revenue (MRR)</p>
                <p className="text-3xl sm:text-4xl font-black text-white font-mono">
                  ${Math.round(totalMrr).toLocaleString()}
                  <span className="text-xs text-zinc-400 font-sans font-normal ml-1">/mo</span>
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800 space-y-1">
                <p className="text-xs text-zinc-400">Annual Run-Rate (ARR)</p>
                <p className="text-2xl font-bold text-emerald-400 font-mono">
                  ${Math.round(totalArr).toLocaleString()}
                  <span className="text-xs text-zinc-400 font-sans font-normal ml-1">/yr</span>
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-zinc-300">
                  <span>B2C VIP Pass Subs ({projectedVipSubscribers.toLocaleString()}):</span>
                  <span className="font-mono text-rose-300 font-bold">${Math.round(b2cMonthlyRevenue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>B2B RP Server Sponsoring:</span>
                  <span className="font-mono text-cyan-300 font-bold">${Math.round(b2bMonthlyRevenue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>AdSense & Media Network Yield:</span>
                  <span className="font-mono text-amber-300 font-bold">${Math.round(estimatedAdRevenue).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECHARTS 24-MONTH TRAJECTORY VISUALIZER */}
        <div className="pt-8 border-t border-zinc-800/80 space-y-6">
          {/* EXECUTIVE METRICS SUMMARY CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: PROJECTED MRR */}
            <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-lg space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Projected MRR</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  ${Math.round(totalMrr).toLocaleString()}
                </div>
                <div className="flex items-center justify-between pt-1.5 text-xs">
                  <span className="text-zinc-400 font-mono text-[11px]">${Math.round(totalArr).toLocaleString()} ARR Run-Rate</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+18.4%</span>
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: ACTIVE SERVERS */}
            <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-lg space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Active Servers</span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Server className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {sponsoredServersCount.toLocaleString()}
                </div>
                <div className="flex items-center justify-between pt-1.5 text-xs">
                  <span className="text-zinc-400 font-mono text-[11px]">Sponsored RP Nodes</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    $49/mo Tier
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: TOTAL REGISTERED USERS */}
            <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-lg space-y-3 relative overflow-hidden group hover:border-rose-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Total Registered Users</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {projectedMau.toLocaleString()}
                </div>
                <div className="flex items-center justify-between pt-1.5 text-xs">
                  <span className="text-zinc-400 font-mono text-[11px]">{projectedVipSubscribers.toLocaleString()} Paying VIPs</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {vipConversionRate}% Conv.
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 4: MONTHLY GROWTH RATE */}
            <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-lg space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Monthly Growth Rate</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight flex items-center gap-1.5">
                  <span>+24.8%</span>
                  <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-1.5 text-xs">
                  <span className="text-zinc-400 font-mono text-[11px]">Compounded Organic</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    pSEO Spider
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> 24-Month Financial & User Growth Forecast
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                Projected Platform Trajectory (M1 – M24)
              </h3>
            </div>

            {/* CHART VIEW SELECTOR TOGGLES */}
            <div className="flex flex-wrap items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800/80 text-xs no-print">
              <button
                type="button"
                onClick={() => setChartMetricView('mrr_and_mau')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  chartMetricView === 'mrr_and_mau'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>MRR ($) vs MAU</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMetricView('revenue_breakdown')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  chartMetricView === 'revenue_breakdown'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>B2C vs B2B Revenue</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMetricView('user_conversion')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  chartMetricView === 'user_conversion'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>MAU vs VIP Users</span>
              </button>
            </div>
          </div>

          {/* RECHARTS CONTAINER */}
          <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-inner space-y-4">
            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData24Months} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="mauGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="b2cGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  
                  <XAxis
                    dataKey="monthKey"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 11 }}
                    tickLine={{ stroke: '#3f3f46' }}
                  />

                  {chartMetricView === 'mrr_and_mau' && (
                    <>
                      <YAxis
                        yAxisId="left"
                        stroke="#06b6d4"
                        tick={{ fill: '#06b6d4', fontSize: 11 }}
                        tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                        domain={[0, 'auto']}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#f43f5e"
                        tick={{ fill: '#f43f5e', fontSize: 11 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        domain={[0, 'auto']}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const dp = payload[0].payload;
                            return (
                              <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 shadow-2xl text-xs space-y-2 font-sans backdrop-blur-md">
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5 gap-4">
                                  <span className="font-mono font-bold text-rose-400">{dp.monthLabel}</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">Month {dp.rawMonth} / 24</span>
                                </div>
                                <div className="space-y-1 font-mono text-[11px]">
                                  <div className="flex justify-between gap-4 text-cyan-300">
                                    <span>Active Users (MAU):</span>
                                    <span className="font-bold">{dp.mau.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-rose-400">
                                    <span>Monthly MRR:</span>
                                    <span className="font-bold">${dp.mrr.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-emerald-400">
                                    <span>Annual Run-Rate:</span>
                                    <span className="font-bold">${dp.arr.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="mau"
                        name="Projected MAU"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        fill="url(#mauGradient)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="mrr"
                        name="Total MRR ($)"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        dot={{ r: 3, fill: '#f43f5e' }}
                        activeDot={{ r: 6 }}
                      />
                    </>
                  )}

                  {chartMetricView === 'revenue_breakdown' && (
                    <>
                      <YAxis
                        stroke="#f43f5e"
                        tick={{ fill: '#f43f5e', fontSize: 11 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const dp = payload[0].payload;
                            return (
                              <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 shadow-2xl text-xs space-y-2 font-sans backdrop-blur-md">
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5 gap-4">
                                  <span className="font-mono font-bold text-amber-400">{dp.monthLabel}</span>
                                  <span className="text-[10px] text-zinc-500 font-mono font-bold text-emerald-400">${dp.mrr.toLocaleString()}/mo</span>
                                </div>
                                <div className="space-y-1 font-mono text-[11px]">
                                  <div className="flex justify-between gap-4 text-amber-300">
                                    <span>B2C VIP Revenue:</span>
                                    <span className="font-bold">${dp.b2cRev.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-cyan-300">
                                    <span>B2B RP Server Sponsoring:</span>
                                    <span className="font-bold">${dp.b2bRev.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-rose-400">
                                    <span>pSEO Ad Network Yield:</span>
                                    <span className="font-bold">${dp.adYield.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="b2cRev"
                        name="B2C VIP Pass Rev ($)"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#b2cGradient)"
                      />
                      <Line
                        type="monotone"
                        dataKey="b2bRev"
                        name="B2B RP Server Rev ($)"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#06b6d4' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="mrr"
                        name="Total MRR ($)"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        dot={{ r: 3, fill: '#f43f5e' }}
                      />
                    </>
                  )}

                  {chartMetricView === 'user_conversion' && (
                    <>
                      <YAxis
                        yAxisId="left"
                        stroke="#06b6d4"
                        tick={{ fill: '#06b6d4', fontSize: 11 }}
                        tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#f59e0b"
                        tick={{ fill: '#f59e0b', fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const dp = payload[0].payload;
                            return (
                              <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 shadow-2xl text-xs space-y-2 font-sans backdrop-blur-md">
                                <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5 gap-4">
                                  <span className="font-mono font-bold text-cyan-400">{dp.monthLabel}</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">Conversion: {vipConversionRate}%</span>
                                </div>
                                <div className="space-y-1 font-mono text-[11px]">
                                  <div className="flex justify-between gap-4 text-cyan-300">
                                    <span>Monthly Active Users (MAU):</span>
                                    <span className="font-bold">{dp.mau.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-amber-300">
                                    <span>Paying VIP Subscribers:</span>
                                    <span className="font-bold">{dp.vipUsers.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-emerald-300">
                                    <span>Sponsored RP Servers:</span>
                                    <span className="font-bold">{dp.b2bServers}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="mau"
                        name="Platform MAU"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill="url(#mauGradient)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="vipUsers"
                        name="VIP Subscribers"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#f59e0b' }}
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* MILESTONE FOOTER BADGES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/80 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-0.5">
                <p className="text-zinc-500 text-[10px]">Month 1 (Beta & Infrastructure)</p>
                <p className="font-bold text-white">${chartData24Months[0]?.mrr.toLocaleString()}/mo</p>
                <p className="text-[10px] text-cyan-400">{chartData24Months[0]?.mau.toLocaleString()} MAU</p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/50 space-y-0.5 shadow-lg shadow-rose-950/50">
                <p className="text-rose-400 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  Month 3 (GTA VI Launch)
                </p>
                <p className="font-bold text-white">${chartData24Months[2]?.mrr.toLocaleString()}/mo</p>
                <p className="text-[10px] text-rose-300">{chartData24Months[2]?.mau.toLocaleString()} MAU</p>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-0.5">
                <p className="text-zinc-500 text-[10px]">Month 6 (Post-Launch DLC)</p>
                <p className="font-bold text-white">${chartData24Months[5]?.mrr.toLocaleString()}/mo</p>
                <p className="text-[10px] text-cyan-400">{chartData24Months[5]?.mau.toLocaleString()} MAU</p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-0.5">
                <p className="text-emerald-400 text-[10px] font-bold">Month 24 (Enterprise Scale)</p>
                <p className="font-bold text-white">${chartData24Months[23]?.mrr.toLocaleString()}/mo</p>
                <p className="text-[10px] text-emerald-300">${chartData24Months[23]?.arr.toLocaleString()}/yr</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPETITIVE MOAT COMPARISON MATRIX */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
        <div className="border-b border-zinc-800 pb-4">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">Competitive Landscape</span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1">
            Why ViceIntel Outpaces Legacy Gaming Media
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Feature & Infrastructure</th>
                <th className="py-3 px-4 text-zinc-500">Legacy Wiki & Reddit</th>
                <th className="py-3 px-4 text-zinc-500">Manual Discord Servers</th>
                <th className="py-3 px-4 text-rose-400 font-bold bg-rose-500/10 rounded-t-xl">ViceIntel Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              <tr>
                <td className="py-3 px-4 font-bold text-white">3D Handling & Physics Simulation</td>
                <td className="py-3 px-4 text-zinc-500">❌ Static text only</td>
                <td className="py-3 px-4 text-zinc-500">❌ None</td>
                <td className="py-3 px-4 text-emerald-400 font-bold bg-rose-500/5">✅ Real-time 3D XML Handling Engine</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">RP Server Whitelist Automation</td>
                <td className="py-3 px-4 text-zinc-500">❌ None</td>
                <td className="py-3 px-4 text-zinc-500">⚠️ Manual Google Forms (Delays)</td>
                <td className="py-3 px-4 text-emerald-400 font-bold bg-rose-500/5">✅ Automated Discord OAuth & AI Lore Scoring</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Squad Voice Comms</td>
                <td className="py-3 px-4 text-zinc-500">❌ External only</td>
                <td className="py-3 px-4 text-zinc-500">⚠️ Requires Discord App</td>
                <td className="py-3 px-4 text-emerald-400 font-bold bg-rose-500/5">✅ Built-in WebRTC & PiP Overlay</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Content Generation & Distribution</td>
                <td className="py-3 px-4 text-zinc-500">⚠️ Slow manual editorial</td>
                <td className="py-3 px-4 text-zinc-500">❌ Community noise</td>
                <td className="py-3 px-4 text-emerald-400 font-bold bg-rose-500/5">✅ Gemini 3.7 Flash pSEO Midnight Spider</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DEDICATED INLINE 'CONTACT US' INVESTOR & PARTNER FORM SECTION */}
      <div id="investor-contact-form" className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-rose-950/30 border border-zinc-800 rounded-3xl p-6 lg:p-10 space-y-8 shadow-2xl relative overflow-hidden scroll-mt-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6 relative z-10">
          <div>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-2 w-fit">
              <Mail className="w-3.5 h-3.5 text-rose-400" /> Executive Contact Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-3">
              Contact Investor Relations & Founding Team
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-2xl">
              Have questions regarding our Series Seed round, financial models, cap table, or enterprise partnerships? Submit your inquiry directly to our leadership team.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Response SLA: &lt; 12 Hours
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          {/* LEFT SIDE: CONTACT CARDS & INFRASTRUCTURE SLA */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-400" />
                <span>Direct Executive Channels</span>
              </h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Investor Email</p>
                    <p className="text-zinc-400 font-mono text-[11px]">ir@viceintel.app</p>
                    <p className="text-[10px] text-zinc-500">Monitored 24/7 by managing partners</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Confidentiality & NDA</p>
                    <p className="text-zinc-400 text-[11px]">Mutual NDAs executed automatically prior to cap table disclosure.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Primary Operating Hub</p>
                    <p className="text-zinc-400 text-[11px]">ViceIntel Inc. — Cloud Native & Remote First</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK FAQ MINI-CARD */}
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>Looking for technical documentation?</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                You can review our developer documentation, API blueprints, and Nginx deployment architecture at any time on our dedicated docs portal.
              </p>
              <button
                onClick={() => onNavigate('docs')}
                className="text-rose-400 hover:text-rose-300 font-bold text-[11px] flex items-center gap-1 pt-1 transition cursor-pointer"
              >
                <span>View Developer & Subdomain Docs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: INTERACTIVE CONTACT US FORM */}
          <div className="lg:col-span-7 bg-zinc-950/90 border border-zinc-800 p-6 sm:p-8 rounded-2xl shadow-xl">
            {inlineSubmitted ? (
              <div className="py-10 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ref ID: {submittedRefId}
                  </span>
                  <h3 className="text-2xl font-black text-white">Inquiry Received</h3>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{contactName}</strong>! Your inquiry regarding <em>"{contactInterest}"</em> has been transmitted to ViceIntel Investor Relations. We will reach out to <strong>{contactEmail}</strong> within 12 hours.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left max-w-md mx-auto space-y-2 text-xs font-sans">
                  <div className="flex justify-between text-zinc-400">
                    <span>Organization:</span>
                    <span className="text-white font-bold">{contactFirm || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Role / Type:</span>
                    <span className="text-rose-300 font-bold">{contactRole}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Check Size Target:</span>
                    <span className="text-emerald-400 font-mono font-bold">{contactCheckSize}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>NDA Protection:</span>
                    <span className="text-amber-300 font-bold">{requestNda ? 'Yes (Requested)' : 'Standard'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setInlineSubmitted(false);
                      setContactMessage('');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInlineContactSubmit} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-300 flex items-center justify-between">
                      <span>Full Name <span className="text-rose-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Vance"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-300 flex items-center justify-between">
                      <span>Work Email <span className="text-rose-400">*</span></span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@venturefund.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-300">
                      Entity / Firm Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Gaming Capital"
                      value={contactFirm}
                      onChange={(e) => setContactFirm(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-300">Phone / Telegram (Optional)</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 019-2831 or @alex_vc"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-300">Investor / Partner Role</label>
                    <select
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500 transition cursor-pointer"
                    >
                      <option value="Venture Capitalist (VC)">Venture Capitalist (VC)</option>
                      <option value="Angel Investor">Angel Investor</option>
                      <option value="Family Office">Family Office</option>
                      <option value="Gaming Media / Publisher">Gaming Media / Publisher</option>
                      <option value="RP Server Enterprise Owner">RP Server Enterprise Owner</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-300">Check Size Target</label>
                    <select
                      value={contactCheckSize}
                      onChange={(e) => setContactCheckSize(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500 transition cursor-pointer"
                    >
                      <option value="< $50,000">&lt; $50,000</option>
                      <option value="$50,000 - $250,000">$50,000 - $250,000</option>
                      <option value="$250,000 - $1,000,000">$250,000 - $1,000,000</option>
                      <option value="$1,000,000+">$1,000,000+</option>
                      <option value="N/A - Non-equity Partnership">N/A - Non-equity Partnership</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">Primary Inquiry Topic</label>
                  <select
                    value={contactInterest}
                    onChange={(e) => setContactInterest(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500 transition cursor-pointer"
                  >
                    <option value="Series Seed Term Sheet / Participation">Series Seed Term Sheet / Participation</option>
                    <option value="Data Room & Cap Table Access">Data Room & Cap Table Access</option>
                    <option value="B2B Server Whitelist Enterprise Licensing">B2B Server Whitelist Enterprise Licensing</option>
                    <option value="Strategic Media / Distribution Partnership">Strategic Media / Distribution Partnership</option>
                    <option value="Custom Technical / API Integration Inquiry">Custom Technical / API Integration Inquiry</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">Custom Inquiry & Notes</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please outline your specific questions, timeline, or investment thesis..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="requestNda"
                    checked={requestNda}
                    onChange={(e) => setRequestNda(e.target.checked)}
                    className="w-4 h-4 accent-rose-500 cursor-pointer rounded"
                  />
                  <label htmlFor="requestNda" className="text-xs text-zinc-300 cursor-pointer">
                    Execute mutual Non-Disclosure Agreement (NDA) before disclosing full financial cap table
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={inlineSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-xl shadow-rose-600/30 transition cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    {inlineSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Transmitting Inquiry to Leadership...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Executive Investor Inquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* CALL TO ACTION & INVESTOR DECK MODAL TRIGGER */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-950/80 via-zinc-900 to-zinc-950 border border-rose-500/30 p-8 lg:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-block">
            Investor Relations Contact
          </span>
          
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            Ready to Partner with ViceIntel?
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
            We are currently evaluating strategic angel, venture capital, and gaming media partners for our Seed Round. Request access to our full cap table, technical documentation, and financial model.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-4 no-print">
            <button
              onClick={() => setShowInquiryModal(true)}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Contact Investor Relations Team</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-rose-300 border border-rose-500/40 font-bold text-sm shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  <span>Generating Executive PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-rose-400" />
                  <span>Download Executive PDF Memorandum</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CONFIDENTIAL INVESTOR INQUIRY MODAL */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400">Confidential Request</span>
                <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                  Investor Data Room Access
                </h3>
              </div>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {inquirySubmitted ? (
              <div className="py-12 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white">Inquiry Received</h4>
                <p className="text-xs text-zinc-300 max-w-sm mx-auto">
                  Thank you for reaching out. Our Investor Relations team will review your request and transmit the NDA & Data Room link to <strong>{investorEmail}</strong> within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={investorName}
                    onChange={(e) => setInvestorName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Work / Investor Email</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@venturecapital.com"
                    value={investorEmail}
                    onChange={(e) => setInvestorEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Firm / Entity Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gaming Venture Partners"
                    value={investorFirm}
                    onChange={(e) => setInvestorFirm(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Investor Type</label>
                  <select
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="Angel Investor">Angel Investor</option>
                    <option value="Venture Capital VC">Venture Capital (VC)</option>
                    <option value="Gaming Media Partner">Gaming Media / Publisher</option>
                    <option value="Strategic Ecosystem Investor">Strategic Ecosystem Investor</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Request for Pitch Deck & Data Room</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
