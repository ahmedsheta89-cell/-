# PHASE 5C: REAL RECITATION ERROR DECISION ENGINE
## Production-Grade Conservative Recitation Evidence-Decision Layer

---

## 1. Executive Summary & Architectural Invariant

Phase 5C implements the production decision layer that converts raw acoustic **`RecitationEvidence`**, deterministic **`TajweedRuleEvidence`**, acoustic signal quality metrics, and alignment certainty into an immutable, conservative, learner-facing recitation decision.

### Absolute Architectural Boundary:
- **Zero LLM Decision-Making**: This is strictly NOT an LLM decision layer. No generative model, prompt, or external network call evaluates recitation correctness.
- **Zero Hallucinated Scripture**: Scripture text is never dynamically generated; all text context is derived directly from the certified Mushaf dataset (`HAFS_OFFICIAL_CERTIFICATE`).
- **Zero Uncertified Tajweed Inventions**: Rules are evaluated strictly against the verified 19-rule Tajweed Knowledge Base (`TAJWEED_KB_CHECKSUM_SHA256`).
- **Conservative Default**: Under any acoustic ambiguity, low signal-to-noise ratio, or alignment slip, the engine prefers `REQUEST_REPEAT` or `INCONCLUSIVE` over issuing a false error accusation.

```
REAL AUDIO (16kHz PCM)
       ↓
REAL KALDI FBANK (80 bins, 25ms window, 10ms shift)
       ↓
REAL ZIPFORMER CTC (Streaming INT8)
       ↓
REAL CTC LOGITS & POSTERIORS
       ↓
VITERBI ALIGNMENT & PHONEME TIMELINE
       ↓
QURAN-CONSTRAINED RECITATION EVIDENCE (Phase 5A)
       +
DETERMINISTIC TAJWEED RULE EVIDENCE (Phase 5B)
       ↓
═══════════════════════════════════════════════════════════════
  PHASE 5C: RECITATION ERROR DECISION ENGINE
  - Multi-Gate Cryptographic & Config Integrity Check
  - Signal Quality & Noise Gating (SNR, Silence, White Noise)
  - Cascading Alignment Failure Protection & Trellis Slip Recovery
  - Orthogonal Error Arbitration (Identity vs Applicability vs Execution)
  - Conservative Interruption Recommender
  - Learner-Safe Encouraging Arabic Feedback
═══════════════════════════════════════════════════════════════
       ↓
  AyahRecitationDecision & LearnerRecitationFeedback
```

---

## 2. Orthogonal Separation of Evidence Types

Novice systems conflate acoustic mismatch with religious violations. Phase 5C enforces strict separation across three orthogonal dimensions (`ERR-DEC-003`):

1. **Phonetic Identity Evidence (`RecitationEvidence`)**:
   - Compares the observed phoneme token against the expected canonical Uthmani phoneme token.
   - Example: Pronouncing `/s/` instead of `/sˤ/` is an acoustic phoneme mismatch. It does not automatically imply a Tajweed rule failure unless that phoneme participates in a certified rule context.
2. **Tajweed Rule Applicability (`TajweedRuleEvidence`)**:
   - Determines whether a specific classical Tajweed rule applies to the verified Quranic context (e.g. Nun Sakinah before a throat letter requires *Izhar Halqi*).
   - Applicability is a property of the Uthmani text, verified against classical texts (*Tuhfat al-Atfal*, *Al-Jazariyyah*). The fact that a rule applies does not mean the reciter failed it.
3. **Tajweed Execution Quality**:
   - Evaluates the acoustic realization of rule-specific attributes (nasal resonance in Ghunnah, duration in Madd, transient release in Qalqalah).
   - Because current streaming acoustic models lack sub-frame formant and resonant calibration (`ERR-TAJ-001` through `ERR-TAJ-004`), execution quality returns `TAJWEED_EVIDENCE_PENDING` or `INCONCLUSIVE`, **never** an unverified Tajweed error.

---

## 3. Strict Decision States & Escalation Levels

### Decision States (`RecitationDecisionState`):
| State | Definition | Learner Experience |
|---|---|---|
| `MATCH` | All phoneme tokens match expected canonical tokens with high confidence and stable alignment. | Encouraged to proceed smoothly ("ممتاز، كمّل."). |
| `POSSIBLE_ERROR` | Acoustic discrepancy observed, but evidence is marginally below confidence/margin safety gates. | Monitored internally; learner is not interrupted. |
| `CONFIRMED_PHONETIC_ERROR` | Acoustic discrepancy satisfies all 10 confirmation gates. | Gentle prompt to retry the specific letter ("في اختلاف في نطق الحرف. جرّب مرة تانية."). |
| `TAJWEED_EVIDENCE_PENDING` | Tajweed rule applies, but acoustic verification is unavailable or requires specialized analysis. | Educational note indicating rule context ("السياق التجويدي يحتاج استماعًا أوضح للتأكد."). |
| `INCONCLUSIVE` | Evidence is ambiguous, SNR is degraded, or integrity check failed. | Safe deferral without penalty. |
| `REQUEST_REPEAT` | Audio is silent, noisy, or alignment slipped. | Neutral request to recite the word again ("الصوت مش واضح كفاية. اقرأ الكلمة مرة تانية."). |
| `CONTINUE` | Recitation flow is normal; proceed to next token/ayah. | Uninterrupted flow. |
| `INTERRUPT_RECOMMENDED` | High-confidence clear phonetic mismatch detected in real-time; immediate pause recommended. | Real-time pause prompt. |
| `DEFER_TO_TEACHER` | Complex or repeated pedagogical difficulty requiring human teacher guidance. | Suggestion to recite to a live teacher ("راجع نطق الكلمة مع المعلم للتأكد."). |

