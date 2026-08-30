/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HandlingData {
  fMass: number;               // Vehicle Mass in kg (800 - 4500)
  fInitialDragCoeff: number;   // Drag coefficient (1.0 - 20.0)
  fInitialDriveForce: number;  // Engine drive force (0.10 - 0.70)
  fDriveBiasFront: number;     // 0.0 = 100% RWD, 0.5 = 50/50 AWD, 1.0 = 100% FWD
  fTractionCurveMax: number;   // Peak cornering grip (1.0 - 3.5)
  fTractionCurveMin: number;   // Slide threshold (0.6 - 3.0)
  fSuspensionForce: number;    // Suspension spring stiffness (1.0 - 5.0)
  fBrakeForce: number;         // Braking power (0.4 - 2.5)
  // Extended realistic parameters
  fTractionLossMult?: number;       // Drift slip factor (0.5 - 2.5)
  fSuspensionReboundDamp?: number;  // Rebound shock dampening (0.5 - 4.0)
  fSuspensionCompDamp?: number;     // Compression shock dampening (0.5 - 3.5)
  fBrakeBiasFront?: number;         // Front vs rear brake balance (0.0 - 1.0)
  nInitialDriveGears?: number;      // Number of gears (4 - 8)
  fDriveInertia?: number;           // Flywheel inertia (0.5 - 2.0)
}

export interface CalculatedTelemetry {
  estimatedTopSpeedMph: number;
  estimatedTopSpeedKph: number;
  zeroToSixtySec: number;
  zeroToHundredSec: number;
  quarterMileSec: number;
  driftTendencyScore: number;       // 1 - 100 (Higher = easier to initiate and maintain oversteer drift)
  offroadStabilityScore: number;    // 1 - 100
  corneringGForce: number;          // Lateral Gs (e.g. 0.95G - 1.55G)
  brakingDistanceFt: number;        // 60-0 mph braking distance in feet
  accelerationScore: number;        // 0 - 100
  topSpeedScore: number;            // 0 - 100
  gripScore: number;                // 0 - 100
  brakingScore: number;             // 0 - 100
  stabilityScore: number;           // 0 - 100
  driveBiasLabel: '100% RWD' | 'RWD-Biased AWD' | '50/50 AWD' | 'FWD-Biased AWD' | '100% FWD';
}

export interface VehicleTuningBuild {
  buildId: string;
  authorUid: string;
  authorName: string;
  vehicleModel: string;          // e.g., "pegassi-ignus", "grotti-furia"
  buildTitle: string;            // e.g., "Apex Drift Spec V2", "Pro Drag Strip Setup"
  tags: ('drift' | 'race' | 'drag' | 'offroad' | 'realistic')[];
  upvotesCount: number;
  upvotedBy?: string[];
  dislikesCount?: number;
  dislikedBy?: string[];
  isVerifiedPreset: boolean;     // VIP/Admin verified badge
  createdAt: number;
  handlingData: HandlingData;
  notes?: string;
}

