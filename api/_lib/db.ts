import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;
let isConnecting = false;

function sanitizeMongoUri(rawUri: string): string {
  let clean = rawUri.trim();
  const match = clean.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/);
  if (match) {
    const scheme = match[1];
    const username = match[2].trim();
    const password = match[3].trim();
    const rest = match[4].trim();
    return `${scheme}${username}:${password}@${rest}`;
  }
  return clean;
}

export async function getMongoDb(): Promise<any | null> {
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri) {
    return null;
  }

  if (cachedConnection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
    return mongoose.connection.db;
  }

  if (isConnecting) {
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return mongoose.connection.db;
    }
  }

  try {
    isConnecting = true;
    const uri = sanitizeMongoUri(rawUri);
    const conn = await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 15000,
      maxPoolSize: 10,
    });
    cachedConnection = conn;
    return conn.connection.db;
  } catch (err) {
    console.error('MongoDB serverless connection error:', err);
    return null;
  } finally {
    isConnecting = false;
  }
}

export function getMongoConnectionInfo() {
  const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
  return {
    configured: Boolean(process.env.MONGODB_URI),
    connected: Boolean(isConnected),
    name: mongoose.connection?.name || 'none'
  };
}

export function sendJson(res: any, status: number, data: any) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');
  }

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

export async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}
