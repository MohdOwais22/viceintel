import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  TrendingUp,
  Video,
  MessageSquare,
  Radio,
  FileCode,
  Copy,
  Check,
  Globe,
  Server,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  Download,
  Flame,
  Zap,
  Target,
  BarChart3,
  Award,
  Lock,
  RefreshCw,
  Trash2,
  Bookmark,
  Share2,
  FileText,
  AlertCircle,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  KeywordMetric,
  ViralVideoScript,
  RedditCampaignPost,
  DiscordEmbedPayload,
  StreamerPitchKit,
  PseoMatrixEntry,
  MarketingCampaign,
  discoverKeywords,
  generateViralVideoStoryboards,
  generateRedditLaunchPost,
  generateDiscordAnnouncementEmbed,
  generateStreamerOutreachKit,
  generatePseoMatrixDataset,
  saveMarketingCampaignToFirestore,
  fetchMarketingCampaignsFromFirestore,
  deleteMarketingCampaignFromFirestore
} from '../../lib/marketing-engine';
import { resolveMarketingTier, verifyMarketingAccess, MarketingTier } from '../../lib/marketing-auth';
import { copyToClipboard } from '../../lib/copyUtils';
import { CampaignVisualizerModal } from './CampaignVisualizerModal';
import { CampaignVisualizer } from './CampaignVisualizer';
import { CreatorOutreachHub } from './CreatorOutreachHub';
import { generateCampaignPdf } from '../../lib/pdfGenerator';

interface MarketingWorkspaceProps {
  initialScope?: 'internal_platform' | 'client_server';
  lockScope?: boolean;
  serverSlug?: string;
  serverName?: string;
  userTier?: MarketingTier | string;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
  } | null;
  onUpgradeClick?: () => void;
  onNavigate?: (tab: string, slug?: string) => void;
}

