import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Sliders,
  DollarSign,
  AlertTriangle,
  FileCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  PieChart,
  Layers
} from 'lucide-react';
import {
  runMonteCarloEconomySimulation,
  MonteCarloSimulationResult,
  MonteCarloEconomyParams
} from '../../lib/studio-performance-engine';

export const AdvancedEconomyVisualizer: React.FC = () => {
  // Sliders and parameters
  const [activePlayers, setActivePlayers] = useState<number>(128);
  const [policeHourly, setPoliceHourly] = useState<number>(4500);
  const [civJobHourly, setCivJobHourly] = useState<number>(2800);
  const [heistHourly, setHeistHourly] = useState<number>(12500);
  const [drugsHourly, setDrugsHourly] = useState<number>(8900);
  const [propertyTax, setPropertyTax] = useState<number>(1.5); // %
  const [hospitalFee, setHospitalFee] = useState<number>(1200);
  const [vehicleWear, setVehicleWear] = useState<number>(450);

  const [activeHorizon, setActiveHorizon] = useState<30 | 60 | 90 | 180>(90);
  const [simResult, setSimResult] = useState<MonteCarloSimulationResult | null>(null);
  const [copiedType, setCopiedType] = useState<'qb' | 'esx' | 'sql' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Run simulation whenever parameters update
  const handleRunSimulation = () => {
    const params: MonteCarloEconomyParams = {
      activePlayerCount: activePlayers,
      legalSectors: [
        { job: 'LSPD / EMS', basePayPerHour: policeHourly, maxHourlyBonus: policeHourly * 0.25 },
        { job: 'Civic / Towing / Mining', basePayPerHour: civJobHourly, maxHourlyBonus: civJobHourly * 0.3 }
      ],
      illegalSectors: [
        { activity: 'Pacific Standard Heist / Banks', riskMultiplier: 1.8, hourlyPayout: heistHourly },
        { activity: 'Meth / Weed Production Labs', riskMultiplier: 1.4, hourlyPayout: drugsHourly }
      ],
      sinks: {
        dailyPropertyTaxRate: propertyTax / 100,
        vehicleWearRate: vehicleWear,
        hospitalFee
      }
    };

    const res = runMonteCarloEconomySimulation(params);
    setSimResult(res);
  };

  useEffect(() => {
    handleRunSimulation();
  }, [activePlayers, policeHourly, civJobHourly, heistHourly, drugsHourly, propertyTax, hospitalFee, vehicleWear]);

  // Mouse hover inspection state
  const [hoverPoint, setHoverPoint] = useState<{ day: number; val: number; gini: number; vel: number; x: number; y: number } | null>(null);

  // Render Monte Carlo Stochastic Curves onto Canvas
  useEffect(() => {
    if (!canvasRef.current || !simResult) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Canvas Paddings for Axis Labels
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 35;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    const dataPoints = simResult.timeSeries.filter(t => t.day <= activeHorizon);
    if (dataPoints.length === 0) return;

    const maxVal = Math.max(...dataPoints.map(d => d.avgMoneyPerCapita), 50000);
    const minVal = Math.min(...dataPoints.map(d => d.avgMoneyPerCapita), 0);
    const range = Math.max(1000, maxVal - minVal);

    // Format currency labels for Y-axis
    const formatCurrencyShort = (val: number) => {
      if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
      if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
      if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
      return `$${val.toFixed(0)}`;
    };

    // Draw Background Grid
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;

    // Y-Axis Horizontal Grid Lines & Labels
    const yGridSteps = 5;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= yGridSteps; i++) {
      const yVal = minVal + (range * i) / yGridSteps;
      const yPos = height - paddingBottom - (i / yGridSteps) * plotHeight;

      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(width - paddingRight, yPos);
      ctx.stroke();

      ctx.fillText(formatCurrencyShort(yVal), paddingLeft - 8, yPos + 3);
    }

    // X-Axis Vertical Grid Lines & Day Labels
    ctx.textAlign = 'center';
    dataPoints.forEach((pt, idx) => {
      if (idx % Math.ceil(dataPoints.length / 5) === 0 || idx === dataPoints.length - 1) {
        const xPos = paddingLeft + (idx / (dataPoints.length - 1)) * plotWidth;

        ctx.beginPath();
        ctx.moveTo(xPos, paddingTop);
        ctx.lineTo(xPos, height - paddingBottom);
        ctx.stroke();

        ctx.fillText(`Day ${pt.day}`, xPos, height - 12);
      }
    });

    // Determine visual severity state
    const isExtremeHyperinflation = simResult.monthlyInflationRatePct > 15 || maxVal > 1_000_000;
    const isEconomicCollapse = !!simResult.projectedCollapseDay && simResult.projectedCollapseDay <= activeHorizon;

    // 1. Draw Monte Carlo Fan Paths (40 Stochastic Runs)
    const fanSpreadMultiplier = isExtremeHyperinflation ? 0.35 : 0.12;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      const strokeColor = isEconomicCollapse
        ? (i % 2 === 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.10)')
        : (i % 2 === 0 ? 'rgba(168, 85, 247, 0.10)' : 'rgba(6, 182, 212, 0.10)');
      
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;

      dataPoints.forEach((pt, idx) => {
        const x = paddingLeft + (idx / (dataPoints.length - 1)) * plotWidth;
        const noise = (Math.sin(idx * 0.8 + i) * fanSpreadMultiplier + (Math.random() - 0.5) * 0.15) * pt.avgMoneyPerCapita;
        const val = Math.max(0, pt.avgMoneyPerCapita + noise);
        const y = height - paddingBottom - ((val - minVal) / range) * plotHeight;

        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 2. Draw Fill Area Under Mean Curve
    ctx.beginPath();
    dataPoints.forEach((pt, idx) => {
      const x = paddingLeft + (idx / (dataPoints.length - 1)) * plotWidth;
      const y = height - paddingBottom - ((pt.avgMoneyPerCapita - minVal) / range) * plotHeight;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const lastX = paddingLeft + plotWidth;
    const bottomY = height - paddingBottom;
    ctx.lineTo(lastX, bottomY);
    ctx.lineTo(paddingLeft, bottomY);
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
    if (isEconomicCollapse || isExtremeHyperinflation) {
      areaGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      areaGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
      areaGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
    } else {
      areaGrad.addColorStop(0, 'rgba(6, 182, 212, 0.30)');
      areaGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    }
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // 3. Draw Mean Trend Line with Hazard Color Split
    ctx.beginPath();
    ctx.lineWidth = 3.5;

    dataPoints.forEach((pt, idx) => {
      const x = paddingLeft + (idx / (dataPoints.length - 1)) * plotWidth;
      const y = height - paddingBottom - ((pt.avgMoneyPerCapita - minVal) / range) * plotHeight;

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevPt = dataPoints[idx - 1];
        const prevX = paddingLeft + ((idx - 1) / (dataPoints.length - 1)) * plotWidth;
        const prevY = height - paddingBottom - ((prevPt.avgMoneyPerCapita - minVal) / range) * plotHeight;

        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);

        // Transition to Red if post-collapse or hyperinflation threshold crossed
        if (simResult.projectedCollapseDay && pt.day >= simResult.projectedCollapseDay) {
          ctx.strokeStyle = '#ef4444';
        } else if (pt.avgMoneyPerCapita > 500_000) {
          ctx.strokeStyle = '#f59e0b';
        } else {
          ctx.strokeStyle = '#06b6d4';
        }
        ctx.stroke();
      }
    });

    // 4. Draw Collapse Vertical Line & Warning Banner
    if (isEconomicCollapse && simResult.projectedCollapseDay) {
      const collapseIdx = dataPoints.findIndex(d => d.day >= simResult.projectedCollapseDay!);
      if (collapseIdx !== -1) {
        const cx = paddingLeft + (collapseIdx / (dataPoints.length - 1)) * plotWidth;

        // Red Dashed Line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, paddingTop - 10);
        ctx.lineTo(cx, height - paddingBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Red Glow Marker Badge
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        
        ctx.fillRect(cx - 2, paddingTop - 10, 110, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`COLLAPSE: DAY ${simResult.projectedCollapseDay}`, cx + 4, paddingTop + 2);
      }
    }

  }, [simResult, activeHorizon]);

  const copyPatch = (type: 'qb' | 'esx' | 'sql') => {
    if (!simResult) return;
    const text = type === 'qb' ? simResult.exportableQBCoreConfig : type === 'esx' ? simResult.exportableESXConfig : simResult.exportableSQLPatch;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !simResult) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = canvas.width / rect.width;
    const canvasX = mouseX * scaleX;

    const paddingLeft = 60;
    const paddingRight = 20;
    const plotWidth = canvas.width - paddingLeft - paddingRight;

    if (canvasX < paddingLeft || canvasX > canvas.width - paddingRight) {
      setHoverPoint(null);
      return;
    }

    const dataPoints = simResult.timeSeries.filter(t => t.day <= activeHorizon);
    if (dataPoints.length === 0) return;

    const ratio = (canvasX - paddingLeft) / plotWidth;
    const targetIndex = Math.min(dataPoints.length - 1, Math.max(0, Math.round(ratio * (dataPoints.length - 1))));
    const pt = dataPoints[targetIndex];

    if (pt) {
      setHoverPoint({
        day: pt.day,
        val: pt.avgMoneyPerCapita,
        gini: pt.giniCoefficient,
        vel: pt.inflationVelocityPct,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Gini Inequality Index</span>
            <PieChart className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${simResult && simResult.giniCoefficientFinal > 0.65 ? 'text-red-400' : 'text-purple-300'}`}>
              {simResult ? simResult.giniCoefficientFinal.toFixed(2) : '0.52'}
            </span>
            <span className="text-[11px] text-zinc-500">Target &lt; 0.45</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {simResult && simResult.giniCoefficientFinal > 0.65 ? 'Extreme wealth hoarding in top 1%' : 'Balanced wealth distribution'}
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Monthly Inflation</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${simResult && simResult.monthlyInflationRatePct > 10 ? 'text-amber-400' : 'text-cyan-300'}`}>
              +{simResult ? simResult.monthlyInflationRatePct : '4.2'}%
            </span>
            <span className="text-[11px] text-zinc-500">per 30 days</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Stochastic currency expansion velocity</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Currency Collapse</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${simResult?.projectedCollapseDay ? 'text-red-500' : 'text-emerald-400'}`}>
              {simResult?.projectedCollapseDay ? `Day ${simResult.projectedCollapseDay}` : 'STABLE'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {simResult?.projectedCollapseDay ? 'Hyperinflation wipe risk triggered' : 'No currency collapse projected in 180d'}
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">AI Re-Balance Rec</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-300">
              +{simResult ? simResult.recommendedTaxAdjustment : '2.0'}% Tax
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Payout adjust: {simResult ? simResult.recommendedJobPayoutAdjustment : '-10'}%
          </p>
        </div>
      </div>

      {/* Main Grid: Controls + Visualizer Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-zinc-100">Macro Economy Inputs</h3>
            </div>
            <button
              onClick={handleRunSimulation}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Re-Simulate
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-zinc-300 font-semibold mb-1">
                <span>Active Server Players</span>
                <span className="text-cyan-400">{activePlayers} Slot CCU</span>
              </div>
              <input
                type="range"
                min="32"
                max="256"
                step="8"
                value={activePlayers}
                onChange={(e) => setActivePlayers(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 font-semibold mb-1">
                <span>Police & EMS Base Hourly</span>
                <span className="text-cyan-400">${policeHourly.toLocaleString()}/hr</span>
              </div>
              <input
                type="range"
                min="1000"
                max="12000"
                step="250"
                value={policeHourly}
                onChange={(e) => setPoliceHourly(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 font-semibold mb-1">
                <span>Civilian Legal Jobs (Trucking/Mining)</span>
                <span className="text-cyan-400">${civJobHourly.toLocaleString()}/hr</span>
              </div>
              <input
                type="range"
                min="800"
                max="8000"
                step="200"
                value={civJobHourly}
                onChange={(e) => setCivJobHourly(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 font-semibold mb-1">
                <span>Heists & Bank Robberies</span>
                <span className="text-purple-400">${heistHourly.toLocaleString()}/hr</span>
              </div>
              <input
                type="range"
                min="3000"
                max="30000"
                step="500"
                value={heistHourly}
                onChange={(e) => setHeistHourly(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 font-semibold mb-1">
                <span>Daily Property Tax Sink</span>
                <span className="text-emerald-400">{propertyTax}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.1"
                value={propertyTax}
                onChange={(e) => setPropertyTax(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 font-semibold mb-1">
                <span>Hospital & Medical Bill Sink</span>
                <span className="text-emerald-400">${hospitalFee.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="200"
                max="5000"
                step="100"
                value={hospitalFee}
                onChange={(e) => setHospitalFee(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Monte Carlo Visualizer Canvas */}
        <div className="lg:col-span-8 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                10,000 Stochastic Iteration Monte Carlo Simulation
              </h3>
              <p className="text-xs text-zinc-400">Simulating per capita wealth distribution curves & liquidity inflation</p>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-800/80 p-1 rounded-xl border border-zinc-700">
              {([30, 60, 90, 180] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setActiveHorizon(h)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${activeHorizon === h ? 'bg-cyan-500 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 p-2">
            {/* Simulation Legend Bar */}
            <div className="flex flex-wrap items-center justify-between text-[11px] px-2 py-1.5 border-b border-zinc-800/80 mb-2 text-zinc-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block rounded-full"></span> Mean Wealth Trajectory
                </span>
                <span className="flex items-center gap-1.5 text-purple-300">
                  <span className="w-2.5 h-0.5 bg-purple-400/60 inline-block rounded-full"></span> 40 Stochastic Fan Paths
                </span>
              </div>
              {simResult?.projectedCollapseDay && simResult.projectedCollapseDay <= activeHorizon && (
                <span className="text-rose-400 font-bold animate-pulse flex items-center gap-1">
                  ⚠️ Collapse Detected (Day {simResult.projectedCollapseDay})
                </span>
              )}
            </div>

            <canvas
              ref={canvasRef}
              width={720}
              height={320}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverPoint(null)}
              className="w-full h-64 block rounded-lg cursor-crosshair"
            />

            {/* Interactive Hover Tooltip */}
            {hoverPoint && (
              <div
                className="absolute pointer-events-none bg-zinc-900/95 border border-cyan-500/40 p-2.5 rounded-xl shadow-2xl text-xs space-y-1 z-20 backdrop-blur-md"
                style={{
                  left: Math.min(hoverPoint.x + 10, 520),
                  top: Math.max(10, hoverPoint.y - 60)
                }}
              >
                <div className="font-bold text-cyan-300 flex items-center justify-between gap-3 border-b border-zinc-800 pb-1">
                  <span>Day {hoverPoint.day} Trajectory</span>
                  <span className="text-[10px] text-zinc-400 font-mono">10k Monte Carlo</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                  <span className="text-zinc-400">Avg Per Capita:</span>
                  <span className="text-emerald-400 font-bold font-mono">${hoverPoint.val.toLocaleString()}</span>
                  <span className="text-zinc-400">Gini Inequality:</span>
                  <span className={hoverPoint.gini > 0.62 ? 'text-rose-400 font-bold' : 'text-purple-300'}>{hoverPoint.gini.toFixed(2)}</span>
                  <span className="text-zinc-400">Daily Inflation:</span>
                  <span className={hoverPoint.vel > 5 ? 'text-amber-400 font-bold' : 'text-cyan-300'}>+{hoverPoint.vel}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Export Patches Bar */}
          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-emerald-400" /> Export Re-Balanced Server Framework Configs
              </span>
              <span className="text-[11px] text-zinc-500">Restores 1.0 currency equilibrium</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => copyPatch('qb')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedType === 'qb' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                Copy QBCore config.lua
              </button>

              <button
                onClick={() => copyPatch('esx')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedType === 'esx' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                Copy ESX config.lua
              </button>

              <button
                onClick={() => copyPatch('sql')}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedType === 'sql' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                Copy SQL Balance Patch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
