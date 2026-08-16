import XLSX from 'xlsx';

const filePath = 'C:/Users/DELL/Desktop/nn55.xlsx';
const workbook = XLSX.readFile(filePath);

let allProducts = [];

function inferBrand(productName, explicitBrand) {
  if (explicitBrand && explicitBrand.trim()) return explicitBrand.trim();
  const nameUpper = (productName || '').toUpperCase();
  if (nameUpper.includes('BIC') || nameUpper.includes('TIPP-EX') || nameUpper.includes('VELLEDA')) return 'BIC';
  if (nameUpper.includes('LE COQ')) return 'LE COQ';
  if (nameUpper.includes('JOVI')) return 'JOVI';
  if (nameUpper.includes('FLAIR')) return 'FLAIR';
  if (nameUpper.includes('PURPLE') || nameUpper.includes('SCHOLA')) return 'PURPLE';
  if (nameUpper.includes('ALADIN')) return 'ALADIN';
  if (nameUpper.includes('SELECTA')) return 'SELECTA';
  if (nameUpper.includes('MAPED')) return 'Maped';
  return 'Générique';
}

function inferCategory(productName) {
  const nameUpper = (productName || '').toUpperCase();
  if (nameUpper.includes('CAHIER') || nameUpper.includes('BROCHURE') || nameUpper.includes('BLOC NOTE')) return 'Fournitures scolaires';
  if (nameUpper.includes('STYLO') || nameUpper.includes('CRAYON') || nameUpper.includes('FEUTRE') || nameUpper.includes('PORTE MINE')) return 'Stylos & Crayons';
  if (nameUpper.includes('ARDOISE') || nameUpper.includes('GOUACHE') || nameUpper.includes('AQUARELLE') || nameUpper.includes('PATE')) return 'Matériel artistique';
  if (nameUpper.includes('PORTE DOC') || nameUpper.includes('CHEMISE') || nameUpper.includes('CLASSEUR')) return 'Rangement & Classement';
  if (nameUpper.includes('PRO CAH') || nameUpper.includes('COUVRE LIVRE') || nameUpper.includes('PROTEGE')) return 'Fournitures scolaires';
  return 'Fournitures scolaires';
}

workbook.SheetNames.forEach((sheetName) => {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  
  rows.forEach((row, idx) => {
    // Find barcode
    const rawBarcode = String(row['CODE PRODUIT'] || row['CODE'] || row['Barcode'] || '').trim();
    
    // Find product name
    const rawName = String(row['PRODUIT'] || row['LIBELLE'] || row['Nom'] || '').trim();
    if (!rawName) return; // skip empty rows
    
    // Find stock CMD
    const rawCmd = row['CMD'] !== undefined && row['CMD'] !== '' ? row['CMD'] : row['Cmd'] !== undefined ? row['Cmd'] : row['Cmd '];
    const stockNum = parseInt(rawCmd) || 0;
    
    // Find price (e.g. Selecta has PRIX SELECTA)
    const rawPrice = row['PRIX SELECTA'] || row['PRIX'] || row['Prix'] || 0;
    const priceNum = parseFloat(rawPrice) || 0;

    // Brand
    const rawBrand = row['MARQUE '] || row['MARQUE'] || row['REF'];
    const brand = inferBrand(rawName, rawBrand);

    // Category
    const category = inferCategory(rawName);

    allProducts.push({
      sheet: sheetName,
      rowIdx: idx + 1,
      barcode: rawBarcode,
      name: rawName,
      stock: stockNum,
      priceNum: priceNum,
      price: priceNum > 0 ? `${priceNum.toFixed(3).replace('.', ',')} DT` : '0,000 DT',
      brand: brand,
      category: category,
    });
  });
});

console.log(`Extracted total ${allProducts.length} product records from nn55.xlsx!`);
console.log('Sample 10 items:');
console.log(JSON.stringify(allProducts.slice(0, 10), null, 2));
