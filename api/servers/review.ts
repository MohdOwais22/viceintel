import { getMongoDb, sendJson, parseBody } from '../_lib/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();
  if (!db) {
    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  }

  try {
    const collection = db.collection('whitelistApplications');

    if (req.method === 'GET') {
      const { serverSlug, status, search } = req.query || {};
      let filter: any = {};
      if (serverSlug && serverSlug !== 'all') {
        filter.$or = [{ serverSlug }, { serverId: serverSlug }];
      }
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (search) {
        filter.$or = [
          { applicantGamerTag: { $regex: search, $options: 'i' } },
          { applicantEmail: { $regex: search, $options: 'i' } },
          { discordUsername: { $regex: search, $options: 'i' } }
        ];
      }

      const list = await collection.find(filter).sort({ submittedAt: -1 }).limit(100).toArray();
      return sendJson(res, 200, { success: true, count: list.length, data: list });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseBody(req);
      const { applicationId, id, status, reviewerNotes, reviewedBy } = body;
      const targetId = applicationId || id;

      if (!targetId || !status) {
        return sendJson(res, 400, { success: false, error: 'Application ID and status are required' });
      }

      const updateData: any = {
        status,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (reviewerNotes !== undefined) updateData.reviewerNotes = reviewerNotes;
      if (reviewedBy) updateData.reviewedBy = reviewedBy;

      const result = await collection.findOneAndUpdate(
        { id: targetId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      return sendJson(res, 200, {
        success: true,
        message: `Application ${targetId} updated to ${status}`,
        data: result?.value || updateData
      });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Whitelist Review Queue API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error' });
  }
}
