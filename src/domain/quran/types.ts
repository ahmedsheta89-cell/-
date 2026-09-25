/**
 * @file types.ts
 * @module domain/quran
 * @description Core Domain types and data contracts for the Holy Quran.
 * All religious data structures must be strictly typed, verifiable, and immutable.
 */

export enum RiwayahType {
  HAFS_AN_ASIM = 'HAFS_AN_ASIM',
  WARSH_AN_NAFI = 'WARSH_AN_NAFI',
  QALOON_AN_NAFI = 'QALOON_AN_NAFI',
  AL_DOORI_AN_ABI_AMR = 'AL_DOORI_AN_ABI_AMR',
}

export enum RevelationType {
  MECCAN = 'MECCAN',
  MEDINAN = 'MEDINAN',
}

export enum StopSignType {
  MANDATORY_STOP = 'MANDATORY_STOP',           // مـ : الوقف اللازم
  FORBIDDEN_STOP = 'FORBIDDEN_STOP',           // لا : الوقف الممنوع
  PERMISSIBLE_PREFER_STOP = 'PERMISSIBLE_PREFER_STOP', // قلى : الوقف أولى
  PERMISSIBLE_PREFER_CONTINUE = 'PERMISSIBLE_PREFER_CONTINUE', // صلى : الوصل أولى
  EQUAL_PERMISSIBLE = 'EQUAL_PERMISSIBLE',     // ج : وقف جائز مستوي الطرفين
  EMBRACE_STOP = 'EMBRACE_STOP',               // ∴ : تعانق الوقف (إذا وقف على أحدهما لا يقف على الآخر)
  NONE = 'NONE',
}

export enum SajdahType {
  OBLIGATORY = 'OBLIGATORY',
  RECOMMENDED = 'RECOMMENDED',
  NONE = 'NONE',
}

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  DISPUTED = 'DISPUTED',
  REJECTED = 'REJECTED',
}

/**
 * Audit stamp certifying authenticity of religious data
 */
export interface ContentVerificationMetadata {
  sourceAuthority: string;         // e.g. "King Fahd Complex for Printing the Holy Quran"
  editionVersion: string;          // e.g. "v1.4.0-uthmani-hafs"
  riwayah: RiwayahType;
  tareeq: string;                  // e.g. "Tareeq Ash-Shatibiyyah"
  verificationStatus: VerificationStatus;
  verifiedBy: string;              // Name or ID of qualified certifying scholar
  verifiedAt: string;              // ISO Timestamp
  checksumSha256: string;          // SHA256 integrity hash
}

/**
 * Phonetic or character-level unit inside a Quranic word
 */
export interface PhoneticUnit {
  index: number;
  char: string;
  transliterationCode?: string;
  isVowel: boolean;
  harakah?: string;                // Fathah, Dammah, Kasrah, Sukun, Shaddah, Tanween
  tajweedRuleId?: string;          // If letter participates in a tajweed rule (e.g. Qalqalah, Ghunnah)
}

/**
 * Word in the Quran with precise structural metadata and immutable multi-representation
 */
export interface QuranWord {
  id: string;                      // Format: "surah:ayah:wordIndex" (e.g. "1:1:1")
  surahNumber: number;
  ayahNumber: number;
  wordIndexInAyah: number;
  globalWordIndex: number;
  textUthmani: string;             // 1. Official Uthmani script with full diacritics, sukun, waslah, dagger alif
  displayText: string;             // 2. High-legibility rendered typography for high-res screens
  alignmentText: string;           // 3. Phonetic / normalized token strictly for speech alignment without altering script
  textSimple: string;              // Backward compatibility alias for search
  textClean?: string;              // Clean normalized phonetic text without diacritics
  pageNumber: number;
  phoneticUnits: PhoneticUnit[];
  stopSign: StopSignType;
  tajweedAnnotations: TajweedAnnotation[];
}

/**
 * Tajweed Annotation on a word or letter segment
 */
export interface TajweedAnnotation {
  id: string;
  ruleCategory: string;            // MADD, GHUNNAH, QALQALAH, IDGHAM, etc.
  ruleNameArabic: string;          // مد متصل، إخفاء حقيقي، قلقلة صغرى...
  startCharIndex: number;
  endCharIndex: number;
  durationHarakah?: number;        // Duration in counts (e.g. 2, 4, 6 harakat for Madd)
  description: string;
}

/**
 * Ayah (Verse) representation with cryptographic integrity hash
 */
