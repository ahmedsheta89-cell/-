/**
 * @file Phase6AcousticRefinementEngine.ts
 * @module domain/recitation
 * @description Central Orchestrator for Phase 6 Advanced Acoustic Feature Extraction.
 * 
 * CORE CONTRACT:
 * Bridges Phase 5A (RecitationEvidence) and Phase 5B (TajweedRuleEvidence) into
 * mathematically sound, immutable AcousticFeatureEvidence.
 * 
 * INTEGRITY GATES:
 * - Quran hash validation
 * - Tajweed KB hash validation
 * - Model hash validation
 * - Cascading alignment slip protection (ERR-ACOUSTIC-006)
 * - Low SNR / noise gating (ERR-ACOUSTIC-007)
 */

import {
  AcousticFeatureType,
  AcousticEvidenceStatus,
  AcousticFeatureEvidence,
  AcousticFeatureExtractionInput,
  IAcousticFeatureExtractor,
  SignalQualityMetrics,
  SpeakerSessionBaseline,
} from './acousticFeatureTypes.ts';
import { AcousticSignalQualityGator } from './AcousticSignalQualityGator.ts';
import { SpeakerSessionBaselineTracker } from './SpeakerSessionBaselineTracker.ts';
import { MaddDurationAcousticExtractor } from './extractors/MaddDurationAcousticExtractor.ts';
import { GhunnahResonanceAcousticExtractor } from './extractors/GhunnahResonanceAcousticExtractor.ts';
import { ArticulationAcousticExtractor } from './extractors/ArticulationAcousticExtractor.ts';
import { TafkheemAcousticExtractor } from './extractors/TafkheemAcousticExtractor.ts';
import { QalqalahTransientAcousticExtractor } from './extractors/QalqalahTransientAcousticExtractor.ts';
import { TemporalProsodyAcousticExtractor } from './extractors/TemporalProsodyAcousticExtractor.ts';
import {
  CANONICAL_QURAN_HASH,
  TAJWEED_KB_CHECKSUM_SHA256,
  OFFICIAL_MODEL_HASH,
} from './RecitationErrorDecisionEngine.ts';

export interface AcousticRefinementRequest {
  readonly pcmAudio: Float32Array;
  readonly sampleRate: number;
  readonly ayahId: string;
  readonly wordIndex: number;
  readonly phonemeIndex: number;
  readonly expectedPhoneme: string;
  readonly ruleId?: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly alignmentConfidence: number;
  readonly isAlignmentStable: boolean;
  readonly quranHash?: string;
  readonly tajweedHash?: string;
  readonly modelHash?: string;
}

export class Phase6AcousticRefinementEngine {
  private readonly extractors: Map<AcousticFeatureType, IAcousticFeatureExtractor> = new Map();
  private readonly signalGator: AcousticSignalQualityGator;
  private readonly baselineTracker: SpeakerSessionBaselineTracker;

  constructor() {
    this.signalGator = AcousticSignalQualityGator.getInstance();
    this.baselineTracker = new SpeakerSessionBaselineTracker();

    this.registerExtractor(new MaddDurationAcousticExtractor());
    this.registerExtractor(new GhunnahResonanceAcousticExtractor());
    this.registerExtractor(new ArticulationAcousticExtractor());
    this.registerExtractor(new TafkheemAcousticExtractor());
    this.registerExtractor(new QalqalahTransientAcousticExtractor());
    this.registerExtractor(new TemporalProsodyAcousticExtractor());
  }

  private registerExtractor(extractor: IAcousticFeatureExtractor): void {
    this.extractors.set(extractor.featureType, extractor);
  }

  /**
   * Resets session baseline tracker.
   */
  public resetSession(): void {
    this.baselineTracker.reset();
  }

  /**
   * Returns current speaker session baseline.
   */
  public getSpeakerBaseline(): SpeakerSessionBaseline {
    return this.baselineTracker.getBaseline();
  }

  /**
   * Updates session baseline with a verified speech segment.
   */
  public updateSessionBaseline(durationSec: number, speechRate?: number, pitchHz?: number): void {
    this.baselineTracker.observeSegment(durationSec, speechRate, pitchHz);
  }

