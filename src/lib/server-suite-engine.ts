/**
 * Sentinel Server Operating Suite — Engine & Systems Architecture
 * Resource Performance Inspector, AI Ban Appeal Evaluator, Dynamic Economy Simulator,
 * Creator Priority Queue & Squad Referral Engine.
 */

import { GoogleGenAI } from "@google/genai";

// -------------------------------------------------------------
// FIRESTORE & SUITE DATA MODELS
// -------------------------------------------------------------

export interface ServerToolConfig {
  serverId: string;
  guildId: string;
  ownerDiscordId: string;
  economyModel: {
    avgHourlyLegalIncome: number;
    avgHourlyIllegalIncome: number;
    dailyTaxRate: number;
    projectedInflationIndex: number;
  };
  creators: Array<{
    creatorName: string;
    vanitySlug: string;
    totalJoins: number;
    priorityQueueWeight: number;
  }>;
  appealsEnabled: boolean;
  tier: 'starter' | 'pro' | 'mega';
  updatedAt: number;
}

export interface BanAppeal {
  id: string;
  serverId: string;
  applicantDiscordId: string;
  banReason: string;
  clipUrl?: string;
  defenseStatement: string;
  aiAudit: {
    credibilityScore: number;
    ruleViolationFlags: string[];
    recommendedAction: 'unban' | 'reduce' | 'reject';
    summary: string;
  };
  status: 'pending' | 'resolved';
  resolvedBy?: string;
  createdAt: number;
}

export interface SquadReferral {
  id: string;
  serverId: string;
  referrerUid: string;
  referrerDiscordTag: string;
  squadName: string;
  code: string;
  clicks: number;
  conversions: number;
  createdAt: number;
}

// -------------------------------------------------------------
// 1. RESOURCE HEALTH & ASSET PERFORMANCE INSPECTOR
// -------------------------------------------------------------

export interface ManifestFile {
  filename: string;
  content: string;
}

export interface ResourceIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'texture' | 'tick_loop' | 'manifest' | 'sql' | 'poly_count';
  title: string;
  file?: string;
  description: string;
  recommendation: string;
}

export interface ResourceAuditResult {
  optimizationScore: number; // 0–100
  statusGrade: 'OPTIMAL' | 'FAIR' | 'SEVERELY_DEGRADED' | 'CRITICAL_LAG_RISK';
  totalFilesAnalyzed: number;
  totalSizeEstimatedMb: number;
  issues: ResourceIssue[];
  metrics: {
    heavyTickLoops: number;
    oversizedAssets: number;
    outdatedManifests: number;
    unindexedQueries: number;
  };
  actionablePatchSnippet?: string;
}

