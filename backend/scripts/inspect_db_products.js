import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to Mongo at:", uri);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const productsColl = db.collection('products');
    const count = await productsColl.countDocuments();
    console.log("Total products count in DB:", count);

    const sample = await productsColl.find().limit(5).toArray();
    console.log("Sample 5 products:", JSON.stringify(sample, null, 2));

    // Also check if any BOMI or reference exists
    const bomiSample = await productsColl.find({ $or: [ { brand: /bomi/i }, { name: /bomi/i }, { category: /bomi/i } ] }).limit(5).toArray();
    console.log("BOMI products sample count:", await productsColl.countDocuments({ $or: [ { brand: /bomi/i }, { name: /bomi/i }, { category: /bomi/i } ] }));
    console.log("BOMI products sample:", JSON.stringify(bomiSample, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
