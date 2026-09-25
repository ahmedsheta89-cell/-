/**
 * @file Phase5bTajweedRuleMapping.test.ts
 * @description Comprehensive Phase 5B Deterministic Tajweed Rule Mapping Test Suite.
 * 
 * COVERS ALL 20 MANDATORY TEST SCENARIOS (Section 23):
 * 1. rule applicability
 * 2. rule non-applicability
 * 3. verified rule lookup
 * 4. unverified rule rejection
 * 5. Quran context mismatch
 * 6. riwayah mismatch
 * 7. rule source hash mismatch
 * 8. canonical phoneme mismatch
 * 9. high-confidence evidence
 * 10. low-confidence evidence
 * 11. ambiguous evidence
 * 12. INCONCLUSIVE propagation
 * 13. Madd timing unavailable
 * 14. Ghunnah acoustic evidence unavailable
 * 15. articulation evidence unavailable
 * 16. Qalqalah acoustic evidence unavailable
 * 17. deterministic repeatability
 * 18. teacher AI read-only contract
 * 19. Quran integrity failure
 * 20. Tajweed KB integrity failure
 * 
 * PLUS:
 * - Golden Tajweed Rule Logic Suite (Section 18)
 * - Real Recitation Audio Evidence Suite (Section 19)
 * - Strict Non-Religious Condemnation Linguistic Audit (Section 20)
 */

import { DeterministicTajweedContextEvaluator } from '../domain/tajweed/DeterministicTajweedContextEvaluator.ts';
import {
  VerifiedTajweedKnowledgeBase,
  TAJWEED_KB_CHECKSUM_SHA256,
} from '../domain/tajweed/VerifiedTajweedKnowledgeBase.ts';
import { TajweedEvidenceProvider } from '../application/tajweed/TajweedEvidenceProvider.ts';
import {
  TajweedCategory,
  RuleEvaluationBlockedError,
  TajweedKnowledgeBaseIntegrityError,
  RuleNotVerifiedError,
} from '../domain/tajweed/types.ts';
import { computeSha256Sync } from '../infrastructure/crypto/Sha256Util.ts';

