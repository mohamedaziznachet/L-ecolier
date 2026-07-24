import { connectDB } from './src/config/db.ts';
import { ProductModel } from './src/models/index.ts';
import { updateProduct, deleteProduct, insertProduct, buildProductLookupQuery } from './src/repositories/productRepository.ts';
import mongoose from 'mongoose';

async function run() {
  await connectDB();
  await ProductModel.deleteMany({});
  
  const payload = {
      id: 777,
      name: 'Produit test',
      price: '12,000 DT',
      priceNum: 12000,
      category: 'Test',
      description: 'Produit de test',
      img: 'https://example.com/image.png',
      stock: 10,
    };
    
  await insertProduct(payload);
  
  await updateProduct('777', { name: 'Produit modifié', priceNum: 13000 });
  
  const res = await deleteProduct('777');
  console.log("Deleted result string:", res ? "FOUND" : "NOT FOUND");
  
  process.exit(0);
}
run().catch(console.error);
