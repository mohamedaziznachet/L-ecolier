import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.JWT_SECRET = '12345678901234567890123456789012';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lecolier-test';

let app: any;

beforeAll(async () => {
  ({ default: app } = await import('../index'));
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => undefined);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Admin product CRUD', () => {
  const adminToken = () => jwt.sign(
    { email: 'admin@example.com', role: 'admin', type: 'access' },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }
  );

  const payload = {
    id: 777,
    name: 'Produit test',
    price: '12,000 DT',
    priceNum: 12000,
    category: 'Test',
    description: 'Produit de test',
    img: 'https://example.com/image.png',
    stock: 10,
    schoolLevel: 'Collège',
  };

  it('creates a new product via admin endpoint', async () => {
    const createdRes = await request(app)
      .post('/api/admin/products')
      .send(payload)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(createdRes.status).toBe(201);
    expect(createdRes.body.insertedId).toBeDefined();
  });

  it('retrieves created product in public catalog listing', async () => {
    await request(app)
      .post('/api/admin/products')
      .send(payload)
      .set('Authorization', `Bearer ${adminToken()}`);

    const listRes = await request(app).get('/api/products');
    expect(listRes.status).toBe(200);
    expect(listRes.body.products.some((p: any) => p.id === 777)).toBe(true);
  });

  it('filters product listing by school level', async () => {
    await request(app)
      .post('/api/admin/products')
      .send(payload)
      .set('Authorization', `Bearer ${adminToken()}`);

    const listRes = await request(app).get(`/api/products?schoolLevel=${encodeURIComponent('Collège')}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.products.some((p: any) => p.id === 777)).toBe(true);
  });

  it('updates product properties via admin PUT endpoint', async () => {
    await request(app)
      .post('/api/admin/products')
      .send(payload)
      .set('Authorization', `Bearer ${adminToken()}`);

    const updateRes = await request(app)
      .put('/api/admin/products/777')
      .send({ name: 'Produit modifié', priceNum: 13000 })
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(updateRes.status).toBe(200);

    const updatedListRes = await request(app).get('/api/products');
    const updatedProduct = updatedListRes.body.products.find((p: any) => p.id === 777);
    expect(updatedProduct?.name).toBe('Produit modifié');
    expect(updatedProduct?.priceNum).toBe(13000);
  });

  it('deletes product via admin DELETE endpoint', async () => {
    await request(app)
      .post('/api/admin/products')
      .send(payload)
      .set('Authorization', `Bearer ${adminToken()}`);

    const deleteRes = await request(app)
      .delete('/api/admin/products/777')
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(deleteRes.status).toBe(200);

    const finalListRes = await request(app).get('/api/products');
    expect(finalListRes.body.products.some((p: any) => p.id === 777)).toBe(false);
  });
});
