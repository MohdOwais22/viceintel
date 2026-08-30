export interface CronAuthResult {
  authorized: boolean;
  error?: string;
  source?: 'bearer' | 'header' | 'query';
}

/**
 * Validates the authorization header or query param against the configured CRON_SECRET.
 * Supports:
 * - Authorization: Bearer <CRON_SECRET>
 * - x-cron-secret: <CRON_SECRET>
 * - ?secret=<CRON_SECRET> or ?key=<CRON_SECRET>
 */
export function validateCronAuth(req: any): CronAuthResult {
  const configuredSecret = process.env.CRON_SECRET || process.env.CRON_SECRET_KEY || 'vice_midnight_cron_secret_2026';

  let authHeader: string | null = null;
  let customHeader: string | null = null;
  let querySecret: string | null = null;

  if ('headers' in req && typeof req.headers.get === 'function') {
    authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    customHeader = req.headers.get('x-cron-secret') || req.headers.get('X-Cron-Secret');
  }

  if ('nextUrl' in req && req.nextUrl?.searchParams) {
    querySecret = req.nextUrl.searchParams.get('secret') || req.nextUrl.searchParams.get('key');
  } else if ('url' in req && req.url) {
    try {
      const url = new URL(req.url, 'http://localhost:3000');
      querySecret = url.searchParams.get('secret') || url.searchParams.get('key');
    } catch {
      // ignore
    }
  }

  // 1. Check Bearer token
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === configuredSecret) {
      return { authorized: true, source: 'bearer' };
    }
  }

  // 2. Check Custom Header
  if (customHeader && customHeader.trim() === configuredSecret) {
    return { authorized: true, source: 'header' };
  }

  // 3. Check Query Parameter
  if (querySecret && querySecret.trim() === configuredSecret) {
    return { authorized: true, source: 'query' };
  }

  return {
    authorized: false,
    error: 'Unauthorized: Missing or invalid CRON_SECRET authorization token.'
  };
}
