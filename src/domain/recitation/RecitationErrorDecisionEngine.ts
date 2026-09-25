/**
 * @file RecitationErrorDecisionEngine.ts
 * @module domain/recitation
 * @description Production Recitation Error Decision Engine for Phase 5C.
 * 
 * CORE CONTRACT:
 * Converts raw acoustic RecitationEvidence, deterministic TajweedRuleEvidence,
 * signal quality, and alignment certainty into a conservative, auditable,
 * learner-facing recitation decision.
 * 
 * STRICT ARCHITECTURAL INVARIANTS:
 * - Zero LLM text generation
 * - Zero heuristic religious inference
 * - Zero raw Quran text inspection or generation
 * - Absolute immutability of input evidence
 * - Strict integrity verification (Quran dataset, Tajweed KB, Model version, Riwayah)
 * - Safe error escalation & cascading alignment collapse protection
 */

import {
  RecitationDecisionState,
  EvidenceCategory,
  PhoneticDecisionErrorType,
  EscalationLevel,
  AlignmentStabilityState,
  DecisionSafetyThresholds,
  PROVISIONAL_DECISION_SAFETY_THRESHOLDS,
  RecitationDecisionInput,
  PhoneticErrorDetail,
  InterruptionRecommendation,
  WordRecitationDecision,
  AyahRecitationDecision,
  LearnerRecitationFeedback,
  DecisionAuditTrail,
  RecitationDecisionOutput,
  IRecitationErrorDecisionEngine,
} from './decisionTypes.ts';

import { RecitationEvidence, EvidenceErrorType, EvidenceConfidenceStatus } from './RecitationEvidence.ts';
import { TajweedRuleEvidence, TajweedDecisionStatus } from '../tajweed/types.ts';
import { HAFS_OFFICIAL_CERTIFICATE } from '../../infrastructure/quran/VerifiedQuranDataProvider.ts';
import { TAJWEED_KB_CHECKSUM_SHA256 } from '../tajweed/VerifiedTajweedKnowledgeBase.ts';
import { RiwayahType } from '../quran/types.ts';

export const CANONICAL_QURAN_HASH = HAFS_OFFICIAL_CERTIFICATE.checksumSha256;
export { TAJWEED_KB_CHECKSUM_SHA256 };
export const OFFICIAL_MODEL_HASH = '31755836528da336a6192121cd7bc82cb41752dddb65566fd000b89c8686da6b';

/**
 * Helper to deep-freeze an object or array to ensure strict immutability.
 */
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

/**
 * Production implementation of IRecitationErrorDecisionEngine.
 */
export class RecitationErrorDecisionEngine implements IRecitationErrorDecisionEngine {
  private static instance: RecitationErrorDecisionEngine | null = null;
  private readonly thresholds: DecisionSafetyThresholds;

