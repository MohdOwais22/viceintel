import { getMongoDb, sendJson, parseBody } from '../_lib/db';
import { RP_SERVERS_DATA } from '../../src/data/rpServers';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();

  try {
    if (db) {
      const collection = db.collection('rpServers');

      // Auto-seed if empty
      const count = await collection.countDocuments();
      if (count === 0 && RP_SERVERS_DATA && RP_SERVERS_DATA.length > 0) {
        await collection.insertMany(RP_SERVERS_DATA.map(s => ({ ...s, id: s.id || `rp_${Date.now()}` })));
      }

      if (req.method === 'GET') {
        const { framework, region, isWhitelisted, search } = req.query || {};
        let filter: any = {};

        if (framework && framework !== 'all') {
          filter.framework = new RegExp(`^${framework}$`, 'i');
        }
        if (region && region !== 'all') {
          filter.region = new RegExp(`^${region}$`, 'i');
        }
        if (isWhitelisted === 'true') {
          filter.isWhitelisted = true;
        } else if (isWhitelisted === 'false') {
          filter.isWhitelisted = false;
        }
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ];
        }

        const servers = await collection.find(filter).toArray();
        return sendJson(res, 200, {
          success: true,
          count: servers.length,
          source: 'MongoDB',
          data: servers
        });
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await parseBody(req);
        const targetId = body.id || `rp_${Date.now()}`;
        const item = {
          ...body,
          id: targetId,
          lastPingTimestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await collection.updateOne(
          { id: targetId },
          { $set: item },
          { upsert: true }
        );

        return sendJson(res, 200, { success: true, message: 'Server saved to MongoDB', data: item });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query || {};
        if (!id) return sendJson(res, 400, { success: false, error: 'Server ID is required' });
        await collection.deleteOne({ id });
        return sendJson(res, 200, { success: true, message: `Deleted server ${id}` });
      }
    }

    if (req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        count: RP_SERVERS_DATA.length,
        source: 'StaticFallback',
        data: RP_SERVERS_DATA
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('RP Servers API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error', data: RP_SERVERS_DATA || [] });
  }
}
