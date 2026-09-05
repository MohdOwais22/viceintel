import { getMongoDb, sendJson, parseBody } from '../_lib/db';
import { RP_SERVERS_DATA } from '../../src/data/rpServers';

function getFilteredRpServers(query: any) {
  const { framework, region, isWhitelisted, search } = query || {};
  let list = [...RP_SERVERS_DATA];
  if (framework && framework !== 'all') {
    list = list.filter(s => s.framework?.toLowerCase() === framework.toLowerCase());
  }
  if (region && region !== 'all') {
    list = list.filter(s => s.region?.toLowerCase() === region.toLowerCase());
  }
  if (isWhitelisted === 'true') {
    list = list.filter(s => s.isWhitelisted === true);
  } else if (isWhitelisted === 'false') {
    list = list.filter(s => s.isWhitelisted === false);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(srv =>
      srv.name?.toLowerCase().includes(s) ||
      srv.description?.toLowerCase().includes(s) ||
      srv.tags?.some(t => t.toLowerCase().includes(s))
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
      const collection = db.collection('rpServers');

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
        if (servers.length > 0) {
          return sendJson(res, 200, {
            success: true,
            count: servers.length,
            source: 'MongoDB',
            data: servers
          });
        }

        // Fallback to pre-seeded static RP servers if database was not loaded/empty
        const fallbackData = getFilteredRpServers(req.query);
        return sendJson(res, 200, {
          success: true,
          count: fallbackData.length,
          source: 'PreSeededFallback',
          data: fallbackData
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
      const fallbackData = getFilteredRpServers(req.query);
      return sendJson(res, 200, {
        success: true,
        count: fallbackData.length,
        source: 'PreSeededFallback',
        data: fallbackData
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('RP Servers API error:', err);
    const fallbackData = getFilteredRpServers(req.query);
    return sendJson(res, 200, { success: true, count: fallbackData.length, source: 'PreSeededFallback', data: fallbackData });
  }
}
