/**
 * Centralized Environment Health & Pre-Build Diagnostic Validator
 * Validates critical .env configuration existence, format sanity, and Firebase connectivity
 * before and during the production build & deployment process.
 */

import { ENV } from './envConfig';
import { Firestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export type HealthSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'OPTIONAL';
export type CheckStatus = 'VALID' | 'WARNING' | 'MISSING' | 'INVALID_FORMAT' | 'CHECKING';

export interface EnvVariableSpec {
  key: string;
  scope: 'CLIENT' | 'SERVER';
  category: 'AI & LLM' | 'Payments & Monetization' | 'Security & Passkeys' | 'Firebase & Database' | 'Discord & Gateway' | 'SEO & Spider' | 'Network & General';
  severity: HealthSeverity;
  description: string;
  examplePattern: string;
  isSecret: boolean;
  docLink?: string;
  validator?: (value: string | undefined) => { valid: boolean; reason?: string };
}

export interface EnvCheckResult {
  key: string;
  scope: 'CLIENT' | 'SERVER';
  category: string;
  severity: HealthSeverity;
  status: CheckStatus;
  isConfigured: boolean;
  valuePreview: string; // Masked for secrets
  description: string;
  message: string;
  remediation?: string;
}

export interface FirebaseHealthResult {
  status: CheckStatus;
  connected: boolean;
  databaseId: string;
  projectId: string;
  authReady: boolean;
  roundtripLatencyMs: number;
  collectionsPinged: { name: string; accessible: boolean; countPreview?: number; latencyMs?: number }[];
  errorMessage?: string;
  timestamp: string;
}

export interface SystemPreBuildIntegrity {
  nodeEnv: string;
  port: number;
  isProductionReady: boolean;
  score: number; // 0 to 100
  totalChecks: number;
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  overallStatus: 'OPERATIONAL' | 'WARNING' | 'CRITICAL';
  verdict: 'READY_FOR_DEPLOYMENT' | 'ACTION_RECOMMENDED' | 'CRITICAL_BLOCKER';
  generatedAt: string;
}

export interface FullDiagnosticReport {
  integrity: SystemPreBuildIntegrity;
  clientChecks: EnvCheckResult[];
  serverChecks: EnvCheckResult[];
  firebase: FirebaseHealthResult;
  diagnosticLogs: string[];
}

/**
 * Registry of all recognized and required environment variables for ViceIntel
 */
export const CRITICAL_ENV_SPECS: EnvVariableSpec[] = [
  // 1. AI & LLM (Server)
  {
    key: 'GEMINI_API_KEY',
    scope: 'SERVER',
    category: 'AI & LLM',
    severity: 'CRITICAL',
    description: 'Server-side API key powering Gemini 3.7 Flash AI Tactical Advisor & pSEO News spider engine.',
    examplePattern: 'AIzaSy...',
    isSecret: true,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'Key is missing in server environment.' };
      if (!val.startsWith('AIza')) return { valid: false, reason: 'Format anomaly: Google Gemini keys typically start with "AIza".' };
      if (val.length < 20) return { valid: false, reason: 'Key appears unusually short.' };
      return { valid: true };
    }
  },

  // 2. Payments & Monetization (Server)
  {
    key: 'STRIPE_SECRET_KEY',
    scope: 'SERVER',
    category: 'Payments & Monetization',
    severity: 'HIGH',
    description: 'Stripe API secret key required for VIP monthly pass checkouts and B2B sponsor payments.',
    examplePattern: 'sk_test_... or sk_live_...',
    isSecret: true,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'Stripe secret key missing. Payments will be simulated/disabled.' };
      if (!val.startsWith('sk_')) return { valid: false, reason: 'Format anomaly: Stripe secret keys begin with "sk_test_" or "sk_live_".' };
      return { valid: true };
    }
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    scope: 'SERVER',
    category: 'Payments & Monetization',
    severity: 'HIGH',
    description: 'Stripe Webhook signing secret used to verify automated checkout fulfillment signatures.',
    examplePattern: 'whsec_...',
    isSecret: true,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'Webhook signing secret missing; webhooks cannot be cryptographically verified.' };
      if (!val.startsWith('whsec_')) return { valid: false, reason: 'Format anomaly: Stripe webhook secrets begin with "whsec_".' };
      return { valid: true };
    }
  },

  // 3. Security & Passkeys (Server & Client)
  {
    key: 'CRON_SECRET_KEY',
    scope: 'SERVER',
    category: 'Security & Passkeys',
    severity: 'CRITICAL',
    description: 'Authentication token securing midnight news crawler and automated challenge payout webhooks.',
    examplePattern: 'vice_midnight_cron_secret_2026',
    isSecret: true,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'CRON_SECRET_KEY missing. Automated cron endpoints will be unprotected.' };
      if (val.length < 8) return { valid: false, reason: 'Passkey length is too short for production.' };
      return { valid: true };
    }
  },
  {
    key: 'ADMIN_PASSKEY',
    scope: 'CLIENT',
    category: 'Security & Passkeys',
    severity: 'CRITICAL',
    description: 'Admin HQ authentication passkey protecting Level 4 Clearance privileges.',
    examplePattern: 'VICE2026_L4',
    isSecret: true,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'Admin passkey is empty.' };
      if (val.length < 6) return { valid: false, reason: 'Admin passkey is too weak.' };
      return { valid: true };
    }
  },
  {
    key: 'STAFF_PASSKEY',
    scope: 'CLIENT',
    category: 'Security & Passkeys',
    severity: 'HIGH',
    description: 'Staff HQ authentication passkey protecting Level 3 Moderator actions.',
    examplePattern: 'VICE2026_L3',
    isSecret: true,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'Staff passkey is empty.' };
      return { valid: true };
    }
  },

  // 4. Client Public Configuration
  {
    key: 'APP_NAME',
    scope: 'CLIENT',
    category: 'Network & General',
    severity: 'HIGH',
    description: 'Application branding title displayed in page headers, open-graph metadata, and system prompts.',
    examplePattern: 'GTA VI Central',
    isSecret: false,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'App name is not configured.' };
      return { valid: true };
    }
  },
  {
    key: 'APP_URL',
    scope: 'CLIENT',
    category: 'Network & General',
    severity: 'HIGH',
    description: 'Public base deployment URL used for canonical links, sitemaps, and shareable build links.',
    examplePattern: 'https://ais-dev-...run.app or https://viceintel.app',
    isSecret: false,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'Base URL missing. Falling back to window.location.origin.' };
      if (!val.startsWith('http')) return { valid: false, reason: 'Base URL must start with http:// or https://.' };
      return { valid: true };
    }
  },
  {
    key: 'GA_MEASUREMENT_ID',
    scope: 'CLIENT',
    category: 'Network & General',
    severity: 'MEDIUM',
    description: 'Google Analytics 4 measurement ID for privacy-compliant telemetry and traffic tracking.',
    examplePattern: 'G-VICE2026INTEL',
    isSecret: false,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'GA ID missing. Analytics will be deactivated.' };
      if (!val.startsWith('G-')) return { valid: false, reason: 'GA4 Measurement IDs usually start with "G-".' };
      return { valid: true };
    }
  },
  {
    key: 'VIP_PRICE',
    scope: 'CLIENT',
    category: 'Payments & Monetization',
    severity: 'MEDIUM',
    description: 'B2C monthly VIP subscription price in USD.',
    examplePattern: '3.99',
    isSecret: false,
    validator: (val) => {
      const num = parseFloat(val || '');
      if (isNaN(num) || num <= 0) return { valid: false, reason: 'VIP price must be a valid positive number.' };
      return { valid: true };
    }
  },
  {
    key: 'B2B_SPONSOR_PRICE',
    scope: 'CLIENT',
    category: 'Payments & Monetization',
    severity: 'MEDIUM',
    description: 'B2B FiveM Server Directory top spotlight sponsor price per month in USD.',
    examplePattern: '49.00',
    isSecret: false,
    validator: (val) => {
      const num = parseFloat(val || '');
      if (isNaN(num) || num <= 0) return { valid: false, reason: 'Sponsor price must be a valid positive number.' };
      return { valid: true };
    }
  },

  // 5. Discord & Gateway (Server & Client)
  {
    key: 'DISCORD_CLIENT_ID',
    scope: 'CLIENT',
    category: 'Discord & Gateway',
    severity: 'HIGH',
    description: 'Discord application client ID for OAuth2 identity verification and server bot linking.',
    examplePattern: '1540025117470621759',
    isSecret: false,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'Discord client ID missing.' };
      if (!/^\d{17,20}$/.test(val)) return { valid: false, reason: 'Discord snowflake IDs must be 17-20 digits.' };
      return { valid: true };
    }
  },
  {
    key: 'DISCORD_CLIENT_SECRET',
    scope: 'SERVER',
    category: 'Discord & Gateway',
    severity: 'HIGH',
    description: 'Discord OAuth2 client secret for server-side authorization code token exchange.',
    examplePattern: 'k9s8d7...',
    isSecret: true,
    validator: (val) => {
      if (!val || val.trim() === '') return { valid: false, reason: 'Discord client secret missing. OAuth code exchange will fail.' };
      return { valid: true };
    }
  },

  // 6. Midnight Spider & SEO
  {
    key: 'AUTO_PSEO_ENABLED',
    scope: 'SERVER',
    category: 'SEO & Spider',
    severity: 'MEDIUM',
    description: 'Controls automated midnight background news scraping and programmatic SEO generation.',
    examplePattern: 'true',
    isSecret: false,
    validator: (val) => {
      if (val !== 'true' && val !== 'false' && val !== undefined) {
        return { valid: false, reason: 'Must be "true" or "false".' };
      }
      return { valid: true };
    }
  },
  {
    key: 'NEWS_SEARCH_QUERY',
    scope: 'SERVER',
    category: 'SEO & Spider',
    severity: 'OPTIONAL',
    description: 'Search keyword query used by Gemini grounding spider during midnight news compilation.',
    examplePattern: 'GTA 6 Rockstar Games Vice City news leaks updates',
    isSecret: false,
  }
];

