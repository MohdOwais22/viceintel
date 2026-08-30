'use client';
import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  ShieldCheck,
  Cpu,
  Gauge,
  Crosshair,
  MapPin,
  Briefcase,
  Users,
  Wrench,
  Monitor,
  ExternalLink,
  HelpCircle,
  Zap,
  ArrowRight,
  Lock
} from 'lucide-react';

interface AiTacticalAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  currentUser?: any;
  onOpenAuth?: () => void;
}

type AiTopic = 
  | 'Tuning'
  | 'Weapons'
  | 'Map'
  | 'ROI'
  | 'RP'
  | 'Tools'
  | 'Protagonists'
  | 'Specs';

interface TopicConfig {
  id: AiTopic;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  suggestions: string[];
  toolLink?: { name: string; tab: string };
}

const TOPICS_CONFIG: TopicConfig[] = [
  {
    id: 'Tuning',
    label: 'Tuning & Mods',
    icon: <Gauge className="w-3.5 h-3.5" />,
    placeholder: "e.g., How do I optimize launch acceleration on the Pegassi Ignus?",
    suggestions: [
      "How do I maximize 0-60 launch acceleration?",
      "Best handling.meta settings to fix understeer?",
      "AWD vs RWD for Vice Beach circuit racing?"
    ],
    toolLink: { name: 'Handling Editor', tab: 'handling-editor' }
  },
  {
    id: 'Weapons',
    label: 'Weapons & TTK',
    icon: <Crosshair className="w-3.5 h-3.5" />,
    placeholder: "e.g., Which assault rifle has the fastest TTK against body armor?",
    suggestions: [
      "Which rifle has the lowest TTK in medium range?",
      "Best attachments for the Tactical Carbine MK II?",
      "Combat Shotgun vs Heavy Sniper in CQB?"
    ],
    toolLink: { name: 'Weapons Catalog', tab: 'weapons' }
  },
  {
    id: 'Map',
    label: 'Map & Districts',
    icon: <MapPin className="w-3.5 h-3.5" />,
    placeholder: "e.g., Where are the best 5-star police escape tunnels in Port Gellhorn?",
    suggestions: [
      "Best 5-star police evasion routes in Port Gellhorn?",
      "Where are high-value supercar spawns located?",
      "What are the police response times across districts?"
    ],
    toolLink: { name: 'Interactive Map', tab: 'map' }
  },
  {
    id: 'ROI',
    label: 'Business & ROI',
    icon: <Briefcase className="w-3.5 h-3.5" />,
    placeholder: "e.g., Which commercial business gives the fastest break-even ROI?",
    suggestions: [
      "Which enterprise gives the fastest break-even ROI?",
      "How much passive income does Malibu Nightclub make?",
      "Best equipment upgrade priority for Acid Labs?"
    ],
    toolLink: { name: 'ROI Calculator', tab: 'roi-calculator' }
  },
  {
    id: 'RP',
    label: 'FiveM & RP Rules',
    icon: <Users className="w-3.5 h-3.5" />,
    placeholder: "e.g., How do I connect to FiveM servers and what is FearRP?",
    suggestions: [
      "How do I connect to a FiveM server using F8 console?",
      "Explain FearRP, NLR, and Metagaming rules",
      "Tips for passing a whitelist application backstory?"
    ],
    toolLink: { name: 'FiveM Directory', tab: 'rp-servers' }
  },
  {
    id: 'Tools',
    label: 'Platform Tools',
    icon: <Wrench className="w-3.5 h-3.5" />,
    placeholder: "e.g., How do I use the Head-to-Head Comparison Matrix or Mod Calculator?",
    suggestions: [
      "What tools are available on GTA VI Central?",
      "How do I use the Handling Physics Editor?",
      "How does the Squad Tactical Radar sync work?"
    ],
    toolLink: { name: 'Comparison Matrix', tab: 'comparison' }
  },
  {
    id: 'Protagonists',
    label: 'Lucia & Jason Lore',
    icon: <Zap className="w-3.5 h-3.5" />,
    placeholder: "e.g., What are Lucia and Jason's special abilities and shared trunk mechanics?",
    suggestions: [
      "What special abilities do Lucia and Jason have?",
      "How does the shared vehicle trunk arsenal work?",
      "Best co-op heist strategies for dual characters?"
    ],
    toolLink: { name: 'Guides & Lore', tab: 'blog' }
  },
  {
    id: 'Specs',
    label: 'PC & Console Specs',
    icon: <Monitor className="w-3.5 h-3.5" />,
    placeholder: "e.g., What GPU and SSD do I need for 4K 60 FPS Ray Tracing in GTA 6?",
    suggestions: [
      "What are the recommended PC specs for 4K Ray Tracing?",
      "Why is an NVMe Gen4 SSD required for GTA 6?",
      "What enhancements does the PS5 Pro offer for GTA 6?"
    ],
    toolLink: { name: 'Tech Intel', tab: 'blog' }
  }
];

