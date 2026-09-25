/**
 * @file SyncCoordinatorFactory.ts
 * @module domain/sync
 * @description Factory for assembling SyncCoordinator with suitable storage adapter and transport.
 */

import { IPersistentLearningStore } from '../persistence/types.ts';
import { AuthenticationGuard } from '../identity/AuthenticationGuard.ts';
import { ISyncStorageAdapter, ISyncTransport, SyncStatusSummary } from './types.ts';
import { SyncCoordinator } from './SyncCoordinator.ts';
import { MemorySyncStorageAdapter } from '../../infrastructure/sync/MemorySyncStorageAdapter.ts';
import { IndexedDBSyncStorageAdapter } from '../../infrastructure/sync/IndexedDBSyncStorageAdapter.ts';
import { InMemorySyncTransport } from '../../infrastructure/sync/InMemorySyncTransport.ts';

export interface CreateSyncCoordinatorParams {
  readonly persistentStore: IPersistentLearningStore;
  readonly authGuard: AuthenticationGuard;
  readonly deviceId: string;
  readonly storageAdapter?: 'memory' | 'indexeddb' | ISyncStorageAdapter;
  readonly transport?: ISyncTransport;
  readonly batchSize?: number;
  readonly maxRetries?: number;
  readonly onStatusChange?: (status: SyncStatusSummary) => void;
}

export class SyncCoordinatorFactory {
  public static async create(params: CreateSyncCoordinatorParams): Promise<SyncCoordinator> {
    let syncStorage: ISyncStorageAdapter;

    if (!params.storageAdapter || params.storageAdapter === 'memory') {
      syncStorage = new MemorySyncStorageAdapter();
    } else if (params.storageAdapter === 'indexeddb') {
      syncStorage = new IndexedDBSyncStorageAdapter();
    } else {
      syncStorage = params.storageAdapter;
    }

    const transport = params.transport || new InMemorySyncTransport();

    const coordinator = new SyncCoordinator({
      persistentStore: params.persistentStore,
      syncStorage,
      transport,
      authGuard: params.authGuard,
      deviceId: params.deviceId,
      batchSize: params.batchSize,
      maxRetries: params.maxRetries,
      onStatusChange: params.onStatusChange,
    });

    await coordinator.init();
    return coordinator;
  }
}
