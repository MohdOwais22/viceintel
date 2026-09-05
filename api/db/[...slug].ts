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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(204).end();
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const pathSegments = (req.query?.slug || url.pathname.replace(/^\/api\/db\/?/, '').split('/')).filter(Boolean);

  let collectionName = '';
  let docId = '';
  let isQuery = false;

  if (Array.isArray(pathSegments)) {
    if (pathSegments[0] === 'query') {
      isQuery = true;
      collectionName = pathSegments[1] || '';
    } else {
      collectionName = pathSegments[0] || '';
      docId = pathSegments[1] || '';
    }
  }

  if (!collectionName) {
    const payload = { success: false, error: 'Collection name is required' };
    if (typeof res.status === 'function') return res.status(400).json(payload);
    res.statusCode = 400;
    res.end(JSON.stringify(payload));
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    const payload = { success: false, error: 'MONGODB_URI not configured' };
    if (typeof res.status === 'function') return res.status(503).json(payload);
    res.statusCode = 503;
    res.end(JSON.stringify(payload));
    return;
  }

  try {
    const mongooseModule = await import('mongoose');
    const mongoose = (mongooseModule as any).default || mongooseModule;
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri.trim(), {
        dbName: process.env.MONGODB_DB_NAME || undefined,
        serverSelectionTimeoutMS: 4000,
        socketTimeoutMS: 5000,
        bufferCommands: false,
      });
    }

    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection handle not available');

    const collection = db.collection(collectionName);

    if (isQuery || (req.method === 'POST' && !docId)) {
      const body = await parseBody(req);
      const constraints = Array.isArray(body.constraints) ? body.constraints : [];
      let mongoFilter: Record<string, any> = {};

      for (const c of constraints) {
        if (c.type === 'where' && c.field && c.op && c.value !== undefined) {
          if (c.op === '==' || c.op === '===') {
            mongoFilter[c.field] = c.value;
          } else if (c.op === '!=') {
            mongoFilter[c.field] = { $ne: c.value };
          } else if (c.op === 'in' && Array.isArray(c.value)) {
            mongoFilter[c.field] = { $in: c.value };
          } else if (c.op === 'array-contains') {
            mongoFilter[c.field] = c.value;
          }
        }
      }

      const docs = await collection.find(mongoFilter).limit(200).toArray();
      const payload = { success: true, count: docs.length, data: docs };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'GET') {
      if (docId) {
        const found = await collection.findOne({
          $or: [{ id: docId }, { uid: docId }, { docId }]
        });
        const payload = { success: true, data: found };
        if (typeof res.status === 'function') return res.status(200).json(payload);
        res.statusCode = 200;
        res.end(JSON.stringify(payload));
        return;
      } else {
        const docs = await collection.find({}).limit(200).toArray();
        const payload = { success: true, count: docs.length, data: docs };
        if (typeof res.status === 'function') return res.status(200).json(payload);
        res.statusCode = 200;
        res.end(JSON.stringify(payload));
        return;
      }
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseBody(req);
      const targetId = docId || body.id || body.uid || body.docId || `doc_${Date.now()}`;
      const payloadData = {
        ...body,
        id: targetId,
        uid: body.uid || targetId,
        updatedAt: new Date().toISOString()
      };

      await collection.updateOne(
        { $or: [{ id: targetId }, { uid: targetId }, { docId: targetId }] },
        { $set: payloadData },
        { upsert: true }
      );

      const resp = { success: true, id: targetId, data: payloadData };
      if (typeof res.status === 'function') return res.status(200).json(resp);
      res.statusCode = 200;
      res.end(JSON.stringify(resp));
      return;
    }

    if (req.method === 'DELETE') {
      if (!docId) {
        const payload = { success: false, error: 'Document id required for delete' };
        if (typeof res.status === 'function') return res.status(400).json(payload);
        res.statusCode = 400;
        res.end(JSON.stringify(payload));
        return;
      }

      await collection.deleteOne({
        $or: [{ id: docId }, { uid: docId }, { docId }]
      });

      const resp = { success: true, message: `Deleted ${docId}` };
      if (typeof res.status === 'function') return res.status(200).json(resp);
      res.statusCode = 200;
      res.end(JSON.stringify(resp));
      return;
    }

    const payload = { success: false, error: `Method ${req.method} not allowed` };
    if (typeof res.status === 'function') return res.status(405).json(payload);
    res.statusCode = 405;
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    console.error('API DB error:', err);
    const payload = { success: false, error: err.message || 'Database operation error' };
    if (typeof res.status === 'function') return res.status(500).json(payload);
    res.statusCode = 500;
    res.end(JSON.stringify(payload));
  }
}
