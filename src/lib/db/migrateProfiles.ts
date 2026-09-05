import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { connectToMongoDB } from './mongodb';
import { UserProfileModel } from './models/UserProfile';

export interface MigrationResult {
  success: boolean;
  totalFound: number;
  migratedCount: number;
  errorCount: number;
  errors: string[];
  message: string;
}

/**
 * Utility function to fetch all user profiles from Firestore and upsert them into MongoDB.
 */
export async function migrateFirestoreProfilesToMongoDB(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    totalFound: 0,
    migratedCount: 0,
    errorCount: 0,
    errors: [],
    message: '',
  };

  try {
    // 1. Connect to MongoDB
    console.log('🔄 Connecting to MongoDB for migration...');
    const mongooseConn = await connectToMongoDB();
    if (!mongooseConn) {
      result.message = 'MongoDB connection failed or MONGODB_URI is missing in environment.';
      console.error(`❌ ${result.message}`);
      return result;
    }

    // 2. Initialize Firestore
    let firebaseConfig: any;
    try {
      firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
    } catch {
      firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
        firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || '(default)',
      };
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

    // 3. Fetch User Profiles from Firestore
    console.log('📥 Fetching userProfiles collection from Firestore...');
    const snapshot = await getDocs(collection(db, 'userProfiles'));
    result.totalFound = snapshot.size;
    console.log(`📊 Found ${snapshot.size} profile(s) in Firestore.`);

    if (snapshot.empty) {
      result.success = true;
      result.message = 'No user profiles found in Firestore to migrate.';
      console.log(`ℹ️ ${result.message}`);
      return result;
    }

    // 4. Iterate and Upsert to MongoDB
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const uid = docSnap.id || data.uid;

      if (!uid) {
        const err = `Skipping Firestore doc ${docSnap.id}: Missing UID.`;
        result.errors.push(err);
        result.errorCount++;
        console.warn(`⚠️ ${err}`);
        continue;
      }

      const gamerTag = data.gamerTag || data.username || `User_${uid.substring(0, 6)}`;
      const avatarUrl = data.avatarUrl || data.avatar || '';
      const vipStatus = Boolean(data.vipStatus ?? data.isVip ?? false);
      const isStaff = Boolean(data.isStaff ?? false);
      const isAdmin = Boolean(data.isAdmin ?? false);

      let clearanceLevel = data.clearanceLevel;
      if (typeof clearanceLevel !== 'number') {
        if (isAdmin) clearanceLevel = 4;
        else if (isStaff) clearanceLevel = 3;
        else if (vipStatus) clearanceLevel = 2;
        else clearanceLevel = 1;
      }

      const updateData = {
        uid,
        gamerTag,
        username: data.username || gamerTag,
        usernameLower: (data.usernameLower || gamerTag).toLowerCase(),
        email: data.email || '',
        avatarUrl,
        avatar: avatarUrl,
        vipStatus,
        isVip: vipStatus,
        isAdmin,
        isStaff,
        role: data.role || (isAdmin ? 'Admin' : isStaff ? 'Staff' : vipStatus ? 'VIP' : 'User'),
        clearanceLevel,
        vipExpires: data.vipExpires || 'Expired',
        vcBalance: typeof data.vcBalance === 'number' ? data.vcBalance : 100,
        dailyStreak: typeof data.dailyStreak === 'number' ? data.dailyStreak : 1,
        lastLogin: typeof data.lastLogin === 'number' ? data.lastLogin : Date.now(),
        status: data.status || 'Active',
        gamerTagChangesRemaining: typeof data.gamerTagChangesRemaining === 'number' ? data.gamerTagChangesRemaining : 2,
        lastGamerTagChangeDate: data.lastGamerTagChangeDate || '',
        changeHistory: Array.isArray(data.changeHistory) ? data.changeHistory : [],
        discordConnected: Boolean(data.discordConnected ?? false),
        discordId: data.discordId || '',
        discordUsername: data.discordUsername || '',
        discordAvatar: data.discordAvatar || '',
        claimedByDiscordId: data.claimedByDiscordId || '',
        claimedByDiscordUsername: data.claimedByDiscordUsername || '',
        discordAuth: data.discordAuth || null,
        ...data, // copy any extra custom dynamic properties
      };

      try {
        await (UserProfileModel as any).findOneAndUpdate({ uid }, updateData, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        });
        result.migratedCount++;
        console.log(`  ✅ Migrated profile [${uid}] GamerTag: ${gamerTag}`);
      } catch (err: any) {
        const errorMsg = `Failed to migrate profile [${uid}]: ${err.message}`;
        result.errors.push(errorMsg);
        result.errorCount++;
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    result.success = result.errorCount === 0;
    result.message = `Successfully migrated ${result.migratedCount}/${result.totalFound} user profile(s) from Firestore to MongoDB.`;
    console.log(`🎉 ${result.message}`);
  } catch (error: any) {
    result.success = false;
    result.message = `Fatal migration error: ${error.message}`;
    console.error(`💥 ${result.message}`);
  }

  return result;
}
