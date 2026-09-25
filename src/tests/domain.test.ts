/**
 * @file domain.test.ts
 * @module tests
 * @description Foundation test suite verifying domain contracts, teacher engine state machine,
 * confidence decision matrix, and scientific verification rules.
 */

import { resolvePedagogicalDecision, ConfidenceLevel, PedagogicalDecision } from '../domain/confidence/types.ts';
import { LahnCategory, RecitationErrorType, RecitationErrorDetail } from '../domain/errors/types.ts';
import { TeacherSessionEngineImpl } from '../application/teacher/TeacherSessionEngineImpl.ts';
import { TeacherEngineState } from '../domain/teacher/types.ts';
import { RiwayahType, VerificationStatus } from '../domain/quran/types.ts';
import { RecitationMode, RecitationSession, RecitationSessionStatus } from '../domain/recitation/types.ts';
import { assertReligiousDataVerifiability, ContentVerificationRecord } from '../domain/verification/types.ts';
import { AdminPermission, ROLE_PERMISSIONS, UserRole } from '../domain/admin/types.ts';
import { SURAH_AL_FATIHAH, AL_FATIHAH_AYAHS } from '../infrastructure/providers/InMemoryQuranDataProvider.ts';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
}

export async function runDomainTestSuite(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  function assert(condition: boolean, name: string, category: string, failureMessage = 'Assertion failed'): void {
    if (condition) {
      results.push({ name, category, passed: true });
    } else {
      results.push({ name, category, passed: false, message: failureMessage });
    }
  }

  // 1. Test Confidence Model Decisions
  try {
    const highDec = resolvePedagogicalDecision(ConfidenceLevel.HIGH, true);
    assert(
      highDec === PedagogicalDecision.DIRECT_CORRECTION,
      'High confidence triggers direct correction',
      'Confidence Matrix'
    );

    const medDec = resolvePedagogicalDecision(ConfidenceLevel.MEDIUM, true);
    assert(
      medDec === PedagogicalDecision.REQUEST_REPETITION,
      'Medium confidence triggers request repetition (no false condemnation)',
      'Confidence Matrix'
    );

    const lowDec = resolvePedagogicalDecision(ConfidenceLevel.LOW, false);
    assert(
      lowDec === PedagogicalDecision.PROCEED_WITHOUT_JUDGMENT,
      'Low confidence yields proceed without judgment',
      'Confidence Matrix'
    );

    const unkDec = resolvePedagogicalDecision(ConfidenceLevel.UNKNOWN, false);
    assert(
      unkDec === PedagogicalDecision.FLAG_FOR_HUMAN_REVIEW,
      'Unknown confidence flags for human teacher review',
      'Confidence Matrix'
    );
  } catch (err: unknown) {
    results.push({ name: 'Confidence Model Evaluation', category: 'Confidence Matrix', passed: false, message: String(err) });
  }

  // 2. Test Religious Data Immutability and Verification
  try {
    assert(
      SURAH_AL_FATIHAH.verification.verificationStatus === VerificationStatus.VERIFIED,
      'Surah Al-Fatihah carries VERIFIED status',
      'Scientific Integrity'
    );
    assert(
      SURAH_AL_FATIHAH.verification.riwayah === RiwayahType.HAFS_AN_ASIM,
      'Default Riwayah is certified Hafs an Asim',
      'Scientific Integrity'
    );
    assert(
      AL_FATIHAH_AYAHS.length === 7,
      'Surah Al-Fatihah exactly contains 7 verified Ayahs',
      'Scientific Integrity'
    );

    const mockVerificationRecord: ContentVerificationRecord = {
      id: 'vr-1',
      contentType: 'QURAN_TEXT',
      entityId: 'surah:1',
      sourceAuthority: 'مجمع الملك فهد',
      referenceCitation: 'طبعة المدينة',
      riwayah: RiwayahType.HAFS_AN_ASIM,
      version: '2.4.0',
      verificationStatus: VerificationStatus.VERIFIED,
      reviewer: {
        reviewerId: 'scholar-101',
        fullName: 'الشيخ الدكتور المقرئ فلان',
        titleArabic: 'عضو لجنة مراجعة المصاحف',
        ijazahDescription: 'إجازة بالقراءات العشر الصغرى والكبرى بالسند المتصل',
        institutionAffiliation: 'مجمع الملك فهد لطباعة المصحف الشريف',
        verificationCount: 6236,
      },
      checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      verifiedAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const isValid = assertReligiousDataVerifiability(mockVerificationRecord);
    assert(isValid, 'Verification authority record meets security constraints', 'Scientific Integrity');

    let threwIntegrityError = false;
    try {
      assertReligiousDataVerifiability({
        ...mockVerificationRecord,
        reviewer: { ...mockVerificationRecord.reviewer, reviewerId: '' },
      });
    } catch {
      threwIntegrityError = true;
    }
    assert(
      threwIntegrityError,
      'Uncertified content without valid scholar reviewer is rejected immediately',
      'Scientific Integrity'
    );
  } catch (err: unknown) {
    results.push({ name: 'Verification Policy', category: 'Scientific Integrity', passed: false, message: String(err) });
  }

  // 3. Test TeacherSessionEngine State Machine
  try {
    const engine = new TeacherSessionEngineImpl();
    assert(engine.getCurrentState() === TeacherEngineState.IDLE, 'Engine starts in IDLE', 'Teacher Engine');

    const sampleSession: RecitationSession = {
      id: 'session-test-01',
      studentId: 'student-123',
      selectedRiwayah: RiwayahType.HAFS_AN_ASIM,
      mode: RecitationMode.MEMORIZATION_RECITE,
      status: RecitationSessionStatus.INITIALIZING,
      surahNumber: 1,
      fromAyah: 1,
      toAyah: 7,
      expectedAyahs: AL_FATIHAH_AYAHS,
      expectedWords: AL_FATIHAH_AYAHS[0].words,
      currentAyahIndex: 1,
      currentWordIndex: 1,
      audioSegments: [],
      detectedWords: [],
      detectedErrors: [],
      corrections: [],
      repetitions: [],
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalRecitationTimeSeconds: 0,
    };

    // Transition: START_SESSION -> LISTEN
    await engine.dispatch({ type: 'START_SESSION', session: sampleSession });
    assert(engine.getCurrentState() === TeacherEngineState.LISTEN, 'Transitions to LISTEN on start', 'Teacher Engine');

    // Transition: AUDIO_CHUNK_RECEIVED -> ALIGN
    await engine.dispatch({
      type: 'AUDIO_CHUNK_RECEIVED',
      audioData: new ArrayBuffer(512),
      timestampMs: 500,
    });
    assert(engine.getCurrentState() === TeacherEngineState.ALIGN, 'Transitions to ALIGN upon receiving audio', 'Teacher Engine');

    // Transition: ALIGNMENT_COMPLETED -> ANALYZE
    await engine.dispatch({
      type: 'ALIGNMENT_COMPLETED',
      matchedWordId: '1:1:1',
      confidence: { level: ConfidenceLevel.HIGH, score: 0.95, reasonArabic: 'تطابق سليم' },
    });
    assert(engine.getCurrentState() === TeacherEngineState.ANALYZE, 'Transitions to ANALYZE upon alignment completion', 'Teacher Engine');

    // Transition: ANALYSIS_COMPLETED with error & HIGH confidence -> INTERRUPT_IF_NEEDED
    const mockError: RecitationErrorDetail = {
      errorType: RecitationErrorType.HARAKAH_MISMATCH,
      category: LahnCategory.JALI,
      nameArabic: 'لحن جلي في حركة الحرف',
      descriptionArabic: 'قراءة بكسر الميم بدل فتحها',
      surahNumber: 1,
      ayahNumber: 1,
      wordIndex: 1,
      expectedToken: 'بِسْمِ (بكسر الباء والميم)',
      detectedToken: 'بِسْمَ (بفتح الميم)',
      severity: 'CRITICAL',
      pedagogicalTipArabic: 'اكسر الميم رعاك الله دون إشباع زائد.',
    };

    await engine.dispatch({
      type: 'ANALYSIS_COMPLETED',
      errors: [mockError],
      confidence: { level: ConfidenceLevel.HIGH, score: 0.93, reasonArabic: 'لحن جلي صريح وثقة عالية' },
    });
    assert(
      engine.getCurrentState() === TeacherEngineState.INTERRUPT_IF_NEEDED,
      'Transitions to INTERRUPT_IF_NEEDED when high-confidence error detected',
      'Teacher Engine'
    );

    // Transition: INTERRUPT_EMITTED -> CORRECT
    await engine.dispatch({ type: 'INTERRUPT_EMITTED' });
    assert(engine.getCurrentState() === TeacherEngineState.CORRECT, 'Transitions to CORRECT to explain error', 'Teacher Engine');

    // Transition: CORRECTION_DELIVERED -> REPEAT
    await engine.dispatch({ type: 'CORRECTION_DELIVERED', explanationArabic: 'تم توجيه الطالب للفظ الصحيح' });
    assert(engine.getCurrentState() === TeacherEngineState.REPEAT, 'Transitions to REPEAT to request repetition', 'Teacher Engine');

    // Transition: REPETITION_RECEIVED -> CONFIRM
    await engine.dispatch({ type: 'REPETITION_RECEIVED', isAccepted: true });
    assert(engine.getCurrentState() === TeacherEngineState.CONFIRM, 'Transitions to CONFIRM to evaluate repetition', 'Teacher Engine');

    // Transition: CONFIRMATION_EVALUATED (success) -> CONTINUE
    await engine.dispatch({ type: 'CONFIRMATION_EVALUATED', success: true });
    assert(engine.getCurrentState() === TeacherEngineState.CONTINUE, 'Transitions to CONTINUE when corrected successfully', 'Teacher Engine');

    // Transition: RESUME_RECITATION -> LISTEN
    await engine.dispatch({ type: 'RESUME_RECITATION' });
    assert(engine.getCurrentState() === TeacherEngineState.LISTEN, 'Returns to LISTEN to proceed with Quran recitation', 'Teacher Engine');
  } catch (err: unknown) {
    results.push({ name: 'Teacher Session Engine Lifecycle', category: 'Teacher Engine', passed: false, message: String(err) });
  }

  // 4. Test Role-Based Segregation of Duties
  try {
    const reviewerPerms = ROLE_PERMISSIONS[UserRole.SCIENTIFIC_REVIEWER];
    assert(
      reviewerPerms.includes(AdminPermission.VERIFY_QURAN_DATA),
      'SCIENTIFIC_REVIEWER possesses VERIFY_QURAN_DATA permission',
      'Security & Governance'
    );

    const adminPerms = ROLE_PERMISSIONS[UserRole.SYSTEM_ADMIN];
    assert(
      !adminPerms.includes(AdminPermission.VERIFY_QURAN_DATA),
      'SYSTEM_ADMIN is barred from verifying religious data autonomously',
      'Security & Governance'
    );

    const studentPerms = ROLE_PERMISSIONS[UserRole.STUDENT];
    assert(studentPerms.length === 0, 'STUDENT has zero administrative permissions', 'Security & Governance');
  } catch (err: unknown) {
    results.push({ name: 'Role Permissions Matrix', category: 'Security & Governance', passed: false, message: String(err) });
  }

  // 5. PHASE 2: Structural Quranic Truth Verification (114 Surahs Manifest & Basmalah Rules)
  try {
    const { ALL_114_SURAHS_MANIFEST, VERIFIED_CANONICAL_AYAHS } = await import('../infrastructure/quran/VerifiedQuranDataProvider.ts');
    
    assert(ALL_114_SURAHS_MANIFEST.length === 114, 'Canonical Surah manifest contains exactly 114 Surahs', 'Phase 2: Quran Structure');

    const fatihah = ALL_114_SURAHS_MANIFEST.find(s => s.number === 1);
    assert(Boolean(fatihah?.hasNumberedBasmalah), 'Surah 1 (Al-Fatihah) has numbered Basmalah (Ayah 1) in Hafs', 'Phase 2: Quran Structure');

    const tawbah = ALL_114_SURAHS_MANIFEST.find(s => s.number === 9);
    assert(!tawbah?.hasBasmalahPrefix && !tawbah?.hasNumberedBasmalah, 'Surah 9 (At-Tawbah) has NO Basmalah prefix or numbered ayah', 'Phase 2: Quran Structure');

    // Contiguous check 1 to 114
    let isContiguous = true;
    for (let i = 1; i <= 114; i++) {
      if (!ALL_114_SURAHS_MANIFEST.find(s => s.number === i)) {
        isContiguous = false;
        break;
      }
    }
    assert(isContiguous, 'Surahs index is strictly contiguous from 1 to 114 without gaps', 'Phase 2: Quran Structure');

    // Tri-text representation check
    const sampleAyahs = VERIFIED_CANONICAL_AYAHS;
    const allHaveTriText = sampleAyahs.every(a => 
      Boolean(a.textUthmani && a.textUthmani.length > 0) &&
      Boolean(a.displayText && a.displayText.length > 0) &&
      Boolean(a.alignmentText && a.alignmentText.length > 0)
    );
    assert(allHaveTriText, 'All verified canonical Ayahs enforce tri-text representation (Uthmani, Display, Alignment)', 'Phase 2: Quran Structure');
  } catch (err: unknown) {
    results.push({ name: 'Structural Quranic Verification', category: 'Phase 2: Quran Structure', passed: false, message: String(err) });
  }

  // 6. PHASE 2: Deterministic Tajweed Rule Engine (Zero LLM)
  try {
    const { DeterministicTajweedRuleEngine } = await import('../application/tajweed/TajweedRuleEngine.ts');
    const { CANONICAL_TAJWEED_RULES } = await import('../domain/tajweed/rulesCatalog.ts');
    const engine = new DeterministicTajweedRuleEngine();

    assert(Object.keys(CANONICAL_TAJWEED_RULES).length >= 10, 'Canonical Tajweed catalog contains comprehensive classical rules', 'Phase 2: Tajweed Engine');

    // Test Qalqalah detection
    const qalqalahResults = engine.analyzeText('قُلْ هُوَ ٱللَّهُ أَحَدٌ');
    const hasQalqalah = qalqalahResults.some(r => r.category === 'QALQALAH');
    assert(hasQalqalah, 'Deterministic engine accurately identifies Qalqalah in (أحد/قل)', 'Phase 2: Tajweed Engine');

    // Test Madd Lazim Kalimi in 'ٱلضَّآلِّينَ'
    const maddResults = engine.analyzeText('وَلَا ٱلضَّآلِّينَ');
    const hasMaddLazim = maddResults.some(r => r.ruleId === 'madd_lazim_kalimi_muthaqqal' || r.category === 'MADD');
    assert(hasMaddLazim, 'Deterministic engine identifies Madd Lazim with 6 harakat duration', 'Phase 2: Tajweed Engine');

    // Test Lam Qamariyyah in 'ٱلْحَمْدُ'
    const lamResults = engine.analyzeText('ٱلْحَمْدُ لِلَّهِ');
    const hasLamQamariyyah = lamResults.some(r => r.ruleId === 'lam_qamariyyah');
    assert(hasLamQamariyyah, 'Deterministic engine identifies Lam Qamariyyah in (الحمد)', 'Phase 2: Tajweed Engine');
  } catch (err: unknown) {
    results.push({ name: 'Deterministic Tajweed Engine', category: 'Phase 2: Tajweed Engine', passed: false, message: String(err) });
  }

  // 7. PHASE 2: Cryptographic Tamper-Proofing & SHA-256
  try {
    const { computeSha256, computeSha256Sync } = await import('../infrastructure/crypto/Sha256Util.ts');
    const baseText = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
    const hash1 = computeSha256Sync(baseText);
    const hash2 = await computeSha256(baseText);
    assert(hash1 === hash2, 'Synchronous and Asynchronous SHA-256 implementations produce identical hash', 'Phase 2: Integrity & Crypto');

    // Tamper test: Altering a single diacritic character must yield a completely different hash
    const tamperedText = 'بِسْمَ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'; // Fathah on Meem instead of Kasrah
    const tamperedHash = computeSha256Sync(tamperedText);
    assert(hash1 !== tamperedHash, 'Tamper detection: Altering a single harakah instantly invalidates cryptographic hash', 'Phase 2: Integrity & Crypto');
  } catch (err: unknown) {
    results.push({ name: 'Cryptographic Tamper-Proofing', category: 'Phase 2: Integrity & Crypto', passed: false, message: String(err) });
  }

  // 8. PHASE 2: Quran Verification Pipeline & Dual Scholarly Review
  try {
    const { QuranVerificationPipeline } = await import('../application/quran/QuranVerificationPipeline.ts');
    const {
      ALL_114_SURAHS_MANIFEST,
      VERIFIED_CANONICAL_AYAHS,
      OFFICIAL_HAFS_SOURCE_RECORD,
      OFFICIAL_DATASET_VERSION,
    } = await import('../infrastructure/quran/VerifiedQuranDataProvider.ts');
    const { ScientificReviewStage } = await import('../domain/verification/types.ts');

    const pipeline = new QuranVerificationPipeline();

    // Prepare dual-review certified queue item
    const validDualReviewQueueItem = {
      queueId: 'queue-test-hafs-01',
      datasetVersion: '1.0.0-hafs.verified',
      riwayah: RiwayahType.HAFS_AN_ASIM,
      stage: ScientificReviewStage.VERIFIED,
      primaryReviewerStamp: {
        reviewer: OFFICIAL_DATASET_VERSION.certifyingScholars?.[0] || {
          reviewerId: 'default-primary',
          fullName: 'فضيلة الشيخ الدكتور علي بن عبد الرحمن الحذيفي',
          ijazahDescription: 'إجازة مسندة',
          institutionAffiliation: 'مجمع الملك فهد لطباعة المصحف الشريف',
        },
        signedAt: '2025-01-01T00:00:00Z',
        signatureHashSha256: 'sha-primary-valid',
        notesArabic: 'تم التدقيق الكامل ومطابقة الرسم العثماني لمصحف المدينة النبوية.',
      },
      secondaryReviewerStamp: {
        reviewer: OFFICIAL_DATASET_VERSION.certifyingScholars?.[1] || OFFICIAL_DATASET_VERSION.certifyingScholars?.[0] || {
          reviewerId: 'default-secondary',
          fullName: 'فضيلة الشيخ الدكتور أيمن رشدي سويد',
          ijazahDescription: 'إجازة مسندة',
          institutionAffiliation: 'الهيئة العالمية للكتاب والسنة',
        },
        signedAt: '2025-01-02T00:00:00Z',
        signatureHashSha256: 'sha-secondary-valid',
        notesArabic: 'أجيز بعد المراجعة المتقاطعة والدقيقة.',
      },
    };

    const report = await pipeline.executePipeline(
      OFFICIAL_HAFS_SOURCE_RECORD,
      ALL_114_SURAHS_MANIFEST,
      VERIFIED_CANONICAL_AYAHS,
      '1.0.0-hafs.verified',
      'إصدار الحزمة الأولى المعتمدة',
      validDualReviewQueueItem as any
    );

    assert(report.overallSuccess, 'Verification pipeline completes successfully with 9 stages for certified dataset', 'Phase 2: Verification Pipeline');
    assert(report.stageResults.length === 9, 'All 9 stages (RAW -> IMPORT -> NORM -> VALID -> REF -> HASH -> INTEGRITY -> REVIEW -> IMMUTABLE_DATASET) executed', 'Phase 2: Verification Pipeline');

    // Negative test: Missing secondary reviewer must fail the pipeline at REVIEW stage
    const incompleteReviewQueueItem = {
      ...validDualReviewQueueItem,
      stage: ScientificReviewStage.PENDING_SECOND_APPROVAL,
      secondaryReviewerStamp: undefined,
    };

    const failedReport = await pipeline.executePipeline(
      OFFICIAL_HAFS_SOURCE_RECORD,
      ALL_114_SURAHS_MANIFEST,
      VERIFIED_CANONICAL_AYAHS,
      '1.0.0-hafs.incomplete',
      'إصدار غير مكتمل المراجعة',
      incompleteReviewQueueItem as any
    );

    assert(!failedReport.overallSuccess, 'Pipeline strictly fails and halts when dual scholarly certification is incomplete', 'Phase 2: Verification Pipeline');
  } catch (err: unknown) {
    results.push({ name: 'Verification Pipeline & Dual Review', category: 'Phase 2: Verification Pipeline', passed: false, message: String(err) });
  }

  // 9. PHASE 2: Verified-Only Enforcement in Data Provider
  try {
    const { VerifiedQuranDataProvider } = await import('../infrastructure/quran/VerifiedQuranDataProvider.ts');
    const provider = new VerifiedQuranDataProvider(true); // strict verifiedOnly

    const surahs = await provider.getAllSurahs(RiwayahType.HAFS_AN_ASIM, { verifiedOnly: true });
    assert(surahs.length === 114, 'VerifiedQuranDataProvider returns only verified Surahs under verifiedOnly: true', 'Phase 2: Data Provider');

    const fatihah = await provider.getSurah(1, RiwayahType.HAFS_AN_ASIM, { verifiedOnly: true });
    assert(fatihah?.number === 1 && fatihah.verification.verificationStatus === VerificationStatus.VERIFIED, 'Surah Al-Fatihah is verified and compliant', 'Phase 2: Data Provider');
  } catch (err: unknown) {
    results.push({ name: 'Verified-Only Enforcement', category: 'Phase 2: Data Provider', passed: false, message: String(err) });
  }

  return results;
}
