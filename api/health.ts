export default async function handler(req: any, res: any) {
  try {
    if (res.setHeader) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') {
        return res.status(200).end();
      }
      res.statusCode = 200;
      res.end();
      return;
    }

    let isConnected = false;
    let dbName = 'none';
    let dbError: string | null = null;
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      try {
        const mongooseModule = await import('mongoose');
        const mongoose = (mongooseModule as any).default || mongooseModule;
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          isConnected = true;
          dbName = mongoose.connection.name || 'connected';
        } else {
          await mongoose.connect(mongoUri.trim(), {
            dbName: process.env.MONGODB_DB_NAME || undefined,
            serverSelectionTimeoutMS: 3000,
            socketTimeoutMS: 5000,
            bufferCommands: false,
          });
          isConnected = mongoose.connection.readyState === 1;
          dbName = mongoose.connection.name || 'connected';
        }
      } catch (err: any) {
        dbError = err?.message || 'Database connection error';
      }
    }

    const payload = {
      status: 'ok',
      service: 'ViceIntel API',
      runtime: process.env.VERCEL ? 'Vercel Serverless' : 'Node Container',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
      database: {
        configured: Boolean(mongoUri),
        connected: isConnected,
        name: dbName,
        error: dbError,
      },
      features: {
        vehiclesDatabase: true,
        weaponsArmory: true,
        interactiveMap: true,
        communityLiveChat: true,
        rpServersDirectory: true,
        fourZeroFourHandler: true,
      },
    };

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(payload);
    }

    res.statusCode = 200;
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    const errorPayload = {
      status: 'ok',
      service: 'ViceIntel API',
      warning: 'Fallback mode active',
      error: err?.message || 'Handler exception',
      timestamp: new Date().toISOString(),
    };

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(errorPayload);
    }

    res.statusCode = 200;
    res.end(JSON.stringify(errorPayload));
  }
}
