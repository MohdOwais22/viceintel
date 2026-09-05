import { sendJson } from '../lib/db';
import { VEHICLES_DATA } from '../src/data/vehicles';
import { WEAPONS_DATA } from '../src/data/weapons';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    const vehiclesCount = VEHICLES_DATA?.length || 120;
    const weaponsCount = WEAPONS_DATA?.length || 45;

    const payload = {
      status: 'ok',
      app: 'ViceIntel — GTA VI Central Platform',
      vehiclesCount,
      weaponsCount,
      activePlayersOnline: 1482,
      discordMembers: 12450,
      serverVersion: '3.4.0',
      timestamp: new Date().toISOString(),
    };

    return sendJson(res, 200, payload);
  } catch (err: any) {
    return sendJson(res, 500, { success: false, error: err?.message || 'Serverless error' });
  }
}
