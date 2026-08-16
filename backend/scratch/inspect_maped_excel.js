import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const excelPath = 'C:/Users/DELL/Desktop/MAPED site web.xlsx';
console.log('Inspecting:', excelPath);

const workbook = XLSX.readFile(excelPath, { cellStyles: true, cellFormulas: true });
console.log('Sheet Names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
console.log(`Range: ${sheet['!ref']} (${range.e.r + 1} rows)`);

// Let's inspect first 10 rows and check cell properties (v, w, s, fgColor, bgColor, etc.)
for (let r = 0; r <= Math.min(25, range.e.r); r++) {
  const rowData = [];
  let rowStyle = '';
  for (let c = 0; c <= range.e.c; c++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[cellAddress];
    if (cell) {
      rowData.push(cell.v);
      if (cell.s && cell.s.fgColor) {
        rowStyle += ` [C${c}:${JSON.stringify(cell.s.fgColor)}]`;
      }
      if (cell.s && cell.s.bgColor) {
        rowStyle += ` [C${c}bg:${JSON.stringify(cell.s.bgColor)}]`;
      }
      if (cell.s && cell.s.fill) {
        rowStyle += ` [C${c}fill:${JSON.stringify(cell.s.fill)}]`;
      }
    } else {
      rowData.push('');
    }
  }
  console.log(`Row ${r + 1}:`, rowData.join(' | '), rowStyle ? `Styles: ${rowStyle}` : '');
}
