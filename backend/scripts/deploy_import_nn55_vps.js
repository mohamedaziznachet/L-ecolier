import { Client } from 'ssh2';
import path from 'path';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Executing nn55.xlsx product import on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localExcel = 'C:/Users/DELL/Desktop/nn55.xlsx';
    const remoteExcel = `${remotePath}/backend/nn55.xlsx`;

    const localScript = 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scratch/import_nn55_full.js';
    const remoteScript = `${remotePath}/backend/import_nn55_full.js`;

    console.log('Uploading nn55.xlsx to VPS...');
    sftp.fastPut(localExcel, remoteExcel, (err) => {
      if (err) {
        console.error('Failed to upload nn55.xlsx:', err);
        conn.end();
        return;
      }
      console.log('Uploaded nn55.xlsx! Uploading import script...');

      // Adjust import path for VPS backend root
      const scriptContent = `
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel } from './dist/models/index.js';

const filePath = '${remotePath}/backend/nn55.xlsx';
const workbook = XLSX.readFile(filePath);

function inferBrand(productName, explicitBrand, sheetName) {
  if (explicitBrand && String(explicitBrand).trim()) return String(explicitBrand).trim();
  const nameUpper = (productName || '').toUpperCase();
  const sheetUpper = (sheetName || '').toUpperCase();
  
  if (nameUpper.includes('YAMAMA') || sheetUpper.includes('YAMAMA')) return 'YAMAMA';
  if (nameUpper.includes('BIC') || nameUpper.includes('TIPP-EX') || nameUpper.includes('VELLEDA') || sheetUpper.includes('BIC')) return 'BIC';
  if (nameUpper.includes('LE COQ') || sheetUpper.includes('LECOQ')) return 'LE COQ';
  if (nameUpper.includes('JOVI')) return 'JOVI';
  if (nameUpper.includes('FLAIR')) return 'FLAIR';
  if (nameUpper.includes('PURPLE') || nameUpper.includes('SCHOLA') || sheetUpper.includes('PURPLE')) return 'PURPLE';
  if (nameUpper.includes('ALADIN') || sheetUpper.includes('ALADIN')) return 'ALADIN';
  if (nameUpper.includes('SELECTA') || sheetUpper.includes('SELECTA')) return 'SELECTA';
  if (nameUpper.includes('MAPED') || sheetUpper.includes('MAPED')) return 'Maped';
  return 'Générique';
}

function inferCategory(productName, explicitCategory) {
  if (explicitCategory && String(explicitCategory).trim()) {
    const catTrim = String(explicitCategory).trim();
    if (catTrim.length > 2) return catTrim;
  }
  const nameUpper = (productName || '').toUpperCase();
  if (nameUpper.includes('CAHIER') || nameUpper.includes('BROCHURE') || nameUpper.includes('BLOC NOTE') || nameUpper.includes('AGENDA')) return 'Fournitures scolaires';
  if (nameUpper.includes('STYLO') || nameUpper.includes('CRAYON') || nameUpper.includes('FEUTRE') || nameUpper.includes('PORTE MINE')) return 'Stylos & Crayons';
  if (nameUpper.includes('ARDOISE') || nameUpper.includes('GOUACHE') || nameUpper.includes('AQUARELLE') || nameUpper.includes('PATE')) return 'Matériel artistique';
  if (nameUpper.includes('PORTE DOC') || nameUpper.includes('CHEMISE') || nameUpper.includes('CLASSEUR')) return 'Rangement & Classement';
  if (nameUpper.includes('PRO CAH') || nameUpper.includes('COUVRE LIVRE') || nameUpper.includes('PROTEGE')) return 'Fournitures scolaires';
  return 'Fournitures scolaires';
}

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(\`Connected to MongoDB at \${uri}!\`);

  const maxItem = await ProductModel.findOne().sort({ id: -1 }).lean();
  let nextId = maxItem && maxItem.id ? Number(maxItem.id) + 1 : 2000;
  if (isNaN(nextId) || nextId < 2000) nextId = 2000;

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    for (const row of rows) {
      const rawBarcode = String(row['CODE PRODUIT'] || row['EAN'] || row['CODE'] || row['Barcode'] || '').trim();
      const rawName = String(row['PRODUIT'] || row['DESIGNATION'] || row['LIBELLE'] || row['Nom'] || '').trim();

      if (!rawName) {
        skippedCount++;
        continue;
      }

      const rawCmd = row['QTE'] !== undefined && row['QTE'] !== '' ? row['QTE'] :
                     row['CMD'] !== undefined && row['CMD'] !== '' ? row['CMD'] :
                     row['Cmd'] !== undefined && row['Cmd'] !== '' ? row['Cmd'] : row['Cmd '];
      const stockNum = parseInt(rawCmd) || 0;

      const rawPrice = row['PVP'] || row['Nouv Prix '] || row['PRIX SELECTA'] || row['PRIX'] || row['Prix'] || 0;
      const priceNum = parseFloat(rawPrice) || 0;

      const rawBrand = row['MARQUE '] || row['MARQUE'] || row['REF'];
      const brandName = inferBrand(rawName, rawBrand, sheetName);
      const categoryName = inferCategory(rawName, row['CATEGORIE']);

      // Match condition: barcode if present and valid, else exact name
      let existing = null;
      if (rawBarcode && rawBarcode !== '0' && rawBarcode.length > 2) {
        existing = await ProductModel.findOne({ barcode: rawBarcode });
      }
      if (!existing) {
        existing = await ProductModel.findOne({ name: rawName });
      }

      if (existing) {
        // Update existing product
        existing.stock = stockNum;
        if (rawBarcode && !existing.barcode) existing.barcode = rawBarcode;
        if (priceNum > 0 && (existing.priceNum === 0 || !existing.priceNum)) {
          existing.priceNum = priceNum;
          existing.price = \`\${priceNum.toFixed(3).replace('.', ',')} DT\`;
        }
        await existing.save();
        updatedCount++;
      } else {
        // Create new product
        await ProductModel.create({
          id: nextId++,
          name: rawName,
          barcode: rawBarcode,
          description: \`Produit \${brandName} - Import \${sheetName.trim()}\`,
          price: priceNum > 0 ? \`\${priceNum.toFixed(3).replace('.', ',')} DT\` : '0,000 DT',
          priceNum: priceNum,
          category: categoryName,
          brand: brandName,
          stock: stockNum,
          status: 'inactive',
          img: '',
          images: [],
          discount: 0,
          oldPrice: ''
        });
        createdCount++;
      }
    }
  }

  console.log(\`✅ Import finished from nn55.xlsx! Created: \${createdCount}, Updated: \${updatedCount}, Skipped: \${skippedCount}\`);
  await mongoose.disconnect();
}

run().catch(console.error);
      `;

      const writeStream = sftp.createWriteStream(remoteScript);
      writeStream.on('close', () => {
        console.log('Uploaded import script to VPS. Executing...');
        const cmd = `
          export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
          cd ${remotePath}/backend
          node import_nn55_full.js
        `;
        conn.exec(cmd, (err, stream) => {
          if (err) throw err;
          let output = '';
          stream.on('close', (code) => {
            console.log('Finished VPS import with code:', code);
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
