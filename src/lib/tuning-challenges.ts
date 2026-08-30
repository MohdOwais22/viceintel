/**
 * @file tuning-challenges.ts
 * Weekly Community Tuning Challenge & Leaderboard Engine
 * Handles Handling.meta physics evaluation, constraint validation, Firestore leaderboard submissions, and cron payouts.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { HandlingData, CalculatedTelemetry, calculateCalculatedStats } from './handling-calculator';

export const ACTIVE_CHALLENGE_DOC_ID = 'weekly_tuning_challenge_active';

export type ChallengeTargetMetric = 'top_speed' | 'quarter_mile' | 'drift_angle';

export interface ChallengeConstraints {
  maxWeight: number;             // in kg (e.g. 1500)
  minWeight?: number;            // in kg (e.g. 1100)
  allowedDrivetrain: 'RWD' | 'AWD' | 'FWD' | 'ANY';
  maxDriveForce?: number;        // e.g. 0.45
  maxBrakeForce?: number;        // e.g. 1.8
  minTractionLossMult?: number;  // for drift specs
}

export type ChallengeDifficultyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface ChallengeDifficultyInfo {
  tier: ChallengeDifficultyTier;
  label: string;
  subtitle: string;
  score: number;
  maxScore: number;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  accentColor: string;
  glowColor: string;
  stars: number; // 1 to 4
  description: string;
  reasons: string[];
}

export interface TuningChallenge {
  id: string;
  title: string;
  description: string;
  baseVehicle: string;
  vehicleSlug: string;
  targetMetric: ChallengeTargetMetric;
  metricLabel: string;
  metricUnit: string;
  constraints: ChallengeConstraints;
  prizeDescription: string;
  rewardVc: number;              // 500 VC for 1st place
  expiresAt: number;             // UTC timestamp
  isActive: boolean;
  winnerUid?: string;
  winnerName?: string;
  winnerScore?: number;
  winnerMetricDisplay?: string;
  winningTuneId?: string;
  totalSubmissions?: number;
  archivedAt?: number;
  handlingData?: any;
}

/**
 * Deterministically evaluates the difficulty tier of a tuning challenge
 * based on constraint strictness, weight tolerances, drivetrain mandates, and target metrics.
 */
