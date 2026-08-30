/**
 * GTA VI / FiveM RP Server Economy & Wage Balancer Engine
 * Multi-Framework (QBCore, ESX, QBX) Mathematical Simulation and Configuration Exporter
 */

export interface EconomicAnchors {
  baseFoodCost: number;             // e.g., $50 for basic burger & water
  starterApartmentCost: number;     // e.g., $25,000
  midTierSupercarCost: number;      // e.g., $350,000 (Pegassi Tempesta / Grotti Furia)
  targetSupercarHours: number;      // Target play-hours needed to buy supercar (e.g., 30 hrs)
  dailyTaxesAndFees: number;        // Tax sink percentage (e.g., 5%)
  starterVehicleCost?: number;      // e.g., $15,000 (Blista / Premier)
  luxuryMansionCost?: number;       // e.g., $1,500,000
  handgunCost?: number;             // e.g., $2,500
}

export interface JobConfig {
  id: string;
  name: string;
  category: 'law_enforcement' | 'medical' | 'services' | 'logistics' | 'crime' | 'heist' | 'crafting';
  type: 'legal' | 'illegal';
  riskLevel: number;               // 1.0 (Safe, Taxi) to 3.0 (High Risk, Pacific Standard Bank Heist)
  hourlyPayout: number;            // Auto-calculated or manual override
  baseSalaryPerTick?: number;      // e.g. $250 per 5 minutes for police
  cooldownMinutes?: number;        // Cooldown between heists/runs
  failureFine?: number;            // Penalty if arrested / downed
  description?: string;
}

export interface MoneySinkConfig {
  propertyTaxDailyPercent: number; // e.g. 1.5%
  vehicleImpoundFee: number;       // e.g. $750
  vehicleRepairAverage: number;    // e.g. $450
  hospitalBill: number;            // e.g. $1,200
  foodWaterDailyCost: number;      // e.g. $300
  dirtyMoneyLaunderTaxPercent: number; // e.g. 20%
}

export interface ServerSimParameters {
  activePlayersCount: number;      // e.g. 64 players average
  averageDailyPlayHours: number;   // e.g. 3.5 hours/day
  legalPlayerRatio: number;        // e.g. 0.65 (65% legal jobs, 35% criminal activities)
  initialEconomySeed: number;      // e.g. $500,000 total starter money
}

export interface EconomyPreset {
  presetId: string;
  authorUid: string;
  authorName: string;
  serverName: string;
  frameworkTarget: 'qbcore' | 'esx' | 'qbx' | 'custom_json';
  createdAt: number;
  updatedAt: number;
  isPublicTemplate: boolean;
  upvotesCount?: number;
  upvotedBy?: string[];
  anchors: EconomicAnchors;
  jobs: JobConfig[];
  sinks: MoneySinkConfig;
  serverParams: ServerSimParameters;
  notes?: string;
}

export interface EconomySimulationDay {
  day: number;
  totalMintedLegal: number;
  totalMintedIllegal: number;
  totalMoneyCreated: number;
  totalMoneyDestroyed: number;
  netDailyFlow: number;
  cumulativeCashInEconomy: number;
  averagePlayerNetWorth: number;
}

export interface EconomyCalculationResults {
  baseHourlyLegalTarget: number;
  baseHourlyIllegalTarget: number;
  timeToAssets: {
    basicFoodPack: { label: string; cost: number; hours: number; days: number };
    handgun: { label: string; cost: number; hours: number; days: number };
    starterVehicle: { label: string; cost: number; hours: number; days: number };
    starterApartment: { label: string; cost: number; hours: number; days: number };
    midTierSupercar: { label: string; cost: number; hours: number; days: number };
    luxuryMansion: { label: string; cost: number; hours: number; days: number };
  };
  simulation30Days: EconomySimulationDay[];
  inflationRiskGrade: 'EXCELLENT_STABILITY' | 'MILD_INFLATION' | 'HYPER_INFLATION_RISK' | 'STAGNATION_RISK';
  inflationIndexScore: number;     // 0 (deflation) to 100 (extreme hyper-inflation)
  dailySinkToCreationRatio: number;// e.g. 0.45 = 45% of minted money is burned by sinks
  diagnosticAdvice: string[];
  total30DayMinted: number;
  total30DayDestroyed: number;
  total30DayNetLiquid: number;
}

