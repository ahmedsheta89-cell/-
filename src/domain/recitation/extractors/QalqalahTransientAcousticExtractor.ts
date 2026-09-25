/**
 * @file QalqalahTransientAcousticExtractor.ts
 * @module domain/recitation/extractors
 * @description Real Physical Qalqalah Burst Transient Extractor (Section 15).
 * 
 * CORE CONTRACT:
 * Measures post-closure acoustic burst release (< 35ms duration, rapid energy rise).
 * Rejects non-speech transients (clicks, claps, clipping) using preceding closure silence check.
 * 
 * STRICT PROHIBITIONS:
 * - Never equates any arbitrary energy spike with Qalqalah.
 * - Never produces an automated religious error.
 */

import {
  AcousticFeatureType,
  AcousticEvidenceStatus,
  AcousticFeatureEvidence,
  AcousticFeatureExtractionInput,
  IAcousticFeatureExtractor,
  SignalQualityLevel,
} from '../acousticFeatureTypes.ts';
import { OFFICIAL_MODEL_HASH } from '../RecitationErrorDecisionEngine.ts';

export class QalqalahTransientAcousticExtractor implements IAcousticFeatureExtractor {
  public readonly featureType = AcousticFeatureType.QALQALAH_TRANSIENT;
  public readonly algorithmVersion = 'qalqalah-transient-burst-v1.0.0';