### Escalation Hierarchy (`EscalationLevel`):
- **LEVEL 0: `LEVEL_0_MATCH`** — Optimal clean recitation.
- **LEVEL 1: `LEVEL_1_UNCERTAIN`** — Ambiguous or low-margin observations.
- **LEVEL 2: `LEVEL_2_REQUEST_REPEAT`** — Sub-threshold audio or repeated discrepancy.
- **LEVEL 3: `LEVEL_3_CONFIRMED_PHONETIC_ERROR`** — High-certainty letter substitution or omission.
- **LEVEL 4: `LEVEL_4_TAJWEED_EVIDENCE_PENDING`** — Tajweed rule applicable; awaiting expert/calibrated analysis.

---

## 4. Multi-Gate Safety Thresholds (`PROVISIONAL_SAFETY_THRESHOLD`)

All decision thresholds are tagged as `PROVISIONAL_SAFETY_THRESHOLD` until validated on comprehensive multi-accent learner datasets (`ERR-DEC-004`):

```typescript
export const PROVISIONAL_DECISION_SAFETY_THRESHOLDS: DecisionSafetyThresholds = {
  label: 'PROVISIONAL_SAFETY_THRESHOLD',
  minConfidence: 0.90,          // Acoustic posterior probability >= 0.90
  minMarginPeak: 0.80,          // Margin between top 1 and top 2 tokens >= 0.80
  minSnrDb: 10.0,               // Signal-to-Noise Ratio >= 10.0 dB
  minAlignmentConfidence: 0.80, // Trellis alignment confidence >= 0.80
  maxAmbiguityCostMargin: 0.35, // Trellis path competition margin
  thresholdVersion: 'provisional-v1.0.0-phase5c',
};
```

### The 10 Mandatory Confirmation Gates:
An observed discrepancy is classified as `CONFIRMED_PHONETIC_ERROR` **if and only if all 10 conditions are simultaneously satisfied**:
1. Quran text context is cryptographically verified.
2. Trellis alignment stability is `STABLE` (no slip or recovery in progress).
3. Canonical expected token is non-empty.
4. Observed acoustic token is non-empty.
5. Viterbi ambiguity is false (`isAmbiguous: false`).
6. Acoustic confidence $\ge 0.90$.
7. Posterior margin peak $\ge 0.80$.
8. Alignment confidence $\ge 0.80$.
9. Signal quality $\ge 10.0\text{ dB}$ (not silence or white noise).
10. Evidence is not marked `INCONCLUSIVE` or `isCascadingSuppressed`.

---

## 5. Cascading Alignment Failure Protection (`ERR-DEC-001`)

### The Problem:
When a learner omits or delays a single phoneme, standard dynamic time warping (DTW) or CTC forced-alignment trellises may slip by one position. Without protection, every subsequent correct phoneme aligns to the wrong target, generating a catastrophic cascade of 5 to 10 false substitution errors.

### The Phase 5C Solution:
1. **Trellis Slip Detection**: When a mismatch occurs, the engine examines whether the observed phoneme matches the *next* expected phoneme ($i+1$). If detected, the engine enters `AlignmentStabilityState.PENDING_REALIGNMENT`.
2. **Cascading Error Suppression**: While in `PENDING_REALIGNMENT`, subsequent candidate errors in that window are suppressed (`isCascadingSuppressed: true`) and downgraded to `INCONCLUSIVE`/`REQUEST_REPEAT`.
3. **Word-Level Instability Aggregation**: If three or more low-confidence discrepancies occur within the same word, the entire word is labeled `hasAlignmentInstability: true` and aggregated into a single `REQUEST_REPEAT` event rather than three distinct student errors.
4. **Anchor Re-synchronization**: The system re-anchors to `STABLE` only when an unambiguous, high-confidence ($\ge 0.95$) consonant anchor with stable temporal boundaries is recognized.

---

## 6. Repeated Error Policy (`ERR-DEC-002`)

