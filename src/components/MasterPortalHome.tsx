'use client';
import React, { useRef, useEffect, useState } from 'react';
import { ActiveTab, Vehicle } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Car,
  Crosshair,
  GitCompare,
  Wrench,
  DollarSign,
  MapPin,
  Search,
  Sparkles,
  Zap,
  Flame,
  ArrowRight,
  ShieldCheck,
  Users,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Compass,
  ArrowUpRight,
  Radio,
  BookOpen,
  Mic,
  MessageSquare,
  Tv,
  Headphones,
  Sliders
} from 'lucide-react';
import { CommunityPollCard } from './CommunityPollCard';
import { VEHICLES_DATA } from '../data/vehicles';
import { WEAPONS_DATA } from '../data/weapons';
import { getStoredUnitPreference, formatSpeed } from '../lib/unitConverter';
import { BUSINESSES_DATA } from '../data/businesses';

interface MasterPortalHomeProps {
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectForCompare?: (v: Vehicle) => void;
  isAuthenticated: boolean;
  currentUser: FirebaseUser | null;
  onOpenAuth: () => void;
  isVipActive: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
}

export const MasterPortalHome: React.FC<MasterPortalHomeProps> = ({
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onSelectForCompare,
  isAuthenticated,
  currentUser,
  onOpenAuth,
  isVipActive,
  isAdmin = false,
  isStaff = false
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [spotlightTab, setSpotlightTab] = useState<'vehicle' | 'weapon' | 'business'>('vehicle');

  // Global '/' keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const featuredVehicle = VEHICLES_DATA[0]; // Grotti Cheetah
  const featuredWeapon = WEAPONS_DATA[0]; // Combat Pistol
  const featuredBusiness = BUSINESSES_DATA[0]; // Vice City Nightclub

  // Utility Suite Grid Cards data - clean and streamlined
  const utilitySuiteCards = [
    {
      id: 'vehicles' as ActiveTab,
      title: 'Vehicles Database',
      badge: '500+ Specs',
      badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      icon: Car,
      iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      description: 'Top speeds, trade prices, and handling metrics across all Vice City rides.',
      metric1: `Top Speed: ${featuredVehicle.topSpeedMph} MPH`,
      metric2: `Dealer: ${featuredVehicle.dealer}`,
      ctaText: 'Explore Vehicles DB'
    },
    {
      id: 'map' as ActiveTab,
      title: 'Vice City Live Map',
      badge: 'Interactive POIs',
      badgeColor: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
      icon: MapPin,
      iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      description: 'Interactive map pins for stunt jumps, safehouses, weapon spawns, and districts.',
      metric1: '6 District Map Tiles',
      metric2: '320+ Live Marker Pins',
      ctaText: 'Open Live Map'
    },
    {
      id: 'weapons' as ActiveTab,
      title: 'Weapon TTK Armory',
      badge: 'Damage Matrix',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      icon: Crosshair,
      iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      description: 'Benchmark time-to-kill speeds, fire rates RPM, and headshot damage multipliers.',
      metric1: `Featured: ${featuredWeapon.name}`,
      metric2: `TTK Speed: ${featuredWeapon.ttkMs} ms`,
      ctaText: 'Inspect Weapon Specs'
    },
    {
      id: 'economy-balancer' as ActiveTab,
      title: 'RP Economy Balancer',
      badge: 'RP Simulator',
      badgeColor: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
      icon: TrendingUp,
      iconColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
      description: 'Model server inflation, balance legal & illegal job wages against asset costs, and export Lua configs.',
      metric1: 'QBCore • ESX • QBX',
      metric2: '30-Day Liquidity Sim',
      ctaText: 'Launch Economy Balancer'
    },
    {
      id: 'handling-editor' as ActiveTab,
      title: 'handling.meta 3D Editor',
      badge: '3D Physics',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      icon: Sliders,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'Tune live vehicle physics, suspension, drive bias & test in interactive 3D WebGL simulator.',
      metric1: 'Live 3D & 2D Telemetry',
      metric2: 'Export handling.meta XML',
      ctaText: 'Open 3D Physics Tuner'
    },
    {
      id: 'mod-calculator' as ActiveTab,
      title: 'Custom Mod Builder',
      badge: 'Tuning Estimator',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      icon: Wrench,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'Plan engine, turbo, and paint customization budgets before spending in-game cash.',
      metric1: 'Stage 1-4 Performance Kits',
      metric2: 'Instant Cost Export',
      ctaText: 'Calculate Build Budget'
    },
    {
      id: 'roi-calculator' as ActiveTab,
      title: 'Business Profit Engine',
      badge: 'Hourly Yields',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      icon: DollarSign,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Calculate hourly income and ROI payback timelines for nightclubs and illegal ops.',
      metric1: `Top Safe: $${featuredBusiness.maxDailyIncome.toLocaleString('en-US')}/day`,
      metric2: 'Upgrade Payback Math',
      ctaText: 'Calculate Yields'
    },
    {
      id: 'comparison' as ActiveTab,
      title: '1v1 Spec Matrix',
      badge: 'Side-by-Side',
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      icon: GitCompare,
      iconColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      description: 'Compare vehicles and weapons head-to-head with radar charts and value ratings.',
      metric1: 'Real-time Deltas',
      metric2: 'Performance Value Index',
      ctaText: 'Compare 1v1 Specs'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* SECTION 1: CLEAN, SLEEK HERO & COMMAND BAR */}
      <section className="relative rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-10 lg:p-12 overflow-hidden shadow-2xl text-center space-y-6">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-5">
          
          {/* TOP BADGE */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>The Premier Vice City Utility Suite</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-bold">500+ Verified Specs</span>
          </div>

          {/* MAIN HEADLINE */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Explore <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Vice City</span> with Precision
          </h1>

          {/* SUBTITLE */}
          <p className="text-sm sm:text-base text-zinc-400 font-medium max-w-xl mx-auto leading-relaxed">
            Interactive map • Vehicle radar top speeds • Weapon TTK benchmarks • Business ROI calculators
          </p>

          {/* SEARCH BAR WITH SHORTCUT PILL */}
          <div className="max-w-lg mx-auto pt-1">
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vehicles, weapons, map pins, or guides..."
                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-rose-500 rounded-2xl pl-11 pr-24 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all shadow-inner font-sans"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800"
                  >
                    Clear
                  </button>
                )}
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800 pointer-events-none">
                  /
                </span>
              </div>
            </div>
          </div>

          {/* LIVE STATUS RIBBON */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-emerald-300">1,482</strong> Players Online
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <Car className="w-3.5 h-3.5 text-rose-400" />
              <strong className="text-zinc-200">500+</strong> Vehicle Specs
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <strong className="text-zinc-200">320+</strong> Map Pins
            </span>
          </div>

        </div>
      </section>

      {/* SECTION 2: FEATURED INTEL SPOTLIGHT (INTERACTIVE DISCOVERY TEASER) */}
      <section className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
              Featured Vice Intel Spotlight
            </h2>
          </div>

          {/* SPOTLIGHT TABS */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setSpotlightTab('vehicle')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                spotlightTab === 'vehicle'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🏎️ Supercar
            </button>
            <button
              onClick={() => setSpotlightTab('weapon')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                spotlightTab === 'weapon'
                  ? 'bg-cyan-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🔫 Armament
            </button>
            <button
              onClick={() => setSpotlightTab('business')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                spotlightTab === 'business'
                  ? 'bg-emerald-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🏢 Top ROI
            </button>
          </div>
        </div>

        {/* SPOTLIGHT CONTENT CARD */}
        {spotlightTab === 'vehicle' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800">
            <div className="md:col-span-4 rounded-xl overflow-hidden aspect-[16/9] border border-zinc-800 relative group">
              <img
                src={featuredVehicle.imageUrl}
                alt={featuredVehicle.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur-md text-[10px] font-mono text-rose-300 font-bold border border-rose-500/30">
                {featuredVehicle.category}
              </span>
            </div>

            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">{featuredVehicle.name}</h3>
                  <span className="text-xs text-zinc-400 font-sans">{featuredVehicle.dealer}</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  ${featuredVehicle.price.toLocaleString('en-US')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Top Speed</span>
                  <span className="text-rose-300 font-bold">{formatSpeed(featuredVehicle.topSpeedMph, getStoredUnitPreference())}</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">0-60 MPH</span>
                  <span className="text-cyan-300 font-bold">{featuredVehicle.acceleration}s</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Handling</span>
                  <span className="text-amber-300 font-bold">{featuredVehicle.handling}/100</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('vehicles')}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-rose-500/20"
              >
                <span>Inspect Full Vehicle Spec Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {spotlightTab === 'weapon' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800">
            <div className="md:col-span-4 rounded-xl overflow-hidden aspect-[16/9] border border-zinc-800 relative group">
              <img
                src={featuredWeapon.imageUrl}
                alt={featuredWeapon.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur-md text-[10px] font-mono text-cyan-300 font-bold border border-cyan-500/30">
                {featuredWeapon.category}
              </span>
            </div>

            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">{featuredWeapon.name}</h3>
                  <span className="text-xs text-zinc-400 font-sans">Ammu-Nation Tactical Grade</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  ${featuredWeapon.price.toLocaleString('en-US')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">TTK Speed</span>
                  <span className="text-cyan-300 font-bold">{featuredWeapon.ttkMs} ms</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Body Damage</span>
                  <span className="text-amber-300 font-bold">{featuredWeapon.damage}/100</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Fire Rate</span>
                  <span className="text-rose-300 font-bold">{featuredWeapon.fireRate}/100</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('weapons')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-500/20"
              >
                <span>Inspect Weapon Armory Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {spotlightTab === 'business' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800">
            <div className="md:col-span-4 rounded-xl overflow-hidden aspect-[16/9] border border-zinc-800 relative group">
              <img
                src={featuredBusiness.imageUrl}
                alt={featuredBusiness.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur-md text-[10px] font-mono text-emerald-300 font-bold border border-emerald-500/30">
                {featuredBusiness.type}
              </span>
            </div>

            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white">{featuredBusiness.name}</h3>
                  <span className="text-xs text-zinc-400 font-sans">{featuredBusiness.location}</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  ${featuredBusiness.purchasePrice.toLocaleString('en-US')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Daily Safe Payout</span>
                  <span className="text-emerald-300 font-bold">${featuredBusiness.maxDailyIncome.toLocaleString('en-US')}</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Payout Speed</span>
                  <span className="text-amber-300 font-bold">Every {featuredBusiness.payoutFrequencyHours}h</span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Yield Grade</span>
                  <span className="text-cyan-300 font-bold">Grade A+</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('roi-calculator')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <span>Launch Business Profit Estimator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: CLEAN UTILITY SUITE SHOWCASE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
              Core Utility Suite
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">7 Interactive Modules</span>
        </div>

        {/* 3-COLUMN RESPONSIVE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {utilitySuiteCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className="group bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-5 transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between cursor-pointer space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${card.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-white group-hover:text-rose-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1 font-sans">
                      {card.description}
                    </p>
                  </div>

                  {/* METRIC BADGES ROW */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 font-medium">
                      {card.metric1}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 font-medium">
                      {card.metric2}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-bold text-zinc-300 group-hover:text-white transition">
                  <span>{card.ctaText}</span>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: COMMUNITY POLL & LIVE VOICE COMMS CARD */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-6">
          <CommunityPollCard
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
          />
        </div>

        <div className="lg:col-span-6 bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all relative overflow-hidden flex flex-col justify-between space-y-5">
          {/* Accent glow background */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header Bar */}
          <div className="space-y-2 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>1,482 PLAYERS ONLINE</span>
              </span>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                <span>320 kbps HD Voice</span>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-cyan-400 shrink-0" />
              <span>Vice Live Voice Comms & Global Chat</span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans">
              Coordinate heist strategies, recruit squad mates, and stream high-framerate gameplay in low-latency WebRTC voice channels.
            </p>
          </div>

          {/* ACTIVE ROOMS & CHAT PREVIEWS */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
              Active Vice Squad Channels & Live Feeds
            </span>

            {/* Channel 1: Voice + Stream */}
            <div
              onClick={() => setActiveTab('chat')}
              className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-cyan-500/50 transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                      #heist-coordination-l4
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                      14 Voice
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    Lucia_99 & Jason_Vice broadcasting 60 FPS live screen feed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-cyan-400 text-xs font-mono font-bold group-hover:translate-x-1 transition">
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Channel 2: Global Chat Teaser */}
            <div
              onClick={() => setActiveTab('chat')}
              className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-cyan-500/50 transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-pink-300 transition truncate">
                      #ocean-drive-lounge
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[9px] font-mono font-bold">
                      342 Messages
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    <span className="text-rose-400 font-bold">[VIP Cartel_Don]</span>: "Who's setting up the Grassriver drag meet?"
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-pink-400 text-xs font-mono font-bold group-hover:translate-x-1 transition">
                <span>Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Channel 3: Live Stream Teaser */}
            <div
              onClick={() => setActiveTab('chat')}
              className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-cyan-500/50 transition cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Tv className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                      #custom-builds-stream
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold">
                      HD Screen Share
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    Custom Grotti Furia stage 3 engine tuning walkthrough
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-amber-400 text-xs font-mono font-bold group-hover:translate-x-1 transition">
                <span>Watch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>WebRTC Acceleration Active</span>
            </div>

            <button
              onClick={() => setActiveTab('chat')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <span>Launch Community Live Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 5: FOOTER AUTHORITY SUMMARY */}
      <section className="bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              GTA VI Central Database Authority
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            Schema.org Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-400 font-sans leading-relaxed">
          <div className="space-y-1">
            <strong className="text-zinc-200 block font-mono text-xs">🏎️ Vehicle Radar Telemetry</strong>
            <p>Verified top speeds, acceleration curves, and handling coefficients across all Leonida sports cars, supercars, and off-roaders.</p>
          </div>

          <div className="space-y-1">
            <strong className="text-zinc-200 block font-mono text-xs">🔫 TTK & Armory Matrix</strong>
            <p>Detailed time-to-kill speeds, fire rate RPM, and attachment cost breakdowns across all Ammu-Nation tactical weapons.</p>
          </div>

          <div className="space-y-1">
            <strong className="text-zinc-200 block font-mono text-xs">🏢 Business Yield & Custom Mods</strong>
            <p>Real-time ROI payback estimations for nightclubs and chop shops, paired with Vice Customs mod budget calculators.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

