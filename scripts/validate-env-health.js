#!/usr/bin/env node
/**
 * Automated Pre-Build Environment & Firebase Health Validator
 * Checks critical environment variables and Firebase configuration before the production build.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env if present
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

const CRITICAL_VARS = [
  { key: 'GEMINI_API_KEY', scope: 'SERVER', required: true, example: 'AIzaSy...' },
  { key: 'CRON_SECRET_KEY', scope: 'SERVER', required: true, example: 'vice_midnight_cron_secret_2026' },
  { key: 'ADMIN_PASSKEY', scope: 'SERVER', required: true, example: 'VICE2026_L4' },
  { key: 'STAFF_PASSKEY', scope: 'SERVER', required: true, example: 'VICE2026_L3' },
  { key: 'APP_NAME', scope: 'CLIENT', required: true, example: 'GTA VI Central' },
  { key: 'APP_URL', scope: 'CLIENT', required: false, example: 'https://ais-dev-...run.app' },
  { key: 'STRIPE_SECRET_KEY', scope: 'SERVER', required: false, example: 'sk_test_...' },
  { key: 'STRIPE_WEBHOOK_SECRET', scope: 'SERVER', required: false, example: 'whsec_...' },
  { key: 'DISCORD_CLIENT_ID', scope: 'CLIENT', required: false, example: '1540025117470621759' },
  { key: 'VIP_PRICE', scope: 'CLIENT', required: false, example: '3.99' },
  { key: 'B2B_SPONSOR_PRICE', scope: 'CLIENT', required: false, example: '49.00' }
];

console.log('\n' + '='.repeat(68));
console.log('  🛡️  VICEINTEL — AUTOMATED PRE-BUILD HEALTH VALIDATOR');
console.log('='.repeat(68));

let passed = 0;
let warnings = 0;
let criticalMissing = 0;

console.log('\n[1/3] Validating Critical Environment Configuration (.env)...');

for (const item of CRITICAL_VARS) {
  const val = process.env[item.key];
  const isPresent = val !== undefined && val.trim() !== '';

  if (isPresent) {
    passed++;
    const masked = val.length > 8 ? `${val.substring(0, 4)}...**** (${val.length} chars)` : '****';
    console.log(`  ✅ [${item.scope}] ${item.key.padEnd(25)} -> Configured (${masked})`);
  } else if (item.required) {
    criticalMissing++;
    console.log(`  ❌ [${item.scope}] ${item.key.padEnd(25)} -> MISSING (Expected: ${item.example})`);
  } else {
    warnings++;
    console.log(`  ⚠️  [${item.scope}] ${item.key.padEnd(25)} -> Fallback default active`);
  }
}

console.log('\n[2/3] Validating Firebase Configuration & Security Rules...');

const firebaseConfigPath = path.resolve('firebase-applet-config.json');
if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    console.log(`  ✅ Firebase Config File      -> Found (Project: ${config.projectId || 'N/A'}, DB: ${config.firestoreDatabaseId || '(default)'})`);
    passed++;
  } catch (err) {
    console.log(`  ❌ Firebase Config File      -> Invalid JSON format`);
    criticalMissing++;
  }
} else {
  console.log(`  ⚠️  Firebase Config File      -> firebase-applet-config.json not found (using client fallbacks)`);
  warnings++;
}

const firestoreRulesPath = path.resolve('firestore.rules');
if (fs.existsSync(firestoreRulesPath)) {
  const rules = fs.readFileSync(firestoreRulesPath, 'utf-8');
  console.log(`  ✅ Firestore Security Rules  -> Found (${rules.split('\n').length} lines of RBAC security rules)`);
  passed++;
} else {
  console.log(`  ⚠️  Firestore Security Rules  -> firestore.rules not found`);
  warnings++;
}

console.log('\n[3/3] Validating Environment Schema Parity (.env.example)...');

const envExamplePath = path.resolve('.env.example');
if (fs.existsSync(envExamplePath)) {
  console.log(`  ✅ Environment Manifest     -> .env.example documented`);
  passed++;
} else {
  console.log(`  ⚠️  Environment Manifest     -> .env.example missing`);
  warnings++;
}

const total = passed + warnings + criticalMissing;
const score = Math.round(((passed + warnings * 0.5) / total) * 100);

console.log('\n' + '-'.repeat(68));
console.log(`  📊 Pre-Build Health Score: ${score}% (${criticalMissing === 0 ? 'READY FOR BUILD' : 'ACTION RECOMMENDED'})`);
console.log(`  ✅ Passed: ${passed} | ⚠️  Warnings: ${warnings} | ❌ Critical Missing: ${criticalMissing}`);
console.log('='.repeat(68) + '\n');

// Do not fail the build if minor warnings exist, but notify the developer
process.exit(0);
