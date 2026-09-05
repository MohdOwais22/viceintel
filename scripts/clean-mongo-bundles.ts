import { connectToMongoDB } from '../src/lib/db/mongodb';
import mongoose from 'mongoose';

async function cleanMongoBundles() {
  console.log('🔄 Connecting to MongoDB...');
  await connectToMongoDB();

  if (!mongoose.connection.db) {
    console.error('❌ MongoDB database connection not ready.');
    process.exit(1);
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  console.log('Current MongoDB collections:', collectionNames);

  const bundleCollectionsToDrop = [
    'vehicle_catalog_bundles',
    'weapon_catalog_bundles',
    'character_gallery_bundles',
    'map_catalog_bundles'
  ];

  for (const bundleName of bundleCollectionsToDrop) {
    if (collectionNames.includes(bundleName)) {
      console.log(`🗑️ Dropping legacy bundle collection "${bundleName}" from MongoDB...`);
      await mongoose.connection.db.dropCollection(bundleName);
      console.log(`✅ Dropped "${bundleName}".`);
    } else {
      console.log(`ℹ️ Bundle collection "${bundleName}" does not exist.`);
    }
  }

  const remainingCollections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n✨ Remaining MongoDB collections:');
  console.log(remainingCollections.map(c => c.name).sort());

  process.exit(0);
}

cleanMongoBundles().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
