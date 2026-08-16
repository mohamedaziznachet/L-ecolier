import mongoose from 'mongoose';
import XLSX from 'xlsx';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";
const excelPath = 'C:/Users/DELL/Desktop/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';

function normalize(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/[\s\-_]/g, '');
}

async function testMatch() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const dbProducts = await productsColl.find({}).toArray();

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  let updatedCount = 0;
  let createdCount = 0;

  const matchedDbIds = new Set();

  rows.forEach((r, idx) => {
    const desc = r['Description'] ? String(r['Description']).trim() : '';
    const ref = r['Réf'] ? String(r['Réf']).trim() : '';
    const barcode = r['Code a barre'] ? String(r['Code a barre']).trim() : '';
    const barcode2025 = r['Code a barre(2025)'] ? String(r['Code a barre(2025)']).trim() : '';

    const normDesc = normalize(desc);
    const normRef = normalize(ref);

    let match = dbProducts.find(p => {
      if (matchedDbIds.has(p._id.toString())) return false;

      const normPName = normalize(p.name);
      
      // Direct name matches
      if (normPName && (normPName === normRef || normPName === normDesc)) return true;

      // Check specifications
      if (p.specifications && Array.isArray(p.specifications)) {
        for (const spec of p.specifications) {
          const specValNorm = normalize(spec.value);
          if (specValNorm && (specValNorm === normRef || specValNorm === normDesc)) return true;
          if (spec.value && barcode && String(spec.value).trim() === barcode) return true;
          if (spec.value && barcode2025 && String(spec.value).trim() === barcode2025) return true;
        }
      }

      return false;
    });

    if (match) {
      matchedDbIds.add(match._id.toString());
      updatedCount++;
      console.log(`[UPDATE] Row ${idx+2}: DB Product "${match.name}" matched Excel Ref: "${ref}" / Desc: "${desc}"`);
    } else {
      createdCount++;
      console.log(`[CREATE] Row ${idx+2}: New Product Ref: "${ref}" | Desc: "${desc}" | Qte: ${r['Qté']} | Price: ${r['PRIX AFFICHE']}`);
    }
  });

  console.log(`\n================ SUMMARY ================`);
  console.log(`Total Excel rows processed: ${rows.length}`);
  console.log(`Matched (to Update): ${updatedCount}`);
  console.log(`Unmatched (to Create): ${createdCount}`);
  console.log(`Total DB products: ${dbProducts.length}`);
  console.log(`DB products not in Excel: ${dbProducts.length - updatedCount}`);

  await mongoose.disconnect();
}

testMatch();