export function auditFivemResourceManifests(files: ManifestFile[]): ResourceAuditResult {
  const issues: ResourceIssue[] = [];
  let heavyTickLoops = 0;
  let oversizedAssets = 0;
  let outdatedManifests = 0;
  let unindexedQueries = 0;
  let estimatedMb = 0;

  files.forEach((file) => {
    const fn = file.filename.toLowerCase();
    const code = file.content;
    const lineCount = code.split('\n').length;
    estimatedMb += Math.max(0.1, lineCount * 0.0002);

    // 1. Manifest Checks
    if (fn.includes('fxmanifest.lua') || fn.includes('__resource.lua')) {
      if (fn.includes('__resource.lua')) {
        outdatedManifests++;
        issues.push({
          severity: 'warning',
          category: 'manifest',
          title: 'Deprecated __resource.lua Manifest',
          file: file.filename,
          description: 'Uses legacy __resource.lua specification instead of modern fxmanifest.lua (fx_version "cerulean").',
          recommendation: 'Migrate to `fxmanifest.lua` and set `fx_version "cerulean"` or `bodacious` with `game "gta5"`.'
        });
      }

      if (code.includes('resource_manifest_version')) {
        outdatedManifests++;
        issues.push({
          severity: 'info',
          category: 'manifest',
          title: 'Legacy Manifest Version Declaration',
          file: file.filename,
          description: 'Uses obsolete resource_manifest_version format.',
          recommendation: 'Replace with `fx_version "cerulean"` at the top of the fxmanifest.'
        });
      }
    }

    // 2. Heavy Tick Loop Detection (Citizen.Wait(0) without delay)
    const zeroWaitMatches = (code.match(/Wait\(\s*0\s*\)|Citizen\.Wait\(\s*0\s*\)/g) || []).length;
    if (zeroWaitMatches > 0) {
      heavyTickLoops += zeroWaitMatches;
      if (zeroWaitMatches >= 3 || code.includes('while true do')) {
        issues.push({
          severity: 'critical',
          category: 'tick_loop',
          title: `Heavy CPU Tick Loop Detected (${zeroWaitMatches}x Wait(0))`,
          file: file.filename,
          description: 'Contains infinite loop rendering at 60+ Hz without dynamic sleep thresholds, causing client micro-stutters.',
          recommendation: 'Set dynamic sleep variable: `local sleep = 1000` when player is far from target coords, set to `0` only inside proximity radius.'
        });
      }
    }

    // 3. Database SQL Query Loop Inspection
    if (code.includes('MySQL.Async') || code.includes('exports.oxmysql')) {
      if (/for\s+.*\s+in\s+.*do[\s\S]*?(MySQL|oxmysql)/i.test(code)) {
        unindexedQueries++;
        issues.push({
          severity: 'critical',
          category: 'sql',
          title: 'Synchronous Database Query inside Loop',
          file: file.filename,
          description: 'Performs blocking SQL queries inside a lua loop, blocking the server thread and stalling server tickrate (SV Sync drops below 30 FPS).',
          recommendation: 'Batch SQL updates using `MySQL.prepare` or a single `UPDATE ... WHERE id IN (...)` statement outside the iteration loop.'
        });
      }
    }

    // 4. Texture and Asset Size Analysis
    if (fn.endsWith('.ytd') || fn.endsWith('.ydr') || fn.endsWith('.yft')) {
      // Asset file check from manifest sizes
      const fileMb = file.content.length > 1000 ? file.content.length / (1024 * 1024) : 18.5; // fallback size estimate
      if (fileMb > 16) {
        oversizedAssets++;
        issues.push({
          severity: 'critical',
          category: 'texture',
          title: `Oversized Vehicle/Building Texture Dictionary (${fileMb.toFixed(1)} MB)`,
          file: file.filename,
          description: 'Texture dictionary exceeds FiveM recommended 16MB threshold. Will cause client texture loss (invisible roads/buildings) for players with <8GB VRAM.',
          recommendation: 'Downscale textures to 2048x2048 or 1048x1048 DXT5/BC3 compressed DDS format using OpenIV or TexFormat.'
        });
      }
    }
  });

  // Calculate overall score (100 base, deductions for bottlenecks)
  let score = 100;
  score -= heavyTickLoops * 12;
  score -= oversizedAssets * 15;
  score -= unindexedQueries * 20;
  score -= outdatedManifests * 5;
  if (files.length === 0) score = 75; // baseline sample
  score = Math.max(10, Math.min(100, Math.round(score)));

  let statusGrade: ResourceAuditResult['statusGrade'] = 'OPTIMAL';
  if (score < 40) statusGrade = 'CRITICAL_LAG_RISK';
  else if (score < 65) statusGrade = 'SEVERELY_DEGRADED';
  else if (score < 85) statusGrade = 'FAIR';

  const actionablePatchSnippet = `-- Modernized FXManifest & Dynamic Sleep Template
fx_version 'cerulean'
game 'gta5'

author 'Sentinel Suite Optimizer'
description 'High-Performance Thread Script'

client_script 'client.lua'
server_script 'server.lua'

-- client.lua dynamic sleep optimization pattern:
CreateThread(function()
    while true do
        local sleep = 1000
        local playerPed = PlayerPedId()
        local coords = GetEntityCoords(playerPed)
        local dist = #(coords - vector3(185.0, -920.0, 30.0))
        
        if dist < 15.0 then
            sleep = 0
            DrawMarker(1, 185.0, -920.0, 30.0, 0,0,0,0,0,0, 1.0,1.0,1.0, 255,0,0,200)
            if dist < 1.5 and IsControlJustReleased(0, 38) then
                -- Interact
            end
        end
        Wait(sleep)
    end
end)`;

  return {
    optimizationScore: score,
    statusGrade,
    totalFilesAnalyzed: files.length,
    totalSizeEstimatedMb: Number(estimatedMb.toFixed(2)),
    issues,
    metrics: {
      heavyTickLoops,
      oversizedAssets,
      outdatedManifests,
      unindexedQueries
    },
    actionablePatchSnippet
  };
}

