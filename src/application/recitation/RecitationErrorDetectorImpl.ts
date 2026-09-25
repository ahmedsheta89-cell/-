/**
 * @file RecitationErrorDetectorImpl.ts
 * @module application/recitation
 * @description Extracts purely acoustic and textual alignment observations without issuing religious verdicts.
 * Separation of Concerns: Observation Layer != Religious Judgment Layer.
 */

import {
  AcousticObservationType,
  IRecitationErrorDetector,
  RecitationObservation,
} from '../../domain/recitation/observationTypes.ts';
import { AlignmentResult, AlignmentStatus } from '../../domain/recitation/alignmentTypes.ts';

export class RecitationErrorDetectorImpl implements IRecitationErrorDetector {
  detectWordObservations(alignments: AlignmentResult[]): RecitationObservation[] {
    const observations: RecitationObservation[] = [];

    for (const align of alignments) {
      // 1. Direct word-level alignment (e.g. from alignAudioToWords)
      if (align.wordId && align.expectedTextUthmani) {
        const obsStart = align.observedStartMs ?? align.expectedStartMs ?? 0;
        const obsEnd = align.observedEndMs ?? align.expectedEndMs ?? 0;
        const duration = Math.max(0, obsEnd - obsStart);

        let obsType = AcousticObservationType.EXACT_MATCH;
        let notes = 'تطابق سليم مع النص القرآني المتوقع.';
        let deviationScore = 0.0;

        const durRatio = align.evidence?.temporalDurationRatio ?? (align.expectedEndMs && align.expectedStartMs ? duration / (align.expectedEndMs - align.expectedStartMs) : 1);

        if (align.status === AlignmentStatus.UNOBSERVABLE) {
          obsType = AcousticObservationType.UNOBSERVABLE;
          notes = 'لم يتم تسجيل إشارة صوتية لهذه الكلمة (انقطاع أو لم تبدأ بعد).';
          deviationScore = 1.0;
        } else if (duration === 0 || durRatio === 0) {
          obsType = AcousticObservationType.DELETION;
          notes = 'إسقاط الكلمة بالكامل أو سكوت تام في موضعها.';
          deviationScore = 0.9;
        } else if (align.status === AlignmentStatus.MISALIGNED) {
          obsType = AcousticObservationType.SUBSTITUTION;
          notes = 'تباين ملحوظ بين النص المنطوق المفترض والنص المتوقع.';
          deviationScore = 0.8;
        } else if (align.status === AlignmentStatus.UNCERTAIN) {
          obsType = AcousticObservationType.UNCERTAIN;
          notes = 'الإشارة الصوتية غير واضحة المعالم، تحتاج إلى تثبت.';
          deviationScore = 0.5;
        } else if ((align.alignmentScore ?? 1.0) < 0.6) {
          obsType = AcousticObservationType.DELETION;
          notes = 'احتمال إسقاط الكلمة أو قراءتها بهمس شديد دون طاقة صوتية كافية.';
          deviationScore = 0.7;
        }

        observations.push({
          id: `obs-${align.sessionId}-${align.wordId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: obsType,
          wordId: align.wordId,
          ayahNumber: align.ayahId ? parseInt(align.ayahId.split(':')[1] || '1', 10) : 1,
          expectedText: align.expectedTextUthmani,
          observedText: align.expectedTextClean || align.expectedTextUthmani,
          alignment: align,
          observedStartMs: obsStart,
          observedEndMs: obsEnd,
          durationMs: duration,
          acousticDeviationScore: deviationScore,
          notesArabic: notes,
        });
        continue;
      }

      // 2. Structured session alignment with ayahs
      if (align.ayahs && Array.isArray(align.ayahs)) {
        for (const ayahAlign of align.ayahs) {
          const words = ayahAlign.wordsAlignment || [];

          for (let i = 0; i < words.length; i++) {
            const w = words[i];
            let obsType = AcousticObservationType.EXACT_MATCH;
            let notes = 'تطابق سليم مع النص القرآني المتوقع.';
            let deviationScore = 0.0;

            const wStart = w.observedStartMs ?? w.expectedStartMs;
            const wEnd = w.observedEndMs ?? w.expectedEndMs;
            const wDuration = Math.max(0, wEnd - wStart);

            if (w.status === AlignmentStatus.UNOBSERVABLE) {
              obsType = AcousticObservationType.UNOBSERVABLE;
              notes = 'لم يتم تسجيل إشارة صوتية لهذه الكلمة (انقطاع أو لم تبدأ بعد).';
              deviationScore = 1.0;
            } else if (wDuration === 0) {
              obsType = AcousticObservationType.DELETION;
              notes = 'إسقاط الكلمة بالكامل دون نطق.';
              deviationScore = 0.9;
            } else if (w.status === AlignmentStatus.MISALIGNED) {
              obsType = AcousticObservationType.SUBSTITUTION;
              notes = 'تباين ملحوظ بين النص المنطوق المفترض والنص المتوقع.';
              deviationScore = 0.8;
            } else if (w.status === AlignmentStatus.UNCERTAIN) {
              obsType = AcousticObservationType.UNCERTAIN;
              notes = 'الإشارة الصوتية غير واضحة المعالم، تحتاج إلى تثبت.';
              deviationScore = 0.5;
            } else if (w.alignmentScore < 0.6) {
              obsType = AcousticObservationType.DELETION;
              notes = 'احتمال إسقاط الكلمة أو قراءتها بهمس شديد دون طاقة صوتية كافية.';
              deviationScore = 0.7;
            }

            // Check for repeated words in adjacent sequence
            if (
              i > 0 &&
              words[i - 1].expectedTextUthmani === w.expectedTextUthmani &&
              w.alignmentScore > 0.7
            ) {
              obsType = AcousticObservationType.REPETITION;
              notes = 'تكرار نفس الكلمة مرتين متتاليتين.';
              deviationScore = 0.4;
            }

            observations.push({
              id: `obs-${align.sessionId}-${w.wordId}-${Date.now()}-${i}`,
              type: obsType,
              wordId: w.wordId,
              ayahNumber: w.ayahNumber,
              expectedText: w.expectedTextUthmani,
              observedText: w.observedTextHypothesis,
              alignment: align,
              observedStartMs: wStart,
              observedEndMs: wEnd,
              durationMs: wDuration,
              acousticDeviationScore: deviationScore,
              notesArabic: notes,
            });
          }
        }
      }
    }

    return observations;
  }
}
