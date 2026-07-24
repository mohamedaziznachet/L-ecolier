// src/server/authMiddleware.ts
import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './jwtTokens.ts';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token = req.cookies?.jwt;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authentication token' });
    return;
  }
  
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token invalide ou expiré.', code: 'TOKEN_EXPIRED' });
    return;
  }
  req.user = payload;
  next();
}

export function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  let token = req.cookies?.jwt;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authentication token' });
    return;
  }
  
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token invalide ou expiré.', code: 'TOKEN_EXPIRED' });
    return;
  }
  if (payload.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  req.user = payload;
  next();
}
