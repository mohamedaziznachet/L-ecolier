import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.JWT_SECRET = '12345678901234567890123456789012';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lecolier-test-wishlist';

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

describe('Wishlist API and Product Description Integration', () => {
  const adminToken = () => jwt.sign(
    { email: 'admin@example.com', role: 'admin', type: 'access' },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }
  );

  const userToken = (userId: string) => jwt.sign(
    { userId, email: 'user@example.com', role: 'client', type: 'access' },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }
  );

  const productPayload = {
    id: 999,
    name: 'Cahier de dessin Grand Format',
    price: '8,500 DT',
    priceNum: 8.5,
    oldPrice: '10,000 DT',
    priceBeforeDiscount: 10,
    discount: 15,
    category: 'Fournitures',
    description: 'Cahier de dessin haute qualité 200 pages papier blanc 90g.',
    img: 'https://example.com/cahier.png',
    images: ['https://example.com/cahier.png', 'https://example.com/cahier-back.png'],
    stock: 50,
    brand: 'Clairefontaine',
    status: 'active',
    featured: true,
    specifications: [
      { key: 'Format', value: 'A4' },
      { key: 'Grammage', value: '90g/m²' }
    ]
  };

  it('creates product with full properties & description and verifies public retrieval', async () => {
    const createRes = await request(app)
      .post('/api/admin/products')
      .send(productPayload)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(createRes.status).toBe(201);

    const getRes = await request(app).get('/api/products/999');
    expect(getRes.status).toBe(200);
    expect(getRes.body.product.name).toBe('Cahier de dessin Grand Format');
    expect(getRes.body.product.description).toBe('Cahier de dessin haute qualité 200 pages papier blanc 90g.');
    expect(getRes.body.product.brand).toBe('Clairefontaine');
    expect(getRes.body.product.oldPrice).toBe('10,000 DT');
    expect(getRes.body.product.specifications).toHaveLength(2);
  });

  it('toggles item in wishlist for an authenticated user', async () => {
    // 1. Create product
    await request(app)
      .post('/api/admin/products')
      .send(productPayload)
      .set('Authorization', `Bearer ${adminToken()}`);

    // 2. Register user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer',
        email: 'user@example.com',
        password: 'Password123!',
      });

    expect(regRes.status).toBe(201);
    const userId = regRes.body.user.id;
    const token = userToken(userId);

    // 3. Toggle product in wishlist (Add)
    const addRes = await request(app)
      .post('/api/wishlist/toggle')
      .send({ productId: 999 })
      .set('Authorization', `Bearer ${token}`);

    expect(addRes.status).toBe(200);
    expect(addRes.body.isWishlisted).toBe(true);
    expect(addRes.body.wishlistIds.map(String)).toContain('999');
    expect(addRes.body.wishlist[0].name).toBe('Cahier de dessin Grand Format');

    // 4. GET wishlist
    const getWishlistRes = await request(app)
      .get('/api/wishlist')
      .set('Authorization', `Bearer ${token}`);

    expect(getWishlistRes.status).toBe(200);
    expect(getWishlistRes.body.wishlist).toHaveLength(1);
    expect(getWishlistRes.body.wishlist[0].id).toBe(999);

    // 5. Toggle product again (Remove)
    const removeRes = await request(app)
      .post('/api/wishlist/toggle')
      .send({ productId: 999 })
      .set('Authorization', `Bearer ${token}`);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.isWishlisted).toBe(false);
    expect(removeRes.body.wishlistIds).toHaveLength(0);
  });

  it('supports batch wishlist fetching for guest users', async () => {
    await request(app)
      .post('/api/admin/products')
      .send(productPayload)
      .set('Authorization', `Bearer ${adminToken()}`);

    const batchRes = await request(app)
      .post('/api/wishlist/batch')
      .send({ productIds: [999] });

    expect(batchRes.status).toBe(200);
    expect(batchRes.body.products).toHaveLength(1);
    expect(batchRes.body.products[0].name).toBe('Cahier de dessin Grand Format');
  });
});
