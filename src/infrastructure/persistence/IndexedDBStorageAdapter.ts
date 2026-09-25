/**
 * @file IndexedDBStorageAdapter.ts
 * @module infrastructure/persistence
 * @description Production-grade browser IndexedDB persistence adapter (Sections 10, 25).
 * 
 * CORE GUARANTEES:
 * - Offline-first: Runs directly in browser without server dependencies.
 * - Transactional Safety: Leverages native readwrite IndexedDB transactions.
 * - Indexed Lookups: Indexes by studentId, timestamps, and Quran coordinates.
 * - Graceful Fallback: Detects missing IDB implementation safely.
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

const DB_NAME = 'QuranTeacherAI_LearningStore_v1';
const DB_VERSION = 1;

const STORES = {
  EVENTS: 'learning_events',
  SNAPSHOTS: 'profile_snapshots',
  REVISION_PLANS: 'revision_plans',
  REVISION_HISTORY: 'revision_history',
  CHECKPOINTS: 'checkpoints',
  INTENTS: 'transaction_intents',
} as const;

export class IndexedDBStorageAdapter implements IPersistenceStorageAdapter {
  private db: IDBDatabase | null = null;

  public async init(): Promise<void> {
    const idbFactory =
      typeof globalThis !== 'undefined'
        ? (globalThis.indexedDB || (globalThis as unknown as { mozIndexedDB?: IDBFactory; webkitIndexedDB?: IDBFactory }).mozIndexedDB)
        : null;

    if (!idbFactory) {
      throw new StorageUnavailableError('IndexedDB is not available in the current JavaScript runtime environment.');
    }

    return new Promise((resolve, reject) => {
      const request = idbFactory.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Events store
        if (!db.objectStoreNames.contains(STORES.EVENTS)) {
          const eventStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'eventId' });
          eventStore.createIndex('by_student', 'studentId', { unique: false });
          eventStore.createIndex('by_student_time', ['studentId', 'timestamp'], { unique: false });
          eventStore.createIndex('by_student_location', ['studentId', 'surahId', 'ayahNumber'], { unique: false });
        }

        // 2. Snapshots store
        if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
          db.createObjectStore(STORES.SNAPSHOTS, { keyPath: 'studentId' });
        }

        // 3. Revision Plans
        if (!db.objectStoreNames.contains(STORES.REVISION_PLANS)) {
          const planStore = db.createObjectStore(STORES.REVISION_PLANS, { keyPath: 'planId' });
          planStore.createIndex('by_student', 'studentId', { unique: false });
        }

        // 4. Revision History
        if (!db.objectStoreNames.contains(STORES.REVISION_HISTORY)) {
          const historyStore = db.createObjectStore(STORES.REVISION_HISTORY, { keyPath: 'historyId' });
          historyStore.createIndex('by_student', 'studentId', { unique: false });
        }

        // 5. Checkpoints
        if (!db.objectStoreNames.contains(STORES.CHECKPOINTS)) {
          db.createObjectStore(STORES.CHECKPOINTS, { keyPath: 'studentId' });
        }

        // 6. Transaction Intents
        if (!db.objectStoreNames.contains(STORES.INTENTS)) {
          const intentStore = db.createObjectStore(STORES.INTENTS, { keyPath: 'transactionId' });
          intentStore.createIndex('by_student', 'studentId', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(new StorageUnavailableError(`Failed to open IndexedDB: ${request.error?.message}`));
      };
    });
  }

  public async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new StorageUnavailableError('IndexedDB has not been initialized. Call init() first.');
    }
    return this.db;
  }

  // --- Events ---
  public async saveEvent(event: PersistentMemorizationEvent): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVENTS, 'readwrite');
      const store = tx.objectStore(STORES.EVENTS);
      const req = store.put(event);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new TransactionIncompleteError('event-write', req.error?.message));
    });
  }

  public async getEvent(studentId: string, eventId: string): Promise<PersistentMemorizationEvent | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVENTS, 'readonly');
      const store = tx.objectStore(STORES.EVENTS);
      const req = store.get(eventId);
      req.onsuccess = () => {
        const item = req.result as PersistentMemorizationEvent | undefined;
        if (!item || item.studentId !== studentId) {
          resolve(null);
        } else {
          resolve(item);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getEventsByStudent(studentId: string): Promise<PersistentMemorizationEvent[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVENTS, 'readonly');
      const store = tx.objectStore(STORES.EVENTS);
      const index = store.index('by_student');
      const req = index.getAll(studentId);
      req.onsuccess = () => {
        const events = (req.result || []) as PersistentMemorizationEvent[];
        events.sort((a, b) => a.sequenceNumber - b.sequenceNumber || a.timestamp - b.timestamp);
        resolve(events);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async queryEvents(options: QueryEventsOptions): Promise<PersistentMemorizationEvent[]> {
    const all = await this.getEventsByStudent(options.studentId);
    let filtered = all;

    if (options.surahId !== undefined) {
      filtered = filtered.filter((e) => e.surahId === options.surahId);
    }
    if (options.ayahNumber !== undefined) {
      filtered = filtered.filter((e) => e.ayahNumber === options.ayahNumber);
    }
    if (options.fromTimestamp !== undefined) {
      filtered = filtered.filter((e) => e.timestamp >= options.fromTimestamp!);
    }
    if (options.toTimestamp !== undefined) {
      filtered = filtered.filter((e) => e.timestamp <= options.toTimestamp!);
    }

    const offset = options.offset ?? 0;
    const limit = options.limit ?? filtered.length;
    return filtered.slice(offset, offset + limit);
  }

  public async getEventCount(studentId: string): Promise<number> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EVENTS, 'readonly');
      const store = tx.objectStore(STORES.EVENTS);
      const index = store.index('by_student');
      const req = index.count(studentId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Snapshots ---
  public async saveSnapshot(snapshot: PersistentProfileSnapshot): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SNAPSHOTS, 'readwrite');
      const store = tx.objectStore(STORES.SNAPSHOTS);
      const req = store.put(snapshot);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(new TransactionIncompleteError('snapshot-write', req.error?.message));
    });
  }

  public async getSnapshot(studentId: string): Promise<PersistentProfileSnapshot | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SNAPSHOTS, 'readonly');
      const store = tx.objectStore(STORES.SNAPSHOTS);
      const req = store.get(studentId);
      req.onsuccess = () => resolve((req.result as PersistentProfileSnapshot) || null);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Revision Plans ---
  public async saveRevisionPlan(plan: PersistentRevisionPlan): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.REVISION_PLANS, 'readwrite');
      const store = tx.objectStore(STORES.REVISION_PLANS);
      const req = store.put(plan);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getRevisionPlan(studentId: string, planId: string): Promise<PersistentRevisionPlan | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.REVISION_PLANS, 'readonly');
      const store = tx.objectStore(STORES.REVISION_PLANS);
      const req = store.get(planId);
      req.onsuccess = () => {
        const item = req.result as PersistentRevisionPlan | undefined;
        if (!item || item.studentId !== studentId) {
          resolve(null);
        } else {
          resolve(item);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getRevisionPlansByStudent(studentId: string): Promise<PersistentRevisionPlan[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.REVISION_PLANS, 'readonly');
      const store = tx.objectStore(STORES.REVISION_PLANS);
      const index = store.index('by_student');
      const req = index.getAll(studentId);
      req.onsuccess = () => resolve((req.result || []) as PersistentRevisionPlan[]);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Revision History ---
  public async saveRevisionHistoryRecord(record: PersistentRevisionHistoryRecord): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.REVISION_HISTORY, 'readwrite');
      const store = tx.objectStore(STORES.REVISION_HISTORY);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getRevisionHistoryByStudent(studentId: string): Promise<PersistentRevisionHistoryRecord[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.REVISION_HISTORY, 'readonly');
      const store = tx.objectStore(STORES.REVISION_HISTORY);
      const index = store.index('by_student');
      const req = index.getAll(studentId);
      req.onsuccess = () => resolve((req.result || []) as PersistentRevisionHistoryRecord[]);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Checkpoints ---
  public async saveCheckpoint(checkpoint: PersistenceCheckpoint): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CHECKPOINTS, 'readwrite');
      const store = tx.objectStore(STORES.CHECKPOINTS);
      const req = store.put(checkpoint);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getCheckpoint(studentId: string): Promise<PersistenceCheckpoint | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CHECKPOINTS, 'readonly');
      const store = tx.objectStore(STORES.CHECKPOINTS);
      const req = store.get(studentId);
      req.onsuccess = () => resolve((req.result as PersistenceCheckpoint) || null);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Transaction Intents (WAL) ---
  public async saveTransactionIntent(intent: TransactionIntentRecord): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INTENTS, 'readwrite');
      const store = tx.objectStore(STORES.INTENTS);
      const req = store.put(intent);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getTransactionIntents(studentId: string): Promise<TransactionIntentRecord[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INTENTS, 'readonly');
      const store = tx.objectStore(STORES.INTENTS);
      const index = store.index('by_student');
      const req = index.getAll(studentId);
      req.onsuccess = () => resolve((req.result || []) as TransactionIntentRecord[]);
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteTransactionIntent(transactionId: string): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INTENTS, 'readwrite');
      const store = tx.objectStore(STORES.INTENTS);
      const req = store.delete(transactionId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Clear / Reset ---
  public async clearStudentData(studentId: string): Promise<void> {
    const db = this.getDB();
    const deleteFromStore = (storeName: string, indexName: string) => {
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const req = index.openKeyCursor(IDBKeyRange.only(studentId));
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      });
    };

    await Promise.all([
      deleteFromStore(STORES.EVENTS, 'by_student'),
      deleteFromStore(STORES.REVISION_PLANS, 'by_student'),
      deleteFromStore(STORES.REVISION_HISTORY, 'by_student'),
      deleteFromStore(STORES.INTENTS, 'by_student'),
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.SNAPSHOTS, 'readwrite');
        const req = tx.objectStore(STORES.SNAPSHOTS).delete(studentId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.CHECKPOINTS, 'readwrite');
        const req = tx.objectStore(STORES.CHECKPOINTS).delete(studentId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
    ]);
  }

  public async clearAll(): Promise<void> {
    const db = this.getDB();
    const clearStore = (storeName: string) => {
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const req = tx.objectStore(storeName).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    };

    await Promise.all(Object.values(STORES).map((storeName) => clearStore(storeName)));
  }

  // --- Transactions ---
  public async transaction<T>(_studentId: string, operation: () => Promise<T>): Promise<T> {
    // In IndexedDB, individual store writes run in native readwrite transactions.
    // High-level cross-store atomic multi-writes are protected via Write-Ahead Log (Transaction Intents).
    return await operation();
  }
}
