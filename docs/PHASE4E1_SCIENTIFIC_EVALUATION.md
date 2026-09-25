# Phase 4E.1 — Independent Scientific Evaluation Expansion

**Project:** Quran Teacher AI  
**Component:** Zipformer2-CTC Quranic Phoneme Acoustic Pipeline  
**Phase:** Phase 4E.1 (Independent Scientific Evaluation Expansion)  
**Execution Date:** September 19, 2026  
**Final Gate Status:** **C — DATASET / GROUND TRUTH BLOCKED**  
*(Local Golden Regression Classified as: B — EVALUATED BUT INSUFFICIENT FOR GENERAL POPULATION PRODUCTION CLAIMS)*

---

## 1. Executive Summary & Objective

Phase 4D.1 successfully established technical feature extraction (exact Kaldi 80-bin FBank), ONNX tensor interface contracts (99 input tensors, 99 output tensors), streaming cache carry-over, and trailing frame flushing for the Quran-specific Zipformer2-CTC acoustic model (`models/saboorhsn/quran-stt-int8.onnx`). 

Phase 4E.1 expands from technical integration into an **independent scientific evaluation** of this exact model artifact. The mission of Phase 4E.1 is:
1. Conduct an exhaustive audit of the model artifact, license, and upstream benchmark provenance.
2. Determine whether an independent reproduction of the official upstream benchmark (`Quran-Lab/quranic-asr-benchmark`) can be executed within our environment.
3. Quantify our own independent evaluation metrics without ever reporting upstream published figures as our own.
4. Subject the acoustic model to a multi-reciter authentic golden regression set (4 master reciters across 2 Ayahs) and a comprehensive adversarial anomaly suite (silence, white noise, omission, repetition, cross-ayah splicing).
5. Establish rigorous confidence calibration metrics (reliability curves across 10 bins, Expected Calibration Error, Maximum Calibration Error, Brier score, and `margin_peak` distributions).
6. Prevent premature religious rulings by preserving a strict architectural firewall between low-level acoustic evidence and high-level Tajweed/Fiqh pedagogy.

---

## 2. Non-Negotiable Scientific Principles & Rules

This evaluation adheres strictly to the following foundational scientific rules:

1. **Category Separation Rule**: Never report upstream published metrics as our own measurements. Maintain three strictly separated metric categories:
   - `CATEGORY_A`: **UPSTREAM_PUBLISHED_RESULT** (Published by model authors in papers/benchmarks)
   - `CATEGORY_B`: **OUR_REPRODUCED_RESULT** (Reproduced independently on identical benchmark splits)
   - `CATEGORY_C`: **OUR_LOCAL_GOLDEN_RESULT** (Measured on local regression datasets)
2. **Honest Inaccessibility Reporting**: If external benchmark data is gated or inaccessible, report the status honestly as **BLOCKED**. Never fabricate synthetic benchmark results or present proxy datasets as the official benchmark.
3. **Test Split Sanctity**: Never optimize thresholds on test sets. Any threshold tuning must occur on separate validation data. Test datasets remain untouched until final evaluation.
4. **No Error Synthesis as Human Truth**: Never synthesize errors (e.g., audio splicing, silence insertion, noise addition) and present them as authentic human recitation mistakes. Synthetic adversarial audio must always be labeled: `SYNTHETIC_EVALUATION_ONLY`.
5. **Separation of Acoustics from Religious Rulings**: Never allow the acoustic neural model to directly classify religious concepts such as *Lahn Jali* (clear grammatical error), *Lahn Khafi* (hidden tajweed error), *Ikhfa*, *Idgham*, *Iqlab*, *Qalqalah*, or *Madd* validity. The model outputs purely **phonetic / acoustic evidence** ($P(\text{phoneme} \mid \text{audio})$).
6. **Safety Precaution Over Accusation**: When acoustic evidence is low-confidence, noisy, or ambiguous, the safety disposition MUST remain `INCONCLUSIVE`, prompting a courteous `REPEAT_REQUESTED` ("I need you to repeat that") rather than an accusatory error verdict.
7. **Provisional Gating**: Do not claim production accuracy unless supported by an appropriately sized, diverse, independent general population evaluation.

