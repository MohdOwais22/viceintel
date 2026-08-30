import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Globe,
  Sparkles,
  Video,
  Share2,
  Radio,
  FileCode,
  TrendingUp,
  BarChart3,
  Award,
  Lock,
  ExternalLink,
  Bot,
  Trash2
} from 'lucide-react';
import { MarketingCampaign } from '../../lib/marketing-engine';
import { generateCampaignPdf } from '../../lib/pdfGenerator';
import { copyToClipboard } from '../../lib/copyUtils';
import { CampaignVisualizer } from './CampaignVisualizer';

interface CampaignVisualizerModalProps {
  campaign: MarketingCampaign;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void> | void;
}

export const CampaignVisualizerModal: React.FC<CampaignVisualizerModalProps> = ({
  campaign,
  onClose,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'mockup' | 'keywords' | 'videos' | 'social' | 'streamer' | 'pseo'>('mockup');
  const [copied, setCopied] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const keywords = campaign.keywords || [];
  const videoScripts = campaign.generatedAssets?.detailedVideoScripts || [];
  const basicVideoScripts = campaign.generatedAssets?.videoScripts || [];
  const redditPost = campaign.generatedAssets?.redditPost;
  const discordEmbed = campaign.generatedAssets?.discordEmbed;
  const streamerPitch = campaign.generatedAssets?.streamerPitch;
  const pseoMatrix = campaign.generatedAssets?.pseoMatrixPreview || [];

  const totalVolume = keywords.reduce((acc, k) => acc + (k.volumeEst || 0), 0);

  const handleCopyJson = async () => {
    const success = await copyToClipboard(JSON.stringify(campaign, null, 2));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPdf = () => {
    setIsPdfGenerating(true);
    try {
      generateCampaignPdf(campaign);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setTimeout(() => setIsPdfGenerating(false), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative my-auto">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-zinc-900/90 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                  campaign.scope === 'internal_platform'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                }`}
              >
                {campaign.scope === 'internal_platform' ? 'Platform Engine' : 'Client Server'}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Created: {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 line-clamp-1">
              <Globe className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{campaign.targetDomain}</span>
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isPdfGenerating ? 'Building PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 border border-zinc-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Export JSON'}</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(campaign.id)}
                className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 transition cursor-pointer"
                title="Delete Strategy from Vault"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs Bar */}
        <div className="bg-zinc-900/40 border-b border-zinc-800/80 px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('mockup')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'mockup'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Platform Mockups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keywords')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'keywords'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Keywords ({keywords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Scripts ({videoScripts.length || basicVideoScripts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'social'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Reddit & Discord</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('streamer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'streamer'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Streamer Pitch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pseo')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pseo'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>pSEO Matrix ({pseoMatrix.length})</span>
          </button>
        </div>

        {/* Scrollable Modal Main Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* MOCKUP TAB */}
          {activeTab === 'mockup' && (
            <CampaignVisualizer
              videoScripts={videoScripts.length > 0 ? videoScripts : basicVideoScripts}
              redditPost={redditPost}
              discordEmbed={discordEmbed}
              targetDomain={campaign.targetDomain}
            />
          )}

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Discovered Keywords</span>
                  <div className="text-2xl font-black text-amber-400">{keywords.length}</div>
                  <span className="text-[10px] text-zinc-500 block">Est. Vol: {totalVolume.toLocaleString()}/mo</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Viral Video Scripts</span>
                  <div className="text-2xl font-black text-fuchsia-400">{videoScripts.length || basicVideoScripts.length}</div>
                  <span className="text-[10px] text-zinc-500 block">TikTok, Shorts & Reels</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Programmatic Pages</span>
                  <div className="text-2xl font-black text-cyan-400">{pseoMatrix.length}</div>
                  <span className="text-[10px] text-zinc-500 block">pSEO Dynamic Landing Pages</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Campaign Readiness</span>
                  <div className="text-2xl font-black text-emerald-400">96%</div>
                  <span className="text-[10px] text-zinc-500 block">Firestore Synced & Ready</span>
                </div>
              </div>

              {/* Quick Visualizer Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Top Keyword Opportunities Overview */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Top Keyword Opportunities
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('keywords')}
                      className="text-[11px] text-amber-400 hover:underline font-bold"
                    >
                      View All →
                    </button>
                  </h3>

                  {keywords.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No keyword metrics attached.</p>
                  ) : (
                    <div className="space-y-2">
                      {keywords.slice(0, 4).map((kw, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">{kw.term}</span>
                            <span className="text-[10px] text-zinc-500">Intent: {kw.intent}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-amber-300 font-bold block">{kw.volumeEst.toLocaleString()}/mo</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-800 text-zinc-300">
                              {kw.difficulty}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Viral Scripts Storyboard Highlights */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-fuchsia-400" />
                      Viral Video Storyboards
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('videos')}
                      className="text-[11px] text-fuchsia-400 hover:underline font-bold"
                    >
                      View All →
                    </button>
                  </h3>

                  {videoScripts.length === 0 && basicVideoScripts.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No video scripts generated yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(videoScripts.length > 0 ? videoScripts : basicVideoScripts).slice(0, 3).map((script: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                              {script.targetPlatform || 'TikTok / Shorts'}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">CTA: {script.cta || 'Link in Bio'}</span>
                          </div>
                          <p className="font-bold text-white line-clamp-1">"{script.hook}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. KEYWORDS TAB */}
          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Discovered Search Keywords</h3>
                <span className="text-xs text-zinc-400">Total Volume: {totalVolume.toLocaleString()}/mo</span>
              </div>

              {keywords.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs">
                  No keywords found for this campaign.
                </div>
              ) : (
                <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Keyword Term</th>
                        <th className="py-3 px-4">Est. Search Volume</th>
                        <th className="py-3 px-4">Difficulty</th>
                        <th className="py-3 px-4">Search Intent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                      {keywords.map((kw, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/30 transition">
                          <td className="py-3 px-4 font-bold text-white">{kw.term}</td>
                          <td className="py-3 px-4 font-mono text-amber-300">{kw.volumeEst.toLocaleString()}/mo</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                kw.difficulty === 'Low'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : kw.difficulty === 'Medium'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {kw.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                              {kw.intent}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. VIDEO SCRIPTS TAB */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              {videoScripts.length === 0 && basicVideoScripts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs">
                  No video script storyboards saved for this campaign.
                </div>
              ) : (
                (videoScripts.length > 0 ? videoScripts : basicVideoScripts).map((script: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                          Script #{idx + 1} — {script.targetPlatform || 'TikTok / Shorts'}
                        </span>
                        {script.durationSeconds && (
                          <span className="text-[11px] text-zinc-400 font-mono">{script.durationSeconds}s Duration</span>
                        )}
                      </div>
                      <span className="text-xs text-amber-400 font-semibold">CTA: {script.cta}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Hook Statement</span>
                      <p className="text-sm font-extrabold text-white">"{script.hook}"</p>
                    </div>

                    {/* Detailed Scenes Storyboard Timeline */}
                    {script.detailedScenes && script.detailedScenes.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Scene-By-Scene Storyboard</span>
                        <div className="space-y-2">
                          {script.detailedScenes.map((sc: any, sIdx: number) => (
                            <div key={sIdx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[10px] font-bold">
                                  {sc.timeframe}
                                </span>
                                <span className="text-[10px] text-zinc-500">Visual Cue</span>
                              </div>
                              <p className="text-zinc-200 font-medium">{sc.visualCue}</p>
                              <p className="text-zinc-400 font-mono text-[11px] pt-1">Voiceover: "{sc.audioVoiceover}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. SOCIAL LAUNCH TAB */}
          {activeTab === 'social' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reddit Post Preview */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-orange-400" />
                  Reddit Launch Campaign
                </h3>
                {redditPost ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <span className="text-[10px] font-mono text-orange-400 block">{redditPost.targetSubreddit}</span>
                      <h4 className="font-bold text-white text-sm">{redditPost.title}</h4>
                      <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans max-h-60 overflow-y-auto">
                        {redditPost.body}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No Reddit launch campaign generated.</p>
                )}
              </div>

              {/* Discord Embed Preview */}
              <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  Discord Webhook Embed
                </h3>
                {discordEmbed ? (
                  <div className="p-4 rounded-xl bg-[#2B2D31] border-l-4 border-pink-500 text-zinc-200 text-xs space-y-3 font-sans shadow-inner">
                    <h4 className="text-white font-bold text-sm">{discordEmbed.title}</h4>
                    <p className="text-zinc-300 text-xs">{discordEmbed.description}</p>
                    {discordEmbed.fields && (
                      <div className="space-y-1.5 pt-2 border-t border-zinc-700/50">
                        {Object.entries(discordEmbed.fields).map(([k, v], idx) => (
                          <div key={idx}>
                            <strong className="text-white text-[11px] block">{k}</strong>
                            <p className="text-zinc-300 text-[11px]">{v as string}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No Discord embed generated.</p>
                )}
              </div>
            </div>
          )}

          {/* 5. STREAMER PITCH TAB */}
          {activeTab === 'streamer' && (
            <div className="space-y-4">
              {streamerPitch ? (
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Radio className="w-4 h-4 text-fuchsia-400" />
                      Streamer Partnership Proposal
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-500/20 text-fuchsia-300">
                      Target: {streamerPitch.creatorTier}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {streamerPitch.pitchEmail}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs">
                  No streamer pitch kit stored for this campaign.
                </div>
              )}
            </div>
          )}

          {/* 6. pSEO MATRIX TAB */}
          {activeTab === 'pseo' && (
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm">Programmatic SEO Landing Pages</h3>
              {pseoMatrix.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs">
                  No pSEO pages generated for this campaign.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pseoMatrix.map((page, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-white font-bold">{page.metaTitle}</strong>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {page.indexReadinessScore}% Readiness
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px]">{page.metaDescription}</p>
                      <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                        <span>URL: {page.canonicalUrl}</span>
                        <span>{page.estimatedMonthlyVisits.toLocaleString()}/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
