/**
 * @file RecitationEvidenceEngine.ts
 * @module domain/recitation
 * @description Fusion engine converting aligned phonetic events into auditable QuranAlignmentEvidence.
 * Applies deterministic safety gates, streaming look-ahead policies, and non-interruptive
 * recommended actions with zero religious classification.
 */

import {
  AlignedEvent,
  AlignmentHypothesis,
  QuranCanonicalSequence,
  QuranAlignmentEvidence,
  QuranAlignmentSummary,
  StreamEvidenceType,
  EvidenceStability,
  RecommendedAction,
  ProvisionalSafetyConfig,
  PROVISIONAL_SAFETY_CONFIG,
} from './quranAlignmentTypes.ts';
import { EvidenceErrorType, EvidenceConfidenceStatus } from './RecitationEvidence.ts';

export interface AudioSignalQuality {
  snrDb: number;
  isClipped: boolean;
  isSilence: boolean;
  isWhiteNoise: boolean;
}

export class RecitationEvidenceEngine {
  private readonly config: ProvisionalSafetyConfig;
  private readonly lookAheadSec: number;

  constructor(
    config: ProvisionalSafetyConfig = PROVISIONAL_SAFETY_CONFIG,
    lookAheadSec: number = 0.35 // 350ms look-ahead boundary for streaming
  ) {
    this.config = config;
    this.lookAheadSec = lookAheadSec;
  }

