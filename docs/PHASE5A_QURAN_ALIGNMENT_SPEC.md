# PHASE 5A — QURAN-AWARE ALIGNMENT & ACOUSTIC EVIDENCE SPECIFICATION

**Current Scientific Status**:
- **Phase 4E.1 Status**: `B — EVALUATED BUT INSUFFICIENT` (Acoustic model verified, streaming verified, local golden regression passing, independent upstream benchmark blocked by gated dataset access).
- **Phase 5A Status**: `A — REAL QURAN-AWARE ALIGNMENT VERIFIED` (Software architecture, temporal provenance, DP alignment, multi-hypothesis tracking, and safety gating verified).
- **Scientific Validation**: Provisional (local 8-reciter golden regression).
- **Religious Validation**: Not applicable (this layer produces acoustic evidence only; zero Fiqh/Tajweed rulings).

---

## 1. System Mission & Religious Decoupling

The Phase 5A Engine serves strictly as an **Acoustic + Phonetic + Quran-Aware Alignment Engine**.

### Core Scientific Questions
- **What it answers**:
  - *"What phonetic sequence did the model observe?"*
  - *"Where did each phonetic observation occur in time?"*
  - *"How does the observed phonetic sequence align with the certified Quranic canonical sequence?"*
- **What it strictly DOES NOT answer**:
  - *"Is this recitation religiously wrong?"*
  - *"Did the reciter commit a Lahn Jaliyy or Lahn Khafiyy?"*
  - *"Is this recitation valid according to Islamic jurisprudence?"*

All religious, Fiqh, and Tajweed classifications belong strictly to downstream expert rule engines. This layer outputs structured, auditable **Acoustic Evidence**.

---

## 2. End-to-End Data Flow Architecture

```
[ REAL 16kHz PCM AUDIO ]
          │
          ▼
[ EXACT KALDI 80-BIN FBANK EXTRACTOR ]
  - 25ms window, 10ms frame step, 80 mel bins, Kaldi energy & dither floor (-15.94)
          │
          ▼
[ ZIPFORMER2-CTC ACOUSTIC MODEL (ONNX Runtime) ]
  - 39 frames/chunk (390ms acoustic frames, 600ms chunk step, 4x subsampling)
  - Stateful streaming with 16 recurrent cache tensors + embed_states
  - Frame log-probabilities across 251-symbol vocabulary
          │
          ▼
[ AUDITABLE CTC DECODER ]
  - Blank symbol removal (ID: 0, `<blk>`)
  - Repeated identical token collapse across streaming chunks
  - Exact frame provenance: startFrame, endFrame, peakFrame, startTime, endTime
  - Peak and mean posterior confidence, margin peak (top1 - top2 probability)
          │
          ▼
[ OBSERVED PHONEME TIMELINE ]
          │
          ▼
[ CANONICAL QURAN PHONEME PROVIDER ]
  - Certified Phase 2 Religious Data Layer (HAFS_OFFICIAL_CERTIFICATE)
  - Strict SHA-256 integrity verification against scholarly certificate
  - Word-level mapping: surah, ayah, wordIndex, phonemeIndex, wordTextUthmani
          │
          ▼
[ CONSTRAINED MULTI-HYPOTHESIS DP ALIGNER ]
  - Phonetic distance cost matrix (exact match, vowel variants, consonants)
  - Minimum cost path (H1) and secondary path (H2) evaluation
  - Ambiguity margin detection: ΔC = cost(H2) - cost(H1)
  - If ΔC < 0.35: mark candidate as AMBIGUOUS -> INCONCLUSIVE
          │
          ▼
[ RECITATION EVIDENCE FUSION & SAFETY GATE ]
  - Evaluates SNR, clipping, silence, white noise
  - Confidence gate (≥ 0.90), Margin gate (≥ 0.80), Alignment gate (≥ 0.60)
  - Look-ahead streaming buffer: trailing events marked PENDING / UNCERTAIN
  - Non-interruptive pedagogical action recommendations
          │
          ▼
[ RECITATION EVIDENCE CONTRACT ]
  - QuranAlignmentEvidence[] with zero religious terms
```

---

## 3. Explicit Data Contracts

### 3.1 `ObservedToken`
Captures exact frame-level acoustic provenance directly from the acoustic model:
```typescript
interface ObservedToken {
  token: string;             // Decoded symbol from 251-symbol vocabulary
  tokenId: number;           // Integer token ID (0..250)
  confidence: number;        // Calibrated posterior probability (0.0 - 1.0)
  marginPeak: number;        // Margin between top-1 and top-2 softmax probabilities
  startFrame: number;        // Output step start index
  endFrame: number;          // Output step end index
  startTime: number;         // Time in seconds from audio onset
  endTime: number;           // Time in seconds from audio onset
  sourceChunk: number;       // Streaming chunk index
  peakFrame: number;         // Step of maximum activation
}
```

### 3.2 `CanonicalQuranPhoneme`
Derived strictly from the verified Quran dataset established in Phase 2:
```typescript
interface CanonicalQuranPhoneme {
  riwayah: RiwayahType;         // RiwayahType.HAFS_AN_ASIM
  surah: number;                // e.g. 1
  ayah: number;                 // e.g. 2
  wordIndex: number;            // 1-based index of word within Ayah
  phonemeIndex: number;         // 0-based index of phoneme within Ayah
  phonemeIndexInWord: number;   // 0-based index within word
  canonicalToken: string;       // Verified token symbol
  wordTextUthmani: string;      // Word text in official Uthmani script
  sourceDatasetVersion: string; // "v1.0.0-hafs.verified"
  datasetHash: string;          // Official SHA-256 certificate hash
}
```

