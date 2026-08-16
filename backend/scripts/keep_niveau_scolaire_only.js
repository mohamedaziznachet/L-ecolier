import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

async function keepNiveauScolaireOnly() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const products = await productsColl.find({}).toArray();

  console.log(`=== Keeping 'Niveau scolaire' only in Specifications ===`);
  console.log(`Total Products: ${products.length}`);

  let updatedCount = 0;

  for (const p of products) {
    let niveauScolaireValue = null;

    if (p.schoolLevel && typeof p.schoolLevel === 'string' && p.schoolLevel.trim() !== '') {
      niveauScolaireValue = p.schoolLevel.trim();
    } else if (p.specifications && Array.isArray(p.specifications)) {
      const foundSpec = p.specifications.find(s => s && s.key && String(s.key).toLowerCase() === 'niveau scolaire');
      if (foundSpec && foundSpec.value) {
        niveauScolaireValue = String(foundSpec.value).trim();
      }
    }

    const newSpecs = niveauScolaireValue
      ? [{ key: 'Niveau scolaire', value: niveauScolaireValue }]
      : [];

    await productsColl.updateOne(
      { _id: p._id },
      {
        $set: {
          specifications: newSpecs
        }
      }
    );
    updatedCount++;
  }

  console.log(`✅ Successfully updated ${updatedCount} products locally.`);

  const sampleSB02 = await productsColl.findOne({ name: /^SB02/i });
  console.log('\nSample SB02 Specs:', JSON.stringify(sampleSB02.specifications, null, 2));

  const sampleTS01 = await productsColl.findOne({ name: /^TS01/i });
  console.log('\nSample TS01 Specs:', JSON.stringify(sampleTS01.specifications, null, 2));

  await mongoose.disconnect();
}

keepNiveauScolaireOnly();
