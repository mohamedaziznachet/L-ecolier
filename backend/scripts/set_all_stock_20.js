import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

async function setAllStock20() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  const result = await productsColl.updateMany(
    {},
    {
      $set: {
        stock: 20,
        availability: 'En stock'
      }
    }
  );

  console.log(`Updated ${result.modifiedCount} products out of ${result.matchedCount} locally.`);

  const totalCount = await productsColl.countDocuments();
  const stock20Count = await productsColl.countDocuments({ stock: 20, availability: 'En stock' });
  console.log(`Total Products: ${totalCount}`);
  console.log(`Products with stock = 20 & "En stock": ${stock20Count}`);

  await mongoose.disconnect();
}

setAllStock20();
