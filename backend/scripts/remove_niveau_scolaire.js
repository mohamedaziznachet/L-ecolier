import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

async function removeNiveauScolaire() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const products = await productsColl.find({}).toArray();

  console.log(`=== Removing 'Niveau scolaire' field & specs ===`);
  console.log(`Total Products: ${products.length}`);

  let updatedCount = 0;

  for (const p of products) {
    let filteredSpecs = [];
    if (p.specifications && Array.isArray(p.specifications)) {
      filteredSpecs = p.specifications.filter(s => {
        if (!s || !s.key) return false;
        const k = String(s.key).toLowerCase().trim();
        return k !== 'niveau scolaire' && k !== 'niveau' && k !== 'schoollevel';
      });
    }

    await productsColl.updateOne(
      { _id: p._id },
      {
        $set: {
          schoolLevel: '',
          specifications: filteredSpecs
        }
      }
    );
    updatedCount++;
  }

  console.log(`✅ Successfully updated ${updatedCount} products locally.`);

  const sampleSB02 = await productsColl.findOne({ name: /^SB02/i });
  console.log('\nSample SB02 Product:', JSON.stringify(sampleSB02, null, 2));

  await mongoose.disconnect();
}

removeNiveauScolaire();
