# PHASE 7A: SAFETY & LLM BOUNDARY SPECIFICATION
## Boundary Contracts, Forbidden Claims, and Defensive Invariants

---

## 1. Safety Architecture: The Dual-Sandbox Model

The system protects Islamic and Quranic sanctity through a dual-sandbox architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ DETERMINISTIC SANCTUARY (Phase 5C & Phase 7A Policy Engine) │
│ - Mathematical rules, cryptographic hashes, Viterbi trellis │
│ - Evaluates evidence without generative models              │
│ - Outputs immutable TeacherPolicyDecisionOutput             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Provides ONLY TeacherFeedbackIntent
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ RESTRICTED NATURAL LANGUAGE ADAPTER (Downstream Generative) │
│ - Consumes TeacherFeedbackIntent with signed token          │
│ - MUST NOT mutate action, confidence, or scripture text     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Proposed Response String
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ FORENSIC BOUNDARY VALIDATOR (LLMBoundaryValidator)          │
│ - Rejects unauthorized action changes                       │
│ - Rejects forbidden theological claims                      │
│ - Validates exact match of quoted Quranic text              │
│ - Reverts immediately to deterministic prompt if violated   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Forbidden Claims Registry (`FORBIDDEN_PEDAGOGICAL_CLAIMS`)

The downstream language generation layer is strictly forbidden from asserting:

1. **Theological & Jurisprudential Rulings (Fatwa / Hukm)**:
   - "حرام" (Forbidden / Sinful)
   - "باطل" (Invalid)
   - "قراءتك لا تجوز" (Your recitation is impermissible)
   - "أنت آثم" (You are sinful)
   - "أنت أخطأت في الدين" (You erred in religion)
2. **Unsupported Absolute Claims of Spiritual or Legal Validity**:
   - "قراءتك مقبولة 100%" (Your recitation is 100% accepted by Allah)
   - "قراءتك صحيحة شرعًا" (Your recitation is religiously valid without reservation)
   - "أنا أشهد لك بالإجازة" (I certify you with an Ijazah)
3. **Phonetic Fabrications & Uncalibrated Accusations**:
   - Accusing the reciter of a Tajweed rule failure when the acoustic evidence is marked `PENDING` (`ERR-TAJ-001` through `ERR-TAJ-004`).
   - Reporting acoustic failure when SNR < 10 dB (`ERR-ACOUSTIC-001`).

---

## 3. Allowed Pedagogical Concepts (`ALLOWED_PEDAGOGICAL_CONCEPTS`)

The system encourages objective, descriptive, pedagogical feedback:
- "النطق متوافق مع المرجع الصوتي" (Pronunciation aligns with the acoustic reference)
- "تحتاج إلى تدريب إضافي" (Requires additional practice)
- "جرّب مرة أخرى بوضوح" (Try again clearly)
- "استمع إلى التلاوة النموذجية" (Listen to the exemplar recitation)
- "الموضع يحتاج مراجعة المخرج" (This location warrants review of the articulation point)

---

## 4. Adversarial Protection Matrix

| Threat Vector | Attack Mechanism | Phase 7A Defensive Invariant |
| :--- | :--- | :--- |
| **Confidence Inflation (ERR-POL-003)** | Repeating the same ambiguous reading multiple times to artificially force high confidence | Confidence is an instantaneous acoustic property, not a cumulative tally. Two attempts at 0.70 remain 0.70. |
| **Cognitive Harassment (ERR-POL-005)** | Interrupting the student repeatedly within fractions of a second | Mandatory cooldown timer (minimum 3,000 ms) and maximum 3 interruptions per attempt. |
| **Cascading Error Cascade (ERR-DEC-001)** | Audio alignment trellis slip causing every subsequent word to be flagged as wrong | If `AlignmentStabilityState` is `UNSTABLE`, all candidate errors are suppressed; the engine issues a clean `REQUEST_REPEAT`. |
| **Scripture Tampering** | LLM altering Arabic diacritics or Quranic word sequence | LLM boundary validator checks quoted text against verified Mushaf dataset. Any character mismatch rejects the output. |
| **Theological Usurpation** | LLM attempting to issue religious verdicts on learner prayer validity | LLM boundary validator scans for forbidden religious terms and replaces response with the deterministic prompt. |