/**
 * Mask secret string for safe dashboard display
 */
export function maskSecretValue(val: string | undefined): string {
  if (!val || val.trim() === '') return '(empty)';
  if (val.length <= 6) return '****';
  const prefix = val.substring(0, Math.min(6, Math.floor(val.length / 3)));
  return `${prefix}...**** (${val.length} chars)`;
}

/**
 * Validate Client-Side Environment Variables
 */
export function validateClientEnvironment(): EnvCheckResult[] {
  const clientSpecs = CRITICAL_ENV_SPECS.filter((spec) => spec.scope === 'CLIENT');
  const results: EnvCheckResult[] = [];

  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

  for (const spec of clientSpecs) {
    let rawVal: string | undefined = metaEnv[spec.key];

    // Fallbacks mapped through ENV helper
    if (!rawVal) {
      if (spec.key === 'APP_NAME') rawVal = ENV.APP_NAME;
      else if (spec.key === 'APP_URL') rawVal = ENV.APP_URL;
      else if (spec.key === 'GA_MEASUREMENT_ID') rawVal = ENV.GA_MEASUREMENT_ID;
      else if (spec.key === 'ADMIN_PASSKEY') rawVal = ENV.ADMIN_PASSKEY;
      else if (spec.key === 'STAFF_PASSKEY') rawVal = ENV.STAFF_PASSKEY;
      else if (spec.key === 'VIP_PRICE') rawVal = String(ENV.VIP_PRICE);
      else if (spec.key === 'B2B_SPONSOR_PRICE') rawVal = String(ENV.B2B_SPONSOR_PRICE);
      else if (spec.key === 'DISCORD_CLIENT_ID') rawVal = ENV.DISCORD_CLIENT_ID;
    }

    const isConfigured = rawVal !== undefined && rawVal !== '';
    let status: CheckStatus = isConfigured ? 'VALID' : 'MISSING';
    let message = isConfigured ? 'Configuration validated successfully.' : 'Variable is missing in client bundle.';
    let remediation: string | undefined;

    if (isConfigured && spec.validator) {
      const validation = spec.validator(rawVal);
      if (!validation.valid) {
        status = spec.severity === 'CRITICAL' ? 'MISSING' : 'WARNING';
        message = validation.reason || 'Validation warning.';
        remediation = `Ensure ${spec.key} is defined in your environment secrets matching format: ${spec.examplePattern}`;
      }
    } else if (!isConfigured) {
      status = spec.severity === 'CRITICAL' ? 'MISSING' : 'WARNING';
      remediation = `Add "${spec.key}=${spec.examplePattern}" to your environment or .env.local.`;
    }

    results.push({
      key: spec.key,
      scope: 'CLIENT',
      category: spec.category,
      severity: spec.severity,
      status,
      isConfigured,
      valuePreview: spec.isSecret ? maskSecretValue(rawVal) : (rawVal || '(not set)'),
      description: spec.description,
      message,
      remediation
    });
  }

  return results;
}

