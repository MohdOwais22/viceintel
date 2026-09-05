import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { MAP_LOCATIONS_DATA } from '../src/data/mapLocations';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();

  try {
    if (db) {
      const collection = db.collection('mapLocations');

      // Auto-seed if empty
      const count = await collection.countDocuments();
      if (count === 0 && MAP_LOCATIONS_DATA && MAP_LOCATIONS_DATA.length > 0) {
        await collection.insertMany(MAP_LOCATIONS_DATA.map(m => ({ ...m, id: m.id || `loc_${Date.now()}` })));
      }

      if (req.method === 'GET') {
        const { category, search } = req.query || {};
        let filter: any = {};
        if (category && category !== 'all') {
          filter.category = new RegExp(`^${category}$`, 'i');
        }
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { district: { $regex: search, $options: 'i' } }
          ];
        }

        const locations = await collection.find(filter).toArray();
        return sendJson(res, 200, {
          success: true,
          count: locations.length,
          source: 'MongoDB',
          data: locations
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
      return sendJson(res, 200, {
        success: true,
        count: MAP_LOCATIONS_DATA.length,
        source: 'StaticFallback',
        data: MAP_LOCATIONS_DATA
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Map API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error', data: MAP_LOCATIONS_DATA || [] });
  }
}