  /**
   * Extracts all applicable acoustic features for a phoneme segment with full integrity checks.
   */
  public analyzeSegment(request: AcousticRefinementRequest): readonly AcousticFeatureEvidence[] {
    // 1. CRYPTOGRAPHIC INTEGRITY CHECK (Section 33)
    const qHash = request.quranHash || CANONICAL_QURAN_HASH;
    const tHash = request.tajweedHash || TAJWEED_KB_CHECKSUM_SHA256;
    const mHash = request.modelHash || OFFICIAL_MODEL_HASH;

    if (
      qHash !== CANONICAL_QURAN_HASH ||
      tHash !== TAJWEED_KB_CHECKSUM_SHA256 ||
      mHash !== OFFICIAL_MODEL_HASH
    ) {
      // Tampered configuration immediately yields INCONCLUSIVE evidence with INTEGRITY_FAILURE
      return Object.freeze([
        Object.freeze({
          evidenceId: `integrity-fail-${Date.now()}`,
          ayahId: request.ayahId,
          wordIndex: request.wordIndex,
          phonemeIndex: request.phonemeIndex,
          featureType: AcousticFeatureType.SIGNAL_QUALITY,
          expectedContext: { canonicalPhoneme: request.expectedPhoneme },
          observedMeasurement: {},
          normalizedValue: null,
          referenceRange: { min: 0, max: 0, unit: 'none' },
          confidence: 0,
          quality: this.signalGator.analyze(request.pcmAudio, request.sampleRate).overallQuality,
          startTime: request.startTime,
          endTime: request.endTime,
          signalQuality: this.signalGator.analyze(request.pcmAudio, request.sampleRate),
          modelVersion: '3.1.0-int8-hardened',
          modelHash: mHash,
          featureAlgorithmVersion: 'phase6-refinement-v1.0.0',
          sourceEvidenceIds: [],
          evidenceStatus: AcousticEvidenceStatus.INCONCLUSIVE,
          limitation: 'INTEGRITY_FAILURE: Hash mismatch across Quran, Tajweed KB, or Model weights',
          timestamp: new Date().toISOString(),
        }),
      ]);
    }

    // 2. SIGNAL QUALITY GATING (Section 19)
    const signalQuality: SignalQualityMetrics = this.signalGator.analyze(
      request.pcmAudio,
      request.sampleRate
    );

    const baseline = this.baselineTracker.getBaseline();

    const input: AcousticFeatureExtractionInput = {
      pcmAudio: request.pcmAudio,
      sampleRate: request.sampleRate,
      ayahId: request.ayahId,
      wordIndex: request.wordIndex,
      phonemeIndex: request.phonemeIndex,
      expectedPhoneme: request.expectedPhoneme,
      ruleId: request.ruleId,
      startTime: request.startTime,
      endTime: request.endTime,
      alignmentConfidence: request.alignmentConfidence,
      isAlignmentStable: request.isAlignmentStable,
      signalQuality,
      speakerBaseline: baseline,
    };

    const results: AcousticFeatureEvidence[] = [];

    // Always compute Temporal Prosody
    const prosodyExtractor = this.extractors.get(AcousticFeatureType.TEMPORAL_PROSODY);
    if (prosodyExtractor) {
      results.push(prosodyExtractor.extract(input));
    }

    // Compute Madd Duration if vowel/madd context
    const isVowelOrMadd = ['a', 'u', 'i', 'aː', 'uː', 'iː'].includes(request.expectedPhoneme) ||
                         request.ruleId?.includes('madd');
    if (isVowelOrMadd) {
      const maddExtractor = this.extractors.get(AcousticFeatureType.MADD_DURATION);
      if (maddExtractor) {
        results.push(maddExtractor.extract(input));
      }
    }

    // Compute Ghunnah if nasal context
    const isNasalOrGhunnah = ['n', 'm'].includes(request.expectedPhoneme) ||
                            request.ruleId?.includes('ghunnah') ||
                            request.ruleId?.includes('iqlab') ||
                            request.ruleId?.includes('idgham');
    if (isNasalOrGhunnah) {
      const ghunnahExtractor = this.extractors.get(AcousticFeatureType.GHUNNAH_RESONANCE);
      if (ghunnahExtractor) {
        results.push(ghunnahExtractor.extract(input));
      }
    }

    // Compute Qalqalah if Qutb Jad stop context
    const isQalqalah = ['q', 'tˤ', 'b', 'dʒ', 'd'].includes(request.expectedPhoneme) ||
                       request.ruleId?.includes('qalqalah');
    if (isQalqalah) {
      const qalqalahExtractor = this.extractors.get(AcousticFeatureType.QALQALAH_TRANSIENT);
      if (qalqalahExtractor) {
        results.push(qalqalahExtractor.extract(input));
      }
    }

    // Compute Tafkheem if emphatic consonant or rule applies
    const isEmphatic = ['sˤ', 'dˤ', 'tˤ', 'ðˤ', 'q', 'ɣ', 'x'].includes(request.expectedPhoneme) ||
                      request.ruleId?.includes('tafkheem');
    if (isEmphatic) {
      const tafkheemExtractor = this.extractors.get(AcousticFeatureType.TAFKHEEM);
      if (tafkheemExtractor) {
        results.push(tafkheemExtractor.extract(input));
      }
    }

    // Always compute Articulation spectral signature
    const artExtractor = this.extractors.get(AcousticFeatureType.ARTICULATION);
    if (artExtractor) {
      results.push(artExtractor.extract(input));
    }

    return Object.freeze(results);
  }
}
