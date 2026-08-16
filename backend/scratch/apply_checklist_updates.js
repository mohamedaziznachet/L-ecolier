import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, BrandModel, CategoryModel, PageSettingsModel } from '../dist/models/index.js';

const BRAND_LOGOS = {
  'BIC': '/src/assets/img/bic-1.jpg',
  'Bomi': '/src/assets/img/bomi-1.jpg',
  'Maped': '/src/assets/img/maped-1.jpg',
  'UHU': '/src/assets/img/uhu-1.jpg',
  'YAMAMA': '/src/assets/img/yamama-1.jpg'
};

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  // 1. Update Brand Logos
  let updatedBrands = 0;
  for (const [bName, logoUrl] of Object.entries(BRAND_LOGOS)) {
    const res = await BrandModel.updateOne(
      { name: bName },
      { $set: { logo: logoUrl } }
    );
    if (res.modifiedCount > 0) updatedBrands++;
  }
  console.log(`✅ Updated ${updatedBrands} brand logos in BrandModel.`);

  // 2. Validate Active Products & Price Integrity
  const totalProducts = await ProductModel.countDocuments();
  const activeProducts = await ProductModel.countDocuments({ status: 'active' });
  const inactiveProducts = await ProductModel.countDocuments({ status: 'inactive' });
  const zeroPriceProducts = await ProductModel.countDocuments({ priceNum: 0 });

  console.log(`📊 DB Products Audit:`);
  console.log(`   - Total Products: ${totalProducts}`);
  console.log(`   - Active Products: ${activeProducts}`);
  console.log(`   - Inactive Products (awaiting images/prices): ${inactiveProducts}`);
  console.log(`   - Products with 0 DT price: ${zeroPriceProducts}`);

  // 3. Category Summary
  const categories = await CategoryModel.find().lean();
  console.log(`📁 Active Categories (${categories.length}):`);
  for (const cat of categories) {
    const count = await ProductModel.countDocuments({ category: cat.name });
    console.log(`   - ${cat.name}: ${count} items`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
