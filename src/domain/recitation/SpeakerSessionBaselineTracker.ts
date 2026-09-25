/**
 * @file SpeakerSessionBaselineTracker.ts
 * @module domain/recitation
 * @description Session-level speech rate and mora normalization tracker (Section 18).
 * 
 * CORE CONTRACT:
 * Distinguishes NO_BASELINE, INSUFFICIENT_BASELINE, and VALID_BASELINE.
 * Prevents forcing normalization when insufficient data exists.
 */

import {
  SpeakerSessionBaseline,
  SpeakerBaselineState,
} from './acousticFeatureTypes.ts';

export class SpeakerSessionBaselineTracker {
  private sampleDurations: number[] = [];
  private sampleRates: number[] = [];
  private pitchSamples: number[] = [];

  /**
   * Resets the tracker for a new session.
   */
  public reset(): void {
    this.sampleDurations = [];
    this.sampleRates = [];
    this.pitchSamples = [];
  }

  /**
   * Observes a verified phoneme/mora segment duration.
   */
  public observeSegment(durationSeconds: number, speechRate?: number, pitchHz?: number): void {
    if (durationSeconds > 0.02 && durationSeconds < 3.0) {
      this.sampleDurations.push(durationSeconds);
    }
    if (speechRate && speechRate > 0.5 && speechRate < 15.0) {
      this.sampleRates.push(speechRate);
    }
    if (pitchHz && pitchHz > 60 && pitchHz < 500) {
      this.pitchSamples.push(pitchHz);
    }
  }

  /**
   * Computes the current speaker baseline.
   */
  public getBaseline(): SpeakerSessionBaseline {
    const count = this.sampleDurations.length;

    if (count === 0) {
      return Object.freeze({
        baselineState: SpeakerBaselineState.NO_BASELINE,
        sampleCount: 0,
        meanMoraSeconds: 0.20, // Theoretical reference prior
        meanSpeechRatePhonemesPerSecond: 5.0,
      });
    }

    if (count < 8) {
      const sumDur = this.sampleDurations.reduce((a, b) => a + b, 0);
      return Object.freeze({
        baselineState: SpeakerBaselineState.INSUFFICIENT_BASELINE,
        sampleCount: count,
        meanMoraSeconds: sumDur / count,
        meanSpeechRatePhonemesPerSecond:
          this.sampleRates.length > 0
            ? this.sampleRates.reduce((a, b) => a + b, 0) / this.sampleRates.length
            : 5.0,
      });
    }

    // VALID_BASELINE: trimmed mean to discard outliers
    const sorted = [...this.sampleDurations].sort((a, b) => a - b);
    const trim = Math.floor(sorted.length * 0.1);
    const trimmed = sorted.slice(trim, sorted.length - trim);
    const meanMoraSeconds = trimmed.reduce((a, b) => a + b, 0) / (trimmed.length || 1);

    const meanSpeechRate =
      this.sampleRates.length > 0
        ? this.sampleRates.reduce((a, b) => a + b, 0) / this.sampleRates.length
        : 1.0 / (meanMoraSeconds || 0.2);

    let pitchMedian: number | undefined;
    if (this.pitchSamples.length >= 5) {
      const sortedPitch = [...this.pitchSamples].sort((a, b) => a - b);
      pitchMedian = sortedPitch[Math.floor(sortedPitch.length / 2)];
    }

    return Object.freeze({
      baselineState: SpeakerBaselineState.VALID_BASELINE,
      sampleCount: count,
      meanMoraSeconds,
      meanSpeechRatePhonemesPerSecond: meanSpeechRate,
      pitchMedianHz: pitchMedian,
    });
  }
}
