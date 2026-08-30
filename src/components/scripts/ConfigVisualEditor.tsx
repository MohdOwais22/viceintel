'use client';

import React, { useState } from 'react';
import {
  ServerConfigProject,
  JobConfig,
  ItemConfig,
  JobGrade,
  SupportedFramework,
  ConfigCategory,
  calculateEconomyMetrics,
  EconomyMetrics
} from '../../lib/lua-generators';
import {
  Sliders,
  Briefcase,
  Package,
  Car,
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  Flame,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfigVisualEditorProps {
  project: ServerConfigProject;
  onChange: (updated: ServerConfigProject) => void;
  onSynthesizeAi: (prompt: string) => Promise<void>;
  isAiLoading: boolean;
  aiStatusMessage?: string;
  isProUser: boolean;
  onOpenProModal: () => void;
}

export const ConfigVisualEditor: React.FC<ConfigVisualEditorProps> = ({
  project,
  onChange,
  onSynthesizeAi,
  isAiLoading,
  aiStatusMessage,
  isProUser,
  onOpenProModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'baselines' | 'jobs' | 'items' | 'handling' | 'ai_prompter'>('jobs');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(project.jobs[0]?.id || null);

  const metrics: EconomyMetrics = calculateEconomyMetrics(project);

  // Helper updates
  const updateProjectField = <K extends keyof ServerConfigProject>(field: K, value: ServerConfigProject[K]) => {
    onChange({
      ...project,
      [field]: value,
      updatedAt: Date.now()
    });
  };

  const updateBaselines = (key: keyof ServerConfigProject['economyBaselines'], val: number) => {
    onChange({
      ...project,
      economyBaselines: {
        ...project.economyBaselines,
        [key]: val
      },
      updatedAt: Date.now()
    });
  };

  // Job handlers
  const handleAddJob = () => {
    const newJob: JobConfig = {
      id: `job-${Date.now()}`,
      name: `custom_job_${project.jobs.length + 1}`,
      label: `Custom Roleplay Job ${project.jobs.length + 1}`,
      defaultDuty: false,
      offDutyPay: false,
      riskFactor: 1.0,
      cycleMinutes: 15,
      isIllegal: false,
      grades: [
        { grade: 0, name: 'recruit', label: 'Recruit', payment: 750 },
        { grade: 1, name: 'specialist', label: 'Lead Specialist', payment: 1500 },
        { grade: 2, name: 'boss', label: 'Managing Director', payment: 3000, isBoss: true }
      ]
    };
    const updatedJobs = [...project.jobs, newJob];
    updateProjectField('jobs', updatedJobs);
    setExpandedJobId(newJob.id);
  };

  const handleRemoveJob = (jobId: string) => {
    const updatedJobs = project.jobs.filter((j) => j.id !== jobId);
    updateProjectField('jobs', updatedJobs);
  };

  const handleUpdateJob = (jobId: string, patch: Partial<JobConfig>) => {
    const updatedJobs = project.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j));
    updateProjectField('jobs', updatedJobs);
  };

  const handleAddGrade = (jobId: string) => {
    const targetJob = project.jobs.find((j) => j.id === jobId);
    if (!targetJob) return;
    const nextGradeNum = targetJob.grades.length;
    const newGrade: JobGrade = {
      grade: nextGradeNum,
      name: `tier_${nextGradeNum}`,
      label: `Rank ${nextGradeNum + 1}`,
      payment: Math.round((targetJob.grades[targetJob.grades.length - 1]?.payment || 1000) * 1.35)
    };
    handleUpdateJob(jobId, { grades: [...targetJob.grades, newGrade] });
  };

  const handleRemoveGrade = (jobId: string, gradeIdx: number) => {
    const targetJob = project.jobs.find((j) => j.id === jobId);
    if (!targetJob || targetJob.grades.length <= 1) return;
    const updatedGrades = targetJob.grades.filter((_, idx) => idx !== gradeIdx);
    handleUpdateJob(jobId, { grades: updatedGrades });
  };

  const handleUpdateGrade = (jobId: string, gradeIdx: number, patch: Partial<JobGrade>) => {
    const targetJob = project.jobs.find((j) => j.id === jobId);
    if (!targetJob) return;
    const updatedGrades = targetJob.grades.map((g, idx) => (idx === gradeIdx ? { ...g, ...patch } : g));
    handleUpdateJob(jobId, { grades: updatedGrades });
  };

  // Item handlers
  const handleAddItem = () => {
    const newItem: ItemConfig = {
      name: `item_${Date.now().toString().slice(-4)}`,
      label: `New Inventory Item`,
      weight: 500,
      type: 'item',
      image: 'item.png',
      unique: false,
      useable: true,
      shouldClose: true,
      description: 'Standard roleplay inventory item.',
      buyPrice: 250,
      sellPrice: 100
    };
    updateProjectField('items', [...project.items, newItem]);
  };

  const handleRemoveItem = (idx: number) => {
    const updated = project.items.filter((_, i) => i !== idx);
    updateProjectField('items', updated);
  };

  const handleUpdateItem = (idx: number, patch: Partial<ItemConfig>) => {
    const updated = project.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    updateProjectField('items', updated);
  };

  // Batch scale all job salaries by factor (e.g. 1.2x, 0.8x)
  const handleBatchScaleWages = (factor: number) => {
    const updatedJobs = project.jobs.map((job) => ({
      ...job,
      grades: job.grades.map((grade) => ({
        ...grade,
        payment: Math.max(50, Math.round(grade.payment * factor))
      }))
    }));
    updateProjectField('jobs', updatedJobs);
  };

  // Handling parameter updates
  const updateHandlingParam = (key: string, val: number) => {
    const current = project.customHandling || {
      fMass: 1550,
      fInitialDragCoeff: 8.0,
      fInitialDriveForce: 0.39,
      fDriveBiasFront: 0.0,
      fBrakeForce: 1.2,
      fSteeringLock: 38.5,
      fTractionCurveMax: 2.45,
      fDownforceModifier: 1.9
    };
    updateProjectField('customHandling', {
      ...current,
      [key]: val
    });
  };

  const promptStarters = [
    'Create a 3-tier illicit oxy-run delivery contract for QBCore with police count checks and payout scaling',
    'Generate a high-security jewelry heist loot table with heavy bullion and high sell values',
    'Build a 4-tier Vice City Port Smuggling syndicate with boat courier grades and risk pay scale',
    'Tune a Miami Vice Exotic EV hypercar handling with 40/60 AWD balance and sharp cornering'
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header & Framework Selection */}
      <div className="p-4 border-b border-white/10 bg-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                Visual Studio
              </span>
              <span className="text-xs text-zinc-400 font-mono">Zero-Syntax-Error Engine</span>
            </div>
            <input
              type="text"
              value={project.projectName}
              onChange={(e) => updateProjectField('projectName', e.target.value)}
              className="mt-1 text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-rose-500 focus:outline-none w-full transition-colors"
              placeholder="Project Name..."
            />
          </div>

          {/* Framework Picker */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-white/10">
            {(['qbcore', 'esx_legacy', 'standalone_lua', 'handling_meta'] as SupportedFramework[]).map((fw) => (
              <button
                key={fw}
                onClick={() => updateProjectField('framework', fw)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  project.framework === fw
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {fw === 'qbcore' && 'QBCore'}
                {fw === 'esx_legacy' && 'ESX Legacy'}
                {fw === 'standalone_lua' && 'Standalone'}
                {fw === 'handling_meta' && 'Handling.meta'}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Economy Telemetry Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Avg Hourly Wage</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">Live Math</span>
            </div>
            <span className="text-base font-black text-emerald-400 font-mono">
              ${metrics.avgHourlyWage.toLocaleString()}<span className="text-xs text-zinc-400">/hr</span>
            </span>
            <span className="text-[9px] text-zinc-400 truncate">
              Civ: ${metrics.legalAvgHourlyWage.toLocaleString()} · Crime: ${metrics.illegalAvgHourlyWage.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Grind to Supercar</span>
            <span className="text-base font-black text-amber-400 font-mono">
              {metrics.hoursToSupercar} <span className="text-xs text-zinc-400">hrs</span>
            </span>
            <span className="text-[9px] text-zinc-400 truncate">
              Benchmark: ${(project.economyBaselines.targetSupercarPrice / 1000).toFixed(0)}k car
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Illegal Disparity</span>
            <span className="text-base font-black text-cyan-400 font-mono">
              {metrics.wageDisparityRatio}x <span className="text-xs text-zinc-400">ratio</span>
            </span>
            <span className="text-[9px] text-zinc-400 truncate">
              {metrics.wageDisparityRatio > 2.5 ? 'High Crime Incentive' : 'Balanced Spread'}
            </span>
          </div>

          <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${metrics.ratingColor}`}>
            <span className="text-[10px] uppercase font-bold opacity-80">Economy Velocity</span>
            <span className="text-xs font-black truncate">{metrics.rating}</span>
            <span className="text-[9px] opacity-80 truncate">
              Velocity: {metrics.velocityScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-white/10 bg-zinc-950/80 px-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('jobs')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'jobs'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Jobs & Tiers ({project.jobs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('items')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'items'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Item Registry ({project.items.length})
        </button>

        <button
          onClick={() => setActiveSubTab('baselines')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'baselines'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Economy Baselines
        </button>

        <button
          onClick={() => setActiveSubTab('handling')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'handling'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          Vehicle Handling
        </button>

        <button
          onClick={() => setActiveSubTab('ai_prompter')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSubTab === 'ai_prompter'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          AI Script Synthesizer
        </button>
      </div>

      {/* Sub-Tab Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ===================== TAB: JOBS & TIERS ===================== */}
        {activeSubTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Configured Roleplay Jobs</h4>
                <p className="text-xs text-zinc-400">
                  Define civilian careers and illicit syndicates with automatic wage & grade scaling.
                </p>
              </div>
              <button
                onClick={handleAddJob}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-rose-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Job
              </button>
            </div>

            <div className="space-y-3">
              {project.jobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                return (
                  <div
                    key={job.id}
                    className="border border-white/10 rounded-xl bg-zinc-900/70 overflow-hidden transition-all"
                  >
                    {/* Job Card Header */}
                    <div
                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                      className="p-3 bg-zinc-800/40 hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            job.isIllegal
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}
                        >
                          {job.isIllegal ? <Flame className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{job.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400">
                              {job.name}
                            </span>
                            {job.isIllegal && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                                Illicit ({job.riskFactor}x Risk)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400">
                            {job.grades.length} Grades · Base Pay: ${job.grades[0]?.payment || 0} → Top Pay: $
                            {job.grades[job.grades.length - 1]?.payment || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveJob(job.id);
                          }}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                      </div>
                    </div>

                    {/* Job Details Expansion */}
                    {isExpanded && (
                      <div className="p-4 border-t border-white/5 space-y-4 bg-black/20">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-400">Job Key (Lua)</label>
                            <input
                              type="text"
                              value={job.name}
                              onChange={(e) => handleUpdateJob(job.id, { name: e.target.value })}
                              className="mt-1 w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-400">Display Label</label>
                            <input
                              type="text"
                              value={job.label}
                              onChange={(e) => handleUpdateJob(job.id, { label: e.target.value })}
                              className="mt-1 w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-400">Cycle Duration (Mins)</label>
                            <input
                              type="number"
                              value={job.cycleMinutes}
                              onChange={(e) => handleUpdateJob(job.id, { cycleMinutes: Number(e.target.value) })}
                              className="mt-1 w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Toggles & Risk Multiplier */}
                        <div className="flex flex-wrap items-center gap-4 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox"
                              checked={job.isIllegal || false}
                              onChange={(e) =>
                                handleUpdateJob(job.id, {
                                  isIllegal: e.target.checked,
                                  riskFactor: e.target.checked ? 2.0 : 1.0
                                })
                              }
                              className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500"
                            />
                            <span>Illicit / Contraband Syndicate</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox"
                              checked={job.defaultDuty}
                              onChange={(e) => handleUpdateJob(job.id, { defaultDuty: e.target.checked })}
                              className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500"
                            />
                            <span>Default On-Duty</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                            <input
                              type="checkbox"
                              checked={job.offDutyPay}
                              onChange={(e) => handleUpdateJob(job.id, { offDutyPay: e.target.checked })}
                              className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500"
                            />
                            <span>Off-Duty Paycheck</span>
                          </label>
                        </div>

                        {/* Dynamic Grades Table */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-300">Rank Hierarchy & Payments</span>
                            <button
                              onClick={() => handleAddGrade(job.id)}
                              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                            >
                              <Plus className="w-3 h-3" />
                              Add Rank Tier
                            </button>
                          </div>

                          <div className="space-y-2">
                            {job.grades.map((grade, gIdx) => (
                              <div
                                key={gIdx}
                                className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-zinc-900/90 rounded-lg border border-white/5 text-xs"
                              >
                                <span className="font-mono text-zinc-500 font-bold px-1.5">G{grade.grade}</span>
                                <input
                                  type="text"
                                  placeholder="Grade Key (e.g. recruit)"
                                  value={grade.name}
                                  onChange={(e) => handleUpdateGrade(job.id, gIdx, { name: e.target.value })}
                                  className="bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-xs w-28 focus:border-rose-500 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="Display Label"
                                  value={grade.label}
                                  onChange={(e) => handleUpdateGrade(job.id, gIdx, { label: e.target.value })}
                                  className="bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-xs flex-1 focus:border-rose-500 focus:outline-none"
                                />
                                <div className="flex items-center gap-1">
                                  <span className="text-zinc-500">$</span>
                                  <input
                                    type="number"
                                    placeholder="Payment"
                                    value={grade.payment}
                                    onChange={(e) =>
                                      handleUpdateGrade(job.id, gIdx, { payment: Number(e.target.value) })
                                    }
                                    className="bg-black/50 border border-white/10 rounded px-2 py-1 text-emerald-400 font-mono text-xs w-20 focus:border-rose-500 focus:outline-none"
                                  />
                                </div>
                                <label className="flex items-center gap-1 text-[11px] text-zinc-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={grade.isBoss || false}
                                    onChange={(e) => handleUpdateGrade(job.id, gIdx, { isBoss: e.target.checked })}
                                    className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500"
                                  />
                                  <span>Boss</span>
                                </label>
                                <button
                                  onClick={() => handleRemoveGrade(job.id, gIdx)}
                                  disabled={job.grades.length <= 1}
                                  className="p-1 text-zinc-600 hover:text-rose-400 disabled:opacity-30"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB: ITEM REGISTRY ===================== */}
        {activeSubTab === 'items' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Item & Inventory Registry</h4>
                <p className="text-xs text-zinc-400">
                  Zero-syntax-error items table formatted for QBCore / ox_inventory / ESX Legacy.
                </p>
              </div>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-rose-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {project.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-zinc-900/70 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-bold">
                        <Package className="w-4 h-4 text-rose-400" />
                      </div>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(idx, { name: e.target.value })}
                        placeholder="item_key"
                        className="font-mono text-xs font-bold text-rose-400 bg-black/40 border border-white/10 rounded px-2 py-1 w-32 focus:border-rose-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleUpdateItem(idx, { label: e.target.value })}
                        placeholder="Display Name"
                        className="text-xs font-bold text-white bg-black/40 border border-white/10 rounded px-2 py-1 flex-1 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Weight (grams)</span>
                      <input
                        type="number"
                        value={item.weight}
                        onChange={(e) => handleUpdateItem(idx, { weight: Number(e.target.value) })}
                        className="mt-1 w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Type</span>
                      <select
                        value={item.type}
                        onChange={(e) => handleUpdateItem(idx, { type: e.target.value as any })}
                        className="mt-1 w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white"
                      >
                        <option value="item">General Item</option>
                        <option value="consumable">Consumable</option>
                        <option value="weapon">Weapon</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Buy Price ($)</span>
                      <input
                        type="number"
                        value={item.buyPrice || 0}
                        onChange={(e) => handleUpdateItem(idx, { buyPrice: Number(e.target.value) })}
                        className="mt-1 w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-emerald-400 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400">Sell Price ($)</span>
                      <input
                        type="number"
                        value={item.sellPrice || 0}
                        onChange={(e) => handleUpdateItem(idx, { sellPrice: Number(e.target.value) })}
                        className="mt-1 w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(idx, { description: e.target.value })}
                    placeholder="Description & lore text..."
                    className="w-full text-xs text-zinc-300 bg-black/30 border border-white/5 rounded px-2 py-1 focus:border-rose-500 focus:outline-none"
                  />

                  <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.unique}
                        onChange={(e) => handleUpdateItem(idx, { unique: e.target.checked })}
                        className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span>Unique (Non-stackable)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.useable}
                        onChange={(e) => handleUpdateItem(idx, { useable: e.target.checked })}
                        className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span>Usable</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.shouldClose}
                        onChange={(e) => handleUpdateItem(idx, { shouldClose: e.target.checked })}
                        className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500"
                      />
                      <span>Close On Use</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB: ECONOMY BASELINES ===================== */}
        {activeSubTab === 'baselines' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white">Mathematical Economy Levers & Dynamic Wage Simulator</h4>
              <p className="text-xs text-zinc-400">
                Configure baseline asset costs, tax policies, and paycheck timers. The simulation engine dynamically calculates live hourly wages, inflation risk, and luxury supercar progression.
              </p>
            </div>

            {/* Live Dynamic Wage Breakdown Box */}
            <div className="p-4 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-black/80 border border-emerald-500/20 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Live Dynamic Wage Calculator
                  </h5>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  Formula: Σ(Grade Salary × {(60 / Math.max(5, project.economyBaselines.paycheckIntervalMinutes || 15)).toFixed(1)} checks/hr × Risk) - {project.economyBaselines.taxRatePercentage}% Tax
                </span>
              </div>

              {/* 3 Wage Breakdown Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-zinc-950/80 border border-white/5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Combined Server Average</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    ${metrics.avgHourlyWage.toLocaleString()}<span className="text-xs text-zinc-400">/hr</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">Across all {project.jobs.length} jobs & {project.jobs.reduce((acc, j) => acc + j.grades.length, 0)} ranks</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950/80 border border-white/5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Civilian / Legal Hourly Avg</span>
                  <span className="text-lg font-black text-blue-400 font-mono">
                    ${metrics.legalAvgHourlyWage.toLocaleString()}<span className="text-xs text-zinc-400">/hr</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">Police, EMS, Mechanics & Logistics</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950/80 border border-white/5 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Illicit / Crime Hourly Avg</span>
                  <span className="text-lg font-black text-rose-400 font-mono">
                    ${metrics.illegalAvgHourlyWage.toLocaleString()}<span className="text-xs text-zinc-400">/hr</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">Smugglers, Cartel & Drug Heists</span>
                </div>
              </div>

              {/* 1-Click Batch Wage Scaling */}
              <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-zinc-300 font-bold flex items-center gap-1.5">
                  <span>Batch Scale All Job Wages:</span>
                  <span className="text-[10px] font-normal text-zinc-400">(Instantly updates all ranks & recalculates live average)</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: '-20%', factor: 0.8 },
                    { label: '-10%', factor: 0.9 },
                    { label: '+10%', factor: 1.1 },
                    { label: '+25%', factor: 1.25 },
                    { label: '+50%', factor: 1.5 },
                    { label: '2.0x (Double)', factor: 2.0 }
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => handleBatchScaleWages(btn.factor)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded bg-zinc-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-white/10 text-zinc-300 hover:text-rose-300 transition-all active:scale-95"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900/70 border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-300">Target Supercar Price</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${project.economyBaselines.targetSupercarPrice.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="3000000"
                  step="50000"
                  value={project.economyBaselines.targetSupercarPrice}
                  onChange={(e) => updateBaselines('targetSupercarPrice', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <span className="text-[11px] text-zinc-500">Benchmark luxury benchmark (e.g. Grotti Cheetah / Pegassi Ignus).</span>
              </div>

              <div className="p-4 bg-zinc-900/70 border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-300">Government Tax Rate</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {project.economyBaselines.taxRatePercentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={project.economyBaselines.taxRatePercentage}
                  onChange={(e) => updateBaselines('taxRatePercentage', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <span className="text-[11px] text-zinc-500">Deduction applied to bank transactions and merchant sales.</span>
              </div>

              <div className="p-4 bg-zinc-900/70 border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-300">Paycheck Interval</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {project.economyBaselines.paycheckIntervalMinutes} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={project.economyBaselines.paycheckIntervalMinutes}
                  onChange={(e) => updateBaselines('paycheckIntervalMinutes', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <span className="text-[11px] text-zinc-500">Server timer triggering job grade salary deposits.</span>
              </div>

              <div className="p-4 bg-zinc-900/70 border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-300">Starting Bank Balance</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${project.economyBaselines.startingBankBalance.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={project.economyBaselines.startingBankBalance}
                  onChange={(e) => updateBaselines('startingBankBalance', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <span className="text-[11px] text-zinc-500">Initial bank credit given to first-time joining players.</span>
              </div>
            </div>

            {/* Recommendations Box */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Info className="w-4 h-4 text-rose-400" />
                <span>Simulation Diagnostic & Balance Insights</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300">
                {metrics.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400">▸</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ===================== TAB: VEHICLE HANDLING TUNER ===================== */}
        {activeSubTab === 'handling' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white">GTA V Vehicle handling.meta XML Editor</h4>
              <p className="text-xs text-zinc-400">
                Tune vehicle physics parameters with zero XML syntax crashes on FiveM reboot.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-900/70 border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-300">Vehicle Mass (fMass)</span>
                  <span className="font-mono text-rose-400 font-bold">{project.customHandling?.fMass || 1550} kg</span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="4500"
                  step="25"
                  value={project.customHandling?.fMass || 1550}
                  onChange={(e) => updateHandlingParam('fMass', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="p-3 bg-zinc-900/70 border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-300">Drive Force (fInitialDriveForce)</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {(project.customHandling?.fInitialDriveForce || 0.39).toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.95"
                  step="0.01"
                  value={project.customHandling?.fInitialDriveForce || 0.39}
                  onChange={(e) => updateHandlingParam('fInitialDriveForce', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="p-3 bg-zinc-900/70 border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-300">Drivetrain Bias (0.0 RWD / 1.0 FWD)</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {(project.customHandling?.fDriveBiasFront || 0).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={project.customHandling?.fDriveBiasFront || 0}
                  onChange={(e) => updateHandlingParam('fDriveBiasFront', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="p-3 bg-zinc-900/70 border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-300">Braking Force (fBrakeForce)</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {(project.customHandling?.fBrakeForce || 1.2).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.05"
                  value={project.customHandling?.fBrakeForce || 1.2}
                  onChange={(e) => updateHandlingParam('fBrakeForce', Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: AI PROMPTER ===================== */}
        {activeSubTab === 'ai_prompter' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/40 via-zinc-900 to-black border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-400 animate-spin" />
                <h4 className="text-sm font-bold text-white">AI Script & Logic Synthesizer</h4>
                <span className="ml-auto text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Gemini 3.7 Flash Engine
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Describe any custom FiveM job, illicit heist contract, inventory catalog, or vehicle tuning spec. The AI generates structured data verified through the zero-syntax-error compiler.
              </p>

              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Create a 4-tier Vice City Port Smuggler job with boat deliveries, police count checks, and oxy prescription items..."
                rows={3}
                className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-zinc-500 focus:border-rose-500 focus:outline-none resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500">
                  {isAiLoading ? aiStatusMessage || 'Synthesizing verified Lua tables...' : 'Ready for natural language prompt'}
                </span>

                <button
                  disabled={isAiLoading || !aiPrompt.trim()}
                  onClick={() => onSynthesizeAi(aiPrompt)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-600/30 transition-all"
                >
                  {isAiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Synthesize Script Config</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Prompt Ideas */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400">1-Click Prompt Ideas:</span>
              <div className="grid grid-cols-1 gap-2">
                {promptStarters.map((starter, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAiPrompt(starter)}
                    className="p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 text-left text-xs text-zinc-300 hover:text-white transition-colors flex items-start gap-2"
                  >
                    <span className="text-rose-400 font-bold">⚡</span>
                    <span>{starter}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
