/**
 * @file SyncEnvelopeSerializer.ts
 * @module domain/sync
 * @description Canonical serialization, cryptographic envelope binding, and ordering for Phase 8C Sync.
 * 
 * CORE GUARANTEES:
 * - Zero Raw Audio: Scans payload recursively; throws RawAudioSyncRejectedError if raw audio is found.
 * - Cryptographic Binding: Envelope hash binds origin device, origin sequence, event hash, and canonical payload.
 * - Multi-Device Deterministic Ordering: Total order based on (sequenceNumber, createdAt, originDeviceId, eventId).
 */

import { computeSha256Sync } from '../../infrastructure/crypto/Sha256Util.ts';
import { CanonicalSerializer } from '../persistence/CanonicalSerializer.ts';
import { PersistentMemorizationEvent } from '../persistence/types.ts';
import {
  SyncEventEnvelope,
  CURRENT_SYNC_PROTOCOL_VERSION,
  CURRENT_SYNC_SCHEMA_VERSION,
} from './types.ts';
import {
  RawAudioSyncRejectedError,
  SyncHashMismatchError,
  UnsupportedProtocolError,
  SyncSchemaMismatchError,
} from './errorRegistry.ts';

export class SyncEnvelopeSerializer {
  /**
   * Section 29: Invariant Guard: Strictly reject raw audio data from sync transport.
   */
  public static assertNoAudioSync(value: unknown, path: string = 'root'): void {
    if (value === null || value === undefined) {
      return;
    }

    // Check for typed audio arrays
    if (value instanceof Float32Array || value instanceof Float64Array) {
      throw new RawAudioSyncRejectedError(`Float32/64Array raw sample buffer detected at '${path}'.`);
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      throw new RawAudioSyncRejectedError(`Raw ArrayBuffer detected at '${path}'.`);
    }

    if (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array && (value as Uint8Array).length > 2048) {
      throw new RawAudioSyncRejectedError(`Large byte buffer (possible PCM audio) detected at '${path}'.`);
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;

      // Explicit flag violations
      if (obj.rawAudioSync === true || (obj as { rawAudioPersistence?: boolean }).rawAudioPersistence === true) {
        throw new RawAudioSyncRejectedError(`rawAudioSync / rawAudioPersistence flag set to true at '${path}'.`);
      }

      if ('audioBuffer' in obj || 'pcmData' in obj || 'audioBlob' in obj || 'samples' in obj || 'pcm' in obj) {
        throw new RawAudioSyncRejectedError(`Suspected raw audio property found at '${path}'.`);
      }

      // Check constructor name
      const ctorName = obj.constructor ? obj.constructor.name : '';
      if (ctorName === 'AudioBuffer' || ctorName === 'Blob' || ctorName === 'File') {
        throw new RawAudioSyncRejectedError(`Audio object '${ctorName}' detected at '${path}'.`);
      }

      for (const [key, val] of Object.entries(obj)) {
        this.assertNoAudioSync(val, `${path}.${key}`);
      }
    }
  }

  /**
   * Computes SHA-256 hash of any arbitrary payload canonically.
   */
  public static computePayloadHash(payload: unknown): string {
    this.assertNoAudioSync(payload, 'payload');
    const canonicalStr = CanonicalSerializer.canonicalStringify(payload);
    return computeSha256Sync(canonicalStr);
  }

  /**
   * Computes the deterministic SHA-256 hash of a sync envelope.
   */
  public static computeEnvelopeHash(
    envelope: Omit<SyncEventEnvelope, 'envelopeHash'>
  ): string {
    this.assertNoAudioSync(envelope.payload, 'envelope.payload');

    const canonicalFields = {
      createdAt: envelope.createdAt,
      deviceId: envelope.deviceId,
      eventId: envelope.eventId,
      eventHash: envelope.eventHash,
      originDeviceId: envelope.originDeviceId,
      originSequence: envelope.originSequence,
      payloadHash: envelope.payloadHash,
      previousEventHash: envelope.previousEventHash,
      protocolVersion: envelope.protocolVersion,
      schemaVersion: envelope.schemaVersion,
      sequenceNumber: envelope.sequenceNumber,
      sessionId: envelope.sessionId,
      studentId: envelope.studentId,
      syncEventId: envelope.syncEventId,
    };

    const canonicalStr = CanonicalSerializer.canonicalStringify(canonicalFields);
    return computeSha256Sync(canonicalStr);
  }

