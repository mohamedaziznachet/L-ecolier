import XLSX from 'xlsx';

const filePath = 'C:/Users/DELL/Desktop/nn55.xlsx';
const workbook = XLSX.readFile(filePath);

workbook.SheetNames.forEach((sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  let emptyCount = 0;
  let nonZeroRows = [];

  rows.forEach((row, i) => {
    const rawName = String(row['PRODUIT'] || row['LIBELLE'] || row['Nom'] || '').trim();
    if (!rawName) {
      emptyCount++;
      // Print first 2 skipped rows per sheet to see what headers/columns they have
      if (emptyCount <= 2) {
        console.log(`[Sheet ${sheetName} Row ${i+1}] Skipped sample keys:`, Object.keys(row).filter(k => row[k] !== ''));
        console.log(`[Sheet ${sheetName} Row ${i+1}] Values:`, row);
      }
    } else {
      nonZeroRows.push(rawName);
    }
  });

  console.log(`Sheet "${sheetName}": Total rows = ${rows.length}, Valid products = ${nonZeroRows.length}, Empty/Skipped = ${emptyCount}`);
});