export const AiTacticalAssistant: React.FC<AiTacticalAssistantProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentUser,
  onOpenAuth
}) => {
  const [prompt, setPrompt] = useState('');
  const [topic, setTopic] = useState<AiTopic>('Tuning');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isSecurityRefusal, setIsSecurityRefusal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentTopicConfig = TOPICS_CONFIG.find(t => t.id === topic) || TOPICS_CONFIG[0];

  const handleSelectSuggestion = (suggestedText: string) => {
    setPrompt(suggestedText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(null);
    setIsSecurityRefusal(false);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), topic })
      });
      const data = await res.json();
      if (data.success) {
        setResponse(data.answer);
        setIsFallbackMode(!!data.isFallback);
        setIsSecurityRefusal(!!data.isSecurityRefusal);
      } else {
        setResponse('Unable to retrieve AI recommendation. Please try again.');
      }
    } catch (err) {
      console.error('AI Assistant Error:', err);
      setResponse('Network error connecting to Vice City AI backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleToolJump = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-zinc-900/95 border border-indigo-500/30 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/40 scrollbar-track-zinc-950">
        
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition"
          title="Close AI Assistant"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Info */}
        <div className="flex items-start gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-inner">
            <Bot className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Vice City AI Tactical Intelligence</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" /> Full Platform AI
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real-time tactical intelligence on GTA VI vehicle tuning, weapon TTK ballistics, Leonida district maps, business ROI models, FiveM roleplay rules, and platform tools.
            </p>
          </div>
        </div>

        {/* Security / Safe AI Policy Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Protected AI Knowledge: Game intelligence, tools & guides active. Sensitive admin credentials & keys protected.</span>
        </div>

        {!currentUser ? (
          <div className="bg-gradient-to-br from-indigo-950/50 via-zinc-950 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl my-4">
            <div className="inline-flex p-4 bg-indigo-500/20 text-indigo-400 rounded-3xl border border-indigo-500/30 shadow-inner">
              <Lock className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                Members-Only Feature Access
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                Vice City AI Tactical Intelligence is an exclusive copilot reserved for registered community members. Sign in or create a free player profile to unlock real-time heist strategies, vehicle tuning parameters, and weapon ballistics advice.
              </p>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-xl shadow-indigo-600/30 inline-flex items-center gap-2 cursor-pointer transform hover:scale-[1.02]"
              >
                <Lock className="w-4 h-4 text-indigo-200" />
                <span>Sign In or Create Free Account</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Topic Category Selector */}
        <div>
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>Select Domain Intel Topic:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {TOPICS_CONFIG.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTopic(t.id);
                  setResponse(null);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                  topic === t.id
                    ? 'bg-indigo-600 text-white border border-indigo-400 shadow-md shadow-indigo-600/30 scale-[1.02]'
                    : 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                <span className={topic === t.id ? 'text-white' : 'text-indigo-400'}>
                  {t.icon}
                </span>
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Quick Prompts for {currentTopicConfig.label}:</span>
          <div className="flex flex-wrap gap-1.5">
            {currentTopicConfig.suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(s)}
                className="text-[11px] text-zinc-300 bg-zinc-950/70 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-indigo-500/50 px-2.5 py-1 rounded-lg transition-all text-left flex items-center gap-1 group"
              >
                <span>{s}</span>
                <ArrowRight className="w-2.5 h-2.5 text-zinc-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Form Query Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder={currentTopicConfig.placeholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition shadow-inner"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {currentTopicConfig.toolLink && onNavigate ? (
              <button
                type="button"
                onClick={() => handleToolJump(currentTopicConfig.toolLink!.tab)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition px-2 py-1 rounded-lg hover:bg-indigo-500/10"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Jump directly to {currentTopicConfig.toolLink.name}</span>
              </button>
            ) : <div />}

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/25 ml-auto cursor-pointer"
            >
              {loading ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>Analyzing Telemetry...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Get Tactical Advice</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Response Display */}
        {response && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3 text-xs sm:text-sm shadow-xl">
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Advisor Analysis: {currentTopicConfig.label}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {isSecurityRefusal ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Protected
                  </span>
                ) : isFallbackMode ? (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                    Cached Grounding Mode
                  </span>
                ) : (
                  <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini 3.6 Live
                  </span>
                )}
              </div>
            </div>

            <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed space-y-1">
              {response}
            </div>

            {/* Quick Action Navigation Buttons in Response */}
            {onNavigate && (
              <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] text-zinc-500 font-bold">Recommended Platform Tools:</span>
                <button
                  onClick={() => handleToolJump('vehicles')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-bold transition flex items-center gap-1"
                >
                  🏎️ Vehicles
                </button>
                <button
                  onClick={() => handleToolJump('handling-editor')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-bold transition flex items-center gap-1"
                >
                  ⚙️ Handling Editor
                </button>
                <button
                  onClick={() => handleToolJump('weapons')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-bold transition flex items-center gap-1"
                >
                  🔫 Weapons
                </button>
                <button
                  onClick={() => handleToolJump('map')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-bold transition flex items-center gap-1"
                >
                  🗺️ Map
                </button>
                <button
                  onClick={() => handleToolJump('roi-calculator')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-bold transition flex items-center gap-1"
                >
                  💼 Business ROI
                </button>
                <button
                  onClick={() => handleToolJump('rp-servers')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-[11px] font-bold transition flex items-center gap-1"
                >
                  🎭 FiveM RP
                </button>
              </div>
            )}
          </div>
        )}
        </>
        )}

      </div>
    </div>
  );
};
