import { getMongoDb, sendJson } from '../../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection('pendingApprovals');
      const docs = await collection.find({}).limit(50).toArray();

      return sendJson(res, 200, {
        success: true,
        count: docs.length,
        source: 'MongoDB',
        data: docs.map((d: any) => ({
          ...d,
          id: d.id || d._id?.toString() || 'p_' + Date.now(),
        })),
      });
    }

    return sendJson(res, 200, {
      success: true,
      count: 0,
      source: 'MemoryState',
      data: [],
    });
  } catch (err: any) {
    console.warn('MongoDB Admin Pending error:', err);
    return sendJson(res, 200, {
      success: true,
      count: 0,
      source: 'MemoryState',
      data: [],
    });
  }
}

