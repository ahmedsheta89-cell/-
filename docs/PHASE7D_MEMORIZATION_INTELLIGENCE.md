# Phase 7D: Memorization & Revision Intelligence

## 1. Executive Summary & Core Objective
Phase 7D provides an evidence-grounded longitudinal memorization and revision intelligence engine for the Quran Teacher system. It models the learner's journey over time:
- What passages the learner has attempted
- What was confirmed with high acoustic and phonetic confidence
- What was ambiguous or inconclusive
- What proved repeatedly difficult
- What has achieved pedagogical stability
- What is due or overdue for review according to spaced repetition schedules
- What requires focused reinforcement

**Fundamental Boundary**: This is a deterministic pedagogical scheduling system. It is strictly **NOT** a religious certification system, Mufti layer, or Ijazah granting authority.

## 2. Authoritative Dependency Chain
Phase 7D sits at the tail of the verified authority pipeline:
```
Verified Quran Dataset (114 Surahs Hafs Canon)
   ↓
Acoustic Alignment & Phonetic Evidence Engine (Zipformer CTC / Mel / FBank)
   ↓
Deterministic Tajweed Knowledge Base (Verified Scholarly Rules)
   ↓
Phase 5C Recitation Error Decision Engine (Authoritative Outcomes)
   ↓
Phase 7A Teacher Policy & Pedagogical Decision Engine (Pedagogical Actions)
   ↓
Phase 7B AI Language & Conversation Realization Layer (Natural Arabic)
   ↓
Phase 7C Real-Time Teacher Interaction & Session UX (VAD, Turn-Taking, Events)
   ↓
Phase 7D Memorization & Revision Intelligence (Longitudinal Learning Memory & Spaced Scheduling)
```
Phase 7D **never** bypasses or mutates upstream evidence.

## 3. Core Architecture
- `types.ts`: Comprehensive domain contracts, enums, records, and configs.
- `errorRegistry.ts`: Strict standardized error codes (`MEM-001` through `MEM-010`).
- `MemorizationEventFactory.ts`: Cryptographic SHA-256 event construction, canon validation, and privacy protection (raw audio strictly forbidden).
- `AttemptClusterManager.ts`: Distinguishes immediate retry loops from independent reviews to prevent mastery inflation.
- `RetentionModelHeuristic.ts`: Deterministic revision scheduling formula combining stability, error recurrence, and recency.
- `MemorizationStateEngine.ts`: Deterministic state transition engine with single-failure protection and inconclusive evidence immunity.
- `RevisionScheduler.ts`: Urgency calculation, machine-readable reason codes, priority scoring, and deterministic Arabic pedagogical explanations.
- `RevisionSetGenerator.ts`: Daily revision plan generation (DAILY, WEAKNESS, SPACED, MIXED) with non-punitive adaptation.
- `LongitudinalProfileStore.ts`: Replay/duplicate protection, multi-version audit binding, and 100% offline capability.
- `AIBoundaryGuard.ts`: Prevents AI models from mutating learning states, overriding priorities, or fabricating certification claims.
- `MemorizationBridge.ts`: Translates Phase 7C real-time events into Phase 7D longitudinal memory records.
- `MemorizationRevisionDashboard.tsx`: React dashboard with visual state breakdown, revision queue, daily plan, and passage detail dialog.
