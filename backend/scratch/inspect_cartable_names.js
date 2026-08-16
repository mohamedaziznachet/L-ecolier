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
      { name: { $regex: /cartable|chariot|trousse|sac|jardin|panier/i } },
      { description: { $regex: /cartable|chariot|trousse|sac|jardin|panier/i } },
      { category: { $regex: /cartable|sac/i } }
    ]
  }).lean();

  console.log(`Found ${cartables.length} cartable/bag products! Sample 20 names & descriptions:`);
  cartables.slice(0, 20).forEach(p => {
    console.log(`ID: ${p.id} | Name: "${p.name}" | Desc: "${p.description}"`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
