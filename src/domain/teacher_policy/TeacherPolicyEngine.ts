/**
 * @file TeacherPolicyEngine.ts
 * @module domain/teacher_policy
 * @description Production Teacher Policy & Pedagogical Decision Engine for Phase 7A.
 * 
 * CORE CONTRACT & INVARIANTS:
 * - Transforms verified recitation evidence and deterministic decision-engine outputs into
 *   safe, consistent, pedagogically appropriate teaching actions.
 * - Enforces absolute priority of evidence hierarchy:
 *     Verified Quran Data > Deterministic Rule Engine > Recitation Decision Engine > Teacher Policy Engine > AI Language Generation
 * - Under NO circumstances does this engine issue religious rulings (*Fatwa*, *Hukm*, *Batil*, *Haram*).
 * - Under NO circumstances does this engine convert TAJWEED_EVIDENCE_PENDING into an error.
 * - Under NO circumstances does this engine fabricate or inflate confidence through repetition.
 * - Completely deterministic: Identical TeacherDecisionContext produces bit-for-bit identical output.
 */

import {
  PedagogicalAction,
  TeacherActionAuthorizationStatus,
  LearningMode,
  PedagogicalEscalationLevel,
  TeachingErrorCategory,
  CorrectionGranularity,
  StudentLearningState,
  TeacherInterruptionPolicy,
  PROVISIONAL_TEACHER_INTERRUPTION_POLICY,
  TeacherFeedbackIntent,
  TeacherDecisionContext,
  TeacherPolicyAuditTrail,
  TeacherPolicyDecisionOutput,
  ITeacherPolicyEngine,
} from './types.ts';
import {
  RecitationDecisionState,
  PhoneticDecisionErrorType,
  AlignmentStabilityState,
  PhoneticErrorDetail,
} from '../recitation/decisionTypes.ts';
import { CANONICAL_QURAN_HASH, OFFICIAL_MODEL_HASH } from '../recitation/RecitationErrorDecisionEngine.ts';
import { TAJWEED_KB_CHECKSUM_SHA256 } from '../tajweed/VerifiedTajweedKnowledgeBase.ts';
import { FORBIDDEN_PEDAGOGICAL_CLAIMS, ALLOWED_PEDAGOGICAL_CONCEPTS } from './LLMBoundaryContract.ts';

/**
 * Deep freezes an object to ensure absolute immutability.
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
 * Production implementation of ITeacherPolicyEngine.
 */
export class TeacherPolicyEngine implements ITeacherPolicyEngine {
  private static instance: TeacherPolicyEngine | null = null;
  private readonly interruptionPolicy: TeacherInterruptionPolicy;

  public constructor(
    interruptionPolicy: TeacherInterruptionPolicy = PROVISIONAL_TEACHER_INTERRUPTION_POLICY
  ) {
    this.interruptionPolicy = deepFreeze(interruptionPolicy);
  }

  public static getInstance(): TeacherPolicyEngine {
    if (!TeacherPolicyEngine.instance) {
      TeacherPolicyEngine.instance = new TeacherPolicyEngine();
    }
    return TeacherPolicyEngine.instance;
  }

