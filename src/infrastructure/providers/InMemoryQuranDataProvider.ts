/**
 * @file InMemoryQuranDataProvider.ts
 * @module infrastructure/providers
 * @description In-memory baseline Quran Data Provider backed by the certified VerifiedQuranDataProvider.
 * Fully compatible with Phase 1 contracts while integrating Phase 2 Verified Religious Data Layer.
 */

import { IQuranDataProvider, QuranQueryOptions } from '../interfaces/IQuranDataProvider.ts';
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
import {
  ALL_114_SURAHS_MANIFEST,
  VERIFIED_CANONICAL_AYAHS,
  HAFS_OFFICIAL_CERTIFICATE,
  OFFICIAL_HAFS_SOURCE_RECORD,
  OFFICIAL_DATASET_VERSION,
  VerifiedQuranDataProvider,
} from '../quran/VerifiedQuranDataProvider.ts';

export const SURAH_AL_FATIHAH: QuranSurah = ALL_114_SURAHS_MANIFEST[0];

export const AL_FATIHAH_AYAHS: QuranAyah[] = VERIFIED_CANONICAL_AYAHS.filter(
  (a) => a.surahNumber === 1
);

export const HAFS_VERIFICATION_CERTIFICATE = HAFS_OFFICIAL_CERTIFICATE;

export class InMemoryQuranDataProvider implements IQuranDataProvider {
  private readonly verifiedProvider: VerifiedQuranDataProvider;

  constructor(strictVerifiedOnly = true) {
    this.verifiedProvider = new VerifiedQuranDataProvider(strictVerifiedOnly);
  }

  async getDatasetVersion(riwayah: RiwayahType): Promise<QuranDatasetVersion> {
    return this.verifiedProvider.getDatasetVersion(riwayah);
  }

  async getSourceRecord(riwayah: RiwayahType): Promise<QuranSourceRecord> {
    return this.verifiedProvider.getSourceRecord(riwayah);
  }

  async getIntegrityManifest(riwayah: RiwayahType): Promise<IntegrityManifest> {
    return this.verifiedProvider.getIntegrityManifest(riwayah);
  }

  async getEditionManifest(riwayah: RiwayahType): Promise<QuranEditionManifest> {
    return this.verifiedProvider.getEditionManifest(riwayah);
  }

  async getAllSurahs(riwayah: RiwayahType, options?: QuranQueryOptions): Promise<QuranSurah[]> {
    return this.verifiedProvider.getAllSurahs(riwayah, options);
  }

  async getSurah(surahNumber: number, riwayah: RiwayahType, options?: QuranQueryOptions): Promise<QuranSurah | null> {
    return this.verifiedProvider.getSurah(surahNumber, riwayah, options);
  }

  async getAyahs(
    surahNumber: number,
    fromAyah: number,
    toAyah: number,
    riwayah: RiwayahType,
    options?: QuranQueryOptions
  ): Promise<QuranAyah[]> {
    return this.verifiedProvider.getAyahs(surahNumber, fromAyah, toAyah, riwayah, options);
  }

  async getWordsForAyah(
    surahNumber: number,
    ayahNumber: number,
    riwayah: RiwayahType,
    options?: QuranQueryOptions
  ): Promise<QuranWord[]> {
    return this.verifiedProvider.getWordsForAyah(surahNumber, ayahNumber, riwayah, options);
  }

  async searchUthmaniText(query: string, riwayah: RiwayahType, options?: QuranQueryOptions): Promise<QuranAyah[]> {
    return this.verifiedProvider.searchUthmaniText(query, riwayah, options);
  }
}
