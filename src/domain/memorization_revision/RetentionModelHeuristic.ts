/**
 * @file RetentionModelHeuristic.ts
 * @module domain/memorization_revision
 * @description Deterministic Revision Scheduling Heuristic (Part 13).
 * 
 * SCIENTIFIC TRANSPARENCY NOTICE:
 * This model is a transparent pedagogical scheduling heuristic, NOT an empirical claim of 
 * infallible human cognitive memory modeling.
 * It combines spaced repetition intervals with error recurrence penalties and recent accuracy.
 */

import {
  PassageLearningRecord,
  RevisionScheduleConfig,
  CANONICAL_REVISION_CONFIG,
  RevisionPriorityFactors,
} from './types.ts';

export interface RetentionCalculationInput {
  readonly record: PassageLearningRecord;
  readonly currentTime: number;
}

export interface RetentionCalculationOutput {
  readonly stabilityIndex: number;
  readonly intervalHours: number;
  readonly nextReviewAt: number;
  readonly isReviewDue: boolean;
  readonly priorityFactors: RevisionPriorityFactors;
}

export class RetentionModelHeuristic {
  private readonly config: RevisionScheduleConfig;

  constructor(config?: Partial<RevisionScheduleConfig>) {
    this.config = { ...CANONICAL_REVISION_CONFIG, ...config };
  }

  /**
   * Computes the deterministic next review interval and stability metrics for a passage.
   */
  public calculateNextReview(input: RetentionCalculationInput): RetentionCalculationOutput {
    const { record, currentTime } = input;

    // 1. Calculate Stability Index (S)
    // Increases with independent reviews and confirmed successes; penalized by recent errors.
    const baseS = 1.0;
    const reviewBonus = Math.min(record.independentReviewCount * 0.6, 3.0);
    const clusterBonus = Math.min(record.practiceClusterCount * 0.15, 1.0);
    const errorPenalty = record.recentErrorOccurrences * 0.8;

    let stabilityIndex = baseS + reviewBonus + clusterBonus - errorPenalty;
    stabilityIndex = Math.max(0.5, Math.min(stabilityIndex, 6.0));

    // 2. Accuracy Factor (A) [0.5 to 1.0]
    const effectiveAccuracy =
      record.recentAccuracy > 0
        ? record.recentAccuracy * 0.7 + record.historicalAccuracy * 0.3
        : record.historicalAccuracy > 0
        ? record.historicalAccuracy
        : 0.8;
    const accuracyFactor = Math.max(0.5, Math.min(1.0, 0.4 + 0.6 * effectiveAccuracy));

    // 3. Penalty Factor (P) based on recurring confirmed errors
    const errorPenaltyFactor = 1.0 / (1.0 + 0.6 * Math.max(0, record.recentErrorOccurrences));

    // 4. Calculate Scheduled Interval in Hours
    // Delta_t = baseInterval * (multiplier ^ (S - 1)) * A * P
    const baseInterval = this.config.firstReviewIntervalHours;
    const multiplier = this.config.stabilityGrowthMultiplier;
    const exponent = Math.max(0, stabilityIndex - 1.0);
    const rawInterval = baseInterval * Math.pow(multiplier, exponent) * accuracyFactor * errorPenaltyFactor;

    // Clamp between configured bounds
    let intervalHours = Math.round(
      Math.max(this.config.weakIntervalHours, Math.min(rawInterval, this.config.masteredIntervalHours))
    );

    // Initial review interval is strictly the base interval (24 hours per Part 17) until first independent review
    if (record.independentReviewCount === 0) {
      intervalHours = this.config.firstReviewIntervalHours;
    }

    // If there are recent uncorrected errors, enforce weakIntervalHours
    if (record.recentErrorOccurrences >= this.config.maxRecentErrorsThreshold) {
      intervalHours = Math.min(intervalHours, this.config.weakIntervalHours);
    }

    // 5. Next Review Epoch
    const referenceTimestamp = Math.max(record.lastConfirmedAt, record.lastReviewAt, record.lastAttemptAt);
    const computedNextReviewAt = (referenceTimestamp > 0 ? referenceTimestamp : currentTime) + intervalHours * 3600 * 1000;
    const nextReviewAt = record.nextReviewAt > 0 ? record.nextReviewAt : computedNextReviewAt;

    const isReviewDue = currentTime >= nextReviewAt;

    // 6. Calculate Explicit Priority Factors (Part 21)
    const priorityFactors = this.computePriorityFactors(record, currentTime, nextReviewAt, stabilityIndex);

    return Object.freeze({
      stabilityIndex: Math.round(stabilityIndex * 100) / 100,
      intervalHours,
      nextReviewAt,
      isReviewDue,
      priorityFactors,
    });
  }

  /**
   * Deterministic priority calculation exposing recencyFactor, errorFactor, reviewDueFactor, stabilityFactor.
   */
  public computePriorityFactors(
    record: PassageLearningRecord,
    currentTime: number,
    nextReviewAt: number,
    stabilityIndex: number
  ): RevisionPriorityFactors {
    // 1. Recency / Due Factor: How overdue is the passage?
    let reviewDueFactor = 0.0;
    if (currentTime >= nextReviewAt) {
      const overdueHours = (currentTime - nextReviewAt) / (3600 * 1000);
      reviewDueFactor = Math.min(40.0, 20.0 + overdueHours * 1.5);
    } else {
      const remainingHours = (nextReviewAt - currentTime) / (3600 * 1000);
      if (remainingHours <= 12) {
        reviewDueFactor = Math.max(5.0, 15.0 - remainingHours);
      }
    }

    // 2. Error Factor: Recurring confirmed errors elevate review priority
    const errorFactor = Math.min(30.0, record.recentErrorOccurrences * 12.0 + record.errorOccurrences * 2.0);

    // 3. Recency Factor: Passages unreviewed for a very long time
    const daysSinceReview = record.lastReviewAt > 0 ? (currentTime - record.lastReviewAt) / (86400 * 1000) : 7;
    const recencyFactor = Math.min(20.0, daysSinceReview * 2.5);

    // 4. Stability Factor: Less stable passages get higher priority (inverted)
    const stabilityFactor = Math.max(0.0, (6.0 - stabilityIndex) * 2.5);

    // Total Composite Priority (0.0 to 100.0)
    const totalPriority = Math.round(
      Math.min(100.0, Math.max(0.0, reviewDueFactor + errorFactor + recencyFactor + stabilityFactor)) * 10
    ) / 10;

    return Object.freeze({
      recencyFactor: Math.round(recencyFactor * 10) / 10,
      errorFactor: Math.round(errorFactor * 10) / 10,
      reviewDueFactor: Math.round(reviewDueFactor * 10) / 10,
      stabilityFactor: Math.round(stabilityFactor * 10) / 10,
      totalPriority,
    });
  }
}
