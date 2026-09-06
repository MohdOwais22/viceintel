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
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,PATCH,DELETE');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
      );
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
    const email = (url.searchParams.get('email') || req.query?.email || '')?.trim();

    let mongooseInstance: any = null;
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      try {
        const mongooseModule = await import('mongoose');
        const mongoose = (mongooseModule as any).default || mongooseModule;
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          mongooseInstance = mongoose;
        } else {
          await mongoose.connect(mongoUri.trim(), {
            dbName: process.env.MONGODB_DB_NAME || undefined,
            serverSelectionTimeoutMS: 3000,
            socketTimeoutMS: 5000,
            bufferCommands: false,
          });
          if (mongoose.connection.readyState === 1) {
            mongooseInstance = mongoose;
          }
        }
      } catch (dbErr) {
        console.warn('MongoDB connect notice in profile handler:', dbErr);
      }
    }

    if (req.method === 'GET') {
      if (!uid && !email) {
        const payload = { success: false, error: 'Missing uid or email parameter' };
        if (typeof res.status === 'function') return res.status(400).json(payload);
        res.statusCode = 400;
        res.end(JSON.stringify(payload));
        return;
      }

      if (mongooseInstance) {
        try {
          const db = mongooseInstance.connection.db;
          if (db) {
            const collection = db.collection('userProfiles');
            const found = await collection.findOne({
              $or: [{ uid }, { id: uid }, { docId: uid }, ...(email ? [{ email }] : [])],
            });

            if (found) {
              const normalized = normalizeProfile(found);
              const payload = { success: true, source: 'MongoDB', data: normalized };
              if (typeof res.status === 'function') return res.status(200).json(payload);
              res.statusCode = 200;
              res.end(JSON.stringify(payload));
              return;
            }
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

      const payload = {
        success: true,
        source: mongooseInstance ? 'MongoDB-Initialized' : 'VercelFallback',
        data: fallback,
      };

      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = await parseBody(req);
      const targetUid = body.uid || body.id || uid;

      if (!targetUid) {
        const payload = { success: false, error: 'Missing user uid' };
        if (typeof res.status === 'function') return res.status(400).json(payload);
        res.statusCode = 400;
        res.end(JSON.stringify(payload));
        return;
      }

      const cleanData = normalizeProfile({ ...body, uid: targetUid, id: targetUid });

      if (mongooseInstance) {
        try {
          const db = mongooseInstance.connection.db;
          if (db) {
            const collection = db.collection('userProfiles');
            await collection.updateOne(
              { $or: [{ uid: targetUid }, { id: targetUid }, { docId: targetUid }] },
              { $set: cleanData },
              { upsert: true }
            );
          }
        } catch (saveErr) {
          console.warn('MongoDB profile save notice:', saveErr);
        }
      }

      const payload = { success: true, source: 'Saved', data: cleanData };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    const methodNotAllowed = { success: false, error: 'Method Not Allowed' };
    if (typeof res.status === 'function') return res.status(405).json(methodNotAllowed);
    res.statusCode = 405;
    res.end(JSON.stringify(methodNotAllowed));
  } catch (err: any) {
    const errorPayload = { success: false, error: err?.message || 'Server error' };
    if (typeof res.status === 'function') return res.status(500).json(errorPayload);
    res.statusCode = 500;
    res.end(JSON.stringify(errorPayload));
  }
}
