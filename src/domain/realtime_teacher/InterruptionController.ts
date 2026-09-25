/**
 * @file InterruptionController.ts
 * @module domain/realtime_teacher
 * @description Dedicated Interruption Window and Cancellation Controller (Sections 8, 9, 10).
 * 
 * CORE CONTRACT:
 * - Controls whether an authorized pedagogical interruption can be delivered immediately.
 * - States: INTERRUPTION_ALLOWED, INTERRUPTION_DELAYED, INTERRUPTION_BLOCKED, INTERRUPTION_CANCELLED.
 * - Enforces minimum interruption interval (3000ms cooldown).
 * - Enforces strict cancellation if student resumes speaking, target changes, sequence advances, or session pauses.
 */

import {
  InterruptionState,
  TeacherInteractionTimingPolicy,
  CANONICAL_TIMING_POLICY,
  EvidenceStabilizationState,
} from './types.ts';
import { PedagogicalAction, TeacherFeedbackIntent } from '../teacher_policy/types.ts';
import { RecitationDecisionState } from '../recitation/decisionTypes.ts';

export interface InterruptionEvaluationContext {
  readonly action: PedagogicalAction;
  readonly decisionState: RecitationDecisionState;
  readonly stabilizationState: EvidenceStabilizationState;
  readonly isStudentSpeaking: boolean;
  readonly isStudentInterruptible: boolean;
  readonly currentWordIndex: number;
  readonly targetWordIndex: number;
  readonly currentSessionSequence: number;
  readonly intentSessionSequence: number;
  readonly currentEventSequence: number;
  readonly intentEventSequence: number;
  readonly isSessionPaused: boolean;
  readonly timestamp: number;
  readonly snrDb: number;
  readonly confidence: number;
}

export interface InterruptionEvaluationResult {
  readonly state: InterruptionState;
  readonly reason: string;
  readonly canInterruptNow: boolean;
  readonly mustCancelPending: boolean;
}

export class InterruptionController {
  private lastInterruptionTimeMs: number = 0;
  private readonly timingPolicy: TeacherInteractionTimingPolicy;
  private pendingInterruption: {
    targetWordIndex: number;
    sessionSequence: number;
    eventSequence: number;
    scheduledTimeMs: number;
  } | null = null;

  constructor(timingPolicy: TeacherInteractionTimingPolicy = CANONICAL_TIMING_POLICY) {
    this.timingPolicy = timingPolicy;
  }

  public getTimingPolicy(): TeacherInteractionTimingPolicy {
    return this.timingPolicy;
  }

  public getLastInterruptionTimeMs(): number {
    return this.lastInterruptionTimeMs;
  }

  public recordInterruption(timestamp: number = Date.now()): void {
    this.lastInterruptionTimeMs = timestamp;
    this.pendingInterruption = null;
  }

  public reset(): void {
    this.lastInterruptionTimeMs = 0;
    this.pendingInterruption = null;
  }

  /**
   * Evaluates if an authorized correction can be delivered now, delayed, blocked, or cancelled (Section 8, 9).
   */
  public evaluate(context: InterruptionEvaluationContext): InterruptionEvaluationResult {
    // 1. Check Session Paused -> INTERRUPTION_BLOCKED or CANCELLED
    if (context.isSessionPaused) {
      this.pendingInterruption = null;
      return {
        state: InterruptionState.INTERRUPTION_BLOCKED,
        reason: 'SESSION_PAUSED',
        canInterruptNow: false,
        mustCancelPending: true,
      };
    }

    // 2. Check Sequence Synchronization (Section 11, 12)
    if (
      context.intentSessionSequence !== context.currentSessionSequence ||
      context.intentEventSequence < context.currentEventSequence
    ) {
      this.pendingInterruption = null;
      return {
        state: InterruptionState.INTERRUPTION_CANCELLED,
        reason: 'SEQUENCE_ADVANCED_OR_STALE',
        canInterruptNow: false,
        mustCancelPending: true,
      };
    }

    // 3. Target Moved Ahead (student moved to subsequent word)
    if (context.currentWordIndex > context.targetWordIndex) {
      this.pendingInterruption = null;
      return {
        state: InterruptionState.INTERRUPTION_CANCELLED,
        reason: 'TARGET_MOVED_AHEAD',
        canInterruptNow: false,
        mustCancelPending: true,
      };
    }

    // 4. Evidence Stabilization Check (Section 16: Provisional evidence NEVER interrupts)
    if (context.stabilizationState === EvidenceStabilizationState.PROVISIONAL) {
      return {
        state: InterruptionState.INTERRUPTION_BLOCKED,
        reason: 'PROVISIONAL_EVIDENCE_NOT_AUTHORITATIVE',
        canInterruptNow: false,
        mustCancelPending: false,
      };
    }

    // 5. Check Signal Quality & Acoustic Confidence Thresholds
    if (context.snrDb < 10.0 || context.confidence < 0.85) {
      return {
        state: InterruptionState.INTERRUPTION_BLOCKED,
        reason: 'LOW_CONFIDENCE_OR_MARGINAL_SNR',
        canInterruptNow: false,
        mustCancelPending: false,
      };
    }

    // 6. Check Interruption Cooldown Interval (Section 10)
    const timeSinceLast = context.timestamp - this.lastInterruptionTimeMs;
    if (timeSinceLast < this.timingPolicy.minInterruptionIntervalMs) {
      return {
        state: InterruptionState.INTERRUPTION_DELAYED,
        reason: `COOLDOWN_ACTIVE_${this.timingPolicy.minInterruptionIntervalMs - timeSinceLast}MS_REMAINING`,
        canInterruptNow: false,
        mustCancelPending: false,
      };
    }

    // 7. Check if Student is currently mid-word / speaking (Turn-taking: wait for boundary)
    if (context.isStudentSpeaking && !context.isStudentInterruptible) {
      this.pendingInterruption = {
        targetWordIndex: context.targetWordIndex,
        sessionSequence: context.currentSessionSequence,
        eventSequence: context.currentEventSequence,
        scheduledTimeMs: context.timestamp,
      };
      return {
        state: InterruptionState.INTERRUPTION_DELAYED,
        reason: 'STUDENT_SPEAKING_WAIT_FOR_SPEECH_BOUNDARY',
        canInterruptNow: false,
        mustCancelPending: false,
      };
    }

    // 8. If all criteria pass: INTERRUPTION_ALLOWED
    return {
      state: InterruptionState.INTERRUPTION_ALLOWED,
      reason: 'INTERRUPTION_AUTHORIZED_AND_TIMED',
      canInterruptNow: true,
      mustCancelPending: false,
    };
  }

  /**
   * Checks if an existing pending interruption must be cancelled due to ongoing speech or target change.
   */
  public shouldCancelPending(
    currentWordIndex: number,
    sessionSequence: number,
    isStudentResumed: boolean
  ): boolean {
    if (!this.pendingInterruption) return false;

    if (
      currentWordIndex > this.pendingInterruption.targetWordIndex ||
      sessionSequence !== this.pendingInterruption.sessionSequence ||
      isStudentResumed
    ) {
      this.pendingInterruption = null;
      return true;
    }
    return false;
  }
}