---

## 3. Model Artifact Audit

An exact cryptographic and architectural audit of the active model artifact was conducted on the execution environment:

| Property | Value |
| :--- | :--- |
| **Model Filename** | `models/saboorhsn/quran-stt-int8.onnx` |
| **Model File Size** | 72,708,228 bytes (~69.34 MB) |
| **Model SHA-256 Checksum** | `31755836528da336a6192121cd7bc82cb41752dddb65566fd000b89c8686da6b` |
| **Token Vocabulary File** | `models/saboorhsn/tokens.txt` |
| **Token File Size** | 1,778 bytes (251 symbols, newline-delimited) |
| **Token File SHA-256** | `252c10687e442aa9291973065fae19fa39bcd681c4f5612ec496a647e20b43a1` |
| **Architecture** | Zipformer2-CTC (Pruned Stateless Zipformer with CTC loss) |
| **Parameter Count** | ~65.5 Million parameters (INT8 dynamic weight quantization) |
| **Model Version** | v3 Base (INT8 Quantized ONNX Export) |
| **Blank Symbol Index** | ID 0 (`<blk>`) |
| **Acoustic Feature Input** | `x`: Shape `[1, 39, 80]` (39 frames of 80-bin Kaldi Mel filterbanks = 600 ms chunk) |
| **Recurrent Cache Inputs** | 98 cache/state tensors (`cached_len_*`, `cached_avg_*`, `cached_key_*`, `cached_val_*`) |
| **Total ONNX Inputs** | 99 tensors (`x` + 98 cache states) |
| **Total ONNX Outputs** | 99 tensors (`log_probs`: Shape `[1, 9, 251]` + 98 updated cache states) |
| **Runtime Engine** | ONNX Runtime Node (`onnxruntime-node@1.20.1`) |
| **Execution Environment** | Node.js v22.23.2 on Linux x86_64 (gVisor containerized sandbox) |
| **Artifact Upstream Origin** | Mirror repository `https://huggingface.co/Saboorhsn/quran-stt-onnx` |
| **Upstream Source Model** | `https://huggingface.co/Quran-Lab/zipformer_p-arabic-v3` |
| **Artifact License** | Quran-Lab No-Profit License 1.1 (`NPL-1.1`) |
| **Current Upstream License** | Quran-Lab No-Profit License 1.2 (`NPL-1.2`) |

---

## 4. Upstream Benchmark Audit

The official benchmark published by the upstream model authors is `Quran-Lab/quranic-asr-benchmark` (release v1.1).

### 4.1 Dataset Architecture
The benchmark was designed specifically to measure Phoneme Error Rate (PER) for Quranic ASR across varying acoustic environments:
- **Split A (`everyayah_heldout`)**: 200 studio audio clips from 3 held-out professional EveryAyah reciters (reciters unseen during model pretraining).
- **Split B (`tlog_holdout`)**: 200 real-world mobile phone recordings sourced from Tarteel user audio logs, characterized by ambient room noise, diverse reverberation, variable microphonic frequency responses, and non-professional reciters.
- **Split C (`qul_alnufais`)**: 200 high-definition studio clips from Kuwaiti reciter Sheikh Ahmad Al-Nufais (completely held-out modern recording).
- **Total Benchmark Volume**: 600 audio recordings accompanied by canonical Hafs 'an 'Asim phonetic transcriptions.

### 4.2 Ground-Truth Generation & Hafs Rules
Ground truth phoneme sequences in the upstream benchmark were generated deterministically using the `quran-transcript` pipeline:
- Canonical Uthmani script mapped to 251 phonetic symbols reflecting Hafs 'an 'Asim recitation conventions.
- Explicit phonetic representation of Madd elongation marks (`ۦۦۦۦ`, `اا`), Shaddah doubling, silent letters, assimilation (`Idgham`), and Noon Sakinah rules.

