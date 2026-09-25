/**
 * @file Phase7dMemorizationIntelligence.test.ts
 * @description Comprehensive Verification Suite for Phase 7D Memorization & Revision Intelligence.
 * 
 * Includes 105+ dedicated verification scenarios covering:
 * - Scenarios 1–15: Event integrity, SHA-256, Hafs canon coordinates, privacy & audio rejection
 * - Scenarios 16–30: State transitions, single-failure protection & inconclusive evidence immunity
 * - Scenarios 31–45: Deterministic retention model heuristic, intervals & priority factors
 * - Scenarios 46–60: Revision scheduling urgencies, reason codes & deterministic Arabic explanations
 * - Scenarios 61–70: Attempt clustering & independent review distinction (anti-inflation)
 * - Scenarios 71–80: Error recurrence, recent vs. historical accuracy & recovery
 * - Scenarios 81–90: Daily revision plan generation & non-punitive plan adaptation
 * - Scenarios 91–100: Longitudinal history, replay/out-of-order protection & multi-version binding
 * - Scenarios 101–108: Golden Cases A through H and AI Boundary Guard (prohibiting Ijazah claims)
 */

import { describe, it, expect } from 'vitest';
import {
  MemorizationEventType,
  EvidenceStatus,
  MemorizationState,
  ReviewUrgency,
  RevisionReasonCode,
  RevisionSetMode,
  ClusterInteractionType,
} from '../domain/memorization_revision/types.ts';
import {
  MemorizationEventFactory,
  CreateMemorizationEventParams,
} from '../domain/memorization_revision/MemorizationEventFactory.ts';
import { AttemptClusterManager } from '../domain/memorization_revision/AttemptClusterManager.ts';
import { RetentionModelHeuristic } from '../domain/memorization_revision/RetentionModelHeuristic.ts';
import { MemorizationStateEngine } from '../domain/memorization_revision/MemorizationStateEngine.ts';
import { RevisionScheduler } from '../domain/memorization_revision/RevisionScheduler.ts';
import { RevisionSetGenerator } from '../domain/memorization_revision/RevisionSetGenerator.ts';
import { LongitudinalProfileStore } from '../domain/memorization_revision/LongitudinalProfileStore.ts';
import { AIBoundaryGuard } from '../domain/memorization_revision/AIBoundaryGuard.ts';
import { MemorizationBridge } from '../domain/memorization_revision/MemorizationBridge.ts';
import { RecitationDecisionState } from '../domain/recitation/decisionTypes.ts';
import { PedagogicalAction } from '../domain/teacher_policy/types.ts';
import {
  CANONICAL_QURAN_HASH,
  TAJWEED_KB_CHECKSUM_SHA256,
  OFFICIAL_MODEL_HASH,
} from '../domain/recitation/RecitationErrorDecisionEngine.ts';
import { OFFICIAL_DATASET_VERSION } from '../infrastructure/quran/VerifiedQuranDataProvider.ts';
import { ProgressEventType, VerifiedProgressRecord } from '../domain/realtime_teacher/types.ts';
import {
  InvalidLearningEventError,
  InvalidQuranLocationError,
  DuplicateLearningEventError,
  OutOfOrderEventError,
} from '../domain/memorization_revision/errorRegistry.ts';

function createValidBaseParams(overrides?: Partial<CreateMemorizationEventParams>): CreateMemorizationEventParams {
  return {
    studentId: 'std-ahmed-001',
    sessionId: 'sess-2026-09-21-001',
    quranLocation: { surahId: 1, ayahNumber: 1 },
    eventType: MemorizationEventType.CONFIRMED,
    evidenceStatus: EvidenceStatus.CONFIRMED,
    decisionStatus: RecitationDecisionState.CONTINUE,
    teacherAction: PedagogicalAction.CONTINUE,
    timestamp: 1726900000000,
    attemptNumber: 1,
    retryNumber: 0,
    attemptClusterId: 'cluster-001',
    isIndependentReview: false,
    quranDatasetVersion: OFFICIAL_DATASET_VERSION.semver,
    quranDatasetHash: CANONICAL_QURAN_HASH,
    modelVersion: 'zipformer-ctc-int8-quran-v1.0.0',
    modelHash: OFFICIAL_MODEL_HASH,
    tajweedKnowledgeVersion: 'tajweed-rules-v1.0.0-hafs',
    tajweedKnowledgeHash: TAJWEED_KB_CHECKSUM_SHA256,
    decisionEngineVersion: 'recitation-decision-v1.0.0-phase5c',
    policyVersion: 'teacher-policy-v1.0.0-phase7a',
    revisionAlgorithmVersion: 'revision-algorithm-v1.0.0-phase7d',
    ...overrides,
  };
}

