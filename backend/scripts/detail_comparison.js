import mongoose from 'mongoose';
import XLSX from 'xlsx';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";
const excelPath = 'C:/Users/DELL/Desktop/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';

async function detail() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const dbProducts = await productsColl.find({}).toArray();

  console.log("=== DB PRODUCTS LIST (Name | Category | Stock | Price | Id) ===");
  dbProducts.forEach(p => {
    console.log(`- [${p.id}] "${p.name}" | Cat: "${p.category}" | Brand: "${p.brand}" | Stock: ${p.stock} | Price: ${p.priceNum} | Avail: ${p.availability}`);
  });

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log("\n=== EXCEL ROWS LIST (Description | Réf | Barcode | Qté | PrixBarre | Remise | PrixAffiche) ===");
  rows.forEach((r, idx) => {
    console.log(`[Row ${idx+2}] Desc: "${r['Description']}" | Ref: "${r['Réf']}" | Barcode: "${r['Code a barre']}" | Barcode2025: "${r['Code a barre(2025)']}" | Qte: ${r['Qté']} | PrixBarre: ${r['PRIX BARRE']} | Remise: ${r['REMIE']} | PrixAffiche: ${r['PRIX AFFICHE']}`);
  });

  await mongoose.disconnect();
}

detail();
