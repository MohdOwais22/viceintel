export default async function handler(req: any, res: any) {
  try {
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

    let weapons: any[] = [];
    try {
      const dataModule = await import('../src/data/weapons');
      weapons = dataModule.WEAPONS_DATA || [];
    } catch {
      weapons = [];
    }

    const payload = {
      success: true,
      count: weapons.length,
      data: weapons,
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
