import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { VEHICLES_DATA } from '../src/data/vehicles';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();

  try {
    if (db) {
      const collection = db.collection('vehicles');

      // Auto-seed if empty
      const count = await collection.countDocuments();
      if (count === 0 && VEHICLES_DATA && VEHICLES_DATA.length > 0) {
        await collection.insertMany(VEHICLES_DATA.map(v => ({ ...v, id: v.id || v.slug })));
      }

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
        return sendJson(res, 200, {
          success: true,
          count: vehicles.length,
          source: 'MongoDB',
          data: vehicles
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

    // Static fallback if MongoDB is not connected
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        count: VEHICLES_DATA.length,
        source: 'StaticFallback',
        data: VEHICLES_DATA
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Vehicles API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error', data: VEHICLES_DATA || [] });
  }
}