// -------------------------------------------------------------
// DEFAULT PRESETS FOR POPULAR RP FRAMEWORKS & THEMES
// -------------------------------------------------------------

export const DEFAULT_ANCHORS: EconomicAnchors = {
  baseFoodCost: 45,
  starterApartmentCost: 25000,
  midTierSupercarCost: 350000,
  targetSupercarHours: 30,
  dailyTaxesAndFees: 6,
  starterVehicleCost: 18000,
  luxuryMansionCost: 1400000,
  handgunCost: 3200
};

export const DEFAULT_SINKS: MoneySinkConfig = {
  propertyTaxDailyPercent: 1.2,
  vehicleImpoundFee: 850,
  vehicleRepairAverage: 500,
  hospitalBill: 1200,
  foodWaterDailyCost: 250,
  dirtyMoneyLaunderTaxPercent: 18
};

export const DEFAULT_SERVER_PARAMS: ServerSimParameters = {
  activePlayersCount: 64,
  averageDailyPlayHours: 3.5,
  legalPlayerRatio: 0.65,
  initialEconomySeed: 640000 // ~$10,000 starter cash per player
};

export const DEFAULT_JOBS: JobConfig[] = [
  // Legal Jobs
  {
    id: 'police',
    name: 'LSPD / Vice City Police Officer',
    category: 'law_enforcement',
    type: 'legal',
    riskLevel: 1.2,
    hourlyPayout: 12500,
    baseSalaryPerTick: 1040,
    description: 'Guaranteed government paycheck with hazard duty pay & arrest bonuses.'
  },
  {
    id: 'ems',
    name: 'Vice Medical Services (EMS / Paramedic)',
    category: 'medical',
    type: 'legal',
    riskLevel: 1.1,
    hourlyPayout: 11800,
    baseSalaryPerTick: 980,
    description: 'City funded medical responder with revive and treatment bonuses.'
  },
  {
    id: 'mechanic',
    name: 'Benny’s / Custom Shop Mechanic',
    category: 'services',
    type: 'legal',
    riskLevel: 1.0,
    hourlyPayout: 11000,
    baseSalaryPerTick: 915,
    description: 'Vehicle repairs, performance tuning commissions, and tow calls.'
  },
  {
    id: 'delivery',
    name: 'PostOP Courier & Cargo Trucker',
    category: 'logistics',
    type: 'legal',
    riskLevel: 1.0,
    hourlyPayout: 10200,
    baseSalaryPerTick: 850,
    description: 'Low-barrier starter job delivering freight across the map.'
  },
  {
    id: 'taxi',
    name: 'Downtown Cab Co. Taxi Driver',
    category: 'services',
    type: 'legal',
    riskLevel: 1.0,
    hourlyPayout: 9500,
    baseSalaryPerTick: 790,
    description: 'Flexible starter legal income with tips and city fare meters.'
  },

  // Illegal Jobs & Heists
  {
    id: 'street_drugs',
    name: 'Street Drug Dealing (Corner Hustle)',
    category: 'crime',
    type: 'illegal',
    riskLevel: 1.4,
    hourlyPayout: 16500,
    cooldownMinutes: 5,
    failureFine: 2500,
    description: 'Selling weed and cocaine on NPC street corners with police alert risk.'
  },
  {
    id: 'store_robbery',
    name: '24/7 Convenience Store Robbery',
    category: 'crime',
    type: 'illegal',
    riskLevel: 1.6,
    hourlyPayout: 19500,
    cooldownMinutes: 15,
    failureFine: 4000,
    description: 'Smash and grab register tills with silent alarm dispatch.'
  },
  {
    id: 'house_burglary',
    name: 'Residential House Burglary',
    category: 'crime',
    type: 'illegal',
    riskLevel: 1.7,
    hourlyPayout: 21000,
    cooldownMinutes: 20,
    failureFine: 5500,
    description: 'Lockpicking luxury mansions for jewelry, laptops, and vintage art.'
  },
  {
    id: 'armored_truck',
    name: 'Gruppe 6 Armored Truck Heist',
    category: 'heist',
    type: 'illegal',
    riskLevel: 2.1,
    hourlyPayout: 27500,
    cooldownMinutes: 45,
    failureFine: 9000,
    description: 'Thermite charge ambush on security trucks in transit.'
  },
  {
    id: 'bank_heist',
    name: 'Fleeca & Pacific Standard Vault Heist',
    category: 'heist',
    type: 'illegal',
    riskLevel: 2.6,
    hourlyPayout: 36000,
    cooldownMinutes: 60,
    failureFine: 16000,
    description: 'Multi-crew coordinated vault drilling with high-speed pursuit.'
  }
];

