import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { readFileSync } from 'fs';
import { connectToMongoDB } from './mongodb';
import { getDynamicModel } from './models/DynamicDoc';

export interface CollectionMigrationStats {
  collectionName: string;
  foundCount: number;
  migratedCount: number;
  errorCount: number;
  errors: string[];
}

export interface FullMigrationResult {
  success: boolean;
  totalCollections: number;
  totalDocumentsFound: number;
  totalDocumentsMigrated: number;
  stats: CollectionMigrationStats[];
  message: string;
}

// Known Firestore collections across ViceIntel
const KNOWN_COLLECTIONS = [
  'communityPolls',
  'customChannels',
  'chatMessages',
  'userProfiles',
  'vehicle_tuning_builds',
  'serverWhitelistForms',
  'pseoArticles',
  'customChannels',
  'userNotifications',
  'servers',
  'whitelist_forms',
  'whitelist_applications',
  'spotlight_rentals',
  'affiliate_partners',
  'staff_activity_logs',
  'system_config',
  'subscriptions',
  'ownership_transfers',
  'mail',
  'sentEmails',
  'emailVerifications',
  'challenge_entries',
  'past_challenges',
  'tuning_challenges',
  'blogPosts',
  'bugReports',
  'contentStudioArticles',
  'creator_priority_passes',
  'discount_coupons',
  'economy_presets',
  'giftCards',
  'issueReports',
  'marketingBannerBriefs',
  'marketing_campaigns',
  'marketingInternalLinks',
  'marketing_social_posts',
  'onDemandFeatureRequests',
  'server_rules',
  'squad_referrals',
  'squad_rooms',
  'users',
];

/**
 * Utility function to fetch all documents from all Firestore collections and migrate/upsert them into MongoDB.
 */
