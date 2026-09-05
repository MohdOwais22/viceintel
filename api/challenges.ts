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
    const collection = db.collection('challengeEntries');

    if (req.method === 'GET') {
      const { challengeId, vehicleModel, sortMetric, limit } = req.query || {};
      let filter: any = {};
      if (challengeId) filter.challengeId = challengeId;
      if (vehicleModel) filter.vehicleModel = vehicleModel;

      let sortOption: any = { score: -1, submittedAt: 1 };
      if (sortMetric === 'time' || sortMetric === 'quarter_mile') {
        sortOption = { quarterMileTime: 1, submittedAt: 1 };
      } else if (sortMetric === 'speed' || sortMetric === 'top_speed') {
        sortOption = { topSpeedMph: -1, submittedAt: 1 };
      }

      const entries = await collection.find(filter).sort(sortOption).limit(Number(limit) || 100).toArray();
      return sendJson(res, 200, { success: true, count: entries.length, data: entries });
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const entryId = body.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const entry = {
        ...body,
        id: entryId,
        submittedAt: body.submittedAt || new Date().toISOString()
      };

      await collection.insertOne(entry);
      return sendJson(res, 201, { success: true, message: 'Challenge entry submitted to MongoDB', data: entry });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Challenges API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error' });
  }
}