export const MarketingWorkspace: React.FC<MarketingWorkspaceProps> = ({
  initialScope = 'client_server',
  lockScope,
  serverSlug = 'vice-city-life-rp',
  serverName = 'Vice City Life RP',
  userTier = 'pro',
  currentUser,
  onUpgradeClick,
  onNavigate
}) => {
  // Mode Switcher State: Platform vs. Server Mode
  const isScopeLocked = lockScope !== undefined ? lockScope : (initialScope === 'client_server' && !currentUser?.isAdmin && !currentUser?.isStaff);
  const [scope, setScope] = useState<'internal_platform' | 'client_server'>(isScopeLocked ? 'client_server' : initialScope);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'keywords' | 'videos' | 'social_launch' | 'streamer_pitch' | 'pseo_matrix' | 'saved_campaigns'>('visualizer');

  // Input States
  const [keywordQuery, setKeywordQuery] = useState<string>('');
  const [topicInput, setTopicInput] = useState<string>(
    scope === 'internal_platform' ? 'GTA 6 Interactive Radar Map & Handling Meta' : `${serverName} 2026 Season Launch & Fast Whitelist`
  );
  const [selectedSubreddit, setSelectedSubreddit] = useState<string>(scope === 'internal_platform' ? 'r/GTA6' : 'r/FiveMServers');
  const [streamerHandle, setStreamerHandle] = useState<string>('Summit1g');
  const [creatorTier, setCreatorTier] = useState<'Nano (1k-10k)' | 'Micro (10k-50k)' | 'Partner / Macro (50k-500k+)'>('Micro (10k-50k)');

  // Output States
  const [keywordsList, setKeywordsList] = useState<KeywordMetric[]>([]);
  const [isSearchingKeywords, setIsSearchingKeywords] = useState<boolean>(false);
  const [videoScripts, setVideoScripts] = useState<ViralVideoScript[]>([]);
  const [redditPost, setRedditPost] = useState<RedditCampaignPost | null>(null);
  const [discordEmbed, setDiscordEmbed] = useState<DiscordEmbedPayload | null>(null);
  const [streamerPitch, setStreamerPitch] = useState<StreamerPitchKit | null>(null);
  const [pseoMatrix, setPseoMatrix] = useState<PseoMatrixEntry[]>([]);
  const [xmlSitemap, setXmlSitemap] = useState<string>('');
  const [savedCampaigns, setSavedCampaigns] = useState<MarketingCampaign[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState<boolean>(true);
  const [selectedCampaignForVisualizer, setSelectedCampaignForVisualizer] = useState<MarketingCampaign | null>(null);
  const [pendingDeleteCampaign, setPendingDeleteCampaign] = useState<MarketingCampaign | null>(null);

  // Generation & Copy Feedback States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Resolved Tier Capabilities
  const tierCapabilities = resolveMarketingTier({
    isAdmin: currentUser?.isAdmin,
    isStaff: currentUser?.isStaff,
    serverTier: userTier
  });

  // Hydrate Initial Seed Data & Saved Campaigns on Mount
  useEffect(() => {
    handleSearchKeywords('');
    loadSavedCampaigns();
  }, [scope]);

  const loadSavedCampaigns = async () => {
    setIsLoadingVault(true);
    try {
      const campaigns = await fetchMarketingCampaignsFromFirestore({
        scope: scope === 'internal_platform' ? 'internal_platform' : 'client_server',
        serverId: scope === 'client_server' ? serverSlug : undefined
      });
      setSavedCampaigns(campaigns);
    } catch (err) {
      console.warn('Notice: Failed to fetch saved campaigns:', err);
    } finally {
      setIsLoadingVault(false);
    }
  };

  const constructCurrentWorkspaceCampaign = (): MarketingCampaign => {
    return {
      id: `current_${Date.now()}`,
      scope: scope === 'internal_platform' ? 'internal_platform' : 'client_server',
      serverId: scope === 'client_server' ? serverSlug : undefined,
      ownerDiscordId: currentUser?.uid || 'guest',
      targetDomain: scope === 'internal_platform' ? 'vicecitycentral.com' : `https://vicecitycentral.com/servers/${serverSlug}`,
      niche: scope === 'internal_platform' ? 'gtavi_portal' : 'fivem_rp',
      keywords: keywordsList.map((k) => ({
        term: k.term,
        volumeEst: k.volumeEst,
        difficulty: k.difficulty,
        intent: k.intent
      })),
      generatedAssets: {
        videoScripts: videoScripts.map((s) => ({ hook: s.hook, scenes: s.scenes, cta: s.cta })),
        detailedVideoScripts: videoScripts,
        redditPost: redditPost ? { title: redditPost.title, body: redditPost.body, targetSubreddit: redditPost.targetSubreddit } : undefined,
        discordEmbed: discordEmbed ? { title: discordEmbed.title, description: discordEmbed.description, fields: discordEmbed.fields } : undefined,
        streamerPitch: streamerPitch ? { creatorTier: streamerPitch.creatorTier, pitchEmail: streamerPitch.pitchEmail, terms: streamerPitch.terms } : undefined,
        pseoMatrixPreview: pseoMatrix
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  };

  const handleCopy = async (text: string, keyId: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleSearchKeywords = async (queryText: string) => {
    setIsSearchingKeywords(true);
    try {
      const resp = await fetch('/api/marketing/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          scope,
          niche: scope === 'internal_platform' ? 'gtavi_portal' : 'fivem_rp',
          serverName,
          userTier: tierCapabilities.tier
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.keywords) && data.keywords.length > 0) {
          setKeywordsList(data.keywords);
          setIsSearchingKeywords(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Live keyword API fallback to local discovery heuristics:', err);
    }

    // Fallback to local heuristic seed algorithm
    const results = discoverKeywords(
      queryText,
      scope,
      scope === 'internal_platform' ? 'gtavi_portal' : 'fivem_rp'
    );
    setKeywordsList(results);
    setIsSearchingKeywords(false);
  };

  const handleGenerateFullSuite = async () => {
    const accessCheck = verifyMarketingAccess(tierCapabilities, 'campaign_draft', 0);
    if (!accessCheck.allowed) {
      setStatusMessage({ text: accessCheck.reason || 'Upgrade required.', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const currentBrand = scope === 'internal_platform' ? 'Vice City Central' : serverName;
      const targetDomain = scope === 'internal_platform' ? 'https://vicecitycentral.com' : `https://vicecitycentral.com/servers/${serverSlug}`;
      const niche = scope === 'internal_platform' ? 'gtavi_portal' : 'fivem_rp';

      // 1. Attempt Live Gemini API generation via backend route
      try {
        const apiResp = await fetch('/api/marketing/campaigns/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicInput,
            scope,
            niche,
            serverId: serverSlug,
            serverName: currentBrand,
            targetDomain,
            selectedSubreddit,
            creatorTier,
            streamerHandle,
            userTier: tierCapabilities.tier,
            ownerDiscordId: currentUser?.uid || '123456789'
          })
        });

        if (apiResp.ok) {
          const apiData = await apiResp.json();
          if (apiData.success && apiData.campaign) {
            const camp: MarketingCampaign = apiData.campaign;
            if (camp.generatedAssets.detailedVideoScripts) {
              setVideoScripts(camp.generatedAssets.detailedVideoScripts);
            }
            if (camp.generatedAssets.redditPost) {
              setRedditPost({
                title: camp.generatedAssets.redditPost.title,
                body: camp.generatedAssets.redditPost.body,
                targetSubreddit: camp.generatedAssets.redditPost.targetSubreddit || selectedSubreddit,
                spamFilterSafeguards: camp.generatedAssets.redditPost.spamFilterSafeguards || [
                  'Organic storytelling style to prevent auto-moderator triggers',
                  'No banned URL shorteners or direct redirects',
                  'Disclosed server affiliation and transparent community rules'
                ],
                recommendedPostingTime: camp.generatedAssets.redditPost.recommendedPostingTime || 'Friday 5:00 PM EST',
                postFlair: camp.generatedAssets.redditPost.postFlair || 'Server Showcase'
              });
            }
            if (camp.generatedAssets.discordEmbed) {
              setDiscordEmbed({
                ...camp.generatedAssets.discordEmbed,
                colorHex: camp.generatedAssets.discordEmbed.colorHex || '#ec4899',
                footerText: camp.generatedAssets.discordEmbed.footerText || `${currentBrand} • 2026`,
                timestamp: camp.generatedAssets.discordEmbed.timestamp || new Date().toISOString(),
                actionButtons: Array.isArray(camp.generatedAssets.discordEmbed.actionButtons) && camp.generatedAssets.discordEmbed.actionButtons.length > 0
                  ? camp.generatedAssets.discordEmbed.actionButtons
                  : [
                      { label: '🚀 Apply for Whitelist', url: `${targetDomain}/apply`, style: 'primary' }
                    ]
              });
            }
            if (camp.generatedAssets.streamerPitch) {
              setStreamerPitch({
                creatorTier: (camp.generatedAssets.streamerPitch.creatorTier || creatorTier) as any,
                streamerNamePlaceholder: streamerHandle,
                pitchEmail: camp.generatedAssets.streamerPitch.pitchEmail,
                streamRulesAgreement: 'No stream-sniping guaranteed & dedicated staff.',
                terms: camp.generatedAssets.streamerPitch.terms,
                suggestedPerkPackage: {
                  vipClearance: 'Tier 4 Creator Pass',
                  customInGameBusiness: 'Custom Nightclub',
                  priorityQueueTier: 'Instant Connect',
                  affiliateRevenueShare: '30%'
                }
              });
            }
            if (camp.generatedAssets.pseoMatrixPreview) {
              setPseoMatrix(camp.generatedAssets.pseoMatrixPreview);
            }

            await loadSavedCampaigns();
            setStatusMessage({ text: 'Marketing suite synthesized successfully and synchronized with Cloud Firestore!', type: 'success' });
            setIsGenerating(false);
            return;
          }
        }
      } catch (liveApiErr) {
        console.warn('Notice: Gemini API route error, using local generator fallback:', liveApiErr);
      }

      // Local heuristic fallback generator
      const scripts = generateViralVideoStoryboards({
        topic: topicInput,
        niche,
        serverName: currentBrand
      });
      setVideoScripts(scripts);

      const reddit = generateRedditLaunchPost({
        topic: topicInput,
        niche,
        serverName: currentBrand,
        targetSubreddit: selectedSubreddit
      });
      setRedditPost(reddit);

      const discord = generateDiscordAnnouncementEmbed({
        title: `${currentBrand} — Major 2026 Update & Whitelist Open`,
        description: `Experience high-fps physics, fast-track AI whitelist screening, and custom verified assets.`,
        serverName: currentBrand,
        ctaUrl: `${targetDomain}/apply`
      });
      setDiscordEmbed(discord);

      const pitch = generateStreamerOutreachKit({
        creatorTier,
        serverName: currentBrand,
        streamerHandle
      });
      setStreamerPitch(pitch);

      const pseo = generatePseoMatrixDataset({
        niche,
        targetDomain,
        scope,
        serverSlug
      });
      setPseoMatrix(pseo.matrix);
      setXmlSitemap(pseo.xmlSitemap);

      const newCampaign: MarketingCampaign = {
        id: `campaign_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        scope,
        serverId: scope === 'client_server' ? serverSlug : undefined,
        ownerDiscordId: currentUser?.uid || '123456789',
        targetDomain,
        niche,
        keywords: keywordsList.slice(0, 5).map((k) => ({
          term: k.term,
          volumeEst: k.volumeEst,
          difficulty: k.difficulty,
          intent: k.intent
        })),
        generatedAssets: {
          videoScripts: scripts.map((s) => ({ hook: s.hook, scenes: s.scenes, cta: s.cta })),
          detailedVideoScripts: scripts,
          redditPost: { title: reddit.title, body: reddit.body, targetSubreddit: reddit.targetSubreddit },
          discordEmbed: { title: discord.title, description: discord.description, fields: discord.fields },
          streamerPitch: { creatorTier: pitch.creatorTier, pitchEmail: pitch.pitchEmail, terms: pitch.terms },
          pseoMatrixPreview: pseo.matrix
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await saveMarketingCampaignToFirestore(newCampaign);
      await loadSavedCampaigns();

      setStatusMessage({ text: 'Marketing campaign & assets generated and saved to Cloud Firestore!', type: 'success' });
    } catch (err: any) {
      console.error('Generation failed:', err);
      setStatusMessage({ text: err?.message || 'Failed to synthesize campaign assets.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCampaign = (idOrCampaign: string | MarketingCampaign) => {
    if (!idOrCampaign) return;
    if (typeof idOrCampaign === 'string') {
      const found = savedCampaigns.find((c) => c.id === idOrCampaign) ||
        (selectedCampaignForVisualizer?.id === idOrCampaign ? selectedCampaignForVisualizer : null);
      if (found) {
        setPendingDeleteCampaign(found);
      } else {
        setPendingDeleteCampaign({
          id: idOrCampaign,
          targetDomain: 'Selected Campaign Strategy',
        } as MarketingCampaign);
      }
    } else {
      setPendingDeleteCampaign(idOrCampaign);
    }
  };

  const confirmDeleteCampaign = async (campaignId: string) => {
    if (!campaignId) return;
    setPendingDeleteCampaign(null);

    // Keep snapshot for rollback if network fails
    const previousCampaigns = [...savedCampaigns];

    // Optimistically update UI state immediately
    setSavedCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    if (selectedCampaignForVisualizer?.id === campaignId) {
      setSelectedCampaignForVisualizer(null);
    }

    try {
      // Direct deleteDoc call to marketing_campaigns collection in Firestore
      const docRef = doc(db, 'marketing_campaigns', campaignId);
      await deleteDoc(docRef);

      setStatusMessage({ text: 'Campaign strategy permanently deleted from marketing_campaigns.', type: 'info' });
    } catch (err) {
      console.error('Failed to delete campaign document from Firestore:', err);
      // Rollback UI state if delete failed
      setSavedCampaigns(previousCampaigns);
      setStatusMessage({ text: 'Failed to delete campaign strategy from Firestore.', type: 'error' });
    }
  };

  const handleDownloadSitemap = () => {
    if (!xmlSitemap) return;
    const blob = new Blob([xmlSitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitemap-${scope === 'internal_platform' ? 'platform' : serverSlug}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6 text-zinc-100">
      {/* Header Banner & Scope Switcher */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/40 text-fuchsia-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {isScopeLocked || scope === 'client_server' ? 'SERVER STUDIO GROWTH' : 'SENTINEL GROWTH ENGINE'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                Tier: <strong className="text-emerald-400 uppercase">{tierCapabilities.label}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              {isScopeLocked || scope === 'client_server'
                ? 'Server Studio Marketing & Growth Engine'
                : 'Dual-Mode Marketing & SEO Studio'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              {isScopeLocked || scope === 'client_server'
                ? 'Scale your FiveM / GTA VI RP player base, synthesize viral TikTok & YouTube Shorts hooks, launch anti-spam Reddit threads, and automate Twitch/Kick creator sponsorship kits.'
                : 'Scale organic search traffic, synthesize viral short-form video storyboards, launch anti-spam Reddit campaigns, and automate Twitch/Kick streamer outreach.'}
            </p>
          </div>

          {/* Scope Switcher: Only render if not locked to Server Studio */}
          {!isScopeLocked && (
            <div className="flex items-center p-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-md shadow-lg shrink-0">
              <button
                type="button"
                onClick={() => {
                  setScope('client_server');
                  setTopicInput(`${serverName} 2026 Season Launch & Fast Whitelist`);
                  setSelectedSubreddit('r/FiveMServers');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scope === 'client_server'
                    ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>B2B Server Studio</span>
                {scope === 'client_server' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setScope('internal_platform');
                  setTopicInput('GTA 6 Interactive Radar Map & Handling Meta');
                  setSelectedSubreddit('r/GTA6');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scope === 'internal_platform'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Platform Engine</span>
                {scope === 'internal_platform' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            </div>
          )}
        </div>

        {/* Global Action Bar */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3 bg-zinc-900/90 border border-zinc-700/60 rounded-xl px-3 py-2">
            <Target className="w-4 h-4 text-fuchsia-400 shrink-0" />
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Campaign topic (e.g. Fast Whitelist, Everglades Radar Coordinates)..."
              className="bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateFullSuite}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-500 hover:from-fuchsia-400 hover:to-cyan-400 text-zinc-950 shadow-lg shadow-fuchsia-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Synthesizing Strategy Matrix...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-zinc-950 fill-zinc-950" />
                <span>Generate Full Marketing Suite</span>
              </>
            )}
          </button>
        </div>

        {/* Status Message Notification */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
            {statusMessage.type === 'error' && onUpgradeClick && (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="px-3 py-1 rounded bg-rose-500 text-white font-bold text-[11px] hover:bg-rose-400 cursor-pointer"
              >
                Upgrade Tier
              </button>
            )}
          </div>
        )}
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin border-b border-zinc-800">
        {[
          { id: 'visualizer', label: 'Platform Mockups', icon: Eye, badge: 'Live Preview' },
          { id: 'keywords', label: 'Keyword Discovery & SERP', icon: Search, badge: `${keywordsList.length} Found` },
          { id: 'videos', label: 'Viral Video Studio (Shorts/TikTok)', icon: Video, badge: videoScripts.length > 0 ? `${videoScripts.length} Ready` : undefined },
          { id: 'social_launch', label: 'Reddit & Discord Copy', icon: MessageSquare, badge: redditPost ? 'Synthesized' : undefined },
          { id: 'streamer_pitch', label: 'Streamer Outreach Kit', icon: Radio, locked: !tierCapabilities.canGenerateStreamerPitchKits },
          { id: 'pseo_matrix', label: 'pSEO Matrix & Sitemap', icon: FileCode, locked: !tierCapabilities.canExportPseoMatrix },
          { id: 'saved_campaigns', label: 'Campaigns Vault', icon: Bookmark, badge: `${savedCampaigns.length}` }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-fuchsia-400' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
              {tab.locked && <Lock className="w-3 h-3 text-amber-400" />}
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <AnimatePresence mode="wait">
        {/* 0. PLATFORM LIVE MOCKUPS VISUALIZER */}
        {activeTab === 'visualizer' && (
          <motion.div
            key="tab_visualizer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <CampaignVisualizer
              videoScripts={videoScripts}
              redditPost={redditPost || undefined}
              discordEmbed={discordEmbed || undefined}
              targetDomain={scope === 'internal_platform' ? 'vicecitycentral.com' : `vicecitycentral.com/servers/${serverSlug}`}
            />
          </motion.div>
        )}

        {/* 1. KEYWORD RESEARCH & SERP BENCHMARKING */}
        {activeTab === 'keywords' && (
          <motion.div
            key="tab_keywords"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Search Filter Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={keywordQuery}
                  onChange={(e) => {
                    setKeywordQuery(e.target.value);
                    handleSearchKeywords(e.target.value);
                  }}
                  placeholder="Filter keywords (e.g. radar, whitelist, TTK)..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Quick Filters:</span>
                {['All', 'Transactional', 'Informational', 'Navigational'].map((intentFilter) => (
                  <button
                    key={intentFilter}
                    type="button"
                    onClick={() => {
                      if (intentFilter === 'All') handleSearchKeywords('');
                      else handleSearchKeywords(intentFilter.toLowerCase());
                    }}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition text-[11px] cursor-pointer"
                  >
                    {intentFilter}
                  </button>
                ))}
              </div>
            </div>

            {/* Keyword Table */}
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900/90 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Search Term</th>
                    <th className="px-4 py-3">Est. Monthly Volume</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Search Intent</th>
                    <th className="px-4 py-3">Est. CPC</th>
                    <th className="px-4 py-3">Trend</th>
                    <th className="px-4 py-3">Top SERP Competitors</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-sans">
                  {isSearchingKeywords || isGenerating ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`kw_skel_${idx}`} className="animate-pulse bg-zinc-950/40">
                        <td className="px-4 py-3.5">
                          <div className="h-3.5 bg-zinc-800/80 rounded w-48 mb-1.5" />
                          <div className="h-2.5 bg-zinc-800/40 rounded w-32" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-3.5 bg-zinc-800/80 rounded w-20" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-5 bg-zinc-800/70 rounded-md w-16" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-5 bg-zinc-800/70 rounded-md w-24" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-3.5 bg-zinc-800/80 rounded w-12" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="h-3.5 bg-zinc-800/80 rounded w-12" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1">
                            <div className="h-4 bg-zinc-800/60 rounded w-14" />
                            <div className="h-4 bg-zinc-800/60 rounded w-14" />
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="h-6 bg-zinc-800/80 rounded-lg w-16 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : keywordsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-zinc-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search className="w-8 h-8 text-zinc-600 mb-1" />
                          <span className="font-semibold text-white text-sm">No keywords found matching query</span>
                          <span className="text-xs text-zinc-500">Try clearing your search query or selecting a quick filter above.</span>
                          <button
                            type="button"
                            onClick={() => {
                              setKeywordQuery('');
                              handleSearchKeywords('');
                            }}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition cursor-pointer"
                          >
                            Reset Keyword Search
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    keywordsList.map((kw, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/50 transition">
                        <td className="px-4 py-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{kw.term}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{kw.suggestedAction}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-zinc-200">
                          {kw.volumeEst.toLocaleString()} /mo
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                kw.difficulty === 'Low'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : kw.difficulty === 'Medium'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {kw.difficulty} ({kw.difficultyScore})
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              kw.intent === 'Transactional'
                                ? 'bg-fuchsia-500/20 text-fuchsia-300'
                                : kw.intent === 'Navigational'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {kw.intent}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-300">{kw.cpcEst}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400 font-bold">{kw.searchTrend}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(kw.topCompetitors || []).map((c, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopy(kw.term, `kw_${idx}`)}
                            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition text-[11px] cursor-pointer inline-flex items-center gap-1"
                          >
                            {copiedKey === `kw_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* 2. VIRAL VIDEO STUDIO */}
        {activeTab === 'videos' && (
          <motion.div
            key="tab_videos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {videoScripts.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800">
                <Video className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Video Scripts Synthesized Yet</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                  Click the <strong>Generate Full Marketing Suite</strong> button above to produce high-retention scene-by-scene TikTok and YouTube Shorts scripts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {videoScripts.map((script, idx) => (
                  <div
                    key={script.id}
                    className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                          {script.targetPlatform} ({script.durationSeconds}s)
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">Formula: {script.retentionFormula}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `HOOK: ${script.hook}\n\nSCENES:\n${(script.detailedScenes || [])
                              .map((s) => `[${s.timeframe}] Visual: ${s.visualCue}\nVoiceover: "${s.audioVoiceover}"\nText: ${s.onScreenText}`)
                              .join('\n\n')}\n\nCTA: ${script.cta}`,
                            `vid_${idx}`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedKey === `vid_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Teleprompter Script</span>
                      </button>
                    </div>

                    {/* Hook Box */}
                    <div className="p-3.5 rounded-xl bg-fuchsia-950/30 border border-fuchsia-500/30 text-white text-xs">
                      <strong className="text-fuchsia-300 uppercase tracking-wide block text-[10px] mb-1">
                        🎯 0:00 - 0:03 Pattern Interrupt Hook:
                      </strong>
                      <span className="font-semibold text-sm italic leading-snug">"{script.hook}"</span>
                    </div>

                    {/* Scene Breakdown */}
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Scene-by-Scene Visual & Audio Cues</h4>
                      {(script.detailedScenes || []).map((scene, sIdx) => (
                        <div key={sIdx} className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-cyan-400">{scene.timeframe}</span>
                            <span className="font-mono text-zinc-500 text-[10px]">Overlay: {scene.onScreenText}</span>
                          </div>
                          <div className="text-zinc-300 text-[11px]">
                            <strong className="text-zinc-400">Visual:</strong> {scene.visualCue}
                          </div>
                          <div className="text-zinc-200 text-[11px]">
                            <strong className="text-emerald-400">Voiceover:</strong> "{scene.audioVoiceover}"
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Audio & Hashtags */}
                    <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                      <div>🎵 Recommended Sound: <strong className="text-zinc-200">{script.recommendedAudio}</strong></div>
                      <div className="flex flex-wrap gap-1">
                        {(script.hashtagStrategy || []).map((h, i) => (
                          <span key={i} className="text-cyan-400">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* 3. SOCIAL LAUNCH HUB (REDDIT & DISCORD) */}
        {activeTab === 'social_launch' && (
          <motion.div
            key="tab_social"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Reddit Post Formatter */}
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold text-white text-sm">Reddit Launch Campaign</h3>
                </div>
                {redditPost && (
                  <button
                    type="button"
                    onClick={() => handleCopy(`${redditPost.title}\n\n${redditPost.body}`, 'reddit_copy')}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'reddit_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Markdown Post</span>
                  </button>
                )}
              </div>

              {redditPost ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Target Subreddit: {redditPost.targetSubreddit}</span>
                    <strong className="text-white text-sm block">{redditPost.title}</strong>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap font-mono max-h-72 overflow-y-auto leading-relaxed">
                    {redditPost.body}
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
                    <strong className="block text-emerald-400">🛡️ Anti-Spam Filter Safeguards:</strong>
                    {(redditPost.spamFilterSafeguards || [
                      'Organic storytelling style to prevent auto-moderator triggers',
                      'No banned URL shorteners or direct redirects',
                      'Disclosed server affiliation and transparent community rules'
                    ]).map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Click Generate Full Suite to synthesize your anti-spam Reddit post.</p>
              )}
            </div>

            {/* Discord Embed Simulator */}
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">Discord Announcement Embed</h3>
                </div>
                {discordEmbed && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `**${discordEmbed.title}**\n\n${discordEmbed.description}\n\n${Object.entries(discordEmbed.fields)
                          .map(([k, v]) => `**${k}**\n${v}`)
                          .join('\n\n')}`,
                        'discord_copy'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'discord_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Discord Markdown</span>
                  </button>
                )}
              </div>

              {discordEmbed ? (
                <div className="p-4 rounded-xl bg-[#2B2D31] border-l-4 border-pink-500 text-zinc-200 text-xs space-y-3 font-sans shadow-inner">
                  <div>
                    <h4 className="text-white font-bold text-sm">{discordEmbed.title}</h4>
                    <p className="text-zinc-300 text-xs mt-1">{discordEmbed.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-700/50">
                    {Object.entries(discordEmbed.fields).map(([label, val], idx) => (
                      <div key={idx} className="space-y-0.5">
                        <span className="font-bold text-white text-[11px]">{label}</span>
                        <p className="text-zinc-300 text-[11px]">{val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-[10px] text-zinc-400 flex items-center justify-between border-t border-zinc-700/50">
                    <span>{discordEmbed.footerText}</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>

                  {/* Buttons simulator */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(discordEmbed.actionButtons || []).map((btn, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded bg-[#4E5058] hover:bg-[#6D6F78] text-white font-semibold text-[11px] cursor-pointer"
                      >
                        {btn.label} ↗
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Click Generate Full Suite to render live Discord embed.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* 4. STREAMER OUTREACH & PITCH KIT */}
        {activeTab === 'streamer_pitch' && (
          <motion.div
            key="tab_streamer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {!tierCapabilities.canGenerateStreamerPitchKits ? (
              <div className="p-12 text-center rounded-2xl bg-zinc-950/80 border border-amber-500/30">
                <Lock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">Streamer Sponsorship Studio is Gated (Mega Tier)</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-2">
                  Streamer pitch kits, VIP priority queue agreements, and Twitch/Kick outreach email generators are available exclusively on the <strong>Mega Tier ($199/mo)</strong> or for Platform Admins.
                </p>
                {onUpgradeClick && (
                  <button
                    type="button"
                    onClick={onUpgradeClick}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-xs hover:opacity-90 transition cursor-pointer"
                  >
                    Upgrade to Mega Tier ($199/mo)
                  </button>
                )}
              </div>
            ) : (
              <CreatorOutreachHub
                serverName={serverName}
                serverSlug={serverSlug}
                currentUser={currentUser}
                onUpgradeClick={onUpgradeClick}
              />
            )}
          </motion.div>
        )}

        {/* 5. pSEO MATRIX & SITEMAP GENERATOR */}
        {activeTab === 'pseo_matrix' && (
          <motion.div
            key="tab_pseo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-cyan-400" />
                    Programmatic SEO (pSEO) Matrix & Dynamic XML Sitemap
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Synthesize bulk programmatic pages with structured Schema.org metadata and verify search engine index readiness.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {xmlSitemap && (
                    <button
                      type="button"
                      onClick={handleDownloadSitemap}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download sitemap.xml</span>
                    </button>
                  )}
                  {pseoMatrix.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(pseoMatrix, null, 2), 'pseo_matrix_json')}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'pseo_matrix_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Matrix JSON</span>
                    </button>
                  )}
                </div>
              </div>

              {pseoMatrix.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Generated Pages List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Target pSEO Landing Pages</h4>
                    {pseoMatrix.map((page, pIdx) => (
                      <div key={pIdx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-white font-bold text-sm">{page.metaTitle}</strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Readiness: {page.indexReadinessScore}%
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[11px]">{page.metaDescription}</p>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-900 font-mono">
                          <span>URL: {page.canonicalUrl}</span>
                          <span>Est. Visits: {page.estimatedMonthlyVisits.toLocaleString()}/mo</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic XML Sitemap View */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Dynamic XML Sitemap Preview</h4>
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px] whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                      {xmlSitemap}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Click Generate Full Suite to compile your pSEO matrix.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* 6. SAVED CAMPAIGNS VAULT */}
        {activeTab === 'saved_campaigns' && (
          <motion.div
            key="tab_vault"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div>
                <h3 className="font-bold text-white text-sm">Campaigns Cloud Vault</h3>
                <p className="text-xs text-zinc-400">All generated strategies are synchronized live with Firestore collection <code>marketing_campaigns</code>.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCampaignForVisualizer(constructCurrentWorkspaceCampaign())}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualize Active Suite</span>
                </button>

                <button
                  type="button"
                  onClick={loadSavedCampaigns}
                  disabled={isLoadingVault}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVault ? 'animate-spin' : ''}`} />
                  <span>Refresh Vault</span>
                </button>
              </div>
            </div>

            {isLoadingVault ? (
              /* Skeleton Loader Grid for Campaigns Cloud Vault */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`vskel_${idx}`}
                    className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-4 animate-pulse relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-4 w-24 bg-zinc-800 rounded-md" />
                      <div className="h-3 w-16 bg-zinc-800/60 rounded" />
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="h-5 w-3/4 bg-zinc-800 rounded-lg" />
                      <div className="h-3.5 w-1/2 bg-zinc-800/60 rounded" />
                    </div>

                    <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2">
                      <div className="h-8 w-24 bg-zinc-800/80 rounded-lg" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-8 w-20 bg-zinc-800/80 rounded-lg" />
                        <div className="h-8 w-8 bg-zinc-800/60 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : savedCampaigns.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800 text-zinc-400">
                <Bookmark className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">No Saved Marketing Campaigns in Vault</p>
                <p className="text-xs text-zinc-500 mt-1">Generate a full marketing suite to store campaign assets in your Firestore vault.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedCampaigns.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.scope === 'internal_platform'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                          }`}
                        >
                          {c.scope === 'internal_platform' ? 'Platform Engine' : 'Client Server'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>

                      <h4 className="text-white font-bold text-sm line-clamp-1">{c.targetDomain}</h4>
                      <p className="text-zinc-400 text-xs mt-1">
                        Keywords: {c.keywords?.length || 0} • Video Scripts: {c.generatedAssets?.detailedVideoScripts?.length || c.generatedAssets?.videoScripts?.length || 0}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaignForVisualizer(c)}
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-1 cursor-pointer transition shadow-sm shadow-amber-500/20"
                          title="Open Interactive Visualizer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visualizer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => generateCampaignPdf(c)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition border border-zinc-700/80"
                          title="Download Formatted PDF Report"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(JSON.stringify(c, null, 2), `camp_${c.id}`)}
                          className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 cursor-pointer"
                          title="Export JSON"
                        >
                          {copiedKey === `camp_${c.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(c.id)}
                          className="p-1.5 rounded hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                          title="Delete from Firestore"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Visualizer Modal */}
      {selectedCampaignForVisualizer && (
        <CampaignVisualizerModal
          campaign={selectedCampaignForVisualizer}
          onClose={() => setSelectedCampaignForVisualizer(null)}
          onDelete={handleDeleteCampaign}
        />
      )}

      {/* Delete Confirmation Modal Overlay */}
      {pendingDeleteCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Campaign Strategy?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">This action will remove the strategy from Cloud Firestore.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800 leading-relaxed">
              Are you sure you want to permanently remove the strategy for <strong className="text-white">{pendingDeleteCampaign.targetDomain}</strong> from your vault?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteCampaign(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => confirmDeleteCampaign(pendingDeleteCampaign.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