  /**
   * Fuse alignment events, canonical Quranic metadata, and audio quality into structured evidence.
   */
  public fuseEvidence(
    canonicalSeq: QuranCanonicalSequence,
    alignment: {
      bestHypothesis: AlignmentHypothesis;
      scoreMargin: number;
      isAmbiguous: boolean;
    },
    streamEvidenceType: StreamEvidenceType,
    signalQuality?: AudioSignalQuality,
    latestAudioTimeSec: number = 0
  ): QuranAlignmentSummary {
    const events = alignment.bestHypothesis.events;
    const evidenceItems: QuranAlignmentEvidence[] = [];

    let correctCount = 0;
    let substitutionCount = 0;
    let deletionCount = 0;
    let insertionCount = 0;
    let uncertainCount = 0;
    let inconclusiveCount = 0;

    let sumAcousticConf = 0;
    let sumAlignmentConf = 0;

    // Check overall signal quality gates
    const isAudioDegraded = signalQuality && (
      signalQuality.snrDb < this.config.minSnrDb ||
      signalQuality.isSilence ||
      signalQuality.isWhiteNoise
    );

    for (const ev of events) {
      // 1. Resolve Word & Canonical Metadata
      const exp = ev.expectedToken;
      const obs = ev.observedToken;

      const wordIndex = exp ? exp.wordIndex : 1;
      const phonemeIndex = exp ? exp.phonemeIndex : 0;
      const expectedTokenStr = exp ? exp.canonicalToken : '';
      const observedTokenStr = obs ? obs.token : '';
      const wordTextUthmani = exp ? exp.wordTextUthmani : '';

      // 2. Deterministic Safety Gate Evaluation
      let errorType: EvidenceErrorType = ev.eventType;
      let evidenceStatus: EvidenceConfidenceStatus = ev.evidenceStatus;
      let stability: EvidenceStability = 'STABLE';
      let recommendedAction: RecommendedAction = 'CONTINUE';

      // Rule 1: Signal quality gate (severe audio degradation)
      if (isAudioDegraded) {
        errorType = 'INCONCLUSIVE';
        evidenceStatus = 'INCONCLUSIVE';
        recommendedAction = 'REQUEST_REPEAT';
        inconclusiveCount++;
      }
      // Rule 2: Streaming look-ahead pending gate
      else if (
        streamEvidenceType === 'PARTIAL_EVIDENCE' &&
        latestAudioTimeSec > 0 &&
        ev.endTime >= (latestAudioTimeSec - this.lookAheadSec)
      ) {
        stability = 'PENDING';
        recommendedAction = 'WAIT_FOR_MORE_AUDIO';
        if (ev.eventType !== 'MATCH') {
          // Never emit definitive error in look-ahead buffer
          errorType = 'UNCERTAIN';
          evidenceStatus = 'MEDIUM';
          uncertainCount++;
        } else {
          correctCount++;
        }
      }
      // Rule 3: Correct canonical match
      else if (ev.eventType === 'MATCH') {
        correctCount++;
        errorType = 'MATCH';
        recommendedAction = 'CONTINUE';
        if (obs && (obs.confidence < this.config.minConfidence || obs.marginPeak < this.config.minMarginPeak)) {
          evidenceStatus = 'INCONCLUSIVE';
          inconclusiveCount++;
        } else {
          evidenceStatus = 'HIGH';
        }
      }
      // Rule 4: Discrepancies (SUBSTITUTION, DELETION, INSERTION) under low acoustic confidence, low margin, or ambiguity
      // MUST NOT be asserted as definitive errors -> Demote strictly to INCONCLUSIVE with REQUEST_REPEAT
      else if (
        (obs && (obs.confidence < this.config.minConfidence || obs.marginPeak < this.config.minMarginPeak)) ||
        ev.alignmentConfidence < this.config.minAlignmentConfidence ||
        alignment.isAmbiguous ||
        ev.isAmbiguous
      ) {
        errorType = 'INCONCLUSIVE';
        evidenceStatus = 'INCONCLUSIVE';
        recommendedAction = 'REQUEST_REPEAT';
        inconclusiveCount++;
      }
      // Rule 5: Validated High-Confidence Discrepancies -> Defer strictly to downstream Rule/Tajweed Engine
      else {
        if (ev.eventType === 'SUBSTITUTION') {
          substitutionCount++;
          recommendedAction = 'DEFER_TO_RULE_ENGINE';
        } else if (ev.eventType === 'DELETION') {
          deletionCount++;
          recommendedAction = 'DEFER_TO_RULE_ENGINE';
        } else if (ev.eventType === 'INSERTION') {
          insertionCount++;
          recommendedAction = 'DEFER_TO_RULE_ENGINE';
        }
      }

      sumAcousticConf += ev.acousticConfidence;
      sumAlignmentConf += ev.alignmentConfidence;

      const evidenceItem: QuranAlignmentEvidence = {
        ayahId: canonicalSeq.ayahId,
        wordIndex,
        phonemeIndex,
        expectedToken: expectedTokenStr,
        observedToken: observedTokenStr,
        errorType,
        acousticConfidence: ev.acousticConfidence,
        alignmentConfidence: ev.alignmentConfidence,
        startTime: ev.startTime,
        endTime: ev.endTime,
        evidenceStatus,
        marginPeak: obs ? obs.marginPeak : 1.0,
        streamEvidenceType,
        stability,
        recommendedAction,
        timingStatus: ev.timingStatus,
        canonicalMetadata: {
          riwayah: canonicalSeq.riwayah,
          sourceDatasetVersion: canonicalSeq.datasetVersion,
          datasetHash: canonicalSeq.datasetHash,
          surah: canonicalSeq.surah,
          ayah: canonicalSeq.ayah,
          wordTextUthmani,
        },
        observedTokenDetails: obs ? {
          startFrame: obs.startFrame,
          endFrame: obs.endFrame,
          sourceChunk: obs.sourceChunk,
          peakFrame: obs.peakFrame,
        } : undefined,
      };

      evidenceItems.push(evidenceItem);
    }

    const totalExpected = canonicalSeq.tokens.length;
    const totalObserved = events.filter(e => e.observedToken !== undefined).length;
    const rawDiscrepancies = events.filter(
      (e) => e.eventType === 'SUBSTITUTION' || e.eventType === 'DELETION' || e.eventType === 'INSERTION'
    ).length;
    const phonemeErrorRate = totalExpected > 0
      ? parseFloat((rawDiscrepancies / totalExpected).toFixed(4))
      : 0;

    const meanAcousticConf = events.length > 0
      ? parseFloat((sumAcousticConf / events.length).toFixed(4))
      : 0;
    const meanAlignmentConf = events.length > 0
      ? parseFloat((sumAlignmentConf / events.length).toFixed(4))
      : 0;

    // Overall session recommended action
    let overallRecommendedAction: RecommendedAction = 'CONTINUE';
    if (isAudioDegraded || inconclusiveCount > (totalExpected * 0.3)) {
      overallRecommendedAction = 'REQUEST_REPEAT';
    } else if (streamEvidenceType === 'PARTIAL_EVIDENCE' && uncertainCount > 0) {
      overallRecommendedAction = 'WAIT_FOR_MORE_AUDIO';
    } else if (substitutionCount > 0 || deletionCount > 0 || insertionCount > 0) {
      overallRecommendedAction = 'DEFER_TO_RULE_ENGINE';
    }

    return {
      ayahId: canonicalSeq.ayahId,
      surah: canonicalSeq.surah,
      ayah: canonicalSeq.ayah,
      riwayah: canonicalSeq.riwayah,
      datasetHash: canonicalSeq.datasetHash,
      streamEvidenceType,
      totalExpectedTokens: totalExpected,
      totalObservedTokens: totalObserved,
      correctCount,
      substitutionCount,
      deletionCount,
      insertionCount,
      uncertainCount,
      inconclusiveCount,
      phonemeErrorRate: parseFloat(phonemeErrorRate.toFixed(4)),
      meanAcousticConfidence: meanAcousticConf,
      meanAlignmentConfidence: meanAlignmentConf,
      recommendedAction: overallRecommendedAction,
      evidenceItems,
      hypothesesTracked: 1 + (alignment.bestHypothesis ? 1 : 0),
      scoreMargin: alignment.scoreMargin,
    };
  }
}
