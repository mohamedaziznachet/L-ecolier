import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Deploying developed Cartables categories on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const remoteScript = `${remotePath}/backend/refactor_categories_developed_v2.js`;

    const scriptContent = `
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, CategoryModel, PageSettingsModel } from './dist/models/index.js';

function mapToCategory(oldCat, prodName = '', prodDesc = '') {
  const catUpper = (oldCat || '').toUpperCase();
  const nameUpper = (prodName || '').toUpperCase();
  const descUpper = (prodDesc || '').toUpperCase();
  const fullText = \`\${catUpper} \${nameUpper} \${descUpper}\`;

  // 1. Sacs & Cartables subcategories (developed)
  if (fullText.includes('SB02') || fullText.includes('ECO LUX')) return 'Cartable Eco Lux';
  if (fullText.includes('SB03') || fullText.includes('HIGH LUX')) return 'Cartable high lux';
  if (fullText.includes('SB04') || fullText.includes('SUPER LUX')) return 'Cartable super lux';
  if (fullText.includes('SB01') || fullText.includes('CARTABLE LUX') || fullText.includes('LUX')) return 'Cartable Lux';
  if (fullText.includes('CH0') || fullText.includes('CHARIOT')) return 'Chariots';
  if (fullText.includes('TR0') || fullText.includes('TROUSSE')) return 'Trousse';
  if (fullText.includes('JE0') || fullText.includes('JARDIN')) return "Jardin d'enfant";
  if (fullText.includes('PX0') || fullText.includes('PANIER')) return 'Paniers';
  if (fullText.includes('CARTABLE') || fullText.includes('SAC A DOS') || fullText.includes('BOMI 2026')) return 'Cartables & Sacs à dos';

  // 2. Cahiers & Papeterie
  if (
    fullText.includes('CAHIER') || fullText.includes('WIRO') || fullText.includes('BROCHURE') ||
    fullText.includes('BLOC') || fullText.includes('CARNET') || fullText.includes('AGENDA') ||
    fullText.includes('PIQURE') || fullText.includes('DOUBLE') || fullText.includes('BRISTOL')
  ) {
    return 'Cahiers & Papeterie';
  }

  // 3. Rangement & Classement
  if (
    fullText.includes('CHEMISE') || fullText.includes('CLASSEUR') || fullText.includes('PORTE DOC') ||
    fullText.includes('RANGEMENT')
  ) {
    return 'Rangement & Classement';
  }

  // 4. Matériel artistique
  if (
    fullText.includes('ARTISTIQUE') || fullText.includes('GOUACHE') || fullText.includes('AQUARELLE') ||
    fullText.includes('PATE') || fullText.includes('PEINTURE') || fullText.includes('PINCEAU')
  ) {
    return 'Matériel artistique';
  }

  // 5. Stylos & Crayons
  if (
    fullText.includes('STYLO') || fullText.includes('CRAYON') || fullText.includes('FEUTRE') ||
    fullText.includes('CORRECTEUR') || fullText.includes('TIPP-EX') || fullText.includes('GOMME') ||
    fullText.includes('TAILLE CRAYON')
  ) {
    return 'Stylos & Crayons';
  }

  // 6. Default: Fournitures scolaires
  return 'Fournitures scolaires';
}

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(\`Connected to MongoDB at \${uri}!\`);

  const allProducts = await ProductModel.find({}).select('_id category name description').lean();
  const bulkOps = [];

  for (const prod of allProducts) {
    const targetCat = mapToCategory(prod.category, prod.name, prod.description);
    if (prod.category !== targetCat) {
      bulkOps.push({
        updateOne: {
          filter: { _id: prod._id },
          update: { $set: { category: targetCat } }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await ProductModel.bulkWrite(bulkOps);
    console.log(\`✅ Bulk updated \${bulkOps.length} products into developed Sacs & Cartables categories!\`);
  } else {
    console.log('✅ All products are already correctly categorized!');
  }

  const distinctCats = (await ProductModel.distinct('category')).filter(Boolean).map(c => c.trim()).sort();

  // Reset CategoryModel
  await CategoryModel.deleteMany({});
  for (const catName of distinctCats) {
    await CategoryModel.create({ name: catName, image: '' });
  }

  // Reset PageSettings for categories
  await PageSettingsModel.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', content: distinctCats },
    { returnDocument: 'after', upsert: true }
  );

  console.log('✅ Re-created CategoryModel & pageSettings with developed categories:', distinctCats);

  await mongoose.disconnect();
}

run().catch(console.error);
    `;

    const writeStream = sftp.createWriteStream(remoteScript);
    writeStream.on('close', () => {
      console.log('Uploaded script to VPS. Executing...');
      const cmd = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remotePath}/backend
        node refactor_categories_developed_v2.js
      `;
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', (code) => {
          console.log('Finished VPS execution with code:', code);
          console.log('Output:\n' + output);
          conn.end();
        }).on('data', (data) => {
          output += data;
        }).stderr.on('data', (data) => {
          output += 'STDERR: ' + data;
        });
      });
    });
    writeStream.write(scriptContent);
    writeStream.end();
  });
}).on('error', (err) => {
  console.error('Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
