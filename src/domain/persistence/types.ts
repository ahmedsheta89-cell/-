/**
 * @file types.ts
 * @module domain/persistence
 * @description Domain contracts, schemas, and interfaces for Phase 8B Persistent Learning Store.
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Student Identity -> Persistent Learning Store -> 7D Longitudinal Intelligence -> Future 8C Sync.
 * 
 * Persistence stores decisions and evidence.
 * Persistence MUST NEVER manufacture or alter Quran text, Tajweed rules, recitation correctness, or religious rulings.
 */

import {
  MemorizationEvent,
  StudentMemorizationProfile,
  PassageLearningRecord,
  StudentMemorizationRange,
  RevisionSetMode,
  PassageTarget,
  EvidenceStatus,
  MemorizationState,
  AttemptCluster,
} from '../memorization_revision/types.ts';

export const CURRENT_PERSISTENCE_SCHEMA_VERSION = '1.0.0';
export const GENESIS_PREVIOUS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Phase 8B Explicit Error Codes (Section 32).
 */
export enum PersistenceErrorCode {
  DUPLICATE_EVENT = 'PERSIST-001: DUPLICATE_EVENT',
  HASH_MISMATCH = 'PERSIST-002: HASH_MISMATCH',
  SCHEMA_MISMATCH = 'PERSIST-003: SCHEMA_MISMATCH',
  TRANSACTION_INCOMPLETE = 'PERSIST-004: TRANSACTION_INCOMPLETE',
  RECOVERY_FAILED = 'PERSIST-005: RECOVERY_FAILED',
  OWNERSHIP_MISMATCH = 'PERSIST-006: OWNERSHIP_MISMATCH',
  CORRUPTED_RECORD = 'PERSIST-007: CORRUPTED_RECORD',
  SNAPSHOT_STALE = 'PERSIST-008: SNAPSHOT_STALE',
  MIGRATION_CONFLICT = 'PERSIST-009: MIGRATION_CONFLICT',
  STORAGE_UNAVAILABLE = 'PERSIST-010: STORAGE_UNAVAILABLE',
}

/**
 * Section 5 & 6: Persistent Learning Event with Hash Chaining and Schema Versioning.
 */
export interface PersistentMemorizationEvent extends MemorizationEvent {
  readonly schemaVersion: string;
  readonly sequenceNumber: number;
  readonly previousEventHash: string;
  readonly eventHash: string;
  readonly persistedAt: number;
  readonly syncStatus?: 'PENDING' | 'SYNCED' | 'FAILED';
}

/**
 * Section 16 & 17: Persistent Profile Snapshot.
 */
export interface PersistentProfileSnapshot {
  readonly schemaVersion: string;
  readonly studentId: string;
  readonly snapshotVersion: number;
  readonly sourceEventCursor: string; // ID of the last event incorporated
  readonly sourceEventCount: number;
  readonly generatedAt: number;
  readonly profileHash: string;
  readonly activeMemorizationRange: readonly StudentMemorizationRange[];
  readonly passageStates: Record<string, PassageLearningRecord>;
  readonly lastActivityAt: number;
  readonly lastReviewAt: number;
  readonly revisionDueCount: number;
  readonly weakPassageCount: number;
  readonly stablePassageCount: number;
  readonly masteredPassageCount: number;
}

/**
 * Section 18: Persistent Revision Plan.
 */
export interface PersistentRevisionPlan {
  readonly schemaVersion: string;
  readonly studentId: string;
  readonly planId: string;
  readonly generatedAt: number;
  readonly algorithmVersion: string;
  readonly configurationVersion: string;
  readonly sourceProfileVersion: number;
  readonly mode: RevisionSetMode;
  readonly targets: readonly PassageTarget[];
  readonly completedTargets: readonly string[];
  readonly remainingTargets: readonly string[];
  readonly estimatedMinutes: number;
  readonly status: 'ACTIVE' | 'COMPLETED' | 'SUPERSEDED' | 'ABANDONED';
  readonly planHash: string;
}

/**
 * Section 19: Persistent Revision History Record.
 */
