'use client';

import React, { useState } from 'react';
import {
  Sliders,
  DollarSign,
  Briefcase,
  TrendingDown,
  Download,
  Copy,
  CheckCircle,
  Plus,
  Trash2,
  RefreshCw,
  FileCode,
  Shield,
  Zap,
  Layers,
  AlertCircle,
  Sparkles,
  Users
} from 'lucide-react';
import {
  EconomicAnchors,
  JobConfig,
  MoneySinkConfig,
  ServerSimParameters,
  exportLuaConfig,
  exportJsonConfig
} from '../../lib/economy-engine';

interface EconomyControlPanelProps {
  anchors: EconomicAnchors;
  setAnchors: React.Dispatch<React.SetStateAction<EconomicAnchors>>;
  jobs: JobConfig[];
  setJobs: React.Dispatch<React.SetStateAction<JobConfig[]>>;
  sinks: MoneySinkConfig;
  setSinks: React.Dispatch<React.SetStateAction<MoneySinkConfig>>;
  serverParams: ServerSimParameters;
  setServerParams: React.Dispatch<React.SetStateAction<ServerSimParameters>>;
  frameworkTarget: 'qbcore' | 'esx' | 'qbx' | 'custom_json';
  setFrameworkTarget: (target: 'qbcore' | 'esx' | 'qbx' | 'custom_json') => void;
  serverName: string;
  setServerName: (name: string) => void;
  onAutoRecalculateWages: () => void;
  activeTab?: 'anchors' | 'jobs' | 'sinks' | 'export';
  onTabChange?: (tab: 'anchors' | 'jobs' | 'sinks' | 'export') => void;
}

