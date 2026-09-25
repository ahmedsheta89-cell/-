# Phase 8B: Crash Safety & Recovery Architecture

## 1. Crash Safety & Write-Ahead Intent Log
To guarantee resilience against interrupted writes, browser tab kills, and power cuts:
1. **Write-Ahead Intent (WAL)**: Prior to committing changes across multiple stores, an intent record (`TransactionIntentRecord`) is persisted with status `'PENDING'`.
2. **Atomic Write**: The storage adapter performs the transactional mutation.
3. **Intent Cleanup**: Upon successful write, the transaction intent is purged.

---

## 2. Recovery Routine (`recover()`)
When an application instance restarts or encounters an inconsistent state:
1. **Uncommitted Transaction Rollback**:
   - The store queries pending intents for the student.
   - Any incomplete intents from interrupted sessions are cleanly rolled back and deleted (`PERSIST-004`).
2. **Audit Chain Verification**:
   - The store scans all events for the student in sequence.
   - Validates that `previousEventHash` matches the preceding event's `eventHash`.
   - Validates that each event's computed canonical hash matches its stored `eventHash`.
3. **Derived Snapshot Healing**:
   - If the snapshot hash is corrupted or out of date relative to the event count, the snapshot is automatically recalculated via `rebuildProfileFromEvents()`.
4. **Missing History Invariant**:
   - Recovery never manufactures or guesses missing events. If an event is corrupted or missing, recovery reports the breach closed rather than fabricating synthetic progress.
