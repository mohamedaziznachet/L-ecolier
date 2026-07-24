import mongoose from 'mongoose';
import { CategoryModel, ProductModel } from './src/models/index.ts';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/lecolierer0';

const DEFAULT_CATEGORIES = [
  'Cartable Lux',
  'Cartable Eco Lux',
  'Cartable super lux',
  'Cartable high lux',
  'Trousse',
  'Lunch box',
  'Chariots',
  'Sacs à dos',
  'Cahiers & Classeurs',
  'Stylos & Crayons',
  'Calculatrices',
  'Matériel artistique',
  'Papeterie',
  'Fournitures scolaires',
];

async function resetCategories() {
  try {
    console.log(`Connecting directly to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB!');

    console.log('Clearing existing categories...');
    await CategoryModel.deleteMany({});

    console.log('Seeding clean default categories...');
    const docs = DEFAULT_CATEGORIES.map((name) => ({ name }));
    await CategoryModel.insertMany(docs);

    console.log('Fixing category typos in products...');
    const products = await ProductModel.find();
    for (const p of products) {
      if (p.category && p.category.includes('Catrable')) {
        const fixed = p.category.replace(/Catrable/g, 'Cartable');
        p.category = fixed;
        await p.save();
      }
    }

    console.log('✅ Categories successfully reset and re-seeded in database!');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting categories:', err);
    process.exit(1);
  }
}

resetCategories();
