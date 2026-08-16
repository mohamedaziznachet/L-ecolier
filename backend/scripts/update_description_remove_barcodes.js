import mongoose from 'mongoose';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

let excelPath = 'C:/Users/DELL/Desktop/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';
if (!fs.existsSync(excelPath)) {
  excelPath = path.resolve(process.cwd(), '../LISTE DES PRIX BOMI COLLECTION 2026.xlsx');
}
if (!fs.existsSync(excelPath)) {
  excelPath = '/var/www/L-ecolier/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';
}

function normalize(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/[\s\-_]/g, '');
}

async function updateDescriptionRemoveBarcodes() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const dbProducts = await productsColl.find({}).toArray();

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`=== Updating Descriptions & Removing Barcodes ===`);
  console.log(`Total DB Products: ${dbProducts.length}`);

  let updatedCount = 0;

  for (const p of dbProducts) {
    const normPName = normalize(p.name);

    // Find Excel row
    const r = rows.find(row => {
      const normRef = normalize(row['Réf']);
      const normDesc = normalize(row['Description']);
      return normRef === normPName || normDesc === normPName;
    });

    const descValue = r && r['Description'] ? String(r['Description']).trim() : (p.description || p.name);
    const refValue = r && r['Réf'] ? String(r['Réf']).trim() : p.name;

    // Filter out any barcode specifications
    let filteredSpecs = [];
    if (p.specifications && Array.isArray(p.specifications)) {
      filteredSpecs = p.specifications.filter(s => {
        if (!s || !s.key) return false;
        const keyLower = String(s.key).toLowerCase();
        return !keyLower.includes('barre') && !keyLower.includes('barcode');
      });
    }

    // Ensure Description and Réf are in specifications if needed
    const specMap = new Map();
    filteredSpecs.forEach(s => specMap.set(s.key, s.value));
    specMap.set('Description', descValue);
    specMap.set('Réf', refValue);

    const newSpecs = Array.from(specMap.entries()).map(([key, value]) => ({ key, value }));

    await productsColl.updateOne(
      { _id: p._id },
      {
        $set: {
          description: descValue,
          specifications: newSpecs
        }
      }
    );
    updatedCount++;
  }

  console.log(`✅ Successfully updated ${updatedCount} products locally.`);

  const sample = await productsColl.findOne({ name: 'SB02-NINJA' });
  console.log('\nSample Product (SB02-NINJA):', JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
}

updateDescriptionRemoveBarcodes();