export const DEFAULT_HANDLING_PRESETS: Record<string, { label: string; vehicleModel: string; description: string; data: HandlingData; tag: 'drift' | 'race' | 'drag' | 'offroad' | 'realistic' }> = {
  'apex-drift': {
    label: 'Apex Drift Master Spec',
    vehicleModel: 'declasse-drift-tampa',
    description: 'High oversteer, low slide traction threshold, instant RWD torque snap for effortless angle control.',
    tag: 'drift',
    data: {
      fMass: 1320,
      fInitialDragCoeff: 7.2,
      fInitialDriveForce: 0.385,
      fDriveBiasFront: 0.0, // Pure RWD
      fTractionCurveMax: 2.15,
      fTractionCurveMin: 1.45,
      fSuspensionForce: 2.85,
      fBrakeForce: 1.15,
      fTractionLossMult: 1.65,
      fSuspensionReboundDamp: 1.8,
      fSuspensionCompDamp: 1.4,
      fBrakeBiasFront: 0.65,
      nInitialDriveGears: 6,
      fDriveInertia: 1.2
    }
  },
  'pro-race-grip': {
    label: 'Circuit Time Attack Grip',
    vehicleModel: 'pegassi-ignus-custom',
    description: 'Maximum aerodynamic downforce, sticky traction curves, AWD torque split for razor-sharp track times.',
    tag: 'race',
    data: {
      fMass: 1480,
      fInitialDragCoeff: 5.8,
      fInitialDriveForce: 0.445,
      fDriveBiasFront: 0.32, // AWD
      fTractionCurveMax: 2.95,
      fTractionCurveMin: 2.60,
      fSuspensionForce: 3.40,
      fBrakeForce: 1.55,
      fTractionLossMult: 1.05,
      fSuspensionReboundDamp: 2.6,
      fSuspensionCompDamp: 2.1,
      fBrakeBiasFront: 0.58,
      nInitialDriveGears: 7,
      fDriveInertia: 1.0
    }
  },
  'drag-strip-beast': {
    label: 'Pro Drag Strip Eliminator',
    vehicleModel: 'bravado-buffalo-evx',
    description: 'Massive initial drive force, ultra-stiff rear suspension to prevent wheelie lag, sub-2.0s 0-60 launch.',
    tag: 'drag',
    data: {
      fMass: 1550,
      fInitialDragCoeff: 4.2,
      fInitialDriveForce: 0.580,
      fDriveBiasFront: 0.20,
      fTractionCurveMax: 3.20,
      fTractionCurveMin: 2.85,
      fSuspensionForce: 3.80,
      fBrakeForce: 1.60,
      fTractionLossMult: 0.95,
      fSuspensionReboundDamp: 3.2,
      fSuspensionCompDamp: 2.5,
      fBrakeBiasFront: 0.55,
      nInitialDriveGears: 6,
      fDriveInertia: 0.85
    }
  },
  'baja-offroad': {
    label: 'Everglades Baja Crawler',
    vehicleModel: 'vapid-sandking-xl',
    description: 'High ground clearance, supple progressive suspension damping, 50/50 locked AWD crawl ratio.',
    tag: 'offroad',
    data: {
      fMass: 2450,
      fInitialDragCoeff: 11.5,
      fInitialDriveForce: 0.320,
      fDriveBiasFront: 0.50, // 50/50 AWD
      fTractionCurveMax: 2.30,
      fTractionCurveMin: 2.10,
      fSuspensionForce: 1.65,
      fBrakeForce: 0.95,
      fTractionLossMult: 1.10,
      fSuspensionReboundDamp: 1.4,
      fSuspensionCompDamp: 1.2,
      fBrakeBiasFront: 0.52,
      nInitialDriveGears: 5,
      fDriveInertia: 1.5
    }
  },
  'realistic-street': {
    label: 'OEM+ Realistic Street Spec',
    vehicleModel: 'albany-v-str-spec6',
    description: 'Authentic road-legal sports sedan physics with progressive weight transfer, gentle understeer on limit.',
    tag: 'realistic',
    data: {
      fMass: 1720,
      fInitialDragCoeff: 8.4,
      fInitialDriveForce: 0.335,
      fDriveBiasFront: 0.0,
      fTractionCurveMax: 2.35,
      fTractionCurveMin: 2.05,
      fSuspensionForce: 2.45,
      fBrakeForce: 1.10,
      fTractionLossMult: 1.20,
      fSuspensionReboundDamp: 1.9,
      fSuspensionCompDamp: 1.6,
      fBrakeBiasFront: 0.62,
      nInitialDriveGears: 8,
      fDriveInertia: 1.1
    }
  }
};

// Fast numeric clamp helper
const clamp = (val: number, min: number, max: number): number => Math.min(max, Math.max(min, val));

/**
 * Computes realistic vehicle telemetry output from raw handling.meta parameters
 */
