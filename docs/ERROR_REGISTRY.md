# ERROR & SCIENTIFIC LIMITATIONS REGISTRY

This document tracks all recognized scientific, acoustic, alignment, and dataset limitations of the Quran Recitation Verification Engine.

---

## Registry Entries

### `ERR-ASR-001`: Upstream Benchmark Dataset Access Gated
- **Status**: ACTIVE / MITIGATED VIA LOCAL GOLDEN REGRESSION
- **Classification**: `SCIENTIFIC_EVALUATION_BLOCKED`
- **Description**: The upstream evaluation benchmark dataset `Quran-Lab/quranic-asr-benchmark` requires gated authentication tokens on Hugging Face (returns HTTP 401 Unauthorized on public download). Independent scientific reproduction of the upstream 4.90% CER / 10.98% PER claim cannot be completed without dataset access.
- **Current Mitigation**: Strict local golden evaluation regression suite established across 8 canonical Quran reciters (Alafasy, Husary, Minshawi, AbdulSamad, Ghamadi, Shuraym, Hudhaify, Tablawi) plus 2 adversarial stress cases (silence, white noise).
- **Rule**: Never report upstream published metrics as local measurements.

---

### `ERR-ALIGN-001`: Temporal Resolution Bound by Zipformer Subsampling
- **Status**: ACTIVE / DOCUMENTED
- **Classification**: `ACOUSTIC_ALIGNMENT_RESOLUTION`
- **Description**: The Zipformer2-CTC architecture employs 4x temporal subsampling across its convolution-attention encoder blocks. At 100 acoustic frames/sec (10ms Kaldi hop), output time steps correspond to ~40–50ms intervals.
- **Impact**: Phonetic transitions that occur in durations less than 40ms cannot be resolved with sub-frame microsecond precision.
- **Handling**: The Auditable CTC Decoder records `startFrame`, `endFrame`, and `peakFrame` with exact frame boundaries, avoiding speculative sub-frame microsecond claims.

---

### `ERR-ALIGN-002`: Deleted Phonemes Lack Acoustic Temporal Bounds
- **Status**: ACTIVE / ENFORCED BY DOMAIN CONTRACT
- **Classification**: `TEMPORAL_EVIDENCE_POLICY`
- **Description**: When a reciter omits a phoneme, that phoneme does not physically manifest in the acoustic waveform.
- **Anti-Pattern Rejected**: Dividing audio duration by word count to synthesize fake start/end timestamps.
- **Enforced Policy**: For all `DELETION` events, `timingStatus` is strictly set to `INCONCLUSIVE` and `startTime = 0, endTime = 0`.

---

### `ERR-ALIGN-003`: Provisional Heuristic Safety Thresholds
- **Status**: ACTIVE / DOCUMENTED HEURISTIC
- **Classification**: `PROVISIONAL_SAFETY_THRESHOLDS`
- **Description**: The safety thresholds (`minConfidence = 0.90`, `minMarginPeak = 0.80`, `minSnrDb = 10.0 dB`, `ambiguityCostMargin = 0.35`) were calibrated on the local 8-reciter golden test set.
- **Scientific Caveat**: These thresholds have not been validated across diverse real-world learner populations, such as non-native Arabic speakers, children, noisy microphone hardware, or reverberant environments.
- **Safety Guarantee**: Inconclusive or ambiguous classifications always trigger `REQUEST_REPEAT` or `INCONCLUSIVE` rather than false negative error accusations.

---

### `ERR-ALIGN-004`: Religious Rule Decoupling Mandate
- **Status**: ACTIVE / ARCHITECTURAL INVARIANT
- **Classification**: `RELIGIOUS_SAFETY_SEPARATION`
- **Description**: An acoustic phoneme substitution (e.g. vowel length difference or harakah variation) does not inherently constitute a religious violation (such as Lahn Jaliyy or Lahn Khafiyy).
- **Enforced Policy**: The Phase 5A engine strictly outputs `MATCH`, `SUBSTITUTION`, `DELETION`, `INSERTION`, `UNCERTAIN`, or `INCONCLUSIVE`. It is strictly forbidden from outputting religious judgments, Fiqh terms, or Tajweed rulings.

---

### `ERR-TAJ-001`: Madd Acoustic Timing & Harakat Duration Calibration Unavailable
- **Status**: ACTIVE / SAFETY GATE ENFORCED
- **Classification**: `TAJWEED_ACOUSTIC_LIMITATION`
- **Description**: The Zipformer2-CTC acoustic model outputs phonetic tokens at 40ms frame intervals. Using CTC token repetition counts or raw audio frame span as a proxy for Madd duration (2, 4, 5, or 6 Harakat) is scientifically uncalibrated.
- **Enforced Policy**: All Madd compliance evaluations return `INCONCLUSIVE` with explicit acoustic limitation provenance (`MADD_ACOUSTIC_INCONCLUSIVE`). The engine strictly refuses to certify or reject Madd duration without calibrated tempo-normalized vocalic mora tracking.

