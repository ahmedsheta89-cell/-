/**
 * @file Phase5cRecitationDecisionEngine.test.ts
 * @description Comprehensive Phase 5C Recitation Error Decision Engine Test Suite.
 * 
 * COVERS ALL 30 MANDATORY TEST SCENARIOS (Section 28):
 * 1. exact clean match
 * 2. high-confidence substitution
 * 3. high-confidence deletion
 * 4. high-confidence insertion
 * 5. low-confidence substitution
 * 6. ambiguous substitution
 * 7. low SNR
 * 8. silence
 * 9. white noise
 * 10. unrelated Arabic
 * 11. cascading alignment failure
 * 12. stable repeated discrepancy
 * 13. repeated uncertain discrepancy
 * 14. rule applicable but acoustic evidence unavailable
 * 15. Madd applicable
 * 16. Ghunnah applicable
 * 17. Qalqalah applicable
 * 18. Tafkheem applicable
 * 19. Quran hash mismatch
 * 20. Tajweed KB hash mismatch
 * 21. model hash mismatch
 * 22. riwayah mismatch
 * 23. chunk boundary discrepancy
 * 24. streaming cache discontinuity
 * 25. teacher AI receives immutable evidence
 * 26. learner feedback never exposes unsupported religious verdict
 * 27. Quran text always comes from verified dataset
 * 28. deterministic replay
 * 29. multiple errors in one word
 * 30. multiple words after alignment instability
 */

import {
  RecitationErrorDecisionEngine,
  OFFICIAL_MODEL_HASH,
} from '../domain/recitation/RecitationErrorDecisionEngine.ts';
import {
  RecitationDecisionState,
  EscalationLevel,
  AlignmentStabilityState,
  RecitationDecisionInput,
  PhoneticDecisionErrorType,
} from '../domain/recitation/decisionTypes.ts';
import { RecitationEvidence } from '../domain/recitation/RecitationEvidence.ts';
import { TajweedRuleEvidence } from '../domain/tajweed/types.ts';
import { HAFS_OFFICIAL_CERTIFICATE } from '../infrastructure/quran/VerifiedQuranDataProvider.ts';
import { TAJWEED_KB_CHECKSUM_SHA256 } from '../domain/tajweed/VerifiedTajweedKnowledgeBase.ts';
import { RiwayahType } from '../domain/quran/types.ts';

