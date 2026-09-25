/**
 * @file PersistentLearningStoreFactory.ts
 * @module domain/persistence
 * @description Factory for creating PersistentLearningStore with environment detection and adapter selection.
 */

import { IPersistentLearningStore, IPersistenceStorageAdapter } from './types.ts';
import { PersistentLearningStore } from './PersistentLearningStore.ts';
import { MemoryStorageAdapter } from '../../infrastructure/persistence/MemoryStorageAdapter.ts';
import { IndexedDBStorageAdapter } from '../../infrastructure/persistence/IndexedDBStorageAdapter.ts';

export class PersistentLearningStoreFactory {
  /**
   * Automatically detects the environment:
   * - Browser with IndexedDB -> IndexedDBStorageAdapter
   * - Headless / Node / Test -> MemoryStorageAdapter
   */
  public static async createDefaultStore(): Promise<PersistentLearningStore> {
    const hasIndexedDB =
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as unknown as { indexedDB?: unknown }).indexedDB !== 'undefined';

    if (hasIndexedDB) {
      try {
        const idbAdapter = new IndexedDBStorageAdapter();
        await idbAdapter.init();
        return new PersistentLearningStore(idbAdapter);
      } catch {
        // Fall back to MemoryStorageAdapter if IndexedDB initialization fails (e.g. security block or private browsing)
        const memAdapter = new MemoryStorageAdapter();
        await memAdapter.init();
        return new PersistentLearningStore(memAdapter);
      }
    }

    const memAdapter = new MemoryStorageAdapter();
    await memAdapter.init();
    return new PersistentLearningStore(memAdapter);
  }

  /**
   * Explicitly creates a store backed by in-memory storage (ideal for unit testing).
   */
  public static async createMemoryStore(): Promise<{
    store: PersistentLearningStore;
    adapter: MemoryStorageAdapter;
  }> {
    const adapter = new MemoryStorageAdapter();
    await adapter.init();
    const store = new PersistentLearningStore(adapter);
    return { store, adapter };
  }

  /**
   * Explicitly creates a store with a custom storage adapter.
   */
  public static async createStoreWithAdapter(
    adapter: IPersistenceStorageAdapter
  ): Promise<PersistentLearningStore> {
    await adapter.init();
    return new PersistentLearningStore(adapter);
  }
}
