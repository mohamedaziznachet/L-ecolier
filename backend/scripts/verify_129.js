import mongoose from 'mongoose';
import XLSX from 'xlsx';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";
const excelPath = 'C:/Users/DELL/Desktop/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';

function normalize(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/[\s\-_]/g, '');
}

async function verifyAll129Rows() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const dbProducts = await productsColl.find({}).toArray();

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`=== Processing ${rows.length} rows ===`);

  let matchedCount = 0;
  let newCount = 0;

  rows.forEach((r, idx) => {
    const desc = r['Description'] ? String(r['Description']).trim() : '';
    const ref = r['Réf'] ? String(r['Réf']).trim() : '';
    const barcode = r['Code a barre'] ? String(r['Code a barre']).trim() : '';

    const normRef = normalize(ref);
    const normDesc = normalize(desc);

    const match = dbProducts.find(p => {
      const normPName = normalize(p.name);
      if (normPName && (normPName === normRef || normPName === normDesc)) return true;
      if (p.specifications && Array.isArray(p.specifications)) {
        for (const spec of p.specifications) {
          const specValNorm = normalize(spec.value);
          if (specValNorm && (specValNorm === normRef || specValNorm === normDesc)) return true;
        }
      }
      return false;
    });

    if (match) {
      matchedCount++;
    } else {
      newCount++;
    }
  });

  console.log(`Matched (Update): ${matchedCount}`);
  console.log(`New (Create): ${newCount}`);

  await mongoose.disconnect();
}

verifyAll129Rows();
