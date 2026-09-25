/**
 * @file types.ts
 * @module domain/tajweed
 * @description Comprehensive, deterministic Tajweed Knowledge Base domain models.
 * Zero-LLM guarantee: All Tajweed rules are mathematically deterministic, citing classical
 * canonical authorities (Tuhfat al-Atfal and Al-Muqaddimah al-Jazariyyah).
 */

export enum TajweedCategory {
  NOON_SAKINAH_TANWEEN = 'NOON_SAKINAH_TANWEEN',   // أحكام النون الساكنة والتنوين
  MEEM_SAKINAH = 'MEEM_SAKINAH',                   // أحكام الميم الساكنة
  MADD = 'MADD',                                   // أحكام المدود
  QALQALAH = 'QALQALAH',                           // أحكام القلقلة
  GHUNNAH = 'GHUNNAH',                             // أحكام الغنة
  TAFKHEEM_TARQEEQ = 'TAFKHEEM_TARQEEQ',           // التفخيم والترقيق
  IDGHAM_GENERAL = 'IDGHAM_GENERAL',               // إدغام المتماثلين والمتقاربين والمتجانسين
  LAM_SAKINAH = 'LAM_SAKINAH',                     // أحكام اللامات الساكنة
}

export enum MaddSubtype {
  TABII = 'TABII',                                 // مد طبيعي أصلي (حركتان)
  MUTTASIL = 'MUTTASIL',                           // مد واجب متصل (4-5 حركات)
  MUNFASIL = 'MUNFASIL',                           // مد جائز منفصل (4-5 حركات من طريق الشاطبية)
  LAZIM_KALIMI_MUTHAQQAL = 'LAZIM_KALIMI_MUTHAQQAL', // مد لازم كلمي مثقل (6 حركات)
  LAZIM_KALIMI_MUKHAFFAF = 'LAZIM_KALIMI_MUKHAFFAF', // مد لازم كلمي مخفف (6 حركات)
  LAZIM_HARFI_MUTHAQQAL = 'LAZIM_HARFI_MUTHAQQAL',   // مد لازم حرفي مثقل (6 حركات)
  LAZIM_HARFI_MUKHAFFAF = 'LAZIM_HARFI_MUKHAFFAF',   // مد لازم حرفي مخفف (6 حركات)
  ARIDH_LIS_SUKUN = 'ARIDH_LIS_SUKUN',             // مد عارض للسكون (2 أو 4 أو 6 حركات)
  LEEN = 'LEEN',                                   // مد اللين (2 أو 4 أو 6 حركات عند الوقف)
  BADAL = 'BADAL',                                 // مد البدل (حركتان لحفص)
  SILAH_SUGHRA = 'SILAH_SUGHRA',                   // مد الصلة الصغرى (حركتان)
  SILAH_KUBRA = 'SILAH_KUBRA',                     // مد الصلة الكبرى (4-5 حركات)
}

export enum QalqalahDegree {
  SUGHRA = 'SUGHRA',                               // صغرى (في وسط الكلمة أو وسط الكلام)
  KUBRA = 'KUBRA',                                 // كبرى (عند الوقف على حرف غير مشدد)
  AKBAR = 'AKBAR',                                 // أكبر (عند الوقف على حرف مشدد)
}

export interface HarakahDuration {
  minCounts: number;
  maxCounts: number;
  standardCounts: number;
  unitArabic: 'حركتان' | 'أربع حركات' | 'أربع أو خمس حركات' | 'ست حركات' | 'حركتان أو أربع أو ست حركات';
}

export interface ClassicalPoemCitation {
  poemName: 'تحفة الأطفال للجمزوري' | 'المقدمة الجزرية لابن الجزري';
  chapterNameArabic: string;
  verseArabic: string;                             // بيت الشعر المستشهد به
}

export interface TajweedRuleDefinition {
  ruleId: string;
  category: TajweedCategory;
  arabicName: string;
  englishName: string;
  canonicalRuleName?: string;
  arabicRuleName?: string;
  definition?: string;
  subType?: string;
  definitionArabic: string;
  lettersArabic: string[];                         // الحروف التي يقع عندها الحكم
  affectedLetters?: string[];
  affectedPhonemes?: string[];
  triggeringCondition?: {
    description: string;
    previousContext?: string[];
    currentContext?: string[];
    nextContext?: string[];
  };
  positionalRequirements?: string;
  exceptions?: string[];
  quranicApplicability?: string;
  sourceReference?: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'PROVISIONAL';
  knowledgeBaseVersion: string;
  evidenceProvenance?: string;
  ruleStatus: 'ACTIVE' | 'NOT_ACTIVE' | 'NOT_VERIFIED';
  harakahDuration?: HarakahDuration;
  requiresGhunnah: boolean;
  ghunnahDurationHarakah?: number;
  classicalCitation?: ClassicalPoemCitation;
  pedagogicalTipArabic: string;
  commonMistakeArabic: string;
  isMandatoryInHafs: boolean;
}