export function calculateChallengeDifficulty(challenge: {
  constraints: ChallengeConstraints;
  targetMetric?: ChallengeTargetMetric;
  baseVehicle?: string;
}): ChallengeDifficultyInfo {
  const { constraints, targetMetric } = challenge;
  let score = 0;
  const reasons: string[] = [];

  // 1. Drivetrain Restrictiveness
  if (constraints.allowedDrivetrain === 'FWD') {
    score += 3;
    reasons.push('FWD Drivetrain (High wheelspin & torque-steer management)');
  } else if (constraints.allowedDrivetrain === 'RWD') {
    score += 2;
    reasons.push('RWD Mandate (Requires precise slip angle & throttle balancing)');
  } else if (constraints.allowedDrivetrain === 'AWD') {
    score += 1;
    reasons.push('AWD Power Delivery Regulation');
  }

  // 2. Weight / Mass Boundaries
  const hasMin = typeof constraints.minWeight === 'number' && constraints.minWeight > 0;
  const hasMax = typeof constraints.maxWeight === 'number' && constraints.maxWeight > 0;

  if (hasMin && hasMax) {
    const window = constraints.maxWeight - constraints.minWeight;
    if (window <= 150) {
      score += 3;
      reasons.push(`Ultra-Narrow Mass Window (±${window} kg ballast limit)`);
    } else if (window <= 300) {
      score += 2;
      reasons.push(`Restricted Weight Range (${constraints.minWeight} - ${constraints.maxWeight} kg)`);
    } else {
      score += 1;
      reasons.push(`Weight Envelope Enforced (${constraints.minWeight} - ${constraints.maxWeight} kg)`);
    }
  } else if (hasMax) {
    if (constraints.maxWeight <= 1350) {
      score += 2;
      reasons.push(`Strict Lightweight Mass Ceiling (≤ ${constraints.maxWeight} kg)`);
    } else {
      score += 1;
      reasons.push(`Vehicle Weight Ceiling (≤ ${constraints.maxWeight} kg)`);
    }
  }

  // 3. Drive Force / Power Restriction
  if (typeof constraints.maxDriveForce === 'number') {
    if (constraints.maxDriveForce <= 0.38) {
      score += 3;
      reasons.push(`Restricted Engine Output Ceiling (fInitialDriveForce ≤ ${constraints.maxDriveForce})`);
    } else if (constraints.maxDriveForce <= 0.48) {
      score += 2;
      reasons.push(`Homologated Drive Force Limit (≤ ${constraints.maxDriveForce})`);
    } else {
      score += 1;
      reasons.push(`Drive Force Ceiling (≤ ${constraints.maxDriveForce})`);
    }
  }

  // 4. Brake Force / Traction Limits
  if (typeof constraints.maxBrakeForce === 'number') {
    score += 1;
    reasons.push(`Braking Authority Capped (≤ ${constraints.maxBrakeForce})`);
  }
  if (typeof constraints.minTractionLossMult === 'number') {
    score += 1;
    reasons.push(`Traction Loss Multiplier Mandate`);
  }

  // 5. Target Metric Inherent Difficulty
  if (targetMetric === 'drift_angle') {
    score += 2;
    reasons.push('Drift & Slip Physics Scoring');
  } else if (targetMetric === 'quarter_mile') {
    score += 1;
    reasons.push('Sub-second 1/4 Mile Launch Precision');
  }

  // Tier categorization
  if (score >= 7) {
    return {
      tier: 'Platinum',
      label: 'Platinum Tier',
      subtitle: 'Masterclass Precision',
      score,
      maxScore: 10,
      badgeBg: 'bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-fuchsia-500/20',
      badgeBorder: 'border-cyan-400/50',
      textColor: 'text-cyan-200',
      accentColor: '#38bdf8',
      glowColor: 'shadow-[0_0_20px_rgba(56,189,248,0.35)]',
      stars: 4,
      description: 'Extremely restrictive physics regulations requiring razor-thin weight matching, power management, and advanced handling geometry.',
      reasons
    };
  }

  if (score >= 5) {
    return {
      tier: 'Gold',
      label: 'Gold Tier',
      subtitle: 'Advanced Homologation',
      score,
      maxScore: 10,
      badgeBg: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20',
      badgeBorder: 'border-amber-400/50',
      textColor: 'text-amber-300',
      accentColor: '#f59e0b',
      glowColor: 'shadow-[0_0_18px_rgba(245,158,11,0.3)]',
      stars: 3,
      description: 'Strict competition rules with tight drivetrain homologation, power ceilings, and bounded weight envelopes.',
      reasons
    };
  }

  if (score >= 3) {
    return {
      tier: 'Silver',
      label: 'Silver Tier',
      subtitle: 'Intermediate Spec',
      score,
      maxScore: 10,
      badgeBg: 'bg-gradient-to-r from-slate-400/20 via-zinc-400/20 to-slate-300/20',
      badgeBorder: 'border-slate-400/50',
      textColor: 'text-slate-200',
      accentColor: '#cbd5e1',
      glowColor: 'shadow-[0_0_15px_rgba(203,213,225,0.25)]',
      stars: 2,
      description: 'Moderate constraints requiring deliberate component tuning and aerodynamic balance to gain competitive advantage.',
      reasons
    };
  }

  return {
    tier: 'Bronze',
    label: 'Bronze Tier',
    subtitle: 'Standard / Open Reg',
    score: Math.max(1, score),
    maxScore: 10,
    badgeBg: 'bg-gradient-to-r from-amber-900/30 via-orange-900/25 to-amber-800/30',
    badgeBorder: 'border-amber-700/50',
    textColor: 'text-amber-400',
    accentColor: '#d97706',
    glowColor: 'shadow-[0_0_12px_rgba(217,119,6,0.2)]',
    stars: 1,
    description: 'Open regulation format with forgiving boundaries. Ideal for testing baseline handling setups and entry-level tuning.',
    reasons
  };
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userUid: string;
  userName: string;
  userAvatar?: string;
  userLevel?: string;
  isVip?: boolean;
  handlingData: HandlingData;
  telemetry: CalculatedTelemetry;
  metricValue: number;           // Raw numerical value for sorting
  metricDisplay: string;         // e.g. "214.6 MPH" or "9.84s" or "92°"
  calculatedScore: number;       // Normalized 0-1000 score
  passedConstraints: boolean;
  constraintViolations: string[];
  buildTitle: string;
  submittedAt: number;
  rank?: number;
}

