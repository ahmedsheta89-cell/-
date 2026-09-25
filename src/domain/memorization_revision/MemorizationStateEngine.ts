/**
 * @file MemorizationStateEngine.ts
 * @module domain/memorization_revision
 * @description State transition engine for Quran passage memorization lifecycle (Parts 6, 7, 12, 17, 18, 19).
 * 
 * CORE PEDAGOGICAL GUARANTEES:
 * 1. INCONCLUSIVE or POSSIBLE evidence strictly NEVER downgrades memorization.
 * 2. Single-Failure Protection: A single error does NOT reset progress to zero or mark passage "forgotten".
 * 3. MASTERED is strictly a pedagogical scheduling threshold, NOT an Ijazah or religious certification.
 * 4. Recent accuracy is calculated separately from cumulative historical accuracy.
 */

import {
  MemorizationState,
  PassageLearningRecord,
  MemorizationEvent,
  MemorizationEventType,
  EvidenceStatus,
  AttemptCluster,
  ClusterInteractionType,
  RevisionScheduleConfig,
  CANONICAL_REVISION_CONFIG,
} from './types.ts';
import { RetentionModelHeuristic } from './RetentionModelHeuristic.ts';

export class MemorizationStateEngine {
  private readonly config: RevisionScheduleConfig;
  private readonly retentionHeuristic: RetentionModelHeuristic;

  constructor(config?: Partial<RevisionScheduleConfig>) {
    this.config = { ...CANONICAL_REVISION_CONFIG, ...config };
    this.retentionHeuristic = new RetentionModelHeuristic(this.config);
  }

  /**
   * Initializes a default clean passage record for a canonical Quran location.
   */
  public initializePassageRecord(
    surahId: number,
    ayahNumber: number,
    wordRange?: { startWord: number; endWord: number }
  ): PassageLearningRecord {
    const passageKey = `${surahId}:${ayahNumber}`;

    return Object.freeze({
      passageKey,
      surahId,
      ayahNumber,
      wordRange: wordRange ? Object.freeze({ ...wordRange }) : undefined,
      firstIntroducedAt: 0,
      lastAttemptAt: 0,
      lastConfirmedAt: 0,
      lastReviewAt: 0,
      practiceClusterCount: 0,
      independentReviewCount: 0,
      confirmedSuccessCount: 0,
      confirmedErrorCount: 0,
      inconclusiveCount: 0,
      recentAccuracy: 1.0,
      historicalAccuracy: 1.0,
      errorOccurrences: 0,
      recentErrorOccurrences: 0,
      successfulCorrections: 0,
      lastErrorAt: 0,
      currentState: MemorizationState.NOT_STARTED,
      nextReviewAt: 0,
      stabilityIndex: 1.0,
    });
  }

