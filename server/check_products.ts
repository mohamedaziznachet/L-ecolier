import { connectDB } from './src/config/db.ts';
import { ProductModel } from './src/models/index.ts';

async function check() {
  await connectDB();
  const products = await ProductModel.find().lean();
  console.log(`Total products in database: ${products.length}`);
  products.forEach((p, idx) => {
    console.log(`\nProduct #${idx + 1}:`);
    console.log(`  ID: ${p.id} (_id: ${p._id})`);
    console.log(`  Name: ${JSON.stringify(p.name)}`);
    console.log(`  Category: ${JSON.stringify(p.category)}`);
    console.log(`  Brand: ${JSON.stringify(p.brand)}`);
    console.log(`  Status: ${JSON.stringify(p.status)}`);
    console.log(`  SchoolLevel: ${JSON.stringify(p.schoolLevel)}`);
  });
  process.exit(0);
}

check();
