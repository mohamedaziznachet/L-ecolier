import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Deploying 6 simple categories on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const remoteScript = `${remotePath}/backend/simplify_categories_clean.js`;

    const scriptContent = `
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, CategoryModel, PageSettingsModel } from './dist/models/index.js';

const SIMPLE_CATEGORIES = [
  'Cahiers & Papeterie',
  'Stylos & Écriture',
  'Cartables & Bagagerie',
  'Rangement & Classement',
  'Matériel Artistique & Dessin',
  'Accessoires & Fournitures'
];

function mapToSimpleCategory(oldCat, prodName = '', prodDesc = '') {
  const catUpper = (oldCat || '').toUpperCase();
  const nameUpper = (prodName || '').toUpperCase();
  const descUpper = (prodDesc || '').toUpperCase();
  const fullText = \`\${catUpper} \${nameUpper} \${descUpper}\`;

  // 1. Cartables & Bagagerie
  if (
    fullText.includes('CARTABLE') || fullText.includes('CHARIOT') || fullText.includes('TROUSSE') ||
    fullText.includes('PANIER') || fullText.includes('JARDIN') || fullText.includes('SAC') ||
    fullText.includes('SB0') || fullText.includes('LUX') || fullText.includes('BOMI 2026')
  ) {
    return 'Cartables & Bagagerie';
  }

  // 2. Cahiers & Papeterie
  if (
    fullText.includes('CAHIER') || fullText.includes('WIRO') || fullText.includes('BROCHURE') ||
    fullText.includes('BLOC') || fullText.includes('CARNET') || fullText.includes('AGENDA') ||
    fullText.includes('PIQURE') || fullText.includes('DOUBLE') || fullText.includes('BRISTOL') ||
    fullText.includes('RAMETTE')
  ) {
    return 'Cahiers & Papeterie';
  }

  // 3. Rangement & Classement
  if (
    fullText.includes('CHEMISE') || fullText.includes('CLASSEUR') || fullText.includes('PORTE DOC') ||
    fullText.includes('RANGEMENT') || fullText.includes('PORTE BLOC') || fullText.includes('RECHARGE PORTE')
  ) {
    return 'Rangement & Classement';
  }

  // 4. Matériel Artistique & Dessin
  if (
    fullText.includes('ARTISTIQUE') || fullText.includes('GOUACHE') || fullText.includes('AQUARELLE') ||
    fullText.includes('PATE') || fullText.includes('PEINTURE') || fullText.includes('PINCEAU') ||
    fullText.includes('PALETTE') || fullText.includes('CANSON') || fullText.includes('DESSIN')
  ) {
    return 'Matériel Artistique & Dessin';
  }

  // 5. Stylos & Écriture
  if (
    fullText.includes('STYLO') || fullText.includes('CRAYON') || fullText.includes('FEUTRE') ||
    fullText.includes('CORRECTEUR') || fullText.includes('TIPP-EX') || fullText.includes('GOMME') ||
    fullText.includes('TAILLE CRAYON') || fullText.includes('SURNEUR') || fullText.includes('MINES')
  ) {
    return 'Stylos & Écriture';
  }

  // 6. Accessoires & Fournitures
  return 'Accessoires & Fournitures';
}

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(\`Connected to MongoDB at \${uri}!\`);

  const allProducts = await ProductModel.find({}).select('_id category name description').lean();
  const bulkOps = [];

  for (const prod of allProducts) {
    const targetCat = mapToSimpleCategory(prod.category, prod.name, prod.description);
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
    console.log(\`✅ Bulk updated \${bulkOps.length} products into 6 simple categories!\`);
  } else {
    console.log('✅ All products are already categorized!');
  }

  // Reset CategoryModel
  await CategoryModel.deleteMany({});
  for (const catName of SIMPLE_CATEGORIES) {
    await CategoryModel.create({ name: catName, image: '' });
  }

  // Reset PageSettings for categories
  await PageSettingsModel.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', content: SIMPLE_CATEGORIES },
    { returnDocument: 'after', upsert: true }
  );

  console.log('✅ Re-created CategoryModel & pageSettings with 6 simple categories:', SIMPLE_CATEGORIES);

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
        node simplify_categories_clean.js
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
