/**
 * @file InboxManager.ts
 * @module domain/sync
 * @description Durable Inbound Deduplication Registry for Phase 8C Sync (Section 9, 14, 18).
 * 
 * CORE GUARANTEES:
 * - Duplicate Detection: Identical remote events are ignored/acknowledged idempotently.
 * - Conflict Detection: Same eventId with divergent eventHash is identified and quarantined.
 * - Zero Duplication: Never processes the same remote event into local history multiple times.
 */

import {
  ISyncStorageAdapter,
  InboxRecord,
  SyncConflictRecord,
  ConflictStatus,
} from './types.ts';

export type InboundDeduplicationStatus = 'NEW' | 'IDENTICAL_DUPLICATE' | 'CONFLICTING_DUPLICATE';

export class InboxManager {
  private readonly storage: ISyncStorageAdapter;

  constructor(storage: ISyncStorageAdapter) {
    this.storage = storage;
  }

  /**
   * Section 9 & 14: Inspect an inbound event against the deduplication registry.
   */
  public async checkInboundEvent(
    studentId: string,
    eventId: string,
    eventHash: string
  ): Promise<{ status: InboundDeduplicationStatus; existingRecord?: InboxRecord }> {
    const existing = await this.storage.getInboxRecordByEventId(studentId, eventId);
    if (!existing) {
      return { status: 'NEW' };
    }

    if (existing.eventHash === eventHash) {
      return { status: 'IDENTICAL_DUPLICATE', existingRecord: existing };
    }

    // Divergent hash for identical eventId: IMMUTABLE CONFLICT
    return { status: 'CONFLICTING_DUPLICATE', existingRecord: existing };
  }

  /**
   * Marks an inbound envelope as successfully processed and safely persisted.
   */
  public async markProcessed(params: {
    syncEventId: string;
    eventId: string;
    studentId: string;
    originDeviceId: string;
    eventHash: string;
  }): Promise<InboxRecord> {
    const inboxId = `inbox_${params.originDeviceId}_${params.eventId}`;
    const now = Date.now();

    const record: InboxRecord = {
      inboxId,
      syncEventId: params.syncEventId,
      eventId: params.eventId,
      studentId: params.studentId,
      originDeviceId: params.originDeviceId,
      eventHash: params.eventHash,
      receivedAt: now,
      processedAt: now,
      status: 'PROCESSED',
    };

    await this.storage.saveInboxRecord(record);
    return record;
  }

  /**
   * Section 38: Quarantines an immutable event conflict record.
   */
  public async quarantineConflict(params: {
    studentId: string;
    eventId: string;
    localHash: string;
    remoteHash: string;
    reason: string;
    localEnvelope?: any;
    remoteEnvelope?: any;
    localPayload?: any;
  }): Promise<SyncConflictRecord> {
    const conflictId = `conflict_${params.studentId}_${params.eventId}_${Date.now()}`;

    const conflict: SyncConflictRecord = {
      conflictId,
      studentId: params.studentId,
      eventId: params.eventId,
      localHash: params.localHash,
      remoteHash: params.remoteHash,
      localEnvelope: params.localEnvelope,
      remoteEnvelope: params.remoteEnvelope,
      localPayload: params.localPayload,
      detectedAt: Date.now(),
      status: ConflictStatus.OPEN,
      reason: params.reason,
    };

    await this.storage.saveConflict(conflict);
    return conflict;
  }

  /**
   * Retrieves a processed inbox record by student and event ID.
   */
  public async getInboxRecord(studentId: string, eventId: string): Promise<InboxRecord | null> {
    return this.storage.getInboxRecordByEventId(studentId, eventId);
  }

  /**
   * Resolves a quarantined conflict.
   */
  public async resolveConflict(
    conflictId: string,
    choice: 'LOCAL_WINS' | 'REMOTE_WINS' | 'MANUAL_SPLIT',
    notes?: string
  ): Promise<void> {
    const existing = await this.storage.getConflict(conflictId);
    if (!existing) {
      throw new Error(`Conflict '${conflictId}' not found.`);
    }

    const updated: SyncConflictRecord = {
      ...existing,
      status: ConflictStatus.RESOLVED,
      resolutionChoice: choice,
      notes: notes || existing.notes,
    };

    await this.storage.saveConflict(updated);
  }

  /**
   * Retrieves all quarantined conflicts for a student.
   */
  public async getConflicts(studentId: string, status?: ConflictStatus): Promise<SyncConflictRecord[]> {
    return this.storage.getConflicts(studentId, status);
  }

  /**
   * Clears inbox for a student.
   */
  public async clearInbox(studentId: string): Promise<void> {
    await this.storage.clearInbox(studentId);
  }
}