export function calculateCalculatedStats(data: HandlingData): CalculatedTelemetry {
  const {
    fMass = 1500,
    fInitialDragCoeff = 7.0,
    fInitialDriveForce = 0.35,
    fDriveBiasFront = 0.0,
    fTractionCurveMax = 2.4,
    fTractionCurveMin = 2.0,
    fSuspensionForce = 2.5,
    fBrakeForce = 1.1
  } = data;

  // 1. Estimated Top Speed (MPH)
  // Higher drive force increases top speed; higher drag coefficient dampens it
  const baseSpeedFromForce = 110 + (fInitialDriveForce * 140);
  const dragFactor = Math.max(0.5, (12 - fInitialDragCoeff) * 2.8);
  const estimatedTopSpeedMph = clamp(Math.round((baseSpeedFromForce + dragFactor) * 10) / 10, 75, 225);
  const estimatedTopSpeedKph = Math.round(estimatedTopSpeedMph * 1.60934);

  // 2. 0-60 MPH (0-100 km/h) Acceleration Time in seconds
  // Grip limits launch traction if drive force is huge but traction is low (wheelspin)
  const launchGrip = Math.min(fTractionCurveMax, 3.2);
  const awdLaunchBonus = fDriveBiasFront > 0.1 && fDriveBiasFront < 0.9 ? 0.35 : 0.0;
  let rawZeroSixty = (fMass / (fInitialDriveForce * 3600)) - (launchGrip * 0.45) - awdLaunchBonus;
  // Account for massive wheelspin if torque exceeds traction
  const wheelspinPenalty = Math.max(0, (fInitialDriveForce * 3.5) - launchGrip) * 0.4;
  rawZeroSixty += wheelspinPenalty;
  const zeroToSixtySec = clamp(Math.round(rawZeroSixty * 100) / 100, 1.75, 9.8);
  const zeroToHundredSec = Math.round((zeroToSixtySec * 1.08) * 100) / 100;
  const quarterMileSec = Math.round((zeroToSixtySec * 2.45 + 3.2) * 100) / 100;

  // 3. Drift / Slide Tendency Score (1 - 100)
  // Low fTractionCurveMin vs fTractionCurveMax = sudden snap oversteer
  // 100% RWD (fDriveBiasFront = 0.0) maximizes drift angle
  const tractionDelta = Math.max(0.1, fTractionCurveMax - fTractionCurveMin);
  const rwdFactor = Math.max(0, 1.0 - (fDriveBiasFront * 1.5));
  const stiffSuspensionFactor = Math.min(1.5, fSuspensionForce / 2.0);
  const driftRaw = ((tractionDelta * 38) + (rwdFactor * 42) + (fInitialDriveForce * 40)) * (stiffSuspensionFactor * 0.7);
  const driftTendencyScore = clamp(Math.round(driftRaw), 5, 100);

  // 4. Off-Road Stability Score (1 - 100)
  // Higher mass + AWD 50/50 + softer suspension + balanced traction = best off-road crawling
  const awdBalance = 1.0 - Math.abs(fDriveBiasFront - 0.5) * 2; // 1.0 if exactly 50/50 AWD
  const suspensionSuppleness = Math.max(0, (3.5 - fSuspensionForce) / 2.5); // Softer = better over bumps
  const offroadRaw = (awdBalance * 45) + (suspensionSuppleness * 30) + (Math.min(fMass, 2800) / 2800 * 25);
  const offroadStabilityScore = clamp(Math.round(offroadRaw), 10, 100);

  // 5. Cornering G-Force
  const corneringGForce = Math.round((0.75 + (fTractionCurveMax * 0.26) + (fSuspensionForce * 0.05)) * 100) / 100;

  // 6. Braking Distance from 60 MPH (feet)
  const brakingDistanceFt = Math.round(clamp((160 / Math.max(0.4, fBrakeForce)) - (fTractionCurveMax * 8), 88, 195));

  // Normalized 0-100 radar scores
  const accelerationScore = clamp(Math.round(((6.5 - zeroToSixtySec) / 4.75) * 100), 10, 100);
  const topSpeedScore = clamp(Math.round(((estimatedTopSpeedMph - 90) / 130) * 100), 10, 100);
  const gripScore = clamp(Math.round(((fTractionCurveMax - 1.2) / 2.1) * 100), 10, 100);
  const brakingScore = clamp(Math.round(((fBrakeForce - 0.4) / 1.8) * 100), 10, 100);
  const stabilityScore = clamp(Math.round((((fTractionCurveMin / fTractionCurveMax) * 60) + (fSuspensionForce * 8))), 10, 100);

  let driveBiasLabel: CalculatedTelemetry['driveBiasLabel'] = '50/50 AWD';
  if (fDriveBiasFront <= 0.05) driveBiasLabel = '100% RWD';
  else if (fDriveBiasFront < 0.45) driveBiasLabel = 'RWD-Biased AWD';
  else if (fDriveBiasFront <= 0.55) driveBiasLabel = '50/50 AWD';
  else if (fDriveBiasFront < 0.95) driveBiasLabel = 'FWD-Biased AWD';
  else driveBiasLabel = '100% FWD';

  return {
    estimatedTopSpeedMph,
    estimatedTopSpeedKph,
    zeroToSixtySec,
    zeroToHundredSec,
    quarterMileSec,
    driftTendencyScore,
    offroadStabilityScore,
    corneringGForce,
    brakingDistanceFt,
    accelerationScore,
    topSpeedScore,
    gripScore,
    brakingScore,
    stabilityScore,
    driveBiasLabel
  };
}

/**
 * Generates GTA V / FiveM / GTA VI compatible handling.meta XML file content
 */
