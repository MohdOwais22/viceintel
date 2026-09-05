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
    const formsCollection = db.collection('serverWhitelistForms');
    const serversCollection = db.collection('rpServers');

    const serverSlug = req.query?.slug || req.query?.id;

    if (req.method === 'GET') {
      if (!serverSlug) {
        // Return all managed forms
        const allForms = await formsCollection.find({}).toArray();
        return sendJson(res, 200, { success: true, data: allForms });
      }

      const formConfig = await formsCollection.findOne({
        $or: [{ serverSlug }, { serverId: serverSlug }, { id: serverSlug }]
      });

      const serverDetails = await serversCollection.findOne({
        $or: [{ id: serverSlug }, { slug: serverSlug }]
      });

      return sendJson(res, 200, {
        success: true,
        data: {
          server: serverDetails,
          form: formConfig || {
            serverId: serverSlug,
            serverSlug,
            questions: [],
            discordWebhookUrl: '',
            discordGuildId: '',
            discordRoleId: '',
            requireDiscord: true,
            minAge: 16,
            autoAiReview: true,
            status: 'active'
          }
        }
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseBody(req);
      const targetSlug = serverSlug || body.serverSlug || body.serverId || body.id;

      if (!targetSlug) {
        return sendJson(res, 400, { success: false, error: 'Server slug/id is required' });
      }

      const formData = {
        ...body,
        serverSlug: targetSlug,
        serverId: targetSlug,
        updatedAt: new Date().toISOString()
      };

      await formsCollection.updateOne(
        { $or: [{ serverSlug: targetSlug }, { serverId: targetSlug }] },
        { $set: formData },
        { upsert: true }
      );

      // Also update server record if server details provided
      if (body.serverDetails) {
        await serversCollection.updateOne(
          { $or: [{ id: targetSlug }, { slug: targetSlug }] },
          { $set: { ...body.serverDetails, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Server Owner settings and whitelist form saved to MongoDB',
        data: formData
      });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Server Owner Manage API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error' });
  }
}
