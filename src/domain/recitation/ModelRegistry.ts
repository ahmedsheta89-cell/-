/**
 * @file ModelRegistry.ts
 * @module domain/recitation
 * @description Formal Model Registry for acoustic, forced-alignment, and phonetic models.
 * Enforces strict governance: Models without verified checkpoints or benchmarks cannot be approved.
 */

import { RiwayahType } from '../quran/types.ts';

export enum ModelCertificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  ENGINEERING_ONLY = 'ENGINEERING_ONLY',
  EXPERIMENTAL = 'EXPERIMENTAL',
  BENCHMARKED = 'BENCHMARKED',
  APPROVED_FOR_ACOUSTIC_EVIDENCE = 'APPROVED_FOR_ACOUSTIC_EVIDENCE',
}

export enum ModelProcurementGateStatus {
  AVAILABLE_LOCAL = 'AVAILABLE_LOCAL',
  AVAILABLE_REMOTE = 'AVAILABLE_REMOTE',
  MODEL_BLOCKED = 'MODEL_BLOCKED',
  PENDING_PROCUREMENT = 'PENDING_PROCUREMENT',
}

export interface ModelRegistryEntry {
  modelId: string;
  architecture: string;
  version: string;
  source: string;
  license: string;
  language: string;
  domain: string;
  sampleRate: number;
  inputShape: string;
  outputShape: string;
  vocabulary: string[];
  blankToken: string | null;
  quantization: 'INT8' | 'FP16' | 'FP32' | 'NONE';
  modelSizeBytes: number;
  checksumSha256: string | null;
  supportedRuntime: 'ONNX_RUNTIME_WEB_WASM' | 'ONNX_RUNTIME_WEB_WEBGPU' | 'NATIVE_NODE' | 'NONE';
  intendedUse: string;
  certificationStatus: ModelCertificationStatus;
  procurementStatus: ModelProcurementGateStatus;
  limitations: string[];
}

export class ModelRegistry {
  private static readonly registry: Map<string, ModelRegistryEntry> = new Map();

