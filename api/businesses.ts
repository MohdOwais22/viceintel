import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { BUSINESSES_DATA } from '../src/data/businesses';

function getFilteredBusinesses(query: any) {
  const { type, search } = query || {};
  let list = [...BUSINESSES_DATA];
  if (type && type !== 'all') {
    list = list.filter(b => b.type?.toLowerCase() === type.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(b =>
      b.name?.toLowerCase().includes(s) ||
      b.description?.toLowerCase().includes(s) ||
      b.location?.toLowerCase().includes(s)
    );
  }
  return list;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();

  try {
    if (db) {
      const collection = db.collection('businesses');

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
        if (businesses.length > 0) {
          return sendJson(res, 200, {
            success: true,
            count: businesses.length,
            source: 'MongoDB',
            data: businesses
          });
        }

        // Fallback to pre-seeded static businesses if database was not loaded/empty
        const fallbackData = getFilteredBusinesses(req.query);
        return sendJson(res, 200, {
          success: true,
          count: fallbackData.length,
          source: 'PreSeededFallback',
          data: fallbackData
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
      const fallbackData = getFilteredBusinesses(req.query);
      return sendJson(res, 200, {
        success: true,
        count: fallbackData.length,
        source: 'PreSeededFallback',
        data: fallbackData
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Businesses API error:', err);
    const fallbackData = getFilteredBusinesses(req.query);
    return sendJson(res, 200, { success: true, count: fallbackData.length, source: 'PreSeededFallback', data: fallbackData });
  }
}
