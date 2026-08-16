import mongoose from 'mongoose';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

let excelPath = 'C:/Users/DELL/Desktop/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';
if (!fs.existsSync(excelPath)) {
  excelPath = path.resolve(process.cwd(), '../LISTE DES PRIX BOMI COLLECTION 2026.xlsx');
}
if (!fs.existsSync(excelPath)) {
  excelPath = '/var/www/L-ecolier/LISTE DES PRIX BOMI COLLECTION 2026.xlsx';
}

const prefixCategoryMap = {
  'SB01': 'Cartable Eco Lux',
  'SB01XL': 'Cartable Eco Lux',
  'SB02': 'Cartable Lux',
  'SB03': 'Cartable Lux',
  'SBL01': 'Cartable super lux',
  'SBL02': 'Cartable super lux',
  'SBL03': 'Cartable super lux',
  'SBH02': 'Cartable high lux',
  'SBH03': 'Cartable high lux',
  'SBJ01': "Jardin d'enfant",
  'TLJ02': "Jardin d'enfant",
  'CL01': 'paniers',
  'CL02': 'paniers',
  'CL03': 'paniers',
  'CLH02': 'paniers',
  'TS01': 'Trousse',
  'TS02': 'Trousse',
  'TS03': 'Trousse',
  'TS04': 'Trousse',
  'TS06': 'Trousse',
  'TLUX01': 'Chariots',
  'SD01': 'Cartable Lux',
  'SD02': 'Cartable Lux',
  'SD03': 'Cartable Lux',
  'SDi01': 'Cartable Lux',
  'SDi02': 'Cartable Lux',
};

const defaultImages = {
  'SB01': '/uploads/image-1784906238198-887553567.jpg',
  'SB02': '/uploads/image-1784923026101-633558139.jpg',
  'SB03': '/uploads/image-1784990721464-616797799.jpg',
  'SBL01': '/uploads/image-1784992633627-737862601.jpg',
  'SBL02': '/uploads/image-1784994908488-754272625.jpg',
  'SBL03': '/uploads/image-1784995548222-601235453.jpg',
  'SBH02': '/uploads/image-1784996300683-378488334.jpg',
  'SBH03': '/uploads/image-1784996839416-974113157.jpg',
  'CL01': '/uploads/image-1785007405351-590014737.png',
  'CL02': '/uploads/image-1785008937972-944703246.png',
  'CL03': '/uploads/image-1785009939818-502498169.png',
  'CLH02': '/uploads/image-1785011639845-142447700.png',
  'TS01': '/uploads/image-1785080909643-380673505.png',
  'TS02': '/uploads/image-1785082738606-712112436.png',
  'TS03': '/uploads/image-1785084462709-396165519.png',
  'TS04': '/uploads/image-1785096062528-182889900.png',
  'TS06': '/uploads/image-1785080909643-380673505.png',
  'TLUX01': '/uploads/image-1785096831358-528655051.jpg',
  'SD01': '/uploads/image-1784923026101-633558139.jpg',
  'SD02': '/uploads/image-1784923026101-633558139.jpg',
  'SD03': '/uploads/image-1784923026101-633558139.jpg',
  'SDi01': '/uploads/image-1784923026101-633558139.jpg',
  'SDi02': '/uploads/image-1784923026101-633558139.jpg',
};

function normalize(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/[\s\-_]/g, '');
}

function getPrefix(ref) {
  if (!ref) return 'SB01';
  const cleanRef = String(ref).trim();
  const parts = cleanRef.split('-');
  return parts[0] || 'SB01';
}

function formatPriceString(priceNum) {
  if (priceNum === null || priceNum === undefined || isNaN(priceNum)) return '0,000 DT';
  return `${priceNum.toFixed(3).replace('.', ',')} DT`;
}

