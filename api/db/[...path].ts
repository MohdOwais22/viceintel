import { connectToMongoDB } from '../../src/lib/db/mongodb';
import { getModelForCollection, saveDocument, findDocument, findDocuments, deleteDocument } from '../../src/lib/db/mongoHelpers';

export default async function handler(req: any, res: any) {
  try {
    if (res.setHeader) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Content-Type', 'application/json');
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') return res.status(200).end();
      res.statusCode = 200;
      res.end();
      return;
    }

    const pathSegments = req.query?.path || [];
    const [colOrQuery, docIdOrAction] = Array.isArray(pathSegments) ? pathSegments : [pathSegments];

    await connectToMongoDB().catch(() => null);

    if (colOrQuery === 'query') {
      const collectionName = docIdOrAction;
      let constraints = [];
      if (req.method === 'POST') {
        const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
        constraints = body.constraints || [];
      }
      const docs = await findDocuments(collectionName, constraints).catch(() => []);
      if (typeof res.status === 'function') return res.status(200).json({ success: true, data: docs });
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: docs }));
      return;
    }

    const collectionName = colOrQuery;
    const docId = docIdOrAction;

    if (!collectionName) {
      const payload = { success: false, error: 'Missing collection name' };
      if (typeof res.status === 'function') return res.status(400).json(payload);
      res.statusCode = 400;
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'GET') {
      if (docId) {
        const doc = await findDocument(collectionName, docId).catch(() => null);
        if (doc) {
          const payload = { success: true, data: doc };
          if (typeof res.status === 'function') return res.status(200).json(payload);
          res.statusCode = 200;
          res.end(JSON.stringify(payload));
          return;
        }
        const notFound = { success: false, error: 'Document not found' };
        if (typeof res.status === 'function') return res.status(404).json(notFound);
        res.statusCode = 404;
        res.end(JSON.stringify(notFound));
        return;
      } else {
        const docs = await findDocuments(collectionName, []).catch(() => []);
        const payload = { success: true, data: docs };
        if (typeof res.status === 'function') return res.status(200).json(payload);
        res.statusCode = 200;
        res.end(JSON.stringify(payload));
        return;
      }
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      const targetId = docId || body.id || body.uid || `doc_${Date.now()}`;
      const success = await saveDocument(collectionName, targetId, body);
      const payload = { success, id: targetId };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'DELETE') {
      if (docId) {
        const success = await deleteDocument(collectionName, docId).catch(() => false);
        const payload = { success };
        if (typeof res.status === 'function') return res.status(200).json(payload);
        res.statusCode = 200;
        res.end(JSON.stringify(payload));
        return;
      }
      const payload = { success: false, error: 'Missing document id for delete' };
      if (typeof res.status === 'function') return res.status(400).json(payload);
      res.statusCode = 400;
      res.end(JSON.stringify(payload));
      return;
    }

    const notAllowed = { success: false, error: 'Method not allowed' };
    if (typeof res.status === 'function') return res.status(405).json(notAllowed);
    res.statusCode = 405;
    res.end(JSON.stringify(notAllowed));
  } catch (err: any) {
    const errorPayload = { success: false, error: err?.message || 'Serverless database error' };
    if (typeof res.status === 'function') return res.status(500).json(errorPayload);
    res.statusCode = 500;
    res.end(JSON.stringify(errorPayload));
  }
}
