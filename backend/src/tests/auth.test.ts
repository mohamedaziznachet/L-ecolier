// server/src/tests/auth.test.ts
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.JWT_SECRET = '12345678901234567890123456789012';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lecolier-test';

let app: any;
let UserModel: any;

beforeAll(async () => {
  ({ default: app } = await import('../index'));
  ({ UserModel } = await import('../models/index'));
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    await UserModel.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Auth API Suites', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jean Dupont',
        email: 'jean@example.com',
        password: 'password123',
        phone: '12345678',
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('jean@example.com');
  });

  it('prevents duplicate email registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jean Dupont',
        email: 'duplicate@example.com',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Other User',
        email: 'duplicate@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('déjà');
  });

  it('rejects invalid email formats on registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid Email',
        email: 'not-an-email',
        password: 'password123',
      });

    expect(res.status).toBe(400);
  });

  it('logins registered user with valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login User',
        email: 'login@example.com',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('rejects login with wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login User',
        email: 'wrongpass@example.com',
        password: 'correctpassword',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrongpass@example.com',
        password: 'incorrectpassword',
      });

    expect(res.status).toBe(401);
  });

  it('checks email availability via check-email endpoint', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Check User',
        email: 'check@example.com',
        password: 'password123',
      });

    const res1 = await request(app).get('/api/auth/check-email/check@example.com');
    expect(res1.body.exists).toBe(true);

    const res2 = await request(app).get('/api/auth/check-email/nonexistent@example.com');
    expect(res2.body.exists).toBe(false);
  });
});
