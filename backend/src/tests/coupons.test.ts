// server/src/tests/coupons.test.ts
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

describe('Coupons API Suites', () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  it('creates a percentage coupon via admin API', async () => {
    const res = await request(app)
      .post('/api/admin/coupons')
      .send({
        code: 'SUMMER10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 20,
        expiresAt: tomorrow.toISOString(),
        status: 'active',
      })
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(201);
    expect(res.body.coupon).toBeDefined();
    expect(res.body.coupon.code).toBe('SUMMER10');
  });

  it('validates active percentage coupon successfully', async () => {
    await CouponModel.create({
      code: 'PROMO15',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 50,
      expiresAt: tomorrow,
      status: 'active',
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({
        code: 'PROMO15',
        cartTotal: 100,
      });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discountAmount).toBe(15); // 15% of 100
  });

  it('rejects coupon if cart total is below minOrderAmount', async () => {
    await CouponModel.create({
      code: 'BIGORDER',
      discountType: 'fixed',
      discountValue: 10,
      minOrderAmount: 100,
      expiresAt: tomorrow,
      status: 'active',
    });

    const res = await request(app)
      .post('/api/coupons/validate')
      .send({
        code: 'BIGORDER',
        cartTotal: 50, // 50 < min 100
      });

    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('rejects non-existent coupon code', async () => {
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({
        code: 'NOEXIST',
        cartTotal: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('deletes coupon via admin endpoint', async () => {
    const coupon = await CouponModel.create({
      code: 'DELME',
      discountType: 'fixed',
      discountValue: 5,
      expiresAt: tomorrow,
      status: 'active',
    });

    const delRes = await request(app)
      .delete(`/api/admin/coupons/${coupon._id}`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(delRes.status).toBe(200);

    const check = await CouponModel.findById(coupon._id);
    expect(check).toBeNull();
  });
});
