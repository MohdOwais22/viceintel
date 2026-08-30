'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  Home,
  ShieldCheck,
  Zap,
  Info,
  DollarSign,
  Flame,
  Scale,
  Activity,
  Layers
} from 'lucide-react';
import { EconomyCalculationResults, EconomicAnchors, ServerSimParameters, JobConfig } from '../../lib/economy-engine';
import { JobRiskRewardScatterPlot } from './JobRiskRewardScatterPlot';
import { EconomicStabilityLineChart } from './EconomicStabilityLineChart';

interface EconomySimulationChartProps {
  results: EconomyCalculationResults;
  anchors: EconomicAnchors;
  serverParams: ServerSimParameters;
  jobs?: JobConfig[];
  onUpdateJobPayout?: (jobId: string, newPayout: number) => void;
  onUpdateJobRisk?: (jobId: string, newRisk: number) => void;
}

export const EconomySimulationChart: React.FC<EconomySimulationChartProps> = ({
  results,
  anchors,
  serverParams,
  jobs = [],
  onUpdateJobPayout,
  onUpdateJobRisk
}) => {
  const [activeHoverDay, setActiveHoverDay] = useState<number | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'stability' | 'scatter' | 'liquidity' | 'pacing'>('stability');

  const {
    baseHourlyLegalTarget,
    baseHourlyIllegalTarget,
    simulation30Days,
    inflationRiskGrade,
    inflationIndexScore,
    dailySinkToCreationRatio,
    diagnosticAdvice,
    timeToAssets,
    total30DayMinted,
    total30DayDestroyed,
    total30DayNetLiquid
  } = results;

  // Format currency helper
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
    return `$${Math.round(n).toLocaleString()}`;
  };

  // Find max values for SVG scaling
  const maxDayCash = Math.max(...simulation30Days.map((d) => d.cumulativeCashInEconomy), 100000);
  const maxDayMinted = Math.max(...simulation30Days.map((d) => d.totalMoneyCreated), 10000);

  // SVG Chart Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padX = 40;
  const padY = 25;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padY * 2;

  // Generate SVG path for Cumulative Cash curve
  const cashPoints = simulation30Days.map((d, i) => {
    const x = padX + (i / (simulation30Days.length - 1)) * chartW;
    const y = padY + chartH - (d.cumulativeCashInEconomy / maxDayCash) * chartH;
    return `${x},${y}`;
  });
  const cashPathD = `M ${cashPoints.join(' L ')}`;
  const cashAreaD = `M ${padX},${padY + chartH} L ${cashPoints.join(' L ')} L ${padX + chartW},${padY + chartH} Z`;

  // Generate SVG path for Daily Minted
  const mintedPoints = simulation30Days.map((d, i) => {
    const x = padX + (i / (simulation30Days.length - 1)) * chartW;
    const y = padY + chartH - (d.totalMoneyCreated / (maxDayMinted * 1.3)) * chartH;
    return `${x},${y}`;
  });
  const mintedPathD = `M ${mintedPoints.join(' L ')}`;

  // Generate SVG path for Daily Sinks
  const sinkPoints = simulation30Days.map((d, i) => {
    const x = padX + (i / (simulation30Days.length - 1)) * chartW;
    const y = padY + chartH - (d.totalMoneyDestroyed / (maxDayMinted * 1.3)) * chartH;
    return `${x},${y}`;
  });
  const sinkPathD = `M ${sinkPoints.join(' L ')}`;

  const hoveredDayData = activeHoverDay !== null
    ? simulation30Days.find((d) => d.day === activeHoverDay) || simulation30Days[simulation30Days.length - 1]
    : simulation30Days[simulation30Days.length - 1];

  // Inflation Badge Config
  const gradeConfig = {
    EXCELLENT_STABILITY: {
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      icon: CheckCircle,
      title: 'Optimal Equilibrium',
      desc: 'Healthy 30-day longevity with balanced progression and money sinks.'
    },
    MILD_INFLATION: {
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      icon: AlertTriangle,
      title: 'Mild Inflation Risk',
      desc: 'Excess cash accumulates after Day 15. Consider tuning money sinks.'
    },
    HYPER_INFLATION_RISK: {
      color: 'text-rose-400 border-rose-500/50 bg-rose-500/10',
      icon: Flame,
      title: 'Severe Hyper-Inflation Danger',
      desc: 'Money creation outpaces sinks. Players will buy out luxury assets in <14 days.'
    },
    STAGNATION_RISK: {
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
      icon: Scale,
      title: 'Deflation & Stagnation Warning',
      desc: 'Sinks drain liquidity too aggressively. Starter players risk quitting.'
    }
  }[inflationRiskGrade];

  const GradeIcon = gradeConfig.icon;

  return (
    <div className="space-y-6">
      {/* Visualizer View Navigation Tabs */}
      <div className="bg-zinc-900/90 p-1.5 rounded-xl border border-zinc-800">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveChartTab('stability')}
            className={`px-2.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeChartTab === 'stability'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">1. Stability Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('scatter')}
            className={`px-2.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeChartTab === 'scatter'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">2. Risk vs Payout</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('liquidity')}
            className={`px-2.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeChartTab === 'liquidity'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">3. Liquidity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('pacing')}
            className={`px-2.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeChartTab === 'pacing'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">4. Asset Pacing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('all')}
            className={`col-span-2 sm:col-span-1 px-2.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeChartTab === 'all'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">All Views</span>
          </button>
        </div>
      </div>

      {/* 1. Inflation Health Header Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${gradeConfig.color}`}>
              <GradeIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Economic Stability Index
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${gradeConfig.color}`}>
                  {gradeConfig.title}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {inflationIndexScore}/100 Inflation Pressure
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-400">Daily Sink Ratio:</span>
            <span className={`font-bold ${dailySinkToCreationRatio >= 0.4 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(dailySinkToCreationRatio * 100).toFixed(0)}% Burned
            </span>
          </div>
        </div>

        {/* Diagnostic Recommendations */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-rose-400" />
            <span>Real-Time Diagnostic Feedback</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {diagnosticAdvice.map((advice, idx) => (
              <div
                key={idx}
                className="text-xs text-zinc-300 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 flex items-start gap-2"
              >
                <span className="text-rose-400 font-bold">•</span>
                <span>{advice}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 30-DAY STARTER APARTMENT INFLATION STABILITY CHART (RECHARTS) */}
      {(activeChartTab === 'all' || activeChartTab === 'stability') && (
        <EconomicStabilityLineChart
          anchors={anchors}
          serverParams={serverParams}
          jobs={jobs}
          results={results}
        />
      )}

      {/* 3. JOB RISK VS HOURLY PAYOUT SCATTER PLOT */}
      {(activeChartTab === 'all' || activeChartTab === 'scatter') && (
        <JobRiskRewardScatterPlot
          jobs={jobs}
          baseHourlyLegalTarget={baseHourlyLegalTarget}
          baseHourlyIllegalTarget={baseHourlyIllegalTarget}
          anchors={anchors}
          onUpdateJobPayout={onUpdateJobPayout}
          onUpdateJobRisk={onUpdateJobRisk}
        />
      )}

      {/* 3. 30-Day Simulated Money Flow Curve */}
      {(activeChartTab === 'all' || activeChartTab === 'liquidity') && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>30-Day Macro Simulation</span>
              </div>
              <h4 className="text-lg font-black text-white">Server Money Supply & Sink Projection</h4>
            </div>

            {/* Interactive Legend */}
            <div className="flex items-center gap-3 text-[11px] font-mono flex-wrap">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                Total Circulating Cash
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                Daily Minted
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" />
                Daily Sinks
              </span>
            </div>
          </div>

          {/* SVG Curve Canvas */}
          <div className="w-full relative bg-zinc-950/80 border border-zinc-800 rounded-xl p-2 sm:p-4 overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 sm:h-56 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="cashAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                const y = padY + chartH * (1 - ratio);
                return (
                  <g key={idx}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={padX + chartW}
                      y2={y}
                      stroke="#27272a"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padX - 8}
                      y={y + 3}
                      fill="#71717a"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {fmt(maxDayCash * ratio)}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill for Cash in Circulation */}
              <path d={cashAreaD} fill="url(#cashAreaGradient)" />

              {/* Curves */}
              <path d={cashPathD} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
              <path d={mintedPathD} fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="3 3" />
              <path d={sinkPathD} fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 2" />

              {/* Interactive Day Points */}
              {simulation30Days.map((d, i) => {
                const x = padX + (i / (simulation30Days.length - 1)) * chartW;
                const y = padY + chartH - (d.cumulativeCashInEconomy / maxDayCash) * chartH;
                const isHovered = activeHoverDay === d.day;

                return (
                  <g
                    key={d.day}
                    className="cursor-pointer group"
                    onMouseEnter={() => setActiveHoverDay(d.day)}
                    onTouchStart={() => setActiveHoverDay(d.day)}
                  >
                    {/* Invisible broad touch target */}
                    <rect
                      x={x - 8}
                      y={padY}
                      width={16}
                      height={chartH}
                      fill="transparent"
                    />
                    {isHovered && (
                      <line
                        x1={x}
                        y1={padY}
                        x2={x}
                        y2={padY + chartH}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 2.5}
                      className="transition-all"
                      fill={isHovered ? '#ffffff' : '#f43f5e'}
                      stroke="#f43f5e"
                      strokeWidth={isHovered ? 2 : 1}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hovered Day Telemetry Card */}
            {hoveredDayData && (
              <div className="mt-3 pt-3 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">SIMULATED DAY</span>
                  <span className="text-white font-bold">Day {hoveredDayData.day} / 30</span>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">TOTAL SERVER CASH</span>
                  <span className="text-rose-400 font-bold">{fmt(hoveredDayData.cumulativeCashInEconomy)}</span>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">DAILY MINTED / BURNED</span>
                  <span className="text-emerald-400 font-bold">+{fmt(hoveredDayData.totalMoneyCreated)}</span>
                  <span className="text-cyan-400 text-[10px] ml-1">(-{fmt(hoveredDayData.totalMoneyDestroyed)})</span>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">AVG NET WORTH / PLAYER</span>
                  <span className="text-cyan-400 font-bold">{fmt(hoveredDayData.averagePlayerNetWorth)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 30-Day Totals Banner */}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs font-mono">
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5">
              <span className="text-zinc-500 text-[10px] block">30-DAY MINTED</span>
              <span className="text-emerald-400 font-bold text-sm">{fmt(total30DayMinted)}</span>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5">
              <span className="text-zinc-500 text-[10px] block">30-DAY SINKS BURNED</span>
              <span className="text-cyan-400 font-bold text-sm">{fmt(total30DayDestroyed)}</span>
            </div>
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5">
              <span className="text-zinc-500 text-[10px] block">NET 30-DAY LIQUID SURPLUS</span>
              <span className="text-rose-400 font-bold text-sm">+{fmt(total30DayNetLiquid)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Time-to-Asset Progression Matrix */}
      {(activeChartTab === 'all' || activeChartTab === 'pacing') && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Pacing & Retention Matrix</span>
              </div>
              <h4 className="text-lg font-black text-white">Time Required to Earn Key Assets</h4>
            </div>
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline-block">
              Based on {serverParams.averageDailyPlayHours} hrs/day gaming
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(timeToAssets).map(([key, item]) => {
              const isSupercar = key === 'midTierSupercar';
              const progressRatio = Math.min(1, item.hours / Math.max(anchors.targetSupercarHours * 1.5, 50));

              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border transition ${
                    isSupercar
                      ? 'bg-rose-500/10 border-rose-500/30 shadow-lg shadow-rose-600/10'
                      : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      {key.includes('Vehicle') || key.includes('Supercar') ? (
                        <Car className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : key.includes('Apartment') || key.includes('Mansion') ? (
                        <Home className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-bold text-white">{item.label}</span>
                      <span className="text-zinc-500 font-mono text-[11px]">({fmt(item.cost)})</span>
                    </div>

                    <div className="text-right font-mono">
                      <span className={`font-bold ${isSupercar ? 'text-rose-400 text-sm' : 'text-zinc-200'}`}>
                        {item.hours} Hours
                      </span>
                      <span className="text-zinc-500 text-[11px] ml-1.5">({item.days} days)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSupercar
                          ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                      }`}
                      style={{ width: `${Math.max(4, progressRatio * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
