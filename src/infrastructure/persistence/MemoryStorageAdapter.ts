/**
 * @file MemoryStorageAdapter.ts
 * @module infrastructure/persistence
 * @description In-memory transactional storage adapter with failure injection for unit testing and fallback runtime.
 */

import {
  IPersistenceStorageAdapter,
  PersistentMemorizationEvent,
  PersistentProfileSnapshot,
  PersistentRevisionPlan,
  PersistentRevisionHistoryRecord,
  PersistenceCheckpoint,
  TransactionIntentRecord,
  QueryEventsOptions,
} from '../../domain/persistence/types.ts';
import {
  StorageUnavailableError,
  TransactionIncompleteError,
  CorruptedRecordError,
} from '../../domain/persistence/errorRegistry.ts';

export class MemoryStorageAdapter implements IPersistenceStorageAdapter {
  private events: Map<string, PersistentMemorizationEvent[]> = new Map(); // studentId -> events[]
  private snapshots: Map<string, PersistentProfileSnapshot> = new Map(); // studentId -> snapshot
  private revisionPlans: Map<string, Map<string, PersistentRevisionPlan>> = new Map(); // studentId -> (planId -> plan)
  private revisionHistory: Map<string, PersistentRevisionHistoryRecord[]> = new Map(); // studentId -> history[]
  private checkpoints: Map<string, PersistenceCheckpoint> = new Map(); // studentId -> checkpoint
  private intents: Map<string, TransactionIntentRecord> = new Map(); // transactionId -> intent

  // Fault injection hooks for testing crash recovery and failure handling
  private storageUnavailable: boolean = false;
  private simulateInterruptedWrite: boolean = false;
  private corruptRecordOnRead: boolean = false;

  public async init(): Promise<void> {
    this.assertAvailable();
  }

  public async close(): Promise<void> {
    // No-op for memory
  }

  // --- Fault Injection Setters ---
  public setStorageUnavailable(unavailable: boolean): void {
    this.storageUnavailable = unavailable;
  }

  public setSimulateInterruptedWrite(interrupted: boolean): void {
    this.simulateInterruptedWrite = interrupted;
  }

  public setCorruptRecordOnRead(corrupt: boolean): void {
    this.corruptRecordOnRead = corrupt;
  }

  public simulateCrashBeforeNextCommit(): void {
    this.simulateInterruptedWrite = true;
  }

  public deleteEventSync(studentId: string, eventId: string): void {
    const list = this.events.get(studentId) || [];
    this.events.set(
      studentId,
      list.filter((e) => e.eventId !== eventId)
    );
  }

  private assertAvailable(): void {
    if (this.storageUnavailable) {
      throw new StorageUnavailableError('Memory storage is configured as unavailable');
    }
  }

  // --- Events ---
  public async saveEvent(event: PersistentMemorizationEvent): Promise<void> {
    this.assertAvailable();
    if (this.simulateInterruptedWrite) {
      throw new TransactionIncompleteError('simulated-interruption', 'Simulated hardware crash during event write');
    }

    const studentEvents = this.events.get(event.studentId) || [];
    const existingIndex = studentEvents.findIndex((e) => e.eventId === event.eventId);
    const cloned = JSON.parse(JSON.stringify(event));
    if (existingIndex >= 0) {
      studentEvents[existingIndex] = cloned;
    } else {
      studentEvents.push(cloned);
    }
    this.events.set(event.studentId, studentEvents);
  }

  public async getEvent(studentId: string, eventId: string): Promise<PersistentMemorizationEvent | null> {
    this.assertAvailable();
    const studentEvents = this.events.get(studentId) || [];
    const event = studentEvents.find((e) => e.eventId === eventId);
    if (!event) return null;

    if (this.corruptRecordOnRead) {
      return {
        ...event,
        eventHash: 'corrupted-tampered-hash-00000000000000000000000000000000000000',
      };
    }

    return JSON.parse(JSON.stringify(event));
  }

