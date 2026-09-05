import mongoose from 'mongoose';

let cachedClient: any = null;
let cachedDb: any = null;
let cachedPromise: Promise<any> | null = null;

export async function getMongoDb() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri || !uri.startsWith('mongodb')) {
    return null;
  }

  if (cachedDb && cachedClient && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || 'vicecity_db',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      bufferCommands: false,
    }).then((m) => {
      cachedClient = m;
      cachedDb = m.connection.db;
      return cachedDb;
    }).catch((err) => {
      console.warn('MongoDB connection error in serverless helper:', err?.message || err);
      cachedPromise = null;
      return null;
    });
  }

  return cachedPromise;
}

export async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export function getMongoConnectionInfo() {
  const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
  return {
    configured: Boolean(process.env.MONGODB_URI || process.env.DATABASE_URL),
    connected: Boolean(isConnected),
    name: mongoose.connection?.name || 'none'
  };
}

export function sendJson(res: any, status: number, data: any) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-secret');
    res.setHeader('Content-Type', 'application/json');
  }

  if (typeof res.status === 'function') {
    return res.status(status).json(data);
  }

  res.statusCode = status;
  res.end(JSON.stringify(data));
}
