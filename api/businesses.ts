import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { BUSINESSES_DATA } from '../src/data/businesses';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();

  try {
    if (db) {
      const collection = db.collection('businesses');

      // Auto-seed if empty
      const count = await collection.countDocuments();
      if (count === 0 && BUSINESSES_DATA && BUSINESSES_DATA.length > 0) {
        await collection.insertMany(BUSINESSES_DATA.map(b => ({ ...b, id: b.id || `biz_${Date.now()}` })));
      }

      if (req.method === 'GET') {
        const { type, search } = req.query || {};
        let filter: any = {};
        if (type && type !== 'all') {
          filter.type = new RegExp(`^${type}$`, 'i');
        }
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
          ];
        }

        const businesses = await collection.find(filter).toArray();
        return sendJson(res, 200, {
          success: true,
          count: businesses.length,
          source: 'MongoDB',
          data: businesses
        });
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await parseBody(req);
        const targetId = body.id || `biz_${Date.now()}`;
        const item = { ...body, id: targetId, updatedAt: new Date().toISOString() };

        await collection.updateOne(
          { id: targetId },
          { $set: item },
          { upsert: true }
        );

        return sendJson(res, 200, { success: true, message: 'Business saved to MongoDB', data: item });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query || {};
        if (!id) return sendJson(res, 400, { success: false, error: 'Business ID required' });
        await collection.deleteOne({ id });
        return sendJson(res, 200, { success: true, message: `Deleted business ${id}` });
      }
    }

    if (req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        count: BUSINESSES_DATA.length,
        source: 'StaticFallback',
        data: BUSINESSES_DATA
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Businesses API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error', data: BUSINESSES_DATA || [] });
  }
}
