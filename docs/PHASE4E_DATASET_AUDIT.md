# Phase 4E — Dataset & Evaluation Audit
**Document Version:** 1.0.0  
**Evaluation Target:** `Zipformer2-CTC Quranic Phoneme Model` (`quran-stt-int8.onnx`)  
**Upstream Provenance:** Quran-Lab (`Quran-Lab/zipformer_p-arabic-v3` / `zipformer_p-arabic-v3.1`) & `quran-transcript` (`obadx/quran-transcript`)  
**Audit Date:** 2026-09-19  
**Security & Verification Status:** CERTIFIED AUDIT  

---

## 1. Executive Summary

This dataset audit provides a rigorous, objective inventory of the training, benchmark, and evaluation datasets used to develop, validate, and verify the Quranic Zipformer2-CTC acoustic model.

In accordance with Phase 4E mandates:
- The acoustic model produces **ACOUSTIC / PHONETIC EVIDENCE ONLY**.
- It does **NOT** produce authoritative religious rulings (no automated classification of Lahn Jali, Lahn Khafi, Ikhfa, Idgham, Iqlab, Qalqalah, Madd, Ghunnah, or Fiqh decisions).
- Claims of model performance must be strictly grounded in documented evaluation splits, error decomposition, and calibration metrics.

---

## 2. Upstream Dataset Identification & Provenance

### 2.1 Training Corpus Overview
The underlying acoustic model (`zipformer_p-arabic-v3` / `zipformer_p-arabic-v3.1`) was trained by Quran-Lab using an extensive corpus of Quranic recitations:
* **Effective Audio Hours:** ~5,400 effective hours per epoch across 10 epochs.
* **Recitation Type:** Murattal (measured, rhythmic recitation according to Hafs 'an 'Asim).
* **Acoustic Sources:**
  1. Complete-Mushaf studio recitations by master reciters (e.g., Sheikh Mahmoud Khalil Al-Husary, Sheikh Mishary Rashid Alafasy, Sheikh Muhammad Siddiq Al-Minshawi, Sheikh Abdul Basit Abdul Samad, Sheikh Saad Al-Ghamadi).
  2. Crowdsourced real phone audio recordings capturing mobile microphone characteristics, acoustic reflections, and varied background noise profiles.
  3. Augmentations: Additive noise, synthetic room impulse responses (reverberation), and 3-way speed perturbation (0.9x, 1.0x, 1.1x).

### 2.2 Phonetic Transcription Standard: `quran-transcript`
* **Repository:** `obadx/quran-transcript` / Quran-Lab
* **Design Philosophy:** Standard Arabic text (and standard ASR orthography) discards Tajweed-essential phonetic information (e.g., whether an Alif is prolonged 2, 4, or 6 harakat, whether a Nun is assimilated with Ghunnah or pronounced clearly with Idhhar, whether a consonant is geminated or emphatic).
* **Inventory Size:** Exactly 251 discrete phonetic units (250 non-blank symbols + 1 blank symbol `[0 / 250]`).
* **Canonical Mapping:** `ordered_quran_phonemes.json` contains deterministic phoneme sequences for all **6,236 verses** (Ayahs) of the Quran.
* **Deterministic Rule Base:** The phonetic labels are generated deterministically from the canonical Uthmani text of the Quran according to the established rules of Hafs 'an 'Asim without reliance on probabilistic language models.

---

## 3. Official Evaluation Benchmark: `Quran-Lab/quranic-asr-benchmark`

### 3.1 Repository Details
* **Dataset Identifier:** `Quran-Lab/quranic-asr-benchmark`
* **Benchmark Version:** v1.1
* **Repository Tag:** `dataset:Quran-Lab/quranic-asr-benchmark`
* **Access Control:** Gated / Restricted (requires user acceptance of the Quran-Lab No-Profit License on Hugging Face).
* **Associated Scripts:** `score.py`, `benchmark.jsonl`, `metadata.jsonl`.

### 3.2 Evaluation Splits & Population
The official benchmark establishes three strictly segregated evaluation partitions:

| Split Identifier | Split Description | Recording Environment | Reciter Status | Target Objective |
| :--- | :--- | :--- | :--- | :--- |
| **Split A** | Held-Out Studio Reciters | Professional studio, high-end condenser mics, low noise | Reciters held out from training | Measures baseline acoustic fidelity under optimal acoustic conditions |
| **Split B** | Real Phone Audio Recordings | Mobile devices, handset microphones, casual environments | Varied speakers, real-world acoustics | Measures degradation on consumer mobile hardware |
| **Split C** | Unseen Reciter (Benchmark v1.1) | Controlled benchmark set | Reciters completely unseen by model architecture | Evaluates reciter generalization without memorization |

### 3.3 Reported Upstream PER Metrics

The official upstream benchmark reports the following Phoneme Error Rate (PER) metrics calculated via Levenshtein distance on the 251-symbol phonetic inventory:

