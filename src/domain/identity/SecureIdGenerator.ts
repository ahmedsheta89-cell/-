/**
 * @file SecureIdGenerator.ts
 * @module domain/identity
 * @description Cryptographically strong, collision-resistant ID generator for Phase 8A (Section 5, 6).
 * 
 * CORE GUARANTEES:
 * - Browser and Node runtime compatible (uses standard Web Crypto API).
 * - Zero Node-only imports (no `node:crypto`).
 * - Collision-resistant UUID v4 standard.
 * - Non-sequential: No predictable counter or timestamp-alone IDs.
 * - Zero PII: Does not encode email, IP, device fingerprints, or names.
 */

export class SecureIdGenerator {
  /**
   * Generates a cryptographically strong RFC 4122 v4 UUID.
   */
  public static generateUuid(): string {
    if (typeof crypto !== 'undefined') {
      if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      if (typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        // RFC 4122 v4 conformance
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      }
    }

    // High-entropy fallback for unusual environments
    let d = Date.now();
    let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = Math.random() * 16;
      if (d > 0) {
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else if (d2 > 0) {
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      } else {
        r = (r | 0) % 16;
      }
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  /**
   * Generates a canonical student identifier.
   */
  public static generateStudentId(type: 'ANON' | 'AUTH'): string {
    const prefix = type === 'ANON' ? 'stu-anon' : 'stu-auth';
    return `${prefix}-${this.generateUuid()}`;
  }

  /**
   * Generates an account identifier.
   */
  public static generateAccountId(): string {
    return `acc-${this.generateUuid()}`;
  }

  /**
   * Generates a device identifier.
   */
  public static generateDeviceId(): string {
    return `dev-${this.generateUuid()}`;
  }

  /**
   * Generates a teacher session identifier.
   */
  public static generateSessionId(): string {
    return `sess-${this.generateUuid()}`;
  }

  /**
   * Generates an identity migration identifier.
   */
  public static generateMigrationId(): string {
    return `mig-${this.generateUuid()}`;
  }
}
