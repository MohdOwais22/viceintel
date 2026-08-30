import React, { useState, useEffect } from 'react';
import {
  Users,
  Video,
  Share2,
  FileText,
  Sparkles,
  Copy,
  Check,
  Zap,
  Plus,
  Trash2,
  ExternalLink,
  Crown,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Globe,
  Radio,
  Flame,
  Award,
  ChevronRight,
  Send,
  Code,
  Layers,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreatorLead,
  VideoScriptBlueprint,
  AgencyCampaign,
  synthesizeCreatorPitch,
  generateViralVideoBlueprint,
  buildReferralLink,
  generateMultiPlatformLaunchCopy,
  generatePseoMatrixAndSchema,
  calculateCampaignHealthScore
} from '../../lib/agency-marketing-engine';
import { copyToClipboard } from '../../lib/copyUtils';

interface CreatorOutreachHubProps {
  serverName?: string;
  serverSlug?: string;
  targetDomain?: string;
  currentUser?: {
    uid: string;
    displayName?: string;
    email?: string;
  } | null;
  onUpgradeClick?: () => void;
}

const DEFAULT_CREATORS: CreatorLead[] = [
  {
    id: 'cr_1',
    creatorName: 'Summit1g',
    discordHandle: 'Summit#1001',
    platform: 'twitch',
    avgViewers: 12500,
    status: 'partnered',
    contractTerms: 'Tier-0 Priority Queue + Custom Ocean Drive Chop Shop + 25% Rev Share',
    perkPackage: {
      vipClearance: 'L3 Streamer Partner',
      customInGameBusiness: 'Ocean Drive Chop Shop MLO',
      priorityQueueTier: 'Tier-0 Instant Pass',
      affiliateRevenueShare: '25% Creator Code Share'
    },
    lastContactedAt: Date.now() - 86400000 * 2
  },
  {
    id: 'cr_2',
    creatorName: 'xQc',
    discordHandle: 'xQc#0001',
    platform: 'kick',
    avgViewers: 32000,
    status: 'contacted',
    contractTerms: 'Priority Queue + Dedicated Mod Shadow + Custom Nightclub',
    perkPackage: {
      vipClearance: 'L4 Creator VIP',
      customInGameBusiness: 'Malibu Club VIP Lounge',
      priorityQueueTier: 'Tier-0 Instant Pass',
      affiliateRevenueShare: '30% Creator Code Share'
    },
    lastContactedAt: Date.now() - 86400000 * 5
  },
  {
    id: 'cr_3',
    creatorName: 'Kaceytron',
    discordHandle: 'Kacey#4421',
    platform: 'twitch',
    avgViewers: 2800,
    status: 'pitch_ready',
    contractTerms: 'Priority Queue + 15% Rev Share',
    perkPackage: {
      vipClearance: 'L2 Streamer Badge',
      customInGameBusiness: 'Port Gellhorn Auto Shop',
      priorityQueueTier: 'Tier-1 Fast Pass',
      affiliateRevenueShare: '15% Creator Code Share'
    }
  }
];

