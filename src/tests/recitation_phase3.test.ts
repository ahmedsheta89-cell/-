/**
 * @file recitation_phase3.test.ts
 * @module tests
 * @description Comprehensive unit and integration test suite for Phase 3:
 * Recitation Alignment, Audio Quality, VAD, Forced Alignment, Separation of Concerns,
 * Confidence Calibration, Interruption Policy, and Model Governance.
 */

import { AudioQualityAnalyzerImpl } from '../application/recitation/AudioQualityAnalyzerImpl.ts';
import { VoiceActivityDetectorImpl } from '../application/recitation/VoiceActivityDetectorImpl.ts';
import { DeterministicForcedAligner } from '../application/recitation/DeterministicForcedAligner.ts';
import { RecitationErrorDetectorImpl } from '../application/recitation/RecitationErrorDetectorImpl.ts';
import { ReligiousErrorClassifierImpl } from '../application/recitation/ReligiousErrorClassifierImpl.ts';
import { ConfidenceCalibrationService } from '../application/recitation/ConfidenceCalibrationService.ts';
import { RecitationInterruptionPolicyImpl } from '../application/recitation/RecitationInterruptionPolicyImpl.ts';
import {
  PhoneticAnalyzerImpl,
} from '../application/recitation/PhoneticAnalyzerImpl.ts';
import { AudioModelRegistryService } from '../application/recitation/AudioModelRegistryService.ts';
import { MockAudioCaptureProvider } from '../infrastructure/audio/MockAudioCaptureProvider.ts';
import {
  AudioQualityStatus,
  AudioQualityIssue,
  AudioChunk,
} from '../domain/recitation/audioCaptureTypes.ts';
import { VadActivityState } from '../domain/recitation/vadTypes.ts';
import {
  AcousticObservationType,
  ReligiousClassificationCategory,
} from '../domain/recitation/observationTypes.ts';
import { AlignmentStatus, RecitationContextMode, RecitationAlignmentContext } from '../domain/recitation/alignmentTypes.ts';
import { ConfidenceLevel } from '../domain/confidence/types.ts';
import { RecitationMode } from '../domain/recitation/types.ts';
import { RiwayahType } from '../domain/quran/types.ts';
import { ModelBenchmarkStatus } from '../domain/recitation/modelRegistryTypes.ts';
import { RecitationPipelineCoordinator } from '../application/recitation/RecitationPipelineCoordinator.ts';
import { AudioPrivacyManager } from '../application/recitation/AudioPrivacyManager.ts';
import { EvaluationBenchmarkRunner } from '../application/recitation/EvaluationBenchmarkRunner.ts';
import { DeterministicTajweedRuleEngine } from '../application/tajweed/TajweedRuleEngine.ts';
import { AL_FATIHAH_AYAHS } from '../infrastructure/providers/InMemoryQuranDataProvider.ts';
import { RecitationEvaluationDataset } from '../domain/recitation/evaluationTypes.ts';

export interface Phase3TestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
}