---

### `ERR-TAJ-002`: Ghunnah Resonant Quality & Nasal Emission Model Unavailable
- **Status**: ACTIVE / SAFETY GATE ENFORCED
- **Classification**: `TAJWEED_ACOUSTIC_LIMITATION`
- **Description**: The acoustic model classifies phoneme labels (e.g. `n`, `m`). Acoustic phoneme classification detects oral-nasal phonetic category, but does NOT measure the acoustic energy distribution between the oral cavity and the nasal cavity (Khayshoom), nor does it measure the prolonged resonance intensity required for 2-harakah Ghunnah.
- **Enforced Policy**: All Ghunnah compliance evaluations return `INCONCLUSIVE` with provenance (`GHUNNAH_ACOUSTIC_INCONCLUSIVE`). Phoneme recognition must never be equated with verified Ghunnah resonance.

---

### `ERR-TAJ-003`: Articulation Formant Pharyngealization & Makhraj Formant Model Unavailable
- **Status**: ACTIVE / SAFETY GATE ENFORCED
- **Classification**: `TAJWEED_ACOUSTIC_LIMITATION`
- **Description**: Evaluating Isti'la (elevation) and Itbaq (adhesion / Tafkheem) requires measuring formant frequency shifts (specifically F2 lowering and F1 elevation corresponding to tongue root retraction and pharyngeal constriction). Standard CTC phoneme recognition does not extract formant trajectories.
- **Enforced Policy**: All Tafkheem/Isti'la evaluations return `INCONCLUSIVE` with provenance (`ARTICULATION_ACOUSTIC_INCONCLUSIVE`). The engine does not guess tongue positioning.

---

### `ERR-TAJ-004`: Qalqalah Transient Burst & Acoustic Release Analysis Unavailable
- **Status**: ACTIVE / SAFETY GATE ENFORCED
- **Classification**: `TAJWEED_ACOUSTIC_LIMITATION`
- **Description**: Qalqalah (audible release vibration of Qutb Jad consonants upon sukun) physically manifests as an unvoiced closure followed by a transient burst release and vocal tract resonance. The 40ms frame resolution of CTC cannot resolve sub-20ms burst transient features without a specialized high-resolution acoustic burst detector.
- **Enforced Policy**: All Qalqalah compliance evaluations return `INCONCLUSIVE` with provenance (`QALQALAH_ACOUSTIC_INCONCLUSIVE`).

---

### `ERR-TAJ-005`: Multi-Riwayah Rules Deactivated Pending Scholarly Certification
- **Status**: ACTIVE / GOVERNANCE GATE ENFORCED
- **Classification**: `RIWAYAH_GOVERNANCE_LOCK`
- **Description**: Classical Tajweed rules vary across the 10 Qira'at and 20 Ruwat (e.g. Imalah in Warsh, Sakt in Hafs min Tareeq ash-Shatibiyyah vs Tayyibah, Tashil in Warsh). Only the canonical Riwayah of Hafs 'an 'Asim (via Tareeq ash-Shatibiyyah) is verified and certified.
- **Enforced Policy**: Any request specifying a Riwayah other than `HAFS_AN_ASIM` immediately halts with `RuleEvaluationBlockedError: RIWAYAH_NOT_ACTIVATED`.

---

### `ERR-TAJ-006`: Teacher AI Downstream Rule Mutation Prohibited
- **Status**: ACTIVE / IMMUTABILITY ENFORCED
- **Classification**: `TEACHER_AI_CONTRACT_SAFETY`
- **Description**: Downstream LLM or pedagogical interfaces may explain verified Tajweed results to learners, but must NEVER alter, override, or invent rule applicability or acoustic compliance statuses.
- **Enforced Policy**: All `TajweedRuleEvidence` objects emitted by `ITajweedEvidenceProvider` are recursively frozen using `Object.freeze()`. The Teacher AI consumes read-only evidence.

---

### `ERR-DEC-001`: Cascading Alignment Collapse Error Amplification
- **Status**: ACTIVE / CASCADING SUPPRESSION ENFORCED
- **Classification**: `DECISION_ENGINE_PROTECTION`
- **Description**: In forced-alignment and CTC decoding, a single deletion or phonetic omission can shift the temporal trellis, causing multiple downstream correct phonemes to appear as substitutions or deletions (the "one error produces ten false errors" failure mode).
- **Enforced Policy**: When consecutive discrepancies or a $\pm 1$ token alignment slip are detected, the decision engine enters `AlignmentStabilityState.PENDING_REALIGNMENT`. Subsequent candidate errors in that window are suppressed (`isCascadingSuppressed: true`) and downgraded to `INCONCLUSIVE`/`REQUEST_REPEAT`. At the word level, three low-confidence discrepancies are aggregated as `ALIGNMENT_INSTABILITY` rather than three student errors.

