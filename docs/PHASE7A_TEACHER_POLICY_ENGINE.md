# PHASE 7A: TEACHER POLICY & PEDAGOGICAL DECISION ENGINE
## Architecture, Contracts, Invariants, and Enforcement

---

## 1. Architectural Mission & Invariants

The Teacher Policy Engine is the authoritative, evidence-grounded controller for human and AI teacher actions in the Quran Teacher AI system. It consumes deterministic recitation decision outputs (from Phase 5C) and verified student learning state, and transforms them into an immutable pedagogical action envelope:

```
Verified Quran Context (HAFS_OFFICIAL_CERTIFICATE)
        ↓
Real Recitation Evidence (Acoustic Confidence, SNR, Timelines)
        ↓
Deterministic Tajweed Knowledge Base (TAJWEED_KB_CHECKSUM_SHA256)
        ↓
Recitation Error Decision Engine (Phase 5C: Bit-for-bit Deterministic)
        ↓
═══════════════════════════════════════════════════════════════════════
  PHASE 7A: TEACHER POLICY & PEDAGOGICAL DECISION ENGINE
  - Multi-Gate Cryptographic Hash & Riwayah Verification
  - Signal Degradation & Acoustic Limitation Safety Guards
  - Alignment Cascading Error Barrier (ERR-DEC-001)
  - Student Fatigue & Cognitive Protection Debounce
  - Escalation Ladder (Levels 0-5) & Multi-Error Aggregation
  - Immutable Teacher Feedback Intent (Boundary Token Enforced)
═══════════════════════════════════════════════════════════════════════
        ↓
Downstream Teacher UI & Future LLM Natural Language Layer (Bound & Constrained)
```

### Absolute Invariants
1. **Zero LLM Religious Verdicts**: No generative model is permitted to declare a recitation "حلال", "حرام", "باطل", "صحيحة شرعًا", or issue any Fatwa/Hukm.
2. **Zero Quran Text Hallucination**: All scripture text quoted to the learner originates strictly from verified canonical Mushaf datasets; the downstream LLM cannot invent or modify Quranic text.
3. **No LLM Action Overrides**: The LLM consumes the `TeacherFeedbackIntent` as a fixed constraint. If the LLM returns an action different from the authorized policy action, the validator instantly rejects it and falls back to the safe deterministic prompt.
4. **Conservative Default**: In any acoustic ambiguity (SNR < 10 dB, confidence < 0.90, alignment slip), the engine requests repetition or clearer audio; it NEVER fabricates an error accusation.
5. **Deep Immutability**: All input contexts and generated decision envelopes are deeply frozen using recursive `deepFreeze`.

---

## 2. Core Domain Contracts (`src/domain/teacher_policy/types.ts`)

### Pedagogical Action Enum (`PedagogicalAction`)
- `CONTINUE`: Reciter passed cleanly; recite next token/word silently.
- `PRAISE_AND_CONTINUE`: Milestone completed with high accuracy; gentle encouragement provided.
- `REQUEST_REPEAT`: Discrepancy observed or confidence insufficient; ask for re-recitation.
- `REQUEST_CLEARER_AUDIO`: Signal degraded (SNR < 10 dB, clipping, silence, white noise); ask reciter to check microphone.
- `HIGHLIGHT_POSITION`: Second repeated discrepancy; highlight specific phoneme index.
- `HIGHLIGHT_WORD`: Multiple errors in same word; highlight entire word to prevent cognitive overload.
- `CORRECT_PHONETICALLY`: Direct phonetic instruction for clear articulation mismatch.
- `START_GUIDED_REPEAT`: Third repeated discrepancy; initiate slow, stepped teacher-guided recitation.
- `PAUSE_AND_EXPLAIN`: Fourth repeated discrepancy; brief explanation of phonetic articulation.
- `MARK_FOR_REVIEW`: Inconclusive Tajweed acoustic evidence; saved for asynchronous review.
- `DEFER_TO_TEACHER`: Fifth persistent discrepancy or system integrity failure; defer to certified human teacher.
- `END_ATTEMPT`: Student fatigue detected (consecutive errors >= 4) or maximum interruptions reached (>= 3).

### Teacher Action Authorization Status
- `TEACHER_ACTION_AUTHORIZED`: Pedagogical action is fully backed by high-confidence evidence.
- `TEACHER_ACTION_REQUIRES_REPEAT`: Evidence is ambiguous; repetition is strictly required before issuing correction.
- `TEACHER_ACTION_REQUIRES_CLEAR_AUDIO`: Environmental acoustic signal does not meet scientific quality thresholds.
- `TEACHER_ACTION_REQUIRES_TEACHER`: Complexity, persistent failure, or integrity breach requires human scholar intervention.
- `TEACHER_ACTION_BLOCKED_BY_SAFETY`: Blocked by fatigue, interruption debouncing, or alignment instability.

---

## 3. Priority-Based Decision Pipeline

Every decision follows a deterministic, 7-stage priority pipeline:

1. **Gate 1: Cryptographic Integrity**: Verifies `quranDatasetHash`, `tajweedKBHash`, `modelHash`, and `riwayah`. Any mismatch halts evaluation with `DEFER_TO_TEACHER`.
2. **Gate 2: Signal Quality Barrier**: Checks SNR (>= 10 dB), clipping, silence, white noise, and dropouts. Any defect routes to `REQUEST_CLEARER_AUDIO`.
3. **Gate 3: Alignment Stability Barrier**: Checks `AlignmentStabilityState`. If `UNSTABLE`, `COLLAPSED`, or `PENDING_REALIGNMENT`, candidate errors are suppressed to prevent cascading false error accusations (`ERR-DEC-001`), returning `REQUEST_REPEAT`.
4. **Gate 4: Cognitive Protection & Fatigue**: Checks consecutive error counters, long pauses, session duration, and attempt interruption count. If fatigued or interruption limit reached, routes to `END_ATTEMPT`.
5. **Gate 5: Acoustic & Decision Confidence Floor**: Enforces provisional threshold (0.90). If confidence < 0.90, suppresses correction and issues `REQUEST_REPEAT` (ERR-POL-003).
6. **Gate 6: Evidence-Grounded Escalation Ladder**:
   - Multiple errors in word -> `HIGHLIGHT_WORD`.
   - Attempt 1 -> `REQUEST_REPEAT` (Level 1).
   - Attempt 2 -> `HIGHLIGHT_POSITION` (Level 2).
   - Attempt 3 -> `START_GUIDED_REPEAT` (Level 3).
   - Attempt 4 -> `PAUSE_AND_EXPLAIN` (Level 4).
   - Attempt 5+ -> `DEFER_TO_TEACHER` (Level 5).
7. **Gate 7: Clean Match & Encouragement**:
   - Milestone word -> `PRAISE_AND_CONTINUE`.
   - Standard word -> `CONTINUE` (silent continue).

---

## 4. LLM Boundary & Forensic Audit Trail

The future generative AI layer is sandboxed through `LLMBoundaryValidator`:
- Enforces fixed `intentToken` matching the cryptographic policy envelope.
- Inspects proposed Arabic text against `FORBIDDEN_PEDAGOGICAL_CLAIMS`.
- Validates canonical Uthmani text against verified Mushaf characters.
- Replaces non-compliant LLM responses automatically with verified deterministic prompts.
- Emits a complete 19-field audit trail capturing every decision parameter for scientific reproducibility.
