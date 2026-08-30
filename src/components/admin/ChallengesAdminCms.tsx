'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Crown,
  Zap,
  Sliders,
  Calendar,
  Clock,
  Car,
  Award,
  Sparkles,
  Flame,
  X,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert,
  Coins,
  Send,
  ExternalLink,
  ArrowRight,
  HelpCircle,
  FileCode,
  Share2
} from 'lucide-react';
import { LeaderboardShareCardModal } from '../challenges/LeaderboardShareCardModal';
import {
  TuningChallenge,
  ChallengeEntry,
  ChallengeTargetMetric,
  ROTATION_CHALLENGES,
  ACTIVE_CHALLENGE_DOC_ID,
  fetchAllAdminChallenges,
  saveAdminChallenge,
  setActiveAdminChallenge,
  deleteAdminChallenge,
  disqualifyChallengeEntry,
  awardManualBonusVc,
  subscribeToChallengeLeaderboard,
  getNextSundayMidnightUtc
} from '../../lib/tuning-challenges';
import { generateHandlingMetaXML, HandlingData } from '../../lib/handling-calculator';
import { copyToClipboard } from '../../lib/copyUtils';

const CAR_OPTIONS = [
  { name: 'Grotti Furia V12', slug: 'grotti-furia', category: 'Super', defaultWeight: 1420 },
  { name: 'Declasse Drift Tampa Spec-D', slug: 'declasse-drift-tampa', category: 'Muscle / Drift', defaultWeight: 1350 },
  { name: 'Bravado Banshee GTS', slug: 'bravado-banshee-900r', category: 'Sports', defaultWeight: 1480 },
  { name: 'Pegassi Torero XO Hypercar', slug: 'pegassi-torero-xo', category: 'Hypercar', defaultWeight: 1520 },
  { name: 'Bravado Buffalo EV Interceptor', slug: 'bravado-buffalo-ev', category: 'Electric Sports', defaultWeight: 1850 },
  { name: 'Pfister Comet S2 Cabrio', slug: 'pfister-comet-s2', category: 'Sports', defaultWeight: 1410 },
  { name: 'Albany Hermes Lowrider', slug: 'albany-hermes', category: 'Muscle', defaultWeight: 1650 },
  { name: 'Declasse Vigero ZX Drag', slug: 'declasse-vigero-zx', category: 'Muscle', defaultWeight: 1540 },
  { name: 'Vapid Dominator GT Track Spec', slug: 'vapid-dominator-gt', category: 'Muscle', defaultWeight: 1490 },
  { name: 'Vapid Sandking XL Heavy 4x4', slug: 'vapid-sandking-xl', category: 'Off-Road', defaultWeight: 2400 }
];

const PRESET_TEMPLATES = [
  {
    title: 'Ocean Drive Top Speed Run',
    description: 'Optimize maximum velocity down Ocean Beach straightaway under strict naturally aspirated drag constraints.',
    baseVehicle: 'Grotti Furia V12',
    vehicleSlug: 'grotti-furia',
    targetMetric: 'top_speed' as ChallengeTargetMetric,
    metricLabel: 'Top Speed',
    metricUnit: 'MPH',
    constraints: {
      maxWeight: 1450,
      minWeight: 1200,
      allowedDrivetrain: 'RWD' as const,
      maxDriveForce: 0.48
    },
    prizeDescription: '500 VC Cash + "Master Tuner" Exclusive Profile Badge + Featured Homepage Build',
    rewardVc: 500
  },
  {
    title: 'Downtown Alleyway Drift King',
    description: 'Engineer the ultimate snap-oversteer drift balance. Maximize slip angle while maintaining throttle controllability.',
    baseVehicle: 'Declasse Drift Tampa Spec-D',
    vehicleSlug: 'declasse-drift-tampa',
    targetMetric: 'drift_angle' as ChallengeTargetMetric,
    metricLabel: 'Drift Score & Slip Angle',
    metricUnit: 'PTS',
    constraints: {
      maxWeight: 1350,
      allowedDrivetrain: 'RWD' as const,
      maxBrakeForce: 1.6
    },
    prizeDescription: '500 VC Cash + "Drift Master" Profile Badge + Hall of Fame Showcase',
    rewardVc: 500
  },
  {
    title: 'Everglades Strip Quarter-Mile Drag',
    description: 'Dial in gear ratios, launch grip, and torque curves for the Banshee to set the fastest 1/4 mile ET in Leonida history.',
    baseVehicle: 'Bravado Banshee GTS',
    vehicleSlug: 'bravado-banshee-900r',
    targetMetric: 'quarter_mile' as ChallengeTargetMetric,
    metricLabel: '1/4 Mile ET',
    metricUnit: 'Seconds',
    constraints: {
      maxWeight: 1550,
      allowedDrivetrain: 'ANY' as const,
      maxDriveForce: 0.52
    },
    prizeDescription: '500 VC Cash + "Drag King" Profile Badge + Homepage Feature',
    rewardVc: 500
  },
  {
    title: 'Vice Port Heavy Hauler Drag War',
    description: 'Build a high-torque 4x4 diesel monster that launches off the line with maximum traction and massive brake authority.',
    baseVehicle: 'Vapid Sandking XL Heavy 4x4',
    vehicleSlug: 'vapid-sandking-xl',
    targetMetric: 'quarter_mile' as ChallengeTargetMetric,
    metricLabel: '1/4 Mile ET',
    metricUnit: 'Seconds',
    constraints: {
      maxWeight: 2600,
      minWeight: 2100,
      allowedDrivetrain: 'AWD' as const,
      maxDriveForce: 0.55
    },
    prizeDescription: '750 VC Cash + "Heavy Hauler" Profile Badge',
    rewardVc: 750
  },
  {
    title: 'Biscayne Bay EV Hypercar Sprint',
    description: 'Push electric powertrain torque vectoring to the bleeding edge under tight battery weight regulations.',
    baseVehicle: 'Bravado Buffalo EV Interceptor',
    vehicleSlug: 'bravado-buffalo-ev',
    targetMetric: 'top_speed' as ChallengeTargetMetric,
    metricLabel: 'Top Speed',
    metricUnit: 'MPH',
    constraints: {
      maxWeight: 1950,
      minWeight: 1750,
      allowedDrivetrain: 'AWD' as const,
      maxDriveForce: 0.50
    },
    prizeDescription: '600 VC Cash + "EV Apex Tuner" Profile Badge',
    rewardVc: 600
  }
];