### 4.3 Evaluation Metric & Scoring Algorithm
The benchmark uses `score.py` and `quran_per_eval.py`:
- Standard Dynamic Programming Levenshtein edit distance between greedy CTC decoded hypothesis phonemes and reference ground-truth phonemes.
- Error decomposition:
  $$\text{PER} = \frac{S + D + I}{N_{\text{ref}}} \times 100\%$$
- Text normalization options: Stripping non-phonemic diacritics, unifying hamza variants, and collapsing whitespace.

---

## 5. Upstream Benchmark Reproduction Audit

During Phase 4E.1, automated reproduction of the official `Quran-Lab/quranic-asr-benchmark` was attempted.

### 5.1 Technical Findings
1. Access to the Hugging Face repository `Quran-Lab/quranic-asr-benchmark` resulted in `HTTP 401: Unauthorized`.
2. The benchmark repository is governed by Hugging Face Gated Dataset controls (`gated: auto`), requiring:
   - Interactive user login via Hugging Face web interface.
   - Formal agreement to the research-only, non-commercial Quran-Lab terms.
   - Provision of a user-specific Hugging Face API token (`HF_TOKEN`) with read permissions.
3. No valid authentication token is configured in the execution environment.

### 5.2 Reproduction Status
$$\mathbf{REPRODUCTION\_STATUS:\ BLOCKED}$$

In adherence to Non-Negotiable Scientific Rule #2, **we do not fabricate or proxy upstream benchmark results**. The benchmark reproduction remains explicitly classified as **BLOCKED** due to external authorization barriers.

---

## 6. Separation of Results

To maintain strict scientific integrity, metrics are maintained in three distinct categories:

| Metric Split | Category A: Upstream Published Result | Category B: Our Reproduced Result | Category C: Our Local Golden Result |
| :--- | :---: | :---: | :---: |
| **Split A (`everyayah_heldout`)** | **1.43% PER** | **BLOCKED** (Gated 401) | N/A (External Split) |
| **Split B (`tlog_holdout`)** | **3.65% PER** | **BLOCKED** (Gated 401) | N/A (External Split) |
| **Split C (`qul_alnufais`)** | **9.10% PER** | **BLOCKED** (Gated 401) | N/A (External Split) |
| **Local Golden Set (Ayah 1:1, 4 Reciters)** | Not Reported Upstream | N/A (Local Set) | **3.33% PER** (2 / 60 errors) |
| **Local Golden Set (Ayah 1:2, 4 Reciters)** | Not Reported Upstream | N/A (Local Set) | **0.00% PER** (0 / 72 errors) |
| **Combined Local Golden (8 Recordings)** | Not Reported Upstream | N/A (Local Set) | **1.52% PER** (2 / 132 errors) |

*Notice: Category A, Category B, and Category C results are NEVER averaged or merged.*

---

## 7. Data Split & Leakage Analysis

### 7.1 Quranic Text Properties & Memorization Risk
The Quranic text is fixed (6,236 verses). Unlike general speech recognition where text content is open-ended, Quranic ASR models are trained on large corpora (~5,400 hours) containing multiple recitations of identical verses. Consequently, a Quranic acoustic model may develop strong acoustic and language priors for specific ayahs.

### 7.2 Training Corpus Overlap with Local Golden Set
The project's local golden set incorporates recordings from Sheikh Mishary Rashid Alafasy, Sheikh Mahmoud Khalil Al-Husary, Sheikh Muhammad Siddiq Al-Minshawi, and Sheikh Saad Al-Ghamadi. These recordings originate from the public EveryAyah archive. 
- **Leakage Finding**: EveryAyah audio is widely known to be included in the ~5,400-hour training corpus of `zipformer_p-arabic-v3`.
- **Scientific Consequence**: The local golden dataset CANNOT be considered an unseen out-of-domain test set. It functions strictly as a **regression and pipeline integrity set**, validating that inference, feature extraction, and alignment remain numerically stable.

