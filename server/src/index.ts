// server/src/index.ts
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import cookieParser from 'cookie-parser';
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

import { getAllProducts, getCategories, insertProduct, buildProductLookupQuery } from './repositories/productRepository.ts';
import { validateCoupon } from './repositories/couponRepository.ts';
import adminRoutes from './routes/adminRoutes.ts';
import { authenticateAdmin } from './middleware/auth.ts';
import { is2FAEnabled, createPending2FAToken, enable2FA, disable2FA } from './middleware/admin2fa.ts';
import { generateTokenPair, verifyAndRotateRefreshToken, revokeRefreshToken } from './middleware/jwtTokens.ts';
import { connectDB, closeDBConnection } from './config/db.ts';
import { UserModel, OrderModel, PageSettingsModel, ProductModel } from './models/index.ts';
import { sendOrderConfirmation, sendOrderStatusUpdate, sendWelcomeEmail, sendPasswordResetEmail } from './services/emailService.ts';
import compression from 'compression';
import { logAudit } from './utils/auditLogger.ts';
import publicRoutes from './routes/publicRoutes.ts';

export {};

function deepSanitize(obj: any): void {
  if (Array.isArray(obj)) {
    obj.forEach(deepSanitize);
  } else if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        deepSanitize(obj[key]);
      }
    });
  }
}
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

/**
 * CORS configuration with strict origin allowlist.
 * Expected env:
 * - FRONTEND_URL: comma-separated origins (e.g. "https://shop.com,https://admin.shop.com")
 * - ALLOWED_ORIGINS (optional): additional comma-separated origins
 *
 * If no origins are provided, we default to [] (reject unknown origins).
 */
const allowedOrigins = (() => {
  const frontend = (process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean);
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const defaults = process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'] : [];
  return Array.from(new Set([...frontend, ...extra, ...defaults]));
})();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser requests (no Origin header)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: process.env.AUTH_CREDENTIALS === 'true',
  maxAge: 86400,
}));

// Compression middleware
app.use(compression());

// Cookie parser middleware
app.use(cookieParser());

// Request size limits for security
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization & NoSQL Injection Protection
app.use((req, res, next) => {
  if (req.body) deepSanitize(req.body);
  if (req.query) deepSanitize(req.query);
  if (req.params) deepSanitize(req.params);
  if (req.headers) deepSanitize(req.headers);
  next();
});

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

// Logging
app.use(morgan('combined'));

import authRoutes from './routes/authRoutes.ts';
import wishlistRoutes from './routes/wishlistRoutes.ts';
import { hashAdminPassword } from './config/adminConfig.ts';

export async function initAppForRuntime(): Promise<void> {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const JWT_SECRET = process.env.JWT_SECRET;
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !JWT_SECRET || !MONGODB_URI) {
    throw new Error('SECURITY ERROR: ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET, and MONGODB_URI must be set in environment variables');
  }

  if (JWT_SECRET.length < 32) {
    throw new Error('SECURITY ERROR: JWT_SECRET must be at least 32 characters');
  }

  if (ADMIN_PASSWORD.length < 12) {
    throw new Error('SECURITY ERROR: ADMIN_PASSWORD must be at least 12 characters');
  }

  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('SECURITY ERROR: MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  connectDB();
  await hashAdminPassword();
}

// Health check endpoint
app.get('/', (_req: Request, res: Response) => {
  res.send('Backend is running');
});

app.get('/health', async (_req: Request, res: Response) => {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    checks: { database: 'unknown', smtp: 'unknown' },
  };

  try {
    health.checks.database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    if (health.checks.database === 'disconnected') health.status = 'degraded';
  } catch (err) {
    health.checks.database = 'error';
    health.status = 'unhealthy';
  }

  try {
    health.checks.smtp = process.env.SMTP_USER && process.env.SMTP_PASS ? 'configured' : 'not_configured';
    if (health.checks.smtp === 'not_configured') health.status = 'degraded';
  } catch (err) {
    health.checks.smtp = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/api/hello', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Express backend' });
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Trop de requêtes. Réessayez plus tard.',
  skip: (req) => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
});


app.use('/api/', apiLimiter);
app.use('/api/admin', apiLimiter);

// Mount Auth Routes
app.use('/api/auth', authRoutes);

// Mount Wishlist Routes
app.use('/api/wishlist', wishlistRoutes);

/// Mount Public Routes
app.use('/api', publicRoutes);

// Admin protected routes
app.use('/api/admin', adminRoutes);

function startServer() {
  // Always initialize the database, even during Jest tests
  connectDB();

  // Avoid open handles / side effects during Jest
  if (process.env.NODE_ENV === 'test') return;

  // Admin config constants - NO DEFAULTS FOR SECURITY
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const JWT_SECRET = process.env.JWT_SECRET;
  const MONGODB_URI = process.env.MONGODB_URI;

  // Validate critical environment variables
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !JWT_SECRET || !MONGODB_URI) {
    console.error('SECURITY ERROR: ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET, and MONGODB_URI must be set in environment variables');
    process.exit(1);
  }

  if (JWT_SECRET.length < 32) {
    console.error('SECURITY ERROR: JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 12) {
    console.error('SECURITY ERROR: ADMIN_PASSWORD must be at least 12 characters');
    process.exit(1);
  }

  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    console.error('SECURITY ERROR: MONGODB_URI must start with mongodb:// or mongodb+srv://');
    process.exit(1);
  }

  hashAdminPassword()
    .then(() => {
      const server = app.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
        if ((app as any)._router) {
          console.log('MIDDLEWARES:', (app as any)._router.stack.map((r: any) => r.name || (r.handle && r.handle.name) || 'anonymous'));
        }
      });

      const handleShutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}. Gracefully shutting down...`);
        server.close(async () => {
          await closeDBConnection();
          process.exit(0);
        });
      };

      process.on('SIGINT', () => handleShutdown('SIGINT'));
      process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    })
    .catch((err) => {
      console.error('Failed to hash admin password:', err);
      process.exit(1);
    });
}

// Start server on runtime entry only (keeps import safe for tests)
startServer();

export default app;
