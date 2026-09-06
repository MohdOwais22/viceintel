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
    console.warn('[CMS API] MongoDB connection warning:', err);
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
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Content-Type', 'application/json');
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') return res.status(200).end();
      res.statusCode = 200;
      res.end();
      return;
    }

    const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
    const pathname = url.pathname.replace(/^\/api\/admin\/cms\/?/, '');
    const parts = pathname.split('/').filter(Boolean);
    const collectionName = req.query?.slug?.[0] || parts[0];
    const docId = req.query?.slug?.[1] || parts[1];

    if (!collectionName) {
      const errorPayload = { success: false, error: 'Collection name is required' };
      if (typeof res.status === 'function') return res.status(400).json(errorPayload);
      res.statusCode = 400;
      res.end(JSON.stringify(errorPayload));
      return;
    }

    const db = await getMongoDatabase();

    if (req.method === 'GET') {
      let docs: any[] = [];
      if (db) {
        try {
          if (docId) {
            const found = await db.collection(collectionName).findOne({
              $or: [{ id: docId }, { uid: docId }, { docId }]
            });
            if (found) {
              const payload = { success: true, data: { ...found, id: found.id || found._id?.toString() } };
              if (typeof res.status === 'function') return res.status(200).json(payload);
              res.statusCode = 200;
              res.end(JSON.stringify(payload));
              return;
            }
          } else {
            docs = await db.collection(collectionName).find({}).limit(500).toArray();
          }
        } catch (queryErr) {
          console.warn(`[CMS API] Read error in ${collectionName}:`, queryErr);
        }
      }

      const payload = {
        success: true,
        collection: collectionName,
        count: docs.length,
        data: docs.map((d: any) => ({ ...d, id: d.id || d._id?.toString() }))
      };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const body = await parseBody(req);
      const targetId = docId || body.id || body.uid || `${collectionName}_${Date.now()}`;
      const cleanData = { ...body, id: targetId, docId: targetId, updatedAt: new Date() };

      if (db) {
        try {
          await db.collection(collectionName).updateOne(
            { $or: [{ id: targetId }, { uid: targetId }, { docId: targetId }] },
            { $set: cleanData },
            { upsert: true }
          );
        } catch (writeErr) {
          console.warn(`[CMS API] Write error in ${collectionName}:`, writeErr);
        }
      }

      const payload = { success: true, id: targetId, message: `Document saved to ${collectionName}`, data: cleanData };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'DELETE') {
      const targetId = docId || req.query?.id;
      if (!targetId) {
        const errorPayload = { success: false, error: 'Document ID is required for deletion' };
        if (typeof res.status === 'function') return res.status(400).json(errorPayload);
        res.statusCode = 400;
        res.end(JSON.stringify(errorPayload));
        return;
      }

      if (db) {
        try {
          await db.collection(collectionName).deleteMany({
            $or: [{ id: targetId }, { uid: targetId }, { docId: targetId }]
          });
        } catch (delErr) {
          console.warn(`[CMS API] Delete error in ${collectionName}:`, delErr);
        }
      }

      const payload = { success: true, message: `Document ${targetId} deleted from ${collectionName}` };
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
