import { getMongoDb, sendJson, parseBody } from './_lib/db';
import { BLOG_POSTS } from '../src/data/blogPosts';

const POSTS = BLOG_POSTS || [];

function getFilteredPosts(query: any) {
  const { tag, category, search, slug } = query || {};
  if (slug) {
    const single = POSTS.find(p => p.slug === slug || p.id === slug);
    return single ? [single] : [];
  }
  let list = [...POSTS];
  if (category && category !== 'all') {
    list = list.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }
  if (tag) {
    list = list.filter(p => p.tags?.some(t => t.toLowerCase() === tag.toLowerCase()));
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(p =>
      p.title?.toLowerCase().includes(s) ||
      p.excerpt?.toLowerCase().includes(s) ||
      (Array.isArray(p.content) ? p.content.join(' ').toLowerCase().includes(s) : String(p.content).toLowerCase().includes(s))
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
      const collection = db.collection('blogPosts');

      if (req.method === 'GET') {
        const { tag, category, search, slug } = req.query || {};

        if (slug) {
          const single = await collection.findOne({ $or: [{ slug }, { id: slug }] });
          if (single) {
            return sendJson(res, 200, { success: true, data: single });
          }
          const fallbackSingle = POSTS.find(p => p.slug === slug || p.id === slug);
          return sendJson(res, 200, { success: true, data: fallbackSingle || null });
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
        if (posts.length > 0) {
          return sendJson(res, 200, {
            success: true,
            count: posts.length,
            source: 'MongoDB',
            data: posts
          });
        }

        // Fallback to pre-seeded static blog posts if database was not loaded/empty
        const fallbackData = getFilteredPosts(req.query);
        return sendJson(res, 200, {
          success: true,
          count: fallbackData.length,
          source: 'PreSeededFallback',
          data: fallbackData
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
      const { slug } = req.query || {};
      if (slug) {
        const single = POSTS.find(p => p.slug === slug || p.id === slug);
        return sendJson(res, 200, { success: true, data: single || null });
      }
      const fallbackData = getFilteredPosts(req.query);
      return sendJson(res, 200, {
        success: true,
        count: fallbackData.length,
        source: 'PreSeededFallback',
        data: fallbackData
      });
    }

    return sendJson(res, 503, { success: false, error: 'MongoDB not available' });
  } catch (err: any) {
    console.error('Blog API error:', err);
    const fallbackData = getFilteredPosts(req.query);
    return sendJson(res, 200, { success: true, count: fallbackData.length, source: 'PreSeededFallback', data: fallbackData });
  }
}