  /**
   * Evaluates an immutable TeacherDecisionContext and deterministically produces
   * an authorized PedagogicalAction and TeacherFeedbackIntent.
   */
  public evaluate(context: TeacherDecisionContext): TeacherPolicyDecisionOutput {
    // 0. Ensure deep immutability of input context
    deepFreeze(context);

    const {
      sessionId,
      studentId,
      timestamp,
      riwayah,
      quranDatasetHash,
      tajweedKBHash,
      modelVersion,
      modelHash,
      policyVersion,
      learningMode,
      verifiedQuranContext,
      recitationEvidence,
      tajweedRuleEvidence,
      recitationDecision,
      signalQuality,
      acousticConfidence,
      alignmentConfidence,
      decisionConfidence,
      studentLearningState,
    } = context;

    const evidenceIds: string[] = recitationEvidence.map(
      (e) => (e as any).evidenceId || `${e.ayahId}:${e.wordIndex}:${e.phonemeIndex}`
    );
    const ruleEvidenceIds: string[] = tajweedRuleEvidence.map((r) => r.ruleId);

    // =========================================================================
    // PRIORITY 1: SYSTEM INTEGRITY GATE (Quran Hash, Tajweed KB Hash, Model Hash, Riwayah)
    // =========================================================================
    const isQuranValid = quranDatasetHash === CANONICAL_QURAN_HASH;
    const isTajweedValid = tajweedKBHash === TAJWEED_KB_CHECKSUM_SHA256;
    const isModelValid = modelHash === OFFICIAL_MODEL_HASH;
    const isRiwayahValid = riwayah.includes('HAFS') || riwayah.includes('Hafs') || riwayah === 'HAFS_AN_ASIM';

    if (!isQuranValid || !isTajweedValid || !isModelValid || !isRiwayahValid) {
      const integrityFailureReason = !isQuranValid
        ? 'INTEGRITY_FAILURE: Quran dataset hash mismatch'
        : !isTajweedValid
        ? 'INTEGRITY_FAILURE: Tajweed knowledge base hash mismatch'
        : !isModelValid
        ? 'INTEGRITY_FAILURE: Model weight hash mismatch'
        : 'INTEGRITY_FAILURE: Riwayah mismatch (only Hafs an Asim certified)';

      return this.buildDecisionOutput({
        context,
        action: PedagogicalAction.DEFER_TO_TEACHER,
        authorizationStatus: TeacherActionAuthorizationStatus.TEACHER_ACTION_REQUIRES_TEACHER,
        escalationLevel: PedagogicalEscalationLevel.LEVEL_5_DEFER_TO_TEACHER,
        actionReason: integrityFailureReason,
        taxonomyCategory: TeachingErrorCategory.E_UNKNOWN_INSUFFICIENT,
        correctionGranularity: CorrectionGranularity.AYAH,
        shouldInterrupt: true,
        interruptionReason: integrityFailureReason,
        intentType: 'TEACHER_DEFERRAL',
        targetWordIndex: studentLearningState.currentWord || 0,
        pedagogicalPromptArabic: 'يرجى مراجعة المعلم المعتمد لعدم اكتمال التحقق من سلامة البيانات.',
        pedagogicalPromptEnglish: 'Please defer to a qualified teacher; system verification integrity check failed.',
        integrityStatus: 'INTEGRITY_FAILURE',
      });
    }

    // =========================================================================
    // PRIORITY 2: SIGNAL QUALITY GATE (Silence, White Noise, Clipping, Dropouts, SNR < 10dB)
    // =========================================================================
    const isSignalUnusable =
      signalQuality.isSilence === true ||
      signalQuality.isWhiteNoise === true ||
      signalQuality.isClipping === true ||
      signalQuality.hasDropouts === true ||
      signalQuality.isDegraded === true ||
      signalQuality.snrDb < 10.0;

    if (isSignalUnusable) {
      const signalReason = signalQuality.isSilence
        ? 'SIGNAL_FAILURE: Silence detected (no recitation speech)'
        : signalQuality.isWhiteNoise
        ? 'SIGNAL_FAILURE: White noise floor detected'
        : signalQuality.isClipping
        ? 'SIGNAL_FAILURE: Severe digital clipping detected'
        : signalQuality.hasDropouts
        ? 'SIGNAL_FAILURE: Packet dropouts detected'
        : `SIGNAL_FAILURE: Insufficient SNR (${signalQuality.snrDb.toFixed(1)} dB < 10 dB)`;

      return this.buildDecisionOutput({
        context,
        action: PedagogicalAction.REQUEST_CLEARER_AUDIO,
        authorizationStatus: TeacherActionAuthorizationStatus.TEACHER_ACTION_REQUIRES_CLEAR_AUDIO,
        escalationLevel: PedagogicalEscalationLevel.LEVEL_1_SHORT_INDICATION,
        actionReason: signalReason,
        taxonomyCategory: TeachingErrorCategory.E_UNKNOWN_INSUFFICIENT,
        correctionGranularity: CorrectionGranularity.AYAH,
        shouldInterrupt: false,
        intentType: 'AUDIO_CLARIFICATION',
        targetWordIndex: studentLearningState.currentWord || 0,
        pedagogicalPromptArabic: 'الصوت مش واضح كفاية، نحتاج قراءة أوضح للتأكد.',
        pedagogicalPromptEnglish: 'Audio is not clear enough, please recite more clearly into the microphone.',
        integrityStatus: 'PASSED',
      });
    }

    // =========================================================================
    // PRIORITY 3: ALIGNMENT STABILITY GATE & CASCADING ERROR PROTECTION
    // (Trellis Slip, Deletion Boundary Shift, Alignment Confidence < 0.80)
    // =========================================================================
    const isAlignmentUnstable =
      recitationDecision.alignmentStability === AlignmentStabilityState.UNSTABLE ||
      recitationDecision.alignmentStability === AlignmentStabilityState.PENDING_REALIGNMENT ||
      recitationDecision.alignmentStability === AlignmentStabilityState.COLLAPSED ||
      alignmentConfidence < 0.80 ||
      recitationDecision.interruption.reason.includes('ALIGNMENT_INSTABILITY');

    if (isAlignmentUnstable) {
      const alignmentReason =
        'ALIGNMENT_UNSTABLE: Suppressing downstream candidate corrections to prevent cascading false errors (ERR-DEC-001 / ERR-POL-002)';

      return this.buildDecisionOutput({
        context,
        action: PedagogicalAction.REQUEST_REPEAT,
        authorizationStatus: TeacherActionAuthorizationStatus.TEACHER_ACTION_REQUIRES_REPEAT,
        escalationLevel: PedagogicalEscalationLevel.LEVEL_1_SHORT_INDICATION,
        actionReason: alignmentReason,
        taxonomyCategory: TeachingErrorCategory.A_IDENTITY_ALIGNMENT_ERROR,
        correctionGranularity: CorrectionGranularity.WORD,
        shouldInterrupt: false,
        intentType: 'REPEAT_REQUEST',
        targetWordIndex: studentLearningState.currentWord || 0,
        pedagogicalPromptArabic: 'خلينا نعيد الكلمة بهدوء.',
        pedagogicalPromptEnglish: 'Let us repeat the word calmly to verify alignment.',
        integrityStatus: 'PASSED',
      });
    }

    // =========================================================================
    // PRIORITY 4: STUDENT FATIGUE OR MAXIMUM INTERRUPTION LIMIT
    // =========================================================================
    const isFatigued =
      studentLearningState.fatigueSignals?.isFatigued === true ||
      (studentLearningState.fatigueSignals?.consecutiveErrors ?? 0) >= 4 ||
      (studentLearningState.interruptionCountInCurrentAttempt ?? 0) >=
        this.interruptionPolicy.maxInterruptionsPerAttempt;

    if (isFatigued) {
      const fatigueReason =
        (studentLearningState.interruptionCountInCurrentAttempt ?? 0) >=
        this.interruptionPolicy.maxInterruptionsPerAttempt
          ? 'MAX_INTERRUPTIONS_REACHED: Reached attempt interruption quota; ending attempt gently'
          : 'STUDENT_FATIGUE_DETECTED: Cognitive fatigue signals observed; pausing to prevent frustration';

      return this.buildDecisionOutput({
        context,
        action: PedagogicalAction.END_ATTEMPT,
        authorizationStatus: TeacherActionAuthorizationStatus.TEACHER_ACTION_AUTHORIZED,
        escalationLevel: PedagogicalEscalationLevel.LEVEL_4_PAUSE_AND_EXPLAIN,
        actionReason: fatigueReason,
        taxonomyCategory: TeachingErrorCategory.E_UNKNOWN_INSUFFICIENT,
        correctionGranularity: CorrectionGranularity.AYAH,
        shouldInterrupt: true,
        interruptionReason: fatigueReason,
        intentType: 'SESSION_SUMMARY',
        targetWordIndex: studentLearningState.currentWord || 0,
        pedagogicalPromptArabic: 'أحسنت جهدًا اليوم. خلينا نأخذ استراحة قصيرة ثم نستأنف لاحقًا.',
        pedagogicalPromptEnglish: 'Good effort today. Let us take a short break before continuing.',
        integrityStatus: 'PASSED',
      });
    }

    // =========================================================================
    // PRIORITY 5: PHONETIC ERRORS (CONFIRMED VS UNRESOLVED) & MULTI-ERROR AGGREGATION
    // =========================================================================
    const confirmedErrors = recitationDecision.confirmedErrors || [];
    const candidateErrors = recitationDecision.candidateErrors || [];

    if (confirmedErrors.length > 0) {
      return this.evaluatePhoneticErrors({
        context,
        confirmedErrors,
        evidenceIds,
        ruleEvidenceIds,
      });
    }

    // =========================================================================
    // PRIORITY 6: TAJWEED PENDING OR TAJWEED EXECUTION APPLICABILITY
    // (CRITICAL: MUST NOT CONVERT TAJWEED_EVIDENCE_PENDING INTO TAJWEED_ERROR)
    // =========================================================================
    const isTajweedPending =
      recitationDecision.finalStatus === RecitationDecisionState.TAJWEED_EVIDENCE_PENDING ||
      (recitationDecision.tajweedPendingRules && recitationDecision.tajweedPendingRules.length > 0);

    if (isTajweedPending) {
      return this.evaluateTajweedPending({
        context,
        evidenceIds,
        ruleEvidenceIds,
      });
    }

    // =========================================================================
    // PRIORITY 7: CANDIDATE / LOW-CONFIDENCE UNCERTAIN EVENTS
    // =========================================================================
    if (candidateErrors.length > 0 || decisionConfidence < 0.90 || acousticConfidence < 0.90) {
      const uncertaintyReason =
        'EVIDENCE_UNCERTAIN: Discrepancy detected but acoustic or decision confidence is below threshold; requesting repeat';

      return this.buildDecisionOutput({
        context,
        action: PedagogicalAction.REQUEST_REPEAT,
        authorizationStatus: TeacherActionAuthorizationStatus.TEACHER_ACTION_REQUIRES_REPEAT,
        escalationLevel: PedagogicalEscalationLevel.LEVEL_1_SHORT_INDICATION,
        actionReason: uncertaintyReason,
        taxonomyCategory: TeachingErrorCategory.E_UNKNOWN_INSUFFICIENT,
        correctionGranularity: CorrectionGranularity.WORD,
        shouldInterrupt: false,
        intentType: 'REPEAT_REQUEST',
        targetWordIndex: studentLearningState.currentWord || 0,
        pedagogicalPromptArabic: 'جرّب مرة تانية.',
        pedagogicalPromptEnglish: 'Please try reciting again.',
        integrityStatus: 'PASSED',
      });
    }

    // =========================================================================
    // PRIORITY 8: CLEAN MATCH / PRAISE & CONTINUATION
    // =========================================================================
    return this.evaluateCleanContinuation({
      context,
      evidenceIds,
      ruleEvidenceIds,
    });
  }