export const PRESET_TEMPLATES: Record<string, EconomyPreset> = {
  'nopixel-balanced': {
    presetId: 'preset-nopixel-balanced',
    authorUid: 'system-curated',
    authorName: 'Vice City Systems Lab',
    serverName: 'Semi-Realistic Balanced (NoPixel 4.0 Inspired)',
    frameworkTarget: 'qbcore',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now(),
    isPublicTemplate: true,
    upvotesCount: 342,
    anchors: {
      baseFoodCost: 45,
      starterApartmentCost: 25000,
      midTierSupercarCost: 350000,
      targetSupercarHours: 32,
      dailyTaxesAndFees: 6,
      starterVehicleCost: 18000,
      luxuryMansionCost: 1400000,
      handgunCost: 3200
    },
    sinks: DEFAULT_SINKS,
    serverParams: DEFAULT_SERVER_PARAMS,
    jobs: DEFAULT_JOBS,
    notes: 'Well-tested balance for 64-128 player servers. 32 hours of focused gameplay for supercars prevents hyperinflation while rewarding dedicated crews.'
  },
  'hardcore-survival': {
    presetId: 'preset-hardcore-survival',
    authorUid: 'system-curated',
    authorName: 'Vice City Systems Lab',
    serverName: 'Hardcore Slow-Burn Survival Economy',
    frameworkTarget: 'qbx',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now(),
    isPublicTemplate: true,
    upvotesCount: 289,
    anchors: {
      baseFoodCost: 75,
      starterApartmentCost: 65000,
      midTierSupercarCost: 750000,
      targetSupercarHours: 65,
      dailyTaxesAndFees: 9,
      starterVehicleCost: 35000,
      luxuryMansionCost: 3200000,
      handgunCost: 6500
    },
    sinks: {
      propertyTaxDailyPercent: 2.2,
      vehicleImpoundFee: 1500,
      vehicleRepairAverage: 950,
      hospitalBill: 2500,
      foodWaterDailyCost: 450,
      dirtyMoneyLaunderTaxPercent: 25
    },
    serverParams: {
      activePlayersCount: 64,
      averageDailyPlayHours: 4.0,
      legalPlayerRatio: 0.70,
      initialEconomySeed: 320000
    },
    jobs: DEFAULT_JOBS.map((j) => ({
      ...j,
      hourlyPayout: Math.round(j.hourlyPayout * 0.55),
      baseSalaryPerTick: j.baseSalaryPerTick ? Math.round(j.baseSalaryPerTick * 0.55) : undefined
    })),
    notes: 'For serious RP servers where owning a sports car is a rare status symbol. High money sinks and slow progression maintain long-term server retention.'
  },
  'casual-high-action': {
    presetId: 'preset-casual-high-action',
    authorUid: 'system-curated',
    authorName: 'Vice City Systems Lab',
    serverName: 'Casual Fast-Action 100k-Or-Die Server',
    frameworkTarget: 'esx',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now(),
    isPublicTemplate: true,
    upvotesCount: 215,
    anchors: {
      baseFoodCost: 20,
      starterApartmentCost: 10000,
      midTierSupercarCost: 200000,
      targetSupercarHours: 12,
      dailyTaxesAndFees: 3,
      starterVehicleCost: 8000,
      luxuryMansionCost: 800000,
      handgunCost: 1500
    },
    sinks: {
      propertyTaxDailyPercent: 0.5,
      vehicleImpoundFee: 350,
      vehicleRepairAverage: 200,
      hospitalBill: 400,
      foodWaterDailyCost: 100,
      dirtyMoneyLaunderTaxPercent: 10
    },
    serverParams: {
      activePlayersCount: 100,
      averageDailyPlayHours: 3.0,
      legalPlayerRatio: 0.50,
      initialEconomySeed: 1500000
    },
    jobs: DEFAULT_JOBS.map((j) => ({
      ...j,
      hourlyPayout: Math.round(j.hourlyPayout * 1.9),
      baseSalaryPerTick: j.baseSalaryPerTick ? Math.round(j.baseSalaryPerTick * 1.9) : undefined
    })),
    notes: 'Designed for fast gunfights, quick car buys, and rapid turf wars where players want instant gratification with high robbery payouts.'
  }
};

