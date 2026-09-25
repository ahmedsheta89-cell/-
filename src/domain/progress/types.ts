/**
 * @file types.ts
 * @module domain/progress
 * @description Core Presentation Read Models & Type Contracts for Phase 8D Student Progress UX.
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * These are strictly read-only presentation projections derived from:
 * Phase 7D (Memorization/Revision) + Phase 8A (Identity) + Phase 8B (Persistence) + Phase 8C (Sync).
 * They NEVER mutate underlying domain records or stores.
 */

import { MemorizationState, ReviewUrgency, QuranPassageLocation } from '../memorization_revision/types.ts';
import { StudentIdentity } from '../identity/types.ts';
import { SyncStatusSummary } from '../sync/types.ts';

/**
 * Human-readable, dignified Arabic labels and pedagogical descriptions for Memorization states.
 */
export interface MemorizationStateMeta {
  readonly state: MemorizationState;
  readonly labelArabic: string;
  readonly descriptionArabic: string;
  readonly isConsolidated: boolean;
  readonly schedulingNote: string;
}

/**
 * Human-readable, dignified Arabic labels and descriptions for Revision Urgency.
 */
export interface ReviewUrgencyMeta {
  readonly urgency: ReviewUrgency;
  readonly labelArabic: string;
  readonly descriptionArabic: string;
  readonly badgeVariant: 'critical' | 'warning' | 'info' | 'upcoming' | 'stable';
}

/**
 * Single Ayah Progress Presentation Model.
 */
export interface AyahProgressViewModel {
  readonly surahId: number;
  readonly ayahNumber: number;
  readonly passageKey: string;
  readonly textUthmani: string;
  readonly state: MemorizationState;
  readonly stateMeta: MemorizationStateMeta;
  readonly urgency: ReviewUrgency;
  readonly urgencyMeta: ReviewUrgencyMeta;
  readonly confirmedSuccessCount: number;
  readonly confirmedErrorCount: number;
  readonly inconclusiveCount: number;
  readonly totalAttemptsCount: number;
  readonly lastAttemptTimestamp: number | null;
  readonly nextReviewTimestamp: number | null;
  readonly isOverdue: boolean;
  readonly needsReinforcement: boolean;
  readonly historicalAccuracyPercentage: number;
  readonly recentAccuracyPercentage: number;
  readonly errorNotes: readonly string[];
}

/**
 * Single Surah Progress Presentation Model.
 */
export interface SurahProgressViewModel {
  readonly surahId: number;
  readonly nameArabic: string;
  readonly nameEnglish: string;
  readonly totalAyahs: number;
  readonly revelationType: 'MECCAN' | 'MEDINAN';
  readonly juzNumber: number;
  readonly trackedAyahsCount: number;
  readonly masteredAyahsCount: number;
  readonly learningAyahsCount: number;
  readonly practicingAyahsCount: number;
  readonly needsReviewCount: number;
  readonly unstartedAyahsCount: number;
  readonly completionPercentage: number;
  readonly hasCriticalWeakness: boolean;
  readonly ayahs: readonly AyahProgressViewModel[];
}

/**
 * Daily Revision Queue Item.
 */
export interface RevisionQueueItemViewModel {
  readonly passageKey: string;
  readonly surahId: number;
  readonly surahNameArabic: string;
  readonly ayahNumber: number;
  readonly textSnippet: string;
  readonly urgency: ReviewUrgency;
  readonly urgencyMeta: ReviewUrgencyMeta;
  readonly scheduledReviewTime: number;
  readonly daysOverdue: number;
  readonly recentAccuracy: number;
  readonly reasonCodeArabic: string;
}

/**
 * Revision Overview Projection.
 */
export interface RevisionOverviewViewModel {
  readonly totalQueueCount: number;
  readonly criticalCount: number;
  readonly overdueCount: number;
  readonly dueTodayCount: number;
  readonly upcomingCount: number;
  readonly stableCount: number;
  readonly items: readonly RevisionQueueItemViewModel[];
}

/**
 * Focal Point / Recurring Weakness Item.
 */
export interface WeaknessItemViewModel {
  readonly passageKey: string;
  readonly surahId: number;
  readonly surahNameArabic: string;
  readonly ayahNumber: number;
  readonly textSnippet: string;
  readonly recurrenceCount: number;
  readonly lastOccurredTimestamp: number;
  readonly errorNatureArabic: string;
  readonly suggestedPedagogicalAction: string;
}

/**
 * Weakness Overview Projection.
 */
export interface WeaknessOverviewViewModel {
  readonly totalWeaknessCount: number;
  readonly weaknesses: readonly WeaknessItemViewModel[];
}

/**
 * Single Session Recitation History Item.
 */
export interface SessionHistoryItemViewModel {
  readonly sessionId: string;
  readonly timestamp: number;
  readonly surahId: number;
  readonly surahNameArabic: string;
  readonly ayahRange: string;
  readonly attemptCount: number;
  readonly confirmedCount: number;
  readonly correctedCount: number;
  readonly inconclusiveCount: number;
  readonly summaryArabic: string;
}

/**
 * Session History Projection.
 */
export interface SessionHistoryViewModel {
  readonly totalSessionsCount: number;
  readonly recentSessions: readonly SessionHistoryItemViewModel[];
}

/**
 * Longitudinal Progress Distribution Projection.
 */
export interface ProgressAnalyticsViewModel {
  readonly totalQuranAyahs: number; // 6,236
  readonly totalAyahsMastered: number;
  readonly totalAyahsStable: number;
  readonly totalAyahsPracticing: number;
  readonly totalAyahsLearning: number;
  readonly totalAyahsUnstarted: number;
  readonly globalCompletionPercentage: number;
  readonly cumulativeAccuracyPercentage: number;
  readonly totalConfirmedSessions: number;
  readonly totalRecitationAttempts: number;
  readonly verifiedTajweedPracticeCount: number;
}

/**
 * Master Student Progress Root Projection.
 */
export interface StudentProgressViewModel {
  readonly studentId: string;
  readonly isAnonymous: boolean;
  readonly identityStatusLabel: string;
  readonly activeMemorizationRange: readonly {
    readonly surahId: number;
    readonly surahNameArabic: string;
    readonly startAyah: number;
    readonly endAyah: number;
  }[];
  readonly analytics: ProgressAnalyticsViewModel;
  readonly revisionOverview: RevisionOverviewViewModel;
  readonly weaknessOverview: WeaknessOverviewViewModel;
  readonly recentSessions: readonly SessionHistoryItemViewModel[];
  readonly lastActiveTimestamp: number | null;
  readonly syncStatus: {
    readonly isOnline: boolean;
    readonly isSynced: boolean;
    readonly isSyncing: boolean;
    readonly pendingCount: number;
    readonly conflictCount: number;
    readonly statusLabelArabic: string;
  };
}
