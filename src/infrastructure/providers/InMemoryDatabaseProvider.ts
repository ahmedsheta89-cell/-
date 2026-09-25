/**
 * @file InMemoryDatabaseProvider.ts
 * @module infrastructure/providers
 * @description In-memory store implementing IDatabaseProvider for testing and vendor-neutral operation.
 */

import { IDatabaseProvider, QueryFilter, QueryOptions } from '../interfaces/IDatabaseProvider.ts';

export class InMemoryDatabaseProvider implements IDatabaseProvider {
  private store: Map<string, Map<string, Record<string, unknown>>> = new Map();

  private getCollectionMap(collection: string): Map<string, Record<string, unknown>> {
    if (!this.store.has(collection)) {
      this.store.set(collection, new Map());
    }
    return this.store.get(collection)!;
  }

  async getDocument<T>(collection: string, docId: string): Promise<T | null> {
    const col = this.getCollectionMap(collection);
    const data = col.get(docId);
    return data ? (structuredClone(data) as T) : null;
  }

  async setDocument<T>(collection: string, docId: string, data: T, merge = false): Promise<void> {
    const col = this.getCollectionMap(collection);
    if (merge && col.has(docId)) {
      const existing = col.get(docId)!;
      col.set(docId, { ...existing, ...(data as Record<string, unknown>) });
    } else {
      col.set(docId, structuredClone(data as Record<string, unknown>));
    }
  }

  async updateDocument(collection: string, docId: string, data: Record<string, unknown>): Promise<void> {
    const col = this.getCollectionMap(collection);
    if (!col.has(docId)) {
      throw new Error(`Document ${collection}/${docId} not found for update`);
    }
    const existing = col.get(docId)!;
    col.set(docId, { ...existing, ...data });
  }

  async deleteDocument(collection: string, docId: string): Promise<void> {
    const col = this.getCollectionMap(collection);
    col.delete(docId);
  }

  async queryDocuments<T>(collection: string, filters: QueryFilter[], options?: QueryOptions): Promise<T[]> {
    const col = this.getCollectionMap(collection);
    let results = Array.from(col.values());

    for (const filter of filters) {
      results = results.filter((doc) => {
        const val = doc[filter.field];
        switch (filter.operator) {
          case '==':
            return val === filter.value;
          case '!=':
            return val !== filter.value;
          case '>':
            return (val as number) > (filter.value as number);
          case '>=':
            return (val as number) >= (filter.value as number);
          case '<':
            return (val as number) < (filter.value as number);
          case '<=':
            return (val as number) <= (filter.value as number);
          default:
            return true;
        }
      });
    }

    if (options?.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results as unknown as T[];
  }
}
