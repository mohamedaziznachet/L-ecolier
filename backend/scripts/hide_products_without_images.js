import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lecolierer0";

function hasValidImage(p) {
  if (p.img && typeof p.img === 'string' && p.img.trim() !== '' && p.img.trim() !== 'null' && p.img.trim() !== 'undefined') {
    return true;
  }
  if (p.images && Array.isArray(p.images) && p.images.length > 0) {
    return p.images.some(img => img && typeof img === 'string' && img.trim() !== '' && img.trim() !== 'null' && img.trim() !== 'undefined');
  }
  return false;
}

async function hideProductsWithoutImages() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const products = await productsColl.find({}).toArray();

  console.log(`=== Hiding Products Without Images ===`);
  console.log(`Total Products: ${products.length}`);

  let activeWithImgCount = 0;
  let inactiveCount = 0;

  for (const p of products) {
    const validImg = hasValidImage(p);
    const newStatus = validImg ? 'active' : 'inactive';

    if (!validImg) {
      inactiveCount++;
      console.log(`[INACTIVE] Product ID: ${p._id} | Name: "${p.name}" has no valid image.`);
    } else {
      activeWithImgCount++;
    }

    await productsColl.updateOne(
      { _id: p._id },
      {
        $set: {
          status: newStatus
        }
      }
    );
  }

  console.log(`\n================ SUMMARY ================`);
  console.log(`Active Products (with image): ${activeWithImgCount}`);
  console.log(`Inactive Products (without image): ${inactiveCount}`);
  console.log(`Total Products in DB: ${products.length}`);

  await mongoose.disconnect();
}

hideProductsWithoutImages();
