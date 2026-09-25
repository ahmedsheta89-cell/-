/**
 * @file LegacyMockAcousticPosteriorGenerator.ts
 * @module application/recitation/acoustic
 * @description Isolated legacy mock acoustic posterior generator for synthetic tests.
 * 
 * CRITICAL ARCHITECTURAL ISOLATION:
 * This class implements a synthetic temporal Gaussian progression over frame indices.
 * It is EXPLICITLY CLASSIFIED AS MOCKED / SIMULATION.
 * It reacts primarily to temporal frame advancement and energy threshold rather than phonetic content.
 * MUST NEVER be labeled or treated as a neural acoustic model.
 */

import { QuranPhonemeToken } from './QuranPhonemeLexicon.ts';

export class LegacyMockAcousticPosteriorGenerator {
  /**
   * Generates synthetic frame posteriors using temporal Gaussian progression.
   * CLASSIFICATION: MOCKED (Not Neural Inference).
   */
  public generateSyntheticPosteriors(
    melFrames: Float32Array[],
    targetPhonemes: QuranPhonemeToken[],
    audioPcm: Float32Array
  ): Array<Record<string, number>> {
    const numFrames = melFrames.length;
    const numPhonemes = targetPhonemes.length;
    const posteriors: Array<Record<string, number>> = [];

    // Calculate signal RMS to check presence of basic audio energy
    let sumSq = 0;
    for (let i = 0; i < audioPcm.length; i++) sumSq += audioPcm[i] * audioPcm[i];
    const rms = Math.sqrt(sumSq / (audioPcm.length || 1));

    for (let t = 0; t < numFrames; t++) {
      const frameDist: Record<string, number> = {};
      const mel = melFrames[t];

      // Frame energy estimate
      let frameEnergy = 0;
      for (let m = 0; m < mel.length; m++) frameEnergy += Math.exp(mel[m]);

      // If audio is muted/silent, acoustic probabilities drop to floor
      if (rms < 0.008 || frameEnergy < 0.01) {
        for (const tok of targetPhonemes) {
          frameDist[tok.phonemeId] = 0.02;
        }
        posteriors.push(frameDist);
        continue;
      }

      // Synthetic Gaussian temporal progression: assumes linear recitation pacing
      const expectedPhonemeIdx = Math.min(
        numPhonemes - 1,
        Math.floor((t / (numFrames || 1)) * numPhonemes)
      );

      for (let k = 0; k < numPhonemes; k++) {
        const tok = targetPhonemes[k];
        const dist = Math.abs(k - expectedPhonemeIdx);
        // Gaussian probability peak centered on expectedPhonemeIdx
        const gaussianWeight = Math.exp(-(dist * dist) / 6.0);
        const prob = Math.min(0.95, Math.max(0.02, 0.15 + 0.8 * gaussianWeight));
        frameDist[tok.phonemeId] = Number(prob.toFixed(3));
      }

      posteriors.push(frameDist);
    }

    return posteriors;
  }
}
