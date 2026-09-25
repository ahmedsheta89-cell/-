/**
 * @file RevisionScheduler.ts
 * @module domain/memorization_revision
 * @description Revision Scheduler and Explainability Engine for Quran passages (Parts 14, 15, 16, 21).
 * 
 * CORE RESPONSIBILITIES:
 * - Computes machine-readable reason codes (Part 14) and urgency tiers.
 * - Computes transparent deterministic priority factors (Part 21).
 * - Provides fully deterministic Arabic pedagogical explanations (Part 15) grounded strictly in evidence.
 * - Zero LLM dependency for scheduling calculations or core explanations.
 */

import {
  PassageLearningRecord,
  ReviewUrgency,
  RevisionReasonCode,
  RevisionScheduleResult,
  RevisionScheduleConfig,
  CANONICAL_REVISION_CONFIG,
  MemorizationState,
} from './types.ts';
import { RetentionModelHeuristic } from './RetentionModelHeuristic.ts';

export interface IRevisionScheduler {
  evaluatePassage(record: PassageLearningRecord, currentTime?: number): RevisionScheduleResult;
  evaluateStudent(records: readonly PassageLearningRecord[], currentTime?: number): readonly RevisionScheduleResult[];
}

export class RevisionScheduler implements IRevisionScheduler {
  private readonly config: RevisionScheduleConfig;
  private readonly retentionHeuristic: RetentionModelHeuristic;

  constructor(config?: Partial<RevisionScheduleConfig>) {
    this.config = { ...CANONICAL_REVISION_CONFIG, ...config };
    this.retentionHeuristic = new RetentionModelHeuristic(this.config);
  }

  /**
   * Evaluates a single passage and determines its revision urgency, reasons, priority, and Arabic explanation.
   */
  public evaluatePassage(record: PassageLearningRecord, currentTime: number = Date.now()): RevisionScheduleResult {
    // 1. Retention Calculation
    const retention = this.retentionHeuristic.calculateNextReview({ record, currentTime });

    // 2. Identify Reason Codes
    const reasonCodes: RevisionReasonCode[] = [];

    const isOverdue = currentTime >= retention.nextReviewAt;
    const hoursOverdue = isOverdue ? (currentTime - retention.nextReviewAt) / (3600 * 1000) : 0;
    const hoursUntilDue = !isOverdue ? (retention.nextReviewAt - currentTime) / (3600 * 1000) : 0;

    if (isOverdue) {
      reasonCodes.push(RevisionReasonCode.REVIEW_INTERVAL_REACHED);
    }

    if (record.recentErrorOccurrences > 0) {
      reasonCodes.push(RevisionReasonCode.RECENT_CONFIRMED_ERROR);
    }

    if (record.recentAccuracy < 0.8 && record.historicalAccuracy >= 0.85) {
      reasonCodes.push(RevisionReasonCode.DECLINING_RECENT_ACCURACY);
    }

    const daysSinceLastReview =
      record.lastReviewAt > 0 ? (currentTime - record.lastReviewAt) / (86400 * 1000) : 0;
    if (daysSinceLastReview >= 7) {
      reasonCodes.push(RevisionReasonCode.LONG_ABSENCE);
    }

    if (
      record.currentState === MemorizationState.INTRODUCED ||
      record.currentState === MemorizationState.LEARNING
    ) {
      reasonCodes.push(RevisionReasonCode.NEW_UNCONSOLIDATED_PASSAGE);
    }

    if (
      record.currentState === MemorizationState.PRACTICING &&
      record.independentReviewCount < 2
    ) {
      reasonCodes.push(RevisionReasonCode.INSUFFICIENT_INDEPENDENT_REVIEWS);
    }

    if (
      record.currentState === MemorizationState.WEAKENING ||
      record.currentState === MemorizationState.NEEDS_REINFORCEMENT
    ) {
      reasonCodes.push(RevisionReasonCode.NEEDS_REINFORCEMENT_FOLLOWUP);
    }

    if (
      (record.currentState === MemorizationState.STABLE || record.currentState === MemorizationState.MASTERED) &&
      reasonCodes.length === 0
    ) {
      reasonCodes.push(RevisionReasonCode.PERIODIC_MAINTENANCE);
    }

    // 3. Determine Urgency Tier (Deterministic 5-Level Urgency Model)
    let urgency: ReviewUrgency;

    if (
      record.currentState === MemorizationState.NEEDS_REINFORCEMENT ||
      record.recentErrorOccurrences >= this.config.maxRecentErrorsThreshold
    ) {
      // 1. Critical pedagogical weakness requiring immediate intervention
      urgency = ReviewUrgency.CRITICAL_WEAKNESS;
    } else if (isOverdue && hoursOverdue >= 24) {
      // 2. Severely overdue beyond scheduled retention interval (>= 24h overdue)
      urgency = ReviewUrgency.REVIEW_OVERDUE;
    } else if (
      isOverdue ||
      record.currentState === MemorizationState.REVIEW_DUE ||
      record.currentState === MemorizationState.WEAKENING
    ) {
      // 3. Due for review or scheduled epoch reached
      urgency = ReviewUrgency.REVIEW_DUE;
    } else if (hoursUntilDue <= 12) {
      // 4. Approaching review deadline within configured window (<= 12h)
      urgency = ReviewUrgency.REVIEW_SOON;
    } else {
      // 5. Consolidated / freshly reviewed / stable passage requiring no immediate action
      urgency = ReviewUrgency.NO_REVIEW_REQUIRED;
    }

    // 4. Generate Deterministic Arabic Explanation (Part 15)
    const explanation = this.generateDeterministicArabicExplanation(record, reasonCodes, urgency);

    return Object.freeze({
      passageKey: record.passageKey,
      urgency,
      nextReviewAt: retention.nextReviewAt,
      intervalHours: retention.intervalHours,
      reasonCodes: Object.freeze(reasonCodes),
      naturalLanguageExplanationArabic: explanation,
      priorityFactors: retention.priorityFactors,
    });
  }

