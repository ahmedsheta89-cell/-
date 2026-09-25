# PHASE 8D — VIEW MODELS & SELECTORS SPECIFICATION

## Presentation-Facing Read Models (Domain -> UI Interface)

### 1. Architectural Role
View Models in Phase 8D are **read-only projections**. They transform:
- `StudentMemorizationProfile` (Phase 7D)
- `PassageLearningRecord` (Phase 7D)
- `PersistentMemorizationEvent` (Phase 8B)
- `SyncStatusSummary` & `SyncConflictRecord` (Phase 8C)
- `ALL_114_SURAHS_MANIFEST` (Verified Quran Data)

Into safe, formatted, type-safe structures ready for rendering without any business logic or mutations inside UI components.

---

### 2. View Model Definitions

#### A. `StudentProgressViewModel`
The root dashboard projection for the active student.
```typescript
export interface StudentProgressViewModel {
  readonly studentId: string;
  readonly isAnonymous: boolean;
  readonly activeMemorizationRange: readonly {
    readonly surahId: number;
    readonly surahNameArabic: string;
    readonly startAyah: number;
    readonly endAyah: number;
  }[];
  readonly totalAyahsTracked: number;
  readonly totalAyahsMastered: number;
  readonly totalAyahsInReview: number;
  readonly totalAyahsLearning: number;
  readonly totalAyahsUnstarted: number;
  readonly overallProgressPercentage: number;
  readonly revisionSummary: {
    readonly criticalCount: number;
    readonly overdueCount: number;
    readonly dueTodayCount: number;
    readonly upcomingCount: number;
  };
  readonly lastActiveTimestamp: number | null;
  readonly syncStatus: {
    readonly isOnline: boolean;
    readonly isSynced: boolean;
    readonly pendingCount: number;
    readonly conflictCount: number;
    readonly statusLabelArabic: string;
  };
}
```

#### B. `SurahProgressViewModel`
Progress breakdown for a single Surah out of 114.
```typescript
export interface SurahProgressViewModel {
  readonly surahId: number;
  readonly nameArabic: string;
  readonly nameEnglish: string;
  readonly totalAyahs: number;
  readonly revelationType: 'MECCAN' | 'MEDINAN';
  readonly trackedAyahsCount: number;
  readonly masteredAyahsCount: number;
  readonly learningAyahsCount: number;
  readonly needsReviewCount: number;
  readonly unstartedAyahsCount: number;
  readonly completionPercentage: number;
  readonly hasCriticalWeakness: boolean;
  readonly ayahs: readonly AyahProgressViewModel[];
}
```

#### C. `AyahProgressViewModel`
Granular card view for an individual Ayah.
```typescript
export interface AyahProgressViewModel {
  readonly surahId: number;
  readonly ayahNumber: number;
  readonly passageKey: string;
  readonly textUthmani: string;
  readonly state: MemorizationState;
  readonly stateLabelArabic: string;
  readonly urgency: ReviewUrgency;
  readonly urgencyLabelArabic: string;
  readonly confirmedSuccessCount: number;
  readonly confirmedErrorCount: number;
  readonly inconclusiveCount: number;
  readonly lastAttemptTimestamp: number | null;
  readonly nextReviewTimestamp: number | null;
  readonly isOverdue: boolean;
  readonly needsReinforcement: boolean;
  readonly historicalAccuracyPercentage: number;
  readonly recentAccuracyPercentage: number;
  readonly errorNotes: readonly string[];
}
```

#### D. `RevisionOverviewViewModel`
Daily revision queue grouped by pedagogical urgency.
```typescript
export interface RevisionOverviewViewModel {
  readonly totalQueueCount: number;
  readonly criticalPassages: readonly AyahProgressViewModel[];
  readonly overduePassages: readonly AyahProgressViewModel[];
  readonly dueTodayPassages: readonly AyahProgressViewModel[];
  readonly upcomingPassages: readonly AyahProgressViewModel[];
  readonly completedTodayCount: number;
}
```

#### E. `WeaknessOverviewViewModel`
Recurring focal points requiring deliberate practice.
```typescript
export interface WeaknessItemViewModel {
  readonly surahId: number;
  readonly surahNameArabic: string;
  readonly ayahNumber: number;
  readonly recurrenceCount: number;
  readonly lastOccurredTimestamp: number;
  readonly errorNatureArabic: string;
  readonly suggestedPedagogicalAction: string;
}

export interface WeaknessOverviewViewModel {
  readonly totalWeaknessCount: number;
  readonly weaknesses: readonly WeaknessItemViewModel[];
}
```

#### F. `SessionHistoryViewModel`
Historical recitation sessions and practice clusters.
```typescript
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

export interface SessionHistoryViewModel {
  readonly totalSessionsCount: number;
  readonly recentSessions: readonly SessionHistoryItemViewModel[];
}
```
