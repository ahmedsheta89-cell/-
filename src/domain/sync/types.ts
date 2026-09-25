/**
 * @file types.ts
 * @module domain/sync
 * @description Production-grade Offline-First Synchronization domain contracts for Phase 8C.
 * 
 * CORE PRINCIPLES & NON-NEGOTIABLE INVARIANTS:
 * 1. Local-First Authority: Local Phase 8B store is authoritative for local device history.
 * 2. Immutable Event Conflict: Learning events are append-only. Divergent content for same event ID
 *    is quarantined as a deterministic conflict; blind Last-Write-Wins (LWW) is strictly forbidden.
 * 3. Eventual Convergence: Multiple devices accepting the same valid event set must produce
 *    semantically equivalent StudentMemorizationProfile and revision state regardless of delivery order.
 * 4. Zero Raw Audio: AudioBuffer, Float32Array, PCM data, or mic recordings are strictly rejected.
 * 5. Zero AI Authority: Gemini or any AI model has zero authority over sync, conflict resolution, or history.
 * 6. Provider-Neutral: Abstracted via ISyncTransport; zero Firebase/Supabase vendor leakage.
 */

import { PersistentMemorizationEvent } from '../persistence/types.ts';

export const CURRENT_SYNC_PROTOCOL_VERSION = '1.0.0';
export const CURRENT_SYNC_SCHEMA_VERSION = '1.0.0';

/**
 * Section 23: Deterministic Network & Sync Lifecycle States.
 */
export enum NetworkSyncState {
  OFFLINE = 'OFFLINE',
  CONNECTING = 'CONNECTING',
  ONLINE = 'ONLINE',
  SYNCING = 'SYNCING',
  DEGRADED = 'DEGRADED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  CONFLICT = 'CONFLICT',
}

/**
 * Section 6: Explicit Operation Semantics.
 */
export enum SyncOperationType {
  CREATE_EVENT = 'CREATE_EVENT',
  ACK_EVENT = 'ACK_EVENT',
  REJECT_EVENT = 'REJECT_EVENT',
  REQUEST_RESYNC = 'REQUEST_RESYNC',
  SNAPSHOT_AVAILABLE = 'SNAPSHOT_AVAILABLE',
  SNAPSHOT_REQUIRED = 'SNAPSHOT_REQUIRED',
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
  MIGRATION_REQUIRED = 'MIGRATION_REQUIRED',
}

/**
 * Section 7: Outbox Item Processing Status.
 */
