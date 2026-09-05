import { getMongoDb, sendJson } from '../../lib/db';
import { RP_SERVERS_DATA } from '../../src/data/rpServers';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const slug = req.query?.slug || url.pathname.split('/').pop() || '';

  const db = await getMongoDb();

  try {
    if (db) {
      const collection = db.collection('rpServers');
      const found = await collection.findOne({
        $or: [{ id: slug }, { slug: slug }, { name: new RegExp(`^${slug}$`, 'i') }]
      });

      if (found) {
        return sendJson(res, 200, { success: true, data: found });
      }
    }

    // Static lookup fallback
    const staticFound = RP_SERVERS_DATA.find(s => s.id === slug || (s as any).slug === slug);
    if (staticFound) {
      return sendJson(res, 200, { success: true, data: staticFound, source: 'static' });
    }

    return sendJson(res, 404, { success: false, error: 'Server not found' });
  } catch (err: any) {
    console.error('Single server API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error' });
  }
}
