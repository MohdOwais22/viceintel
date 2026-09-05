import { getMongoDb, sendJson, parseBody } from '../../lib/db';

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

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newApp = {
        id: appId,
        serverSlug: body.serverSlug || 'general',
        serverId: body.serverId || body.serverSlug || 'general',
        serverName: body.serverName || 'Vice City RP',
        applicantUid: body.applicantUid || body.userId || 'guest',
        applicantGamerTag: body.applicantGamerTag || body.gamerTag || 'Player',
        applicantEmail: body.applicantEmail || body.email || '',
        discordId: body.discordId || null,
        discordUsername: body.discordUsername || null,
        status: body.status || 'Pending', // 'Pending' | 'Under Review' | 'Approved' | 'Rejected'
        answers: body.answers || {},
        aiScore: body.aiScore || null,
        aiFeedback: body.aiFeedback || null,
        reviewerNotes: '',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await collection.insertOne(newApp);

      return sendJson(res, 201, {
        success: true,
        message: 'Application submitted successfully to MongoDB',
        applicationId: appId,
        data: newApp
      });
    }

    if (req.method === 'GET') {
      const { applicantUid, serverSlug, appId } = req.query || {};
      let filter: any = {};
      if (appId) filter.id = appId;
      if (applicantUid) filter.applicantUid = applicantUid;
      if (serverSlug) filter.$or = [{ serverSlug }, { serverId: serverSlug }];

      const apps = await collection.find(filter).sort({ submittedAt: -1 }).toArray();
      return sendJson(res, 200, { success: true, count: apps.length, data: apps });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Whitelist Application API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error' });
  }
}
