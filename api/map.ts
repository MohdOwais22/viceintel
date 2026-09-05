import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { MAP_LOCATIONS_DATA } from '../src/data/mapLocations';

function getFilteredMapLocations(query: any) {
  const { category, search } = query || {};
  let list = [...MAP_LOCATIONS_DATA];
  if (category && category !== 'all' && category !== 'All') {
    list = list.filter(l => l.category?.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(l =>
      l.title?.toLowerCase().includes(s) ||
      (l as any).name?.toLowerCase().includes(s) ||
      l.description?.toLowerCase().includes(s) ||
      l.district?.toLowerCase().includes(s)
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
      const collection = db.collection('mapLocations');

      if (req.method === 'GET') {
        const { category, search } = req.query || {};
        let filter: any = {};
        if (category && category !== 'all' && category !== 'All') {
          filter.category = new RegExp(`^${category}$`, 'i');
        }
        if (search) {
          filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { district: { $regex: search, $options: 'i' } }
          ];
        }

        const locations = await collection.find(filter).toArray();
        if (locations.length > 0) {
          return sendJson(res, 200, {
            success: true,
            count: locations.length,
            source: 'MongoDB',
            data: locations
          });
        }

        // Fallback to pre-seeded static map locations if database was not loaded/empty
        const fallbackData = getFilteredMapLocations(req.query);
        return sendJson(res, 200, {
          success: true,
          count: fallbackData.length,
          source: 'PreSeededFallback',
          data: fallbackData
        });
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await parseBody(req);
        const targetId = body.id || `loc_${Date.now()}`;
        const item = { ...body, id: targetId, updatedAt: new Date().toISOString() };

        await collection.updateOne(
          { id: targetId },
          { $set: item },
          { upsert: true }
        );

        return sendJson(res, 200, { success: true, message: 'Location saved to MongoDB', data: item });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query || {};
        if (!id) return sendJson(res, 400, { success: false, error: 'Location ID required' });
        await collection.deleteOne({ id });
        return sendJson(res, 200, { success: true, message: `Deleted location ${id}` });
      }
    }

    if (req.method === 'GET') {
      const fallbackData = getFilteredMapLocations(req.query);
      return sendJson(res, 200, {
        success: true,
        count: fallbackData.length,
        source: 'PreSeededFallback',
        data: fallbackData
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Map API error:', err);
    const fallbackData = getFilteredMapLocations(req.query);
    return sendJson(res, 200, { success: true, count: fallbackData.length, source: 'PreSeededFallback', data: fallbackData });
  }
}