export enum OutboxStatus {
  PENDING = 'PENDING',
  IN_FLIGHT = 'IN_FLIGHT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}

/**
 * Section 38: Conflict Quarantine Status.
 */
export enum ConflictStatus {
  OPEN = 'OPEN',
  VALIDATED = 'VALIDATED',
  RESOLVED = 'RESOLVED',
  PERMANENT = 'PERMANENT',
}

/**
 * Section 45: Phase 8C Explicit Sync Error Codes.
 */
export enum SyncErrorCode {
  OUTBOX_CONFLICT = 'SYNC-001: OUTBOX_CONFLICT',
  DUPLICATE_EVENT = 'SYNC-002: DUPLICATE_EVENT',
  HASH_MISMATCH = 'SYNC-003: HASH_MISMATCH',
  OWNERSHIP_MISMATCH = 'SYNC-004: OWNERSHIP_MISMATCH',
  UNSUPPORTED_PROTOCOL = 'SYNC-005: UNSUPPORTED_PROTOCOL',
  SCHEMA_MISMATCH = 'SYNC-006: SCHEMA_MISMATCH',
  CURSOR_INVALID = 'SYNC-007: CURSOR_INVALID',
  TRANSPORT_FAILURE = 'SYNC-008: TRANSPORT_FAILURE',
  AUTH_REQUIRED = 'SYNC-009: AUTH_REQUIRED',
  CONFLICT_QUARANTINED = 'SYNC-010: CONFLICT_QUARANTINED',
  RECOVERY_REQUIRED = 'SYNC-011: RECOVERY_REQUIRED',
  RAW_AUDIO_REJECTED = 'SYNC-012: RAW_AUDIO_REJECTED',
}

/**
 * Section 5: Sync Event Envelope for wire transport and deduplication.
 */
export interface SyncEventEnvelope<T = PersistentMemorizationEvent> {
  readonly syncEventId: string;
  readonly eventId: string;
  readonly studentId: string;
  readonly deviceId: string;
  readonly sessionId: string;
  readonly sequenceNumber: number;
  readonly eventHash: string;
  readonly previousEventHash: string;
  readonly schemaVersion: string;
  readonly protocolVersion: string;
  readonly createdAt: number;
  readonly originDeviceId: string;
  readonly originSequence: number;
  readonly payload: T;
  readonly payloadHash: string;
  readonly envelopeHash: string;
}

/**
 * Section 7: Durable Outbox Record.
 */
export interface OutboxRecord {
  readonly outboxId: string;
  readonly eventId: string;
  readonly studentId: string;
  readonly deviceId: string;
  readonly attemptCount: number;
  readonly createdAt: number;
  readonly lastAttemptAt: number;
  readonly status: OutboxStatus;
  readonly payloadHash: string;
  readonly envelope: SyncEventEnvelope;
  readonly rejectionReason?: string;
  readonly permanentRejection?: boolean;
}

/**
 * Section 9: Durable Inbound Deduplication Record.
 */
export interface InboxRecord {
  readonly inboxId: string;
  readonly syncEventId: string;
  readonly eventId: string;
  readonly studentId: string;
  readonly originDeviceId: string;
  readonly eventHash: string;
  readonly receivedAt: number;
  readonly processedAt: number;
  readonly status: 'PROCESSED' | 'QUARANTINED' | 'DUPLICATE_IGNORED';
}

/**
 * Section 10: Durable Synchronization Cursor.
 */
export interface SyncCursor {
  readonly studentId: string;
  readonly lastServerCursor: string | null;
  readonly lastAcknowledgedSequence: number;
  readonly lastAppliedRemoteSequence: number;
  readonly updatedAt: number;
  readonly cursorHash: string;
}

/**
 * Section 38: Quarantined Sync Conflict Record.
 */
export interface SyncConflictRecord {
  readonly conflictId: string;
  readonly studentId: string;
  readonly eventId: string;
  readonly localHash: string;
  readonly remoteHash: string;
  readonly localEnvelope?: SyncEventEnvelope;
  readonly remoteEnvelope?: SyncEventEnvelope;
  readonly localPayload?: unknown;
  readonly detectedAt: number;
  readonly status: ConflictStatus;
  readonly reason: string;
  readonly resolutionChoice?: 'LOCAL_WINS' | 'REMOTE_WINS' | 'MANUAL_SPLIT';
  readonly notes?: string;
}

/**
 * Section 44: Minimal UI / Diagnostic Sync Summary.
 */
export interface SyncStatusSummary {
  readonly syncStatus: NetworkSyncState;
  readonly pendingCount: number;
  readonly inFlightCount: number;
  readonly lastSuccessfulSync: number | null;
  readonly conflictCount: number;
  readonly authRequired: boolean;
  readonly isOnline: boolean;
  readonly deviceId: string;
}

/**
 * Transport push response contract.
 */
export interface SyncPushResult {
  readonly acceptedIds: readonly string[];
  readonly rejected: readonly {
    readonly syncEventId: string;
    readonly reason: string;
    readonly permanent: boolean;
  }[];
  readonly conflicts: readonly {
    readonly syncEventId: string;
    readonly conflictingEventId: string;
    readonly reason: string;
  }[];
  readonly serverCursor: string;
}

/**
 * Transport pull response contract.
 */
export interface SyncPullResult {
  readonly envelopes: readonly SyncEventEnvelope[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
  readonly serverCursor: string;
}

/**
 * Transport resync response contract.
 */
export interface ResyncResponse {
  readonly resetCursor: string;
  readonly totalAvailableEvents: number;
  readonly initialBatch: readonly SyncEventEnvelope[];
}

/**
 * Section 32: Provider-Neutral Synchronization Transport Interface.
 */
export interface ISyncTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  push(envelopes: readonly SyncEventEnvelope[]): Promise<SyncPushResult>;
  pull(studentId: string, sinceCursor: string | null, limit?: number): Promise<SyncPullResult>;
  acknowledge(studentId: string, syncEventIds: readonly string[]): Promise<void>;
  requestResync(studentId: string): Promise<ResyncResponse>;
  getServerCursor(studentId: string): Promise<string | null>;
  isConnected(): boolean;
}

/**
 * Low-level storage adapter interface for durable sync state (Outbox, Inbox, Cursors, Conflicts).
 */
export interface ISyncStorageAdapter {
  init(): Promise<void>;
  close(): Promise<void>;

  // Outbox
  saveOutboxRecord(record: OutboxRecord): Promise<void>;
  getOutboxRecord(outboxId: string): Promise<OutboxRecord | null>;
  getOutboxRecordByEventId(eventId: string): Promise<OutboxRecord | null>;
  getPendingOutbox(studentId: string, limit?: number): Promise<OutboxRecord[]>;
  getAllOutbox(studentId: string): Promise<OutboxRecord[]>;
  updateOutboxStatus(
    outboxId: string,
    status: OutboxStatus,
    details?: { attemptCount?: number; lastAttemptAt?: number; rejectionReason?: string; permanentRejection?: boolean }
  ): Promise<void>;
  getOutboxCount(studentId: string, status?: OutboxStatus): Promise<number>;
  deleteOutboxRecord(outboxId: string): Promise<void>;
  clearOutbox(studentId: string): Promise<void>;

  // Inbox
  saveInboxRecord(record: InboxRecord): Promise<void>;
  getInboxRecord(syncEventId: string): Promise<InboxRecord | null>;
  getInboxRecordByEventId(studentId: string, eventId: string): Promise<InboxRecord | null>;
  hasEventBeenProcessed(studentId: string, eventId: string): Promise<boolean>;
  getInboxRecords(studentId: string): Promise<InboxRecord[]>;
  clearInbox(studentId: string): Promise<void>;

  // Cursors
  saveCursor(cursor: SyncCursor): Promise<void>;
  getCursor(studentId: string): Promise<SyncCursor | null>;
  deleteCursor(studentId: string): Promise<void>;

  // Conflicts
  saveConflict(conflict: SyncConflictRecord): Promise<void>;
  getConflicts(studentId: string, status?: ConflictStatus): Promise<SyncConflictRecord[]>;
  getConflict(conflictId: string): Promise<SyncConflictRecord | null>;
  updateConflictStatus(conflictId: string, status: ConflictStatus): Promise<void>;
  clearConflicts(studentId: string): Promise<void>;

  // Full clean
  clearAll(studentId?: string): Promise<void>;
}
