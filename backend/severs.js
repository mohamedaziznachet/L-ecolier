import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import 'dotenv/config';

import { connectDB } from './dist/config/db.js';
import { hashAdminPassword } from './dist/config/adminConfig.js';

import authRoutes from './dist/routes/authRoutes.js';
import adminRoutes from './dist/routes/adminRoutes.js';
import publicRoutes from './dist/routes/publicRoutes.js';
import wishlistRoutes from './dist/routes/wishlistRoutes.js';

// App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB();

// middlewares
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: true, // Allow all origins for the simplified example
  credentials: true
}));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

// api endpoints
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api', publicRoutes);

app.get('/', (req, res) => {
  res.send('API Working');
});

hashAdminPassword().then(() => {
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}).catch(err => {
  console.log('Failed to initialize:', err);
});
