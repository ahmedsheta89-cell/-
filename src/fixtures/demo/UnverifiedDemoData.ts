/**
 * @file UnverifiedDemoData.ts
 * @module fixtures/demo
 * @description Isolated fixtures for unverified or synthetic test data.
 * STRICT ARCHITECTURAL RULE:
 * This data is marked with VerificationStatus.PENDING_REVIEW or DISPUTED.
 * It is prohibited from production recitation sessions and must be rejected
 * when `verifiedOnly: true`.
 */

import {
  QuranSurah,
  QuranAyah,
  RevelationType,
  SajdahType,
  VerificationStatus,
  RiwayahType,
} from '../../domain/quran/types.ts';

export const UNVERIFIED_DEMO_CERTIFICATE = {
  sourceAuthority: 'بيانات تجريبية غير معتمدة - للاختبار البرمجي فقط (SYNTHETIC_TEST_FIXTURE)',
  editionVersion: 'v0.0.1-synthetic-unverified',
  riwayah: RiwayahType.HAFS_AN_ASIM,
  tareeq: 'غير محدد',
  verificationStatus: VerificationStatus.PENDING_REVIEW,
  verifiedBy: 'UNASSIGNED_NO_SCHOLAR',
  verifiedAt: '1970-01-01T00:00:00.000Z',
  checksumSha256: '0000000000000000000000000000000000000000000000000000000000000000',
};

export const UNVERIFIED_SURAH_STUB: QuranSurah = {
  number: 999,
  nameArabic: 'سورة اختبارية وهمية',
  nameEnglish: 'Mock Test Surah',
  nameTransliteration: 'Surah Ikhtibar',
  revelationType: RevelationType.MECCAN,
  totalAyahs: 1,
  startPage: 999,
  endPage: 999,
  juzStart: 30,
  juzEnd: 30,
  hasNumberedBasmalah: false,
  hasBasmalahPrefix: false,
  sajdahAyahs: [],
  verification: UNVERIFIED_DEMO_CERTIFICATE,
};

export const UNVERIFIED_AYAH_STUB: QuranAyah = {
  id: '999:1',
  surahNumber: 999,
  ayahNumber: 1,
  globalAyahIndex: 9999,
  textUthmani: 'نَصٌّ تَجْرِيبِيٌّ غَيْرُ مُوَثَّقٍ لِأَغْرَاضِ الْفَحْصِ الْأَمْنِيِّ',
  displayText: 'نص تجريبي غير موثق لأغراض الفحص الأمني',
  alignmentText: 'نص تجريبي غير موثق لاغراض الفحص الامني',
  textSimple: 'نص تجريبي غير موثق لاغراض الفحص الامني',
  pageNumber: 999,
  juzNumber: 30,
  hizbNumber: 60,
  rubNumber: 240,
  sajdah: SajdahType.NONE,
  words: [],
  checksumSha256: 'unverified-mock-checksum',
  verification: UNVERIFIED_DEMO_CERTIFICATE,
};
