import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { CHARACTERS_DATA } from '../src/data/characters';

function getFilteredCharacters(query: any) {
  const { role, faction, search } = query || {};
  let list = [...CHARACTERS_DATA];
  if (role && role !== 'all') {
    list = list.filter(c => c.role?.toLowerCase() === role.toLowerCase());
  }
  if (faction && faction !== 'all') {
    list = list.filter(c => c.faction?.toLowerCase() === faction.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.faction?.toLowerCase().includes(s) ||
      c.description?.toLowerCase().includes(s) ||
      c.location?.toLowerCase().includes(s)
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
      const collection = db.collection('characters');

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
        if (characters.length > 0) {
          return sendJson(res, 200, {
            success: true,
            count: characters.length,
            source: 'MongoDB',
            data: characters
          });
        }

        // Fallback to pre-seeded static characters if database was not loaded/empty
        const fallbackData = getFilteredCharacters(req.query);
        return sendJson(res, 200, {
          success: true,
          count: fallbackData.length,
          source: 'PreSeededFallback',
          data: fallbackData
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
      const fallbackData = getFilteredCharacters(req.query);
      return sendJson(res, 200, {
        success: true,
        count: fallbackData.length,
        source: 'PreSeededFallback',
        data: fallbackData
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Characters API error:', err);
    const fallbackData = getFilteredCharacters(req.query);
    return sendJson(res, 200, { success: true, count: fallbackData.length, source: 'PreSeededFallback', data: fallbackData });
  }
}