export const EconomyControlPanel: React.FC<EconomyControlPanelProps> = ({
  anchors,
  setAnchors,
  jobs,
  setJobs,
  sinks,
  setSinks,
  serverParams,
  setServerParams,
  frameworkTarget,
  setFrameworkTarget,
  serverName,
  setServerName,
  onAutoRecalculateWages,
  activeTab: externalTab,
  onTabChange: externalOnTabChange
}) => {
  const [internalTab, setInternalTab] = useState<'anchors' | 'jobs' | 'sinks' | 'export'>('anchors');
  const activeTab = externalTab !== undefined ? externalTab : internalTab;
  const setActiveTab = (t: 'anchors' | 'jobs' | 'sinks' | 'export') => {
    if (externalOnTabChange) externalOnTabChange(t);
    setInternalTab(t);
  };
  const [jobFilter, setJobFilter] = useState<'all' | 'legal' | 'illegal'>('all');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState<boolean>(false);

  // New Custom Job Form State
  const [newJobName, setNewJobName] = useState<string>('');
  const [newJobType, setNewJobType] = useState<'legal' | 'illegal'>('legal');
  const [newJobCategory, setNewJobCategory] = useState<JobConfig['category']>('services');
  const [newJobRisk, setNewJobRisk] = useState<number>(1.0);
  const [newJobPayout, setNewJobPayout] = useState<number>(11000);

  // Update specific anchor
  const updateAnchor = (key: keyof EconomicAnchors, val: number) => {
    setAnchors((prev) => ({ ...prev, [key]: val }));
  };

  // Update specific sink
  const updateSink = (key: keyof MoneySinkConfig, val: number) => {
    setSinks((prev) => ({ ...prev, [key]: val }));
  };

  // Update specific server param
  const updateServerParam = (key: keyof ServerSimParameters, val: number) => {
    setServerParams((prev) => ({ ...prev, [key]: val }));
  };

  // Update specific job payout
  const updateJobPayout = (jobId: string, payout: number) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              hourlyPayout: payout,
              baseSalaryPerTick: Math.round(payout / 12)
            }
          : j
      )
    );
  };

  // Update job risk level
  const updateJobRisk = (jobId: string, risk: number) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, riskLevel: risk } : j))
    );
  };

  // Delete job
  const handleDeleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  // Add custom job
  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName.trim()) return;

    const id = newJobName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newJob: JobConfig = {
      id: `custom_${id}_${Date.now().toString().slice(-4)}`,
      name: newJobName.trim(),
      category: newJobCategory,
      type: newJobType,
      riskLevel: newJobRisk,
      hourlyPayout: newJobPayout,
      baseSalaryPerTick: Math.round(newJobPayout / 12)
    };

    setJobs((prev) => [...prev, newJob]);
    setNewJobName('');
    setIsAddJobOpen(false);
  };

  // Export string computation
  const generatedCode =
    frameworkTarget === 'custom_json'
      ? exportJsonConfig(anchors, jobs, sinks, serverParams, serverName)
      : exportLuaConfig(frameworkTarget, jobs, anchors, sinks, serverName);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const handleDownloadFile = () => {
    const filename =
      frameworkTarget === 'custom_json'
        ? `${serverName.toLowerCase().replace(/\s+/g, '_')}_economy.json`
        : frameworkTarget === 'qbcore'
        ? 'jobs.lua'
        : 'config.lua';
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredJobs = jobs.filter((j) => {
    if (jobFilter === 'legal') return j.type === 'legal';
    if (jobFilter === 'illegal') return j.type === 'illegal';
    return true;
  });

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between space-y-5">
      <div>
        {/* Navigation Tabs Header */}
        <div className="pb-4 border-b border-zinc-800 mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('anchors')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                activeTab === 'anchors'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">1. Anchors</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                activeTab === 'jobs'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">2. Jobs ({jobs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sinks')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                activeTab === 'sinks'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">3. Sinks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                activeTab === 'export'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">4. Export</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ECONOMIC ANCHORS & TARGETS */}
        {activeTab === 'anchors' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-white">Baseline Economic Anchors</h4>
                <p className="text-xs text-zinc-400">
                  Set progression milestones to automatically calculate balanced job wages.
                </p>
              </div>

              <button
                type="button"
                onClick={onAutoRecalculateWages}
                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-rose-600/10 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Auto-Balance Wages</span>
              </button>
            </div>

            {/* Target Supercar Grind Hours (Core Driver) */}
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-rose-300">Target Supercar Play-Hours:</span>
                <span className="font-mono text-white text-sm bg-rose-500/20 px-2 py-0.5 rounded-lg">
                  {anchors.targetSupercarHours} Hours
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={anchors.targetSupercarHours}
                onChange={(e) => updateAnchor('targetSupercarHours', Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-rose-200/80 mt-1">
                At {anchors.targetSupercarHours} hrs, average legal wage targets ~
                <strong className="text-white">
                  ${Math.round(anchors.midTierSupercarCost / anchors.targetSupercarHours).toLocaleString()}/hr
                </strong>.
              </p>
            </div>

            {/* Price Anchors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mid-Tier Supercar Price */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Mid-Tier Supercar Cost</span>
                  <span className="text-rose-400 font-mono">${anchors.midTierSupercarCost.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="1000000"
                  step="10000"
                  value={anchors.midTierSupercarCost}
                  onChange={(e) => updateAnchor('midTierSupercarCost', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Starter Apartment Cost */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Starter Apartment Cost</span>
                  <span className="text-rose-400 font-mono">${anchors.starterApartmentCost.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="2500"
                  value={anchors.starterApartmentCost}
                  onChange={(e) => updateAnchor('starterApartmentCost', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Starter Vehicle Cost */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Starter Vehicle Price</span>
                  <span className="text-rose-400 font-mono">${(anchors.starterVehicleCost || 18000).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="80000"
                  step="1000"
                  value={anchors.starterVehicleCost || 18000}
                  onChange={(e) => updateAnchor('starterVehicleCost', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Luxury Mansion Cost */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Luxury Mansion / Penthouse</span>
                  <span className="text-rose-400 font-mono">${(anchors.luxuryMansionCost || 1400000).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="300000"
                  max="4000000"
                  step="50000"
                  value={anchors.luxuryMansionCost || 1400000}
                  onChange={(e) => updateAnchor('luxuryMansionCost', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Base Food Cost */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Burger & Water Price</span>
                  <span className="text-rose-400 font-mono">${anchors.baseFoodCost}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={anchors.baseFoodCost}
                  onChange={(e) => updateAnchor('baseFoodCost', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Handgun Cost */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Pistol & Ammo Cost</span>
                  <span className="text-rose-400 font-mono">${(anchors.handgunCost || 3200).toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="250"
                  value={anchors.handgunCost || 3200}
                  onChange={(e) => updateAnchor('handgunCost', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JOBS & RISK MULTIPLIERS */}
        {activeTab === 'jobs' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-white">Job Salaries & Risk Modifiers</h4>
                <p className="text-xs text-zinc-400">
                  Balance civil legal wages against criminal heist payoffs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setJobFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                      jobFilter === 'all' ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All ({jobs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobFilter('legal')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                      jobFilter === 'legal' ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Legal
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobFilter('illegal')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                      jobFilter === 'illegal' ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Illegal
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddJobOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md shadow-rose-600/20 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Job</span>
                </button>
              </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredJobs.map((job) => {
                const isLegal = job.type === 'legal';
                return (
                  <div
                    key={job.id}
                    className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono ${
                            isLegal
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {job.type}
                        </span>
                        <span className="text-xs font-bold text-white">{job.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-rose-400">
                          ${job.hourlyPayout.toLocaleString()}/hr
                        </span>
                        {jobs.length > 3 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-zinc-500 hover:text-rose-400 transition cursor-pointer p-1"
                            title="Remove Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                          <span>Hourly Payout</span>
                          <span className="font-mono text-zinc-200">
                            ~${Math.round(job.hourlyPayout / 12)} / 5min tick
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2000"
                          max="80000"
                          step="500"
                          value={job.hourlyPayout}
                          onChange={(e) => updateJobPayout(job.id, Number(e.target.value))}
                          className="w-full accent-rose-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                          <span>Risk / Danger Multiplier</span>
                          <span className="font-mono text-cyan-400 font-bold">{job.riskLevel.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="3.5"
                          step="0.1"
                          value={job.riskLevel}
                          onChange={(e) => updateJobRisk(job.id, Number(e.target.value))}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: MONEY SINKS & TAXES */}
        {activeTab === 'sinks' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-sm font-black text-white">Money Sinks & Inflation Drains</h4>
              <p className="text-xs text-zinc-400">
                Configure taxation, upkeep, medical bills, and illegal money laundering fees.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Daily Property Tax */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Daily Property Tax Rate</span>
                  <span className="text-rose-400 font-mono">{sinks.propertyTaxDailyPercent.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={sinks.propertyTaxDailyPercent}
                  onChange={(e) => updateSink('propertyTaxDailyPercent', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Dirty Money Laundering Tax */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Dirty Money Launder Cut</span>
                  <span className="text-rose-400 font-mono">{sinks.dirtyMoneyLaunderTaxPercent}% Tax</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="1"
                  value={sinks.dirtyMoneyLaunderTaxPercent}
                  onChange={(e) => updateSink('dirtyMoneyLaunderTaxPercent', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Hospital Revive Bill */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Hospital Medical Bill</span>
                  <span className="text-rose-400 font-mono">${sinks.hospitalBill}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={sinks.hospitalBill}
                  onChange={(e) => updateSink('hospitalBill', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Vehicle Impound Fee */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Vehicle Impound Fee</span>
                  <span className="text-rose-400 font-mono">${sinks.vehicleImpoundFee}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={sinks.vehicleImpoundFee}
                  onChange={(e) => updateSink('vehicleImpoundFee', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Server Active Population */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Active Server Players</span>
                  <span className="text-rose-400 font-mono">{serverParams.activePlayersCount} Players</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="256"
                  step="8"
                  value={serverParams.activePlayersCount}
                  onChange={(e) => updateServerParam('activePlayersCount', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Average Daily Play Hours */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-zinc-300">Daily Average Playtime</span>
                  <span className="text-rose-400 font-mono">{serverParams.averageDailyPlayHours} hrs/day</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.5"
                  value={serverParams.averageDailyPlayHours}
                  onChange={(e) => updateServerParam('averageDailyPlayHours', Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONFIGURATION EXPORT */}
        {activeTab === 'export' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-white">Export Server Config</h4>
                <p className="text-xs text-zinc-400">
                  Select your target FiveM framework to generate ready-to-use configuration files.
                </p>
              </div>

              {/* Framework Selector Pills */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                {(['qbcore', 'esx', 'qbx', 'custom_json'] as const).map((fw) => (
                  <button
                    key={fw}
                    type="button"
                    onClick={() => setFrameworkTarget(fw)}
                    className={`px-3 py-1 rounded-lg font-bold uppercase tracking-wider cursor-pointer transition ${
                      frameworkTarget === fw
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {fw === 'custom_json' ? 'JSON' : fw}
                  </button>
                ))}
              </div>
            </div>

            {/* Server Name input */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Server Display Name
              </label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="e.g. Vice City Underground RP"
                className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            {/* Live Code Box */}
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs font-mono">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-rose-400" />
                  {frameworkTarget === 'custom_json'
                    ? 'economy_config.json'
                    : frameworkTarget === 'qbcore'
                    ? 'qb-core/shared/jobs.lua'
                    : frameworkTarget === 'qbx'
                    ? 'qbx_core/config/jobs.lua'
                    : 'es_extended/config.jobs.lua'}
                </span>
                <span className="text-[10px] text-rose-400 uppercase font-bold">{frameworkTarget} FORMAT</span>
              </div>

              <pre className="p-4 text-xs font-mono text-zinc-300 max-h-72 overflow-y-auto leading-relaxed select-all">
                {generatedCode}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Exporter Action Buttons Bar */}
      <div className="pt-4 mt-5 border-t border-zinc-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Target Framework:</span>
          <span className="text-rose-400 font-bold uppercase px-2.5 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20">{frameworkTarget}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          <button
            type="button"
            onClick={handleCopyCode}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              copiedCode
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60'
            }`}
          >
            {copiedCode ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Copy Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadFile}
            className="w-full px-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Download File</span>
          </button>
        </div>
      </div>

      {/* Add Custom Job Modal */}
      {isAddJobOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-black text-white mb-3">Add Custom Roleplay Job</h3>
            <form onSubmit={handleAddJob} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Job Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Armored Heist Driver, Nightclub DJ"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Job Type</label>
                  <select
                    value={newJobType}
                    onChange={(e) => setNewJobType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="legal">Legal Job</option>
                    <option value="illegal">Illegal / Heist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Category</label>
                  <select
                    value={newJobCategory}
                    onChange={(e) => setNewJobCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="law_enforcement">Law Enforcement</option>
                    <option value="medical">Medical</option>
                    <option value="services">Services</option>
                    <option value="logistics">Logistics</option>
                    <option value="crime">Street Crime</option>
                    <option value="heist">Major Heist</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                  <span>Hourly Payout Target</span>
                  <span className="text-rose-400 font-mono">${newJobPayout.toLocaleString()}/hr</span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="60000"
                  step="1000"
                  value={newJobPayout}
                  onChange={(e) => setNewJobPayout(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                  <span>Risk Multiplier</span>
                  <span className="text-cyan-400 font-mono">{newJobRisk.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={newJobRisk}
                  onChange={(e) => setNewJobRisk(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddJobOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-rose-600/20"
                >
                  Add to Economy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