---

## 8. Local Golden Regression Evaluation

The local golden set consists of 8 authentic master recordings across 4 reciters representing four distinct recitation styles, covering Surah Al-Fatihah Ayahs 1:1 and 1:2:

### 8.1 Empirical Results Table

| ID | Reciter | Recitation Style | Ayah | Ref Tokens | Hyp Tokens | Matches | Sub | Del | Ins | PER | RTF | Disposition |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `GOLDEN-001` | Sheikh Mishary Alafasy | Murattal Moderate | 1:1 | 15 | 15 | 15 | 0 | 0 | 0 | **0.00%** | 0.094 | `PROCEED` |
| `GOLDEN-002` | Sheikh Mahmoud Al-Husary | Murattal Educational (Slow) | 1:1 | 15 | 14 | 14 | 0 | 1 | 0 | **6.67%** | 0.114 | `EVIDENCE_FLAGGED` |
| `GOLDEN-003` | Sheikh Mishary Alafasy | Murattal Moderate | 1:2 | 18 | 18 | 18 | 0 | 0 | 0 | **0.00%** | 0.109 | `PROCEED` |
| `GOLDEN-004` | Sheikh Mahmoud Al-Husary | Murattal Educational (Slow) | 1:2 | 18 | 18 | 18 | 0 | 0 | 0 | **0.00%** | 0.115 | `PROCEED` |
| `GOLDEN-005` | Sheikh Muhammad Al-Minshawi | Murattal Emotional (Melodic) | 1:1 | 15 | 15 | 14 | 1 | 0 | 0 | **6.67%** | 0.117 | `EVIDENCE_FLAGGED` |
| `GOLDEN-006` | Sheikh Saad Al-Ghamadi | Murattal Brisk (Fast) | 1:1 | 15 | 15 | 15 | 0 | 0 | 0 | **0.00%** | 0.105 | `PROCEED` |
| `GOLDEN-007` | Sheikh Muhammad Al-Minshawi | Murattal Emotional (Melodic) | 1:2 | 18 | 18 | 18 | 0 | 0 | 0 | **0.00%** | 0.117 | `PROCEED` |
| `GOLDEN-008` | Sheikh Saad Al-Ghamadi | Murattal Brisk (Fast) | 1:2 | 18 | 18 | 18 | 0 | 0 | 0 | **0.00%** | 0.112 | `PROCEED` |

### 8.2 Qualitative Error Decomposition
1. **Husary 1:1 (`GOLDEN-002`)**: 1 Deletion. The terminal Madd elongation symbol `ۦۦۦۦ` at the end of the Basmalah was decoded with slightly fewer duration frames than the 4-harakah canonical representation.
2. **Minshawi 1:1 (`GOLDEN-005`)**: 1 Substitution. Minshawi's pronounced vocal vibrato on the word *Ar-Rahman* produced an acoustic shift where a short vowel was decoded as an adjacent vowel variant.
3. **Ayah 1:2 Perfection**: Across all 4 master reciters (moderate, slow, emotional, and brisk), the model achieved a **100% exact phonetic match (0.00% PER)**.

---

## 9. Confidence Calibration, Reliability Curves & Brier Score

Confidence values output by neural network softmax layers are known to suffer from severe overconfidence under CTC loss. To evaluate calibration empirically, $N = 131$ token alignment pairs from the authentic golden set were evaluated across 10 probability bins:

### 9.1 Summary Calibration Metrics
- **Evaluated Sample Size ($N$)**: 131 aligned phonetic predictions
- **Average Model Confidence**: **98.65%**
- **Average Empirical Accuracy**: **99.24%**
- **Expected Calibration Error (ECE)**: **1.012%** ($0.01012$)
- **Maximum Calibration Error (MCE)**: **22.150%** ($0.2215$) *(Occurs in low-frequency bin $[0.7 - 0.8)$ with $N=2$)*
- **Brier Score**: **0.00715** ($\frac{1}{N}\sum(p_i - y_i)^2$)
- **Optimal Temperature Factor ($T$)**: Estimated at **1.15**

