import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { WEAPONS_DATA } from '../src/data/weapons';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();

  try {
    if (db) {
      const collection = db.collection('weapons');

      // Auto-seed if empty
      const count = await collection.countDocuments();
      if (count === 0 && WEAPONS_DATA && WEAPONS_DATA.length > 0) {
        await collection.insertMany(WEAPONS_DATA.map(w => ({ ...w, id: w.id || w.name })));
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
            { category: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }

        const weapons = await collection.find(filter).toArray();
        return sendJson(res, 200, {
          success: true,
          count: weapons.length,
          source: 'MongoDB',
          data: weapons
        });
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await parseBody(req);
        const targetId = body.id || `weap_${Date.now()}`;
        const item = { ...body, id: targetId, updatedAt: new Date().toISOString() };

        await collection.updateOne(
          { id: targetId },
          { $set: item },
          { upsert: true }
        );

        return sendJson(res, 200, { success: true, message: 'Weapon saved to MongoDB', data: item });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query || {};
        if (!id) return sendJson(res, 400, { success: false, error: 'Weapon ID is required' });
        await collection.deleteOne({ id });
        return sendJson(res, 200, { success: true, message: `Deleted weapon ${id}` });
      }
    }

    if (req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        count: WEAPONS_DATA.length,
        source: 'StaticFallback',
        data: WEAPONS_DATA
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Weapons API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error', data: WEAPONS_DATA || [] });
  }
}
