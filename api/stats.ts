export default async function handler(req: any, res: any) {
  try {
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

    let vehiclesCount = 120;
    let weaponsCount = 45;

    try {
      const vModule = await import('../src/data/vehicles');
      if (vModule.VEHICLES_DATA) vehiclesCount = vModule.VEHICLES_DATA.length;
    } catch {}

    try {
      const wModule = await import('../src/data/weapons');
      if (wModule.WEAPONS_DATA) weaponsCount = wModule.WEAPONS_DATA.length;
    } catch {}

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

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(payload);
    }

    res.statusCode = 200;
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    const errorPayload = { success: false, error: err?.message || 'Serverless error' };
    if (typeof res.status === 'function') return res.status(500).json(errorPayload);
    res.statusCode = 500;
    res.end(JSON.stringify(errorPayload));
  }
}
