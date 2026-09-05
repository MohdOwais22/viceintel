import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { CHARACTERS_DATA } from '../src/data/characters';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();

  try {
    if (db) {
      const collection = db.collection('characters');

      // Auto-seed if empty
      const count = await collection.countDocuments();
      if (count === 0 && CHARACTERS_DATA && CHARACTERS_DATA.length > 0) {
        await collection.insertMany(CHARACTERS_DATA.map(c => ({ ...c, id: c.id || c.slug })));
      }

      if (req.method === 'GET') {
        const { role, faction, search } = req.query || {};
        let filter: any = {};
        if (role && role !== 'all') {
          filter.role = new RegExp(`^${role}$`, 'i');
        }
        if (faction && faction !== 'all') {
          filter.faction = new RegExp(`^${faction}$`, 'i');
        }
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { faction: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
          ];
        }

        const characters = await collection.find(filter).toArray();
        return sendJson(res, 200, {
          success: true,
          count: characters.length,
          source: 'MongoDB',
          data: characters
        });
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await parseBody(req);
        const targetId = body.id || body.slug || `char_${Date.now()}`;
        const item = { ...body, id: targetId, updatedAt: new Date().toISOString() };

        await collection.updateOne(
          { $or: [{ id: targetId }, { slug: targetId }] },
          { $set: item },
          { upsert: true }
        );

        return sendJson(res, 200, { success: true, message: 'Character saved to MongoDB', data: item });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query || {};
        if (!id) return sendJson(res, 400, { success: false, error: 'Character ID is required' });
        await collection.deleteOne({ $or: [{ id }, { slug: id }] });
        return sendJson(res, 200, { success: true, message: `Deleted character ${id}` });
      }
    }

    if (req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        count: CHARACTERS_DATA.length,
        source: 'StaticFallback',
        data: CHARACTERS_DATA
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Characters API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error', data: CHARACTERS_DATA || [] });
  }
}
