import React, { useState, useEffect } from 'react';
import {
  Search,
  Zap,
  Sparkles,
  ShieldCheck,
  FileText,
  Key,
  Globe,
  Share2,
  Check,
  HelpCircle,
  TrendingUp,
  Cpu,
  DollarSign,
  MapPin,
  Car,
  Crosshair,
  User,
  Radio,
  Wrench,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Clock,
  BookOpen,
  CheckCircle2,
  X,
  Compass,
  ArrowUpRight,
  Tag,
  Copy,
  Bot,
  Activity,
  MessageSquare,
  Layers,
  Trash2,
  Filter,
  Tv,
  Play,
  Video,
  Film,
  ExternalLink,
  PlayCircle
} from 'lucide-react';
import { SEO_KEYWORD_PAGES, SeoKeywordPage } from '../data/seoKeywordsData';
import { deduplicateKnowledgeArticles, isArticleOlderThan30Days } from '../lib/seoDeduplication';
import { copyToClipboard } from '../lib/copyUtils';
import { ENV } from '../lib/envConfig';
import { updateArticleSeoMeta } from '../lib/seoRouting';
import { GameDealsBox } from './affiliates/GameDealsBox';
import { formatAutoCrawlTime, formatDate, formatDateTime } from '../lib/dateUtils';

interface GtaSeoKnowledgeHubProps {
  onNavigateTab?: (tab: any) => void;
  currentUser?: any;
  isAdmin?: boolean;
  isStaff?: boolean;
  onOpenAiAdvisor?: () => void;
}

