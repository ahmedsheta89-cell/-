# Phase 8B: Offline-First Operation & Privacy Policy

## 1. Offline-First Guarantee
The Quran Teacher AI persistent learning architecture is completely operational without an internet connection:
- All writes and queries execute locally using IndexedDB (or in-memory fallback).
- Revision schedules, spaced repetition calculations, and attempt clustering run client-side.
- Reloading the page or closing the browser retains complete state without external cloud calls.

---

## 2. Privacy & Audio Invariant
**Strict Invariant: `rawAudioPersistence = false`**
- No raw PCM audio, microphone stream buffers, or compressed audio files are stored locally or remotely.
- Only deterministic learning evidence (e.g. `EvidenceStatus`, `DecisionStatus`, word error ranges, timestamps) is preserved.
- Any attempt to persist raw audio triggers an immediate privacy violation error.

---

## 3. Future Phase 8C Sync Boundary
The store implements `ISyncableLearningStore`:
- Flags each event with `syncStatus: 'PENDING' | 'SYNCED' | 'FAILED'`.
- Exposes `getPendingEvents()`, `markSynced()`, `getSyncCursor()`, and `getSyncStatus()`.
- Prepares for conflict-free, causal cloud synchronization in Phase 8C without coupling the domain to any proprietary cloud vendor.
