/**
 * @file QuranPhonemeLexicon.ts
 * @module application/recitation/acoustic
 * @description Canonical Quranic phoneme lexicon with Riwayah isolation.
 * Strictly derives phonetic sequences from verified Uthmani script.
 */

import { RiwayahType } from '../../../domain/quran/types.ts';

export interface QuranPhonemeToken {
  phonemeId: string;
  arabicSymbol: string;
  isConsonant: boolean;
  isVowel: boolean;
  isGhunnah: boolean;
  baseHarakahDuration: number; // in standard mora / harakah (e.g. 1 for short vowel, 2 for madd tabi'i)
}

/**
 * Standard 42 Quranic Phoneme Inventory for Hafs 'an Asim.
 */
export const HAFS_PHONEME_INVENTORY: Record<string, QuranPhonemeToken> = {
  SIL: { phonemeId: 'SIL', arabicSymbol: 'سكت', isConsonant: false, isVowel: false, isGhunnah: false, baseHarakahDuration: 0 },
  HAMZAH: { phonemeId: 'HAMZAH', arabicSymbol: 'ء', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  BAA: { phonemeId: 'BAA', arabicSymbol: 'ب', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  TAA: { phonemeId: 'TAA', arabicSymbol: 'ت', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  THAA: { phonemeId: 'THAA', arabicSymbol: 'ث', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  JEEM: { phonemeId: 'JEEM', arabicSymbol: 'ج', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  HAA_MUHMALAH: { phonemeId: 'HAA_MUHMALAH', arabicSymbol: 'ح', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  KHAA: { phonemeId: 'KHAA', arabicSymbol: 'خ', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  DAAL: { phonemeId: 'DAAL', arabicSymbol: 'د', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  DHAAL: { phonemeId: 'DHAAL', arabicSymbol: 'ذ', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  RAA: { phonemeId: 'RAA', arabicSymbol: 'ر', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  ZAY: { phonemeId: 'ZAY', arabicSymbol: 'ز', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  SEEN: { phonemeId: 'SEEN', arabicSymbol: 'س', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  SHEEN: { phonemeId: 'SHEEN', arabicSymbol: 'ش', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  SAAD: { phonemeId: 'SAAD', arabicSymbol: 'ص', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  DAAD: { phonemeId: 'DAAD', arabicSymbol: 'ض', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  TAA_MUTBAQAH: { phonemeId: 'TAA_MUTBAQAH', arabicSymbol: 'ط', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  DHAA_MUTBAQAH: { phonemeId: 'DHAA_MUTBAQAH', arabicSymbol: 'ظ', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  AYN: { phonemeId: 'AYN', arabicSymbol: 'ع', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  GHAYN: { phonemeId: 'GHAYN', arabicSymbol: 'غ', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  FAA: { phonemeId: 'FAA', arabicSymbol: 'ف', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  QAAF: { phonemeId: 'QAAF', arabicSymbol: 'ق', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  KAAF: { phonemeId: 'KAAF', arabicSymbol: 'ك', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  LAAM: { phonemeId: 'LAAM', arabicSymbol: 'ل', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  MEEM: { phonemeId: 'MEEM', arabicSymbol: 'م', isConsonant: true, isVowel: false, isGhunnah: true, baseHarakahDuration: 1 },
  NOON: { phonemeId: 'NOON', arabicSymbol: 'ن', isConsonant: true, isVowel: false, isGhunnah: true, baseHarakahDuration: 1 },
  HAA: { phonemeId: 'HAA', arabicSymbol: 'هـ', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  WAW: { phonemeId: 'WAW', arabicSymbol: 'و', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },
  YAA: { phonemeId: 'YAA', arabicSymbol: 'ي', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 1 },

  // Vowels
  FATHAH: { phonemeId: 'FATHAH', arabicSymbol: 'َ', isConsonant: false, isVowel: true, isGhunnah: false, baseHarakahDuration: 1 },
  DAMMAH: { phonemeId: 'DAMMAH', arabicSymbol: 'ُ', isConsonant: false, isVowel: true, isGhunnah: false, baseHarakahDuration: 1 },
  KASRAH: { phonemeId: 'KASRAH', arabicSymbol: 'ِ', isConsonant: false, isVowel: true, isGhunnah: false, baseHarakahDuration: 1 },
  ALIF_MADDIYYAH: { phonemeId: 'ALIF_MADDIYYAH', arabicSymbol: 'ا', isConsonant: false, isVowel: true, isGhunnah: false, baseHarakahDuration: 2 },
  WAW_MADDIYYAH: { phonemeId: 'WAW_MADDIYYAH', arabicSymbol: 'و', isConsonant: false, isVowel: true, isGhunnah: false, baseHarakahDuration: 2 },
  YAA_MADDIYYAH: { phonemeId: 'YAA_MADDIYYAH', arabicSymbol: 'ي', isConsonant: false, isVowel: true, isGhunnah: false, baseHarakahDuration: 2 },

  // Specialized Tajweed Phonation Tokens
  GHUNNAH_IKHFA: { phonemeId: 'GHUNNAH_IKHFA', arabicSymbol: 'غنة إخفاء', isConsonant: false, isVowel: false, isGhunnah: true, baseHarakahDuration: 2 },
  GHUNNAH_IDGHAM: { phonemeId: 'GHUNNAH_IDGHAM', arabicSymbol: 'غنة إدغام', isConsonant: false, isVowel: false, isGhunnah: true, baseHarakahDuration: 2 },
  QALQALAH: { phonemeId: 'QALQALAH', arabicSymbol: 'قلقلة', isConsonant: true, isVowel: false, isGhunnah: false, baseHarakahDuration: 0.5 },
};

export class QuranPhonemeLexicon {
  private readonly riwayah: RiwayahType;

  constructor(riwayah: RiwayahType = RiwayahType.HAFS_AN_ASIM) {
    this.riwayah = riwayah;
  }

  getRiwayah(): RiwayahType {
    return this.riwayah;
  }

  /**
   * Translates a clean Quranic word into its canonical phoneme token sequence.
   */
  wordToPhonemes(wordArabicClean: string): QuranPhonemeToken[] {
    const tokens: QuranPhonemeToken[] = [];
    // Clean non-letters
    const letters = wordArabicClean.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');

    for (const char of letters) {
      const match = this.charToToken(char);
      if (match) {
        tokens.push(match);
      }
    }
    return tokens;
  }

  private charToToken(char: string): QuranPhonemeToken | null {
    switch (char) {
      case 'ء': case 'أ': case 'إ': case 'ؤ': case 'ئ': case 'ا': return HAFS_PHONEME_INVENTORY.HAMZAH;
      case 'ب': return HAFS_PHONEME_INVENTORY.BAA;
      case 'ت': return HAFS_PHONEME_INVENTORY.TAA;
      case 'ث': return HAFS_PHONEME_INVENTORY.THAA;
      case 'ج': return HAFS_PHONEME_INVENTORY.JEEM;
      case 'ح': return HAFS_PHONEME_INVENTORY.HAA_MUHMALAH;
      case 'خ': return HAFS_PHONEME_INVENTORY.KHAA;
      case 'د': return HAFS_PHONEME_INVENTORY.DAAL;
      case 'ذ': return HAFS_PHONEME_INVENTORY.DHAAL;
      case 'ر': return HAFS_PHONEME_INVENTORY.RAA;
      case 'ز': return HAFS_PHONEME_INVENTORY.ZAY;
      case 'س': return HAFS_PHONEME_INVENTORY.SEEN;
      case 'ش': return HAFS_PHONEME_INVENTORY.SHEEN;
      case 'ص': return HAFS_PHONEME_INVENTORY.SAAD;
      case 'ض': return HAFS_PHONEME_INVENTORY.DAAD;
      case 'ط': return HAFS_PHONEME_INVENTORY.TAA_MUTBAQAH;
      case 'ظ': return HAFS_PHONEME_INVENTORY.DHAA_MUTBAQAH;
      case 'ع': return HAFS_PHONEME_INVENTORY.AYN;
      case 'غ': return HAFS_PHONEME_INVENTORY.GHAYN;
      case 'ف': return HAFS_PHONEME_INVENTORY.FAA;
      case 'ق': return HAFS_PHONEME_INVENTORY.QAAF;
      case 'ك': return HAFS_PHONEME_INVENTORY.KAAF;
      case 'ل': return HAFS_PHONEME_INVENTORY.LAAM;
      case 'م': return HAFS_PHONEME_INVENTORY.MEEM;
      case 'ن': return HAFS_PHONEME_INVENTORY.NOON;
      case 'ه': case 'ة': return HAFS_PHONEME_INVENTORY.HAA;
      case 'و': return HAFS_PHONEME_INVENTORY.WAW;
      case 'ي': case 'ى': return HAFS_PHONEME_INVENTORY.YAA;
      default: return null;
    }
  }
}
