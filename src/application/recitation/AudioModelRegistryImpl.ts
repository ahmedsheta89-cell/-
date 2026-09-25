/**
 * @file AudioModelRegistryImpl.ts
 * @module application/recitation
 * @description Catalog and governance registry for acoustic, VAD, and forced alignment models.
 * Enforces transparency: Uncertified models are never falsely presented as religious authorities.
 */

import {
  AudioModelEntry,
  IAudioModelRegistry,
  ModelBenchmarkStatus,
  ModelDeploymentMode,
} from '../../domain/recitation/modelRegistryTypes.ts';
import { RiwayahType } from '../../domain/quran/types.ts';

export class AudioModelRegistryImpl implements IAudioModelRegistry {
  private readonly models: AudioModelEntry[] = [
    {
      modelId: 'deterministic-energy-dtw-aligner-v1',
      nameArabic: 'محاذي الطاقة وخوارزمية DTW الحتمية للقرآن الكريم (المرحلة 3)',
      provider: 'Quran Teacher AI Core Engineering',
      version: '1.0.0-baseline',
      license: 'MIT / Open Academic License',
      task: 'FORCED_ALIGNMENT',
      inputFormat: 'PCM_FLOAT32_16KHZ_MONO',
      inputSamplingRateHz: 16000,
      supportedRiwayat: [
        RiwayahType.HAFS_AN_ASIM,
        RiwayahType.WARSH_AN_NAFI,
        RiwayahType.QALOON_AN_NAFI,
        RiwayahType.AL_DOORI_AN_ABI_AMR,
      ],
      phonemeSupport: false,
      arabicSupport: 'NATIVE_QURAN',
      offlineSupport: true,
      browserSupport: true,
      wasmSupport: true,
      streamingSupported: true,
      benchmarkStatus: ModelBenchmarkStatus.BENCHMARKED_CERTIFIED,
      validationStatus: 'VALIDATED_EXPERT',
      deploymentMode: ModelDeploymentMode.ON_DEVICE_WEB_WORKER,
      averageInferenceLatencyMs: 8,
      realTimeFactor: 0.05,
      isCertifiedForFiqhDecisions: false,
      notesArabic: 'خوارزمية حتمية بدون شبكات عصبية، تعمل بنمط Fallback عند تعذر النماذج الصوتية العميقة.',
    },
    {
      modelId: 'adaptive-dual-threshold-vad-v1',
      nameArabic: 'كاشف النشاط الصوتي المتكيف المزدوج (Dual-Threshold VAD)',
      provider: 'Quran Teacher AI Core Engineering',
      version: '1.2.0',
      license: 'Apache-2.0',
      task: 'VAD',
      inputFormat: 'PCM_FLOAT32_16KHZ_MONO',
      inputSamplingRateHz: 16000,
      supportedRiwayat: [RiwayahType.HAFS_AN_ASIM],
      phonemeSupport: false,
      arabicSupport: 'NATIVE_QURAN',
      offlineSupport: true,
      browserSupport: true,
      wasmSupport: true,
      streamingSupported: true,
      benchmarkStatus: ModelBenchmarkStatus.BENCHMARKED_CERTIFIED,
      validationStatus: 'VALIDATED_EXPERT',
      deploymentMode: ModelDeploymentMode.ON_DEVICE_WEB_WORKER,
      averageInferenceLatencyMs: 3,
      realTimeFactor: 0.02,
      isCertifiedForFiqhDecisions: false,
      notesArabic: 'يعزل التلاوة عن السكتات والتنفس وضجيج الغرفة تلقائياً في المتصفح.',
    },
    {
      modelId: 'quran-conformer-ctc-onnx-int8-candidate',
      nameArabic: 'المشفر الصوتي العصبي المقيد للتلاوة (Quran Conformer-CTC ONNX Int8)',
      provider: 'Quran Teacher AI Research & ONNX Runtime Web',
      version: '0.1.0-poc',
      license: 'Apache-2.0 / Open Weights',
      task: 'CTC_ACOUSTIC_ENCODER',
      inputFormat: 'LOG_MEL_SPECTROGRAM_80BAND_16KHZ',
      inputSamplingRateHz: 16000,
      supportedRiwayat: [RiwayahType.HAFS_AN_ASIM],
      phonemeSupport: true,
      arabicSupport: 'NATIVE_QURAN',
      offlineSupport: true,
      browserSupport: true,
      wasmSupport: true,
      streamingSupported: true,
      benchmarkStatus: ModelBenchmarkStatus.BENCHMARK_IN_PROGRESS,
      validationStatus: 'EXPERIMENTAL_UNVALIDATED',
      deploymentMode: ModelDeploymentMode.ON_DEVICE_WASM,
      averageInferenceLatencyMs: 45,
      realTimeFactor: 0.12,
      isCertifiedForFiqhDecisions: false,
      notesArabic: 'المرشح الأول المعتمد للمرحلة 4: استخراج احتمالات الفونيمات ومحاذاتها بمصفوفة فيتربي المقيدة بالمصحف.',
    },
    {
      modelId: 'wav2vec2-xlsr-arabic-ctc-server-candidate',
      nameArabic: 'نموذج الفونيمات العربي واسع النطاق (Wav2Vec2-XLSR-53 Arabic CTC)',
      provider: 'Meta AI / HuggingFace Community',
      version: '300M-params',
      license: 'CC-BY-NC-4.0',
      task: 'PHONETIC_RECOGNITION',
      inputFormat: 'RAW_PCM_16KHZ',
      inputSamplingRateHz: 16000,
      supportedRiwayat: [RiwayahType.HAFS_AN_ASIM],
      phonemeSupport: true,
      arabicSupport: 'STANDARD_ARABIC',
      offlineSupport: false,
      browserSupport: false,
      wasmSupport: false,
      streamingSupported: false,
      benchmarkStatus: ModelBenchmarkStatus.NOT_BENCHMARKED,
      validationStatus: 'EXPERIMENTAL_UNVALIDATED',
      deploymentMode: ModelDeploymentMode.SERVER_CONTAINER,
      averageInferenceLatencyMs: 380,
      realTimeFactor: 0.75,
      isCertifiedForFiqhDecisions: false,
      notesArabic: 'مستبعد من المتصفح لضخامة الحجم (1.2GB) والاعتماد الإلزامي على GPU وسيرفر خارجي يمس الخصوصية.',
    },
    {
      modelId: 'acoustic-ghunnah-formant-analyzer-v0',
      nameArabic: 'محلل رنين الغنة الترددي (Nasal Formant Analyzer)',
      provider: 'Quran Phonetics Lab',
      version: '0.1.0-unreleased',
      license: 'Proprietary Research',
      task: 'ACOUSTIC_MAKHRAJ',
      inputFormat: 'PCM_FLOAT32_44KHZ',
      inputSamplingRateHz: 44100,
      supportedRiwayat: [RiwayahType.HAFS_AN_ASIM],
      phonemeSupport: false,
      arabicSupport: 'NATIVE_QURAN',
      offlineSupport: true,
      browserSupport: true,
      wasmSupport: false,
      streamingSupported: false,
      benchmarkStatus: ModelBenchmarkStatus.NOT_BENCHMARKED,
      validationStatus: 'SYNTHETIC_ONLY',
      deploymentMode: ModelDeploymentMode.MOCK_SIMULATOR,
      averageInferenceLatencyMs: 50,
      realTimeFactor: 0.1,
      isCertifiedForFiqhDecisions: false,
      notesArabic: 'غير مفعل بالإنتاج حالياً (NOT_AVAILABLE) لعدم اكتمال الدقة التخصصية للرنين الأنفي.',
    },
  ];

  getAllModels(): AudioModelEntry[] {
    return [...this.models];
  }

  getModel(modelId: string): AudioModelEntry | undefined {
    return this.models.find((m) => m.modelId === modelId);
  }

  getActiveAlignmentModel(): AudioModelEntry {
    return this.models[0];
  }

  getActiveVadModel(): AudioModelEntry {
    return this.models[1];
  }
}
