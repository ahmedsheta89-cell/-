# Phase 7D: Learning Events & Attempt Clustering

## 1. MemorizationEvent Envelope
Every recitation learning observation is captured in a tamper-evident `MemorizationEvent`:
- `eventId`: Unique cryptographic ID.
- `studentId`, `sessionId`: Context identifiers.
- `quranLocation`: Surah (1–114), Ayah number, and optional word range.
- `eventType`: ATTEMPT, CONFIRMED, RETRY, ERROR_CONFIRMED, INCONCLUSIVE, AYAH_COMPLETED, REVIEW_STARTED, REVIEW_COMPLETED, REVIEW_FAILED, SESSION_COMPLETED.
- `evidenceStatus`: CONFIRMED, POSSIBLE, INCONCLUSIVE, NO_EVIDENCE.
- `decisionStatus`: Upstream Phase 5C RecitationDecisionState.
- `teacherAction`: Upstream Phase 7A PedagogicalAction.
- `timestamp`, `attemptNumber`, `retryNumber`.
- `attemptClusterId`: Groups immediate retries within the same interaction.
- `isIndependentReview`: Differentiates separated longitudinal reviews from immediate classroom corrections.
- Cryptographic Hashes: Dataset version & hash, ASR model version & hash, Tajweed KB version & hash, Decision Engine version, Policy version, Revision Algorithm version, and `eventHash` (SHA-256).

## 2. Privacy Guarantee (Part 26)
Raw audio waveforms, PCM Float32 arrays, and audio buffers are **strictly prohibited** from storage in learning events. Only discrete acoustic confidence, duration, and phonetic alignment metrics are retained.

## 3. Attempt Clustering (Part 8 & 9)
An immediate retry sequence:
$$\text{Read} \rightarrow \text{Error} \rightarrow \text{Repeat} \rightarrow \text{Error} \rightarrow \text{Repeat} \rightarrow \text{Pass}$$
is aggregated into **one single practice cluster**. It is strictly prevented from being counted as multiple independent reviews.
Independent reviews require:
- Minimum temporal gap (4+ hours) between sessions, or
- Explicit Review Mode invocation in a separated session.
