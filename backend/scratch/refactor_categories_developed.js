import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, CategoryModel, PageSettingsModel } from '../dist/models/index.js';

function mapToCategory(oldCat, prodName = '') {
  const catUpper = (oldCat || '').toUpperCase();
  const nameUpper = (prodName || '').toUpperCase();

  // 1. Keep Sacs & Cartables subcategories developed as requested by user
  if (catUpper.includes('ECO LUX') || nameUpper.includes('ECO LUX')) return 'Cartable Eco Lux';
  if (catUpper.includes('HIGH LUX') || nameUpper.includes('HIGH LUX')) return 'Cartable high lux';
  if (catUpper.includes('SUPER LUX') || nameUpper.includes('SUPER LUX')) return 'Cartable super lux';
  if (catUpper.includes('CARTABLE LUX') || (nameUpper.includes('CARTABLE') && nameUpper.includes('LUX'))) return 'Cartable Lux';
  if (catUpper.includes('CHARIOT') || nameUpper.includes('CHARIOT')) return 'Chariots';
  if (catUpper.includes('TROUSSE') || nameUpper.includes('TROUSSE')) return 'Trousse';
  if (catUpper.includes('JARDIN') || nameUpper.includes('JARDIN')) return "Jardin d'enfant";
  if (catUpper.includes('PANIER') || nameUpper.includes('PANIER')) return 'Paniers';
  if (catUpper.includes('CARTABLE') || nameUpper.includes('CARTABLE') || nameUpper.includes('SAC A DOS')) return 'Cartables & Sacs à dos';

  // 2. Cahiers & Papeterie
  if (
    catUpper.includes('CAHIER') || catUpper.includes('WIRO') || catUpper.includes('BROCHURE') ||
    catUpper.includes('BLOC') || catUpper.includes('CARNET') || catUpper.includes('AGENDA') ||
    catUpper.includes('PIQURE') || catUpper.includes('DOUBLE') || catUpper.includes('BRISTOL') ||
    nameUpper.includes('CAHIER') || nameUpper.includes('BROCHURE') || nameUpper.includes('BLOC NOTE') ||
    nameUpper.includes('AGENDA')
  ) {
    return 'Cahiers & Papeterie';
  }

  // 3. Rangement & Classement
  if (
    catUpper.includes('CHEMISE') || catUpper.includes('CLASSEUR') || catUpper.includes('PORTE DOC') ||
    catUpper.includes('RANGEMENT') || nameUpper.includes('CHEMISE') || nameUpper.includes('PORTE DOC') ||
    nameUpper.includes('CLASSEUR')
  ) {
    return 'Rangement & Classement';
  }

  // 4. Matériel artistique
  if (
    catUpper.includes('ARTISTIQUE') || catUpper.includes('GOUACHE') || catUpper.includes('AQUARELLE') ||
    nameUpper.includes('GOUACHE') || nameUpper.includes('AQUARELLE') || nameUpper.includes('PATE') ||
    nameUpper.includes('PEINTURE') || nameUpper.includes('PINCEAU') || nameUpper.includes('PALETTE')
  ) {
    return 'Matériel artistique';
  }

  // 5. Stylos & Crayons
  if (
    catUpper.includes('STYLO') || catUpper.includes('CRAYON') || catUpper.includes('FEUTRE') ||
    nameUpper.includes('STYLO') || nameUpper.includes('CRAYON') || nameUpper.includes('FEUTRE') ||
    nameUpper.includes('CORRECTEUR') || nameUpper.includes('TIPP-EX') || nameUpper.includes('GOMME') ||
    nameUpper.includes('TAILLE CRAYON') || nameUpper.includes('SURBANDE') || nameUpper.includes('SURNEUR')
  ) {
    return 'Stylos & Crayons';
  }

  // 6. Default: Fournitures scolaires
  return 'Fournitures scolaires';
}

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  const allProducts = await ProductModel.find({}).select('_id category name description').lean();
  const bulkOps = [];

  for (const prod of allProducts) {
    const targetCat = mapToCategory(prod.category, `${prod.name} ${prod.description || ''}`);
    if (prod.category !== targetCat) {
      bulkOps.push({
        updateOne: {
          filter: { _id: prod._id },
          update: { $set: { category: targetCat } }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await ProductModel.bulkWrite(bulkOps);
    console.log(`✅ Bulk updated ${bulkOps.length} products with developed Sacs & Cartables categories!`);
  } else {
    console.log('✅ All products are already categorized!');
  }

  const distinctCats = (await ProductModel.distinct('category')).filter(Boolean).map(c => c.trim()).sort();

  // Reset CategoryModel
  await CategoryModel.deleteMany({});
  for (const catName of distinctCats) {
    await CategoryModel.create({ name: catName, image: '' });
  }

  // Reset PageSettings for categories
  await PageSettingsModel.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', content: distinctCats },
    { returnDocument: 'after', upsert: true }
  );

  console.log('✅ Re-created CategoryModel & pageSettings with developed categories:', distinctCats);

  for (const cat of distinctCats) {
    const count = await ProductModel.countDocuments({ category: cat });
    console.log(`  - ${cat}: ${count} products`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
