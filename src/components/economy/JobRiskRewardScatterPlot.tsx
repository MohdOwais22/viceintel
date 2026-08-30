'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Sliders,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Info,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Sparkles,
  Flame,
  Search
} from 'lucide-react';
import { JobConfig, EconomicAnchors } from '../../lib/economy-engine';

interface JobRiskRewardScatterPlotProps {
  jobs: JobConfig[];
  baseHourlyLegalTarget?: number;
  baseHourlyIllegalTarget?: number;
  anchors?: EconomicAnchors;
  onUpdateJobPayout?: (jobId: string, newPayout: number) => void;
  onUpdateJobRisk?: (jobId: string, newRisk: number) => void;
}

export const JobRiskRewardScatterPlot: React.FC<JobRiskRewardScatterPlotProps> = ({
  jobs,
  baseHourlyLegalTarget = 11000,
  baseHourlyIllegalTarget = 24000,
  anchors,
  onUpdateJobPayout,
  onUpdateJobRisk
}) => {
  const [filterType, setFilterType] = useState<'all' | 'legal' | 'illegal' | 'outliers'>('all');
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [tolerancePercent, setTolerancePercent] = useState<number>(25); // +/- 25% considered balanced
  const [showZones, setShowZones] = useState<boolean>(true);

  // Currency Formatter
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
    return `$${Math.round(n).toLocaleString()}`;
  };

  // Theoretical Fair Payout Curve Function based on Risk Level (1.0 -> 3.0)
  // At risk 1.0 (Safe), expected payout is approx baseHourlyLegalTarget
  // At risk 2.0, expected payout is approx baseHourlyIllegalTarget (~2.2x)
  // At risk 3.0 (Apex Heist), expected payout is approx baseHourlyIllegalTarget * 1.6 (~3.5x)
  const calculateBenchmarkPayout = (risk: number) => {
    // Linear / mild exponential risk-reward baseline
    const normalizedRisk = Math.max(1.0, Math.min(3.0, risk));
    const riskFactor = Math.pow(normalizedRisk, 1.25);
    return Math.round(baseHourlyLegalTarget * riskFactor);
  };

  // Analyze each job for risk vs payout balance & outliers
  const evaluatedJobs = useMemo(() => {
    return jobs.map((job) => {
      const benchmark = calculateBenchmarkPayout(job.riskLevel);
      const diffDollars = job.hourlyPayout - benchmark;
      const diffPercent = Math.round((diffDollars / benchmark) * 100);

      // Status categorization
      let status: 'balanced' | 'overpaid_exploit' | 'underpaid_dead_content' = 'balanced';
      if (diffPercent > tolerancePercent) {
        status = 'overpaid_exploit';
      } else if (diffPercent < -tolerancePercent) {
        status = 'underpaid_dead_content';
      }

      return {
        ...job,
        benchmark,
        diffDollars,
        diffPercent,
        status
      };
    });
  }, [jobs, baseHourlyLegalTarget, tolerancePercent]);

  // Filtered jobs
  const displayJobs = useMemo(() => {
    if (filterType === 'legal') return evaluatedJobs.filter((j) => j.type === 'legal');
    if (filterType === 'illegal') return evaluatedJobs.filter((j) => j.type === 'illegal');
    if (filterType === 'outliers') return evaluatedJobs.filter((j) => j.status !== 'balanced');
    return evaluatedJobs;
  }, [evaluatedJobs, filterType]);

  const outliersCount = evaluatedJobs.filter((j) => j.status !== 'balanced').length;
  const overpaidCount = evaluatedJobs.filter((j) => j.status === 'overpaid_exploit').length;
  const underpaidCount = evaluatedJobs.filter((j) => j.status === 'underpaid_dead_content').length;

  // SVG Coordinate Bounds
  const minRisk = 0.8;
  const maxRisk = 3.2;
  const maxPayout = Math.max(45000, ...jobs.map((j) => j.hourlyPayout * 1.2));

  const svgWidth = 650;
  const svgHeight = 320;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 45;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Convert (risk, payout) to SVG (x, y)
  const getCoords = (risk: number, payout: number) => {
    const clampedRisk = Math.max(minRisk, Math.min(maxRisk, risk));
    const clampedPayout = Math.max(0, Math.min(maxPayout, payout));

    const x = padLeft + ((clampedRisk - minRisk) / (maxRisk - minRisk)) * chartW;
    const y = padTop + chartH - (clampedPayout / maxPayout) * chartH;
    return { x, y };
  };

  // Generate Ideal Balance Center Curve & Tolerance Corridor Area
  const corridorPoints = useMemo(() => {
    const steps = 24;
    const centerPts: { x: number; y: number }[] = [];
    const upperPts: { x: number; y: number }[] = [];
    const lowerPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const r = minRisk + (i / steps) * (maxRisk - minRisk);
      const bench = calculateBenchmarkPayout(r);
      const upper = bench * (1 + tolerancePercent / 100);
      const lower = bench * (1 - tolerancePercent / 100);

      centerPts.push(getCoords(r, bench));
      upperPts.push(getCoords(r, upper));
      lowerPts.push(getCoords(r, lower));
    }

    const centerPath = `M ${centerPts.map((p) => `${p.x},${p.y}`).join(' L ')}`;

    // Build shaded corridor polygon
    const corridorPath = `M ${upperPts.map((p) => `${p.x},${p.y}`).join(' L ')} L ${lowerPts
      .reverse()
      .map((p) => `${p.x},${p.y}`)
      .join(' L ')} Z`;

    return { centerPath, corridorPath };
  }, [minRisk, maxRisk, maxPayout, tolerancePercent, baseHourlyLegalTarget]);

  // Selected or Hovered Job for Detail Drawer
  const activeJob =
    evaluatedJobs.find((j) => j.id === (selectedJobId || hoveredJobId)) ||
    (outliersCount > 0 ? evaluatedJobs.find((j) => j.status !== 'balanced') : evaluatedJobs[0]);

  return (
    <div id="job-risk-reward-scatter-plot" className="bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-5">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-rose-400">
            <Scale className="w-3.5 h-3.5" />
            <span>Economic Parity & Risk Matrix</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 flex items-center gap-2">
            <span>Job Risk Level vs. Hourly Payout</span>
          </h3>
        </div>

        {/* Outlier Alert Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          {outliersCount > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{outliersCount} Unbalanced Job{outliersCount > 1 ? 's' : ''} Detected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>All Jobs Balanced within Corridor</span>
            </div>
          )}
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-start gap-2.5 text-xs text-zinc-300">
        <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-white">How to read this plot: </span>
          The shaded green diagonal represents the <strong className="text-emerald-300 font-mono">Fair Market Corridor</strong>.
          Jobs plotted in the <span className="text-amber-400 font-bold">Top-Left</span> yield excessive profits with minimal risk (exploit risk), while jobs in the <span className="text-rose-400 font-bold">Bottom-Right</span> carry high penalties or jail risks without fair compensation (dead content).
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              filterType === 'all' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Jobs ({evaluatedJobs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('legal')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              filterType === 'legal' ? 'bg-cyan-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            Legal Only ({evaluatedJobs.filter((j) => j.type === 'legal').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('illegal')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              filterType === 'illegal' ? 'bg-rose-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            Illegal Only ({evaluatedJobs.filter((j) => j.type === 'illegal').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('outliers')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
              filterType === 'outliers' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Outliers ({outliersCount})
          </button>
        </div>

        {/* Corridor Width & Zone Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px] cursor-pointer">
            <span>Corridor Width:</span>
            <select
              value={tolerancePercent}
              onChange={(e) => setTolerancePercent(Number(e.target.value))}
              aria-label="Corridor Width tolerance percentage"
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-0.5 text-white font-bold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value={15}>±15% (Strict)</option>
              <option value={25}>±25% (Standard)</option>
              <option value={35}>±35% (Lenient)</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => setShowZones(!showZones)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
              showZones
                ? 'bg-zinc-800 text-white border-zinc-700'
                : 'bg-zinc-950 text-zinc-500 border-zinc-800'
            }`}
          >
            {showZones ? 'Hide Quadrant Zones' : 'Show Quadrant Zones'}
          </button>
        </div>
      </div>

      {/* SVG SCATTER PLOT CANVAS */}
      <div className="relative bg-zinc-950 border border-zinc-800/90 rounded-2xl p-2 sm:p-4 overflow-hidden">
        {/* Quadrant Overlays (Soft Backgrounds) */}
        {showZones && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 opacity-35">
            {/* Top Left: Exploit Zone */}
            <div className="border-r border-b border-dashed border-amber-500/20 bg-amber-500/5 p-3 flex flex-col justify-start">
              <span className="text-[10px] font-black font-mono uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> EXPLOIT / OVERPAID ZONE (High Pay, Low Risk)
              </span>
            </div>
            {/* Top Right: Apex High Stakes */}
            <div className="border-b border-dashed border-amber-500/20 bg-amber-500/5 p-3 flex flex-col justify-start items-end">
              <span className="text-[10px] font-black font-mono uppercase text-amber-300 tracking-wider">
                APEX HIGH STAKES (High Risk, High Pay)
              </span>
            </div>
            {/* Bottom Left: Baseline Safe */}
            <div className="border-r border-dashed border-cyan-500/20 bg-cyan-500/5 p-3 flex flex-col justify-end">
              <span className="text-[10px] font-black font-mono uppercase text-cyan-400 tracking-wider">
                CIVILIAN BASELINE (Low Risk, Safe Pay)
              </span>
            </div>
            {/* Bottom Right: Dead Content Zone */}
            <div className="bg-rose-500/5 p-3 flex flex-col justify-end items-end">
              <span className="text-[10px] font-black font-mono uppercase text-rose-400 tracking-wider flex items-center gap-1">
                DEAD CONTENT / UNDERPAID (High Risk, Poor Pay) <ShieldAlert className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Grid Line Pattern */}
            <pattern id="scatter-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
            {/* Gradient for Balanced Corridor */}
            <linearGradient id="corridorGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.15" />
            </linearGradient>
            {/* Glow filters */}
            <filter id="glow-legal" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.6" />
            </filter>
            <filter id="glow-illegal" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f43f5e" floodOpacity="0.6" />
            </filter>
            <filter id="glow-outlier" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.8" />
            </filter>
          </defs>

          <rect x={padLeft} y={padTop} width={chartW} height={chartH} fill="url(#scatter-grid)" />

          {/* Y-Axis Horizontal Grid Lines & Labels */}
          {[0, 10000, 20000, 30000, 40000].map((payoutVal) => {
            if (payoutVal > maxPayout) return null;
            const { y } = getCoords(1.0, payoutVal);
            return (
              <g key={payoutVal}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartW}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {fmt(payoutVal)}/h
                </text>
              </g>
            );
          })}

          {/* X-Axis Vertical Risk Grid Lines & Labels */}
          {[1.0, 1.5, 2.0, 2.5, 3.0].map((riskVal) => {
            const { x } = getCoords(riskVal, 0);
            return (
              <g key={riskVal}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartH}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={padTop + chartH + 16}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {riskVal.toFixed(1)}x
                </text>
                <text
                  x={x}
                  y={padTop + chartH + 28}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize="8"
                >
                  {riskVal === 1.0
                    ? 'Safe / Legal'
                    : riskVal === 1.5
                    ? 'Low Hazard'
                    : riskVal === 2.0
                    ? 'Medium Risk'
                    : riskVal === 2.5
                    ? 'High Heist'
                    : 'Max Danger'}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padLeft + chartW / 2}
            y={svgHeight - 4}
            textAnchor="middle"
            fill="#d4d4d8"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="1"
          >
            JOB RISK MULTIPLIER (ARREST / FAILURE CHANCE) →
          </text>

          <text
            x={-padTop - chartH / 2}
            y="16"
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#d4d4d8"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="1"
          >
            HOURLY PAYOUT ($/HR) →
          </text>

          {/* SHADED FAIR EQUILIBRIUM CORRIDOR */}
          <path d={corridorPoints.corridorPath} fill="url(#corridorGradient)" />

          {/* BENCHMARK IDEAL CURVE LINE */}
          <path
            d={corridorPoints.centerPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.8"
          />

          {/* JOB DATA POINTS */}
          {displayJobs.map((job) => {
            const { x, y } = getCoords(job.riskLevel, job.hourlyPayout);
            const isHovered = hoveredJobId === job.id;
            const isSelected = selectedJobId === job.id;
            const isOutlier = job.status !== 'balanced';

            // Point styling
            let pointColor = '#06b6d4'; // Legal Cyan
            if (job.type === 'illegal') {
              pointColor = job.category === 'heist' ? '#c084fc' : '#f43f5e';
            }
            if (isOutlier) {
              pointColor = job.status === 'overpaid_exploit' ? '#f59e0b' : '#fb7185';
            }

            return (
              <g
                key={job.id}
                className="cursor-pointer group"
                onClick={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)}
                onMouseEnter={() => setHoveredJobId(job.id)}
                onMouseLeave={() => setHoveredJobId(null)}
              >
                {/* Outlier Alert Pulse Halo */}
                {isOutlier && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered || isSelected ? 18 : 13}
                    fill={job.status === 'overpaid_exploit' ? '#f59e0b' : '#f43f5e'}
                    opacity="0.25"
                    className="animate-pulse"
                  />
                )}

                {/* Focus Ring on Selected/Hovered */}
                {(isHovered || isSelected) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={12}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Main Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered || isSelected ? 7 : isOutlier ? 6 : 5}
                  fill={pointColor}
                  stroke="#ffffff"
                  strokeWidth={isHovered || isSelected ? 2 : 1}
                  filter={isOutlier ? 'url(#glow-outlier)' : job.type === 'legal' ? 'url(#glow-legal)' : 'url(#glow-illegal)'}
                  className="transition-all duration-200"
                />

                {/* Job Short Label Tag */}
                <text
                  x={x + 9}
                  y={y + 3}
                  fill={isHovered || isSelected ? '#ffffff' : '#d4d4d8'}
                  fontSize={isHovered || isSelected ? '10' : '8.5'}
                  fontWeight={isHovered || isSelected || isOutlier ? 'bold' : 'normal'}
                  className="pointer-events-none select-none transition-all drop-shadow-md"
                >
                  {job.name.split('/')[0].split('(')[0].trim()}
                  {isOutlier && (job.status === 'overpaid_exploit' ? ' ⚠️' : ' 🔻')}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Selection Interactive Floating Tooltip */}
        {activeJob && (
          <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs font-mono">
            {/* Left: Job Identity & Payout Info */}
            <div className="md:col-span-7 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      activeJob.type === 'legal' ? 'bg-cyan-400' : 'bg-rose-400'
                    }`}
                  />
                  <span className="font-bold text-white text-sm">{activeJob.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    activeJob.status === 'balanced'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : activeJob.status === 'overpaid_exploit'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {activeJob.status === 'balanced'
                    ? '✅ Balanced'
                    : activeJob.status === 'overpaid_exploit'
                    ? '⚠️ Exploit Risk (+Pay)'
                    : '🔻 Underpaid Risk'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[9px]">CURRENT PAYOUT</span>
                  <span className="text-rose-400 font-bold text-xs">{fmt(activeJob.hourlyPayout)}/hr</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[9px]">RISK FACTOR</span>
                  <span className="text-cyan-400 font-bold text-xs">{activeJob.riskLevel.toFixed(1)}x Risk</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[9px]">BENCHMARK TARGET</span>
                  <span className="text-emerald-400 font-bold text-xs">{fmt(activeJob.benchmark)}/hr</span>
                </div>
              </div>

              {activeJob.diffPercent !== 0 && (
                <div className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                  <span className="text-zinc-500">Parity Delta:</span>
                  <span
                    className={`font-bold ${
                      activeJob.diffPercent > 0 ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {activeJob.diffPercent > 0 ? `+${activeJob.diffPercent}%` : `${activeJob.diffPercent}%`} (${activeJob.diffDollars > 0 ? `+${fmt(activeJob.diffDollars)}` : fmt(activeJob.diffDollars)})
                  </span>
                  <span className="text-zinc-500 text-[10px]">vs. fair equilibrium curve</span>
                </div>
              )}
            </div>

            {/* Right: Quick In-Place Balancing Controls */}
            <div className="md:col-span-5 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-bold text-white flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  <span>Quick Balance Adjust</span>
                </span>
                {onUpdateJobPayout && (
                  <button
                    type="button"
                    onClick={() => onUpdateJobPayout(activeJob.id, activeJob.benchmark)}
                    className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Snap to Fair ({fmt(activeJob.benchmark)})</span>
                  </button>
                )}
              </div>

              {/* Slider for Payout */}
              {onUpdateJobPayout && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Adjust Hourly Payout</span>
                    <span className="text-white font-bold">{fmt(activeJob.hourlyPayout)}</span>
                  </div>
                  <input
                    type="range"
                    min={4000}
                    max={50000}
                    step={250}
                    value={activeJob.hourlyPayout}
                    onChange={(e) => onUpdateJobPayout(activeJob.id, Number(e.target.value))}
                    aria-label={`Adjust hourly payout for ${activeJob.name}`}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              )}

              {/* Slider for Risk Level */}
              {onUpdateJobRisk && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Adjust Risk Level</span>
                    <span className="text-white font-bold">{activeJob.riskLevel.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={3.0}
                    step={0.1}
                    value={activeJob.riskLevel}
                    onChange={(e) => onUpdateJobRisk(activeJob.id, Number(e.target.value))}
                    aria-label={`Adjust risk level for ${activeJob.name}`}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Outliers Diagnostic Action Table (If any outliers detected) */}
      {outliersCount > 0 && (
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-xs">
                Detected Disproportionate Jobs ({outliersCount})
              </span>
            </div>
            {onUpdateJobPayout && (
              <button
                type="button"
                onClick={() => {
                  evaluatedJobs
                    .filter((j) => j.status !== 'balanced')
                    .forEach((j) => onUpdateJobPayout(j.id, j.benchmark));
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-xl transition cursor-pointer shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Snap All {outliersCount} Outliers to Fair Curve</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {evaluatedJobs
              .filter((j) => j.status !== 'balanced')
              .map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 hover:border-zinc-700 transition cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-white text-xs">{job.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Risk {job.riskLevel.toFixed(1)}x • Current: {fmt(job.hourlyPayout)}/hr • Fair: {fmt(job.benchmark)}/hr
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono ${
                      job.status === 'overpaid_exploit'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {job.diffPercent > 0 ? `+${job.diffPercent}%` : `${job.diffPercent}%`}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
