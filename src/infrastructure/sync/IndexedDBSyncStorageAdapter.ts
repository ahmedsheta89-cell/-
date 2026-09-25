/**
 * @file IndexedDBSyncStorageAdapter.ts
 * @module infrastructure/sync
 * @description Production IndexedDB persistence adapter for Phase 8C Sync Outbox, Inbox, Cursors, and Conflicts.
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
import { StorageUnavailableError } from '../../domain/persistence/errorRegistry.ts';

const DB_NAME = 'QuranTeacherAI_SyncStore_v1';
const DB_VERSION = 1;

const STORES = {
  OUTBOX: 'sync_outbox',
  INBOX: 'sync_inbox',
  CURSORS: 'sync_cursors',
  CONFLICTS: 'sync_conflicts',
} as const;

export class IndexedDBSyncStorageAdapter implements ISyncStorageAdapter {
  private db: IDBDatabase | null = null;

  public async init(): Promise<void> {
    const idbFactory =
      typeof globalThis !== 'undefined'
        ? (globalThis.indexedDB ||
            (globalThis as unknown as { mozIndexedDB?: IDBFactory; webkitIndexedDB?: IDBFactory }).mozIndexedDB)
        : null;

    if (!idbFactory) {
      throw new StorageUnavailableError('IndexedDB is not available in the current JavaScript runtime environment.');
    }

    return new Promise((resolve, reject) => {
      const request = idbFactory.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Outbox
        if (!db.objectStoreNames.contains(STORES.OUTBOX)) {
          const outboxStore = db.createObjectStore(STORES.OUTBOX, { keyPath: 'outboxId' });
          outboxStore.createIndex('by_student', 'studentId', { unique: false });
          outboxStore.createIndex('by_event', 'eventId', { unique: false });
          outboxStore.createIndex('by_status', 'status', { unique: false });
        }

        // 2. Inbox
        if (!db.objectStoreNames.contains(STORES.INBOX)) {
          const inboxStore = db.createObjectStore(STORES.INBOX, { keyPath: 'syncEventId' });
          inboxStore.createIndex('by_student', 'studentId', { unique: false });
          inboxStore.createIndex('by_event', 'eventId', { unique: false });
        }

        // 3. Cursors
        if (!db.objectStoreNames.contains(STORES.CURSORS)) {
          db.createObjectStore(STORES.CURSORS, { keyPath: 'studentId' });
        }

        // 4. Conflicts
        if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
          const conflictStore = db.createObjectStore(STORES.CONFLICTS, { keyPath: 'conflictId' });
          conflictStore.createIndex('by_student', 'studentId', { unique: false });
          conflictStore.createIndex('by_status', 'status', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        reject(new StorageUnavailableError(`Failed to open IndexedDB sync database: ${request.error?.message}`));
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
      throw new StorageUnavailableError('IndexedDBSyncStorageAdapter is not initialized.');
    }
    return this.db;
  }

  // --- Outbox ---
  public async saveOutboxRecord(record: OutboxRecord): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.OUTBOX], 'readwrite');
      const store = tx.objectStore(STORES.OUTBOX);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getOutboxRecord(outboxId: string): Promise<OutboxRecord | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.OUTBOX], 'readonly');
      const store = tx.objectStore(STORES.OUTBOX);
      const req = store.get(outboxId);
      req.onsuccess = () => resolve((req.result as OutboxRecord) || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async getOutboxRecordByEventId(eventId: string): Promise<OutboxRecord | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.OUTBOX], 'readonly');
      const store = tx.objectStore(STORES.OUTBOX);
      const index = store.index('by_event');
      const req = index.get(eventId);
      req.onsuccess = () => resolve((req.result as OutboxRecord) || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async getPendingOutbox(studentId: string, limit?: number): Promise<OutboxRecord[]> {
    const all = await this.getAllOutbox(studentId);
    const pending = all.filter((r) => r.status === OutboxStatus.PENDING || r.status === OutboxStatus.IN_FLIGHT);
    return limit ? pending.slice(0, limit) : pending;
  }

  public async getAllOutbox(studentId: string): Promise<OutboxRecord[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.OUTBOX], 'readonly');
      const store = tx.objectStore(STORES.OUTBOX);
      const index = store.index('by_student');
      const req = index.getAll(studentId);
      req.onsuccess = () => {
        const results = (req.result as OutboxRecord[]) || [];
        results.sort((a, b) => a.createdAt - b.createdAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async updateOutboxStatus(
    outboxId: string,
    status: OutboxStatus,
    details?: { attemptCount?: number; lastAttemptAt?: number; rejectionReason?: string; permanentRejection?: boolean }
  ): Promise<void> {
    const existing = await this.getOutboxRecord(outboxId);
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

    await this.saveOutboxRecord(updated);
  }

  public async getOutboxCount(studentId: string, status?: OutboxStatus): Promise<number> {
    const all = await this.getAllOutbox(studentId);
    if (!status) return all.length;
    return all.filter((r) => r.status === status).length;
  }

  public async deleteOutboxRecord(outboxId: string): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.OUTBOX], 'readwrite');
      const store = tx.objectStore(STORES.OUTBOX);
      const req = store.delete(outboxId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clearOutbox(studentId: string): Promise<void> {
    const all = await this.getAllOutbox(studentId);
    for (const r of all) {
      await this.deleteOutboxRecord(r.outboxId);
    }
  }

  // --- Inbox ---
  public async saveInboxRecord(record: InboxRecord): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.INBOX], 'readwrite');
      const store = tx.objectStore(STORES.INBOX);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getInboxRecord(syncEventId: string): Promise<InboxRecord | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.INBOX], 'readonly');
      const store = tx.objectStore(STORES.INBOX);
      const req = store.get(syncEventId);
      req.onsuccess = () => resolve((req.result as InboxRecord) || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async getInboxRecordByEventId(studentId: string, eventId: string): Promise<InboxRecord | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.INBOX], 'readonly');
      const store = tx.objectStore(STORES.INBOX);
      const index = store.index('by_event');
      const req = index.get(eventId);
      req.onsuccess = () => {
        const res = req.result as InboxRecord;
        if (res && res.studentId === studentId) {
          resolve(res);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async hasEventBeenProcessed(studentId: string, eventId: string): Promise<boolean> {
    const rec = await this.getInboxRecordByEventId(studentId, eventId);
    return rec !== null;
  }

  public async getInboxRecords(studentId: string): Promise<InboxRecord[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.INBOX], 'readonly');
      const store = tx.objectStore(STORES.INBOX);
      const index = store.index('by_student');
      const req = index.getAll(studentId);
      req.onsuccess = () => {
        const records = (req.result as InboxRecord[]) || [];
        records.sort((a, b) => a.processedAt - b.processedAt);
        resolve(records);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async clearInbox(studentId: string): Promise<void> {
    const all = await this.getInboxRecords(studentId);
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.INBOX], 'readwrite');
      const store = tx.objectStore(STORES.INBOX);
      for (const r of all) {
        store.delete(r.syncEventId);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Cursors ---
  public async saveCursor(cursor: SyncCursor): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CURSORS], 'readwrite');
      const store = tx.objectStore(STORES.CURSORS);
      const req = store.put(cursor);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getCursor(studentId: string): Promise<SyncCursor | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CURSORS], 'readonly');
      const store = tx.objectStore(STORES.CURSORS);
      const req = store.get(studentId);
      req.onsuccess = () => resolve((req.result as SyncCursor) || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteCursor(studentId: string): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CURSORS], 'readwrite');
      const store = tx.objectStore(STORES.CURSORS);
      const req = store.delete(studentId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Conflicts ---
  public async saveConflict(conflict: SyncConflictRecord): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CONFLICTS], 'readwrite');
      const store = tx.objectStore(STORES.CONFLICTS);
      const req = store.put(conflict);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getConflicts(studentId: string, status?: ConflictStatus): Promise<SyncConflictRecord[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CONFLICTS], 'readonly');
      const store = tx.objectStore(STORES.CONFLICTS);
      const index = store.index('by_student');
      const req = index.getAll(studentId);
      req.onsuccess = () => {
        let results = (req.result as SyncConflictRecord[]) || [];
        if (status) {
          results = results.filter((c) => c.status === status);
        }
        results.sort((a, b) => a.detectedAt - b.detectedAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getConflict(conflictId: string): Promise<SyncConflictRecord | null> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CONFLICTS], 'readonly');
      const store = tx.objectStore(STORES.CONFLICTS);
      const req = store.get(conflictId);
      req.onsuccess = () => resolve((req.result as SyncConflictRecord) || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async updateConflictStatus(conflictId: string, status: ConflictStatus): Promise<void> {
    const existing = await this.getConflict(conflictId);
    if (existing) {
      await this.saveConflict({ ...existing, status });
    }
  }

  public async clearConflicts(studentId: string): Promise<void> {
    const conflicts = await this.getConflicts(studentId);
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.CONFLICTS], 'readwrite');
      const store = tx.objectStore(STORES.CONFLICTS);
      for (const c of conflicts) {
        store.delete(c.conflictId);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public async clearAll(studentId?: string): Promise<void> {
    if (studentId) {
      await this.clearOutbox(studentId);
      await this.clearInbox(studentId);
      await this.deleteCursor(studentId);
      await this.clearConflicts(studentId);
    } else {
      const db = this.getDB();
      const stores = [STORES.OUTBOX, STORES.INBOX, STORES.CURSORS, STORES.CONFLICTS];
      return new Promise((resolve, reject) => {
        const tx = db.transaction(stores, 'readwrite');
        for (const s of stores) {
          tx.objectStore(s).clear();
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }
}