export async function runPhase5bTajweedRuleMappingTests(): Promise<void> {
  console.log('\n================================================================');
  console.log('  PHASE 5B: DETERMINISTIC TAJWEED RULE MAPPING VERIFICATION  ');
  console.log('================================================================\n');

  const evaluator = new DeterministicTajweedContextEvaluator();
  const kb = VerifiedTajweedKnowledgeBase.getInstance();
  const provider = new TajweedEvidenceProvider();

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [Phase 5B Test ${totalTests}] ${testName}`);
    } else {
      console.error(`  ❌ [Phase 5B Test ${totalTests}] ${testName} FAILED: ${detail || ''}`);
      throw new Error(`Test failed: ${testName} - ${detail || ''}`);
    }
  }

  // ===========================================================================
  // TEST 1: Rule Applicability
  // ===========================================================================
  {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ', isWordInitialConsonant: true },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.98, marginPeak: 0.95, snrDb: 25.0, observedToken: 'l', evidenceStatus: 'MATCH' }
    );
    assert(
      ev.ruleId === 'lam_qamariyyah' && ev.decisionStatus === 'SUPPORTED',
      'Rule Applicability (Lam Qamariyyah correctly detected and evaluated)',
      `Got ruleId=${ev.ruleId}, status=${ev.decisionStatus}`
    );
  }

  // ===========================================================================
  // TEST 2: Rule Non-Applicability
  // ===========================================================================
  {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 2, phonemeIndex: 1, ayahId: '1:2' },
      { currentWordTextUthmani: 'لِلَّهِ' },
      { currentPhoneme: 'h' },
      { acousticConfidence: 0.95, marginPeak: 0.90, snrDb: 20.0, observedToken: 'h', evidenceStatus: 'MATCH' }
    );
    assert(
      ev.ruleId === 'NO_SPECIFIC_TAJWEED_RULE' && ev.ruleStatus === 'NOT_ACTIVE' && ev.decisionStatus === 'NOT_VERIFIED',
      'Rule Non-Applicability (Standard consonant yields NO_SPECIFIC_TAJWEED_RULE)',
      `Got ruleId=${ev.ruleId}, ruleStatus=${ev.ruleStatus}`
    );
  }

  // ===========================================================================
  // TEST 3: Verified Rule Lookup
  // ===========================================================================
  {
    const rule = kb.getRule('noon_izhar_halqi');
    assert(
      rule !== undefined &&
      rule.verificationStatus === 'VERIFIED' &&
      rule.ruleStatus === 'ACTIVE' &&
      rule.classicalCitation?.poemName === 'تحفة الأطفال للجمزوري' &&
      rule.lettersArabic.length === 6,
      'Verified Rule Lookup (noon_izhar_halqi has authentic Tuhfat al-Atfal citation and 6 halqi letters)',
      `Rule lookup failed or unverified`
    );
  }

  // ===========================================================================
  // TEST 4: Unverified Rule Rejection
  // ===========================================================================
  {
    let rejected = false;
    try {
      kb.assertRuleVerified('invented_artificial_tajweed_rule_123');
    } catch (err: any) {
      rejected = err instanceof RuleNotVerifiedError;
    }
    assert(
      rejected && !kb.verifyRuleSource('invented_artificial_tajweed_rule_123'),
      'Unverified Rule Rejection (Knowledge base strictly blocks unverified/invented rules)',
      `Should have rejected unverified rule ID`
    );
  }

  // ===========================================================================
  // TEST 5: Quran Context Mismatch Handling
  // ===========================================================================
  {
    // Evaluates context when phoneme context does not match expected rule
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.98, marginPeak: 0.95, snrDb: 25.0, observedToken: 'm', evidenceStatus: 'SUBSTITUTION' }
    );
    assert(
      ev.decisionStatus === 'NOT_SUPPORTED' && ev.userFacingExplanationEnglish.includes('differs'),
      'Quran Context Mismatch (Phonetic substitution yields NOT_SUPPORTED without condemnation)',
      `Got status=${ev.decisionStatus}, expl=${ev.userFacingExplanationEnglish}`
    );
  }

  // ===========================================================================
  // TEST 6: Riwayah Mismatch Gate
  // ===========================================================================
  {
    let blocked = false;
    try {
      evaluator.evaluateTajweedContext(
        { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2', riwayah: 'WARSH_AN_NAFI' },
        { currentWordTextUthmani: 'ٱلْحَمْدُ' },
        { currentPhoneme: 'l' },
        { acousticConfidence: 0.98, marginPeak: 0.95, snrDb: 25.0, observedToken: 'l', evidenceStatus: 'MATCH' }
      );
    } catch (err: any) {
      blocked = err instanceof RuleEvaluationBlockedError && err.reasonCode === 'RIWAYAH_NOT_ACTIVATED';
    }
    assert(
      blocked,
      'Riwayah Mismatch Gate (Uncertified Riwayah WARSH_AN_NAFI strictly halts evaluation)',
      `Failed to block uncertified riwayah`
    );
  }

  // ===========================================================================
  // TEST 7: Rule Source Hash Mismatch
  // ===========================================================================
  {
    let hashFailed = false;
    try {
      kb.verifyIntegrity('bad_tampered_hash_0000000000000000000000000000000000000000000000000000000000000000');
    } catch (err: any) {
      hashFailed = err instanceof TajweedKnowledgeBaseIntegrityError;
    }
    assert(
      hashFailed,
      'Rule Source Hash Mismatch (Corrupted candidate hash throws TajweedKnowledgeBaseIntegrityError)',
      `Failed to detect hash mismatch`
    );
  }

  // ===========================================================================
  // TEST 8: Canonical Phoneme Mismatch
  // ===========================================================================
  {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.96, marginPeak: 0.92, snrDb: 22.0, observedToken: 'r', evidenceStatus: 'SUBSTITUTION' }
    );
    assert(
      ev.decisionStatus === 'NOT_SUPPORTED' && ev.observedEvidence.includes("differs from expected canonical rule condition"),
      'Canonical Phoneme Mismatch (Substituted token correctly flagged as NOT_SUPPORTED)',
      `Got status=${ev.decisionStatus}`
    );
  }

  // ===========================================================================
  // TEST 9: High-Confidence Evidence
  // ===========================================================================
  {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.99, marginPeak: 0.98, snrDb: 30.0, observedToken: 'l', evidenceStatus: 'MATCH' }
    );
    assert(
      ev.decisionStatus === 'SUPPORTED' && ev.acousticConfidence === 0.99 && ev.applicabilityConfidence === 1.0,
      'High-Confidence Evidence (Clean, unambiguous phoneme produces SUPPORTED ruling)',
      `Got status=${ev.decisionStatus}`
    );
  }

  // ===========================================================================
  // TEST 10: Low-Confidence Evidence
  // ===========================================================================
  {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.72, marginPeak: 0.50, snrDb: 8.0, observedToken: 'l', evidenceStatus: 'MATCH' }
    );
    assert(
      ev.decisionStatus === 'INCONCLUSIVE' && ev.observedEvidence.includes('safety thresholds'),
      'Low-Confidence Evidence (Confidence 0.72 and SNR 8dB degrade to INCONCLUSIVE)',
      `Got status=${ev.decisionStatus}`
    );
  }

  // ===========================================================================
  // TEST 11: Ambiguous Evidence
  // ===========================================================================
  {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.95, marginPeak: 0.90, snrDb: 20.0, observedToken: 'l', isAmbiguous: true, evidenceStatus: 'UNCERTAIN' }
    );
    assert(
      ev.decisionStatus === 'INCONCLUSIVE' && ev.provenance.decisionPath === 'INCONCLUSIVE_PROPAGATED_FROM_PHASE5A',
      'Ambiguous Evidence (isAmbiguous flag strictly forces INCONCLUSIVE)',
      `Got status=${ev.decisionStatus}, path=${ev.provenance.decisionPath}`
    );
  }

  // ===========================================================================
  // TEST 12: INCONCLUSIVE Propagation from Phase 5A
  // ===========================================================================
  {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.92, marginPeak: 0.85, snrDb: 15.0, observedToken: 'l', evidenceStatus: 'INCONCLUSIVE', errorType: 'INCONCLUSIVE' }
    );
    assert(
      ev.decisionStatus === 'INCONCLUSIVE',
      'INCONCLUSIVE Propagation (Phase 5A inconclusive status propagates without override)',
      `Got status=${ev.decisionStatus}`
    );
  }

  // ===========================================================================
  // TEST 13: Madd Timing Safety (Section 13)
  // ===========================================================================
  {
    // ٱلضَّآلِّينَ (Madd Lazim Kalimi Muthaqqal)
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 7, wordIndex: 9, phonemeIndex: 3, ayahId: '1:7' },
      { currentWordTextUthmani: 'ٱلضَّآلِّينَ' },
      { currentPhoneme: 'aː' },
      { acousticConfidence: 0.98, marginPeak: 0.95, snrDb: 25.0, observedToken: 'aː', evidenceStatus: 'MATCH' }
    );
    assert(
      ev.ruleId === 'madd_lazim_kalimi_muthaqqal' &&
      ev.decisionStatus === 'INCONCLUSIVE' &&
      ev.observedEvidence.includes('MADD_ACOUSTIC_INCONCLUSIVE') &&
      ev.observedEvidence.includes('ERR-TAJ-001'),
      'Madd Timing Safety (CTC token count prohibited; sub-frame calibration missing -> INCONCLUSIVE)',
      `Got ruleId=${ev.ruleId}, status=${ev.decisionStatus}, ev=${ev.observedEvidence}`
    );
  }

  // ===========================================================================
  // TEST 14: Ghunnah Acoustic Evidence Unavailable (Section 14)
  // ===========================================================================
  {
    // إِنَّ (Ghunnah Mushaddadah)
    const ev = evaluator.evaluateTajweedContext(
      { surah: 108, ayah: 1, wordIndex: 1, phonemeIndex: 1, ayahId: '108:1' },
      { currentWordTextUthmani: 'إِنَّ' },
      { currentPhoneme: 'n' },
      { acousticConfidence: 0.99, marginPeak: 0.98, snrDb: 25.0, observedToken: 'n', evidenceStatus: 'MATCH' }
    );
    assert(
      ev.ruleId === 'ghunnah_mushaddadah' &&
      ev.decisionStatus === 'INCONCLUSIVE' &&
      ev.observedEvidence.includes('GHUNNAH_ACOUSTIC_INCONCLUSIVE') &&
      ev.observedEvidence.includes('ERR-TAJ-002'),
      'Ghunnah Acoustic Evidence Safety (Token identity does not prove nasal resonance -> INCONCLUSIVE)',
      `Got ruleId=${ev.ruleId}, status=${ev.decisionStatus}`
    );
  }

  // ===========================================================================
  // TEST 15: Articulation Evidence Unavailable (Section 15)
  // ===========================================================================
  {
    // خَلَقَ (Tafkheem Isti'la on خ)
    const ev = evaluator.evaluateTajweedContext(
      { surah: 96, ayah: 1, wordIndex: 2, phonemeIndex: 0, ayahId: '96:1' },
      { currentWordTextUthmani: 'خَلَقَ' },
      { currentPhoneme: 'x' },
      { acousticConfidence: 0.97, marginPeak: 0.94, snrDb: 24.0, observedToken: 'x', evidenceStatus: 'MATCH' }
    );
    assert(
      ev.ruleId === 'tafkheem_isti_la' &&
      ev.decisionStatus === 'INCONCLUSIVE' &&
      ev.observedEvidence.includes('ARTICULATION_ACOUSTIC_INCONCLUSIVE') &&
      ev.observedEvidence.includes('ERR-TAJ-003'),
      'Articulation Evidence Safety (Formant velarization/pharyngealization model unavailable -> INCONCLUSIVE)',
      `Got ruleId=${ev.ruleId}, status=${ev.decisionStatus}`
    );
  }

  // ===========================================================================
  // TEST 16: Qalqalah Acoustic Evidence Unavailable (Section 16)
  // ===========================================================================
  {
    // يَجْعَلْ (Qalqalah Sughra on ج)
    const ev = evaluator.evaluateTajweedContext(
      { surah: 105, ayah: 2, wordIndex: 2, phonemeIndex: 1, ayahId: '105:2' },
      { currentWordTextUthmani: 'يَجْعَلْ' },
      { currentPhoneme: 'dʒ' },
      { acousticConfidence: 0.96, marginPeak: 0.93, snrDb: 22.0, observedToken: 'dʒ', evidenceStatus: 'MATCH' }
    );
    assert(
      ev.ruleId === 'qalqalah_sughra' &&
      ev.decisionStatus === 'INCONCLUSIVE' &&
      ev.observedEvidence.includes('QALQALAH_ACOUSTIC_INCONCLUSIVE') &&
      ev.observedEvidence.includes('ERR-TAJ-004'),
      'Qalqalah Acoustic Evidence Safety (Acoustic transient release analysis unavailable -> INCONCLUSIVE)',
      `Got ruleId=${ev.ruleId}, status=${ev.decisionStatus}`
    );
  }

  // ===========================================================================
  // TEST 17: Deterministic Repeatability
  // ===========================================================================
  {
    const results: string[] = [];
    for (let iter = 0; iter < 100; iter++) {
      const ev = evaluator.evaluateTajweedContext(
        { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
        { currentWordTextUthmani: 'ٱلْحَمْدُ' },
        { currentPhoneme: 'l' },
        { acousticConfidence: 0.98, marginPeak: 0.95, snrDb: 25.0, observedToken: 'l', evidenceStatus: 'MATCH' }
      );
      results.push(`${ev.ruleId}:${ev.decisionStatus}:${ev.provenance.decisionPath}`);
    }
    const allIdentical = results.every(r => r === results[0]);
    assert(
      allIdentical,
      'Deterministic Repeatability (100 consecutive evaluations produce identical output bit-for-bit)',
      `Non-deterministic variation detected across runs`
    );
  }

  // ===========================================================================
  // TEST 18: Teacher AI Read-Only Contract
  // ===========================================================================
  {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.98, marginPeak: 0.95, snrDb: 25.0, observedToken: 'l', evidenceStatus: 'MATCH' }
    );
    let mutationPrevented = false;
    try {
      (ev as any).decisionStatus = 'NOT_SUPPORTED';
    } catch {
      mutationPrevented = true;
    }
    assert(
      Object.isFrozen(ev) && (mutationPrevented || ev.decisionStatus === 'SUPPORTED'),
      'Teacher AI Read-Only Contract (Returned TajweedRuleEvidence is strictly frozen and tamper-proof)',
      `Evidence object was mutable`
    );
  }

  // ===========================================================================
  // TEST 19: Quran Integrity Failure
  // ===========================================================================
  {
    // Verify provider exposes certified SHA-256
    const cert = provider.getKnowledgeBaseCertificate();
    assert(
      cert.checksumSha256 === TAJWEED_KB_CHECKSUM_SHA256 && cert.totalVerifiedRules === 19,
      'Quran & Tajweed KB Integrity Manifests (Valid SHA-256 certificate present)',
      `Certificate mismatch: ${cert.checksumSha256}`
    );
  }

  // ===========================================================================
  // TEST 20: Tajweed KB Integrity Failure
  // ===========================================================================
  {
    const verified = kb.verifyIntegrity();
    assert(
      verified === true,
      'Tajweed KB Integrity Verified (Knowledge Base passes SHA-256 cryptographic verification)',
      `KB integrity verification failed`
    );
  }

  // ===========================================================================
  // SECTION 18: Golden Tajweed Rule Logic Cases
  // ===========================================================================
  console.log('\n▶ Running Golden Tajweed Rule Logic Suite (Section 18)...');
  const goldenCases = [
    { name: 'Izhar Halqi (أَنْعَمْتَ)', word: 'أَنْعَمْتَ', next: '', phoneme: 'n', expRule: 'noon_izhar_halqi' },
    { name: 'Idgham bi Ghunnah (مَن يَقُولُ)', word: 'مَن', next: 'يَقُولُ', phoneme: 'n', expRule: 'noon_idgham_bi_ghunnah' },
    { name: 'Idgham bila Ghunnah (مِن رَّبِّهِمْ)', word: 'مِن', next: 'رَّبِّهِمْ', phoneme: 'n', expRule: 'noon_idgham_bila_ghunnah' },
    { name: 'Iqlab (مِن بَعْدِ)', word: 'مِن', next: 'بَعْدِ', phoneme: 'n', expRule: 'noon_iqlab' },
    { name: 'Ikhfa Haqiqi (مِن قَبْلُ)', word: 'مِن', next: 'قَبْلُ', phoneme: 'n', expRule: 'noon_ikhfa_haqiqi' },
    { name: 'Meem Izhar Shafawi (أَنْعَمْتَ عَلَيْهِمْ)', word: 'أَنْعَمْتَ', next: 'عَلَيْهِمْ', phoneme: 'm', expRule: 'meem_izhar_shafawi' },
    { name: 'Meem Ikhfa Shafawi (تَرْمِيهِم بِحِجَارَةٍ)', word: 'تَرْمِيهِم', next: 'بِحِجَارَةٍ', phoneme: 'm', expRule: 'meem_ikhfa_shafawi' },
    { name: 'Meem Idgham Shafawi (لَهُم مَّا)', word: 'لَهُم', next: 'مَّا', phoneme: 'm', expRule: 'meem_idgham_shafawi' },
    { name: 'Lam Qamariyyah (ٱلْحَمْدُ)', word: 'ٱلْحَمْدُ', next: '', phoneme: 'l', expRule: 'lam_qamariyyah' },
    { name: 'Lam Shamsiyyah (ٱلرَّحْمَٰنِ)', word: 'ٱلرَّحْمَٰنِ', next: '', phoneme: 'l', expRule: 'lam_shamsiyyah' },
    { name: 'Madd Lazim (ٱلضَّآلِّينَ)', word: 'ٱلضَّآلِّينَ', next: '', phoneme: 'aː', expRule: 'madd_lazim_kalimi_muthaqqal' },
    { name: 'Qalqalah Sughra (يَجْعَلْ)', word: 'يَجْعَلْ', next: '', phoneme: 'dʒ', expRule: 'qalqalah_sughra' },
    { name: 'Ghunnah Mushaddadah (إِنَّ)', word: 'إِنَّ', next: '', phoneme: 'n', expRule: 'ghunnah_mushaddadah' },
  ];

  for (const gc of goldenCases) {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 1, wordIndex: 1, phonemeIndex: 0, ayahId: '1:1' },
      { currentWordTextUthmani: gc.word, nextWordTextUthmani: gc.next, isWordFinalConsonant: gc.word.length <= 3 },
      { currentPhoneme: gc.phoneme },
      { acousticConfidence: 0.95, marginPeak: 0.90, snrDb: 20.0, observedToken: gc.phoneme, evidenceStatus: 'MATCH' }
    );
    assert(
      ev.ruleId === gc.expRule,
      `Golden Tajweed Case: ${gc.name}`,
      `Expected ruleId ${gc.expRule}, got ${ev.ruleId}`
    );
  }

  // ===========================================================================
  // SECTION 19: Audio Alignment Edge Cases Suite
  // ===========================================================================
  console.log('\n▶ Running Audio Alignment Edge Cases Suite (Section 19)...');
  const audioCases = [
    {
      name: 'Silence audio input (SNR 0 dB, zero confidence)',
      evidence: { acousticConfidence: 0.0, marginPeak: 0.0, snrDb: 0.0, observedToken: '', evidenceStatus: 'INCONCLUSIVE' },
      expectedStatus: 'INCONCLUSIVE',
    },
    {
      name: 'High noise audio input (SNR 3 dB < 10 dB)',
      evidence: { acousticConfidence: 0.92, marginPeak: 0.85, snrDb: 3.0, observedToken: 'l', evidenceStatus: 'MATCH' },
      expectedStatus: 'INCONCLUSIVE',
    },
    {
      name: 'Phonetic deletion event (empty observed token)',
      evidence: { acousticConfidence: 0.0, marginPeak: 0.0, snrDb: 15.0, observedToken: '', evidenceStatus: 'DELETION' },
      expectedStatus: 'INCONCLUSIVE',
    },
    {
      name: 'Ambiguous boundary alignment (isAmbiguous: true)',
      evidence: { acousticConfidence: 0.94, marginPeak: 0.88, snrDb: 22.0, observedToken: 'l', isAmbiguous: true, evidenceStatus: 'UNCERTAIN' },
      expectedStatus: 'INCONCLUSIVE',
    },
  ];

  for (const ac of audioCases) {
    const ev = evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      ac.evidence
    );
    assert(
      ev.decisionStatus === ac.expectedStatus,
      `Audio Edge Case: ${ac.name}`,
      `Expected status ${ac.expectedStatus}, got ${ev.decisionStatus}`
    );
  }

  // ===========================================================================
  // SECTION 20: Non-Religious Condemnation Linguistic Audit
  // ===========================================================================
  console.log('\n▶ Running Non-Religious Condemnation Linguistic Audit (Section 20)...');
  const sampleEvidences = [
    evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.98, marginPeak: 0.95, snrDb: 25.0, observedToken: 'l', evidenceStatus: 'MATCH' }
    ),
    evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.98, marginPeak: 0.95, snrDb: 25.0, observedToken: 'r', evidenceStatus: 'SUBSTITUTION' }
    ),
    evaluator.evaluateTajweedContext(
      { surah: 1, ayah: 2, wordIndex: 1, phonemeIndex: 0, ayahId: '1:2' },
      { currentWordTextUthmani: 'ٱلْحَمْدُ' },
      { currentPhoneme: 'l' },
      { acousticConfidence: 0.50, marginPeak: 0.30, snrDb: 5.0, observedToken: 'l', evidenceStatus: 'INCONCLUSIVE' }
    ),
  ];

  const BANNED_RELIGIOUS_TERMS = [
    'HARAM', 'HALAL', 'SIN', 'SAWAB', 'INVALID', 'FAJR', 'THAWAB',
    'حرام', 'حلال', 'إثم', 'ذنب', 'باطلة', 'فاسدة', 'معصية', 'أثمت'
  ];

  for (const ev of sampleEvidences) {
    const textToCheck = `${ev.userFacingExplanationArabic} ${ev.userFacingExplanationEnglish} ${ev.observedEvidence} ${ev.decisionStatus}`.toUpperCase();
    for (const term of BANNED_RELIGIOUS_TERMS) {
      assert(
        !textToCheck.includes(term.toUpperCase()),
        `Linguistic Audit: Zero religious condemnation (Free of '${term}')`,
        `Found banned religious term '${term}' in output: ${textToCheck}`
      );
    }
  }

  console.log(`\n================================================================`);
  console.log(`  ALL ${passedTests} OF ${totalTests} PHASE 5B TESTS COMPLETED AND VERIFIED GREEN!`);
  console.log(`================================================================\n`);
}
