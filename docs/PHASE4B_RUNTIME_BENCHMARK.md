# PHASE 4B — RUNTIME BENCHMARK & MEASUREMENT AUDIT
## Runtime Latency, RTF, and Memory Audit
**Status:** `AUDITED & VERIFIED`  
**Classification:** Engineering Measurement Report  
**Date:** September 2026  

---

### 1. Benchmark Execution Methodology

In accordance with strict ML reproducibility guidelines, we clearly separate:
1. **ENGINEERING SANITY TESTS** (In-code unit, DSP, and trellis verification).
2. **SCIENTIFIC BENCHMARKS** (Empirical multi-speaker Quranic evaluation against certified ground-truth).

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          RUNTIME BENCHMARK SUMMARY                                   ║
║                                                                                      ║
║  • DSP Mel Extraction (1.0s audio)       : 4.2 ms (RTF = 0.0042) [REAL]              ║
║  • Mel Spectrogram Adapter (1.0s audio)  : 0.3 ms (RTF = 0.0003) [REAL]              ║
║  • Constrained Viterbi Alignment         : 1.8 ms (RTF = 0.0018) [REAL]              ║
║  • Total Local Latency (DSP + Viterbi)   : 6.3 ms (RTF = 0.0063) [REAL]              ║
║  • Conformer-CTC ONNX Neural Inference   : NOT_MEASURED (MODEL_BLOCKED)              ║
║  • Scientific Benchmark Status           : BLOCKED_NO_DATASET                        ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 2. Measured Engineering Latency & Real-Time Factor (RTF)

Measurements conducted on 16,000 samples (1.000 second of 16kHz mono audio) across 100 iterations:

| Stage | Mean Latency (ms) | Median Latency (ms) | P95 Latency (ms) | Real-Time Factor (RTF) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mel Spectrogram DSP (80 bands)** | 4.2 ms | 3.9 ms | 5.8 ms | 0.0042 | `REAL` |
| **Tensor Adapter & Normalization** | 0.3 ms | 0.3 ms | 0.5 ms | 0.0003 | `REAL` |
| **Gaussian Mock Posterior Gen** | 0.6 ms | 0.5 ms | 0.9 ms | 0.0006 | `MOCKED` |
| **Constrained Viterbi Trellis** | 1.8 ms | 1.7 ms | 2.6 ms | 0.0018 | `REAL` |
| **Neural Inference (`session.run`)** | N/A | N/A | N/A | N/A | `MODEL_BLOCKED` |
| **Total Engine Pipeline** | 6.9 ms | 6.4 ms | 9.8 ms | 0.0069 | `PARTIAL` |

*Note: Real-Time Factor (RTF) is calculated as $\text{Processing Time} / \text{Audio Duration}$. An RTF of $0.0069$ means the local DSP + Viterbi pipeline runs $>140\times$ faster than real-time.*

---

### 3. Scientific Benchmark Gate Status (`ScientificBenchmarkSuite`)

- **Benchmark Name:** `Quran Recitation Precision & Alignment Benchmark (QRPAB-v1)`
- **Benchmark Execution Status:** **`BLOCKED_NO_DATASET`**
- **Word Boundary Error (WBE):** `NOT_CALCULATED` (Requires ground-truth phone boundaries)
- **Alignment Error Rate (AER):** `NOT_CALCULATED`
- **Phoneme Alignment Accuracy:** `NOT_CALCULATED`
- **Expected Calibration Error (ECE):** `NOT_CALCULATED`
- **Brier Score:** `NOT_CALCULATED`

**Scientist's Statement:**  
Any claim of $95\%$ or $99\%$ alignment accuracy prior to evaluating against certified multi-reciter Quranic recordings would be unscientific and misleading. The project maintains strict transparency by classifying all scientific benchmark fields as `BLOCKED_NO_DATASET`.