export interface PersistentRevisionHistoryRecord {
  readonly schemaVersion: string;
  readonly historyId: string;
  readonly studentId: string;
  readonly planId?: string;
  readonly passageKey: string;
  readonly surahId: number;
  readonly ayahNumber: number;
  readonly timestamp: number;
  readonly status: 'STARTED' | 'COMPLETED' | 'FAILED' | 'INCONCLUSIVE';
  readonly evidenceStatus: EvidenceStatus;
  readonly durationMs?: number;
  readonly recordHash: string;
}

/**
 * Checkpoint metadata for verified student streams.
 */
export interface PersistenceCheckpoint {
  readonly schemaVersion: string;
  readonly studentId: string;
  readonly lastEventId: string;
  readonly lastEventHash: string;
  readonly eventCount: number;
  readonly lastSnapshotVersion: number;
  readonly timestamp: number;
  readonly checkpointHash: string;
}

/**
 * Write-Ahead Transaction Intent for crash safety and atomicity (Sections 10, 11).
 */
export interface TransactionIntentRecord {
  readonly transactionId: string;
  readonly studentId: string;
  readonly intentType: 'APPEND_EVENT' | 'SAVE_SNAPSHOT' | 'SAVE_PLAN' | 'BATCH_WRITE' | 'RESET_DATA';
  readonly payload: unknown;
  readonly status: 'PENDING' | 'COMMITTED' | 'ROLLED_BACK';
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Integrity verification report.
 */
export interface IntegrityVerificationResult {
  readonly valid: boolean;
  readonly studentId: string;
  readonly totalEventsChecked: number;
  readonly brokenAtEventId?: string;
  readonly brokenSequenceNumber?: number;
  readonly errorDetails?: string;
  readonly hashChainIntact: boolean;
  readonly snapshotValid: boolean;
  readonly timestampOrderValid: boolean;
}

/**
 * Crash recovery outcome report.
 */
export interface RecoveryResult {
  readonly recovered: boolean;
  readonly studentId: string;
  readonly recoveredEventCount: number;
  readonly rolledBackTransactionsCount: number;
  readonly rebuiltSnapshot: boolean;
  readonly corruptedEventsCount: number;
  readonly details: string;
}

/**
 * Structured student data export envelope (Section 36).
 */
export interface ExportedStudentLearningData {
  readonly exportFormatVersion: string;
  readonly schemaVersion: string;
  readonly exportedAt: number;
  readonly studentId: string;
  readonly events: readonly PersistentMemorizationEvent[];
  readonly profileSnapshot: PersistentProfileSnapshot | null;
  readonly revisionPlans: readonly PersistentRevisionPlan[];
  readonly revisionHistory: readonly PersistentRevisionHistoryRecord[];
  readonly checkpoint: PersistenceCheckpoint | null;
  readonly exportChecksum: string;
}

/**
 * Query filters for event retrieval.
 */
export interface QueryEventsOptions {
  readonly studentId: string;
  readonly surahId?: number;
  readonly ayahNumber?: number;
  readonly fromTimestamp?: number;
  readonly toTimestamp?: number;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Low-level storage adapter interface decoupling domain from storage backend.
 */
export interface IPersistenceStorageAdapter {
  init(): Promise<void>;
  close(): Promise<void>;

  // Events
  saveEvent(event: PersistentMemorizationEvent): Promise<void>;
  getEvent(studentId: string, eventId: string): Promise<PersistentMemorizationEvent | null>;
  getEventsByStudent(studentId: string): Promise<PersistentMemorizationEvent[]>;
  queryEvents(options: QueryEventsOptions): Promise<PersistentMemorizationEvent[]>;
  getEventCount(studentId: string): Promise<number>;

  // Profile Snapshots
  saveSnapshot(snapshot: PersistentProfileSnapshot): Promise<void>;
  getSnapshot(studentId: string): Promise<PersistentProfileSnapshot | null>;

