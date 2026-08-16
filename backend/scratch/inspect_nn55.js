import XLSX from 'xlsx';

const filePath = 'C:/Users/DELL/Desktop/nn55.xlsx';
const workbook = XLSX.readFile(filePath);

console.log('Sheet Names:', workbook.SheetNames);

workbook.SheetNames.forEach((sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`\n--- Sheet: ${sheetName} (${rows.length} rows) ---`);
  if (rows.length > 0) {
    console.log('First 5 rows headers/sample:');
    console.log(Object.keys(rows[0]));
    console.log(JSON.stringify(rows.slice(0, 5), null, 2));
  }
});