  /**
   * Evaluates all passages for a student and sorts them by descending total priority.
   */
  public evaluateStudent(
    records: readonly PassageLearningRecord[],
    currentTime: number = Date.now()
  ): readonly RevisionScheduleResult[] {
    return records
      .map((rec) => this.evaluatePassage(rec, currentTime))
      .sort((a, b) => b.priorityFactors.totalPriority - a.priorityFactors.totalPriority);
  }

  /**
   * Deterministic Arabic Pedagogical Explanation Generator (Part 15 & 33).
   * Maps machine-readable reason codes into clear, encouraging, evidence-grounded Arabic phrases.
   */
  private generateDeterministicArabicExplanation(
    record: PassageLearningRecord,
    reasonCodes: readonly RevisionReasonCode[],
    urgency: ReviewUrgency
  ): string {
    const parts: string[] = [];

    if (urgency === ReviewUrgency.CRITICAL_WEAKNESS) {
      parts.push('المقطع ذو أولوية عاجلة للتثبيت ومعالجة مواضع التعثر');
    } else if (urgency === ReviewUrgency.REVIEW_OVERDUE) {
      parts.push('المقطع متأخر عن موعد مراجعته المجدولة');
    } else if (urgency === ReviewUrgency.REVIEW_DUE) {
      parts.push('حان موعد مراجعة هذا المقطع المقررة');
    } else if (urgency === ReviewUrgency.REVIEW_SOON) {
      parts.push('يقترب موعد مراجعة هذا المقطع لضمان دوام الحفظ');
    } else {
      parts.push('المقطع مستقر ومثبت وفق جدول التكرار المتباعد');
    }

    for (const code of reasonCodes) {
      switch (code) {
        case RevisionReasonCode.REVIEW_INTERVAL_REACHED:
          parts.push('اكتملت المدة الزمنية المحددة للتكرار المتباعد');
          break;
        case RevisionReasonCode.RECENT_CONFIRMED_ERROR:
          parts.push(`سُجلت ملاحظات صوتية مؤكدة حديثة (${record.recentErrorOccurrences}) تتطلب المعاودة`);
          break;
        case RevisionReasonCode.DECLINING_RECENT_ACCURACY:
          parts.push('لوحظ تراجع نسبي في دقة الأداء الأخير مقارنة بالسجل التاريخي');
          break;
        case RevisionReasonCode.LONG_ABSENCE:
          parts.push('مضت فترة تزيد عن أسبوع دون مراجعة مستقلة مسجلة');
          break;
        case RevisionReasonCode.NEW_UNCONSOLIDATED_PASSAGE:
          parts.push('المقطع جديد وفي مرحلة التلقي والتعزيز الأولي');
          break;
        case RevisionReasonCode.INSUFFICIENT_INDEPENDENT_REVIEWS:
          parts.push('يحتاج المقطع إلى مراجعتين مستقلتين على الأقل لنقله إلى الاستقرار');
          break;
        case RevisionReasonCode.NEEDS_REINFORCEMENT_FOLLOWUP:
          parts.push('المقطع مدرج في خطة التعزيز المركز لتدارك مواضع الالتباس');
          break;
        case RevisionReasonCode.PERIODIC_MAINTENANCE:
          parts.push('مراجعة دورية للمحافظة على جودة التلاوة وسلامة الأحكام');
          break;
      }
    }

    return parts.join(' — ');
  }
}