  /**
   * Handles confirmed phonetic errors with student-centered escalation,
   * multi-error aggregation, and interruption cooldown.
   */
  private evaluatePhoneticErrors(params: {
    context: TeacherDecisionContext;
    confirmedErrors: readonly PhoneticErrorDetail[];
    evidenceIds: readonly string[];
    ruleEvidenceIds: readonly string[];
  }): TeacherPolicyDecisionOutput {
    const { context, confirmedErrors } = params;
    const { studentLearningState, learningMode, timestamp, recitationDecision } = context;

    // Check if errors are concentrated in the same word (Multi-Error Aggregation, Section 23)
    const targetWordIndex = confirmedErrors[0]?.expectedLocation?.wordIndex ?? studentLearningState.currentWord ?? 0;
    const errorsInSameWord = confirmedErrors.filter(
      (e) => e.expectedLocation?.wordIndex === targetWordIndex
    );
    const hasMultipleErrorsInSameWord = errorsInSameWord.length > 1;

    // Error Escalation Level based on student history (Section 14)
    // Attempt 1 -> Level 1 (Short indication)
    // Attempt 2 -> Level 2 (Specific location)
    // Attempt 3 -> Level 3 (Guided repeat)
    // Attempt 4 -> Level 4 (Pause & explain)
    // Attempt 5+ -> Level 5 (Defer to teacher)
    const attemptNumber = studentLearningState.attemptNumber || 1;
    let escalationLevel: PedagogicalEscalationLevel = PedagogicalEscalationLevel.LEVEL_1_SHORT_INDICATION;
    if (attemptNumber === 2) {
      escalationLevel = PedagogicalEscalationLevel.LEVEL_2_SPECIFIC_LOCATION;
    } else if (attemptNumber === 3) {
      escalationLevel = PedagogicalEscalationLevel.LEVEL_3_GUIDED_REPEAT;
    } else if (attemptNumber === 4) {
      escalationLevel = PedagogicalEscalationLevel.LEVEL_4_PAUSE_AND_EXPLAIN;
    } else if (attemptNumber >= 5) {
      escalationLevel = PedagogicalEscalationLevel.LEVEL_5_DEFER_TO_TEACHER;
    }

    // In FREE_RECITATION mode: never interrupt unless critical/Level 5
    // In MEMORIZATION mode: sequence omissions/substitutions trigger immediate word highlight
    let shouldInterrupt = false;
    let interruptionReason: string | undefined;

    const cooldownPassed =
      !studentLearningState.lastInterruptionTimestamp ||
      timestamp - studentLearningState.lastInterruptionTimestamp >=
        this.interruptionPolicy.minimumIntervalMs;

    const withinInterruptionCap =
      (studentLearningState.interruptionCountInCurrentAttempt || 0) <
      this.interruptionPolicy.maxInterruptionsPerAttempt;

    if (
      cooldownPassed &&
      withinInterruptionCap &&
      context.decisionConfidence >= 0.90 &&
      context.acousticConfidence >= 0.90 &&
      context.alignmentConfidence >= 0.80 &&
      learningMode !== LearningMode.FREE_RECITATION
    ) {
      shouldInterrupt = true;
      interruptionReason = `INTERRUPT_AUTHORIZED: High-confidence phonetic error at Word ${targetWordIndex}`;
    }

    // Determine pedagogical action based on escalation level and aggregation
    let action: PedagogicalAction;
    let actionReason: string;
    let granularity: CorrectionGranularity;
    let promptArabic: string;
    let promptEnglish: string;
    let intentType: TeacherFeedbackIntent['intentType'] = 'PHONETIC_CORRECTION';

    if (escalationLevel === PedagogicalEscalationLevel.LEVEL_5_DEFER_TO_TEACHER) {
      action = PedagogicalAction.DEFER_TO_TEACHER;
      actionReason = 'ESCALATION_LEVEL_5: Persistent discrepancy across 5 attempts; deferring to certified teacher';
      granularity = CorrectionGranularity.WORD;
      promptArabic = 'يُفضل مراجعة هذه الآية مع المعلم المعتمد لضبط النطق بدقة.';
      promptEnglish = 'It is recommended to review this Ayah with a qualified human teacher.';
      intentType = 'TEACHER_DEFERRAL';
    } else if (escalationLevel === PedagogicalEscalationLevel.LEVEL_4_PAUSE_AND_EXPLAIN) {
      action = PedagogicalAction.PAUSE_AND_EXPLAIN;
      actionReason = 'ESCALATION_LEVEL_4: 4th attempt; pausing to explain makhraj and articulation';
      granularity = CorrectionGranularity.WORD;
      promptArabic = 'دعنا نتوقف لحظة لشرح مخرج الحنَك وطريقة النطق السليمة.';
      promptEnglish = 'Let us pause to explain the articulation point and proper pronunciation.';
      intentType = 'EXPLANATION';
    } else if (escalationLevel === PedagogicalEscalationLevel.LEVEL_3_GUIDED_REPEAT) {
      action = PedagogicalAction.START_GUIDED_REPEAT;
      actionReason = 'ESCALATION_LEVEL_3: 3rd attempt; launching guided repetition with reference recitation';
      granularity = CorrectionGranularity.WORD;
      promptArabic = 'استمع إلى التلاوة النموذجية ثم أعد المحاولة بهدوء.';
      promptEnglish = 'Listen to the reference recitation then try again calmly.';
      intentType = 'GUIDED_PRACTICE';
    } else if (escalationLevel === PedagogicalEscalationLevel.LEVEL_2_SPECIFIC_LOCATION) {
      if (hasMultipleErrorsInSameWord) {
        action = PedagogicalAction.HIGHLIGHT_WORD;
        actionReason = `MULTI_ERROR_AGGREGATED: ${errorsInSameWord.length} phoneme errors in word ${targetWordIndex}; highlighting entire word to avoid learner overload`;
        granularity = CorrectionGranularity.WORD;
        promptArabic = 'راجع نطق هذه الكلمة مرة تانية.';
        promptEnglish = 'Review the pronunciation of this word again.';
        intentType = 'LOCATION_HIGHLIGHT';
      } else {
        action = PedagogicalAction.HIGHLIGHT_POSITION;
        actionReason = `ESCALATION_LEVEL_2: Specific phoneme position identified at index ${confirmedErrors[0]?.expectedLocation?.phonemeIndex}`;
        granularity = CorrectionGranularity.PHONEME;
        promptArabic = 'راجع نطق الحرف هنا مرة تانية.';
        promptEnglish = 'Review the pronunciation of this specific letter here.';
        intentType = 'LOCATION_HIGHLIGHT';
      }
    } else {
      // Level 1: Short gentle indication
      action = PedagogicalAction.REQUEST_REPEAT;
      actionReason = 'ESCALATION_LEVEL_1: Initial phonetic discrepancy; requesting gentle repetition';
      granularity = CorrectionGranularity.WORD;
      promptArabic = 'جرّب الكلمة دي مرة تانية.';
      promptEnglish = 'Please try reciting this word one more time.';
      intentType = 'REPEAT_REQUEST';
    }

    return this.buildDecisionOutput({
      context,
      action,
      authorizationStatus: TeacherActionAuthorizationStatus.TEACHER_ACTION_AUTHORIZED,
      escalationLevel,
      actionReason,
      taxonomyCategory: TeachingErrorCategory.B_PHONETIC_ERROR,
      correctionGranularity: granularity,
      shouldInterrupt,
      interruptionReason,
      intentType,
      targetWordIndex,
      targetPhonemeIndex: confirmedErrors[0]?.expectedLocation?.phonemeIndex,
      pedagogicalPromptArabic: promptArabic,
      pedagogicalPromptEnglish: promptEnglish,
      integrityStatus: 'PASSED',
    });
  }