### 9.2 10-Bin Reliability Diagram Table

| Bin Range | Sample Count ($N_b$) | Mean Confidence | Empirical Accuracy | Calibration Error ($|acc - conf|$) |
| :---: | :---: | :---: | :---: | :---: |
| $[0.0 - 0.1)$ | 0 | — | — | — |
| $[0.1 - 0.2)$ | 0 | — | — | — |
| $[0.2 - 0.3)$ | 0 | — | — | — |
| $[0.3 - 0.4)$ | 0 | — | — | — |
| $[0.4 - 0.5)$ | 0 | — | — | — |
| $[0.5 - 0.6)$ | 0 | — | — | — |
| $[0.6 - 0.7)$ | 0 | — | — | — |
| $[0.7 - 0.8)$ | 2 | 77.85% | 100.00% | 22.15% |
| $[0.8 - 0.9)$ | 5 | 85.58% | 80.00% | 5.58% |
| $[0.9 - 1.0)$ | 124 | 99.51% | 100.00% | 0.49% |

### 9.3 Margin-Peak ($\Delta P$) Distribution
Confidence alone is insufficient for CTC models; the difference between the top-1 and top-2 softmax probabilities ($\Delta P = P_{\text{top1}} - P_{\text{top2}}$) is essential to detect ambiguous phonetic boundaries:
- **Mean $\text{margin\_peak}$**: **0.9735**
- **Median $\text{margin\_peak}$**: **0.9998**
- **Minimum $\text{margin\_peak}$**: **0.5365**
- **Maximum $\text{margin\_peak}$**: **1.0000**
- **Fraction $\ge 0.80$**: **94.66%**

---

## 10. Provisional Safety Thresholds

The following safety thresholds are established in the domain layer:

```typescript
export const PROVISIONAL_SAFETY_THRESHOLDS = {
  minConfidence: 0.90,       // Minimum top-1 softmax probability
  minMarginPeak: 0.80,       // Minimum margin between top-1 and top-2
  minSnrDb: 10.0,            // Minimum estimated Signal-to-Noise Ratio
  classification: 'PROVISIONAL_SAFETY_THRESHOLDS',
  scientificallyValidated: false,
  note: 'Provisional heuristic thresholds derived from local regression evaluation. Must NOT be promoted to production claims without large-scale independent validation.'
};
```

**Scientific Caveat**: These thresholds are formally classified as **PROVISIONAL_SAFETY_THRESHOLDS**. They cannot be claimed as scientifically validated general population standards until verified on an out-of-domain benchmark of at least 1,000+ reciters across diverse microphones.

---

## 11. Multi-Condition & Multi-Reciter Breakdown

### 11.1 Reciter Performance Breakdown

| Reciter | Tokens ($N$) | Empirical Accuracy | Mean Confidence | Mean Margin |
| :--- | :---: | :---: | :---: | :---: |
| **Sheikh Mishary Rashid Alafasy** | 33 | **100.0%** | 98.9% | 0.978 |
| **Sheikh Mahmoud Khalil Al-Husary** | 32 | **100.0%** | 98.5% | 0.970 |
| **Sheikh Muhammad Siddiq Al-Minshawi**| 33 | **97.0%** | 99.1% | 0.982 |
| **Sheikh Saad Al-Ghamadi** | 33 | **100.0%** | 98.2% | 0.964 |

### 11.2 Recitation Condition / Timbre Breakdown

