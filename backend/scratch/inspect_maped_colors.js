import ExcelJS from 'exceljs';

async function run() {
  const excelPath = 'C:/Users/DELL/Desktop/MAPED site web.xlsx';
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);

  const sheet = workbook.getWorksheet(1);
  console.log(`Sheet Name: ${sheet.name}, Total Rows: ${sheet.rowCount}`);

  let greenCount = 0;
  let normalCount = 0;
  let totalValidRows = 0;

  const rows = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 4) {
      console.log(`Header Row ${rowNumber}:`, row.values);
      return;
    }

    const codeProduit = row.getCell(1).text?.trim() || String(row.getCell(1).value || '').trim();
    const famille = row.getCell(2).text?.trim() || String(row.getCell(2).value || '').trim();
    const produitName = row.getCell(3).text?.trim() || String(row.getCell(3).value || '').trim();
    const invNbo = row.getCell(4).text?.trim() || String(row.getCell(4).value || '').trim();
    const prixStr = row.getCell(5).text?.trim() || String(row.getCell(5).value || '').trim();
    const prix = row.getCell(5).value;

    if (!codeProduit && !produitName) return;
    totalValidRows++;

    // Check row/cell fill color for green
    let isGreen = false;
    let fillColorDetails = '';

    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c);
      if (cell.fill) {
        const fillStr = JSON.stringify(cell.fill);
        fillColorDetails += ` [C${c}:${fillStr}]`;

        // Check for green color in fgColor/bgColor (e.g., argb starting with FF... or green theme/index)
        if (cell.fill.type === 'pattern') {
          const fg = cell.fill.fgColor;
          const bg = cell.fill.bgColor;
          const colorHex = (fg?.argb || bg?.argb || '').toUpperCase();

          // Green hex colors often have high green channel (RGB: R < 0xAA, G > 0xAA)
          // Common Excel greens: 92D050, 00FF00, C6EFCE, 00B050, E2EFDA, A9D08E, 548235, 375623, 70AD47
          if (colorHex) {
            // If ARGB format AARRGGBB
            const cleanHex = colorHex.replace(/^FF/, '');
            if (['92D050', '00FF00', 'C6EFCE', '00B050', 'E2EFDA', 'A9D08E', '548235', '375623', '70AD47', 'C6D9F1'].some(g => cleanHex.includes(g))) {
              isGreen = true;
            }
            // Check RGB values directly if ARGB
            if (cleanHex.length === 6) {
              const rVal = parseInt(cleanHex.substring(0, 2), 16);
              const gVal = parseInt(cleanHex.substring(2, 4), 16);
              const bVal = parseInt(cleanHex.substring(4, 6), 16);
              if (gVal > 150 && gVal > rVal + 30 && gVal > bVal + 30) {
                isGreen = true;
              }
            }
          }
          if (fg?.theme === 9 || fg?.theme === 5 || bg?.theme === 9) { // theme colors for green
            isGreen = true;
          }
        }
      }
    }

    if (isGreen) greenCount++;
    else normalCount++;

    rows.push({
      rowNumber,
      codeProduit,
      famille,
      produitName,
      invNbo,
      prix,
      isGreen,
      fillColorDetails
    });
  });

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total Product Rows Processed: ${totalValidRows}`);
  console.log(`Normal Rows (to insert/update): ${normalCount}`);
  console.log(`Green Rows (to EXCLUDE and DELETE from DB): ${greenCount}`);

  console.log(`\nSample Green Rows (First 5):`);
  console.log(rows.filter(r => r.isGreen).slice(0, 5));

  console.log(`\nSample Normal Rows (First 5):`);
  console.log(rows.filter(r => !r.isGreen).slice(0, 5));
}

run().catch(console.error);
