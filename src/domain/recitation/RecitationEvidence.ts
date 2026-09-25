/**
 * @file RecitationEvidence.ts
 * @module domain/recitation
 * @description Deterministic acoustic/phonetic evidence layer for Quran recitation evaluation.
 * 
 * CORE PRINCIPLE:
 * The acoustic model produces ACOUSTIC / PHONETIC EVIDENCE ONLY.
 * It does NOT produce authoritative religious rulings.
 * 
 * Strictly forbidden from classifying:
 * - Lahn Jali / Lahn Khafi
 * - Ikhfa, Idgham, Iqlab, Qalqalah
 * - Madd or Ghunnah correctness
 * - Any fiqh or religious verdict
 * 
 * Those decisions remain downstream of the verified Quran / Tajweed deterministic rule system.
 */

export type EvidenceErrorType = 
  | 'MATCH'
  | 'SUBSTITUTION'
  | 'DELETION'
  | 'INSERTION'
  | 'UNCERTAIN'
  | 'INCONCLUSIVE';

export type EvidenceConfidenceStatus = 
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'INCONCLUSIVE'
  | 'UNCALIBRATED';

export interface RecitationEvidence {
  ayahId: string;
  wordIndex: number;
  phonemeIndex: number;
  expectedToken: string;
  observedToken: string;
  errorType: EvidenceErrorType;
  acousticConfidence: number;      // 0.0 - 1.0 (calibrated posterior probability or margin)
  alignmentConfidence: number;     // 0.0 - 1.0 (temporal alignment certainty)
  startTime: number;               // Seconds or milliseconds
  endTime: number;                 // Seconds or milliseconds
  evidenceStatus: EvidenceConfidenceStatus;
  marginPeak?: number;             // top1_prob - top2_prob
  isSyntheticAudio?: boolean;      // Flags synthetic test audio
}

export type PedagogicalDisposition = 
  | 'PROCEED'
  | 'REPEAT_REQUESTED'
  | 'EVIDENCE_FLAGGED'
  | 'BLOCKED_UNCERTAIN';

export interface EvidenceEvaluationResult {
  disposition: PedagogicalDisposition;
  userFacingMessageArabic: string;
  userFacingMessageEnglish: string;
  evidenceItems: RecitationEvidence[];
  isAmbiguous: boolean;
  confidenceStatus: EvidenceConfidenceStatus;
  overallAcousticScore: number;
}

/**
 * Empirical Confidence Gating Thresholds.
 * Derived from validation split calibration on the Quranic phoneme recognizer.
 */
export interface ConfidenceGateThresholds {
  highThreshold: number;       // e.g. 0.85 margin / 0.95 prob
  mediumThreshold: number;     // e.g. 0.50 margin / 0.75 prob
  minAcousticConfidence: number; // Below this is INCONCLUSIVE
  minAlignmentConfidence: number;
  minSnrDb: number;
}

export const EMPIRICALLY_CALIBRATED_THRESHOLDS: ConfidenceGateThresholds = {
  highThreshold: 0.85,
  mediumThreshold: 0.60,
  minAcousticConfidence: 0.55,
  minAlignmentConfidence: 0.50,
  minSnrDb: 10.0,
};

/**
 * Safety evaluator enforcing the mandate:
 * Prefer "I need you to repeat that" over "You made a mistake" whenever evidence is ambiguous.
 */
export class RecitationEvidenceEvaluator {
  private thresholds: ConfidenceGateThresholds;
  private isCalibrated: boolean;

  constructor(thresholds: ConfidenceGateThresholds = EMPIRICALLY_CALIBRATED_THRESHOLDS, isCalibrated: boolean = true) {
    this.thresholds = thresholds;
    this.isCalibrated = isCalibrated;
  }

