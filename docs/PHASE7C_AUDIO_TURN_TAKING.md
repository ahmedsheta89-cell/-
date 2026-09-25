# PHASE 7C: AUDIO TURN-TAKING & SPEAKER SEPARATION SPECIFICATION

## 1. Overview & Pedagogical Mandate

Recitation teaching requires fluid, respectful turn-taking. Constant or premature interruption distracts the student and breaks their hifdh (memorization) and khushu' (contemplation). The `AudioTurnTakingDetector` and `InterruptionController` implement strict pedagogical rules governing:
1. Turn boundaries (when is the student actually finished vs pausing to take a breath).
2. Speaker separation (preventing teacher speech from contaminating the student's acoustic stream).
3. Interruption windows (canceling or deferring corrections if the student is actively speaking).

---

## 2. Audio Classification & Separation

Audio frames arriving at the 16kHz PCM ingress are classified into one of five categories:

```
[Audio Ingress] 
       |
       +---> TEACHER_AUDIO (Active TTS playback / loopback suppression)
       |
       +---> SILENCE (RMS < -45 dBFS, VAD energy below threshold)
       |
       +---> NOISE (SNR < 10 dB, spectral entropy non-speech)
       |
       +---> SYSTEM_AUDIO (UI chime / alert / tone)
       |
       +---> STUDENT_AUDIO (Active recitation, SNR >= 10 dB, VAD active)
```

### Echo Protection & Suppression Invariant
When the teacher is speaking (`teacherSpeaking === true`):
- All microphone frames are tagged as `TEACHER_AUDIO` or suppressed.
- No phonetic recognition, token accumulation, or alignment is performed.
- Hardware acoustic echo cancellation (AEC) is requested from `navigator.mediaDevices.getUserMedia({ echoCancellation: true })`.
- Software gate rejects incoming audio if root-mean-square amplitude does not exceed speech threshold above teacher baseline.

---

## 3. Speech Boundary & Pause Detection

Quranic recitation involves natural pauses, intra-word elongation, and breath pauses. The turn-taking detector differentiates between these states:

| Pause Type | Duration Range | Pedagogical Interpretation | System Action |
|---|---|---|---|
| **Intra-Word Micro-Pause** | < 250ms | Normal phonetic transition (e.g. Qalqalah release, unvoiced stop). | Maintain `STUDENT_SPEAKING`; do not trigger boundary. |
| **Breath Pause** | 250ms – 700ms | Student taking breath between words or ayaat. | Transition to `WAITING_FOR_BOUNDARY`; defer interruption. |
| **Intentional Waqf (Stop)** | 700ms – 1500ms | Deliberate stop at end of verse or permissible stopping point. | Confirm boundary; proceed to `ANALYZING` and `DECIDING`. |
| **Recitation Cessation / Silence** | > 1500ms | Student finished or struggling with recall. | Trigger turn handover or gentle prompt if expected. |

---

## 4. Interruption Controller & Window Management

The `InterruptionController` governs whether a pedagogical intervention authorized by Phase 7A can be executed immediately:

### 4.1 Interruption States
- `INTERRUPTION_ALLOWED`: All conditions met; teacher may speak now.
- `INTERRUPTION_DELAYED`: Correction warranted, but student is currently in mid-word; wait for speech boundary.
- `INTERRUPTION_BLOCKED`: System in cooldown, student in non-interruptible mode, or SNR inadequate.
- `INTERRUPTION_CANCELLED`: Pending interruption revoked due to context shift.

### 4.2 Cancellation Rules
A scheduled interruption is immediately cancelled (`INTERRUPTION_CANCELLED`) if:
1. The student resumes speaking before the teacher begins.
2. The recitation pointer moved ahead to a subsequent word (`currentWordIndex > targetWordIndex`).
3. The monotonic sequence counter advanced (`sessionSequence` or `eventSequence` mismatch).
4. The alignment becomes unstable or invalidated.
5. The session is paused or terminated by the user.

### 4.3 Versioned Timing Policy
All timing constants are immutable and defined in `CANONICAL_TIMING_POLICY`:
```typescript
export const CANONICAL_TIMING_POLICY: TeacherInteractionTimingPolicy = Object.freeze({
  policyVersion: 'timing-policy-v1.0.0-phase7c',
  minInterruptionIntervalMs: 3000,           // 3.0s minimum cooldown between interventions
  minAnalysisWindowMs: 200,                  // 200ms minimum speech slice before evaluation
  speechBoundarySilenceThresholdMs: 450,     // 450ms silence needed to declare speech end
  intraWordPauseToleranceMs: 250,            // 250ms ignored as internal word pause
  breathPauseToleranceMs: 700,               // 700ms tolerated as permissible breath
  maxLlmLatencyMs: 1500,                     // 1500ms hard ceiling on generative realization
  ttsTimeoutMs: 4000,                        // 4.0s timeout on speech synthesis playback
  staleEventThresholdMs: 5000,               // 5.0s maximum age before event dropped as stale
});
```
