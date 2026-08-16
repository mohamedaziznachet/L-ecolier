// server/src/middleware/admin2fa.ts
// Admin Two-Factor Authentication (2FA) using industry-standard node-2fa
// Implements time-based one-time passwords compatible with Google Authenticator / Authy

import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import * as twofactor from "node-2fa";
import { Admin2FAModel, Pending2FAModel } from "../models/index.ts";

const BACKUP_CODES_COUNT = 8;
const BACKUP_CODE_LENGTH = 10;

/**
 * Generate a TOTP-compatible secret (base32 encoded)
 */
export function generateSecret(): string {
  const key = (twofactor as any).generateKey({ name: "Admin", issuer: "L'Écolier" });
  return key.secret;
}

/**
 * Generate backup codes for account recovery
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const code = crypto
      .randomBytes(BACKUP_CODE_LENGTH)
      .toString("hex")
      .toUpperCase()
      .substring(0, BACKUP_CODE_LENGTH);
    codes.push(code);
  }
  return codes;
}

/**
 * Generate a TOTP code from a secret
 */
export function generateTOTP(
  secret: string,
  timestamp: number = Date.now(),
): string {
  const tokenObj = (twofactor as any).generateToken(secret);
  return tokenObj ? tokenObj.token : "";
}

/**
 * Verify a TOTP code with a small window for clock drift
 */
export function verifyTOTP(secret: string, code: string): boolean {
  try {
    const result = (twofactor as any).verifyToken(secret, code, 1);
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(email: string, code: string): Promise<boolean> {
  const data = await Admin2FAModel.findOne({ email });
  if (!data) return false;

  const index = data.backupCodes.indexOf(code.toUpperCase());
  if (index === -1) return false;

  // Remove used backup code
  data.backupCodes.splice(index, 1);
  await Admin2FAModel.updateOne({ email }, { backupCodes: data.backupCodes });
  return true;
}

/**
 * Enable 2FA for an admin user
 */
export async function enable2FA(email: string): Promise<{
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}> {
  const key = (twofactor as any).generateKey({ name: email, issuer: "L'Écolier Admin" });
  const secret = key.secret;
  const backupCodes = generateBackupCodes();

  await Admin2FAModel.findOneAndUpdate(
    { email },
    { secret, backupCodes, enabled: true, verified: false },
    { upsert: true, new: true }
  );

  // Generate otpauth URL for QR code
  const issuer = encodeURIComponent("L'Écolier Admin");
  const account = encodeURIComponent(email);
  const qrCodeUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

  return { secret, qrCodeUrl, backupCodes };
}

/**
 * Disable 2FA for an admin user
 */
export async function disable2FA(email: string): Promise<boolean> {
  const result = await Admin2FAModel.deleteOne({ email });
  return result.deletedCount > 0;
}

/**
 * Get 2FA secret for a user
 */
export async function get2FASecret(email: string): Promise<string | null> {
  const data = await Admin2FAModel.findOne({ email });
  return data ? data.secret : null;
}

export async function is2FAEnabled(email: string): Promise<boolean> {
  const data = await Admin2FAModel.findOne({ email });
  return data ? data.enabled : false;
}

/**
 * Create a temporary token for 2FA verification during login
 */
export async function createPending2FAToken(email: string): Promise<string> {
  const tempToken = crypto.randomBytes(32).toString("hex");

  await Pending2FAModel.create({
    tempToken,
    email,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
  });

  return tempToken;
}

/**
 * Verify a pending 2FA token and get the associated email
 */
export async function verifyPending2FAToken(tempToken: string): Promise<string | null> {
  const data = await Pending2FAModel.findOne({ tempToken });

  if (!data || data.expiresAt < new Date()) {
    if (data) await Pending2FAModel.deleteOne({ tempToken });
    return null;
  }

  await Pending2FAModel.deleteOne({ tempToken });
  return data.email;
}

/**
 * Middleware to check if 2FA is required for admin login
 */
export async function require2FACheck(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email requis." });
    return;
  }

  if (await is2FAEnabled(email)) {
    // Generate a temporary token for 2FA verification
    const tempToken = await createPending2FAToken(email);
    res.json({
      require2FA: true,
      tempToken,
      message:
        "Code 2FA requis. Veuillez saisir le code de votre application d'authentification.",
    });
    return;
  }

  // 2FA not required, proceed
  next();
}

/**
 * Middleware to verify 2FA code
 */
export async function verify2FACode(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { tempToken, code } = req.body;

  if (!tempToken || !code) {
    res.status(400).json({ error: "Token temporaire et code requis." });
    return;
  }

  const email = await verifyPending2FAToken(tempToken);
  if (!email) {
    res
      .status(400)
      .json({ error: "Session 2FA expirée. Veuillez vous reconnecter." });
    return;
  }

  const data = await Admin2FAModel.findOne({ email });
  if (!data) {
    res.status(400).json({ error: "2FA non configuré pour cet utilisateur." });
    return;
  }

  // Try TOTP code first
  if (verifyTOTP(data.secret, code)) {
    req.body.email = email; // Pass email to next handler
    return next();
  }

  // Try backup code
  if (await verifyBackupCode(email, code)) {
    req.body.email = email;
    return next();
  }

  res.status(401).json({ error: "Code 2FA invalide." });
}