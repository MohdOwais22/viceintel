import type { IncomingMessage, ServerResponse } from 'http';
import { connectToMongoDB, isMongoDBConnected } from '../src/lib/db/mongodb';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const conn = await connectToMongoDB();
    const isConnected = isMongoDBConnected();

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'ok',
        environment: 'Vercel Serverless',
        mongodb: {
          connected: isConnected,
          databaseName: conn?.connection?.name || 'none',
          hasUriEnv: Boolean(process.env.MONGODB_URI),
        },
        timestamp: new Date().toISOString(),
      })
    );
  } catch (err: any) {
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        status: 'error',
        error: err?.message,
        hasUriEnv: Boolean(process.env.MONGODB_URI),
      })
    );
  }
}