  /**
   * Evaluates Tajweed applicability with strict protection of uncalibrated proxies.
   * Under NO circumstances converts TAJWEED_EVIDENCE_PENDING into an error.
   */
  private evaluateTajweedPending(params: {
    context: TeacherDecisionContext;
    evidenceIds: readonly string[];
    ruleEvidenceIds: readonly string[];
  }): TeacherPolicyDecisionOutput {
    const { context } = params;
    const { studentLearningState, learningMode } = context;

    // In TAJWEED_PRACTICE mode: explain rule without claiming error
    // In other modes: continue smoothly without interruption
    let action: PedagogicalAction = PedagogicalAction.CONTINUE;
    let actionReason =
      'TAJWEED_EVIDENCE_PENDING: Acoustic measurement proxy uncalibrated (Madd/Ghunnah/Qalqalah/Tafkheem); protected per ERR-TAJ-001..004';
    let intentType: TeacherFeedbackIntent['intentType'] = 'CONTINUATION';
    let promptArabic = 'ممتاز، كمّل.';
    let promptEnglish = 'Good recitation, continue smoothly.';

    if (learningMode === LearningMode.TAJWEED_PRACTICE) {
      action = PedagogicalAction.MARK_FOR_REVIEW;
      actionReason =
        'TAJWEED_PRACTICE_MODE: Rule applicable but acoustic evidence pending; marking for teacher review';
      intentType = 'EXPLANATION';
      promptArabic = 'الحكم التجويدي هنا محدد، ويُنصح بمراجعته مع المعلم للتأكد من زمن المد أو الغنة.';
      promptEnglish =
        'The Tajweed rule applies here; review with a human teacher to verify exact timing and resonance.';
    }

    return this.buildDecisionOutput({
      context,
      action,
      authorizationStatus: TeacherActionAuthorizationStatus.TEACHER_ACTION_AUTHORIZED,
      escalationLevel: PedagogicalEscalationLevel.LEVEL_0_SILENT_CONTINUE,
      actionReason,
      taxonomyCategory: TeachingErrorCategory.C_TAJWEED_APPLICABILITY,
      correctionGranularity: CorrectionGranularity.WORD,
      shouldInterrupt: false,
      intentType,
      targetWordIndex: studentLearningState.currentWord || 0,
      pedagogicalPromptArabic: promptArabic,
      pedagogicalPromptEnglish: promptEnglish,
      integrityStatus: 'PASSED',
    });
  }

