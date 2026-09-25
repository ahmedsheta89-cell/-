# PHASE 7C: RECOVERY MODEL & FAULT CONTAINMENT SPECIFICATION

## 1. Overview & Recovery Hierarchy

In real-time educational software, hardware instability (microphone disconnects, Bluetooth latency spikes, audio clipping, browser throttling) is guaranteed to occur. The Phase 7C Recovery Engine guarantees:
1. Faults are contained locally and do not crash the application.
2. The user is never presented with raw error stack traces or accusatory messages.
3. The system gracefully degrades along predefined capability tiers.
4. All recovery actions are logged to the `EventJournal` with explicit `RT-xxx` codes.

---

## 2. Safe Error Codes (RT-001 through RT-014)

All real-time failure codes are registered in `docs/ERROR_REGISTRY.md`:

| Error Code | Identifier | Trigger Condition | Automated Containment & Recovery Action |
|---|---|---|---|
| `RT-001` | `MICROPHONE_UNAVAILABLE` | Mic permission denied or hardware not found. | Transition to `ERROR_SAFE_STATE`. Present visual Arabic guidance to enable mic in browser. |
| `RT-002` | `AUDIO_STREAM_INTERRUPTED` | Buffer underrun or mic cable detached. | Reset audio input pipeline. Request learner to repeat verse segment. |
| `RT-003` | `SPEECH_BOUNDARY_UNCERTAIN` | VAD cannot distinguish breath from pause. | Defer interruption. Wait for boundary stabilization or maximum pause timeout. |
| `RT-004` | `MODEL_STREAM_FAILURE` | ONNX session error or unhandled tensor dim. | Terminate inference cleanly. Fall back to safe practice mode; reinitialize session. |
| `RT-005` | `CACHE_CONTINUITY_FAILURE` | Zipformer cached state tensors diverged or NaN. | Log `CACHE_RESET`. Zero-initialize cache tensors. Re-establish alignment baseline. |
| `RT-006` | `ALIGNMENT_STALE` | Alignment computed after student advanced. | Discard alignment. Update target word pointer to active student location. |
| `RT-007` | `DECISION_STALE` | Phase 5C decision resolved after speech window. | Drop candidate decision with `STALE_EVENT`. Suppress delayed interruption. |
| `RT-008` | `LANGUAGE_RESPONSE_STALE` | Generative LLM exceeded 1500ms timeout. | Abort LLM stream. Deploy `DeterministicFallbackProvider` instantly. |
| `RT-009` | `TTS_FAILURE` | Web Speech API threw error or audio blocked. | Fall back to visual text output (`VOICE_FAILURE -> TEXT_FEEDBACK`). |
| `RT-010` | `ECHO_DETECTED` | Teacher voice re-ingested by microphone. | Suppress microphone frames while `teacherSpeaking === true`. |
| `RT-011` | `SESSION_SEQUENCE_MISMATCH` | Out-of-order event sequence received. | Discard event. Enforce strictly monotonic progression. |
| `RT-012` | `DUPLICATE_FEEDBACK` | Same decision/hash queued within repeat window. | Suppress duplicate notification. Retain single feedback item. |
| `RT-013` | `TEACHER_INTERRUPT_CANCELLED` | Student resumed reciting before teacher spoke. | Cancel interruption token immediately. Return to `STUDENT_SPEAKING`. |
| `RT-014` | `RECOVERY_REQUIRED` | Composite or unexpected exception thrown. | Enter `RECOVERY`, clear locks, re-zero state, and present calm restart prompt. |

---

## 3. Four-Tier Graceful Degradation Architecture

```
[Level 1: FULL STACK]
Audio + Zipformer + Alignment + Decision + Policy + Gemini LLM + TTS Audio
       ↓ (Network latency > 1500ms or Gemini API offline)
[Level 2: DETERMINISTIC VOICE]
Audio + Zipformer + Alignment + Decision + Policy + Deterministic Arabic Realization + TTS Audio
       ↓ (Browser Speech Synthesis unavailable or muted)
[Level 3: TEXT-ONLY TUTOR]
Audio + Zipformer + Alignment + Decision + Policy + High-Contrast Arabic UI Text Only
       ↓ (Acoustic model unavailable or ONNX failure)
[Level 4: INTERACTIVE READ-ALONG]
Manual Audio Playback & Ground-Truth Verified Uthmani Quran Display
```

### Invariant on Acoustic Honesty
The system **never** simulates or fabricates acoustic evaluation. If the acoustic model or microphone is unavailable, the application strictly informs the learner that live acoustic feedback is paused, rather than guessing.
