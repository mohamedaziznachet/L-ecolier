import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

const targetModels = ['QUAD', 'HOOTIE', 'NINJA', 'PRETTYGIRL', 'BESTFRIEND'];

async function testNewCollectionFilter() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  const regexPattern = targetModels.join('|');
  const query = {
    status: 'active',
    $or: [
      { name: { $regex: regexPattern, $options: 'i' } },
      { description: { $regex: regexPattern, $options: 'i' } },
      { 'specifications.value': { $regex: regexPattern, $options: 'i' } }
    ]
  };

  const products = await productsColl.find(query).toArray();
  console.log(`Matching products for [${targetModels.join(', ')}]: ${products.length}`);

  products.forEach(p => {
    console.log(`- ${p.name} | Cat: ${p.category} | Img: ${p.img}`);
  });

  await mongoose.disconnect();
}

testNewCollectionFilter();
