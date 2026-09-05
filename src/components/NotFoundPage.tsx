import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  MapPin, 
  Car, 
  ShieldAlert, 
  MessageSquare, 
  Crosshair, 
  Server, 
  ArrowLeft, 
  AlertTriangle, 
  Sparkles, 
  Radio, 
  Compass, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ActiveTab } from '../types';
import { motion } from 'motion/react';

interface NotFoundPageProps {
  onNavigate: (tab: ActiveTab) => void;
  currentPath?: string;
  onOpenReport?: () => void;
}

const QUICK_LINKS: { title: string; tab: ActiveTab; icon: React.ComponentType<{ className?: string }>; desc: string; color: string; bgGlow: string }[] = [
  {
    title: 'Master Portal Home',
    tab: 'home',
    icon: Home,
    desc: 'Return to main dashboard, news bulletin, and player hub.',
    color: 'text-rose-400',
    bgGlow: 'hover:border-rose-500/50 hover:bg-rose-950/20',
  },
  {
    title: 'Vehicle Database',
    tab: 'vehicles',
    icon: Car,
    desc: 'Browse 150+ verified GTA VI sports cars, bikes & helicopters.',
    color: 'text-cyan-400',
    bgGlow: 'hover:border-cyan-500/50 hover:bg-cyan-950/20',
  },
  {
    title: 'Interactive Map',
    tab: 'map',
    icon: MapPin,
    desc: 'Explore Vice City, Port Gellhorn & Leonida Keys locations.',
    color: 'text-emerald-400',
    bgGlow: 'hover:border-emerald-500/50 hover:bg-emerald-950/20',
  },
  {
    title: 'Weapons Armory',
    tab: 'weapons',
    icon: Crosshair,
    desc: 'Compare TTK stats, damage charts & firearm attachments.',
    color: 'text-amber-400',
    bgGlow: 'hover:border-amber-500/50 hover:bg-amber-950/20',
  },
  {
    title: 'Community Live Chat',
    tab: 'chat',
    icon: MessageSquare,
    desc: 'Connect with Vice City players, join voice calls & VIP hubs.',
    color: 'text-purple-400',
    bgGlow: 'hover:border-purple-500/50 hover:bg-purple-950/20',
  },
  {
    title: 'FiveM RP Servers',
    tab: 'rp-servers',
    icon: Server,
    desc: 'Discover top roleplay servers & submit whitelist applications.',
    color: 'text-blue-400',
    bgGlow: 'hover:border-blue-500/50 hover:bg-blue-950/20',
  },
];

export function NotFoundPage({ onNavigate, currentPath, onOpenReport }: NotFoundPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const pathDisplay = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/unknown-route');

  const filteredLinks = QUICK_LINKS.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tab.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    if (q.includes('car') || q.includes('veh') || q.includes('drive') || q.includes('auto')) {
      onNavigate('vehicles');
    } else if (q.includes('gun') || q.includes('weap') || q.includes('arm') || q.includes('shoot')) {
      onNavigate('weapons');
    } else if (q.includes('map') || q.includes('loc') || q.includes('city') || q.includes('gps')) {
      onNavigate('map');
    } else if (q.includes('chat') || q.includes('talk') || q.includes('voice') || q.includes('vip')) {
      onNavigate('chat');
    } else if (q.includes('server') || q.includes('rp') || q.includes('roleplay') || q.includes('white')) {
      onNavigate('rp-servers');
    } else if (q.includes('calc') || q.includes('mod') || q.includes('tune')) {
      onNavigate('mod-calculator');
    } else if (q.includes('challenge') || q.includes('leader')) {
      onNavigate('challenges');
    } else {
      onNavigate('home');
    }
  };

  return (
    <div id="not-found-page" className="min-h-[85vh] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col items-center justify-center">
      {/* Visual Neon Radar Scanner Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-rose-950/40 relative overflow-hidden backdrop-blur-xl"
      >
        {/* Background Neon Glow Accent */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              404 — Signal Lost
            </span>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              VCPD Dispatch Code: 10-99 (Route Not Found)
            </span>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Safety
          </button>
        </div>

        {/* Main 404 Hero Display */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="relative inline-block mb-4">
            <h1 className="text-7xl sm:text-9xl font-black italic tracking-tighter bg-gradient-to-r from-rose-500 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent select-none drop-shadow-lg">
              404
            </h1>
            <div className="absolute -bottom-2 right-0 bg-slate-950 px-2.5 py-0.5 rounded border border-rose-500/50 text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold">
              Leonida GPS Offline
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            Oops! No Intel or Page Found Here
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Looks like you took a wrong turn on Ocean Drive or entered restricted Port Gellhorn airspace. The page or intel you are searching for does not exist or has been relocated by the Vice City Syndicate.
          </p>

          {/* Requested Path Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-400 max-w-full overflow-hidden text-ellipsis">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-500">Requested URL:</span>
            <span className="text-rose-300 font-semibold truncate">{pathDisplay}</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 text-white font-bold text-sm shadow-lg shadow-rose-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Go to Master Portal Home
          </button>

          <button
            onClick={() => onNavigate('vehicles')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all hover:scale-[1.02]"
          >
            <Car className="w-4 h-4 text-cyan-400" />
            Explore Vehicles
          </button>

          <button
            onClick={() => onNavigate('map')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all hover:scale-[1.02]"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            Vice City Map
          </button>
        </div>

        {/* Search Bar for Direct Jumping */}
        <div className="max-w-xl mx-auto mb-10">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for cars, weapons, map spots, chat, RP servers..."
              className="w-full pl-11 pr-24 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Quick Directory Grid */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-1">
            <Compass className="w-4 h-4 text-cyan-400" />
            Jump Directly to Verified Sections
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  onClick={() => onNavigate(item.tab)}
                  className={`text-left p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 transition-all duration-200 group flex items-start gap-3.5 ${item.bgGlow}`}
                >
                  <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 group-hover:scale-110 transition-transform ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors flex items-center justify-between">
                      <span>{item.title}</span>
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Support Notice */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Think this route is a broken link or server issue?</span>
          </div>

          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-rose-300 border border-rose-500/20 hover:border-rose-500/40 text-xs font-semibold transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Report Broken Link
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
