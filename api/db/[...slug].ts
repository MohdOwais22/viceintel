import { getMongoDb, sendJson, parseBody } from '../_lib/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const pathSegments = (req.query?.slug || url.pathname.replace(/^\/api\/db\/?/, '').split('/')).filter(Boolean);

  let collectionName = '';
  let docId = '';
  let isQuery = false;

  if (Array.isArray(pathSegments)) {
    if (pathSegments[0] === 'query') {
      isQuery = true;
      collectionName = pathSegments[1] || '';
    } else {
      collectionName = pathSegments[0] || '';
      docId = pathSegments[1] || '';
    }
  }

  if (!collectionName) {
    return sendJson(res, 400, { success: false, error: 'Collection name is required' });
  }

  try {
    const db = await getMongoDb();
    if (!db) {
      return sendJson(res, 503, { success: false, error: 'MONGODB_URI not configured or unavailable' });
    }

    const collection = db.collection(collectionName);

    if (isQuery || (req.method === 'POST' && !docId)) {
      const body = await parseBody(req);
      const constraints = Array.isArray(body.constraints) ? body.constraints : [];
      let mongoFilter: Record<string, any> = {};

      for (const c of constraints) {
        if (c.type === 'where' && c.field && c.op && c.value !== undefined) {
          if (c.op === '==' || c.op === '===') {
            mongoFilter[c.field] = c.value;
          } else if (c.op === '!=') {
            mongoFilter[c.field] = { $ne: c.value };
          } else if (c.op === 'in' && Array.isArray(c.value)) {
            mongoFilter[c.field] = { $in: c.value };
          } else if (c.op === 'array-contains') {
            mongoFilter[c.field] = c.value;
          }
        }
      }

      const docs = await collection.find(mongoFilter).limit(200).toArray();
      return sendJson(res, 200, { success: true, count: docs.length, data: docs });
    }

    if (req.method === 'GET') {
      if (docId) {
        const found = await collection.findOne({
          $or: [{ id: docId }, { uid: docId }, { docId }]
        });
        return sendJson(res, 200, { success: true, data: found });
      } else {
        const docs = await collection.find({}).limit(200).toArray();
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

      return sendJson(res, 200, { success: true, id: targetId, data: payloadData });
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
    console.error('API DB error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Database operation error' });
  }
}
