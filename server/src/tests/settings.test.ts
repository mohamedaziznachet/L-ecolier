import request from 'supertest';
import mongoose from 'mongoose';
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

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Settings API', () => {
  const testKey = 'testKey';
  const testContent = { foo: 'bar' };

  const adminToken = jwt.sign(
    { email: 'admin@example.com', role: 'admin', type: 'access' },
    '12345678901234567890123456789012',
    { expiresIn: '15m' }
  );

  it('should PUT a new setting', async () => {
    const res = await request(app)
      .put(`/api/settings/${testKey}`)
      .send(testContent)
      .set('Accept', 'application/json')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.key).toBe(testKey);
    expect(res.body.content).toMatchObject(testContent);
  });

  it('should GET the saved setting', async () => {
    const res = await request(app).get(`/api/settings/${testKey}`);
    expect(res.status).toBe(200);
    expect(res.body.key).toBe(testKey);
    expect(res.body.content).toMatchObject(testContent);
  });

  it('should DELETE the setting', async () => {
    const res = await request(app)
      .delete(`/api/settings/${testKey}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Deleted');
  });

  it('GET after DELETE should return 404', async () => {
    const res = await request(app).get(`/api/settings/${testKey}`);
    expect(res.status).toBe(404);
  });
});