---

### `ERR-DEC-002`: Repetition Escalation Disconnected from Acoustic Confidence
- **Status**: ACTIVE / SAFETY GATE ENFORCED
- **Classification**: `DECISION_ENGINE_SAFETY`
- **Description**: When a student repeats an ambiguous or uncertain utterance, pedagogical escalation may increase teaching priority, but the system must never artificially inflate acoustic confidence (e.g. an observed 0.62 posterior confidence cannot become 0.95 simply through repetition count).
- **Enforced Policy**: Observed acoustic confidence is strictly immutable. Repetition escalates `EscalationLevel` (from `LEVEL_1_UNCERTAIN` to `LEVEL_2_REQUEST_REPEAT` or `DEFER_TO_TEACHER`), but does not convert an uncertain candidate into a `CONFIRMED_PHONETIC_ERROR`.

---

### `ERR-DEC-003`: Distinct Orthogonal Taxonomy: Mismatch vs Applicability vs Execution
- **Status**: ACTIVE / ONTOLOGICAL SEPARATION ENFORCED
- **Classification**: `DECISION_ENGINE_INTEGRITY`
- **Description**: Novice systems collapse three distinct phenomena: (1) Phonetic identity mismatch (e.g. said /s/ instead of /sˤ/), (2) Tajweed rule applicability (e.g. Nun Sakinah before Ba requires Iqlab), and (3) Tajweed execution quality (e.g. Ghunnah resonance duration). A rule applying does not mean the student violated it; an expected != observed token does not automatically constitute a Tajweed error.
- **Enforced Policy**: The decision engine preserves strict separation between `RecitationEvidence` (phonetic identity and acoustic margin), `TajweedRuleEvidence` (applicability and classical source mapping), and execution quality. Rules without acoustic validation return `TAJWEED_EVIDENCE_PENDING`.

---

### `ERR-DEC-004`: Non-Calibrated Learner Population Gating (Provisional Thresholds)
- **Status**: ACTIVE / PROVISIONAL THRESHOLD GATED
- **Classification**: `SAFETY_THRESHOLD_DISCLOSURE`
- **Description**: The current decision safety thresholds (`CONFIDENCE >= 0.90`, `MARGIN >= 0.80`, `SNR >= 10 dB`, `ALIGNMENT >= 0.80`) have not yet been calibrated across diverse non-native reciter accents, child voices, and varied acoustic microphone hardware.
- **Enforced Policy**: All decision outputs retain the explicit tag `label: 'PROVISIONAL_SAFETY_THRESHOLD'` and `thresholdVersion: 'provisional-v1.0.0-phase5c'`. When confidence or SNR falls below these provisional gates, the engine strictly prefers `REQUEST_REPEAT` over issuing an error accusation.

---

## Phase 7C: Real-Time Interaction & Orchestration Error Codes

### `RT-001`: MICROPHONE_UNAVAILABLE
- **Status**: ACTIVE / RUNTIME ERROR HANDLING
- **Classification**: `AUDIO_INGRESS_ERROR`
- **Description**: The device microphone is either not connected, hardware-muted, or permission was denied by the user.
- **Enforced Policy**: Transition to `RECOVERY` or `ERROR_SAFE_STATE`. Display clear localized Arabic instructions to the learner on how to enable microphone permissions; do not emit spurious audio processing errors.

---

### `RT-002`: AUDIO_STREAM_INTERRUPTED
- **Status**: ACTIVE / RUNTIME RESILIENCE
- **Classification**: `STREAMING_DISCONTINUITY`
- **Description**: The incoming audio stream experienced a buffer underrun, packet loss, or hardware disconnection mid-utterance.
- **Enforced Policy**: Reset streaming buffer, flag affected phonetic frames as uncalibrated, and gently request the student to repeat the verse segment without penalty.

---

### `RT-003`: SPEECH_BOUNDARY_UNCERTAIN
- **Status**: ACTIVE / TURN_TAKING_SAFETY
- **Classification**: `VAD_BOUNDARY_AMBIGUITY`
- **Description**: Energy or spectral flux at the suspected speech boundary cannot differentiate between a breath pause, intra-word elongation, or true phrase cessation.
- **Enforced Policy**: Defer corrective intervention until the speech boundary is confirmed stable or maximum boundary timeout expires. Never interrupt during an ambiguous pause.

---

### `RT-004`: MODEL_STREAM_FAILURE
- **Status**: ACTIVE / INFERENCE_CONTAINMENT
- **Classification**: `ACOUSTIC_MODEL_ERROR`
- **Description**: The streaming Zipformer ONNX session or worker thread encountered an execution exception, unhandled tensor dimension, or inference timeout.
- **Enforced Policy**: Terminate inference cleanly, log telemetry, reset streaming state, and fall back to the safe recovery loop. Never fabricate posterior probabilities.

