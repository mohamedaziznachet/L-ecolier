// server/src/repositories/auditRepository.ts
import { AuditLogModel } from '../models/index.ts';

export interface AuditEntry {
  timestamp: string;
  action: string;
  entity: string;
  entityId?: string;
  user?: string;
  role?: string;
  success: boolean;
  details?: string;
}

export async function appendAuditEntry(entry: Omit<AuditEntry, 'timestamp'>) {
  try {
    const doc = new AuditLogModel({
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      user: entry.user,
      role: entry.role,
      success: entry.success,
      details: entry.details,
    });
    await doc.save();
  } catch (err) {
    console.error('[AuditRepository] Failed to save audit log entry to MongoDB:', err);
  }
}

export async function getAuditEntries(limit = 50): Promise<AuditEntry[]> {
  try {
    const docs = await AuditLogModel.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return docs.map((doc: any) => ({
      timestamp: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
      action: doc.action,
      entity: doc.entity,
      entityId: doc.entityId,
      user: doc.user,
      role: doc.role,
      success: doc.success,
      details: doc.details,
    }));
  } catch (err) {
    console.error('[AuditRepository] Failed to fetch audit log entries from MongoDB:', err);
    return [];
  }
}
