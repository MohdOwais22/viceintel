'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Home,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Zap,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Sparkles,
  Layers
} from 'lucide-react';
import { EconomicAnchors, ServerSimParameters, JobConfig, EconomyCalculationResults } from '../../lib/economy-engine';

interface EconomicStabilityLineChartProps {
  anchors: EconomicAnchors;
  serverParams: ServerSimParameters;
  jobs: JobConfig[];
  results: EconomyCalculationResults;
}

export const EconomicStabilityLineChart: React.FC<EconomicStabilityLineChartProps> = ({
  anchors,
  serverParams,
  jobs,
  results
}) => {
  // Mode controls
  const [pricingModel, setPricingModel] = useState<'dynamic' | 'fixed'>('dynamic');
  const [selectedJobView, setSelectedJobView] = useState<'legal' | 'blended' | 'illegal'>('legal');
  const [elasticity, setElasticity] = useState<number>(0.5); // 0.1 (low inflation passthrough) to 1.0 (full real estate inflation passthrough)

  const { simulation30Days, inflationRiskGrade, inflationIndexScore } = results;

  // Calculate legal, illegal, and blended wages from current active jobs
  const { avgLegalWage, avgIllegalWage, blendedWage, starterDeliveryWage } = useMemo(() => {
    const legal = jobs.filter((j) => j.type === 'legal');
    const illegal = jobs.filter((j) => j.type === 'illegal');

    const legalAvg = legal.length > 0
      ? legal.reduce((sum, j) => sum + j.hourlyPayout, 0) / legal.length
      : results.baseHourlyLegalTarget;

    const illegalAvg = illegal.length > 0
      ? illegal.reduce((sum, j) => sum + j.hourlyPayout, 0) / illegal.length
      : results.baseHourlyIllegalTarget;

    const blended = (legalAvg * serverParams.legalPlayerRatio) + (illegalAvg * (1 - serverParams.legalPlayerRatio));

    const delivery = jobs.find((j) => j.id === 'delivery')?.hourlyPayout || legalAvg;

    return {
      avgLegalWage: Math.round(legalAvg),
      avgIllegalWage: Math.round(illegalAvg),
      blendedWage: Math.round(blended),
      starterDeliveryWage: Math.round(delivery)
    };
  }, [jobs, results.baseHourlyLegalTarget, results.baseHourlyIllegalTarget, serverParams.legalPlayerRatio]);

  const activeGrindWage = useMemo(() => {
    if (selectedJobView === 'illegal') return avgIllegalWage;
    if (selectedJobView === 'blended') return blendedWage;
    return avgLegalWage;
  }, [selectedJobView, avgIllegalWage, blendedWage, avgLegalWage]);

  // Format currency helper
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
    return `$${Math.round(n).toLocaleString()}`;
  };

  // Generate 30-Day Day-by-Day Projection Data
  const chartData = useMemo(() => {
    const baselineCost = anchors.starterApartmentCost || 25000;
    const initialCash = Math.max(1000, serverParams.initialEconomySeed || 500000);
    const baselineGrindHours = baselineCost / Math.max(1, activeGrindWage);

    return simulation30Days.map((dayData) => {
      const { day, cumulativeCashInEconomy, totalMoneyCreated, totalMoneyDestroyed, averagePlayerNetWorth } = dayData;
      
      // Calculate liquidity expansion ratio relative to day 0 seed
      const liquidityGrowthRatio = cumulativeCashInEconomy / initialCash;
      
      // Calculate dynamic inflation price impact for starter apartment
      // When liquidity rises, real estate prices surge proportionally to elasticity
      const inflationDriftRatio = Math.max(-0.5, (liquidityGrowthRatio - 1) * elasticity);
      
      const dynamicCost = Math.max(
        Math.round(baselineCost * 0.4),
        Math.round(baselineCost * (1 + inflationDriftRatio))
      );

      const effectiveCost = pricingModel === 'dynamic' ? dynamicCost : baselineCost;
      const hoursToAfford = Number((effectiveCost / Math.max(1, activeGrindWage)).toFixed(1));
      const baselineHours = Number(baselineGrindHours.toFixed(1));
      const hoursVariance = Number((hoursToAfford - baselineHours).toFixed(1));

      // Calculate purchasing power index (100 is baseline on Day 1)
      const purchasingPower = Math.round((baselineCost / effectiveCost) * 100);

      // Estimated accumulated starter player savings grinding 3 hours/day minus daily survival costs
      const dailyLivingCost = 150; // food/water baseline
      const dailyNetSavings = Math.max(0, (activeGrindWage * serverParams.averageDailyPlayHours) - dailyLivingCost);
      const accumulatedSavings = Math.round(dailyNetSavings * day);

      return {
        day: `Day ${day}`,
        dayNumber: day,
        projectedApartmentCost: effectiveCost,
        baselineApartmentCost: baselineCost,
        dynamicApartmentCost: dynamicCost,
        hoursToAfford,
        baselineHours,
        hoursVariance,
        purchasingPower,
        cumulativeCashInEconomy,
        averagePlayerNetWorth,
        accumulatedSavings,
        totalCreated: totalMoneyCreated,
        totalDestroyed: totalMoneyDestroyed
      };
    });
  }, [
    simulation30Days,
    anchors.starterApartmentCost,
    serverParams.initialEconomySeed,
    serverParams.averageDailyPlayHours,
    elasticity,
    pricingModel,
    activeGrindWage
  ]);

  // Telemetry summary metrics at Day 30
  const day30Data = chartData[chartData.length - 1];
  const day1Data = chartData[0];
  const priceChangeAmount = day30Data.projectedApartmentCost - anchors.starterApartmentCost;
  const priceChangePercent = ((priceChangeAmount / anchors.starterApartmentCost) * 100).toFixed(1);
  const hoursChangeAmount = Number((day30Data.hoursToAfford - day1Data.hoursToAfford).toFixed(1));

  const isInflating = priceChangeAmount > 0;
  const isSevere = Math.abs(Number(priceChangePercent)) > 35;

  return (
    <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header with Title and Control Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-rose-400">
            <Home className="w-3.5 h-3.5" />
            <span>30-Day Real Estate Stability Matrix (Recharts)</span>
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>Starter Apartment Inflation Impact</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
              Anchor: {fmt(anchors.starterApartmentCost)}
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Simulates how server-wide liquidity expansion from configured job payouts shifts Starter Apartment pricing, player purchasing power, and grinding time required to achieve homeownership over 30 days.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">30-Day Drift</span>
            <span
              className={`text-base font-black font-mono flex items-center justify-end gap-1 ${
                isInflating ? 'text-rose-400' : priceChangeAmount < 0 ? 'text-cyan-400' : 'text-emerald-400'
              }`}
            >
              {isInflating ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {priceChangeAmount >= 0 ? `+${priceChangePercent}%` : `${priceChangePercent}%`}
            </span>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-500 block uppercase">Grind Shift</span>
            <span className="text-base font-black font-mono text-white">
              {hoursChangeAmount >= 0 ? `+${hoursChangeAmount}h` : `${hoursChangeAmount}h`}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/80 text-xs">
        {/* Pricing Model Selector */}
        <div className="sm:col-span-1 lg:col-span-4 min-w-0">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">Market Pricing Model</span>
          </label>
          <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setPricingModel('dynamic')}
              className={`py-1.5 px-1.5 rounded-lg font-bold transition text-center cursor-pointer flex flex-col items-center justify-center min-w-0 ${
                pricingModel === 'dynamic'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="text-[11px] font-bold truncate">Dynamic</span>
              <span className="text-[9px] opacity-80 truncate font-mono">Float</span>
            </button>
            <button
              type="button"
              onClick={() => setPricingModel('fixed')}
              className={`py-1.5 px-1.5 rounded-lg font-bold transition text-center cursor-pointer flex flex-col items-center justify-center min-w-0 ${
                pricingModel === 'fixed'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="text-[11px] font-bold truncate">Static</span>
              <span className="text-[9px] opacity-80 truncate font-mono">Fixed $25k</span>
            </button>
          </div>
        </div>

        {/* Wage Basis Selector */}
        <div className="sm:col-span-1 lg:col-span-5 min-w-0">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">Grind Wage Basis</span>
          </label>
          <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedJobView('legal')}
              className={`py-1.5 px-1 rounded-lg font-bold transition text-center cursor-pointer flex flex-col items-center justify-center min-w-0 ${
                selectedJobView === 'legal'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="text-[11px] font-bold truncate">Legal</span>
              <span className="text-[9px] font-mono opacity-90 truncate">{fmt(avgLegalWage)}/h</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedJobView('blended')}
              className={`py-1.5 px-1 rounded-lg font-bold transition text-center cursor-pointer flex flex-col items-center justify-center min-w-0 ${
                selectedJobView === 'blended'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="text-[11px] font-bold truncate">Average</span>
              <span className="text-[9px] font-mono opacity-90 truncate">{fmt(blendedWage)}/h</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedJobView('illegal')}
              className={`py-1.5 px-1 rounded-lg font-bold transition text-center cursor-pointer flex flex-col items-center justify-center min-w-0 ${
                selectedJobView === 'illegal'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="text-[11px] font-bold truncate">Crime</span>
              <span className="text-[9px] font-mono opacity-90 truncate">{fmt(avgIllegalWage)}/h</span>
            </button>
          </div>
        </div>

        {/* Real Estate Market Elasticity Slider */}
        <div className="sm:col-span-2 lg:col-span-3 min-w-0">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5 truncate">
              <Sliders className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate">Elasticity</span>
            </span>
            <span className="font-mono text-rose-400 shrink-0">{(elasticity * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={elasticity}
              onChange={(e) => setElasticity(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <span className="text-[10px] text-zinc-500 font-mono shrink-0">
              {elasticity >= 0.7 ? 'High' : elasticity >= 0.4 ? 'Norm' : 'Low'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="w-full h-80 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-2 sm:p-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />

            <XAxis
              dataKey="day"
              stroke="#71717a"
              tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#3f3f46' }}
              interval={4}
            />

            {/* Left Y-Axis for Apartment Cost ($) */}
            <YAxis
              yAxisId="left"
              stroke="#f43f5e"
              tick={{ fill: '#f43f5e', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => fmt(v)}
              domain={['auto', 'auto']}
            />

            {/* Right Y-Axis for Grind Hours (h) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#06b6d4"
              tick={{ fill: '#06b6d4', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v) => `${v}h`}
              domain={[0, 'auto']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-zinc-950/95 border border-zinc-700/80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl text-xs font-mono space-y-2 min-w-[240px]">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                        <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-rose-400" />
                          {data.day} Projection
                        </span>
                        <span className="text-zinc-500 text-[10px]">
                          Power: {data.purchasingPower}%
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-rose-400">
                          <span>Starter Apartment:</span>
                          <span className="font-bold text-white">{fmt(data.projectedApartmentCost)}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-400">
                          <span>Baseline Target:</span>
                          <span>{fmt(data.baselineApartmentCost)}</span>
                        </div>
                        <div className="flex items-center justify-between text-cyan-400">
                          <span>Grind Time Required:</span>
                          <span className="font-bold">{data.hoursToAfford} Hours</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-400">
                          <span>Est. Player Savings:</span>
                          <span>{fmt(data.accumulatedSavings)}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-500 pt-1 border-t border-zinc-800 text-[10px]">
                          <span>Circulating Cash:</span>
                          <span>{fmt(data.cumulativeCashInEconomy)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'monospace' }}
              iconType="circle"
            />

            {/* Baseline Target Reference Line */}
            <ReferenceLine
              yAxisId="left"
              y={anchors.starterApartmentCost}
              stroke="#71717a"
              strokeDasharray="4 4"
              label={{
                value: `Anchor Base: ${fmt(anchors.starterApartmentCost)}`,
                fill: '#a1a1aa',
                fontSize: 10,
                position: 'insideTopLeft'
              }}
            />

            {/* Projected Apartment Cost Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="projectedApartmentCost"
              name="Projected Apartment Cost ($)"
              stroke="#ec4899"
              strokeWidth={3}
              dot={{ r: 2, fill: '#ec4899' }}
              activeDot={{ r: 6, fill: '#ffffff', stroke: '#ec4899', strokeWidth: 2 }}
            />

            {/* Grind Hours Required Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="hoursToAfford"
              name="Grind Hours to Purchase (hrs)"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 5, fill: '#06b6d4' }}
            />

            {/* Accumulated Player Savings Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="accumulatedSavings"
              name="Avg Player 3h/Day Savings ($)"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Analytical Insights & Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Milestone Indicator */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase text-[10px]">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Time-to-Own Milestone</span>
          </div>
          <div className="text-white font-black text-lg">
            Day 1: {day1Data.hoursToAfford}h → Day 30: {day30Data.hoursToAfford}h
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            At current payout rates ({fmt(activeGrindWage)}/hr), an average starter player acquires their initial apartment by Day {Math.min(30, Math.ceil(anchors.starterApartmentCost / ((activeGrindWage * serverParams.averageDailyPlayHours) - 150)))} of active play.
          </p>
        </div>

        {/* Inflation Impact Analysis */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase text-[10px]">
            <TrendingUp className={`w-3.5 h-3.5 ${isInflating ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span>Real Estate Price Pressure</span>
          </div>
          <div className={`font-black text-lg ${isInflating ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isInflating ? `+${fmt(priceChangeAmount)} Inflation Surge` : 'Equilibrium Maintained'}
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            {isSevere
              ? 'Warning: Excessive cash minting causes apartment prices to rapidly detach from starter wages within 30 days.'
              : 'Real purchasing power remains accessible for newcomers throughout the full monthly cycle.'}
          </p>
        </div>

        {/* Economic Stabilizer Suggestion */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase text-[10px]">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Balancing Prescription</span>
          </div>
          <div className="text-white font-bold text-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isInflating ? 'Tighten Money Sinks or Cap Heists' : 'Healthy Asset Progression'}
            </span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            {isInflating
              ? 'Increase property tax or lower illegal heist payouts to protect starter property affordability.'
              : 'Current wage targets align with anchor asset pacing. Newcomers won\'t be priced out by veteran players.'}
          </p>
        </div>
      </div>
    </div>
  );
};
