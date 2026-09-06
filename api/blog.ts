import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { BLOG_POSTS_DATA } from '../src/data/blogPosts';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();

  try {
    if (db) {
      const collection = db.collection('blogPosts');

      // Auto-seed if empty
      const count = await collection.countDocuments();
      if (count === 0 && BLOG_POSTS_DATA && BLOG_POSTS_DATA.length > 0) {
        await collection.insertMany(BLOG_POSTS_DATA.map(b => ({ ...b, id: b.id || b.slug })));
      }

      if (req.method === 'GET') {
        const { tag, category, search, slug } = req.query || {};

        if (slug) {
          const single = await collection.findOne({ $or: [{ slug }, { id: slug }] });
          return sendJson(res, 200, { success: true, data: single });
        }

        let filter: any = {};
        if (category && category !== 'all') {
          filter.category = new RegExp(`^${category}$`, 'i');
        }
        if (tag) {
          filter.tags = { $in: [new RegExp(tag, 'i')] };
        }
        if (search) {
          filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { excerpt: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } }
          ];
        }

        const posts = await collection.find(filter).sort({ publishedDate: -1 }).toArray();
        return sendJson(res, 200, {
          success: true,
          count: posts.length,
          source: 'MongoDB',
          data: posts
        });
      }

      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await parseBody(req);
        const targetId = body.id || body.slug || `post_${Date.now()}`;
        const item = { ...body, id: targetId, updatedAt: new Date().toISOString() };

        await collection.updateOne(
          { $or: [{ id: targetId }, { slug: targetId }] },
          { $set: item },
          { upsert: true }
        );

        return sendJson(res, 200, { success: true, message: 'Article saved to MongoDB', data: item });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query || {};
        if (!id) return sendJson(res, 400, { success: false, error: 'Post ID is required' });
        await collection.deleteOne({ $or: [{ id }, { slug: id }] });
        return sendJson(res, 200, { success: true, message: `Deleted post ${id}` });
      }
    }

    if (req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        count: BLOG_POSTS_DATA.length,
        source: 'StaticFallback',
        data: BLOG_POSTS_DATA
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Blog API error:', err);
    return sendJson(res, 500, { success: false, error: err.message || 'Server error', data: BLOG_POSTS_DATA || [] });
  }
}
