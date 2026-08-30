'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  EconomicAnchors,
  JobConfig,
  MoneySinkConfig,
  ServerSimParameters,
  EconomyPreset,
  DEFAULT_ANCHORS,
  DEFAULT_JOBS,
  DEFAULT_SINKS,
  DEFAULT_SERVER_PARAMS,
  PRESET_TEMPLATES,
  calculateEconomyBalance
} from '../lib/economy-engine';
import { EconomyControlPanel } from './economy/EconomyControlPanel';
import { EconomySimulationChart } from './economy/EconomySimulationChart';
import { UserProfile } from '../types';
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  DollarSign,
  TrendingUp,
  Sliders,
  Download,
  RefreshCw,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  Sparkles,
  Server,
  FileCode,
  CheckCircle,
  Search,
  ThumbsUp,
  Copy,
  Layers,
  Award,
  Zap,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface EconomyBalancerTabProps {
  userProfile?: UserProfile | null;
  onOpenAuthModal?: () => void;
  onSwitchTab?: (tab: string) => void;
}

const SEED_COMMUNITY_PRESETS: EconomyPreset[] = [
  PRESET_TEMPLATES['nopixel-balanced'],
  PRESET_TEMPLATES['hardcore-survival'],
  PRESET_TEMPLATES['casual-high-action'],
  {
    presetId: 'preset-seed-los-santos-underground',
    authorUid: 'staff_dev_vice',
    authorName: 'ViceCity_Architect',
    serverName: 'Vice City Underground 2.0 (Strict RP)',
    frameworkTarget: 'qbcore',
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now(),
    isPublicTemplate: true,
    upvotesCount: 198,
    upvotedBy: [],
    anchors: {
      baseFoodCost: 50,
      starterApartmentCost: 35000,
      midTierSupercarCost: 450000,
      targetSupercarHours: 40,
      dailyTaxesAndFees: 7.5,
      starterVehicleCost: 22000,
      luxuryMansionCost: 1800000,
      handgunCost: 4000
    },
    sinks: {
      propertyTaxDailyPercent: 1.5,
      vehicleImpoundFee: 1000,
      vehicleRepairAverage: 650,
      hospitalBill: 1500,
      foodWaterDailyCost: 300,
      dirtyMoneyLaunderTaxPercent: 20
    },
    serverParams: {
      activePlayersCount: 96,
      averageDailyPlayHours: 3.5,
      legalPlayerRatio: 0.60,
      initialEconomySeed: 960000
    },
    jobs: DEFAULT_JOBS,
    notes: 'Configured for high-stakes 96-player servers with active gang wars and structured police payroll.'
  }
];

