import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.JWT_SECRET = '12345678901234567890123456789012';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lecolier-test';

let app: any;
let PageSettingsModel: any;

beforeAll(async () => {
  ({ default: app } = await import('../index'));
  ({ PageSettingsModel } = await import('../models/index'));
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    await PageSettingsModel.deleteMany({});
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

describe('Home Page Layout & Banner Settings API Suites', () => {
  it('saves and fetches hero_bg_image setting via admin API', async () => {
    const putRes = await request(app)
      .put('/api/settings/hero_bg_image')
      .send({ url: '/uploads/hero-banner-2026.jpg' })
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(putRes.status).toBe(200);
    expect(putRes.body.key).toBe('hero_bg_image');

    const getRes = await request(app).get('/api/settings/hero_bg_image');
    expect(getRes.status).toBe(200);
    expect(getRes.body.content).toEqual({ url: '/uploads/hero-banner-2026.jpg' });
  });

  it('saves and fetches home_categories configuration via admin API', async () => {
    const customCats = [
      { label: 'Cartable Lux', img: '/uploads/cartable-lux.png' },
      { label: 'Trousse', img: '/uploads/trousse.png' }
    ];

    const putRes = await request(app)
      .put('/api/settings/home_categories')
      .send(customCats)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(putRes.status).toBe(200);

    const getRes = await request(app).get('/api/settings/home_categories');
    expect(getRes.status).toBe(200);
    expect(getRes.body.content).toEqual(customCats);
  });

  it('rejects layout setting update without admin token', async () => {
    const res = await request(app)
      .put('/api/settings/hero')
      .send({ titleMain: 'HACKED' });

    expect(res.status).toBe(401);
  });
});
