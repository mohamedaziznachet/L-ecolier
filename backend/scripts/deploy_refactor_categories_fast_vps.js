import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Fast refactoring categories on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const remoteScript = `${remotePath}/backend/refactor_categories_fast.js`;

    const scriptContent = `
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, CategoryModel, PageSettingsModel } from './dist/models/index.js';

const CLEAN_CATEGORIES = [
  'Cahiers & Papeterie',
  'Stylos & Crayons',
  'Fournitures scolaires',
  'Sacs & Cartables',
  'Rangement & Classement',
  'Matériel artistique'
];

function mapToMainCategory(catName, prodName = '') {
  const catUpper = (catName || '').toUpperCase();
  const nameUpper = (prodName || '').toUpperCase();

  // 1. Cahiers & Papeterie
  if (
    catUpper.includes('CAHIER') || catUpper.includes('WIRO') || catUpper.includes('BROCHURE') ||
    catUpper.includes('BLOC') || catUpper.includes('CARNET') || catUpper.includes('AGENDA') ||
    catUpper.includes('PIQURE') || catUpper.includes('DOUBLE') || catUpper.includes('BRISTOL') ||
    nameUpper.includes('CAHIER') || nameUpper.includes('BROCHURE') || nameUpper.includes('BLOC NOTE') ||
    nameUpper.includes('AGENDA')
  ) {
    return 'Cahiers & Papeterie';
  }

  // 2. Sacs & Cartables
  if (
    catUpper.includes('CARTABLE') || catUpper.includes('CHARIOT') || catUpper.includes('TROUSSE') ||
    catUpper.includes('PANIER') || nameUpper.includes('CARTABLE') || nameUpper.includes('SAC A DOS') ||
    nameUpper.includes('TROUSSE') || nameUpper.includes('SAC ')
  ) {
    return 'Sacs & Cartables';
  }

  // 3. Rangement & Classement
  if (
    catUpper.includes('CHEMISE') || catUpper.includes('CLASSEUR') || catUpper.includes('PORTE DOC') ||
    catUpper.includes('RANGEMENT') || nameUpper.includes('CHEMISE') || nameUpper.includes('PORTE DOC') ||
    nameUpper.includes('CLASSEUR')
  ) {
    return 'Rangement & Classement';
  }

  // 4. Matériel artistique
  if (
    catUpper.includes('ARTISTIQUE') || catUpper.includes('GOUACHE') || catUpper.includes('AQUARELLE') ||
    nameUpper.includes('GOUACHE') || nameUpper.includes('AQUARELLE') || nameUpper.includes('PATE') ||
    nameUpper.includes('PEINTURE') || nameUpper.includes('PINCEAU') || nameUpper.includes('PALETTE')
  ) {
    return 'Matériel artistique';
  }

  // 5. Stylos & Crayons
  if (
    catUpper.includes('STYLO') || catUpper.includes('CRAYON') || catUpper.includes('FEUTRE') ||
    nameUpper.includes('STYLO') || nameUpper.includes('CRAYON') || nameUpper.includes('FEUTRE') ||
    nameUpper.includes('CORRECTEUR') || nameUpper.includes('TIPP-EX') || nameUpper.includes('GOMME') ||
    nameUpper.includes('TAILLE CRAYON') || nameUpper.includes('SURBANDE') || nameUpper.includes('SURNEUR')
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

  const allProducts = await ProductModel.find({}).select('_id category name').lean();
  const bulkOps = [];

  for (const prod of allProducts) {
    const targetCat = mapToMainCategory(prod.category, prod.name);
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
    console.log(\`✅ Bulk updated \${bulkOps.length} products into clean main categories!\`);
  } else {
    console.log('✅ All products are already categorized!');
  }

  // Reset CategoryModel
  await CategoryModel.deleteMany({});
  for (const catName of CLEAN_CATEGORIES) {
    await CategoryModel.create({ name: catName, image: '' });
  }

  // Reset PageSettings for categories
  await PageSettingsModel.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', content: CLEAN_CATEGORIES },
    { returnDocument: 'after', upsert: true }
  );

  console.log('✅ Re-created CategoryModel & pageSettings with 6 main categories:', CLEAN_CATEGORIES);

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
        node refactor_categories_fast.js
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
