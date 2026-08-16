import XLSX from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, BrandModel, CategoryModel, PageSettingsModel } from '../dist/models/index.js';

const filePath = 'C:/Users/DELL/Desktop/nn55.xlsx';
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
  if (nameUpper.includes('CAHIER') || nameUpper.includes('BROCHURE') || nameUpper.includes('BLOC NOTE')) return 'Fournitures scolaires';
  if (nameUpper.includes('STYLO') || nameUpper.includes('CRAYON') || nameUpper.includes('FEUTRE') || nameUpper.includes('PORTE MINE')) return 'Stylos & Crayons';
  if (nameUpper.includes('ARDOISE') || nameUpper.includes('GOUACHE') || nameUpper.includes('AQUARELLE') || nameUpper.includes('PATE')) return 'Matériel artistique';
  if (nameUpper.includes('PORTE DOC') || nameUpper.includes('CHEMISE') || nameUpper.includes('CLASSEUR')) return 'Rangement & Classement';
  if (nameUpper.includes('PRO CAH') || nameUpper.includes('COUVRE LIVRE') || nameUpper.includes('PROTEGE')) return 'Fournitures scolaires';
  return 'Fournitures scolaires';
}

const BRAND_MAP = {
  'jovi': 'JOVI',
  'uhu': 'UHU',
  'MAPED': 'Maped',
  'maped': 'Maped',
  'KRISH X7': 'FLAIR',
  'TRIBALL PENSEN': 'FLAIR',
  'PORTE FOLIO': 'Générique',
  'MY-TECH': 'Générique'
};

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  // Step 1: Re-import categories & details from nn55.xlsx
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    for (const row of rows) {
      const rawBarcode = String(row['CODE PRODUIT'] || row['EAN'] || row['CODE'] || row['Barcode'] || '').trim();
      const rawName = String(row['PRODUIT'] || row['DESIGNATION'] || row['LIBELLE'] || row['Nom'] || '').trim();

      if (!rawName) continue;

      const rawCmd = row['QTE'] !== undefined && row['QTE'] !== '' ? row['QTE'] :
                     row['CMD'] !== undefined && row['CMD'] !== '' ? row['CMD'] :
                     row['Cmd'] !== undefined && row['Cmd'] !== '' ? row['Cmd'] : row['Cmd '];
      const stockNum = parseInt(rawCmd) || 0;

      const rawPrice = row['PVP'] || row['Nouv Prix '] || row['PRIX SELECTA'] || row['PRIX'] || row['Prix'] || 0;
      const priceNum = parseFloat(rawPrice) || 0;

      const rawBrand = row['MARQUE '] || row['MARQUE'] || row['REF'];
      const brandName = inferBrand(rawName, rawBrand, sheetName);
      const categoryName = inferCategory(rawName, row['CATEGORIE']);

      let existing = null;
      if (rawBarcode && rawBarcode !== '0' && rawBarcode.length > 2) {
        existing = await ProductModel.findOne({ barcode: rawBarcode });
      }
      if (!existing) {
        existing = await ProductModel.findOne({ name: rawName });
      }

      if (existing) {
        existing.category = categoryName;
        existing.brand = brandName;
        existing.stock = stockNum;
        if (priceNum > 0 && (existing.priceNum === 0 || !existing.priceNum)) {
          existing.priceNum = priceNum;
          existing.price = `${priceNum.toFixed(3).replace('.', ',')} DT`;
        }
        await existing.save();
      }
    }
  }
  console.log('✅ Re-imported products from nn55.xlsx!');

  // Step 2: Normalize brand casing
  for (const [oldB, newB] of Object.entries(BRAND_MAP)) {
    await ProductModel.updateMany({ brand: oldB }, { $set: { brand: newB } });
  }

  // Step 3: Sync BrandModel
  await BrandModel.deleteMany({});
  const distinctBrands = (await ProductModel.distinct('brand')).filter(Boolean).map(b => b.trim());
  const sortedBrands = Array.from(new Set(distinctBrands)).sort();

  for (const bName of sortedBrands) {
    await BrandModel.create({
      name: bName,
      logo: '',
      description: `Marque ${bName}`
    });
  }

  // Step 4: Sync CategoryModel & PageSettings with exact categories
  await CategoryModel.deleteMany({});
  const distinctCats = (await ProductModel.distinct('category')).filter(Boolean).map(c => c.trim());
  const sortedCats = Array.from(new Set(distinctCats)).sort();

  for (const cName of sortedCats) {
    await CategoryModel.create({
      name: cName,
      image: ''
    });
  }

  await PageSettingsModel.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', content: sortedCats },
    { returnDocument: 'after', upsert: true }
  );

  console.log(`✅ Restored step "update marques and categories"! Brands: ${sortedBrands.length}, Categories: ${sortedCats.length}`);
  await mongoose.disconnect();
}

run().catch(console.error);
