import express from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import { UserModel } from '../models/index.ts';
import { generateTokenPair, verifyAndRotateRefreshToken, revokeRefreshToken } from '../middleware/jwtTokens.ts';
import { authenticateAdmin, authenticate } from '../middleware/auth.ts';
import { is2FAEnabled, createPending2FAToken, enable2FA, disable2FA } from '../middleware/admin2fa.ts';
import { sendPasswordResetEmail } from '../services/emailService.ts';
import { logAudit } from '../utils/auditLogger.ts';
import { ADMIN_EMAIL, adminPasswordHash } from '../config/adminConfig.ts';

const router = express.Router();

// Memory store for admin account lockout (resets on server restart)
const adminLockoutStore = {
  failedAttempts: 0,
  lockUntil: null as Date | null
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    console.log(`[RATE LIMIT] Login attempt blocked for IP: ${req.ip}`);
    res.status(429).json({ error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." });
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    console.log(`[RATE LIMIT] Registration attempt blocked for IP: ${req.ip}`);
    res.status(429).json({ error: "Trop de tentatives d'inscription. Réessayez dans 1 heure." });
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Auth Login (Supports both Admin and User, with Admin 2FA and JWT Refresh Tokens)
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, code, tempToken } = req.body;

  // 1. Admin Login Flow
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    if (adminLockoutStore.lockUntil && adminLockoutStore.lockUntil > new Date()) {
      logAudit({ action: 'LOGIN_ATTEMPT_BLOCKED', userEmail: email, ip: req.ip, userAgent: req.get('user-agent'), success: false, errorMessage: 'Admin account is temporarily locked' });
      return res.status(403).json({ error: 'Le compte administrateur est temporairement verrouillé. Réessayez dans 30 minutes.' });
    }

    if (await bcrypt.compare(password, adminPasswordHash)) {
      adminLockoutStore.failedAttempts = 0;
      adminLockoutStore.lockUntil = null;

      // Check if 2FA is enabled for admin
      if (await is2FAEnabled(email)) {
        if (!code) {
          // 2FA is required but code not provided yet
          const pendingToken = await createPending2FAToken(email);
          return res.json({
            require2FA: true,
            tempToken: pendingToken,
            message: 'Code 2FA requis. Veuillez saisir le code de votre application d\'authentification.',
          });
        }
        
        // Code is provided, verify it
        const { verifyBackupCode, get2FASecret } = await import('../middleware/admin2fa.ts');
        const secret = await get2FASecret(email);
        
        if (!secret) {
          return res.status(400).json({ error: '2FA non configuré pour cet utilisateur.' });
        }
        
        const { verifyTOTP } = await import('../middleware/admin2fa.ts');
        const isTotpValid = verifyTOTP(secret, code);
        const isBackupValid = await verifyBackupCode(email, code);
        
        if (!isTotpValid && !isBackupValid) {
          return res.status(401).json({ error: 'Code 2FA invalide.' });
        }
      }
      
      const tokens = await generateTokenPair({ email, role: 'admin' });
      logAudit({ action: 'ADMIN_LOGIN', userEmail: email, role: 'admin', ip: req.ip, userAgent: req.get('user-agent'), success: true });
      
      const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const };
      res.cookie('jwt', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });
      
      return res.json({
        user: { id: 'admin-id', name: 'Administrateur', email: ADMIN_EMAIL, statut: 'admin' },
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } else {
      adminLockoutStore.failedAttempts += 1;
      if (adminLockoutStore.failedAttempts >= 5) {
        adminLockoutStore.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      logAudit({ action: 'LOGIN_FAILED', userEmail: email, ip: req.ip, userAgent: req.get('user-agent'), success: false, errorMessage: 'Incorrect admin password', details: { failedAttempts: adminLockoutStore.failedAttempts } });
      return res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect.' });
    }
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      logAudit({ action: 'LOGIN_FAILED', userEmail: email, ip: req.ip, userAgent: req.get('user-agent'), success: false, errorMessage: 'User not found' });
      return res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect.' });
    }

    if ((user as any).isBlocked) {
      logAudit({ action: 'LOGIN_ATTEMPT_BLOCKED', userId: user._id.toString(), userEmail: user.email, ip: req.ip, userAgent: req.get('user-agent'), success: false, errorMessage: 'User account is blocked' });
      return res.status(403).json({ error: 'Votre compte a été suspendu.' });
    }

    if (await user.comparePassword(password)) {
      await user.updateOne({ $unset: { failedLoginAttempts: 1, lockUntil: 1 } }).exec();
      const tokens = await generateTokenPair({ userId: user._id.toString(), email: user.email, role: user.statut || 'client' });
      logAudit({ action: 'LOGIN_SUCCESS', userId: user._id.toString(), userEmail: user.email, role: user.statut || 'client', ip: req.ip, userAgent: req.get('user-agent'), success: true });
      
      const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const };
      res.cookie('jwt', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });
      
      return res.json({
        user: { id: user._id.toString(), name: user.name, email: user.email, phone: user.phone || '', address: user.address || '', city: user.city || '', governorate: user.governorate || '', postalCode: user.postalCode || '', statut: user.statut || 'client' },
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } else {
      const updates: any = { $inc: { failedLoginAttempts: 1 } };
      if (user.failedLoginAttempts + 1 >= 5) updates.$set = { lockUntil: new Date(Date.now() + 30 * 60 * 1000) };
      await user.updateOne(updates).exec();
      logAudit({ action: 'LOGIN_FAILED', userId: user._id.toString(), userEmail: user.email, ip: req.ip, userAgent: req.get('user-agent'), success: false, errorMessage: 'Incorrect password', details: { failedAttempts: user.failedLoginAttempts + 1 } });
      return res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect.' });
    }
  } catch (err) {
    console.error('Login error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Login service failed';
    return res.status(500).json({ error: errorMessage });
  }
});

