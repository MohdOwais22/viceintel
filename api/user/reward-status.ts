import { getMongoDb, sendJson } from '../_lib/db';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const uid = (url.searchParams.get('uid') || req.query?.uid || '')?.trim();

  if (!uid) {
    return sendJson(res, 400, { success: false, error: 'Missing uid' });
  }

  try {
    let profile: any = null;
    const db = await getMongoDb();
    if (db) {
      profile = await db.collection('userProfiles').findOne({ $or: [{ uid }, { id: uid }] });
    }

    const today = getTodayString();
    const lastClaim = profile?.lastClaimDate || '';
    const streak = Number(profile?.dailyStreak ?? profile?.streakCount ?? 1);
    const canClaim = lastClaim !== today;
    const nextRewardAmount = 15 + Math.min(streak * 2, 50);

    return sendJson(res, 200, {
      success: true,
      canClaim,
      lastClaimDate: lastClaim,
      dailyStreak: streak,
      nextRewardAmount,
      vcBalance: profile?.vcBalance ?? 100,
    });
  } catch (err: any) {
    console.error('Reward status API error:', err);
    return sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
  }
}
