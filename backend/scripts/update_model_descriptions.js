import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

const modelDescriptions = {
  'SB02': 'Ce modèle est conseillé de la 1ère à la 4ème année dans le système étatique.',
  'SB03': 'Ce modèle est conseillé de la 3ème à la 6ème année dans le système étatique, et de la 1ère à la 3ème année dans le système privé.',
  'SBL01': 'Ce modèle est conseillé de la 1ère à la 2ème année dans le système étatique.',
  'SBL02': 'Ce modèle est conseillé de la 3ème à la 6ème année dans le système étatique, et de la 1ère à la 3ème année dans le système privé.',
  'SBL03': 'Ce modèle est conseillé de la 4ème à la 6ème année dans le système étatique, et de la 1ère à la 6ème année dans le système privé.',
  'SBH02': 'Ce modèle est conseillé de la 3ème à la 6ème année dans le système étatique, et de la 1ère à la 3ème année dans le système privé.',
  'SBH03': 'Ce modèle est conseillé de la 4ème à la 6ème année dans le système étatique, et de la 1ère à la 6ème année dans le système privé.',
};

function getModelPrefix(name) {
  if (!name) return null;
  const cleanName = name.trim().toUpperCase();
  
  // Check exact prefixes ordered from longest to shortest
  const prefixes = ['SBL01', 'SBL02', 'SBL03', 'SBH02', 'SBH03', 'SB02', 'SB03'];
  for (const prefix of prefixes) {
    if (cleanName.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}

async function updateModelDescriptions() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const products = await productsColl.find({}).toArray();

  console.log(`Total DB Products: ${products.length}`);
  let updatedCount = 0;

  for (const p of products) {
    const prefix = getModelPrefix(p.name);
    if (prefix && modelDescriptions[prefix]) {
      const descText = modelDescriptions[prefix];

      // Update specifications array
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
      console.log(`[UPDATED] Product "${p.name}" (Prefix: ${prefix}) -> Description set.`);
    }
  }

  console.log(`\n✅ Total products updated with custom model descriptions: ${updatedCount}`);

  // Sample check
  const sampleSB02 = await productsColl.findOne({ name: /^SB02/i });
  console.log('\nSample SB02 Product:', JSON.stringify(sampleSB02, null, 2));

  const sampleSBH03 = await productsColl.findOne({ name: /^SBH03/i });
  console.log('\nSample SBH03 Product:', JSON.stringify(sampleSBH03, null, 2));

  await mongoose.disconnect();
}

updateModelDescriptions();
