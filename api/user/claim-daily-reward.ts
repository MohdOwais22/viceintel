import { getMongoDb, sendJson, parseBody } from '../../lib/db';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    const body = await parseBody(req);
    const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
    const uid = (body.uid || body.userId || url.searchParams.get('uid') || req.query?.uid || '')?.trim();

    if (!uid) {
      return sendJson(res, 400, { success: false, error: 'Missing uid' });
    }

    let profile: any = null;
    const db = await getMongoDb();
    if (db) {
      profile = await db.collection('userProfiles').findOne({ $or: [{ uid }, { id: uid }] });
    }

    const today = getTodayString();
    let balance = typeof profile?.vcBalance === 'number' ? profile.vcBalance : 100;
    let streak = Number(profile?.dailyStreak ?? profile?.streakCount ?? 1);

    const rewardEarned = 15 + Math.min(streak * 2, 50);
    const newBalance = balance + rewardEarned;
    const newStreak = streak + 1;

    if (db) {
      try {
        await db.collection('userProfiles').updateOne(
          { $or: [{ uid }, { id: uid }] },
          {
            $set: {
              vcBalance: newBalance,
              dailyStreak: newStreak,
              streakCount: newStreak,
              lastClaimDate: today,
              updatedAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
      } catch (saveErr) {
        console.warn('MongoDB profile update notice in claim-daily-reward:', saveErr);
      }
    }

    return sendJson(res, 200, {
      success: true,
      rewardEarned,
      newBalance,
      newStreak,
      message: `Claimed +${rewardEarned} VC!`,
    });
  } catch (err: any) {
    console.error('Claim daily reward API error:', err);
    return sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
  }
}