// -------------------------------------------------------------
// CORE MATHEMATICAL CALCULATION ENGINE
// -------------------------------------------------------------

export function calculateEconomyBalance(
  anchors: EconomicAnchors,
  jobs: JobConfig[],
  sinks: MoneySinkConfig,
  serverParams: ServerSimParameters
): EconomyCalculationResults {
  // 1. Calculate Target Baseline Hourly Wage (Legal)
  // Supercar cost / target hours gives target gross legal hourly wage
  const baseHourlyLegalTarget = Math.max(100, Math.round(anchors.midTierSupercarCost / Math.max(1, anchors.targetSupercarHours)));

  // Average actual configured legal and illegal wages
  const legalJobs = jobs.filter((j) => j.type === 'legal');
  const illegalJobs = jobs.filter((j) => j.type === 'illegal');

  const avgLegalWage = legalJobs.length > 0
    ? legalJobs.reduce((sum, j) => sum + j.hourlyPayout, 0) / legalJobs.length
    : baseHourlyLegalTarget;

  const avgIllegalWage = illegalJobs.length > 0
    ? illegalJobs.reduce((sum, j) => sum + j.hourlyPayout, 0) / illegalJobs.length
    : baseHourlyLegalTarget * 1.7;

  // Blended average hourly income per player
  const blendedHourlyIncome = (avgLegalWage * serverParams.legalPlayerRatio) + (avgIllegalWage * (1 - serverParams.legalPlayerRatio));

  // 2. Calculate Time-to-Asset metrics (hours and active gaming days)
  const calcTime = (cost: number) => {
    const hours = Number((cost / Math.max(1, avgLegalWage)).toFixed(1));
    const days = Number((hours / Math.max(0.5, serverParams.averageDailyPlayHours)).toFixed(1));
    return { cost, hours, days };
  };

  const starterCarCost = anchors.starterVehicleCost || Math.round(anchors.midTierSupercarCost * 0.05);
  const mansionCost = anchors.luxuryMansionCost || Math.round(anchors.midTierSupercarCost * 4.0);
  const gunCost = anchors.handgunCost || Math.round(anchors.baseFoodCost * 70);

  const timeToAssets = {
    basicFoodPack: { label: 'Daily Food & Water Ration', ...calcTime(anchors.baseFoodCost * 4) },
    handgun: { label: 'Service Handgun & Ammo', ...calcTime(gunCost) },
    starterVehicle: { label: 'Starter Sedan / Hatchback', ...calcTime(starterCarCost) },
    starterApartment: { label: 'Starter Studio Apartment', ...calcTime(anchors.starterApartmentCost) },
    midTierSupercar: { label: 'Mid-Tier Exotic Supercar', ...calcTime(anchors.midTierSupercarCost) },
    luxuryMansion: { label: 'Vinewood / Ocean Drive Villa', ...calcTime(mansionCost) }
  };

  // 3. 30-Day Simulation Projection
  const simulation30Days: EconomySimulationDay[] = [];
  let currentCumulativeCash = serverParams.initialEconomySeed;
  let total30DayMinted = 0;
  let total30DayDestroyed = 0;

  const dailyPlayerPlayHours = serverParams.averageDailyPlayHours;
  const numLegalPlayers = serverParams.activePlayersCount * serverParams.legalPlayerRatio;
  const numIllegalPlayers = serverParams.activePlayersCount * (1 - serverParams.legalPlayerRatio);

  for (let day = 1; day <= 30; day++) {
    // Money created daily
    const dailyMintedLegal = Math.round(numLegalPlayers * avgLegalWage * dailyPlayerPlayHours);
    const dailyMintedIllegal = Math.round(numIllegalPlayers * avgIllegalWage * dailyPlayerPlayHours);
    const totalDayMoneyCreated = dailyMintedLegal + dailyMintedIllegal;

    // Money destroyed daily by sinks
    // Sinks include: food & water, vehicle upkeep (average 1.5 repair/day per 2 players), impounds (1 per 5 players), medical (1 per 4 players), laundering tax on illegal money, property tax
    const foodSink = serverParams.activePlayersCount * sinks.foodWaterDailyCost;
    const repairSink = (serverParams.activePlayersCount * 0.6) * sinks.vehicleRepairAverage;
    const impoundSink = (serverParams.activePlayersCount * 0.2) * sinks.vehicleImpoundFee;
    const medicalSink = (serverParams.activePlayersCount * 0.25) * sinks.hospitalBill;
    const launderSink = dailyMintedIllegal * (sinks.dirtyMoneyLaunderTaxPercent / 100);
    const propertyTaxSink = currentCumulativeCash * (sinks.propertyTaxDailyPercent / 100);

    const totalDayMoneyDestroyed = Math.round(foodSink + repairSink + impoundSink + medicalSink + launderSink + propertyTaxSink);

    const netDailyFlow = totalDayMoneyCreated - totalDayMoneyDestroyed;
    currentCumulativeCash = Math.max(0, currentCumulativeCash + netDailyFlow);

    total30DayMinted += totalDayMoneyCreated;
    total30DayDestroyed += totalDayMoneyDestroyed;

    simulation30Days.push({
      day,
      totalMintedLegal: dailyMintedLegal,
      totalMintedIllegal: dailyMintedIllegal,
      totalMoneyCreated: totalDayMoneyCreated,
      totalMoneyDestroyed: totalDayMoneyDestroyed,
      netDailyFlow,
      cumulativeCashInEconomy: currentCumulativeCash,
      averagePlayerNetWorth: Math.round(currentCumulativeCash / Math.max(1, serverParams.activePlayersCount))
    });
  }

  // 4. Inflation Index Score & Grading
  // Ratio of money destroyed vs money created
  const sinkRatio = total30DayMinted > 0 ? total30DayDestroyed / total30DayMinted : 0.5;
  const growthMultiple = total30DayMinted / Math.max(1, serverParams.initialEconomySeed);

  // Inflation index: 0 is harsh deflation, 50 is perfect balance (40-60% sink ratio), 100 is catastrophic hyperinflation
  let inflationScore = Math.round((1 - sinkRatio) * 100);
  if (sinkRatio > 0.85) {
    inflationScore = 15; // Too harsh, deflation
  } else if (sinkRatio >= 0.40 && sinkRatio <= 0.70) {
    inflationScore = 45; // Healthy equilibrium
  } else if (sinkRatio < 0.25) {
    inflationScore = 92; // Massive surplus money, hyper-inflation
  }

  let inflationRiskGrade: EconomyCalculationResults['inflationRiskGrade'] = 'EXCELLENT_STABILITY';
  const diagnosticAdvice: string[] = [];

  if (sinkRatio < 0.25 || growthMultiple > 25) {
    inflationRiskGrade = 'HYPER_INFLATION_RISK';
    diagnosticAdvice.push('🚨 Critical: Daily money creation vastly outpaces sinks. Economy will hyper-inflate within 14 days.');
    diagnosticAdvice.push(`Increase dirty money launder tax from ${sinks.dirtyMoneyLaunderTaxPercent}% to 25%+ or increase property taxes.`);
    diagnosticAdvice.push(`Cap Bank Heist and Armored Truck payouts to keep criminal income within 2.0x of legal baseline.`);
  } else if (sinkRatio < 0.40) {
    inflationRiskGrade = 'MILD_INFLATION';
    diagnosticAdvice.push('⚠️ Moderate Inflation: Players will accumulate high excess capital after Day 15.');
    diagnosticAdvice.push('Consider adding vehicle registration fees, insurance renewals, or raising hospital revive costs.');
  } else if (sinkRatio > 0.80) {
    inflationRiskGrade = 'STAGNATION_RISK';
    diagnosticAdvice.push('❄️ Deflation / Stagnation Warning: Sinks are draining player liquidity faster than starter players can grind.');
    diagnosticAdvice.push('Lower daily food & water costs or reduce vehicle impound/repair fees to reduce player frustration.');
  } else {
    inflationRiskGrade = 'EXCELLENT_STABILITY';
    diagnosticAdvice.push('✅ Optimum Economic Balance: Healthy 30-day progression curve with sustainable money sinks.');
    diagnosticAdvice.push(`Supercar benchmark target (${anchors.targetSupercarHours} hrs) aligns closely with actual average wages.`);
    diagnosticAdvice.push('Legal and illegal risk-reward incentives are well-proportioned for 64-128 player servers.');
  }

  return {
    baseHourlyLegalTarget,
    baseHourlyIllegalTarget: Math.round(baseHourlyLegalTarget * 1.7),
    timeToAssets,
    simulation30Days,
    inflationRiskGrade,
    inflationIndexScore: inflationScore,
    dailySinkToCreationRatio: Number(sinkRatio.toFixed(2)),
    diagnosticAdvice,
    total30DayMinted,
    total30DayDestroyed,
    total30DayNetLiquid: total30DayMinted - total30DayDestroyed
  };
}

