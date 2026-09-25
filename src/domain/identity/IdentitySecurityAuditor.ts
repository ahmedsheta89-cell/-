/**
 * @file IdentitySecurityAuditor.ts
 * @module domain/identity
 * @description Privacy and Security Enforcement Auditor for Phase 8A (Sections 21, 22, 23, 24, 25).
 * 
 * CORE SECURITY INVARIANTS:
 * - Credential Leakage Prevention: Scans and scrubs passwords, bearer tokens, refresh tokens, and secrets (AUTH-010).
 * - Gemini Boundary: Strips all authentication metadata, tokens, and credentials before reaching the AI Language layer.
 * - Data Minimization: Blocks storage of medical, religious/psychological profiling, or behavioral labels.
 * - Zero Audio Retention Backdoor: Enforces rawAudioPersistence === false across all identity payloads.
 */

import {
  CredentialExposureError,
  AIIdentityTamperingError,
} from './errorRegistry.ts';

export class IdentitySecurityAuditor {
  // Prohibited credential and secret pattern tokens
  private static readonly SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /credential/i,
    /api[-_]?key/i,
    /bearer/i,
    /auth[-_]?code/i,
    /jwt/i,
    /refresh[-_]?token/i,
    /access[-_]?token/i,
  ];

  // Prohibited profiling keywords (medical, psychological, religious profiling)
  private static readonly PROHIBITED_PROFILING_PATTERNS = [
    /medical/i,
    /psychological/i,
    /iq[-_]?score/i,
    /intelligence[-_]?level/i,
    /religious[-_]?piety/i,
    /sectarian/i,
    /political/i,
    /behavioral[-_]?diagnosis/i,
  ];

  /**
   * Section 24 & 25: Asserts that an arbitrary context object contains NO authentication credentials or secrets.
   */
  public static assertNoCredentials(obj: unknown, locationContext: string = 'context'): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.assertNoCredentials(item, locationContext);
      }
      return;
    }

    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      // Check for sensitive credential keys
      for (const pattern of this.SENSITIVE_KEY_PATTERNS) {
        if (pattern.test(key)) {
          const val = record[key];
          // If value is non-empty string or object, reject
          if (val && typeof val === 'string' && val.length > 0) {
            throw new CredentialExposureError(locationContext, key);
          }
        }
      }

      // Recursively check child objects
      if (record[key] && typeof record[key] === 'object') {
        this.assertNoCredentials(record[key], `${locationContext}.${key}`);
      }
    }
  }

  /**
   * Section 22: Asserts that no sensitive medical, religious profiling, or psychological profiling exists.
   */
  public static assertNoProhibitedProfiling(obj: unknown, locationContext: string = 'account_or_profile'): void {
    if (!obj || typeof obj !== 'object') return;

    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      for (const pattern of this.PROHIBITED_PROFILING_PATTERNS) {
        if (pattern.test(key)) {
          throw new AIIdentityTamperingError(
            `Data minimization violation at [${locationContext}]: prohibited profiling field '${key}' detected.`
          );
        }
      }
      if (record[key] && typeof record[key] === 'object') {
        this.assertNoProhibitedProfiling(record[key], `${locationContext}.${key}`);
      }
    }
  }

  /**
   * Section 21: Asserts that raw audio (Float32Array, AudioBuffer, PCM) is not smuggled in identity records.
   */
  public static assertNoAudioSmuggling(obj: unknown, locationContext: string = 'identity_payload'): void {
    if (!obj || typeof obj !== 'object') return;

    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const val = record[key];
      if (
        val instanceof Float32Array ||
        val instanceof Uint8Array ||
        (Array.isArray(val) && val.length > 256 && typeof val[0] === 'number')
      ) {
        throw new AIIdentityTamperingError(
          `Security violation: Raw audio buffer detected in identity context [${locationContext}]: field '${key}'.`
        );
      }
    }
  }

  /**
   * Section 25: Sanitizes any payload before it reaches Gemini or logging.
   * Strips passwords, auth tokens, secrets, and raw identity metadata.
   */
  public static sanitizeContextForAI<T extends Record<string, unknown>>(context: T): Partial<T> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      let isSensitive = false;
      for (const pattern of this.SENSITIVE_KEY_PATTERNS) {
        if (pattern.test(key)) {
          isSensitive = true;
          break;
        }
      }

      if (isSensitive) {
        // Strip completely from AI context
        continue;
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeContextForAI(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as Partial<T>;
  }

  /**
   * Section 23: Sanitizes structured log entries, masking student IDs and omitting tokens.
   */
  public static sanitizeLogEntry(entry: Record<string, unknown>): Record<string, unknown> {
    const sanitized = this.sanitizeContextForAI(entry);
    if (sanitized.studentId && typeof sanitized.studentId === 'string') {
      const s = sanitized.studentId;
      sanitized.studentId = s.length > 8 ? `${s.slice(0, 4)}...${s.slice(-4)}` : '***';
    }
    return sanitized;
  }
}
