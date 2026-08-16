import mongoose from 'mongoose';
import XLSX from 'xlsx';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";
const excelPath = 'C:/Users/DELL/Desktop/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';

async function analyze() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const dbProducts = await productsColl.find({}).toArray();

  console.log(`Total DB Products: ${dbProducts.length}`);

  // Read Excel
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet); // returns array of objects with header keys

  console.log(`Total Excel Rows: ${rows.length}`);
  console.log("Excel sample row 0:", rows[0]);

  // Analyze matching keys
  const dbNamesMap = new Map();
  dbProducts.forEach(p => {
    dbNamesMap.set(p.name ? p.name.trim().toUpperCase() : '', p);
    if (p.specifications) {
      p.specifications.forEach(s => {
        if (s.key === 'Réf' || s.key === 'ref' || s.key === 'Reference' || s.key === 'Barcode' || s.key === 'Code à barre') {
          dbNamesMap.set(String(s.value).trim().toUpperCase(), p);
        }
      });
    }
  });

  let matchedByRef = 0;
  let matchedByDesc = 0;
  let matchedByName = 0;
  let notMatched = [];

  rows.forEach((r, idx) => {
    const desc = r['Description'] ? String(r['Description']).trim().toUpperCase() : '';
    const ref = r['Réf'] ? String(r['Réf']).trim().toUpperCase() : '';
    const barcode = r['Code a barre'] ? String(r['Code a barre']).trim() : '';

    let match = dbProducts.find(p => {
      const pName = (p.name || '').trim().toUpperCase();
      // compare normalized names (strip dashes, spaces)
      const normPName = pName.replace(/[\s\-_]/g, '');
      const normRef = ref.replace(/[\s\-_]/g, '');
      const normDesc = desc.replace(/[\s\-_]/g, '');
      
      return pName === ref || pName === desc || (normRef && normPName === normRef) || (normDesc && normPName === normDesc);
    });

    if (match) {
      matchedByName++;
    } else {
      notMatched.push({ idx: idx + 2, desc, ref, barcode, qte: r['Qté'], prixAffiche: r['PRIX AFFICHE'] });
    }
  });

  console.log(`Matched: ${matchedByName}`);
  console.log(`Not Matched (New Products): ${notMatched.length}`);
  console.log("Sample Not Matched (first 10):", notMatched.slice(0, 10));

  await mongoose.disconnect();
}

analyze();
