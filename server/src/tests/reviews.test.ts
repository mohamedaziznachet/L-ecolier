// server/src/tests/reviews.test.ts
import mongoose from 'mongoose';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'StrongPassword123!';
process.env.JWT_SECRET = '12345678901234567890123456789012';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/lecolier-test';

let app: any;
let ReviewModel: any;
let ProductModel: any;

beforeAll(async () => {
  ({ default: app } = await import('../index'));
  ({ ReviewModel, ProductModel } = await import('../models/index'));
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    await Promise.all([
      ReviewModel.deleteMany({}),
      ProductModel.deleteMany({}),
    ]);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Customer Reviews (Avis Clients) API Suites', () => {
  it('allows a customer to submit a review for a product', async () => {
    const product = await ProductModel.create({
      name: 'Cahier de dessin 48P',
      priceNum: 4.5,
      price: '4.500 DT',
      stock: 20,
      rating: 5,
      reviews: 0,
    });

    const res = await request(app)
      .post('/api/reviews')
      .send({
        productId: String(product._id),
        productName: 'Cahier de dessin 48P',
        customerName: 'Sami N.',
        rating: 5,
        comment: 'Super papier, mon fils adore !',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.review).toBeDefined();
    expect(res.body.review.customerName).toBe('Sami N.');
    expect(res.body.review.comment).toBe('Super papier, mon fils adore !');

    // Check updated product stats
    const updatedProd = await ProductModel.findById(product._id);
    expect(updatedProd.reviews).toBe(1);
    expect(updatedProd.rating).toBe(5);
  });

  it('fetches customer reviews for a given product', async () => {
    const product = await ProductModel.create({
      name: 'Stylo Cello 0.7',
      priceNum: 1.2,
      price: '1.200 DT',
      stock: 50,
      rating: 5,
      reviews: 0,
    });

    await ReviewModel.create({
      productId: String(product._id),
      productName: product.name,
      userId: 'user123',
      customerName: 'Yassine M.',
      rating: 4,
      comment: 'Très bon écriture.',
    });

    const res = await request(app)
      .get(`/api/reviews/product/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toBeDefined();
    expect(res.body.reviews.length).toBe(1);
    expect(res.body.reviews[0].customerName).toBe('Yassine M.');
  });
});
