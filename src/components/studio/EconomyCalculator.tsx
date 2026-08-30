import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Download,
  BarChart3,
  ShieldAlert,
  Sparkles,
  Info,
  RefreshCw,
  Zap,
  Building,
  Wrench,
  Flame,
  FileCode2,
  Copy,
  Check,
  Upload,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { runEconomySimulation, EconomySimInput } from '../../lib/server-suite-engine';
import { exportLuaConfig, exportJsonConfig } from '../../lib/economy-engine';

interface EconomyCalculatorProps {
  serverId?: string;
  serverName?: string;
  onSaveConfig?: (config: EconomySimInput) => void;
}

export const EconomyCalculator: React.FC<EconomyCalculatorProps> = ({
  serverId = 'default-server',
  serverName = 'Vice City RP Server',
  onSaveConfig
}) => {
  // Input Sliders State
  const [legalPay, setLegalPay] = useState<number>(12500);
  const [illegalPay, setIllegalPay] = useState<number>(24000);
  const [dailyTaxRate, setDailyTaxRate] = useState<number>(5.5);
  const [vehicleRepairCost, setVehicleRepairCost] = useState<number>(750);
  const [dailyPropertyTax, setDailyPropertyTax] = useState<number>(1200);
  const [playerCount, setPlayerCount] = useState<number>(64);
  const [initialCash, setInitialCash] = useState<number>(2500000);

  // Export State
  const [selectedFramework, setSelectedFramework] = useState<'qbcore' | 'esx' | 'qbx'>('qbcore');
  const [copiedLua, setCopiedLua] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);

  // CSV Validation row interface
  interface CSVValidationRow {
    key: string;
    label: string;
    value: number;
    originalKey: string;
    status: 'valid' | 'warning' | 'error';
    message: string;
  }

  // CSV Import State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [unimportedRows, setUnimportedRows] = useState<CSVValidationRow[] | null>(null);

  const downloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Parameter,Value,Description\n"
      + "legalPay,12500,Average legal hourly income\n"
      + "illegalPay,24000,Average illegal hourly income\n"
      + "dailyTaxRate,5.5,Daily tax rate percentage\n"
      + "vehicleRepairCost,750,Average vehicle repair fee\n"
      + "dailyPropertyTax,1200,Daily property tax fee\n"
      + "playerCount,64,Active daily players\n"
      + "initialCash,2500000,Initial total cash supply\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "economy_parameters_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setImportError('Failed to read file contents.');
        setUnimportedRows(null);
        return;
      }

      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        setImportError('CSV file must contain at least a header row and a value row.');
        setUnimportedRows(null);
        return;
      }

      let parsed: { [key: string]: number } = {};
      let isKeyValue = false;

      // Clean cells function to remove outer quotes or leading/trailing spaces
      const cleanCell = (cell: string) => {
        return cell.replace(/^["']|["']$/g, '').trim();
      };

      // Detect if Format is Key-Value or Tabular/Row-Headers
      const firstLineCells = lines[0].split(',').map(cleanCell);
      const isParamHeader = firstLineCells.some(cell => {
        const c = cell.toLowerCase();
        return c === 'parameter' || c === 'key' || c === 'setting' || c === 'variable';
      });

      if (isParamHeader || firstLineCells.length === 2 || (firstLineCells.length === 3 && firstLineCells[2].toLowerCase() === 'description')) {
        isKeyValue = true;
      }

      if (isKeyValue) {
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cells = line.split(',');
          if (cells.length >= 2) {
            const key = cleanCell(cells[0]).toLowerCase();
            const rawVal = cleanCell(cells[1]).replace(/[^0-9.-]/g, '');
            const val = parseFloat(rawVal);
            if (!isNaN(val)) {
              parsed[key] = val;
            }
          }
        }
      } else {
        // Tabular Headers format
        const headers = lines[0].split(',').map(h => cleanCell(h).toLowerCase().replace(/[^a-z0-9_]/g, ''));
        const valuesLine = lines[1].trim();
        if (valuesLine) {
          const values = valuesLine.split(',').map(v => {
            const raw = cleanCell(v).replace(/[^0-9.-]/g, '');
            return parseFloat(raw);
          });
          headers.forEach((header, index) => {
            if (index < values.length && !isNaN(values[index])) {
              parsed[header] = values[index];
            }
          });
        }
      }

      // Map parsed values to our state setters
      const updateMap: { [key: string]: { label: string; setter: (val: number) => void } } = {
        legalpay: { label: 'Avg Legal Hourly Pay', setter: setLegalPay },
        avglegalpay: { label: 'Avg Legal Hourly Pay', setter: setLegalPay },
        avghourlylegalincome: { label: 'Avg Legal Hourly Pay', setter: setLegalPay },
        legal_pay: { label: 'Avg Legal Hourly Pay', setter: setLegalPay },
        
        illegalpay: { label: 'Avg Illegal Hourly Pay', setter: setIllegalPay },
        avgillegalpay: { label: 'Avg Illegal Hourly Pay', setter: setIllegalPay },
        avghourlyillegalincome: { label: 'Avg Illegal Hourly Pay', setter: setIllegalPay },
        illegal_pay: { label: 'Avg Illegal Hourly Pay', setter: setIllegalPay },
        
        dailytaxrate: { label: 'Daily Tax Rate', setter: setDailyTaxRate },
        taxrate: { label: 'Daily Tax Rate', setter: setDailyTaxRate },
        tax_rate: { label: 'Daily Tax Rate', setter: setDailyTaxRate },
        
        vehiclerepaircost: { label: 'Avg Vehicle Repair Fee', setter: setVehicleRepairCost },
        vehiclerepairfee: { label: 'Avg Vehicle Repair Fee', setter: setVehicleRepairCost },
        repairfee: { label: 'Avg Vehicle Repair Fee', setter: setVehicleRepairCost },
        avgvehiclerepaircost: { label: 'Avg Vehicle Repair Fee', setter: setVehicleRepairCost },
        vehicle_repair_cost: { label: 'Avg Vehicle Repair Fee', setter: setVehicleRepairCost },
        
        dailypropertytax: { label: 'Daily Property Tax', setter: setDailyPropertyTax },
        propertytax: { label: 'Daily Property Tax', setter: setDailyPropertyTax },
        property_tax: { label: 'Daily Property Tax', setter: setDailyPropertyTax },
        
        playercount: { label: 'Active Daily Players', setter: setPlayerCount },
        activeplayercount: { label: 'Active Daily Players', setter: setPlayerCount },
        players: { label: 'Active Daily Players', setter: setPlayerCount },
        player_count: { label: 'Active Daily Players', setter: setPlayerCount },
        
        initialcash: { label: 'Initial Total Cash Supply', setter: setInitialCash },
        initialtotalcash: { label: 'Initial Total Cash Supply', setter: setInitialCash },
        startingcash: { label: 'Initial Total Cash Supply', setter: setInitialCash },
        initial_cash: { label: 'Initial Total Cash Supply', setter: setInitialCash },
      };

      const validationRows: CSVValidationRow[] = [];
      Object.keys(parsed).forEach(key => {
        const cleanKey = key.replace(/[^a-z0-9]/g, '');
        if (updateMap[cleanKey]) {
          const val = parsed[key];
          const label = updateMap[cleanKey].label;
          let status: 'valid' | 'warning' | 'error' = 'valid';
          let message = 'Value matches standard regulatory balance bounds.';

          // 1. Negative numbers check
          if (val < 0) {
            status = 'error';
            message = 'Negative monetary values are strictly prohibited as they violate double-entry server calculations.';
          } else {
            // 2. Specific key rules
            if (cleanKey.includes('legalpay') || cleanKey.includes('avghourlylegalincome')) {
              if (val === 0) {
                status = 'error';
                message = 'Wages cannot be zero. This prevents players from acquiring starting assets and blocks ROI calculations.';
              } else if (val < 100) {
                status = 'warning';
                message = 'Extremely low wages. Server taxes will easily drive players into bankruptcy within 48 hours.';
              } else if (val > 1000000) {
                status = 'warning';
                message = 'Unusually high wage. Will induce immediate hyperinflation and saturate the circulating supply.';
              }
            } else if (cleanKey.includes('illegalpay')) {
              if (val > 2000000) {
                status = 'warning';
                message = 'Extremely high criminal payout renders standard legal jobs fully obsolete.';
              }
              // Cross-reference with legal wage
              const legalVal = parsed['legalpay'] || parsed['avglegalpay'] || parsed['avghourlylegalincome'] || legalPay;
              if (val < legalVal) {
                status = 'warning';
                message = `Crime payout ($${val.toLocaleString()}) is below legal wage ($${legalVal.toLocaleString()}). Player ROI is negative given risk factors.`;
              }
            } else if (cleanKey.includes('taxrate') || cleanKey === 'dailytaxrate') {
              if (val > 100) {
                status = 'error';
                message = 'Tax rate cannot exceed 100% of player resources.';
              } else if (val > 15) {
                status = 'warning';
                message = 'Extremely high tax rate. Will result in rapid capital drain and absolute player bankruptcy.';
              }
            } else if (cleanKey.includes('repaircost') || cleanKey.includes('repairfee')) {
              if (val > 100000) {
                status = 'warning';
                message = 'Steep repair fees will heavily depress player vehicle ownership rates.';
              }
            } else if (cleanKey.includes('propertytax')) {
              if (val > 500000) {
                status = 'warning';
                message = 'High property taxes will discourage players from investing in permanent land housing assets.';
              }
            } else if (cleanKey.includes('playercount')) {
              if (val === 0) {
                status = 'error';
                message = 'Player count must be greater than zero to spawn mock simulation profiles.';
              } else if (val > 2048) {
                status = 'warning';
                message = 'Very high concurrent load might scale database latency.';
              }
            } else if (cleanKey.includes('initialcash')) {
              if (val === 0) {
                status = 'error';
                message = 'Initial cash supply must be non-zero to establish liquid reserve capital.';
              }
            }
          }

          validationRows.push({
            key: cleanKey,
            label,
            value: val,
            originalKey: key,
            status,
            message
          });
        }
      });

      if (validationRows.length > 0) {
        setUnimportedRows(validationRows);
        setImportError(null);
        setImportSuccess(null);
      } else {
        setImportError('No matching parameters found. Accepted parameters: legalPay, illegalPay, dailyTaxRate, vehicleRepairCost, dailyPropertyTax, playerCount, initialCash.');
        setUnimportedRows(null);
        setImportSuccess(null);
      }
    };
    reader.readAsText(file);
  };

  const applyImportedData = () => {
    if (!unimportedRows) return;
    
    const updateMap: { [key: string]: (val: number) => void } = {
      legalpay: setLegalPay,
      avglegalpay: setLegalPay,
      avghourlylegalincome: setLegalPay,
      legal_pay: setLegalPay,
      
      illegalpay: setIllegalPay,
      avgillegalpay: setIllegalPay,
      avghourlyillegalincome: setIllegalPay,
      illegal_pay: setIllegalPay,
      
      dailytaxrate: setDailyTaxRate,
      taxrate: setDailyTaxRate,
      tax_rate: setDailyTaxRate,
      
      vehiclerepaircost: setVehicleRepairCost,
      vehiclerepairfee: setVehicleRepairCost,
      repairfee: setVehicleRepairCost,
      avgvehiclerepaircost: setVehicleRepairCost,
      vehicle_repair_cost: setVehicleRepairCost,
      
      dailypropertytax: setDailyPropertyTax,
      propertytax: setDailyPropertyTax,
      property_tax: setDailyPropertyTax,
      
      playercount: setPlayerCount,
      activeplayercount: setPlayerCount,
      players: setPlayerCount,
      player_count: setPlayerCount,
      
      initialcash: setInitialCash,
      initialtotalcash: setInitialCash,
      startingcash: setInitialCash,
      initial_cash: setInitialCash,
    };

    const importedParams: string[] = [];
    unimportedRows.forEach(row => {
      if (row.status !== 'error') {
        const setter = updateMap[row.key];
        if (setter) {
          setter(row.value);
          importedParams.push(`${row.label} ($${row.value.toLocaleString()})`);
        }
      }
    });

    if (importedParams.length > 0) {
      setImportSuccess(`Imported parameters successfully: ${importedParams.join(', ')}`);
      setImportError(null);
    } else {
      setImportError('No parameters could be imported.');
    }
    setUnimportedRows(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        handleCsvUpload(file);
      } else {
        setImportError('Invalid file type. Please upload a .csv file.');
        setImportSuccess(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleCsvUpload(file);
    }
  };

  // Run Simulation
  const simInput: EconomySimInput = useMemo(() => ({
    avgHourlyLegalIncome: legalPay,
    avgHourlyIllegalIncome: illegalPay,
    dailyTaxRate,
    avgVehicleRepairCost: vehicleRepairCost,
    dailyPropertyTax,
    activePlayerCount: playerCount,
    initialTotalCash: initialCash
  }), [legalPay, illegalPay, dailyTaxRate, vehicleRepairCost, dailyPropertyTax, playerCount, initialCash]);

  const projection = useMemo(() => runEconomySimulation(simInput), [simInput]);

  // Handle Preset Selection
  const applyPreset = (presetKey: 'balanced' | 'hardcore' | 'casual') => {
    if (presetKey === 'balanced') {
      setLegalPay(12500);
      setIllegalPay(22000);
      setDailyTaxRate(5.5);
      setVehicleRepairCost(750);
      setDailyPropertyTax(1200);
      setPlayerCount(64);
      setInitialCash(2500000);
    } else if (presetKey === 'hardcore') {
      setLegalPay(6500);
      setIllegalPay(11000);
      setDailyTaxRate(8.5);
      setVehicleRepairCost(1500);
      setDailyPropertyTax(2500);
      setPlayerCount(64);
      setInitialCash(800000);
    } else if (presetKey === 'casual') {
      setLegalPay(28000);
      setIllegalPay(55000);
      setDailyTaxRate(2.5);
      setVehicleRepairCost(350);
      setDailyPropertyTax(500);
      setPlayerCount(100);
      setInitialCash(8000000);
    }
  };

  // Generate Lua Code
  const generatedLua = useMemo(() => {
    return exportLuaConfig(
      selectedFramework,
      [
        { id: 'police', name: 'LSPD Police Officer', category: 'law_enforcement', type: 'legal', riskLevel: 1.2, hourlyPayout: legalPay },
        { id: 'ems', name: 'EMS Medical Paramedic', category: 'medical', type: 'legal', riskLevel: 1.1, hourlyPayout: Math.round(legalPay * 0.95) },
        { id: 'mechanic', name: 'Bennys Custom Mechanic', category: 'services', type: 'legal', riskLevel: 1.0, hourlyPayout: Math.round(legalPay * 0.9) },
        { id: 'street_drugs', name: 'Corner Drug Hustle', category: 'crime', type: 'illegal', riskLevel: 1.5, hourlyPayout: Math.round(illegalPay * 0.8) },
        { id: 'bank_heist', name: 'Pacific Bank Heist', category: 'heist', type: 'illegal', riskLevel: 2.5, hourlyPayout: illegalPay }
      ],
      {
        baseFoodCost: 50,
        starterApartmentCost: 25000,
        midTierSupercarCost: 350000,
        targetSupercarHours: 30,
        dailyTaxesAndFees: dailyTaxRate
      },
      {
        propertyTaxDailyPercent: dailyTaxRate,
        vehicleImpoundFee: 850,
        vehicleRepairAverage: vehicleRepairCost,
        hospitalBill: 1200,
        foodWaterDailyCost: 250,
        dirtyMoneyLaunderTaxPercent: 18
      },
      serverName
    );
  }, [selectedFramework, legalPay, illegalPay, dailyTaxRate, vehicleRepairCost, serverName]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedLua);
    setCopiedLua(true);
    setTimeout(() => setCopiedLua(false), 2500);
  };

  // SVG Chart Calculation for 30-day projection
  const maxCashInChart = Math.max(...projection.moneyVelocityCurve30.map((d) => d.circulatingCash), 1000000);
  const chartHeight = 160;
  const chartWidth = 500;

  const chartPoints = projection.moneyVelocityCurve30.map((point, index) => {
    const x = (index / 29) * chartWidth;
    const y = chartHeight - (point.circulatingCash / maxCashInChart) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-8 bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> Dynamic Inflation & Money Velocity Simulator
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <span>Economy Simulator & Wage Balancer</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Sentinel Core
            </span>
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Simulate 30-day and 90-day currency velocity, evaluate hyperinflation risks, and generate ready-to-drop Lua configs for QBCore, ESX & QBX.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 shrink-0">
          <span className="text-xs font-bold text-zinc-400 px-2">Presets:</span>
          <button
            onClick={() => applyPreset('balanced')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-emerald-400 hover:bg-zinc-700 transition"
          >
            ⚖️ Balanced
          </button>
          <button
            onClick={() => applyPreset('hardcore')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-amber-400 hover:bg-zinc-700 transition"
          >
            💀 Hardcore
          </button>
          <button
            onClick={() => applyPreset('casual')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-rose-400 hover:bg-zinc-700 transition"
          >
            🔥 100k-or-Die
          </button>
        </div>
      </div>

      {/* Main Grid: Controls + Visual Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sliders & Controls */}
        <div className="lg:col-span-5 space-y-6 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" /> Economic Parameters & Sinks
          </h3>

          {/* 1. Legal Hourly Pay */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" /> Avg Legal Hourly Pay
              </span>
              <span className="text-cyan-400 font-mono">${legalPay.toLocaleString()}/hr</span>
            </div>
            <input
              type="range"
              min="2000"
              max="50000"
              step="500"
              value={legalPay}
              onChange={(e) => setLegalPay(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* 2. Illegal Hourly Pay */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> Avg Illegal Hourly Pay
              </span>
              <span className="text-rose-400 font-mono">${illegalPay.toLocaleString()}/hr</span>
            </div>
            <input
              type="range"
              min="5000"
              max="100000"
              step="1000"
              value={illegalPay}
              onChange={(e) => setIllegalPay(Number(e.target.value))}
              className="w-full accent-rose-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* 3. Daily Tax Rate */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Daily Tax Rate (%)
              </span>
              <span className="text-amber-400 font-mono">{dailyTaxRate.toFixed(1)}% / day</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="15.0"
              step="0.5"
              value={dailyTaxRate}
              onChange={(e) => setDailyTaxRate(Number(e.target.value))}
              className="w-full accent-amber-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* 4. Vehicle Repair Cost */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-purple-400" /> Avg Vehicle Repair Fee
              </span>
              <span className="text-purple-400 font-mono">${vehicleRepairCost.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={vehicleRepairCost}
              onChange={(e) => setVehicleRepairCost(Number(e.target.value))}
              className="w-full accent-purple-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* 5. Active Player Count */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-zinc-300">Active Daily Players</span>
              <span className="text-zinc-300 font-mono">{playerCount} players</span>
            </div>
            <input
              type="range"
              min="16"
              max="256"
              step="16"
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
              className="w-full accent-emerald-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {onSaveConfig && (
            <button
              onClick={() => onSaveConfig(simInput)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Economy Config to Server Profile
            </button>
          )}

          {/* CSV Import Section */}
          <div className="border-t border-zinc-800/80 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> CSV Economy Import
              </h4>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
              >
                <Download className="w-3 h-3" /> Get Template
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-file-input')?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/40'
              }`}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-300">
                Drag & drop economy CSV here, or <span className="text-emerald-400">browse</span>
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Supports parameter-value pairs or tabular headers
              </p>
            </div>

            {/* Validation Preview Panel */}
            {unimportedRows && (
              <div className="bg-zinc-950/80 rounded-2xl border border-zinc-800 p-4 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">CSV Validation Queue</span>
                  </div>
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 font-bold px-2 py-0.5 rounded-full">
                    {unimportedRows.length} Row{unimportedRows.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {unimportedRows.map((row, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                        row.status === 'error'
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : row.status === 'warning'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-zinc-900/40 border-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-zinc-200">{row.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white bg-zinc-950 px-1.5 py-0.5 rounded text-[11px] border border-zinc-800">
                            {row.key.includes('tax') ? `${row.value.toFixed(1)}%` : `$${row.value.toLocaleString()}`}
                          </span>
                          {row.status === 'error' ? (
                            <span className="text-xs text-rose-400 font-extrabold">✕</span>
                          ) : row.status === 'warning' ? (
                            <span className="text-xs text-amber-400 font-extrabold">⚠️</span>
                          ) : (
                            <span className="text-xs text-emerald-400 font-extrabold">✓</span>
                          )}
                        </div>
                      </div>
                      <p className={`text-[10px] leading-relaxed ${
                        row.status === 'error'
                          ? 'text-rose-300/90'
                          : row.status === 'warning'
                          ? 'text-amber-300/90'
                          : 'text-zinc-400'
                      }`}>
                        {row.message}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setUnimportedRows(null)}
                    className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-[11px] transition uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyImportedData}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition uppercase tracking-wider shadow-lg shadow-emerald-950/40"
                  >
                    Approve & Import
                  </button>
                </div>
              </div>
            )}

            {/* Error Feedback */}
            {importError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Success Feedback */}
            {importSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{importSuccess}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Curves & Diagnostic Analytics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-400 font-medium block">Inflation Score</span>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-black ${
                  projection.projectedInflationIndex > 70 ? 'text-rose-400' :
                  projection.projectedInflationIndex > 45 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {projection.projectedInflationIndex} / 100
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 block">
                {projection.riskAssessment.inflationLevel.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-400 font-medium block">30-Day Total Cash</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                ${(projection.day30CirculatingCash / 1000000).toFixed(2)}M
              </span>
              <span className="text-[10px] text-zinc-500 block">Circulating Supply</span>
            </div>

            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-xs text-zinc-400 font-medium block">Gini Wealth Index</span>
              <span className="text-xl font-black text-purple-400 font-mono">
                {projection.giniWealthInequality}
              </span>
              <span className="text-[10px] text-zinc-500 block">
                {projection.riskAssessment.hoarderThreat} Inequality Risk
              </span>
            </div>
          </div>

          {/* SVG Money Velocity Curve */}
          <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" /> 30-Day Money Supply Curve
              </span>
              <span className="text-xs font-mono text-zinc-400">Day 1 ➔ Day 30</span>
            </div>

            <div className="relative w-full bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-36 overflow-visible">
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area fill */}
                <polygon
                  points={`0,${chartHeight} ${chartPoints} ${chartWidth},${chartHeight}`}
                  fill="url(#curveGradient)"
                />
                {/* Stroke line */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  points={chartPoints}
                />
              </svg>

              <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2 border-t border-zinc-800 pt-1">
                <span>Start: ${(initialCash / 1000000).toFixed(1)}M</span>
                <span>Day 15: ${(projection.moneyVelocityCurve30[14].circulatingCash / 1000000).toFixed(1)}M</span>
                <span>Day 30: ${(projection.day30CirculatingCash / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>

          {/* Diagnostic Recommendations */}
          <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Sentinel Diagnostic Assessment
            </h4>
            <div className="space-y-2">
              {projection.riskAssessment.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/50">
                  <span className="shrink-0 mt-0.5">{rec.startsWith('🚨') ? '🚨' : rec.startsWith('⚠️') ? '⚠️' : '✅'}</span>
                  <span>{rec.replace(/^[🚨⚠️✅]\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lua Config Export Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-indigo-950/40 p-4 rounded-2xl border border-purple-500/30">
            <div>
              <span className="text-xs font-bold text-white block">Ready to deploy to server?</span>
              <span className="text-[11px] text-zinc-400">Export tuned Lua config for QBCore, ESX Legacy, or QBX Core.</span>
            </div>
            <button
              onClick={() => setShowCodeModal(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-purple-950/50"
            >
              <FileCode2 className="w-4 h-4" /> Export Lua Config
            </button>
          </div>
        </div>
      </div>

      {/* Lua Export Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-purple-400" /> Export Framework Config
                </h3>
                <p className="text-xs text-zinc-400">Drop into your server's shared jobs or config files.</p>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Framework Tabs */}
            <div className="flex gap-2 border-b border-zinc-800 pb-2">
              {(['qbcore', 'esx', 'qbx'] as const).map((fw) => (
                <button
                  key={fw}
                  onClick={() => setSelectedFramework(fw)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    selectedFramework === fw
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {fw === 'qbcore' ? 'QBCore' : fw === 'esx' ? 'ESX Legacy' : 'QBX (Qbox)'}
                </button>
              ))}
            </div>

            {/* Code Box */}
            <div className="relative bg-zinc-950 p-4 rounded-2xl border border-zinc-800 font-mono text-xs text-zinc-300 max-h-72 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{generatedLua}</pre>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
              >
                Close
              </button>
              <button
                onClick={handleCopyCode}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-purple-950"
              >
                {copiedLua ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLua ? 'Copied to Clipboard!' : 'Copy Lua Snippet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