| Condition / Style | Tokens ($N$) | Accuracy | Mean Confidence | Brier Score |
| :--- | :---: | :---: | :---: | :---: |
| `MURATTAL_STUDIO_MODERATE` | 33 | **100.0%** | 98.9% | 0.0017 |
| `MURATTAL_STUDIO_SLOW_EDUCATIONAL` | 32 | **100.0%** | 98.5% | 0.0024 |
| `MURATTAL_STUDIO_EMOTIONAL` | 33 | **97.0%** | 99.1% | 0.0220 |
| `MURATTAL_STUDIO_BRISK` | 33 | **100.0%** | 98.2% | 0.0023 |

**Analysis**:
- **Brisk Murattal**: Fast speech rate (Saad Al-Ghamadi) exhibited no phonetic degradation (100% accuracy, mean margin 0.964).
- **Slow Educational**: Extended elongations (Mahmoud Khalil Al-Husary) did not cause CTC blank insertion instabilities.
- **Emotional Vibrato**: Minshawi's melodic modulation caused the sole substitution in the authentic set, illustrating that acoustic vibrato can challenge fixed phoneme boundaries.

---

## 12. Adversarial Audio & False-Positive Evaluation

A synthetic adversarial evaluation suite containing 5 stress tests was executed to verify false-positive rejection and anomalous error detection. All synthetic audio is strictly cataloged under `SYNTHETIC_EVALUATION_ONLY`:

| ID | Test Condition | Input Description | Observed Emission | Gating Disposition | Safety Verification Result |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `SYNTH-001` | **Digital Silence** | 4.0s digital zero PCM | 0 tokens emitted | `REPEAT_REQUESTED` (`INCONCLUSIVE`) | **PASSED**: Zero hallucinations; no false accusations |
| `SYNTH-002` | **Gaussian White Noise** | 4.0s white noise (-25 dBFS) | 0 tokens emitted | `REPEAT_REQUESTED` (`INCONCLUSIVE`) | **PASSED**: 100% noise rejection; blank frames dominant |
| `SYNTH-003` | **Deliberate Omission** | Alafasy 1:1 omitting *Ar-Rahman* | 10 tokens emitted | `EVIDENCE_FLAGGED` (`HIGH`) | **PASSED**: Exactly 5 deletions detected for missing word |
| `SYNTH-004` | **Deliberate Repetition** | Alafasy 1:1 repeating *Ar-Rahman* | 20 tokens emitted | `EVIDENCE_FLAGGED` (`HIGH`) | **PASSED**: Exactly 5 insertions detected for duplicated word |
| `SYNTH-005` | **Cross-Ayah Splicing** | Spliced Basmalah onto Ayah 1:2 | 18 tokens emitted | `EVIDENCE_FLAGGED` (`HIGH`) | **PASSED**: 5 substitutions detected on mismatched root |

### 12.1 Error Rate Metrics Under Adversarial Testing
- **False Token Hallucination Rate on Silence/Noise**: **0.00%** (0 false tokens emitted)
- **False Interruption Rate on Certified Recitation**: **0.00%**
- **Omission Detection Rate**: **100.0%** (5/5 deleted phonemes flagged)
- **Insertion Detection Rate**: **100.0%** (5/5 duplicated phonemes flagged)

---

## 13. Safety Disposition Policy

To prevent the catastrophic religious error of falsely condemning a student's valid recitation, the domain layer enforces a strict disposition state machine:

```
[Acoustic Evidence] 
        │
        ├── SNR < 10 dB OR Null Tokens ───► REPEAT_REQUESTED (INCONCLUSIVE)
        │
        ├── Margin < 0.80 OR Conf < 0.90 ──► REPEAT_REQUESTED (INCONCLUSIVE)
        │
        ├── Uncalibrated Evaluator ────────► BLOCKED_UNCERTAIN
        │
        ├── 0 Errors & High Confidence ────► PROCEED
        │
        └── High Confidence Errors ────────► EVIDENCE_FLAGGED (For Fiqh Layer Review)
```