  /**
   * Evaluates a completed attempt cluster and advances the passage learning record.
   */
  public evaluateClusterTransition(
    currentRecord: PassageLearningRecord,
    cluster: AttemptCluster,
    currentTime: number = Date.now()
  ): PassageLearningRecord {
    const isIndependent = cluster.interactionType === ClusterInteractionType.INDEPENDENT_REVIEW;

    // 1. Accumulate Event Stats
    let newConfirmedSuccesses = currentRecord.confirmedSuccessCount;
    let newConfirmedErrors = currentRecord.confirmedErrorCount;
    let newInconclusives = currentRecord.inconclusiveCount;
    let newRecentErrors = currentRecord.recentErrorOccurrences;
    let newErrorsTotal = currentRecord.errorOccurrences;
    let newSuccessfulCorrections = currentRecord.successfulCorrections;
    let lastErrorAt = currentRecord.lastErrorAt;

    for (const attempt of cluster.attempts) {
      if (attempt.evidenceStatus === EvidenceStatus.INCONCLUSIVE || attempt.evidenceStatus === EvidenceStatus.POSSIBLE) {
        newInconclusives++;
      } else if (
        attempt.eventType === MemorizationEventType.CONFIRMED ||
        attempt.eventType === MemorizationEventType.AYAH_COMPLETED
      ) {
        if (attempt.evidenceStatus === EvidenceStatus.CONFIRMED) {
          newConfirmedSuccesses++;
          if (newRecentErrors > 0 && attempt.retryNumber > 0) {
            newSuccessfulCorrections++;
          }
        }
      } else if (
        attempt.eventType === MemorizationEventType.ERROR_CONFIRMED ||
        attempt.eventType === MemorizationEventType.REVIEW_FAILED
      ) {
        if (attempt.evidenceStatus === EvidenceStatus.CONFIRMED) {
          newConfirmedErrors++;
          newRecentErrors++;
          newErrorsTotal++;
          lastErrorAt = attempt.timestamp;
        }
      }
    }

    // Decay recent errors if the cluster ended in a clean resolution
    if (cluster.isResolvedSuccessfully && cluster.aggregateAccuracy >= 0.8) {
      newRecentErrors = Math.max(0, newRecentErrors - 1);
    }

    // Inconclusive Evidence Invariant (Point 6):
    // INCONCLUSIVE evidence CANNOT increase or decrease mastery, create confirmed success/failure, or trigger downgrade.
    const hasConfirmedErrors = cluster.attempts.some(
      (a) =>
        a.evidenceStatus === EvidenceStatus.CONFIRMED &&
        (a.eventType === MemorizationEventType.ERROR_CONFIRMED ||
          a.eventType === MemorizationEventType.REVIEW_FAILED)
    );

    const isPurelyInconclusive = cluster.attempts.every(
      (a) => a.evidenceStatus === EvidenceStatus.INCONCLUSIVE || a.evidenceStatus === EvidenceStatus.POSSIBLE
    );

    // 2. Accuracy Tracking (Recent vs Historical per Part 18)
    const totalDecisive = newConfirmedSuccesses + newConfirmedErrors;
    const historicalAccuracy = totalDecisive > 0 ? newConfirmedSuccesses / totalDecisive : currentRecord.historicalAccuracy;

    // If purely inconclusive, preserve existing recent accuracy without degradation
    const recentAccuracy = isPurelyInconclusive
      ? currentRecord.recentAccuracy
      : currentRecord.firstIntroducedAt > 0
      ? Math.round((0.6 * currentRecord.recentAccuracy + 0.4 * cluster.aggregateAccuracy) * 100) / 100
      : cluster.aggregateAccuracy;

    // 3. Cluster and Review Counters
    const practiceClusterCount = currentRecord.practiceClusterCount + (isIndependent || isPurelyInconclusive ? 0 : 1);
    const independentReviewCount = currentRecord.independentReviewCount + (isIndependent && !isPurelyInconclusive ? 1 : 0);

    const firstIntroducedAt = currentRecord.firstIntroducedAt === 0 ? cluster.startedAt : currentRecord.firstIntroducedAt;
    const lastAttemptAt = cluster.endedAt;
    const lastConfirmedAt = cluster.isResolvedSuccessfully ? cluster.endedAt : currentRecord.lastConfirmedAt;
    const lastReviewAt = isIndependent && !isPurelyInconclusive ? cluster.endedAt : currentRecord.lastReviewAt;

    // 4. Derive Next Pedagogical State
    const nextState = isPurelyInconclusive
      ? currentRecord.currentState
      : this.determineNextState({
          currentState: currentRecord.currentState,
          isIndependentReview: isIndependent,
          isResolvedSuccessfully: cluster.isResolvedSuccessfully,
          clusterAccuracy: cluster.aggregateAccuracy,
          recentAccuracy,
          practiceClusterCount,
          independentReviewCount,
          recentErrorOccurrences: newRecentErrors,
          currentTime,
          nextReviewAt: currentRecord.nextReviewAt,
          hasConfirmedErrors,
        });

    // 5. Provisional Updated Record
    const updatedDraft: PassageLearningRecord = {
      ...currentRecord,
      firstIntroducedAt,
      lastAttemptAt,
      lastConfirmedAt,
      lastReviewAt,
      practiceClusterCount,
      independentReviewCount,
      confirmedSuccessCount: newConfirmedSuccesses,
      confirmedErrorCount: newConfirmedErrors,
      inconclusiveCount: newInconclusives,
      recentAccuracy,
      historicalAccuracy: Math.round(historicalAccuracy * 100) / 100,
      errorOccurrences: newErrorsTotal,
      recentErrorOccurrences: newRecentErrors,
      successfulCorrections: newSuccessfulCorrections,
      lastErrorAt,
      currentState: nextState,
    };

    // 6. Compute Retention & Next Review Interval via Deterministic Heuristic
    const retention = isPurelyInconclusive && currentRecord.nextReviewAt > 0
      ? {
          stabilityIndex: currentRecord.stabilityIndex,
          nextReviewAt: currentRecord.nextReviewAt,
        }
      : this.retentionHeuristic.calculateNextReview({
          record: updatedDraft,
          currentTime,
        });

    return Object.freeze({
      ...updatedDraft,
      stabilityIndex: retention.stabilityIndex,
      nextReviewAt: retention.nextReviewAt,
    });
  }

