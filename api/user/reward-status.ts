function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export default async function handler(req: any, res: any) {
  try {
    if (res.setHeader) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Content-Type', 'application/json');
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') return res.status(200).end();
      res.statusCode = 200;
      res.end();
      return;
    }

    const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
    const uid = (url.searchParams.get('uid') || req.query?.uid || '')?.trim();

    if (!uid) {
      const payload = { success: false, error: 'Missing uid' };
      if (typeof res.status === 'function') return res.status(400).json(payload);
      res.statusCode = 400;
      res.end(JSON.stringify(payload));
      return;
    }

    let profile: any = null;
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      try {
        const mongooseModule = await import('mongoose');
        const mongoose = (mongooseModule as any).default || mongooseModule;
        if (!mongoose.connection || mongoose.connection.readyState !== 1) {
          await mongoose.connect(mongoUri.trim(), {
            dbName: process.env.MONGODB_DB_NAME || undefined,
            serverSelectionTimeoutMS: 3000,
            socketTimeoutMS: 5000,
            bufferCommands: false,
          });
        }
        if (mongoose.connection && mongoose.connection.db) {
          profile = await mongoose.connection.db.collection('userProfiles').findOne({ $or: [{ uid }, { id: uid }] });
        }
      } catch (dbErr) {
        console.warn('MongoDB lookup in reward-status notice:', dbErr);
      }
    }

    const today = getTodayString();
    const lastClaim = profile?.lastClaimDate || '';
    const streak = Number(profile?.dailyStreak ?? profile?.streakCount ?? 1);
    const canClaim = lastClaim !== today;
    const nextRewardAmount = 15 + Math.min(streak * 2, 50);

    const payload = {
      success: true,
      canClaim,
      lastClaimDate: lastClaim,
      dailyStreak: streak,
      nextRewardAmount,
      vcBalance: profile?.vcBalance ?? 100,
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
