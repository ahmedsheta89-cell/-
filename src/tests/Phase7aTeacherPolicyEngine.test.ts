/**
 * @file Phase7aTeacherPolicyEngine.test.ts
 * @description Comprehensive Phase 7A Teacher Policy & Pedagogical Decision Engine Test Suite.
 * 
 * COVERS ALL 50+ SCENARIOS:
 * - Core (1-9): MATCH, continuation, praise, substitution, deletion, insertion, repetition, omission, order.
 * - Safety (10-21): low confidence, low SNR, silence, white noise, clipping, dropout, ambiguous alignment, integrity mismatches.
 * - Acoustic limitations (22-26): Madd pending, Ghunnah pending, Makhraj pending, Qalqalah pending, Tafkheem pending.
 * - Alignment & Cascading (27-31): cascading alignment failure, unstable boundary, chunk boundary, cache reset, resynchronization.
 * - Pedagogy (32-41): first error (L1), repeated error (L2), guided repeat (L3), explain (L4), defer (L5), multi-error aggregation, memorization, revision, tajweed practice, free recitation.
 * - Feedback safety (42-48): verified Quran provenance, LLM boundary action protection, forbidden religious claims rejection, Quran text tampering rejection, allowed claims.
 * - Determinism & Adversarial (49-57): deterministic replay, audit trail completeness, immutability, confidence inflation rejection, cooldown debouncing, fatigue handling, interruption quota.
 */

import { TeacherPolicyEngine } from '../domain/teacher_policy/TeacherPolicyEngine.ts';
import {
  PedagogicalAction,
  TeacherActionAuthorizationStatus,
  LearningMode,
  PedagogicalEscalationLevel,
  TeachingErrorCategory,
  CorrectionGranularity,
  TeacherDecisionContext,
  PROVISIONAL_TEACHER_INTERRUPTION_POLICY,
} from '../domain/teacher_policy/types.ts';
import {
  LLMBoundaryValidator,
  FORBIDDEN_PEDAGOGICAL_CLAIMS,
  ALLOWED_PEDAGOGICAL_CONCEPTS,
} from '../domain/teacher_policy/LLMBoundaryContract.ts';
import {
  RecitationDecisionState,
  EscalationLevel,
  AlignmentStabilityState,
  PhoneticDecisionErrorType,
  RecitationDecisionOutput,
  PhoneticErrorDetail,
} from '../domain/recitation/decisionTypes.ts';
import { RecitationEvidence } from '../domain/recitation/RecitationEvidence.ts';
import { TajweedRuleEvidence } from '../domain/tajweed/types.ts';
import { CANONICAL_QURAN_HASH, OFFICIAL_MODEL_HASH } from '../domain/recitation/RecitationErrorDecisionEngine.ts';
import { TAJWEED_KB_CHECKSUM_SHA256 } from '../domain/tajweed/VerifiedTajweedKnowledgeBase.ts';