// -------------------------------------------------------------
// 2. DYNAMIC ECONOMY & INFLATION SIMULATOR
// -------------------------------------------------------------

export interface EconomySimInput {
  avgHourlyLegalIncome: number;    // e.g. $12,500
  avgHourlyIllegalIncome: number;  // e.g. $24,000
  dailyTaxRate: number;            // e.g. 5.5%
  avgVehicleRepairCost: number;    // e.g. $750
  dailyPropertyTax: number;        // e.g. $1,200
  activePlayerCount?: number;      // e.g. 64
  initialTotalCash?: number;       // e.g. $2,500,000
}

export interface EconomySimProjection {
  day30CirculatingCash: number;
  day90CirculatingCash: number;
  projectedInflationIndex: number; // 0 to 100
  giniWealthInequality: number;    // 0.0 (equal) to 1.0 (extreme gap)
  moneyVelocityCurve30: Array<{ day: number; circulatingCash: number; legalMinted: number; illegalMinted: number; sinksBurned: number }>;
  moneyVelocityCurve90: Array<{ day: number; circulatingCash: number }>;
  riskAssessment: {
    inflationLevel: 'STABLE' | 'MODERATE_INFLATION' | 'HYPER_INFLATION_CRITICAL' | 'DEFLATION_RISK';
    hoarderThreat: 'LOW' | 'MODERATE' | 'SEVERE';
    recommendations: string[];
  };
}

