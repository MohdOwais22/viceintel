'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  TuningChallenge,
  ChallengeEntry,
  getActiveTuningChallenge,
  evaluateTuneForChallenge,
  submitChallengeTune,
  subscribeToChallengeLeaderboard
} from '../../lib/tuning-challenges';
import { ChallengeDifficultyBadge } from './ChallengeDifficultyBadge';
import {
  HandlingData,
  CalculatedTelemetry,
  calculateCalculatedStats
} from '../../lib/handling-calculator';
import {
  Trophy,
  Flame,
  Clock,
  Crown,
  Download,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
  Medal,
  Award,
  ArrowRight,
  Share2,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { LeaderboardShareCardModal } from './LeaderboardShareCardModal';
import { ENV } from '../../lib/envConfig';

export interface TuningChallengesTabProps {
  currentUser: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  isVipActive?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  onOpenAuthModal: () => void;
  onNavigateToHandlingEditor?: (data: HandlingData) => void;
}

export const TuningChallengesTab: React.FC<TuningChallengesTabProps> = ({
  currentUser,
  isVipActive,
  isAdmin,
  isStaff,
  onOpenAuthModal,
  onNavigateToHandlingEditor
}) => {
  const [activeChallenge, setActiveChallenge] = useState<TuningChallenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedEntryForInspect, setSelectedEntryForInspect] = useState<ChallengeEntry | null>(null);
  const [shareEntry, setShareEntry] = useState<{ entry: ChallengeEntry; rank: number } | null>(null);
  const [viewTab, setViewTab] = useState<'tune_and_rank' | 'hall_of_fame'>('tune_and_rank');
  const [pastChallenges, setPastChallenges] = useState<TuningChallenge[]>([]);

  const pastChallengesCombined = useMemo(() => {
    return [...pastChallenges].sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
  }, [pastChallenges]);

  // Tuner form state
  const [buildTitle, setBuildTitle] = useState('');
  const [handlingTune, setHandlingTune] = useState<HandlingData>({
    fMass: 1420,
    fInitialDragCoeff: 7.5,
    fInitialDriveForce: 0.42,
    fDriveBiasFront: 0.0,
    fTractionCurveMax: 2.45,
    fTractionCurveMin: 2.15,
    fSuspensionForce: 2.8,
    fBrakeForce: 1.25,
    nInitialDriveGears: 6,
    fTractionLossMult: 1.05
  });

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function loadChallenge() {
      try {
        const challenge = await getActiveTuningChallenge();
        setActiveChallenge(challenge);
        setBuildTitle(`Apex ${challenge.baseVehicle} Spec`);
      } catch (err) {
        console.error('Failed to load challenge:', err);
      } finally {
        setLoading(false);
      }
    }
    loadChallenge();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'past_challenges'), orderBy('archivedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const pastList: TuningChallenge[] = [];
      snap.forEach((d) => {
        pastList.push({ ...d.data(), id: d.id } as TuningChallenge);
      });
      setPastChallenges(pastList);
    }, (err) => {
      console.error('Failed to subscribe to past challenges:', err);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeChallenge) return;
    const unsub = subscribeToChallengeLeaderboard(
      activeChallenge.id,
      activeChallenge.targetMetric,
      (entries) => {
        setLeaderboard(entries);
      }
    );
    return () => unsub();
  }, [activeChallenge]);

  useEffect(() => {
    if (!activeChallenge?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, activeChallenge.expiresAt - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeChallenge]);

  const evaluation = useMemo(() => {
    if (!activeChallenge) return null;
    return evaluateTuneForChallenge(activeChallenge, handlingTune);
  }, [activeChallenge, handlingTune]);

  // Real-time Physics Integrity & Constraint Compliance Engine
  const physicsIntegrity = useMemo(() => {
    if (!activeChallenge) {
      return {
        score: 100,
        status: 'Optimal',
        violationsCount: 0,
        color: '#10b981',
        badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        strokeDashoffset: 0,
        circumference: 113.097
      };
    }

    const constraintsObj = activeChallenge.constraints || {};
    const totalConstraints = Math.max(1, Object.keys(constraintsObj).length || 4);
    const violationCount = evaluation?.violations?.length || 0;

    let score = 100;
    if (!evaluation || !evaluation.isValid || violationCount > 0) {
      const passed = Math.max(0, totalConstraints - violationCount);
      score = Math.max(15, Math.round((passed / totalConstraints) * 75));
    }

    let status = '100% Verified — Optimal Physics';
    let color = '#10b981';
    let badgeBg = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';

    if (score === 100) {
      status = '100% Verified — Optimal Physics';
      color = '#10b981';
      badgeBg = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    } else if (score >= 70) {
      status = `${violationCount} Minor Regulation Warning`;
      color = '#f59e0b';
      badgeBg = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    } else {
      status = `${violationCount} Critical Violation${violationCount === 1 ? '' : 's'}`;
      color = '#f43f5e';
      badgeBg = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    }

    const radius = 18;
    const circumference = 2 * Math.PI * radius; // 113.097
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return {
      score,
      status,
      violationsCount: violationCount,
      color,
      badgeBg,
      strokeDashoffset,
      circumference
    };
  }, [activeChallenge, evaluation]);

  const handleSliderChange = (field: keyof HandlingData, value: number) => {
    setHandlingTune((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitTune = async () => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    if (!activeChallenge) return;

    if (evaluation && !evaluation.isValid) {
      showToast(`❌ Constraint Violation: ${evaluation.violations[0]}`);
      return;
    }

    setSubmitting(true);
    try {
      await submitChallengeTune(
        activeChallenge,
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Vice Tuner',
          avatar: currentUser.photoURL || '',
          isVip: isVipActive,
          clearanceLevel: isAdmin ? 'L4 Admin' : isStaff ? 'L3 Staff' : isVipActive ? 'L2 VIP' : 'L1 Citizen'
        },
        handlingTune,
        buildTitle
      );
      showToast(`🏆 Build Submitted! Score: ${evaluation?.metricDisplay}`);
    } catch (err: any) {
      showToast(`Error submitting entry: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportToEditor = (tune?: HandlingData) => {
    const target = tune || handlingTune;
    try {
      localStorage.setItem('gtavi_imported_handling_data', JSON.stringify(target));
      if (onNavigateToHandlingEditor) {
        onNavigateToHandlingEditor(target);
      } else {
        showToast('✅ Tune saved for Handling Editor!');
      }
    } catch (e) {
      showToast('Notice: Could not write to local storage.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-400 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-xs uppercase tracking-wider text-zinc-300">
          Loading Community Tuning Championship...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-900 border border-rose-500 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Active Challenge Spotlight Banner */}
      {activeChallenge && (
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Target: {activeChallenge.metricLabel}</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 font-bold text-xs">
                  Base: {activeChallenge.baseVehicle}
                </span>
                <ChallengeDifficultyBadge
                  challenge={activeChallenge}
                  size="md"
                  showDetailsButton={true}
                  interactive={true}
                />
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950/80 border border-zinc-800 rounded-full text-xs font-mono font-bold text-rose-400">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>
                    {timeLeft.days}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m
                  </span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                {activeChallenge.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
                {activeChallenge.description}
              </p>

              {/* Constraints Highlights */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-zinc-400">Regulations:</span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-mono">
                  Max Weight: {activeChallenge.constraints.maxWeight} kg
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-mono">
                  Drivetrain: {activeChallenge.constraints.allowedDrivetrain}
                </span>
                {activeChallenge.constraints.maxDriveForce && (
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-mono">
                    Max Drive Force: {activeChallenge.constraints.maxDriveForce}
                  </span>
                )}
              </div>
            </div>

            {/* Prize Box */}
            <div className="bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                1st Place Grand Prize
              </h3>
              <div className="text-lg font-black text-white font-mono">500 VC Cash</div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                + "Master Tuner" VIP Profile Badge & Permanent Hall of Fame Induction
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setViewTab('tune_and_rank')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            viewTab === 'tune_and_rank'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Interactive Tuner & Leaderboard</span>
        </button>

        <button
          onClick={() => setViewTab('hall_of_fame')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
            viewTab === 'hall_of_fame'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900'
          }`}
        >
          <Medal className="w-4 h-4" />
          <span>Hall of Fame</span>
        </button>
      </div>

      {viewTab === 'tune_and_rank' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tuner Bench (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Live Tuning Bench
                  </h3>
                </div>
                <span className="text-xs text-zinc-400">Physics Evaluation Engine</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Spec / Build Title</label>
                <input
                  type="text"
                  value={buildTitle}
                  onChange={(e) => setBuildTitle(e.target.value)}
                  placeholder="e.g. Apex Stage 3 Drag Setup"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Physics Integrity Indicator & Live Progress Ring */}
              <div className="bg-zinc-950/90 border border-zinc-800/90 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-inner">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Circular Progress Ring */}
                  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                      {/* Background track */}
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        fill="transparent"
                        className="text-zinc-800/80"
                      />
                      {/* Animated Progress Ring */}
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        stroke={physicsIntegrity.color}
                        strokeWidth="3.5"
                        strokeDasharray={physicsIntegrity.circumference}
                        strokeDashoffset={physicsIntegrity.strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        style={{ transition: 'stroke-dashoffset 0.35s ease, stroke 0.35s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span
                        className="text-[11px] font-black font-mono leading-none"
                        style={{ color: physicsIntegrity.color }}
                      >
                        {physicsIntegrity.score}%
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck
                        className="w-3.5 h-3.5"
                        style={{ color: physicsIntegrity.color }}
                      />
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Physics Integrity
                      </span>
                      <span className="relative flex h-2 w-2">
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: physicsIntegrity.color }}
                        />
                        <span
                          className="relative inline-flex rounded-full h-2 w-2"
                          style={{ backgroundColor: physicsIntegrity.color }}
                        />
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {physicsIntegrity.status} • Target: <span className="text-rose-400 font-bold font-mono">{activeChallenge?.metricLabel}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Regulations
                  </div>
                  <div
                    className="text-xs font-mono font-bold"
                    style={{ color: physicsIntegrity.color }}
                  >
                    {physicsIntegrity.violationsCount === 0 ? '✓ 0 Violations' : `⚠ ${physicsIntegrity.violationsCount} Violations`}
                  </div>
                </div>
              </div>

              {/* Telemetry Preview */}
              {evaluation && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      {activeChallenge?.metricLabel}
                    </span>
                    <div className="text-base font-black text-rose-400 font-mono">
                      {evaluation.metricDisplay}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">0-60 MPH</span>
                    <div className="text-base font-black text-emerald-400 font-mono">
                      {evaluation.telemetry.zeroToSixtySec}s
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">1/4 Mile ET</span>
                    <div className="text-base font-black text-cyan-400 font-mono">
                      {evaluation.telemetry.quarterMileSec}s
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Lateral Grip</span>
                    <div className="text-base font-black text-amber-400 font-mono">
                      {evaluation.telemetry.corneringGForce}G
                    </div>
                  </div>
                </div>
              )}

              {/* Live Rule Verification Box */}
              {evaluation && (
                <div
                  className={`p-4 rounded-2xl border ${
                    evaluation.isValid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-xs uppercase">
                    {evaluation.isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>All Regulations Met — Eligible for Leaderboard</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Violations Detected ({evaluation.violations.length})</span>
                      </>
                    )}
                  </div>
                  {!evaluation.isValid && (
                    <ul className="mt-2 space-y-1 text-xs text-rose-300 font-mono list-disc list-inside">
                      {evaluation.violations.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Sliders */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-300">
                      Vehicle Mass (<code className="text-rose-400">fMass</code>)
                    </span>
                    <span className="font-mono font-bold text-white">{handlingTune.fMass} kg</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={2200}
                    step={10}
                    value={handlingTune.fMass}
                    onChange={(e) => handleSliderChange('fMass', Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-300">
                      Drive Force (<code className="text-rose-400">fInitialDriveForce</code>)
                    </span>
                    <span className="font-mono font-bold text-white">
                      {handlingTune.fInitialDriveForce.toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={0.65}
                    step={0.01}
                    value={handlingTune.fInitialDriveForce}
                    onChange={(e) => handleSliderChange('fInitialDriveForce', Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-300">
                      Aerodynamic Drag (<code className="text-rose-400">fInitialDragCoeff</code>)
                    </span>
                    <span className="font-mono font-bold text-white">
                      {handlingTune.fInitialDragCoeff.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3.0}
                    max={15.0}
                    step={0.2}
                    value={handlingTune.fInitialDragCoeff}
                    onChange={(e) => handleSliderChange('fInitialDragCoeff', Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-300">
                      Torque Split (<code className="text-rose-400">fDriveBiasFront</code>)
                    </span>
                    <span className="font-mono font-bold text-white">
                      {handlingTune.fDriveBiasFront === 0 ? '100% RWD' : handlingTune.fDriveBiasFront === 1 ? '100% FWD' : 'AWD Split'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.1}
                    value={handlingTune.fDriveBiasFront}
                    onChange={(e) => handleSliderChange('fDriveBiasFront', Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
                <button
                  onClick={handleSubmitTune}
                  disabled={submitting || (evaluation !== null && !evaluation.isValid)}
                  className="w-full sm:flex-1 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Tune...</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4" />
                      <span>Submit to Leaderboard</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleExportToEditor()}
                  className="w-full sm:w-auto px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Open in Handling Editor</span>
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Live Rankings ({leaderboard.length})
                  </h3>
                </div>
                <div
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800 self-start sm:self-auto"
                  title="Official Championship Tie-Break Rule: If two tuners achieve the identical score, the entry submitted earlier in the week is awarded the higher rank."
                >
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Tie-Break: Earliest Submission Takes Higher Rank</span>
                </div>
              </div>

              {leaderboard.length === 0 ? (
                <div className="py-12 text-center bg-zinc-950/60 rounded-2xl border border-dashed border-zinc-800 p-6 space-y-3">
                  <Award className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h4 className="text-xs font-bold text-zinc-300 uppercase">No Submissions Yet</h4>
                  <p className="text-[11px] text-zinc-500">
                    Be the first tuner to submit a qualifying setup!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false} mode="popLayout">
                    {leaderboard.map((entry, index) => {
                      const rank = index + 1;
                      const isGold = rank === 1;
                      const isSilver = rank === 2;
                      const isBronze = rank === 3;
                      const isOwnSubmission = currentUser?.uid === entry.userUid;

                      // Check if this entry shares the exact same score with an adjacent competitor (tied score)
                      const isTiedScore = leaderboard.some(
                        (other, otherIdx) =>
                          otherIdx !== index && Math.abs(other.metricValue - entry.metricValue) < 0.00001
                      );

                      return (
                        <motion.div
                          key={entry.id}
                          layout
                          initial={{ opacity: 0, y: -20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          transition={{
                            layout: { type: 'spring', stiffness: 350, damping: 28 },
                            opacity: { duration: 0.3 },
                            scale: { duration: 0.3 }
                          }}
                          className={`p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 relative overflow-hidden ${
                            isGold
                              ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-lg shadow-amber-500/10'
                              : isSilver
                              ? 'bg-zinc-800/80 border-zinc-700 text-zinc-100'
                              : isBronze
                              ? 'bg-amber-900/20 border-amber-800/50 text-zinc-200'
                              : isOwnSubmission
                              ? 'bg-rose-950/20 border-rose-500/40 text-zinc-200'
                              : 'bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          {isOwnSubmission && (
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500" />
                          )}

                          <div className="flex items-center gap-3 min-w-0">
                            <motion.div
                              layout
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isGold
                                  ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                                  : isSilver
                                  ? 'bg-zinc-300 text-zinc-950'
                                  : isBronze
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-zinc-800 text-zinc-400 font-mono'
                              }`}
                            >
                              {rank}
                            </motion.div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-white truncate">
                                  {entry.userName}
                                </span>
                                {isOwnSubmission && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/20 border border-rose-500/30 text-rose-300">
                                    You
                                  </span>
                                )}
                                {entry.isVip && (
                                  <span title="VIP Member" className="inline-flex items-center">
                                    <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                                  </span>
                                )}
                                {isTiedScore && (
                                  <span
                                    title={`Tied score: Ranked by submission time (${entry.submittedAt ? new Date(entry.submittedAt).toLocaleString() : 'Week Seed'})`}
                                    className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300"
                                  >
                                    Tie-Break: Earlier Entry
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {entry.buildTitle}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-2">
                            <div>
                              <motion.div
                                key={entry.metricDisplay}
                                initial={{ scale: 1.15, color: '#fb7185' }}
                                animate={{ scale: 1, color: '#f43f5e' }}
                                transition={{ duration: 0.3 }}
                                className="text-xs font-black font-mono text-rose-400"
                              >
                                {entry.metricDisplay}
                              </motion.div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                0-60: {entry.telemetry.zeroToSixtySec}s
                              </div>
                            </div>

                            {/* Share card generator exclusive to top 3 podium players */}
                            {rank <= 3 && (
                              <button
                                onClick={() => setShareEntry({ entry, rank })}
                                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-500/60 transition cursor-pointer"
                                title="Generate & Share OpenGraph Social Card (Top 3 Exclusive)"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedEntryForInspect(entry)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                              title="Inspect Handling Variables & Submission Audit"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewTab === 'hall_of_fame' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Championship Hall of Fame</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Celebrating Vice City's master tuners, dynamic physics configs, and official leaderboard record-holders.
                </p>
              </div>
              <div className="px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 self-start sm:self-center">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Permanent Induction Records</span>
              </div>
            </div>

            {/* Grid of Past Champions */}
            {pastChallengesCombined.length === 0 ? (
              <div className="text-center py-12 bg-zinc-950/60 border border-zinc-800/60 rounded-2xl space-y-3">
                <Award className="w-12 h-12 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-zinc-300 uppercase">No Inductions Loaded</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Once active weekly challenges expire, winners are automatically inducted into the permanent Hall of Fame here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastChallengesCombined.map((pc, idx) => {
                  const isDrift = pc.targetMetric === 'drift_angle';
                  const isSpeed = pc.targetMetric === 'top_speed';
                  
                  return (
                    <motion.div
                      key={pc.id || `fallback-${idx}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className="relative overflow-hidden bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition"
                    >
                      {/* Decorative Accent Header */}
                      <div className={`h-1.5 w-full bg-gradient-to-r ${
                        isDrift ? 'from-purple-500 to-rose-500' :
                        isSpeed ? 'from-amber-500 to-yellow-500' :
                        'from-teal-500 to-emerald-500'
                      }`} />

                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                              {pc.metricLabel || (isDrift ? 'Drift Showdown' : isSpeed ? 'Speed Trap' : 'Drag Strip')}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {pc.archivedAt ? new Date(pc.archivedAt).toLocaleDateString() : 'Historical Induction'}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">
                            {pc.title}
                          </h4>
                          <p className="text-xs text-zinc-400 line-clamp-2">
                            {pc.description}
                          </p>
                        </div>

                        {/* Champion Spotlight Block */}
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 p-0.5 shrink-0 flex items-center justify-center">
                              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-amber-400" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                                Grand Champion
                              </div>
                              <div className="text-xs font-black text-zinc-100 truncate flex items-center gap-1">
                                <span>{pc.winnerName || 'Anonymous Tuner'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Score</div>
                            <div className="text-xs font-mono font-black text-white">
                              {pc.winnerMetricDisplay || pc.winnerScore || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Specs Overview */}
                        <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono py-1">
                          <div className="bg-zinc-900/40 border border-zinc-800/40 p-2 rounded-lg text-zinc-400">
                            <span className="block text-[8px] uppercase font-bold text-zinc-500">Vehicle</span>
                            <span className="text-zinc-200 font-bold truncate block">{pc.baseVehicle}</span>
                          </div>
                          <div className="bg-zinc-900/40 border border-zinc-800/40 p-2 rounded-lg text-zinc-400">
                            <span className="block text-[8px] uppercase font-bold text-zinc-500">Participants</span>
                            <span className="text-zinc-200 font-bold block">{pc.totalSubmissions || 12} Drivers</span>
                          </div>
                        </div>

                        {/* Actions */}
                        {pc.handlingData && (
                          <button
                            onClick={() => {
                              handleExportToEditor(pc.handlingData);
                              showToast(`Loaded winning handling.meta spec for ${pc.baseVehicle}!`);
                            }}
                            className="w-full py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/20 hover:border-rose-500 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Load Winning Spec</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspect Handling Modal */}
      {selectedEntryForInspect && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase">
                  {selectedEntryForInspect.buildTitle}
                </h3>
                <p className="text-xs text-zinc-400">
                  Tuned by {selectedEntryForInspect.userName} • Score: {selectedEntryForInspect.metricDisplay}
                </p>
              </div>
              <button
                onClick={() => setSelectedEntryForInspect(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Submission Timestamp Audit for Tie-Breaker Verification */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-900/90 px-3 py-2 rounded-xl border border-zinc-800/80">
              <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Submission Time (Tie-Breaker):</span>
              </span>
              <span className="font-mono text-zinc-200">
                {selectedEntryForInspect.submittedAt
                  ? new Date(selectedEntryForInspect.submittedAt).toLocaleString()
                  : 'Official Round Opening Entry'}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-300 uppercase">Handling.meta Parameters:</span>
              <div className="bg-zinc-900 p-3.5 rounded-xl font-mono text-xs text-zinc-300 space-y-1 max-h-60 overflow-y-auto">
                <div>fMass: <span className="text-rose-400">{selectedEntryForInspect.handlingData.fMass}</span></div>
                <div>fInitialDriveForce: <span className="text-rose-400">{selectedEntryForInspect.handlingData.fInitialDriveForce}</span></div>
                <div>fInitialDragCoeff: <span className="text-rose-400">{selectedEntryForInspect.handlingData.fInitialDragCoeff}</span></div>
                <div>fDriveBiasFront: <span className="text-rose-400">{selectedEntryForInspect.handlingData.fDriveBiasFront}</span></div>
                <div>fTractionCurveMax: <span className="text-rose-400">{selectedEntryForInspect.handlingData.fTractionCurveMax}</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {(() => {
                const entryIndex = leaderboard.findIndex((e) => e.id === selectedEntryForInspect.id);
                const entryRank = entryIndex >= 0 ? entryIndex + 1 : 1;
                if (entryRank > 3) return null;
                return (
                  <button
                    onClick={() => {
                      setShareEntry({ entry: selectedEntryForInspect, rank: entryRank });
                      setSelectedEntryForInspect(null);
                    }}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Generate Share Card (Top 3 Podium Exclusive)"
                  >
                    <Share2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Share Card</span>
                  </button>
                );
              })()}

              <button
                onClick={() => {
                  handleExportToEditor(selectedEntryForInspect.handlingData);
                  setSelectedEntryForInspect(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <Download className="w-4 h-4" />
                <span>Import to Handling Editor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Media OpenGraph Card Generator Modal */}
      {shareEntry && (
        <LeaderboardShareCardModal
          entry={shareEntry.entry}
          rank={shareEntry.rank}
          totalEntries={leaderboard.length}
          challengeTitle={activeChallenge?.title}
          vehicleName={activeChallenge?.baseVehicle}
          onClose={() => setShareEntry(null)}
        />
      )}
    </div>
  );
};
