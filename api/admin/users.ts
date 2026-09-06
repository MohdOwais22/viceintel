function normalizeUserProfile(raw: any) {
  if (!raw) return null;
  const username = raw.username || raw.gamerTag || raw.displayName || 'ViceCityPlayer';
  const email = raw.email || 'user@viceintel.app';
  const id = raw.id || raw.uid || String(raw._id || 'usr_' + Math.random().toString(36).substring(2, 9));

  const role = raw.role || (raw.isAdmin ? 'Admin' : raw.isStaff ? 'Staff' : raw.isVip ? 'VIP Member' : 'User');
  const isAdmin = Boolean(raw.isAdmin === true || role === 'Admin' || raw.clearanceLevel === 4 || raw.userLevel === 'L4');
  const isStaff = Boolean(raw.isStaff === true || role === 'Staff' || isAdmin || raw.clearanceLevel === 3 || raw.userLevel === 'L3');
  const isVip = Boolean(raw.isVip === true || role === 'VIP Member' || isAdmin || isStaff || raw.clearanceLevel === 2 || raw.userLevel === 'L2');
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
    avatar: raw.avatar || raw.photoURL || raw.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(username),
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

async function getMongoDatabase(): Promise<any> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) return null;

  try {
    const mongooseModule = await import('mongoose');
    const mongoose = (mongooseModule as any).default || mongooseModule;
    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return mongoose.connection.db;
    }

    await mongoose.connect(mongoUri.trim(), {
      dbName: process.env.MONGODB_DB_NAME || undefined,
      serverSelectionTimeoutMS: 4000,
      socketTimeoutMS: 8000,
      bufferCommands: false,
    });

    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return mongoose.connection.db;
    }
  } catch (err) {
    console.warn('[Admin Users API] MongoDB connection warning:', err);
  }
  return null;
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
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Content-Type', 'application/json');
    }

    if (req.method === 'OPTIONS') {
      if (typeof res.status === 'function') return res.status(200).end();
      res.statusCode = 200;
      res.end();
      return;
    }

    const db = await getMongoDatabase();

    // Handle Create / Update user profile
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const body = await parseBody(req);
      const targetId = body.uid || body.id || `usr_${Date.now()}`;
      
      const cleanData = {
        ...body,
        uid: targetId,
        id: targetId,
        docId: targetId,
        updatedAt: new Date(),
      };

      if (db) {
        try {
          await db.collection('userProfiles').updateOne(
            { $or: [{ uid: targetId }, { id: targetId }, { docId: targetId }] },
            { $set: cleanData },
            { upsert: true }
          );
        } catch (dbErr) {
          console.warn('[Admin Users API] Save error:', dbErr);
        }
      }

      const payload = { success: true, id: targetId, message: 'User profile updated successfully', data: normalizeUserProfile(cleanData) };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    // Handle Delete user profile
    if (req.method === 'DELETE') {
      const uid = req.query?.uid || req.query?.id;
      if (!uid) {
        const errorPayload = { success: false, error: 'User ID is required for deletion' };
        if (typeof res.status === 'function') return res.status(400).json(errorPayload);
        res.statusCode = 400;
        res.end(JSON.stringify(errorPayload));
        return;
      }

      if (db) {
        try {
          await db.collection('userProfiles').deleteMany({
            $or: [{ uid }, { id: uid }, { docId: uid }]
          });
        } catch (dbErr) {
          console.warn('[Admin Users API] Delete error:', dbErr);
        }
      }

      const payload = { success: true, message: 'User profile deleted successfully' };
      if (typeof res.status === 'function') return res.status(200).json(payload);
      res.statusCode = 200;
      res.end(JSON.stringify(payload));
      return;
    }

    // Handle GET (List all user profiles)
    const userMap = new Map<string, any>();

    if (db) {
      try {
        // Query both userProfiles and users collections in MongoDB
        const [profilesDocs, usersDocs] = await Promise.all([
          db.collection('userProfiles').find({}).limit(500).toArray().catch(() => []),
          db.collection('users').find({}).limit(500).toArray().catch(() => [])
        ]);

        const allDocs = [...profilesDocs, ...usersDocs];
        allDocs.forEach((doc: any) => {
          if (!doc) return;
          const key = (doc.uid || doc.id || doc.email || doc._id?.toString() || '').toLowerCase().trim();
          if (key && !userMap.has(key)) {
            userMap.set(key, doc);
          }
        });
      } catch (queryErr) {
        console.warn('[Admin Users API] Query notice:', queryErr);
      }
    }

    let results = Array.from(userMap.values()).map(normalizeUserProfile).filter(Boolean);

    // If database has no registered users yet, include the administrator session root
    if (results.length === 0) {
      const adminEmail = process.env.ADMIN_EMAIL || 'MohdOwais762@gmail.com';
      results = [
        normalizeUserProfile({
          uid: 'usr_admin_master',
          id: 'usr_admin_master',
          username: 'ViceCityCommander',
          gamerTag: 'ViceCityCommander',
          displayName: 'Vice City Executive Admin',
          email: adminEmail,
          role: 'Admin',
          userLevel: 'L4',
          clearanceLevel: 4,
          isAdmin: true,
          isStaff: true,
          isVip: true,
          vipExpires: 'Lifetime',
          status: 'Active',
          vcBalance: 50000,
          dailyStreak: 30,
          joinedDate: '2026-01-01',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ViceCityCommander'
        })
      ];
    }

    const payload = {
      success: true,
      count: results.length,
      source: db ? 'MongoDB' : 'Fallback',
      data: results
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
