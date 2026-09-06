import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const rawUri = (process.env.MONGODB_URI || '').trim();
// Strip any accidental whitespace inside the URI safely without hardcoding any values
const uri = rawUri.replace(/\s+/g, '');

console.log('Connecting to MongoDB...');

async function run() {
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    console.log('Connected to MongoDB successfully!');

    const db = conn.db;
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections in MongoDB.`);

    const gtaviDataPath = path.resolve('./src/data/gtavi_data.json');
    let currentData = {};
    if (fs.existsSync(gtaviDataPath)) {
      try {
        currentData = JSON.parse(fs.readFileSync(gtaviDataPath, 'utf-8'));
      } catch (e) {
        currentData = {};
      }
    }

    // Fetch all collections from the MongoDB database
    const summary = {};
    const sortedCollections = collections.map(c => c.name).sort();

    for (const name of sortedCollections) {
      let docs = [];
      try {
        docs = await db.collection(name).find({}).toArray();
      } catch (err) {
        console.warn(`Collection ${name} query failed:`, err.message);
      }
      summary[name] = docs.length;

      const cleanedDocs = docs.map(doc => {
        const { _id, __v, ...rest } = doc;
        return {
          id: doc.id || (_id ? _id.toString() : undefined),
          ...rest
        };
      });

      currentData[name] = cleanedDocs;
    }

    fs.writeFileSync(gtaviDataPath, JSON.stringify(currentData, null, 2), 'utf-8');
    console.log('Successfully written updated data to /src/data/gtavi_data.json!');
    console.log('Summary of fetched collections:', JSON.stringify(summary, null, 2));

    await conn.close();
    process.exit(0);
  } catch (err) {
    console.error('Error fetching MongoDB data:', err);
    process.exit(1);
  }
}

run();