  public async getEventsByStudent(studentId: string): Promise<PersistentMemorizationEvent[]> {
    this.assertAvailable();
    const list = this.events.get(studentId) || [];
    if (this.corruptRecordOnRead && list.length > 0) {
      const corrupted = JSON.parse(JSON.stringify(list));
      corrupted[0].eventHash = 'corrupted-tampered-hash';
      return corrupted;
    }
    return JSON.parse(JSON.stringify(list));
  }

  public async queryEvents(options: QueryEventsOptions): Promise<PersistentMemorizationEvent[]> {
    this.assertAvailable();
    let list = this.events.get(options.studentId) || [];

    if (options.surahId !== undefined) {
      list = list.filter((e) => e.surahId === options.surahId);
    }
    if (options.ayahNumber !== undefined) {
      list = list.filter((e) => e.ayahNumber === options.ayahNumber);
    }
    if (options.fromTimestamp !== undefined) {
      list = list.filter((e) => e.timestamp >= options.fromTimestamp!);
    }
    if (options.toTimestamp !== undefined) {
      list = list.filter((e) => e.timestamp <= options.toTimestamp!);
    }

    const offset = options.offset ?? 0;
    const limit = options.limit ?? list.length;
    const sliced = list.slice(offset, offset + limit);
    return JSON.parse(JSON.stringify(sliced));
  }

  public async getEventCount(studentId: string): Promise<number> {
    this.assertAvailable();
    return (this.events.get(studentId) || []).length;
  }

  // --- Snapshots ---
  public async saveSnapshot(snapshot: PersistentProfileSnapshot): Promise<void> {
    this.assertAvailable();
    if (this.simulateInterruptedWrite) {
      throw new TransactionIncompleteError('simulated-interruption', 'Simulated crash during snapshot write');
    }
    this.snapshots.set(snapshot.studentId, JSON.parse(JSON.stringify(snapshot)));
  }

  public async getSnapshot(studentId: string): Promise<PersistentProfileSnapshot | null> {
    this.assertAvailable();
    const snap = this.snapshots.get(studentId);
    if (!snap) return null;
    return JSON.parse(JSON.stringify(snap));
  }

  // --- Revision Plans ---
  public async saveRevisionPlan(plan: PersistentRevisionPlan): Promise<void> {
    this.assertAvailable();
    let studentPlans = this.revisionPlans.get(plan.studentId);
    if (!studentPlans) {
      studentPlans = new Map();
      this.revisionPlans.set(plan.studentId, studentPlans);
    }
    studentPlans.set(plan.planId, JSON.parse(JSON.stringify(plan)));
  }

  public async getRevisionPlan(studentId: string, planId: string): Promise<PersistentRevisionPlan | null> {
    this.assertAvailable();
    const studentPlans = this.revisionPlans.get(studentId);
    if (!studentPlans) return null;
    const plan = studentPlans.get(planId);
    if (!plan) return null;
    return JSON.parse(JSON.stringify(plan));
  }

  public async getRevisionPlansByStudent(studentId: string): Promise<PersistentRevisionPlan[]> {
    this.assertAvailable();
    const studentPlans = this.revisionPlans.get(studentId);
    if (!studentPlans) return [];
    return JSON.parse(JSON.stringify(Array.from(studentPlans.values())));
  }

  // --- Revision History ---
  public async saveRevisionHistoryRecord(record: PersistentRevisionHistoryRecord): Promise<void> {
    this.assertAvailable();
    const list = this.revisionHistory.get(record.studentId) || [];
    list.push(JSON.parse(JSON.stringify(record)));
    this.revisionHistory.set(record.studentId, list);
  }

  public async getRevisionHistoryByStudent(studentId: string): Promise<PersistentRevisionHistoryRecord[]> {
    this.assertAvailable();
    const list = this.revisionHistory.get(studentId) || [];
    return JSON.parse(JSON.stringify(list));
  }

