import mongoose from 'mongoose';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.JWT_SECRET = '12345678901234567890123456789012';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lecolier-test';

let app: any;
let ProductModel: any;

beforeAll(async () => {
  ({ default: app } = await import('../index'));
  ({ ProductModel } = await import('../models/index'));
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    await ProductModel.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Product Filters & Sort API Suites', () => {
  it('supports sortBy=newest returning products sorted by _id descending', async () => {
    await ProductModel.create({
      id: 1,
      name: 'Old Product',
      price: '10,000 DT',
      priceNum: 10,
      img: '/uploads/old.jpg',
      status: 'active'
    });

    await ProductModel.create({
      id: 2,
      name: 'New Product',
      price: '20,000 DT',
      priceNum: 20,
      img: '/uploads/new.jpg',
      status: 'active'
    });

    const res = await request(app).get('/api/products?sortBy=newest');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(2);
    expect(res.body.products[0].name).toBe('New Product');
  });

  it('filters out inactive products from public API queries', async () => {
    await ProductModel.create({
      id: 10,
      name: 'Active Item',
      price: '30,000 DT',
      priceNum: 30,
      img: '/uploads/active.jpg',
      status: 'active'
    });

    await ProductModel.create({
      id: 11,
      name: 'Inactive Item',
      price: '30,000 DT',
      priceNum: 30,
      img: '', // No image
      status: 'inactive'
    });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('Active Item');
  });

  it('filters products matching specific cartable model names (e.g. QUAD, NINJA)', async () => {
    await ProductModel.create({
      id: 20,
      name: 'SB02-QUAD',
      category: 'Cartable Lux',
      price: '150,000 DT',
      priceNum: 150,
      img: '/uploads/quad.jpg',
      status: 'active'
    });

    await ProductModel.create({
      id: 21,
      name: 'SB02-NINJA',
      category: 'Cartable Lux',
      price: '150,000 DT',
      priceNum: 150,
      img: '/uploads/ninja.jpg',
      status: 'active'
    });

    await ProductModel.create({
      id: 22,
      name: 'SB01-XL-BIKER',
      category: 'Cartable Eco Lux',
      price: '120,000 DT',
      priceNum: 120,
      img: '/uploads/biker.jpg',
      status: 'active'
    });

    const res = await request(app).get('/api/products?search=QUAD');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('SB02-QUAD');
  });
});
