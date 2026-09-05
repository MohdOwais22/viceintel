import { connectToMongoDB } from '../src/lib/db/mongodb';
import { saveDocument, findDocuments } from '../src/lib/db/mongoHelpers';
import { VEHICLES_DATA } from '../src/data/vehicles';
import { WEAPONS_DATA } from '../src/data/weapons';
import { CHARACTERS_DATA } from '../src/data/characters';
import { MAP_LOCATIONS_DATA } from '../src/data/mapLocations';
import { RP_SERVERS_DATA } from '../src/data/rpServers';
import { BLOG_POSTS } from '../src/data/blogPosts';
import { BUSINESSES_DATA } from '../src/data/businesses';
import mongoose from 'mongoose';

async function seedCatalogs() {
  console.log('🔄 Connecting to MongoDB...');
  const conn = await connectToMongoDB();
  if (!conn) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  console.log('📦 Seeding individual Vehicles collection...');
  let vehicleCount = 0;
  for (const v of VEHICLES_DATA) {
    const id = v.id || `veh_${v.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await saveDocument('vehicles', id, { ...v, id });
    vehicleCount++;
  }
  console.log(`✅ Seeded ${vehicleCount} individual vehicles into MongoDB "vehicles" collection.`);

  console.log('📦 Seeding individual Weapons collection...');
  let weaponCount = 0;
  for (const w of WEAPONS_DATA) {
    const id = w.id || `weap_${w.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await saveDocument('weapons', id, { ...w, id });
    weaponCount++;
  }
  console.log(`✅ Seeded ${weaponCount} individual weapons into MongoDB "weapons" collection.`);

  console.log('📦 Seeding individual Characters collection...');
  let charCount = 0;
  for (const c of CHARACTERS_DATA) {
    const id = c.id || `char_${c.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await saveDocument('characters', id, { ...c, id });
    charCount++;
  }
  console.log(`✅ Seeded ${charCount} individual characters into MongoDB "characters" collection.`);

  console.log('📦 Seeding Map Locations collection...');
  let mapCount = 0;
  for (const m of MAP_LOCATIONS_DATA) {
    const id = m.id || `map_${m.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await saveDocument('mapLocations', id, { ...m, id });
    mapCount++;
  }
  console.log(`✅ Seeded ${mapCount} map locations into MongoDB "mapLocations" collection.`);

  console.log('📦 Seeding RP Servers collection...');
  let rpCount = 0;
  for (const s of RP_SERVERS_DATA) {
    const id = s.id || `rp_${s.slug || s.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await saveDocument('rpServers', id, { ...s, id });
    rpCount++;
  }
  console.log(`✅ Seeded ${rpCount} RP servers into MongoDB "rpServers" collection.`);

  console.log('📦 Seeding Blog Posts collection...');
  let blogCount = 0;
  for (const b of BLOG_POSTS) {
    const id = b.id || `blog_${b.slug || b.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await saveDocument('blogPosts', id, { ...b, id });
    blogCount++;
  }
  console.log(`✅ Seeded ${blogCount} blog posts into MongoDB "blogPosts" collection.`);

  console.log('📦 Seeding Businesses collection...');
  let busCount = 0;
  for (const b of BUSINESSES_DATA) {
    const id = b.id || `bus_${b.slug || b.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await saveDocument('businesses', id, { ...b, id });
    busCount++;
  }
  console.log(`✅ Seeded ${busCount} businesses into MongoDB "businesses" collection.`);

  // Verify counts
  const savedVehicles = await findDocuments('vehicles', {}, 500);
  const savedWeapons = await findDocuments('weapons', {}, 500);
  const savedChars = await findDocuments('characters', {}, 500);
  const savedMaps = await findDocuments('mapLocations', {}, 500);
  const savedRps = await findDocuments('rpServers', {}, 500);
  const savedBlogs = await findDocuments('blogPosts', {}, 500);
  const savedBus = await findDocuments('businesses', {}, 500);
  const savedProfiles = await findDocuments('userProfiles', {}, 500);

  console.log(`\n🎉 Verification in MongoDB:`);
  console.log(`- userProfiles: ${savedProfiles.length} documents`);
  console.log(`- vehicles: ${savedVehicles.length} documents`);
  console.log(`- weapons: ${savedWeapons.length} documents`);
  console.log(`- characters: ${savedChars.length} documents`);
  console.log(`- mapLocations: ${savedMaps.length} documents`);
  console.log(`- rpServers: ${savedRps.length} documents`);
  console.log(`- blogPosts: ${savedBlogs.length} documents`);
  console.log(`- businesses: ${savedBus.length} documents`);

  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAll MongoDB Collections:', collections.map(c => c.name).sort());
  }

  process.exit(0);
}

seedCatalogs().catch((e) => {
  console.error('Error during catalog seed:', e);
  process.exit(1);
});