export async function migrateAllFirestoreToMongoDB(): Promise<FullMigrationResult> {
  const result: FullMigrationResult = {
    success: false,
    totalCollections: 0,
    totalDocumentsFound: 0,
    totalDocumentsMigrated: 0,
    stats: [],
    message: '',
  };

  try {
    // 1. Connect to MongoDB
    console.log('🔄 Connecting to MongoDB for full Firestore migration...');
    const mongooseConn = await connectToMongoDB();
    if (!mongooseConn) {
      result.message = 'MongoDB connection failed or MONGODB_URI is missing in environment variables.';
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

    console.log('📦 Starting multi-collection Firestore to MongoDB migration pass...');

    // 3. Process each collection
    for (const collName of KNOWN_COLLECTIONS) {
      const collStats: CollectionMigrationStats = {
        collectionName: collName,
        foundCount: 0,
        migratedCount: 0,
        errorCount: 0,
        errors: [],
      };

      try {
        console.log(`\n📂 Scanning Firestore collection: '${collName}'...`);
        const snapshot = await getDocs(collection(db, collName));
        collStats.foundCount = snapshot.size;

        if (snapshot.empty) {
          console.log(`  ℹ️ Collection '${collName}' is empty in Firestore.`);
          result.stats.push(collStats);
          continue;
        }

        console.log(`  Found ${snapshot.size} document(s) in '${collName}'. Upserting into MongoDB collection '${collName}'...`);
        const Model = getDynamicModel(collName);

        for (const docSnap of snapshot.docs) {
          const docData = docSnap.data();
          const docId = docSnap.id;

          const updatePayload = {
            ...docData,
            id: docId,
            docId: docId,
          };

          try {
            // Upsert by docId or id or uid
            const queryFilter = docData.uid ? { $or: [{ id: docId }, { uid: docData.uid }] } : { id: docId };
            await Model.findOneAndUpdate(queryFilter, updatePayload, {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            });
            collStats.migratedCount++;
          } catch (err: any) {
            const errorMsg = `Failed to upsert doc [${docId}] in '${collName}': ${err.message}`;
            collStats.errors.push(errorMsg);
            collStats.errorCount++;
            console.error(`    ❌ ${errorMsg}`);
          }
        }

        console.log(`  ✅ Successfully migrated ${collStats.migratedCount}/${collStats.foundCount} document(s) for '${collName}'.`);
      } catch (err: any) {
        const errorMsg = `Failed to query collection '${collName}': ${err.message}`;
        collStats.errors.push(errorMsg);
        collStats.errorCount++;
        console.error(`  ❌ ${errorMsg}`);
      }

      // If communityPolls was processed, ensure standard defaults (vice-district, gameplay-feature) are also populated in MongoDB
      if (collName === 'communityPolls') {
        const Model = getDynamicModel('communityPolls');
        const defaultPolls = [
          {
            id: 'vice-district',
            docId: 'vice-district',
            title: 'Best Vice City District & Map Zone',
            subtitle: 'Which Leonida region are you exploring first on launch day?',
            category: 'Map & World',
            totalVotes: 289,
            options: {
              opt1: { id: 'opt1', label: '🌴 Ocean Drive & Vice Beach Neon Strip', votes: 115 },
              opt2: { id: 'opt2', label: '🏙️ Downtown Skyscrapers & Little Haiti', votes: 72 },
              opt3: { id: 'opt3', label: '🏰 Starfish Island Mansions & Luxury Docks', votes: 54 },
              opt4: { id: 'opt4', label: '🐊 Grassrivers Wetlands & Keys Marshes', votes: 48 },
            },
            voters: {},
          },
          {
            id: 'gameplay-feature',
            docId: 'gameplay-feature',
            title: 'Top Anticipated GTA VI Gameplay Mechanics',
            subtitle: 'Which feature are you most excited to experience with Jason & Lucia?',
            category: 'Gameplay',
            totalVotes: 412,
            options: {
              opt1: { id: 'opt1', label: '💰 Dual Protagonist Heist Coordination', votes: 168 },
              opt2: { id: 'opt2', label: '🏢 Nightclub & Business Empire Mechanics', votes: 104 },
              opt3: { id: 'opt3', label: '🏎️ Deep Custom Vehicle Tuning & Chop Shops', votes: 85 },
              opt4: { id: 'opt4', label: '📱 In-Game Social Media & Live Stream Feeds', votes: 55 },
            },
            voters: {},
          },
        ];

        for (const poll of defaultPolls) {
          try {
            const existing = await Model.findOne({ $or: [{ id: poll.id }, { docId: poll.id }] });
            if (!existing) {
              await Model.create(poll);
              console.log(`  🌱 Seeded complementary active poll [${poll.id}] into MongoDB.`);
            }
          } catch (e) {}
        }
      }

      // If customChannels was processed, ensure RTDB channels and default VIP hubs are in MongoDB
      if (collName === 'customChannels') {
        try {
          const ChannelModel = getDynamicModel('customChannels');
          const defaultChans = [
            {
              id: 'vip_ocean_drivers',
              docId: 'vip_ocean_drivers',
              name: 'ocean-drive-syndicate',
              description: 'Private high-stakes drag racing crew & secret custom mod swaps on Vice Beach.',
              isPrivate: true,
              creatorId: 'vip_creator_01',
              creatorName: 'LeonidaKing',
              creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OceanDriver_Leo',
              inviteCode: 'HUB-VIP-7709',
              createdAt: '2026-08-01T08:00:00.000Z',
              members: ['LeonidaKing', 'HeistLeader_Lucia', 'ViceRacer99'],
              pendingRequests: []
            },
            {
              id: 'vip_leaks_vault',
              docId: 'vip_leaks_vault',
              name: 'gta6-secret-leaks',
              description: 'Exclusive leaks, map coordinates & audio decrypt files shared by VIP members.',
              isPrivate: false,
              creatorId: 'vip_creator_02',
              creatorName: 'ViceCityMod_Tommy',
              creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TommyVercetti',
              inviteCode: 'HUB-LEAKS-3312',
              createdAt: '2026-08-01T08:00:00.000Z',
              members: ['ViceCityMod_Tommy', 'DriftMaster99', 'ViceCity_Classic_88'],
              pendingRequests: []
            }
          ];
          for (const dc of defaultChans) {
            const existing = await ChannelModel.findOne({ $or: [{ id: dc.id }, { docId: dc.id }] });
            if (!existing) {
              await ChannelModel.create(dc);
              collStats.migratedCount++;
              console.log(`  🌱 Seeded default custom channel [${dc.name}] into MongoDB.`);
            }
          }
        } catch (e) {}
      }

      result.stats.push(collStats);
      result.totalCollections++;
      result.totalDocumentsFound += collStats.foundCount;
      result.totalDocumentsMigrated += collStats.migratedCount;
    }

    const totalErrors = result.stats.reduce((acc, curr) => acc + curr.errorCount, 0);
    result.success = totalErrors === 0;
    result.message = `Full migration complete: ${result.totalDocumentsMigrated}/${result.totalDocumentsFound} total document(s) migrated across ${result.totalCollections} collection(s).`;
    console.log(`\n🎉 ${result.message}`);
  } catch (error: any) {
    result.success = false;
    result.message = `Fatal migration error: ${error.message}`;
    console.error(`💥 ${result.message}`);
  }

  return result;
}
