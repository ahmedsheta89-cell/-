/**
 * @file InMemorySyncTransport.ts
 * @module infrastructure/sync
 * @description Provider-neutral in-memory simulation transport for Phase 8C synchronization testing.
 * 
 * NOTICE:
 * This is a deterministic TEST SIMULATION TRANSPORT for verification and adversarial testing.
 * It is NOT a cloud provider or production backend.
 * 
 * SUPPORTS:
 * - Offline / online transitions
 * - Dropped pushes / packets
 * - Network latency and delayed delivery
 * - Duplicate delivery simulation
 * - Out-of-order delivery permutation
 * - Permanent and transient event rejections
 * - Conflicting event injection (same eventId, divergent hash)
 * - Server cursor management and reset
 */

import {
  ISyncTransport,
  SyncEventEnvelope,
  SyncPushResult,
  SyncPullResult,
  ResyncResponse,
} from '../../domain/sync/types.ts';
import { TransportFailureError } from '../../domain/sync/errorRegistry.ts';

export class InMemorySyncTransport implements ISyncTransport {
  // Remote "server" store keyed by studentId -> Array of accepted envelopes
  private serverEvents = new Map<string, SyncEventEnvelope[]>();
  private serverCursors = new Map<string, number>();

  // Simulation flags & hooks
  private connected: boolean = true;
  private dropPushes: boolean = false;
  private delayMs: number = 0;
  private duplicateDeliveryCount: number = 0;
  private reversePullOrder: boolean = false;
  private permanentRejectEventIds = new Set<string>();
  private transientRejectEventIds = new Set<string>();
  private conflictingEvents = new Map<string, SyncEventEnvelope>(); // eventId -> divergent envelope

