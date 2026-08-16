import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel } from '../dist/models/index.js';

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  const allProducts = await ProductModel.find({}).select('_id price priceNum name').lean();
  const bulkOps = [];

  for (const p of allProducts) {
    const isNaString = typeof p.price === 'string' && (p.price.includes('#N/A') || p.price.includes('N/A') || p.price.includes('NaN') || p.price.includes('undefined'));
    const isInvalidNum = typeof p.priceNum !== 'number' || isNaN(p.priceNum);

    if (isNaString || isInvalidNum) {
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              priceNum: 0,
              price: '0,000 DT'
            }
          }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await ProductModel.bulkWrite(bulkOps);
    console.log(`✅ Fixed ${bulkOps.length} products with #N/A or invalid prices -> set to 0,000 DT!`);
  } else {
    console.log('✅ No products with #N/A or invalid prices found.');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
