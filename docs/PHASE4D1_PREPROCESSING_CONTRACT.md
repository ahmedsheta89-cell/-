# PHASE 4D.1 PREPROCESSING CONTRACT: KALDI FBANK SPECIFICATION

## 1. Specification Overview

The acoustic model `models/saboorhsn/quran-stt-int8.onnx` is an INT8-quantized streaming **Zipformer2-CTC** acoustic model derived from the `Quran-Lab/zipformer_p-arabic-v3` architecture (trained using `k2-fsa/icefall` and executed via `sherpa-onnx` / `kaldifeat`).

The model is strictly trained on **Kaldi Filterbank (FBank)** features, **not** generic STFT Mel-spectrograms. Generic audio extractors (such as torchaudio default mel, librosa mel, or uncalibrated Hann-window extractors) fail to match the training distribution, resulting in altered posterior distributions, decreased phoneme confidence, and boundary distortion.

---

## 2. Mathematical Contract Definition

| Parameter | Exact Contract Value | Operational / Mathematical Definition |
| :--- | :--- | :--- |
| **Input Audio** | 16,000 Hz, 16-bit PCM, Mono | Audio normalized to `[-1.0, +1.0]` Float32 |
| **Feature Dimensions** | 80 Mel Bins | Continuous log-filterbank energies per frame |
| **Frame Length** | 25.0 ms (400 samples) | $L = 16000 \times 0.025 = 400$ samples |
| **Frame Shift** | 10.0 ms (160 samples) | $S = 16000 \times 0.010 = 160$ samples |
| **Window Type** | Povey Window | $w[n] = \left(0.5 - 0.5 \cos\left(\frac{2\pi n}{N - 1}\right)\right)^{0.85}$ for $n = 0 \dots 399$ |
| **Padded Window** | 512 samples | `round_to_power_of_two = true` ($2^{\lceil\log_2 400\rceil} = 512$) |
| **Snip Edges** | `false` | Reflective symmetric boundary padding (see Section 3) |
| **Remove DC Offset** | `true` | Frame mean subtracted prior to preemphasis: $\mu = \frac{1}{L}\sum_{n=0}^{L-1} x[n]$ |
| **Preemphasis Coeff** | 0.97 | $x[n] \leftarrow x[n] - 0.97 \cdot x[n-1]$ for $n = L-1 \dots 1$; $x[0] \leftarrow x[0] - 0.97 \cdot x[0]$ |
| **Dither** | 0.0 | Deterministic inference (no pseudo-random Gaussian noise added) |
| **FFT Size** | 512-point Real FFT | Output spectrum: 257 complex bins ($k = 0 \dots 256$) |
| **Power Spectrum** | $P[k] = \text{Re}[k]^2 + \text{Im}[k]^2$ | Power spectrum evaluated from DC ($0\text{ Hz}$) to Nyquist ($8000\text{ Hz}$) |
| **Low Frequency Cutoff** | 20.0 Hz | Lowest filterbank frequency bound |
| **High Frequency Cutoff** | -400.0 Hz (relative) | Evaluated relative to Nyquist: $8000\text{ Hz} - 400\text{ Hz} = 7600.0\text{ Hz}$ |
| **Mel Scale Formulation** | Kaldi Mel Formula | $m(f) = 1127.0 \cdot \ln\left(1.0 + \frac{f}{700.0}\right)$ |
| **Inverse Mel Formula** | Kaldi Inverse Mel | $f(m) = 700.0 \cdot \left(e^{m / 1127.0} - 1.0\right)$ |
| **Filterbank Geometry** | 80 Triangular Bins | Continuous bin-center evaluation over 257 discrete FFT bins |
| **Log-Energy Floor** | FLT_EPSILON ($1.1920929 \times 10^{-7}$) | $\text{feat}[b] = \ln\left(\max\left(\sum_k w_{b,k} P[k], \text{FLT\_EPSILON}\right)\right)$ |
| **Energy Normalization (CMVN)** | **None** | Raw log-filterbank energies are fed directly to Zipformer input layers |

---

## 3. Boundary Handling: `snip_edges = false`

When `snip_edges` is `false`, the total number of frames is calculated as:
$$\text{num\_frames} = \left\lfloor \frac{\text{num\_samples} + \lfloor S / 2 \rfloor}{S} \right\rfloor$$

For each frame $f \in [0, \text{num\_frames}-1]$:
1. Midpoint: $M = f \cdot S + \lfloor S / 2 \rfloor$
2. Start Sample: $S_0 = M - \lfloor L / 2 \rfloor$
3. Boundary Reflection: If sample index $s_{\text{wave}} = S_0 + n$ falls outside $[0, \text{num\_samples}-1]$, symmetric wave reflection is applied:
   ```ts
   while (s_wave < 0 || s_wave >= num_samples) {
     if (s_wave < 0) {
       s_wave = -s_wave - 1;
     } else {
       s_wave = 2 * num_samples - 1 - s_wave;
     }
   }
   ```

---

## 4. Empirical Contrast: Kaldi FBank vs. Generic MelSpectrogram

Direct comparison performed on Sheikh Mishary Rashid Alafasy Recitation (Surah Al-Fatihah, Ayah 1, 6.04s):

| Metric | Generic MelSpectrogramExtractor (Phase 4) | KaldiFbankExtractor (Phase 4D.1) | Impact / Rationale |
| :--- | :--- | :--- | :--- |
| **Window Type** | Hann Window (512 samples) | Povey Window (400 samples, padded to 512) | Matches Icefall training taper |
| **DC Removal** | None | Mean subtraction | Prevents sub-audible DC bias shift |
| **Preemphasis** | None ($0.0$) | First-difference ($0.97$) | Boosts high-frequency consonant cues |
| **Freq Bounds** | $0 \text{ Hz} \dots 8000 \text{ Hz}$ | $20 \text{ Hz} \dots 7600 \text{ Hz}$ | Attenuates DC hum & anti-aliasing roll-off |
| **Mel Formula** | HTK ($2595 \log_{10}$) | Kaldi ($1127 \ln$) | Matches Zipformer feature grid |
| **Total Frames** | 601 frames | 604 frames | Exact frame centering via `snip_edges=false` |
| **Energy Range** | $[-14.0, -4.5]$ | $[-1.5, +0.5]$ | Correct scale for Zipformer BiasNorm |
| **Mean CTC Conf** | $0.9977$ | **$0.9986$** | Sharper posterior probability peaks |
| **Silence Rejection**| 0 non-blank tokens | **0 non-blank tokens (100% blank)** | Zero acoustic hallucination on silence |