// Preset weekly rotation challenges
export const ROTATION_CHALLENGES: Omit<TuningChallenge, 'id' | 'expiresAt' | 'isActive'>[] = [
  {
    title: 'Vice Beach Top Speed Showdown',
    description: 'Optimize the Grotti Furia for absolute maximum velocity down the Ocean Drive straightaway under strict weight and naturally aspirated drag limits.',
    baseVehicle: 'Grotti Furia V12',
    vehicleSlug: 'grotti-furia',
    targetMetric: 'top_speed',
    metricLabel: 'Top Speed',
    metricUnit: 'MPH',
    constraints: {
      maxWeight: 1450,
      minWeight: 1200,
      allowedDrivetrain: 'RWD',
      maxDriveForce: 0.48
    },
    prizeDescription: '500 VC Cash + "Master Tuner" Exclusive Profile Badge + Featured Homepage Build',
    rewardVc: 500
  },
  {
    title: 'Downtown Alleyway Drift King',
    description: 'Engineer the ultimate snap-oversteer drift balance for the Declasse Drift Tampa. Maximize slip angle while maintaining throttle controllability.',
    baseVehicle: 'Declasse Drift Tampa Spec-D',
    vehicleSlug: 'declasse-drift-tampa',
    targetMetric: 'drift_angle',
    metricLabel: 'Drift Score & Slip Angle',
    metricUnit: 'PTS',
    constraints: {
      maxWeight: 1350,
      allowedDrivetrain: 'RWD',
      maxBrakeForce: 1.6
    },
    prizeDescription: '500 VC Cash + "Master Tuner" Exclusive Profile Badge + Featured Homepage Build',
    rewardVc: 500
  },
  {
    title: 'Everglades Strip Quarter-Mile Drag',
    description: 'Dial in gear ratios, launch grip, and torque curves for the Bravado Banshee GTS to set the fastest 1/4 mile ET in Leonida history.',
    baseVehicle: 'Bravado Banshee GTS',
    vehicleSlug: 'bravado-banshee-900r',
    targetMetric: 'quarter_mile',
    metricLabel: '1/4 Mile ET',
    metricUnit: 'Seconds',
    constraints: {
      maxWeight: 1550,
      allowedDrivetrain: 'ANY',
      maxDriveForce: 0.52
    },
    prizeDescription: '500 VC Cash + "Master Tuner" Exclusive Profile Badge + Featured Homepage Build',
    rewardVc: 500
  }
];

/**
 * Calculates next Sunday midnight UTC timestamp
 */
export function getNextSundayMidnightUtc(): number {
  const now = new Date();
  const day = now.getUTCDay(); // 0 is Sunday
  const daysUntilSunday = (7 - day) % 7 || 7;
  const target = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSunday,
    23, 59, 59, 999
  ));
  return target.getTime();
}

/**
 * Validates a handling configuration against challenge constraints and computes target score
 */
