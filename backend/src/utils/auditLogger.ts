// src/server/auditLogger.ts
import { appendAuditEntry } from '../repositories/auditRepository.ts';

export interface AuditLogData {
  action: string;
  userId?: string;
  userEmail?: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  success: boolean;
  errorMessage?: string;
}

export function logAudit(data: AuditLogData): void {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[Audit] ${data.action} - Success: ${data.success} - ${data.userEmail || data.userId || 'unknown'}`);
  }

  // Append entry to database audit log JSON for admin visibility
  appendAuditEntry({
    action: data.action,
    entity: 'auth',
    entityId: data.userId || '',
    user: data.userEmail || 'unknown',
    role: data.role || 'client',
    success: data.success,
    details: JSON.stringify({
      ip: data.ip,
      errorMessage: data.errorMessage,
      details: data.details
    })
  }).catch(err => console.error('[Audit] Failed to append entry:', err));
}

export default logAudit;