export type TajweedDecisionStatus = 
  | 'RULE_APPLICABLE'
  | 'SUPPORTED'
  | 'NOT_SUPPORTED'
  | 'INCONCLUSIVE'
  | 'NOT_VERIFIED';

export interface TajweedEvidenceProvenance {
  quranDatasetVersion: string;
  quranDatasetHash: string;
  tajweedKbVersion: string;
  tajweedKbHash: string;
  ruleId: string;
  sourceReference: string;
  sourceVerificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'PROVISIONAL';
  evidenceId: string;
  modelVersion: string;
  alignmentVersion: string;
  preprocessingVersion: string;
  timestamp: string;
  decisionPath: string;
}

export interface TajweedRuleEvidence {
  evidenceId: string;
  ayahId: string;
  wordIndex: number;
  phonemeIndex: number;

  ruleId: string;
  ruleName: string;
  arabicRuleName: string;

  ruleStatus: 'ACTIVE' | 'NOT_ACTIVE' | 'NOT_VERIFIED';

  expectedCondition: string;
  observedEvidence: string;

  acousticConfidence: number;
  alignmentConfidence: number;
  applicabilityConfidence: number;

  startTime?: number;
  endTime?: number;

  sourceReference: string;
  knowledgeBaseVersion: string;

  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'PROVISIONAL';

  decisionStatus: TajweedDecisionStatus;

  provenance: TajweedEvidenceProvenance;

  userFacingExplanationArabic: string;
  userFacingExplanationEnglish: string;
}

export interface QuranLocation {
  surah: number;
  ayah: number;
  wordIndex: number;          // 1-based index within Ayah
  phonemeIndex: number;       // 0-based index within Ayah
  ayahId: string;             // e.g. "1:2"
  riwayah?: string;           // Defaults to 'HAFS_AN_ASIM'
}

export interface CanonicalWordContext {
  currentWordTextUthmani: string;
  previousWordTextUthmani?: string;
  nextWordTextUthmani?: string;
  isWordFinalConsonant?: boolean;
  isWordInitialConsonant?: boolean;
  isEndOfAyahOrPause?: boolean;
}

export interface CanonicalPhonemeContext {
  currentPhoneme: string;
  previousPhoneme?: string;
  nextPhoneme?: string;
  surroundingTokens?: string[];
  charStartIndex?: number;
  charEndIndex?: number;
}

export interface TajweedKnowledgeBaseCertificate {
  authorityName: string;
  kbVersion: string;
  riwayah: string;
  tareeq: string;
  canonicalSources: string[];
  verifiedBy: string;
  verifiedAt: string;
  checksumSha256: string;
  totalVerifiedRules: number;
}

export class TajweedKnowledgeBaseIntegrityError extends Error {
  constructor(message: string, public readonly expectedHash: string, public readonly observedHash: string) {
    super(message);
    this.name = 'TajweedKnowledgeBaseIntegrityError';
  }
}

export class RiwayahNotActivatedError extends Error {
  constructor(message: string, public readonly requestedRiwayah: string) {
    super(message);
    this.name = 'RiwayahNotActivatedError';
  }
}

export class RuleNotVerifiedError extends Error {
  constructor(message: string, public readonly ruleId: string) {
    super(message);
    this.name = 'RuleNotVerifiedError';
  }
}

export class RuleEvaluationBlockedError extends Error {
  constructor(message: string, public readonly reasonCode: string) {
    super(message);
    this.name = 'RuleEvaluationBlockedError';
  }
}

export interface TajweedMatchResult {
  matchId: string;
  ruleId: string;
  ruleNameArabic: string;
  category: TajweedCategory;
  surahNumber: number;
  ayahNumber: number;
  wordIndex: number;
  charStartIndex: number;
  charEndIndex: number;
  matchedText: string;
  durationHarakah?: number;
  descriptionArabic: string;
  pedagogicalDescriptionArabic?: string;
}

export interface ITajweedRuleEngine {
  analyzeWord(word: any, nextWord?: any): TajweedMatchResult[];
  analyzeAyah(ayah: any): TajweedMatchResult[];
  analyzeText(uthmaniText: string): TajweedMatchResult[];
  getRule(ruleId: string): TajweedRuleDefinition | undefined;
}
