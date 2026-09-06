async function getMongoDatabase(): Promise<any> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) return null;

  try {
    const mongooseModule = await import('mongoose');
    const mongoose = (mongooseModule as any).default || mongooseModule;
    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return mongoose.connection.db;
    }

    await mongoose.connect(mongoUri.trim(), {
      dbName: process.env.MONGODB_DB_NAME || undefined,
      serverSelectionTimeoutMS: 4000,
      socketTimeoutMS: 8000,
      bufferCommands: false,
    });

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return mongoose.connection.db;
    }
  } catch (err) {
    console.warn('[Admin Pending API] MongoDB connection warning:', err);
  }
  return null;
}

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
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

export default async function handler(req: any, res: any) {
  try {
    if (res.setHeader) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Content-Type', 'application/json');
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') return res.status(200).end();
      res.statusCode = 200;
      res.end();
      return;
    }

    const db = await getMongoDatabase();

    if (req.method === 'GET') {
      let pendingList: any[] = [];
      if (db) {
        try {
          pendingList = await db.collection('pendingApprovals').find({}).limit(200).toArray();
        } catch (err) {
          console.warn('[Admin Pending API] Fetch notice:', err);
        }
      }

      const payload = {
        success: true,
        count: pendingList.length,
        data: pendingList.map((doc: any) => ({
          ...doc,
          id: doc.id || doc._id?.toString(),
        }))
      };

      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const id = body.id || pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1];

      if (db && id) {
        await db.collection('pendingApprovals').deleteOne({
          $or: [{ id }, { _id: id }, { docId: id }]
        }).catch(() => null);
      }

      const payload = { success: true, message: 'Pending item processed successfully' };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
      const id = req.query?.id || url.searchParams.get('id');

      if (db && id) {
        await db.collection('pendingApprovals').deleteOne({
          $or: [{ id }, { _id: id }, { docId: id }]
        }).catch(() => null);
      }

      const payload = { success: true, message: 'Pending item deleted successfully' };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    const payload = { success: false, error: 'Method not supported' };
    if (typeof res.status === 'function') return res.status(405).json(payload);
    res.statusCode = 405;
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    const errorPayload = { success: false, error: err?.message || 'Server error' };
    if (typeof res.status === 'function') return res.status(500).json(errorPayload);
    res.statusCode = 500;
    res.end(JSON.stringify(errorPayload));
  }
}