  /**
   * Determine evidence status based on acoustic confidence and calibration state.
   */
  public determineEvidenceStatus(
    acousticConfidence: number,
    alignmentConfidence: number,
    marginPeak?: number,
    snrDb?: number
  ): EvidenceConfidenceStatus {
    if (!this.isCalibrated) {
      return 'UNCALIBRATED';
    }

    if (snrDb !== undefined && snrDb < this.thresholds.minSnrDb) {
      return 'INCONCLUSIVE';
    }

    if (
      acousticConfidence < this.thresholds.minAcousticConfidence ||
      alignmentConfidence < this.thresholds.minAlignmentConfidence
    ) {
      return 'INCONCLUSIVE';
    }

    const effectiveScore = marginPeak !== undefined 
      ? (acousticConfidence * 0.5 + marginPeak * 0.5)
      : acousticConfidence;

    if (effectiveScore >= this.thresholds.highThreshold) {
      return 'HIGH';
    } else if (effectiveScore >= this.thresholds.mediumThreshold) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Evaluate a collection of evidence items and decide safe pedagogical disposition.
   */
  public evaluateDisposition(
    items: RecitationEvidence[],
    audioSnrDb?: number
  ): EvidenceEvaluationResult {
    if (!this.isCalibrated) {
      return {
        disposition: 'BLOCKED_UNCERTAIN',
        userFacingMessageArabic: 'نموذج المعايرة غير مكتمل - يُرجى إعادة المحاولة مع المعلم',
        userFacingMessageEnglish: 'Calibration unverified - automated correction is blocked. Please repeat with a teacher.',
        evidenceItems: items,
        isAmbiguous: true,
        confidenceStatus: 'UNCALIBRATED',
        overallAcousticScore: 0,
      };
    }

    // Safety rule: Low signal quality triggers repetition request, never error condemnation
    if (audioSnrDb !== undefined && audioSnrDb < this.thresholds.minSnrDb) {
      return {
        disposition: 'REPEAT_REQUESTED',
        userFacingMessageArabic: 'جودة الصوت غير كافية، يُرجى إعادة التلاوة بوضوح',
        userFacingMessageEnglish: 'Audio signal quality is low. Please repeat the recitation clearly.',
        evidenceItems: items,
        isAmbiguous: true,
        confidenceStatus: 'INCONCLUSIVE',
        overallAcousticScore: 0,
      };
    }

    if (items.length === 0) {
      return {
        disposition: 'REPEAT_REQUESTED',
        userFacingMessageArabic: 'لم يتم التقاط تلاوة مسموعة، يُرجى التلاوة',
        userFacingMessageEnglish: 'No clear recitation detected. Please recite the verse.',
        evidenceItems: items,
        isAmbiguous: true,
        confidenceStatus: 'INCONCLUSIVE',
        overallAcousticScore: 0,
      };
    }

    // Safety rule: If all expected tokens were deleted (no acoustic speech was detected or matched)
    const observedCount = items.filter(it => it.errorType !== 'DELETION').length;
    if (observedCount === 0) {
      return {
        disposition: 'REPEAT_REQUESTED',
        userFacingMessageArabic: 'لم يتم رصد تلاوة صوتية مطابقة، يُرجى إعادة التلاوة بوضوح',
        userFacingMessageEnglish: 'No matching recitation detected (silence or noise). Please recite clearly.',
        evidenceItems: items,
        isAmbiguous: true,
        confidenceStatus: 'INCONCLUSIVE',
        overallAcousticScore: 0,
      };
    }

    // Check for ambiguous or inconclusive evidence items
    const inconclusiveCount = items.filter(
      (it) => it.evidenceStatus === 'INCONCLUSIVE' || it.errorType === 'INCONCLUSIVE' || it.errorType === 'UNCERTAIN'
    ).length;

    const totalItems = items.length;
    const ambiguityRatio = inconclusiveCount / totalItems;

    // Calculate mean confidence
    const meanAcousticConf = items.reduce((sum, it) => sum + it.acousticConfidence, 0) / totalItems;

    // Safety rule: If ambiguity is high or mean confidence is below threshold, request repeat
    if (ambiguityRatio > 0.20 || meanAcousticConf < this.thresholds.minAcousticConfidence) {
      return {
        disposition: 'REPEAT_REQUESTED',
        userFacingMessageArabic: 'التلاوة غير واضحة صوتياً، يرجى إعادة الآية',
        userFacingMessageEnglish: 'Recitation acoustic trace is ambiguous. Please repeat the verse.',
        evidenceItems: items,
        isAmbiguous: true,
        confidenceStatus: 'LOW',
        overallAcousticScore: meanAcousticConf,
      };
    }

    // Check for high-confidence discrepancies (SUBSTITUTION, DELETION, INSERTION)
    const discrepancyItems = items.filter(
      (it) => it.errorType !== 'MATCH' && (it.evidenceStatus === 'HIGH' || it.evidenceStatus === 'MEDIUM')
    );

    if (discrepancyItems.length === 0) {
      return {
        disposition: 'PROCEED',
        userFacingMessageArabic: 'تم رصد التلاوة ومطابقتها صوتياً بنجاح',
        userFacingMessageEnglish: 'Recitation phonetically observed and aligned with high confidence.',
        evidenceItems: items,
        isAmbiguous: false,
        confidenceStatus: 'HIGH',
        overallAcousticScore: meanAcousticConf,
      };
    }

    // Flag evidence to downstream deterministic rule engine
    return {
      disposition: 'EVIDENCE_FLAGGED',
      userFacingMessageArabic: 'تم رصد اختلاف صوتي محتمل - في انتظار التحقق التجويدي',
      userFacingMessageEnglish: 'Phonetic discrepancy observed with acoustic evidence - forwarded to Tajweed rule evaluator.',
      evidenceItems: items,
      isAmbiguous: false,
      confidenceStatus: discrepancyItems.some(d => d.evidenceStatus === 'HIGH') ? 'HIGH' : 'MEDIUM',
      overallAcousticScore: meanAcousticConf,
    };
  }
}
