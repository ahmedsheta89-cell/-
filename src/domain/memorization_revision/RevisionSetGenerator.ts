/**
 * @file RevisionSetGenerator.ts
 * @module domain/memorization_revision
 * @description Generates and adapts deterministic daily revision plans (Parts 20, 22, 23).
 * 
 * CORE PEDAGOGICAL GUARANTEES:
 * - Deterministic plan generation based on priority factors and review urgencies.
 * - Plan Adaptation: Incomplete plans are NEVER classified as student failure (Part 23).
 * - Over-completion does NOT trigger aggressive workload spikes.
 */

import {
  PassageLearningRecord,
  DailyRevisionPlan,
  RevisionSetMode,
  PassageTarget,
  RevisionReasonCode,
  ReviewUrgency,
  MemorizationState,
} from './types.ts';
import { RevisionScheduler } from './RevisionScheduler.ts';
import { RevisionPlanInvalidError } from './errorRegistry.ts';

export interface RevisionPlanOptions {
  studentId: string;
  date?: string; // YYYY-MM-DD
  mode?: RevisionSetMode;
  maxTargets?: number;
  maxMinutes?: number;
  currentTime?: number;
}

export class RevisionSetGenerator {
  public static readonly ALGORITHM_VERSION = 'revision-plan-gen-v1.0.0';
  private readonly scheduler: RevisionScheduler;

  constructor(scheduler?: RevisionScheduler) {
    this.scheduler = scheduler ?? new RevisionScheduler();
  }

  /**
   * Generates a tailored, deterministic DailyRevisionPlan for a student.
   */
  public generateDailyPlan(
    records: readonly PassageLearningRecord[],
    options: RevisionPlanOptions
  ): DailyRevisionPlan {
    if (!options.studentId || options.studentId.trim().length === 0) {
      throw new RevisionPlanInvalidError('studentId is required to generate a daily revision plan');
    }

    const currentTime = options.currentTime ?? Date.now();
    const dateStr = options.date ?? new Date(currentTime).toISOString().split('T')[0];
    const mode = options.mode ?? RevisionSetMode.MIXED;
    const maxTargets = options.maxTargets ?? 10;
    const maxMinutes = options.maxMinutes ?? 30;

    // Evaluate all passages
    const evaluated = this.scheduler.evaluateStudent(records, currentTime);
    const recordsMap = new Map<string, PassageLearningRecord>();
    records.forEach((r) => recordsMap.set(r.passageKey, r));

    const newTargets: PassageTarget[] = [];
    const revisionTargets: PassageTarget[] = [];
    const weakTargets: PassageTarget[] = [];

    // Filter by mode and classify
    for (const res of evaluated) {
      const rec = recordsMap.get(res.passageKey);
      if (!rec) continue;

      const target: PassageTarget = {
        passageKey: rec.passageKey,
        surahId: rec.surahId,
        ayahNumber: rec.ayahNumber,
        reason: res.reasonCodes[0] || RevisionReasonCode.PERIODIC_MAINTENANCE,
        priority: res.priorityFactors.totalPriority,
        estimatedMinutes: 3, // Standard pedagogical allocation: 3 minutes per ayah review
      };

      const isWeak =
        rec.currentState === MemorizationState.WEAKENING ||
        rec.currentState === MemorizationState.NEEDS_REINFORCEMENT ||
        rec.recentErrorOccurrences > 0;

      const isNew =
        rec.currentState === MemorizationState.INTRODUCED ||
        rec.currentState === MemorizationState.LEARNING;

      const isRevision =
        res.urgency === ReviewUrgency.REVIEW_NOW ||
        res.urgency === ReviewUrgency.REVIEW_DUE ||
        res.urgency === ReviewUrgency.REVIEW_SOON ||
        rec.currentState === MemorizationState.REVIEW_DUE;

      if (mode === RevisionSetMode.WEAKNESS) {
        if (isWeak) weakTargets.push(target);
      } else if (mode === RevisionSetMode.DAILY) {
        if (isNew) newTargets.push(target);
        else if (isRevision && !isWeak) revisionTargets.push(target);
      } else if (mode === RevisionSetMode.SPACED) {
        if (isRevision && !isWeak) revisionTargets.push(target);
      } else {
        // MIXED: Balances weak, due revision, and new
        if (isWeak) {
          weakTargets.push(target);
        } else if (isNew) {
          newTargets.push(target);
        } else if (isRevision) {
          revisionTargets.push(target);
        } else if (rec.currentState === MemorizationState.STABLE && res.priorityFactors.totalPriority > 20) {
          revisionTargets.push(target);
        }
      }
    }

    // Sort subsets by priority descending
    newTargets.sort((a, b) => b.priority - a.priority);
    revisionTargets.sort((a, b) => b.priority - a.priority);
    weakTargets.sort((a, b) => b.priority - a.priority);

    // Limit subsets according to maxTargets and maxMinutes
    const selectedNew: PassageTarget[] = [];
    const selectedRev: PassageTarget[] = [];
    const selectedWeak: PassageTarget[] = [];

    let currentMinutes = 0;
    let totalCount = 0;

    // Allocate weak targets first (highest learning priority)
    for (const t of weakTargets) {
      if (totalCount >= maxTargets || currentMinutes + t.estimatedMinutes > maxMinutes) break;
      selectedWeak.push(t);
      currentMinutes += t.estimatedMinutes;
      totalCount++;
    }

    // Allocate spaced revision targets next
    for (const t of revisionTargets) {
      if (totalCount >= maxTargets || currentMinutes + t.estimatedMinutes > maxMinutes) break;
      selectedRev.push(t);
      currentMinutes += t.estimatedMinutes;
      totalCount++;
    }

    // Allocate new learning targets last
    for (const t of newTargets) {
      if (totalCount >= maxTargets || currentMinutes + t.estimatedMinutes > maxMinutes) break;
      selectedNew.push(t);
      currentMinutes += t.estimatedMinutes;
      totalCount++;
    }

    const allSelectedKeys = [
      ...selectedWeak.map((t) => t.passageKey),
      ...selectedRev.map((t) => t.passageKey),
      ...selectedNew.map((t) => t.passageKey),
    ];

    const planId = `plan-${options.studentId}-${dateStr}-${mode.toLowerCase()}`;

    return Object.freeze({
      planId,
      studentId: options.studentId,
      date: dateStr,
      mode,
      newTargets: Object.freeze(selectedNew),
      revisionTargets: Object.freeze(selectedRev),
      weakTargets: Object.freeze(selectedWeak),
      estimatedMinutes: currentMinutes,
      completedTargets: Object.freeze([]),
      remainingTargets: Object.freeze(allSelectedKeys),
      algorithmVersion: RevisionSetGenerator.ALGORITHM_VERSION,
    });
  }

  /**
   * Adapts an existing plan when a student completes a passage (Part 23).
   * Incomplete goals never penalize the student; over-completion avoids excessive inflation.
   */
  public markTargetCompleted(plan: DailyRevisionPlan, completedPassageKey: string): DailyRevisionPlan {
    if (plan.completedTargets.includes(completedPassageKey)) {
      return plan; // Already marked
    }

    const completedTargets = [...plan.completedTargets, completedPassageKey];
    const remainingTargets = plan.remainingTargets.filter((k) => k !== completedPassageKey);

    return Object.freeze({
      ...plan,
      completedTargets: Object.freeze(completedTargets),
      remainingTargets: Object.freeze(remainingTargets),
    });
  }
}