export interface QuranAyah {
  id: string;                      // Format: "surah:ayah" (e.g. "1:1")
  surahNumber: number;
  ayahNumber: number;
  riwayah?: RiwayahType;
  globalAyahIndex: number;         // 1 to 6236 in Hafs
  textUthmani: string;             // Primary immutable Uthmani text
  displayText: string;             // Rendered display text
  alignmentText: string;           // Normalized alignment representation
  textSimple: string;              // Simplified search text
  pageNumber: number;
  juzNumber: number;
  hizbNumber: number;
  rubNumber: number;
  sajdah: SajdahType;
  words: QuranWord[];
  checksumSha256?: string;         // Cryptographic SHA-256 for this exact Ayah text & sequence
  verification: ContentVerificationMetadata;
}

/**
 * Surah (Chapter) representation with Basmalah and recitation rules
 */
export interface QuranSurah {
  number: number;                  // 1 to 114
  nameArabic: string;              // الفاتحة، البقرة، آل عمران...
  nameEnglish: string;             // Al-Fatihah, Al-Baqarah...
  nameTransliteration: string;
  revelationType: RevelationType;
  totalAyahs: number;
  startPage: number;
  endPage: number;
  juzStart: number;
  juzEnd: number;
  hasNumberedBasmalah: boolean;    // true only for Surah 1 (Al-Fatihah)
  hasBasmalahPrefix: boolean;      // true for Surahs 2-8, 10-114; false for Surah 9 (At-Tawbah)
  sajdahAyahs: number[];           // Array of ayah numbers containing sajdah in this surah
  verification: ContentVerificationMetadata;
}

/**
 * Official Quran Source Registry Record
 */
export enum QuranSourceAuthorityType {
  PRINTED_COMPLEX = 'PRINTED_COMPLEX',                 // King Fahd Complex (المجمع)
  OFFICIAL_GOVERNMENT_DIGITAL = 'OFFICIAL_GOVERNMENT_DIGITAL', // Awqaf or Ministry certified digital copy
  SCHOLARLY_ENCODED = 'SCHOLARLY_ENCODED',             // Scholarly digital encoding (e.g. Tanzil verified Hafs)
}

export interface QuranSourceRecord {
  sourceId: string;
  authorityName: string;           // e.g. "مجمع الملك فهد لطباعة المصحف الشريف"
  authorityType: QuranSourceAuthorityType;
  licenseType: string;             // e.g. "Official Open Scholarly / Public Religious Domain"
  editionName: string;             // e.g. "مصحف المدينة النبوية - الطبعة المحققة"
  riwayah: RiwayahType;
  tareeq: string;                  // e.g. "طريق الشاطبية"
  publicationYearHijri: number;
  publicationYearGregorian: number;
  mushafLayout: {
    totalSurahs: 114;
    totalPages: 604;
    linesPerPage: 15;
  };
  verificationStatus: VerificationStatus;
  originUrlOrCitation: string;
}

/**
 * Dataset Versioning for verified Quranic corpus
 */
export interface QuranDatasetVersion {
  versionId: string;
  semver: string;                  // e.g. "1.0.0-hafs.verified"
  releasedAt: string;              // ISO timestamp
  changelogArabic: string;
  totalSurahs: 114;
  totalAyahs: 6236;
  totalWordsCount: number;
  totalLettersCount: number;
  datasetChecksumSha256: string;
  isImmutable: boolean;
  status: VerificationStatus;
  certifyingScholars: Array<{
    reviewerId: string;
    fullName: string;
    ijazahDescription: string;
    institutionAffiliation: string;
  }>;
  parentVersionId?: string;
}

/**
 * Surah-level integrity manifest record
 */
export interface SurahIntegrityRecord {
  surahNumber: number;
  nameArabic: string;
  ayahsCount: number;
  surahSha256: string;
}

/**
 * Comprehensive Integrity Manifest
 */
export interface IntegrityManifest {
  datasetVersion: string;
  manifestSha256: string;
  totalSurahs: 114;
  totalAyahs: 6236;
  surahManifest: SurahIntegrityRecord[];
  verifiedTimestamp: string;
  sourceAuthority: string;
}

/**
 * Complete Quran Metadata manifest contract
 */
export interface QuranEditionManifest {
  editionId: string;
  name: string;
  riwayah: RiwayahType;
  tareeq: string;
  totalSurahs: 114;
  totalAyahs: number;              // 6236 for Hafs
  totalPages: 604;
  totalJuz: 30;
  totalHizb: 60;
  totalRub: 240;
  verification: ContentVerificationMetadata;
}
