import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.JWT_SECRET = '12345678901234567890123456789012';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lecolier-test';

let app: any;
let CouponModel: any;

beforeAll(async () => {
  ({ default: app } = await import('../index'));
  ({ CouponModel } = await import('../models/index'));
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    await CouponModel.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

function adminToken() {
  return jwt.sign(
    { email: 'admin@example.com', role: 'admin', type: 'access' },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }
  );
}

describe('Category-Restricted Coupons API Suites', () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  it('creates a coupon with applicableCategories restriction via admin API', async () => {
    const res = await request(app)
      .post('/api/admin/coupons')
      .send({
        code: 'BAGS20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 0,
        expiresAt: tomorrow.toISOString(),
        isActive: true,
        applicableCategories: ['Cartable Lux', 'Trousse']
      })
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(201);
    expect(res.body.coupon).toBeDefined();
    expect(res.body.coupon.code).toBe('BAGS20');
    expect(res.body.coupon.applicableCategories).toEqual(['Cartable Lux', 'Trousse']);
  });

  it('calculates discount ONLY on eligible category items in cart', async () => {
    await CouponModel.create({
      code: 'CARTABLE10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 0,
      expiresAt: tomorrow,
      isActive: true,
      applicableCategories: ['Cartable Lux']
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({
        code: 'CARTABLE10',
        cartTotal: 150,
        items: [
          { name: 'SB02-NINJA', priceNum: 100, category: 'Cartable Lux', quantity: 1 },
          { name: 'Stylo Bic', priceNum: 50, category: 'Stylos & Crayons', quantity: 1 }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(10);
    expect(res.body.coupon.applicableCategories).toEqual(['Cartable Lux']);
  });

  it('rejects category coupon if no items in cart match applicable categories', async () => {
    await CouponModel.create({
      code: 'TROUSSE50',
      discountType: 'percentage',
      discountValue: 50,
      expiresAt: tomorrow,
      isActive: true,
      applicableCategories: ['Trousse']
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({
        code: 'TROUSSE50',
        cartTotal: 100,
        items: [
          { name: 'Calculatrice', priceNum: 100, category: 'Calculatrices', quantity: 1 }
        ]
      });

    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
    expect(res.body.error).toContain('Trousse');
  });
});
