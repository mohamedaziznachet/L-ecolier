import { MongoClient } from 'mongodb';
import fs from 'fs';

async function exportDatabase() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to local MongoDB");
    const db = client.db("lecolierer0");

    // Get all collections
    const collections = await db.listCollections().toArray();
    
    if (!fs.existsSync('./db_backup')) {
      fs.mkdirSync('./db_backup');
    }

    for (const col of collections) {
      const collectionName = col.name;
      const data = await db.collection(collectionName).find({}).toArray();
      
      fs.writeFileSync(
        `./db_backup/${collectionName}.json`, 
        JSON.stringify(data, null, 2)
      );
      console.log(`Exported ${data.length} records from ${collectionName}`);
    }

    console.log("Database exported successfully to the 'db_backup' folder!");
  } catch (error) {
    console.error("Error exporting database:", error);
  } finally {
    await client.close();
  }
}

exportDatabase();
