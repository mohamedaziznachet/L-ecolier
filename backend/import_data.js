import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function importDatabase() {
  // Use the MONGODB_URI from the VPS .env file
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to VPS MongoDB at:", uri);
    const db = client.db(); // uses the database specified in the URI

    const backupDir = './db_backup';
    if (!fs.existsSync(backupDir)) {
      throw new Error("The 'db_backup' folder does not exist! Please upload it first.");
    }

    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const collectionName = path.basename(file, '.json');
      const data = JSON.parse(fs.readFileSync(path.join(backupDir, file), 'utf8'));

      if (data.length > 0) {
        const collection = db.collection(collectionName);
        
        // Convert string _id fields back to ObjectIds if they were originally ObjectIds
        // MongoDB driver insertMany will preserve the _id fields
        
        // Clear existing data in the collection
        await collection.deleteMany({});
        
        // Insert new data
        await collection.insertMany(data);
        console.log(`Successfully imported ${data.length} records into '${collectionName}'`);
      } else {
        console.log(`Skipped empty collection '${collectionName}'`);
      }
    }

    console.log("Database imported successfully!");
  } catch (error) {
    console.error("Error importing database:", error);
  } finally {
    await client.close();
  }
}

importDatabase();
