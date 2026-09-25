/**
 * @file OutboxManager.ts
 * @module domain/sync
 * @description Durable Outbox Manager ensuring at-least-once, idempotent delivery of learning events (Sections 7, 8, 20).
 * 
 * CORE GUARANTEES:
 * - Durable Survival: Survives page reload, crash, and offline periods.
 * - Single Logical Event: One logical event != multiple outbox records. Retries never create duplicates.
 * - Idempotent Enqueue: Re-enqueuing an existing eventId returns the existing record.
 * - Raw Audio Rejection: Strictly rejects payloads with raw audio before enqueueing.
 */

import { PersistentMemorizationEvent } from '../persistence/types.ts';
import {
  ISyncStorageAdapter,
  OutboxRecord,
  OutboxStatus,
  SyncEventEnvelope,
} from './types.ts';
import { SyncEnvelopeSerializer } from './SyncEnvelopeSerializer.ts';

export class OutboxManager {
  private readonly storage: ISyncStorageAdapter;

  constructor(storage: ISyncStorageAdapter) {
    this.storage = storage;
  }

  /**
   * Section 7 & 8: Enqueue a locally persisted learning event into the durable outbox.
   * Guarantees idempotency: If eventId already has an outbox entry, returns existing record.
   */
  public async enqueueEvent(
    event: PersistentMemorizationEvent,
    deviceId: string
  ): Promise<OutboxRecord> {
    // 1. Assert no audio data
    SyncEnvelopeSerializer.assertNoAudioSync(event, 'OutboxManager.enqueueEvent');

    // 2. Check for existing outbox record by eventId
    const existing = await this.storage.getOutboxRecordByEventId(event.eventId);
    if (existing) {
      return existing;
    }

    // 3. Create envelope
    const envelope = SyncEnvelopeSerializer.createEnvelope({
      event,
      deviceId,
    });

    const outboxId = `outbox_${deviceId}_${event.sequenceNumber}_${event.eventId}`;

    const record: OutboxRecord = {
      outboxId,
      eventId: event.eventId,
      studentId: event.studentId,
      deviceId,
      attemptCount: 0,
      createdAt: Date.now(),
      lastAttemptAt: 0,
      status: OutboxStatus.PENDING,
      payloadHash: envelope.payloadHash,
      envelope,
    };

    await this.storage.saveOutboxRecord(record);
    return record;
  }

  /**
   * Gets pending records ready for transport push.
   */
  public async getPendingBatch(studentId: string, limit: number = 50): Promise<OutboxRecord[]> {
    const records = await this.storage.getPendingOutbox(studentId, limit);
    return records.filter((r) => r.status === OutboxStatus.PENDING);
  }

  /**
   * Transitions pending records to IN_FLIGHT state.
   */
  public async markInFlight(outboxIds: readonly string[]): Promise<void> {
    const now = Date.now();
    for (const id of outboxIds) {
      const rec = await this.storage.getOutboxRecord(id);
      if (rec) {
        await this.storage.updateOutboxStatus(id, OutboxStatus.IN_FLIGHT, {
          attemptCount: rec.attemptCount + 1,
          lastAttemptAt: now,
        });
      }
    }
  }

  /**
   * Transitions records to ACKNOWLEDGED after transport confirms receipt.
   */
  public async markAcknowledged(outboxIds: readonly string[]): Promise<void> {
    for (const id of outboxIds) {
      await this.storage.updateOutboxStatus(id, OutboxStatus.ACKNOWLEDGED);
    }
  }

  /**
   * Transitions record to REJECTED or BLOCKED.
   */
  public async markRejected(
    outboxId: string,
    reason: string,
    permanent: boolean = false
  ): Promise<void> {
    await this.storage.updateOutboxStatus(
      outboxId,
      permanent ? OutboxStatus.REJECTED : OutboxStatus.BLOCKED,
      {
        rejectionReason: reason,
        permanentRejection: permanent,
      }
    );
  }

  /**
   * Reverts all IN_FLIGHT records back to PENDING (e.g. after network drop or crash restart).
   */
  public async revertInFlightToPending(studentId: string): Promise<number> {
    const all = await this.storage.getAllOutbox(studentId);
    let reverted = 0;
    for (const r of all) {
      if (r.status === OutboxStatus.IN_FLIGHT) {
        await this.storage.updateOutboxStatus(r.outboxId, OutboxStatus.PENDING);
        reverted++;
      }
    }
    return reverted;
  }

  /**
   * Retries a blocked or rejected outbox record.
   */
  public async retryRecord(outboxId: string): Promise<void> {
    const rec = await this.storage.getOutboxRecord(outboxId);
    if (!rec) {
      throw new Error(`Outbox record '${outboxId}' not found.`);
    }
    await this.storage.updateOutboxStatus(outboxId, OutboxStatus.PENDING, {
      rejectionReason: undefined,
      permanentRejection: false,
    });
  }

  /**
   * Gets outbox count by student and status.
   */
  public async getOutboxCount(studentId: string, status?: OutboxStatus): Promise<number> {
    return this.storage.getOutboxCount(studentId, status);
  }

  /**
   * Section 26: Re-keys pending outbox records during anonymous -> authenticated identity migration.
   */
  public async rekeyStudent(sourceStudentId: string, targetStudentId: string): Promise<number> {
    const all = await this.storage.getAllOutbox(sourceStudentId);
    let migrated = 0;

    for (const r of all) {
      // Create migrated envelope with updated studentId
      const updatedPayload: PersistentMemorizationEvent = {
        ...r.envelope.payload,
        studentId: targetStudentId,
      };

      const updatedEnvelope: SyncEventEnvelope = {
        ...r.envelope,
        studentId: targetStudentId,
        payload: updatedPayload,
      };

      const newOutboxId = `outbox_${r.deviceId}_${r.envelope.sequenceNumber}_${r.eventId}`;

      const updatedRecord: OutboxRecord = {
        ...r,
        outboxId: newOutboxId,
        studentId: targetStudentId,
        envelope: updatedEnvelope,
      };

      await this.storage.deleteOutboxRecord(r.outboxId);
      await this.storage.saveOutboxRecord(updatedRecord);
      migrated++;
    }

    return migrated;
  }

  public async clearOutbox(studentId: string): Promise<void> {
    await this.storage.clearOutbox(studentId);
  }
}
