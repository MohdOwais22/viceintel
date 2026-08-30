import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Music,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Bot,
  ExternalLink,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Smartphone,
  Globe,
  Radio,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Eye,
  Sliders
} from 'lucide-react';
import { copyToClipboard } from '../../lib/copyUtils';

export interface VisualizerVideoScript {
  hook: string;
  targetPlatform?: string;
  cta?: string;
  detailedScenes?: Array<{
    timeframe: string;
    visualCue: string;
    audioVoiceover: string;
  }>;
}

export interface VisualizerRedditPost {
  title: string;
  body: string;
  targetSubreddit: string;
  postFlair?: string;
}

export interface VisualizerDiscordEmbed {
  title: string;
  description: string;
  fields?: Record<string, string>;
  color?: string;
}

interface CampaignVisualizerProps {
  videoScripts?: VisualizerVideoScript[];
  redditPost?: VisualizerRedditPost;
  discordEmbed?: VisualizerDiscordEmbed;
  targetDomain?: string;
  className?: string;
}

type AestheticPreset = 'ocean_drive' | 'vice_sunset' | 'everglades_night' | 'starfish_island';

export const CampaignVisualizer: React.FC<CampaignVisualizerProps> = ({
  videoScripts = [],
  redditPost,
  discordEmbed,
  targetDomain = 'vicecitycentral.com',
  className = ''
}) => {
  const [platform, setPlatform] = useState<'tiktok' | 'reddit' | 'discord'>('tiktok');
  
  // TikTok State Controls
  const [selectedScriptIdx, setSelectedScriptIdx] = useState<number>(0);
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [aestheticPreset, setAestheticPreset] = useState<AestheticPreset>('ocean_drive');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(142800);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [bookmarkCount, setBookmarkCount] = useState<number>(12400);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Discord Reactions Counter
  const [reactions, setReactions] = useState<Record<string, number>>({
    '🔥': 142,
    '💯': 98,
    '🌴': 64,
    '🚀': 45
  });

  // Reddit State Controls
  const [upvotes, setUpvotes] = useState<number>(1482);
  const [voteState, setVoteState] = useState<'up' | 'down' | null>(null);

  const activeScript = videoScripts[selectedScriptIdx] || {
    hook: 'GTA 6 Leaks Just Confirmed Ocean Drive Secret Location!',
    targetPlatform: 'TikTok / Shorts',
    cta: 'Link in Bio to Join Vice City RP',
    detailedScenes: [
      {
        timeframe: '0:00 - 0:03',
        visualCue: 'Fast zoom on Neon Ocean Drive strip with hyper-realistic reflections.',
        audioVoiceover: 'You won\'t believe what Rockstar hidden in the latest GTA 6 coordinates...'
      },
      {
        timeframe: '0:03 - 0:08',
        visualCue: 'Custom sports car drifting into underground nightclub entrance.',
        audioVoiceover: 'This custom FiveM RP server recreated the exact Vice City map 2 years ahead of release.'
      },
      {
        timeframe: '0:08 - 0:15',
        visualCue: 'Full cinematic showcase of Ocean Drive mansions & player GamerTags.',
        audioVoiceover: 'Tap the link in bio right now to claim your starter 500 VC Cash & whitelist slot!'
      }
    ]
  };

  const activeScenes = activeScript.detailedScenes || [];

  // Auto Scene Advancement Timer when Playing
  useEffect(() => {
    let timer: any;
    if (isPlaying && activeScenes.length > 0) {
      timer = setInterval(() => {
        setActiveSceneIdx((prev) => (prev + 1) % activeScenes.length);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeScenes.length]);

  const handleVote = (type: 'up' | 'down') => {
    if (voteState === type) {
      setVoteState(null);
      setUpvotes(type === 'up' ? upvotes - 1 : upvotes + 1);
    } else {
      if (voteState === 'up') setUpvotes(upvotes - 2);
      else if (voteState === 'down') setUpvotes(upvotes + 2);
      else setUpvotes(type === 'up' ? upvotes + 1 : upvotes - 1);
      setVoteState(type);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const handleToggleReaction = (emoji: string) => {
    setReactions((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }));
  };

  // Aesthetic Background Styling Mapping
  const presetGradients: Record<AestheticPreset, { bg: string; overlay: string; badge: string }> = {
    ocean_drive: {
      bg: 'from-fuchsia-950 via-purple-950 to-zinc-950',
      overlay: 'from-amber-500/20 via-fuchsia-600/30 to-black/80',
      badge: 'Ocean Drive Neon'
    },
    vice_sunset: {
      bg: 'from-rose-950 via-amber-950 to-zinc-950',
      overlay: 'from-rose-500/30 via-orange-600/30 to-black/80',
      badge: 'Vice City Sunset'
    },
    everglades_night: {
      bg: 'from-emerald-950 via-cyan-950 to-zinc-950',
      overlay: 'from-emerald-500/20 via-teal-600/30 to-black/80',
      badge: 'Everglades Night'
    },
    starfish_island: {
      bg: 'from-cyan-950 via-indigo-950 to-zinc-950',
      overlay: 'from-cyan-500/20 via-blue-600/30 to-black/80',
      badge: 'Starfish Island'
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Visualizer Header Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-fuchsia-500/20 text-amber-300 border border-amber-500/40">
              Native Social Studio
            </span>
            <span className="text-xs text-zinc-400 font-mono">3 Live Feeds</span>
          </div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Platform Feed Mockup Visualizer</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Preview generated viral video scripts, Reddit launch posts, and Discord webhooks inside native app interfaces.
          </p>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setPlatform('tiktok')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              platform === 'tiktok'
                ? 'bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-fuchsia-500/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>TikTok / Shorts</span>
          </button>

          <button
            type="button"
            onClick={() => setPlatform('reddit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              platform === 'reddit'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Reddit Post</span>
          </button>

          <button
            type="button"
            onClick={() => setPlatform('discord')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              platform === 'discord'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Discord Embed</span>
          </button>
        </div>
      </div>

      {/* 1. TIKTOK / SHORTS SMARTPHONE MOCKUP */}
      {platform === 'tiktok' && (
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 py-2">
          
          {/* Smartphone Hardware Frame with Neon Ambient Glow */}
          <div className="relative group shrink-0">
            {/* Outer Ambient Neon Glow Ring */}
            <div className="absolute -inset-2 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 rounded-[50px] blur-xl opacity-40 group-hover:opacity-70 transition duration-500" />
            
            {/* Phone Body Shell */}
            <div className="relative w-[330px] sm:w-[340px] h-[640px] rounded-[44px] bg-zinc-950 p-3.5 border-4 border-zinc-700 shadow-2xl select-none overflow-hidden flex flex-col justify-between">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 rounded-full bg-black z-30 flex items-center justify-center gap-2 border border-zinc-800">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700" />
                <div className="w-2 h-2 rounded-full bg-blue-900/80" />
              </div>

              {/* Side Hardware Buttons Simulation */}
              <div className="absolute -left-1 top-24 w-1 h-8 rounded-l bg-zinc-700" />
              <div className="absolute -left-1 top-36 w-1 h-12 rounded-l bg-zinc-700" />
              <div className="absolute -left-1 top-52 w-1 h-12 rounded-l bg-zinc-700" />
              <div className="absolute -right-1 top-32 w-1 h-16 rounded-r bg-zinc-700" />

              {/* Inner Smartphone Screen Canvas */}
              <div className={`relative w-full h-full rounded-[34px] overflow-hidden bg-gradient-to-br ${presetGradients[aestheticPreset].bg} text-white flex flex-col justify-between p-4 shadow-inner`}>
                
                {/* Background Dynamic Visual Overlay Simulation */}
                <div className={`absolute inset-0 bg-gradient-to-t ${presetGradients[aestheticPreset].overlay} z-0`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40 z-10" />

                {/* Top Status Header */}
                <div className="relative z-20 pt-4 flex items-center justify-between text-xs font-bold text-white/90 drop-shadow">
                  <span className="text-[11px] font-mono text-zinc-300">9:41</span>
                  
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-zinc-400 hover:text-white cursor-pointer transition">Following</span>
                    <span className="text-white font-black border-b-2 border-white pb-0.5">For You</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAudioMuted(!audioMuted)}
                    className="p-1 rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60 transition cursor-pointer"
                    title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>

                {/* Center Scene Visual Cue Card */}
                <div className="relative z-20 my-auto text-center px-1 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-left space-y-2 shadow-2xl relative overflow-hidden">
                    
                    {/* Live Playback Indicator Bar */}
                    {isPlaying && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-amber-400 animate-pulse" />
                    )}

                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white shadow-sm">
                        {activeScenes[activeSceneIdx]?.timeframe || 'Scene Preview'}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                        {isPlaying && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                        <span>{activeSceneIdx + 1} / {Math.max(1, activeScenes.length)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-amber-300 font-bold leading-snug flex items-start gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{activeScenes[activeSceneIdx]?.visualCue || 'Dynamic Vice City vehicle gameplay snippet'}</span>
                    </p>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-zinc-200 font-mono italic space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-fuchsia-300 uppercase not-italic">
                        <span>Voiceover Track</span>
                        {!audioMuted && isPlaying && (
                          <div className="flex items-end gap-0.5 h-2">
                            <div className="w-0.5 h-full bg-fuchsia-400 animate-bounce" />
                            <div className="w-0.5 h-2/3 bg-amber-400 animate-bounce [animation-delay:0.1s]" />
                            <div className="w-0.5 h-full bg-rose-400 animate-bounce [animation-delay:0.2s]" />
                          </div>
                        )}
                      </div>
                      <p>"{activeScenes[activeSceneIdx]?.audioVoiceover || activeScript.hook}"</p>
                    </div>
                  </div>

                  {/* TikTok Bold On-Screen Caption Text (Hook Tag) */}
                  <div className="p-2.5 rounded-xl bg-yellow-400 text-black font-black text-xs uppercase tracking-tight shadow-2xl leading-tight inline-block transform -rotate-1 border border-yellow-300">
                    🔥 {activeScript.hook}
                  </div>
                </div>

                {/* Bottom Info & Action Sidebar Overlay */}
                <div className="relative z-20 space-y-3 pt-2">
                  <div className="flex items-end justify-between gap-3">
                    
                    {/* Left Creator Info & Audio Details */}
                    <div className="space-y-2 max-w-[210px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500 p-0.5 shrink-0 shadow-lg">
                          <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center font-black text-[10px] text-amber-400">
                            VI
                          </div>
                        </div>
                        <div>
                          <span className="font-black text-xs block text-white drop-shadow flex items-center gap-1">
                            @viceintel_gta6
                            <Check className="w-3 h-3 text-cyan-400 p-0.5 bg-cyan-400/20 rounded-full" />
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold block drop-shadow">
                            CTA: {activeScript.cta || 'Link in Bio'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-200 line-clamp-2 drop-shadow font-sans leading-snug">
                        GTA VI Vice City viral leak breakdown! Check bio to join our custom RP server. #GTA6 #ViceCity #FiveM
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-mono bg-black/40 backdrop-blur px-2 py-1 rounded-full border border-white/10 w-fit">
                        <Music className={`w-3 h-3 text-fuchsia-400 ${isPlaying ? 'animate-spin' : ''}`} />
                        <span className="truncate max-w-[140px]">GTA VI Main Theme — Ocean Drive Sound</span>
                      </div>
                    </div>

                    {/* Right Interactive Sidebar Action Buttons */}
                    <div className="flex flex-col items-center gap-3.5 text-white text-xs font-bold drop-shadow">
                      
                      {/* Like Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLiked(!isLiked);
                          setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
                        }}
                        className="flex flex-col items-center gap-0.5 cursor-pointer group"
                      >
                        <div className={`p-2.5 rounded-full backdrop-blur-md transition ${isLiked ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 scale-110' : 'bg-black/50 text-white group-hover:scale-110'}`}>
                          <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
                        </div>
                        <span className="text-[10px] font-mono">{(likeCount / 1000).toFixed(1)}K</span>
                      </button>

                      {/* Comment Button */}
                      <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                        <div className="p-2.5 rounded-full bg-black/50 backdrop-blur-md hover:scale-110 transition">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono">3.8K</span>
                      </div>

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsBookmarked(!isBookmarked);
                          setBookmarkCount(isBookmarked ? bookmarkCount - 1 : bookmarkCount + 1);
                        }}
                        className="flex flex-col items-center gap-0.5 cursor-pointer"
                      >
                        <div className={`p-2.5 rounded-full backdrop-blur-md transition ${isBookmarked ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/50' : 'bg-black/50 text-white'}`}>
                          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-black' : ''}`} />
                        </div>
                        <span className="text-[10px] font-mono">{(bookmarkCount / 1000).toFixed(1)}K</span>
                      </button>

                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(activeScript.hook, 'TikTok Hook Caption')}
                        className="flex flex-col items-center gap-0.5 cursor-pointer"
                      >
                        <div className="p-2.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-zinc-800 transition">
                          <Share2 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px]">Share</span>
                      </button>

                      {/* Rotating Vinyl Record Cover */}
                      <div className={`w-7 h-7 rounded-full bg-zinc-900 border-2 border-zinc-600 p-0.5 shadow-xl ${isPlaying ? 'animate-spin' : ''}`}>
                        <div className="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-500 to-amber-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-black" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Video Playback Progress Bar */}
                  <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-fuchsia-500 to-amber-400 h-full transition-all duration-300"
                      style={{ width: `${((activeSceneIdx + 1) / Math.max(1, activeScenes.length)) * 100}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Script Controls & Storyboard Editor Suite */}
          <div className="flex-1 space-y-4 max-w-md w-full">
            
            {/* Storyboard Playback & Preset Control Box */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">Script Storyboard Controls</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Platform: {activeScript.targetPlatform || 'TikTok / Shorts'}</span>
                </div>

                {/* Play / Pause Video Simulation Button */}
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                    isPlaying
                      ? 'bg-rose-500 text-white shadow-rose-500/25 animate-pulse'
                      : 'bg-emerald-500 text-zinc-950 shadow-emerald-500/25 hover:bg-emerald-400'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-zinc-950" />}
                  <span>{isPlaying ? 'Pause Video' : 'Play Video'}</span>
                </button>
              </div>

              {/* Aesthetic Preset Wallpaper Switcher */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 block flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span>Aesthetic Canvas Wallpaper:</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['ocean_drive', 'vice_sunset', 'everglades_night', 'starfish_island'] as AestheticPreset[]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAestheticPreset(preset)}
                      className={`p-2 rounded-xl text-xs font-bold transition text-left cursor-pointer border ${
                        aestheticPreset === preset
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="block text-[11px]">{presetGradients[preset].badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiple Script Hook Selector Pills */}
              {videoScripts.length > 1 && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 block">Select Script Strategy:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {videoScripts.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedScriptIdx(idx);
                          setActiveSceneIdx(0);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                          selectedScriptIdx === idx
                            ? 'bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white shadow-md'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        Hook #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scene Stepper Interactive Grid */}
              {activeScenes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Scene Timeline ({activeSceneIdx + 1} of {activeScenes.length})</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveSceneIdx(Math.max(0, activeSceneIdx - 1))}
                        disabled={activeSceneIdx === 0}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSceneIdx(Math.min(activeScenes.length - 1, activeSceneIdx + 1))}
                        disabled={activeSceneIdx === activeScenes.length - 1}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {activeScenes.map((sc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveSceneIdx(idx)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1 ${
                          activeSceneIdx === idx
                            ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white shadow-md'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase">{sc.timeframe}</span>
                          {activeSceneIdx === idx && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-fuchsia-500 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold line-clamp-1 text-zinc-200">{sc.visualCue}</p>
                        <p className="text-[10px] font-mono text-zinc-400 line-clamp-1">"{sc.audioVoiceover}"</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy Actions Footer */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(activeScript.hook, 'hook')}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border border-zinc-700"
                >
                  {copiedText === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'hook' ? 'Copied Hook' : 'Copy Hook'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(activeScript, null, 2), 'script')}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-amber-500/20"
                >
                  {copiedText === 'script' ? <Check className="w-3.5 h-3.5 text-zinc-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'script' ? 'Copied Script' : 'Copy Full Script'}</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* 2. REDDIT FEED POST UI MOCKUP */}
      {platform === 'reddit' && (
        <div className="max-w-2xl mx-auto py-2 space-y-4">
          <div className="bg-[#1A1A1B] border border-[#343536] rounded-2xl overflow-hidden shadow-2xl text-zinc-200">
            
            {/* Reddit Subreddit Header */}
            <div className="p-4 flex items-center justify-between border-b border-[#343536]/80 bg-[#121213]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-extrabold text-white text-xs shadow-md">
                  r/
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs hover:underline cursor-pointer">
                      {redditPost?.targetSubreddit || 'r/GTA6'}
                    </span>
                    <span className="text-[10px] text-zinc-400">• Posted by u/ViceIntelBot 4h ago</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 inline-block mt-0.5">
                    {redditPost?.postFlair || '🔥 Official Launch / News'}
                  </span>
                </div>
              </div>

              <button type="button" className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 transition">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Reddit Post Title & Body */}
            <div className="p-5 space-y-3">
              <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                {redditPost?.title || 'GTA VI Vice City Community Portal & Dedicated FiveM RP Server Launching!'}
              </h2>

              <div className="text-xs text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto p-4 rounded-xl bg-[#0F0F10] border border-[#343536] shadow-inner">
                {redditPost?.body || `Hey everyone! We've officially launched our custom Vice City RP server backed by ViceIntel database integration.\n\nKey Highlights:\n• Custom Ocean Drive & Starfish Island interiors\n• Real-time player GamerTag database & economy tracking\n• Exclusive VIP Tuner Championship weekly payouts\n\nCheck out the portal and connect directly: https://${targetDomain}`}
              </div>
            </div>

            {/* Reddit Footer Stats & Action Controls */}
            <div className="px-4 py-3 bg-[#121213] border-t border-[#343536] flex items-center justify-between text-xs font-bold text-zinc-400">
              
              {/* Upvote Pill */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#272729] border border-[#343536]">
                <button
                  type="button"
                  onClick={() => handleVote('up')}
                  className={`p-1.5 rounded-full hover:bg-zinc-800 cursor-pointer transition ${voteState === 'up' ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-400'}`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <span className={`text-xs font-black ${voteState === 'up' ? 'text-orange-500' : voteState === 'down' ? 'text-blue-500' : 'text-white'}`}>
                  {upvotes.toLocaleString()}
                </span>

                <button
                  type="button"
                  onClick={() => handleVote('down')}
                  className={`p-1.5 rounded-full hover:bg-zinc-800 cursor-pointer transition ${voteState === 'down' ? 'text-blue-500 bg-blue-500/10' : 'text-zinc-400'}`}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Comment Teaser Pill */}
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#272729] hover:bg-zinc-800 cursor-pointer transition border border-[#343536]">
                <MessageCircle className="w-4 h-4 text-orange-400" />
                <span>342 Comments</span>
              </div>

              {/* Share Copy Action */}
              <button
                type="button"
                onClick={() => handleCopy(redditPost?.body || '', 'Reddit Post Body')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#272729] hover:bg-zinc-800 cursor-pointer transition text-zinc-200 border border-[#343536]"
              >
                {copiedText === 'Reddit Post Body' ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedText === 'Reddit Post Body' ? 'Copied' : 'Share / Copy'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. DISCORD DARK THEME EMBED MOCKUP */}
      {platform === 'discord' && (
        <div className="max-w-2xl mx-auto py-2 space-y-4">
          
          {/* Discord Dark Theme Outer Container */}
          <div className="bg-[#313338] rounded-2xl p-5 sm:p-6 border border-zinc-800/80 shadow-2xl font-sans text-zinc-200 space-y-4">
            
            {/* Discord Message Author Header Row */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center font-black text-white shrink-0 shadow-lg">
                <Bot className="w-6 h-6" />
              </div>

              <div className="space-y-1.5 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-white text-sm hover:underline cursor-pointer">ViceIntel Sentinel Bot</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#5865F2] text-white">BOT</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Today at 4:20 PM</span>
                </div>

                {/* Discord Embed Card Box */}
                <div className="p-4 rounded-xl bg-[#2B2D31] border-l-4 border-amber-500 space-y-3 shadow-inner">
                  
                  {/* Embed Title */}
                  <h4 className="text-white font-extrabold text-base flex items-center gap-2">
                    <span>{discordEmbed?.title || '🌴 VICE CITY ROLEPLAY — OFFICIAL SERVER DISPATCH'}</span>
                  </h4>

                  {/* Embed Description */}
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    {discordEmbed?.description || 'Welcome to the premier GTA VI Vice City community portal. Connect your GamerTag, inspect live vehicle telemetry, and apply for whitelisted RP slots directly!'}
                  </p>

                  {/* Embed Field Key-Value Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#383A40]">
                    {discordEmbed?.fields ? (
                      Object.entries(discordEmbed.fields).map(([k, v], idx) => (
                        <div key={idx} className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-400 block">{k}</span>
                          <span className="text-xs font-medium text-white block">{v as string}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-400 block">⚡ Direct Server IP</span>
                          <span className="text-xs font-mono font-bold text-amber-400 block">connect.vicecitycentral.com</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-400 block">🎮 Active Players</span>
                          <span className="text-xs font-bold text-emerald-400 block">128 / 128 Slots Filled</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-400 block">🏆 Weekly Championship</span>
                          <span className="text-xs text-zinc-200 block">500 VC Cash Prize & Badge</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-400 block">📋 Whitelist Portal</span>
                          <span className="text-xs text-indigo-400 underline block">vicecitycentral.com/servers/apply</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-2 text-[10px] text-zinc-500 font-mono flex items-center justify-between border-t border-[#383A40]">
                    <span>ViceIntel Sentinel Webhook Engine</span>
                    <span>2026-08-22</span>
                  </div>

                </div>

                {/* Discord Interactive Reaction Buttons Below Message */}
                <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                  {Object.entries(reactions).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleToggleReaction(emoji)}
                      className="px-2.5 py-1 rounded-lg bg-[#2B2D31] hover:bg-[#35373C] border border-[#383A40] text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>{emoji}</span>
                      <span className="text-zinc-300 font-mono text-[11px]">{count}</span>
                    </button>
                  ))}
                </div>

                {/* Discord Action Buttons Below Embed */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleCopy(`connect ${targetDomain}`, 'Direct Server Connect Command')}
                    className="px-3.5 py-2 rounded-lg bg-[#4752C4] hover:bg-[#3B44A9] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-[#4752C4]/30"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Join Server</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(discordEmbed || {}, null, 2), 'Discord Embed JSON')}
                    className="px-3.5 py-2 rounded-lg bg-[#4E5058] hover:bg-[#6D6F78] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedText === 'Discord Embed JSON' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText === 'Discord Embed JSON' ? 'Copied' : 'Copy Webhook Payload'}</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
