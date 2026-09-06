export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(204).end();
    res.statusCode = 204;
    res.end();
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
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
      if (db) {
        const collection = db.collection('pendingApprovals');
        const docs = await collection.find({}).limit(50).toArray();

        const payload = {
          success: true,
          count: docs.length,
          source: 'MongoDB',
          data: docs.map((d: any) => ({
            ...d,
            id: d.id || d._id?.toString() || 'p_' + Date.now(),
          })),
        };

        if (typeof res.status === 'function') return res.status(200).json(payload);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
        return;
      }
    } catch (err: any) {
      console.warn('MongoDB Admin Pending error:', err);
    }
  }

  const fallback = {
    success: true,
    count: 0,
    source: 'MemoryState',
    data: [],
  };

  if (typeof res.status === 'function') return res.status(200).json(fallback);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(fallback));
}
