# PHASE 6: CODEBASE FORENSIC AUDIT & REALITY BASELINE

**Audit Date**: September 2026  
**Auditor**: Lead Speech Scientist & Quran Recitation Systems Engineer  
**Objective**: Rigorous empirical inspection of all system layers to establish the verifiable boundary between REAL, MOCKED, HEURISTIC, EXPERIMENTAL, and NOT_IMPLEMENTED components before implementing Phase 6 advanced acoustic refinement.

---

## 1. System Layer-by-Layer Forensic Audit

| Subsystem | Source Component | Architectural Status | Real vs Heuristic vs Mocked Breakdown |
|:---|:---|:---|:---|
| **Audio Capture & PCM** | Web Audio API / PCM streaming | **REAL / PRODUCTION** | True 16kHz mono Float32Array PCM input. Real downsampling & linear PCM buffer management. |
| **Kaldi Filterbank DSP** | `KaldiFbankExtractor.ts` | **REAL / PRODUCTION** | Exact mathematical implementation of Kaldi 80-bin Mel-filterbank: 16kHz, Povey window, 25ms length, 10ms frame shift, pre-emphasis 0.97, low-cutoff 20Hz, high-cutoff -400Hz. |
| **Zipformer2-CTC ONNX** | `ZipformerRuntime.ts`, `ModelRegistry.ts` | **REAL ARCHITECTURE / ENVIRONMENT GATED** | Model architecture and I/O contract (`[1, 61, 80]` -> `[1, 12, 251]`) are fully implemented with 99 streaming state caches. Note: Upstream HuggingFace ONNX weight checkpoint (`models/saboorhsn/quran-stt-int8.onnx`) is gated/unbundled in this isolated sandbox environment (`ERR-ASR-001`). Fallback deterministic pacing aligner operates when weights are absent. |
| **CTC Decoding & Trellis** | `AuditableCtcDecoder.ts` | **REAL / PRODUCTION** | Mathematical CTC greedy & beam decoding across 251 Quranic phonetic tokens with exact frame index tracking (`startFrame`, `endFrame`, `peakFrame`). |
| **Quran Alignment** | `ConstrainedPhonemeAligner.ts`, `QuranAwareAlignmentPipeline.ts` | **REAL / PRODUCTION** | Viterbi Dynamic Programming constrained alignment between acoustic tokens and verified canonical Uthmani phonemes. Calculates ambiguity cost margins and posterior probability margins. |
| **Recitation Evidence** | `RecitationEvidence.ts`, `RecitationEvidenceEngine.ts` | **REAL / PRODUCTION** | Immutable acoustic evidence data structures capturing `expectedToken`, `observedToken`, `acousticConfidence`, `alignmentConfidence`, `marginPeak`, and temporal bounds. |
| **Quran Data Layer** | `VerifiedQuranDataProvider.ts`, `HAFS_OFFICIAL_CERTIFICATE` | **REAL / SCHOLARLY AUTHENTICATED** | Zero-LLM, immutable 114-Surah Uthmani scripture dataset authenticated with King Fahd Complex SHA-256 (`9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`). |
| **Tajweed Knowledge Base** | `VerifiedTajweedKnowledgeBase.ts`, `rulesCatalog.ts` | **REAL / CANONICAL TEXT-MAPPED** | 19 active classical rules mapped to *Tuhfat al-Atfal* and *Al-Muqaddimah al-Jazariyyah*. Cryptographic hash: `4d67db2644cf57dd98609126e5081a50d3f8ede876cd832a125257fea5a0cec3`. Note: Lacks authorized living scholarly review committee sign-off (Religious Status = B). |
| **Tajweed Acoustic Limitations**| `DeterministicTajweedContextEvaluator.ts` | **REAL / SAFETY GATED** | Explicit physical safety gates: `ERR-TAJ-001` (Madd timing uncalibrated), `ERR-TAJ-002` (Ghunnah resonance unavailable), `ERR-TAJ-003` (Formants unavailable), `ERR-TAJ-004` (Burst transients unavailable). All return `INCONCLUSIVE`. |
| **Recitation Decision Engine** | `RecitationErrorDecisionEngine.ts` (Phase 5C) | **REAL / PRODUCTION** | 9 discrete decision states, 5 escalation levels, cascading alignment slip suppression (`ERR-DEC-001`), repeated error confidence-lock (`ERR-DEC-002`), learner-safe Arabic feedback without theological condemnation words. |
| **Acoustic Madd Duration** | To be built in Phase 6 | **NOT_IMPLEMENTED (Currently Gated)** | CTC frame counts were previously blocked from being used as duration proxies. Real physical mora duration pipeline required. |
| **Acoustic Ghunnah Murmur** | To be built in Phase 6 | **NOT_IMPLEMENTED (Currently Gated)** | Token identity `/n/`, `/m/` was previously blocked from proving resonance. Physical spectral ratio proxies required. |
| **Acoustic Makhraj Analysis** | To be built in Phase 6 | **NOT_IMPLEMENTED (Currently Gated)** | Spectral centroid / formant proxies required. Articulatory claims prohibited. |
| **Acoustic Qalqalah Release** | To be built in Phase 6 | **NOT_IMPLEMENTED (Currently Gated)** | Sub-35ms transient energy rise and spectral burst detection required. |

---

## 2. Scientific & Religious Status Matrix

```
================================================================================
GLOBAL SCIENTIFIC VALIDATION: B — Evaluated but Insufficient
GLOBAL RELIGIOUS SCHOLARLY VALIDATION: B — Text-Mapped but Unreviewed by Living Scholars
================================================================================
```

### Detailed Classifications:
1. **Scientifically Validated**:
   - Kaldi Filterbank frequency transform algorithms.
   - Viterbi Trellis alignment algorithms.
   - Shannon entropy and signal-to-noise ratio (SNR) calculations.
   - Temporal mora ratio normalization mathematics.
2. **Software-Tested Only**:
   - All 82 Phase 5B Tajweed rule mapping tests.
   - All 30 Phase 5C Recitation Decision Engine tests.
   - Provisional safety thresholds (`CONFIDENCE >= 0.90`, `MARGIN >= 0.80`, `SNR >= 10 dB`).
3. **Religiously Reviewed**:
   - King Fahd Complex official print edition (textual source authority).
   - Zero automated tests have been countersigned by an authorized Sheikh of Qira'at (`RELIGIOUSLY_REVIEWED_GOLDEN_TESTS = 0`).
4. **Heuristic / Experimental**:
   - `PROVISIONAL_DECISION_SAFETY_THRESHOLDS` (engineering defaults, uncalibrated on child/non-native reciters).
   - Fast alignment heuristic pacing fallback when neural weights are unbundled.

---

## 3. Mandatory Phase 6 Development Directives

1. **Acoustic Evidence $\neq$ Religious Verdict**:
   - Acoustic extractors output physical measurements (`durationSeconds`, `nasalEnergyRatio`, `burstSpectralCentroid`, `relativeProsodicRate`).
   - Extractors are **strictly forbidden** from emitting `TAJWEED_ERROR` or religious conclusions.
2. **Signal Quality Awareness**:
   - If audio SNR is low (< 10-15 dB), clipping, silent, or white noise: output `INSUFFICIENT_SIGNAL` or `INCONCLUSIVE`.
3. **Cascading Failure Protection**:
   - If alignment is unstable or slipping, acoustic analysis of boundaries is halted (`INCONCLUSIVE_ALIGNMENT`).
4. **Negative Controls**:
   - Every acoustic feature must explicitly demonstrate rejection of confounding non-speech artifacts (mic clicks, room reverberation, speaker pitch variation).
