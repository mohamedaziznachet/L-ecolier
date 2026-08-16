import XLSX from 'xlsx';

const excelPath = 'C:/Users/DELL/Desktop/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';
const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

const prefixes = new Set();
rows.forEach(r => {
  const ref = r['Réf'] ? String(r['Réf']).trim() : '';
  const parts = ref.split('-');
  if (parts.length > 0) {
    prefixes.add(parts[0]);
  }
});

console.log("Excel Prefixes:", Array.from(prefixes));