export const EconomyBalancerTab: React.FC<EconomyBalancerTabProps> = ({
  userProfile,
  onOpenAuthModal,
  onSwitchTab
}) => {
  // Active View Mode (defaults to Guided Quick Balancer)
  const [activeViewMode, setActiveViewMode] = useState<'guided' | 'jobs' | 'macro' | 'vault' | 'full'>('guided');

  // Active Economy State
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('nopixel-balanced');
  const [serverName, setServerName] = useState<string>('Vice City RP Economy');
  const [frameworkTarget, setFrameworkTarget] = useState<'qbcore' | 'esx' | 'qbx' | 'custom_json'>('qbcore');
  const [anchors, setAnchors] = useState<EconomicAnchors>(DEFAULT_ANCHORS);
  const [jobs, setJobs] = useState<JobConfig[]>(DEFAULT_JOBS);
  const [sinks, setSinks] = useState<MoneySinkConfig>(DEFAULT_SINKS);
  const [serverParams, setServerParams] = useState<ServerSimParameters>(DEFAULT_SERVER_PARAMS);

  // Firestore Community Presets State
  const [communityPresets, setCommunityPresets] = useState<EconomyPreset[]>(SEED_COMMUNITY_PRESETS);
  const [upvotedPresetIds, setUpvotedPresetIds] = useState<Set<string>>(new Set());
  const [communitySearch, setCommunitySearch] = useState<string>('');
  const [frameworkFilter, setFrameworkFilter] = useState<'all' | 'qbcore' | 'esx' | 'qbx' | 'custom_json'>('all');

  // Save / Publish Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [presetTitle, setPresetTitle] = useState<string>('');
  const [presetNotes, setPresetNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Auto calculate economy metrics
  const calculationResults = useMemo(() => {
    return calculateEconomyBalance(anchors, jobs, sinks, serverParams);
  }, [anchors, jobs, sinks, serverParams]);

  // Load Firestore Saved Presets
  useEffect(() => {
    try {
      const presetsCol = collection(db, 'economy_presets');
      const q = query(presetsCol);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: EconomyPreset[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push({ ...docSnap.data(), presetId: docSnap.id } as EconomyPreset);
            });

            // Merge with default seed templates
            const mergedMap = new Map<string, EconomyPreset>();
            SEED_COMMUNITY_PRESETS.forEach((p) => mergedMap.set(p.presetId, p));
            fetched.forEach((p) => mergedMap.set(p.presetId, p));

            const sorted = Array.from(mergedMap.values()).sort(
              (a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0) || (b.createdAt || 0) - (a.createdAt || 0)
            );
            setCommunityPresets(sorted);
          }
        },
        (error) => {
          console.warn('Firestore economy presets listener note:', error);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not initialize economy presets listener:', e);
    }
  }, []);

  // Auto Recalculate Wages Button Handler
  const handleAutoRecalculateWages = () => {
    const baseTargetLegal = Math.max(
      1000,
      Math.round(anchors.midTierSupercarCost / Math.max(1, anchors.targetSupercarHours))
    );

    setJobs((prev) =>
      prev.map((job) => {
        if (job.type === 'legal') {
          // Adjust legal wage by category variance
          let categoryModifier = 1.0;
          if (job.category === 'law_enforcement') categoryModifier = 1.15;
          if (job.category === 'medical') categoryModifier = 1.1;
          if (job.category === 'services') categoryModifier = 0.95;
          if (job.category === 'logistics') categoryModifier = 0.9;

          const calculated = Math.round(baseTargetLegal * categoryModifier);
          return {
            ...job,
            hourlyPayout: calculated,
            baseSalaryPerTick: Math.round(calculated / 12)
          };
        } else {
          // Illegal wage adjusted by risk multiplier (1.4x - 2.8x)
          const calculatedIllegal = Math.round(baseTargetLegal * job.riskLevel * 1.15);
          return {
            ...job,
            hourlyPayout: calculatedIllegal,
            baseSalaryPerTick: Math.round(calculatedIllegal / 12)
          };
        }
      })
    );
  };

  // Load Template Preset into Balancer
  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    const template = PRESET_TEMPLATES[key];
    if (template) {
      setServerName(template.serverName);
      setFrameworkTarget(template.frameworkTarget);
      setAnchors({ ...template.anchors });
      setJobs(template.jobs.map((j) => ({ ...j })));
      setSinks({ ...template.sinks });
      setServerParams({ ...template.serverParams });
    }
  };

  // Load a Community Preset into Active Balancer
  const handleLoadCommunityPreset = (preset: EconomyPreset) => {
    setSelectedTemplateKey('custom');
    setServerName(preset.serverName);
    setFrameworkTarget(preset.frameworkTarget);
    setAnchors({ ...preset.anchors });
    setJobs(preset.jobs.map((j) => ({ ...j })));
    setSinks({ ...preset.sinks });
    setServerParams({ ...preset.serverParams });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Upvote Preset
  const handleUpvotePreset = async (presetId: string) => {
    if (!userProfile) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    const userKey = userProfile.id || (userProfile as any)?.uid || 'guest_user';
    const isAlreadyUpvoted = upvotedPresetIds.has(presetId);

    if (isAlreadyUpvoted) {
      setUpvotedPresetIds((prev) => {
        const next = new Set(prev);
        next.delete(presetId);
        return next;
      });
      setCommunityPresets((prev) =>
        prev.map((p) =>
          p.presetId === presetId
            ? {
                ...p,
                upvotesCount: Math.max(0, (p.upvotesCount || 1) - 1),
                upvotedBy: (p.upvotedBy || []).filter((u) => u !== userKey)
              }
            : p
        )
      );
      try {
        const docRef = doc(db, 'economy_presets', presetId);
        await updateDoc(docRef, {
          upvotesCount: increment(-1),
          upvotedBy: arrayRemove(userKey)
        });
      } catch (err) {
        console.warn('Could not remove upvote in Firestore:', err);
      }
    } else {
      setUpvotedPresetIds((prev) => new Set(prev).add(presetId));
      setCommunityPresets((prev) =>
        prev
          .map((p) =>
            p.presetId === presetId
              ? {
                  ...p,
                  upvotesCount: (p.upvotesCount || 0) + 1,
                  upvotedBy: [...(p.upvotedBy || []), userKey]
                }
              : p
          )
          .sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0))
      );
      try {
        const docRef = doc(db, 'economy_presets', presetId);
        await updateDoc(docRef, {
          upvotesCount: increment(1),
          upvotedBy: arrayUnion(userKey)
        });
      } catch (err) {
        console.warn('Could not add upvote in Firestore:', err);
      }
    }
  };

  // Update single job payout
  const handleUpdateJobPayout = (jobId: string, newPayout: number) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, hourlyPayout: Math.max(1, Math.round(newPayout)) } : j))
    );
  };

  // Update single job risk level
  const handleUpdateJobRisk = (jobId: string, newRisk: number) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, riskLevel: Math.max(1, Math.min(10, Math.round(newRisk))) } : j))
    );
  };

  // Save Preset to Firestore
  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!presetTitle.trim()) {
      setSaveFeedback('Please enter a server or preset title.');
      return;
    }

    setIsSaving(true);
    setSaveFeedback(null);

    const userId = userProfile.id || (userProfile as any).uid || 'vice_user';
    const newPresetId = `preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newPreset: EconomyPreset = {
      presetId: newPresetId,
      authorUid: userId,
      authorName: userProfile.username || 'Server Architect',
      serverName: presetTitle.trim(),
      frameworkTarget: frameworkTarget,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublicTemplate: true,
      upvotesCount: 1,
      upvotedBy: [userId],
      anchors: anchors,
      jobs: jobs,
      sinks: sinks,
      serverParams: serverParams,
      notes: presetNotes.trim() || undefined
    };

    try {
      // 1. Save document to Firestore
      const docRef = doc(db, 'economy_presets', newPresetId);
      await setDoc(docRef, newPreset);

      // 2. Grant +100 VC balance bonus in user profile
      try {
        const userDocRef = doc(db, 'userProfiles', userId);
        await updateDoc(userDocRef, {
          vcBalance: increment(100)
        });
      } catch (vcErr) {
        console.warn('Could not increment VC balance bonus:', vcErr);
      }

      setCommunityPresets((prev) => [newPreset, ...prev]);
      setUpvotedPresetIds((prev) => new Set(prev).add(newPresetId));
      setSaveFeedback('Setup published successfully! +100 VC Bonus awarded to your profile.');

      setTimeout(() => {
        setIsSaveModalOpen(false);
        setSaveFeedback(null);
        setPresetTitle('');
        setPresetNotes('');
      }, 1500);
    } catch (err: any) {
      console.warn('Failed to save economy preset to Firestore:', err);
      setSaveFeedback('Failed to save preset to database. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Community Presets
  const filteredPresets = communityPresets.filter((preset) => {
    const matchesSearch =
      preset.serverName.toLowerCase().includes(communitySearch.toLowerCase()) ||
      (preset.authorName && preset.authorName.toLowerCase().includes(communitySearch.toLowerCase())) ||
      (preset.notes && preset.notes.toLowerCase().includes(communitySearch.toLowerCase()));

    const matchesFramework = frameworkFilter === 'all' || preset.frameworkTarget === frameworkFilter;
    return matchesSearch && matchesFramework;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. CLEAN HERO HEADER MATCHING PLATFORM THEME */}
      <section className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 lg:p-10 overflow-hidden shadow-2xl text-center sm:text-left space-y-6">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                <span>FiveM Server Economy Studio</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400 font-bold">QBCore / ESX / QBX</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                RP Economy & <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-500 bg-clip-text text-transparent">Wage Balancer</span>
              </h1>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                Design a balanced economy for your FiveM server. Adjust hourly job wages, balance prices against supercars and housing, simulate 30-day inflation, and export ready-to-use config files.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
              {onSwitchTab && (
                <button
                  type="button"
                  onClick={() => onSwitchTab('script-generator')}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs sm:text-sm rounded-xl border border-white/10 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileCode className="w-4 h-4 text-rose-400" />
                  <span>Script & Lua Studio</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!userProfile && onOpenAuthModal) {
                    onOpenAuthModal();
                  } else {
                    setPresetTitle(serverName);
                    setIsSaveModalOpen(true);
                  }
                }}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save & Share Preset</span>
              </button>
            </div>
          </div>

          {/* 3 Step Guidance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-800 text-left">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs shrink-0">
                1
              </div>
              <div className="text-xs">
                <strong className="text-white block font-bold">Pick Server Style</strong>
                <span className="text-zinc-400 text-[11px]">Choose a balanced, hardcore, or fast-action preset below.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs shrink-0">
                2
              </div>
              <div className="text-xs">
                <strong className="text-white block font-bold">Tune Wages & Prices</strong>
                <span className="text-zinc-400 text-[11px]">Set hourly pay rates and money sinks using the sliders.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                3
              </div>
              <div className="text-xs">
                <strong className="text-white block font-bold">Export Config</strong>
                <span className="text-zinc-400 text-[11px]">Copy ready-to-paste Lua code directly into your server.</span>
              </div>
            </div>
          </div>

          {/* Quick Preset Selector */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold">
              <Layers className="w-4 h-4 text-rose-400" />
              <span>Quick Presets:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
              {Object.entries(PRESET_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectTemplate(key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    selectedTemplateKey === key
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <span>{key === 'nopixel-balanced' ? '⚖️' : key === 'hardcore-survival' ? '💀' : '⚡'}</span>
                  <span>{template.serverName.split('(')[0].trim()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN BALANCER WORKSPACE (CLEAN 2-COLUMN STUDIO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Easy Inputs & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-rose-400" />
              <span>Economy Parameters</span>
            </h2>
            <span className="text-xs font-mono text-zinc-500">Framework: {frameworkTarget.toUpperCase()}</span>
          </div>

          <EconomyControlPanel
            anchors={anchors}
            setAnchors={setAnchors}
            jobs={jobs}
            setJobs={setJobs}
            sinks={sinks}
            setSinks={setSinks}
            serverParams={serverParams}
            setServerParams={setServerParams}
            frameworkTarget={frameworkTarget}
            setFrameworkTarget={setFrameworkTarget}
            serverName={serverName}
            setServerName={setServerName}
            onAutoRecalculateWages={handleAutoRecalculateWages}
          />
        </div>

        {/* Right Column: Live Simulation, Health & Inflation Graph */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Live Simulation & Health</span>
            </h2>
            <span className="text-xs text-zinc-400">
              Stability: <strong className="text-emerald-400 font-mono">{Math.round(calculationResults.inflationIndexScore)}/100</strong>
            </span>
          </div>

          <EconomySimulationChart
            results={calculationResults}
            anchors={anchors}
            serverParams={serverParams}
            jobs={jobs}
            onUpdateJobPayout={handleUpdateJobPayout}
            onUpdateJobRisk={handleUpdateJobRisk}
          />
        </div>
      </div>

      {/* 3. COMMUNITY PRESETS SHOWCASE & MARKETPLACE */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
              <Server className="w-3.5 h-3.5" />
              <span>Community Repository</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Verified FiveM & RP Server Economy Setups
            </h3>
          </div>

          {/* Framework Filter Pills */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 text-xs overflow-x-auto no-scrollbar">
            {(['all', 'qbcore', 'esx', 'qbx', 'custom_json'] as const).map((fw) => (
              <button
                key={fw}
                type="button"
                onClick={() => setFrameworkFilter(fw)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition cursor-pointer whitespace-nowrap ${
                  frameworkFilter === fw
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {fw === 'all' ? 'All Formats' : fw === 'custom_json' ? 'JSON' : fw.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search community economy presets by server name, framework, or author..."
            value={communitySearch}
            onChange={(e) => setCommunitySearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-rose-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
          />
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPresets.map((preset) => {
            const isUpvoted = upvotedPresetIds.has(preset.presetId);
            return (
              <div
                key={preset.presetId}
                className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      {preset.frameworkTarget.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      By {preset.authorName}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-white leading-snug">
                    {preset.serverName}
                  </h4>

                  {preset.notes && (
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {preset.notes}
                    </p>
                  )}

                  {/* Key Stats Chips */}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs font-mono">
                    <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">SUPERCAR GRIND</span>
                      <span className="text-white font-bold">{preset.anchors.targetSupercarHours}h</span>
                    </div>
                    <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">TOTAL JOBS</span>
                      <span className="text-rose-400 font-bold">{preset.jobs.length} Jobs</span>
                    </div>
                    <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[9px]">DAILY TAX</span>
                      <span className="text-cyan-400 font-bold">{preset.anchors.dailyTaxesAndFees}%</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpvotePreset(preset.presetId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isUpvoted
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{preset.upvotesCount || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadCommunityPreset(preset)}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-rose-600/20 flex items-center gap-1"
                  >
                    <span>Load Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SAVE & PUBLISH PRESET MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-white">Save & Publish Economy Setup</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Server or Economy Setup Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Vice City Realistic Economy V3, Los Santos 64p Hardcore"
                  value={presetTitle}
                  onChange={(e) => setPresetTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Framework Target
                  </label>
                  <select
                    value={frameworkTarget}
                    onChange={(e) => setFrameworkTarget(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="qbcore">QBCore Framework</option>
                    <option value="esx">ESX Legacy</option>
                    <option value="qbx">QBX (Qbox Core)</option>
                    <option value="custom_json">Custom JSON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Active Jobs Count
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${jobs.length} Jobs Configured`}
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Server Description & Balancing Philosophy
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe target player count, grind pacing, police wages vs heist risks, and tax curve settings..."
                  value={presetNotes}
                  onChange={(e) => setPresetNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-rose-500 rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed"
                />
              </div>

              {saveFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    saveFeedback.includes('successfully')
                      ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/50 border border-rose-500/40 text-rose-300'
                  }`}
                >
                  {saveFeedback.includes('successfully') ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{saveFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/20 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Publish Setup & Claim +100 VC'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EconomyBalancerTab;