/**
 * Fetch and validate Server-Side Environment Variables via Backend API
 */
export async function fetchServerEnvHealth(adminPasskey?: string): Promise<{
  success: boolean;
  serverChecks: EnvCheckResult[];
  serverInfo?: {
    nodeVersion: string;
    uptimeSeconds: number;
    memoryMb: number;
    port: number;
    nodeEnv: string;
  };
  error?: string;
}> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (adminPasskey) {
      headers['x-admin-passkey'] = adminPasskey;
    }

    const res = await fetch('/api/admin/env-health', {
      method: 'GET',
      headers
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Server health check returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      success: true,
      serverChecks: data.serverChecks || [],
      serverInfo: data.serverInfo
    };
  } catch (err: any) {
    // Return graceful fallback if backend is unreachable or local development
    return {
      success: false,
      serverChecks: CRITICAL_ENV_SPECS.filter((s) => s.scope === 'SERVER').map((spec) => ({
        key: spec.key,
        scope: 'SERVER',
        category: spec.category,
        severity: spec.severity,
        status: 'WARNING' as CheckStatus,
        isConfigured: false,
        valuePreview: '(server audit pending)',
        description: spec.description,
        message: `Could not query backend API: ${err?.message || 'Network timeout'}`,
        remediation: 'Ensure backend server is running on port 3000.'
      })),
      error: err?.message || 'Failed to connect to backend server'
    };
  }
}