  /**
   * Deterministic State Transition Logic (Part 12).
   */
  public determineNextState(params: {
    currentState: MemorizationState;
    isIndependentReview: boolean;
    isResolvedSuccessfully: boolean;
    clusterAccuracy: number;
    recentAccuracy: number;
    practiceClusterCount: number;
    independentReviewCount: number;
    recentErrorOccurrences: number;
    currentTime: number;
    nextReviewAt: number;
    hasConfirmedErrors?: boolean;
  }): MemorizationState {
    const {
      currentState,
      isIndependentReview,
      isResolvedSuccessfully,
      clusterAccuracy,
      recentAccuracy,
      practiceClusterCount,
      independentReviewCount,
      recentErrorOccurrences,
      currentTime,
      nextReviewAt,
      hasConfirmedErrors = false,
    } = params;

    // A. Initial Introduction Transitions
    if (currentState === MemorizationState.NOT_STARTED) {
      return isResolvedSuccessfully ? MemorizationState.LEARNING : MemorizationState.INTRODUCED;
    }

    if (currentState === MemorizationState.INTRODUCED) {
      if (isResolvedSuccessfully || clusterAccuracy >= 0.7) {
        return MemorizationState.LEARNING;
      }
      return MemorizationState.INTRODUCED;
    }

    // B. Learning -> Practicing
    if (currentState === MemorizationState.LEARNING) {
      if (practiceClusterCount >= 2 && recentAccuracy >= 0.75 && isResolvedSuccessfully) {
        return MemorizationState.PRACTICING;
      }
      if (recentErrorOccurrences >= 3 || hasConfirmedErrors && recentErrorOccurrences >= 2) {
        return MemorizationState.NEEDS_REINFORCEMENT;
      }
      return MemorizationState.LEARNING;
    }

    // C. Practicing -> Stable
    if (currentState === MemorizationState.PRACTICING) {
      if (isIndependentReview && isResolvedSuccessfully && clusterAccuracy >= 0.85) {
        return MemorizationState.STABLE;
      }
      if (practiceClusterCount >= 4 && recentAccuracy >= 0.85 && recentErrorOccurrences === 0) {
        return MemorizationState.STABLE;
      }
      if (recentErrorOccurrences >= this.config.maxRecentErrorsThreshold && hasConfirmedErrors) {
        return MemorizationState.WEAKENING;
      }
      return MemorizationState.PRACTICING;
    }

    // D. Review Due Evaluation (Time-based or State-based)
    if (currentState === MemorizationState.STABLE || currentState === MemorizationState.MASTERED) {
      // If time has elapsed and an independent review was undertaken
      if (isIndependentReview) {
        if (isResolvedSuccessfully && clusterAccuracy >= 0.85) {
          // Check for Mastered Promotion: Configurable independent reviews, zero recent errors, high sustained accuracy
          if (
            independentReviewCount >= this.config.masteredMinIndependentReviews &&
            recentAccuracy >= 0.95 &&
            recentErrorOccurrences === 0
          ) {
            return MemorizationState.MASTERED;
          }
          return MemorizationState.STABLE;
        } else {
          // Single-failure protection: do NOT mark forgotten, transition to WEAKENING
          return MemorizationState.WEAKENING;
        }
      }

      // If scheduled time has arrived and no review yet
      if (nextReviewAt > 0 && currentTime >= nextReviewAt) {
        return MemorizationState.REVIEW_DUE;
      }

      if (recentErrorOccurrences >= this.config.maxRecentErrorsThreshold && hasConfirmedErrors) {
        return MemorizationState.WEAKENING;
      }

      return currentState;
    }

    // E. REVIEW_DUE Transitions
    if (currentState === MemorizationState.REVIEW_DUE) {
      if (isResolvedSuccessfully && clusterAccuracy >= 0.8) {
        return independentReviewCount >= this.config.masteredMinIndependentReviews
          ? MemorizationState.MASTERED
          : MemorizationState.STABLE;
      }
      if (hasConfirmedErrors || recentErrorOccurrences > 0) {
        return MemorizationState.NEEDS_REINFORCEMENT;
      }
      return MemorizationState.REVIEW_DUE;
    }

    // F. WEAKENING & NEEDS_REINFORCEMENT Recovery Transitions
    if (currentState === MemorizationState.WEAKENING || currentState === MemorizationState.NEEDS_REINFORCEMENT) {
      if (isResolvedSuccessfully && clusterAccuracy >= 0.85 && recentErrorOccurrences <= 1) {
        // Successful recovery: transition back to PRACTICING first (step-by-step recovery)
        return MemorizationState.PRACTICING;
      }
      if (recentErrorOccurrences >= 3) {
        return MemorizationState.NEEDS_REINFORCEMENT;
      }
      return currentState;
    }

    return currentState;
  }
}