export function generateHandlingMetaXML(vehicleModel: string, data: HandlingData): string {
  const modelNameClean = (vehicleModel || 'CUSTOM_VEHICLE').toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const handlingId = `${modelNameClean}_SPEC`;

  const fMass = (data.fMass ?? 1500).toFixed(6);
  const fInitialDragCoeff = (data.fInitialDragCoeff ?? 7.5).toFixed(6);
  const fInitialDriveForce = (data.fInitialDriveForce ?? 0.35).toFixed(6);
  const fDriveBiasFront = (data.fDriveBiasFront ?? 0.0).toFixed(6);
  const fTractionCurveMax = (data.fTractionCurveMax ?? 2.4).toFixed(6);
  const fTractionCurveMin = (data.fTractionCurveMin ?? 2.0).toFixed(6);
  const fSuspensionForce = (data.fSuspensionForce ?? 2.5).toFixed(6);
  const fBrakeForce = (data.fBrakeForce ?? 1.1).toFixed(6);
  const fTractionLossMult = (data.fTractionLossMult ?? 1.0).toFixed(6);
  const fSuspensionReboundDamp = (data.fSuspensionReboundDamp ?? 2.0).toFixed(6);
  const fSuspensionCompDamp = (data.fSuspensionCompDamp ?? 1.5).toFixed(6);
  const fBrakeBiasFront = (data.fBrakeBiasFront ?? 0.6).toFixed(6);
  const nInitialDriveGears = data.nInitialDriveGears ?? 6;
  const fDriveInertia = (data.fDriveInertia ?? 1.0).toFixed(6);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ======================================================== -->
<!-- GTA VI Central / ViceIntel Custom handling.meta Tuner    -->
<!-- Generated for Model: ${modelNameClean}                   -->
<!-- Telemetry: Mass ${data.fMass}kg | DriveForce ${data.fInitialDriveForce} | Bias ${data.fDriveBiasFront} -->
<!-- ======================================================== -->
<CHandlingDataMgr>
  <HandlingData>
    <Item type="CHandlingData">
      <handlingName>${handlingId}</handlingName>
      <fMass value="${fMass}" />
      <fInitialDragCoeff value="${fInitialDragCoeff}" />
      <fPercentSubmerged value="85.000000" />
      <vecCentreOfMassOffset x="0.000000" y="0.000000" z="0.000000" />
      <vecInertiaMultiplier x="1.000000" y="1.200000" z="1.400000" />
      <fDriveBiasFront value="${fDriveBiasFront}" />
      <nInitialDriveGears value="${nInitialDriveGears}" />
      <fInitialDriveForce value="${fInitialDriveForce}" />
      <fDriveInertia value="${fDriveInertia}" />
      <fClutchChangeRateScaleUpShift value="2.500000" />
      <fClutchChangeRateScaleDownShift value="2.500000" />
      <fInitialDriveMaxFlatVel value="155.000000" />
      <fBrakeForce value="${fBrakeForce}" />
      <fBrakeBiasFront value="${fBrakeBiasFront}" />
      <fHandBrakeForce value="0.800000" />
      <fSteeringLock value="38.000000" />
      <fTractionCurveMax value="${fTractionCurveMax}" />
      <fTractionCurveMin value="${fTractionCurveMin}" />
      <fTractionCurveLateral value="22.500000" />
      <fTractionSpringDeltaMax value="0.150000" />
      <fLowSpeedTractionLossMult value="1.000000" />
      <fCamberStiffnesss value="0.000000" />
      <fTractionBiasFront value="0.485000" />
      <fTractionLossMult value="${fTractionLossMult}" />
      <fSuspensionForce value="${fSuspensionForce}" />
      <fSuspensionCompDamp value="${fSuspensionCompDamp}" />
      <fSuspensionReboundDamp value="${fSuspensionReboundDamp}" />
      <fSuspensionUpperLimit value="0.100000" />
      <fSuspensionLowerLimit value="-0.120000" />
      <fSuspensionRaise value="0.000000" />
      <fSuspensionBiasFront value="0.500000" />
      <fAntiRollBarForce value="0.850000" />
      <fAntiRollBarBiasFront value="0.550000" />
      <fRollCentreHeightFront value="0.300000" />
      <fRollCentreHeightRear value="0.300000" />
      <fCollisionDamageMult value="0.800000" />
      <fWeaponDamageMult value="1.000000" />
      <fDeformationDamageMult value="0.750000" />
      <fEngineDamageMult value="1.200000" />
      <fPetrolTankVolume value="65.000000" />
      <fOilVolume value="5.000000" />
      <fSeatOffsetDistX value="0.000000" />
      <fSeatOffsetDistY value="0.000000" />
      <fSeatOffsetDistZ value="0.000000" />
      <nMonetaryValue value="250000" />
      <strModelFlags>440010</strModelFlags>
      <strHandlingFlags>0</strHandlingFlags>
      <strDamageFlags>0</strDamageFlags>
      <AIHandling>AVERAGE</AIHandling>
      <SubHandlingData>
        <Item type="CCarHandlingData">
          <fBackEndPopUpCarImpulseMult value="0.100000" />
          <fBackEndPopUpBuildingImpulseMult value="0.030000" />
          <fBackEndPopUpMaxDeltaSpeed value="0.600000" />
        </Item>
      </SubHandlingData>
    </Item>
  </HandlingData>
</CHandlingDataMgr>`;
}

/**
 * Parses raw handling.meta XML string back into editable HandlingData parameters
 */
export function parseHandlingMetaXML(xmlString: string): { success: boolean; data?: Partial<HandlingData>; vehicleName?: string; error?: string } {
  try {
    if (!xmlString || typeof xmlString !== 'string') {
      return { success: false, error: 'Empty or invalid XML string provided.' };
    }

    const extractValue = (tag: string): number | null => {
      const regex = new RegExp(`<${tag}[^>]*value="([^"]+)"`, 'i');
      const match = xmlString.match(regex);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        return isNaN(val) ? null : val;
      }
      return null;
    };

    const extractString = (tag: string): string | null => {
      const regex = new RegExp(`<${tag}>([^<]+)</${tag}>`, 'i');
      const match = xmlString.match(regex);
      return match ? match[1].trim() : null;
    };

    const fMass = extractValue('fMass');
    const fInitialDragCoeff = extractValue('fInitialDragCoeff');
    const fInitialDriveForce = extractValue('fInitialDriveForce');
    const fDriveBiasFront = extractValue('fDriveBiasFront');
    const fTractionCurveMax = extractValue('fTractionCurveMax');
    const fTractionCurveMin = extractValue('fTractionCurveMin');
    const fSuspensionForce = extractValue('fSuspensionForce');
    const fBrakeForce = extractValue('fBrakeForce');
    const fTractionLossMult = extractValue('fTractionLossMult');
    const fSuspensionReboundDamp = extractValue('fSuspensionReboundDamp');
    const fSuspensionCompDamp = extractValue('fSuspensionCompDamp');
    const fBrakeBiasFront = extractValue('fBrakeBiasFront');
    const nInitialDriveGears = extractValue('nInitialDriveGears');
    const fDriveInertia = extractValue('fDriveInertia');
    const handlingName = extractString('handlingName');

    if (fMass === null && fInitialDriveForce === null && fTractionCurveMax === null) {
      return { success: false, error: 'Could not find valid handling.meta parameters (<fMass>, <fInitialDriveForce>, etc.) in the provided XML.' };
    }

    const parsedData: Partial<HandlingData> = {};
    if (fMass !== null) parsedData.fMass = fMass;
    if (fInitialDragCoeff !== null) parsedData.fInitialDragCoeff = fInitialDragCoeff;
    if (fInitialDriveForce !== null) parsedData.fInitialDriveForce = fInitialDriveForce;
    if (fDriveBiasFront !== null) parsedData.fDriveBiasFront = fDriveBiasFront;
    if (fTractionCurveMax !== null) parsedData.fTractionCurveMax = fTractionCurveMax;
    if (fTractionCurveMin !== null) parsedData.fTractionCurveMin = fTractionCurveMin;
    if (fSuspensionForce !== null) parsedData.fSuspensionForce = fSuspensionForce;
    if (fBrakeForce !== null) parsedData.fBrakeForce = fBrakeForce;
    if (fTractionLossMult !== null) parsedData.fTractionLossMult = fTractionLossMult;
    if (fSuspensionReboundDamp !== null) parsedData.fSuspensionReboundDamp = fSuspensionReboundDamp;
    if (fSuspensionCompDamp !== null) parsedData.fSuspensionCompDamp = fSuspensionCompDamp;
    if (fBrakeBiasFront !== null) parsedData.fBrakeBiasFront = fBrakeBiasFront;
    if (nInitialDriveGears !== null) parsedData.nInitialDriveGears = Math.round(nInitialDriveGears);
    if (fDriveInertia !== null) parsedData.fDriveInertia = fDriveInertia;

    return {
      success: true,
      data: parsedData,
      vehicleName: handlingName || undefined
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'XML Parsing syntax error.'
    };
  }
}
