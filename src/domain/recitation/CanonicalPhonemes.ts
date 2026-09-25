/**
 * @file CanonicalPhonemes.ts
 * @module domain/recitation
 * @description Canonical Quran-Lab phoneme loader and greedy longest-prefix tokenizer
 * for the 251-symbol Quranic phonetic unit inventory.
 */

import fs from 'fs';
import path from 'path';

export interface CanonicalVersePhonemes {
  ayahId: string;
  ayaText: string;
  ayaPhoneme: string;
  tokens: string[];
}

export class CanonicalPhonemeService {
  private static instance: CanonicalPhonemeService | null = null;
  private units: Set<string> = new Set();
  private sortedUnits: string[] = [];
  private versesMap: Map<string, CanonicalVersePhonemes> = new Map();

  private constructor() {
    this.initVocab();
    this.loadVerses();
  }

  public static getInstance(): CanonicalPhonemeService {
    if (!CanonicalPhonemeService.instance) {
      CanonicalPhonemeService.instance = new CanonicalPhonemeService();
    }
    return CanonicalPhonemeService.instance;
  }

  private initVocab(): void {
    const unitsPath = path.resolve('models/saboorhsn/phoneme_units.json');
    if (fs.existsSync(unitsPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(unitsPath, 'utf-8'));
        for (const k of Object.keys(raw)) {
          if (k !== '<blank>') {
            this.units.add(k);
          }
        }
      } catch (err) {
        console.warn('[CanonicalPhonemes] Warning: Failed to parse phoneme_units.json, using fallback vocab', err);
      }
    }

    if (this.units.size === 0) {
      // Essential fallback vocabulary
      const basic = ['بِ', 'س', 'مِ', 'للَ', 'اا', 'هِ', 'ررَ', 'ح', 'مَ', 'نِ', 'حِ', 'ۦۦۦۦ', 'م', 'ءَ', 'ل', 'دُ', 'رَببِ', 'عَاالَمِ'];
      basic.forEach((u) => this.units.add(u));
    }

    // Sort descending by length for greedy longest-match tokenization
    this.sortedUnits = Array.from(this.units).sort((a, b) => b.length - a.length);
  }

  private loadVerses(): void {
    const jsonPath = path.resolve('models/saboorhsn/ordered_quran_phonemes.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        for (const [ayahKey, vData] of Object.entries<any>(raw)) {
          const ayaPhoneme: string = vData.aya_phoneme || '';
          const ayaText: string = vData.aya_text || '';
          const tokens = this.tokenize(ayaPhoneme);
          this.versesMap.set(ayahKey, {
            ayahId: ayahKey,
            ayaText,
            ayaPhoneme,
            tokens,
          });
        }
      } catch (err) {
        console.warn('[CanonicalPhonemes] Warning: Failed to parse ordered_quran_phonemes.json', err);
      }
    }

    // Ensure Al-Fatihah baseline entries exist
    if (!this.versesMap.has('1:1')) {
      const p = 'بِسمِ للَااهِ ررَحمَاانِ ررَحِۦۦۦۦم';
      this.versesMap.set('1:1', {
        ayahId: '1:1',
        ayaText: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
        ayaPhoneme: p,
        tokens: this.tokenize(p),
      });
    }
    if (!this.versesMap.has('1:2')) {
      const p = 'ءَلحَمدُ لِللَااهِ رَببِ لعَاالَمِۦۦۦۦن';
      this.versesMap.set('1:2', {
        ayahId: '1:2',
        ayaText: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ',
        ayaPhoneme: p,
        tokens: this.tokenize(p),
      });
    }
  }

  /**
   * Greedy longest-match tokenization into 251-symbol phonetic inventory.
   */
  public tokenize(phonemeString: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    const s = phonemeString.trim();

    while (i < s.length) {
      if (s[i] === ' ') {
        i++;
        continue;
      }

      let matched = false;
      for (const u of this.sortedUnits) {
        if (s.startsWith(u, i)) {
          tokens.push(u);
          i += u.length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Fallback: single character
        tokens.push(s[i]);
        i++;
      }
    }

    return tokens;
  }

  public getVersePhonemes(ayahId: string): CanonicalVersePhonemes | undefined {
    return this.versesMap.get(ayahId);
  }
}
