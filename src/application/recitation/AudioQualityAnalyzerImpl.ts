/**
 * @file AudioQualityAnalyzerImpl.ts
 * @module application/recitation
 * @description Real-time audio signal quality analyzer and noise/clipping estimator.
 * If audio is UNUSABLE, the engine rejects alignment and informs the user to improve mic setup.
 */

import {
  IAudioQualityAnalyzer,
  AudioChunk,
  AudioQualityAssessment,
  AudioQualityStatus,
  AudioQualityIssue,
} from '../../domain/recitation/audioCaptureTypes.ts';

export class AudioQualityAnalyzerImpl implements IAudioQualityAnalyzer {
  private readonly CLIPPING_THRESHOLD = 0.98;
  private readonly SILENCE_AMPLITUDE_THRESHOLD = 0.01; // ~ -40 dB
  private readonly MIN_SAMPLE_RATE_HZ = 16000;

  analyzeChunk(chunk: AudioChunk): AudioQualityAssessment {
    const data = chunk.pcmData;
    const len = data.length;
    const issues: AudioQualityIssue[] = [];

    if (len === 0) {
      return {
        status: AudioQualityStatus.UNUSABLE,
        isUsableForAlignment: false,
        rmsDb: -100,
        peakAmplitude: 0,
        clippingRatio: 0,
        silenceRatio: 1,
        estimatedSnrDb: 0,
        issues: [AudioQualityIssue.SIGNAL_TOO_LOW],
        recommendationArabic: 'لم يتم استلام أي إشارة صوتية. يرجى التأكد من تشغيل الميكروفون.',
        evaluatedAt: new Date().toISOString(),
      };
    }

    let sumSquares = 0;
    let peak = 0;
    let clippingSamples = 0;
    let silenceSamples = 0;

    for (let i = 0; i < len; i++) {
      const val = data[i];
      const absVal = Math.abs(val);
      if (absVal > peak) peak = absVal;
      sumSquares += val * val;

      if (absVal >= this.CLIPPING_THRESHOLD) {
        clippingSamples++;
      }
      if (absVal < this.SILENCE_AMPLITUDE_THRESHOLD) {
        silenceSamples++;
      }
    }

    const rms = Math.sqrt(sumSquares / len);
    const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100;
    const clippingRatio = clippingSamples / len;
    const silenceRatio = silenceSamples / len;

    // Approximate SNR: ratio of speech energy vs silence/noise floor
    let estimatedSnrDb = Math.max(0, rmsDb - (-55));

    // Check Sample Rate
    if (chunk.sampleRateHz < this.MIN_SAMPLE_RATE_HZ) {
      issues.push(AudioQualityIssue.SAMPLE_RATE_INSUFFICIENT);
    }

    // Check Clipping (Distortion)
    if (clippingRatio > 0.015) {
      issues.push(AudioQualityIssue.CLIPPING_DETECTED);
    }

    // Check Signal Level
    if (peak < 0.02) {
      issues.push(AudioQualityIssue.SIGNAL_TOO_LOW);
      if (peak < 0.005) {
        issues.push(AudioQualityIssue.MICROPHONE_MUTED);
      }
    }

    // Check Excessive Noise
    if (silenceRatio < 0.05 && rmsDb > -20 && estimatedSnrDb < 8) {
      issues.push(AudioQualityIssue.EXCESSIVE_NOISE);
    }

    // Determine Status
    let status = AudioQualityStatus.GOOD;
    let recommendationArabic = 'جودة الإشارة الصوتية ممتازة وصالحة للتحليل القرآني الدقيق.';

    if (issues.includes(AudioQualityIssue.MICROPHONE_MUTED) || clippingRatio > 0.1 || chunk.sampleRateHz < 11025) {
      status = AudioQualityStatus.UNUSABLE;
      recommendationArabic = 'الإشارة الصوتية غير صالحة للتحليل. يرجى فحص توصيل الميكروفون وتجنب التشويش الشديد.';
    } else if (issues.includes(AudioQualityIssue.CLIPPING_DETECTED) || issues.includes(AudioQualityIssue.SIGNAL_TOO_LOW)) {
      status = AudioQualityStatus.POOR;
      recommendationArabic = issues.includes(AudioQualityIssue.CLIPPING_DETECTED)
        ? 'تم رصد تشويه صوتي (Clipping). يرجى خفض حساسية الميكروفون أو الابتعاد عنه قليلاً.'
        : 'الصوت منخفض جداً. يرجى الاقتراب من الميكروفون والتلاوة بنبرة واضحة.';
    } else if (issues.length > 0) {
      status = AudioQualityStatus.ACCEPTABLE;
      recommendationArabic = 'جودة مقبولة مع وجود ضجيج طفيف في الخلفية لا يمنع المتابعة بحذر.';
    }

    return {
      status,
      isUsableForAlignment: status !== AudioQualityStatus.UNUSABLE,
      rmsDb: Math.round(rmsDb * 10) / 10,
      peakAmplitude: Math.round(peak * 1000) / 1000,
      clippingRatio: Math.round(clippingRatio * 1000) / 1000,
      silenceRatio: Math.round(silenceRatio * 1000) / 1000,
      estimatedSnrDb: Math.round(estimatedSnrDb * 10) / 10,
      issues,
      recommendationArabic,
      evaluatedAt: new Date().toISOString(),
    };
  }

  analyzeSession(chunks: AudioChunk[]): AudioQualityAssessment {
    if (chunks.length === 0) {
      return {
        status: AudioQualityStatus.UNUSABLE,
        isUsableForAlignment: false,
        rmsDb: -100,
        peakAmplitude: 0,
        clippingRatio: 0,
        silenceRatio: 1,
        estimatedSnrDb: 0,
        issues: [AudioQualityIssue.SIGNAL_TOO_LOW],
        recommendationArabic: 'لا توجد مقاطع صوتية مسجلة.',
        evaluatedAt: new Date().toISOString(),
      };
    }

    const assessments = chunks.map((c) => this.analyzeChunk(c));
    const avgRms = assessments.reduce((acc, a) => acc + a.rmsDb, 0) / assessments.length;
    const maxPeak = Math.max(...assessments.map((a) => a.peakAmplitude));
    const maxClipping = Math.max(...assessments.map((a) => a.clippingRatio));
    const avgSilence = assessments.reduce((acc, a) => acc + a.silenceRatio, 0) / assessments.length;
    const avgSnr = assessments.reduce((acc, a) => acc + a.estimatedSnrDb, 0) / assessments.length;

    const allIssues = Array.from(new Set(assessments.flatMap((a) => a.issues)));
    const hasUnusable = assessments.some((a) => a.status === AudioQualityStatus.UNUSABLE);
    const hasPoor = assessments.some((a) => a.status === AudioQualityStatus.POOR);

    const status = hasUnusable
      ? AudioQualityStatus.UNUSABLE
      : hasPoor
      ? AudioQualityStatus.POOR
      : allIssues.length > 0
      ? AudioQualityStatus.ACCEPTABLE
      : AudioQualityStatus.GOOD;

    return {
      status,
      isUsableForAlignment: status !== AudioQualityStatus.UNUSABLE,
      rmsDb: Math.round(avgRms * 10) / 10,
      peakAmplitude: Math.round(maxPeak * 1000) / 1000,
      clippingRatio: Math.round(maxClipping * 1000) / 1000,
      silenceRatio: Math.round(avgSilence * 1000) / 1000,
      estimatedSnrDb: Math.round(avgSnr * 10) / 10,
      issues: allIssues,
      recommendationArabic: assessments[assessments.length - 1].recommendationArabic,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