// Token Refresh Route (JWT Refresh Token Rotation)
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token manquant.' });
  }

  const result = await verifyAndRotateRefreshToken(refreshToken);
  if (!result.valid || !result.newTokenPair) {
    res.clearCookie('jwt');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return res.status(401).json({ error: 'Refresh token invalide ou expiré.' });
  }

  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const };
  res.cookie('jwt', result.newTokenPair.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', result.newTokenPair.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });

  return res.json({
    success: true,
    token: result.newTokenPair.accessToken,
    accessToken: result.newTokenPair.accessToken,
    refreshToken: result.newTokenPair.refreshToken,
  });
});

// Revoke Refresh Token Route (Logout)
router.post('/logout', async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  res.clearCookie('jwt');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  return res.json({ success: true });
});

// Setup 2FA Route (Admin only)
router.post('/setup-2fa', authenticateAdmin, async (req: Request, res: Response) => {
  const email = req.user?.email || ADMIN_EMAIL;
  const setupData = await enable2FA(email);
  return res.json(setupData);
});

// Disable 2FA Route (Admin only)
router.post('/disable-2fa', authenticateAdmin, async (req: Request, res: Response) => {
  const email = req.user?.email || ADMIN_EMAIL;
  const success = await disable2FA(email);
  return res.json({ success });
});

// Register User
router.post('/register', registerLimiter, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('governorate').optional().trim(),
  body('postalCode').optional().trim(),
], async (req: Request, res: Response): Promise<any> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password, phone, address, city, governorate, postalCode } = req.body;
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Un compte existe déjà avec cette adresse e-mail.' });

    // Force statut to 'client' for all registrations to prevent privilege escalation
    const newUser = new UserModel({ name, email: email.toLowerCase(), password, phone: phone || '', address: address || '', city: city || '', governorate: governorate || '', postalCode: postalCode || '', statut: 'client' });
    const saved = await newUser.save();
    const tokens = await generateTokenPair({ userId: saved._id.toString(), email: saved.email, role: 'client' });
    
    const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const };
    res.cookie('jwt', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });

    return res.status(201).json({
      user: { id: saved._id.toString(), name: saved.name, email: saved.email, phone: saved.phone || '', address: saved.address || '', city: saved.city || '', governorate: saved.governorate || '', postalCode: saved.postalCode || '', statut: 'client' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// Check if email exists
router.get('/check-email/:email', async (req: Request, res: Response) => {
  try {
    const existing = await UserModel.findOne({ email: (req.params.email as string).toLowerCase() });
    res.json({ exists: !!existing });
  } catch (err) {
    res.status(500).json({ error: 'Email lookup failed' });
  }
});

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email invalide')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: "Si l'adresse existe, un email a été envoyé." });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await sendPasswordResetEmail(user.email, token);
    logAudit({ action: 'FORGOT_PASSWORD', userId: user._id.toString(), userEmail: user.email, ip: req.ip, userAgent: req.get('user-agent'), success: true });

    return res.json({ success: true, message: "Si l'adresse existe, un email a été envoyé." });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Une erreur est survenue.' });
  }
});

// Reset Password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { token, email, password } = req.body;
    const user = await UserModel.findOne({ 
      email: email.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) return res.status(400).json({ error: 'Token invalide ou expiré.' });

    user.password = password;
    user.resetPasswordToken = '';
    user.resetPasswordExpires = null;
    await user.save();
    
    logAudit({ action: 'PASSWORD_RESET', userId: user._id.toString(), userEmail: user.email, ip: req.ip, userAgent: req.get('user-agent'), success: true });
    return res.json({ success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Une erreur est survenue.' });
  }
});

// Verify Email
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Token requis'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { token } = req.body;
    const user = await UserModel.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ error: 'Token de vérification invalide.' });
    if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) return res.status(400).json({ error: 'Token de vérification expiré.' });

    user.isVerified = true;
    user.verificationToken = '';
    user.verificationTokenExpires = null;
    await user.save();
    logAudit({ action: 'EMAIL_VERIFIED', userId: user._id.toString(), userEmail: user.email, ip: req.ip, userAgent: req.get('user-agent'), success: true });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend Verification Email
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Email invalide'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'Compte introuvable.' });
    if (user.isVerified) return res.status(400).json({ error: 'Email déjà vérifié.' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    console.log(`Verification token for ${email}: ${verificationToken}`);
    return res.json({ message: 'Email de vérification envoyé.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Update User Profile (Authenticated)
router.put('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('phone').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('governorate').optional().trim(),
  body('postalCode').optional().trim(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const requester = (req as any).user;
    if (!requester || !requester.userId) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    const { name, phone, address, city, governorate, postalCode } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (governorate !== undefined) updates.governorate = governorate;
    if (postalCode !== undefined) updates.postalCode = postalCode;

    const updatedUser = await UserModel.findByIdAndUpdate(requester.userId, { $set: updates }, { new: true }).lean();
    if (!updatedUser) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    return res.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        governorate: updatedUser.governorate,
        postalCode: updatedUser.postalCode,
        statut: updatedUser.statut,
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change User Password (Authenticated)
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const requester = (req as any).user;
    if (!requester || !requester.userId) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findById(requester.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;