$$\text{PER} = \frac{\text{Substitutions} + \text{Deletions} + \text{Insertions}}{N_{\text{reference}}}$$

| Evaluation Split | `zipformer_p-arabic-v3` (Base) | `zipformer_p-arabic-v3.1` (Madd Fine-Tune) | Madd-Insensitive PER (v3.1) |
| :--- | :--- | :--- | :--- |
| **Split A: Held-Out Studio** | **1.49%** | **1.43%** | ~1.1% |
| **Split B: Real Phone Audio** | **3.47%** | **3.65%** | ~2.8% |
| **Split C: Unseen Reciter** | Not reported | **9.10%** | ~7.2% |

*Key Takeaway:* The model demonstrates exceptionally low error (<1.5% PER) on studio recordings and robust performance (<3.7% PER) on real phone audio. On completely unseen reciters, PER rises to 9.10%, establishing that real-world mobile recitations require conservative confidence gating and human teacher oversight.

---

## 4. Canonical Verse Phonemes Audit (`ordered_quran_phonemes.json`)

* **File Location:** `models/saboorhsn/ordered_quran_phonemes.json`
* **File Size:** 5,106,711 bytes (4.9 MB)
* **SHA-256 Checksum:** `4782e90e190a59207f5d74a909dd917a0cfead1959338d1fbc97fe55faf1c09c`
* **Total Verses:** 6,236 Ayahs (complete Mushaf coverage from Surah 1 to Surah 114).
* **Sample Verse Structure (`1:1`):**
  ```json
  {
    "1:1": {
      "aya_text": "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
      "aya_phoneme": "بِسمِ للَااهِ ررَحمَاانِ ررَحِۦۦۦۦم",
      "aya_phonemes_list": [
        "بِسمِ",
        "للَااهِ",
        "ررَحمَاانِ",
        "ررَحِۦۦۦۦم"
      ]
    }
  }
  ```
* **Sample Verse Structure (`1:2`):**
  ```json
  {
    "1:2": {
      "aya_text": "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
      "aya_phoneme": "ءَلحَمدُ لِللَااهِ رَببِ لعَاالَمِۦۦۦۦن",
      "aya_phonemes_list": [
        "ءَلحَمدُ",
        "لِللَااهِ",
        "رَببِ",
        "لعَاالَمِۦۦۦۦن"
      ]
    }
  }
  ```

---

## 5. Phonetic Unit Inventory Audit (`phoneme_units.json` & `tokens.txt`)

* **Units File:** `models/saboorhsn/phoneme_units.json` (3,350 bytes, SHA-256: `6f24ec1556b3bcdea33a341ae687e8ca1eda2d9960185999d0bd70f082a68ede`)
* **Tokens File:** `models/saboorhsn/tokens.txt` (2,333 bytes, SHA-256: `252c10687e442aa9291973065fae19fa39bcd681c4f5612ec496a647e20b43a1`)
* **Total Vocabulary:** Exactly 251 tokens.
* **Token Structure:**
  - Token `0`: `ؙ` (Arabic small high rounded zero / orthographic pause mark)
  - Token `1`: `ء` (Hamzah)
  - Tokens `2`-`31`: Arabic isolated consonants and base glides
  - Tokens `32`-`34`: Short vowels (`َ`, `ُ`, `ِ`)
  - Tokens `35`-`42`: Quranic phonetic extensions (`ٲ`, `ڇ`, `ں`, `ۜ`, `ۥ`, `ۦ`, `۪`, `۾`)
  - Tokens `43`-`148`: Vocalized consonants, Madd combinations, and geminations
  - Tokens `149`-`249`: Compound Tajweed units (elongations `اااااا`, Ghunnah `ننننَ`, `ممممِ`, Qalqalah units `دڇ`, `طڇ`, `قڇ`)
  - Token `250`: `<blank>` (CTC blank emission token)

---

## 6. Licensing, Provenance & Ethical Governance

### 6.1 License Details
* **License Identifier:** Quran-Lab No-Profit License, Version 1.1 / 1.2 (`NPL-1.1` / `NPL-1.2`)
* **Permitted Scope:**
  - Free use, study, adaptation, and redistribution.
  - Academic research, non-profit educational platforms, and personal study.
* **Strict Prohibitions:**
  - Selling the model weights, code, or derivatives.
  - Charging fees or requiring paid subscriptions to access the model or any feature powered by the model.
  - Commercial exploitation or embedding inside closed commercial paywalled services.

### 6.2 Mandatory Governance & Ethical Clauses
1. **Non-Authoritative Warning:** The output of this acoustic model must NEVER be presented as an authoritative religious ruling or definitive declaration of sin / invalid prayer.
2. **Teacher Primacy:** The user interface must explicitly disclose that automated acoustic feedback is fallible and cannot replace personal recitation before a qualified, certified human Quran teacher (Shaykh / Muqri').
3. **Safety Fallback:** Ambiguous evidence must trigger "I need you to repeat that", never an accusatory "You made a mistake".
