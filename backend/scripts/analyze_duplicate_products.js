import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

function hasImage(p) {
  if (p.img && typeof p.img === 'string' && p.img.trim() !== '') return true;
  if (p.images && Array.isArray(p.images) && p.images.length > 0 && p.images.some(img => img && img.trim() !== '')) return true;
  return false;
}

function normalizeName(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/[\s\-_]/g, '');
}

async function analyzeDuplicates() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const products = await productsColl.find({}).toArray();

  console.log(`Total Products in DB: ${products.length}`);

  // Group products by normalized name
  const nameMap = new Map();

  products.forEach(p => {
    const key = normalizeName(p.name);
    if (!key) return;
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key).push(p);
  });

  const duplicateGroups = Array.from(nameMap.entries()).filter(([key, group]) => group.length > 1);

  console.log(`Total Duplicate Groups found: ${duplicateGroups.length}`);

  let toDeleteIds = [];
  let toKeepCount = 0;

  duplicateGroups.forEach(([key, group]) => {
    console.log(`\nGroup "${key}" (${group.length} items):`);
    group.forEach(p => {
      console.log(`  - ID: ${p._id} | id: ${p.id} | name: "${p.name}" | img: "${p.img}" | stock: ${p.stock} | hasImg: ${hasImage(p)}`);
    });

    // Strategy:
    // If some have images and some don't, delete those without images.
    // If all or none have images, keep one (e.g. highest reviews/stock/newest) and mark others for deletion.
    const withImg = group.filter(p => hasImage(p));
    const withoutImg = group.filter(p => !hasImage(p));

    if (withImg.length > 0 && withoutImg.length > 0) {
      withoutImg.forEach(p => toDeleteIds.push(p._id));
      toKeepCount += withImg.length;
    } else if (withoutImg.length === group.length) {
      // All lack images: keep the first one, delete the rest
      const [keep, ...remove] = group;
      remove.forEach(p => toDeleteIds.push(p._id));
      toKeepCount += 1;
    } else {
      // All have images: keep the one with most reviews/stock or newest, delete the rest
      group.sort((a, b) => (b.reviews || 0) - (a.reviews || 0) || (b.stock || 0) - (a.stock || 0));
      const [keep, ...remove] = group;
      remove.forEach(p => toDeleteIds.push(p._id));
      toKeepCount += 1;
    }
  });

  console.log(`\nSummary:`);
  console.log(`- Products to DELETE: ${toDeleteIds.length}`);
  console.log(`- Products after cleanup will be: ${products.length - toDeleteIds.length}`);

  await mongoose.disconnect();
}

analyzeDuplicates();
