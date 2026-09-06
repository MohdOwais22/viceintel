import { connectToMongoDB } from '../src/lib/db/mongodb';
import { findDocuments, saveDocument, deleteDocument } from '../src/lib/db/mongoHelpers';

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
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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

    // Handle Create / Update server (POST / PUT)
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      const targetId = body.id || body.serverId || body.slug || body.serverSlug || `srv_${Date.now()}`;
      const success = await saveDocument('servers', targetId, { ...body, id: targetId, docId: targetId });
      const payload = { success, id: targetId, message: success ? 'Server saved successfully' : 'Failed to save server' };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    // Handle Delete server (DELETE)
    if (req.method === 'DELETE') {
      const serverId = req.query?.id || req.body?.id || req.body?.serverId;
      if (!serverId) {
        const errorPayload = { success: false, error: 'Server ID is required for deletion' };
        if (typeof res.status === 'function') return res.status(400).json(errorPayload);
        res.statusCode = 400;
        res.end(JSON.stringify(errorPayload));
        return;
      }
      const success = await deleteDocument('servers', serverId);
      const payload = { success, message: success ? 'Server deleted successfully' : 'Failed to delete server' };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    // Handle GET (List all servers)
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
