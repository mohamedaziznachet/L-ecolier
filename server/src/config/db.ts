// src/config/db.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PRIMARY_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0';
const RETRY_INTERVAL_MS = 5000;
let isListenersRegistered = false;

/**
 * Determine candidate URIs to try (primary + automatic local/docker fallback).
 */
function getCandidateURIs(uri: string): string[] {
  const uris = [uri];
  if (uri.includes('://mongo:')) {
    // If set to Docker hostname 'mongo', add 127.0.0.1 fallback for host development
    uris.push(uri.replace('://mongo:', '://127.0.0.1:'));
  } else if (uri.includes('://127.0.0.1:') || uri.includes('://localhost:')) {
    // If set to localhost/127.0.0.1, add 'mongo' fallback for Docker container runtime
    uris.push(uri.replace('://127.0.0.1:', '://mongo:').replace('://localhost:', '://mongo:'));
  }
  return Array.from(new Set(uris));
}

/**
 * Register global Mongoose connection lifecycle listeners.
 */
function registerConnectionListeners(): void {
  if (isListenersRegistered) return;
  isListenersRegistered = true;

  mongoose.connection.on('connected', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('🟢 MongoDB Connection Event: Connected');
    }
  });

  mongoose.connection.on('error', (err) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error('🔴 MongoDB Connection Error:', err.message);
    }
  });

  mongoose.connection.on('disconnected', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('🟡 MongoDB Connection Event: Disconnected');
    }
  });

  mongoose.connection.on('reconnected', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log('🟢 MongoDB Connection Event: Reconnected');
    }
  });
}

/**
 * Attempt a single connection across candidate URIs.
 * Returns true on success, false on failure.
 */
async function attemptConnect(): Promise<boolean> {
  registerConnectionListeners();

  const candidates = getCandidateURIs(PRIMARY_URI);

  for (const targetUri of candidates) {
    const isAtlas = targetUri.includes('mongodb+srv://');

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
      await mongoose.connect(targetUri, connectionOptions);
      if (process.env.NODE_ENV !== 'test') {
        console.log(`✅ Connected to MongoDB ${isAtlas ? 'Atlas' : 'Instance'}: ${targetUri}`);
      }
      return true;
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`⚠️ Connection attempt failed for ${targetUri}: ${err.message}`);
      }
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`❌ All MongoDB connection attempts failed. Will retry in ${RETRY_INTERVAL_MS / 1000}s...`);
  }
  return false;
}

/**
 * Connect to MongoDB with automatic retry loop.
 */
export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) return; // already connected or connecting

  const ok = await attemptConnect();

  if (!ok) {
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

/**
 * Gracefully close the MongoDB connection.
 */
export async function closeDBConnection(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    if (process.env.NODE_ENV !== 'test') {
      console.log('🛑 MongoDB connection gracefully closed.');
    }
  }
}