  /**
   * Wraps a persistent learning event into a validated, cryptographically bound SyncEventEnvelope.
   */
  public static createEnvelope(params: {
    event: PersistentMemorizationEvent;
    deviceId: string;
    protocolVersion?: string;
  }): SyncEventEnvelope {
    const { event, deviceId, protocolVersion = CURRENT_SYNC_PROTOCOL_VERSION } = params;

    this.assertNoAudioSync(event, 'event');

    const payloadHash = this.computePayloadHash(event);
    const syncEventId = `sync_${deviceId}_${event.sequenceNumber}_${event.eventId.substring(0, 12)}`;

    const partialEnvelope: Omit<SyncEventEnvelope, 'envelopeHash'> = {
      syncEventId,
      eventId: event.eventId,
      studentId: event.studentId,
      deviceId,
      sessionId: event.sessionId,
      sequenceNumber: event.sequenceNumber,
      eventHash: event.eventHash,
      previousEventHash: event.previousEventHash,
      schemaVersion: CURRENT_SYNC_SCHEMA_VERSION,
      protocolVersion,
      createdAt: event.timestamp || Date.now(),
      originDeviceId: deviceId,
      originSequence: event.sequenceNumber,
      payload: event,
      payloadHash,
    };

    const envelopeHash = this.computeEnvelopeHash(partialEnvelope);

    return {
      ...partialEnvelope,
      envelopeHash,
    };
  }

  /**
   * Validates an inbound or outbound envelope against integrity and version constraints.
   */
  public static validateEnvelope(envelope: SyncEventEnvelope): void {
    if (!envelope) {
      throw new Error('Sync envelope is null or undefined.');
    }

    if (envelope.protocolVersion !== CURRENT_SYNC_PROTOCOL_VERSION) {
      throw new UnsupportedProtocolError(envelope.protocolVersion, CURRENT_SYNC_PROTOCOL_VERSION);
    }

    if (envelope.schemaVersion !== CURRENT_SYNC_SCHEMA_VERSION) {
      throw new SyncSchemaMismatchError(envelope.schemaVersion, CURRENT_SYNC_SCHEMA_VERSION);
    }

    this.assertNoAudioSync(envelope.payload, 'envelope.payload');

    // Verify payload hash
    const expectedPayloadHash = this.computePayloadHash(envelope.payload);
    if (envelope.payloadHash !== expectedPayloadHash) {
      throw new SyncHashMismatchError('SyncEventEnvelope.payloadHash', expectedPayloadHash, envelope.payloadHash);
    }

    // Verify envelope hash
    const expectedEnvelopeHash = this.computeEnvelopeHash(envelope);
    if (envelope.envelopeHash !== expectedEnvelopeHash) {
      throw new SyncHashMismatchError('SyncEventEnvelope.envelopeHash', expectedEnvelopeHash, envelope.envelopeHash);
    }

    // Verify internal event consistency
    const event = envelope.payload as PersistentMemorizationEvent;
    if (event.eventId !== envelope.eventId) {
      throw new Error(`Envelope eventId '${envelope.eventId}' does not match payload eventId '${event.eventId}'.`);
    }
    if (event.studentId !== envelope.studentId) {
      throw new Error(`Envelope studentId '${envelope.studentId}' does not match payload studentId '${event.studentId}'.`);
    }
    if (event.eventHash !== envelope.eventHash) {
      throw new SyncHashMismatchError('Envelope eventHash vs payload', event.eventHash, envelope.eventHash);
    }
  }

  /**
   * Section 13: Deterministic multi-device event comparator.
   * Does NOT rely exclusively on wall-clock timestamps.
   * Tuple: (sequenceNumber, createdAt, originDeviceId, eventId)
   */
  public static compareSyncEnvelopes(a: SyncEventEnvelope, b: SyncEventEnvelope): number {
    // 1. Same origin device: strict sequenceNumber
    if (a.originDeviceId === b.originDeviceId) {
      if (a.originSequence !== b.originSequence) {
        return a.originSequence - b.originSequence;
      }
    }

    // 2. Global sequenceNumber if available
    if (a.sequenceNumber !== b.sequenceNumber) {
      return a.sequenceNumber - b.sequenceNumber;
    }

    // 3. Wall-clock timestamp / createdAt
    if (a.createdAt !== b.createdAt) {
      return a.createdAt - b.createdAt;
    }

    // 4. Deterministic string tie-breaker: originDeviceId
    const devCmp = a.originDeviceId.localeCompare(b.originDeviceId);
    if (devCmp !== 0) {
      return devCmp;
    }

    // 5. Final deterministic tie-breaker: eventId
    return a.eventId.localeCompare(b.eventId);
  }
}
