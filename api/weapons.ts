import { WEAPONS_DATA } from '../src/data/weapons';

export default async function handler(req: any, res: any) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.statusCode = 200;
    res.end();
    return;
  }

  const payload = {
    success: true,
    count: WEAPONS_DATA.length,
    data: WEAPONS_DATA,
    timestamp: new Date().toISOString(),
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(payload);
  }

  res.statusCode = 200;
  res.end(JSON.stringify(payload));
}