export function evaluateTuneForChallenge(
  challenge: TuningChallenge,
  data: HandlingData
): {
  isValid: boolean;
  violations: string[];
  telemetry: CalculatedTelemetry;
  metricValue: number;
  metricDisplay: string;
  score: number;
} {
  const telemetry = calculateCalculatedStats(data);
  const violations: string[] = [];
  const c = challenge.constraints;

  // 1. Weight constraint
  if (c.maxWeight && data.fMass > c.maxWeight) {
    violations.push(`Mass exceeds limit: ${data.fMass} kg (Max allowed: ${c.maxWeight} kg)`);
  }
  if (c.minWeight && data.fMass < c.minWeight) {
    violations.push(`Mass below limit: ${data.fMass} kg (Min allowed: ${c.minWeight} kg)`);
  }

  // 2. Drivetrain constraint
  if (c.allowedDrivetrain === 'RWD' && data.fDriveBiasFront > 0.05) {
    violations.push(`Drivetrain must be 100% RWD (Current front bias: ${Math.round(data.fDriveBiasFront * 100)}%)`);
  } else if (c.allowedDrivetrain === 'FWD' && data.fDriveBiasFront < 0.95) {
    violations.push(`Drivetrain must be 100% FWD (Current front bias: ${Math.round(data.fDriveBiasFront * 100)}%)`);
  } else if (c.allowedDrivetrain === 'AWD' && (data.fDriveBiasFront <= 0.05 || data.fDriveBiasFront >= 0.95)) {
    violations.push(`Drivetrain must be AWD with torque split between front and rear.`);
  }

  // 3. Drive force cap
  if (c.maxDriveForce && data.fInitialDriveForce > c.maxDriveForce) {
    violations.push(`Drive Force ${data.fInitialDriveForce.toFixed(3)} exceeds restriction cap of ${c.maxDriveForce}`);
  }

  // 4. Brake force cap
  if (c.maxBrakeForce && data.fBrakeForce > c.maxBrakeForce) {
    violations.push(`Brake Force ${data.fBrakeForce.toFixed(2)} exceeds restriction cap of ${c.maxBrakeForce}`);
  }

  const isValid = violations.length === 0;

  // Compute metric & score based on target
  let metricValue = 0;
  let metricDisplay = '';
  let score = 0;

  if (challenge.targetMetric === 'top_speed') {
    metricValue = telemetry.estimatedTopSpeedMph;
    metricDisplay = `${metricValue} MPH`;
    score = Math.round(metricValue * 4.5); // e.g. 210 mph -> 945 pts
  } else if (challenge.targetMetric === 'quarter_mile') {
    metricValue = telemetry.quarterMileSec;
    metricDisplay = `${metricValue}s`;
    // Lower quarter mile time = higher score (e.g. 9.5s -> 950 pts)
    score = Math.max(100, Math.round((16.0 - metricValue) * 125));
  } else if (challenge.targetMetric === 'drift_angle') {
    metricValue = telemetry.driftTendencyScore;
    metricDisplay = `${metricValue} PTS`;
    score = Math.round(metricValue * 9.5); // e.g. 95 pts -> 902 pts
  }

  return {
    isValid,
    violations,
    telemetry,
    metricValue,
    metricDisplay,
    score
  };
}

/**
 * Fetches the currently active community tuning challenge (or bootstraps a default one)
 */
export async function getActiveTuningChallenge(): Promise<TuningChallenge> {
  const challengeId = 'weekly_tuning_challenge_active';
  const docRef = doc(db, 'tuning_challenges', challengeId);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as TuningChallenge;
      // Check if expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        // Active challenge expired, cycle to next
        return await cycleToNextChallenge(data);
      }
      return data;
    }
  } catch (err) {
    console.warn('[Tuning Challenge] getActiveChallenge notice:', err);
  }

  // Bootstrap initial active challenge
  const template = ROTATION_CHALLENGES[0];
  const initialChallenge: TuningChallenge = {
    ...template,
    id: challengeId,
    expiresAt: getNextSundayMidnightUtc(),
    isActive: true,
    totalSubmissions: 0
  };

  try {
    await setDoc(docRef, initialChallenge);
  } catch (e) {
    console.warn('[Tuning Challenge] Seed fallback notice:', e);
  }

  return initialChallenge;
}

/**
 * Cycles to the next challenge in rotation after previous one closes
 */