1. **Preference for Courteous Repetition**: If acoustic conditions are ambiguous or background noise is elevated, the system returns `REPEAT_REQUESTED` with status `INCONCLUSIVE`.
2. **Prohibition of Condemnation**: The acoustic engine NEVER outputs condemnatory messages (e.g., "You made a grave sin"). It merely provides structured edit distances to the downstream pedagogical agent.

---

## 14. Real-Time Performance & Computational SLA

Real-Time Factor (RTF) measures the ratio of inference computation time to audio duration ($\text{RTF} = \frac{T_{\text{compute}}}{T_{\text{audio}}}$). A production streaming SLA requires $\text{RTF} < 0.25$ to ensure that inference comfortably runs in real-time without buffering.

### 14.1 Measured Computational Profile

| Reciter / Audio Clip | Audio Duration | Computation Time | Real-Time Factor (RTF) | SLA Compliance ($\le 0.25$) |
| :--- | :---: | :---: | :---: | :---: |
| Alafasy (1:1) | 4.88 s | 461 ms | **0.094** | **PASSED** |
| Husary (1:1) | 6.08 s | 693 ms | **0.114** | **PASSED** |
| Minshawi (1:1) | 4.98 s | 583 ms | **0.117** | **PASSED** |
| Ghamadi (1:1) | 3.45 s | 362 ms | **0.105** | **PASSED** |
| Alafasy (1:2) | 5.24 s | 571 ms | **0.109** | **PASSED** |
| Husary (1:2) | 6.42 s | 738 ms | **0.115** | **PASSED** |
| Minshawi (1:2) | 6.12 s | 716 ms | **0.117** | **PASSED** |
| Ghamadi (1:2) | 3.92 s | 439 ms | **0.112** | **PASSED** |

**Summary**: The acoustic pipeline executes at an average RTF of **0.110**, processing audio roughly **9x faster than real-time** on a standard single CPU thread within a containerized environment.

---

## 15. Real Human Recitation Error Data Audit

An honest scientific evaluation must address the availability of real human recitation error data:

- **Audit Finding**: Authentic, un-gated datasets containing real human recitation errors annotated with verified Shaykh consensus (e.g., student recordings with labeled *Lahn Jali* and *Lahn Khafi*) are **UNAVAILABLE** in the local runtime environment.
- **Current Status**: **UNAVAILABLE / BLOCKED**.
- **Prohibition on Faking Human Errors**: Spliced audio files (`SYNTH-003`, `SYNTH-004`, `SYNTH-005`) provide mathematical sanity checks for Levenshtein alignment, but they are NOT genuine human mistakes. They must never be cited as proof that the system can catch real-world human students making subtle phonetic errors.

---

## 16. Tajweed & Fiqh Decoupling Architecture

A foundational principle of this project is the total architectural decoupling between the machine learning acoustic layer and the Islamic jurisprudence (*Fiqh* / *Tajweed*) rule engine:

```
┌────────────────────────────────────────────────────────┐
│                   ACOUSTIC LAYER                       │
│  - Zipformer2-CTC ONNX Runtime                         │
│  - Kaldi 80-bin Filterbank DSP                         │
│  - Levenshtein Edit Distance Alignment                 │
│  - Output: Phoneme matches, substitutions, confidences │
└──────────────────────────┬─────────────────────────────┘
                           │ Pure RecitationEvidence
                           ▼ (Zero Fiqh Terms)
┌────────────────────────────────────────────────────────┐
│              TAJWEED & FIQH DOMAIN LAYER               │
│  - Dual-Scholarly Certified Rules                      │
│  - Hafs 'an 'Asim Phonotactic Mapping                  │
│  - Mapping: Substitution ──► Potential Lahn Jali       │
│  - Pedagogical Interruption Policy                     │
└────────────────────────────────────────────────────────┘
```

**Verification Check**: An automated grep and AST scan across all domain evidence objects confirms that strings such as `LAHN`, `TAJWEED`, `HARAM`, `HALAL`, and `FATWA` are strictly absent from the acoustic evidence contracts.

---

## 17. Licensing & Compliance Audit

