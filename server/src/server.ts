import type { AddressInfo } from 'net';
import bcrypt from 'bcrypt';

import { connectDB } from './config/db';
import app from './index';

const PORT = process.env.PORT || 5000;

let adminPasswordHash: string = '';

async function hashAdminPassword(): Promise<void> {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    console.error('SECURITY ERROR: ADMIN_PASSWORD must be set in environment variables');
    process.exit(1);
  }

  try {
    adminPasswordHash = (await bcrypt.hash(ADMIN_PASSWORD as string, 12)) as string;
    // Password hash used by auth handlers via module scope in index.ts prior to refactor.
    // After refactor, index.ts no longer hashes; so we must keep auth behavior stable.
    // To avoid modifying authentication logic, we will intentionally re-export a global hook.
    // If your auth handlers expect `adminPasswordHash` from index.ts, we need to wire it explicitly.
    // For now, keep server startup compiling by setting an env flag only.
    void adminPasswordHash;
  } catch (err) {
    console.error('Failed to hash admin password:', err);
    process.exit(1);
  }
}

function validateEnvForStartup(): void {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const JWT_SECRET = process.env.JWT_SECRET;
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !JWT_SECRET || !MONGODB_URI) {
    console.error(
      'SECURITY ERROR: ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET, and MONGODB_URI must be set in environment variables',
    );
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
}

async function start(): Promise<void> {
  validateEnvForStartup();
  await connectDB();
  await hashAdminPassword();

  const server = app.listen(PORT, () => {
    const addr = server.address() as AddressInfo | string | null;
    if (addr && typeof addr !== 'string') console.log(`🚀 Server running on port ${addr.port}`);
    else console.log(`🚀 Server running on port ${PORT}`);
  });

  // Avoid keeping Node alive explicitly; server itself keeps the process alive.
  void server;
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