  // Revision Plans & History
  saveRevisionPlan(plan: PersistentRevisionPlan): Promise<void>;
  getRevisionPlan(studentId: string, planId: string): Promise<PersistentRevisionPlan | null>;
  getRevisionPlansByStudent(studentId: string): Promise<PersistentRevisionPlan[]>;
  saveRevisionHistoryRecord(record: PersistentRevisionHistoryRecord): Promise<void>;
  getRevisionHistoryByStudent(studentId: string): Promise<PersistentRevisionHistoryRecord[]>;

  // Checkpoints & Transactions (WAL)
  saveCheckpoint(checkpoint: PersistenceCheckpoint): Promise<void>;
  getCheckpoint(studentId: string): Promise<PersistenceCheckpoint | null>;
  saveTransactionIntent(intent: TransactionIntentRecord): Promise<void>;
  getTransactionIntents(studentId: string): Promise<TransactionIntentRecord[]>;
  deleteTransactionIntent(transactionId: string): Promise<void>;

  // Student data management
  clearStudentData(studentId: string): Promise<void>;
  clearAll(): Promise<void>;

  // Transaction support
  transaction<T>(studentId: string, operation: () => Promise<T>): Promise<T>;
}

/**
 * Section 4: Primary Domain Interface for Persistent Learning Store.
 */
export interface IPersistentLearningStore {
  readonly rawAudioPersistence: false;

  appendEvent(event: MemorizationEvent, requestingStudentId?: string): Promise<PersistentMemorizationEvent>;
  getEvent(studentId: string, eventId: string, requestingStudentId?: string): Promise<PersistentMemorizationEvent | null>;
  getEvents(options: QueryEventsOptions, requestingStudentId?: string): Promise<PersistentMemorizationEvent[]>;
  getEventsByStudent(studentId: string, requestingStudentId?: string): Promise<PersistentMemorizationEvent[]>;
  getEventsByQuranLocation(
    studentId: string,
    surahId: number,
    ayahNumber: number,
    requestingStudentId?: string
  ): Promise<PersistentMemorizationEvent[]>;

  saveProfileSnapshot(snapshot: PersistentProfileSnapshot, requestingStudentId?: string): Promise<void>;
  getProfileSnapshot(studentId: string, requestingStudentId?: string): Promise<PersistentProfileSnapshot | null>;
  rebuildProfileFromEvents(studentId: string, requestingStudentId?: string): Promise<PersistentProfileSnapshot>;

  saveRevisionPlan(plan: PersistentRevisionPlan, requestingStudentId?: string): Promise<void>;
  getRevisionPlan(studentId: string, planId: string, requestingStudentId?: string): Promise<PersistentRevisionPlan | null>;
  getRevisionPlans(studentId: string, requestingStudentId?: string): Promise<PersistentRevisionPlan[]>;
  recordRevisionOutcome(
    record: Omit<PersistentRevisionHistoryRecord, 'schemaVersion' | 'recordHash'>,
    requestingStudentId?: string
  ): Promise<PersistentRevisionHistoryRecord>;
  getRevisionHistory(studentId: string, requestingStudentId?: string): Promise<PersistentRevisionHistoryRecord[]>;

  checkpoint(studentId: string, requestingStudentId?: string): Promise<PersistenceCheckpoint>;
  recover(studentId: string, requestingStudentId?: string): Promise<RecoveryResult>;
  verifyIntegrity(studentId: string, requestingStudentId?: string): Promise<IntegrityVerificationResult>;

  exportStudentLearningData(studentId: string, requestingStudentId?: string): Promise<ExportedStudentLearningData>;
  resetStudentLearningData(studentId: string, requestingStudentId?: string, confirmationPhrase?: string): Promise<void>;
}

/**
 * Section 28: Future Sync Boundary for Phase 8C.
 */
export interface ISyncableLearningStore extends IPersistentLearningStore {
  getPendingEvents(studentId: string, limit?: number): Promise<PersistentMemorizationEvent[]>;
  markSynced(studentId: string, eventIds: readonly string[]): Promise<void>;
  getSyncCursor(studentId: string): Promise<string | null>;
  getSyncStatus(studentId: string): Promise<{ pendingCount: number; lastSyncedAt?: number }>;
}
