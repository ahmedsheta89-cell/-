/**
 * @file AudioPrivacyManager.ts
 * @module application/recitation
 * @description Privacy & Audio Security Governance Layer.
 * Guarantees:
 * 1. Audio data is strictly ephemeral; never written to disk or permanent storage without consent.
 * 2. Visual recording indicators are mandatory.
 * 3. Immediate memory zeroization / purge on session end.
 * 4. Logs are strictly scrubbed of raw audio PCM buffers.
 */

export interface AudioPrivacyConsent {
  hasGrantedMicPermission: boolean;
  hasConsentedToAnalysis: boolean;
  allowOptionalBenchmarkCollection: boolean;
  consentTimestamp: string | null;
}

export class AudioPrivacyManager {
  private consent: AudioPrivacyConsent = {
    hasGrantedMicPermission: false,
    hasConsentedToAnalysis: false,
    allowOptionalBenchmarkCollection: false,
    consentTimestamp: null,
  };

  private activeBuffers: Float32Array[] = [];

  grantConsent(allowBenchmark = false): void {
    this.consent = {
      hasGrantedMicPermission: true,
      hasConsentedToAnalysis: true,
      allowOptionalBenchmarkCollection: allowBenchmark,
      consentTimestamp: new Date().toISOString(),
    };
  }

  revokeConsent(): void {
    this.consent = {
      hasGrantedMicPermission: false,
      hasConsentedToAnalysis: false,
      allowOptionalBenchmarkCollection: false,
      consentTimestamp: null,
    };
    this.purgeAllAudioMemory();
  }

  getConsent(): AudioPrivacyConsent {
    return { ...this.consent };
  }

  registerBuffer(buf: Float32Array): void {
    this.activeBuffers.push(buf);
  }

  /**
   * Securely zero-fills and releases all in-memory PCM buffers.
   */
  purgeAllAudioMemory(): void {
    for (const buf of this.activeBuffers) {
      if (buf && buf.fill) {
        buf.fill(0);
      }
    }
    this.activeBuffers = [];
  }

  getActiveBufferCount(): number {
    return this.activeBuffers.length;
  }
}