  public async connect(): Promise<void> {
    this.connected = true;
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  // --- Fault Injection & Simulation Controls ---
  public setConnected(connected: boolean): void {
    this.connected = connected;
  }

  public setDropPushes(drop: boolean): void {
    this.dropPushes = drop;
  }

  public setDelayMs(ms: number): void {
    this.delayMs = ms;
  }

  public setDuplicateDeliveryCount(count: number): void {
    this.duplicateDeliveryCount = count;
  }

  public setReversePullOrder(reverse: boolean): void {
    this.reversePullOrder = reverse;
  }

  public rejectEventPermanently(syncEventId: string): void {
    this.permanentRejectEventIds.add(syncEventId);
  }

  public rejectEventTransiently(syncEventId: string): void {
    this.transientRejectEventIds.add(syncEventId);
  }

  public injectConflict(eventId: string, divergentEnvelope: SyncEventEnvelope): void {
    this.conflictingEvents.set(eventId, divergentEnvelope);
  }

  public resetServerState(): void {
    this.serverEvents.clear();
    this.serverCursors.clear();
    this.permanentRejectEventIds.clear();
    this.transientRejectEventIds.clear();
    this.conflictingEvents.clear();
    this.dropPushes = false;
    this.delayMs = 0;
    this.duplicateDeliveryCount = 0;
    this.reversePullOrder = false;
  }

  private async simulateNetworkConditions(): Promise<void> {
    if (!this.connected) {
      throw new TransportFailureError('Network offline: transport disconnected.');
    }
    if (this.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.delayMs));
    }
  }

  // --- Core ISyncTransport Methods ---

  public async push(envelopes: readonly SyncEventEnvelope[]): Promise<SyncPushResult> {
    await this.simulateNetworkConditions();

    if (this.dropPushes) {
      throw new TransportFailureError('Simulated network drop: request timed out.');
    }

    const acceptedIds: string[] = [];
    const rejected: { syncEventId: string; reason: string; permanent: boolean }[] = [];
    const conflicts: { syncEventId: string; conflictingEventId: string; reason: string }[] = [];

    let currentCursor = 0;

    for (const env of envelopes) {
      const studentId = env.studentId;
      if (!this.serverEvents.has(studentId)) {
        this.serverEvents.set(studentId, []);
        this.serverCursors.set(studentId, 0);
      }

      const existingStream = this.serverEvents.get(studentId)!;

      // 1. Permanent rejection simulation
      if (this.permanentRejectEventIds.has(env.syncEventId)) {
        rejected.push({
          syncEventId: env.syncEventId,
          reason: 'Simulated permanent server schema rejection.',
          permanent: true,
        });
        continue;
      }

      // 2. Transient rejection simulation
      if (this.transientRejectEventIds.has(env.syncEventId)) {
        this.transientRejectEventIds.delete(env.syncEventId); // transient: happens once
        rejected.push({
          syncEventId: env.syncEventId,
          reason: 'Simulated transient server 503 rate-limit.',
          permanent: false,
        });
        continue;
      }

      // 3. Check for existing eventId with DIFFERENT eventHash (Section 14: Conflict)
      const existingSameId = existingStream.find((e) => e.eventId === env.eventId);
      const injectedConf = this.conflictingEvents.get(env.eventId);
      if ((existingSameId && existingSameId.eventHash !== env.eventHash) ||
          (injectedConf && injectedConf.eventHash !== env.eventHash)) {
        conflicts.push({
          syncEventId: env.syncEventId,
          conflictingEventId: env.eventId,
          reason: `Immutable conflict: same eventId '${env.eventId}' with divergent hash.`,
        });
        continue;
      }

      // 4. Check for already accepted identical event (Idempotent ACK)
      if (existingSameId && existingSameId.eventHash === env.eventHash) {
        acceptedIds.push(env.syncEventId);
        continue;
      }

      // 5. Normal acceptance
      existingStream.push(env);
      currentCursor = (this.serverCursors.get(studentId) || 0) + 1;
      this.serverCursors.set(studentId, currentCursor);
      acceptedIds.push(env.syncEventId);
    }

    const firstStudentId = envelopes.length > 0 ? envelopes[0].studentId : 'default';
    const serverCursorStr = String(this.serverCursors.get(firstStudentId) || currentCursor);

    return {
      acceptedIds,
      rejected,
      conflicts,
      serverCursor: serverCursorStr,
    };
  }

  public async pull(studentId: string, sinceCursor: string | null, limit: number = 50): Promise<SyncPullResult> {
    await this.simulateNetworkConditions();

    const stream = this.serverEvents.get(studentId) || [];
    const startIndex = sinceCursor ? parseInt(sinceCursor, 10) : 0;
    const safeStart = isNaN(startIndex) ? 0 : Math.max(0, startIndex);

    let pulled = stream.slice(safeStart, safeStart + limit);

    // Conflict injection simulation: inject a divergent conflicting envelope if scheduled
    for (let i = 0; i < pulled.length; i++) {
      const conflict = this.conflictingEvents.get(pulled[i].eventId);
      if (conflict) {
        pulled[i] = conflict;
      }
    }

    // Duplicate delivery simulation
    if (this.duplicateDeliveryCount > 0 && pulled.length > 0) {
      const duplicates: SyncEventEnvelope[] = [];
      for (let d = 0; d < this.duplicateDeliveryCount; d++) {
        duplicates.push(...pulled);
      }
      pulled = [...pulled, ...duplicates];
    }

    // Out-of-order delivery simulation
    if (this.reversePullOrder && pulled.length > 1) {
      pulled = [...pulled].reverse();
    }

    const nextIndex = safeStart + pulled.length;
    const hasMore = nextIndex < stream.length;
    const serverCursor = String(stream.length);

    return {
      envelopes: pulled,
      nextCursor: String(nextIndex),
      hasMore,
      serverCursor,
    };
  }

  public async acknowledge(studentId: string, syncEventIds: readonly string[]): Promise<void> {
    await this.simulateNetworkConditions();
    // Acknowledge recorded
  }

  public async requestResync(studentId: string): Promise<ResyncResponse> {
    await this.simulateNetworkConditions();

    const stream = this.serverEvents.get(studentId) || [];
    return {
      resetCursor: '0',
      totalAvailableEvents: stream.length,
      initialBatch: stream.slice(0, 50),
    };
  }

  public async getServerCursor(studentId: string): Promise<string | null> {
    await this.simulateNetworkConditions();
    const cursor = this.serverCursors.get(studentId);
    return cursor !== undefined ? String(cursor) : null;
  }

  // --- Direct Test Helper for Seeding Remote Data ---
  public seedServerEvent(studentId: string, envelope: SyncEventEnvelope): void {
    if (!this.serverEvents.has(studentId)) {
      this.serverEvents.set(studentId, []);
      this.serverCursors.set(studentId, 0);
    }
    const stream = this.serverEvents.get(studentId)!;
    stream.push(envelope);
    this.serverCursors.set(studentId, stream.length);
  }
}
