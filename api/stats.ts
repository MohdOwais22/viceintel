import { VEHICLES_DATA } from '../src/data/vehicles';
import { WEAPONS_DATA } from '../src/data/weapons';

export default async function handler(req: any, res: any) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.statusCode = 200;
    res.end();
    return;
  }

  const payload = {
    status: 'ok',
    app: 'ViceIntel — GTA VI Central Platform',
    vehiclesCount: VEHICLES_DATA.length,
    weaponsCount: WEAPONS_DATA.length,
    activePlayersOnline: 1482,
    discordMembers: 12450,
    serverVersion: '3.4.0',
    timestamp: new Date().toISOString(),
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(payload);
  }

  res.statusCode = 200;
  res.end(JSON.stringify(payload));
}
