# PHASE 4D.1 ONNX INFERENCE & STREAMING CACHE CONTRACT

## 1. Artifact Verification & Checksums

| Artifact File | Size (Bytes) | SHA-256 Checksum | License / Source |
| :--- | :--- | :--- | :--- |
| `models/saboorhsn/quran-stt-int8.onnx` | 72,705,392 | `31755836528da336a6192121cd7bc82cb41752dddb65566fd000b89c8686da6b` | Quran-Lab No-Profit License v1.1 |
| `models/saboorhsn/tokens.txt` | 2,752 | `252c10687e442aa9291973065fae19fa39bcd681c4f5612ec496a647e20b43a1` | 251 Quranic Phonetic Tokens (ID 0..250) |

- **Blank Token ID**: `250` (`<blank>`)
- **Vocabulary Size**: 251 symbols
- **Downsampling Factor**: 61 input Kaldi frames $\rightarrow$ 12 output CTC logit frames

---

## 2. Graph Input / Output Signatures (99 Inputs $\times$ 99 Outputs)

The ONNX execution graph enforces exactly 99 inputs and 99 outputs.

### Inputs (99 total)

| Input Name | Shape | Dtype | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `x` | `[1, 61, 80]` | `float32` | **Acoustic chunk**: Exactly 61 frames of 80-dim Kaldi FBank |
| `cached_key_0` .. `cached_key_15` (16 tensors) | `[D_k, 1, D_att]` | `float32` | Multi-head self-attention key state caches |
| `cached_nonlin_attn_0` .. `cached_nonlin_attn_15` (16 tensors) | `[1, D_n, D_c]` | `float32` | Non-linear attention memory caches |
| `cached_val1_0` .. `cached_val1_15` (16 tensors) | `[D_v, 1, D_w]` | `float32` | Value cache 1 states |
| `cached_val2_0` .. `cached_val2_15` (16 tensors) | `[D_v, 1, D_w]` | `float32` | Value cache 2 states |
| `cached_conv1_0` .. `cached_conv1_15` (16 tensors) | `[1, D_conv, 15]` / `[1, D_conv, 7]` | `float32` | Depthwise convolution cache layer 1 |
| `cached_conv2_0` .. `cached_conv2_15` (16 tensors) | `[1, D_conv, 15]` / `[1, D_conv, 7]` | `float32` | Depthwise convolution cache layer 2 |
| `embed_states` | `[1, 128, 3, 19]` | `float32` | Positional and subsampling convolution embeddings |
| `processed_lens` | `[1]` | `int64` | Cumulative audio frame count ($0, 61, 122, \dots$) |

### Outputs (99 total)

| Output Name | Shape | Dtype | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `log_probs` | `[1, 12, 251]` | `float32` | Log-softmax acoustic posteriors over 251 phonetic symbols |
| `new_cached_key_0` .. `new_cached_key_15` (16 tensors) | `[D_k, 1, D_att]` | `float32` | Updated key states to feed into subsequent chunk |
| `new_cached_nonlin_attn_0` .. `new_cached_nonlin_attn_15` (16 tensors) | `[1, D_n, D_c]` | `float32` | Updated non-linear attention states |
| `new_cached_val1_0` .. `new_cached_val1_15` (16 tensors) | `[D_v, 1, D_w]` | `float32` | Updated value cache 1 states |
| `new_cached_val2_0` .. `new_cached_val2_15` (16 tensors) | `[D_v, 1, D_w]` | `float32` | Updated value cache 2 states |
| `new_cached_conv1_0` .. `new_cached_conv1_15` (16 tensors) | `[1, D_conv, 15]` / `[1, D_conv, 7]` | `float32` | Updated convolution layer 1 states |
| `new_cached_conv2_0` .. `new_cached_conv2_15` (16 tensors) | `[1, D_conv, 15]` / `[1, D_conv, 7]` | `float32` | Updated convolution layer 2 states |
| `new_embed_states` | `[1, 128, 3, 19]` | `float32` | Updated embedding states |
| `new_processed_lens` | `[1]` | `int64` | Updated cumulative frame count ($+61$) |

---

## 3. Streaming Cache Execution Rules

1. **Chunk Invariant**: The input chunk `x` must have dimension `[1, 61, 80]`. Passing any other temporal length $T \neq 61$ results in an ONNX runtime failure (`Got invalid dimensions for input: x index: 1`).
2. **State Continuity**: For continuous speech recognition or forced alignment:
   $$\text{Input States}_{i} = \text{Output States}_{i-1}$$
   **Crucial Empirical Finding**: Zeroing cache states on each chunk causes complete phonetic disintegration:
   - **With State Carry-Over**: Decodes full canonical ayah `بِسمِللَااهِررَحمَاانِررَحِۦۦۦۦم` (Mean confidence $0.9986$).
   - **With Zeroed Cache (Adversarial Fault)**: Collapses into disconnected fragment `بِءِررَحمِ` (Mean confidence drops).
3. **Trailing Audio Flush**:
   - Because the streaming Zipformer downsampling convolution has a receptive field covering 61 frames, the final audio chunk requires padding to 61 frames with silence energy ($-15.9$).
   - An optional extra 61-frame flush chunk guarantees 100% emission of elongated trailing phonemes (such as the final madd `ۦۦۦۦ` and waqf `م`).

---

## 4. Environment & Runtime Specifications

| Component | Verified Specification |
| :--- | :--- |
| **Node.js** | v22.23.2 |
| **ONNX Runtime** | `onnxruntime-node` v1.30.0 |
| **OS** | Linux 6.6 (x86_64) |
| **Average Latency** | $\sim 42\text{ ms} \dots 55\text{ ms}$ per 61-frame chunk (11x faster than real-time on CPU) |
