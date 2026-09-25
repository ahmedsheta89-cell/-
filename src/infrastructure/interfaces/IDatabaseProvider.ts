/**
 * @file IDatabaseProvider.ts
 * @module infrastructure/interfaces
 * @description Persistent database abstraction decoupled from Firestore / PostgreSQL / MongoDB.
 */

export interface QueryFilter {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains';
  value: unknown;
}

export interface QueryOptions {
  limit?: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  startAfter?: unknown;
}

export interface IDatabaseProvider {
  getDocument<T>(collection: string, docId: string): Promise<T | null>;
  setDocument<T>(collection: string, docId: string, data: T, merge?: boolean): Promise<void>;
  updateDocument(collection: string, docId: string, data: Record<string, unknown>): Promise<void>;
  deleteDocument(collection: string, docId: string): Promise<void>;
  queryDocuments<T>(collection: string, filters: QueryFilter[], options?: QueryOptions): Promise<T[]>;
}
