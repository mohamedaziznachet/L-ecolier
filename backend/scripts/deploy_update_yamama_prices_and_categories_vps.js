import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Uploading yamama prix caisse.xls & updating prices and categories on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localExcel = 'C:/Users/DELL/Desktop/yamama prix caisse.xls';
    const remoteExcel = `${remotePath}/backend/yamama_prix_caisse.xls`;
    const remoteScript = `${remotePath}/backend/update_yamama_prices_and_categories.js`;

    console.log('Uploading Excel file...');
    sftp.fastPut(localExcel, remoteExcel, (err) => {
      if (err) {
        console.error('Failed to upload Excel file:', err);
        conn.end();
        return;
      }
      console.log('Uploaded Excel file! Uploading script...');

      const scriptContent = `
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, CategoryModel, PageSettingsModel } from './dist/models/index.js';

const filePath = '${remotePath}/backend/yamama_prix_caisse.xls';
const workbook = XLSX.readFile(filePath);

function mapCategory(oldCat, prodName = '', prodDesc = '') {
  const catUpper = (oldCat || '').toUpperCase();
  const nameUpper = (prodName || '').toUpperCase();
  const descUpper = (prodDesc || '').toUpperCase();
  const fullText = \`\${catUpper} \${nameUpper} \${descUpper}\`;

  // 1. Developed Bag Categories
  if (fullText.includes('SDI0') || fullText.includes('INFORMATIQUE') || fullText.includes('LAPTOP')) return 'Sac A Dos Informatique';
  if (fullText.includes('SD0') || fullText.includes('TAKE AND GO') || fullText.includes('TAKE & GO')) return 'Take And Go';
  if (fullText.includes('SB02') || fullText.includes('ECO LUX')) return 'Cartable Eco Lux';
  if (fullText.includes('SB03') || fullText.includes('HIGH LUX')) return 'Cartable high lux';
  if (fullText.includes('SB04') || fullText.includes('SUPER LUX')) return 'Cartable super lux';
  if (fullText.includes('SB01') || fullText.includes('CARTABLE LUX') || fullText.includes('LUX')) return 'Cartable Lux';
  if (fullText.includes('CH0') || fullText.includes('CHARIOT')) return 'Chariots';
  if (fullText.includes('TR0') || fullText.includes('TS0') || fullText.includes('TROUSSE')) return 'Trousse';
  if (fullText.includes('JE0') || fullText.includes('SBJ') || fullText.includes('TLJ') || fullText.includes('JARDIN')) return "Jardin d'enfant";
  if (fullText.includes('PX0') || fullText.includes('CL0') || fullText.includes('PANIER')) return 'paniers';
  if (fullText.includes('CARTABLE') || fullText.includes('SAC A DOS') || fullText.includes('BOMI 2026')) return 'Cartables & Sacs à dos';

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
    fullText.includes('RANGEMENT') || fullText.includes('PORTE BLOC')
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

  // 6. Default: Fournitures scolaires
  return 'Fournitures scolaires';
}

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(\`Connected to MongoDB at \${uri}!\`);

  // --- PART 1: Update Yamama Product Prices from yamama prix caisse.xls ---
  let updatedPricesCount = 0;
  const priceMap = new Map();

  if (workbook.Sheets['SUIVI YAMAMA']) {
    const rows1 = XLSX.utils.sheet_to_json(workbook.Sheets['SUIVI YAMAMA'], { defval: '' });
    rows1.forEach(row => {
      const ean = String(row['EAN'] || row['CODE PRODUIT'] || '').trim();
      const pvp = parseFloat(row['PVP'] || row['Prix']);
      const name = String(row['DESIGNATION'] || row['PRODUIT'] || '').trim();
      if (pvp > 0) {
        if (ean && ean !== '0') priceMap.set(ean, { priceNum: pvp, name });
        if (name) priceMap.set(\`NAME:\${name.toLowerCase()}\`, { priceNum: pvp, name });
      }
    });
  }

  if (workbook.Sheets['Feuil1']) {
    const rows2 = XLSX.utils.sheet_to_json(workbook.Sheets['Feuil1'], { defval: '' });
    rows2.forEach(row => {
      const ean = String(row['__EMPTY'] || '').trim();
      const pvp = parseFloat(row['__EMPTY_1']);
      const name = String(row['YAMAMA 25   '] || '').trim();
      if (pvp > 0 && ean !== 'CODE PRODUIT') {
        if (ean && ean !== '0') priceMap.set(ean, { priceNum: pvp, name });
        if (name) priceMap.set(\`NAME:\${name.toLowerCase()}\`, { priceNum: pvp, name });
      }
    });
  }

  console.log(\`Loaded \${priceMap.size} price entries from Yamama Excel.\`);

  const bulkOps = [];
  const allProducts = await ProductModel.find({}).select('_id barcode name category description priceNum').lean();

  for (const prod of allProducts) {
    let newPriceNum = null;

    if (prod.barcode && priceMap.has(prod.barcode)) {
      newPriceNum = priceMap.get(prod.barcode).priceNum;
    }
    if (!newPriceNum && prod.name && priceMap.has(\`NAME:\${prod.name.toLowerCase()}\`)) {
      newPriceNum = priceMap.get(\`NAME:\${prod.name.toLowerCase()}\`).priceNum;
    }

    const setObj = {};

    if (newPriceNum && newPriceNum > 0 && prod.priceNum !== newPriceNum) {
      setObj.priceNum = newPriceNum;
      setObj.price = \`\${newPriceNum.toFixed(3).replace('.', ',')} DT\`;
      updatedPricesCount++;
    }

    const targetCat = mapCategory(prod.category, prod.name, prod.description);
    if (prod.category !== targetCat) {
      setObj.category = targetCat;
    }

    if (Object.keys(setObj).length > 0) {
      bulkOps.push({
        updateOne: {
          filter: { _id: prod._id },
          update: { $set: setObj }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await ProductModel.bulkWrite(bulkOps);
    console.log(\`✅ Bulk updated \${bulkOps.length} products (Prices updated: \${updatedPricesCount})!\`);
  } else {
    console.log('✅ All products are already up to date!');
  }

  // Sync CategoryModel & PageSettings
  const distinctCats = (await ProductModel.distinct('category')).filter(Boolean).map(c => c.trim()).sort();

  await CategoryModel.deleteMany({});
  for (const catName of distinctCats) {
    await CategoryModel.create({ name: catName, image: '' });
  }

  await PageSettingsModel.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', content: distinctCats },
    { returnDocument: 'after', upsert: true }
  );

  console.log(\`✅ Re-created CategoryModel & pageSettings with \${distinctCats.length} categories!\`);
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
          node update_yamama_prices_and_categories.js
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
  });
}).on('error', (err) => {
  console.error('Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