export async function cycleToNextChallenge(prevChallenge?: TuningChallenge): Promise<TuningChallenge> {
  const challengeId = 'weekly_tuning_challenge_active';
  const docRef = doc(db, 'tuning_challenges', challengeId);

  const prevIndex = ROTATION_CHALLENGES.findIndex(c => c.title === prevChallenge?.title);
  const nextIndex = (prevIndex + 1) % ROTATION_CHALLENGES.length;
  const template = ROTATION_CHALLENGES[nextIndex];

  const nextChallenge: TuningChallenge = {
    ...template,
    id: challengeId,
    expiresAt: getNextSundayMidnightUtc(),
    isActive: true,
    totalSubmissions: 0
  };

  await setDoc(docRef, nextChallenge);
  return nextChallenge;
}

function sanitizeFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as unknown as T;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestore(item)).filter(item => item !== undefined) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = sanitizeFirestore(value);
    }
  }
  return result as T;
}

/**
 * Submits a tuning configuration to the active challenge leaderboard
 */
export async function submitChallengeTune(
  challenge: TuningChallenge,
  user: {
    uid: string;
    displayName: string;
    avatar?: string | null;
    isVip?: boolean;
    clearanceLevel?: string;
  },
  handlingData: HandlingData,
  buildTitle: string
): Promise<ChallengeEntry> {
  const evaluation = evaluateTuneForChallenge(challenge, handlingData);

  if (!evaluation.isValid) {
    throw new Error(`Constraint Violation: ${evaluation.violations.join(', ')}`);
  }

  const entryId = `${challenge.id}_${user.uid}`;
  const entryRef = doc(db, 'challenge_entries', entryId);

  const entry: ChallengeEntry = {
    id: entryId,
    challengeId: challenge.id,
    userUid: user.uid,
    userName: user.displayName || 'Vice Tuner',
    userAvatar: user.avatar || '',
    userLevel: user.clearanceLevel || (user.isVip ? 'L2 VIP' : 'L1 Citizen'),
    isVip: user.isVip || false,
    handlingData,
    telemetry: evaluation.telemetry,
    metricValue: evaluation.metricValue,
    metricDisplay: evaluation.metricDisplay,
    calculatedScore: evaluation.score,
    passedConstraints: true,
    constraintViolations: [],
    buildTitle: buildTitle || `${user.displayName || 'Vice Tuner'}'s ${challenge.baseVehicle} Spec`,
    submittedAt: Date.now()
  };

  const sanitizedEntry = sanitizeFirestore(entry);
  await setDoc(entryRef, sanitizedEntry);

  // Update submission counter on challenge doc
  try {
    const challengeRef = doc(db, 'tuning_challenges', challenge.id);
    await updateDoc(challengeRef, {
      totalSubmissions: increment(1)
    });
  } catch (e) {
    // Ignore counter update error
  }

  return entry;
}

/**
 * Deterministically sorts challenge entries based on target metric and tie-break rule:
 * Primary: Best metric value (lowest ET for quarter_mile, highest top_speed/drift_angle).
 * Secondary (Tie-Breaker): If two submissions have the same score/metricValue, the entry submitted earlier in the week (lower submittedAt timestamp) takes the higher rank (lower rank number).
 */
export function sortChallengeEntriesWithTieBreaker(
  entries: ChallengeEntry[],
  targetMetric: ChallengeTargetMetric
): ChallengeEntry[] {
  return [...entries].sort((a, b) => {
    const isQuarterMile = targetMetric === 'quarter_mile';
    const diff = isQuarterMile
      ? (a.metricValue - b.metricValue)
      : (b.metricValue - a.metricValue);

    // If scores/metric values differ significantly (beyond floating point epsilon)
    if (Math.abs(diff) > 0.00001) {
      return diff;
    }

    // Tie-break rule: Earlier submission timestamp takes the higher rank (lower index)
    const timeA = a.submittedAt || 0;
    const timeB = b.submittedAt || 0;
    return timeA - timeB;
  });
}

/**
 * Subscribes to live leaderboard entries for the active challenge
 */
