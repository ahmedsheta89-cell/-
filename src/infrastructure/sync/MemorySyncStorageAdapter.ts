/**
 * @file MemorySyncStorageAdapter.ts
 * @module infrastructure/sync
 * @description In-memory implementation of ISyncStorageAdapter for Phase 8C testing, crash simulation, and offline execution.
 */

import {
  ISyncStorageAdapter,
  OutboxRecord,
  InboxRecord,
  SyncCursor,
  SyncConflictRecord,
  OutboxStatus,
  ConflictStatus,
} from '../../domain/sync/types.ts';

export class MemorySyncStorageAdapter implements ISyncStorageAdapter {
  private outbox = new Map<string, OutboxRecord>();
  private inbox = new Map<string, InboxRecord>();
  private cursors = new Map<string, SyncCursor>();
  private conflicts = new Map<string, SyncConflictRecord>();

  private simulateCrashOnNextWrite = false;
  private simulateUnavailable = false;

  public async init(): Promise<void> {
    if (this.simulateUnavailable) {
      throw new Error('Storage adapter unavailable.');
    }
  }

  public async close(): Promise<void> {
    // No-op for in-memory adapter
  }

  // --- Fault Injection for Testing ---
  public setSimulateCrashOnNextWrite(val: boolean): void {
    this.simulateCrashOnNextWrite = val;
  }

  public setSimulateUnavailable(val: boolean): void {
    this.simulateUnavailable = val;
  }

  private checkFailure(): void {
    if (this.simulateUnavailable) {
      throw new Error('Storage adapter unavailable.');
    }
    if (this.simulateCrashOnNextWrite) {
      this.simulateCrashOnNextWrite = false;
      throw new Error('Simulated crash during sync storage write.');
    }
  }

  // --- Outbox ---
  public async saveOutboxRecord(record: OutboxRecord): Promise<void> {
    this.checkFailure();
    this.outbox.set(record.outboxId, { ...record });
  }

  public async getOutboxRecord(outboxId: string): Promise<OutboxRecord | null> {
    const item = this.outbox.get(outboxId);
    return item ? { ...item } : null;
  }

  public async getOutboxRecordByEventId(eventId: string): Promise<OutboxRecord | null> {
    for (const record of this.outbox.values()) {
      if (record.eventId === eventId) {
        return { ...record };
      }
    }
    return null;
  }

  public async getPendingOutbox(studentId: string, limit?: number): Promise<OutboxRecord[]> {
    const records = Array.from(this.outbox.values())
      .filter((r) => r.studentId === studentId && (r.status === OutboxStatus.PENDING || r.status === OutboxStatus.IN_FLIGHT))
      .sort((a, b) => a.createdAt - b.createdAt);

    return limit ? records.slice(0, limit) : records;
  }

