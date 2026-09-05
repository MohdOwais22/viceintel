import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { WEAPONS_DATA } from '../src/data/weapons';

function getFilteredWeapons(query: any) {
  const { category, search } = query || {};
  let list = [...WEAPONS_DATA];
  if (category && category !== 'all') {
    list = list.filter(w => w.category?.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(w =>
      w.name?.toLowerCase().includes(s) ||
      w.category?.toLowerCase().includes(s) ||
      w.description?.toLowerCase().includes(s)
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
      const collection = db.collection('weapons');

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
        if (weapons.length > 0) {
          return sendJson(res, 200, {
            success: true,
            count: weapons.length,
            source: 'MongoDB',
            data: weapons
          });
        }

        // Fallback to pre-seeded static weapons if database was not loaded/empty
        const fallbackData = getFilteredWeapons(req.query);
        return sendJson(res, 200, {
          success: true,
          count: fallbackData.length,
          source: 'PreSeededFallback',
          data: fallbackData
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
      const fallbackData = getFilteredWeapons(req.query);
      return sendJson(res, 200, {
        success: true,
        count: fallbackData.length,
        source: 'PreSeededFallback',
        data: fallbackData
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Weapons API error:', err);
    const fallbackData = getFilteredWeapons(req.query);
    return sendJson(res, 200, { success: true, count: fallbackData.length, source: 'PreSeededFallback', data: fallbackData });
  }
}