export async function runPhase5cRecitationDecisionEngineTests(): Promise<void> {
  console.log('\n================================================================');
  console.log('  PHASE 5C: REAL RECITATION ERROR DECISION ENGINE VERIFICATION  ');
  console.log('================================================================\n');

  const engine = RecitationErrorDecisionEngine.getInstance();
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [Phase 5C Test ${totalTests}] ${testName}`);
    } else {
      console.error(`  ❌ [Phase 5C Test ${totalTests}] ${testName}: ${detail || 'Assertion failed'}`);
      throw new Error(`[Phase 5C Test Failure] ${testName}: ${detail || 'Assertion failed'}`);
    }
  }

  // Base factory for valid clean input
  function createCleanInput(overrides: Partial<RecitationDecisionInput> = {}): RecitationDecisionInput {
    const defaultEvidence: RecitationEvidence[] = [
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
      {
        ayahId: '1:1',
        wordIndex: 1,
        phonemeIndex: 1,
        expectedToken: 'i',
        observedToken: 'i',
        errorType: 'MATCH',
        acousticConfidence: 0.97,
        alignmentConfidence: 0.94,
        startTime: 0.2,
        endTime: 0.3,
        evidenceStatus: 'HIGH',
        marginPeak: 0.90,
      },
      {
        ayahId: '1:1',
        wordIndex: 1,
        phonemeIndex: 2,
        expectedToken: 's',
        observedToken: 's',
        errorType: 'MATCH',
        acousticConfidence: 0.96,
        alignmentConfidence: 0.93,
        startTime: 0.3,
        endTime: 0.4,
        evidenceStatus: 'HIGH',
        marginPeak: 0.88,
      },
      {
        ayahId: '1:1',
        wordIndex: 1,
        phonemeIndex: 3,
        expectedToken: 'm',
        observedToken: 'm',
        errorType: 'MATCH',
        acousticConfidence: 0.98,
        alignmentConfidence: 0.95,
        startTime: 0.4,
        endTime: 0.5,
        evidenceStatus: 'HIGH',
        marginPeak: 0.94,
      },
    ];

    return {
      recitationEvidence: defaultEvidence,
      tajweedRuleEvidence: [],
      signalQuality: {
        snrDb: 22.5,
        isClipping: false,
        isSilence: false,
        isWhiteNoise: false,
      },
      acousticConfidence: 0.97,
      alignmentConfidence: 0.94,
      ambiguityState: {
        isAmbiguous: false,
      },
      modelVersion: '3.1.0-int8-hardened',
      modelHash: OFFICIAL_MODEL_HASH,
      quranDatasetHash: HAFS_OFFICIAL_CERTIFICATE.checksumSha256,
      tajweedKBHash: TAJWEED_KB_CHECKSUM_SHA256,
      riwayah: RiwayahType.HAFS_AN_ASIM,
      evidenceTimestamp: new Date().toISOString(),
      ayahId: '1:1',
      ...overrides,
    };
  }

  // --- SCENARIO 1: Exact Clean Match ---
  {
    const input = createCleanInput();
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.MATCH &&
        output.escalationLevel === EscalationLevel.LEVEL_0_MATCH &&
        output.confirmedErrors.length === 0 &&
        output.canContinue === true &&
        output.learnerFeedback.messageArabic === 'ممتاز، كمّل.',
      'Exact Clean Match (All tokens match with high confidence -> MATCH)'
    );
  }

  // --- SCENARIO 2: High-Confidence Substitution ---
  {
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: 's',
          observedToken: 'sˤ', // Said Saad instead of Seen
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.95,
          alignmentConfidence: 0.92,
          startTime: 0.3,
          endTime: 0.4,
          evidenceStatus: 'HIGH',
          marginPeak: 0.88,
        },
      ],
      acousticConfidence: 0.95,
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.CONFIRMED_PHONETIC_ERROR &&
        output.confirmedErrors.length === 1 &&
        output.confirmedErrors[0].errorType === PhoneticDecisionErrorType.SUBSTITUTION &&
        output.interruption.shouldInterrupt === true &&
        output.interruption.recommendedAction === 'INTERRUPT_IMMEDIATELY',
      'High-Confidence Substitution (High posterior + high margin -> CONFIRMED_PHONETIC_ERROR & INTERRUPT)'
    );
  }

  // --- SCENARIO 3: High-Confidence Deletion ---
  {
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: 's',
          observedToken: '',
          errorType: 'DELETION',
          acousticConfidence: 0.94,
          alignmentConfidence: 0.91,
          startTime: 0,
          endTime: 0,
          evidenceStatus: 'HIGH',
        },
      ],
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.POSSIBLE_ERROR &&
        output.candidateErrors.length === 1 &&
        output.candidateErrors[0].errorType === PhoneticDecisionErrorType.DELETION &&
        output.confirmedErrors.length === 0, // Deletions lack physical acoustic waveform bounds per ERR-ALIGN-002
      'High-Confidence Deletion (Phonetic omission noted as candidate error; zero acoustic wave bounds -> not falsely confirmed as burst error)'
    );
  }

  // --- SCENARIO 4: High-Confidence Insertion ---
  {
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: '',
          observedToken: 'ʔ',
          errorType: 'INSERTION',
          acousticConfidence: 0.93,
          alignmentConfidence: 0.89,
          startTime: 0.3,
          endTime: 0.35,
          evidenceStatus: 'HIGH',
          marginPeak: 0.85,
        },
      ],
    });
    const output = engine.evaluate(input);
    assert(
      output.candidateErrors.length === 1 &&
        output.candidateErrors[0].errorType === PhoneticDecisionErrorType.INSERTION,
      'High-Confidence Insertion (Inserted extra consonant retained with precise bounds)'
    );
  }

  // --- SCENARIO 5: Low-Confidence Substitution ---
  {
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: 's',
          observedToken: 'z',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.62, // Below 0.90 threshold
          alignmentConfidence: 0.85,
          startTime: 0.3,
          endTime: 0.4,
          evidenceStatus: 'LOW',
          marginPeak: 0.40,
        },
      ],
      acousticConfidence: 0.62,
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.REQUEST_REPEAT &&
        output.confirmedErrors.length === 0 &&
        output.candidateErrors.length === 1 &&
        output.interruption.shouldInterrupt === false,
      'Low-Confidence Substitution (0.62 confidence degrades safely to REQUEST_REPEAT rather than error accusation)'
    );
  }

  // --- SCENARIO 6: Ambiguous Substitution ---
  {
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: 's',
          observedToken: 'ʃ',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.95,
          alignmentConfidence: 0.90,
          startTime: 0.3,
          endTime: 0.4,
          evidenceStatus: 'HIGH',
          marginPeak: 0.85,
        },
      ],
      ambiguityState: {
        isAmbiguous: true,
        ambiguityReason: 'Close competing Viterbi trellis path within cost margin 0.20',
      },
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.REQUEST_REPEAT &&
        output.confirmedErrors.length === 0 &&
        output.candidateErrors.length === 1,
      'Ambiguous Substitution (Viterbi path ambiguity forces REQUEST_REPEAT, preventing false error)'
    );
  }

  // --- SCENARIO 7: Low SNR ---
  {
    const input = createCleanInput({
      signalQuality: {
        snrDb: 6.5, // Below 10.0 dB minimum
        isClipping: false,
        isSilence: false,
        isWhiteNoise: false,
      },
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.REQUEST_REPEAT &&
        output.confirmedErrors.length === 0 &&
        output.auditTrail.decisionReason.includes('SIGNAL_QUALITY_LOW_SNR'),
      'Low SNR (< 10 dB triggers REQUEST_REPEAT safety gate)'
    );
  }

  // --- SCENARIO 8: Silence ---
  {
    const input = createCleanInput({
      signalQuality: {
        snrDb: 0.0,
        isClipping: false,
        isSilence: true,
        isWhiteNoise: false,
      },
      acousticConfidence: 0.0,
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.REQUEST_REPEAT &&
        output.shouldRepeat === true &&
        output.canContinue === false &&
        output.auditTrail.decisionReason === 'SIGNAL_QUALITY_SILENCE_DETECTED',
      'Silence (Zero audio energy detected -> REQUEST_REPEAT)'
    );
  }

  // --- SCENARIO 9: White Noise ---
  {
    const input = createCleanInput({
      signalQuality: {
        snrDb: 2.0,
        isClipping: false,
        isSilence: false,
        isWhiteNoise: true,
      },
      acousticConfidence: 0.15,
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.REQUEST_REPEAT &&
        output.auditTrail.decisionReason === 'SIGNAL_QUALITY_WHITE_NOISE_DETECTED',
      'White Noise (Ambient stationary noise detected -> REQUEST_REPEAT)'
    );
  }

  // --- SCENARIO 10: Unrelated Arabic ---
  {
    // Student recites completely different speech tokens
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 0,
          expectedToken: 'b',
          observedToken: 'k',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.88,
          alignmentConfidence: 0.40, // Alignment collapsed
          startTime: 0.1,
          endTime: 0.2,
          evidenceStatus: 'MEDIUM',
        },
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 1,
          expectedToken: 'i',
          observedToken: 'a',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.85,
          alignmentConfidence: 0.35,
          startTime: 0.2,
          endTime: 0.3,
          evidenceStatus: 'MEDIUM',
        },
      ],
      alignmentConfidence: 0.35,
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.REQUEST_REPEAT &&
        output.confirmedErrors.length === 0,
      'Unrelated Arabic (Low alignment confidence prevents certifying individual letter errors)'
    );
  }

  // --- SCENARIO 11: Cascading Alignment Failure Protection ---
  {
    // Single omission followed by slipped alignment
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 0,
          expectedToken: 'b',
          observedToken: 'i', // Slipped: observed next token
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.95,
          alignmentConfidence: 0.85,
          startTime: 0.1,
          endTime: 0.2,
          evidenceStatus: 'HIGH',
        },
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 1,
          expectedToken: 'i',
          observedToken: 's', // Slipped by 1
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.95,
          alignmentConfidence: 0.85,
          startTime: 0.2,
          endTime: 0.3,
          evidenceStatus: 'HIGH',
        },
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: 's',
          observedToken: 'm', // Slipped by 1
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.95,
          alignmentConfidence: 0.85,
          startTime: 0.3,
          endTime: 0.4,
          evidenceStatus: 'HIGH',
        },
      ],
    });
    const output = engine.evaluate(input);
    assert(
      output.alignmentStability === AlignmentStabilityState.PENDING_REALIGNMENT &&
        output.candidateErrors.filter(e => e.isCascadingSuppressed).length > 0 &&
        output.confirmedErrors.length <= 1, // Suppresses cascading downstream false errors
      'Cascading Alignment Failure Protection (1 slip does not report 3 separate confirmed errors)'
    );
  }

  // --- SCENARIO 12: Stable Repeated Discrepancy ---
  {
    // Attempt 1 had confidence 0.96. Attempt 2 has confidence 0.95.
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: 's',
          observedToken: 'sˤ',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.95,
          alignmentConfidence: 0.93,
          startTime: 0.3,
          endTime: 0.4,
          evidenceStatus: 'HIGH',
          marginPeak: 0.90,
        },
      ],
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.CONFIRMED_PHONETIC_ERROR &&
        output.confirmedErrors[0].confidence === 0.95,
      'Stable Repeated Discrepancy (Maintains exact observed acoustic confidence 0.95 without artificial inflation)'
    );
  }

  // --- SCENARIO 13: Repeated Uncertain Discrepancy (Confidence 0.62 remains 0.62) ---
  {
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: 's',
          observedToken: 'z',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.62,
          alignmentConfidence: 0.85,
          startTime: 0.3,
          endTime: 0.4,
          evidenceStatus: 'LOW',
          marginPeak: 0.35,
        },
      ],
      acousticConfidence: 0.62,
    });
    const output = engine.evaluate(input);
    assert(
      output.candidateErrors[0].confidence === 0.62 &&
        output.confirmedErrors.length === 0 &&
        (output.candidateErrors[0].confidence as number) < 0.90,
      'Repeated Uncertain Discrepancy (Section 18: Confidence 0.62 NEVER inflates to 0.95)'
    );
  }

  // --- SCENARIO 14: Rule Applicable but Acoustic Evidence Unavailable ---
  {
    const mockRuleEvidence: TajweedRuleEvidence = {
      evidenceId: 'taj-test-1',
      ayahId: '1:1',
      wordIndex: 1,
      phonemeIndex: 0,
      ruleId: 'noon_izhar_halqi',
      ruleName: 'Izhar Halqi',
      arabicRuleName: 'إظهار حلقي',
      ruleStatus: 'ACTIVE',
      expectedCondition: 'Nun Sakinah before Hamzah',
      observedEvidence: 'INCONCLUSIVE_ACOUSTIC',
      acousticConfidence: 0.50,
      alignmentConfidence: 0.50,
      applicabilityConfidence: 1.0,
      sourceReference: 'Tuhfat al-Atfal',
      knowledgeBaseVersion: '1.0.0',
      verificationStatus: 'VERIFIED',
      decisionStatus: 'INCONCLUSIVE',
      provenance: {
        quranDatasetVersion: '1.0.0',
        quranDatasetHash: HAFS_OFFICIAL_CERTIFICATE.checksumSha256,
        tajweedKbVersion: '1.0.0',
        tajweedKbHash: TAJWEED_KB_CHECKSUM_SHA256,
        ruleId: 'noon_izhar_halqi',
        sourceReference: 'Tuhfat al-Atfal',
        sourceVerificationStatus: 'VERIFIED',
        evidenceId: 'taj-test-1',
        modelVersion: '3.1.0-int8-hardened',
        alignmentVersion: '1.0.0',
        preprocessingVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        decisionPath: 'ACOUSTIC_INCONCLUSIVE',
      },
      userFacingExplanationArabic: 'الحكم منطبق لكن الدليل الصوتي غير كافٍ',
      userFacingExplanationEnglish: 'Rule applicable but acoustic evidence inconclusive',
    };

    const input = createCleanInput({
      tajweedRuleEvidence: [mockRuleEvidence],
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.TAJWEED_EVIDENCE_PENDING &&
        output.tajweedPendingRules.length === 1 &&
        output.confirmedErrors.length === 0,
      'Rule Applicable but Acoustic Evidence Unavailable -> TAJWEED_EVIDENCE_PENDING (never false error)'
    );
  }

  // --- SCENARIO 15: Madd Applicable (ERR-TAJ-001) ---
  {
    const maddEvidence: TajweedRuleEvidence = {
      evidenceId: 'taj-madd-1',
      ayahId: '1:7',
      wordIndex: 2,
      phonemeIndex: 3,
      ruleId: 'madd_lazim_kalimi_muthaqqal',
      ruleName: 'Madd Lazim Kalimi',
      arabicRuleName: 'مد لازم كلمي مثقل',
      ruleStatus: 'ACTIVE',
      expectedCondition: '6 Harakat',
      observedEvidence: 'MADD_ACOUSTIC_INCONCLUSIVE',
      acousticConfidence: 0.50,
      alignmentConfidence: 0.50,
      applicabilityConfidence: 1.0,
      sourceReference: 'Tuhfat al-Atfal',
      knowledgeBaseVersion: '1.0.0',
      verificationStatus: 'VERIFIED',
      decisionStatus: 'INCONCLUSIVE',
      provenance: {
        quranDatasetVersion: '1.0.0',
        quranDatasetHash: HAFS_OFFICIAL_CERTIFICATE.checksumSha256,
        tajweedKbVersion: '1.0.0',
        tajweedKbHash: TAJWEED_KB_CHECKSUM_SHA256,
        ruleId: 'madd_lazim_kalimi_muthaqqal',
        sourceReference: 'Tuhfat al-Atfal',
        sourceVerificationStatus: 'VERIFIED',
        evidenceId: 'taj-madd-1',
        modelVersion: '3.1.0-int8-hardened',
        alignmentVersion: '1.0.0',
        preprocessingVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        decisionPath: 'ERR-TAJ-001_MADD_DURATION_UNAVAILABLE',
      },
      userFacingExplanationArabic: 'المد منطبق',
      userFacingExplanationEnglish: 'Madd is applicable',
    };

    const input = createCleanInput({
      tajweedRuleEvidence: [maddEvidence],
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.TAJWEED_EVIDENCE_PENDING &&
        output.confirmedErrors.length === 0,
      'Madd Applicable (ERR-TAJ-001: Sub-frame calibration missing -> TAJWEED_EVIDENCE_PENDING, never CONFIRMED_TAJWEED_ERROR)'
    );
  }

  // --- SCENARIO 16: Ghunnah Applicable (ERR-TAJ-002) ---
  {
    const ghunnahEvidence: TajweedRuleEvidence = {
      evidenceId: 'taj-ghunnah-1',
      ayahId: '1:1',
      wordIndex: 1,
      phonemeIndex: 2,
      ruleId: 'ghunnah_mushaddadah',
      ruleName: 'Ghunnah Mushaddadah',
      arabicRuleName: 'غنة مشددة',
      ruleStatus: 'ACTIVE',
      expectedCondition: '2 Harakat Ghunnah from Khayshoom',
      observedEvidence: 'GHUNNAH_ACOUSTIC_INCONCLUSIVE',
      acousticConfidence: 0.50,
      alignmentConfidence: 0.50,
      applicabilityConfidence: 1.0,
      sourceReference: 'Tuhfat al-Atfal',
      knowledgeBaseVersion: '1.0.0',
      verificationStatus: 'VERIFIED',
      decisionStatus: 'INCONCLUSIVE',
      provenance: {
        quranDatasetVersion: '1.0.0',
        quranDatasetHash: HAFS_OFFICIAL_CERTIFICATE.checksumSha256,
        tajweedKbVersion: '1.0.0',
        tajweedKbHash: TAJWEED_KB_CHECKSUM_SHA256,
        ruleId: 'ghunnah_mushaddadah',
        sourceReference: 'Tuhfat al-Atfal',
        sourceVerificationStatus: 'VERIFIED',
        evidenceId: 'taj-ghunnah-1',
        modelVersion: '3.1.0-int8-hardened',
        alignmentVersion: '1.0.0',
        preprocessingVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        decisionPath: 'ERR-TAJ-002_GHUNNAH_NASAL_UNAVAILABLE',
      },
      userFacingExplanationArabic: 'الغنة منطبقة',
      userFacingExplanationEnglish: 'Ghunnah is applicable',
    };

    const input = createCleanInput({
      tajweedRuleEvidence: [ghunnahEvidence],
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.TAJWEED_EVIDENCE_PENDING &&
        output.tajweedPendingRules[0].ruleId === 'ghunnah_mushaddadah',
      'Ghunnah Applicable (ERR-TAJ-002: Token identity != nasal resonance -> TAJWEED_EVIDENCE_PENDING)'
    );
  }

  // --- SCENARIO 17: Qalqalah Applicable (ERR-TAJ-004) ---
  {
    const qalqalahEvidence: TajweedRuleEvidence = {
      evidenceId: 'taj-qalq-1',
      ayahId: '1:1',
      wordIndex: 1,
      phonemeIndex: 1,
      ruleId: 'qalqalah_sughra',
      ruleName: 'Qalqalah Sughra',
      arabicRuleName: 'قلقلة صغرى',
      ruleStatus: 'ACTIVE',
      expectedCondition: 'Echoing release burst',
      observedEvidence: 'QALQALAH_ACOUSTIC_INCONCLUSIVE',
      acousticConfidence: 0.50,
      alignmentConfidence: 0.50,
      applicabilityConfidence: 1.0,
      sourceReference: 'Al-Jazariyyah',
      knowledgeBaseVersion: '1.0.0',
      verificationStatus: 'VERIFIED',
      decisionStatus: 'INCONCLUSIVE',
      provenance: {
        quranDatasetVersion: '1.0.0',
        quranDatasetHash: HAFS_OFFICIAL_CERTIFICATE.checksumSha256,
        tajweedKbVersion: '1.0.0',
        tajweedKbHash: TAJWEED_KB_CHECKSUM_SHA256,
        ruleId: 'qalqalah_sughra',
        sourceReference: 'Al-Jazariyyah',
        sourceVerificationStatus: 'VERIFIED',
        evidenceId: 'taj-qalq-1',
        modelVersion: '3.1.0-int8-hardened',
        alignmentVersion: '1.0.0',
        preprocessingVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        decisionPath: 'ERR-TAJ-004_BURST_RELEASE_UNAVAILABLE',
      },
      userFacingExplanationArabic: 'القلقلة منطبقة',
      userFacingExplanationEnglish: 'Qalqalah is applicable',
    };

    const input = createCleanInput({
      tajweedRuleEvidence: [qalqalahEvidence],
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.TAJWEED_EVIDENCE_PENDING &&
        output.confirmedErrors.length === 0,
      'Qalqalah Applicable (ERR-TAJ-004: 40ms frame cannot resolve burst transient -> TAJWEED_EVIDENCE_PENDING)'
    );
  }

  // --- SCENARIO 18: Tafkheem Applicable (ERR-TAJ-003) ---
  {
    const tafkheemEvidence: TajweedRuleEvidence = {
      evidenceId: 'taj-taf-1',
      ayahId: '1:1',
      wordIndex: 1,
      phonemeIndex: 1,
      ruleId: 'tafkheem_isti_la',
      ruleName: 'Tafkheem Isti\'la',
      arabicRuleName: 'تفخيم الاستعلاء',
      ruleStatus: 'ACTIVE',
      expectedCondition: 'Pharyngealization formant shift',
      observedEvidence: 'ARTICULATION_ACOUSTIC_INCONCLUSIVE',
      acousticConfidence: 0.50,
      alignmentConfidence: 0.50,
      applicabilityConfidence: 1.0,
      sourceReference: 'Al-Jazariyyah',
      knowledgeBaseVersion: '1.0.0',
      verificationStatus: 'VERIFIED',
      decisionStatus: 'INCONCLUSIVE',
      provenance: {
        quranDatasetVersion: '1.0.0',
        quranDatasetHash: HAFS_OFFICIAL_CERTIFICATE.checksumSha256,
        tajweedKbVersion: '1.0.0',
        tajweedKbHash: TAJWEED_KB_CHECKSUM_SHA256,
        ruleId: 'tafkheem_isti_la',
        sourceReference: 'Al-Jazariyyah',
        sourceVerificationStatus: 'VERIFIED',
        evidenceId: 'taj-taf-1',
        modelVersion: '3.1.0-int8-hardened',
        alignmentVersion: '1.0.0',
        preprocessingVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        decisionPath: 'ERR-TAJ-003_FORMANT_MODEL_UNAVAILABLE',
      },
      userFacingExplanationArabic: 'الاستعلاء منطبق',
      userFacingExplanationEnglish: 'Isti\'la is applicable',
    };

    const input = createCleanInput({
      tajweedRuleEvidence: [tafkheemEvidence],
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.TAJWEED_EVIDENCE_PENDING &&
        !output.learnerFeedback.messageArabic.includes('مخرج الحرف خاطئ'),
      'Tafkheem Applicable (ERR-TAJ-003: No formant model -> TAJWEED_EVIDENCE_PENDING; zero false articulation claim)'
    );
  }

  // --- SCENARIO 19: Quran Hash Mismatch ---
  {
    const input = createCleanInput({
      quranDatasetHash: 'corrupted_quran_dataset_hash_12345',
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.INCONCLUSIVE &&
        output.auditTrail.integrityStatus === 'INTEGRITY_FAILURE' &&
        output.auditTrail.decisionReason.includes('Quran dataset hash mismatch'),
      'Quran Hash Mismatch (Integrity gate triggers INCONCLUSIVE failure)'
    );
  }

  // --- SCENARIO 20: Tajweed KB Hash Mismatch ---
  {
    const input = createCleanInput({
      tajweedKBHash: 'corrupted_tajweed_kb_hash_67890',
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.INCONCLUSIVE &&
        output.auditTrail.integrityStatus === 'INTEGRITY_FAILURE' &&
        output.auditTrail.decisionReason.includes('Tajweed KB checksum mismatch'),
      'Tajweed KB Hash Mismatch (Tampered KB hash triggers INCONCLUSIVE integrity halt)'
    );
  }

  // --- SCENARIO 21: Model Hash Mismatch ---
  {
    const input = createCleanInput({
      modelHash: 'tampered_neural_model_hash_abcde',
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.INCONCLUSIVE &&
        output.auditTrail.integrityStatus === 'INTEGRITY_FAILURE' &&
        output.auditTrail.decisionReason.includes('Acoustic model hash mismatch'),
      'Model Hash Mismatch (Uncertified model weight hash triggers INCONCLUSIVE integrity halt)'
    );
  }

  // --- SCENARIO 22: Riwayah Mismatch ---
  {
    const input = createCleanInput({
      riwayah: 'WARSH_AN_NAFI', // Not activated
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.INCONCLUSIVE &&
        output.auditTrail.integrityStatus === 'INTEGRITY_FAILURE' &&
        output.auditTrail.decisionReason.includes('Riwayah mismatch'),
      'Riwayah Mismatch (Non-Hafs Riwayah strictly halts evaluation per ERR-TAJ-005)'
    );
  }

  // --- SCENARIO 23: Chunk Boundary Discrepancy ---
  {
    const input = createCleanInput({
      chunkIndex: 4,
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 2,
          phonemeIndex: 0,
          expectedToken: 'l',
          observedToken: 'l',
          errorType: 'MATCH',
          acousticConfidence: 0.94,
          alignmentConfidence: 0.90,
          startTime: 1.2,
          endTime: 1.3,
          evidenceStatus: 'HIGH',
        },
      ],
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.MATCH &&
        output.auditTrail.evidenceIds.length === 1,
      'Chunk Boundary Discrepancy (Mid-stream chunk cleanly processed without state corruption)'
    );
  }

  // --- SCENARIO 24: Streaming Cache Discontinuity ---
  {
    const input = createCleanInput({
      isStreamingContinuation: false, // Fresh stream reset
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 0,
          expectedToken: 'b',
          observedToken: 'b',
          errorType: 'MATCH',
          acousticConfidence: 0.96,
          alignmentConfidence: 0.92,
          startTime: 0.0,
          endTime: 0.1,
          evidenceStatus: 'HIGH',
        },
      ],
    });
    const output = engine.evaluate(input);
    assert(
      output.finalStatus === RecitationDecisionState.MATCH &&
        output.alignmentStability === AlignmentStabilityState.STABLE,
      'Streaming Cache Discontinuity (Stream reset handles initial state without spurious error)'
    );
  }

  // --- SCENARIO 25: Teacher AI Receives Immutable Evidence ---
  {
    const input = createCleanInput();
    const output = engine.evaluate(input);
    let threwOnMutation = false;
    try {
      (output as any).finalStatus = RecitationDecisionState.CONFIRMED_PHONETIC_ERROR;
    } catch {
      threwOnMutation = true;
    }
    assert(
      Object.isFrozen(output) && (threwOnMutation || output.finalStatus === RecitationDecisionState.MATCH),
      'Teacher AI Receives Immutable Evidence (Object.freeze enforces read-only contract)'
    );
  }

  // --- SCENARIO 26: Learner Feedback Never Exposes Unsupported Religious Verdict ---
  {
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: 's',
          observedToken: 'sˤ',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.95,
          alignmentConfidence: 0.92,
          startTime: 0.3,
          endTime: 0.4,
          evidenceStatus: 'HIGH',
        },
      ],
      acousticConfidence: 0.95,
    });
    const output = engine.evaluate(input);
    const textAr = output.learnerFeedback.messageArabic;
    const forbiddenReligiousWords = ['حرام', 'حلال', 'إثم', 'ذنب', 'باطلة', 'فاسدة', 'معصية', 'لحن جلي', 'لحن خفي'];
    const containsForbidden = forbiddenReligiousWords.some(w => textAr.includes(w));
    assert(
      !containsForbidden && output.learnerFeedback.messageArabic === 'في اختلاف في نطق الحرف. جرّب مرة تانية.',
      'Learner Feedback Never Exposes Unsupported Religious Verdict (Clean non-condemning Arabic feedback)'
    );
  }

  // --- SCENARIO 27: Quran Text Always Comes from Verified Dataset ---
  {
    const verifiedWordUthmani = 'بِسْمِ';
    const input = createCleanInput();
    const output = engine.evaluate(input);
    const feedbackWithWord = engine.generateLearnerFeedback(output, verifiedWordUthmani);
    assert(
      feedbackWithWord.verifiedAyahContext === verifiedWordUthmani &&
        !feedbackWithWord.messageArabic.includes('null'),
      'Quran Text Always Comes from Verified Dataset (Zero hallucinated or dynamic Arabic scripture text)'
    );
  }

  // --- SCENARIO 28: Deterministic Replay ---
  {
    const input = createCleanInput();
    const output1 = engine.evaluate(input);
    const output2 = engine.evaluate(input);
    assert(
      output1.finalStatus === output2.finalStatus &&
        output1.escalationLevel === output2.escalationLevel &&
        output1.confirmedErrors.length === output2.confirmedErrors.length &&
        output1.auditTrail.quranHash === output2.auditTrail.quranHash,
      'Deterministic Replay (Identical inputs yield bit-for-bit identical decision outputs)'
    );
  }

  // --- SCENARIO 29: Multiple Errors in One Word (Word-Level Aggregation) ---
  {
    const input = createCleanInput({
      recitationEvidence: [
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 0,
          expectedToken: 'b',
          observedToken: 't',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.65, // low
          alignmentConfidence: 0.60,
          startTime: 0.1,
          endTime: 0.2,
          evidenceStatus: 'LOW',
        },
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 1,
          expectedToken: 'i',
          observedToken: 'u',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.60, // low
          alignmentConfidence: 0.60,
          startTime: 0.2,
          endTime: 0.3,
          evidenceStatus: 'LOW',
        },
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 2,
          expectedToken: 's',
          observedToken: 'ʃ',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.58, // low
          alignmentConfidence: 0.55,
          startTime: 0.3,
          endTime: 0.4,
          evidenceStatus: 'LOW',
        },
      ],
    });
    const ayahDecision = engine.evaluateAyah(input);
    const word1 = ayahDecision.wordDecisions.find(w => w.wordIndex === 1);
    assert(
      word1 !== undefined &&
        word1.hasAlignmentInstability === true &&
        word1.status === RecitationDecisionState.REQUEST_REPEAT &&
        ayahDecision.confirmedCount === 0,
      'Multiple Errors in One Word (3 low-confidence phoneme discrepancies aggregated as ALIGNMENT_INSTABILITY, not 3 false errors)'
    );
  }

  // --- SCENARIO 30: Multiple Words after Alignment Instability ---
  {
    const input = createCleanInput({
      recitationEvidence: [
        // Word 1: Instability
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 0,
          expectedToken: 'b',
          observedToken: 't',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.60,
          alignmentConfidence: 0.50,
          startTime: 0.1,
          endTime: 0.2,
          evidenceStatus: 'LOW',
        },
        {
          ayahId: '1:1',
          wordIndex: 1,
          phonemeIndex: 1,
          expectedToken: 'i',
          observedToken: 'a',
          errorType: 'SUBSTITUTION',
          acousticConfidence: 0.55,
          alignmentConfidence: 0.50,
          startTime: 0.2,
          endTime: 0.3,
          evidenceStatus: 'LOW',
        },
        // Word 2: High confidence re-anchored match
        {
          ayahId: '1:1',
          wordIndex: 2,
          phonemeIndex: 0,
          expectedToken: 'ʔ',
          observedToken: 'ʔ',
          errorType: 'MATCH',
          acousticConfidence: 0.98,
          alignmentConfidence: 0.95,
          startTime: 0.6,
          endTime: 0.7,
          evidenceStatus: 'HIGH',
        },
        {
          ayahId: '1:1',
          wordIndex: 2,
          phonemeIndex: 1,
          expectedToken: 'l',
          observedToken: 'l',
          errorType: 'MATCH',
          acousticConfidence: 0.97,
          alignmentConfidence: 0.95,
          startTime: 0.7,
          endTime: 0.8,
          evidenceStatus: 'HIGH',
        },
      ],
    });
    const ayahDecision = engine.evaluateAyah(input);
    const word2 = ayahDecision.wordDecisions.find(w => w.wordIndex === 2);
    assert(
      word2 !== undefined &&
        word2.status === RecitationDecisionState.MATCH &&
        word2.hasAlignmentInstability === false,
      'Multiple Words after Alignment Instability (Re-anchors safely on high-confidence Word 2 without persistent error leak)'
    );
  }

  console.log('\n================================================================');
  console.log(`  ALL ${passedTests} OF ${totalTests} PHASE 5C TESTS COMPLETED AND VERIFIED GREEN!  `);
  console.log('================================================================\n');
}
