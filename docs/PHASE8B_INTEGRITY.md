# Phase 8B: Cryptographic Integrity & Tamper Resistance

## 1. Canonical Serialization & Hash Generation
Traditional `JSON.stringify()` is non-deterministic due to arbitrary key ordering and floating-point variances.
The `CanonicalSerializer` enforces:
1. **Recursive Lexicographical Key Sorting**: Every object key is sorted alphabetically before serialization.
2. **Finite Number Normalization**: Canonical numeric strings without locale or exponential discrepancies.
3. **Cross-Platform Portable SHA-256**: Uses browser/Node compatible sync SHA-256 without `node:crypto`.

---

## 2. Hash Chain Architecture
Each learning event contains:
```
Event[0]: previousEventHash = 0000000000000000000000000000000000000000000000000000000000000000
          eventHash = SHA256(canonicalPayload[0])

Event[1]: previousEventHash = Event[0].eventHash
          eventHash = SHA256(canonicalPayload[1])

Event[i]: previousEventHash = Event[i-1].eventHash
          eventHash = SHA256(canonicalPayload[i])
```

Tampering with any historical event:
- Invalides that event's `eventHash` (`PERSIST-002: HASH_MISMATCH`).
- Breaks the `previousEventHash` linkage of all subsequent events in the student's chain.
- Immediate detection during `verifyIntegrity()`.
