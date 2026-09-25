# Phase 7D: Pedagogical State Model

## 1. Memorization States
Phase 7D defines 9 distinct pedagogical states:
1. `NOT_STARTED`: The passage has not yet been attempted by the learner.
2. `INTRODUCED`: The passage has been presented or read once during an initial session.
3. `LEARNING`: The learner is actively practicing the passage; initial successes have been recorded.
4. `PRACTICING`: The passage has accumulated 2+ successful practice clusters with acceptable accuracy (>= 75%).
5. `STABLE`: The passage has been independently reviewed with high accuracy (>= 85%) across separated sessions.
6. `REVIEW_DUE`: Scheduled spaced repetition time has elapsed (`currentTime >= nextReviewAt`).
7. `WEAKENING`: Recent accuracy has noticeably fallen below the cumulative historical average, or multiple recent errors occurred.
8. `NEEDS_REINFORCEMENT`: Persistent or recurring confirmed errors require structured repetition and remedial attention.
9. `MASTERED`: Pedagogical scheduling benchmark indicating sustained high stability over 4+ independent spaced reviews with 0 recent errors.

## 2. Invariants & Protections
- **Inconclusive Immunity**: `INCONCLUSIVE` or `POSSIBLE` evidence status strictly **never** downgrades a passage's state. Only confirmed errors (`ERROR_CONFIRMED` with `CONFIRMED` evidence) can trigger remediation.
- **Single-Failure Protection**: A single error on a previously stable or mastered passage **never** wipes out history or resets the state to zero. It transitions to `WEAKENING` or schedules reinforcement.
- **Pedagogical Meaning of MASTERED**: `MASTERED` is strictly a mathematical scheduling interval indicator (14+ days between reviews). It does NOT imply:
  - Permanent memory
  - Impossibility of forgetting
  - Ijazah (authorized scholarly chain of transmission)
  - Religious certification of accuracy
