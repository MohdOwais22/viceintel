import { getMongoDb, sendJson, parseBody } from '../_lib/db';

function normalizeProfile(doc: any): any {
  if (!doc) return null;
  const p = doc.toObject ? doc.toObject() : { ...doc };

  const streak = Number(p.dailyStreak ?? p.streakCount ?? p.rewardStreak ?? 1);
  const isL4 = p.clearanceLevel === 4 || p.clearanceLevel === 'L4' || p.role === 'Admin' || p.isAdmin === true;
  const isL3 = p.clearanceLevel === 3 || p.clearanceLevel === 'L3' || p.role === 'Staff' || p.isStaff === true;
  const isL2 = p.clearanceLevel === 2 || p.clearanceLevel === 'L2' || p.isVip === true || p.vipStatus === true || (p.vipExpires && p.vipExpires !== 'Expired');

  const resolvedDiscordId = p.discordId || p.claimedByDiscordId || p.discordAuth?.id || null;
  const resolvedDiscordUsername = p.discordUsername || p.claimedByDiscordUsername || p.discordAuth?.username || null;
  const resolvedDiscordAvatar = p.discordAvatar || p.discordAuth?.avatar || null;
  const resolvedDiscordConnected = Boolean(p.discordConnected || resolvedDiscordId);

  return {
    ...p,
    uid: p.uid || p.id || p._id?.toString() || 'user_demo',
    id: p.id || p.uid || p._id?.toString() || 'user_demo',
    username: p.username || p.gamerTag || 'ViceCityPlayer',
    gamerTag: p.gamerTag || p.username || 'ViceCityPlayer',
    email: p.email || '',
    avatar: p.avatar || p.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=default',
    avatarUrl: p.avatarUrl || p.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=default',
    vcBalance: typeof p.vcBalance === 'number' ? p.vcBalance : 100,
    dailyStreak: streak,
    streakCount: streak,
    rewardStreak: streak,
    isAdmin: isL4,
    isStaff: isL3,
    isVip: isL4 || isL3 || isL2,
    vipStatus: isL4 || isL3 || isL2,
    clearanceLevel: isL4 ? 4 : isL3 ? 3 : isL2 ? 2 : 1,
    userLevel: isL4 ? 'L4' : isL3 ? 'L3' : isL2 ? 'L2' : 'L1',
    vipExpires: p.vipExpires || (isL4 ? 'Lifetime' : isL2 ? '2026-10-04' : 'Expired'),
    discordId: resolvedDiscordId,
    discordUsername: resolvedDiscordUsername,
    discordAvatar: resolvedDiscordAvatar,
    discordConnected: resolvedDiscordConnected,
    gamerTagChangesRemaining: p.gamerTagChangesRemaining !== undefined ? p.gamerTagChangesRemaining : 2,
    status: p.status || 'Active',
  };
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const uid = (url.searchParams.get('uid') || req.query?.uid || '')?.trim();
  const email = (url.searchParams.get('email') || req.query?.email || '')?.trim();

  try {
    const db = await getMongoDb();

    if (req.method === 'GET') {
      if (!uid && !email) {
        return sendJson(res, 400, { success: false, error: 'Missing uid or email parameter' });
      }

      if (db) {
        try {
          const collection = db.collection('userProfiles');
          const found = await collection.findOne({
            $or: [{ uid }, { id: uid }, { docId: uid }, ...(email ? [{ email }] : [])],
          });

          if (found) {
            const normalized = normalizeProfile(found);
            return sendJson(res, 200, { success: true, source: 'MongoDB', data: normalized });
          }
        } catch (queryErr) {
          console.warn('MongoDB profile lookup notice:', queryErr);
        }
      }

      // Default fallback profile response
      const fallback = normalizeProfile({
        uid: uid || 'user_demo',
        gamerTag: email ? email.split('@')[0] : 'ViceCityPlayer',
        username: email ? email.split('@')[0] : 'ViceCityPlayer',
        email: email || '',
        vcBalance: 100,
        dailyStreak: 1,
      });

      return sendJson(res, 200, {
        success: true,
        source: db ? 'MongoDB-Empty' : 'Fallback',
        data: fallback,
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseBody(req);
      const targetUid = body.uid || body.id || uid;

      if (!targetUid) {
        return sendJson(res, 400, { success: false, error: 'Missing user uid' });
      }

      const cleanData = normalizeProfile({ ...body, uid: targetUid, id: targetUid, updatedAt: new Date().toISOString() });

      if (db) {
        try {
          const collection = db.collection('userProfiles');
          await collection.updateOne(
            { $or: [{ uid: targetUid }, { id: targetUid }, { docId: targetUid }] },
            { $set: cleanData },
            { upsert: true }
          );
        } catch (saveErr) {
          console.warn('MongoDB profile save notice:', saveErr);
        }
      }

      return sendJson(res, 200, { success: true, source: 'Saved', data: cleanData });
    }

    return sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
  } catch (err: any) {
    console.error('Profile API error:', err);
    return sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
  }
}