export const ChallengesAdminCms: React.FC = () => {
  const [activeChallenge, setActiveChallenge] = useState<TuningChallenge | null>(null);
  const [allChallenges, setAllChallenges] = useState<TuningChallenge[]>([]);
  const [pastChallenges, setPastChallenges] = useState<TuningChallenge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isPayoutRunning, setIsPayoutRunning] = useState<boolean>(false);

  // Form State for No-Code Challenge Builder
  const [showBuilder, setShowBuilder] = useState<boolean>(false);
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState<string>('Ocean Drive Midnight Sprint');
  const [formDescription, setFormDescription] = useState<string>('Tune the Pegassi Torero XO for absolute top speed along the coastal highway under strict weight limits.');
  const [formBaseVehicle, setFormBaseVehicle] = useState<string>('Pegassi Torero XO Hypercar');
  const [formVehicleSlug, setFormVehicleSlug] = useState<string>('pegassi-torero-xo');
  const [formTargetMetric, setFormTargetMetric] = useState<ChallengeTargetMetric>('top_speed');
  const [formMetricLabel, setFormMetricLabel] = useState<string>('Top Speed');
  const [formMetricUnit, setFormMetricUnit] = useState<string>('MPH');
  const [formRewardVc, setFormRewardVc] = useState<number>(500);
  const [formPrizeDesc, setFormPrizeDesc] = useState<string>('500 VC Cash + "Master Tuner" Exclusive Profile Badge + Featured Homepage Build');
  const [formDurationDays, setFormDurationDays] = useState<number>(7);
  const [formCustomExpiresAt, setFormCustomExpiresAt] = useState<string>('');
  const [formSetAsActive, setFormSetAsActive] = useState<boolean>(true);
  const [activePreviewTab, setActivePreviewTab] = useState<'card' | 'sandbox' | 'rules'>('card');

  // Interactive Physics Benchmark Sandbox State
  const [sandboxDriveForce, setSandboxDriveForce] = useState<number>(0.45);
  const [sandboxMass, setSandboxMass] = useState<number>(1420);
  const [sandboxDrag, setSandboxDrag] = useState<number>(2.4);
  const [sandboxDownforce, setSandboxDownforce] = useState<number>(1.8);

  // Filter state for rounds table
  const [roundsFilter, setRoundsFilter] = useState<'all' | 'active' | 'scheduled' | 'archived'>('all');

  // Physics Constraints Form State
  const [formMaxWeight, setFormMaxWeight] = useState<number>(1500);
  const [formMinWeight, setFormMinWeight] = useState<number>(1200);
  const [formAllowedDrivetrain, setFormAllowedDrivetrain] = useState<'RWD' | 'AWD' | 'FWD' | 'ANY'>('RWD');
  const [formMaxDriveForce, setFormMaxDriveForce] = useState<number>(0.48);
  const [formMaxBrakeForce, setFormMaxBrakeForce] = useState<number>(1.8);

  // Submissions Leaderboard Reviewer State
  const [selectedChallengeForEntries, setSelectedChallengeForEntries] = useState<string>(ACTIVE_CHALLENGE_DOC_ID);
  const [liveEntries, setLiveEntries] = useState<ChallengeEntry[]>([]);
  const [searchEntryQuery, setSearchEntryQuery] = useState<string>('');
  const [selectedEntryForInspect, setSelectedEntryForInspect] = useState<ChallengeEntry | null>(null);
  const [copiedXml, setCopiedXml] = useState<boolean>(false);

  // Bonus VC Modal State
  const [bonusModalUser, setBonusModalUser] = useState<{ uid: string; name: string } | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(250);
  const [bonusReason, setBonusReason] = useState<string>('Staff Tuning Excellence Award');
  const [isAwardingBonus, setIsAwardingBonus] = useState<boolean>(false);

  // In-App Action Confirmation Modal States (Iframe Safe)
  const [challengeToDelete, setChallengeToDelete] = useState<{ id: string; title: string } | null>(null);
  const [challengeToActivate, setChallengeToActivate] = useState<TuningChallenge | null>(null);
  const [entryToDisqualify, setEntryToDisqualify] = useState<ChallengeEntry | null>(null);
  const [showPayoutConfirm, setShowPayoutConfirm] = useState<boolean>(false);
  const [shareEntry, setShareEntry] = useState<{ entry: ChallengeEntry; rank: number } | null>(null);

  // Load all challenges from Firestore
  const loadChallenges = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchAllAdminChallenges();
      setActiveChallenge(data.activeChallenge);
      setAllChallenges(data.allChallenges);
      setPastChallenges(data.pastChallenges);
      if (data.activeChallenge && !selectedChallengeForEntries) {
        setSelectedChallengeForEntries(data.activeChallenge.id);
      }
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  // Subscribe to leaderboard entries for currently selected challenge
  useEffect(() => {
    if (!selectedChallengeForEntries) return;

    // Find metric for selected challenge
    const targetChallenge =
      (activeChallenge?.id === selectedChallengeForEntries ? activeChallenge : null) ||
      allChallenges.find(c => c.id === selectedChallengeForEntries) ||
      pastChallenges.find(c => c.id === selectedChallengeForEntries) ||
      activeChallenge;

    const metric = targetChallenge?.targetMetric || 'top_speed';

    const queryChallengeId =
      selectedChallengeForEntries === ACTIVE_CHALLENGE_DOC_ID && activeChallenge?.id
        ? activeChallenge.id
        : selectedChallengeForEntries;

    const unsubscribe = subscribeToChallengeLeaderboard(
      queryChallengeId,
      metric,
      (entries) => {
        setLiveEntries(entries);
      },
      (err) => {
        console.warn('Leaderboard subscription fallback notice:', err);
      }
    );

    return () => unsubscribe();
  }, [selectedChallengeForEntries, activeChallenge, allChallenges, pastChallenges]);

  // Handle template selection
  const handleApplyTemplate = (tpl: {
    title: string;
    description: string;
    baseVehicle: string;
    vehicleSlug: string;
    targetMetric: ChallengeTargetMetric;
    metricLabel: string;
    metricUnit: string;
    constraints?: {
      maxWeight?: number;
      minWeight?: number;
      allowedDrivetrain?: 'RWD' | 'AWD' | 'FWD' | 'ANY';
      maxDriveForce?: number;
      maxBrakeForce?: number;
    };
    prizeDescription?: string;
    rewardVc?: number;
  }) => {
    setFormTitle(tpl.title);
    setFormDescription(tpl.description);
    setFormBaseVehicle(tpl.baseVehicle);
    setFormVehicleSlug(tpl.vehicleSlug);
    setFormTargetMetric(tpl.targetMetric);
    setFormMetricLabel(tpl.metricLabel);
    setFormMetricUnit(tpl.metricUnit);
    setFormRewardVc(tpl.rewardVc || 500);
    setFormPrizeDesc(tpl.prizeDescription || '');
    setFormMaxWeight(tpl.constraints?.maxWeight || 1500);
    setFormMinWeight(tpl.constraints?.minWeight || 1100);
    setFormAllowedDrivetrain(tpl.constraints?.allowedDrivetrain || 'RWD');
    setFormMaxDriveForce(tpl.constraints?.maxDriveForce || 0.48);
    setFormMaxBrakeForce(tpl.constraints?.maxBrakeForce || 1.8);
    setShowBuilder(true);
    setActionNotice(`✨ Applied "${tpl.title}" template! Customize parameters below.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Handle metric change and auto-update labels
  const handleMetricChange = (metric: ChallengeTargetMetric) => {
    setFormTargetMetric(metric);
    if (metric === 'top_speed') {
      setFormMetricLabel('Top Speed');
      setFormMetricUnit('MPH');
    } else if (metric === 'quarter_mile') {
      setFormMetricLabel('1/4 Mile ET');
      setFormMetricUnit('Seconds');
    } else if (metric === 'drift_angle') {
      setFormMetricLabel('Drift Score & Slip Angle');
      setFormMetricUnit('PTS');
    }
  };

  // Handle vehicle change
  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = CAR_OPTIONS.find(c => c.slug === e.target.value);
    if (selected) {
      setFormVehicleSlug(selected.slug);
      setFormBaseVehicle(selected.name);
      setFormMaxWeight(selected.defaultWeight + 150);
      setFormMinWeight(Math.max(800, selected.defaultWeight - 250));
    }
  };

  // Start edit existing challenge
  const handleStartEdit = (challenge: TuningChallenge) => {
    setEditingChallengeId(challenge.id);
    setFormTitle(challenge.title);
    setFormDescription(challenge.description);
    setFormBaseVehicle(challenge.baseVehicle);
    setFormVehicleSlug(challenge.vehicleSlug);
    setFormTargetMetric(challenge.targetMetric);
    setFormMetricLabel(challenge.metricLabel);
    setFormMetricUnit(challenge.metricUnit);
    setFormRewardVc(challenge.rewardVc || 500);
    setFormPrizeDesc(challenge.prizeDescription || '');
    setFormSetAsActive(challenge.isActive || false);

    setFormMaxWeight(challenge.constraints.maxWeight || 1500);
    setFormMinWeight(challenge.constraints.minWeight || 1100);
    setFormAllowedDrivetrain(challenge.constraints.allowedDrivetrain || 'RWD');
    setFormMaxDriveForce(challenge.constraints.maxDriveForce || 0.48);
    setFormMaxBrakeForce(challenge.constraints.maxBrakeForce || 1.8);

    setShowBuilder(true);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Save Challenge Form
  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please enter a challenge title');
      return;
    }

    try {
      const challengeId = editingChallengeId || `challenge_${Date.now()}_${formVehicleSlug}`;
      const expiresAt = formCustomExpiresAt
        ? new Date(formCustomExpiresAt).getTime()
        : Date.now() + formDurationDays * 24 * 60 * 60 * 1000;

      const challengeToSave: Partial<TuningChallenge> & { id: string; title: string } = {
        id: challengeId,
        title: formTitle,
        description: formDescription,
        baseVehicle: formBaseVehicle,
        vehicleSlug: formVehicleSlug,
        targetMetric: formTargetMetric,
        metricLabel: formMetricLabel,
        metricUnit: formMetricUnit,
        rewardVc: Number(formRewardVc),
        prizeDescription: formPrizeDesc,
        expiresAt,
        isActive: formSetAsActive,
        constraints: {
          maxWeight: Number(formMaxWeight),
          minWeight: Number(formMinWeight),
          allowedDrivetrain: formAllowedDrivetrain,
          maxDriveForce: Number(formMaxDriveForce),
          maxBrakeForce: Number(formMaxBrakeForce)
        }
      };

      await saveAdminChallenge(challengeToSave, formSetAsActive);
      setActionNotice(`✅ Challenge "${formTitle}" saved successfully!`);
      setTimeout(() => setActionNotice(null), 3500);

      setShowBuilder(false);
      setEditingChallengeId(null);
      await loadChallenges();
    } catch (err: any) {
      console.error('Error saving challenge:', err);
      alert(`Error saving challenge: ${err.message}`);
    }
  };

  // Set Active Challenge Confirmation
  const confirmSetActive = async () => {
    if (!challengeToActivate) return;
    const challenge = challengeToActivate;
    setChallengeToActivate(null);
    try {
      await setActiveAdminChallenge(challenge);
      setActionNotice(`⭐ "${challenge.title}" is now the ACTIVE community challenge!`);
      setTimeout(() => setActionNotice(null), 3500);
      await loadChallenges();
      setSelectedChallengeForEntries(ACTIVE_CHALLENGE_DOC_ID);
    } catch (err: any) {
      setActionNotice(`❌ Failed to activate challenge: ${err.message}`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Delete Challenge Confirmation
  const confirmDeleteChallenge = async () => {
    if (!challengeToDelete) return;
    const { id: challengeId, title } = challengeToDelete;
    setChallengeToDelete(null);
    try {
      await deleteAdminChallenge(challengeId);
      setActionNotice(`🗑️ Challenge "${title}" deleted.`);
      setTimeout(() => setActionNotice(null), 3000);
      await loadChallenges();
    } catch (err: any) {
      setActionNotice(`❌ Failed to delete challenge: ${err.message}`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Disqualify Leaderboard Entry Confirmation
  const confirmDisqualifyEntry = async () => {
    if (!entryToDisqualify) return;
    const entry = entryToDisqualify;
    setEntryToDisqualify(null);
    try {
      await disqualifyChallengeEntry(entry.id);
      setActionNotice(`🚫 Removed submission by ${entry.userName} from leaderboard.`);
      setTimeout(() => setActionNotice(null), 3500);
      if (selectedEntryForInspect?.id === entry.id) {
        setSelectedEntryForInspect(null);
      }
    } catch (err: any) {
      setActionNotice(`❌ Failed to disqualify entry: ${err.message}`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  // Award Bonus VC to User
  const handleAwardBonusVc = async () => {
    if (!bonusModalUser) return;
    setIsAwardingBonus(true);
    try {
      await awardManualBonusVc(bonusModalUser.uid, bonusAmount, bonusReason);
      setActionNotice(`💰 Awarded ${bonusAmount} VC to ${bonusModalUser.name}!`);
      setTimeout(() => setActionNotice(null), 3500);
      setBonusModalUser(null);
    } catch (err: any) {
      setActionNotice(`❌ Failed to award VC: ${err.message}`);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setIsAwardingBonus(false);
    }
  };

  // Trigger End of Challenge & Automated Payouts
  const confirmRunPayoutsNow = async () => {
    setShowPayoutConfirm(false);
    setIsPayoutRunning(true);
    try {
      const res = await fetch('/api/cron/challenges-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`🏆 Payout complete! Winner: ${data.winner?.userName || 'N/A'} (+${data.rewardVc || 500} VC). Next challenge active!`);
        setTimeout(() => setActionNotice(null), 5000);
        await loadChallenges();
      } else {
        setActionNotice(`ℹ️ Payout notice: ${data.message || data.error}`);
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err: any) {
      setActionNotice(`❌ Payout error: ${err.message}`);
      setTimeout(() => setActionNotice(null), 4000);
    } finally {
      setIsPayoutRunning(false);
    }
  };

  // Filtered leaderboard entries for search
  const filteredEntries = useMemo(() => {
    if (!searchEntryQuery.trim()) return liveEntries;
    const q = searchEntryQuery.toLowerCase();
    return liveEntries.filter(
      e => e.userName.toLowerCase().includes(q) || e.buildTitle.toLowerCase().includes(q)
    );
  }, [liveEntries, searchEntryQuery]);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl text-xs font-bold text-amber-300 flex items-center justify-between shadow-lg shadow-amber-500/10 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-zinc-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Header & Quick Action Hub */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Tuning Championship No-Code CMS</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-zinc-950">
              Admin Suite
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Design, schedule, and moderate community vehicle physics competitions. Configure strict vehicle mass, drivetrain, and downforce regulations with automated VC cash payouts and badge rewards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingChallengeId(null);
              setShowBuilder(!showBuilder);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showBuilder ? 'Close Builder' : 'Host New Challenge'}</span>
          </button>

          <button
            onClick={() => setShowPayoutConfirm(true)}
            disabled={isPayoutRunning}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${isPayoutRunning ? 'animate-spin' : ''}`} />
            <span>{isPayoutRunning ? 'Processing Payouts...' : 'Run Automated Payouts'}</span>
          </button>

          <button
            onClick={loadChallenges}
            disabled={isRefreshing}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition cursor-pointer border border-zinc-700"
            title="Refresh All Challenges"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1.5">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Challenge</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-black text-white truncate">
            {activeChallenge?.title || 'No Active Challenge'}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            {activeChallenge ? `${activeChallenge.baseVehicle} • ${activeChallenge.metricLabel}` : 'Ready to launch'}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1.5">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Live Submissions</span>
            <Sliders className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {liveEntries.length} Builds
          </div>
          <p className="text-[11px] text-zinc-500">
            {liveEntries.length > 0 ? `Leader: ${liveEntries[0]?.userName} (${liveEntries[0]?.metricDisplay})` : 'Waiting for submissions'}
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1.5">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Hosted</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {allChallenges.length + pastChallenges.length} Events
          </div>
          <p className="text-[11px] text-zinc-500">
            {pastChallenges.length} completed & archived
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1.5">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Prize Pool Value</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {activeChallenge?.rewardVc || 500} VC
          </div>
          <p className="text-[11px] text-zinc-500">
            + Exclusive "Master Tuner" Badge
          </p>
        </div>
      </div>

      {/* Quick Template Picker */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Quick Challenge Templates (1-Click Setup)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PRESET_TEMPLATES.map((tpl, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyTemplate(tpl)}
              className="p-3 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-amber-500/40 rounded-xl text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-amber-400 font-mono uppercase">{tpl.targetMetric.replace('_', ' ')}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-extrabold">{tpl.rewardVc} VC</span>
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                {tpl.title}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                {tpl.baseVehicle}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* No-Code Challenge Builder Form */}
      {showBuilder && (
        <form onSubmit={handleSaveChallenge} className="bg-zinc-900 border border-rose-500/40 rounded-2xl p-6 space-y-6 shadow-2xl shadow-rose-950/20 animate-fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-white">
                {editingChallengeId ? 'Edit Championship Event' : 'Create New Tuning Challenge'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowBuilder(false)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* General Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> General Information
              </h4>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Challenge Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
                  placeholder="e.g. Ocean Beach Top Speed Run"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Target Base Vehicle *</label>
                <select
                  value={formVehicleSlug}
                  onChange={handleVehicleChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
                >
                  {CAR_OPTIONS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Challenge Description / Lore</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
                  placeholder="Describe the challenge rules, track layout, and story..."
                />
              </div>
            </div>

            {/* Target Metric & Rewards */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" /> Target Metric & Rewards
              </h4>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Target Competition Metric *</label>
                <select
                  value={formTargetMetric}
                  onChange={(e) => handleMetricChange(e.target.value as ChallengeTargetMetric)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                >
                  <option value="top_speed">Top Speed (MPH) — Higher is better</option>
                  <option value="quarter_mile">Quarter Mile 1/4 ET (Seconds) — Lower is faster</option>
                  <option value="drift_angle">Drift Score & Slip Angle (Points) — Higher is better</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Reward VC Cash</label>
                  <input
                    type="number"
                    value={formRewardVc}
                    onChange={(e) => setFormRewardVc(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:border-amber-500 outline-none"
                    min={100}
                    step={50}
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {[500, 750, 1000, 1500].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setFormRewardVc(amt)}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 rounded font-mono"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Duration & Schedule</label>
                  <select
                    value={formDurationDays}
                    onChange={(e) => {
                      const days = Number(e.target.value);
                      setFormDurationDays(days);
                      const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                      setFormCustomExpiresAt(targetDate.toISOString().slice(0, 16));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value={3}>3 Days (Flash Sprint)</option>
                    <option value={7}>7 Days (Weekly Championship)</option>
                    <option value={14}>14 Days (Bi-Weekly Major)</option>
                    <option value={30}>30 Days (Season Pass Event)</option>
                  </select>
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nextSunday = getNextSundayMidnightUtc();
                        setFormCustomExpiresAt(new Date(nextSunday).toISOString().slice(0, 16));
                        setFormDurationDays(Math.max(1, Math.round((nextSunday - Date.now()) / (24 * 3600 * 1000))));
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" /> Align to Next Sunday Midnight UTC
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Custom UTC Expiration Datetime (Optional Override)</label>
                <input
                  type="datetime-local"
                  value={formCustomExpiresAt}
                  onChange={(e) => setFormCustomExpiresAt(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 font-mono focus:border-amber-500 outline-none"
                />
                {formCustomExpiresAt && (
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">
                    Scheduled end: {new Date(formCustomExpiresAt).toUTCString()}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Prize Package Summary</label>
                <input
                  type="text"
                  value={formPrizeDesc}
                  onChange={(e) => setFormPrizeDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
                  placeholder="e.g. 500 VC Cash + Master Tuner Badge"
                />
              </div>

              <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="statusActive"
                    name="publishStatus"
                    checked={formSetAsActive}
                    onChange={() => setFormSetAsActive(true)}
                    className="text-rose-600 bg-zinc-950 border-zinc-800"
                  />
                  <label htmlFor="statusActive" className="text-xs font-bold text-white cursor-pointer flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Publish Immediately (Make Live Now on /challenges)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="statusDraft"
                    name="publishStatus"
                    checked={!formSetAsActive}
                    onChange={() => setFormSetAsActive(false)}
                    className="text-rose-600 bg-zinc-950 border-zinc-800"
                  />
                  <label htmlFor="statusDraft" className="text-xs font-bold text-zinc-400 cursor-pointer flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Save as Scheduled Round / Draft (Staged for future rotation)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Physics & Regulations Engine */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Physics & Constraint Rules
              </h4>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Drivetrain Regulation</label>
                <select
                  value={formAllowedDrivetrain}
                  onChange={(e) => setFormAllowedDrivetrain(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                >
                  <option value="RWD">Rear-Wheel Drive (RWD Only)</option>
                  <option value="AWD">All-Wheel Drive (AWD Only)</option>
                  <option value="FWD">Front-Wheel Drive (FWD Only)</option>
                  <option value="ANY">Open Drivetrain (ANY / Unrestricted)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Max Weight (kg)</label>
                  <input
                    type="number"
                    value={formMaxWeight}
                    onChange={(e) => {
                      setFormMaxWeight(Number(e.target.value));
                      setSandboxMass(Number(e.target.value));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    step={10}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Min Weight (kg)</label>
                  <input
                    type="number"
                    value={formMinWeight}
                    onChange={(e) => setFormMinWeight(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    step={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Max Drive Force</label>
                  <input
                    type="number"
                    value={formMaxDriveForce}
                    onChange={(e) => {
                      setFormMaxDriveForce(Number(e.target.value));
                      setSandboxDriveForce(Number(e.target.value));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    step={0.01}
                    min={0.1}
                    max={1.0}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Max Brake Force</label>
                  <input
                    type="number"
                    value={formMaxBrakeForce}
                    onChange={(e) => setFormMaxBrakeForce(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                    step={0.1}
                    min={0.5}
                    max={3.0}
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 space-y-1">
                <div className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Auto-Validation Guard
                </div>
                <p>Player XML uploads outside these bounds will be rejected with precise parameter error notifications.</p>
              </div>
            </div>
          </div>

          {/* WYSIWYG Real-Time Preview & Sandbox Stage */}
          <div className="border-t border-zinc-800 pt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  WYSIWYG Live Preview & Validation Sandbox
                </h4>
              </div>

              <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('card')}
                  className={`px-3 py-1 rounded-md font-bold transition ${activePreviewTab === 'card' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  Public Card Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('sandbox')}
                  className={`px-3 py-1 rounded-md font-bold transition ${activePreviewTab === 'sandbox' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  Physics Benchmark Simulator
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('rules')}
                  className={`px-3 py-1 rounded-md font-bold transition ${activePreviewTab === 'rules' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  handling.meta Schema
                </button>
              </div>
            </div>

            {/* Tab 1: Live Card Preview */}
            {activePreviewTab === 'card' && (
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden shadow-inner">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-lg shadow-rose-600/30">
                        {formTargetMetric.replace('_', ' ')}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 font-mono">
                        {formAllowedDrivetrain} • {formMinWeight}-{formMaxWeight} kg
                      </span>
                      {formSetAsActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Portal Mode
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Draft Mode
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-white tracking-tight">
                      {formTitle || 'Untitled Championship Round'}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {formDescription || 'No description provided.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                      <div className="text-zinc-400 flex items-center gap-1.5 font-bold">
                        <Car className="w-4 h-4 text-rose-400" />
                        <span>{formBaseVehicle}</span>
                      </div>
                      <div className="text-emerald-400 flex items-center gap-1.5 font-mono font-black">
                        <Coins className="w-4 h-4" />
                        <span>{formRewardVc} VC First Place Reward</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2 shrink-0 min-w-[240px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Championship Reward</div>
                    <div className="text-base font-black text-amber-400 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>{formRewardVc} VC + Exclusive Badge</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {formPrizeDesc || '500 VC Cash + Master Tuner Badge'}
                    </p>
                    <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                      <span>Schedule:</span>
                      <span className="text-zinc-300 font-bold">{formDurationDays} Days Round</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Physics Benchmark Simulator */}
            {activePreviewTab === 'sandbox' && (
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white">Interactive Physics Benchmark Sandbox</h5>
                    <p className="text-[11px] text-zinc-400">Test theoretical handling telemetry before locking regulations.</p>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Live Telemetry Simulator</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Estimated Top Speed</div>
                    <div className="text-lg font-black text-rose-400 font-mono">
                      {Math.round((sandboxDriveForce * 240) / (sandboxDrag * 0.4) + 60)} MPH
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Estimated 0-60 Time</div>
                    <div className="text-lg font-black text-amber-400 font-mono">
                      {(Math.max(1.8, (sandboxMass / 1000) / (sandboxDriveForce * 2.2))).toFixed(2)}s
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">1/4 Mile Estimate</div>
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      {(Math.max(8.2, 8.5 + (sandboxMass / 1000) * 1.5 - (sandboxDriveForce * 8))).toFixed(2)}s
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Est. Lateral Grip</div>
                    <div className="text-lg font-black text-indigo-400 font-mono">
                      {(1.0 + (sandboxDownforce * 0.22) + (formAllowedDrivetrain === 'AWD' ? 0.15 : 0.05)).toFixed(2)}G
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Test Mass (kg): {sandboxMass}</label>
                    <input
                      type="range"
                      min={formMinWeight}
                      max={formMaxWeight}
                      value={sandboxMass}
                      onChange={(e) => setSandboxMass(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Test Drive Force: {sandboxDriveForce.toFixed(2)}</label>
                    <input
                      type="range"
                      min={0.2}
                      max={formMaxDriveForce}
                      step={0.01}
                      value={sandboxDriveForce}
                      onChange={(e) => setSandboxDriveForce(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Test Drag Coeff: {sandboxDrag.toFixed(1)}</label>
                    <input
                      type="range"
                      min={1.0}
                      max={5.0}
                      step={0.1}
                      value={sandboxDrag}
                      onChange={(e) => setSandboxDrag(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 block mb-1">Test Downforce Mod: {sandboxDownforce.toFixed(1)}</label>
                    <input
                      type="range"
                      min={0.5}
                      max={4.0}
                      step={0.1}
                      value={sandboxDownforce}
                      onChange={(e) => setSandboxDownforce(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: handling.meta Schema */}
            {activePreviewTab === 'rules' && (
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 font-mono text-xs text-zinc-300">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Firestore Constraint Schema Export</div>
                <pre className="text-[11px] text-indigo-300 bg-zinc-900/90 p-3 rounded-lg overflow-x-auto">
{JSON.stringify({
  targetMetric: formTargetMetric,
  baseVehicle: formBaseVehicle,
  vehicleSlug: formVehicleSlug,
  constraints: {
    allowedDrivetrain: formAllowedDrivetrain,
    minWeight: formMinWeight,
    maxWeight: formMaxWeight,
    maxDriveForce: formMaxDriveForce,
    maxBrakeForce: formMaxBrakeForce
  },
  rewardVc: formRewardVc,
  durationDays: formDurationDays
}, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setShowBuilder(false);
                setEditingChallengeId(null);
              }}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingChallengeId ? 'Update Championship Round' : 'Save & Publish Challenge'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Challenges Management Table & Scheduled Rounds */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-black text-white">Championship Rounds & Rotation Schedule</h3>
              <p className="text-xs text-zinc-400">Manage live active events, stage upcoming rounds, and duplicate draft templates.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setRoundsFilter('all')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${roundsFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                All ({allChallenges.length + (activeChallenge ? 1 : 0) + pastChallenges.length})
              </button>
              <button
                type="button"
                onClick={() => setRoundsFilter('active')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${roundsFilter === 'active' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-white'}`}
              >
                Live Active
              </button>
              <button
                type="button"
                onClick={() => setRoundsFilter('scheduled')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${roundsFilter === 'scheduled' ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-400 hover:text-white'}`}
              >
                Scheduled
              </button>
              <button
                type="button"
                onClick={() => setRoundsFilter('archived')}
                className={`px-2.5 py-1 rounded-md font-bold transition ${roundsFilter === 'archived' ? 'bg-zinc-800 text-zinc-300' : 'text-zinc-400 hover:text-white'}`}
              >
                Past ({pastChallenges.length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Event Title & Vehicle</th>
                <th className="py-3 px-4">Target Metric</th>
                <th className="py-3 px-4">Prize Pool</th>
                <th className="py-3 px-4">Submissions</th>
                <th className="py-3 px-4">Expires / Scheduled</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {/* Active Challenge Row */}
              {activeChallenge && (roundsFilter === 'all' || roundsFilter === 'active') && (
                <tr className="bg-amber-500/5 hover:bg-amber-500/10 transition">
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20">
                      <Flame className="w-3 h-3" /> Live Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{activeChallenge.title}</div>
                    <div className="text-zinc-400 text-[11px] flex items-center gap-1">
                      <Car className="w-3 h-3 text-rose-400" />
                      <span>{activeChallenge.baseVehicle}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-200 font-mono text-[11px]">
                      {activeChallenge.metricLabel} ({activeChallenge.metricUnit})
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-400">
                    {activeChallenge.rewardVc || 500} VC
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {liveEntries.length} builds
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                    {activeChallenge.expiresAt ? new Date(activeChallenge.expiresAt).toLocaleDateString() : 'Weekly cycle'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleStartEdit(activeChallenge)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                      title="Edit active challenge"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        handleApplyTemplate({
                          title: `${activeChallenge.title} (Clone)`,
                          description: activeChallenge.description,
                          baseVehicle: activeChallenge.baseVehicle,
                          vehicleSlug: activeChallenge.vehicleSlug,
                          targetMetric: activeChallenge.targetMetric,
                          metricLabel: activeChallenge.metricLabel,
                          metricUnit: activeChallenge.metricUnit,
                          constraints: activeChallenge.constraints,
                          prizeDescription: activeChallenge.prizeDescription,
                          rewardVc: activeChallenge.rewardVc || 500
                        });
                        setFormSetAsActive(false);
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                      title="Duplicate as Draft"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                    <button
                      onClick={() => setSelectedChallengeForEntries(activeChallenge.id)}
                      className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition cursor-pointer"
                      title="Inspect Submissions"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )}

              {/* Other Challenges */}
              {allChallenges
                .filter(c => c.id !== activeChallenge?.id && c.id !== ACTIVE_CHALLENGE_DOC_ID)
                .filter(c => roundsFilter === 'all' || roundsFilter === 'scheduled')
                .map((challenge) => (
                  <tr key={challenge.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Scheduled Draft
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{challenge.title}</div>
                      <div className="text-zinc-400 text-[11px]">{challenge.baseVehicle}</div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-mono">
                      {challenge.metricLabel}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {challenge.rewardVc || 500} VC
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {challenge.totalSubmissions || 0}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                      {challenge.expiresAt ? new Date(challenge.expiresAt).toLocaleDateString() : 'Draft'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setChallengeToActivate(challenge)}
                        className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 transition cursor-pointer font-bold text-[10px]"
                        title="Set as active challenge"
                      >
                        Set Active
                      </button>
                      <button
                        onClick={() => handleStartEdit(challenge)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                        title="Edit challenge"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          handleApplyTemplate({
                            title: `${challenge.title} (Clone)`,
                            description: challenge.description,
                            baseVehicle: challenge.baseVehicle,
                            vehicleSlug: challenge.vehicleSlug,
                            targetMetric: challenge.targetMetric,
                            metricLabel: challenge.metricLabel,
                            metricUnit: challenge.metricUnit,
                            constraints: challenge.constraints,
                            prizeDescription: challenge.prizeDescription,
                            rewardVc: challenge.rewardVc || 500
                          });
                          setFormSetAsActive(false);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                        title="Duplicate as Draft"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                      <button
                        onClick={() => setChallengeToDelete({ id: challenge.id, title: challenge.title })}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 transition cursor-pointer"
                        title="Delete challenge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

              {/* Past Archived Challenges */}
              {(roundsFilter === 'all' || roundsFilter === 'archived') && pastChallenges.map((past) => (
                <tr key={past.id} className="opacity-75 hover:opacity-100 hover:bg-zinc-800/20 transition">
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-500">
                      Archived
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-zinc-300">{past.title}</div>
                    <div className="text-zinc-500 text-[11px]">{past.baseVehicle}</div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono">
                    {past.metricLabel}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-400">
                    {past.rewardVc || 500} VC
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-400">
                    {past.totalSubmissions || 0}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-mono text-[11px]">
                    Archived
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => {
                        handleApplyTemplate({
                          title: `${past.title} (Re-run)`,
                          description: past.description,
                          baseVehicle: past.baseVehicle,
                          vehicleSlug: past.vehicleSlug,
                          targetMetric: past.targetMetric,
                          metricLabel: past.metricLabel,
                          metricUnit: past.metricUnit,
                          constraints: past.constraints,
                          prizeDescription: past.prizeDescription,
                          rewardVc: past.rewardVc || 500
                        });
                        setFormSetAsActive(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition cursor-pointer font-bold text-[10px]"
                      title="Re-run as Draft"
                    >
                      Re-run Event
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leaderboard Reviewer & Submissions Moderation Queue */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-black text-white">Live Submissions & Moderation Queue</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Review player handling.meta setups, inspect telemetry stats, award bonus VC, and remove disqualified builds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchEntryQuery}
                onChange={(e) => setSearchEntryQuery(e.target.value)}
                placeholder="Search GamerTag or Build..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500"
              />
            </div>

            <button
              onClick={() => {
                if (liveEntries.length === 0) {
                  alert('No entries to export.');
                  return;
                }
                const csvContent = 'data:text/csv;charset=utf-8,' +
                  ['Rank,User,VIP,BuildTitle,MetricValue,MetricDisplay,Score,SubmittedAt'].join(',') + '\n' +
                  liveEntries.map((e, idx) =>
                    `${idx + 1},"${e.userName}",${e.isVip ? 'Yes' : 'No'},"${e.buildTitle}",${e.metricValue},"${e.metricDisplay}",${e.calculatedScore},"${new Date(e.submittedAt).toISOString()}"`
                  ).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `championship_leaderboard_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border border-zinc-700"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 space-y-2">
            <Trophy className="w-10 h-10 text-zinc-700 mx-auto" />
            <p className="text-sm font-bold text-zinc-400">No submissions recorded yet for this challenge.</p>
            <p className="text-xs text-zinc-600">Player builds submitted on the /challenges tab will populate here in real time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Tuner GamerTag</th>
                  <th className="py-3 px-4">Build Spec</th>
                  <th className="py-3 px-4">Metric Score</th>
                  <th className="py-3 px-4">0-60 Time</th>
                  <th className="py-3 px-4">Downforce</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {filteredEntries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isGold = rank === 1;
                  const isSilver = rank === 2;
                  const isBronze = rank === 3;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-zinc-800/40 transition ${
                        isGold ? 'bg-amber-500/5' : isSilver ? 'bg-zinc-800/20' : isBronze ? 'bg-amber-900/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span
                          className={`w-6 h-6 rounded-lg inline-flex items-center justify-center text-xs font-black ${
                            isGold
                              ? 'bg-amber-400 text-zinc-950'
                              : isSilver
                              ? 'bg-zinc-300 text-zinc-950'
                              : isBronze
                              ? 'bg-amber-700 text-white'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white">{entry.userName}</span>
                          {entry.isVip && (
                            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">{entry.userLevel || 'L1 Citizen'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-200">
                        {entry.buildTitle}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-rose-400 text-sm">
                        {entry.metricDisplay}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        {entry.telemetry?.zeroToSixtySec ? `${entry.telemetry.zeroToSixtySec}s` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        {entry.telemetry?.corneringGForce ? `${entry.telemetry.corneringGForce}G` : (entry.telemetry?.driftTendencyScore ? `${entry.telemetry.driftTendencyScore} pts` : 'N/A')}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-mono">
                        {new Date(entry.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            const entryIndex = liveEntries.findIndex(e => e.id === entry.id);
                            const rankNum = entryIndex >= 0 ? entryIndex + 1 : 1;
                            setShareEntry({ entry, rank: rankNum });
                          }}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition cursor-pointer"
                          title="Generate OpenGraph Social Media Card"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedEntryForInspect(entry)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                          title="Inspect Telemetry & XML Variables"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setBonusModalUser({ uid: entry.userUid, name: entry.userName })}
                          className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/50 transition cursor-pointer"
                          title="Grant Bonus VC Credits"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEntryToDisqualify(entry)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 transition cursor-pointer"
                          title="Disqualify & Delete from Leaderboard"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Telemetry & XML Modal */}
      {selectedEntryForInspect && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">{selectedEntryForInspect.buildTitle}</h3>
                  {selectedEntryForInspect.isVip && <Crown className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-xs text-zinc-400">
                  Tuned by <strong className="text-white">{selectedEntryForInspect.userName}</strong> • Score: <span className="text-rose-400 font-mono font-bold">{selectedEntryForInspect.metricDisplay}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedEntryForInspect(null)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold">0-60 Time</div>
                <div className="text-sm font-black text-white font-mono">{selectedEntryForInspect.telemetry.zeroToSixtySec}s</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold">1/4 Mile</div>
                <div className="text-sm font-black text-white font-mono">{selectedEntryForInspect.telemetry.quarterMileSec}s</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Top Speed</div>
                <div className="text-sm font-black text-rose-400 font-mono">{selectedEntryForInspect.telemetry.estimatedTopSpeedMph} MPH</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Lateral Gs</div>
                <div className="text-sm font-black text-indigo-400 font-mono">{selectedEntryForInspect.telemetry.corneringGForce}G</div>
              </div>
            </div>

            {/* XML handling string */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">Generated handling.meta XML</span>
                <button
                  onClick={async () => {
                    const xml = generateHandlingMetaXML(activeChallenge?.vehicleSlug || 'CUSTOM_VEHICLE', selectedEntryForInspect.handlingData);
                    await copyToClipboard(xml);
                    setCopiedXml(true);
                    setTimeout(() => setCopiedXml(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedXml ? 'Copied XML!' : 'Copy XML'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] text-zinc-300 font-mono max-h-48 overflow-y-auto leading-relaxed">
                {generateHandlingMetaXML(activeChallenge?.vehicleSlug || 'CUSTOM_VEHICLE', selectedEntryForInspect.handlingData)}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  const entryIndex = liveEntries.findIndex(e => e.id === selectedEntryForInspect.id);
                  const rankNum = entryIndex >= 0 ? entryIndex + 1 : 1;
                  setShareEntry({ entry: selectedEntryForInspect, rank: rankNum });
                  setSelectedEntryForInspect(null);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Share Card</span>
              </button>
              <button
                onClick={() => setEntryToDisqualify(selectedEntryForInspect)}
                className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disqualify Build</span>
              </button>
              <button
                onClick={() => setSelectedEntryForInspect(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bonus VC Credits Award Modal */}
      {bonusModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Award VC Credits</h3>
              </div>
              <button onClick={() => setBonusModalUser(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Grant VC cash directly to player <strong className="text-white">{bonusModalUser.name}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">VC Amount</label>
                <input
                  type="number"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                  step={50}
                  min={25}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Award Reason</label>
                <input
                  type="text"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setBonusModalUser(null)}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAwardBonusVc}
                disabled={isAwardingBonus}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>{isAwardingBonus ? 'Awarding...' : `Grant ${bonusAmount} VC`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Challenge Confirmation Modal */}
      {challengeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-white">Delete Challenge</h3>
              </div>
              <button
                type="button"
                onClick={() => setChallengeToDelete(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs text-zinc-300">
              <p className="text-white font-bold text-sm">{challengeToDelete.title}</p>
              <p className="text-zinc-500 font-mono text-[11px]">ID: {challengeToDelete.id}</p>
            </div>

            <p className="text-xs text-zinc-400">
              Permanently delete this championship challenge? All configuration and constraint metadata will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setChallengeToDelete(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteChallenge}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Challenge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Active Challenge Confirmation Modal */}
      {challengeToActivate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Flame className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-white">Activate Championship Round</h3>
              </div>
              <button
                type="button"
                onClick={() => setChallengeToActivate(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs text-zinc-300">
              <p className="text-white font-bold text-sm">{challengeToActivate.title}</p>
              <p className="text-zinc-400 text-[11px]">{challengeToActivate.baseVehicle} • {challengeToActivate.metricLabel}</p>
            </div>

            <p className="text-xs text-zinc-400">
              Are you sure you want to set this as the live active community challenge? This will immediately rotate the public tuning leaderboard bench.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setChallengeToActivate(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSetActive}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/30"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Confirm & Activate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disqualify Entry Confirmation Modal */}
      {entryToDisqualify && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-white">Disqualify Entry</h3>
              </div>
              <button
                type="button"
                onClick={() => setEntryToDisqualify(null)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs text-zinc-300">
              <p className="text-white font-bold text-sm">{entryToDisqualify.buildTitle}</p>
              <p className="text-zinc-400 text-[11px]">Player: @{entryToDisqualify.userName} • Score: {entryToDisqualify.metricDisplay}</p>
            </div>

            <p className="text-xs text-zinc-400">
              Disqualify and permanently remove this build submission from the public leaderboard?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEntryToDisqualify(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDisqualifyEntry}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Disqualification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Weekly Payouts Confirmation Modal */}
      {showPayoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Zap className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-white">Execute Weekly Payouts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutConfirm(false)}
                className="text-zinc-500 hover:text-white font-bold text-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Run automated championship payouts now? This will evaluate the current active leaderboard, award <strong className="text-emerald-400">500 VC Cash</strong> and the <strong className="text-amber-400">Master Tuner</strong> badge to 1st place, archive the round, and rotate to the next scheduled event.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowPayoutConfirm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRunPayoutsNow}
                disabled={isPayoutRunning}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/30 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isPayoutRunning ? 'Processing...' : 'Run Payouts Now'}</span>
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
          totalEntries={liveEntries.length}
          challengeTitle={activeChallenge?.title}
          vehicleName={activeChallenge?.baseVehicle}
          onClose={() => setShareEntry(null)}
        />
      )}
    </div>
  );
};