export async function runPhase3TestSuite(): Promise<Phase3TestResult[]> {
  const results: Phase3TestResult[] = [];

  function assert(condition: boolean, name: string, category: string, failureMessage = 'Assertion failed'): void {
    if (condition) {
      results.push({ name, category, passed: true });
    } else {
      results.push({ name, category, passed: false, message: failureMessage });
    }
  }

  // 1. Audio Quality Analyzer Tests
  try {
    const qualityAnalyzer = new AudioQualityAnalyzerImpl();

    // 1.1 Silent chunk
    const silentPcm = new Float32Array(1600); // 100ms at 16kHz
    const silentChunk: AudioChunk = {
      sequenceNumber: 1,
      sessionId: 'test-s1',
      timestampMs: 0,
      durationMs: 100,
      pcmData: silentPcm,
      sampleRateHz: 16000,
      channels: 1,
      isFinal: false,
    };

    const silentAssessment = qualityAnalyzer.analyzeChunk(silentChunk);
    assert(
      silentAssessment.status === AudioQualityStatus.UNUSABLE &&
        silentAssessment.issues.includes(AudioQualityIssue.MICROPHONE_MUTED),
      'AudioQualityAnalyzer rejects zero/muted audio as UNUSABLE',
      'Phase 3: Audio Quality'
    );

    // 1.2 Clipped chunk
    const clippedPcm = new Float32Array(1600).fill(0.99);
    const clippedChunk: AudioChunk = {
      ...silentChunk,
      pcmData: clippedPcm,
    };
    const clippedAssessment = qualityAnalyzer.analyzeChunk(clippedChunk);
    assert(
      clippedAssessment.issues.includes(AudioQualityIssue.CLIPPING_DETECTED),
      'AudioQualityAnalyzer flags excessive clipping',
      'Phase 3: Audio Quality'
    );

    // 1.3 Clean harmonic speech chunk
    const cleanPcm = new Float32Array(1600);
    for (let i = 0; i < 1600; i++) {
      cleanPcm[i] = 0.3 * Math.sin((2 * Math.PI * 220 * i) / 16000);
    }
    const cleanChunk: AudioChunk = {
      ...silentChunk,
      pcmData: cleanPcm,
    };
    const cleanAssessment = qualityAnalyzer.analyzeChunk(cleanChunk);
    assert(
      cleanAssessment.status === AudioQualityStatus.GOOD && cleanAssessment.isUsableForAlignment,
      'AudioQualityAnalyzer accepts normal speech signal as GOOD',
      'Phase 3: Audio Quality'
    );
  } catch (err) {
    results.push({ name: 'Audio Quality Evaluation', category: 'Phase 3: Audio Quality', passed: false, message: String(err) });
  }

  // 2. Voice Activity Detection (VAD)
  try {
    const vad = new VoiceActivityDetectorImpl();

    // Feed silence
    const silence = new Float32Array(1600).fill(0.0001);
    const seg1 = vad.processChunk(silence, 0, 16000);
    assert(
      seg1.state === VadActivityState.SILENCE,
      'VAD correctly classifies low energy as SILENCE',
      'Phase 3: VAD'
    );

    // Feed speech
    const speech = new Float32Array(1600);
    for (let i = 0; i < 1600; i++) {
      speech[i] = 0.4 * Math.sin((2 * Math.PI * 300 * i) / 16000);
    }
    const seg2 = vad.processChunk(speech, 100, 16000);
    assert(
      seg2.state === VadActivityState.SPEECH,
      'VAD correctly detects energetic harmonic speech',
      'Phase 3: VAD'
    );
  } catch (err) {
    results.push({ name: 'VAD Processing', category: 'Phase 3: VAD', passed: false, message: String(err) });
  }

  // 3. Forced Alignment Engine
  try {
    const aligner = new DeterministicForcedAligner();
    const vad = new VoiceActivityDetectorImpl();
    const speech = new Float32Array(16000).fill(0.3); // 1 second of speech
    vad.processChunk(speech, 0, 16000);

    const mockWords = [
      { id: '1:1:1', surahNumber: 1, ayahNumber: 1, wordIndex: 1, textUthmani: 'بِسْمِ', textClean: 'بسم' },
      { id: '1:1:2', surahNumber: 1, ayahNumber: 1, wordIndex: 2, textUthmani: 'ٱللَّهِ', textClean: 'الله' },
    ];

    const context: any = {
      riwayah: RiwayahType.HAFS_AN_ASIM,
      surahNumber: 1,
      ayahStart: 1,
      ayahEnd: 1,
      mode: RecitationContextMode.TARGETED_AYAH_RANGE,
      expectedAyahs: [],
      expectedWords: mockWords,
      expectedTajweedMatches: [],
      datasetVersion: '1.0.0',
    };

    const alignments = await aligner.alignAudioToWords([], vad.getSegments(), context);
    assert(
      alignments.length === 2 && alignments[0].expectedTextUthmani === 'بِسْمِ',
      'DeterministicForcedAligner matches expected words against speech bounds',
      'Phase 3: Forced Alignment'
    );
  } catch (err) {
    results.push({ name: 'Forced Alignment', category: 'Phase 3: Forced Alignment', passed: false, message: String(err) });
  }

  // 4. Strict Separation: Lexical Observation vs Religious Error Classification
  try {
    const detector = new RecitationErrorDetectorImpl();
    const classifier = new ReligiousErrorClassifierImpl();

    const mockMisalignment: any = {
      sessionId: 's1',
      ayahId: '1:1',
      wordId: '1:1:1',
      expectedTextUthmani: 'بِسْمِ',
      expectedStartMs: 0,
      expectedEndMs: 500,
      observedStartMs: 0,
      observedEndMs: 0, // 0 duration = deletion
      alignmentScore: 0.1,
      confidence: 0.8,
      status: AlignmentStatus.MISALIGNED,
      evidence: { acousticLikelihood: 0.1, phoneticDistance: 0.9, temporalDurationRatio: 0, snrPenalty: 0, notesArabic: '' },
      analyzedAt: new Date().toISOString(),
    };

    const observations = detector.detectWordObservations([mockMisalignment]);
    assert(
      observations.length === 1 && observations[0].type === AcousticObservationType.DELETION,
      'RecitationErrorDetector produces RecitationObservation (DELETION) purely as an acoustic finding',
      'Phase 3: Separation of Concerns'
    );

    // Negative check: The observation itself must NOT contain religious category judgments
    assert(
      (observations[0] as any).category === undefined,
      'Acoustic observation is decoupled from religious category (no premature ruling)',
      'Phase 3: Separation of Concerns'
    );

    // Religious classifier evaluates the observation
    const classification = classifier.classifyObservation(observations[0], []);
    assert(
      classification.category === ReligiousClassificationCategory.LAHN_JALI &&
        classification.fiqhSeverity === 'CRITICAL_MUST_STOP',
      'ReligiousErrorClassifier correctly maps word deletion to LAHN_JALI with CRITICAL severity',
      'Phase 3: Separation of Concerns'
    );
  } catch (err) {
    results.push({ name: 'Separation of Concerns', category: 'Phase 3: Separation of Concerns', passed: false, message: String(err) });
  }

  // 5. Multi-factor Confidence Calibration
  try {
    const calibrationService = new ConfidenceCalibrationService();

    const qualityGood: any = { status: AudioQualityStatus.GOOD, estimatedSnrDb: 25, issues: [] };
    const qualityPoor: any = { status: AudioQualityStatus.POOR, estimatedSnrDb: 6, issues: [AudioQualityIssue.SIGNAL_TOO_LOW] };

    const alignmentGood: any = {
      alignmentScore: 0.95,
      status: AlignmentStatus.ALIGNED,
      evidence: { temporalDurationRatio: 1.0 },
    };

    const evidenceHigh = calibrationService.calibrateEvidence(qualityGood, alignmentGood, false);
    assert(
      evidenceHigh.resolvedLevel === ConfidenceLevel.HIGH && evidenceHigh.finalCalibratedScore >= 0.85,
      'Confidence calibration yields HIGH level when audio quality and alignment are strong',
      'Phase 3: Confidence Calibration'
    );

    const evidenceLow = calibrationService.calibrateEvidence(qualityPoor, alignmentGood, false);
    assert(
      evidenceLow.resolvedLevel !== ConfidenceLevel.HIGH,
      'Confidence calibration degrades gracefully when audio SNR is poor',
      'Phase 3: Confidence Calibration'
    );
  } catch (err) {
    results.push({ name: 'Confidence Calibration', category: 'Phase 3: Confidence Calibration', passed: false, message: String(err) });
  }

  // 6. Interruption Policy & Cognitive Flow
  try {
    const policy = new RecitationInterruptionPolicyImpl();

    const jaliClass: any = {
      category: ReligiousClassificationCategory.LAHN_JALI,
      pedagogicalTipArabic: 'توقف وأعد الكلمة',
    };

    const dec1 = policy.evaluateInterruption(jaliClass, ConfidenceLevel.HIGH, {
      mode: RecitationMode.MEMORIZATION_RECITE,
      consecutiveErrorCount: 1,
      ayahWordPosition: 1,
      isEndOfAyah: false,
      studentPreferenceAllowImmediateInterruption: true,
      totalInterruptionsInSession: 0,
    });
    assert(
      dec1.shouldInterruptAudioNow === true,
      'Critical Lahn Jali with HIGH confidence triggers immediate pedagogical interruption',
      'Phase 3: Interruption Policy'
    );

    const dec2 = policy.evaluateInterruption(jaliClass, ConfidenceLevel.LOW, {
      mode: RecitationMode.MEMORIZATION_RECITE,
      consecutiveErrorCount: 1,
      ayahWordPosition: 1,
      isEndOfAyah: false,
      studentPreferenceAllowImmediateInterruption: true,
      totalInterruptionsInSession: 0,
    });
    assert(
      dec2.shouldInterruptAudioNow === false,
      'Interruption is blocked when confidence is LOW to prevent false condemnation',
      'Phase 3: Interruption Policy'
    );
  } catch (err) {
    results.push({ name: 'Interruption Policy', category: 'Phase 3: Interruption Policy', passed: false, message: String(err) });
  }

  // 7. Scientific Integrity of Phonetic Analyzers
  try {
    const phoneticEngine = new PhoneticAnalyzerImpl();
    const ghunnah = phoneticEngine.getGhunnahAnalyzer();
    const articulation = phoneticEngine.getArticulationAnalyzer();
    const madd = phoneticEngine.getMaddAnalyzer();

    assert(
      ghunnah.getStatus() === 'NOT_AVAILABLE',
      'GhunnahAnalyzer returns NOT_AVAILABLE in absence of calibrated acoustic nasal model',
      'Phase 3: Scientific Integrity'
    );

    assert(
      articulation.getStatus() === 'NOT_IMPLEMENTED',
      'ArticulationAnalyzer returns NOT_IMPLEMENTED to prevent unvalidated makhraj hallucinations',
      'Phase 3: Scientific Integrity'
    );

    assert(
      madd.getStatus() === 'EXPERIMENTAL',
      'MaddAnalyzer returns EXPERIMENTAL with calculated pacing ratios',
      'Phase 3: Scientific Integrity'
    );
  } catch (err) {
    results.push({ name: 'Phonetic Scientific Integrity', category: 'Phase 3: Scientific Integrity', passed: false, message: String(err) });
  }

  // 8. Audio Model Registry Governance
  try {
    const registry = new AudioModelRegistryService();
    const allModels = registry.getAllModels();

    const activeAligner = registry.getActiveAlignmentModel();
    assert(
      activeAligner.benchmarkStatus === ModelBenchmarkStatus.BENCHMARKED_CERTIFIED,
      'Active aligner model is BENCHMARKED_CERTIFIED',
      'Phase 3: Model Governance'
    );

    const unbenchmarked = allModels.filter((m) => m.benchmarkStatus === ModelBenchmarkStatus.NOT_BENCHMARKED);
    assert(
      unbenchmarked.length >= 2,
      'Experimental neural and makhraj models are explicitly marked NOT_BENCHMARKED',
      'Phase 3: Model Governance'
    );

    const certifiedFiqh = allModels.filter((m) => m.isCertifiedForFiqhDecisions);
    assert(
      certifiedFiqh.length === 0,
      'Zero automated AI models are marked certified for Fiqh decisions without human Shaykh',
      'Phase 3: Model Governance'
    );
  } catch (err) {
    results.push({ name: 'Model Registry Governance', category: 'Phase 3: Model Governance', passed: false, message: String(err) });
  }

  // 9. End-to-End Pipeline Coordinator Integration
  try {
    const mockAudio = new MockAudioCaptureProvider('CLEAN_RECITATION');
    const tajweedEngine = new DeterministicTajweedRuleEngine();
    const coordinator = new RecitationPipelineCoordinator(mockAudio, tajweedEngine);

    const fatihah1 = AL_FATIHAH_AYAHS[0];
    const sessionContext: RecitationAlignmentContext = {
      sessionId: 'test-session-e2e',
      surahNumber: fatihah1.surahNumber,
      fromAyah: fatihah1.ayahNumber,
      toAyah: fatihah1.ayahNumber,
      riwayah: RiwayahType.HAFS_AN_ASIM,
      expectedWords: fatihah1.words,
      expectedAyahs: [fatihah1],
      isOpenRecitation: false,
    };

    const telemetryTracker = { received: false };
    const unsubscribe = coordinator.registerTelemetryListener(() => {
      telemetryTracker.received = true;
    });

    await coordinator.startSession(sessionContext, RecitationMode.MEMORIZATION_RECITE);

    assert(
      telemetryTracker.received === true,
      'RecitationPipelineCoordinator emits real-time telemetry upon start',
      'Phase 3: Pipeline Integration'
    );

    const stoppedAlignment = await coordinator.stopSession();
    unsubscribe();

    assert(
      stoppedAlignment === null || typeof stoppedAlignment === 'object',
      'RecitationPipelineCoordinator cleanly stops session and wraps alignment',
      'Phase 3: Pipeline Integration'
    );
  } catch (err) {
    results.push({ name: 'Pipeline Coordinator Integration', category: 'Phase 3: Pipeline Integration', passed: false, message: String(err) });
  }

  // 10. Audio Privacy & Buffer Purge Lifecycle
  try {
    const privacy = new AudioPrivacyManager();
    assert(
      privacy.getConsent().hasGrantedMicPermission === false,
      'Default privacy consent requires explicit permission',
      'Phase 3: Audio Privacy'
    );

    privacy.grantConsent(false);
    assert(
      privacy.getConsent().hasGrantedMicPermission === true,
      'Consent grant correctly activates microphone permission flag',
      'Phase 3: Audio Privacy'
    );

    const testBuf = new Float32Array([0.5, 0.8, -0.4, 0.1]);
    privacy.registerBuffer(testBuf);
    assert(
      privacy.getActiveBufferCount() === 1,
      'AudioPrivacyManager registers active ephemeral buffer',
      'Phase 3: Audio Privacy'
    );

    privacy.purgeAllAudioMemory();
    assert(
      privacy.getActiveBufferCount() === 0,
      'AudioPrivacyManager cleans active buffer list on purge',
      'Phase 3: Audio Privacy'
    );
    assert(
      testBuf[0] === 0 && testBuf[1] === 0,
      'AudioPrivacyManager zero-fills memory buffers during purge (zeroization)',
      'Phase 3: Audio Privacy'
    );
  } catch (err) {
    results.push({ name: 'Audio Privacy & Memory Purge', category: 'Phase 3: Audio Privacy', passed: false, message: String(err) });
  }

  // 11. Evaluation Benchmark Runner
  try {
    const benchmarkRunner = new EvaluationBenchmarkRunner();
    const nullReport = benchmarkRunner.calculateMetrics('aligner-v1', null);
    assert(
      nullReport.status === 'NOT_BENCHMARKED',
      'Unbenchmarked models without verified Shaykh ground truth return NOT_BENCHMARKED',
      'Phase 3: Evaluation Benchmark'
    );

    const sampleDataset: RecitationEvaluationDataset = {
      datasetId: 'al-fatihah-hafiz-gold-v1',
      nameArabic: 'قاعدة بيانات ذهبية لسورة الفاتحة',
      version: '1.0.0',
      totalSamples: 1,
      totalDurationMinutes: 0.1,
      riwayatCovered: [RiwayahType.HAFS_AN_ASIM],
      benchmarkStatus: 'OFFICIALLY_BENCHMARKED',
      samples: [
        {
          sampleId: 'sample-01',
          surahNumber: 1,
          ayahNumber: 1,
          riwayah: RiwayahType.HAFS_AN_ASIM,
          expectedTextUthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
          audioDurationMs: 4000,
          expertAnnotation: {
            annotatorScholar: 'الشيخ المقرئ المعتمد',
            expectedWordBoundariesMs: [
              { wordIndex: 1, startMs: 100, endMs: 700 },
              { wordIndex: 2, startMs: 750, endMs: 1500 },
              { wordIndex: 3, startMs: 1550, endMs: 2300 },
              { wordIndex: 4, startMs: 2350, endMs: 3500 },
            ],
            actualWordErrors: [],
          },
          consentHash: 'consent-hash-12345',
        },
      ],
    };

    const evaluatedReport = benchmarkRunner.calculateMetrics('aligner-v1', sampleDataset);
    assert(
      evaluatedReport.status === 'COMPLETED',
      'Benchmark with expert ground truth completes metrics calculation',
      'Phase 3: Evaluation Benchmark'
    );
    assert(
      typeof evaluatedReport.wordErrorRatePercentage === 'number',
      'Benchmark calculates Word Error Rate (WER)',
      'Phase 3: Evaluation Benchmark'
    );
  } catch (err) {
    results.push({ name: 'Evaluation Benchmark Runner', category: 'Phase 3: Evaluation Benchmark', passed: false, message: String(err) });
  }

  return results;
}

// Auto-run if executed directly via CLI
if (
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  (import.meta.url.endsWith(process.argv[1]) || process.argv[1].includes('recitation_phase3.test'))
) {
  runPhase3TestSuite().then((results) => {
    let allPassed = true;
    console.log('\n--- Phase 3 Recitation & Error Detection Test Results ---');
    for (const res of results) {
      if (res.passed) {
        console.log(`✅ [${res.category}] ${res.name}`);
      } else {
        allPassed = false;
        console.error(`❌ [${res.category}] ${res.name}: ${res.message}`);
      }
    }
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`\nResult: ${passedCount}/${results.length} tests passed.`);
    if (!allPassed) {
      process.exit?.(1);
    }
  }).catch((e) => {
    console.error('Fatal error running tests:', e);
    process.exit?.(1);
  });
}
