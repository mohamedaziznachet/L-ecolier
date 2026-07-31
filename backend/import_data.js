import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function importDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to VPS MongoDB at:", uri);
    const db = client.db();

    const backupDir = './db_backup';
    if (!fs.existsSync(backupDir)) {
      throw new Error("The 'db_backup' folder does not exist!");
    }

    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const collectionName = path.basename(file, '.json');
      const data = JSON.parse(fs.readFileSync(path.join(backupDir, file), 'utf8'));

      if (data.length > 0) {
        const collection = db.collection(collectionName);
        let insertedCount = 0;
        let skippedCount = 0;

        for (const doc of data) {
          // Identify existing record by _id or id or name
          const filter = doc._id ? { _id: doc._id } : (doc.id ? { id: doc.id } : { name: doc.name });
          
          const result = await collection.updateOne(
            filter,
            { $setOnInsert: doc },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            insertedCount++;
          } else {
            skippedCount++;
          }
        }

        console.log(`Collection '${collectionName}': Created ${insertedCount} new items, skipped ${skippedCount} existing items.`);
      } else {
        console.log(`Skipped empty collection '${collectionName}'`);
      }
    }

    console.log("\n✅ Database sync complete! Existing items were left untouched, new items created.");
  } catch (error) {
    console.error("Error importing database:", error);
  } finally {
    await client.close();
  }
}

importDatabase();