async function syncExcelToDb() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const dbProducts = await productsColl.find({}).toArray();

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`=== Excel Product Sync ===`);
  console.log(`Excel File: ${excelPath}`);
  console.log(`Total Excel Rows: ${rows.length}`);
  console.log(`Total DB Products before sync: ${dbProducts.length}`);

  let updatedCount = 0;
  let createdCount = 0;
  const matchedDbIds = new Set();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const desc = r['Description'] ? String(r['Description']).trim() : '';
    const ref = r['Réf'] ? String(r['Réf']).trim() : '';
    const barcode = r['Code a barre'] ? String(r['Code a barre']).trim() : '';
    const barcode2025 = r['Code a barre(2025)'] ? String(r['Code a barre(2025)']).trim() : '';
    const qteRaw = r['Qté'];
    const prixBarreRaw = r['PRIX BARRE'];
    const remiseRaw = r['REMIE'];
    const prixAfficheRaw = r['PRIX AFFICHE'];

    const normRef = normalize(ref);
    const normDesc = normalize(desc);

    const priceNum = (prixAfficheRaw !== undefined && prixAfficheRaw !== null && !isNaN(Number(prixAfficheRaw)))
      ? Number(prixAfficheRaw) : 0;
    const priceBeforeDiscount = (prixBarreRaw !== undefined && prixBarreRaw !== null && !isNaN(Number(prixBarreRaw)))
      ? Number(prixBarreRaw) : null;

    let discount = 0;
    if (remiseRaw !== undefined && remiseRaw !== null && !isNaN(Number(remiseRaw))) {
      discount = Math.round(Number(remiseRaw) * 100);
    } else if (priceBeforeDiscount && priceBeforeDiscount > priceNum) {
      discount = Math.round(((priceBeforeDiscount - priceNum) / priceBeforeDiscount) * 100);
    }

    const price = formatPriceString(priceNum);
    const oldPrice = priceBeforeDiscount ? formatPriceString(priceBeforeDiscount) : null;
    const badge = discount > 0 ? `-${discount}%` : null;
    const badgeColor = discount > 0 ? '#e53935' : null;

    const stock = (qteRaw !== undefined && qteRaw !== null && !isNaN(Number(qteRaw)) && Number(qteRaw) > 0)
      ? Number(qteRaw) : 20;
    const availability = stock > 0 ? 'En stock' : 'Epuisé';

    const prefix = getPrefix(ref);
    const category = prefixCategoryMap[prefix] || 'Cartable Lux';

    const specifications = [
      desc ? { key: 'Description', value: desc } : null,
      ref ? { key: 'Réf', value: ref } : null,
      barcode ? { key: 'Code à barre', value: barcode } : null,
      barcode2025 ? { key: 'Code à barre (2025)', value: barcode2025 } : null
    ].filter(Boolean);

    // Find matching DB product
    const match = dbProducts.find(p => {
      if (matchedDbIds.has(p._id.toString())) return false;
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
      matchedDbIds.add(match._id.toString());
      updatedCount++;

      const updateData = {
        name: ref || match.name,
        price,
        priceNum,
        priceBeforeDiscount,
        oldPrice,
        discount,
        badge,
        badgeColor,
        stock,
        availability,
        category: match.category || category,
        brand: 'Bomi',
        specifications
      };

      await productsColl.updateOne({ _id: match._id }, { $set: updateData });
    } else {
      createdCount++;
      const newImg = defaultImages[prefix] || '/uploads/image-1784923026101-633558139.jpg';
      const newProduct = {
        id: Date.now() + i,
        name: ref || desc,
        price,
        priceNum,
        priceBeforeDiscount,
        oldPrice,
        discount,
        badge,
        badgeColor,
        schoolLevel: '',
        rating: 5,
        reviews: 0,
        img: newImg,
        images: [newImg],
        category,
        brand: 'Bomi',
        description: desc,
        stock,
        availability,
        featured: false,
        status: 'active',
        specifications,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await productsColl.insertOne(newProduct);
    }
  }

  console.log(`\n================ SYNC RESULT ================`);
  console.log(`Products Updated: ${updatedCount}`);
  console.log(`Products Created: ${createdCount}`);
  console.log(`Total Excel Items Processed: ${rows.length}`);
  console.log(`Total Products in DB Now: ${await productsColl.countDocuments()}`);

  await mongoose.disconnect();
}

syncExcelToDb();