| Licensing Aspect | Local Artifact | Upstream Current Repository |
| :--- | :--- | :--- |
| **License Name** | Quran-Lab No-Profit License 1.1 (`NPL-1.1`) | Quran-Lab No-Profit License 1.2 (`NPL-1.2`) |
| **Commercial Use** | Strictly Prohibited | Strictly Prohibited |
| **Attribution** | Mandatory: Quran-Lab / Saboor Hussain | Mandatory: Quran-Lab |
| **Redistribution** | Permitted under non-profit research terms | Permitted with explicit license preservation |
| **Compliance Status** | **COMPLIANT** (Non-commercial educational prototype) | **COMPLIANT** |

---

## 18. Threat Modeling & Failure Modes

1. **Acoustic Similarity Confounding**:
   - The Arabic pharyngeal fricative */ħ/* (`ح`) and glottal fricative */h/* (`ه`) have overlapping acoustic formants in low-cost microphones. Under degraded audio, the model can confuse these phonemes, transforming a correct recitation into a false substitution.
2. **Room Reverberation**:
   - In highly reverberant spaces (such as large tiled mosques or bare living rooms), late acoustic reflections smear phoneme energy across time frames, reducing `margin_peak` and triggering `REPEAT_REQUESTED`.
3. **Child and Non-Native Accents**:
   - The model was trained predominantly on adult Arabic recitation. Pitch differences in children and distinct phoneme substitutions common in non-native speakers (e.g., Urdu, Turkish, Somali, or English native speakers) may yield out-of-distribution acoustic feature vectors.
4. **Bandwidth Limitations**:
   - Standard phone calls (8 kHz narrowband) or aggressive web compression codecs degrade the 4 kHz - 8 kHz frequency bands critical for sibilants (`س`, `ص`) and emphatic consonants (`ط`, `ظ`).

---

## 19. Roadmap to Phase 4E Upgrade

To elevate Phase 4E from its current status to **A — SCIENTIFICALLY REPRODUCED AND SUFFICIENT**, the following prerequisites must be met:

1. **Authenticated Benchmark Access**: Provision authorized credentials to access `Quran-Lab/quranic-asr-benchmark` and execute `score.py` directly on all 600 official audio clips.
2. **Large-Scale Multi-Reciter Evaluation**: Expand the evaluation from 8 local clips to at least 1,000 diverse clips covering:
   - Non-Arab reciters (Indonesian, Pakistani, Turkish, Nigerian, Western).
   - Female and child reciters.
   - Varied acoustic conditions (noisy cars, budget smartphones, reverberant rooms).
3. **Curated Human Recitation Error Corpus**: Partner with accredited Quranic institutions to assemble an authentic database of recorded student recitation errors verified by dual *ijazah*-holding scholars.
4. **Isotonic Regression / Platt Calibration**: Replace provisional temperature scaling with isotonic regression calibrated across diverse multi-condition validation sets.

---

## 20. Final Scientific Gate Classification

In accordance with Phase 4E.1 scientific mandates, exactly one final status is declared for this phase:

$$\Huge\mathbf{FINAL\ STATUS:\ C\ —\ DATASET\ /\ GROUND\ TRUTH\ BLOCKED}$$

### Sub-Status Breakdown:
- **Upstream Benchmark Reproduction**: **C — DATASET / GROUND TRUTH BLOCKED** (Access to `Quran-Lab/quranic-asr-benchmark` returned HTTP 401 Unauthorized; gated dataset terms require interactive researcher approval).
- **Local Golden Pipeline Regression**: **B — EVALUATED BUT INSUFFICIENT** (Evaluated across 8 authentic master recordings and 5 adversarial stress tests with 99.24% empirical accuracy and 1.012% ECE; insufficient to claim general production accuracy across the global population).

---

*Report certified by automated test suite `Phase4eScientificEvaluation.test.ts` and runner `run_phase4e1_evaluation.ts`. All 97 verification tests passing.*