// -------------------------------------------------------------
// CONFIGURATION EXPORTERS (LUA & JSON)
// -------------------------------------------------------------

export function exportLuaConfig(
  frameworkTarget: 'qbcore' | 'esx' | 'qbx',
  jobs: JobConfig[],
  anchors: EconomicAnchors,
  sinks: MoneySinkConfig,
  serverName: string = 'GTA VI Central RP'
): string {
  const timestamp = new Date().toISOString();

  if (frameworkTarget === 'qbcore') {
    return `-- =========================================================================
-- ${serverName.toUpperCase()} — QBCore Balanced Economy Configuration
-- Generated by GTA VI Central RP Economy Balancer on ${timestamp}
-- Drop into: qb-core/shared/jobs.lua & qb-core/config.lua
-- =========================================================================

QBConfig = QBConfig or {}
QBConfig.Server = QBConfig.Server or {}
QBConfig.Money = QBConfig.Money or {}

-- Core Economic Anchors
QBConfig.Money.BaseFoodPrice = ${anchors.baseFoodCost}
QBConfig.Money.StarterApartment = ${anchors.starterApartmentCost}
QBConfig.Money.MidTierSupercar = ${anchors.midTierSupercarCost}
QBConfig.Money.TargetGrindHours = ${anchors.targetSupercarHours}

-- Sinks & Taxation
QBConfig.Money.PropertyTaxRate = ${sinks.propertyTaxDailyPercent / 100} -- ${(sinks.propertyTaxDailyPercent).toFixed(1)}% daily
QBConfig.Money.ImpoundFee = ${sinks.vehicleImpoundFee}
QBConfig.Money.RepairAvg = ${sinks.vehicleRepairAverage}
QBConfig.Money.HospitalFee = ${sinks.hospitalBill}
QBConfig.Money.LaunderCut = ${(sinks.dirtyMoneyLaunderTaxPercent / 100).toFixed(2)} -- ${sinks.dirtyMoneyLaunderTaxPercent}% tax

-- QBCore Shared Jobs Definition
QBShared = QBShared or {}
QBShared.Jobs = {
${jobs
  .map((j) => {
    const isLegal = j.type === 'legal';
    const tickPay = j.baseSalaryPerTick || Math.round(j.hourlyPayout / 12);
    return `    ['${j.id}'] = {
        label = '${j.name}',
        type = '${j.type}',
        defaultDuty = ${isLegal ? 'true' : 'false'},
        offDutyPay = false,
        riskMultiplier = ${j.riskLevel.toFixed(1)},
        hourlyTargetPayout = ${j.hourlyPayout},
        grades = {
            ['0'] = { name = 'Recruit / Starter', payment = ${Math.round(tickPay * 0.8)} },
            ['1'] = { name = 'Junior Operative', payment = ${Math.round(tickPay * 0.95)} },
            ['2'] = { name = 'Senior / Verified', payment = ${Math.round(tickPay * 1.1)} },
            ['3'] = { name = 'Department Head / Boss', payment = ${Math.round(tickPay * 1.3)}, isboss = true },
        },
    },`;
  })
  .join('\n')}
}

return QBShared.Jobs
`;
  }

  if (frameworkTarget === 'esx') {
    return `-- =========================================================================
-- ${serverName.toUpperCase()} — ESX Legacy Balanced Economy Configuration
-- Generated by GTA VI Central RP Economy Balancer on ${timestamp}
-- Drop into: es_extended/config.jobs.lua & esx_society/config.lua
-- =========================================================================

Config = Config or {}
Config.Jobs = Config.Jobs or {}
Config.Economy = {
    BaseFoodCost = ${anchors.baseFoodCost},
    StarterApartment = ${anchors.starterApartmentCost},
    MidTierSupercar = ${anchors.midTierSupercarCost},
    TargetGrindHours = ${anchors.targetSupercarHours},
    PropertyTaxRate = ${sinks.propertyTaxDailyPercent},
    HospitalFee = ${sinks.hospitalBill},
    VehicleImpound = ${sinks.vehicleImpoundFee}
}

-- ESX Job Grades & Paycheck Scale (Per Paycheck Interval)
${jobs
  .map((j) => {
    const tickPay = j.baseSalaryPerTick || Math.round(j.hourlyPayout / 12);
    return `Config.Jobs['${j.id}'] = {
    label = '${j.name}',
    type = '${j.type}',
    risk = ${j.riskLevel.toFixed(1)},
    grades = {
        [0] = { grade = 0, name = 'recruit', label = 'Trainee', salary = ${Math.round(tickPay * 0.8)} },
        [1] = { grade = 1, name = 'officer', label = 'Standard Employee', salary = ${Math.round(tickPay * 1.0)} },
        [2] = { grade = 2, name = 'supervisor', label = 'Shift Lead', salary = ${Math.round(tickPay * 1.2)} },
        [3] = { grade = 3, name = 'boss', label = 'Managing Director', salary = ${Math.round(tickPay * 1.4)} }
    }
}`;
  })
  .join('\n\n')}
`;
  }

  // QBX (Qbox) Modern Core
  return `-- =========================================================================
-- ${serverName.toUpperCase()} — QBX (Qbox Core) Economy & Jobs Definition
-- Generated by GTA VI Central RP Economy Balancer on ${timestamp}
-- Drop into: qbx_core/config/jobs.lua
-- =========================================================================

return {
    economy = {
        anchors = {
            baseFoodCost = ${anchors.baseFoodCost},
            starterApartment = ${anchors.starterApartmentCost},
            midTierSupercar = ${anchors.midTierSupercarCost},
            targetHours = ${anchors.targetSupercarHours},
        },
        sinks = {
            propertyTaxDaily = ${sinks.propertyTaxDailyPercent / 100},
            hospitalBill = ${sinks.hospitalBill},
            impoundFee = ${sinks.vehicleImpoundFee},
            dirtyMoneyLaunderTax = ${sinks.dirtyMoneyLaunderTaxPercent / 100}
        }
    },
    jobs = {
${jobs
  .map((j) => {
    const tickPay = j.baseSalaryPerTick || Math.round(j.hourlyPayout / 12);
    return `        ['${j.id}'] = {
            label = '${j.name}',
            type = '${j.type}',
            category = '${j.category}',
            riskMultiplier = ${j.riskLevel.toFixed(1)},
            hourlyTarget = ${j.hourlyPayout},
            grades = {
                [0] = { name = 'Starter', payment = ${Math.round(tickPay * 0.8)} },
                [1] = { name = 'Operative', payment = ${Math.round(tickPay * 1.0)} },
                [2] = { name = 'Senior', payment = ${Math.round(tickPay * 1.2)} },
                [3] = { name = 'Boss', payment = ${Math.round(tickPay * 1.4)}, isBoss = true }
            }
        },`;
  })
  .join('\n')}
    }
}
`;
}

export function exportJsonConfig(
  anchors: EconomicAnchors,
  jobs: JobConfig[],
  sinks: MoneySinkConfig,
  serverParams: ServerSimParameters,
  serverName: string = 'GTA VI Central RP'
): string {
  return JSON.stringify(
    {
      meta: {
        serverName,
        generatedAt: new Date().toISOString(),
        generator: 'GTA VI Central RP Economy & Wage Balancer'
      },
      anchors,
      sinks,
      serverParams,
      jobs
    },
    null,
    2
  );
}