export const CreatorOutreachHub: React.FC<CreatorOutreachHubProps> = ({
  serverName = 'Vice City Roleplay',
  serverSlug = 'vice-city-rp',
  targetDomain = 'https://vicecitycentral.com',
  currentUser,
  onUpgradeClick
}) => {
  const [subTab, setSubTab] = useState<'creators' | 'scripts' | 'referrals' | 'copywriter' | 'pseo'>('creators');
  const [creators, setCreators] = useState<CreatorLead[]>(DEFAULT_CREATORS);
  const [selectedCreatorForPitch, setSelectedCreatorForPitch] = useState<CreatorLead | null>(null);
  const [pitchProposalText, setPitchProposalText] = useState<string>('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Creator Form State
  const [showAddCreatorModal, setShowAddCreatorModal] = useState<boolean>(false);
  const [newCreatorName, setNewCreatorName] = useState<string>('');
  const [newPlatform, setNewPlatform] = useState<'twitch' | 'kick' | 'youtube'>('twitch');
  const [newAvgViewers, setNewAvgViewers] = useState<number>(500);

  // Video Script State
  const [scripts, setScripts] = useState<VideoScriptBlueprint[]>([
    generateViralVideoBlueprint({
      topic: 'Secret Everglades Radar Glitch & 242 MPH Handling Meta',
      serverName,
      vibe: 'Cyberpunk Phonk',
      platform: 'TikTok'
    })
  ]);
  const [scriptTopic, setScriptTopic] = useState<string>('Fast 60-Second AI Whitelist & Player Economy');
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);

  // Referral State
  const [vanityAlias, setVanityAlias] = useState<string>('VIP2026');
  const [topReferrers, setTopReferrers] = useState<Array<{ discordId: string; count: number; vanityCode: string }>>([
    { discordId: 'Summit1g#1001', count: 142, vanityCode: 'SUMMIT' },
    { discordId: 'GamerGod#9920', count: 88, vanityCode: 'GAMERGOD' },
    { discordId: 'ViceMayor#2026', count: 54, vanityCode: 'VICEMAYOR' }
  ]);

  // Copywriter State
  const [copyBundle, setCopyBundle] = useState(
    generateMultiPlatformLaunchCopy({
      serverName
    })
  );

  // pSEO Matrix State
  const pseoData = generatePseoMatrixAndSchema({
    serverName,
    serverSlug,
    targetDomain
  });

  const handleCopy = (key: string, text: string) => {
    copyToClipboard(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGeneratePitchForCreator = async (creator: CreatorLead) => {
    setSelectedCreatorForPitch(creator);
    setIsGeneratingPitch(true);

    try {
      const res = await fetch('/api/marketing/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorName: creator.creatorName,
          platform: creator.platform,
          avgViewers: creator.avgViewers,
          serverName,
          perkPackage: creator.perkPackage
        })
      });

      const data = await res.json();
      if (data.success && data.pitchProposal) {
        setPitchProposalText(data.pitchProposal);
      } else {
        const fallback = synthesizeCreatorPitch({
          creatorName: creator.creatorName,
          platform: creator.platform,
          avgViewers: creator.avgViewers,
          serverName,
          perkPackage: creator.perkPackage
        });
        setPitchProposalText(fallback);
      }
    } catch (err) {
      const fallback = synthesizeCreatorPitch({
        creatorName: creator.creatorName,
        platform: creator.platform,
        avgViewers: creator.avgViewers,
        serverName,
        perkPackage: creator.perkPackage
      });
      setPitchProposalText(fallback);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const handleAddNewCreator = () => {
    if (!newCreatorName.trim()) return;
    const newLead: CreatorLead = {
      id: `cr_${Date.now()}`,
      creatorName: newCreatorName.trim(),
      platform: newPlatform,
      avgViewers: newAvgViewers,
      status: 'pitch_ready',
      perkPackage: {
        vipClearance: 'L2 Streamer Badge',
        customInGameBusiness: 'Custom Auto Garage',
        priorityQueueTier: 'Tier-1 Priority Queue',
        affiliateRevenueShare: '15% Creator Code Share'
      }
    };
    setCreators([newLead, ...creators]);
    setNewCreatorName('');
    setShowAddCreatorModal(false);
  };

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const res = await fetch('/api/marketing/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: scriptTopic,
          serverName,
          vibe: 'High Energy Phonk',
          platform: 'TikTok'
        })
      });

      const data = await res.json();
      if (data.success && data.script) {
        setScripts([data.script, ...scripts]);
      } else {
        const local = generateViralVideoBlueprint({ topic: scriptTopic, serverName });
        setScripts([local, ...scripts]);
      }
    } catch (err) {
      const local = generateViralVideoBlueprint({ topic: scriptTopic, serverName });
      setScripts([local, ...scripts]);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generatedReferralLink = buildReferralLink(serverSlug, currentUser?.uid || 'user_123', vanityAlias);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-pink-950/40 to-slate-900 border border-pink-500/20 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                Sentinel Growth Suite
              </span>
              <span className="text-xs text-slate-400">• B2B Agency Marketing Engine</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Creator Outreach & Viral Acquisition Studio
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Drive organic player growth for <strong className="text-pink-400">{serverName}</strong> with automated streamer proposal pitches, 9:16 short video blueprints, referral quest tracking, and multi-platform launch copy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCreatorModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-pink-900/30"
            >
              <Plus className="w-4 h-4" />
              Add Creator Lead
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setSubTab('creators')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              subTab === 'creators'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-900/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Streamer CRM & Pitch Proposals ({creators.length})
          </button>

          <button
            onClick={() => setSubTab('scripts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              subTab === 'scripts'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-900/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            9:16 Short Video Studio
          </button>

          <button
            onClick={() => setSubTab('referrals')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              subTab === 'referrals'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-900/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Referral & Quest Engine
          </button>

          <button
            onClick={() => setSubTab('copywriter')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              subTab === 'copywriter'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-900/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Launch Copywriter
          </button>

          <button
            onClick={() => setSubTab('pseo')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              subTab === 'pseo'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-900/30'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            pSEO & OpenGraph Matrix
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: STREAMER CRM & PITCH PROPOSALS */}
      {subTab === 'creators' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creators.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-pink-500/40 rounded-xl p-5 shadow-lg transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        c.platform === 'twitch'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : c.platform === 'kick'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {c.platform}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{c.creatorName}</h3>
                    {c.discordHandle && <p className="text-xs text-slate-400">{c.discordHandle}</p>}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      c.status === 'partnered'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : c.status === 'contacted'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="bg-slate-950/60 rounded-lg p-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Average CCV:</span>
                    <span className="font-bold text-pink-400">{c.avgViewers.toLocaleString()} Viewers</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Priority Pass:</span>
                    <span className="font-semibold text-emerald-400">{c.perkPackage?.priorityQueueTier || 'Tier-1 Pass'}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">In-Game Perk:</span>
                    <span className="truncate text-slate-200">{c.perkPackage?.customInGameBusiness || 'Custom MLO'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleGeneratePitchForCreator(c)}
                  className="w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Synthesize Partnership Proposal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: VIRAL 9:16 SHORT VIDEO STUDIO */}
      {subTab === 'scripts' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-pink-400" />
              Generate Viral Short Video Script Blueprint (TikTok / Shorts / Reels)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder="Enter topic (e.g., Fast 60-Second Whitelist & Custom Cars)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {isGeneratingScript ? 'Generating...' : 'Generate Blueprint'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scripts.map((script) => (
              <div key={script.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-pink-500/20 text-pink-300">
                      {script.targetPlatform} • {script.durationSeconds}s Blueprint
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{script.hook}</h4>
                  </div>
                  <button
                    onClick={() => handleCopy(script.id, JSON.stringify(script, null, 2))}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition cursor-pointer"
                    title="Copy full script JSON"
                  >
                    {copiedKey === script.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Storyboard Cues:</span>
                  {script.storyboard.map((scene, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-pink-400">
                        <span>{scene.time}</span>
                        {scene.textOnScreen && <span className="text-amber-300">{scene.textOnScreen}</span>}
                      </div>
                      <p className="text-slate-300"><strong className="text-slate-400">Visual:</strong> {scene.visual}</p>
                      <p className="text-slate-200"><strong className="text-slate-400">Audio:</strong> "{scene.audio}"</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                  {script.hashtags.map((tag, i) => (
                    <span key={i} className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: GAMIFIED REFERRAL & QUEST ENGINE */}
      {subTab === 'referrals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-pink-400" />
              Custom Vanity Referral Link Builder
            </h3>
            <p className="text-xs text-slate-400">
              Generate tracked vanity join links for players and content creators. Conversions automatically grant Discord roles and priority queue placement.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold">Vanity Code / Creator Tag:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vanityAlias}
                  onChange={(e) => setVanityAlias(e.target.value.toUpperCase())}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white flex-1 font-mono focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={() => handleCopy('ref_link', generatedReferralLink)}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1"
                >
                  {copiedKey === 'ref_link' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Link
                </button>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs font-mono text-pink-300 break-all">
              {generatedReferralLink}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Top Player Referrers Leaderboard
            </h3>
            <div className="space-y-2">
              {topReferrers.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 font-bold flex items-center justify-center text-[10px]">
                      #{i + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white">{r.discordId}</span>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">[{r.vanityCode}]</span>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-400">{r.count} Players Joined</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LAUNCH COPYWRITER */}
      {subTab === 'copywriter' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-400" />
                Reddit Launch Post (Anti-Spam Formatted)
              </h3>
              <button
                onClick={() => handleCopy('reddit_body', `${copyBundle.redditPost.title}\n\n${copyBundle.redditPost.body}`)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold cursor-pointer transition flex items-center gap-1"
              >
                {copiedKey === 'reddit_body' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Post Body
              </button>
            </div>
            <h4 className="text-xs font-bold text-pink-300 bg-slate-950 p-2 rounded border border-slate-800">{copyBundle.redditPost.title}</h4>
            <textarea
              readOnly
              value={copyBundle.redditPost.body}
              rows={10}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 5: pSEO MATRIX */}
      {subTab === 'pseo' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-pink-400" />
            Programmatic SEO & OpenGraph Preview Schema
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pseoData.matrix.map((m, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                    {m.openGraphCard.badge}
                  </span>
                  <span className="font-mono text-slate-400">{m.slug}</span>
                </div>
                <h4 className="font-bold text-white">{m.metaTitle}</h4>
                <p className="text-slate-400">{m.metaDescription}</p>
                <div className="text-[10px] text-pink-400 font-mono break-all">{m.canonicalUrl}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pitch Proposal Modal */}
      {selectedCreatorForPitch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Sponsorship Pitch — {selectedCreatorForPitch.creatorName}</h3>
                <p className="text-xs text-slate-400">Custom proposal copy with perks & DMCA stream protection terms</p>
              </div>
              <button
                onClick={() => setSelectedCreatorForPitch(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isGeneratingPitch ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Sparkles className="w-6 h-6 text-pink-400 animate-spin" />
                Synthesizing custom partnership proposal with Gemini AI...
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  readOnly
                  value={pitchProposalText}
                  rows={14}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleCopy('modal_pitch', pitchProposalText)}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
                  >
                    {copiedKey === 'modal_pitch' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    Copy Pitch Proposal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Creator Lead Modal */}
      {showAddCreatorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Add Streamer Creator Lead</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Creator / Streamer Name:</label>
                <input
                  type="text"
                  value={newCreatorName}
                  onChange={(e) => setNewCreatorName(e.target.value)}
                  placeholder="e.g. Summit1g, xQc, Kaceytron"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Platform:</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="twitch">Twitch</option>
                  <option value="kick">Kick</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Average CCV / Concurrent Viewers:</label>
                <input
                  type="number"
                  value={newAvgViewers}
                  onChange={(e) => setNewAvgViewers(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddCreatorModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewCreator}
                className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                Save Creator Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
