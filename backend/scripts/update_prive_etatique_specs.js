import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

const modelSpecs = {
  'SB02': [
    { key: 'Étatique', value: '1ère ➔ 4ème' }
  ],
  'SB03': [
    { key: 'Privé', value: '1ère ➔ 3ème' },
    { key: 'Étatique', value: '3ème ➔ 6ème' }
  ],
  'SBL01': [
    { key: 'Étatique', value: '1ère ➔ 2ème' }
  ],
  'SBL02': [
    { key: 'Privé', value: '1ère ➔ 3ème' },
    { key: 'Étatique', value: '3ème ➔ 6ème' }
  ],
  'SBL03': [
    { key: 'Privé', value: '1ère ➔ 6ème' },
    { key: 'Étatique', value: '4ème ➔ 6ème' }
  ],
  'SBH02': [
    { key: 'Privé', value: '1ère ➔ 3ème' },
    { key: 'Étatique', value: '3ème ➔ 6ème' }
  ],
  'SBH03': [
    { key: 'Privé', value: '1ère ➔ 6ème' },
    { key: 'Étatique', value: '4ème ➔ 6ème' }
  ],
};

function getModelPrefix(name) {
  if (!name) return null;
  const cleanName = name.trim().toUpperCase();
  const prefixes = ['SBL01', 'SBL02', 'SBL03', 'SBH02', 'SBH03', 'SB02', 'SB03'];
  for (const prefix of prefixes) {
    if (cleanName.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}

async function updatePriveEtatiqueSpecs() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const products = await productsColl.find({}).toArray();

  let updatedCount = 0;

  for (const p of products) {
    const prefix = getModelPrefix(p.name);
    if (prefix && modelSpecs[prefix]) {
      const newSpecs = modelSpecs[prefix];

      await productsColl.updateOne(
        { _id: p._id },
        {
          $set: {
            specifications: newSpecs
          }
        }
      );
      updatedCount++;
    } else {
      // Clear non-model specs or keep empty
      await productsColl.updateOne(
        { _id: p._id },
        {
          $set: {
            specifications: []
          }
        }
      );
    }
  }

  console.log(`✅ Updated ${updatedCount} products with Privé & Étatique titles in Specifications locally.`);

  const sampleSB02 = await productsColl.findOne({ name: /^SB02/i });
  console.log('\nSample SB02 Specs:', JSON.stringify(sampleSB02.specifications, null, 2));

  const sampleSBH03 = await productsColl.findOne({ name: /^SBH03/i });
  console.log('\nSample SBH03 Specs:', JSON.stringify(sampleSBH03.specifications, null, 2));

  await mongoose.disconnect();
}

updatePriveEtatiqueSpecs();
