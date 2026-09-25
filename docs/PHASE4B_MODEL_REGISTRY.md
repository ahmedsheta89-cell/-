# PHASE 4B — MODEL REGISTRY SPECIFICATION & AUDIT
## Formal Catalog & Procurement Audit for Quran Acoustic Inference
**Document Status:** `AUDITED & SEALED`  
**Classification:** Engineering Specification & Procurement Gate Report  
**Date:** September 2026  

---

### 1. Model Procurement Audit Summary

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          MODEL PROCUREMENT GATE AUDIT                                ║
║                                                                                      ║
║     [ OVERALL PROCUREMENT GATE STATUS: MODEL_BLOCKED ]                               ║
║                                                                                      ║
║  • Target Conformer-CTC (Quran Int8)   : MODEL_BLOCKED (No artifact in repository)   ║
║  • Generic Arabic ASR (Wav2Vec2-XLSR)  : DISQUALIFIED (317MB, Grapheme, Non-Quranic) ║
║  • Active Fallback Aligner (Phase 3)   : REAL & ACTIVE (Deterministic Local Engine)  ║
║  • ONNX Runtime Web Execution          : ARCHITECTURE READY / EXECUTION BLOCKED      ║
║  • Fake Logit / Synthetic Neural Rule  : STRICTLY REJECTED & PROHIBITED              ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 2. Evaluated Candidate Models

#### Candidate A: `quran-conformer-ctc-int8` (Target Specification)
- **Model ID:** `quran-conformer-ctc-int8`
- **Architecture:** Conformer-CTC Audio Encoder
- **Version:** `0.1.0-spec`
- **Source:** Quranic Speech ML Lab Target
- **License:** Apache-2.0
- **Language:** Classical Quranic Arabic (Hafs 'an 'Asim)
- **Sampling Rate:** 16,000 Hz
- **Input Tensor Shape:** `[1, T, 80]` (80-band Log-Mel Spectrogram)
- **Output Tensor Shape:** `[1, T, 45]` (Phoneme Emission Logits + `<blank>`)
- **Vocabulary:** 45 tokens (Consonants + Harakat + Madd + Ghunnah + `<blank>`)
- **Blank Token:** `<blank>` (Index 0)
- **Quantization:** INT8 Dynamic Quantization
- **Target Size:** ~28.5 MB
- **Checksum (SHA-256):** `None` (Artifact not packaged)
- **Supported Runtime:** ONNX Runtime Web (WASM + SIMD)
- **Certification Status:** `UNVERIFIED`
- **Procurement Gate Status:** **`MODEL_BLOCKED`**
- **Limitations & Blockers:**
  1. The physical ONNX model binary file (`.onnx` / `.ort`) does NOT exist in the repository filesystem.
  2. No legal open-weight checkpoint matching this exact input (80 Mel) and output (Quran Tajweed Phonemes) is verified for redistribution in this container.
  3. Strict refusal rule applied: No synthetic weights or empty model stubs were fabricated.

---

#### Candidate B: `wav2vec2-arabic-tashkeel-quantized` (Evaluated & Disqualified)
- **Model ID:** `wav2vec2-arabic-tashkeel-quantized`
- **Architecture:** Wav2Vec2-XLSR-53 with CTC Head
- **Version:** `1.0.0`
- **Source:** HuggingFace (`WajeehAzeemX/tashkeel-wav2vec2-arabic-test1`)
- **License:** Apache-2.0 / CC-BY-NC-4.0
- **Language:** Modern Standard Arabic (MSA)
- **Sampling Rate:** 16,000 Hz
- **Input Tensor Shape:** `[1, N]` (Raw 1D Time-Domain Waveform)
- **Output Tensor Shape:** `[1, T, 52]` (Arabic Alphabet Characters + Graphemes)
- **Vocabulary:** 52 Arabic alphabet characters
- **Blank Token:** `[PAD]` (Index 0)
- **Quantization:** INT8
- **Model Size:** 317,498,381 bytes (317.5 MB)
- **Checksum (SHA-256):** `a31b38b8176751301d3009dadbf2210649d28c898ee355a8a69616931f780280`
- **Supported Runtime:** ONNX Runtime Web WASM
- **Certification Status:** `ENGINEERING_ONLY`
- **Procurement Gate Status:** **`DISQUALIFIED / MODEL_BLOCKED`**
- **Detailed Technical Reasons for Rejection:**
  1. **Excessive Footprint:** 317.5 MB exceeds browser memory constraints and causes severe download latencies (>60 seconds on standard mobile connections).
  2. **Grapheme vs Phoneme Mismatch:** Outputs written Arabic text characters, not phonemes. Cannot distinguish between a plain Noon and a Noon Sakinah undergoing Ikhfa' with Ghunnah.
  3. **Domain Shift:** Trained on broadcast news and modern standard speech, which completely lacks Quranic recitation pacing, sustained Madd durations, and Tajweed rules.
  4. **Input Incompatibility:** Requires raw audio samples `[1, N]`, bypassing our verified 80-band Mel-spectrogram DSP extractor.

---

#### Candidate C: `deterministic-pacing-aligner-v1` (Active Baseline Aligner)
- **Model ID:** `deterministic-pacing-aligner-v1`
- **Architecture:** Heuristic Dynamic Time Pacing & Energy VAD Aligner
- **Version:** `1.0.0-baseline`
- **Source:** In-house Core Quran Teacher AI Engineering
- **License:** MIT
- **Sampling Rate:** 16,000 Hz
- **Input Format:** `Float32Array` PCM audio
- **Output Format:** Word alignment boundaries `WordTiming[]`
- **Model Size:** 12,400 bytes (In-code DSP logic)
- **Certification Status:** `BENCHMARKED`
- **Procurement Gate Status:** **`AVAILABLE_LOCAL`**
- **Strengths:** 100% deterministic, 0 ms network latency, zero hallucinations, instant fallback when acoustic confidence fails.
- **Limitations:** Cannot measure acoustic phone quality or Tajweed makharij.
