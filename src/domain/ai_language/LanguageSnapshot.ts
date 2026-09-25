/**
 * @file LanguageSnapshot.ts
 * @module domain/ai_language
 * @description Cryptographically bound immutable snapshot generator for TeacherLanguageContext (Section 4).
 */

import { TeacherLanguageContext } from './types.ts';
import { computeSha256Sync } from '../../infrastructure/crypto/Sha256Util.ts';

/**
 * Immutable cryptographic snapshot representing authorized policy boundaries.
 */
export interface LanguageContextSnapshot {
  readonly snapshotHash: string;
  readonly timestamp: number;
  readonly action: string;
  readonly targetQuranReference: string;
  readonly verifiedQuranText: string;
  readonly allowedClaims: readonly string[];
  readonly forbiddenClaims: readonly string[];
  readonly policyVersion: string;
  readonly quranDatasetHash: string;
  readonly tajweedKBHash: string;
  readonly modelVersion: string;
  readonly sessionSequence: number;
  readonly eventSequence: number;
}

/**
 * Recursively freezes an object to guarantee immutability.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const value = (obj as any)[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj as Readonly<T>;
}

/**
 * Generates a SHA-256 hash from a string payload.
 * Fully browser and Node.js compatible via computeSha256Sync.
 */
export function computeSha256(payload: string): string {
  return computeSha256Sync(payload);
}

/**
 * Creates an immutable, cryptographically bound snapshot of the language context.
 */
export function createLanguageSnapshot(
  context: Omit<TeacherLanguageContext, 'intentSnapshotHash'>
): LanguageContextSnapshot {
  const payloadToHash = JSON.stringify({
    action: context.action,
    intentType: context.teacherFeedbackIntent.intentType,
    targetWordIndex: context.teacherFeedbackIntent.targetWordIndex,
    verifiedQuranReference: context.verifiedQuranReference,
    verifiedQuranText: context.verifiedQuranText,
    allowedClaims: context.allowedClaims,
    forbiddenClaims: context.forbiddenClaims,
    policyVersion: context.policyVersion,
    quranDatasetHash: context.quranDatasetHash,
    tajweedKBHash: context.tajweedKBHash,
    modelVersion: context.modelVersion,
    sessionSequence: context.sessionSequence,
    eventSequence: context.eventSequence,
  });

  const snapshotHash = computeSha256(payloadToHash);

  const snapshot: LanguageContextSnapshot = {
    snapshotHash,
    timestamp: Date.now(),
    action: context.action,
    targetQuranReference: context.verifiedQuranReference,
    verifiedQuranText: context.verifiedQuranText,
    allowedClaims: [...context.allowedClaims],
    forbiddenClaims: [...context.forbiddenClaims],
    policyVersion: context.policyVersion,
    quranDatasetHash: context.quranDatasetHash,
    tajweedKBHash: context.tajweedKBHash,
    modelVersion: context.modelVersion,
    sessionSequence: context.sessionSequence,
    eventSequence: context.eventSequence,
  };

  return deepFreeze(snapshot);
}
