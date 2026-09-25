/**
 * @file IQuranDataProvider.ts
 * @module infrastructure/interfaces
 * @description Contract for fetching certified, immutable Holy Quran data and metadata.
 */

import {
  QuranSurah,
  QuranAyah,
  QuranWord,
  RiwayahType,
  QuranEditionManifest,
  QuranDatasetVersion,
  QuranSourceRecord,
  IntegrityManifest,
} from '../../domain/quran/types.ts';

export interface QuranQueryOptions {
  verifiedOnly?: boolean;          // Strict enforcement: rejects unverified or demo data if true
  datasetVersion?: string;         // Explicit version pinning
}

export interface IQuranDataProvider {
  getDatasetVersion(riwayah: RiwayahType): Promise<QuranDatasetVersion>;
  getSourceRecord(riwayah: RiwayahType): Promise<QuranSourceRecord>;
  getIntegrityManifest(riwayah: RiwayahType): Promise<IntegrityManifest>;
  getEditionManifest(riwayah: RiwayahType): Promise<QuranEditionManifest>;
  getAllSurahs(riwayah: RiwayahType, options?: QuranQueryOptions): Promise<QuranSurah[]>;
  getSurah(surahNumber: number, riwayah: RiwayahType, options?: QuranQueryOptions): Promise<QuranSurah | null>;
  getAyahs(surahNumber: number, fromAyah: number, toAyah: number, riwayah: RiwayahType, options?: QuranQueryOptions): Promise<QuranAyah[]>;
  getWordsForAyah(surahNumber: number, ayahNumber: number, riwayah: RiwayahType, options?: QuranQueryOptions): Promise<QuranWord[]>;
  searchUthmaniText(query: string, riwayah: RiwayahType, options?: QuranQueryOptions): Promise<QuranAyah[]>;
}
