import bcrypt from 'bcrypt';

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export let adminPasswordHash = '';

export async function hashAdminPassword(): Promise<void> {
  if (!ADMIN_PASSWORD) {
    throw new Error('SECURITY ERROR: ADMIN_PASSWORD must be set in environment variables');
  }

  try {
    adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    if (process.env.NODE_ENV !== 'test') console.log('Admin password hashed successfully');
  } catch (err) {
    console.error('Failed to hash admin password:', err);
    throw err;
  }
}