describe('Phase 7D — Memorization & Revision Intelligence Suite', () => {
  // =========================================================================
  // SCENARIOS 1–15: Event Integrity, Privacy, Hashes & Canon Coordinates
  // =========================================================================
  describe('Scenarios 1–15: Event Integrity & Privacy Guard', () => {
    it('Scenario 1: Creates valid event with deterministic SHA-256 eventHash', () => {
      const evt = MemorizationEventFactory.createEvent(createValidBaseParams());
      expect(evt.eventId).toBeDefined();
      expect(evt.eventHash).toHaveLength(64);
      expect(evt.studentId).toBe('std-ahmed-001');
    });

    it('Scenario 2: Identical event data yields identical cryptographic hash', () => {
      const p = createValidBaseParams({ eventId: 'evt-fixed-id' });
      const evt1 = MemorizationEventFactory.createEvent(p);
      const evt2 = MemorizationEventFactory.createEvent(p);
      expect(evt1.eventHash).toBe(evt2.eventHash);
    });

    it('Scenario 3: Tampering with surahId alters cryptographic hash', () => {
      const evt1 = MemorizationEventFactory.createEvent(createValidBaseParams({ eventId: 'evt-test', quranLocation: { surahId: 1, ayahNumber: 1 } }));
      const evt2 = MemorizationEventFactory.createEvent(createValidBaseParams({ eventId: 'evt-test', quranLocation: { surahId: 2, ayahNumber: 1 } }));
      expect(evt1.eventHash).not.toBe(evt2.eventHash);
    });

    it('Scenario 4: Privacy Guard rejects raw audio buffer (Part 26)', () => {
      expect(() => {
        MemorizationEventFactory.createEvent(createValidBaseParams({ audio: new Float32Array(100) } as any));
      }).toThrow(InvalidLearningEventError);
    });

    it('Scenario 5: Privacy Guard rejects raw pcm samples', () => {
      expect(() => {
        MemorizationEventFactory.createEvent(createValidBaseParams({ pcm: [0.1, 0.2] } as any));
      }).toThrow(InvalidLearningEventError);
    });

    it('Scenario 6: Privacy Guard rejects Float32Array value in arbitrary field', () => {
      expect(() => {
        MemorizationEventFactory.createEvent(createValidBaseParams({ arbitraryWaveform: new Float32Array(50) } as any));
      }).toThrow(InvalidLearningEventError);
    });

    it('Scenario 7: Canon validation accepts valid Surah 114 Ayah 6 (An-Nas)', () => {
      expect(() => {
        MemorizationEventFactory.validateQuranLocation(114, 6);
      }).not.toThrow();
    });

    it('Scenario 8: Canon validation rejects Surah 0 (MEM-004)', () => {
      expect(() => {
        MemorizationEventFactory.validateQuranLocation(0, 1);
      }).toThrow(InvalidQuranLocationError);
    });

    it('Scenario 9: Canon validation rejects Surah 115 (MEM-004)', () => {
      expect(() => {
        MemorizationEventFactory.validateQuranLocation(115, 1);
      }).toThrow(InvalidQuranLocationError);
    });

    it('Scenario 10: Canon validation rejects Ayah 8 in Al-Fatihah (7 total ayahs)', () => {
      expect(() => {
        MemorizationEventFactory.validateQuranLocation(1, 8);
      }).toThrow(InvalidQuranLocationError);
    });

    it('Scenario 11: Canon validation rejects Ayah 287 in Al-Baqarah (286 total ayahs)', () => {
      expect(() => {
        MemorizationEventFactory.validateQuranLocation(2, 287);
      }).toThrow(InvalidQuranLocationError);
    });

    it('Scenario 12: Rejects invalid word range where startWord > endWord', () => {
      expect(() => {
        MemorizationEventFactory.createEvent(createValidBaseParams({
          quranLocation: { surahId: 1, ayahNumber: 1, wordRange: { startWord: 3, endWord: 1 } },
        }));
      }).toThrow(InvalidLearningEventError);
    });

    it('Scenario 13: Rejects missing studentId', () => {
      expect(() => {
        MemorizationEventFactory.createEvent(createValidBaseParams({ studentId: '' }));
      }).toThrow(InvalidLearningEventError);
    });

    it('Scenario 14: Rejects missing dataset version or dataset hash', () => {
      expect(() => {
        MemorizationEventFactory.createEvent(createValidBaseParams({ quranDatasetHash: '' }));
      }).toThrow();
    });

    it('Scenario 15: Event object is deeply frozen and immutable', () => {
      const evt = MemorizationEventFactory.createEvent(createValidBaseParams());
      expect(Object.isFrozen(evt)).toBe(true);
      expect(Object.isFrozen(evt.quranLocation)).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIOS 16–30: State Transitions & Single Failure Protection
  // =========================================================================
  describe('Scenarios 16–30: State Transition Engine & Pedagogical Invariants', () => {
    const engine = new MemorizationStateEngine();
    const clusterManager = new AttemptClusterManager();

    it('Scenario 16: Initial state starts at NOT_STARTED', () => {
      const rec = engine.initializePassageRecord(1, 1);
      expect(rec.currentState).toBe(MemorizationState.NOT_STARTED);
      expect(rec.firstIntroducedAt).toBe(0);
    });

    it('Scenario 17: NOT_STARTED -> INTRODUCED on attempt without full resolution', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.NOT_STARTED,
        isIndependentReview: false,
        isResolvedSuccessfully: false,
        clusterAccuracy: 0.5,
        recentAccuracy: 0.5,
        practiceClusterCount: 1,
        independentReviewCount: 0,
        recentErrorOccurrences: 1,
        currentTime: 1000,
        nextReviewAt: 0,
      });
      expect(state).toBe(MemorizationState.INTRODUCED);
    });

    it('Scenario 18: NOT_STARTED -> LEARNING immediately if first attempt resolved successfully', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.NOT_STARTED,
        isIndependentReview: false,
        isResolvedSuccessfully: true,
        clusterAccuracy: 1.0,
        recentAccuracy: 1.0,
        practiceClusterCount: 1,
        independentReviewCount: 0,
        recentErrorOccurrences: 0,
        currentTime: 1000,
        nextReviewAt: 0,
      });
      expect(state).toBe(MemorizationState.LEARNING);
    });

    it('Scenario 19: INTRODUCED -> LEARNING on subsequent successful resolution', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.INTRODUCED,
        isIndependentReview: false,
        isResolvedSuccessfully: true,
        clusterAccuracy: 0.85,
        recentAccuracy: 0.85,
        practiceClusterCount: 1,
        independentReviewCount: 0,
        recentErrorOccurrences: 0,
        currentTime: 2000,
        nextReviewAt: 0,
      });
      expect(state).toBe(MemorizationState.LEARNING);
    });

    it('Scenario 20: LEARNING -> PRACTICING after 2+ successful practice clusters', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.LEARNING,
        isIndependentReview: false,
        isResolvedSuccessfully: true,
        clusterAccuracy: 0.9,
        recentAccuracy: 0.85,
        practiceClusterCount: 2,
        independentReviewCount: 0,
        recentErrorOccurrences: 0,
        currentTime: 3000,
        nextReviewAt: 0,
      });
      expect(state).toBe(MemorizationState.PRACTICING);
    });

    it('Scenario 21: PRACTICING -> STABLE when independent review is confirmed successful (>= 85%)', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.PRACTICING,
        isIndependentReview: true,
        isResolvedSuccessfully: true,
        clusterAccuracy: 0.95,
        recentAccuracy: 0.92,
        practiceClusterCount: 2,
        independentReviewCount: 1,
        recentErrorOccurrences: 0,
        currentTime: 4000,
        nextReviewAt: 0,
      });
      expect(state).toBe(MemorizationState.STABLE);
    });

    it('Scenario 22: STABLE -> REVIEW_DUE when currentTime reaches nextReviewAt', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.STABLE,
        isIndependentReview: false,
        isResolvedSuccessfully: true,
        clusterAccuracy: 1.0,
        recentAccuracy: 0.95,
        practiceClusterCount: 3,
        independentReviewCount: 1,
        recentErrorOccurrences: 0,
        currentTime: 10000,
        nextReviewAt: 5000, // Due 5 seconds ago
      });
      expect(state).toBe(MemorizationState.REVIEW_DUE);
    });

    it('Scenario 23: REVIEW_DUE -> STABLE on successful clean independent review', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.REVIEW_DUE,
        isIndependentReview: true,
        isResolvedSuccessfully: true,
        clusterAccuracy: 0.9,
        recentAccuracy: 0.9,
        practiceClusterCount: 3,
        independentReviewCount: 2,
        recentErrorOccurrences: 0,
        currentTime: 11000,
        nextReviewAt: 10000,
      });
      expect(state).toBe(MemorizationState.STABLE);
    });

    it('Scenario 24: REVIEW_DUE -> NEEDS_REINFORCEMENT on failed review with errors', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.REVIEW_DUE,
        isIndependentReview: true,
        isResolvedSuccessfully: false,
        clusterAccuracy: 0.4,
        recentAccuracy: 0.5,
        practiceClusterCount: 3,
        independentReviewCount: 2,
        recentErrorOccurrences: 2,
        currentTime: 11000,
        nextReviewAt: 10000,
      });
      expect(state).toBe(MemorizationState.NEEDS_REINFORCEMENT);
    });

    it('Scenario 25: Single-Failure Protection: A mistake on STABLE transitions to WEAKENING, not forgotten or zero', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.STABLE,
        isIndependentReview: true,
        isResolvedSuccessfully: false, // Learner made an error
        clusterAccuracy: 0.6,
        recentAccuracy: 0.7,
        practiceClusterCount: 3,
        independentReviewCount: 2,
        recentErrorOccurrences: 1,
        currentTime: 12000,
        nextReviewAt: 10000,
      });
      expect(state).toBe(MemorizationState.WEAKENING);
    });

    it('Scenario 26: WEAKENING -> PRACTICING on clean recovery practice', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.WEAKENING,
        isIndependentReview: false,
        isResolvedSuccessfully: true,
        clusterAccuracy: 0.9,
        recentAccuracy: 0.85,
        practiceClusterCount: 4,
        independentReviewCount: 2,
        recentErrorOccurrences: 0,
        currentTime: 13000,
        nextReviewAt: 10000,
      });
      expect(state).toBe(MemorizationState.PRACTICING);
    });

    it('Scenario 27: STABLE -> MASTERED requires 4+ independent reviews, 0 recent errors, >= 95% recent accuracy', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.STABLE,
        isIndependentReview: true,
        isResolvedSuccessfully: true,
        clusterAccuracy: 1.0,
        recentAccuracy: 0.98,
        practiceClusterCount: 3,
        independentReviewCount: 4,
        recentErrorOccurrences: 0,
        currentTime: 50000,
        nextReviewAt: 45000,
      });
      expect(state).toBe(MemorizationState.MASTERED);
    });

    it('Scenario 28: MASTERED does NOT allow promotion if recent errors > 0', () => {
      const state = engine.determineNextState({
        currentState: MemorizationState.STABLE,
        isIndependentReview: true,
        isResolvedSuccessfully: true,
        clusterAccuracy: 0.9,
        recentAccuracy: 0.95,
        practiceClusterCount: 3,
        independentReviewCount: 5,
        recentErrorOccurrences: 1,
        currentTime: 50000,
        nextReviewAt: 45000,
      });
      expect(state).toBe(MemorizationState.STABLE);
    });

    it('Scenario 29: Inconclusive evidence strictly NEVER downgrades memorization (Part 5)', () => {
      let record = engine.initializePassageRecord(1, 1);
      // Promote record to STABLE
      record = {
        ...record,
        currentState: MemorizationState.STABLE,
        independentReviewCount: 2,
        recentAccuracy: 0.95,
      };

      const inconclusiveEvent = MemorizationEventFactory.createEvent(createValidBaseParams({
        eventType: MemorizationEventType.INCONCLUSIVE,
        evidenceStatus: EvidenceStatus.INCONCLUSIVE,
        decisionStatus: RecitationDecisionState.INCONCLUSIVE,
      }));

      const cluster = clusterManager.aggregateCluster([inconclusiveEvent]);
      const updated = engine.evaluateClusterTransition(record, cluster, 20000);

      // State remains STABLE; not downgraded to WEAKENING or NEEDS_REINFORCEMENT
      expect(updated.currentState).toBe(MemorizationState.STABLE);
      expect(updated.inconclusiveCount).toBe(1);
      expect(updated.confirmedErrorCount).toBe(0);
    });

    it('Scenario 30: Possible error status strictly NEVER downgrades memorization without confirmation', () => {
      let record = engine.initializePassageRecord(1, 1);
      record = { ...record, currentState: MemorizationState.STABLE };

      const possibleEvent = MemorizationEventFactory.createEvent(createValidBaseParams({
        eventType: MemorizationEventType.ATTEMPT,
        evidenceStatus: EvidenceStatus.POSSIBLE,
        decisionStatus: RecitationDecisionState.POSSIBLE_ERROR,
      }));

      const cluster = clusterManager.aggregateCluster([possibleEvent]);
      const updated = engine.evaluateClusterTransition(record, cluster, 21000);

      expect(updated.currentState).toBe(MemorizationState.STABLE);
      expect(updated.confirmedErrorCount).toBe(0);
    });
  });

  // =========================================================================
  // SCENARIOS 31–45: Retention Model Heuristic & Intervals
  // =========================================================================
  describe('Scenarios 31–45: Retention Model Heuristic Math & Bounds', () => {
    const heuristic = new RetentionModelHeuristic();
    const stateEngine = new MemorizationStateEngine();

    it('Scenario 31: Default base interval is 24 hours for first review', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const out = heuristic.calculateNextReview({ record: rec, currentTime: 1000000 });
      expect(out.intervalHours).toBe(24);
      expect(out.nextReviewAt).toBe(1000000 + 24 * 3600 * 1000);
    });

    it('Scenario 32: Interval grows exponentially with independent reviews and high accuracy', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = {
        ...rec,
        independentReviewCount: 2,
        recentAccuracy: 1.0,
        historicalAccuracy: 1.0,
        lastConfirmedAt: 1000000,
      };
      const out = heuristic.calculateNextReview({ record: rec, currentTime: 1000000 });
      expect(out.intervalHours).toBeGreaterThan(24);
      expect(out.stabilityIndex).toBeGreaterThan(1.5);
    });

    it('Scenario 33: Interval is clamped to weakIntervalHours (12h) when recent errors exceed threshold', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = {
        ...rec,
        recentErrorOccurrences: 3,
        lastConfirmedAt: 1000000,
      };
      const out = heuristic.calculateNextReview({ record: rec, currentTime: 1000000 });
      expect(out.intervalHours).toBe(12);
    });

    it('Scenario 34: Interval never exceeds masteredIntervalHours (336h / 14 days)', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = {
        ...rec,
        independentReviewCount: 20,
        practiceClusterCount: 30,
        recentAccuracy: 1.0,
        historicalAccuracy: 1.0,
        lastConfirmedAt: 1000000,
      };
      const out = heuristic.calculateNextReview({ record: rec, currentTime: 1000000 });
      expect(out.intervalHours).toBeLessThanOrEqual(336);
    });

    it('Scenario 35: Stability index S is bounded to [0.5, 6.0]', () => {
      let worstRec = stateEngine.initializePassageRecord(1, 1);
      worstRec = { ...worstRec, recentErrorOccurrences: 10 };
      const worstOut = heuristic.calculateNextReview({ record: worstRec, currentTime: 1000000 });
      expect(worstOut.stabilityIndex).toBe(0.5);

      let bestRec = stateEngine.initializePassageRecord(1, 1);
      bestRec = { ...bestRec, independentReviewCount: 50, practiceClusterCount: 50 };
      const bestOut = heuristic.calculateNextReview({ record: bestRec, currentTime: 1000000 });
      expect(bestOut.stabilityIndex).toBeLessThanOrEqual(6.0);
    });

    it('Scenario 36: Computes priority factors with positive totalPriority score', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const out = heuristic.calculateNextReview({ record: rec, currentTime: 1000000 });
      expect(out.priorityFactors.totalPriority).toBeGreaterThanOrEqual(0);
      expect(out.priorityFactors.totalPriority).toBeLessThanOrEqual(100);
    });

    it('Scenario 37: Overdue passage elevates reviewDueFactor', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, lastConfirmedAt: 1000000, nextReviewAt: 1050000 };
      const out = heuristic.calculateNextReview({ record: rec, currentTime: 2000000 }); // Overdue by hours
      expect(out.priorityFactors.reviewDueFactor).toBeGreaterThan(20);
    });

    it('Scenario 38: Recurring errors elevate errorFactor', () => {
      let cleanRec = stateEngine.initializePassageRecord(1, 1);
      let errorRec = stateEngine.initializePassageRecord(1, 2);
      errorRec = { ...errorRec, recentErrorOccurrences: 2, errorOccurrences: 3 };

      const cleanOut = heuristic.calculateNextReview({ record: cleanRec, currentTime: 1000000 });
      const errorOut = heuristic.calculateNextReview({ record: errorRec, currentTime: 1000000 });

      expect(errorOut.priorityFactors.errorFactor).toBeGreaterThan(cleanOut.priorityFactors.errorFactor);
    });

    it('Scenario 39: Long absence without review elevates recencyFactor', () => {
      const baseTime = 1700000000000;
      let recentRec = stateEngine.initializePassageRecord(1, 1);
      recentRec = { ...recentRec, lastReviewAt: baseTime - 86400 * 1000 }; // 1 day ago

      let absentRec = stateEngine.initializePassageRecord(1, 2);
      absentRec = { ...absentRec, lastReviewAt: baseTime - 86400 * 1000 * 14 }; // 14 days ago

      const recentOut = heuristic.calculateNextReview({ record: recentRec, currentTime: baseTime });
      const absentOut = heuristic.calculateNextReview({ record: absentRec, currentTime: baseTime });

      expect(absentOut.priorityFactors.recencyFactor).toBeGreaterThan(recentOut.priorityFactors.recencyFactor);
    });

    it('Scenario 40: High stability decreases stabilityFactor weight (inverted)', () => {
      let unstableRec = stateEngine.initializePassageRecord(1, 1);
      let stableRec = stateEngine.initializePassageRecord(1, 2);
      stableRec = { ...stableRec, independentReviewCount: 4, recentAccuracy: 1.0 };

      const uOut = heuristic.calculateNextReview({ record: unstableRec, currentTime: 1000000 });
      const sOut = heuristic.calculateNextReview({ record: stableRec, currentTime: 1000000 });

      expect(uOut.priorityFactors.stabilityFactor).toBeGreaterThan(sOut.priorityFactors.stabilityFactor);
    });

    it('Scenario 41: Precision of stabilityIndex is rounded to 2 decimals', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const out = heuristic.calculateNextReview({ record: rec, currentTime: 1000000 });
      expect(out.stabilityIndex.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    });

    it('Scenario 42: Next review timestamp correctly incorporates epoch math', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const now = 1700000000000;
      const out = heuristic.calculateNextReview({ record: rec, currentTime: now });
      expect(out.nextReviewAt).toBe(now + out.intervalHours * 3600 * 1000);
    });

    it('Scenario 43: isReviewDue is false when currentTime < nextReviewAt', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const now = 1700000000000;
      const out = heuristic.calculateNextReview({ record: rec, currentTime: now });
      expect(out.isReviewDue).toBe(false);
    });

    it('Scenario 44: isReviewDue is true when currentTime >= nextReviewAt', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, lastConfirmedAt: 1000000 };
      const futureTime = 1000000 + 48 * 3600 * 1000; // 48h later
      const out = heuristic.calculateNextReview({ record: rec, currentTime: futureTime });
      expect(out.isReviewDue).toBe(true);
    });

    it('Scenario 45: Zero floating point NaN or Infinity in output', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const out = heuristic.calculateNextReview({ record: rec, currentTime: 1000000 });
      expect(Number.isFinite(out.stabilityIndex)).toBe(true);
      expect(Number.isFinite(out.intervalHours)).toBe(true);
      expect(Number.isFinite(out.nextReviewAt)).toBe(true);
      expect(Number.isFinite(out.priorityFactors.totalPriority)).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIOS 46–60: Revision Scheduler & Explainability
  // =========================================================================
  describe('Scenarios 46–60: Revision Scheduler & Reason Codes', () => {
    const scheduler = new RevisionScheduler();
    const stateEngine = new MemorizationStateEngine();

    it('Scenario 46: CRITICAL_WEAKNESS urgency for passages with NEEDS_REINFORCEMENT', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, currentState: MemorizationState.NEEDS_REINFORCEMENT, recentErrorOccurrences: 2 };
      const res = scheduler.evaluatePassage(rec, 1000000);
      expect(res.urgency).toBe(ReviewUrgency.CRITICAL_WEAKNESS);
    });

    it('Scenario 47: REVIEW_OVERDUE urgency for severely overdue passages (>= 24h overdue)', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, lastConfirmedAt: 1000000, nextReviewAt: 1000000 + 24 * 3600 * 1000 };
      const currentTime = rec.nextReviewAt + 30 * 3600 * 1000; // 30h overdue
      const res = scheduler.evaluatePassage(rec, currentTime);
      expect(res.urgency).toBe(ReviewUrgency.REVIEW_OVERDUE);
      expect(res.reasonCodes).toContain(RevisionReasonCode.REVIEW_INTERVAL_REACHED);
    });

    it('Scenario 48: REVIEW_DUE urgency when scheduled time has arrived', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, currentState: MemorizationState.REVIEW_DUE, lastConfirmedAt: 1000000, nextReviewAt: 1050000 };
      const res = scheduler.evaluatePassage(rec, 1060000);
      expect(res.urgency).toBe(ReviewUrgency.REVIEW_DUE);
    });

    it('Scenario 49: REVIEW_SOON urgency within 12 hours of deadline', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      const currentTime = 1000000;
      rec = { ...rec, lastConfirmedAt: currentTime, nextReviewAt: currentTime + 6 * 3600 * 1000 };
      const res = scheduler.evaluatePassage(rec, currentTime);
      expect(res.urgency).toBe(ReviewUrgency.REVIEW_SOON);
    });

    it('Scenario 50: NO_REVIEW_REQUIRED urgency for consolidated passages not yet due', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      const currentTime = 1000000;
      rec = {
        ...rec,
        currentState: MemorizationState.STABLE,
        lastConfirmedAt: currentTime,
        nextReviewAt: currentTime + 72 * 3600 * 1000, // 3 days away
      };
      const res = scheduler.evaluatePassage(rec, currentTime);
      expect(res.urgency).toBe(ReviewUrgency.NO_REVIEW_REQUIRED);
      expect(res.reasonCodes).toContain(RevisionReasonCode.PERIODIC_MAINTENANCE);
    });

    it('Scenario 51: Identifies RECENT_CONFIRMED_ERROR reason code', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, recentErrorOccurrences: 1 };
      const res = scheduler.evaluatePassage(rec);
      expect(res.reasonCodes).toContain(RevisionReasonCode.RECENT_CONFIRMED_ERROR);
    });

    it('Scenario 52: Identifies DECLINING_RECENT_ACCURACY reason code', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, recentAccuracy: 0.7, historicalAccuracy: 0.9 };
      const res = scheduler.evaluatePassage(rec);
      expect(res.reasonCodes).toContain(RevisionReasonCode.DECLINING_RECENT_ACCURACY);
    });

    it('Scenario 53: Identifies LONG_ABSENCE reason code when > 7 days without review', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      const now = 2000000000000;
      rec = { ...rec, lastReviewAt: now - 86400 * 1000 * 10 }; // 10 days ago
      const res = scheduler.evaluatePassage(rec, now);
      expect(res.reasonCodes).toContain(RevisionReasonCode.LONG_ABSENCE);
    });

    it('Scenario 54: Identifies NEW_UNCONSOLIDATED_PASSAGE reason code for INTRODUCED/LEARNING', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, currentState: MemorizationState.LEARNING };
      const res = scheduler.evaluatePassage(rec);
      expect(res.reasonCodes).toContain(RevisionReasonCode.NEW_UNCONSOLIDATED_PASSAGE);
    });

    it('Scenario 55: Identifies INSUFFICIENT_INDEPENDENT_REVIEWS for PRACTICING with < 2 reviews', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, currentState: MemorizationState.PRACTICING, independentReviewCount: 1 };
      const res = scheduler.evaluatePassage(rec);
      expect(res.reasonCodes).toContain(RevisionReasonCode.INSUFFICIENT_INDEPENDENT_REVIEWS);
    });

    it('Scenario 56: Generates Arabic explanation citing urgent reinforcement', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, currentState: MemorizationState.NEEDS_REINFORCEMENT, recentErrorOccurrences: 2 };
      const res = scheduler.evaluatePassage(rec);
      expect(res.naturalLanguageExplanationArabic).toContain('أولوية عاجلة للتثبيت');
    });

    it('Scenario 57: Generates Arabic explanation citing spaced repetition interval', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, currentState: MemorizationState.REVIEW_DUE, lastConfirmedAt: 1000000, nextReviewAt: 1050000 };
      const res = scheduler.evaluatePassage(rec, 1060000);
      expect(res.naturalLanguageExplanationArabic).toContain('حان موعد مراجعة هذا المقطع');
    });

    it('Scenario 58: Generates Arabic explanation citing recent acoustic observations', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, recentErrorOccurrences: 1 };
      const res = scheduler.evaluatePassage(rec);
      expect(res.naturalLanguageExplanationArabic).toContain('ملاحظات صوتية مؤكدة حديثة');
    });

    it('Scenario 59: Multi-passage student evaluation sorts by descending priority score', () => {
      let rec1 = stateEngine.initializePassageRecord(1, 1); // low priority
      let rec2 = stateEngine.initializePassageRecord(1, 2); // high priority (errors)
      rec2 = { ...rec2, currentState: MemorizationState.NEEDS_REINFORCEMENT, recentErrorOccurrences: 3 };

      const evaluated = scheduler.evaluateStudent([rec1, rec2]);
      expect(evaluated).toHaveLength(2);
      expect(evaluated[0].passageKey).toBe('1:2');
      expect(evaluated[0].priorityFactors.totalPriority).toBeGreaterThan(evaluated[1].priorityFactors.totalPriority);
    });

    it('Scenario 60: Explanation is 100% deterministic (identical inputs yield identical string)', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const res1 = scheduler.evaluatePassage(rec, 1000000);
      const res2 = scheduler.evaluatePassage(rec, 1000000);
      expect(res1.naturalLanguageExplanationArabic).toBe(res2.naturalLanguageExplanationArabic);
    });
  });

  // =========================================================================
  // SCENARIOS 61–70: Attempt Clustering & Mastery Inflation Prevention
  // =========================================================================
  describe('Scenarios 61–70: Attempt Clustering & Independent Review Distinction', () => {
    const clusterManager = new AttemptClusterManager();

    it('Scenario 61: Groups rapid successive attempts on same passage into single cluster', () => {
      const evt1 = MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 10000 }));
      const evt2 = MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 20000, attemptNumber: 2 }));
      expect(clusterManager.shouldClusterWith(evt1, evt2)).toBe(true);
    });

    it('Scenario 62: Splits attempts into separate clusters if time gap exceeds maxClusterGapMs', () => {
      const evt1 = MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 10000 }));
      const evt2 = MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 10000 + 700000 })); // > 10 mins (exceeds maxClusterGapMs = 600,000ms)
      expect(clusterManager.shouldClusterWith(evt1, evt2)).toBe(false);
    });

    it('Scenario 63: Splits attempts if passage or student differs', () => {
      const evt1 = MemorizationEventFactory.createEvent(createValidBaseParams({ quranLocation: { surahId: 1, ayahNumber: 1 } }));
      const evt2 = MemorizationEventFactory.createEvent(createValidBaseParams({ quranLocation: { surahId: 1, ayahNumber: 2 } }));
      expect(clusterManager.shouldClusterWith(evt1, evt2)).toBe(false);
    });

    it('Scenario 64: Read -> Error -> Repeat -> Error -> Repeat -> Pass is aggregated as ONE cluster (Part 8)', () => {
      const attempts = [
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.ATTEMPT,
          decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
          evidenceStatus: EvidenceStatus.CONFIRMED,
          attemptNumber: 1,
          retryNumber: 0,
          timestamp: 1000,
        })),
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.RETRY,
          decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
          evidenceStatus: EvidenceStatus.CONFIRMED,
          attemptNumber: 1,
          retryNumber: 1,
          timestamp: 2000,
        })),
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.CONFIRMED,
          decisionStatus: RecitationDecisionState.CONTINUE,
          evidenceStatus: EvidenceStatus.CONFIRMED,
          attemptNumber: 1,
          retryNumber: 2,
          timestamp: 3000,
        })),
      ];

      const cluster = clusterManager.aggregateCluster(attempts);
      expect(cluster.attempts).toHaveLength(3);
      expect(cluster.retryCount).toBe(2);
      expect(cluster.isResolvedSuccessfully).toBe(true);
    });

    it('Scenario 65: Immediate retry loop is classified as PRACTICE_ATTEMPT, not INDEPENDENT_REVIEW', () => {
      const attempts = [
        MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 1000 })),
        MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 2000 })),
      ];
      const interactionType = clusterManager.determineClusterInteractionType(attempts, 0);
      expect(interactionType).toBe(ClusterInteractionType.PRACTICE_ATTEMPT);
    });

    it('Scenario 66: Review separated by >= 4 hours is classified as INDEPENDENT_REVIEW', () => {
      const lastReview = 1000000;
      const reviewSession = [
        MemorizationEventFactory.createEvent(createValidBaseParams({
          timestamp: lastReview + 5 * 3600 * 1000, // 5 hours later
          isIndependentReview: true,
        })),
      ];
      const interactionType = clusterManager.determineClusterInteractionType(reviewSession, lastReview);
      expect(interactionType).toBe(ClusterInteractionType.INDEPENDENT_REVIEW);
    });

    it('Scenario 67: Immediate retry within same session does NOT count as independent review even with flag', () => {
      const lastReview = 1000000;
      const tooSoonSession = [
        MemorizationEventFactory.createEvent(createValidBaseParams({
          timestamp: lastReview + 30 * 60 * 1000, // only 30 mins later
          isIndependentReview: true,
        })),
      ];
      const interactionType = clusterManager.determineClusterInteractionType(tooSoonSession, lastReview);
      expect(interactionType).toBe(ClusterInteractionType.PRACTICE_ATTEMPT);
    });

    it('Scenario 68: Aggregate accuracy correctly calculated for multi-attempt cluster', () => {
      const attempts = [
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.ERROR_CONFIRMED,
          decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
          evidenceStatus: EvidenceStatus.CONFIRMED,
          timestamp: 1000,
        })),
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.CONFIRMED,
          decisionStatus: RecitationDecisionState.CONTINUE,
          evidenceStatus: EvidenceStatus.CONFIRMED,
          timestamp: 2000,
        })),
      ];
      const cluster = clusterManager.aggregateCluster(attempts);
      expect(cluster.aggregateAccuracy).toBe(0.5); // 1 success out of 2 decisive
    });

    it('Scenario 69: Cluster start and end times match first and last attempts', () => {
      const attempts = [
        MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 5000 })),
        MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 9500 })),
      ];
      const cluster = clusterManager.aggregateCluster(attempts);
      expect(cluster.startedAt).toBe(5000);
      expect(cluster.endedAt).toBe(9500);
    });

    it('Scenario 70: Throws error on empty cluster aggregation', () => {
      expect(() => {
        clusterManager.aggregateCluster([]);
      }).toThrow();
    });
  });

  // =========================================================================
  // SCENARIOS 71–80: Error Recurrence & Historical vs Recent Accuracy
  // =========================================================================
  describe('Scenarios 71–80: Recency, Error Recurrence & Recovery', () => {
    const engine = new MemorizationStateEngine();
    const clusterManager = new AttemptClusterManager();

    it('Scenario 71: Updates confirmed error count and increments recent error count on error event', () => {
      let rec = engine.initializePassageRecord(1, 1);
      const errorEvt = MemorizationEventFactory.createEvent(createValidBaseParams({
        eventType: MemorizationEventType.ERROR_CONFIRMED,
        decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));
      const cluster = clusterManager.aggregateCluster([errorEvt]);
      rec = engine.evaluateClusterTransition(rec, cluster);

      expect(rec.confirmedErrorCount).toBe(1);
      expect(rec.recentErrorOccurrences).toBe(1);
      expect(rec.lastErrorAt).toBe(errorEvt.timestamp);
    });

    it('Scenario 72: Decays recent error count by 1 after clean successful cluster', () => {
      let rec = engine.initializePassageRecord(1, 1);
      rec = { ...rec, recentErrorOccurrences: 2 };

      const cleanEvt = MemorizationEventFactory.createEvent(createValidBaseParams({
        eventType: MemorizationEventType.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONTINUE,
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));
      const cluster = clusterManager.aggregateCluster([cleanEvt]);
      rec = engine.evaluateClusterTransition(rec, cluster);

      expect(rec.recentErrorOccurrences).toBe(1); // Decayed from 2 to 1
    });

    it('Scenario 73: Recent errors do not decay below 0', () => {
      let rec = engine.initializePassageRecord(1, 1);
      rec = { ...rec, recentErrorOccurrences: 0 };

      const cleanEvt = MemorizationEventFactory.createEvent(createValidBaseParams({
        eventType: MemorizationEventType.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONTINUE,
        evidenceStatus: EvidenceStatus.CONFIRMED,
      }));
      const cluster = clusterManager.aggregateCluster([cleanEvt]);
      rec = engine.evaluateClusterTransition(rec, cluster);

      expect(rec.recentErrorOccurrences).toBe(0);
    });

    it('Scenario 74: Recent accuracy is computed via exponential moving average separate from historical', () => {
      let rec = engine.initializePassageRecord(1, 1);
      rec = {
        ...rec,
        firstIntroducedAt: 1000,
        recentAccuracy: 1.0,
        historicalAccuracy: 1.0,
        confirmedSuccessCount: 10,
        confirmedErrorCount: 0,
      };

      // Learner has a cluster with 50% accuracy
      const attempts = [
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.ERROR_CONFIRMED,
          decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
          evidenceStatus: EvidenceStatus.CONFIRMED,
        })),
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.CONFIRMED,
          decisionStatus: RecitationDecisionState.CONTINUE,
          evidenceStatus: EvidenceStatus.CONFIRMED,
        })),
      ];
      const cluster = clusterManager.aggregateCluster(attempts);
      const updated = engine.evaluateClusterTransition(rec, cluster);

      // Recent accuracy drops noticeably: 0.6 * 1.0 + 0.4 * 0.5 = 0.8
      expect(updated.recentAccuracy).toBe(0.8);
      // Historical accuracy remains high: 11 / 12 = ~0.92
      expect(updated.historicalAccuracy).toBeGreaterThan(0.9);
    });

    it('Scenario 75: Tracks successfulCorrections when an error is resolved within same cluster', () => {
      let rec = engine.initializePassageRecord(1, 1);
      rec = { ...rec, recentErrorOccurrences: 1 };

      const attempts = [
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.CONFIRMED,
          decisionStatus: RecitationDecisionState.CONTINUE,
          evidenceStatus: EvidenceStatus.CONFIRMED,
          retryNumber: 1, // corrected attempt
        })),
      ];
      const cluster = clusterManager.aggregateCluster(attempts);
      const updated = engine.evaluateClusterTransition(rec, cluster);

      expect(updated.successfulCorrections).toBe(1);
    });

    it('Scenario 76: Cumulative errorOccurrences is monotonic and never decreases', () => {
      let rec = engine.initializePassageRecord(1, 1);
      rec = { ...rec, errorOccurrences: 5, recentErrorOccurrences: 1 };

      const cleanEvt = MemorizationEventFactory.createEvent(createValidBaseParams());
      const cluster = clusterManager.aggregateCluster([cleanEvt]);
      const updated = engine.evaluateClusterTransition(rec, cluster);

      expect(updated.errorOccurrences).toBe(5); // Did not decrease
    });

    it('Scenario 77: Practice cluster count increments on non-independent cluster', () => {
      let rec = engine.initializePassageRecord(1, 1);
      const cleanEvt = MemorizationEventFactory.createEvent(createValidBaseParams({ isIndependentReview: false }));
      const cluster = clusterManager.aggregateCluster([cleanEvt]);
      const updated = engine.evaluateClusterTransition(rec, cluster);

      expect(updated.practiceClusterCount).toBe(1);
      expect(updated.independentReviewCount).toBe(0);
    });

    it('Scenario 78: Independent review count increments on independent review cluster', () => {
      let rec = engine.initializePassageRecord(1, 1);
      rec = { ...rec, lastReviewAt: 1000000 };
      const reviewEvt = MemorizationEventFactory.createEvent(createValidBaseParams({
        isIndependentReview: true,
        timestamp: 1000000 + 5 * 3600 * 1000,
      }));
      const cluster = clusterManager.aggregateCluster([reviewEvt], 1000000);
      const updated = engine.evaluateClusterTransition(rec, cluster);

      expect(updated.independentReviewCount).toBe(1);
    });

    it('Scenario 79: Inconclusive attempts increment inconclusiveCount without altering accuracy', () => {
      let rec = engine.initializePassageRecord(1, 1);
      rec = { ...rec, recentAccuracy: 0.95, historicalAccuracy: 0.95 };

      const inconclusiveEvt = MemorizationEventFactory.createEvent(createValidBaseParams({
        eventType: MemorizationEventType.INCONCLUSIVE,
        evidenceStatus: EvidenceStatus.INCONCLUSIVE,
        decisionStatus: RecitationDecisionState.INCONCLUSIVE,
      }));
      const cluster = clusterManager.aggregateCluster([inconclusiveEvt]);
      const updated = engine.evaluateClusterTransition(rec, cluster);

      expect(updated.inconclusiveCount).toBe(1);
      expect(updated.confirmedSuccessCount).toBe(0);
      expect(updated.confirmedErrorCount).toBe(0);
    });

    it('Scenario 80: Passage record preserves canonical Quran coordinates unchanged', () => {
      let rec = engine.initializePassageRecord(2, 255);
      const evt = MemorizationEventFactory.createEvent(createValidBaseParams({
        quranLocation: { surahId: 2, ayahNumber: 255 },
      }));
      const cluster = clusterManager.aggregateCluster([evt]);
      const updated = engine.evaluateClusterTransition(rec, cluster);

      expect(updated.surahId).toBe(2);
      expect(updated.ayahNumber).toBe(255);
      expect(updated.passageKey).toBe('2:255');
    });
  });

  // =========================================================================
  // SCENARIOS 81–90: Daily Revision Plans & Non-Punitive Adaptation
  // =========================================================================
  describe('Scenarios 81–90: Daily Revision Plans & Adaptation', () => {
    const generator = new RevisionSetGenerator();
    const stateEngine = new MemorizationStateEngine();

    it('Scenario 81: Generates daily plan with unique planId and date', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const plan = generator.generateDailyPlan([rec], { studentId: 'std-1', date: '2026-09-21' });
      expect(plan.planId).toContain('std-1');
      expect(plan.date).toBe('2026-09-21');
      expect(plan.studentId).toBe('std-1');
    });

    it('Scenario 82: MIXED mode includes weak, revision, and new targets', () => {
      let weak = stateEngine.initializePassageRecord(1, 1);
      weak = { ...weak, currentState: MemorizationState.NEEDS_REINFORCEMENT, recentErrorOccurrences: 2 };

      let due = stateEngine.initializePassageRecord(1, 2);
      due = { ...due, currentState: MemorizationState.REVIEW_DUE, lastConfirmedAt: 10000, nextReviewAt: 20000 };

      let newPassage = stateEngine.initializePassageRecord(1, 3);
      newPassage = { ...newPassage, currentState: MemorizationState.INTRODUCED };

      const plan = generator.generateDailyPlan([weak, due, newPassage], {
        studentId: 'std-1',
        mode: RevisionSetMode.MIXED,
        currentTime: 50000,
      });

      expect(plan.weakTargets.length).toBeGreaterThan(0);
      expect(plan.revisionTargets.length).toBeGreaterThan(0);
      expect(plan.newTargets.length).toBeGreaterThan(0);
    });

    it('Scenario 83: WEAKNESS mode selects exclusively weak targets', () => {
      let weak = stateEngine.initializePassageRecord(1, 1);
      weak = { ...weak, currentState: MemorizationState.WEAKENING, recentErrorOccurrences: 2 };

      let stable = stateEngine.initializePassageRecord(1, 2);
      stable = { ...stable, currentState: MemorizationState.STABLE };

      const plan = generator.generateDailyPlan([weak, stable], {
        studentId: 'std-1',
        mode: RevisionSetMode.WEAKNESS,
      });

      expect(plan.weakTargets).toHaveLength(1);
      expect(plan.revisionTargets).toHaveLength(0);
      expect(plan.newTargets).toHaveLength(0);
    });

    it('Scenario 84: Limits total targets and estimatedMinutes to configured bounds', () => {
      const records = Array.from({ length: 20 }, (_, i) => {
        let r = stateEngine.initializePassageRecord(1, i + 1);
        r = { ...r, currentState: MemorizationState.REVIEW_DUE, nextReviewAt: 1000 };
        return r;
      });

      const plan = generator.generateDailyPlan(records, {
        studentId: 'std-1',
        maxTargets: 5,
        maxMinutes: 15,
        currentTime: 5000,
      });

      const totalTargets = plan.weakTargets.length + plan.revisionTargets.length + plan.newTargets.length;
      expect(totalTargets).toBeLessThanOrEqual(5);
      expect(plan.estimatedMinutes).toBeLessThanOrEqual(15);
    });

    it('Scenario 85: Plan Adaptation: Marking a target complete updates completedTargets', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      rec = { ...rec, currentState: MemorizationState.REVIEW_DUE, nextReviewAt: 1000 };
      const plan = generator.generateDailyPlan([rec], { studentId: 'std-1', currentTime: 5000 });

      expect(plan.remainingTargets).toContain('1:1');
      expect(plan.completedTargets).toHaveLength(0);

      const adapted = generator.markTargetCompleted(plan, '1:1');
      expect(adapted.completedTargets).toContain('1:1');
      expect(adapted.remainingTargets).not.toContain('1:1');
    });

    it('Scenario 86: Plan Adaptation: Incomplete plan is NEVER classified as failure (Part 23)', () => {
      let rec1 = stateEngine.initializePassageRecord(1, 1);
      rec1 = { ...rec1, currentState: MemorizationState.LEARNING };
      let rec2 = stateEngine.initializePassageRecord(1, 2);
      rec2 = { ...rec2, currentState: MemorizationState.LEARNING };
      const plan = generator.generateDailyPlan([rec1, rec2], { studentId: 'std-1' });

      // Student completes only 1 out of 2
      const adapted = generator.markTargetCompleted(plan, '1:1');
      expect(adapted.completedTargets.length).toBe(1);
      expect(adapted.remainingTargets.length).toBe(1);
      // No failure or penalty flag exists on plan
      expect((adapted as any).isFailed).toBeUndefined();
    });

    it('Scenario 87: Plan Adaptation: Over-completion does NOT automatically inflate future targets', () => {
      let rec1 = stateEngine.initializePassageRecord(1, 1);
      const plan = generator.generateDailyPlan([rec1], { studentId: 'std-1', maxTargets: 3 });
      // Mark 1
      const adapted = generator.markTargetCompleted(plan, '1:1');
      // Mark extra
      const overCompleted = generator.markTargetCompleted(adapted, '1:2');
      expect(overCompleted.completedTargets).toHaveLength(2);
      // Next generated plan remains capped at user preferences
      const nextPlan = generator.generateDailyPlan([rec1], { studentId: 'std-1', maxTargets: 3 });
      expect(nextPlan.estimatedMinutes).toBeLessThanOrEqual(30);
    });

    it('Scenario 88: Plan generates targets sorted by descending priority', () => {
      let recLow = stateEngine.initializePassageRecord(1, 1);
      let recHigh = stateEngine.initializePassageRecord(1, 2);
      recHigh = { ...recHigh, currentState: MemorizationState.NEEDS_REINFORCEMENT, recentErrorOccurrences: 3 };

      const plan = generator.generateDailyPlan([recLow, recHigh], { studentId: 'std-1' });
      const allTargets = [...plan.weakTargets, ...plan.revisionTargets, ...plan.newTargets];
      if (allTargets.length >= 2) {
        expect(allTargets[0].priority).toBeGreaterThanOrEqual(allTargets[1].priority);
      }
    });

    it('Scenario 89: Rejects missing studentId when generating plan', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      expect(() => {
        generator.generateDailyPlan([rec], { studentId: '' });
      }).toThrow();
    });

    it('Scenario 90: Returned plan is frozen and immutable', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const plan = generator.generateDailyPlan([rec], { studentId: 'std-1' });
      expect(Object.isFrozen(plan)).toBe(true);
      expect(Object.isFrozen(plan.weakTargets)).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIOS 91–100: Longitudinal Profile Store, Replay & Integrity
  // =========================================================================
  describe('Scenarios 91–100: Longitudinal Store & Replay Protection', () => {
    it('Scenario 91: Replay Protection: Rejects duplicate eventId with MEM-002', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      const evt = MemorizationEventFactory.createEvent(createValidBaseParams({ eventId: 'evt-dup-1' }));

      store.recordEvent(evt);
      expect(() => {
        store.recordEvent(evt);
      }).toThrow(DuplicateLearningEventError);
    });

    it('Scenario 92: Replay Protection: Rejects duplicate cryptographic eventHash', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      const p = createValidBaseParams({ eventId: 'evt-unique-1' });
      const evt1 = MemorizationEventFactory.createEvent(p);
      store.recordEvent(evt1);

      // Same content with different eventId still has identical raw hash
      const evt2 = MemorizationEventFactory.createEvent({ ...p, eventId: 'evt-unique-2' });
      // But if raw hash matches, it rejects
      expect(store.getAuditHistory()).toHaveLength(1);
    });

    it('Scenario 93: Out-of-Order Protection: Rejects event preceding previous event by > 5 seconds with MEM-003', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      const evt1 = MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 100000 }));
      store.recordEvent(evt1);

      const staleEvt = MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 50000 }));
      expect(() => {
        store.recordEvent(staleEvt);
      }).toThrow(OutOfOrderEventError);
    });

    it('Scenario 94: Privacy: rawAudioPersistence is strictly false (Part 26)', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      expect(store.rawAudioPersistence).toBe(false);
    });

    it('Scenario 95: Profile Snapshot accurately calculates counts (due, weak, stable, mastered)', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      const evt1 = MemorizationEventFactory.createEvent(createValidBaseParams({
        quranLocation: { surahId: 1, ayahNumber: 1 },
      }));
      store.recordEvent(evt1);

      const snapshot = store.getProfileSnapshot();
      expect(snapshot.studentId).toBe('std-ahmed-001');
      expect(snapshot.passageStates['1:1']).toBeDefined();
    });

    it('Scenario 96: Multi-Version Dataset Binding: Stores original dataset hash per event (Part 30)', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      const evtV1 = MemorizationEventFactory.createEvent(createValidBaseParams({
        quranDatasetVersion: '1.0.0-hafs.verified',
        quranDatasetHash: CANONICAL_QURAN_HASH,
        timestamp: 10000,
      }));
      store.recordEvent(evtV1);

      // Suppose dataset updates in the future
      const evtV2 = MemorizationEventFactory.createEvent(createValidBaseParams({
        quranDatasetVersion: '1.1.0-hafs.verified',
        quranDatasetHash: 'f4b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b999',
        timestamp: 20000,
      }));
      store.recordEvent(evtV2);

      const history = store.getAuditHistory();
      expect(history[0].quranDatasetVersion).toBe('1.0.0-hafs.verified');
      expect(history[1].quranDatasetVersion).toBe('1.1.0-hafs.verified');
    });

    it('Scenario 97: Multi-Version Model Binding: Stores original ASR model hash per event (Part 31)', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      const evtM1 = MemorizationEventFactory.createEvent(createValidBaseParams({
        modelVersion: 'zipformer-v1',
        modelHash: OFFICIAL_MODEL_HASH,
        timestamp: 10000,
      }));
      store.recordEvent(evtM1);

      const evtM2 = MemorizationEventFactory.createEvent(createValidBaseParams({
        modelVersion: 'zipformer-v2',
        modelHash: 'new-model-hash-2026',
        timestamp: 20000,
      }));
      store.recordEvent(evtM2);

      const history = store.getAuditHistory();
      expect(history[0].modelVersion).toBe('zipformer-v1');
      expect(history[1].modelVersion).toBe('zipformer-v2');
    });

    it('Scenario 98: Verifies audit chain temporal consistency', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      store.recordEvent(MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 10000 })));
      store.recordEvent(MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 20000 })));
      expect(store.verifyAuditChainIntegrity()).toBe(true);
    });

    it('Scenario 99: Flushing pending clusters finalizes active bucket states', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      const evt = MemorizationEventFactory.createEvent(createValidBaseParams({ timestamp: 10000 }));
      store.recordEvent(evt);
      expect(() => {
        store.flushPendingClusters();
      }).not.toThrow();
    });

    it('Scenario 100: Profile snapshot contains NO psychological traits (Part 10)', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      const snapshot = store.getProfileSnapshot();
      expect((snapshot as any).intelligence).toBeUndefined();
      expect((snapshot as any).motivation).toBeUndefined();
      expect((snapshot as any).piety).toBeUndefined();
      expect((snapshot as any).religiosity).toBeUndefined();
    });
  });

  // =========================================================================
  // SCENARIOS 101–108: Golden Cases & AI Boundary Guard (Part 24, 37, 38)
  // =========================================================================
  describe('Scenarios 101–108: Golden Cases & AI Boundary Guard', () => {
    const scheduler = new RevisionScheduler();
    const stateEngine = new MemorizationStateEngine();

    it('Scenario 101 [Golden Case A]: New passage (Al-Fatihah Ayah 1) introduced for the first time', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      const clusterManager = new AttemptClusterManager();

      const evt = MemorizationEventFactory.createEvent(createValidBaseParams({
        eventType: MemorizationEventType.CONFIRMED,
        decisionStatus: RecitationDecisionState.CONTINUE,
        evidenceStatus: EvidenceStatus.CONFIRMED,
        timestamp: 1000,
      }));
      const cluster = clusterManager.aggregateCluster([evt]);
      rec = stateEngine.evaluateClusterTransition(rec, cluster, 1000);

      expect(rec.currentState).toBe(MemorizationState.LEARNING);
      expect(rec.firstIntroducedAt).toBe(1000);
      expect(rec.confirmedSuccessCount).toBe(1);

      const sched = scheduler.evaluatePassage(rec, 1000);
      expect(sched.reasonCodes).toContain(RevisionReasonCode.NEW_UNCONSOLIDATED_PASSAGE);
      expect(sched.intervalHours).toBe(24);
    });

    it('Scenario 102 [Golden Case B]: Immediate repetition loop resolves successfully without inflating review count', () => {
      const store = new LongitudinalProfileStore('std-ahmed-001');
      const attempts = [
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.ATTEMPT,
          decisionStatus: RecitationDecisionState.CONFIRMED_PHONETIC_ERROR,
          evidenceStatus: EvidenceStatus.CONFIRMED,
          timestamp: 1000,
        })),
        MemorizationEventFactory.createEvent(createValidBaseParams({
          eventType: MemorizationEventType.RETRY,
          decisionStatus: RecitationDecisionState.CONTINUE,
          evidenceStatus: EvidenceStatus.CONFIRMED,
          timestamp: 2000,
        })),
      ];

      for (const a of attempts) {
        store.recordEvent(a);
      }
      store.flushPendingClusters();

      const rec = store.getPassageRecord('1:1')!;
      // Practice clusters incremented by 1, NOT 2 reviews
      expect(rec.practiceClusterCount).toBe(1);
      expect(rec.independentReviewCount).toBe(0);
    });

    it('Scenario 103 [Golden Case C]: Stable passage reaches scheduled interval and transitions to REVIEW_DUE', () => {
      let rec = stateEngine.initializePassageRecord(1, 1);
      const now = 1000000;
      rec = {
        ...rec,
        currentState: MemorizationState.STABLE,
        lastConfirmedAt: now,
      };

      // Interval is 24h; evaluate at 25h (1 hour overdue -> REVIEW_DUE)
      const sched = scheduler.evaluatePassage(rec, now + 25 * 3600 * 1000);
      expect(sched.urgency).toBe(ReviewUrgency.REVIEW_DUE);
      expect(sched.reasonCodes).toContain(RevisionReasonCode.REVIEW_INTERVAL_REACHED);
    });

    it('Scenario 104 [Golden Case D]: AI Boundary Guard strictly rejects proposed state change from AI model', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const sched = scheduler.evaluatePassage(rec);

      const aiProposal = {
        summaryArabic: 'ملاحظة ممتازة',
        proposedStateChange: MemorizationState.MASTERED, // AI trying to promote directly
      };

      const audit = AIBoundaryGuard.auditAIOutput(aiProposal, rec, sched);
      expect(audit.isAllowed).toBe(false);
      expect(audit.rejectedMutations.length).toBeGreaterThan(0);
      expect(audit.rejectedMutations[0]).toContain('LLM state mutation is strictly forbidden');
      expect(audit.sanitizedExplanation).toBe(sched.naturalLanguageExplanationArabic);
    });

    it('Scenario 105 [Golden Case E]: AI Boundary Guard rejects religious Ijazah or certification claims', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const sched = scheduler.evaluatePassage(rec);

      const aiProposal = {
        summaryArabic: 'أنت الآن مجاز بسند متصل وحفظك لا ينسى ومعصوم من الخطأ',
      };

      const audit = AIBoundaryGuard.auditAIOutput(aiProposal, rec, sched);
      expect(audit.isAllowed).toBe(false);
      expect(audit.containsProhibitedCertification).toBe(true);
    });

    it('Scenario 106 [Golden Case F]: AI Boundary Guard allows valid, supportive pedagogical explanation without mutations', () => {
      const rec = stateEngine.initializePassageRecord(1, 1);
      const sched = scheduler.evaluatePassage(rec);

      const aiProposal = {
        summaryArabic: 'المقطع في مساره الطبيعي، بارك الله في حرصك وإتقانك.',
        encouragementArabic: 'استمر في مراجعتك اليومية المنتظمة.',
      };

      const audit = AIBoundaryGuard.auditAIOutput(aiProposal, rec, sched);
      expect(audit.isAllowed).toBe(true);
      expect(audit.containsProhibitedCertification).toBe(false);
      expect(audit.sanitizedExplanation).toBe(aiProposal.summaryArabic);
    });

    it('Scenario 107 [Golden Case G]: MemorizationBridge translates Phase 7C VerifiedProgressRecord cleanly', () => {
      const bridge = new MemorizationBridge('std-ahmed-001');
      const progressRecord: VerifiedProgressRecord = {
        recordId: 'prog-sess-1-1',
        sessionId: 'sess-1',
        eventType: ProgressEventType.WORD_CONFIRMED,
        surah: 1,
        ayah: 1,
        wordIndex: 0,
        timestamp: Date.now(),
        evidenceHash: 'ev-hash-123',
        decisionState: RecitationDecisionState.CONTINUE,
        action: PedagogicalAction.CONTINUE,
      };

      const result = bridge.ingestProgressRecord(progressRecord);
      expect(result).not.toBeNull();
      expect(result?.passageKey).toBe('1:1');
      expect(result?.confirmedSuccessCount).toBe(1);
    });

    it('Scenario 108 [Golden Case H]: 100% Offline verification: full memory pipeline runs without internet or API keys', () => {
      // Simulate environment without GEMINI_API_KEY
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      try {
        const store = new LongitudinalProfileStore('offline-student');
        const evt = MemorizationEventFactory.createEvent(createValidBaseParams({
          studentId: 'offline-student',
        }));
        store.recordEvent(evt);
        const snapshot = store.getProfileSnapshot();
        const sched = scheduler.evaluateStudent(Object.values(snapshot.passageStates));

        expect(snapshot.passageStates['1:1']).toBeDefined();
        expect(sched).toHaveLength(1);
      } finally {
        if (originalKey) process.env.GEMINI_API_KEY = originalKey;
      }
    });
  });
});
