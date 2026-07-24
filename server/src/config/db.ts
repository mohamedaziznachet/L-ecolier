// src/server/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolier';
const RETRY_INTERVAL_MS = 5000;

/**
 * Attempt a single connection. Returns true on success, false on failure.
 * Does NOT call process.exit so the HTTP server stays alive even when
 * MongoDB is temporarily unavailable.
 */
async function attemptConnect(): Promise<boolean> {
  const isAtlas = MONGODB_URI.includes('mongodb+srv://');

  const connectionOptions: mongoose.ConnectOptions = {
    minPoolSize: 2,
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    ...(isAtlas
      ? {
          ssl: true,
          tls: true,
          tlsAllowInvalidCertificates: false,
          retryWrites: true,
          w: 'majority' as const,
        }
      : {}),
  };

  try {
    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log(`✅  Connected to MongoDB ${isAtlas ? 'Atlas' : 'Local'}: ${MONGODB_URI}`);
    return true;
  } catch (err: any) {
    console.error(`⚠️  MongoDB connection failed (will retry in ${RETRY_INTERVAL_MS / 1000}s): ${err.message}`);
    return false;
  }
}

/**
 * Connect to MongoDB.  If the first attempt fails the server keeps running
 * and a background loop retries every RETRY_INTERVAL_MS milliseconds.
 */
export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return; // already connected

  const ok = await attemptConnect();

  if (!ok) {
    // Schedule retries without blocking the server from starting
    const interval = setInterval(async () => {
      if (mongoose.connection.readyState >= 1) {
        clearInterval(interval);
        return;
      }
      const connected = await attemptConnect();
      if (connected) clearInterval(interval);
    }, RETRY_INTERVAL_MS);
  }
}

