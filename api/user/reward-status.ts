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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const conn = await connectToMongoDB();
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const uid = (url.searchParams.get('uid') || req.query?.uid || '')?.trim();

    if (!uid) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Missing uid' }));
      return;
    }

    if (!conn) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, canClaim: true, nextRewardAmount: 15, streak: 1 }));
      return;
    }

    const profile: any = await UserProfileModel.findOne({ $or: [{ uid }, { id: uid }] });
    const today = getTodayString();
    const lastClaim = profile?.lastClaimDate || '';
    const streak = profile?.dailyStreak || 1;
    const canClaim = lastClaim !== today;
    const nextRewardAmount = 15 + Math.min(streak * 2, 50);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        canClaim,
        lastClaimDate: lastClaim,
        dailyStreak: streak,
        nextRewardAmount,
        vcBalance: profile?.vcBalance ?? 100,
      })
    );
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err?.message }));
  }
}