  public async getAllOutbox(studentId: string): Promise<OutboxRecord[]> {
    return Array.from(this.outbox.values())
      .filter((r) => r.studentId === studentId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  public async updateOutboxStatus(
    outboxId: string,
    status: OutboxStatus,
    details?: { attemptCount?: number; lastAttemptAt?: number; rejectionReason?: string; permanentRejection?: boolean }
  ): Promise<void> {
    this.checkFailure();
    const existing = this.outbox.get(outboxId);
    if (!existing) {
      throw new Error(`Outbox record '${outboxId}' not found.`);
    }

    const updated: OutboxRecord = {
      ...existing,
      status,
      attemptCount: details?.attemptCount ?? existing.attemptCount,
      lastAttemptAt: details?.lastAttemptAt ?? existing.lastAttemptAt,
      rejectionReason:
        details && 'rejectionReason' in details ? details.rejectionReason : existing.rejectionReason,
      permanentRejection:
        details && 'permanentRejection' in details ? details.permanentRejection : existing.permanentRejection,
    };

    this.outbox.set(outboxId, updated);
  }

  public async getOutboxCount(studentId: string, status?: OutboxStatus): Promise<number> {
    let count = 0;
    for (const r of this.outbox.values()) {
      if (r.studentId === studentId) {
        if (!status || r.status === status) {
          count++;
        }
      }
    }
    return count;
  }

  public async deleteOutboxRecord(outboxId: string): Promise<void> {
    this.checkFailure();
    this.outbox.delete(outboxId);
  }

  public async clearOutbox(studentId: string): Promise<void> {
    for (const [id, r] of this.outbox.entries()) {
      if (r.studentId === studentId) {
        this.outbox.delete(id);
      }
    }
  }

  // --- Inbox ---
  public async saveInboxRecord(record: InboxRecord): Promise<void> {
    this.checkFailure();
    this.inbox.set(record.syncEventId, { ...record });
  }

  public async getInboxRecord(syncEventId: string): Promise<InboxRecord | null> {
    const item = this.inbox.get(syncEventId);
    return item ? { ...item } : null;
  }

  public async getInboxRecordByEventId(studentId: string, eventId: string): Promise<InboxRecord | null> {
    for (const r of this.inbox.values()) {
      if (r.studentId === studentId && r.eventId === eventId) {
        return { ...r };
      }
    }
    return null;
  }

  public async hasEventBeenProcessed(studentId: string, eventId: string): Promise<boolean> {
    for (const r of this.inbox.values()) {
      if (r.studentId === studentId && r.eventId === eventId) {
        return true;
      }
    }
    return false;
  }

  public async getInboxRecords(studentId: string): Promise<InboxRecord[]> {
    return Array.from(this.inbox.values())
      .filter((r) => r.studentId === studentId)
      .sort((a, b) => a.processedAt - b.processedAt);
  }

  public async clearInbox(studentId: string): Promise<void> {
    for (const [id, r] of this.inbox.entries()) {
      if (r.studentId === studentId) {
        this.inbox.delete(id);
      }
    }
  }

  // --- Cursors ---
  public async saveCursor(cursor: SyncCursor): Promise<void> {
    this.checkFailure();
    this.cursors.set(cursor.studentId, { ...cursor });
  }

  public async getCursor(studentId: string): Promise<SyncCursor | null> {
    const c = this.cursors.get(studentId);
    return c ? { ...c } : null;
  }

  public async deleteCursor(studentId: string): Promise<void> {
    this.checkFailure();
    this.cursors.delete(studentId);
  }

  // --- Conflicts ---
  public async saveConflict(conflict: SyncConflictRecord): Promise<void> {
    this.checkFailure();
    this.conflicts.set(conflict.conflictId, { ...conflict });
  }

  public async getConflicts(studentId: string, status?: ConflictStatus): Promise<SyncConflictRecord[]> {
    return Array.from(this.conflicts.values())
      .filter((c) => c.studentId === studentId && (!status || c.status === status))
      .sort((a, b) => a.detectedAt - b.detectedAt);
  }

  public async getConflict(conflictId: string): Promise<SyncConflictRecord | null> {
    const c = this.conflicts.get(conflictId);
    return c ? { ...c } : null;
  }

  public async updateConflictStatus(conflictId: string, status: ConflictStatus): Promise<void> {
    this.checkFailure();
    const existing = this.conflicts.get(conflictId);
    if (existing) {
      this.conflicts.set(conflictId, { ...existing, status });
    }
  }

  public async clearConflicts(studentId: string): Promise<void> {
    for (const [id, c] of this.conflicts.entries()) {
      if (c.studentId === studentId) {
        this.conflicts.delete(id);
      }
    }
  }

  // --- Global Clear ---
  public async clearAll(studentId?: string): Promise<void> {
    if (studentId) {
      await this.clearOutbox(studentId);
      await this.clearInbox(studentId);
      await this.deleteCursor(studentId);
      await this.clearConflicts(studentId);
    } else {
      this.outbox.clear();
      this.inbox.clear();
      this.cursors.clear();
      this.conflicts.clear();
    }
  }
}