export function subscribeToChallengeLeaderboard(
  challengeId: string,
  targetMetric: ChallengeTargetMetric,
  onUpdate: (entries: ChallengeEntry[]) => void,
  onError?: (err: any) => void
): () => void {
  const entriesRef = collection(db, 'challenge_entries');
  // For top_speed and drift_angle: descending. For quarter_mile: ascending (lower is faster)
  const sortDirection = targetMetric === 'quarter_mile' ? 'asc' : 'desc';
  const q = query(
    entriesRef,
    where('challengeId', '==', challengeId),
    orderBy('metricValue', sortDirection),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rawEntries: ChallengeEntry[] = [];
      snapshot.forEach((docSnap) => {
        rawEntries.push(docSnap.data() as ChallengeEntry);
      });
      // Apply exact tie-breaker sorting: earlier submittedAt wins on identical metric
      const sorted = sortChallengeEntriesWithTieBreaker(rawEntries, targetMetric);
      const rankedEntries = sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
      onUpdate(rankedEntries);
    },
    (err) => {
      console.warn('[Leaderboard] snapshot notice, falling back to manual fetch:', err);
      // Fallback in case composite index is still indexing
      getDocs(collection(db, 'challenge_entries'))
        .then((snap) => {
          let list: ChallengeEntry[] = [];
          snap.forEach((d) => {
            const data = d.data() as ChallengeEntry;
            if (data.challengeId === challengeId) list.push(data);
          });
          const sorted = sortChallengeEntriesWithTieBreaker(list, targetMetric);
          const ranked = sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
          onUpdate(ranked);
        })
        .catch(e => {
          if (onError) onError(e);
        });
    }
  );
}

/**
 * Administrative Helpers for Challenges No-Code CMS
 */

/**
 * Fetches all active, upcoming, and past challenges from Firestore
 */
export async function fetchAllAdminChallenges(): Promise<{
  activeChallenge: TuningChallenge | null;
  allChallenges: TuningChallenge[];
  pastChallenges: TuningChallenge[];
}> {
  try {
    const activeRef = doc(db, 'tuning_challenges', ACTIVE_CHALLENGE_DOC_ID);
    const activeSnap = await getDoc(activeRef);
    let activeChallenge: TuningChallenge | null = null;
    if (activeSnap.exists()) {
      activeChallenge = activeSnap.data() as TuningChallenge;
    }

    const allChallengesSnap = await getDocs(collection(db, 'tuning_challenges'));
    const allChallenges: TuningChallenge[] = [];
    allChallengesSnap.forEach(d => {
      allChallenges.push(d.data() as TuningChallenge);
    });

    const pastSnap = await getDocs(collection(db, 'past_challenges'));
    const pastChallenges: TuningChallenge[] = [];
    pastSnap.forEach(d => {
      pastChallenges.push(d.data() as TuningChallenge);
    });

    return { activeChallenge, allChallenges, pastChallenges };
  } catch (err) {
    console.error('Error fetching admin challenges:', err);
    return { activeChallenge: null, allChallenges: [], pastChallenges: [] };
  }
}

/**
 * Clears all leaderboard entries for a specific challenge ID
 */
export async function clearChallengeEntries(challengeId: string): Promise<void> {
  try {
    const entriesRef = collection(db, 'challenge_entries');
    const snap = await getDocs(entriesRef);
    const deletePromises: Promise<void>[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.challengeId === challengeId) {
        deletePromises.push(deleteDoc(d.ref));
      }
    });
    await Promise.all(deletePromises);
  } catch (err) {
    console.error('Failed to clear challenge entries:', err);
  }
}

/**
 * Saves a new or updated challenge to Firestore
 */
