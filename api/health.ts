import { connectToMongoDB, isMongoDBConnected } from '../src/lib/db/mongodb';

export default async function handler(req: any, res: any) {
  try {
    if (res.setHeader) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Content-Type', 'application/json');
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') {
        return res.status(200).end();
      }
      res.statusCode = 200;
      res.end();
      return;
    }

    let conn: any = null;
    let isConnected = false;
    let dbError: string | null = null;

    try {
      conn = await connectToMongoDB();
      isConnected = isMongoDBConnected();
    } catch (dbErr: any) {
      dbError = dbErr?.message || 'MongoDB connection error';
    }

    const payload = {
      status: 'ok',
      service: 'ViceIntel API',
      environment: process.env.VERCEL ? 'Vercel Serverless' : 'Node Container',
      mongodb: {
        connected: isConnected,
        databaseName: conn?.connection?.name || 'none',
        hasUriEnv: Boolean(process.env.MONGODB_URI),
        error: dbError,
      },
      timestamp: new Date().toISOString(),
    };

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(payload);
    }

    res.statusCode = 200;
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    const errorPayload = {
      status: 'error',
      error: err?.message || 'Unknown health check failure',
      hasUriEnv: Boolean(process.env.MONGODB_URI),
      timestamp: new Date().toISOString(),
    };

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(500).json(errorPayload);
    }

    res.statusCode = 500;
    res.end(JSON.stringify(errorPayload));
  }
}

