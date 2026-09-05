import type { IncomingMessage, ServerResponse } from 'http';
import { connectToMongoDB } from '../../src/lib/db/mongodb';
import { findDocument, saveDocument } from '../../src/lib/db/mongoHelpers';
import { UserProfileModel } from '../../src/lib/db/models/UserProfile';

function normalizeProfile(p: any): any {
  if (!p) return null;
  const doc = p.toObject ? p.toObject() : { ...p };

  const streak = Number(doc.dailyStreak ?? doc.streakCount ?? doc.rewardStreak ?? 1);
  const isL4 = doc.clearanceLevel === 4 || doc.clearanceLevel === 'L4' || doc.role === 'Admin' || doc.isAdmin === true;
  const isL3 = doc.clearanceLevel === 3 || doc.clearanceLevel === 'L3' || doc.role === 'Staff' || doc.isStaff === true;
  const isL2 = doc.clearanceLevel === 2 || doc.clearanceLevel === 'L2' || doc.isVip === true || doc.vipStatus === true || (doc.vipExpires && doc.vipExpires !== 'Expired');

  const resolvedDiscordId = doc.discordId || doc.claimedByDiscordId || doc.discordAuth?.id || null;
  const resolvedDiscordUsername = doc.discordUsername || doc.claimedByDiscordUsername || doc.discordAuth?.username || null;
  const resolvedDiscordAvatar = doc.discordAvatar || doc.discordAuth?.avatar || null;
  const resolvedDiscordConnected = Boolean(doc.discordConnected || resolvedDiscordId);

  return {
    ...doc,
    uid: doc.uid || doc.id || doc._id?.toString(),
    id: doc.id || doc.uid || doc._id?.toString(),
    username: doc.username || doc.gamerTag || 'Player',
    gamerTag: doc.gamerTag || doc.username || 'Player',
    email: doc.email || '',
    avatar: doc.avatar || doc.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=default',
    avatarUrl: doc.avatarUrl || doc.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=default',
    vcBalance: typeof doc.vcBalance === 'number' ? doc.vcBalance : 100,
    dailyStreak: streak,
    streakCount: streak,
    rewardStreak: streak,
    isAdmin: isL4,
    isStaff: isL3,
    isVip: isL4 || isL3 || isL2,
    vipStatus: isL4 || isL3 || isL2,
    clearanceLevel: isL4 ? 4 : isL3 ? 3 : isL2 ? 2 : 1,
    userLevel: isL4 ? 'L4' : isL3 ? 'L3' : isL2 ? 'L2' : 'L1',
    vipExpires: doc.vipExpires || (isL4 ? 'Lifetime' : isL2 ? '2026-10-04' : 'Expired'),
    discordId: resolvedDiscordId,
    discordUsername: resolvedDiscordUsername,
    discordAvatar: resolvedDiscordAvatar,
    discordConnected: resolvedDiscordConnected,
    claimedByDiscordId: resolvedDiscordId,
    claimedByDiscordUsername: resolvedDiscordUsername,
    gamerTagChangesRemaining: doc.gamerTagChangesRemaining !== undefined ? doc.gamerTagChangesRemaining : 2,
    status: doc.status || 'Active',
  };
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
  // Setup CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,PATCH,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    const conn = await connectToMongoDB();

    if (req.method === 'GET') {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const uid = (url.searchParams.get('uid') || req.query?.uid || '')?.trim();
      const email = (url.searchParams.get('email') || req.query?.email || '')?.trim();

      if (!uid && !email) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Missing uid or email parameter' }));
        return;
      }

      if (!conn) {
        // Fallback response if MongoDB_URI is not yet configured in Vercel settings
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            source: 'VercelFallback',
            warning: 'MONGODB_URI environment variable not set in Vercel settings',
            data: normalizeProfile({
              uid: uid || 'user_demo',
              gamerTag: 'ViceCityPlayer',
              username: 'ViceCityPlayer',
              email: email || '',
              vcBalance: 100,
              dailyStreak: 1,
            }),
          })
        );
        return;
      }

      const queryConds: any[] = [];
      if (uid) {
        const uidRegex = new RegExp(`^${uid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        queryConds.push({ uid }, { id: uid }, { docId: uid }, { uid: uidRegex }, { id: uidRegex });
      }
      if (email) {
        queryConds.push({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      }

      const found = await UserProfileModel.findOne({ $or: queryConds });
      if (found) {
        const normalized = normalizeProfile(found);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, source: 'MongoDB', data: normalized }));
        return;
      }

      // If user profile not found, initialize new
      const primaryUid = uid || `user_${Date.now()}`;
      const newProfile = normalizeProfile({
        uid: primaryUid,
        id: primaryUid,
        username: email ? email.split('@')[0] : 'Player_' + primaryUid.slice(0, 5),
        gamerTag: email ? email.split('@')[0] : 'Player_' + primaryUid.slice(0, 5),
        email: email || '',
        vcBalance: 100,
        dailyStreak: 1,
      });

      await saveDocument('userProfiles', primaryUid, newProfile);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, source: 'MongoDB-Created', data: newProfile }));
      return;
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || (await parseBody(req));
      const uid = body.uid || body.id || (req.query?.uid as string);

      if (!uid) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Missing user uid' }));
        return;
      }

      const cleanData = normalizeProfile(body);
      if (conn) {
        await saveDocument('userProfiles', uid, cleanData);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, source: 'MongoDB', data: cleanData }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
  } catch (err: any) {
    console.error('Vercel Profile API Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
  }
}
