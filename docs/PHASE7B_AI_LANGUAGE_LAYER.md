# PHASE 7B: EVIDENCE-GROUNDED AI LANGUAGE & CONVERSATION LAYER
## Architecture, Invariants, Providers, Safety Validators, and Audit Trail

---

## 1. Architectural Mission & Absolute Authority Hierarchy

Phase 7B establishes the **AI Language & Conversation Realization Layer** for the Quran Teacher AI system.

The core objective of Phase 7B is to transform an authorized, deterministic `TeacherFeedbackIntent` (produced by the Phase 7A Teacher Policy Engine) into natural, clear, encouraging, and pedagogically appropriate Arabic conversation (Standard Arabic or Egyptian Arabic), while strictly forbidding the AI model from exerting authority over Quranic text, Tajweed rules, acoustic judgments, or religious rulings.

### Absolute Authority Hierarchy

```
Verified Quran Dataset (Canonical Uthmani Text & Hashes)
        ↓
Real Recitation Evidence (Acoustic Confidence, SNR, Timelines)
        ↓
Deterministic Tajweed Knowledge Base (Verified Rule Contracts)
        ↓
Phase 5C Recitation Error Decision Engine (Deterministic Evaluation)
        ↓
Phase 7A Teacher Policy Engine (Pedagogical Action Authorization)
        ↓
═══════════════════════════════════════════════════════════════════════
  PHASE 7B: AI LANGUAGE & CONVERSATION LAYER (REALIZATION ONLY)
  - Cryptographic Snapshot Locking of Teacher Decision Context
  - Structured Realization Providers:
      * GeminiLanguageProvider (gemini-3.8-flash, structured JSON, temp 0)
      * DeterministicFallbackProvider (100% offline, zero hallucination)
  - TeacherLanguageValidator (Defense-in-Depth Safety Gate):
      * Zero Quran Text Hallucination & Exact Provenance Verification
      * Action & Location Tampering Rejection
      * Forbidden Religious Verdicts & Fatwa Rejection
      * Prompt Injection & Jailbreak Defense
      * Acoustic Limitation & Uncertainty Preservation
  - Sequence Synchronization & Stale Response Interception
  - Full Forensic Audit Trail (SHA-256 Hashed, Traceable)
═══════════════════════════════════════════════════════════════════════
        ↓
Student Real-Time Conversational Audio/UI Feedback
```

---

## 2. Invariants and Architectural Guarantees

1. **Language Realization Only**: The generative model has ZERO authority to decide correctness, identify errors, interpret acoustic phonemes, or alter the pedagogical action chosen by Phase 7A.
2. **Zero Religious Jurisprudence (Fiqh)**: The system NEVER declares an action *Haram*, *Batil*, *Makruh*, *Jaa'iz*, or invalidates a student's prayer. Any religious Fiqh question is immediately deferred to certified religious bodies (e.g., Dar al-Ifta).
3. **Zero Quran Text Hallucination**: All quoted Quranic text originates verbatim from the verified database. The model is forbidden from citing verses from memory.
4. **Zero Action Tampering**: If the LLM generates an action different from the authorized intent, the candidate output is rejected with `LLM_ACTION_TAMPERING` and instantly replaced by the deterministic fallback.
5. **Acoustic Limitation Preservation**: When an acoustic feature is pending, uncalibrated, or low confidence (e.g. Madd length, Ghunnah murmur, Makhraj contact, Qalqalah burst, Tafkheem formant), the realization layer is forbidden from falsely accusing the learner of an error.
6. **Prompt Injection Immunity**: Input queries and realized strings are filtered against known injection patterns (`ignore previous instructions`, `override teacher policy`, `system prompt:`, `<script>`).
7. **Complete Deterministic Fallback**: In any case of network drop, API key absence, timeout (>3000ms), schema syntax error, or validator rejection, the system gracefully falls back to deterministic, pre-approved Arabic templates.
8. **Privacy & Data Minimization**: Raw audio PCM buffers, user passwords, emails, and payment data are never exposed or passed to the language model.

---

## 3. Core Modules & Implementation Details

### 3.1 Domain Contracts (`src/domain/ai_language/types.ts`)
- `TeacherLanguageContext`: Immutable envelope combining `TeacherFeedbackIntent`, verified Quran context, student learning state, sequence tracking, and cryptographic snapshot hashes.
- `TeacherLanguageOutput`: Realized feedback including `message`, `language`, `tone`, `action`, `targetReference`, `usedQuranText`, `claims`, `warnings`, `providerInfo`, `auditTrail`, and fallback indicators.
- `ConversationalQueryContext` & `ConversationalQueryOutput`: Safe routing for conversational student questions (pedagogical, technical, tafsir, or fiqh).
- `LanguageAuditTrail`: Forensic logging of `languageRequestId`, `teacherDecisionId`, hashes, latencies, validation results, and detected violations.

### 3.2 Cryptographic Snapshot (`src/domain/ai_language/LanguageSnapshot.ts`)
Binds the input context into an immutable SHA-256 snapshot. Prevents mid-turn tampering of teacher intent, action parameters, or verified scripture references.

