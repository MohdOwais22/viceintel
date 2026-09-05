import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { VEHICLES_DATA } from '../src/data/vehicles';

function getFilteredVehicles(query: any) {
  const { category, brand, search } = query || {};
  let list = [...VEHICLES_DATA];
  if (category && category !== 'all') {
    list = list.filter(v => v.category?.toLowerCase() === category.toLowerCase());
  }
  if (brand && brand !== 'all') {
    list = list.filter(v => v.brand?.toLowerCase() === brand.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(v =>
      v.name?.toLowerCase().includes(s) ||
      v.brand?.toLowerCase().includes(s) ||
      v.category?.toLowerCase().includes(s)
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
      const collection = db.collection('vehicles');

      if (req.method === 'GET') {
        const { category, brand, search } = req.query || {};
        let filter: any = {};
        if (category && category !== 'all') {
          filter.category = new RegExp(`^${category}$`, 'i');
        }
        if (brand && brand !== 'all') {
          filter.brand = new RegExp(`^${brand}$`, 'i');
        }
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
          ];
        }

        const vehicles = await collection.find(filter).toArray();
        if (vehicles.length > 0) {
          return sendJson(res, 200, {
            success: true,
            count: vehicles.length,
            source: 'MongoDB',
            data: vehicles
          });
        }

        // Fallback to pre-seeded static vehicles if database was not loaded/empty
        const fallbackData = getFilteredVehicles(req.query);
        return sendJson(res, 200, {
          success: true,
          count: fallbackData.length,
          source: 'PreSeededFallback',
          data: fallbackData
        });
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await parseBody(req);
        const targetId = body.id || body.slug || `veh_${Date.now()}`;
        const item = { ...body, id: targetId, updatedAt: new Date().toISOString() };

        await collection.updateOne(
          { $or: [{ id: targetId }, { slug: targetId }] },
          { $set: item },
          { upsert: true }
        );

        return sendJson(res, 200, { success: true, message: 'Vehicle saved to MongoDB', data: item });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query || {};
        if (!id) return sendJson(res, 400, { success: false, error: 'Vehicle ID is required' });
        await collection.deleteOne({ $or: [{ id }, { slug: id }] });
        return sendJson(res, 200, { success: true, message: `Deleted vehicle ${id}` });
      }
    }

    if (req.method === 'GET') {
      const fallbackData = getFilteredVehicles(req.query);
      return sendJson(res, 200, {
        success: true,
        count: fallbackData.length,
        source: 'PreSeededFallback',
        data: fallbackData
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Vehicles API error:', err);
    const fallbackData = getFilteredVehicles(req.query);
    return sendJson(res, 200, { success: true, count: fallbackData.length, source: 'PreSeededFallback', data: fallbackData });
  }
}
