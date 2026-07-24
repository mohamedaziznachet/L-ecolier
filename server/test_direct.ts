import app from './src/index.ts';
import request from 'supertest';
import mongoose from 'mongoose';

async function run() {
  const res = await request(app)
    .post('/api/orders')
    .send({
      customerName: 'Alice Dupont',
      customerPhone: '12345678',
      customerAddress: '10 Rue de la Paix',
      customerGovernorate: 'Tunis',
      items: [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 3 }],
      paymentMethod: 'cod',
    })
    .set('Accept', 'application/json');

  console.log("STATUS:", res.status);
  console.log("BODY:", res.body);
  process.exit(0);
}

run().catch(console.error);