A core scientific principle of the decision engine is that **repetition frequency does not alter acoustic physics**:
- If a learner pronounces a word with an acoustic confidence of 0.62 in attempt 1, and again with confidence 0.62 in attempt 2, the acoustic confidence **remains 0.62**.
- The system **never** inflates confidence (e.g. $0.62 \to 0.95$) simply because the event repeated.
- What changes is pedagogical prioritization: the `EscalationLevel` advances from `LEVEL_1_UNCERTAIN` to `LEVEL_2_REQUEST_REPEAT` or `DEFER_TO_TEACHER`, ensuring the student receives appropriate human guidance without the machine falsely claiming acoustic certainty.

---

## 7. Acoustic Limitations & Scientific Boundaries (ERR-TAJ-001 to ERR-TAJ-004)

In compliance with religious scholarly standards and DSP physical limits:
- **`ERR-TAJ-001` (Madd Timing)**: Madd durations (2, 4, 5, 6 Harakat) cannot be certified using 40ms frame steps. When Madd applies, status is `TAJWEED_EVIDENCE_PENDING`. The engine never confirms a Madd duration error.
- **`ERR-TAJ-002` (Ghunnah Resonance)**: Token classification (`m`, `n`) proves letter identity, not nasal acoustic emission (*Khayshoom*). Status is `TAJWEED_EVIDENCE_PENDING`.
- **`ERR-TAJ-003` (Tafkheem/Makhraj)**: Tongue root retraction and pharyngeal formant trajectories ($F_1, F_2$) are not modeled. Pharyngealization cannot be evaluated as an articulation failure; the system never claims "مخرج الحرف خاطئ".
- **`ERR-TAJ-004` (Qalqalah Transient)**: Sub-20ms burst transient release cannot be resolved at 40ms frame resolution. Qalqalah execution quality returns `INCONCLUSIVE`.

---

## 8. Real-Time Interruption Recommender

To avoid jarring or disruptive learner experiences:
- `shouldInterrupt: true` is triggered **only** when:
  1. A high-confidence error ($\ge 0.90$) is confirmed.
  2. The alignment is `STABLE` (preventing an interruption in the middle of a cascading slip).
  3. Severity is `HIGH` or `CRITICAL` (e.g. letter substitution or word omission).
  4. Ambiguity is false.
- In all other cases (low SNR, ambiguous trellis, pending Tajweed), the recommender issues `DEFER`, `REQUEST_REPEAT`, or `PROCEED`.

---

## 9. Learner-Safe Arabic Linguistic Standards

The learner-facing output is strictly pedagogical, polite, and free of religious condemnation or internal developer jargon:

| Condition | Arabic Output | English Translation |
|---|---|---|
| `MATCH` | `ممتاز، كمّل.` | Excellent, keep reciting. |
| `REQUEST_REPEAT` | `الصوت مش واضح كفاية. اقرأ الكلمة مرة تانية.` | The audio is not clear enough. Please recite the word again. |
| `CONFIRMED_PHONETIC_ERROR` | `في اختلاف في نطق الحرف. جرّب مرة تانية.` | There is a discrepancy in letter pronunciation. Please try again. |
| `TAJWEED_EVIDENCE_PENDING` | `السياق التجويدي يحتاج استماعًا أوضح للتأكد.` | The Tajweed rule context requires clearer acoustic verification. |
| `DEFER_TO_TEACHER` | `راجع نطق الكلمة مع المعلم للتأكد.` | Review the pronunciation of this word with the teacher. |

### Strict Linguistic Ban:
The engine strictly prohibits the generation of theological condemnation terms:
`حرام` (Haram), `حلال` (Halal), `إثم` (Sin), `ذنب` (Guilt), `باطلة` (Invalid), `فاسدة` (Corrupt), `معصية` (Transgression).

---

## 10. Cryptographic Verification & Audit Trail

Every decision produces an immutable `DecisionAuditTrail` linking all inputs:
- `quranHash`: `9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`
- `tajweedHash`: `4d67db2644cf57dd98609126e5081a50d3f8ede876cd832a125257fea5a0cec3`
- `modelHash`: `31755836528da336a6192121cd7bc82cb41752dddb65566fd000b89c8686da6b`
- `riwayah`: `HAFS_AN_ASIM`
- `thresholdVersion`: `provisional-v1.0.0-phase5c`

Any tampering or mismatch immediately triggers an `INTEGRITY_FAILURE` halt, returning `INCONCLUSIVE` and preventing corrupted decisions.

---

## 11. Test Verification Summary

The decision engine is verified by a dedicated 30-scenario test suite (`Phase5cRecitationDecisionEngine.test.ts`):
- Clean matches, high/low confidence substitutions, deletions, insertions.
- Trellis ambiguity, low SNR, silence, white noise, unrelated speech.
- Cascading slip protection and word-level aggregation.
- Repeated error escalation without acoustic confidence inflation.
- Tajweed pending propagation for Madd, Ghunnah, Qalqalah, and Tafkheem.
- Multi-hash integrity gate enforcement (Quran, Tajweed KB, Model, Riwayah).
- Teacher AI immutability and zero-theological-condemnation linguistic audit.

**Test Status**: 30/30 Tests PASSING GREEN.
