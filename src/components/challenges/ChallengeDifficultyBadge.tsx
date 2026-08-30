import React, { useState } from 'react';
import {
  ChallengeDifficultyInfo,
  calculateChallengeDifficulty,
  TuningChallenge,
  ChallengeConstraints,
  ChallengeTargetMetric
} from '../../lib/tuning-challenges';
import {
  Shield,
  Medal,
  Crown,
  Sparkles,
  Zap,
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';

export interface ChallengeDifficultyBadgeProps {
  challenge?: TuningChallenge | {
    constraints: ChallengeConstraints;
    targetMetric?: ChallengeTargetMetric;
    baseVehicle?: string;
  } | null;
  difficultyInfo?: ChallengeDifficultyInfo;
  size?: 'sm' | 'md' | 'lg';
  showDetailsButton?: boolean;
  interactive?: boolean;
}

export const ChallengeDifficultyBadge: React.FC<ChallengeDifficultyBadgeProps> = ({
  challenge,
  difficultyInfo,
  size = 'md',
  showDetailsButton = true,
  interactive = true
}) => {
  const [showModal, setShowModal] = useState(false);

  const info: ChallengeDifficultyInfo = React.useMemo(() => {
    if (difficultyInfo) return difficultyInfo;
    if (challenge) return calculateChallengeDifficulty(challenge);
    return calculateChallengeDifficulty({
      constraints: {
        maxWeight: 1500,
        allowedDrivetrain: 'ANY'
      }
    });
  }, [challenge, difficultyInfo]);

  // Visual assets based on tier
  const tierConfig = {
    Platinum: {
      icon: Sparkles,
      iconColor: 'text-cyan-300',
      pips: ['◆', '◆', '◆', '◆'],
      pipColor: 'text-cyan-300',
      badgeClass:
        'bg-gradient-to-r from-cyan-950/90 via-sky-900/80 to-fuchsia-950/90 border border-cyan-400/70 text-cyan-100 shadow-[0_0_18px_rgba(56,189,248,0.35)]',
      glowRing: 'ring-1 ring-cyan-400/40',
      badgeTag: 'Masterclass'
    },
    Gold: {
      icon: Crown,
      iconColor: 'text-amber-400',
      pips: ['◆', '◆', '◆', '◇'],
      pipColor: 'text-amber-400',
      badgeClass:
        'bg-gradient-to-r from-amber-950/90 via-yellow-950/80 to-amber-900/90 border border-amber-400/70 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
      glowRing: 'ring-1 ring-amber-400/40',
      badgeTag: 'Advanced'
    },
    Silver: {
      icon: Medal,
      iconColor: 'text-slate-200',
      pips: ['◆', '◆', '◇', '◇'],
      pipColor: 'text-slate-300',
      badgeClass:
        'bg-gradient-to-r from-slate-900/95 via-zinc-800/90 to-slate-900/95 border border-slate-400/60 text-slate-100 shadow-[0_0_12px_rgba(203,213,225,0.2)]',
      glowRing: 'ring-1 ring-slate-400/30',
      badgeTag: 'Intermediate'
    },
    Bronze: {
      icon: Shield,
      iconColor: 'text-amber-500',
      pips: ['◆', '◇', '◇', '◇'],
      pipColor: 'text-amber-500',
      badgeClass:
        'bg-gradient-to-r from-amber-950/90 via-orange-950/85 to-zinc-900/95 border border-amber-700/60 text-amber-200 shadow-[0_0_10px_rgba(217,119,6,0.18)]',
      glowRing: 'ring-1 ring-amber-700/30',
      badgeTag: 'Standard'
    }
  }[info.tier];

  const Icon = tierConfig.icon;

  return (
    <>
      <div
        onClick={() => interactive && setShowModal(true)}
        className={`inline-flex items-center gap-2 rounded-full transition-all duration-200 select-none ${
          tierConfig.badgeClass
        } ${tierConfig.glowRing} ${
          interactive ? 'cursor-pointer hover:scale-105 hover:brightness-110 active:scale-95' : ''
        } ${
          size === 'sm'
            ? 'px-2.5 py-0.5 text-[10px]'
            : size === 'lg'
            ? 'px-4 py-1.5 text-xs'
            : 'px-3 py-1 text-xs'
        }`}
        title={`Click to inspect ${info.tier} difficulty constraint factors`}
      >
        <div className="flex items-center gap-1.5 font-black uppercase tracking-wider">
          <Icon
            className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${
              tierConfig.iconColor
            } shrink-0 animate-pulse`}
          />
          <span>{info.label}</span>
        </div>

        <span className="text-[10px] font-mono font-bold opacity-80 border-l border-white/20 pl-2">
          {tierConfig.badgeTag}
        </span>

        {/* Rating Diamond Pips */}
        <div className="flex items-center gap-0.5 font-mono text-[9px] tracking-tight">
          {tierConfig.pips.map((pip, idx) => (
            <span
              key={idx}
              className={pip === '◆' ? tierConfig.pipColor : 'text-zinc-600 opacity-60'}
            >
              {pip}
            </span>
          ))}
        </div>

        {showDetailsButton && interactive && (
          <span className="w-3.5 h-3.5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[9px] text-white/80 shrink-0 ml-0.5">
            ?
          </span>
        )}
      </div>

      {/* Interactive Difficulty Breakdown Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${tierConfig.badgeClass}`}>
                  <Icon className={`w-5 h-5 ${tierConfig.iconColor}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white uppercase tracking-wider">
                      {info.label}
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold">
                      {info.score}/10 Strictness
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{info.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
              {info.description}
            </div>

            {/* Strictness Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300 uppercase">
                <span>Active Constraint Factors:</span>
                <span className="font-mono text-rose-400">{info.reasons.length} Rule Multipliers</span>
              </div>

              {info.reasons.length === 0 ? (
                <div className="p-3 bg-zinc-900 rounded-xl text-xs text-zinc-400">
                  Open specification format with default vehicle handling tolerance.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {info.reasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-start gap-2 text-xs text-zinc-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="font-mono leading-tight">{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Difficulty Scale Reference Bar */}
            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                ViceIntel Championship Tier Scale:
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold font-mono">
                <div
                  className={`p-1 rounded-lg ${
                    info.tier === 'Bronze'
                      ? 'bg-amber-900/60 border border-amber-600 text-amber-300 font-black'
                      : 'bg-zinc-950/60 text-zinc-500'
                  }`}
                >
                  Bronze (1-2)
                </div>
                <div
                  className={`p-1 rounded-lg ${
                    info.tier === 'Silver'
                      ? 'bg-slate-700/60 border border-slate-400 text-slate-100 font-black'
                      : 'bg-zinc-950/60 text-zinc-500'
                  }`}
                >
                  Silver (3-4)
                </div>
                <div
                  className={`p-1 rounded-lg ${
                    info.tier === 'Gold'
                      ? 'bg-amber-500/30 border border-amber-400 text-amber-200 font-black'
                      : 'bg-zinc-950/60 text-zinc-500'
                  }`}
                >
                  Gold (5-6)
                </div>
                <div
                  className={`p-1 rounded-lg ${
                    info.tier === 'Platinum'
                      ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-black'
                      : 'bg-zinc-950/60 text-zinc-500'
                  }`}
                >
                  Platinum (7+)
                </div>
              </div>
            </div>

            {/* Footer action */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
            >
              Got it, close details
            </button>
          </div>
        </div>
      )}
    </>
  );
};
