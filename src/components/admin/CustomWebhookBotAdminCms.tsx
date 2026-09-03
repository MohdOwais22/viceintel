import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Radio, 
  Zap, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  Sliders, 
  FileText, 
  Car, 
  Crosshair, 
  Trophy, 
  Clock,
  Terminal,
  Activity,
  Cloud,
  CheckCheck
} from 'lucide-react';
import { 
  dispatchDiscordAlert, 
  DiscordAlertPayload, 
  WebhookLogEntry, 
  webhookDispatchHistory,
  EMBED_COLORS,
  saveWebhooksToFirestore,
  fetchWebhooksFromFirestore
} from '../../lib/discord-alert-service';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const CustomWebhookBotAdminCms: React.FC = () => {
  // Webhook URLs & Firestore Sync
  const [announcementsWebhook, setAnnouncementsWebhook] = useState<string>(() => {
    return localStorage.getItem('gtavi_discord_announcements_webhook') || '';
  });
  const [newsWebhook, setNewsWebhook] = useState<string>(() => {
    return localStorage.getItem('gtavi_discord_news_webhook') || '';
  });
  const [autoPseoBroadcast, setAutoPseoBroadcast] = useState<boolean>(true);
  const [autoBlogBroadcast, setAutoBlogBroadcast] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isFirestoreSynced, setIsFirestoreSynced] = useState<boolean>(false);
  const [lastFirestoreUpdated, setLastFirestoreUpdated] = useState<string>('');

  // Dispatch history
  const [history, setHistory] = useState<WebhookLogEntry[]>([]);
  const [isRefreshingHistory, setIsRefreshingHistory] = useState<boolean>(false);

  // Test Dispatch state
  const [isTestingAnnouncements, setIsTestingAnnouncements] = useState<boolean>(false);
  const [isTestingNews, setIsTestingNews] = useState<boolean>(false);
  const [isTriggeringAutoBlog, setIsTriggeringAutoBlog] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; channel: string } | null>(null);

  // Custom Composer State
  const [customChannel, setCustomChannel] = useState<'#announcements' | '#verified-news'>('#verified-news');
  const [customEventType, setCustomEventType] = useState<'article_drop' | 'vehicle_drop' | 'weapon_drop' | 'leak_verified' | 'tuning_challenge' | 'system_announcement'>('article_drop');
  const [customTitle, setCustomTitle] = useState<string>('Rockstar Games Newswire: Vice City Beta Roadmap & Vehicle Customization Drops');
  const [customDesc, setCustomDesc] = useState<string>('100% verified intelligence overview detailing next-generation vehicle physics, telemetry upgrades, and coastal weather simulation across Leonida.');
  const [customUrl, setCustomUrl] = useState<string>('/blog/gta-6-vice-city-beta-roadmap');
  const [customCategory, setCustomCategory] = useState<string>('Verified Intel');
  const [customTags, setCustomTags] = useState<string>('GTA6, RockstarGames, ViceCity, Leaks');
  const [customImage, setCustomImage] = useState<string>('https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80');
  const [isCustomDispatching, setIsCustomDispatching] = useState<boolean>(false);

  // Load webhooks from Firestore on mount & subscribe live
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadFirestoreConfig = async () => {
      try {
        const docRef = doc(db, 'bot_guild_configs', 'global_alerts');
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              if (data.announcementsWebhook) setAnnouncementsWebhook(data.announcementsWebhook);
              if (data.newsWebhook) setNewsWebhook(data.newsWebhook);
              if (typeof data.autoPseoBroadcast === 'boolean') setAutoPseoBroadcast(data.autoPseoBroadcast);
              if (typeof data.autoBlogBroadcast === 'boolean') setAutoBlogBroadcast(data.autoBlogBroadcast);
              if (data.updatedAt) setLastFirestoreUpdated(data.updatedAt);
              setIsFirestoreSynced(true);
            }
          }
        }, (err) => {
          console.warn('[Webhook CMS] Firestore listener note:', err);
        });
      } catch (err) {
        // Fallback fetch
        fetchWebhooksFromFirestore().then((cfg) => {
          if (cfg.announcementsWebhook) setAnnouncementsWebhook(cfg.announcementsWebhook);
          if (cfg.newsWebhook) setNewsWebhook(cfg.newsWebhook);
          if (typeof cfg.autoPseoBroadcast === 'boolean') setAutoPseoBroadcast(cfg.autoPseoBroadcast);
          if (typeof cfg.autoBlogBroadcast === 'boolean') setAutoBlogBroadcast(cfg.autoBlogBroadcast);
        });
      }
    };

    loadFirestoreConfig();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load history on mount
  const fetchHistory = async () => {
    setIsRefreshingHistory(true);
    try {
      const res = await fetch('/api/bot/history');
      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setHistory(data.history);
        }
      }
    } catch (e) {
      // fallback to memory
      setHistory([...webhookDispatchHistory]);
    } finally {
      setIsRefreshingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSaveWebhooks = async () => {
    setIsSaving(true);
    try {
      const result = await saveWebhooksToFirestore({
        announcementsWebhook: announcementsWebhook.trim(),
        newsWebhook: newsWebhook.trim(),
        autoPseoBroadcast,
        autoBlogBroadcast,
        updatedBy: 'ViceIntel_Admin'
      });

      if (result.success) {
        setIsSaved(true);
        setIsFirestoreSynced(true);
        setLastFirestoreUpdated(new Date().toISOString());
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save webhooks to Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerTest = async (channel: '#announcements' | '#verified-news', sampleType: string) => {
    if (channel === '#announcements') setIsTestingAnnouncements(true);
    else setIsTestingNews(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/bot/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          sampleType,
          customWebhookUrl: channel === '#announcements' ? announcementsWebhook : newsWebhook
        })
      });

      const data = await res.json();
      setTestResult({
        success: data.success || false,
        message: data.message || (data.success ? 'Delivered successfully to Discord!' : 'Webhook failed to send.'),
        channel
      });

      fetchHistory();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Network exception while dispatching test.',
        channel
      });
    } finally {
      if (channel === '#announcements') setIsTestingAnnouncements(false);
      else setIsTestingNews(false);
    }
  };

  const handleTriggerAutomatedBlogJob = async () => {
    setIsTriggeringAutoBlog(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/cron/auto-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'vice_midnight_cron_secret_2026'
        }
      });
      const data = await res.json();
      setTestResult({
        success: data.success !== false,
        message: data.message || (data.success ? `Generated & published "${data.article?.title || 'New Blog Article'}" and alerted Discord!` : 'Job completed.'),
        channel: '#verified-news'
      });
      fetchHistory();
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `Auto-blog trigger failed: ${e?.message || 'Network error'}`,
        channel: '#verified-news'
      });
    } finally {
      setIsTriggeringAutoBlog(false);
    }
  };

  const handleDispatchCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCustomDispatching(true);
    setTestResult(null);

    try {
      const tagsArray = customTags.split(',').map(t => t.trim()).filter(Boolean);
      const payload: DiscordAlertPayload = {
        targetChannel: customChannel,
        eventType: customEventType,
        title: customTitle,
        description: customDesc,
        url: customUrl,
        category: customCategory,
        tags: tagsArray,
        imageUrl: customImage || undefined,
        webhookUrl: customChannel === '#announcements' ? (announcementsWebhook || undefined) : (newsWebhook || undefined)
      };

      const result = await dispatchDiscordAlert(payload);
      setTestResult({
        success: result.success,
        message: result.statusText,
        channel: customChannel
      });

      fetchHistory();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to dispatch custom alert',
        channel: customChannel
      });
    } finally {
      setIsCustomDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-cyan-950/40 border border-cyan-500/30 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
                <Bot className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                Custom Webhook & API Bot Control Center
                <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Live Dispatch Relay
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Connect your Next.js backend, cron spider, or microservices to push instant real-time alerts to{' '}
              <strong className="text-amber-300">#announcements</strong> or <strong className="text-cyan-300">#verified-news</strong>{' '}
              whenever new database entries or articles drop.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHistory}
              disabled={isRefreshingHistory}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingHistory ? 'animate-spin text-cyan-400' : ''}`} />
              Refresh Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 1. Webhook Settings & 1-Click Tests | 2. Real-Time Embed Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Webhook Setup & Quick Tests (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Webhook Configuration Card */}
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                Discord Channel Webhooks
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">TLS Encrypted</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-amber-300 mb-1 flex items-center justify-between">
                  <span>#announcements Webhook URL</span>
                  <span className="text-[10px] text-zinc-500">Database Drops & Major Events</span>
                </label>
                <input
                  type="url"
                  value={announcementsWebhook}
                  onChange={(e) => setAnnouncementsWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/1234567890/abc..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950/90 border border-zinc-800 text-zinc-200 text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-cyan-300 mb-1 flex items-center justify-between">
                  <span>#verified-news Webhook URL</span>
                  <span className="text-[10px] text-zinc-500">pSEO Articles & Rockstar Leaks</span>
                </label>
                <input
                  type="url"
                  value={newsWebhook}
                  onChange={(e) => setNewsWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/1234567890/xyz..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950/90 border border-zinc-800 text-zinc-200 text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Autonomous Dispatch Toggles */}
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2">
                <div className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Autonomous Discord Broadcast Toggles
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">15-Min pSEO Spider Broadcast:</span>
                  <button
                    type="button"
                    onClick={() => setAutoPseoBroadcast(!autoPseoBroadcast)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                      autoPseoBroadcast 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}
                  >
                    {autoPseoBroadcast ? 'ENABLED (Auto)' : 'DISABLED'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px]">Automated AI Blog Drops Broadcast:</span>
                  <button
                    type="button"
                    onClick={() => setAutoBlogBroadcast(!autoBlogBroadcast)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                      autoBlogBroadcast 
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' 
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}
                  >
                    {autoBlogBroadcast ? 'ENABLED (Auto)' : 'DISABLED'}
                  </button>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Cloud className={`w-3.5 h-3.5 ${isFirestoreSynced ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  {isFirestoreSynced 
                    ? 'Cloud synced (bot_guild_configs)' 
                    : announcementsWebhook || newsWebhook ? 'Local configured' : 'Using .env webhook'}
                </span>
                <button
                  type="button"
                  onClick={handleSaveWebhooks}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : isSaved ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {isSaving ? 'Saving...' : isSaved ? 'Synced to Cloud!' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>

          {/* 1-Click Interactive Test Dispatchers */}
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              1-Click Interactive Test Relays
            </h3>
            <p className="text-xs text-zinc-400">
              Fire test payload embeds directly to Discord to verify your channel permissions and bot formatting.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleTriggerTest('#verified-news', 'article_drop')}
                disabled={isTestingNews}
                className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-left transition group min-w-0 overflow-hidden cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-cyan-200 truncate tracking-tight" title="#verified-news">#verified-news</div>
                  <div className="text-[10px] text-zinc-400 truncate">Article Drop Alert</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerTest('#announcements', 'vehicle_drop')}
                disabled={isTestingAnnouncements}
                className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/30 text-left transition group min-w-0 overflow-hidden cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-blue-200 truncate tracking-tight" title="#announcements">#announcements</div>
                  <div className="text-[10px] text-zinc-400 truncate">Vehicle Drop Alert</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerTest('#announcements', 'weapon_drop')}
                disabled={isTestingAnnouncements}
                className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/30 text-left transition group min-w-0 overflow-hidden cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-rose-200 truncate tracking-tight" title="#announcements">#announcements</div>
                  <div className="text-[10px] text-zinc-400 truncate">Weapon Drop Alert</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerTest('#announcements', 'tuning_challenge')}
                disabled={isTestingAnnouncements}
                className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/30 text-left transition group min-w-0 overflow-hidden cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-amber-200 truncate tracking-tight" title="#announcements">#announcements</div>
                  <div className="text-[10px] text-zinc-400 truncate">Championship Event</div>
                </div>
              </button>
            </div>

            {/* Autonomous Blog Generator & Discord Dispatch Trigger */}
            <div className="pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={handleTriggerAutomatedBlogJob}
                disabled={isTriggeringAutoBlog}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-950/50 via-purple-950/40 to-cyan-950/50 hover:from-pink-900/60 hover:to-cyan-900/60 border border-pink-500/40 text-pink-200 text-xs font-medium transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Sparkles className={`w-4 h-4 text-pink-400 shrink-0 ${isTriggeringAutoBlog ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-white text-xs truncate">⚡ Trigger Autonomous AI Blog Pipeline & Discord Broadcast</div>
                    <div className="text-[10px] text-zinc-400 truncate">Generates full article via Gemini cascade, saves to cloud database, & alerts #verified-news</div>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 font-mono font-bold border border-pink-500/30">
                  {isTriggeringAutoBlog ? 'Generating...' : 'Run Now'}
                </span>
              </button>
            </div>

            {/* Test Status Banner */}
            {testResult && (
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <div className="font-semibold">{testResult.channel}: {testResult.success ? 'Dispatch Success' : 'Dispatch Failed'}</div>
                  <div className="text-[11px] opacity-90">{testResult.message}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Custom Live Embed Composer & Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-magenta-400 text-pink-400" />
                Custom Alert Composer & Live Discord Embed Preview
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                WYSIWYG Embed
              </span>
            </div>

            <form onSubmit={handleDispatchCustom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Target Discord Channel</label>
                  <select
                    value={customChannel}
                    onChange={(e) => setCustomChannel(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="#verified-news">#verified-news (Rockstar Intel & Guides)</option>
                    <option value="#announcements">#announcements (Database Drops & Events)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Event Type</label>
                  <select
                    value={customEventType}
                    onChange={(e) => setCustomEventType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="article_drop">Article / News Drop</option>
                    <option value="vehicle_drop">Vehicle Database Drop</option>
                    <option value="weapon_drop">Weapon Database Drop</option>
                    <option value="leak_verified">100% Verified Leak</option>
                    <option value="tuning_challenge">Tuning Championship</option>
                    <option value="system_announcement">System Announcement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Alert Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. 🏎️ New Vehicle Drop: Grotti Cheetah Classic"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                  placeholder="Provide brief telemetry or article context..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Category Label</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Supercar Database"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Portal Deep-Link Path</label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. /vehicles or /blog/guide"
                  />
                </div>
              </div>

              {/* LIVE DISCORD EMBED PREVIEW */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  Live Discord Client Embed Preview ({customChannel})
                </div>

                <div className="rounded-xl bg-[#2B2D31] p-4 text-zinc-200 font-sans shadow-xl border border-zinc-800/80">
                  {/* Bot header */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=64&q=80" 
                      alt="Bot Avatar" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white text-xs">ViceIntel Bot</span>
                        <span className="px-1 py-0.2 text-[9px] rounded bg-[#5865F2] text-white font-bold uppercase tracking-wider">
                          BOT
                        </span>
                        <span className="text-[10px] text-zinc-400 ml-1">Today at 12:00 AM</span>
                      </div>
                    </div>
                  </div>

                  {/* Embed Container */}
                  <div className={`rounded-r-md border-l-4 bg-[#1E1F22] p-3 space-y-2 text-xs ${
                    customChannel === '#verified-news' ? 'border-cyan-500' : 'border-pink-500'
                  }`}>
                    {/* Author line */}
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>GTA VI Central • Verified Intel Network</span>
                    </div>

                    {/* Title */}
                    <a href="#preview" className="block text-sm font-bold text-cyan-300 hover:underline">
                      {customTitle || 'Alert Title Placeholder'}
                    </a>

                    {/* Description */}
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      {customDesc || 'Alert description will appear here...'}
                    </p>

                    {/* Fields */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/60">
                        <div className="text-[10px] text-zinc-400 font-semibold">📂 Category</div>
                        <div className="text-xs text-zinc-200 font-mono">`{customCategory || 'Intel'}`</div>
                      </div>
                      <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/60">
                        <div className="text-[10px] text-zinc-400 font-semibold">🔗 Access Intel</div>
                        <div className="text-xs text-cyan-400 hover:underline cursor-pointer flex items-center gap-1">
                          Open in ViceIntel Portal <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 text-[10px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/50">
                      <span>ViceIntel Automated Discord Webhook Relay</span>
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isCustomDispatching}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition"
                >
                  <Send className={`w-4 h-4 ${isCustomDispatching ? 'animate-pulse' : ''}`} />
                  {isCustomDispatching ? 'Dispatching to Discord...' : `🚀 Push Alert to ${customChannel}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Real-time Dispatch Telemetry Feed */}
      <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Recent Discord Alert Dispatch History</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
              {history.length} Events Logged
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">Live In-Memory Buffer</span>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No webhook alerts recorded in current session. Trigger a 1-click test alert above to verify delivery.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Target Channel</th>
                  <th className="pb-2">Event Title</th>
                  <th className="pb-2">Relay Webhook</th>
                  <th className="pb-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        log.success 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {log.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.success ? 'Delivered' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-cyan-300 text-[11px]">{log.targetChannel}</td>
                    <td className="py-2.5 text-zinc-200 font-medium max-w-xs truncate">{log.title}</td>
                    <td className="py-2.5 font-mono text-zinc-500 text-[10px]">{log.webhookUsed}</td>
                    <td className="py-2.5 text-zinc-400 text-[11px]">{new Date(log.dispatchedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
