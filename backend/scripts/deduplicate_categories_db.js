import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { CategoryModel } from '../dist/models/index.js';

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  // Get all categories
  const categories = await CategoryModel.find({}).lean();
  console.log(`Found ${categories.length} category documents in DB.`);

  const seen = new Set();
  const duplicates = [];

  for (const cat of categories) {
    const nameNorm = cat.name.trim().toLowerCase();
    if (seen.has(nameNorm)) {
      duplicates.push(cat._id);
    } else {
      seen.add(nameNorm);
    }
  }

  if (duplicates.length > 0) {
    console.log(`Deleting ${duplicates.length} duplicate category documents...`);
    await CategoryModel.deleteMany({ _id: { $in: duplicates } });
    console.log("Duplicates deleted successfully!");
  } else {
    console.log("No duplicate category documents found by name.");
  }

  // Force build unique index on name field
  try {
    console.log("Ensuring unique index on category name...");
    await CategoryModel.collection.dropIndex('name_1').catch(() => {});
    await CategoryModel.collection.createIndex({ name: 1 }, { unique: true });
    console.log("Unique index on name successfully created/verified!");
  } catch (err) {
    console.error("Failed to build unique index:", err);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error("Error in deduplicate_categories_db:", err);
  process.exit(1);
});
