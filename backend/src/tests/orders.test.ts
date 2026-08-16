// server/src/tests/orders.test.ts
// Phase 2 — Data Integrity & Transactions
// Tests for: order creation, item snapshots, stock validation, invalid IDs,
// stock update after confirmation, and customer checkout without admin privileges.

import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.JWT_SECRET = '12345678901234567890123456789012';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lecolier-test';

const JWT_SECRET = '12345678901234567890123456789012';

let app: any;
let ProductModel: any;
let OrderModel: any;

beforeAll(async () => {
  ({ default: app } = await import('../index'));
  ({ ProductModel, OrderModel } = await import('../models/index'));
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Clean relevant collections between tests
    await Promise.all([
      ProductModel.deleteMany({}),
      OrderModel.deleteMany({}),
    ]);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

// Helper: create a test product in MongoDB directly
async function createTestProduct(overrides: Record<string, any> = {}) {
  return ProductModel.create({
    id: Math.floor(Math.random() * 100000),
    name: 'Test Product',
    price: '10,000 DT',
    priceNum: 10,
    category: 'Test',
    stock: 5,
    img: 'https://example.com/product.jpg',
    ...overrides,
  });
}

// Generates a valid admin JWT token
function adminToken() {
  return jwt.sign(
    { email: 'admin@example.com', role: 'admin', type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// ── Test 1: Successful order creation with item snapshots ─────────────────────

describe('POST /api/orders — Successful order creation', () => {
  it('creates an order and stores full item snapshots (name, price, subtotal)', async () => {
    const product = await createTestProduct({
      name: 'Cahier Lux',
      priceNum: 5,
      stock: 10,
    });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Alice Dupont',
        customerPhone: '12345678',
        customerAddress: '10 Rue de la Paix',
        customerGovernorate: 'Tunis',
        items: [{ productId: product._id.toString(), quantity: 3 }],
        paymentMethod: 'cod',
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.total).toBe(23); // 5 * 3 = 15 DT + 8 DT shipping = 23 DT

    // Verify item snapshot
    expect(res.body.items).toHaveLength(1);
    const item = res.body.items[0];
    expect(item.name).toBe('Cahier Lux');
    expect(item.price).toBe(5);
    expect(item.quantity).toBe(3);
    expect(item.subtotal).toBe(15);

    // Verify item snapshot persisted in DB
    const saved = await OrderModel.findById(res.body.orderId);
    expect(saved).not.toBeNull();
    expect(saved.items[0].name).toBe('Cahier Lux');
    expect(saved.items[0].price).toBe(5);
    expect(saved.items[0].subtotal).toBe(15);
    expect(saved.total).toBe(22);
  });
});

// ── Test 2: Order contains complete item snapshots ────────────────────────────

describe('POST /api/orders — Item snapshot completeness', () => {
  it('stores all required snapshot fields: productId, name, price, quantity, subtotal', async () => {
    const p1 = await createTestProduct({ name: 'Trousse', priceNum: 8, stock: 20 });
    const p2 = await createTestProduct({ name: 'Sac à dos', priceNum: 35, stock: 5 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Bob Martin',
        customerPhone: '98765432',
        customerAddress: '5 Avenue Habib Bourguiba',
        customerGovernorate: 'Sousse',
        items: [
          { productId: p1._id.toString(), quantity: 2 },
          { productId: p2._id.toString(), quantity: 1 },
        ],
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(2);

    const trousse = res.body.items.find((i: any) => i.name === 'Trousse');
    const sac = res.body.items.find((i: any) => i.name === 'Sac à dos');

    expect(trousse).toBeDefined();
    expect(trousse.price).toBe(8);
    expect(trousse.quantity).toBe(2);
    expect(trousse.subtotal).toBe(16);

    expect(sac).toBeDefined();
    expect(sac.price).toBe(35);
    expect(sac.quantity).toBe(1);
    expect(sac.subtotal).toBe(35);

    // Total: 16 + 35 = 51 + 8 DT shipping = 59
    expect(res.body.total).toBe(59);
  });
});

// ── Test 3: Invalid product IDs ───────────────────────────────────────────────

describe('POST /api/orders — Invalid product ID handling', () => {
  it('returns 404 for a non-existent product ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Charlie Test',
        customerPhone: '11223344',
        customerAddress: 'Rue Test',
        customerGovernorate: 'Tunis',
        items: [{ productId: fakeId, quantity: 1 }],
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('introuvable');
  });

  it('returns 400 for missing items array', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Charlie Test',
        customerPhone: '11223344',
        customerAddress: 'Rue Test',
        customerGovernorate: 'Tunis',
        // items intentionally missing
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
  });

  it('returns 400 for quantity exceeding stock', async () => {
    const product = await createTestProduct({ name: 'Calculatrice', priceNum: 15, stock: 2 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Dave Test',
        customerPhone: '55667788',
        customerAddress: 'Avenue Test',
        customerGovernorate: 'Sfax',
        items: [{ productId: product._id.toString(), quantity: 10 }], // 10 > stock of 2
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('stock');
  });

  it('returns 400 for out-of-stock products', async () => {
    const product = await createTestProduct({ name: 'Produit épuisé', priceNum: 5, stock: 0 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Eve Test',
        customerPhone: '44332211',
        customerAddress: 'Rue Épuisée',
        customerGovernorate: 'Nabeul',
        items: [{ productId: product._id.toString(), quantity: 1 }],
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('stock');
  });
});

// ── Test 4: Stock update after order confirmation ─────────────────────────────

describe('PUT /api/admin/orders/:id/status — Stock decrement on confirmation', () => {
  it('decrements stock when an order is confirmed', async () => {
    const product = await createTestProduct({
      name: 'Stylo',
      priceNum: 2,
      stock: 20,
    });

    // Create an order
    const orderRes = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Frank Confirmed',
        customerPhone: '87654321',
        customerAddress: 'Rue de la Confirmation',
        customerGovernorate: 'Bizerte',
        items: [{ productId: product._id.toString(), quantity: 3 }],
      })
      .set('Accept', 'application/json');

    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.orderId;

    // Admin confirms the order
    const confirmRes = await request(app)
      .put(`/api/admin/orders/${orderId}/status`)
      .send({ status: 'confirmed' })
      .set('Authorization', `Bearer ${adminToken()}`)
      .set('Accept', 'application/json');

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe('confirmed');

    // Verify stock was decremented
    const updatedProduct = await ProductModel.findById(product._id);
    expect(updatedProduct.stock).toBe(17); // 20 - 3 = 17
  });

  it('returns 400 for an invalid order ID format', async () => {
    const res = await request(app)
      .put('/api/admin/orders/not-a-valid-id/status')
      .send({ status: 'confirmed' })
      .set('Authorization', `Bearer ${adminToken()}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// ── Test 5: Customer checkout without admin privileges ────────────────────────

describe('POST /api/orders — Customer checkout without admin privileges', () => {
  it('allows a regular user (no admin token) to place an order', async () => {
    const product = await createTestProduct({
      name: 'Lunch Box',
      priceNum: 12,
      stock: 8,
    });

    // No Authorization header — guest checkout
    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Grace Guest',
        customerPhone: '33445566',
        customerAddress: 'Avenue de la Liberté',
        customerGovernorate: 'Monastir',
        items: [{ productId: product._id.toString(), quantity: 1 }],
      })
      .set('Accept', 'application/json');

    // Must succeed as 201 — no authentication required for checkout
    expect(res.status).toBe(201);
    expect(res.body.orderId).toBeDefined();
  });

  it('returns 401 if a non-admin user tries to access admin order endpoints', async () => {
    const userToken = jwt.sign(
      { email: 'user@example.com', role: 'client', type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .set('Accept', 'application/json');

    expect(res.status).toBe(403);
  });
});

// ── Test 6: Free shipping threshold (>= 200 DT) ───────────────────────────────

describe('POST /api/orders — Free shipping threshold', () => {
  it('applies 0 DT shipping fee when product subtotal is 200 DT or more', async () => {
    const product = await createTestProduct({
      name: 'Cartable Lux High',
      priceNum: 210,
      stock: 5,
    });

    const res = await request(app)
      .post('/api/orders')
      .send({
        customerName: 'Helen High',
        customerPhone: '11223344',
        customerAddress: 'Rue Habib Bourguiba',
        customerGovernorate: 'Tunis',
        items: [{ productId: product._id.toString(), quantity: 1 }],
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.shippingFee).toBe(0);
    expect(res.body.total).toBe(210);
  });
});