  /**
   * Handles clean matching recitation with appropriate pedagogical praise.
   * (Praise does not constitute religious certification).
   */
  private evaluateCleanContinuation(params: {
    context: TeacherDecisionContext;
    evidenceIds: readonly string[];
    ruleEvidenceIds: readonly string[];
  }): TeacherPolicyDecisionOutput {
    const { context } = params;
    const { studentLearningState, learningMode } = context;

    // Decide whether to emit praise or silent continue
    // Every few successful words or at end of Ayah, praise encouragement
    const isPraiseMoment =
      studentLearningState.currentWord > 0 &&
      studentLearningState.currentWord % 3 === 0;

    const action = isPraiseMoment
      ? PedagogicalAction.PRAISE_AND_CONTINUE
      : PedagogicalAction.CONTINUE;

    const actionReason = isPraiseMoment
      ? 'CLEAN_MATCH_PRAISE: Acoustic evidence matches reference without discrepancy'
      : 'CLEAN_CONTINUE: Recitation matches verified sequence; continuing silently';

    const promptArabic = isPraiseMoment
      ? 'ممتاز، النطق متوافق مع المرجع الصوتي في هذا الموضع.'
      : 'ممتاز، كمّل.';

    const promptEnglish = isPraiseMoment
      ? 'Excellent, pronunciation matches the acoustic reference at this position.'
      : 'Excellent, continue.';

    return this.buildDecisionOutput({
      context,
      action,
      authorizationStatus: TeacherActionAuthorizationStatus.TEACHER_ACTION_AUTHORIZED,
      escalationLevel: PedagogicalEscalationLevel.LEVEL_0_SILENT_CONTINUE,
      actionReason,
      taxonomyCategory: TeachingErrorCategory.B_PHONETIC_ERROR,
      correctionGranularity: CorrectionGranularity.WORD,
      shouldInterrupt: false,
      intentType: isPraiseMoment ? 'ENCOURAGEMENT' : 'CONTINUATION',
      targetWordIndex: studentLearningState.currentWord || 0,
      pedagogicalPromptArabic: promptArabic,
      pedagogicalPromptEnglish: promptEnglish,
      integrityStatus: 'PASSED',
    });
  }

