import firebaseConfig from '../../firebase-applet-config.json';

export interface CronJobRecord {
  id: string;
  name: string;
  intervalDescription: string;
  lastRunIso: string;
  lastRunTimestamp: number;
  status: 'idle' | 'running' | 'error';
  runCount: number;
  lastDurationMs: number;
  lastSummary: string;
  lastError?: string | null;
  triggeredBy?: 'internal_timer' | 'http_webhook' | 'admin_panel' | 'startup';
}

const RTDB_BASE_URL = (firebaseConfig as any).databaseURL || `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`;

// In-memory fallback cache in case of network glitches
const cronMemoryStore = new Map<string, CronJobRecord>();
const cronStartTimeStore = new Map<string, number>();

export const REGISTERED_CRON_DEFINITIONS: Record<string, { name: string; interval: string }> = {
  pseo_spider: {
    name: 'pSEO News Spider & Web Search Crawler',
    interval: 'Every 2 Hours'
  },
  fivem_traffic_sync: {
    name: 'FiveM RP Server Directory Traffic & Uptime Sync',
    interval: 'Every 1 Hour'
  },
  vip_expiry_alerts: {
    name: 'VIP Expiration & Daily Streak Warning Engine',
    interval: 'Every 12 Hours'
  },
  challenges_payout: {
    name: 'Tuning Championship Challenge Expiry & Payout Checker',
    interval: 'Every 30 Minutes'
  },
  stale_squad_cleanup: {
    name: 'Squad Room Inactivity & Stale Coordinate Cleanup',
    interval: 'Every 15 Minutes'
  },
  pseo_merge_prune: {
    name: 'pSEO Article Consolidation & 30-Day Retention Pruner',
    interval: 'Every 24 Hours'
  },
  discord_role_sync: {
    name: 'Discord Whitelist Role & Permission Sync Engine',
    interval: 'Every 15 Minutes'
  }
};

/**
 * Record the start of a cron job in Realtime Database
 */
export async function startCronJobInRtdb(
  jobId: string,
  triggeredBy: 'internal_timer' | 'http_webhook' | 'admin_panel' | 'startup' = 'internal_timer'
): Promise<void> {
  const now = Date.now();
  cronStartTimeStore.set(jobId, now);

  const def = REGISTERED_CRON_DEFINITIONS[jobId] || {
    name: jobId.replace(/_/g, ' ').toUpperCase(),
    interval: 'Scheduled'
  };

  const existing = cronMemoryStore.get(jobId);
  const updated: CronJobRecord = {
    id: jobId,
    name: def.name,
    intervalDescription: def.interval,
    lastRunIso: new Date(now).toISOString(),
    lastRunTimestamp: now,
    status: 'running',
    runCount: (existing?.runCount || 0) + 1,
    lastDurationMs: existing?.lastDurationMs || 0,
    lastSummary: 'Execution in progress...',
    lastError: null,
    triggeredBy
  };

  cronMemoryStore.set(jobId, updated);

  try {
    const url = `${RTDB_BASE_URL}/cron_jobs/${jobId}.json`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  } catch (err) {
    console.warn(`[RTDB Cron Service] Note: Failed to patch start state to Realtime Database for ${jobId}:`, err);
  }
}

/**
 * Record the completion of a cron job in Realtime Database
 */
export async function finishCronJobInRtdb(
  jobId: string,
  summary: string,
  error?: string | null
): Promise<CronJobRecord> {
  const now = Date.now();
  const startTime = cronStartTimeStore.get(jobId) || now;
  const durationMs = Math.max(0, now - startTime);

  const existing = cronMemoryStore.get(jobId);
  const def = REGISTERED_CRON_DEFINITIONS[jobId] || {
    name: jobId.replace(/_/g, ' ').toUpperCase(),
    interval: 'Scheduled'
  };

  const isError = Boolean(error);
  const record: CronJobRecord = {
    id: jobId,
    name: def.name,
    intervalDescription: def.interval,
    lastRunIso: new Date(now).toISOString(),
    lastRunTimestamp: now,
    status: isError ? 'error' : 'idle',
    runCount: existing?.runCount || 1,
    lastDurationMs: durationMs,
    lastSummary: summary,
    lastError: error || null,
    triggeredBy: existing?.triggeredBy || 'internal_timer'
  };

  cronMemoryStore.set(jobId, record);

  try {
    const url = `${RTDB_BASE_URL}/cron_jobs/${jobId}.json`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  } catch (err) {
    console.warn(`[RTDB Cron Service] Note: Failed to patch finish state to Realtime Database for ${jobId}:`, err);
  }

  return record;
}

/**
 * Fetch all registered cron job statuses from Realtime Database
 */
export async function getAllCronJobsFromRtdb(): Promise<CronJobRecord[]> {
  try {
    const url = `${RTDB_BASE_URL}/cron_jobs.json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const records: CronJobRecord[] = Object.values(data);
        // Sync local memory store
        records.forEach(r => {
          if (r?.id) cronMemoryStore.set(r.id, r);
        });
      }
    }
  } catch (err) {
    console.warn('[RTDB Cron Service] Note: Could not fetch cron_jobs from RTDB, returning memory state:', err);
  }

  // Ensure all registered definitions are represented
  const results: CronJobRecord[] = [];
  for (const [id, def] of Object.entries(REGISTERED_CRON_DEFINITIONS)) {
    const record = cronMemoryStore.get(id) || {
      id,
      name: def.name,
      intervalDescription: def.interval,
      lastRunIso: 'Never',
      lastRunTimestamp: 0,
      status: 'idle',
      runCount: 0,
      lastDurationMs: 0,
      lastSummary: 'Pending initial execution trigger',
      lastError: null,
      triggeredBy: 'internal_timer'
    };
    results.push(record);
  }

  return results;
}