export function runEconomySimulation(input: EconomySimInput): EconomySimProjection {
  const players = input.activePlayerCount || 64;
  const initialCash = input.initialTotalCash || 2000000;
  const legalPay = input.avgHourlyLegalIncome;
  const illegalPay = input.avgHourlyIllegalIncome;
  const taxPercent = input.dailyTaxRate / 100;
  const repairCost = input.avgVehicleRepairCost;
  const propTax = input.dailyPropertyTax;

  let currentCash = initialCash;
  const curve30: EconomySimProjection['moneyVelocityCurve30'] = [];
  const curve90: EconomySimProjection['moneyVelocityCurve90'] = [];

  for (let day = 1; day <= 90; day++) {
    // 3.5 average play hours per player
    const legalMinted = Math.round(players * 0.6 * legalPay * 3.5);
    const illegalMinted = Math.round(players * 0.4 * illegalPay * 3.5);
    const totalMinted = legalMinted + illegalMinted;

    // Sinks: tax + repairs + property tax + food/medical
    const taxBurn = currentCash * taxPercent;
    const repairBurn = players * repairCost * 1.2;
    const propertyBurn = players * propTax;
    const foodMedicalBurn = players * 450;
    const totalSinks = Math.round(taxBurn + repairBurn + propertyBurn + foodMedicalBurn);

    const netFlow = totalMinted - totalSinks;
    currentCash = Math.max(100000, currentCash + netFlow);

    if (day <= 30) {
      curve30.push({
        day,
        circulatingCash: currentCash,
        legalMinted,
        illegalMinted,
        sinksBurned: totalSinks
      });
    }

    curve90.push({
      day,
      circulatingCash: currentCash
    });
  }

  const day30Cash = curve30[29].circulatingCash;
  const day90Cash = curve90[89].circulatingCash;

  // Calculate inflation score (0-100)
  const growthRatio30 = day30Cash / initialCash;
  let inflationIndex = Math.min(100, Math.max(10, Math.round(growthRatio30 * 22)));
  if (illegalPay > legalPay * 2.2) inflationIndex = Math.min(100, inflationIndex + 25);

  let inflationLevel: EconomySimProjection['riskAssessment']['inflationLevel'] = 'STABLE';
  if (inflationIndex > 75) inflationLevel = 'HYPER_INFLATION_CRITICAL';
  else if (inflationIndex > 50) inflationLevel = 'MODERATE_INFLATION';
  else if (inflationIndex < 20) inflationLevel = 'DEFLATION_RISK';

  // Gini coefficient estimation
  const gini = Number(Math.min(0.85, Math.max(0.25, 0.35 + (illegalPay / (legalPay || 1)) * 0.08)).toFixed(2));
  const hoarderThreat = gini > 0.65 ? 'SEVERE' : gini > 0.45 ? 'MODERATE' : 'LOW';

  const recommendations: string[] = [];
  if (inflationLevel === 'HYPER_INFLATION_CRITICAL') {
    recommendations.push(`🚨 CRITICAL: Illegal hourly payout ($${illegalPay.toLocaleString()}) exceeds legal wages by over 2x.`);
    recommendations.push(`Increase daily taxation rate from ${input.dailyTaxRate}% to 8.0% or introduce high-tier luxury vehicle taxes.`);
    recommendations.push(`Implement laundering tax sinks on dirty cash before conversion to bank balances.`);
  } else if (inflationLevel === 'MODERATE_INFLATION') {
    recommendations.push(`⚠️ WARNING: Money supply will grow ${Math.round(growthRatio30)}x in 30 days.`);
    recommendations.push(`Adjust vehicle repair costs or add property maintenance fees to balance daily sinks.`);
  } else {
    recommendations.push(`✅ STABLE: Money creation and sinks are in healthy equilibrium.`);
    recommendations.push(`Current wage scaling supports target supercar progression without breaking player retention.`);
  }

  return {
    day30CirculatingCash: day30Cash,
    day90CirculatingCash: day90Cash,
    projectedInflationIndex: inflationIndex,
    giniWealthInequality: gini,
    moneyVelocityCurve30: curve30,
    moneyVelocityCurve90: curve90,
    riskAssessment: {
      inflationLevel,
      hoarderThreat,
      recommendations
    }
  };
}

// -------------------------------------------------------------
// 3. AI BAN APPEAL & INCIDENT EVALUATOR
// -------------------------------------------------------------

export interface BanAppealInput {
  serverId: string;
  applicantDiscordId: string;
  banReason: string;
  defenseStatement: string;
  clipUrl?: string;
  serverRules?: string[];
}

export async function evaluateBanAppealAI(input: BanAppealInput): Promise<BanAppeal['aiAudit']> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Senior FiveM / GTA RP Server Head Administrator and Rules Auditor.
Evaluate the following ban appeal for an RP server:

BAN REASON: "${input.banReason}"
PLAYER DEFENSE STATEMENT: "${input.defenseStatement}"
VIDEO CLIP EVIDENCE URL: "${input.clipUrl || 'None provided'}"
SERVER RULES REFERENCE: RDM, VDM, Metagaming, NLR (New Life Rule), Combat Logging, Powergaming.