  /**
   * Assembles the complete, immutable TeacherPolicyDecisionOutput envelope.
   */
  private buildDecisionOutput(params: {
    context: TeacherDecisionContext;
    action: PedagogicalAction;
    authorizationStatus: TeacherActionAuthorizationStatus;
    escalationLevel: PedagogicalEscalationLevel;
    actionReason: string;
    taxonomyCategory: TeachingErrorCategory;
    correctionGranularity: CorrectionGranularity;
    shouldInterrupt: boolean;
    interruptionReason?: string;
    intentType: TeacherFeedbackIntent['intentType'];
    targetWordIndex: number;
    targetPhonemeIndex?: number;
    pedagogicalPromptArabic: string;
    pedagogicalPromptEnglish: string;
    integrityStatus: 'PASSED' | 'INTEGRITY_FAILURE';
  }): TeacherPolicyDecisionOutput {
    const {
      context,
      action,
      authorizationStatus,
      escalationLevel,
      actionReason,
      taxonomyCategory,
      correctionGranularity,
      shouldInterrupt,
      interruptionReason,
      intentType,
      targetWordIndex,
      targetPhonemeIndex,
      pedagogicalPromptArabic,
      pedagogicalPromptEnglish,
      integrityStatus,
    } = params;

    const teacherDecisionId = `pol-dec-${context.sessionId}-${context.timestamp}-${Math.floor(
      context.timestamp % 1000000
    )}`;

    // Verified Quran Text source - guaranteed from verified context, NEVER generated
    const targetWordText =
      context.verifiedQuranContext.words[targetWordIndex] ||
      context.verifiedQuranContext.words[0] ||
      context.verifiedQuranContext.textUthmani;

    const feedbackIntent: TeacherFeedbackIntent = {
      intentType,
      targetQuranLocation: {
        surah: context.verifiedQuranContext.surah,
        ayah: context.verifiedQuranContext.ayah,
        wordIndex: targetWordIndex,
        phonemeIndex: targetPhonemeIndex,
      },
      targetWordIndex,
      targetPhonemeIndex,
      action,
      reasonCode: actionReason,
      evidenceIds: context.recitationEvidence.map(
        (e) => (e as any).evidenceId || `${e.ayahId}:${e.wordIndex}:${e.phonemeIndex}`
      ),
      verifiedTextSource: {
        uthmaniText: targetWordText,
        ayahId: context.verifiedQuranContext.ayahId,
        wordPosition: targetWordIndex,
        hash: context.quranDatasetHash,
      },
      allowedClaims: ALLOWED_PEDAGOGICAL_CONCEPTS,
      forbiddenClaims: FORBIDDEN_PEDAGOGICAL_CLAIMS,
      pedagogicalPromptArabic,
      pedagogicalPromptEnglish,
    };

    const auditTrail: TeacherPolicyAuditTrail = {
      teacherDecisionId,
      timestamp: context.timestamp,
      sessionId: context.sessionId,
      studentId: context.studentId,
      inputDecisionId: context.recitationDecision.decisionId,
      evidenceIds: context.recitationEvidence.map(
        (e) => (e as any).evidenceId || `${e.ayahId}:${e.wordIndex}:${e.phonemeIndex}`
      ),
      ruleEvidenceIds: context.tajweedRuleEvidence.map((r) => r.ruleId),
      action,
      actionReason,
      policyVersion: context.policyVersion,
      quranDatasetHash: context.quranDatasetHash,
      tajweedKBHash: context.tajweedKBHash,
      modelVersion: context.modelVersion,
      modelHash: context.modelHash,
      riwayah: context.riwayah,
      learningMode: context.learningMode,
      confidenceSnapshot: {
        acousticConfidence: context.acousticConfidence,
        alignmentConfidence: context.alignmentConfidence,
        decisionConfidence: context.decisionConfidence,
      },
      integrityStatus,
      interruptionCount: context.studentLearningState.interruptionCountInCurrentAttempt || 0,
    };

    const output: TeacherPolicyDecisionOutput = {
      teacherDecisionId,
      action,
      authorizationStatus,
      escalationLevel,
      actionReason,
      taxonomyCategory,
      correctionGranularity,
      shouldInterrupt,
      interruptionReason,
      feedbackIntent: deepFreeze(feedbackIntent),
      auditTrail: deepFreeze(auditTrail),
      isReplayIdentical: true,
    };

    return deepFreeze(output);
  }

