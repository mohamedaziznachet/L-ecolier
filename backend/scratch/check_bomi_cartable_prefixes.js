import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel } from '../dist/models/index.js';

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  const cartables = await ProductModel.find({
    $or: [
      { brand: 'Bomi' },
      { name: { $regex: /cartable|chariot|trousse|sac|jardin|panier|SB|CH|TR|JE|PX|ST/i } }
    ]
  }).lean();

  const prefixes = {};
  cartables.forEach(p => {
    const prefix = p.name.split('-')[0] || p.name.split(' ')[0];
    prefixes[prefix] = (prefixes[prefix] || 0) + 1;
  });

  console.log('Product Name Prefixes:', prefixes);
  await mongoose.disconnect();
}

run().catch(console.error);
