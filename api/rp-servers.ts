import { connectToMongoDB } from '../src/lib/db/mongodb';
import { findDocuments } from '../src/lib/db/mongoHelpers';

function dedupeRpServers(servers: any[]) {
  const map = new Map<string, any>();
  for (const s of servers) {
    if (!s) continue;
    const key = (s.serverId || s.slug || s.serverSlug || s.id || s.name || '').toLowerCase().trim();
    if (key && !map.has(key)) {
      map.set(key, s);
    }
  }
  return Array.from(map.values());
}

export default async function handler(req: any, res: any) {
  try {
    if (res.setHeader) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Content-Type', 'application/json');
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') return res.status(200).end();
      res.statusCode = 200;
      res.end();
      return;
    }

    await connectToMongoDB().catch(() => null);

    let mongoServers: any[] = [];
    try {
      const docs = await findDocuments('servers', {}, 500);
      if (Array.isArray(docs) && docs.length > 0) {
        mongoServers = docs;
      }
    } catch (err) {
      console.warn('[Vercel RP-Servers API] MongoDB query notice:', err);
    }

    const deduped = dedupeRpServers(mongoServers);

    const payload = {
      success: true,
      count: deduped.length,
      source: mongoServers.length > 0 ? 'MongoDB' : 'Empty',
      data: deduped,
      lastSyncIso: new Date().toISOString()
    };

    if (typeof res.status === 'function') return res.status(200).json(payload);
    res.statusCode = 200;
    res.end(JSON.stringify(payload));
  } catch (err: any) {
    const errorPayload = { success: false, error: err?.message || 'Server error' };
    if (typeof res.status === 'function') return res.status(500).json(errorPayload);
    res.statusCode = 500;
    res.end(JSON.stringify(errorPayload));
  }
}
