import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

const modelDescriptionsShort = {
  'SB02': 'Étatique : 1ère ➔ 4ème',
  'SB03': 'Privé : 1ère ➔ 3ème | Étatique : 3ème ➔ 6ème',
  'SBL01': 'Étatique : 1ère ➔ 2ème',
  'SBL02': 'Privé : 1ère ➔ 3ème | Étatique : 3ème ➔ 6ème',
  'SBL03': 'Privé : 1ère ➔ 6ème | Étatique : 4ème ➔ 6ème',
  'SBH02': 'Privé : 1ère ➔ 3ème | Étatique : 3ème ➔ 6ème',
  'SBH03': 'Privé : 1ère ➔ 6ème | Étatique : 4ème ➔ 6ème',
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

async function updateShortDescriptions() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const products = await productsColl.find({}).toArray();

  let updatedCount = 0;

  for (const p of products) {
    const prefix = getModelPrefix(p.name);
    if (prefix && modelDescriptionsShort[prefix]) {
      const descText = modelDescriptionsShort[prefix];

      let newSpecs = p.specifications || [];
      const specMap = new Map();
      newSpecs.forEach(s => specMap.set(s.key, s.value));
      specMap.set('Description', descText);
      specMap.set('Niveau scolaire', descText);

      const finalSpecs = Array.from(specMap.entries()).map(([key, value]) => ({ key, value }));

      await productsColl.updateOne(
        { _id: p._id },
        {
          $set: {
            description: descText,
            schoolLevel: descText,
            specifications: finalSpecs
          }
        }
      );
      updatedCount++;
    }
  }

  console.log(`✅ Updated ${updatedCount} products with short concise descriptions locally.`);

  const sampleSB02 = await productsColl.findOne({ name: /^SB02/i });
  console.log('\nSample SB02:', sampleSB02.name, '->', sampleSB02.description);

  const sampleSBH03 = await productsColl.findOne({ name: /^SBH03/i });
  console.log('Sample SBH03:', sampleSBH03.name, '->', sampleSBH03.description);

  await mongoose.disconnect();
}

updateShortDescriptions();
