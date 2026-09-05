import { getMongoDb, sendJson, parseBody } from '../../../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const pathSegments = (req.query?.slug || url.pathname.replace(/^\/api\/admin\/cms\/?/, '').split('/')).filter(Boolean);
  const collectionName = Array.isArray(pathSegments) ? pathSegments[0] : (req.query?.collection || 'userProfiles');
  const docId = Array.isArray(pathSegments) ? pathSegments[1] : req.query?.id;

  if (!collectionName) {
    return sendJson(res, 400, { success: false, error: 'Collection name is required' });
  }

  try {
    const db = await getMongoDb();
    if (!db) {
      return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
    }

    const collection = db.collection(collectionName);

    if (req.method === 'GET') {
      if (docId) {
        const found = await collection.findOne({
          $or: [{ id: docId }, { uid: docId }, { docId }]
        });
        return sendJson(res, 200, { success: true, data: found });
      } else {
        const docs = await collection.find({}).limit(100).toArray();
        return sendJson(res, 200, { success: true, count: docs.length, data: docs });
      }
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseBody(req);
      const targetId = docId || body.id || body.uid || body.docId || `doc_${Date.now()}`;
      const payloadData = {
        ...body,
        id: targetId,
        uid: body.uid || targetId,
        updatedAt: new Date().toISOString()
      };

      await collection.updateOne(
        { $or: [{ id: targetId }, { uid: targetId }, { docId: targetId }] },
        { $set: payloadData },
        { upsert: true }
      );

      return sendJson(res, 200, { success: true, message: 'Document saved', id: targetId, data: payloadData });
    }

    if (req.method === 'DELETE') {
      if (!docId) {
        return sendJson(res, 400, { success: false, error: 'Document id required for delete' });
      }

      await collection.deleteOne({
        $or: [{ id: docId }, { uid: docId }, { docId }]
      });

      return sendJson(res, 200, { success: true, message: `Deleted ${docId}` });
    }

    return sendJson(res, 405, { success: false, error: `Method ${req.method} not allowed` });
  } catch (err: any) {
    console.error('Admin CMS error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Database operation error' });
  }
}
