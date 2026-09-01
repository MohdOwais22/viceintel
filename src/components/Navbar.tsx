'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab } from '../types';
import { resolveApplicantAvatar } from '../data/avatars';
import { User as FirebaseUser } from 'firebase/auth';
import { getDocsNavigationTarget, getAdminNavigationTarget } from '../lib/subdomainRouter';
import {
  Car,
  Crosshair,
  GitCompare,
  Wrench,
  DollarSign,
  MapPin,
  Server,
  MessageSquare,
  ShieldCheck,
  BookOpen,
  Newspaper,
  User as UserIcon,
  Crown,
  Shield,
  Sparkles,
  Search,
  ChevronDown,
  Lock,
  Coins,
  Bell,
  Menu,
  X,
  Flame,
  Gift,
  Grid,
  Home,
  Sliders,
  Compass,
  TrendingUp,
  Trophy,
  FileCode,
  Bot,
  Users
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenAiAdvisor?: () => void;
  onOpenOfflineSync?: () => void;
  onOpenReportModal?: () => void;
  onOpenAvatarCreator?: () => void;
  isVipActive: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  currentUser?: FirebaseUser | null;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenAuth,
  onOpenProfile,
  onOpenAiAdvisor,
  onOpenOfflineSync,
  onOpenReportModal,
  onOpenAvatarCreator,
  isVipActive,
  isAdmin = false,
  isStaff = false,
  currentUser,
  unreadCount = 0
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'databases' | 'utilities' | 'community' | 'staff' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [currentUser?.photoURL, currentUser?.uid]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileDrawerSearchRef = useRef<HTMLInputElement>(null);

  // Global '/' keyboard shortcut to focus search bar
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

  // Hover Intent delay handlers (200ms delay)
  const handleMouseEnterGroup = (group: 'databases' | 'utilities' | 'community' | 'staff') => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      setActiveDropdown(group);
    }, 200);
  };

  const handleMouseLeaveGroup = () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const handleToggleDropdownGroup = (group: 'databases' | 'utilities' | 'community' | 'staff') => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setActiveDropdown(prev => (prev === group ? null : group));
  };

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'docs') {
      const target = getDocsNavigationTarget();
      if (target.isExternal && typeof window !== 'undefined') {
        window.location.href = target.url;
        return;
      }
    } else if (tab === 'admin' || tab === 'admin-business') {
      const target = getAdminNavigationTarget();
      if (target.isExternal && typeof window !== 'undefined') {
        const dest = tab === 'admin-business' ? `${target.url}/admin-business` : target.url;
        window.location.href = dest;
        return;
      }
    }
    setActiveTab(tab);
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const isAuthorizedStaff = isAdmin || isStaff;

  // Items for Databases Group
  const databaseItems = [
    { id: 'vehicles' as ActiveTab, label: 'Vehicles DB', icon: Car, badge: '18 Vehicles', desc: '500+ top speeds, trade prices & handling ratings' },
    { id: 'weapons' as ActiveTab, label: 'Weapons Spec', icon: Crosshair, badge: '12 Guns', desc: 'TTK matrix, fire rate & attachment specs' },
    { id: 'characters' as ActiveTab, label: 'Characters & Lore', icon: Users, badge: 'Lucia & Jason', desc: 'Dossiers, heist roles & special abilities' },
    { id: 'comparison' as ActiveTab, label: '1v1 Compare', icon: GitCompare, badge: 'Dynamic', desc: 'Side-by-side vehicle & weapon spec showdown' },
  ];

  // Streamlined Items for Utilities Group (Consolidated power tools)
  const utilityItems = [
    { id: 'script-generator' as ActiveTab, label: 'FiveM Script & Config Studio', icon: FileCode, badge: 'No-Code Lua', desc: 'Visual QBCore & ESX generator, jobs, items & multi-file bundles' },
    { id: 'economy-balancer' as ActiveTab, label: 'RP Economy Balancer', icon: TrendingUp, badge: 'RP Simulator', desc: 'Simulate inflation, legal/illegal wages & 30-day market macro projections' },
    { id: 'handling-editor' as ActiveTab, label: 'handling.meta & 3D Physics', icon: Sliders, badge: '3D Physics', desc: 'Visual suspension, drag, and 3D physics telemetry tuner' },
    { id: 'challenges' as ActiveTab, label: 'Tuning Championship', icon: Trophy, badge: '500 VC Round', desc: 'Weekly handling.meta physics challenges & leaderboard' },
    { id: 'roi-calculator' as ActiveTab, label: 'Financial & Mod Calculators', icon: DollarSign, badge: 'ROI & Mods', desc: 'Commercial property profit yield & custom vehicle upgrade budgets' },
    { id: 'giftcards' as ActiveTab, label: 'Shark Cards & VIP Vouchers', icon: Gift, badge: 'Cash & VIP', desc: 'Redeem vouchers, Shark Cash & gift VIP passes' },
  ];

  // Items for Community Group
  const communityItems = [
    { id: 'chat' as ActiveTab, label: 'Live Community Hub', icon: MessageSquare, badge: '1,482 Online', desc: 'Real-time crew chat & squad recruitment' },
    { id: 'rp-servers' as ActiveTab, label: 'RP Server Directory', icon: Server, badge: 'Live', desc: 'FiveM & custom GTA 6 roleplay server listings' },
    { id: 'for-servers' as ActiveTab, label: 'For Server Owners (SaaS)', icon: Sparkles, badge: '$29–$49/mo', desc: 'Automate applicant screening, Discord bot sync & Lua bundles' },
    { id: 'blog' as ActiveTab, label: 'Game Intel & Blog', icon: Newspaper, badge: 'Map Leaks', desc: 'Latest Vice City news, leaks & guides' },
    { id: 'seo-hub' as ActiveTab, label: 'GTA VI Search Engine', icon: Search, badge: 'Cheats & Specs', desc: 'Verified cheats, release date, map & system specs' },
  ];

  // Items for Staff HQ Group
  const staffItems = [
    { id: 'market-agency' as ActiveTab, label: 'AI Agent Console', icon: Bot, badge: 'AI Agents', desc: 'Autonomous AI agent suite & intelligence workflows', restricted: true },
    { id: 'marketing' as ActiveTab, label: 'Growth Engine Studio', icon: Sparkles, badge: 'Growth AI', desc: 'Keyword research, pSEO generator & viral video studio', restricted: true },
    { id: 'admin-business' as ActiveTab, label: 'B2B SaaS & MRR Analytics', icon: TrendingUp, badge: 'MRR / ARR', desc: 'Executive subscription metrics, churn & tier overrides', restricted: true },
    { id: 'admin' as ActiveTab, label: 'Admin Control Panel', icon: ShieldCheck, badge: 'Staff HQ', desc: 'User moderation, permissions & system stats', restricted: true },
    { id: 'docs' as ActiveTab, label: 'Docs & System API', icon: BookOpen, badge: 'API Spec', desc: 'REST endpoints, architecture specs & database models', restricted: true },
  ];

  const isDatabasesActive = ['vehicles', 'weapons', 'characters', 'comparison'].includes(activeTab);
  const isUtilitiesActive = ['script-generator', 'mod-calculator', 'roi-calculator', 'handling-editor', 'economy-balancer', 'giftcards', 'challenges'].includes(activeTab);
  const isCommunityActive = ['chat', 'rp-servers', 'blog', 'seo-hub'].includes(activeTab);

  return (
    <>
      {/* TOP NAVBAR HEADER */}
      <nav className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* LEFT: LOGO & DESKTOP NAVIGATION GROUPS */}
            <div className="flex items-center gap-3 xl:gap-6 shrink-0">
              {/* BRAND LOGO */}
              <button
                onClick={() => handleSelectTab('home')}
                className="flex items-center gap-2.5 group text-left transition-all duration-200 cursor-pointer shrink-0"
              >
                <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-rose-500 via-pink-600 to-indigo-600 text-white font-black text-lg sm:text-xl shadow-lg shadow-rose-500/30 group-hover:shadow-rose-500/60 group-hover:scale-105 transition-all">
                  <span className="tracking-tighter">VI</span>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-rose-300 bg-clip-text text-transparent group-hover:from-rose-400 group-hover:to-cyan-300 transition-all drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                      ViceIntel
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      Vice City DB
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 hidden md:block">
                    Master Portal & Utility Suite
                  </p>
                </div>
              </button>

              {/* DESKTOP DROPDOWN NAVIGATION GROUPS */}
              <div className="hidden lg:flex items-center gap-1">
                
                {/* 1. 📚 DATABASES DROPDOWN GROUP */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnterGroup('databases')}
                  onMouseLeave={handleMouseLeaveGroup}
                >
                  <button
                    onClick={() => handleToggleDropdownGroup('databases')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isDatabasesActive
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-md shadow-rose-500/10'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <span className="text-sm">📚</span>
                    <span>Databases</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'databases' ? 'rotate-180 text-rose-400' : 'text-zinc-500'}`} />
                  </button>

                  {/* Glassmorphic Dropdown Panel */}
                  {activeDropdown === 'databases' && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 mb-1 flex items-center justify-between">
                        <span>Interactive Gaming Databases</span>
                        <span className="text-rose-400 font-mono">3 Specs</span>
                      </div>
                      <div className="space-y-1">
                        {databaseItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectTab(item.id)}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
                                  : 'hover:bg-zinc-800/80 text-zinc-300 hover:text-white border border-transparent'
                              }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-rose-500/30 text-rose-300' : 'bg-zinc-800 text-zinc-400'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold">{item.label}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    {item.badge}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{item.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. 🛠️ UTILITIES DROPDOWN GROUP */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnterGroup('utilities')}
                  onMouseLeave={handleMouseLeaveGroup}
                >
                  <button
                    onClick={() => handleToggleDropdownGroup('utilities')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isUtilitiesActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <span className="text-sm">🛠️</span>
                    <span>Utilities</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'utilities' ? 'rotate-180 text-amber-400' : 'text-zinc-500'}`} />
                  </button>

                  {/* Glassmorphic Dropdown Panel */}
                  {activeDropdown === 'utilities' && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 mb-1 flex items-center justify-between">
                        <span>In-Game Economy & Physics Tools</span>
                        <span className="text-amber-400 font-mono">{utilityItems.length} Utilities</span>
                      </div>
                      <div className="space-y-1">
                        {utilityItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectTab(item.id)}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                                  : 'hover:bg-zinc-800/80 text-zinc-300 hover:text-white border border-transparent'
                              }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-amber-500/30 text-amber-300' : 'bg-zinc-800 text-zinc-400'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold">{item.label}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {item.badge}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{item.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. 🌐 COMMUNITY DROPDOWN GROUP */}
                <div
                  className="relative"
                  onMouseEnter={() => handleMouseEnterGroup('community')}
                  onMouseLeave={handleMouseLeaveGroup}
                >
                  <button
                    onClick={() => handleToggleDropdownGroup('community')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isCommunityActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <span className="text-sm">🌐</span>
                    <span>Community</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'community' ? 'rotate-180 text-cyan-400' : 'text-zinc-500'}`} />
                  </button>

                  {/* Glassmorphic Dropdown Panel */}
                  {activeDropdown === 'community' && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 mb-1 flex items-center justify-between">
                        <span>Vice City Player Network</span>
                        <span className="text-cyan-400 font-mono">1,482 Live</span>
                      </div>
                      <div className="space-y-1">
                        {communityItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectTab(item.id)}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                                  : 'hover:bg-zinc-800/80 text-zinc-300 hover:text-white border border-transparent'
                              }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-zinc-800 text-zinc-400'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold">{item.label}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    {item.badge}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{item.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. 📍 VICE CITY MAP (STANDALONE DIRECT BUTTON) */}
                <button
                  onClick={() => handleSelectTab('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all duration-200 border cursor-pointer ${
                    activeTab === 'map'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/80 hover:border-rose-400 shadow-sm shadow-rose-500/20'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>Vice City Map</span>
                </button>
              </div>
            </div>

            {/* RIGHT SECTION: SEARCH, AI ADVISOR & PROFILE */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              
              {/* DESKTOP SEARCH INPUT WITH KBD SHORTCUT */}
              <div className="relative hidden xl:block w-48 lg:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Press / to search..."
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-8 pr-10 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-sans"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 pointer-events-none">
                  /
                </span>
              </div>

              {/* AI BUTTON */}
              {onOpenAiAdvisor && (
                <button
                  onClick={onOpenAiAdvisor}
                  className="px-2.5 sm:px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-500/10 cursor-pointer"
                  title="Open AI Tactical Assistant"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow shrink-0" />
                  <span>AI</span>
                </button>
              )}

              {/* PROFILE / ACCOUNT / DISCORD BUTTON */}
              <button
                onClick={() => {
                  if (currentUser && onOpenProfile) {
                    onOpenProfile();
                  } else {
                    onOpenAuth();
                  }
                }}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 sm:gap-2 border relative cursor-pointer ${
                  isAdmin
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20'
                    : isVipActive
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : currentUser
                    ? 'bg-rose-950/60 text-rose-200 border-rose-500/40 hover:bg-rose-900/80'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                }`}
              >
                {currentUser && !avatarLoadError ? (
                  <img
                    src={resolveApplicantAvatar(currentUser.photoURL, currentUser.displayName || currentUser.email)}
                    alt="User Avatar"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      setAvatarLoadError(true);
                    }}
                    className="w-4 h-4 rounded-full object-cover shrink-0 border border-rose-400/60 shadow-xs"
                  />
                ) : isAdmin ? (
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : isVipActive ? (
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span className="truncate max-w-[65px] xs:max-w-[85px] sm:max-w-[120px]">
                  {currentUser
                    ? `${currentUser.displayName || currentUser.email?.split('@')[0]}${isAdmin ? ' (Admin)' : ''}`
                    : 'Sign In / VIP'}
                </span>
                {unreadCount > 0 && (
                  <span className="flex items-center gap-1 bg-rose-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse shadow-md shadow-rose-500/40 shrink-0">
                    <Bell className="w-2.5 h-2.5 fill-current" />
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM-ANCHORED TAB NAVIGATION BAR (lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-2xl border-t border-zinc-800/90 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] px-2 py-1.5">
        <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
          {/* TAB 1: HOME */}
          <button
            onClick={() => handleSelectTab('home')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer w-full group ${
              activeTab === 'home'
                ? 'text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20'
                : 'text-zinc-400 hover:text-zinc-200 font-medium border border-transparent'
            }`}
          >
            <Home className={`w-5 h-5 mb-0.5 transition-transform group-active:scale-95 ${activeTab === 'home' ? 'text-rose-400' : 'text-zinc-400'}`} />
            <span className="text-[10px] leading-tight tracking-tight">Home</span>
          </button>

          {/* TAB 2: MAP */}
          <button
            onClick={() => handleSelectTab('map')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer w-full group ${
              activeTab === 'map'
                ? 'text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20'
                : 'text-zinc-400 hover:text-zinc-200 font-medium border border-transparent'
            }`}
          >
            <MapPin className={`w-5 h-5 mb-0.5 transition-transform group-active:scale-95 ${activeTab === 'map' ? 'text-rose-400 animate-pulse' : 'text-zinc-400'}`} />
            <span className="text-[10px] leading-tight tracking-tight">Map</span>
          </button>

          {/* TAB 3: VEHICLES */}
          <button
            onClick={() => handleSelectTab('vehicles')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer w-full group ${
              activeTab === 'vehicles'
                ? 'text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20'
                : 'text-zinc-400 hover:text-zinc-200 font-medium border border-transparent'
            }`}
          >
            <Car className={`w-5 h-5 mb-0.5 transition-transform group-active:scale-95 ${activeTab === 'vehicles' ? 'text-rose-400' : 'text-zinc-400'}`} />
            <span className="text-[10px] leading-tight tracking-tight">Vehicles</span>
          </button>

          {/* TAB 4: CHAT */}
          <button
            onClick={() => handleSelectTab('chat')}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer w-full group relative ${
              activeTab === 'chat'
                ? 'text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20'
                : 'text-zinc-400 hover:text-zinc-200 font-medium border border-transparent'
            }`}
          >
            <div className="relative">
              <MessageSquare className={`w-5 h-5 mb-0.5 transition-transform group-active:scale-95 ${activeTab === 'chat' ? 'text-rose-400' : 'text-zinc-400'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-rose-500 text-white font-black text-[9px] px-1 py-0.2 rounded-full animate-pulse shadow-md shadow-rose-500/40">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight tracking-tight">Chat</span>
          </button>

          {/* TAB 5: MORE MENU */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer w-full group ${
              isMobileMenuOpen
                ? 'text-rose-400 font-bold bg-rose-500/15 border border-rose-500/30'
                : 'text-zinc-400 hover:text-zinc-200 font-medium border border-transparent'
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 mb-0.5 text-rose-400" />
            ) : (
              <Grid className="w-5 h-5 mb-0.5 text-zinc-400" />
            )}
            <span className="text-[10px] leading-tight tracking-tight">Menu</span>
          </button>
        </div>
      </div>

      {/* MOBILE SLIDE-UP BOTTOM SHEET MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop Tap Target */}
          <div className="flex-1 w-full" onClick={() => setIsMobileMenuOpen(false)} />

          {/* Bottom Sheet Modal Container */}
          <div className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom-5 duration-200 scrollbar-thin scrollbar-thumb-zinc-700">
            {/* Visual Handlebar */}
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto -mt-1 mb-2" />

            {/* Header Title & Close */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-extrabold text-white font-mono uppercase tracking-wider">
                  Vice City Navigation
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MOBILE QUICK SEARCH BAR */}
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                ref={mobileDrawerSearchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vehicles, weapons, ROI, map..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* CATEGORY 1: DATABASES */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-400 tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">📚</span>
                  <span>Interactive Databases</span>
                </span>
                <span className="text-[10px] text-rose-400 font-mono">3 Specs</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {databaseItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl text-left transition cursor-pointer border ${
                        isActive
                          ? 'bg-rose-500/20 text-rose-200 border-rose-500/40 font-bold'
                          : 'bg-zinc-950/80 text-zinc-300 border-zinc-800/80 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-rose-500/30 text-rose-300' : 'bg-zinc-800 text-zinc-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate">{item.label}</span>
                          <span className="text-[10px] text-zinc-400 block truncate font-sans font-normal">{item.desc}</span>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold bg-zinc-800 text-zinc-300 shrink-0 ml-2">
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CATEGORY 2: UTILITIES & CALCULATORS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-400 tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">🛠️</span>
                  <span>Utilities & Calculators</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">{utilityItems.length} Utilities</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {utilityItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl text-left transition cursor-pointer border ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 font-bold'
                          : 'bg-zinc-950/80 text-zinc-300 border-zinc-800/80 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-amber-500/30 text-amber-300' : 'bg-zinc-800 text-zinc-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate">{item.label}</span>
                          <span className="text-[10px] text-zinc-400 block truncate font-sans font-normal">{item.desc}</span>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold bg-zinc-800 text-zinc-300 shrink-0 ml-2">
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CATEGORY 3: COMMUNITY & NEWS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-400 tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm">🌐</span>
                  <span>Community & Network</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">1,482 Live</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {communityItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl text-left transition cursor-pointer border ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 font-bold'
                          : 'bg-zinc-950/80 text-zinc-300 border-zinc-800/80 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-zinc-800 text-zinc-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate">{item.label}</span>
                          <span className="text-[10px] text-zinc-400 block truncate font-sans font-normal">{item.desc}</span>
                        </div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold bg-zinc-800 text-zinc-300 shrink-0 ml-2">
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CATEGORY 4: STAFF HQ */}
            {staffItems.filter((item) => !item.restricted || isAuthorizedStaff).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-400 tracking-wider px-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm">🛡️</span>
                    <span>Staff HQ</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {staffItems
                    .filter((item) => !item.restricted || isAuthorizedStaff)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`flex items-center justify-between p-3 rounded-2xl text-left transition cursor-pointer border ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 font-bold'
                              : 'bg-zinc-950/80 text-zinc-300 border-zinc-800/80 hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-amber-500/30 text-amber-300' : 'bg-zinc-800 text-zinc-400'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold block truncate">{item.label}</span>
                              <span className="text-[10px] text-zinc-400 block truncate font-sans font-normal">{item.desc}</span>
                            </div>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 ml-2">
                            {item.badge}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ACCOUNT / SIGN IN LINKS */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (currentUser && onOpenProfile) {
                    onOpenProfile();
                  } else {
                    onOpenAuth();
                  }
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>
                  {currentUser
                    ? `My Player Profile (${currentUser.displayName || currentUser.email?.split('@')[0]})`
                    : 'Sign In / Join VIP Membership ($3.99/mo)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
