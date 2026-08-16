import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

async function verifyDb() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const totalCount = await productsColl.countDocuments();
  console.log(`Total Products in DB: ${totalCount}`);

  const inStockCount = await productsColl.countDocuments({ availability: 'En stock' });
  const outOfStockCount = await productsColl.countDocuments({ availability: 'Epuisé' });
  console.log(`In Stock ("En stock"): ${inStockCount}`);
  console.log(`Out of Stock ("Epuisé"): ${outOfStockCount}`);

  const updatedSample = await productsColl.findOne({ name: 'SB01-XL-BIKER' });
  console.log('\nUpdated Product Sample (SB01-XL-BIKER):', JSON.stringify(updatedSample, null, 2));

  const createdSample = await productsColl.findOne({ name: 'SB02-NINJA' });
  console.log('\nCreated Product Sample (SB02-NINJA):', JSON.stringify(createdSample, null, 2));

  await mongoose.disconnect();
}

verifyDb();