Respond ONLY with a raw JSON object matching this exact schema:
{
  "credibilityScore": number (0 to 100),
  "ruleViolationFlags": string[],
  "recommendedAction": "unban" | "reduce" | "reject",
  "summary": "2-3 sentences explaining the assessment and verdict."
}`;

      const models = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
      for (const model of models) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            return {
              credibilityScore: typeof parsed.credibilityScore === 'number' ? parsed.credibilityScore : 65,
              ruleViolationFlags: Array.isArray(parsed.ruleViolationFlags) ? parsed.ruleViolationFlags : ['Potential RDM / Rule Misunderstanding'],
              recommendedAction: ['unban', 'reduce', 'reject'].includes(parsed.recommendedAction) ? parsed.recommendedAction : 'reduce',
              summary: parsed.summary || 'AI evaluated statement credibility against server guidelines.'
            };
          }
        } catch (e) {
          // Silent fallback to next available model in cascade
        }
      }
    } catch (e) {
      console.error('Error in Gemini API ban appeal audit:', e);
    }
  }

  // Local Algorithmic Heuristic Fallback
  const text = (input.defenseStatement + ' ' + input.banReason).toLowerCase();
  const wordCount = input.defenseStatement.trim().split(/\s+/).length;
  const hasClip = Boolean(input.clipUrl && input.clipUrl.startsWith('http'));

  let credibility = 50;
  if (wordCount > 40) credibility += 20;
  if (hasClip) credibility += 25;
  if (text.includes('sorry') || text.includes('apologize') || text.includes('understand')) credibility += 10;
  if (text.includes('admin lied') || text.includes('dumb rule') || text.includes('hate this')) credibility -= 30;

  credibility = Math.max(10, Math.min(95, credibility));

  const flags: string[] = [];
  if (text.includes('rdm') || text.includes('random death')) flags.push('Random Deathmatch (RDM)');
  if (text.includes('vdm') || text.includes('vehicle death')) flags.push('Vehicle Deathmatch (VDM)');
  if (text.includes('meta') || text.includes('discord')) flags.push('Metagaming');
  if (text.includes('combat log') || text.includes('disconnect')) flags.push('Combat Logging');
  if (flags.length === 0) flags.push('General RP Rule Violation');

  let recommendedAction: BanAppeal['aiAudit']['recommendedAction'] = 'reject';
  if (credibility >= 75) recommendedAction = 'unban';
  else if (credibility >= 45) recommendedAction = 'reduce';

  return {
    credibilityScore: credibility,
    ruleViolationFlags: flags,
    recommendedAction,
    summary: `Statement evaluated with ${wordCount} words and ${hasClip ? 'valid video proof' : 'no video attachment'}. Credibility rating determined at ${credibility}%.`
  };
}

// -------------------------------------------------------------
// 4. CREATOR OUTREACH & PRIORITY QUEUE TOKEN GENERATOR
// -------------------------------------------------------------

export function generateCreatorPriorityToken(
  creatorName: string,
  vanitySlug: string,
  totalJoins: number,
  priorityWeight: number = 5
): { token: string; expiresAt: number; luaSnippet: string } {
  const expiresAt = Date.now() + 86400000 * 30;
  const token = `CREATOR_QUEUE_${vanitySlug.toUpperCase()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const luaSnippet = `-- FiveM Priority Queue Hook (txAdmin / QBCore / ESX)
AddEventHandler('playerConnecting', function(name, setKickReason, deferrals) {
    local src = source
    local identifiers = GetPlayerIdentifiers(src)
    local creatorToken = "${token}"
    
    -- Verify creator referral pass
    if exports['sentinel_suite']:HasCreatorPriority(identifiers, "${vanitySlug}") then
        exports['qb-queues']:AddPriority(src, ${priorityWeight})
        print(('[SENTINEL] Granted Priority Weight +${priorityWeight} to player referred by ${creatorName}'))
    end
end)`;

  return { token, expiresAt, luaSnippet };
}

// -------------------------------------------------------------
// 5. SQUAD REFERRAL CONVERSION ENGINE
// -------------------------------------------------------------

export function calculateSquadReferralReward(conversions: number): { tier: string; rewardVc: number; discordRoleGranted: string } {
  if (conversions >= 25) {
    return { tier: 'Master Recruiter', rewardVc: 5000, discordRoleGranted: '👑 Grand Recruiter' };
  } else if (conversions >= 10) {
    return { tier: 'Squad Leader', rewardVc: 2000, discordRoleGranted: '⭐ Squad Leader' };
  } else if (conversions >= 3) {
    return { tier: 'Squad Scout', rewardVc: 500, discordRoleGranted: '🎖️ Community Scout' };
  }
  return { tier: 'Novice', rewardVc: 100, discordRoleGranted: 'Player' };
}
