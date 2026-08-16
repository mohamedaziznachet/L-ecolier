import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let excelPath = 'C:/Users/DELL/Desktop/MAPED site web.xlsx';
if (!fs.existsSync(excelPath)) {
  excelPath = path.resolve(process.cwd(), '../MAPED site web.xlsx');
}
if (!fs.existsSync(excelPath)) {
  excelPath = '/var/www/L-ecolier/MAPED site web.xlsx';
}

function generateDescription(name, famille) {
  const famUpper = (famille || '').toUpperCase();
  const nameUpper = (name || '').toUpperCase();

  if (famUpper.includes('GOMME')) return `Gomme Maped haute qualité pour un effaçage propre et sans traces. ${name}`;
  if (famUpper.includes('TAILLE')) return `Taille-crayon Maped ergonomique et résistant pour crayons scolaires et de dessin. ${name}`;
  if (famUpper.includes('FEUTRE')) return `Feutres de coloriage Maped aux couleurs vives et encre lavable. ${name}`;
  if (famUpper.includes('COULEUR') || nameUpper.includes('CRAYON DE COULEUR')) return `Crayons de couleur Maped offrant des mines solides et des teintes éclatantes. ${name}`;
  if (famUpper.includes('CRAYON')) return `Crayon graphite Maped de haute précision idéal pour l'écriture et le dessin. ${name}`;
  if (famUpper.includes('TRACAGE') || famUpper.includes('REGLE')) return `Instrument de traçage Maped précis et incassable pour l'école et le bureau. ${name}`;
  if (famUpper.includes('CISEAUX')) return `Ciseaux Maped avec lames en acier inoxydable et poignées confortables. ${name}`;
  if (famUpper.includes('STYLO')) return `Stylo à bille Maped offrant une écriture fluide et confortable au quotidien. ${name}`;
  if (famUpper.includes('AGRAFE')) return `Agrafeuse et fournitures d'agrafage Maped robustes pour le bureau. ${name}`;
  if (famUpper.includes('BUREAUTIQUE')) return `Fourniture de bureau Maped essentielle, pratique et durable. ${name}`;
  if (famUpper.includes('COLLE')) return `Bâton de colle Maped propre et fort pouvoir adhésif pour papier et carton. ${name}`;
  if (famUpper.includes('MINES')) return `Mines graphite Maped haute résistance pour porte-mines. ${name}`;

  return `Fourniture scolaire et de bureau originale de la marque Maped. ${name}`;
}

function mapFamilleToCategory(famille, name) {
  const text = `${famille} ${name}`.toUpperCase();
  if (text.includes('STYLO') || text.includes('CRAYON NOIR') || text.includes('GOMME') || text.includes('TAILLE CRAYON') || text.includes('MINES')) {
    return 'Stylos & Écriture';
  }
  if (text.includes('FEUTRE') || text.includes('CRAYON COULEUR') || text.includes('PEINTURE') || text.includes('GOUACHE') || text.includes('AQUARELLE') || text.includes('ARTISTIQUE')) {
    return 'Matériel Artistique & Dessin';
  }
  return 'Fournitures scolaires';
}

