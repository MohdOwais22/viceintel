import { getMongoDb, sendJson, parseBody } from '../_lib/db';

function normalizeUserProfile(rawP: any): any {
  if (!rawP) return null;
  const p = rawP.toObject ? rawP.toObject() : { ...rawP };

  const role = p.role || (p.isAdmin ? 'Admin' : p.isStaff ? 'Staff' : p.isVip ? 'VIP Member' : 'User');
  const isAdmin = Boolean(p.isAdmin === true || role === 'Admin' || p.clearanceLevel === 4 || p.clearanceLevel === 'L4');
  const isStaff = Boolean(p.isStaff === true || role === 'Staff' || isAdmin || p.clearanceLevel === 3 || p.clearanceLevel === 'L3');
  const isVip = Boolean(p.isVip === true || role === 'VIP Member' || isAdmin || isStaff || p.clearanceLevel === 2 || p.clearanceLevel === 'L2');
  const userLevel = isAdmin ? 'L4' : isStaff ? 'L3' : isVip ? 'L2' : (p.userLevel || 'L1');
  const clearanceLevel = isAdmin ? 'L4' : isStaff ? 'L3' : isVip ? 'L2' : 'L1';
  const vipExpires = p.vipExpires || (isAdmin ? 'Lifetime' : isStaff ? 'Staff Account' : isVip ? '2027-08-01' : 'Expired');
  const streak = Number(p.dailyStreak ?? p.streakCount ?? p.rewardStreak ?? 0);

  return {
    id: p.uid || p.id || p.docId || (p._id ? p._id.toString() : 'user_' + Date.now()),
    uid: p.uid || p.id || p.docId || (p._id ? p._id.toString() : 'user_' + Date.now()),
    gamerTag: p.gamerTag || p.username || 'ViceCityPlayer',
    username: p.username || p.gamerTag || 'ViceCityPlayer',
    email: p.email || 'user@viceintel.app',
    userLevel,
    role,
    clearanceLevel,
    isAdmin,
    isStaff,
    isVip,
    status: p.status || (p.isSuspended ? 'Suspended' : 'Active'),
    vipExpires,
    joinedDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : (p.joinedDate || '2026-03-01'),
    avatar: p.avatar || p.avatarUrl || p.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=Lucia',
    vcBalance: typeof p.vcBalance === 'number' ? p.vcBalance : (typeof p.credits === 'number' ? p.credits : 100),
    dailyStreak: streak,
    rewardStreak: streak,
    publishedBuildsCount: typeof p.publishedBuildsCount === 'number' ? p.publishedBuildsCount : 0,
    discordId: p.discordId || null,
    discordUsername: p.discordUsername || null,
    discordConnected: Boolean(p.discordConnected || p.discordId)
  };
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const db = await getMongoDb();
  if (!db) {
    return sendJson(res, 503, {
      success: false,
      error: 'MongoDB is not connected or MONGODB_URI is not set',
      data: []
    });
  }

  try {
    const collection = db.collection('userProfiles');

    if (req.method === 'GET') {
      const docs = await collection.find({}).limit(500).toArray();
      const mapped = docs.map(normalizeUserProfile).filter(Boolean);

      return sendJson(res, 200, {
        success: true,
        count: mapped.length,
        source: 'MongoDB',
        collection: 'userProfiles',
        data: mapped
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseBody(req);
      const targetId = body.uid || body.id || body.docId;
      if (!targetId) {
        return sendJson(res, 400, { success: false, error: 'User uid or id is required' });
      }

      await collection.updateOne(
        { $or: [{ uid: targetId }, { id: targetId }, { docId: targetId }] },
        { $set: { ...body, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );

      return sendJson(res, 200, { success: true, message: 'User updated in MongoDB userProfiles' });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  } catch (err: any) {
    console.error('MongoDB userProfiles error:', err);
    return sendJson(res, 500, {
      success: false,
      error: err.message || 'Database error',
      data: []
    });
  }
}
