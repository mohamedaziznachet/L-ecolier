import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

async function checkCategories() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const dbProducts = await productsColl.find({}).toArray();

  const refToCategory = new Map();

  dbProducts.forEach(p => {
    const name = p.name || '';
    const prefix = name.split('-')[0];
    if (!refToCategory.has(prefix)) {
      refToCategory.set(prefix, new Set());
    }
    refToCategory.get(prefix).add(p.category);
  });

  console.log("=== Prefix to Category Map in DB ===");
  refToCategory.forEach((cats, prefix) => {
    console.log(`Prefix: "${prefix}" -> Categories:`, Array.from(cats));
  });

  await mongoose.disconnect();
}

checkCategories();
