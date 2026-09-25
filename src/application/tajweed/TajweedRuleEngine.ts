/**
 * @file TajweedRuleEngine.ts
 * @module application/tajweed
 * @description Deterministic Tajweed Rule Engine.
 * Operates purely deterministically using Unicode character analysis, diacritical patterns,
 * and canonical Tajweed knowledge base.
 * ZERO LLM calls - 100% auditable and reproducible.
 */

import {
  TajweedCategory,
  TajweedMatchResult,
  TajweedRuleDefinition,
} from '../../domain/tajweed/types.ts';
import { CANONICAL_TAJWEED_RULES } from '../../domain/tajweed/rulesCatalog.ts';
import { VerifiedTajweedKnowledgeBase } from '../../domain/tajweed/VerifiedTajweedKnowledgeBase.ts';
import { QuranWord, QuranAyah } from '../../domain/quran/types.ts';

// Arabic diacritics and Unicode constants
const FATHA = '\u064E';
const DAMMA = '\u064F';
const KASRA = '\u0650';
const SUKUN = '\u0652';
const SHADDA = '\u0651';
const FATHATAN = '\u064B';
const DAMMATAN = '\u064C';
const KASRATAN = '\u064D';
const DAGGER_ALIF = '\u0670';
const MADDAH = '\u0653';
const WASLA = '\u0671';
const SMALL_HIGH_MEEM = '\u06E2';

const QALQALAH_LETTERS = ['ق', 'ط', 'ب', 'ج', 'د'];
const ISTILA_LETTERS = ['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ'];
const HALQI_LETTERS = ['ء', 'ه', 'هـ', 'ع', 'ح', 'غ', 'خ'];
const YANMOO_LETTERS = ['ي', 'ن', 'م', 'و'];
const IKHFA_LETTERS = ['ص', 'ذ', 'ث', 'ك', 'ج', 'ش', 'ق', 'س', 'د', 'ط', 'ز', 'ف', 'ت', 'ض', 'ظ'];
const SHAMSIYYAH_LETTERS = ['ط', 'ث', 'ص', 'ر', 'ت', 'ض', 'ذ', 'ن', 'د', 'س', 'ظ', 'ز', 'ش', 'ل'];
const QAMARIYYAH_LETTERS = ['ء', 'أ', 'إ', 'ا', 'ب', 'غ', 'ح', 'ج', 'ك', 'و', 'خ', 'ف', 'ع', 'ق', 'ي', 'م', 'ه', 'هـ'];

export interface ITajweedRuleEngine {
  analyzeWord(word: QuranWord, nextWord?: QuranWord): TajweedMatchResult[];
  analyzeAyah(ayah: QuranAyah): TajweedMatchResult[];
  analyzeText(uthmaniText: string): TajweedMatchResult[];
  getRule(ruleId: string): TajweedRuleDefinition | undefined;
}

export class DeterministicTajweedRuleEngine implements ITajweedRuleEngine {
  private readonly kb = VerifiedTajweedKnowledgeBase.getInstance();

  getRule(ruleId: string): TajweedRuleDefinition | undefined {
    return this.kb.getRule(ruleId);
  }

