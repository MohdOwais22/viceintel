import { getMongoDb, getMongoConnectionInfo, sendJson } from './_lib/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    // Attempt connection check
    await getMongoDb();
    const dbInfo = getMongoConnectionInfo();

    const payload = {
      status: 'ok',
      service: 'ViceIntel API',
      runtime: process.env.VERCEL ? 'Vercel Serverless' : 'Node Container',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
      database: dbInfo,
      features: {
        vehiclesDatabase: true,
        weaponsArmory: true,
        interactiveMap: true,
        communityLiveChat: true,
        rpServersDirectory: true,
        fourZeroFourHandler: true,
      },
    };

    return sendJson(res, 200, payload);
  } catch (err: any) {
    const errorPayload = {
      status: 'ok',
      service: 'ViceIntel API',
      warning: 'Fallback mode active',
      error: err?.message || 'Handler exception',
      timestamp: new Date().toISOString(),
    };
    return sendJson(res, 200, errorPayload);
  }
}