export async function runPhase7aTeacherPolicyEngineTests(): Promise<void> {
  console.log('\n================================================================');
  console.log('  PHASE 7A: TEACHER POLICY & PEDAGOGICAL DECISION ENGINE TESTS  ');
  console.log('================================================================\n');

  const engine = TeacherPolicyEngine.getInstance();
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [Phase 7A Test ${totalTests}] ${testName}`);
    } else {
      console.error(`  ❌ [Phase 7A Test ${totalTests}] ${testName}: ${detail || 'Assertion failed'}`);
      throw new Error(`[Phase 7A Test Failure] ${testName}: ${detail || 'Assertion failed'}`);
    }
  }

  // Helper factory for base valid context
  function createValidContext(overrides: Partial<TeacherDecisionContext> = {}): TeacherDecisionContext {
    const mockEvidence: RecitationEvidence[] = [
      {
        ayahId: '1:1',
        wordIndex: 1,
        phonemeIndex: 0,
        expectedToken: 'b',
        observedToken: 'b',
        errorType: 'MATCH',
        acousticConfidence: 0.98,
        alignmentConfidence: 0.95,
        startTime: 0.1,
        endTime: 0.2,
        evidenceStatus: 'HIGH',
        marginPeak: 0.92,
      },
    ];

    const mockDecisionOutput: RecitationDecisionOutput = {
      decisionId: 'dec-base-001',
      finalStatus: RecitationDecisionState.MATCH,
      escalationLevel: EscalationLevel.LEVEL_0_MATCH,
      confirmedErrors: [],
      candidateErrors: [],
      tajweedPendingRules: [],
      alignmentStability: AlignmentStabilityState.STABLE,
      interruption: {
        shouldInterrupt: false,
        reason: 'MATCH',
        severity: 'NONE',
        confidence: 0.98,
        recommendedAction: 'PROCEED',
      },
      learnerFeedback: {
        feedbackId: 'fb-001',
        decisionState: RecitationDecisionState.MATCH,
        messageArabic: 'ممتاز، كمّل.',
        messageEnglish: 'Excellent, continue.',
        pedagogicalActionArabic: 'استمر في التلاوة',
        isTajweedPending: false,
        repeatRequested: false,
      },
      auditTrail: {
        decisionId: 'dec-base-001',
        evidenceIds: ['ev-001'],
        ruleEvidenceIds: [],
        modelVersion: '1.0.0',
        modelHash: OFFICIAL_MODEL_HASH,
        quranHash: CANONICAL_QURAN_HASH,
        tajweedHash: TAJWEED_KB_CHECKSUM_SHA256,
        riwayah: 'HAFS_AN_ASIM',
        thresholdVersion: 'provisional-v1.0.0-phase5c',
        decisionTimestamp: '2026-09-20T00:00:00.000Z',
        decisionReason: 'CLEAN_MATCH',
        finalStatus: RecitationDecisionState.MATCH,
        integrityStatus: 'PASSED',
      },
      canContinue: true,
      shouldRepeat: false,
    };

    const defaultContext: TeacherDecisionContext = {
      sessionId: 'sess-7a-001',
      studentId: 'stud-101',
      timestamp: 1774000000000,
      riwayah: 'HAFS_AN_ASIM',
      quranDatasetHash: CANONICAL_QURAN_HASH,
      tajweedKBHash: TAJWEED_KB_CHECKSUM_SHA256,
      modelVersion: '1.0.0',
      modelHash: OFFICIAL_MODEL_HASH,
      phonemeVocabularyHash: 'canon-phonemes-sha256-hash',
      alignmentVersion: '1.0.0',
      decisionVersion: 'provisional-v1.0.0-phase5c',
      policyVersion: 'provisional-v1.0.0-phase7a',
      learningMode: LearningMode.MEMORIZATION,
      verifiedQuranContext: {
        surah: 1,
        ayah: 1,
        ayahId: '1:1',
        textUthmani: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        words: ['بِسْمِ', 'اللَّهِ', 'الرَّحْمَٰنِ', 'الرَّحِيمِ'],
        datasetHash: CANONICAL_QURAN_HASH,
      },
      recitationEvidence: mockEvidence,
      tajweedRuleEvidence: [],
      recitationDecision: mockDecisionOutput,
      signalQuality: {
        snrDb: 24.5,
        isClipping: false,
        isSilence: false,
        isWhiteNoise: false,
        hasDropouts: false,
        isDegraded: false,
      },
      acousticConfidence: 0.98,
      alignmentConfidence: 0.95,
      decisionConfidence: 0.98,
      studentLearningState: {
        currentSurah: 1,
        currentAyah: 1,
        currentWord: 1,
        attemptNumber: 1,
        memorizationStatus: 'IN_PROGRESS',
        revisionStatus: 'STABLE',
        attemptCount: 1,
        recentAttempts: [{ timestamp: 1774000000000, success: true, wordIndex: 1 }],
        recentErrors: [],
        recentUncertainEvents: 0,
        confirmedPhoneticErrors: 0,
        reviewCandidates: [],
        interruptionCountInCurrentAttempt: 0,
        fatigueSignals: {
          consecutiveErrors: 0,
          longPausesCount: 0,
          sessionDurationMinutes: 10,
          isFatigued: false,
        },
        preferredCorrectionGranularity: CorrectionGranularity.WORD,
      },
    };

    return { ...defaultContext, ...overrides };
  }

  // -------------------------------------------------------------
  // SECTION 1: CORE RECITATION SCENARIOS (1 - 9)
  // -------------------------------------------------------------

  // Test 1: Exact Clean Match
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.CONTINUE &&
        out.authorizationStatus === TeacherActionAuthorizationStatus.TEACHER_ACTION_AUTHORIZED &&
        out.escalationLevel === PedagogicalEscalationLevel.LEVEL_0_SILENT_CONTINUE &&
        !out.shouldInterrupt,
      'Exact MATCH produces CONTINUE with LEVEL_0_SILENT_CONTINUE'
    );
  }

  // Test 2: Clean Continuation across middle word
  {
    const ctx = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        currentWord: 2,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.CONTINUE && out.feedbackIntent.intentType === 'CONTINUATION',
      'Clean continuation silently proceeds without interruption'
    );
  }

  // Test 3: Praise and Continue on milestone word
  {
    const ctx = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        currentWord: 3, // Multiple of 3 milestone
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.PRAISE_AND_CONTINUE &&
        out.feedbackIntent.intentType === 'ENCOURAGEMENT' &&
        out.feedbackIntent.pedagogicalPromptArabic.includes('ممتاز') &&
        !out.feedbackIntent.pedagogicalPromptArabic.includes('100%'),
      'Praise and continue provides encouraging feedback without theological certification'
    );
  }

  // Test 4: High-confidence substitution error
  {
    const confirmedError: PhoneticErrorDetail = {
      errorType: PhoneticDecisionErrorType.SUBSTITUTION,
      expectedToken: 'sˤ',
      observedToken: 's',
      expectedLocation: { ayahId: '1:1', wordIndex: 1, phonemeIndex: 2 },
      observedLocation: { startTime: 0.2, endTime: 0.3 },
      startTime: 0.2,
      endTime: 0.3,
      confidence: 0.96,
      alignmentConfidence: 0.92,
      evidenceStatus: 'HIGH',
    };

    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        finalStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
        confirmedErrors: [confirmedError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.escalationLevel === PedagogicalEscalationLevel.LEVEL_1_SHORT_INDICATION &&
        out.taxonomyCategory === TeachingErrorCategory.B_PHONETIC_ERROR &&
        out.shouldInterrupt === true,
      'High-confidence substitution triggers Level 1 repeat with gentle interruption'
    );
  }

  // Test 5: High-confidence deletion error
  {
    const deletionError: PhoneticErrorDetail = {
      errorType: PhoneticDecisionErrorType.DELETION,
      expectedToken: 'm',
      observedToken: '',
      expectedLocation: { ayahId: '1:1', wordIndex: 1, phonemeIndex: 3 },
      observedLocation: { startTime: 0.3, endTime: 0.4 },
      startTime: 0.3,
      endTime: 0.4,
      confidence: 0.95,
      alignmentConfidence: 0.90,
      evidenceStatus: 'HIGH',
    };
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        finalStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
        confirmedErrors: [deletionError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT && out.shouldInterrupt,
      'High-confidence deletion error correctly triggers repeat action'
    );
  }

  // Test 6: High-confidence insertion error
  {
    const insertionError: PhoneticErrorDetail = {
      errorType: PhoneticDecisionErrorType.INSERTION,
      expectedToken: '',
      observedToken: 'a',
      expectedLocation: { ayahId: '1:1', wordIndex: 1, phonemeIndex: 1 },
      observedLocation: { startTime: 0.2, endTime: 0.25 },
      startTime: 0.2,
      endTime: 0.25,
      confidence: 0.94,
      alignmentConfidence: 0.88,
      evidenceStatus: 'HIGH',
    };
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        finalStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
        confirmedErrors: [insertionError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.taxonomyCategory === TeachingErrorCategory.B_PHONETIC_ERROR,
      'High-confidence insertion error correctly classified under B_PHONETIC_ERROR'
    );
  }

  // Test 7: Repetition error
  {
    const repError: PhoneticErrorDetail = {
      errorType: PhoneticDecisionErrorType.REPETITION,
      expectedToken: 'b',
      observedToken: 'b',
      expectedLocation: { ayahId: '1:1', wordIndex: 1, phonemeIndex: 0 },
      observedLocation: { startTime: 0.1, endTime: 0.3 },
      startTime: 0.1,
      endTime: 0.3,
      confidence: 0.93,
      alignmentConfidence: 0.89,
      evidenceStatus: 'HIGH',
    };
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [repError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.authorizationStatus === TeacherActionAuthorizationStatus.TEACHER_ACTION_AUTHORIZED,
      'Phonetic repetition error handled safely'
    );
  }

  // Test 8: Word omission in MEMORIZATION mode
  {
    const wordOmissionError: PhoneticErrorDetail = {
      errorType: PhoneticDecisionErrorType.WORD_OMISSION,
      expectedToken: 'الرَّحْمَٰنِ',
      observedToken: '',
      expectedLocation: { ayahId: '1:1', wordIndex: 2, phonemeIndex: 0 },
      observedLocation: { startTime: 0.4, endTime: 0.5 },
      startTime: 0.4,
      endTime: 0.5,
      confidence: 0.95,
      alignmentConfidence: 0.91,
      evidenceStatus: 'HIGH',
    };
    const ctx = createValidContext({
      learningMode: LearningMode.MEMORIZATION,
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [wordOmissionError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT && out.shouldInterrupt,
      'Word omission in MEMORIZATION mode halts with immediate repetition request'
    );
  }

  // Test 9: Order error
  {
    const orderError: PhoneticErrorDetail = {
      errorType: PhoneticDecisionErrorType.ORDER_ERROR,
      expectedToken: 'الرَّحِيمِ',
      observedToken: 'الرَّحْمَٰنِ',
      expectedLocation: { ayahId: '1:1', wordIndex: 3, phonemeIndex: 0 },
      observedLocation: { startTime: 0.5, endTime: 0.7 },
      startTime: 0.5,
      endTime: 0.7,
      confidence: 0.92,
      alignmentConfidence: 0.88,
      evidenceStatus: 'HIGH',
    };
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [orderError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.taxonomyCategory === TeachingErrorCategory.B_PHONETIC_ERROR,
      'Word order error classified safely under phonetic discrepancy'
    );
  }

  // -------------------------------------------------------------
  // SECTION 2: SAFETY & SIGNAL GATES (10 - 21)
  // -------------------------------------------------------------

  // Test 10: Low confidence
  {
    const ctx = createValidContext({
      decisionConfidence: 0.65,
      acousticConfidence: 0.68,
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.authorizationStatus === TeacherActionAuthorizationStatus.TEACHER_ACTION_REQUIRES_REPEAT &&
        !out.shouldInterrupt,
      'Low confidence (< 0.90) requires repeat without interrupt or false accusation'
    );
  }

  // Test 11: Low SNR (< 10 dB)
  {
    const ctx = createValidContext({
      signalQuality: {
        snrDb: 6.2,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_CLEARER_AUDIO &&
        out.authorizationStatus === TeacherActionAuthorizationStatus.TEACHER_ACTION_REQUIRES_CLEAR_AUDIO,
      'Low SNR (6.2 dB < 10 dB) requires clearer audio request'
    );
  }

  // Test 12: Digital Silence
  {
    const ctx = createValidContext({
      signalQuality: {
        snrDb: 0.0,
        isSilence: true,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_CLEARER_AUDIO &&
        out.actionReason.includes('Silence detected'),
      'Digital silence triggers REQUEST_CLEARER_AUDIO'
    );
  }

  // Test 13: White Noise
  {
    const ctx = createValidContext({
      signalQuality: {
        snrDb: 3.0,
        isWhiteNoise: true,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_CLEARER_AUDIO &&
        out.actionReason.includes('White noise floor'),
      'White noise floor triggers REQUEST_CLEARER_AUDIO'
    );
  }

  // Test 14: Digital Clipping
  {
    const ctx = createValidContext({
      signalQuality: {
        snrDb: 25.0,
        isClipping: true,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_CLEARER_AUDIO &&
        out.actionReason.includes('Severe digital clipping'),
      'Digital clipping triggers REQUEST_CLEARER_AUDIO'
    );
  }

  // Test 15: Audio Dropouts
  {
    const ctx = createValidContext({
      signalQuality: {
        snrDb: 20.0,
        hasDropouts: true,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_CLEARER_AUDIO &&
        out.actionReason.includes('Packet dropouts'),
      'Audio packet dropouts trigger REQUEST_CLEARER_AUDIO'
    );
  }

  // Test 16: Ambiguous alignment confidence (< 0.80)
  {
    const ctx = createValidContext({
      alignmentConfidence: 0.72,
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.authorizationStatus === TeacherActionAuthorizationStatus.TEACHER_ACTION_REQUIRES_REPEAT &&
        out.taxonomyCategory === TeachingErrorCategory.A_IDENTITY_ALIGNMENT_ERROR,
      'Ambiguous alignment confidence triggers REQUEST_REPEAT and marks identity category'
    );
  }

  // Test 17: Integrity Mismatch - Quran Hash Mismatch
  {
    const ctx = createValidContext({
      quranDatasetHash: 'tampered-quran-hash-12345',
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.DEFER_TO_TEACHER &&
        out.authorizationStatus === TeacherActionAuthorizationStatus.TEACHER_ACTION_REQUIRES_TEACHER &&
        out.auditTrail.integrityStatus === 'INTEGRITY_FAILURE' &&
        out.shouldInterrupt === true,
      'Quran hash mismatch halts immediately and defers to qualified teacher'
    );
  }

  // Test 18: Integrity Mismatch - Model Hash Mismatch
  {
    const ctx = createValidContext({
      modelHash: 'tampered-model-hash-67890',
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.DEFER_TO_TEACHER &&
        out.actionReason.includes('Model weight hash mismatch'),
      'Model weight hash mismatch halts system per integrity gate'
    );
  }

  // Test 19: Integrity Mismatch - Tajweed KB Hash Mismatch
  {
    const ctx = createValidContext({
      tajweedKBHash: 'tampered-tajweed-hash-abcde',
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.DEFER_TO_TEACHER &&
        out.actionReason.includes('Tajweed knowledge base hash mismatch'),
      'Tajweed KB hash mismatch defers to teacher'
    );
  }

  // Test 20: Integrity Mismatch - Riwayah Mismatch
  {
    const ctx = createValidContext({
      riwayah: 'WARSH_AN_NAFI', // System only certified for Hafs an Asim
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.DEFER_TO_TEACHER &&
        out.actionReason.includes('Riwayah mismatch'),
      'Non-Hafs Riwayah strictly halts evaluation per ERR-TAJ-005'
    );
  }

  // Test 21: Integrity failure prevents downstream LLM override
  {
    const ctx = createValidContext({
      quranDatasetHash: 'corrupted-hash',
    });
    const out = engine.evaluate(ctx);
    const validation = LLMBoundaryValidator.validate(
      {
        requestedAction: PedagogicalAction.CONTINUE, // Malicious override attempt
        proposedArabicText: 'كمّل تلاوتك عادي.',
        intentToken: 'token',
      },
      out.feedbackIntent
    );
    assert(
      validation.isValid === false &&
        validation.wasOverridden === true &&
        validation.sanitizedArabicText === out.feedbackIntent.pedagogicalPromptArabic,
      'LLM cannot override DEFER_TO_TEACHER caused by integrity failure'
    );
  }

  // -------------------------------------------------------------
  // SECTION 3: ACOUSTIC LIMITATIONS & TAJWEED PROTECTION (22 - 26)
  // -------------------------------------------------------------

  // Test 22: Madd Applicable (ERR-TAJ-001: Sub-frame calibration missing)
  {
    const tajweedRule: TajweedRuleEvidence = {
      ruleId: 'rule-madd-01',
      ruleName: 'MADD_MUTTASIL',
      ayahId: '1:1',
      wordIndex: 1,
      expectedDurationMora: 4,
      decisionStatus: 'INCONCLUSIVE' as any,
      ruleNameArabic: 'مد متصل',
      classicalSource: 'Tuhfat al-Atfal',
    } as any;
    const ctx = createValidContext({
      tajweedRuleEvidence: [tajweedRule],
      recitationDecision: {
        ...createValidContext().recitationDecision,
        finalStatus: RecitationDecisionState.TAJWEED_EVIDENCE_PENDING,
        tajweedPendingRules: [tajweedRule],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.CONTINUE &&
        out.actionReason.includes('TAJWEED_EVIDENCE_PENDING'),
      'Madd pending status never converted into false Tajweed error'
    );
  }

  // Test 23: Ghunnah Applicable (ERR-TAJ-002: Murmur proxy uncalibrated)
  {
    const tajweedRule: TajweedRuleEvidence = {
      ruleId: 'rule-ghunnah-01',
      ruleName: 'IDGHAM_WITH_GHUNNAH',
      ayahId: '1:1',
      wordIndex: 1,
      expectedDurationMora: 2,
      decisionStatus: 'INCONCLUSIVE' as any,
      ruleNameArabic: 'إدغام بغنة',
      classicalSource: 'Tuhfat al-Atfal',
    } as any;
    const ctx = createValidContext({
      tajweedRuleEvidence: [tajweedRule],
      recitationDecision: {
        ...createValidContext().recitationDecision,
        finalStatus: RecitationDecisionState.TAJWEED_EVIDENCE_PENDING,
        tajweedPendingRules: [tajweedRule],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action !== PedagogicalAction.CORRECT_PHONETICALLY && !out.shouldInterrupt,
      'Ghunnah pending status safely protects learner from false error'
    );
  }

  // Test 24: Makhraj / Articulation limitation (ERR-TAJ-003)
  {
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        finalStatus: RecitationDecisionState.TAJWEED_EVIDENCE_PENDING,
        tajweedPendingRules: [
          {
            ruleId: 'rule-makhraj-01',
            ruleName: 'MAKHRAJ_CHECK',
            ayahId: '1:1',
            wordIndex: 1,
            decisionStatus: 'INCONCLUSIVE' as any,
            ruleNameArabic: 'مخرج الحرف',
            classicalSource: 'Al-Jazariyyah',
          } as any,
        ],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.taxonomyCategory === TeachingErrorCategory.C_TAJWEED_APPLICABILITY,
      'Makhraj limitation categorized under C_TAJWEED_APPLICABILITY, not B_PHONETIC_ERROR'
    );
  }

  // Test 25: Qalqalah burst transient limitation (ERR-TAJ-004)
  {
    const qRule: TajweedRuleEvidence = {
      ruleId: 'rule-qalqalah-01',
      ruleName: 'QALQALAH_SUGHRA',
      ayahId: '1:1',
      wordIndex: 1,
      decisionStatus: 'INCONCLUSIVE' as any,
      ruleNameArabic: 'قلقلة صغرى',
      classicalSource: 'Al-Jazariyyah',
    } as any;
    const ctx = createValidContext({
      tajweedRuleEvidence: [qRule],
      recitationDecision: {
        ...createValidContext().recitationDecision,
        finalStatus: RecitationDecisionState.TAJWEED_EVIDENCE_PENDING,
        tajweedPendingRules: [qRule],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.CONTINUE && !out.shouldInterrupt,
      'Qalqalah transient limitation preserves learner continuity'
    );
  }

  // Test 26: Tafkheem / Formant limitation (ERR-TAJ-003 / ERR-ACOUSTIC-003)
  {
    const tRule: TajweedRuleEvidence = {
      ruleId: 'rule-tafkheem-01',
      ruleName: 'TAFKHEEM',
      ayahId: '1:1',
      wordIndex: 1,
      decisionStatus: 'INCONCLUSIVE' as any,
      ruleNameArabic: 'تفخيم الحرف المستعلي',
      classicalSource: 'Al-Jazariyyah',
    } as any;
    const ctx = createValidContext({
      tajweedRuleEvidence: [tRule],
      recitationDecision: {
        ...createValidContext().recitationDecision,
        finalStatus: RecitationDecisionState.TAJWEED_EVIDENCE_PENDING,
        tajweedPendingRules: [tRule],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      !out.actionReason.includes('CONFIRMED_ERROR') &&
        out.actionReason.includes('ERR-TAJ-001..004'),
      'Tafkheem limitation cited and protected per ERR-TAJ-003'
    );
  }

  // -------------------------------------------------------------
  // SECTION 4: ALIGNMENT & CASCADING ERROR SUPPRESSION (27 - 31)
  // -------------------------------------------------------------

  // Test 27: Cascading alignment failure
  {
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        alignmentStability: AlignmentStabilityState.UNSTABLE,
        interruption: {
          shouldInterrupt: false,
          reason: 'ALIGNMENT_INSTABILITY',
          severity: 'HIGH',
          confidence: 0.5,
          recommendedAction: 'REQUEST_REPEAT',
        },
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.actionReason.includes('prevent cascading false errors'),
      'Cascading alignment failure suppresses candidate corrections and requests repeat'
    );
  }

  // Test 28: Unstable boundary
  {
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        alignmentStability: AlignmentStabilityState.PENDING_REALIGNMENT,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.taxonomyCategory === TeachingErrorCategory.A_IDENTITY_ALIGNMENT_ERROR,
      'Unstable boundary state correctly isolated under alignment category'
    );
  }

  // Test 29: Chunk boundary discrepancy
  {
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        alignmentStability: AlignmentStabilityState.COLLAPSED,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.authorizationStatus === TeacherActionAuthorizationStatus.TEACHER_ACTION_REQUIRES_REPEAT,
      'Collapsed chunk boundary alignment halts cascading error generation'
    );
  }

  // Test 30: Cache reset / stream continuity
  {
    const ctx = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        attemptNumber: 1,
        interruptionCountInCurrentAttempt: 0,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.CONTINUE && out.auditTrail.interruptionCount === 0,
      'Clean cache reset initializes without residual interruption penalty'
    );
  }

  // Test 31: Anchor resynchronization recovers to STABLE
  {
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        alignmentStability: AlignmentStabilityState.STABLE,
      },
      alignmentConfidence: 0.94,
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.CONTINUE &&
        out.authorizationStatus === TeacherActionAuthorizationStatus.TEACHER_ACTION_AUTHORIZED,
      'Anchor resynchronization recovers clean continuation'
    );
  }

  // -------------------------------------------------------------
  // SECTION 5: STUDENT-CENTERED PEDAGOGY & ESCALATION (32 - 41)
  // -------------------------------------------------------------

  const testPhoneticError: PhoneticErrorDetail = {
    errorType: PhoneticDecisionErrorType.SUBSTITUTION,
    expectedToken: 'tˤ',
    observedToken: 't',
    expectedLocation: { ayahId: '1:1', wordIndex: 1, phonemeIndex: 2 },
    observedLocation: { startTime: 0.2, endTime: 0.3 },
    startTime: 0.2,
    endTime: 0.3,
    confidence: 0.95,
    alignmentConfidence: 0.91,
    evidenceStatus: 'HIGH',
  };

  // Test 32: First error -> Escalation Level 1
  {
    const ctx = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        attemptNumber: 1,
      },
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.escalationLevel === PedagogicalEscalationLevel.LEVEL_1_SHORT_INDICATION &&
        out.action === PedagogicalAction.REQUEST_REPEAT &&
        out.feedbackIntent.pedagogicalPromptArabic === 'جرّب الكلمة دي مرة تانية.',
      'Attempt 1 error escalates to Level 1 short indication'
    );
  }

  // Test 33: Repeated error -> Escalation Level 2 (Specific Location)
  {
    const ctx = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        attemptNumber: 2,
      },
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.escalationLevel === PedagogicalEscalationLevel.LEVEL_2_SPECIFIC_LOCATION &&
        out.action === PedagogicalAction.HIGHLIGHT_POSITION &&
        out.correctionGranularity === CorrectionGranularity.PHONEME &&
        out.feedbackIntent.pedagogicalPromptArabic === 'راجع نطق الحرف هنا مرة تانية.',
      'Attempt 2 error escalates to Level 2 specific phoneme position highlight'
    );
  }

  // Test 34: Third repeated error -> Escalation Level 3 (Guided Repeat)
  {
    const ctx = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        attemptNumber: 3,
      },
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.escalationLevel === PedagogicalEscalationLevel.LEVEL_3_GUIDED_REPEAT &&
        out.action === PedagogicalAction.START_GUIDED_REPEAT,
      'Attempt 3 error escalates to Level 3 guided repetition'
    );
  }

  // Test 35: Fourth repeated error -> Escalation Level 4 (Pause & Explain)
  {
    const ctx = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        attemptNumber: 4,
      },
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.escalationLevel === PedagogicalEscalationLevel.LEVEL_4_PAUSE_AND_EXPLAIN &&
        out.action === PedagogicalAction.PAUSE_AND_EXPLAIN,
      'Attempt 4 error escalates to Level 4 pause and explain'
    );
  }

  // Test 36: Fifth repeated error -> Escalation Level 5 (Defer to Teacher)
  {
    const ctx = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        attemptNumber: 5,
      },
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.escalationLevel === PedagogicalEscalationLevel.LEVEL_5_DEFER_TO_TEACHER &&
        out.action === PedagogicalAction.DEFER_TO_TEACHER,
      'Attempt 5 persistent discrepancy escalates to Level 5 human teacher deferral'
    );
  }

  // Test 37: Multiple errors in same word aggregated to HIGHLIGHT_WORD
  {
    const multiErrors: PhoneticErrorDetail[] = [
      { ...testPhoneticError, expectedLocation: { ayahId: '1:1', wordIndex: 1, phonemeIndex: 1 } },
      { ...testPhoneticError, expectedLocation: { ayahId: '1:1', wordIndex: 1, phonemeIndex: 2 } },
      { ...testPhoneticError, expectedLocation: { ayahId: '1:1', wordIndex: 1, phonemeIndex: 3 } },
    ];
    const ctx = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        attemptNumber: 2,
      },
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: multiErrors,
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.HIGHLIGHT_WORD &&
        out.correctionGranularity === CorrectionGranularity.WORD &&
        out.actionReason.includes('MULTI_ERROR_AGGREGATED'),
      'Multiple errors in same word aggregated into HIGHLIGHT_WORD to prevent cognitive overload'
    );
  }

  // Test 38: MEMORIZATION Mode (Sequence priority)
  {
    const ctx = createValidContext({
      learningMode: LearningMode.MEMORIZATION,
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.REQUEST_REPEAT && out.shouldInterrupt === true,
      'MEMORIZATION mode immediately halts on verified sequence substitution'
    );
  }

  // Test 39: REVISION Mode
  {
    const ctx = createValidContext({
      learningMode: LearningMode.REVISION,
      studentLearningState: {
        ...createValidContext().studentLearningState,
        reviewCandidates: ['1:1:1'],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.auditTrail.learningMode === LearningMode.REVISION,
      'REVISION mode preserves mode tag in audit trail'
    );
  }

  // Test 40: TAJWEED PRACTICE Mode (Marks for review rather than silent continue)
  {
    const rule: TajweedRuleEvidence = {
      ruleId: 'rule-madd-test',
      ruleName: 'MADD_MUTTASIL',
      ayahId: '1:1',
      wordIndex: 1,
      decisionStatus: 'INCONCLUSIVE' as any,
      ruleNameArabic: 'مد متصل',
      classicalSource: 'Tuhfat al-Atfal',
    } as any;
    const ctx = createValidContext({
      learningMode: LearningMode.TAJWEED_PRACTICE,
      recitationDecision: {
        ...createValidContext().recitationDecision,
        finalStatus: RecitationDecisionState.TAJWEED_EVIDENCE_PENDING,
        tajweedPendingRules: [rule],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.action === PedagogicalAction.MARK_FOR_REVIEW &&
        out.actionReason.includes('TAJWEED_PRACTICE_MODE'),
      'TAJWEED_PRACTICE mode converts uncalibrated rule into MARK_FOR_REVIEW'
    );
  }

  // Test 41: FREE RECITATION Mode (Minimizes interruption during flow)
  {
    const ctx = createValidContext({
      learningMode: LearningMode.FREE_RECITATION,
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctx);
    assert(
      out.shouldInterrupt === false,
      'FREE_RECITATION mode suppresses real-time interruption during recitation flow'
    );
  }

  // -------------------------------------------------------------
  // SECTION 6: FEEDBACK SAFETY & LLM BOUNDARY (42 - 48)
  // -------------------------------------------------------------

  // Test 42: Verified Quran Text Provenance
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    assert(
      out.feedbackIntent.verifiedTextSource.uthmaniText === 'اللَّهِ' &&
        out.feedbackIntent.verifiedTextSource.hash === CANONICAL_QURAN_HASH,
      'Verified Quran text strictly sourced from verified context, never generated'
    );
  }

  // Test 43: LLM Boundary Validator Rejects Action Override
  {
    const ctx = createValidContext({
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctx);
    const result = LLMBoundaryValidator.validate(
      {
        requestedAction: PedagogicalAction.CONTINUE, // Unauthorized change from REQUEST_REPEAT
        proposedArabicText: 'كمّل تلاوتك.',
        intentToken: 'token-1',
      },
      out.feedbackIntent
    );
    assert(
      result.isValid === false &&
        result.violations.some((v) => v.includes('ACTION_MUTATION_FORBIDDEN')),
      'LLM boundary validator catches and rejects unauthorized action mutation'
    );
  }

  // Test 44: LLM Boundary Validator Rejects Forbidden Claim: "قراءتك حرام"
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    const result = LLMBoundaryValidator.validate(
      {
        requestedAction: out.action,
        proposedArabicText: 'هذا اللحن خطير وقراءتك حرام.',
        intentToken: 'token-2',
      },
      out.feedbackIntent
    );
    assert(
      result.isValid === false &&
        result.violations.some((v) => v.includes('قراءتك حرام')) &&
        result.sanitizedArabicText === out.feedbackIntent.pedagogicalPromptArabic,
      'LLM boundary validator blocks theological verdict "قراءتك حرام" and reverts to safe prompt'
    );
  }

  // Test 45: LLM Boundary Validator Rejects Forbidden Claim: "أنت أخطأت في الدين"
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    const result = LLMBoundaryValidator.validate(
      {
        requestedAction: out.action,
        proposedArabicText: 'أنت أخطأت في الدين بهذا الخطأ.',
        intentToken: 'token-3',
      },
      out.feedbackIntent
    );
    assert(
      result.isValid === false &&
        result.violations.some((v) => v.includes('أنت أخطأت في الدين')),
      'LLM boundary validator blocks "أنت أخطأت في الدين"'
    );
  }

  // Test 46: LLM Boundary Validator Rejects "قراءتك صحيحة شرعًا 100%"
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    const result = LLMBoundaryValidator.validate(
      {
        requestedAction: out.action,
        proposedArabicText: 'ممتاز، قراءتك صحيحة شرعًا 100%.',
        intentToken: 'token-4',
      },
      out.feedbackIntent
    );
    assert(
      result.isValid === false &&
        result.violations.some((v) => v.includes('قراءتك صحيحة شرعًا 100%')),
      'LLM boundary validator blocks false religious certification'
    );
  }

  // Test 47: LLM Boundary Validator Catches Tampered Quoted Quran Text
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    const result = LLMBoundaryValidator.validate(
      {
        requestedAction: out.action,
        proposedArabicText: 'اقرأ الكلمة:',
        quotedQuranText: 'بسم الله الرحمن الرحيم المحرف', // Tampered text
        intentToken: 'token-5',
      },
      out.feedbackIntent
    );
    assert(
      result.isValid === false &&
        result.violations.some((v) => v.includes('QURAN_TEXT_TAMPERING')),
      'LLM boundary validator detects and rejects non-canonical quoted Quran text'
    );
  }

  // Test 48: Allowed Claims Validation Passes for Compliant Feedback
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    const result = LLMBoundaryValidator.validate(
      {
        requestedAction: out.action,
        proposedArabicText: 'ممتاز، النطق متوافق مع المرجع الصوتي في هذا الموضع.',
        intentToken: 'token-6',
      },
      out.feedbackIntent
    );
    assert(
      result.isValid === true && result.violations.length === 0,
      'LLM boundary validator passes verified pedagogical feedback'
    );
  }

  // -------------------------------------------------------------
  // SECTION 7: DETERMINISM, REPLAY, AUDIT & ADVERSARIAL (49 - 57)
  // -------------------------------------------------------------

  // Test 49: Identical Input Produces Bit-for-Bit Identical Output
  {
    const ctxA = createValidContext();
    const ctxB = createValidContext();
    const outA = engine.evaluate(ctxA);
    const outB = engine.evaluate(ctxB);
    assert(
      outA.action === outB.action &&
        outA.authorizationStatus === outB.authorizationStatus &&
        outA.actionReason === outB.actionReason &&
        outA.escalationLevel === outB.escalationLevel,
      'Identical inputs produce identical action, authorization, and escalation'
    );
  }

  // Test 50: Deterministic Replay Method Confirms Zero Differences
  {
    const ctxA = createValidContext();
    const ctxB = createValidContext();
    const replayCheck = engine.verifyDeterministicReplay(ctxA, ctxB);
    assert(
      replayCheck.isDeterministic === true && !replayCheck.differences,
      'verifyDeterministicReplay certifies zero divergence'
    );
  }

  // Test 51: Policy Version Reproducibility Across Contexts
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    assert(
      out.auditTrail.policyVersion === 'provisional-v1.0.0-phase7a',
      'Audit trail documents explicit provisional policy version'
    );
  }

  // Test 52: Audit Trail Completeness
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    const trail = out.auditTrail;
    assert(
      !!trail.teacherDecisionId &&
        !!trail.timestamp &&
        !!trail.sessionId &&
        !!trail.studentId &&
        !!trail.inputDecisionId &&
        !!trail.action &&
        !!trail.policyVersion &&
        !!trail.quranDatasetHash &&
        !!trail.tajweedKBHash &&
        !!trail.modelHash &&
        !!trail.riwayah &&
        !!trail.confidenceSnapshot &&
        trail.integrityStatus === 'PASSED',
      'Audit trail contains all required immutable forensic fields'
    );
  }

  // Test 53: Immutable Evidence Preservation
  {
    const ctx = createValidContext();
    const out = engine.evaluate(ctx);
    assert(
      Object.isFrozen(out) &&
        Object.isFrozen(out.feedbackIntent) &&
        Object.isFrozen(out.auditTrail) &&
        Object.isFrozen(ctx),
      'Engine guarantees deep immutability across input context and output envelope'
    );
  }

  // Test 54: Adversarial Confidence Inflation Prevention (ERR-POL-003)
  {
    // Attempt 1: 0.70 confidence
    const ctx1 = createValidContext({ decisionConfidence: 0.70, acousticConfidence: 0.70 });
    const out1 = engine.evaluate(ctx1);

    // Attempt 2: identical 0.70 confidence
    const ctx2 = createValidContext({
      decisionConfidence: 0.70,
      acousticConfidence: 0.70,
      studentLearningState: {
        ...createValidContext().studentLearningState,
        attemptNumber: 2,
      },
    });
    const out2 = engine.evaluate(ctx2);

    assert(
      out1.auditTrail.confidenceSnapshot.decisionConfidence === 0.70 &&
        out2.auditTrail.confidenceSnapshot.decisionConfidence === 0.70 &&
        out2.action === PedagogicalAction.REQUEST_REPEAT,
      'Repeated ambiguous attempts strictly do NOT inflate confidence (ERR-POL-003)'
    );
  }

  // Test 55: Adversarial Interruption Cooldown Debouncing (ERR-POL-005)
  {
    const ctxCooldownActive = createValidContext({
      timestamp: 1774000002000,
      studentLearningState: {
        ...createValidContext().studentLearningState,
        lastInterruptionTimestamp: 1774000001000, // Only 1000ms ago (< 3000ms minimum)
        interruptionCountInCurrentAttempt: 1,
      },
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctxCooldownActive);
    assert(
      out.shouldInterrupt === false,
      'Interruption debounced within 3000ms minimum interval to prevent learner harassment'
    );
  }

  // Test 56: Adversarial Student Fatigue Handling
  {
    const ctxFatigued = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        fatigueSignals: {
          consecutiveErrors: 4,
          longPausesCount: 5,
          sessionDurationMinutes: 48,
          isFatigued: true,
        },
      },
    });
    const out = engine.evaluate(ctxFatigued);
    assert(
      out.action === PedagogicalAction.END_ATTEMPT &&
        out.actionReason.includes('STUDENT_FATIGUE_DETECTED'),
      'Cognitive fatigue triggers gentle END_ATTEMPT action'
    );
  }

  // Test 57: Adversarial Interruption Quota Exhaustion
  {
    const ctxMaxInterruptions = createValidContext({
      studentLearningState: {
        ...createValidContext().studentLearningState,
        interruptionCountInCurrentAttempt: 3, // Max allowed is 3
      },
      recitationDecision: {
        ...createValidContext().recitationDecision,
        confirmedErrors: [testPhoneticError],
      },
    });
    const out = engine.evaluate(ctxMaxInterruptions);
    assert(
      out.action === PedagogicalAction.END_ATTEMPT &&
        out.actionReason.includes('MAX_INTERRUPTIONS_REACHED'),
      'Exceeding maximum attempt interruptions ends attempt safely'
    );
  }

  console.log('\n================================================================');
  console.log(`ALL ${totalTests} OF ${totalTests} PHASE 7A TESTS COMPLETED AND VERIFIED GREEN!`);
  console.log('================================================================\n');
}

// Auto-run when executed directly via tsx
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('Phase7aTeacherPolicyEngine')) {
  runPhase7aTeacherPolicyEngineTests().catch((err) => {
    console.error('Fatal error running Phase 7A tests:', err);
    process.exit(1);
  });
}
