import { connectToMongoDB } from '../../src/lib/db/mongodb';
import { findDocuments, saveDocument, deleteDocument } from '../../src/lib/db/mongoHelpers';

function normalizeUserProfile(raw: any) {
  const username = raw.username || raw.gamerTag || raw.displayName || 'ViceCityPlayer';
  const email = raw.email || 'user@viceintel.app';
  const id = raw.id || raw.uid || String(raw._id || 'user_demo');

  const role = raw.role || (raw.isAdmin ? 'Admin' : raw.isStaff ? 'Staff' : raw.isVip ? 'VIP Member' : 'User');
  const isAdmin = Boolean(raw.isAdmin === true || role === 'Admin');
  const isStaff = Boolean(raw.isStaff === true || role === 'Staff' || isAdmin);
  const isVip = Boolean(raw.isVip === true || role === 'VIP Member' || isAdmin || isStaff);
  const userLevel = isAdmin ? 'L4' : isStaff ? 'L3' : isVip ? 'L2' : (raw.userLevel || 'L1');
  const clearanceLevel = isAdmin ? 4 : isStaff ? 3 : isVip ? 2 : 1;

  return {
    id,
    uid: raw.uid || id,
    username,
    displayName: raw.displayName || username,
    gamerTag: raw.gamerTag || username,
    email,
    role,
    userLevel,
    clearanceLevel,
    isAdmin,
    isStaff,
    isVip,
    status: (raw.status === 'Suspended' || raw.isSuspended) ? 'Suspended' : 'Active',
    vipExpires: raw.vipExpires || (isAdmin ? 'Lifetime' : isStaff ? 'Staff Account' : isVip ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 'Expired'),
    joinedDate: raw.createdAt ? new Date(raw.createdAt).toISOString().split('T')[0] : (raw.joinedDate || '2026-03-01'),
    avatar: raw.avatar || raw.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(username),
    vcBalance: typeof raw.vcBalance === 'number' ? raw.vcBalance : (typeof raw.credits === 'number' ? raw.credits : 0),
    dailyStreak: typeof raw.dailyStreak === 'number' ? raw.dailyStreak : 0,
    rewardStreak: typeof raw.rewardStreak === 'number' ? raw.rewardStreak : 0,
    moderationNote: raw.moderationNote || '',
    publishedBuildsCount: typeof raw.publishedBuildsCount === 'number' ? raw.publishedBuildsCount : 0,
    discordConnected: Boolean(raw.discordConnected || raw.discordId || raw.discordUsername),
    discordId: raw.discordId || undefined,
    discordUsername: raw.discordUsername || undefined,
    rawFirestoreData: raw
  };
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

    // Support updating/creating user profiles from admin panel
    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      const targetId = body.uid || body.id || `usr_${Date.now()}`;
      const success = await saveDocument('userProfiles', targetId, body);
      const payload = { success, id: targetId, message: success ? 'User profile updated' : 'Failed to update user profile' };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    // Support deleting user profiles
    if (req.method === 'DELETE') {
      const uid = req.query?.uid || req.query?.id || req.body?.uid || req.body?.id;
      if (!uid) {
        const errorPayload = { success: false, error: 'User ID is required for deletion' };
        if (typeof res.status === 'function') return res.status(400).json(errorPayload);
        res.statusCode = 400;
        res.end(JSON.stringify(errorPayload));
        return;
      }
      const success = await deleteDocument('userProfiles', uid);
      const payload = { success, message: success ? 'User profile deleted' : 'Failed to delete user profile' };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    let mongoProfiles: any[] = [];
    try {
      const docs = await findDocuments('userProfiles', {}, 500);
      if (Array.isArray(docs) && docs.length > 0) {
        mongoProfiles = docs;
      }
    } catch (err) {
      console.warn('[Vercel Admin Users API] MongoDB query notice:', err);
    }

    const mapped = mongoProfiles.map(normalizeUserProfile);

    const payload = {
      success: true,
      count: mapped.length,
      source: mongoProfiles.length > 0 ? 'MongoDB' : 'Empty',
      data: mapped
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
