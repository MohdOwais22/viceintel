function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
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
  try {
    if (res.setHeader) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Content-Type', 'application/json');
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') return res.status(200).end();
      res.statusCode = 200;
      res.end();
      return;
    }

    const body = await parseBody(req);
    const url = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
    const uid = (body.uid || body.userId || url.searchParams.get('uid') || req.query?.uid || '')?.trim();

    if (!uid) {
      const payload = { success: false, error: 'Missing uid' };
      if (typeof res.status === 'function') return res.status(400).json(payload);
      res.statusCode = 400;
      res.end(JSON.stringify(payload));
      return;
    }

    let profile: any = null;
    let mongooseInstance: any = null;
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
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          mongooseInstance = mongoose;
          if (mongoose.connection.db) {
            profile = await mongoose.connection.db.collection('userProfiles').findOne({ $or: [{ uid }, { id: uid }] });
          }
        }
      } catch (dbErr) {
        console.warn('MongoDB connection in claim-daily-reward notice:', dbErr);
      }
    }

    const today = getTodayString();
    let balance = typeof profile?.vcBalance === 'number' ? profile.vcBalance : 100;
    let streak = Number(profile?.dailyStreak ?? profile?.streakCount ?? 1);

    const rewardEarned = 15 + Math.min(streak * 2, 50);
    const newBalance = balance + rewardEarned;
    const newStreak = streak + 1;

    if (mongooseInstance && mongooseInstance.connection && mongooseInstance.connection.db) {
      try {
        await mongooseInstance.connection.db.collection('userProfiles').updateOne(
          { $or: [{ uid }, { id: uid }] },
          {
            $set: {
              vcBalance: newBalance,
              dailyStreak: newStreak,
              streakCount: newStreak,
              lastClaimDate: today,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (saveErr) {
        console.warn('MongoDB profile update notice in claim-daily-reward:', saveErr);
      }
    }

    const payload = {
      success: true,
      rewardEarned,
      newBalance,
      newStreak,
      message: `Claimed +${rewardEarned} VC!`,
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
