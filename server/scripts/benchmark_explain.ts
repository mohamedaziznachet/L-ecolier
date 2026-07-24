import mongoose from 'mongoose';
import { ProductModel, UserModel, OrderModel, ReviewModel } from '../src/models/index.ts';

async function benchmark() {
  await mongoose.connect('mongodb://127.0.0.1:27017/lecolierer0');
  console.log('--- MONGO BENCHMARK & EXPLAIN ANALYSIS ---');

  // 1. Current collection counts
  const prodCount = await ProductModel.countDocuments();
  console.log(`Current products in DB: ${prodCount}`);

  // 2. Indexes audit on ProductModel
  const indexes = await ProductModel.collection.indexes();
  console.log('\n--- PRODUCT INDEXES ---');
  console.dir(indexes, { depth: null });

  // 3. Explain public product search (regex vs text)
  console.log('\n--- EXPLAIN PUBLIC SEARCH (Regex on name, category, description, brand) ---');
  const regexSearchExplain = await ProductModel.find({
    status: 'active',
    $or: [
      { name: new RegExp('cahier', 'i') },
      { category: new RegExp('cahier', 'i') },
      { description: new RegExp('cahier', 'i') },
      { brand: new RegExp('cahier', 'i') }
    ]
  }).sort({ id: 1 }).skip(0).limit(20).explain('executionStats');
  
  const winningStage = (regexSearchExplain as any).executionStats.executionStages;
  console.log('Execution stage:', winningStage.stage);
  console.log('TotalDocsExamined:', (regexSearchExplain as any).executionStats.totalDocsExamined);
  console.log('ExecutionTimeMillis:', (regexSearchExplain as any).executionStats.executionTimeMillis);

  // 4. Explain Admin Product Table Search & Sort
  console.log('\n--- EXPLAIN ADMIN PRODUCTS (Search regex + sort name) ---');
  const adminSearchExplain = await ProductModel.find({
    $or: [
      { name: new RegExp('stylo', 'i') },
      { category: new RegExp('stylo', 'i') },
      { description: new RegExp('stylo', 'i') }
    ]
  }).sort({ name: 1 }).skip(0).limit(10).explain('executionStats');
  console.log('Admin totalDocsExamined:', (adminSearchExplain as any).executionStats.totalDocsExamined);
  console.log('Admin ExecutionTimeMillis:', (adminSearchExplain as any).executionStats.executionTimeMillis);

  // 5. Check Product ID Lookup
  console.log('\n--- EXPLAIN PRODUCT LOOKUP BY NUMERIC ID OR OBJECTID ---');
  const lookupExplain = await ProductModel.findOne({
    $or: [{ id: 101 }, { id: '101' }]
  }).explain('executionStats');
  console.log('Lookup totalDocsExamined:', (lookupExplain as any).executionStats.totalDocsExamined);

  await mongoose.disconnect();
}

benchmark().catch(console.error);
