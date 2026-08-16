import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

function hasImage(p) {
  if (p.img && typeof p.img === 'string' && p.img.trim() !== '') return true;
  if (p.images && Array.isArray(p.images) && p.images.length > 0 && p.images.some(img => img && typeof img === 'string' && img.trim() !== '')) return true;
  return false;
}

function normalize(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase().replace(/[\s\-_]/g, '');
}

async function cleanupDuplicates(isDryRun = false) {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const products = await productsColl.find({}).toArray();

  console.log(`=== Product Cleanup (DryRun: ${isDryRun}) ===`);
  console.log(`Total Products before cleanup: ${products.length}`);

  const productsWithoutImg = products.filter(p => !hasImage(p));
  console.log(`Products without valid images: ${productsWithoutImg.length}`);

  // Group products by normalized name and normalized ref/description from specs
  const keyToProducts = new Map();

  products.forEach(p => {
    const keys = new Set();
    if (p.name) keys.add(normalize(p.name));
    if (p.specifications && Array.isArray(p.specifications)) {
      p.specifications.forEach(s => {
        if (s.value) keys.add(normalize(s.value));
      });
    }

    keys.forEach(k => {
      if (!k) return;
      if (!keyToProducts.has(k)) keyToProducts.set(k, new Map());
      keyToProducts.get(k).set(p._id.toString(), p);
    });
  });

  const idsToDelete = new Set();
  const processedGroups = new Set();

  keyToProducts.forEach((productMap, key) => {
    const group = Array.from(productMap.values());
    if (group.length <= 1) return;

    // Create a group signature to avoid duplicate processing
    const groupSig = group.map(p => p._id.toString()).sort().join(',');
    if (processedGroups.has(groupSig)) return;
    processedGroups.add(groupSig);

    console.log(`\nDuplicate Group found for "${key}" (${group.length} items):`);
    group.forEach(p => {
      console.log(`  - [_id: ${p._id}] Name: "${p.name}" | Img: "${p.img}" | Stock: ${p.stock} | HasImg: ${hasImage(p)}`);
    });

    const withImg = group.filter(p => hasImage(p));
    const withoutImg = group.filter(p => !hasImage(p));

    if (withImg.length > 0 && withoutImg.length > 0) {
      // Delete all without images in this group
      withoutImg.forEach(p => idsToDelete.add(p._id.toString()));
      console.log(`  => Deleting ${withoutImg.length} item(s) without image from this group.`);
      
      // If there are still multiple items with images, keep the best one
      if (withImg.length > 1) {
        withImg.sort((a, b) => (b.reviews || 0) - (a.reviews || 0) || (b.stock || 0) - (a.stock || 0));
        for (let i = 1; i < withImg.length; i++) {
          idsToDelete.add(withImg[i]._id.toString());
          console.log(`  => Deleting extra duplicate with image [_id: ${withImg[i]._id}]`);
        }
      }
    } else if (withoutImg.length === group.length) {
      // None have images: keep the first one, delete the rest
      for (let i = 1; i < group.length; i++) {
        idsToDelete.add(group[i]._id.toString());
        console.log(`  => Deleting duplicate [_id: ${group[i]._id}] (none have images)`);
      }
    } else {
      // All have images: keep the one with highest reviews/stock, delete rest
      group.sort((a, b) => (b.reviews || 0) - (a.reviews || 0) || (b.stock || 0) - (a.stock || 0));
      for (let i = 1; i < group.length; i++) {
        idsToDelete.add(group[i]._id.toString());
        console.log(`  => Deleting duplicate [_id: ${group[i]._id}] (keeping best image item)`);
      }
    }
  });

  // Also find standalone products without images that are redundant
  // (If user wants to clean standalone imageless items or just duplicates without images)
  console.log(`\n================ CLEANUP SUMMARY ================`);
  console.log(`Total items marked for deletion: ${idsToDelete.size}`);
  console.log(`Total remaining products will be: ${products.length - idsToDelete.size}`);

  if (!isDryRun && idsToDelete.size > 0) {
    const rawIds = Array.from(idsToDelete);
    const queryIds = [];
    rawIds.forEach(id => {
      queryIds.push(id);
      if (mongoose.Types.ObjectId.isValid(id)) {
        try {
          queryIds.push(new mongoose.Types.ObjectId(id));
        } catch (e) {}
      }
    });
    const deleteResult = await productsColl.deleteMany({ _id: { $in: queryIds } });
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} redundant/imageless products!`);
  }

  await mongoose.disconnect();
}

const isDryRunArg = process.argv.includes('--dry-run');
cleanupDuplicates(isDryRunArg);
