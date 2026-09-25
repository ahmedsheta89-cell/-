/**
 * @file types.ts
 * @module domain/student
 * @description Domain contracts for student profiles, memorization mastery,
 * revision cycles, and weakness tracking.
 */

import { RiwayahType } from '../quran/types.ts';
import { RecitationErrorType } from '../errors/types.ts';

export enum MemorizationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  MEMORIZED = 'MEMORIZED',           // حُفظ حديثًا
  CONSOLIDATED = 'CONSOLIDATED',     // رُوجع وثَبَت في الصدر
}

export interface StudentAyahProgress {
  surahNumber: number;
  ayahNumber: number;
  status: MemorizationStatus;
  lastRecitedAt: string;
  recitationCount: number;
  perfectRecitationsStreak: number;
  knownWeaknessTypes: RecitationErrorType[];
}

export interface TajweedWeaknessRecord {
  errorType: RecitationErrorType;
  errorNameArabic: string;
  occurrencesCount: number;
  lastOccurredAt: string;
  isResolved: boolean;
  notesArabic: string;
}

export interface DailyWirdPlan {
  id: string;
  studentId: string;
  targetDate: string; // YYYY-MM-DD
  newMemorizationPages: number[];
  revisionPages: number[];
  isCompleted: boolean;
  completedPagesCount: number;
  durationMinutesSpent: number;
}

export interface StudentProfile {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  preferredRiwayah: RiwayahType;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'HAFIDH';
  joinedAt: string;
  totalAyahsMemorized: number;
  totalSurahsMemorized: number;
  activeDailyStreakDays: number;     // تتبع الالتزام بالورد اليومي دون ابتذال ترفيهي
  lastActiveDate: string;
  weaknesses: TajweedWeaknessRecord[];
  dailyWird: DailyWirdPlan;
}
