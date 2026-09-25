/**
 * @file RealTimeStateMachine.ts
 * @module domain/realtime_teacher
 * @description Pure deterministic finite state machine governing real-time recitation teaching (Sections 3, 4).
 */

import { RealTimeTeacherSessionState } from './types.ts';

export type StateTransitionTrigger =
  | 'INITIALIZE_REQUESTED'
  | 'INITIALIZATION_COMPLETED'
  | 'SPEECH_DETECTED'
  | 'SPEECH_PAUSED'
  | 'BOUNDARY_CONFIRMED'
  | 'ANALYSIS_STARTED'
  | 'EVIDENCE_READY'
  | 'DECISION_MADE'
  | 'FEEDBACK_PREPARED'
  | 'TEACHER_SPEAKING_STARTED'
  | 'TEACHER_SPEAKING_COMPLETED'
  | 'REPEAT_REQUESTED'
  | 'CONFIRMATION_EVALUATED'
  | 'CONTINUE_TO_NEXT'
  | 'PAUSE_REQUESTED'
  | 'RESUME_REQUESTED'
  | 'RECOVERY_TRIGGERED'
  | 'RECOVERY_RESOLVED'
  | 'END_REQUESTED'
  | 'CRITICAL_ERROR_TRIGGERED'
  | 'RESET_TO_IDLE';

export interface StateTransitionEvent {
  readonly fromState: RealTimeTeacherSessionState;
  readonly toState: RealTimeTeacherSessionState;
  readonly trigger: StateTransitionTrigger;
  readonly timestamp: number;
  readonly reason?: string;
}

/**
 * Permitted transitions matrix enforcing mathematical determinism.
 */
const VALID_TRANSITIONS: Record<RealTimeTeacherSessionState, readonly RealTimeTeacherSessionState[]> = {
  [RealTimeTeacherSessionState.IDLE]: [
    RealTimeTeacherSessionState.INITIALIZING,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.INITIALIZING]: [
    RealTimeTeacherSessionState.LISTENING,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.LISTENING]: [
    RealTimeTeacherSessionState.STUDENT_SPEAKING,
    RealTimeTeacherSessionState.ANALYZING,
    RealTimeTeacherSessionState.LISTENING,
    RealTimeTeacherSessionState.PAUSED,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.STUDENT_SPEAKING]: [
    RealTimeTeacherSessionState.WAITING_FOR_BOUNDARY,
    RealTimeTeacherSessionState.ANALYZING, // If immediate stable boundary
    RealTimeTeacherSessionState.PAUSED,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.WAITING_FOR_BOUNDARY]: [
    RealTimeTeacherSessionState.STUDENT_SPEAKING, // Student resumed speaking (breath/intra-word)
    RealTimeTeacherSessionState.ANALYZING,
    RealTimeTeacherSessionState.PAUSED,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.ANALYZING]: [
    RealTimeTeacherSessionState.DECIDING,
    RealTimeTeacherSessionState.LISTENING, // Inconclusive / silent continue
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.DECIDING]: [
    RealTimeTeacherSessionState.TEACHER_PREPARING_RESPONSE,
    RealTimeTeacherSessionState.CONTINUING,
    RealTimeTeacherSessionState.LISTENING,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.TEACHER_PREPARING_RESPONSE]: [
    RealTimeTeacherSessionState.TEACHER_SPEAKING,
    RealTimeTeacherSessionState.WAITING_FOR_REPEAT, // If text-only mode
    RealTimeTeacherSessionState.CONTINUING,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.TEACHER_SPEAKING]: [
    RealTimeTeacherSessionState.WAITING_FOR_REPEAT,
    RealTimeTeacherSessionState.CONTINUING,
    RealTimeTeacherSessionState.LISTENING,
    RealTimeTeacherSessionState.PAUSED,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.WAITING_FOR_REPEAT]: [
    RealTimeTeacherSessionState.STUDENT_SPEAKING,
    RealTimeTeacherSessionState.ANALYZING,
    RealTimeTeacherSessionState.CONFIRMING,
    RealTimeTeacherSessionState.LISTENING,
    RealTimeTeacherSessionState.PAUSED,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.CONFIRMING]: [
    RealTimeTeacherSessionState.CONTINUING,
    RealTimeTeacherSessionState.TEACHER_PREPARING_RESPONSE, // Re-escalation
    RealTimeTeacherSessionState.WAITING_FOR_REPEAT,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.CONTINUING]: [
    RealTimeTeacherSessionState.LISTENING,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.PAUSED,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.PAUSED]: [
    RealTimeTeacherSessionState.LISTENING,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.IDLE,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
  ],
  [RealTimeTeacherSessionState.RECOVERY]: [
    RealTimeTeacherSessionState.LISTENING,
    RealTimeTeacherSessionState.INITIALIZING,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.ERROR_SAFE_STATE,
    RealTimeTeacherSessionState.IDLE,
  ],
  [RealTimeTeacherSessionState.ENDED]: [
    RealTimeTeacherSessionState.IDLE,
    RealTimeTeacherSessionState.INITIALIZING,
  ],
  [RealTimeTeacherSessionState.ERROR_SAFE_STATE]: [
    RealTimeTeacherSessionState.RECOVERY,
    RealTimeTeacherSessionState.ENDED,
    RealTimeTeacherSessionState.IDLE,
    RealTimeTeacherSessionState.INITIALIZING,
  ],
};

export class RealTimeStateMachine {
  private currentState: RealTimeTeacherSessionState = RealTimeTeacherSessionState.IDLE;
  private transitionHistory: StateTransitionEvent[] = [];
  private listeners: ((event: StateTransitionEvent) => void)[] = [];

  public getState(): RealTimeTeacherSessionState {
    return this.currentState;
  }

  public getHistory(): readonly StateTransitionEvent[] {
    return Object.freeze([...this.transitionHistory]);
  }

  public registerListener(listener: (event: StateTransitionEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Attempts a deterministic state transition. Throws if invalid.
   */
  public transition(
    toState: RealTimeTeacherSessionState,
    trigger: StateTransitionTrigger,
    reason?: string
  ): StateTransitionEvent {
    const validNextStates = VALID_TRANSITIONS[this.currentState];
    if (!validNextStates.includes(toState)) {
      throw new Error(
        `[RealTimeStateMachine] Invalid deterministic transition from ${this.currentState} to ${toState} via trigger ${trigger}. Reason: ${reason || 'N/A'}`
      );
    }

    const event: StateTransitionEvent = Object.freeze({
      fromState: this.currentState,
      toState,
      trigger,
      timestamp: Date.now(),
      reason,
    });

    this.currentState = toState;
    this.transitionHistory.push(event);

    for (const listener of this.listeners) {
      listener(event);
    }

    return event;
  }

  public forceErrorSafeState(reason: string): StateTransitionEvent {
    const event: StateTransitionEvent = Object.freeze({
      fromState: this.currentState,
      toState: RealTimeTeacherSessionState.ERROR_SAFE_STATE,
      trigger: 'CRITICAL_ERROR_TRIGGERED',
      timestamp: Date.now(),
      reason,
    });

    this.currentState = RealTimeTeacherSessionState.ERROR_SAFE_STATE;
    this.transitionHistory.push(event);

    for (const listener of this.listeners) {
      listener(event);
    }

    return event;
  }

  public reset(): void {
    this.currentState = RealTimeTeacherSessionState.IDLE;
    this.transitionHistory = [];
  }
}