async function run() {
  console.log(`Loading Excel file from: ${excelPath}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);

  const sheet = workbook.getWorksheet(1);
  console.log(`Sheet: ${sheet.name}, Total Rows: ${sheet.rowCount}`);

  const normalItems = [];
  const greenItems = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 4) return;

    const codeProduit = String(row.getCell(1).value || '').trim();
    const famille = String(row.getCell(2).value || '').trim();
    const produitName = String(row.getCell(3).value || '').trim();
    const invNbo = String(row.getCell(4).value || '').trim();

    let rawPrix = row.getCell(5).value;
    if (typeof rawPrix === 'object' && rawPrix !== null) {
      rawPrix = rawPrix.result || rawPrix.value || 0;
    }
    const prixNum = parseFloat(rawPrix) || 0;

    if (!codeProduit && !produitName) return;

    let isGreen = false;
    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c);
      if (cell.fill && cell.fill.type === 'pattern') {
        const fg = cell.fill.fgColor;
        const bg = cell.fill.bgColor;
        const colorHex = (fg?.argb || bg?.argb || '').toUpperCase();

        if (fg?.theme === 9 || fg?.theme === 5 || bg?.theme === 9) {
          isGreen = true;
        }
        if (colorHex) {
          const cleanHex = colorHex.replace(/^FF/, '');
          if (['92D050', '00FF00', 'C6EFCE', '00B050', 'E2EFDA', 'A9D08E', '548235', '375623', '70AD47', 'C6D9F1'].some(g => cleanHex.includes(g))) {
            isGreen = true;
          }
          if (cleanHex.length === 6) {
            const rVal = parseInt(cleanHex.substring(0, 2), 16);
            const gVal = parseInt(cleanHex.substring(2, 4), 16);
            const bVal = parseInt(cleanHex.substring(4, 6), 16);
            if (gVal > 150 && gVal > rVal + 30 && gVal > bVal + 30) {
              isGreen = true;
            }
          }
        }
      }
    }

    const item = {
      barcode: codeProduit,
      famille,
      name: produitName,
      invNbo,
      priceNum: prixNum,
      price: `${prixNum.toFixed(3).replace('.', ',')} DT`,
      category: mapFamilleToCategory(famille, produitName),
      description: generateDescription(produitName, famille),
      brand: 'Maped'
    };

    if (isGreen) {
      greenItems.push(item);
    } else {
      normalItems.push(item);
    }
  });

  console.log(`Parsed Excel Items:`);
  console.log(`  • Normal Products to Insert/Update: ${normalItems.length}`);
  console.log(`  • Green Products to EXCLUDE & REMOVE: ${greenItems.length}`);

  // Connect to MongoDB
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  const { ProductModel, CategoryModel, PageSettingsModel } = await import('../dist/models/index.js');

  // STEP 1: DELETE Green Products if they exist in MongoDB
  let deletedCount = 0;
  for (const green of greenItems) {
    const filter = [];
    if (green.barcode && green.barcode !== '0') {
      filter.push({ barcode: green.barcode });
    }
    if (green.name) {
      filter.push({ name: { $regex: new RegExp(`^${green.name.replace(/[*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    }

    if (filter.length > 0) {
      const res = await ProductModel.deleteMany({ $or: filter });
      deletedCount += res.deletedCount;
    }
  }
  console.log(`🗑️ Deleted ${deletedCount} green-highlighted products from MongoDB.`);

  // STEP 2: UPDATE existing or CREATE new Normal Products
  let updatedCount = 0;
  let createdCount = 0;

  for (const item of normalItems) {
    if (!item.name && !item.barcode) continue;

    let existing = null;
    if (item.barcode && item.barcode !== '0') {
      existing = await ProductModel.findOne({ barcode: item.barcode });
    }
    if (!existing && item.name) {
      existing = await ProductModel.findOne({ name: { $regex: new RegExp(`^${item.name.replace(/[*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    }

    if (existing) {
      // Update
      const updateData = {
        name: item.name,
        price: item.price,
        priceNum: item.priceNum,
        category: item.category,
        description: item.description,
        brand: 'Maped',
        isActive: true
      };
      if (item.barcode) updateData.barcode = item.barcode;
      await ProductModel.updateOne({ _id: existing._id }, { $set: updateData });
      updatedCount++;
    } else {
      // Create new
      await ProductModel.create({
        name: item.name,
        barcode: item.barcode || '',
        price: item.price,
        priceNum: item.priceNum,
        category: item.category,
        description: item.description,
        brand: 'Maped',
        stock: 20,
        isActive: true,
        img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400', // Crisp stationary image
        images: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400']
      });
      createdCount++;
    }
  }

  console.log(`✅ MAPED Products Sync Completed:`);
  console.log(`   • Updated: ${updatedCount}`);
  console.log(`   • Created: ${createdCount}`);
  console.log(`   • Removed (Green items): ${deletedCount}`);

  // Re-sync CategoryModel and PageSettings categories list
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
  console.log(`✅ Categories list synced (${distinctCats.length} total categories).`);

  await mongoose.disconnect();
}

run().catch(console.error);