### 3.3 `QuranAlignmentEvidence`
Extends `RecitationEvidence` with deep provenance:
```typescript
interface QuranAlignmentEvidence extends RecitationEvidence {
  streamEvidenceType: 'PARTIAL_EVIDENCE' | 'FINAL_EVIDENCE';
  stability: 'STABLE' | 'PENDING' | 'TRANSIENT';
  recommendedAction: 'CONTINUE' | 'WAIT_FOR_MORE_AUDIO' | 'REQUEST_REPEAT' | 'DEFER_TO_RULE_ENGINE';
  timingStatus: 'VALID' | 'INCONCLUSIVE';
  canonicalMetadata: {
    riwayah: RiwayahType;
    sourceDatasetVersion: string;
    datasetHash: string;
    surah: number;
    ayah: number;
    wordTextUthmani: string;
  };
  observedTokenDetails?: {
    startFrame: number;
    endFrame: number;
    sourceChunk: number;
    peakFrame: number;
  };
}
```

---

## 4. Alignment Algorithm & Multi-Hypothesis Tracking

### 4.1 Cost Function
The alignment cost matrix penalizes divergences between canonical phonemes $C_i$ and observed tokens $O_j$:
$$\text{Cost}(C_i, O_j) = \begin{cases}
0.0 & \text{if } C_i = O_j \\
0.5 & \text{if } C_i \text{ and } O_j \text{ are phonetic/vowel variants (e.g. elongation or harakah)} \\
1.0 & \text{if } C_i \neq O_j \text{ (general consonant substitution)}
\end{cases}$$
- Deletion Cost: $1.0$
- Insertion Cost: $1.0$

### 4.2 Multi-Hypothesis Ambiguity Detection
The dynamic programming lattice backtracks both the primary optimal path $H_1$ and the secondary alternative path $H_2$:
$$\Delta C = \text{Cost}(H_2) - \text{Cost}(H_1)$$
If $\Delta C < \text{ambiguityCostMargin}$ ($0.35$):
- The alignment is marked `isAmbiguous = true`.
- Any contested divergence in the ambiguous region is assigned `evidenceStatus = 'INCONCLUSIVE'` and `errorType = 'INCONCLUSIVE'`.
- The engine prefers requesting a repeat over falsely correcting the reciter.

---

## 5. Temporal Alignment Policy

1. **Acoustic Reality**:
   - Phoneme start and end boundaries come strictly from acoustic frame timestamps computed by the `AuditableCtcDecoder` ($t = \text{frameIndex} \times 0.05\text{ s}$).
   - No uniform linear interpolation or character-length division of the audio timeline is permitted.
2. **Missing/Deleted Phonemes**:
   - If a canonical phoneme is omitted by the reciter (DELETION), no observed acoustic frames exist for it.
   - The engine explicitly marks `timingStatus = 'INCONCLUSIVE'` and sets `startTime = 0, endTime = 0`. It never invents artificial timestamps for unuttered phonemes.

---

## 6. Safety Gate & Interruption Policy

### 6.1 Deterministic Safety Gating
An acoustic observation is marked `INCONCLUSIVE` whenever:
1. Signal SNR is below $10.0\text{ dB}$, or audio is silent/white noise.
2. Posterior confidence is below $0.90$.
3. Softmax margin peak is below $0.80$.
4. Alignment confidence is below $0.60$.
5. Candidate alignment is ambiguous ($\Delta C < 0.35$).

### 6.2 Streaming Look-ahead Policy
During live streaming (`PARTIAL_EVIDENCE`):
- Tokens in the trailing look-ahead window (last $350\text{ ms}$) are marked `stability = 'PENDING'`.
- No definitive substitution or deletion errors are reported while pending; they are designated `errorType = 'UNCERTAIN'` with `recommendedAction = 'WAIT_FOR_MORE_AUDIO'`.
- Upon stream finalization (`FINAL_EVIDENCE`), pending tokens are resolved to `STABLE`.

### 6.3 Interruption Safety Policy
The alignment engine does **NOT** interrupt the reciter when a phonetic divergence occurs. Instead, it exposes pedagogical recommended actions:
- `CONTINUE`: High-confidence match.
- `WAIT_FOR_MORE_AUDIO`: Streaming look-ahead in progress.
- `REQUEST_REPEAT`: Degraded audio, low confidence, noise, or ambiguity.
- `DEFER_TO_RULE_ENGINE`: High-confidence divergence, passed downstream to the Tajweed rule engine to determine if pedagogical feedback is required.

---

## 7. Provisional Safety Thresholds Provenance

```typescript
export const PROVISIONAL_SAFETY_CONFIG: ProvisionalSafetyConfig = {
  minConfidence: 0.90,
  minMarginPeak: 0.80,
  minSnrDb: 10.0,
  minAlignmentConfidence: 0.60,
  ambiguityCostMargin: 0.35,
  classification: 'PROVISIONAL_SAFETY_THRESHOLDS',
  scientificallyValidated: false,
  provenance: 'Derived from Phase 4E.1 local regression on 8 golden recordings. Provisional heuristic only - not general population validated.',
};
```

These thresholds are explicitly documented as **provisional heuristics**. They must not be claimed as scientifically validated on arbitrary populations until open-access benchmarks can be independently evaluated.
