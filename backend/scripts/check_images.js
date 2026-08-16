import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

async function checkDefaultImages() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const dbProducts = await productsColl.find({}).toArray();

  const prefixImages = new Map();

  dbProducts.forEach(p => {
    const prefix = p.name ? p.name.split('-')[0] : '';
    if (prefix && p.img && !prefixImages.has(prefix)) {
      prefixImages.set(prefix, p.img);
    }
  });

  console.log("=== Representative Images per Prefix ===");
  prefixImages.forEach((img, prefix) => {
    console.log(`Prefix "${prefix}" -> img: "${img}"`);
  });

  await mongoose.disconnect();
}

checkDefaultImages();