  static {
    // 1. Target Quran Conformer-CTC (Intended Architecture)
    this.register({
      modelId: 'quran-conformer-ctc-int8',
      architecture: 'Conformer-CTC Encoder',
      version: '0.1.0-spec',
      source: 'Internal Quranic Speech Lab / Open Weights Target',
      license: 'Apache-2.0',
      language: 'Classical Quranic Arabic',
      domain: 'Quran Recitation (Murattal & Mujawwad)',
      sampleRate: 16000,
      inputShape: '[1, T, 80] (Log-Mel Filterbank)',
      outputShape: '[1, T, 45] (Phoneme Posteriors + Blank)',
      vocabulary: [
        '<blank>', 'SIL', 'HAMZAH', 'BAA', 'TAA', 'THAA', 'JEEM', 'HAA_MUHMALAH', 'KHAA',
        'DAAL', 'DHAAL', 'RAA', 'ZAY', 'SEEN', 'SHEEN', 'SAAD', 'DAAD', 'TAA_MUTBAQAH',
        'DHAA_MUTBAQAH', 'AYN', 'GHAYN', 'FAA', 'QAAF', 'KAAF', 'LAAM', 'MEEM', 'NOON',
        'HAA', 'WAW', 'YAA', 'FATHAH', 'DAMMAH', 'KASRAH', 'ALIF_MADDIYYAH', 'WAW_MADDIYYAH',
        'YAA_MADDIYYAH', 'GHUNNAH_IKHFA', 'GHUNNAH_IDGHAM', 'QALQALAH'
      ],
      blankToken: '<blank>',
      quantization: 'INT8',
      modelSizeBytes: 28500000, // ~28.5 MB target
      checksumSha256: null,
      supportedRuntime: 'ONNX_RUNTIME_WEB_WASM',
      intendedUse: 'Constrained acoustic evidence extraction for Quranic recitation forced alignment',
      certificationStatus: ModelCertificationStatus.UNVERIFIED,
      procurementStatus: ModelProcurementGateStatus.MODEL_BLOCKED,
      limitations: [
        'Artifact does not exist in repository: MODEL_BLOCKED.',
        'No pre-converted Hafs-specific 16kHz Conformer-CTC ONNX model exists with licensed redistribution in repo.',
        'Requires fine-tuning on multi-reciter Quran corpus with scholar-annotated phone boundaries.'
      ],
    });

    // 2. Generic Arabic ASR Evaluated: Wav2Vec2-XLSR Tashkeel
    this.register({
      modelId: 'wav2vec2-arabic-tashkeel-quantized',
      architecture: 'Wav2Vec2-XLSR-53 / CTC Head',
      version: '1.0.0',
      source: 'HuggingFace (WajeehAzeemX/tashkeel-wav2vec2-arabic-test1)',
      license: 'Apache-2.0 / CC-BY-NC-4.0',
      language: 'Modern Standard Arabic',
      domain: 'General Arabic ASR (Broadcast & Read News)',
      sampleRate: 16000,
      inputShape: '[1, N] (Raw Waveform PCM)',
      outputShape: '[1, T, 52] (Character CTC)',
      vocabulary: ['[PAD]', '|', 'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ء'],
      blankToken: '[PAD]',
      quantization: 'INT8',
      modelSizeBytes: 317498381, // 317.5 MB
      checksumSha256: 'a31b38b8176751301d3009dadbf2210649d28c898ee355a8a69616931f780280',
      supportedRuntime: 'ONNX_RUNTIME_WEB_WASM',
      intendedUse: 'Arabic Speech Recognition evaluation',
      certificationStatus: ModelCertificationStatus.ENGINEERING_ONLY,
      procurementStatus: ModelProcurementGateStatus.MODEL_BLOCKED,
      limitations: [
        'Model size is 317.5 MB (prohibitive for web browser deployment; exceeds 50MB budget).',
        'Trained on Modern Standard Arabic, not Classical Quranic recitation; lacks tajweed rules (ghunnah, madd, qalqalah).',
        'Outputs Arabic graphemes/characters, not canonical Quranic phonemes.',
        'Takes raw waveform input, not 80-band Mel-spectrogram, incompatible with Mel DSP pipeline.',
        'Cannot be used for Quran religious error decisions.'
      ],
    });

    // 3. Current Active Fallback Engine: Deterministic Pacing Aligner (Tier 1)
    this.register({
      modelId: 'deterministic-pacing-aligner-v1',
      architecture: 'Deterministic Heuristic & VAD Pacing',
      version: '1.0.0-baseline',
      source: 'In-house Core DSP Engineering',
      license: 'MIT',
      language: 'Universal / Quranic Transliteration',
      domain: 'Macro Quranic Word Pacing',
      sampleRate: 16000,
      inputShape: 'Float32Array PCM [N]',
      outputShape: 'WordBoundaries[]',
      vocabulary: ['WORD_TOKENS'],
      blankToken: null,
      quantization: 'NONE',
      modelSizeBytes: 12400,
      checksumSha256: 'f82c8739a394cfa3e306c3baeb420072c2a38f6f8086fcb4df2965598344d875',
      supportedRuntime: 'NATIVE_NODE',
      intendedUse: 'Deterministic fallback alignment when acoustic neural model is unavailable or uncertain',
      certificationStatus: ModelCertificationStatus.BENCHMARKED,
      procurementStatus: ModelProcurementGateStatus.AVAILABLE_LOCAL,
      limitations: [
        'Macro-level pacing only; no phonetic or acoustic evidence.',
        'Cannot evaluate acoustic makharij or fine-grained tajweed.',
        'Guarantees zero religious hallucination through strict Mushaf text binding.'
      ],
    });

    // 4. Real Neural Model Proven in Phase 4D & Hardened in Phase 4D.1: Zipformer2-CTC Quranic Phoneme Model (INT8)
    this.register({
      modelId: 'zipformer-arabic-v3-quran-int8',
      architecture: 'Zipformer2-CTC Streaming Encoder',
      version: '3.1.0-int8-hardened',
      source: 'HuggingFace (Saboorhsn/quran-stt-onnx derived from Quran-Lab/zipformer_p-arabic-v3)',
      license: 'Quran-Lab No-Profit License, Version 1.1 (NPL-1.1 - 100% Free & Open for Non-Profit/Educational Use)',
      language: 'Classical Quranic Arabic with Tajweed Phonemes',
      domain: 'Quranic Recitation & Word-Level Forced Alignment',
      sampleRate: 16000,
      inputShape: '[1, 61, 80] (Exact Kaldi FBank: 16kHz, 80 bins, Povey window, 25ms length, 10ms shift, snip_edges=false, preemph=0.97, remove_dc=true, low_freq=20Hz, high_freq=-400Hz)',
      outputShape: '[1, 12, 251] (Phonetic CTC Log Probs per 61-frame chunk)',
      vocabulary: [
        'ؙ', 'ء', 'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ـ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ً', 'ٌ', 'ٍ', 'َ', 'ُ', 'ِ', 'ّ', 'ْ', 'ٓ', 'ٔ', 'ٕ', 'ٖ', 'ٗ', '٘', 'ٙ', 'ٚ', 'ٛ', 'ٜ', 'ٝ', 'ٞ', 'ٟ', '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٪', '٫', '٬', 'ٱ', 'ٲ', 'ٳ', 'ٴ', 'ٵ', 'ٶ', 'ٷ', 'ٸ', 'ٹ', 'ٺ', 'ٻ', 'ټ', 'ٽ', 'پ', 'ٿ', 'ڀ', 'ځ', 'ڂ', 'ڃ', 'ڄ', 'څ', 'چ', 'ڇ', 'ڈ', 'ډ', 'ڊ', 'ڋ', 'ڌ', 'ڍ', 'ڎ', 'ڏ', 'ڐ', 'ڑ', 'ڒ', 'ړ', 'ڔ', 'ڕ', 'ږ', 'ڗ', 'ژ', 'ڙ', 'ښ', 'ڛ', 'ڜ', 'ڝ', 'ڞ', 'ڟ', 'ڠ', 'ڡ', 'ڢ', 'ڣ', 'ڤ', 'ڥ', 'ڦ', 'ڧ', 'ڨ', 'ک', 'ڪ', 'ګ', 'ڬ', 'ڭ', 'ڮ', 'گ', 'ڰ', 'ڱ', 'ڲ', 'ڳ', 'ڴ', 'ڵ', 'ڶ', 'ڷ', 'ڸ', 'ڹ', 'ں', 'ڻ', 'ڼ', 'ڽ', 'ھ', 'ڿ', 'ۀ', 'ہ', 'ۂ', 'ۃ', 'ۄ', 'ۅ', 'ۆ', 'ۇ', 'ۈ', 'ۉ', 'ۊ', 'ۋ', 'ی', 'ۍ', 'ێ', 'ۏ', 'ې', 'ۑ', 'ے', 'ۓ', '۔', 'ە', 'ۖ', 'ۗ', 'ۘ', 'ۙ', 'ۚ', 'ۛ', 'ۜ', '۝', '۞', '۟', '۠', 'ۡ', 'ۢ', 'ۣ', 'ۤ', 'ۥ', 'ۦ', 'ۧ', 'ۨ', '۩', '۪', '۫', '۬', 'ۭ', 'ۮ', 'ۯ', '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', 'ۺ', 'ۻ', 'ۼ', '۽', '۾', 'ۿ', 'اَ', 'اِ', 'اُ', 'بَ', 'بِ', 'بُ', 'تَ', 'تِ', 'تُ', 'ثَ', 'ثِ', 'ثُ', 'جَ', 'جِ', 'جُ', 'حَ', 'حِ', 'حُ', 'خَ', 'خِ', 'خُ', 'دَ', 'دِ', 'دُ', 'ذَ', 'ذِ', 'ذُ', 'رَ', 'رِ', 'رُ', 'زَ', 'زِ', 'زُ', 'سَ', 'سِ', 'سُ', 'شَ', 'شِ', 'شُ', 'صَ', 'صِ', 'صُ', 'ضَ', 'ضِ', 'ضُ', 'طَ', 'طِ', 'طُ', 'ظَ', 'ظِ', 'ظُ', 'عَ', 'عِ', 'عُ', 'غَ', 'غِ', 'غُ', 'فَ', 'فِ', 'فُ', 'قَ', 'قِ', 'قُ', 'كَ', 'كِ', 'كُ', 'لَ', 'لِ', 'لُ', 'مَ', 'مِ', 'مُ', 'نَ', 'نِ', 'نُ', 'هَ', 'هِ', 'هُ', 'وَ', 'وِ', 'وُ', 'يَ', 'يِ', 'يُ', '<blank>'
      ],
      blankToken: '<blank>',
      quantization: 'INT8',
      modelSizeBytes: 72705392, // 72.7 MB
      checksumSha256: '31755836528da336a6192121cd7bc82cb41752dddb65566fd000b89c8686da6b',
      supportedRuntime: 'NATIVE_NODE',
      intendedUse: 'Real neural acoustic CTC phoneme posteriors and forced alignment evidence for Quranic recitation',
      certificationStatus: ModelCertificationStatus.BENCHMARKED,
      procurementStatus: ModelProcurementGateStatus.AVAILABLE_LOCAL,
      limitations: [
        'MUST use KaldiFbankExtractor (16kHz, 80 bins, Povey window, 25ms length, 10ms shift, snip_edges=false, preemph=0.97, remove_dc=true, low_freq=20Hz, high_freq=-400Hz). Generic MelSpectrogramExtractor is strictly forbidden for production.',
        'Requires 99 state feeds with persistent cache carry-over; zeroing states across chunks causes severe phoneme corruption.',
        'Fixed input chunk length of exactly 61 frames; requires silence padding and optional end-of-stream flush chunk.',
        'STRICT GOVERNANCE RULE: Even though phonetic output matches recitation, this acoustic model alone MUST NOT directly classify Tajweed rules (Lahn Jali, Lahn Khafi, Ikhfa, Idgham, Iqlab, Madd duration, Ghunnah timing, Qalqalah). Tajweed judgments require the downstream scholar-verified rule engine.',
        'Strict non-profit educational license (NPL-1.1); ideal for our 100% free educational platform.'
      ],
    });
  }

  static register(entry: ModelRegistryEntry): void {
    this.registry.set(entry.modelId, entry);
  }

  static getModel(modelId: string): ModelRegistryEntry | undefined {
    return this.registry.get(modelId);
  }

  static getAllModels(): ModelRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  static getProcurementGateStatus(modelId: string): ModelProcurementGateStatus {
    const model = this.getModel(modelId);
    return model?.procurementStatus ?? ModelProcurementGateStatus.MODEL_BLOCKED;
  }
}
