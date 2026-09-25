# PHASE 7C: REAL-TIME SESSION STATE MACHINE SPECIFICATION

## 1. Overview

The `RealTimeStateMachine` is a deterministic finite-state automaton that governs the real-time interaction lifecycle of the Quran Teacher AI. It enforces mathematical invariants on transitions, forbidding invalid states (such as speaking while analyzing, or progressing without evidence).

---

## 2. State Definitions

| State | Purpose & Active Operations | Invariants & Constraints |
|---|---|---|
| `IDLE` | Quiescent state prior to session commencement. | No microphone processing. Zero audio ingress. |
| `INITIALIZING` | Loading verified Quran texts, Zipformer model, Kaldi FBank, and streaming cache. | No learner feedback emitted. Strict validation of configs. |
| `LISTENING` | Awaiting student recitation onset. VAD and SNR active. | Continuously checking background noise and echo levels. |
| `STUDENT_SPEAKING` | Student is actively vocalizing. Audio streaming to FBank and CTC. | Never interrupt merely due to an intermediate partial token. |
| `WAITING_FOR_BOUNDARY` | VAD indicates trailing silence; waiting for speech boundary stabilization. | Distinguish breath pauses (300-700ms) from actual phrase termination. |
| `ANALYZING` | Computing phoneme alignment, acoustic margins, and Tajweed evidence. | Operates on stabilized frames; avoids provisional token drift. |
| `DECIDING` | Phase 5C Recitation Decision Engine processing. | Categorizes outcome: MATCH, CONFIRMED_ERROR, AMBIGUOUS, etc. |
| `TEACHER_PREPARING_RESPONSE` | Phase 7A Pedagogical Policy determines authorized action. Phase 7B initiates realization. | Enforces 1500ms timeout guard; switches to deterministic fallback if breached. |
| `TEACHER_SPEAKING` | Voice output provider is active (browser speech synthesis or text display). | `teacherSpeaking = true`. Ingress audio suppressed to avoid acoustic feedback. |
| `WAITING_FOR_REPEAT` | Prompt delivered; awaiting student re-recitation of target word. | Visual state indicates `TARGET_FOR_REPEAT`. Retry counter incremented. |
| `CONFIRMING` | Evaluating retry attempt against reference token. | Requires ground-truth acoustic match before accepting repetition. |
| `CONTINUING` | Repetition verified; acknowledging success and advancing position pointer. | Advances current word index; resets retry counter. |
| `PAUSED` | User requested pause or browser tab switched away. | Streaming audio suspended; active timers halted. |
| `RECOVERY` | Non-fatal anomaly handled (cache corruption, audio dropout, timeout). | Cache re-zeroed; audio buffers flushed; session resumes safely. |
| `ENDED` | Recitation finished or user stopped session. | Memory cleared; progress journal finalized; microphone released. |
| `ERROR_SAFE_STATE` | Unrecoverable failure occurred (mic denied, catastrophic exception). | Audio locks freed; teacher output stopped; polite Arabic recovery displayed. |

---

## 3. Transition Matrix & Permitted Paths

```
IDLE
  ↓ (startSession)
INITIALIZING
  ↓ (initSuccess)
LISTENING  <======================================+
  ↓ (speechDetected)                              |
STUDENT_SPEAKING                                  |
  ↓ (silenceDetected)                             |
WAITING_FOR_BOUNDARY                              |
  ↓ (boundaryConfirmed)                           |
ANALYZING                                         |
  ↓ (analysisDone)                                |
DECIDING                                          |
  ↓ (MATCH) --------------------------------------+ (Continue listening)
  ↓ (CONFIRMED_ERROR / INTERVENTION_NEEDED)
TEACHER_PREPARING_RESPONSE
  ↓ (responseReady / fallbackReady)
TEACHER_SPEAKING
  ↓ (speechFinished)
WAITING_FOR_REPEAT
  ↓ (repeatDetected)
STUDENT_SPEAKING -> WAITING_FOR_BOUNDARY -> ANALYZING -> CONFIRMING
                                                           ↓ (PASS)
                                                       CONTINUING
                                                           ↓
                                                       LISTENING
```

### Transition Validity Matrix
```typescript
const VALID_TRANSITIONS: Record<RealTimeTeacherSessionState, RealTimeTeacherSessionState[]> = {
  IDLE: [INITIALIZING, ENDED],
  INITIALIZING: [LISTENING, ERROR_SAFE_STATE],
  LISTENING: [STUDENT_SPEAKING, ANALYZING, LISTENING, PAUSED, ENDED, RECOVERY, ERROR_SAFE_STATE],
  STUDENT_SPEAKING: [WAITING_FOR_BOUNDARY, ANALYZING, TEACHER_SPEAKING, PAUSED, ENDED, RECOVERY, ERROR_SAFE_STATE],
  WAITING_FOR_BOUNDARY: [ANALYZING, STUDENT_SPEAKING, PAUSED, ENDED, RECOVERY, ERROR_SAFE_STATE],
  ANALYZING: [DECIDING, LISTENING, STUDENT_SPEAKING, PAUSED, ENDED, RECOVERY, ERROR_SAFE_STATE],
  DECIDING: [TEACHER_PREPARING_RESPONSE, CONTINUING, LISTENING, WAITING_FOR_REPEAT, PAUSED, ENDED, RECOVERY, ERROR_SAFE_STATE],
  TEACHER_PREPARING_RESPONSE: [TEACHER_SPEAKING, LISTENING, WAITING_FOR_REPEAT, PAUSED, ENDED, RECOVERY, ERROR_SAFE_STATE],
  TEACHER_SPEAKING: [WAITING_FOR_REPEAT, CONTINUING, LISTENING, PAUSED, ENDED, RECOVERY, ERROR_SAFE_STATE],
  WAITING_FOR_REPEAT: [STUDENT_SPEAKING, ANALYZING, CONFIRMING, LISTENING, PAUSED, RECOVERY, ERROR_SAFE_STATE, ENDED],
  CONFIRMING: [CONTINUING, WAITING_FOR_REPEAT, TEACHER_PREPARING_RESPONSE, LISTENING, PAUSED, RECOVERY, ERROR_SAFE_STATE, ENDED],
  CONTINUING: [LISTENING, WAITING_FOR_REPEAT, ENDED, PAUSED, RECOVERY, ERROR_SAFE_STATE],
  PAUSED: [LISTENING, STUDENT_SPEAKING, WAITING_FOR_REPEAT, ENDED, ERROR_SAFE_STATE],
  RECOVERY: [LISTENING, WAITING_FOR_REPEAT, ERROR_SAFE_STATE, ENDED],
  ENDED: [IDLE],
  ERROR_SAFE_STATE: [IDLE, RECOVERY, ENDED],
};
```

---

## 4. State Invariant Assertions

1. **Deterministic Guarantees**: A transition to an unauthorized state throws `InvalidStateTransitionError` immediately and records the error code `RT-014 (RECOVERY_REQUIRED)`.
2. **Audio Lock Synchronization**: During `TEACHER_SPEAKING`, the state machine signals the audio ingress system to discard microphone frames, preventing echo self-interference.
3. **Session Monotonicity**: All state transitions record an incrementing `eventSequence` number and hash snapshot in the `EventJournal`.