### 3.3 Providers (`IAILanguageProvider`)
- **`GeminiLanguageProvider.ts`**:
  - Uses `@google/genai` with model `gemini-3.8-flash`.
  - Configured with `temperature: 0` and `responseMimeType: 'application/json'`.
  - System instruction establishes strict realization boundaries: forbids religious rulings, requires verbatim scripture extraction, and enforces the exact authorized action.
  - Implements lazy initialization and graceful offline handling.
- **`DeterministicFallbackProvider.ts`**:
  - Pre-approved, linguistically refined Arabic templates for every `PedagogicalAction`.
  - Multi-dialect support: Standard Classical Arabic (`ARABIC_STANDARD`) and Egyptian Arabic (`EGYPTIAN_ARABIC`).
  - Conciseness control: Minimal mode (`MINIMAL`) vs. detailed articulation mode (`EXPLANATION`).

### 3.4 Defensive Safety Validator (`src/domain/ai_language/TeacherLanguageValidator.ts`)
Enforces multi-tier defense:
1. **Quran Provenance Gate**: Verifies candidate scripture against canonical Uthmani text using exact string match and display normalization.
2. **Action Integrity Gate**: Confirms `candidate.action === context.action`.
3. **Forbidden Claims Registry**: Scans message and claims against `EXTENDED_FORBIDDEN_CLAIMS` (e.g., *Fatwa*, *Haram*, *Batil*, *يبطل الصلاة*, *معصية*, *إجازة شرعية*).
4. **Prompt Injection Defense**: Detects jailbreak phrases, role reversals, and script injections.
5. **Claim Authorization**: Validates that all candidate claims were pre-authorized in `context.allowedClaims`.

### 3.5 Orchestrator (`src/domain/ai_language/TeacherLanguageService.ts`)
Coordinates the end-to-end realization workflow:
- Tracks `sessionSequence` and `eventSequence` to detect and reject stale or duplicate responses.
- Executes the active provider within a defensive try-catch block.
- Passes candidate output through `TeacherLanguageValidator`.
- Automatically activates `DeterministicFallbackProvider` upon any failure or safety rejection.
- Routes off-task conversational queries: answers pedagogical questions from evidence, defers tafsir/quranic queries to qualified commentaries, and defers fiqh queries to certified scholars.

---

## 4. Verification & Test Suite Summary

The Phase 7B test suite (`src/tests/Phase7bAILanguageLayer.test.ts`) comprises **75 automated adversarial tests**, covering all required scenarios:

| Category | Tests | Description | Result |
| :--- | :--- | :--- | :--- |
| **Basic Generation** | Tests 1–10 | CONTINUE, PRAISE, REQUEST_REPEAT, AUDIO_CLARIFICATION, HIGHLIGHT_POSITION, HIGHLIGHT_WORD, GUIDED_REPEAT, PAUSE_AND_EXPLAIN, END_ATTEMPT, DEFER_TO_TEACHER | **PASS** |
| **Integrity & Provenance** | Tests 11–20 | Quran exact match, mismatch detection, display normalization, reference synchronization, action mutation rejection, snapshot immutability | **PASS** |
| **Religious Safety** | Tests 21–28 | Interception of Fatwa, Haram, Batil, prayer invalidation (يبطل الصلاة), false ijaza certifications, sin accusations, and unauthorized Tajweed claims | **PASS** |
| **Prompt Injection** | Tests 29–35 | Jailbreaks, "ignore previous instructions", "override teacher policy", Arabic action change commands, scholar impersonation, script tags | **PASS** |
| **Acoustic Limitations** | Tests 36–43 | Preserving uncertainty for Madd, Ghunnah, Makhraj, Qalqalah, Tafkheem, low SNR, and alignment boundary instability | **PASS** |
| **Timing & Resilience** | Tests 44–50 | Stale response detection, duplicate rejection, out-of-order sequence protection, latency tracking, timeout fallback, malformed JSON recovery | **PASS** |
| **Personalization** | Tests 51–55 | Egyptian Arabic, Standard Arabic, minimal mode conciseness, articulation explanation, supportive pedagogical tone | **PASS** |
| **Student State** | Tests 56–63 | First attempt, repeated error, persistent discrepancy deferral, fatigue rest session, memorization mode, revision mode, Tajweed practice | **PASS** |
| **Privacy** | Tests 64–66 | Zero raw audio PCM in context, zero API keys in audit logs, zero student PII leakage | **PASS** |
| **Determinism & Routing** | Tests 67–75 | 100% deterministic fallback replay, cryptographic SHA-256 hash certification, full audit trail, conversational Fiqh deferral, tafsir routing, provider availability guard | **PASS** |

### Test Runner Summary
- **Total System Tests Passed**: 384 of 384 tests green across all project phases.
- **Phase 7B Tests**: 75 of 75 tests passing.
- **TypeScript & Build**: 0 errors (`tsc --noEmit` and `vite build` clean).