  public extract(input: AcousticFeatureExtractionInput): AcousticFeatureEvidence {
    const evidenceId = `qalq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = Math.max(0, input.endTime - input.startTime);

    if (input.signalQuality.overallQuality === SignalQualityLevel.DEGRADED) {
      return Object.freeze({
        evidenceId,
        ayahId: input.ayahId,
        wordIndex: input.wordIndex,
        phonemeIndex: input.phonemeIndex,
        featureType: this.featureType,
        expectedContext: {
          canonicalPhoneme: input.expectedPhoneme,
          ruleId: input.ruleId,
        },
        observedMeasurement: {
          durationSeconds: duration,
        },
        normalizedValue: null,
        referenceRange: { min: 8.0, max: 35.0, unit: 'dB_rise' },
        confidence: 0.1,
        quality: input.signalQuality.overallQuality,
        startTime: input.startTime,
        endTime: input.endTime,
        signalQuality: input.signalQuality,
        modelVersion: '3.1.0-int8-hardened',
        modelHash: OFFICIAL_MODEL_HASH,
        featureAlgorithmVersion: this.algorithmVersion,
        sourceEvidenceIds: [],
        evidenceStatus: AcousticEvidenceStatus.INSUFFICIENT_SIGNAL,
        limitation: 'ERR-ACOUSTIC-007: Noise or clipping obscures transient release dynamics',
        timestamp: new Date().toISOString(),
      });
    }

    if (!input.isAlignmentStable || input.alignmentConfidence < 0.75) {
      return Object.freeze({
        evidenceId,
        ayahId: input.ayahId,
        wordIndex: input.wordIndex,
        phonemeIndex: input.phonemeIndex,
        featureType: this.featureType,
        expectedContext: {
          canonicalPhoneme: input.expectedPhoneme,
          ruleId: input.ruleId,
        },
        observedMeasurement: {
          durationSeconds: duration,
        },
        normalizedValue: null,
        referenceRange: { min: 8.0, max: 35.0, unit: 'dB_rise' },
        confidence: 0.2,
        quality: input.signalQuality.overallQuality,
        startTime: input.startTime,
        endTime: input.endTime,
        signalQuality: input.signalQuality,
        modelVersion: '3.1.0-int8-hardened',
        modelHash: OFFICIAL_MODEL_HASH,
        featureAlgorithmVersion: this.algorithmVersion,
        sourceEvidenceIds: [],
        evidenceStatus: AcousticEvidenceStatus.INCONCLUSIVE,
        limitation: 'ERR-ACOUSTIC-006: Unstable alignment boundary prevents resolving sub-35ms transient',
        timestamp: new Date().toISOString(),
      });
    }

    const sampleRate = input.sampleRate || 16000;
    const startIdx = Math.max(0, Math.floor(input.startTime * sampleRate));
    const endIdx = Math.min(input.pcmAudio.length, Math.ceil(input.endTime * sampleRate));
    const segment = input.pcmAudio.subarray(startIdx, endIdx);

    // Negative control check 1: Audio clipping detection across transient
    let hasClippingInSegment = false;
    for (let i = 0; i < segment.length; i++) {
      if (Math.abs(segment[i]) >= 0.99) {
        hasClippingInSegment = true;
        break;
      }
    }

    // Measure pre-burst closure energy (first 25% of segment) vs burst peak energy (middle/release)
    const closureLength = Math.max(16, Math.floor(segment.length * 0.3));
    let closureSq = 0;
    for (let i = 0; i < closureLength; i++) {
      closureSq += segment[i] * segment[i];
    }
    const closureRms = Math.sqrt(closureSq / closureLength);

    // Find peak burst window (3ms sliding window)
    const win3ms = Math.floor(sampleRate * 0.003);
    let peakBurstRms = 0;
    let peakIndex = 0;
    for (let i = closureLength; i + win3ms <= segment.length; i += Math.max(1, Math.floor(win3ms / 2))) {
      let winSq = 0;
      for (let j = 0; j < win3ms; j++) {
        const s = segment[i + j];
        winSq += s * s;
      }
      const winRms = Math.sqrt(winSq / win3ms);
      if (winRms > peakBurstRms) {
        peakBurstRms = winRms;
        peakIndex = i;
      }
    }

    const energyRiseDb = 20 * Math.log10(Math.max(1e-4, peakBurstRms) / Math.max(1e-5, closureRms));

    // Burst duration: time from peak until transient decay below 30% of peak
    let burstEndIndex = peakIndex + win3ms;
    const decayThreshold = peakBurstRms * 0.35;
    for (let i = peakIndex + win3ms; i + win3ms <= segment.length; i += win3ms) {
      let winSq = 0;
      for (let j = 0; j < win3ms; j++) {
        const s = segment[i + j];
        winSq += s * s;
      }
      if (Math.sqrt(winSq / win3ms) < decayThreshold) {
        burstEndIndex = i;
        break;
      }
      burstEndIndex = i;
    }
    const burstDurationMs = Math.min(50, Math.max(5, (burstEndIndex - peakIndex) * (1000 / sampleRate)));

    // Negative control: Non-speech clicks have zero speech resonance following burst
    let postBurstResonanceSq = 0;
    const startResonance = peakIndex + win3ms;
    const resonanceLen = Math.min(segment.length - startResonance, Math.floor(sampleRate * 0.015));
    if (resonanceLen > 0) {
      for (let i = startResonance; i < startResonance + resonanceLen; i++) {
        postBurstResonanceSq += segment[i] * segment[i];
      }
    }
    const postBurstResonanceRms = Math.sqrt(postBurstResonanceSq / Math.max(1, resonanceLen));
    const isIsolatedSpike = postBurstResonanceRms < peakBurstRms * 0.15; // Click with instantaneous drop-off

    const isQalqalahConsonant = ['q', 'tˤ', 'b', 'dʒ', 'd'].includes(input.expectedPhoneme) ||
                               input.ruleId?.includes('qalqalah');

    let status = AcousticEvidenceStatus.EXPERIMENTAL;
    if (hasClippingInSegment || isIsolatedSpike) {
      status = AcousticEvidenceStatus.INCONCLUSIVE; // Rejected as non-speech artifact / mic click
    } else if (isQalqalahConsonant && energyRiseDb >= 8.0 && burstDurationMs <= 40.0) {
      status = AcousticEvidenceStatus.SUPPORTED;
    }

    return Object.freeze({
      evidenceId,
      ayahId: input.ayahId,
      wordIndex: input.wordIndex,
      phonemeIndex: input.phonemeIndex,
      featureType: this.featureType,
      expectedContext: {
        canonicalPhoneme: input.expectedPhoneme,
        ruleId: input.ruleId,
        phoneticClass: isQalqalahConsonant ? 'QUTB_JAD_STOP' : 'NON_QALQALAH',
      },
      observedMeasurement: {
        durationSeconds: duration,
        burstEnergyRiseDb: energyRiseDb,
        burstDurationMs,
        rawDetails: {
          closureRms,
          peakBurstRms,
          isIsolatedSpike,
        },
      },
      normalizedValue: Math.max(0, Math.min(40.0, energyRiseDb)),
      referenceRange: { min: 8.0, max: 35.0, unit: 'dB_rise' },
      confidence: Math.min(0.92, input.alignmentConfidence * 0.95),
      quality: input.signalQuality.overallQuality,
      startTime: input.startTime,
      endTime: input.endTime,
      signalQuality: input.signalQuality,
      modelVersion: '3.1.0-int8-hardened',
      modelHash: OFFICIAL_MODEL_HASH,
      featureAlgorithmVersion: this.algorithmVersion,
      sourceEvidenceIds: [],
      evidenceStatus: status,
      limitation: 'ERR-ACOUSTIC-005: Physical burst energy rise is an acoustic metric, not an autonomous Tajweed verdict',
      timestamp: new Date().toISOString(),
    });
  }
}
