/**
 * @file TafkheemAcousticExtractor.ts
 * @module domain/recitation/extractors
 * @description Speaker-Normalized Tafkheem / Tarqeeq Spectral Extractor (Section 13).
 * 
 * CORE CONTRACT:
 * Measures F2 formant proxy and low-frequency spectral tilt for emphatic consonants.
 * 
 * STRICT PROHIBITIONS:
 * - Never uses an uncalibrated single threshold (e.g. F2 < X).
 * - Distinguishes natural deep voice from phonetic Tafkheem.
 * - Always accounts for speaker pitch baseline.
 */

import {
  AcousticFeatureType,
  AcousticEvidenceStatus,
  AcousticFeatureEvidence,
  AcousticFeatureExtractionInput,
  IAcousticFeatureExtractor,
  SignalQualityLevel,
  SpeakerBaselineState,
} from '../acousticFeatureTypes.ts';
import { OFFICIAL_MODEL_HASH } from '../RecitationErrorDecisionEngine.ts';

export class TafkheemAcousticExtractor implements IAcousticFeatureExtractor {
  public readonly featureType = AcousticFeatureType.TAFKHEEM;
  public readonly algorithmVersion = 'tafkheem-f2-normalized-v1.0.0';

  public extract(input: AcousticFeatureExtractionInput): AcousticFeatureEvidence {
    const evidenceId = `taf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
        referenceRange: { min: 800, max: 1600, unit: 'Hz' },
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
        limitation: 'ERR-ACOUSTIC-007: Low SNR prevents reliable F2 formant trajectory estimation',
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
        referenceRange: { min: 800, max: 1600, unit: 'Hz' },
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
        limitation: 'ERR-ACOUSTIC-006: Unstable alignment boundary invalidates formant transition analysis',
        timestamp: new Date().toISOString(),
      });
    }

    // Estimate F2 spectral concentration in 1000 - 2000 Hz range
    const sampleRate = input.sampleRate || 16000;
    const startIdx = Math.max(0, Math.floor(input.startTime * sampleRate));
    const endIdx = Math.min(input.pcmAudio.length, Math.ceil(input.endTime * sampleRate));
    const segment = input.pcmAudio.subarray(startIdx, endIdx);

    let maxBandEnergy = 0;
    let peakF2Hz = 1400;
    const n = segment.length;
    const len = Math.min(n, 512);

    if (len > 32) {
      for (let freq = 1000; freq <= 2200; freq += 80) {
        let re = 0, im = 0;
        const omega = (2 * Math.PI * freq) / sampleRate;
        for (let i = 0; i < len; i++) {
          re += segment[i] * Math.cos(omega * i);
          im -= segment[i] * Math.sin(omega * i);
        }
        const energy = re * re + im * im;
        if (energy > maxBandEnergy) {
          maxBandEnergy = energy;
          peakF2Hz = freq;
        }
      }
    }

    // Normalize F2 against speaker baseline pitch/F2 to avoid deep vs high voice bias
    const speakerF0 = input.speakerBaseline?.pitchMedianHz || 150;
    const speakerF2Ref = input.speakerBaseline?.f2VowelBaselineHz || (speakerF0 > 180 ? 1700 : 1450);
    const normalizedF2Ratio = peakF2Hz / speakerF2Ref;

    const isEmphaticConsonant = ['sˤ', 'dˤ', 'tˤ', 'ðˤ', 'q', 'ɣ', 'x'].includes(input.expectedPhoneme) ||
                               input.ruleId?.includes('tafkheem');

    let status = AcousticEvidenceStatus.EXPERIMENTAL;
    let limitation = 'ERR-ACOUSTIC-004: Speaker anatomy and pitch variance require individualized calibration';

    if (input.speakerBaseline?.baselineState === SpeakerBaselineState.VALID_BASELINE) {
      status = AcousticEvidenceStatus.PARTIALLY_SUPPORTED;
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
        phoneticClass: isEmphaticConsonant ? 'EMPHATIC_MUFAKHKHAM' : 'NON_EMPHATIC_MURAQQAQ',
      },
      observedMeasurement: {
        durationSeconds: duration,
        f2FormantProxyHz: peakF2Hz,
        normalizedRatio: normalizedF2Ratio,
        rawDetails: {
          speakerF0,
          speakerF2Ref,
        },
      },
      normalizedValue: normalizedF2Ratio,
      referenceRange: { min: 800, max: 1600, unit: 'Hz' },
      confidence: Math.min(0.85, input.alignmentConfidence * 0.8),
      quality: input.signalQuality.overallQuality,
      startTime: input.startTime,
      endTime: input.endTime,
      signalQuality: input.signalQuality,
      modelVersion: '3.1.0-int8-hardened',
      modelHash: OFFICIAL_MODEL_HASH,
      featureAlgorithmVersion: this.algorithmVersion,
      sourceEvidenceIds: [],
      evidenceStatus: status,
      limitation,
      timestamp: new Date().toISOString(),
    });
  }
}
