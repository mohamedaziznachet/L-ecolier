import XLSX from 'xlsx';

const excelPath = 'C:/Users/DELL/Desktop/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';
const workbook = XLSX.readFile(excelPath);

console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log('\n========================================');
  console.log('SHEET:', sheetName);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Total rows:', data.length);
  console.log('First 30 rows:');
  data.slice(0, 30).forEach((row, idx) => {
    if (row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
      console.log(`Row ${idx + 1}:`, row);
    }
  });
});
