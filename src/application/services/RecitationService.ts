/**
 * @file RecitationService.ts
 * @module application/services
 * @description Orchestration service coordinating the recitation session lifecycle,
 * data validation, and teacher pedagogical intervention.
 */

import { IQuranDataProvider } from '../../infrastructure/interfaces/IQuranDataProvider.ts';
import { IAudioAnalysisProvider } from '../../infrastructure/interfaces/IAudioAnalysisProvider.ts';
import { IAIProvider } from '../../infrastructure/interfaces/IAIProvider.ts';
import { IDatabaseProvider } from '../../infrastructure/interfaces/IDatabaseProvider.ts';
import { ITeacherSessionEngine } from '../../domain/teacher/types.ts';
import { RecitationMode, RecitationSession, RecitationSessionStatus } from '../../domain/recitation/types.ts';
import { RiwayahType } from '../../domain/quran/types.ts';
import { DomainValidationError } from '../../infrastructure/errors/AppError.ts';
import { StructuredLogger } from '../../infrastructure/logging/StructuredLogger.ts';

export class RecitationService {
  private logger = new StructuredLogger('RecitationService');

  constructor(
    private quranProvider: IQuranDataProvider,
    private audioProvider: IAudioAnalysisProvider,
    private aiProvider: IAIProvider,
    private databaseProvider: IDatabaseProvider,
    private teacherEngine: ITeacherSessionEngine
  ) {}

  async startRecitationSession(params: {
    studentId: string;
    surahNumber: number;
    fromAyah: number;
    toAyah: number;
    riwayah?: RiwayahType;
    mode?: RecitationMode;
  }): Promise<RecitationSession> {
    const riwayah = params.riwayah || RiwayahType.HAFS_AN_ASIM;
    const mode = params.mode || RecitationMode.MEMORIZATION_RECITE;

    this.logger.info('Initializing recitation session', {
      studentId: params.studentId,
      surah: params.surahNumber,
      riwayah,
    });

    const surah = await this.quranProvider.getSurah(params.surahNumber, riwayah);
    if (!surah) {
      throw new DomainValidationError(`Surah [${params.surahNumber}] does not exist in Quran database.`);
    }

    if (params.fromAyah < 1 || params.toAyah > surah.totalAyahs || params.fromAyah > params.toAyah) {
      throw new DomainValidationError(
        `Ayah range [${params.fromAyah}-${params.toAyah}] is invalid for Surah [${surah.nameArabic}] with total ${surah.totalAyahs} ayahs.`
      );
    }

    const ayahs = await this.quranProvider.getAyahs(params.surahNumber, params.fromAyah, params.toAyah, riwayah);
    const expectedWords = ayahs.flatMap((a) => a.words);

    const session: RecitationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentId: params.studentId,
      selectedRiwayah: riwayah,
      mode,
      status: RecitationSessionStatus.INITIALIZING,
      surahNumber: params.surahNumber,
      fromAyah: params.fromAyah,
      toAyah: params.toAyah,
      expectedAyahs: ayahs,
      expectedWords,
      currentAyahIndex: params.fromAyah,
      currentWordIndex: 0,
      audioSegments: [],
      detectedWords: [],
      detectedErrors: [],
      corrections: [],
      repetitions: [],
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalRecitationTimeSeconds: 0,
    };

    // Save session in database provider
    await this.databaseProvider.setDocument('recitation_sessions', session.id, session);

    // Boot TeacherSessionEngine
    await this.teacherEngine.dispatch({ type: 'START_SESSION', session });

    return session;
  }

  getTeacherEngine(): ITeacherSessionEngine {
    return this.teacherEngine;
  }
}
