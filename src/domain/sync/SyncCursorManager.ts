/**
 * @file SyncCursorManager.ts
 * @module domain/sync
 * @description Durable Synchronization Cursor Manager (Section 10).
 * 
 * CORE GUARANTEES:
 * - Transactional Advancement: Cursor is only advanced after events are durably persisted.
 * - Cryptographic Cursor Hash: Tracks integrity of the synchronization position.
 * - Deterministic Reset: Supports resetting to a safe cursor point during resync or recovery.
 */

import { computeSha256Sync } from '../../infrastructure/crypto/Sha256Util.ts';
import { CanonicalSerializer } from '../persistence/CanonicalSerializer.ts';
import { ISyncStorageAdapter, SyncCursor } from './types.ts';
import { InvalidCursorError } from './errorRegistry.ts';

export class SyncCursorManager {
  private readonly storage: ISyncStorageAdapter;

  constructor(storage: ISyncStorageAdapter) {
    this.storage = storage;
  }

  /**
   * Computes a cryptographic checksum for a cursor state.
   */
  public static computeCursorHash(
    studentId: string,
    lastServerCursor: string | null,
    lastAcknowledgedSequence: number,
    lastAppliedRemoteSequence: number,
    updatedAt: number
  ): string {
    const raw = {
      lastAcknowledgedSequence,
      lastAppliedRemoteSequence,
      lastServerCursor,
      studentId,
      updatedAt,
    };
    return computeSha256Sync(CanonicalSerializer.canonicalStringify(raw));
  }

  /**
   * Retrieves the current cursor for a student, or initializes a default genesis cursor.
   */
  public async getCursor(studentId: string): Promise<SyncCursor> {
    const existing = await this.storage.getCursor(studentId);
    if (existing) {
      // Validate cursor integrity
      const expectedHash = SyncCursorManager.computeCursorHash(
        existing.studentId,
        existing.lastServerCursor,
        existing.lastAcknowledgedSequence,
        existing.lastAppliedRemoteSequence,
        existing.updatedAt
      );

      if (existing.cursorHash !== expectedHash) {
        throw new InvalidCursorError(
          studentId,
          `Cursor cryptographic hash mismatch. Expected ${expectedHash}, found ${existing.cursorHash}.`
        );
      }

      return existing;
    }

    // Genesis cursor
    const now = Date.now();
    const hash = SyncCursorManager.computeCursorHash(studentId, null, 0, 0, now);
    const genesis: SyncCursor = {
      studentId,
      lastServerCursor: null,
      lastAcknowledgedSequence: 0,
      lastAppliedRemoteSequence: 0,
      updatedAt: now,
      cursorHash: hash,
    };

    await this.storage.saveCursor(genesis);
    return genesis;
  }

  /**
   * Advances the remote cursor after remote events have been safely applied locally.
   */
  public async advanceRemoteCursor(params: {
    studentId: string;
    serverCursor: string;
    appliedRemoteSequence?: number;
  }): Promise<SyncCursor> {
    const current = await this.getCursor(params.studentId);
    const now = Date.now();

    const newRemoteSeq =
      params.appliedRemoteSequence !== undefined
        ? Math.max(current.lastAppliedRemoteSequence, params.appliedRemoteSequence)
        : current.lastAppliedRemoteSequence;

    const hash = SyncCursorManager.computeCursorHash(
      params.studentId,
      params.serverCursor,
      current.lastAcknowledgedSequence,
      newRemoteSeq,
      now
    );

    const updated: SyncCursor = {
      studentId: params.studentId,
      lastServerCursor: params.serverCursor,
      lastAcknowledgedSequence: current.lastAcknowledgedSequence,
      lastAppliedRemoteSequence: newRemoteSeq,
      updatedAt: now,
      cursorHash: hash,
    };

    await this.storage.saveCursor(updated);
    return updated;
  }

  /**
   * Advances the acknowledged sequence after outbound events have been ACKed by remote.
   */
  public async advanceAcknowledgedSequence(
    studentId: string,
    sequenceNumber: number
  ): Promise<SyncCursor> {
    const current = await this.getCursor(studentId);
    if (sequenceNumber <= current.lastAcknowledgedSequence) {
      return current;
    }

    const now = Date.now();
    const hash = SyncCursorManager.computeCursorHash(
      studentId,
      current.lastServerCursor,
      sequenceNumber,
      current.lastAppliedRemoteSequence,
      now
    );

    const updated: SyncCursor = {
      ...current,
      lastAcknowledgedSequence: sequenceNumber,
      updatedAt: now,
      cursorHash: hash,
    };

    await this.storage.saveCursor(updated);
    return updated;
  }

  /**
   * Resets cursor to a specific checkpoint (e.g. during resync).
   */
  public async resetCursor(
    studentId: string,
    serverCursor: string | null = null,
    acknowledgedSequence: number = 0
  ): Promise<SyncCursor> {
    const now = Date.now();
    const hash = SyncCursorManager.computeCursorHash(
      studentId,
      serverCursor,
      acknowledgedSequence,
      0,
      now
    );

    const resetCursor: SyncCursor = {
      studentId,
      lastServerCursor: serverCursor,
      lastAcknowledgedSequence: acknowledgedSequence,
      lastAppliedRemoteSequence: 0,
      updatedAt: now,
      cursorHash: hash,
    };

    await this.storage.saveCursor(resetCursor);
    return resetCursor;
  }

  public async deleteCursor(studentId: string): Promise<void> {
    await this.storage.deleteCursor(studentId);
  }
}
