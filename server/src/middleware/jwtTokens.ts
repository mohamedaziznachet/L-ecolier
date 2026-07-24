// server/src/middleware/jwtTokens.ts
// JWT Token Management with Refresh Token Rotation
// Provides secure access + refresh token pair generation and verification

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RefreshTokenModel } from '../models/index.ts';

const JWT_SECRET: string = process.env.JWT_SECRET || '';
const ACCESS_TOKEN_EXPIRY = '15m';   // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d';   // Long-lived refresh token

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

export interface TokenPayload {
  userId?: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  tokenFamily?: string;
  tokenVersion?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate an access token (short-lived, 15 minutes)
 */
export function generateAccessToken(payload: { userId?: string; email: string; role: string }): string {
  return jwt.sign(
    { ...payload, type: 'access' } as TokenPayload,
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate a refresh token (long-lived, 7 days) and store it
 */
export async function generateRefreshToken(payload: { userId?: string; email: string; role: string }): Promise<string> {
  const tokenFamily = crypto.randomBytes(16).toString('hex');
  const tokenVersion = 1;
  
  const refreshPayload: TokenPayload = {
    ...payload,
    type: 'refresh',
    tokenFamily,
    tokenVersion,
  };
  
  const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  await RefreshTokenModel.create({
    tokenHash: hash,
    userId: payload.userId || 'unknown',
    email: payload.email,
    role: payload.role,
    family: tokenFamily,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  return refreshToken;
}

/**
 * Generate a full token pair (access + refresh)
 */
export async function generateTokenPair(payload: { userId?: string; email: string; role: string }): Promise<TokenPair> {
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload);
  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Verify an access token and return the decoded payload
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (decoded.type !== 'access') return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token and return the decoded payload
 * Also performs token rotation (old token is invalidated, new pair is issued)
 */
export async function verifyAndRotateRefreshToken(token: string): Promise<{ valid: boolean; newTokenPair?: TokenPair; payload?: TokenPayload }> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    if (decoded.type !== 'refresh') {
      return { valid: false };
    }
    
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const storedData = await RefreshTokenModel.findOne({ tokenHash: hash });
    
    if (!storedData) {
      console.warn(`[SECURITY] Refresh token reuse detected for user ${decoded.email}. Invalidating token family.`);
      if (decoded.tokenFamily) {
        await invalidateTokenFamily(decoded.tokenFamily);
      }
      return { valid: false };
    }
    
    if (storedData.expiresAt < new Date()) {
      await RefreshTokenModel.deleteOne({ tokenHash: hash });
      return { valid: false };
    }
    
    await RefreshTokenModel.deleteOne({ tokenHash: hash });
    
    const newPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    
    const newTokenPair = await generateTokenPair(newPayload);
    
    return {
      valid: true,
      newTokenPair,
      payload: decoded,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Revoke a specific refresh token
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await RefreshTokenModel.deleteOne({ tokenHash: hash });
}

/**
 * Invalidate all tokens in a family (used when token theft is detected)
 */
export async function invalidateTokenFamily(family: string): Promise<void> {
  await RefreshTokenModel.deleteMany({ family });
}

/**
 * Revoke all refresh tokens for a given user
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await RefreshTokenModel.deleteMany({ userId });
}

/**
 * Middleware to authenticate using access token
 */
import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token d\'authentification manquant.' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    res.status(401).json({ error: 'Token invalide ou expiré.', code: 'TOKEN_EXPIRED' });
    return;
  }
  
  req.user = payload;
  next();
}

export default {
  generateTokenPair,
  verifyAccessToken,
  verifyAndRotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  authenticateToken,
};