  // --- Checkpoints ---
  public async saveCheckpoint(checkpoint: PersistenceCheckpoint): Promise<void> {
    this.assertAvailable();
    this.checkpoints.set(checkpoint.studentId, JSON.parse(JSON.stringify(checkpoint)));
  }

  public async getCheckpoint(studentId: string): Promise<PersistenceCheckpoint | null> {
    this.assertAvailable();
    const cp = this.checkpoints.get(studentId);
    if (!cp) return null;
    return JSON.parse(JSON.stringify(cp));
  }

  // --- Transaction Intents (WAL) ---
  public async saveTransactionIntent(intent: TransactionIntentRecord): Promise<void> {
    this.assertAvailable();
    this.intents.set(intent.transactionId, JSON.parse(JSON.stringify(intent)));
  }

  public async getTransactionIntents(studentId: string): Promise<TransactionIntentRecord[]> {
    this.assertAvailable();
    const studentIntents = Array.from(this.intents.values()).filter((i) => i.studentId === studentId);
    return JSON.parse(JSON.stringify(studentIntents));
  }

  public async deleteTransactionIntent(transactionId: string): Promise<void> {
    this.assertAvailable();
    this.intents.delete(transactionId);
  }

  // --- Clear / Reset ---
  public async clearStudentData(studentId: string): Promise<void> {
    this.assertAvailable();
    this.events.delete(studentId);
    this.snapshots.delete(studentId);
    this.revisionPlans.delete(studentId);
    this.revisionHistory.delete(studentId);
    this.checkpoints.delete(studentId);

    // Delete intents for student
    for (const [id, intent] of Array.from(this.intents.entries())) {
      if (intent.studentId === studentId) {
        this.intents.delete(id);
      }
    }
  }

  public async clearAll(): Promise<void> {
    this.events.clear();
    this.snapshots.clear();
    this.revisionPlans.clear();
    this.revisionHistory.clear();
    this.checkpoints.clear();
    this.intents.clear();
  }

  // --- Transactions ---
  public async transaction<T>(studentId: string, operation: () => Promise<T>): Promise<T> {
    this.assertAvailable();

    // Snapshot state for rollback
    const backupEvents = this.events.get(studentId) ? JSON.parse(JSON.stringify(this.events.get(studentId))) : undefined;
    const backupSnapshot = this.snapshots.get(studentId) ? JSON.parse(JSON.stringify(this.snapshots.get(studentId))) : undefined;
    const backupPlans = this.revisionPlans.get(studentId) ? new Map(this.revisionPlans.get(studentId)) : undefined;
    const backupHistory = this.revisionHistory.get(studentId) ? JSON.parse(JSON.stringify(this.revisionHistory.get(studentId))) : undefined;
    const backupCheckpoint = this.checkpoints.get(studentId) ? JSON.parse(JSON.stringify(this.checkpoints.get(studentId))) : undefined;

    try {
      return await operation();
    } catch (err) {
      // Rollback to prior snapshot
      if (backupEvents !== undefined) {
        this.events.set(studentId, backupEvents);
      } else {
        this.events.delete(studentId);
      }

      if (backupSnapshot !== undefined) {
        this.snapshots.set(studentId, backupSnapshot);
      } else {
        this.snapshots.delete(studentId);
      }

      if (backupPlans !== undefined) {
        this.revisionPlans.set(studentId, backupPlans);
      } else {
        this.revisionPlans.delete(studentId);
      }

      if (backupHistory !== undefined) {
        this.revisionHistory.set(studentId, backupHistory);
      } else {
        this.revisionHistory.delete(studentId);
      }

      if (backupCheckpoint !== undefined) {
        this.checkpoints.set(studentId, backupCheckpoint);
      } else {
        this.checkpoints.delete(studentId);
      }

      throw err;
    }
  }
}
