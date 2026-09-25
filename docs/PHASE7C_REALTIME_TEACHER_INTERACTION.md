# PHASE 7C: REAL-TIME TEACHER INTERACTION & RECITATION UX SPECIFICATION

## 1. Mission & Architectural Mandate

Phase 7C establishes the deterministic, low-latency, and pedagogical orchestration layer that connects the verified Quran Teacher AI pipeline to an interactive recitation experience.

```
+-----------------------------------------------------------------------------------+
|                            THE COMPLETE AUTHORITY CHAIN                           |
+-----------------------------------------------------------------------------------+
| 1. WHAT THE MICROPHONE MEASURED            (Audio Capture, VAD, 16kHz PCM)       |
| 2. WHAT THE ACOUSTIC MODEL INFERRED        (Kaldi FBank + Real Zipformer-CTC)    |
| 3. WHAT ALIGNMENT ESTABLISHED              (Phase 5A DP/DTW Quran-Aware Tokens)  |
| 4. WHAT DETERMINISTIC TAJWEED KNOWS        (Phase 5B Knowledge Base Evidence)    |
| 5. WHAT THE TEACHER POLICY DECIDED         (Phase 5C Decision + Phase 7A Policy) |
| 6. WHAT THE AI LANGUAGE LAYER SAID         (Phase 7B Grounded Realization & Fallback)|
| 7. WHAT THE REAL-TIME ORCHESTRATOR EXECUTED(Phase 7C Turn-Taking, State Machine, UI)|
| 8. WHAT A QUALIFIED HUMAN TEACHER/SCHOLAR MAY CONCLUDE                           |
+-----------------------------------------------------------------------------------+
```

Under NO circumstances does Phase 7C bypass any authoritative layer, mutate Quran text, invent Tajweed rules, or issue religious rulings (Lahn Jaliyy / Lahn Khafiyy, Batil, Haram).

---

## 2. Core Pipeline Flow

The execution graph strictly enforces sequential gate verification:

```
MICROPHONE (16kHz PCM Ingress)
   ↓
Audio Capture & Separation (Student vs Teacher vs Noise)
   ↓
Signal Quality & Energy Assessment (SNR >= 10dB)
   ↓
Voice Activity Detector (VAD State & Turn Detection)
   ↓
Streaming PCM Slicing (20ms frames, lookahead)
   ↓
Kaldi 80-bin FBank Extraction
   ↓
Zipformer CTC Acoustic Model (40ms output frames)
   ↓
Streaming Cache State (cached_len, avg, key, val)
   ↓
Quran-Aware Phonetic Alignment (DP Matrix)
   ↓
RecitationEvidence Generation (Acoustic Margins)
   ↓
Phase 5C Recitation Decision Engine
   ↓
Phase 7A Pedagogical Policy Engine (Authorization & Debounce)
   ↓
Phase 7B Evidence-Grounded Language Layer (or Fallback)
   ↓
Teacher Voice (ITeacherVoiceProvider) & UI Highlights
   ↓
Guided Repeat / Confirmation / Ayah Completion
```

---

## 3. Key Subsystems & Design Principles

### 3.1 Behave Like a Real Teacher
A qualified Quran teacher does not interrupt on every acoustic fluctuation. The orchestrator abides by:
- **Listen**: Continuously stream audio, compute acoustic evidence, and update visual state without interrupting.
- **Wait**: Allow the student to complete their utterance or reach a confirmed speech boundary.
- **Understand Enough**: Ensure evidence has transitioned from `PROVISIONAL` to `STABLE` or `FINAL`.
- **Decide**: Pass evidence through the deterministic Phase 5C decision engine.
- **Intervene Only When Justified**: Require Phase 7A `INTERRUPT_RECOMMENDED`, non-cooldown window, and active target sync.
- **Explain Briefly**: Cap explanations at maximum word counts in Classical Arabic or Egyptian Dialect.
- **Listen Again**: Transition to `WAITING_FOR_REPEAT` with clear visual cues.
- **Confirm**: Verify repeated utterance against ground-truth evidence before advancing.

### 3.2 Immutability & Event Security
Every event is encapsulated in a `RealTimeEventEnvelope`:
- Monotonic sequence checking (`eventSequence >= currentSequence`).
- Deduplication via SHA-256 evidence hashing and utterance IDs.
- Cryptographic logging to `EventJournal` with chained hashes.
- Absolute zero raw audio retention by default (`rawAudioPersistence = false`).

---

## 4. Interaction Modes

Phase 7C natively supports 5 explicit, versioned interaction modes:

| Mode | Interruption Active | Repeat Loop | Primary Pedagogical Purpose |
|---|---|---|---|
| `REAL_TIME_TUTOR` | Yes (debounced) | Yes | Active one-on-one guided recitation session. |
| `LISTEN_ONLY` | No | No | Uninterrupted continuous recitation with live visual tracking. |
| `GUIDED_REPEAT` | Yes | Yes (enforced) | Focused drill on specific difficult words/phonemes. |
| `REVIEW_MODE` | No | No | Full surah recording/tracking; summary feedback at session end. |
| `PRACTICE_MODE` | Yes (gentle) | Optional | Single ayah repetitive recitation. |

---

## 5. Architectural Invariants

1. **Zero Bypassing**: `RecitationEvidence` must originate from acoustic alignment; `TeacherFeedbackIntent` must originate from Phase 7A; spoken text must be validated by Phase 7B.
2. **Audio Separation**: Teacher audio playback locks incoming student recognition, preventing self-echo feedback loops.
3. **Deterministic Fallback**: If Gemini or network latency exceeds 1500ms, `DeterministicFallbackProvider` produces the exact authorized message within <5ms.
4. **Non-Penalizing Inconclusive Outcomes**: Acoustic ambiguity or noise is never marked as a confirmed phonetic error in the student's progress journal.
5. **Separation of Concerns**: Tajweed correctness and audio energy level are visually decoupled. Audio level indicators represent acoustic decibels, never recitation quality.