export async function saveAdminChallenge(
  challenge: Partial<TuningChallenge> & { id: string; title: string },
  setAsActive: boolean = false
): Promise<TuningChallenge> {
  const challengeId = challenge.id;
  const challengeRef = doc(db, 'tuning_challenges', challengeId);

  const fullChallenge: TuningChallenge = {
    id: challengeId,
    title: challenge.title,
    description: challenge.description || 'Weekly handling.meta physics challenge.',
    baseVehicle: challenge.baseVehicle || 'Grotti Furia V12',
    vehicleSlug: challenge.vehicleSlug || 'grotti-furia',
    targetMetric: challenge.targetMetric || 'top_speed',
    metricLabel: challenge.metricLabel || 'Top Speed',
    metricUnit: challenge.metricUnit || 'MPH',
    constraints: challenge.constraints || {
      maxWeight: 1500,
      allowedDrivetrain: 'RWD',
      maxDriveForce: 0.48
    },
    prizeDescription: challenge.prizeDescription || '500 VC Cash + "Master Tuner" Exclusive Profile Badge',
    rewardVc: typeof challenge.rewardVc === 'number' ? challenge.rewardVc : 500,
    expiresAt: challenge.expiresAt || (Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: setAsActive || challenge.isActive || false,
    totalSubmissions: challenge.totalSubmissions || 0
  };

  const sanitized = sanitizeFirestore(fullChallenge);
  await setDoc(challengeRef, sanitized, { merge: true });

  if (setAsActive) {
    const activeDocRef = doc(db, 'tuning_challenges', ACTIVE_CHALLENGE_DOC_ID);
    
    // Check if the current active challenge has a different vehicle or metric
    try {
      const activeSnap = await getDoc(activeDocRef);
      if (activeSnap.exists()) {
        const activeData = activeSnap.data() as TuningChallenge;
        if (
          activeData.baseVehicle !== fullChallenge.baseVehicle ||
          activeData.targetMetric !== fullChallenge.targetMetric ||
          activeData.title !== fullChallenge.title
        ) {
          await clearChallengeEntries(ACTIVE_CHALLENGE_DOC_ID);
          if (activeData.id) {
            await clearChallengeEntries(activeData.id);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to clear previous entries during active update:', e);
    }

    await setDoc(activeDocRef, sanitized);
  }

  return fullChallenge;
}

/**
 * Sets a specific challenge as the active challenge in Firestore
 */
export async function setActiveAdminChallenge(challenge: TuningChallenge): Promise<void> {
  const activeDocRef = doc(db, 'tuning_challenges', ACTIVE_CHALLENGE_DOC_ID);

  // Clear previous entries associated with both the active doc placeholder and the new challenge ID to avoid stale telemetry
  try {
    const activeSnap = await getDoc(activeDocRef);
    if (activeSnap.exists()) {
      const activeData = activeSnap.data() as TuningChallenge;
      await clearChallengeEntries(ACTIVE_CHALLENGE_DOC_ID);
      if (activeData.id) {
        await clearChallengeEntries(activeData.id);
      }
    }
  } catch (e) {
    console.warn('Failed to clear old active challenge entries:', e);
  }

  await clearChallengeEntries(challenge.id);

  const updatedChallenge = { ...challenge, isActive: true };
  const sanitized = sanitizeFirestore(updatedChallenge);
  await setDoc(activeDocRef, sanitized);

  // Update source doc as well
  const srcRef = doc(db, 'tuning_challenges', challenge.id);
  await setDoc(srcRef, { isActive: true }, { merge: true });
}

/**
 * Deletes a challenge and optionally its entries from Firestore
 */
export async function deleteAdminChallenge(challengeId: string): Promise<void> {
  const challengeRef = doc(db, 'tuning_challenges', challengeId);
  await deleteDoc(challengeRef);

  // If was active, also remove from past_challenges or clean active doc if ID matches
  try {
    const pastRef = doc(db, 'past_challenges', challengeId);
    await deleteDoc(pastRef);
  } catch (e) {
    // Ignore
  }
}

/**
 * Disqualifies / deletes a single leaderboard entry
 */
export async function disqualifyChallengeEntry(entryId: string): Promise<void> {
  const entryRef = doc(db, 'challenge_entries', entryId);
  await deleteDoc(entryRef);
}

/**
 * Awards manual bonus VC credits to a user profile in Firestore
 */
export async function awardManualBonusVc(userUid: string, amount: number, reason: string): Promise<void> {
  const userRef = doc(db, 'userProfiles', userUid);
  await updateDoc(userRef, {
    vcBalance: increment(amount),
    lastRewardReason: reason,
    lastRewardedAt: Date.now()
  });
}