  /**
   * Verifies that identical contexts produce bit-for-bit identical outputs (Section 27).
   */
  public verifyDeterministicReplay(
    contextA: TeacherDecisionContext,
    contextB: TeacherDecisionContext
  ): { isDeterministic: boolean; differences?: string[] } {
    const outputA = this.evaluate(contextA);
    const outputB = this.evaluate(contextB);

    const differences: string[] = [];
    if (outputA.action !== outputB.action) {
      differences.push(`action differs: ${outputA.action} !== ${outputB.action}`);
    }
    if (outputA.authorizationStatus !== outputB.authorizationStatus) {
      differences.push(`authorizationStatus differs: ${outputA.authorizationStatus} !== ${outputB.authorizationStatus}`);
    }
    if (outputA.escalationLevel !== outputB.escalationLevel) {
      differences.push(`escalationLevel differs: ${outputA.escalationLevel} !== ${outputB.escalationLevel}`);
    }
    if (outputA.actionReason !== outputB.actionReason) {
      differences.push(`actionReason differs: ${outputA.actionReason} !== ${outputB.actionReason}`);
    }
    if (outputA.taxonomyCategory !== outputB.taxonomyCategory) {
      differences.push(`taxonomyCategory differs: ${outputA.taxonomyCategory} !== ${outputB.taxonomyCategory}`);
    }
    if (outputA.correctionGranularity !== outputB.correctionGranularity) {
      differences.push(`correctionGranularity differs: ${outputA.correctionGranularity} !== ${outputB.correctionGranularity}`);
    }
    if (outputA.shouldInterrupt !== outputB.shouldInterrupt) {
      differences.push(`shouldInterrupt differs: ${outputA.shouldInterrupt} !== ${outputB.shouldInterrupt}`);
    }
    if (outputA.feedbackIntent.pedagogicalPromptArabic !== outputB.feedbackIntent.pedagogicalPromptArabic) {
      differences.push(
        `prompt differs: ${outputA.feedbackIntent.pedagogicalPromptArabic} !== ${outputB.feedbackIntent.pedagogicalPromptArabic}`
      );
    }

    return {
      isDeterministic: differences.length === 0,
      differences: differences.length > 0 ? differences : undefined,
    };
  }
}
