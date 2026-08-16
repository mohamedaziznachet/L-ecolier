import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

async function checkCategoriesColl() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const categoriesColl = db.collection('categories');
  const cats = await categoriesColl.find({}).toArray();

  console.log("=== Categories in DB ===");
  console.log(cats);

  await mongoose.disconnect();
}

checkCategoriesColl();
