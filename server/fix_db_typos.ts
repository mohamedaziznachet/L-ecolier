import { connectDB } from './src/config/db.ts';
import { ProductModel } from './src/models/index.ts';

async function fix() {
  await connectDB();
  const products = await ProductModel.find();
  for (const p of products) {
    if (p.category && p.category.includes('Catrable')) {
      const fixed = p.category.replace(/Catrable/g, 'Cartable');
      console.log(`Fixing product #${p.id}: ${p.category} -> ${fixed}`);
      p.category = fixed;
      await p.save();
    }
  }
  console.log('Database cleanup complete!');
  process.exit(0);
}

fix();
