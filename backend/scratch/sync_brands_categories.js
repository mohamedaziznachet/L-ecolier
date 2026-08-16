import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, BrandModel, CategoryModel, PageSettingsModel } from '../dist/models/index.js';

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  // 1. Sync Brands
  const distinctBrands = await ProductModel.distinct('brand');
  console.log('Distinct brands in Products:', distinctBrands);

  let newBrandsCount = 0;
  for (const bName of distinctBrands) {
    if (!bName || !bName.trim()) continue;
    const trimmed = bName.trim();
    const existing = await BrandModel.findOne({ name: { $regex: new RegExp(`^${trimmed}$`, 'i') } });
    if (!existing) {
      await BrandModel.create({
        name: trimmed,
        logo: '',
        description: `Marque ${trimmed}`
      });
      newBrandsCount++;
    }
  }

  // 2. Sync Categories
  const distinctCategories = await ProductModel.distinct('category');
  console.log('Distinct categories in Products:', distinctCategories);

  let newCategoriesCount = 0;
  for (const cName of distinctCategories) {
    if (!cName || !cName.trim()) continue;
    const trimmed = cName.trim();
    const existing = await CategoryModel.findOne({ name: { $regex: new RegExp(`^${trimmed}$`, 'i') } });
    if (!existing) {
      await CategoryModel.create({
        name: trimmed,
        image: ''
      });
      newCategoriesCount++;
    }
  }

  // Update PageSettings for categories
  const allCategoryDocs = await CategoryModel.find().lean();
  const allCatNames = allCategoryDocs.map(c => c.name);
  await PageSettingsModel.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', content: allCatNames },
    { returnDocument: 'after', upsert: true }
  );

  const totalBrands = await BrandModel.countDocuments();
  const totalCategories = await CategoryModel.countDocuments();

  console.log(`✅ Brands & Categories synced! New Brands: ${newBrandsCount} (Total: ${totalBrands}), New Categories: ${newCategoriesCount} (Total: ${totalCategories})`);
  await mongoose.disconnect();
}

run().catch(console.error);