/**
 * Live Firestore Database & Auth Roundtrip Connectivity Probe
 */
export async function probeFirebaseHealth(firestoreDb: Firestore, firebaseAuth: Auth): Promise<FirebaseHealthResult> {
  const startTime = performance.now();
  const collectionsToTest = ['userProfiles', 'customChannels', 'serverWhitelistForms', 'vehicle_tuning_builds'];
  const collectionsPinged: { name: string; accessible: boolean; countPreview?: number; latencyMs?: number }[] = [];
  let isConnected = false;
  let errorMessage: string | undefined;

  try {
    // 1. Primary probe: Query userProfiles with limit(1) to test read access and measure roundtrip latency
    const colRef = collection(firestoreDb, 'userProfiles');
    const q = query(colRef, limit(1));
    const snapshot = await getDocs(q);
    const roundtripMs = Math.round(performance.now() - startTime);
    isConnected = true;

    collectionsPinged.push({
      name: 'userProfiles',
      accessible: true,
      countPreview: snapshot.size,
      latencyMs: roundtripMs
    });

    // 2. Secondary probes
    for (const colName of collectionsToTest.slice(1)) {
      try {
        const subStart = performance.now();
        const subRef = collection(firestoreDb, colName);
        const subSnap = await getDocs(query(subRef, limit(1)));
        collectionsPinged.push({
          name: colName,
          accessible: true,
          countPreview: subSnap.size,
          latencyMs: Math.round(performance.now() - subStart)
        });
      } catch (subErr) {
        collectionsPinged.push({
          name: colName,
          accessible: false
        });
      }
    }

    return {
      status: 'VALID',
      connected: isConnected,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      projectId: firebaseConfig.projectId || 'ai-studio-gtavicentralvice',
      authReady: !!firebaseAuth,
      roundtripLatencyMs: Math.round(performance.now() - startTime),
      collectionsPinged,
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    const roundtripMs = Math.round(performance.now() - startTime);
    errorMessage = err?.message || 'Failed to connect to Firestore database';

    return {
      status: 'WARNING',
      connected: false,
      databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
      projectId: firebaseConfig.projectId || 'ai-studio-gtavicentralvice',
      authReady: !!firebaseAuth,
      roundtripLatencyMs: roundtripMs,
      collectionsPinged,
      errorMessage,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Compute System Pre-Build Integrity and Overall Health Score
 */
export function computeOverallHealthScore(
  clientChecks: EnvCheckResult[],
  serverChecks: EnvCheckResult[],
  firebaseResult: FirebaseHealthResult
): SystemPreBuildIntegrity {
  const allChecks = [...clientChecks, ...serverChecks];
  const total = allChecks.length + 1; // +1 for Firebase

  let passed = 0;
  let warnings = 0;
  let failed = 0;

  for (const check of allChecks) {
    if (check.status === 'VALID') {
      passed++;
    } else if (check.status === 'WARNING') {
      warnings++;
    } else {
      failed++;
    }
  }

  if (firebaseResult.connected) {
    passed++;
  } else {
    warnings++;
  }

  // Calculate score weighted by severity
  const score = Math.max(0, Math.min(100, Math.round(((passed * 1.0 + warnings * 0.5) / total) * 100)));

  let overallStatus: 'OPERATIONAL' | 'WARNING' | 'CRITICAL' = 'OPERATIONAL';
  let verdict: 'READY_FOR_DEPLOYMENT' | 'ACTION_RECOMMENDED' | 'CRITICAL_BLOCKER' = 'READY_FOR_DEPLOYMENT';

  if (failed > 0) {
    overallStatus = 'CRITICAL';
    verdict = 'CRITICAL_BLOCKER';
  } else if (warnings > 0 || score < 90) {
    overallStatus = 'WARNING';
    verdict = 'ACTION_RECOMMENDED';
  }

  return {
    nodeEnv: typeof process !== 'undefined' && process.env?.NODE_ENV ? process.env.NODE_ENV : 'production',
    port: ENV.PORT || 3000,
    isProductionReady: failed === 0,
    score,
    totalChecks: total,
    passedChecks: passed,
    warningChecks: warnings,
    failedChecks: failed,
    overallStatus,
    verdict,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generates a clean Markdown Pre-Deployment Audit Report for sharing / sign-off
 */
export function generateMarkdownAuditReport(report: FullDiagnosticReport): string {
  const { integrity, clientChecks, serverChecks, firebase, diagnosticLogs } = report;

  const lines: string[] = [
    `# 🛡️ ViceIntel — Pre-Build Environment & Firebase Health Audit`,
    `**Generated:** ${new Date(integrity.generatedAt).toUTCString()}`,
    `**Overall Health Score:** ${integrity.score}% (${integrity.overallStatus})`,
    `**Deployment Verdict:** \`${integrity.verdict}\``,
    `**Database ID:** \`${firebase.databaseId}\` (${firebase.connected ? '🟢 Connected' : '🔴 Disconnected'} • ${firebase.roundtripLatencyMs}ms)`,
    '',
    `---`,
    `## 📊 Executive Summary`,
    `- **Total Configuration Items Audited:** ${integrity.totalChecks}`,
    `- **Passed Checks:** ${integrity.passedChecks}`,
    `- **Warning / Fallback Checks:** ${integrity.warningChecks}`,
    `- **Critical Failure Checks:** ${integrity.failedChecks}`,
    `- **Firebase Auth Service:** ${firebase.authReady ? 'Ready' : 'Not Ready'}`,
    '',
    `---`,
    `## 🔐 Server-Side Environment Variables`,
    `| Variable | Category | Requirement | Status | Masked Preview |`,
    `| :--- | :--- | :--- | :---: | :--- |`
  ];

  for (const check of serverChecks) {
    const icon = check.status === 'VALID' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
    lines.push(`| \`${check.key}\` | ${check.category} | ${check.severity} | ${icon} ${check.status} | \`${check.valuePreview}\` |`);
  }

  lines.push('');
  lines.push(`## 🌐 Client-Side Environment Variables`);
  lines.push(`| Variable | Category | Requirement | Status | Value Preview |`);
  lines.push(`| :--- | :--- | :--- | :---: | :--- |`);

  for (const check of clientChecks) {
    const icon = check.status === 'VALID' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
    lines.push(`| \`${check.key}\` | ${check.category} | ${check.severity} | ${icon} ${check.status} | \`${check.valuePreview}\` |`);
  }

  lines.push('');
  lines.push(`## 🔥 Firebase Cloud Firestore Collections Latency`);
  lines.push(`| Collection | Status | Latency | Document Sample |`);
  lines.push(`| :--- | :---: | :---: | :--- |`);

  for (const col of firebase.collectionsPinged) {
    lines.push(`| \`${col.name}\` | ${col.accessible ? '🟢 Accessible' : '🔴 Restricted'} | ${col.latencyMs ? `${col.latencyMs}ms` : 'N/A'} | ${col.countPreview !== undefined ? `${col.countPreview} sample doc(s)` : '0'} |`);
  }

  lines.push('');
  lines.push(`## 📜 Audit Execution Log`);
  lines.push('```text');
  for (const log of diagnosticLogs) {
    lines.push(log);
  }
  lines.push('```');

  return lines.join('\n');
}

export interface SecretRotationResult {
  success: boolean;
  message: string;
  rotatedKey?: string;
  timestamp?: string;
  valuePreview?: string;
  latencyMs?: number;
}

/**
 * Test a candidate secret key against backend validation without applying changes
 */
export async function testServerSecret(
  secretKey: string,
  newValue: string,
  adminPasskey?: string
): Promise<SecretRotationResult> {
  try {
    const res = await fetch('/api/admin/secrets/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passkey': adminPasskey || ''
      },
      body: JSON.stringify({ secretKey, newValue, adminPasskey })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || data.error || 'Secret validation failed.'
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to reach secret verification endpoint.'
    };
  }
}

/**
 * Perform runtime environment variable secret rotation in server process.env
 */
export async function rotateServerSecret(
  secretKey: string,
  newValue: string,
  adminPasskey: string,
  reason?: string
): Promise<SecretRotationResult> {
  try {
    const res = await fetch('/api/admin/secrets/rotate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passkey': adminPasskey
      },
      body: JSON.stringify({ secretKey, newValue, adminPasskey, reason })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || data.error || 'Secret rotation failed.'
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to connect to secret rotation endpoint.'
    };
  }
}

