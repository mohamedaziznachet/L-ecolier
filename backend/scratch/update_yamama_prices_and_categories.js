import XLSX from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, CategoryModel, PageSettingsModel } from '../dist/models/index.js';

const filePath = 'C:/Users/DELL/Desktop/yamama prix caisse.xls';
const workbook = XLSX.readFile(filePath);

function mapCategory(oldCat, prodName = '', prodDesc = '') {
  const catUpper = (oldCat || '').toUpperCase();
  const nameUpper = (prodName || '').toUpperCase();
  const descUpper = (prodDesc || '').toUpperCase();
  const fullText = `${catUpper} ${nameUpper} ${descUpper}`;

  // 1. Developed Bag Categories
  if (fullText.includes('SB02') || fullText.includes('ECO LUX')) return 'Cartable Eco Lux';
  if (fullText.includes('SB03') || fullText.includes('HIGH LUX')) return 'Cartable high lux';
  if (fullText.includes('SB04') || fullText.includes('SUPER LUX')) return 'Cartable super lux';
  if (fullText.includes('SB01') || fullText.includes('CARTABLE LUX') || fullText.includes('LUX')) return 'Cartable Lux';
  if (fullText.includes('CH0') || fullText.includes('CHARIOT')) return 'Chariots';
  if (fullText.includes('TR0') || fullText.includes('TROUSSE')) return 'Trousse';
  if (fullText.includes('JE0') || fullText.includes('JARDIN')) return "Jardin d'enfant";
  if (fullText.includes('PX0') || fullText.includes('PANIER')) return 'paniers';
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
  console.log(`Connected to MongoDB at ${uri}!`);

  // --- PART 1: Update Yamama Product Prices from yamama prix caisse.xls ---
  let updatedPricesCount = 0;
  const priceMap = new Map();

  // Sheet 1: SUIVI YAMAMA
  if (workbook.Sheets['SUIVI YAMAMA']) {
    const rows1 = XLSX.utils.sheet_to_json(workbook.Sheets['SUIVI YAMAMA'], { defval: '' });
    rows1.forEach(row => {
      const ean = String(row['EAN'] || row['CODE PRODUIT'] || '').trim();
      const pvp = parseFloat(row['PVP'] || row['Prix']);
      const name = String(row['DESIGNATION'] || row['PRODUIT'] || '').trim();
      if (pvp > 0) {
        if (ean && ean !== '0') priceMap.set(ean, { priceNum: pvp, name });
        if (name) priceMap.set(`NAME:${name.toLowerCase()}`, { priceNum: pvp, name });
      }
    });
  }

  // Sheet 2: Feuil1
  if (workbook.Sheets['Feuil1']) {
    const rows2 = XLSX.utils.sheet_to_json(workbook.Sheets['Feuil1'], { defval: '' });
    rows2.forEach(row => {
      const ean = String(row['__EMPTY'] || '').trim();
      const pvp = parseFloat(row['__EMPTY_1']);
      const name = String(row['YAMAMA 25   '] || '').trim();
      if (pvp > 0 && ean !== 'CODE PRODUIT') {
        if (ean && ean !== '0') priceMap.set(ean, { priceNum: pvp, name });
        if (name) priceMap.set(`NAME:${name.toLowerCase()}`, { priceNum: pvp, name });
      }
    });
  }

  console.log(`Loaded ${priceMap.size} price entries from Yamama Excel.`);

  const bulkOps = [];
  const allProducts = await ProductModel.find({}).select('_id barcode name category description priceNum').lean();

  for (const prod of allProducts) {
    let newPriceNum = null;

    if (prod.barcode && priceMap.has(prod.barcode)) {
      newPriceNum = priceMap.get(prod.barcode).priceNum;
    }
    if (!newPriceNum && prod.name && priceMap.has(`NAME:${prod.name.toLowerCase()}`)) {
      newPriceNum = priceMap.get(`NAME:${prod.name.toLowerCase()}`).priceNum;
    }

    const setObj = {};

    if (newPriceNum && newPriceNum > 0 && prod.priceNum !== newPriceNum) {
      setObj.priceNum = newPriceNum;
      setObj.price = `${newPriceNum.toFixed(3).replace('.', ',')} DT`;
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
    console.log(`✅ Bulk updated ${bulkOps.length} products (Prices updated: ${updatedPricesCount})!`);
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

  console.log(`✅ Re-created CategoryModel & pageSettings with ${distinctCats.length} categories:`);
  for (const cat of distinctCats) {
    const count = await ProductModel.countDocuments({ category: cat });
    console.log(`  - ${cat}: ${count} products`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