  public constructor(thresholds: DecisionSafetyThresholds = PROVISIONAL_DECISION_SAFETY_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  public static getInstance(thresholds?: DecisionSafetyThresholds): RecitationErrorDecisionEngine {
    if (!RecitationErrorDecisionEngine.instance) {
      RecitationErrorDecisionEngine.instance = new RecitationErrorDecisionEngine(thresholds);
    }
    return RecitationErrorDecisionEngine.instance;
  }

  /**
   * Evaluates structured recitation evidence to produce an auditable decision output.
   */
  public evaluate(input: RecitationDecisionInput): RecitationDecisionOutput {
    const decisionTimestamp = new Date().toISOString();
    const decisionId = `dec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // 1. INTEGRITY GATE (Section 8)
    const integrityCheck = this.verifyIntegrity(input);
    if (!integrityCheck.isValid) {
      const auditTrail: DecisionAuditTrail = {
        decisionId,
        evidenceIds: input.recitationEvidence.map(e => `${e.ayahId}:${e.wordIndex}:${e.phonemeIndex}`),
        ruleEvidenceIds: input.tajweedRuleEvidence.map(r => r.evidenceId),
        modelVersion: input.modelVersion,
        modelHash: input.modelHash,
        quranHash: input.quranDatasetHash,
        tajweedHash: input.tajweedKBHash,
        riwayah: input.riwayah,
        thresholdVersion: this.thresholds.thresholdVersion,
        decisionTimestamp,
        decisionReason: `INTEGRITY_FAILURE: ${integrityCheck.reason}`,
        finalStatus: RecitationDecisionState.INCONCLUSIVE,
        integrityStatus: 'INTEGRITY_FAILURE',
      };

      const learnerFeedback: LearnerRecitationFeedback = {
        feedbackId: `fb-${decisionId}`,
        decisionState: RecitationDecisionState.INCONCLUSIVE,
        messageArabic: 'تعذر التحقق من بيانات التلاوة. يرجى إعادة المحاولة.',
        messageEnglish: 'Recitation data integrity could not be verified. Please retry.',
        pedagogicalActionArabic: 'إعادة المحاولة',
        isTajweedPending: false,
        repeatRequested: true,
      };

      const interruption: InterruptionRecommendation = {
        shouldInterrupt: false,
        reason: integrityCheck.reason,
        severity: 'CRITICAL',
        confidence: 1.0,
        recommendedAction: 'REQUEST_REPEAT',
      };

      return deepFreeze<RecitationDecisionOutput>({
        decisionId,
        finalStatus: RecitationDecisionState.INCONCLUSIVE,
        escalationLevel: EscalationLevel.LEVEL_1_UNCERTAIN,
        confirmedErrors: [],
        candidateErrors: [],
        tajweedPendingRules: [],
        alignmentStability: AlignmentStabilityState.COLLAPSED,
        interruption,
        learnerFeedback,
        auditTrail,
        canContinue: false,
        shouldRepeat: true,
      });
    }

    // 2. SIGNAL QUALITY & NOISE GATE (Section 9)
    if (input.signalQuality.isSilence) {
      return this.createDegradedSignalOutput(
        decisionId,
        input,
        decisionTimestamp,
        'SIGNAL_QUALITY_SILENCE_DETECTED',
        'لم يتم رصد صوت واضح. اقرأ الآية بصوت واضح.',
        'Silence detected. Please recite clearly into the microphone.'
      );
    }

    if (input.signalQuality.isWhiteNoise) {
      return this.createDegradedSignalOutput(
        decisionId,
        input,
        decisionTimestamp,
        'SIGNAL_QUALITY_WHITE_NOISE_DETECTED',
        'مستوى الضوضاء مرتفع جدًا. اقرأ في بيئة هادئة.',
        'Ambient noise is too high. Please recite in a quiet environment.'
      );
    }

    if (input.signalQuality.snrDb < this.thresholds.minSnrDb) {
      return this.createDegradedSignalOutput(
        decisionId,
        input,
        decisionTimestamp,
        `SIGNAL_QUALITY_LOW_SNR: ${input.signalQuality.snrDb}dB < ${this.thresholds.minSnrDb}dB`,
        'الصوت غير واضح كفاية. اقرأ الكلمة مرة تانية.',
        'Audio signal quality is below provisional safety thresholds. Please repeat.'
      );
    }

    // 3. CASCADING ALIGNMENT FAILURE DETECTION & SUPPRESSION (Section 20)
    const { stability, candidateErrors, confirmedErrors } = this.processPhoneticEvidence(input);

    // 4. TAJWEED RULE EVIDENCE EVALUATION (Sections 12-16)
    const { tajweedPending, hasTajweedMismatch } = this.processTajweedEvidence(input);

    // 5. DECISION STATE ARBITRATION (Section 4, 10, 17)
    let finalStatus: RecitationDecisionState = RecitationDecisionState.MATCH;
    let escalationLevel: EscalationLevel = EscalationLevel.LEVEL_0_MATCH;
    let decisionReason = 'EXACT_CLEAN_MATCH';

    if (confirmedErrors.length > 0) {
      finalStatus = RecitationDecisionState.CONFIRMED_PHONETIC_ERROR;
      escalationLevel = EscalationLevel.LEVEL_3_CONFIRMED_PHONETIC_ERROR;
      decisionReason = `CONFIRMED_PHONETIC_ERROR: ${confirmedErrors.length} confirmed phonetic discrepancy detected.`;
    } else if (candidateErrors.length > 0) {
      // Errors exist but could not be confirmed due to uncertainty/ambiguity/low confidence
      const isUncertainOrLowAlignment =
        input.ambiguityState.isAmbiguous ||
        input.acousticConfidence < 0.70 ||
        input.alignmentConfidence < this.thresholds.minAlignmentConfidence;

      finalStatus = isUncertainOrLowAlignment
        ? RecitationDecisionState.REQUEST_REPEAT
        : RecitationDecisionState.POSSIBLE_ERROR;
      escalationLevel = EscalationLevel.LEVEL_1_UNCERTAIN;
      decisionReason = `UNCERTAIN_CANDIDATE_DISCREPANCY: ${candidateErrors.length} candidate discrepancy below provisional safety gates.`;
    } else if (tajweedPending.length > 0) {
      finalStatus = RecitationDecisionState.TAJWEED_EVIDENCE_PENDING;
      escalationLevel = EscalationLevel.LEVEL_4_TAJWEED_EVIDENCE_PENDING;
      decisionReason = `TAJWEED_EVIDENCE_PENDING: ${tajweedPending.length} Tajweed rules require calibrated acoustic confirmation.`;
    } else if (hasTajweedMismatch) {
      finalStatus = RecitationDecisionState.DEFER_TO_TEACHER;
      escalationLevel = EscalationLevel.LEVEL_2_REQUEST_REPEAT;
      decisionReason = 'TAJWEED_RULE_MISMATCH_DEFERRED_TO_TEACHER';
    }

    // 6. INTERRUPTION RECOMMENDATION (Section 19)
    const interruption = this.computeInterruptionRecommendation(finalStatus, confirmedErrors, stability, input);

    // 7. AUDIT TRAIL (Section 25)
    const auditTrail: DecisionAuditTrail = {
      decisionId,
      evidenceIds: input.recitationEvidence.map(e => `${e.ayahId}:${e.wordIndex}:${e.phonemeIndex}`),
      ruleEvidenceIds: input.tajweedRuleEvidence.map(r => r.evidenceId),
      modelVersion: input.modelVersion,
      modelHash: input.modelHash,
      quranHash: input.quranDatasetHash,
      tajweedHash: input.tajweedKBHash,
      riwayah: input.riwayah,
      thresholdVersion: this.thresholds.thresholdVersion,
      decisionTimestamp,
      decisionReason,
      finalStatus,
      integrityStatus: 'PASSED',
    };

    // 8. LEARNER FEEDBACK GENERATION (Section 23, 24)
    const learnerFeedback = this.buildLearnerFeedback(finalStatus, decisionId, tajweedPending.length > 0);

    const canContinue = finalStatus === RecitationDecisionState.MATCH;
    const shouldRepeat = finalStatus === RecitationDecisionState.REQUEST_REPEAT || 
                         finalStatus === RecitationDecisionState.CONFIRMED_PHONETIC_ERROR;

    return deepFreeze<RecitationDecisionOutput>({
      decisionId,
      finalStatus,
      escalationLevel,
      confirmedErrors,
      candidateErrors,
      tajweedPendingRules: tajweedPending,
      alignmentStability: stability,
      interruption,
      learnerFeedback,
      auditTrail,
      canContinue,
      shouldRepeat,
    });
  }

  /**
   * Aggregates decisions across an entire Ayah context (Section 21, 22).
   */
  public evaluateAyah(input: RecitationDecisionInput): AyahRecitationDecision {
    const singleDecision = this.evaluate(input);

    // Group phoneme evidence by word index
    const wordMap = new Map<number, RecitationEvidence[]>();
    for (const ev of input.recitationEvidence) {
      const list = wordMap.get(ev.wordIndex) || [];
      list.push(ev);
      wordMap.set(ev.wordIndex, list);
    }

    const wordDecisions: WordRecitationDecision[] = [];
    let totalErrors = 0;
    let totalUncertain = 0;
    let totalConfirmed = 0;

    for (const [wIdx, evList] of wordMap.entries()) {
      const wordErrors: PhoneticErrorDetail[] = [];
      let lowConfidenceCount = 0;

      for (const ev of evList) {
        if (ev.errorType !== 'MATCH') {
          const detail = this.mapToErrorDetail(ev, 0);
          wordErrors.push(detail);

          if (ev.acousticConfidence < this.thresholds.minConfidence || ev.alignmentConfidence < this.thresholds.minAlignmentConfidence) {
            lowConfidenceCount++;
          }
        }
      }

      // Word-Level Aggregation: 3 low-confidence phoneme discrepancies -> ALIGNMENT_INSTABILITY
      const hasAlignmentInstability = lowConfidenceCount >= 3;
      const stability = hasAlignmentInstability ? AlignmentStabilityState.UNSTABLE : AlignmentStabilityState.STABLE;

      let wordStatus = RecitationDecisionState.MATCH;
      if (hasAlignmentInstability) {
        wordStatus = RecitationDecisionState.REQUEST_REPEAT;
        totalUncertain++;
      } else if (wordErrors.length > 0) {
        const hasConfirmed = wordErrors.some(e => e.confidence >= this.thresholds.minConfidence && !e.isCascadingSuppressed);
        if (hasConfirmed) {
          wordStatus = RecitationDecisionState.CONFIRMED_PHONETIC_ERROR;
          totalConfirmed++;
          totalErrors++;
        } else {
          wordStatus = RecitationDecisionState.POSSIBLE_ERROR;
          totalUncertain++;
        }
      }

      wordDecisions.push({
        wordIndex: wIdx,
        status: wordStatus,
        phonemeDecisions: wordErrors,
        alignmentStability: stability,
        hasAlignmentInstability,
        confidence: evList.reduce((acc, curr) => acc + curr.acousticConfidence, 0) / (evList.length || 1),
      });
    }

    let alignmentQuality: 'EXCELLENT' | 'GOOD' | 'UNSTABLE' | 'DEGRADED' = 'GOOD';
    if (singleDecision.alignmentStability === AlignmentStabilityState.COLLAPSED) {
      alignmentQuality = 'DEGRADED';
    } else if (singleDecision.alignmentStability === AlignmentStabilityState.UNSTABLE || singleDecision.alignmentStability === AlignmentStabilityState.PENDING_REALIGNMENT) {
      alignmentQuality = 'UNSTABLE';
    } else if (input.alignmentConfidence >= 0.90) {
      alignmentQuality = 'EXCELLENT';
    }

    let signalQuality: 'EXCELLENT' | 'ACCEPTABLE' | 'DEGRADED' | 'UNUSABLE' = 'ACCEPTABLE';
    if (input.signalQuality.isSilence || input.signalQuality.isWhiteNoise) {
      signalQuality = 'UNUSABLE';
    } else if (input.signalQuality.snrDb < 10) {
      signalQuality = 'DEGRADED';
    } else if (input.signalQuality.snrDb >= 20) {
      signalQuality = 'EXCELLENT';
    }

    const ayahDecision: AyahRecitationDecision = {
      ayahId: input.ayahId || 'unknown_ayah',
      overallStatus: singleDecision.finalStatus,
      wordDecisions,
      errorCount: totalErrors,
      uncertainCount: totalUncertain,
      confirmedCount: totalConfirmed,
      tajweedPendingCount: singleDecision.tajweedPendingRules.length,
      alignmentQuality,
      signalQuality,
      canContinue: singleDecision.canContinue,
      shouldRepeat: singleDecision.shouldRepeat,
      auditTrail: singleDecision.auditTrail,
    };

    return deepFreeze<AyahRecitationDecision>(ayahDecision);
  }

  /**
   * Recommends whether the recitation should be interrupted immediately.
   */
  public recommendInterruption(
    input: RecitationDecisionInput,
    currentOutput: RecitationDecisionOutput
  ): InterruptionRecommendation {
    return this.computeInterruptionRecommendation(
      currentOutput.finalStatus,
      currentOutput.confirmedErrors,
      currentOutput.alignmentStability,
      input
    );
  }

  /**
   * Generates student-safe feedback (Section 23, 24).
   */
  public generateLearnerFeedback(
    output: RecitationDecisionOutput,
    verifiedAyahText?: string
  ): LearnerRecitationFeedback {
    const baseFeedback = this.buildLearnerFeedback(
      output.finalStatus,
      output.decisionId,
      output.tajweedPendingRules.length > 0
    );

    if (verifiedAyahText) {
      return deepFreeze<LearnerRecitationFeedback>({
        ...baseFeedback,
        verifiedAyahContext: verifiedAyahText,
      });
    }

    return baseFeedback;
  }

  // ================= PRIVATE HELPER METHODS =================

  /**
   * Cryptographic and configuration integrity check (Section 8).
   */
  private verifyIntegrity(input: RecitationDecisionInput): { isValid: boolean; reason: string } {
    if (input.quranDatasetHash !== HAFS_OFFICIAL_CERTIFICATE.checksumSha256) {
      return {
        isValid: false,
        reason: `Quran dataset hash mismatch! Expected ${HAFS_OFFICIAL_CERTIFICATE.checksumSha256}, got ${input.quranDatasetHash}`,
      };
    }

    if (input.tajweedKBHash !== TAJWEED_KB_CHECKSUM_SHA256) {
      return {
        isValid: false,
        reason: `Tajweed KB checksum mismatch! Expected ${TAJWEED_KB_CHECKSUM_SHA256}, got ${input.tajweedKBHash}`,
      };
    }

    if (input.modelHash !== OFFICIAL_MODEL_HASH) {
      return {
        isValid: false,
        reason: `Acoustic model hash mismatch! Expected ${OFFICIAL_MODEL_HASH}, got ${input.modelHash}`,
      };
    }

    if (input.riwayah !== RiwayahType.HAFS_AN_ASIM && input.riwayah !== 'HAFS_AN_ASIM') {
      return {
        isValid: false,
        reason: `Riwayah mismatch! Only certified Riwayah is HAFS_AN_ASIM, got ${input.riwayah}`,
      };
    }

    return { isValid: true, reason: 'VERIFIED' };
  }

  /**
   * Processes phonetic evidence with cascading alignment protection and confidence gating.
   */
  private processPhoneticEvidence(input: RecitationDecisionInput): {
    stability: AlignmentStabilityState;
    candidateErrors: PhoneticErrorDetail[];
    confirmedErrors: PhoneticErrorDetail[];
  } {
    const candidateErrors: PhoneticErrorDetail[] = [];
    const confirmedErrors: PhoneticErrorDetail[] = [];
    let stability: AlignmentStabilityState = AlignmentStabilityState.STABLE;

    const evidenceList = input.recitationEvidence;
    let consecutiveDiscrepancies = 0;
    let alignmentSlipDetected = false;

    for (let i = 0; i < evidenceList.length; i++) {
      const ev = evidenceList[i];

      if (ev.errorType === 'MATCH') {
        consecutiveDiscrepancies = 0;
        continue;
      }

      consecutiveDiscrepancies++;

      // Check for alignment slip: if observed token matches next expected token (i+1)
      if (i + 1 < evidenceList.length && ev.observedToken === evidenceList[i + 1].expectedToken) {
        alignmentSlipDetected = true;
      }

      // If more than 2 consecutive discrepancies or slip detected -> alignment instability
      if (consecutiveDiscrepancies >= 2 || alignmentSlipDetected) {
        stability = AlignmentStabilityState.PENDING_REALIGNMENT;
      }

      const isCascadingSuppressed = stability === AlignmentStabilityState.PENDING_REALIGNMENT && consecutiveDiscrepancies > 1;

      const detail = this.mapToErrorDetail(ev, input.chunkIndex, isCascadingSuppressed);
      candidateErrors.push(detail);

      // Check if candidate qualifies as CONFIRMED_PHONETIC_ERROR (Section 10)
      const meetsAcoustic = ev.acousticConfidence >= this.thresholds.minConfidence;
      const meetsMargin = (ev.marginPeak ?? 1.0) >= this.thresholds.minMarginPeak;
      const meetsAlignment = ev.alignmentConfidence >= this.thresholds.minAlignmentConfidence;
      const meetsAmbiguity = !input.ambiguityState.isAmbiguous;
      const isKnownTokens = ev.expectedToken !== '' && ev.observedToken !== '';
      const isNotSuppressed = !isCascadingSuppressed;
      const isNotDeletion = ev.errorType !== 'DELETION'; // Deletions lack physical acoustic waveform bounds per ERR-ALIGN-002

      if (
        meetsAcoustic &&
        meetsMargin &&
        meetsAlignment &&
        meetsAmbiguity &&
        isKnownTokens &&
        isNotSuppressed &&
        isNotDeletion &&
        ev.evidenceStatus !== 'INCONCLUSIVE'
      ) {
        confirmedErrors.push(detail);
      }
    }

    return { stability, candidateErrors, confirmedErrors };
  }

  /**
   * Processes Tajweed rule evidence respecting ERR-TAJ-001 through ERR-TAJ-004.
   */
  private processTajweedEvidence(input: RecitationDecisionInput): {
    tajweedPending: TajweedRuleEvidence[];
    hasTajweedMismatch: boolean;
  } {
    const tajweedPending: TajweedRuleEvidence[] = [];
    let hasTajweedMismatch = false;

    for (const ruleEv of input.tajweedRuleEvidence) {
      if (ruleEv.decisionStatus === 'INCONCLUSIVE') {
        tajweedPending.push(ruleEv);
      } else if (ruleEv.decisionStatus === 'RULE_APPLICABLE') {
        // If acoustic evidence is inconclusive or rule requires specialized analysis, keep pending
        tajweedPending.push(ruleEv);
      } else if (ruleEv.decisionStatus === 'NOT_SUPPORTED') {
        hasTajweedMismatch = true;
      }
    }

    return { tajweedPending, hasTajweedMismatch };
  }

  /**
   * Maps RecitationEvidence to PhoneticErrorDetail.
   */
  private mapToErrorDetail(
    ev: RecitationEvidence,
    sourceChunk?: number,
    isCascadingSuppressed: boolean = false
  ): PhoneticErrorDetail {
    let errorType = PhoneticDecisionErrorType.SUBSTITUTION;
    if (ev.errorType === 'DELETION') errorType = PhoneticDecisionErrorType.DELETION;
    else if (ev.errorType === 'INSERTION') errorType = PhoneticDecisionErrorType.INSERTION;
    else if (ev.errorType === 'UNCERTAIN' || ev.errorType === 'INCONCLUSIVE') errorType = PhoneticDecisionErrorType.UNRESOLVED;

    return {
      errorType,
      expectedToken: ev.expectedToken,
      observedToken: ev.observedToken,
      expectedLocation: {
        ayahId: ev.ayahId,
        wordIndex: ev.wordIndex,
        phonemeIndex: ev.phonemeIndex,
      },
      observedLocation: {
        startTime: ev.startTime,
        endTime: ev.endTime,
      },
      startTime: ev.startTime,
      endTime: ev.endTime,
      confidence: ev.acousticConfidence,
      alignmentConfidence: ev.alignmentConfidence,
      evidenceStatus: ev.evidenceStatus,
      sourceChunk,
      isCascadingSuppressed,
    };
  }

  /**
   * Computes conservative interruption recommendation.
   */
  private computeInterruptionRecommendation(
    finalStatus: RecitationDecisionState,
    confirmedErrors: readonly PhoneticErrorDetail[],
    stability: AlignmentStabilityState,
    input: RecitationDecisionInput
  ): InterruptionRecommendation {
    // Immediate interruption is permitted ONLY when:
    // - evidence is high-confidence (confirmedErrors exist)
    // - stability is STABLE (won't cause cascading alignment crash)
    // - ambiguity is false
    if (
      finalStatus === RecitationDecisionState.CONFIRMED_PHONETIC_ERROR &&
      confirmedErrors.length > 0 &&
      stability === AlignmentStabilityState.STABLE &&
      !input.ambiguityState.isAmbiguous
    ) {
      return {
        shouldInterrupt: true,
        reason: 'CONFIRMED_HIGH_CONFIDENCE_PHONETIC_ERROR',
        severity: 'HIGH',
        confidence: confirmedErrors[0].confidence,
        evidenceId: `${confirmedErrors[0].expectedLocation.ayahId}:${confirmedErrors[0].expectedLocation.wordIndex}`,
        recommendedAction: 'INTERRUPT_IMMEDIATELY',
      };
    }

    if (finalStatus === RecitationDecisionState.REQUEST_REPEAT) {
      return {
        shouldInterrupt: false,
        reason: 'LOW_CONFIDENCE_OR_SIGNAL_QUALITY',
        severity: 'LOW',
        confidence: input.acousticConfidence,
        recommendedAction: 'REQUEST_REPEAT',
      };
    }

    if (finalStatus === RecitationDecisionState.TAJWEED_EVIDENCE_PENDING || finalStatus === RecitationDecisionState.DEFER_TO_TEACHER) {
      return {
        shouldInterrupt: false,
        reason: 'TAJWEED_OR_PEDAGOGICAL_DEFERRAL',
        severity: 'MEDIUM',
        confidence: input.acousticConfidence,
        recommendedAction: 'DEFER',
      };
    }

    return {
      shouldInterrupt: false,
      reason: 'RECITATION_WITHIN_ACCEPTABLE_MARGIN',
      severity: 'NONE',
      confidence: input.acousticConfidence,
      recommendedAction: 'PROCEED',
    };
  }

  /**
   * Builds clean, respectful, learner-facing feedback without technical or religious condemnation.
   */
  private buildLearnerFeedback(
    status: RecitationDecisionState,
    decisionId: string,
    isTajweedPending: boolean
  ): LearnerRecitationFeedback {
    const feedbackId = `fb-${decisionId}`;

    switch (status) {
      case RecitationDecisionState.MATCH:
      case RecitationDecisionState.CONTINUE:
        return {
          feedbackId,
          decisionState: status,
          messageArabic: 'ممتاز، كمّل.',
          messageEnglish: 'Excellent, keep reciting.',
          pedagogicalActionArabic: 'متابعة التلاوة',
          isTajweedPending,
          repeatRequested: false,
        };

      case RecitationDecisionState.REQUEST_REPEAT:
      case RecitationDecisionState.INCONCLUSIVE:
        return {
          feedbackId,
          decisionState: status,
          messageArabic: 'الصوت مش واضح كفاية. اقرأ الكلمة مرة تانية.',
          messageEnglish: 'The audio is not clear enough. Please recite the word again.',
          pedagogicalActionArabic: 'إعادة قراءة الكلمة',
          isTajweedPending,
          repeatRequested: true,
        };

      case RecitationDecisionState.CONFIRMED_PHONETIC_ERROR:
        return {
          feedbackId,
          decisionState: status,
          messageArabic: 'في اختلاف في نطق الحرف. جرّب مرة تانية.',
          messageEnglish: 'There is a discrepancy in the letter pronunciation. Please try again.',
          pedagogicalActionArabic: 'تصحيح نطق الحرف',
          isTajweedPending,
          repeatRequested: true,
        };

      case RecitationDecisionState.TAJWEED_EVIDENCE_PENDING:
        return {
          feedbackId,
          decisionState: status,
          messageArabic: 'السياق التجويدي يحتاج استماعًا أوضح للتأكد.',
          messageEnglish: 'The Tajweed rule context requires clearer acoustic verification.',
          pedagogicalActionArabic: 'استماع ومراجعة الحكم التجويدي',
          isTajweedPending: true,
          repeatRequested: false,
        };

      case RecitationDecisionState.DEFER_TO_TEACHER:
      default:
        return {
          feedbackId,
          decisionState: status,
          messageArabic: 'راجع نطق الكلمة مع المعلم للتأكد.',
          messageEnglish: 'Review the pronunciation of this word with the teacher.',
          pedagogicalActionArabic: 'عرض الكلمة على المعلم',
          isTajweedPending,
          repeatRequested: false,
        };
    }
  }

  /**
   * Helper to create a degraded signal decision output.
   */
  private createDegradedSignalOutput(
    decisionId: string,
    input: RecitationDecisionInput,
    decisionTimestamp: string,
    reason: string,
    messageArabic: string,
    messageEnglish: string
  ): RecitationDecisionOutput {
    const auditTrail: DecisionAuditTrail = {
      decisionId,
      evidenceIds: input.recitationEvidence.map(e => `${e.ayahId}:${e.wordIndex}:${e.phonemeIndex}`),
      ruleEvidenceIds: input.tajweedRuleEvidence.map(r => r.evidenceId),
      modelVersion: input.modelVersion,
      modelHash: input.modelHash,
      quranHash: input.quranDatasetHash,
      tajweedHash: input.tajweedKBHash,
      riwayah: input.riwayah,
      thresholdVersion: this.thresholds.thresholdVersion,
      decisionTimestamp,
      decisionReason: reason,
      finalStatus: RecitationDecisionState.REQUEST_REPEAT,
      integrityStatus: 'PASSED',
    };

    const learnerFeedback: LearnerRecitationFeedback = {
      feedbackId: `fb-${decisionId}`,
      decisionState: RecitationDecisionState.REQUEST_REPEAT,
      messageArabic,
      messageEnglish,
      pedagogicalActionArabic: 'إعادة التلاوة',
      isTajweedPending: false,
      repeatRequested: true,
    };

    const interruption: InterruptionRecommendation = {
      shouldInterrupt: false,
      reason,
      severity: 'LOW',
      confidence: input.acousticConfidence,
      recommendedAction: 'REQUEST_REPEAT',
    };

    return deepFreeze<RecitationDecisionOutput>({
      decisionId,
      finalStatus: RecitationDecisionState.REQUEST_REPEAT,
      escalationLevel: EscalationLevel.LEVEL_2_REQUEST_REPEAT,
      confirmedErrors: [],
      candidateErrors: [],
      tajweedPendingRules: [],
      alignmentStability: AlignmentStabilityState.UNSTABLE,
      interruption,
      learnerFeedback,
      auditTrail,
      canContinue: false,
      shouldRepeat: true,
    });
  }
}