---

### `RT-005`: CACHE_CONTINUITY_FAILURE
- **Status**: ACTIVE / STREAMING_INTEGRITY
- **Classification**: `ZIPFORMER_CACHE_CORRUPTION`
- **Description**: Streaming state cache tensors (cached_len, cached_avg, cached_key, cached_val) desynchronized or suffered NaN/Inf divergence across chunks.
- **Enforced Policy**: Log `CACHE_RESET`, re-zero the cache tensors, and reinitialize alignment baseline. Avoid evaluating cross-chunk tokens across the corruption boundary.

---

### `RT-006`: ALIGNMENT_STALE
- **Status**: ACTIVE / LATENCY_PROTECTION
- **Classification**: `TEMPORAL_DESYNCHRONIZATION`
- **Description**: Alignment completed after the student already advanced to a subsequent word or ayah.
- **Enforced Policy**: Discard the stale alignment result immediately. Never highlight a previous word or interrupt a student who has already moved ahead.

---

### `RT-007`: DECISION_STALE
- **Status**: ACTIVE / LATENCY_PROTECTION
- **Classification**: `DECISION_DESYNCHRONIZATION`
- **Description**: Phase 5C decision resolution took longer than the speech window, and the recitation context sequence has advanced.
- **Enforced Policy**: Drop candidate decision with `STALE_EVENT`. Log latency metric; do not deliver obsolete error notifications.

---

### `RT-008`: LANGUAGE_RESPONSE_STALE
- **Status**: ACTIVE / REALIZATION_SAFETY
- **Classification**: `LLM_LATENCY_EXPIRATION`
- **Description**: Generative LLM language realization exceeded the configured real-time deadline or arrived out-of-order relative to the active student utterance.
- **Enforced Policy**: Automatically bypass candidate LLM output and deploy `DeterministicFallbackProvider` using the authorized `TeacherFeedbackIntent`.

---

### `RT-009`: TTS_FAILURE
- **Status**: ACTIVE / SYNTHESIS_RESILIENCE
- **Classification**: `AUDIO_SYNTHESIS_ERROR`
- **Description**: Speech synthesis engine failed, timed out, or threw an audio subsystem error.
- **Enforced Policy**: Seamlessly fall back to text-only UI feedback (`VOICE_FAILURE -> TEXT_FEEDBACK`). The recitation session must continue unhindered.

---

### `RT-010`: ECHO_DETECTED
- **Status**: ACTIVE / ACOUSTIC_ISOLATION
- **Classification**: `SPEAKER_MICROPHONE_LEAKAGE`
- **Description**: The teacher voice prompt or system sound was re-ingested by the microphone during playback.
- **Enforced Policy**: Suppress all student-recognition inference and alignment while `teacherSpeaking === true`. Discard microphone audio detected during teacher speech unless hardware AEC is certified.

---

### `RT-011`: SESSION_SEQUENCE_MISMATCH
- **Status**: ACTIVE / PROTOCOL_INTEGRITY
- **Classification**: `SEQUENCE_DESYNCHRONIZATION`
- **Description**: An event arrived with `sessionSequence` or `eventSequence` lower than the current monotonic sequence counter.
- **Enforced Policy**: Discard as out-of-order. Enforce strict monotonic progression across all real-time events.

---

### `RT-012`: DUPLICATE_FEEDBACK
- **Status**: ACTIVE / COGNITIVE_PROTECTION
- **Classification**: `DUPLICATE_EVENT_SUPPRESSION`
- **Description**: The exact same evidence hash and decision was queued for delivery more than once within the repetition window.
- **Enforced Policy**: Suppress duplicate feedback. Ensure the learner receives feedback exactly once per pedagogical decision.

---

### `RT-013`: TEACHER_INTERRUPT_CANCELLED
- **Status**: ACTIVE / PEDAGOGICAL_DISCIPLINE
- **Classification**: `INTERRUPTION_CONTROL`
- **Description**: A planned interruption was cancelled because the student resumed reciting, target moved, session was paused, or alignment changed.
- **Enforced Policy**: Revoke interruption token immediately. Return to `LISTENING` or `STUDENT_SPEAKING` without startling the reciter.

---

### `RT-014`: RECOVERY_REQUIRED
- **Status**: ACTIVE / SYSTEM_RECOVERY
- **Classification**: `CATASTROPHIC_STATE_HANDLING`
- **Description**: An unexpected composite failure occurred (e.g. concurrent audio dropout and model crash).
- **Enforced Policy**: Enter `ERROR_SAFE_STATE`, release audio locks, reinitialize cleanly, and present a calm recovery prompt in Arabic.



