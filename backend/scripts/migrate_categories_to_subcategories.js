import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { ProductModel, CategoryModel } from '../dist/models/index.js';

// Mapping of old main categories that should be subcategories under a new parent category
const MIGRATION_MAP = {
  "Cartable Eco Lux": { parent: "Bomi", sub: "Cartable Eco Lux" },
  "Cartable Lux": { parent: "Bomi", sub: "Cartable Lux" },
  "Cartable high lux": { parent: "Bomi", sub: "Cartable high lux" },
  "Cartable super lux": { parent: "Bomi", sub: "Cartable super lux" },
  "Chariots": { parent: "Bomi", sub: "Chariots" },
  "Trousse": { parent: "Bomi", sub: "Trousse" },
  "Lunch box": { parent: "Bomi", sub: "Lunch box" },
  "paniers": { parent: "Bomi", sub: "paniers" },
};

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  for (const [oldCat, target] of Object.entries(MIGRATION_MAP)) {
    // 1. Update products category & subcategory
    const pRes = await ProductModel.updateMany(
      { category: oldCat },
      { $set: { category: target.parent, subcategory: target.sub } }
    );
    console.log(`Migrated ${pRes.modifiedCount} products from main category "${oldCat}" to "${target.parent} > ${target.sub}"`);

    // 2. Delete the old category from CategoryModel to avoid repetition
    await CategoryModel.deleteOne({ name: oldCat });
    console.log(`Deleted category "${oldCat}" from CategoryModel.`);
  }

  // 3. Make sure Bomi is present as a main category
  await CategoryModel.updateOne(
    { name: "Bomi" },
    { $setOnInsert: { name: "Bomi", subcategories: [] } },
    { upsert: true }
  );

  console.log("Migration completed successfully!");
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
