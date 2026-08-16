import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

const targetImg = "/uploads/image-1785007405351-590014737.png";

async function makeTargetImgInactive() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  const filter = {
    $or: [
      { img: targetImg },
      { images: targetImg }
    ]
  };

  const matchingProducts = await productsColl.find(filter).toArray();
  console.log(`Products matching image "${targetImg}": ${matchingProducts.length}`);

  matchingProducts.forEach(p => {
    console.log(`- ID: ${p._id} | Name: "${p.name}" | Category: "${p.category}"`);
  });

  const result = await productsColl.updateMany(
    filter,
    {
      $set: {
        status: 'inactive'
      }
    }
  );

  console.log(`✅ Successfully set ${result.modifiedCount} products to inactive locally.`);

  const activeCount = await productsColl.countDocuments({ status: 'active' });
  const inactiveCount = await productsColl.countDocuments({ status: 'inactive' });
  console.log(`Active Products remaining: ${activeCount}`);
  console.log(`Inactive Products total: ${inactiveCount}`);

  await mongoose.disconnect();
}

makeTargetImgInactive();
