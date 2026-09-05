import type { IncomingMessage, ServerResponse } from 'http';
import { connectToMongoDB } from '../../src/lib/db/mongodb';
import { UserProfileModel } from '../../src/lib/db/models/UserProfile';
import { saveDocument } from '../../src/lib/db/mongoHelpers';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const conn = await connectToMongoDB();
    const body = req.body || (await parseBody(req));
    const uid = body.uid || body.userId || req.query?.uid;

    if (!uid) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Missing uid' }));
      return;
    }

    const today = getTodayString();
    let currentProfile: any = conn ? await UserProfileModel.findOne({ $or: [{ uid }, { id: uid }] }) : null;

    let balance = currentProfile?.vcBalance ?? 100;
    let streak = currentProfile?.dailyStreak ?? 1;

    const rewardEarned = 15 + Math.min(streak * 2, 50);
    const newBalance = balance + rewardEarned;
    const newStreak = streak + 1;

    const updatedData = {
      ...(currentProfile?.toObject ? currentProfile.toObject() : currentProfile || {}),
      uid,
      id: uid,
      vcBalance: newBalance,
      dailyStreak: newStreak,
      streakCount: newStreak,
      lastClaimDate: today,
      updatedAt: new Date(),
    };

    if (conn) {
      await saveDocument('userProfiles', uid, updatedData);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        rewardEarned,
        newBalance,
        newStreak,
        message: `Claimed +${rewardEarned} VC!`,
      })
    );
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err?.message }));
  }
}
