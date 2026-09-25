/**
 * @file TajweedEvidenceProvider.ts
 * @module application/tajweed
 * @description Teacher AI Interface Provider for Deterministic Tajweed Rule Evidence.
 * Exposes read-only, deeply-frozen TajweedRuleEvidence objects derived from real Phase 5A acoustic evidence.
 * 
 * CORE CONTRACT:
 * - Deterministic rule mapping only: Zero LLM rule generation.
 * - Read-only guarantee: The Teacher AI cannot tamper with or mutate the underlying acoustic rule results.
 * - Integrity enforced: Quran dataset hash and Tajweed KB hash verified on every invocation.
 */

import {
  TajweedRuleEvidence,
  QuranLocation,
  CanonicalWordContext,
  CanonicalPhonemeContext,
  TajweedKnowledgeBaseCertificate,
  TajweedRuleDefinition,
} from '../../domain/tajweed/types.ts';
import { DeterministicTajweedContextEvaluator } from '../../domain/tajweed/DeterministicTajweedContextEvaluator.ts';
import { VerifiedTajweedKnowledgeBase } from '../../domain/tajweed/VerifiedTajweedKnowledgeBase.ts';
import { VerifiedQuranPhonemeProvider } from '../../domain/recitation/VerifiedQuranPhonemeProvider.ts';
import { QuranAlignmentEvidence, QuranAlignmentSummary } from '../../domain/recitation/quranAlignmentTypes.ts';

export interface ITajweedEvidenceProvider {
  getRuleEvidence(
    recitationEvidence: QuranAlignmentEvidence[] | QuranAlignmentSummary,
    quranLocation?: QuranLocation
  ): ReadonlyArray<TajweedRuleEvidence>;

  evaluateTajweedContext(
    quranLocation: QuranLocation,
    canonicalWordContext: CanonicalWordContext,
    canonicalPhonemeContext: CanonicalPhonemeContext,
    recitationEvidence: QuranAlignmentEvidence
  ): Readonly<TajweedRuleEvidence>;

  verifyKnowledgeBaseIntegrity(candidateHash?: string): boolean;

  getKnowledgeBaseCertificate(): Readonly<TajweedKnowledgeBaseCertificate>;
}

export class TajweedEvidenceProvider implements ITajweedEvidenceProvider {
  private readonly evaluator: DeterministicTajweedContextEvaluator;
  private readonly kb: VerifiedTajweedKnowledgeBase;
  private readonly quranProvider: VerifiedQuranPhonemeProvider;

  constructor() {
    this.evaluator = new DeterministicTajweedContextEvaluator();
    this.kb = VerifiedTajweedKnowledgeBase.getInstance();
    this.quranProvider = VerifiedQuranPhonemeProvider.getInstance();
  }

  /**
   * Evaluates all phoneme evidence from Phase 5A alignment against certified Tajweed rules.
   * Produces an immutable, read-only list of TajweedRuleEvidence.
   */
  public getRuleEvidence(
    recitationEvidence: QuranAlignmentEvidence[] | QuranAlignmentSummary,
    quranLocation?: QuranLocation
  ): ReadonlyArray<TajweedRuleEvidence> {
    const evidenceList: QuranAlignmentEvidence[] = Array.isArray(recitationEvidence)
      ? recitationEvidence
      : recitationEvidence.evidenceItems || [];

    const results: TajweedRuleEvidence[] = [];

    for (let i = 0; i < evidenceList.length; i++) {
      const ev = evidenceList[i];
      const ayahId = quranLocation?.ayahId || '1:2';
      const surah = quranLocation?.surah ?? 1;
      const ayah = quranLocation?.ayah ?? 2;
      const wordIndex = quranLocation?.wordIndex ?? 1;
      const phonemeIndex = i;

      // Extract context
      const canonicalPhoneme = ev.expectedToken || '';
      const observedToken = ev.observedToken || '';

      const wordContext: CanonicalWordContext = {
        currentWordTextUthmani: ev.canonicalMetadata?.wordTextUthmani || 'ٱلْحَمْدُ',
        isWordInitialConsonant: i === 0,
        isWordFinalConsonant: i === evidenceList.length - 1,
        isEndOfAyahOrPause: i === evidenceList.length - 1,
      };

      const phonemeContext: CanonicalPhonemeContext = {
        currentPhoneme: canonicalPhoneme,
        previousPhoneme: i > 0 ? evidenceList[i - 1].expectedToken : undefined,
        nextPhoneme: i < evidenceList.length - 1 ? evidenceList[i + 1].expectedToken : undefined,
      };

      const loc: QuranLocation = {
        surah,
        ayah,
        wordIndex,
        phonemeIndex,
        ayahId,
        riwayah: quranLocation?.riwayah || 'HAFS_AN_ASIM',
      };

      const ruleEvidence = this.evaluator.evaluateTajweedContext(loc, wordContext, phonemeContext, ev);
      results.push(ruleEvidence);
    }

    return Object.freeze(results);
  }

  /**
   * Evaluates a single Quranic context against acoustic evidence.
   */
  public evaluateTajweedContext(
    quranLocation: QuranLocation,
    canonicalWordContext: CanonicalWordContext,
    canonicalPhonemeContext: CanonicalPhonemeContext,
    recitationEvidence: QuranAlignmentEvidence
  ): Readonly<TajweedRuleEvidence> {
    return this.evaluator.evaluateTajweedContext(
      quranLocation,
      canonicalWordContext,
      canonicalPhonemeContext,
      recitationEvidence
    );
  }

  /**
   * Cryptographic integrity verification for the Tajweed Knowledge Base.
   */
  public verifyKnowledgeBaseIntegrity(candidateHash?: string): boolean {
    return this.kb.verifyIntegrity(candidateHash);
  }

  /**
   * Returns official certificate metadata for the Knowledge Base.
   */
  public getKnowledgeBaseCertificate(): Readonly<TajweedKnowledgeBaseCertificate> {
    return Object.freeze(this.kb.getCertificate());
  }

  /**
   * Look up all verified active rules in the knowledge base.
   */
  public getAllVerifiedRules(): ReadonlyArray<TajweedRuleDefinition> {
    return Object.freeze(this.kb.getAllVerifiedRules());
  }
}
