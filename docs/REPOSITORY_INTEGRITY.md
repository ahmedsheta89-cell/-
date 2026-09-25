# REPOSITORY INTEGRITY, SECURITY & ARTIFACT SPECIFICATION

## 1. External Model Boundary (ERR-ASR-001)
- The primary acoustic neural model is the Zipformer2-CTC streaming acoustic model (`models/saboorhsn/quran-stt-int8.onnx`, exact size: 72,705,392 bytes / 72.7MB, SHA-256: `31755836528da336a6192121cd7bc82cb41752dddb65566fd000b89c8686da6b`).
- This neural checkpoint is unbundled from source control pursuant to `ERR-ASR-001` (environment delivery boundary and Git size constraints).
- Model runners (`OnnxAcousticModelRunner.ts`) implement strict refusal and safe fallback policies when neural weights are not present locally.
- Unused experimental Whisper ASR binaries (`models/test_whisper/encoder_model_quantized.onnx`, 23.3MB) are strictly excluded via `.gitignore` to preserve clean repository boundaries.
- Phoneme catalogs (`models/saboorhsn/ordered_quran_phonemes.json`, 4.9MB) and token vocabularies (`phoneme_units.json`, `tokens.txt`) are tracked linguistic assets essential for pronunciation alignment.

---

## 2. Verified Quran Dataset Integrity
- The canonical scripture text is managed via `src/infrastructure/quran/VerifiedQuranDataProvider.ts`.
- Manifest Version: `dataset-ver-1.0.0-hafs` (`1.0.0-hafs.verified`).
- Canonical Dataset SHA-256: `0579087459ccab56c9e5dbad8d6452eeb6f1e394a0fe642024b947a10b2c30a1`.
- Scripture Provenance: Official Tanzil / King Fahd Complex authenticated Hafs 'an 'Asim Uthmani text.
- Integrity: Authenticated with cryptographic SHA-256 checksum pinning. Zero dynamic or AI-generated Quranic scripture is permitted.

---

## 3. Data Privacy & Zero-Secret Policy
- Git is strictly a delivery and version-control medium, never a store for student data or secrets.
- Hardcoded credentials, private keys, bearer tokens, or user recordings are prohibited from staging.
- Audio samples in `audio_samples/` are purely public recitation reference benchmarks (`husary_001001_16k.wav`, `alafasy_001001_16k.wav`, synthetic adversarial noise) with zero student recordings.

---

## 4. Reproducibility & Lockfile Discipline
- `package-lock.json` version 3 locks all top-level and transitive dependencies.
- `esbuild` is aligned with `vite@8.3.0` (`^0.28.0`), enabling standard `npm ci` clean installs in offline or containerized environments without peer-dependency resolution conflicts.
