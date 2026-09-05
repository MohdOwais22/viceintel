import { getMongoDb, sendJson, parseBody } from '../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();
  if (!db) {
    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  }

  try {
    const collection = db.collection('coupons');

    if (req.method === 'GET') {
      const { code } = req.query || {};
      if (code) {
        const found = await collection.findOne({ code: code.toUpperCase() });
        if (!found) return sendJson(res, 404, { success: false, message: 'Invalid coupon code' });
        return sendJson(res, 200, { success: true, data: found });
      }

      const all = await collection.find({}).toArray();
      return sendJson(res, 200, { success: true, count: all.length, data: all });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseBody(req);
      const code = (body.code || `VIP_${Date.now()}`).toUpperCase();
      const coupon = {
        ...body,
        code,
        id: body.id || code,
        discountPercent: Number(body.discountPercent || 20),
        isActive: body.isActive !== undefined ? body.isActive : true,
        updatedAt: new Date().toISOString()
      };

      await collection.updateOne({ code }, { $set: coupon }, { upsert: true });
      return sendJson(res, 200, { success: true, message: 'Coupon saved', data: coupon });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Coupons API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error' });
  }
}
