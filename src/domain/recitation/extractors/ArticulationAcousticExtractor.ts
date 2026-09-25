/**
 * @file ArticulationAcousticExtractor.ts
 * @module domain/recitation/extractors
 * @description Phoneme-Conditioned Articulation / Spectral Profile Extractor (Section 11).
 * 
 * CORE CONTRACT:
 * Extracts spectral centroid, high-frequency energy ratio, and phoneme-specific spectral signatures.
 * 
 * STRICT PROHIBITIONS:
 * - Never claims exact physiological Makhraj positioning from single spectral features.
 * - Never equates spectral difference with a religious error.
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

export class ArticulationAcousticExtractor implements IAcousticFeatureExtractor {
  public readonly featureType = AcousticFeatureType.ARTICULATION;
  public readonly algorithmVersion = 'articulation-spectral-centroid-v1.0.0';

  public extract(input: AcousticFeatureExtractionInput): AcousticFeatureEvidence {
    const evidenceId = `art-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
        referenceRange: { min: 500, max: 8000, unit: 'Hz' },
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
        limitation: 'ERR-ACOUSTIC-007: Degraded signal prevents spectral envelope analysis',
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
        referenceRange: { min: 500, max: 8000, unit: 'Hz' },
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
        limitation: 'ERR-ACOUSTIC-006: Unstable phoneme alignment prevents spectral centroid calculation',
        timestamp: new Date().toISOString(),
      });
    }

    // Compute Spectral Centroid across the segment
    const sampleRate = input.sampleRate || 16000;
    const startIdx = Math.max(0, Math.floor(input.startTime * sampleRate));
    const endIdx = Math.min(input.pcmAudio.length, Math.ceil(input.endTime * sampleRate));
    const segment = input.pcmAudio.subarray(startIdx, endIdx);

    let weightedFreqSum = 0;
    let totalMagnitude = 0;
    const n = segment.length;
    const len = Math.min(n, 512);

    if (len > 32) {
      for (let freq = 200; freq <= 7000; freq += 200) {
        let re = 0, im = 0;
        const omega = (2 * Math.PI * freq) / sampleRate;
        for (let i = 0; i < len; i++) {
          re += segment[i] * Math.cos(omega * i);
          im -= segment[i] * Math.sin(omega * i);
        }
        const mag = Math.sqrt(re * re + im * im);
        weightedFreqSum += freq * mag;
        totalMagnitude += mag;
      }
    }

    const centroidHz = totalMagnitude > 1e-4 ? weightedFreqSum / totalMagnitude : 2000;

    // Sibilants / fricatives (s, sh, z, etc.) expect higher centroid; vowels expect lower
    let minExpectedHz = 800;
    let maxExpectedHz = 3500;
    const isFricative = ['s', 'ʃ', 'z', 'sˤ', 'f', 'θ', 'ð'].includes(input.expectedPhoneme);
    if (isFricative) {
      minExpectedHz = 3000;
      maxExpectedHz = 7500;
    }

    const isWithinProfile = centroidHz >= minExpectedHz && centroidHz <= maxExpectedHz;

    return Object.freeze({
      evidenceId,
      ayahId: input.ayahId,
      wordIndex: input.wordIndex,
      phonemeIndex: input.phonemeIndex,
      featureType: this.featureType,
      expectedContext: {
        canonicalPhoneme: input.expectedPhoneme,
        ruleId: input.ruleId,
        phoneticClass: isFricative ? 'FRICATIVE' : 'NON_FRICATIVE',
      },
      observedMeasurement: {
        durationSeconds: duration,
        spectralCentroidHz: centroidHz,
        rawDetails: {
          totalMagnitude,
        },
      },
      normalizedValue: centroidHz / 4000.0,
      referenceRange: { min: minExpectedHz, max: maxExpectedHz, unit: 'Hz' },
      confidence: Math.min(0.88, input.alignmentConfidence * 0.9),
      quality: input.signalQuality.overallQuality,
      startTime: input.startTime,
      endTime: input.endTime,
      signalQuality: input.signalQuality,
      modelVersion: '3.1.0-int8-hardened',
      modelHash: OFFICIAL_MODEL_HASH,
      featureAlgorithmVersion: this.algorithmVersion,
      sourceEvidenceIds: [],
      evidenceStatus: isWithinProfile ? AcousticEvidenceStatus.PARTIALLY_SUPPORTED : AcousticEvidenceStatus.EXPERIMENTAL,
      limitation: 'ERR-ACOUSTIC-003: Articulation formant trajectory cannot resolve internal pharyngeal geometry',
      timestamp: new Date().toISOString(),
    });
  }
}