  /**
   * Deterministically analyzes a Quranic word and cross-word boundaries
   */
  analyzeWord(word: QuranWord, nextWord?: QuranWord): TajweedMatchResult[] {
    const results: TajweedMatchResult[] = [];
    const text = word.textUthmani;
    const len = text.length;

    // 1. Detect Qalqalah (ق، ط، ب، ج، د with sukun or word-end pause)
    for (let i = 0; i < len; i++) {
      const char = text[i];
      if (QALQALAH_LETTERS.includes(char)) {
        const nextChar = text[i + 1];
        const isExplicitSukun = nextChar === SUKUN || nextChar === '\u06E1';

        // Check if this letter is the final root consonant of the word
        let isFinalConsonant = true;
        for (let j = i + 1; j < len; j++) {
          if (!/[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(text[j])) {
            isFinalConsonant = false;
            break;
          }
        }

        const isPause = Boolean(word.stopSign || !nextWord);

        if (isExplicitSukun || (isFinalConsonant && isPause)) {
          const ruleId = isFinalConsonant && isPause ? 'qalqalah_kubra' : 'qalqalah_sughra';
          const rule = CANONICAL_TAJWEED_RULES[ruleId];
          results.push({
            matchId: `${word.id}:qalqalah:${i}`,
            ruleId,
            ruleNameArabic: rule.arabicName,
            category: TajweedCategory.QALQALAH,
            surahNumber: word.surahNumber,
            ayahNumber: word.ayahNumber,
            wordIndex: word.wordIndexInAyah,
            charStartIndex: i,
            charEndIndex: i + 1,
            matchedText: char,
            durationHarakah: 0,
            descriptionArabic: rule.definitionArabic,
          });
        }
      }
    }

    // 2. Detect Ghunnah Mushaddadah on Noon & Meem (نّ، مّ)
    for (let i = 0; i < len; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if ((char === 'ن' || char === 'م') && nextChar === SHADDA) {
        const rule = CANONICAL_TAJWEED_RULES['ghunnah_mushaddadah'];
        results.push({
          matchId: `${word.id}:ghunnah:${i}`,
          ruleId: 'ghunnah_mushaddadah',
          ruleNameArabic: rule.arabicName,
          category: TajweedCategory.GHUNNAH,
          surahNumber: word.surahNumber,
          ayahNumber: word.ayahNumber,
          wordIndex: word.wordIndexInAyah,
          charStartIndex: i,
          charEndIndex: i + 2,
          matchedText: text.substring(i, i + 2),
          durationHarakah: 2,
          descriptionArabic: rule.definitionArabic,
        });
      }
    }

    // 3. Detect Madd with Maddah mark (~ or \u0653)
    for (let i = 0; i < len; i++) {
      if (text[i] === MADDAH) {
        // Look back for the madd letter (alif, waw, yaa, dagger alif)
        const prevChar = text[i - 1];
        // Check if next letter is hamzah in same word (Madd Muttasil)
        const hasHamzahAfterInSameWord = text.includes('ء') || text.includes('أ') || text.includes('إ') || text.includes('ئ') || text.includes('ؤ');
        
        let ruleId = 'madd_muttasil';
        let rule = CANONICAL_TAJWEED_RULES[ruleId];

        // Check for Madd Lazim Kalimi (followed by shaddah)
        const nextTwo = text.substring(i + 1);
        if (nextTwo.includes(SHADDA)) {
          ruleId = 'madd_lazim_kalimi_muthaqqal';
          rule = CANONICAL_TAJWEED_RULES[ruleId];
        } else if (!hasHamzahAfterInSameWord && nextWord && (nextWord.textUthmani.startsWith('ء') || nextWord.textUthmani.startsWith('أ') || nextWord.textUthmani.startsWith('إ'))) {
          ruleId = 'madd_munfasil';
          rule = CANONICAL_TAJWEED_RULES[ruleId];
        }

        results.push({
          matchId: `${word.id}:madd:${i}`,
          ruleId,
          ruleNameArabic: rule.arabicName,
          category: TajweedCategory.MADD,
          surahNumber: word.surahNumber,
          ayahNumber: word.ayahNumber,
          wordIndex: word.wordIndexInAyah,
          charStartIndex: Math.max(0, i - 1),
          charEndIndex: i + 1,
          matchedText: `${prevChar || ''}${MADDAH}`,
          durationHarakah: rule.harakahDuration?.standardCounts || 4,
          descriptionArabic: rule.definitionArabic,
        });
      }
    }

    // 4. Detect Lam Shamsiyyah and Qamariyyah in words starting with Alif-Lam
    if (text.startsWith('ٱل') || text.startsWith('ال') || text.startsWith('ل')) {
      const lamIndex = text.indexOf('ل');
      let targetCharIndex = lamIndex + 1;
      // Skip any diacritics on the 'ل' itself (e.g. sukun \u0652)
      while (targetCharIndex < len && /[\u064B-\u065F\u0670\u06D6-\u06ED]/.test(text[targetCharIndex])) {
        targetCharIndex++;
      }

      if (targetCharIndex < len) {
        const testChar = text[targetCharIndex];
        const hasShaddahNext =
          text[targetCharIndex + 1] === SHADDA ||
          (targetCharIndex + 2 < len && text[targetCharIndex + 2] === SHADDA);

        if (hasShaddahNext || SHAMSIYYAH_LETTERS.includes(testChar)) {
          const rule = CANONICAL_TAJWEED_RULES['lam_shamsiyyah'];
          results.push({
            matchId: `${word.id}:lam_shamsiyyah`,
            ruleId: 'lam_shamsiyyah',
            ruleNameArabic: rule.arabicName,
            category: TajweedCategory.LAM_SAKINAH,
            surahNumber: word.surahNumber,
            ayahNumber: word.ayahNumber,
            wordIndex: word.wordIndexInAyah,
            charStartIndex: 0,
            charEndIndex: targetCharIndex,
            matchedText: text.substring(0, targetCharIndex),
            durationHarakah: 0,
            descriptionArabic: rule.definitionArabic,
          });
        } else if (QAMARIYYAH_LETTERS.includes(testChar)) {
          const rule = CANONICAL_TAJWEED_RULES['lam_qamariyyah'];
          results.push({
            matchId: `${word.id}:lam_qamariyyah`,
            ruleId: 'lam_qamariyyah',
            ruleNameArabic: rule.arabicName,
            category: TajweedCategory.LAM_SAKINAH,
            surahNumber: word.surahNumber,
            ayahNumber: word.ayahNumber,
            wordIndex: word.wordIndexInAyah,
            charStartIndex: 0,
            charEndIndex: targetCharIndex,
            matchedText: text.substring(0, targetCharIndex),
            durationHarakah: 0,
            descriptionArabic: rule.definitionArabic,
          });
        }
      }
    }

    // 5. Cross-Word Rule Detection (Noon Sakinah / Tanween / Meem Sakinah to nextWord)
    if (nextWord) {
      const nextFirstClean = nextWord.textSimple.replace(/^ٱ/, '').replace(/^ال/, '');
      const firstLetterOfNext = nextWord.textUthmani.replace(/^[ٱأإء]/, '')[0] || nextWord.textUthmani[0];
      const lastChar = text[text.length - 1];
      const hasTanween = text.includes(FATHATAN) || text.includes(DAMMATAN) || text.includes(KASRATAN);
      const hasNoonSakinahEnd = (lastChar === 'ن' && text[text.length - 2] === SUKUN) || (lastChar === SUKUN && text[text.length - 2] === 'ن') || lastChar === 'ن';

      if (hasTanween || hasNoonSakinahEnd) {
        if (firstLetterOfNext === 'ب' || text.includes(SMALL_HIGH_MEEM)) {
          // Iqlab
          const rule = CANONICAL_TAJWEED_RULES['noon_iqlab'];
          results.push({
            matchId: `${word.id}:iqlab_next`,
            ruleId: 'noon_iqlab',
            ruleNameArabic: rule.arabicName,
            category: TajweedCategory.NOON_SAKINAH_TANWEEN,
            surahNumber: word.surahNumber,
            ayahNumber: word.ayahNumber,
            wordIndex: word.wordIndexInAyah,
            charStartIndex: text.length - 2,
            charEndIndex: text.length,
            matchedText: 'نْ/تنويـن + ب',
            durationHarakah: 2,
            descriptionArabic: rule.definitionArabic,
          });
        } else if (YANMOO_LETTERS.includes(firstLetterOfNext)) {
          // Idgham bi ghunnah
          const rule = CANONICAL_TAJWEED_RULES['noon_idgham_bi_ghunnah'];
          results.push({
            matchId: `${word.id}:idgham_ghunnah_next`,
            ruleId: 'noon_idgham_bi_ghunnah',
            ruleNameArabic: rule.arabicName,
            category: TajweedCategory.NOON_SAKINAH_TANWEEN,
            surahNumber: word.surahNumber,
            ayahNumber: word.ayahNumber,
            wordIndex: word.wordIndexInAyah,
            charStartIndex: text.length - 2,
            charEndIndex: text.length,
            matchedText: `نْ/تنوين + ${firstLetterOfNext}`,
            durationHarakah: 2,
            descriptionArabic: rule.definitionArabic,
          });
        } else if (firstLetterOfNext === 'ل' || firstLetterOfNext === 'ر') {
          // Idgham bila ghunnah
          const rule = CANONICAL_TAJWEED_RULES['noon_idgham_bila_ghunnah'];
          results.push({
            matchId: `${word.id}:idgham_bila_ghunnah_next`,
            ruleId: 'noon_idgham_bila_ghunnah',
            ruleNameArabic: rule.arabicName,
            category: TajweedCategory.NOON_SAKINAH_TANWEEN,
            surahNumber: word.surahNumber,
            ayahNumber: word.ayahNumber,
            wordIndex: word.wordIndexInAyah,
            charStartIndex: text.length - 2,
            charEndIndex: text.length,
            matchedText: `نْ/تنوين + ${firstLetterOfNext}`,
            durationHarakah: 0,
            descriptionArabic: rule.definitionArabic,
          });
        } else if (HALQI_LETTERS.includes(firstLetterOfNext)) {
          // Izhar Halqi
          const rule = CANONICAL_TAJWEED_RULES['noon_izhar_halqi'];
          results.push({
            matchId: `${word.id}:izhar_halqi_next`,
            ruleId: 'noon_izhar_halqi',
            ruleNameArabic: rule.arabicName,
            category: TajweedCategory.NOON_SAKINAH_TANWEEN,
            surahNumber: word.surahNumber,
            ayahNumber: word.ayahNumber,
            wordIndex: word.wordIndexInAyah,
            charStartIndex: text.length - 2,
            charEndIndex: text.length,
            matchedText: `نْ/تنوين + ${firstLetterOfNext}`,
            durationHarakah: 0,
            descriptionArabic: rule.definitionArabic,
          });
        } else if (IKHFA_LETTERS.includes(firstLetterOfNext)) {
          // Ikhfa Haqiqi
          const rule = CANONICAL_TAJWEED_RULES['noon_ikhfa_haqiqi'];
          results.push({
            matchId: `${word.id}:ikhfa_haqiqi_next`,
            ruleId: 'noon_ikhfa_haqiqi',
            ruleNameArabic: rule.arabicName,
            category: TajweedCategory.NOON_SAKINAH_TANWEEN,
            surahNumber: word.surahNumber,
            ayahNumber: word.ayahNumber,
            wordIndex: word.wordIndexInAyah,
            charStartIndex: text.length - 2,
            charEndIndex: text.length,
            matchedText: `نْ/تنوين + ${firstLetterOfNext}`,
            durationHarakah: 2,
            descriptionArabic: rule.definitionArabic,
          });
        }
      }
    }

    return results;
  }

  /**
   * Deterministically analyzes an entire Ayah
   */
  analyzeAyah(ayah: QuranAyah): TajweedMatchResult[] {
    const results: TajweedMatchResult[] = [];
    const words = ayah.words;

    for (let i = 0; i < words.length; i++) {
      const current = words[i];
      const next = words[i + 1];
      const wordMatches = this.analyzeWord(current, next);
      results.push(...wordMatches);
    }

    return results;
  }

  /**
   * Deterministic arbitrary text Tajweed inspection
   */
  analyzeText(uthmaniText: string): TajweedMatchResult[] {
    const words = uthmaniText.trim().split(/\s+/).filter(Boolean);
    const mockWords: QuranWord[] = words.map((w, idx) => ({
      id: `text:${idx + 1}`,
      surahNumber: 0,
      ayahNumber: 0,
      wordIndexInAyah: idx + 1,
      globalWordIndex: idx + 1,
      textUthmani: w,
      displayText: w,
      alignmentText: w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, ''),
      textSimple: w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, ''),
      pageNumber: 1,
      phoneticUnits: [],
      stopSign: (idx === words.length - 1 ? 'PAUSE' : undefined) as any,
      tajweedAnnotations: [],
    }));

    const results: TajweedMatchResult[] = [];
    for (let i = 0; i < mockWords.length; i++) {
      results.push(...this.analyzeWord(mockWords[i], mockWords[i + 1]));
    }
    return results;
  }
}
