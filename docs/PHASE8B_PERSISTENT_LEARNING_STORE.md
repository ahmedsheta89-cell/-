# Phase 8B: Persistent Learning Store

## 1. Executive Summary & Purpose
The Persistent Learning Store provides a crash-safe, append-only, cryptographic-hash-chained persistence layer for student memorization histories, derived profile snapshots, and revision plans in Quran Teacher AI.

This architecture decouples domain memorization intelligence (Phase 7D) from storage engines, preserves the identity and ownership boundaries established in Phase 8A, maintains strict zero-audio-persistence invariants, and forms the local foundation for future Phase 8C cloud synchronization.

---

## 2. Core Architectural Principles
1. **Decoupled Persistence Abstraction**: The core domain interacts strictly via the `IPersistentLearningStore` and `ISyncableLearningStore` interfaces. Storage engines (IndexedDB for browser, in-memory transactional adapter for Node/testing) reside behind `IPersistenceStorageAdapter`.
2. **Append-Only Event Ledger**: Learning events are immutable historical evidence. Mistakes or pedagogical corrections are recorded as new forward events; historical events are never mutated or silently rewritten.
3. **Cryptographic Hash Chain**: Every persisted event computes a canonical SHA-256 hash binding `schemaVersion`, `sequenceNumber`, `previousEventHash`, Quran coordinates, evidence status, decision status, teacher action, attempt clusters, and model versions.
4. **Idempotency & Replay Safety**: Replaying an already-persisted event is an idempotent no-op. Attempting to insert an event with an existing ID but conflicting payload triggers `PERSIST-001: DUPLICATE_EVENT`.
5. **Crash Safety & WAL**: Atomic multi-write operations utilize Write-Ahead Transaction Intents (`TransactionIntentRecord`) to ensure clean rollback or completion across browser refreshes or interruptions.
6. **Derived Profile Snapshots**: Profile snapshots (`PersistentProfileSnapshot`) optimize read performance, but the append-only event ledger remains the ultimate source of truth. Any snapshot can be deterministically rebuilt via `rebuildProfileFromEvents()`.
7. **Strict Ownership & Privacy**: Cross-student data queries are rejected closed (`PERSIST-006: OWNERSHIP_MISMATCH`). The `rawAudioPersistence: false` invariant ensures raw PCM or microphone buffers are never committed to disk.
8. **No AI Authority over Persistence**: LLM and AI models cannot author arbitrary events, mutate profile mastery states, or alter historical audit chains.