export const GtaSeoKnowledgeHub: React.FC<GtaSeoKnowledgeHubProps> = ({
  onNavigateTab,
  currentUser,
  isAdmin = false,
  isStaff = false,
  onOpenAiAdvisor
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allPages, setAllPages] = useState<SeoKeywordPage[]>(SEO_KEYWORD_PAGES);
  const [activePage, setActivePage] = useState<SeoKeywordPage | null>(SEO_KEYWORD_PAGES[0]);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [showJsonLdModal, setShowJsonLdModal] = useState<boolean>(false);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [isMergingPruning, setIsMergingPruning] = useState<boolean>(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'recent' | 'pillars'>('all');
  const [lastCrawlFormatted, setLastCrawlFormatted] = useState<string>('Just now');
  const [passkeyUnlocked, setPasskeyUnlocked] = useState<boolean>(false);
  const [showPasskeyModal, setShowPasskeyModal] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>('');
  const [passkeyError, setPasskeyError] = useState<string>('');
  const [lastCrawlNotice, setLastCrawlNotice] = useState<string>('');
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);
  const [activeVideoTimestamp, setActiveVideoTimestamp] = useState<number>(0);

  // Article feedback state
  const [helpfulVote, setHelpfulVote] = useState<'yes' | 'no' | null>(null);
  const [helpfulCount, setHelpfulCount] = useState<number>(142);

  // Sidebar Quick Cheat Code Tool State
  const [cheatPlatform, setCheatPlatform] = useState<'phone' | 'ps5' | 'xbox'>('phone');
  const [copiedCheatCode, setCopiedCheatCode] = useState<string | null>(null);

  // Staff (L3) and Admin (L4) privilege check strictly for authorized staff/admin accounts
  const isL3OrL4 = Boolean(
    isAdmin === true ||
    isStaff === true ||
    (typeof currentUser?.level === 'number' && currentUser.level >= 3) ||
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Staff' ||
    currentUser?.isAdmin === true ||
    currentUser?.isStaff === true ||
    currentUser?.clearanceLevel === 'L4' ||
    currentUser?.clearanceLevel === 'L3' ||
    currentUser?.clearanceLevel === 'L4 Admin' ||
    currentUser?.clearanceLevel === 'L3 Staff' ||
    currentUser?.userLevel === 'L4' ||
    currentUser?.userLevel === 'L3' ||
    currentUser?.userLevel === 'Admin' ||
    currentUser?.userLevel === 'Staff' ||
    passkeyUnlocked
  );

  // Fetch auto-generated pSEO pages from server API on mount
  useEffect(() => {
    fetch('/api/seo/pages')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const deduplicated = deduplicateKnowledgeArticles(SEO_KEYWORD_PAGES, data.data);
          setAllPages(deduplicated);
          const rawTime = data.lastCrawlTimestamp || data.lastCrawlFormatted;
          setLastCrawlFormatted(formatAutoCrawlTime(rawTime));
        }
      })
      .catch((err) => console.log('Notice: /api/seo/pages fallback mode:', err));
  }, []);

  const handleRunMidnightSpider = async () => {
    if (!isL3OrL4) {
      alert('Access Denied: Running the Live News Crawler is restricted to L3 Staff and L4 Admin accounts.');
      return;
    }
    setIsCrawling(true);
    setLastCrawlNotice('');
    try {
      const res = await fetch('/api/seo/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'vice_midnight_cron_secret_2026'
        },
        body: JSON.stringify({ force: true })
      });
      const data = await res.json();
      if (data.success && data.generatedPage) {
        setSearchQuery('');
        setSelectedCategory('All');
        setAllPages((prev) => {
          return deduplicateKnowledgeArticles(SEO_KEYWORD_PAGES, [data.generatedPage, ...prev]);
        });
        setActivePage(data.generatedPage);
        setLastCrawlFormatted(formatAutoCrawlTime(Date.now()));

        const summary = data.generatedPage?.updatedAssetsSummary;
        let notice = `⚡ Live GTA 6 News Engine updated! "${data.generatedPage.title}" added to index.`;
        if (summary) {
          notice += ` Synced: +${summary.vehiclesAdded || 0} Vehicles, +${summary.weaponsAdded || 0} Weapons, +${summary.mapLocationsAdded || 0} Map Locations.`;
        }
        setLastCrawlNotice(notice);

        // Smoothly bring the active article into view
        setTimeout(() => {
          const el = document.getElementById('active-article-viewport');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      } else {
        setLastCrawlNotice(`⚠️ ${data.message || data.error || 'Could not auto-generate news briefing. Please try again.'}`);
      }
    } catch (err: any) {
      console.error('Failed to run Midnight Spider:', err);
      setLastCrawlNotice(`⚠️ Error running Midnight Spider: ${err?.message || 'Network error'}`);
    } finally {
      setIsCrawling(false);
    }
  };

  const handleRunMergeAndPrune = async () => {
    if (!isL3OrL4) {
      alert('Access Denied: Running the Merge & Prune engine is restricted to L3 Staff and L4 Admin accounts.');
      return;
    }
    setIsMergingPruning(true);
    setLastCrawlNotice('');
    try {
      const res = await fetch('/api/seo/merge-and-prune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'vice_midnight_cron_secret_2026'
        }
      });
      const data = await res.json();
      if (data.success && data.stats) {
        // Refresh pages
        const pagesRes = await fetch('/api/seo/pages');
        const pagesData = await pagesRes.json();
        if (pagesData.success && Array.isArray(pagesData.data)) {
          const deduplicated = deduplicateKnowledgeArticles(SEO_KEYWORD_PAGES, pagesData.data);
          setAllPages(deduplicated);
          if (activePage && !deduplicated.some(p => p.id === activePage.id)) {
            setActivePage(deduplicated[0] || null);
          }
        }
        setLastCrawlNotice(`⚡ pSEO Index Optimized! Consolidated ${data.stats.mergedCount} related topics into deep-dives • Pruned ${data.stats.prunedCount} expired (>30 days) articles • ${data.stats.retainedCount} active articles.`);
      } else {
        setLastCrawlNotice(`⚠️ ${data.message || data.error || 'Could not complete merge and prune pass.'}`);
      }
    } catch (err: any) {
      console.error('Failed to run Merge & Prune:', err);
      setLastCrawlNotice(`⚠️ Error running Merge & Prune: ${err?.message || 'Network error'}`);
    } finally {
      setIsMergingPruning(false);
    }
  };

  const handleUnlockPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = passkeyInput.trim().toUpperCase();
    if (cleanKey === 'VICE2026_L3' || cleanKey === 'VICE2026_L4' || cleanKey === 'VICE2026_STAFF' || cleanKey === 'VICE2026') {
      setPasskeyUnlocked(true);
      setShowPasskeyModal(false);
      setPasskeyInput('');
      setPasskeyError('');
    } else {
      setPasskeyError('Invalid Staff clearance key. Please check your credentials.');
    }
  };

  // Filter pages based on search query, category, and activeFilterTab with useMemo optimization
  const filteredPages = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allPages.filter((page) => {
      if (!page) return false;
      
      // Filter tab check
      const isPillar = page.id && (page.id.startsWith('page-gta6-') || (page as any).isPillar === true);
      if (activeFilterTab === 'pillars' && !isPillar) return false;
      if (activeFilterTab === 'recent' && isPillar) return false;

      const cat = page.category || '';
      const matchesCategory = selectedCategory === 'All' || cat.includes(selectedCategory) || selectedCategory.includes(cat);
      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        (page.title && page.title.toLowerCase().includes(q)) ||
        (page.h1 && page.h1.toLowerCase().includes(q)) ||
        (Array.isArray(page.keywords) && page.keywords.some((k) => k && k.toLowerCase().includes(q))) ||
        (page.category && page.category.toLowerCase().includes(q)) ||
        (page.summary && page.summary.toLowerCase().includes(q))
      );
    });
  }, [allPages, selectedCategory, searchQuery, activeFilterTab]);

  // Auto-resolve article from URL path or query parameter on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const pathname = window.location.pathname.toLowerCase().replace(/^\//, '');
      const searchParams = new URLSearchParams(window.location.search);
      const targetSlug = pathname || searchParams.get('article') || searchParams.get('slug') || searchParams.get('page');

      if (targetSlug) {
        const match = allPages.find((p) => p.slug.toLowerCase() === targetSlug.toLowerCase());
        if (match) {
          setActivePage(match);
        }
      }
    } catch (err) {
      console.debug('Knowledge Hub URL parsing notice:', err);
    }
  }, [allPages]);

  // Inject comprehensive SEO tags, Canonical link, OG tags, Twitter cards, and Schema.org JSON-LD
  useEffect(() => {
    if (!activePage || typeof document === 'undefined') return;

    updateArticleSeoMeta({
      title: activePage.metaTitle || activePage.title || activePage.h1,
      description: activePage.metaDescription || activePage.summary || 'Vice City GTA VI Intel Report',
      slug: activePage.slug,
      keywords: activePage.keywords,
      faqs: activePage.faqs,
      author: activePage.author || 'Vice City Research Team',
      date: '2026-08-01',
      isBlog: false
    });

    // Keep browser URL cleanly in sync with active page slug
    if (typeof window !== 'undefined') {
      try {
        const targetPath = `/${activePage.slug}`;
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ articleSlug: activePage.slug }, activePage.metaTitle, targetPath);
        }
      } catch (e) {
        // Fallback for iframe restrictions
      }
    }
  }, [activePage]);

  const handleCopyShareUrl = (slug: string) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cheats & Codes':
        return <Key className="w-3.5 h-3.5 text-amber-400" />;
      case 'Release & News':
        return <TrendingUp className="w-3.5 h-3.5 text-sky-400" />;
      case 'System Specs':
        return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Heists & Businesses':
      case 'Heists & Money':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-300" />;
      case 'Map & Locations':
        return <MapPin className="w-3.5 h-3.5 text-rose-400" />;
      case 'Vehicles & Top Speeds':
        return <Car className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Weapons & TTK':
        return <Crosshair className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Characters & Lore':
        return <User className="w-3.5 h-3.5 text-purple-400" />;
      case 'Radio & Music':
        return <Radio className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const categories = [
    'All',
    'Cheats & Codes',
    'Release & News',
    'System Specs',
    'Heists & Businesses',
    'Map & Locations',
    'Vehicles & Top Speeds',
    'Weapons & TTK',
    'Characters & Lore',
    'Radio & Music',
    'RP & Mods'
  ];

  const quickSearchTags = [
    { label: 'Cheats & Phone Numbers', query: 'cheats' },
    { label: 'Fastest Supercars', query: 'top speed' },
    { label: 'PC System Specs', query: 'specs' },
    { label: 'Lucia & Jason', query: 'Lucia' },
    { label: 'Interactive Map', query: 'map' },
    { label: 'Heists & Cash', query: 'heist' }
  ];

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* NEWS INDEX CRAWLER STATUS & REFRESH TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-xs text-zinc-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-medium text-zinc-300">Live News Index Engine</span>
          <span className="text-zinc-600">•</span>
          <span className="text-emerald-400 font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30">
            {allPages.length} Articles Active
          </span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-zinc-400 font-sans hidden sm:inline">Last Auto-Crawl: <strong className="text-zinc-200">{lastCrawlFormatted}</strong></span>
        </div>
        {isL3OrL4 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunMergeAndPrune}
              disabled={isMergingPruning}
              title="Merge related news updates into deep-dives and optimize intelligence index"
              className={`px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isMergingPruning ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isMergingPruning ? 'animate-spin' : ''}`} />
              <span>{isMergingPruning ? 'Optimizing Intel...' : '⚡ Merge & Optimize'}</span>
            </button>
            <button
              onClick={handleRunMidnightSpider}
              disabled={isCrawling}
              className={`px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isCrawling ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCrawling ? 'animate-spin' : ''}`} />
              <span>{isCrawling ? 'Crawling News...' : 'Run Live Crawler'}</span>
            </button>
          </div>
        )}
      </div>

      {lastCrawlNotice && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-sans flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lastCrawlNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            {activePage && (
              <button
                onClick={() => {
                  const el = document.getElementById('active-article-viewport');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[11px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <BookOpen className="w-3 h-3 text-emerald-300" />
                <span>View New Article</span>
              </button>
            )}
            <button onClick={() => setLastCrawlNotice('')} className="text-zinc-400 hover:text-white p-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SLEEK, CLEAN SEARCH ENGINE HERO HEADER */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-semibold tracking-wide flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>GTA VI Verified Intel Search</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Vice City Knowledge & Search Engine
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed font-sans">
            Search verified cheat codes, PS5/PC system requirements, Leonida map locations, vehicle top speeds, and time-to-kill armory benchmarks.
          </p>
        </div>

        {/* SEARCH INPUT BOX */}
        <div className="space-y-3">
          <div className="relative w-full max-w-3xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cheats, PS5 specs, Lucia, money glitches, top speeds..."
              className="w-full pl-12 pr-24 py-3.5 bg-zinc-950 border border-zinc-800 focus:border-emerald-500/80 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition font-sans shadow-inner"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-xl transition cursor-pointer"
              >
                Clear
              </button>
            ) : (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-mono text-zinc-600 hidden sm:inline-block">
                ⌘ Search
              </span>
            )}
          </div>

          {/* QUICK SEARCH CHIPS */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-zinc-500 font-sans mr-1">Popular:</span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => setSearchQuery(tag.query)}
                className="px-2.5 py-1 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 text-[11px] font-sans transition cursor-pointer hover:text-white"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* CATEGORY SELECTOR TABS & FILTER MODES */}
        <div className="border-t border-zinc-800/80 pt-4 space-y-3">
          {/* FILTER MODES (ALL, BREAKING NEWS <30D, PILLARS) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              <span>Index View:</span>
            </span>
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveFilterTab('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                  activeFilterTab === 'all'
                    ? 'bg-zinc-800 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Active ({allPages.length})
              </button>
              <button
                onClick={() => setActiveFilterTab('recent')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeFilterTab === 'recent'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Breaking News</span>
              </button>
              <button
                onClick={() => setActiveFilterTab('pillars')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeFilterTab === 'pillars'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Pillar Guides</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-medium whitespace-nowrap transition cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/80 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TWO-COLUMN MAIN CONTENT: LEFT TOPICS LIST & SIDEBAR UTILITIES, RIGHT ACTIVE ARTICLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: STICKY MULTI-CARD SIDEBAR (4 COLS) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* CARD 1: TOPIC SELECTION LIST */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between px-1 border-b border-zinc-800/80 pb-2.5">
              <span className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>Intel Topics ({filteredPages.length})</span>
              </span>
              {searchQuery && (
                <span className="text-[11px] text-zinc-500 font-mono">
                  "{searchQuery}"
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {filteredPages.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl space-y-2">
                  <p>No GTA VI topics found matching your query.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-sans transition cursor-pointer"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                filteredPages.map((page) => {
                  const isSelected = activePage?.id === page.id;
                  const isCrawledNews = page.badgeText === 'MIDNIGHT AUTO-CRAWL' || (page.id && !page.id.startsWith('page-gta6-'));

                  return (
                    <div
                      key={page.id}
                      onClick={() => setActivePage(page)}
                      className={`p-3 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col gap-1.5 group ${
                        isSelected
                          ? 'bg-zinc-950 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1">
                            {getCategoryIcon(page.category)}
                            <span>{page.category}</span>
                          </span>
                          {isCrawledNews && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              LATEST INTEL
                            </span>
                          )}
                          {((page as any).isMerged || ((page as any).mergedCount && (page as any).mergedCount > 1)) && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" />
                              <span>CONSOLIDATED ({(page as any).mergedCount || 2}x)</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-sans">{page.readingTime || '4 min read'}</span>
                      </div>

                      <h3 className={`text-xs font-bold transition line-clamp-1 ${
                        isSelected ? 'text-emerald-300' : 'text-zinc-200 group-hover:text-white'
                      }`}>
                        {page.title}
                      </h3>

                      <p className="text-[10px] text-zinc-400 line-clamp-1 font-sans">
                        {page.summary}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CARD 2: QUICK CHEAT CODE DIAL & COPY TOOL */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-white">Cheat Quick-Dial</span>
              </div>
              
              {/* Platform Selector Tabs */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                {(['phone', 'ps5', 'xbox'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCheatPlatform(p)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                      cheatPlatform === p
                        ? 'bg-amber-500 text-zinc-950 shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p === 'phone' ? 'Phone' : p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {[
                {
                  name: 'Invincibility',
                  icon: '🛡️',
                  codes: {
                    phone: '1-999-PAIN-KILLER',
                    ps5: 'RIGHT, X, RIGHT, LEFT, RIGHT, R1...',
                    xbox: 'RIGHT, A, RIGHT, LEFT, RIGHT, RB...'
                  }
                },
                {
                  name: 'Max Health & Armor',
                  icon: '💚',
                  codes: {
                    phone: '1-999-TURTLE',
                    ps5: 'TRIANGLE, R1, R2, LEFT, R1...',
                    xbox: 'Y, RB, RT, LEFT, RB, LB...'
                  }
                },
                {
                  name: 'Lower Wanted Level',
                  icon: '⭐',
                  codes: {
                    phone: '1-999-LAWYERUP',
                    ps5: 'R1, R1, CIRCLE, R2, RIGHT...',
                    xbox: 'RB, RB, B, RT, RIGHT, LEFT...'
                  }
                },
                {
                  name: 'Spawn Supercar',
                  icon: '🏎️',
                  codes: {
                    phone: '1-999-COMET',
                    ps5: 'R2, L1, CIRCLE, RIGHT, L1...',
                    xbox: 'RT, LB, B, RIGHT, LB, RB...'
                  }
                }
              ].map((cheat) => {
                const codeText = cheat.codes[cheatPlatform];
                const isCopied = copiedCheatCode === cheat.name;

                return (
                  <div
                    key={cheat.name}
                    className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-2 hover:border-zinc-700 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                        <span>{cheat.icon}</span>
                        <span className="truncate">{cheat.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-amber-300/90 truncate pt-0.5">
                        {codeText}
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        const fullCode = cheatPlatform === 'phone'
                          ? cheat.codes.phone
                          : cheatPlatform === 'ps5'
                          ? 'RIGHT, X, RIGHT, LEFT, RIGHT, R1, RIGHT, LEFT, X, TRIANGLE'
                          : 'RIGHT, A, RIGHT, LEFT, RIGHT, RB, RIGHT, LEFT, A, Y';
                        await copyToClipboard(fullCode);
                        setCopiedCheatCode(cheat.name);
                        setTimeout(() => setCopiedCheatCode(null), 2000);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer shrink-0 border ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:text-white'
                      }`}
                      title="Copy Cheat Code"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 3: AI TACTICAL ADVISOR QUICK ASSISTANT */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-indigo-950/30 border border-zinc-800/80 rounded-3xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-mono font-bold text-white">AI Tactical Advisor</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-mono text-rose-300 font-bold uppercase">
                Tactical AI
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Ask about Vice City heist payouts, vehicle top speeds, or secret map locations.
            </p>

            <button
              onClick={() => onOpenAiAdvisor?.()}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch AI Tactical Assistant</span>
            </button>
          </div>

          {/* CARD 4: VICE CITY NETWORK TELEMETRY & QUICK LINKS */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-white">System Telemetry</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-0.5">
                <span className="text-zinc-500 block">News Index</span>
                <span className="text-emerald-300 font-bold block truncate">100% Indexed</span>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-0.5">
                <span className="text-zinc-500 block">Map Locations</span>
                <span className="text-rose-300 font-bold block truncate">320+ POIs</span>
              </div>
            </div>

            <div className="pt-1 flex flex-col gap-1.5">
              <button
                onClick={() => onNavigateTab?.('map')}
                className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Open Vice City Map</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              <button
                onClick={() => onNavigateTab?.('rp-servers')}
                className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                  <span>FiveM RP Server Directory</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              <button
                onClick={() => onNavigateTab?.('chat')}
                className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Community Live Chat</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MAIN INTEL ARTICLE CONTENT (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {activePage ? (
            <div id="active-article-viewport" className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl scroll-mt-24">
              {/* TOP ARTICLE TOOLBAR & METADATA */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-zinc-950 text-emerald-300 border border-zinc-800 text-xs font-mono font-medium flex items-center gap-1.5">
                    {getCategoryIcon(activePage.category)}
                    <span>{activePage.category}</span>
                  </span>
                  <span className="text-xs text-zinc-400 font-sans">
                    Updated: <strong className="text-zinc-300 font-normal">{activePage.lastUpdated ? (activePage.lastUpdated.includes('T') ? formatAutoCrawlTime(activePage.lastUpdated) : activePage.lastUpdated) : 'Recently'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyShareUrl(activePage.slug)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-sans font-medium flex items-center gap-1.5 border border-zinc-700/80 cursor-pointer transition"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{copiedUrl ? 'Copied Link' : 'Share'}</span>
                  </button>

                  <button
                    onClick={() => setShowJsonLdModal(true)}
                    className="p-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer transition"
                    title="Inspect Schema.org JSON-LD"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ARTICLE TITLE & LEAD SUMMARY */}
              <div className="space-y-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {activePage.h1}
                </h1>

                {/* LEAD SUMMARY WITH LEFT ACCENT BAR */}
                <div className="pl-4 border-l-2 border-emerald-500 text-sm sm:text-base text-zinc-300 leading-relaxed font-sans py-0.5">
                  {activePage.summary}
                </div>
              </div>

              {/* OFFICIAL 27-MINUTE "AN EXTENDED LOOK" TRAILER VIDEO SHOWCASE & EXTERNAL LINKS */}
              {(activePage.youtubeEmbedId || activePage.videoUrl || activePage.slug === 'gta6-extended-look-trailer-gameplay-breakdown' || activePage.title.toLowerCase().includes('extended look') || activePage.title.toLowerCase().includes('trailer')) && (
                <div className="bg-gradient-to-br from-zinc-950 via-rose-950/20 to-zinc-900 border border-rose-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <Tv className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <span>Grand Theft Auto VI: An Extended Look (27-Min Official Showcase)</span>
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono uppercase font-bold border border-rose-500/40 animate-pulse">
                            OFFICIAL
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Watch the full 27-minute official video trailer premiere on YouTube or stream on Netflix below.
                        </p>
                      </div>
                    </div>

                    {/* External Streaming Platform Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={activePage.videoUrl || 'https://www.youtube.com/watch?v=tJbzMqJGH4k'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md hover:scale-105 active:scale-95"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Watch on YouTube</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>

                      <a
                        href={activePage.netflixUrl || 'https://www.netflix.com/title/81742918'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-800/80 text-xs font-bold flex items-center gap-1.5 transition hover:scale-105 active:scale-95"
                      >
                        <Film className="w-3.5 h-3.5 text-red-400" />
                        <span>Stream on Netflix</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  </div>

                  {/* Responsive Embedded Player */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black shadow-inner">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${activePage.youtubeEmbedId || 'tJbzMqJGH4k'}?autoplay=0&rel=0&start=${activeVideoTimestamp}`}
                      title="GTA VI Extended Look Official Trailer Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>

                  {/* Timestamp Jump Chips */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Interactive Trailer Timestamps & Chapter Skips</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: '00:00 - Introduction & Vice City Skyline', sec: 0 },
                        { label: '04:15 - Lucia & Jason Heist Prep', sec: 255 },
                        { label: '11:05 - RDR2 Negotiation Wheel', sec: 665 },
                        { label: '16:45 - Soft-Body Vehicle Damage', sec: 1005 },
                        { label: '22:30 - Vice Port Tuner Drift Races', sec: 1350 }
                      ].map((ts) => (
                        <button
                          key={ts.sec}
                          type="button"
                          onClick={() => setActiveVideoTimestamp(ts.sec)}
                          className={`px-3 py-1 rounded-xl text-xs font-mono transition cursor-pointer border flex items-center gap-1.5 ${
                            activeVideoTimestamp === ts.sec
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                              : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border-zinc-800'
                          }`}
                        >
                          <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{ts.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TACTICAL ACTION SHORTCUTS BAR */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
                <span className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider mr-1">
                  Tactical Tools:
                </span>
                <button
                  onClick={() => onNavigateTab?.('vehicles')}
                  className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Inspect Vehicle Specs</span>
                </button>
                <button
                  onClick={() => onNavigateTab?.('map')}
                  className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-rose-300 border border-rose-500/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Open Interactive Map</span>
                </button>
                <button
                  onClick={() => onOpenAiAdvisor?.()}
                  className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI Tactical Advisor</span>
                </button>
              </div>

              {/* PRO TIP CALLOUT BANNER */}
              {activePage.proTip && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-zinc-950 border border-amber-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                      Pro Tactical Advisory
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                      {activePage.proTip}
                    </p>
                  </div>
                </div>
              )}

              {/* KEYWORD TAGS */}
              {Array.isArray(activePage.keywords) && activePage.keywords.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-zinc-500 font-sans mr-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Topics:</span>
                  </span>
                  {activePage.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-800 text-[11px] font-sans"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              )}

              {/* ARTICLE CONTENT SECTIONS */}
              <div className="space-y-8 pt-2">
                {activePage.contentSections.map((sec, idx) => (
                  <div key={idx} className="space-y-3 border-t border-zinc-800/60 pt-6">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {sec.heading}
                    </h2>

                    <div className="space-y-3 text-sm text-zinc-300 leading-relaxed font-sans">
                      {sec.body.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>

                    {/* BULLET POINTS */}
                    {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {sec.bulletPoints.map((bp, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{bp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* DATA TABLES */}
                    {sec.tableData && (
                      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/90 my-4 shadow-inner">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                          <thead>
                            <tr className="bg-zinc-900/90 border-b border-zinc-800">
                              {sec.tableData.headers.map((th, hIdx) => (
                                <th key={hIdx} className="px-4 py-3 text-xs font-mono font-bold text-emerald-300">
                                  {th}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60 text-xs font-sans text-zinc-300">
                            {sec.tableData.rows.map((rowItem: any, rIdx: number) => {
                              const rowCells: string[] = Array.isArray(rowItem)
                                ? rowItem
                                : (rowItem && typeof rowItem === 'object' && 'cells' in rowItem && Array.isArray(rowItem.cells))
                                  ? rowItem.cells
                                  : (rowItem && typeof rowItem === 'object' && 'row' in rowItem && Array.isArray(rowItem.row))
                                    ? rowItem.row
                                    : [String(rowItem || '')];
                              return (
                                <tr key={rIdx} className="hover:bg-zinc-900/40 transition">
                                  {rowCells.map((cell: any, cIdx: number) => (
                                    <td key={cIdx} className="px-4 py-3">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* FREQUENTLY ASKED QUESTIONS (FAQS) INTERACTIVE ACCORDIONS */}
              {activePage.faqs && activePage.faqs.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-zinc-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <span>Frequently Asked Questions</span>
                  </h3>

                  <div className="space-y-2">
                    {activePage.faqs.map((faq, fIdx) => {
                      const isOpen = openFaqIndices.includes(fIdx);
                      return (
                        <div
                          key={fIdx}
                          className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden transition"
                        >
                          <button
                            onClick={() => toggleFaq(fIdx)}
                            className="w-full px-4 py-3.5 flex items-center justify-between text-left gap-3 text-xs sm:text-sm font-bold text-zinc-200 hover:text-white transition cursor-pointer"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-emerald-400' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans border-t border-zinc-800/60 pt-3">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contextual Affiliate Game Deals & Gear Box in Responsive Grid Container */}
              <div className="w-full my-6 sm:my-8 px-1 sm:px-2 grid grid-cols-1 min-h-[200px] overflow-hidden transition-all">
                <GameDealsBox
                  title={`Official GTA VI Deals & Hardware for ${activePage.title || 'Leonida Wiki'}`}
                  placement="wiki_page"
                />
              </div>

              {/* WAS THIS INTEL HELPFUL? INTERACTIVE FEEDBACK BAR */}
              <div className="pt-6 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-950/90 rounded-2xl border border-zinc-800/80">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-white block">
                    Was this Vice City Intel helpful?
                  </span>
                  <span className="text-[11px] text-zinc-400 font-sans block">
                    {helpfulCount} players found this guide useful
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (helpfulVote !== 'yes') {
                        setHelpfulVote('yes');
                        setHelpfulCount((c) => c + 1);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      helpfulVote === 'yes'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>👍 Yes, Helpful</span>
                  </button>

                  <button
                    onClick={() => {
                      if (helpfulVote !== 'no') {
                        setHelpfulVote('no');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      helpfulVote === 'no'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>👎 Needs Update</span>
                  </button>
                </div>
              </div>

              {/* RELATED TOPICS / CONTINUED READING */}
              {activePage.relatedSlugs && activePage.relatedSlugs.length > 0 && (
                <div className="pt-6 border-t border-zinc-800 space-y-3">
                  <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider block">
                    Related Intel Topics
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activePage.relatedSlugs.map((slug) => {
                      const relatedPage = allPages.find((p) => p.slug === slug);
                      if (!relatedPage) return null;
                      return (
                        <button
                          key={slug}
                          onClick={() => setActivePage(relatedPage)}
                          className="p-3 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="space-y-0.5 pr-2">
                            <span className="text-[10px] font-mono text-emerald-400 block">{relatedPage.category}</span>
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white line-clamp-1">
                              {relatedPage.title}
                            </span>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 shrink-0 transition" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-zinc-500 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl">
              Select an intel topic from the left sidebar.
            </div>
          )}
        </div>
      </div>

      {/* JSON-LD SCHEMA MODAL INSPECTOR */}
      {showJsonLdModal && activePage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Schema.org JSON-LD Metadata</span>
              </h3>
              <button
                onClick={() => setShowJsonLdModal(false)}
                className="text-xs text-zinc-400 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>

            <pre className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-80">
              {JSON.stringify(
                {
                  '@context': 'https://schema.org',
                  '@type': 'Article',
                  headline: activePage.h1,
                  description: activePage.metaDescription,
                  url: `https://viceintel.app/${activePage.slug}`,
                  author: activePage.author,
                  keywords: (activePage.keywords || []).join(', ')
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* L3/L4 STAFF PASSKEY MODAL */}
      {showPasskeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Staff Passkey Authentication</span>
              </h3>
              <button
                onClick={() => {
                  setShowPasskeyModal(false);
                  setPasskeyError('');
                }}
                className="text-xs text-zinc-400 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Enter your authorized staff passkey to unlock administrative news controls:
            </p>

            <form onSubmit={handleUnlockPasskey} className="space-y-3">
              <div>
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="Enter staff passkey..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-xl text-xs text-white font-mono focus:outline-none"
                  autoFocus
                />
              </div>

              {passkeyError && (
                <div className="text-xs text-rose-400 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                  {passkeyError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Authenticate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
