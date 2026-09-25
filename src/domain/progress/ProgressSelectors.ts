/**
 * @file ProgressSelectors.ts
 * @module domain/progress
 * @description Pure deterministic projection selectors for Phase 8D.
 * Transforms Phase 7D, Phase 8A, Phase 8B, and Phase 8C models into UI View Models.
 * 
 * CORE ARCHITECTURAL INVARIANT:
 * Zero mutation. Pure functions. Does not call external APIs.
 * Preserves truth invariants across all projections.
 */

import {
  StudentMemorizationProfile,
  PassageLearningRecord,
  MemorizationState,
  ReviewUrgency,
  MemorizationEvent,
} from '../memorization_revision/types.ts';
import { StudentIdentity } from '../identity/types.ts';
import { SyncStatusSummary, NetworkSyncState } from '../sync/types.ts';
import {
  ALL_114_SURAHS_MANIFEST,
  VERIFIED_CANONICAL_AYAHS,
} from '../../infrastructure/quran/VerifiedQuranDataProvider.ts';
import {
  MEMORIZATION_STATE_METAS,
  REVIEW_URGENCY_METAS,
} from './progressSemanticsCatalog.ts';
import {
  AyahProgressViewModel,
  SurahProgressViewModel,
  RevisionOverviewViewModel,
  RevisionQueueItemViewModel,
  WeaknessOverviewViewModel,
  WeaknessItemViewModel,
  SessionHistoryViewModel,
  SessionHistoryItemViewModel,
  ProgressAnalyticsViewModel,
  StudentProgressViewModel,
} from './types.ts';

const TOTAL_QURAN_AYAHS = 6236;

/**
 * Look up verified Uthmani text for an ayah if available in verified canon.
 */
export function getVerifiedAyahText(surahId: number, ayahNumber: number): string {
  const canonical = VERIFIED_CANONICAL_AYAHS.find(
    (a) => a.surahNumber === surahId && a.ayahNumber === ayahNumber
  );
  if (canonical) {
    return canonical.textUthmani;
  }
  const surahMeta = ALL_114_SURAHS_MANIFEST.find((s) => s.number === surahId);
  const surahName = surahMeta ? surahMeta.nameArabic : `سورة ${surahId}`;
  return `[${surahName} : آية ${ayahNumber}]`;
}

/**
 * Maps single passage record to AyahProgressViewModel
 */
export function selectAyahProgressViewModel(
  surahId: number,
  ayahNumber: number,
  record?: PassageLearningRecord
): AyahProgressViewModel {
  const passageKey = `${surahId}:${ayahNumber}`;
  const textUthmani = getVerifiedAyahText(surahId, ayahNumber);

  if (!record) {
    const defaultState = MemorizationState.NOT_STARTED;
    const defaultUrgency = ReviewUrgency.NO_REVIEW_REQUIRED;
    return {
      surahId,
      ayahNumber,
      passageKey,
      textUthmani,
      state: defaultState,
      stateMeta: MEMORIZATION_STATE_METAS[defaultState],
      urgency: defaultUrgency,
      urgencyMeta: REVIEW_URGENCY_METAS[defaultUrgency],
      confirmedSuccessCount: 0,
      confirmedErrorCount: 0,
      inconclusiveCount: 0,
      totalAttemptsCount: 0,
      lastAttemptTimestamp: null,
      nextReviewTimestamp: null,
      isOverdue: false,
      needsReinforcement: false,
      historicalAccuracyPercentage: 0,
      recentAccuracyPercentage: 0,
      errorNotes: [],
    };
  }

  const now = Date.now();
  const isOverdue = record.nextReviewAt > 0 && record.nextReviewAt < now;
  const needsReinforcement =
    record.currentState === MemorizationState.NEEDS_REINFORCEMENT ||
    record.currentState === MemorizationState.WEAKENING ||
    record.recentErrorOccurrences > 0;

  // Derive Urgency
  let urgency = ReviewUrgency.NO_REVIEW_REQUIRED;
  if (record.currentState === MemorizationState.NEEDS_REINFORCEMENT) {
    urgency = ReviewUrgency.CRITICAL_WEAKNESS;
  } else if (isOverdue) {
    urgency = ReviewUrgency.REVIEW_OVERDUE;
  } else if (record.currentState === MemorizationState.REVIEW_DUE) {
    urgency = ReviewUrgency.REVIEW_DUE;
  } else if (record.nextReviewAt > 0 && record.nextReviewAt - now < 86400000 * 2) {
    urgency = ReviewUrgency.REVIEW_SOON;
  }

  const totalAttempts =
    record.confirmedSuccessCount + record.confirmedErrorCount + record.inconclusiveCount;

  return {
    surahId,
    ayahNumber,
    passageKey,
    textUthmani,
    state: record.currentState,
    stateMeta: MEMORIZATION_STATE_METAS[record.currentState] || MEMORIZATION_STATE_METAS[MemorizationState.NOT_STARTED],
    urgency,
    urgencyMeta: REVIEW_URGENCY_METAS[urgency] || REVIEW_URGENCY_METAS[ReviewUrgency.NO_REVIEW_REQUIRED],
    confirmedSuccessCount: record.confirmedSuccessCount,
    confirmedErrorCount: record.confirmedErrorCount,
    inconclusiveCount: record.inconclusiveCount,
    totalAttemptsCount: totalAttempts,
    lastAttemptTimestamp: record.lastAttemptAt || null,
    nextReviewTimestamp: record.nextReviewAt || null,
    isOverdue,
    needsReinforcement,
    historicalAccuracyPercentage: Math.round((record.historicalAccuracy || 0) * 100),
    recentAccuracyPercentage: Math.round((record.recentAccuracy || 0) * 100),
    errorNotes: record.errorOccurrences > 0 ? [`تكرر الخطأ في هذا الموضع ${record.errorOccurrences} مرة`] : [],
  };
}

/**
 * Maps Surah data and profile into SurahProgressViewModel
 */
export function selectSurahProgressViewModel(
  surahId: number,
  profile?: StudentMemorizationProfile
): SurahProgressViewModel {
  const surahMeta = ALL_114_SURAHS_MANIFEST.find((s) => s.number === surahId) || {
    number: surahId,
    nameArabic: `سورة ${surahId}`,
    nameEnglish: `Surah ${surahId}`,
    totalAyahs: 7,
    revelationType: 'MECCAN' as const,
    juzStart: 1,
  };

  const passageStates = profile?.passageStates || {};
  const ayahs: AyahProgressViewModel[] = [];

  let tracked = 0;
  let mastered = 0;
  let learning = 0;
  let practicing = 0;
  let needsReview = 0;
  let hasCriticalWeakness = false;

  for (let a = 1; a <= surahMeta.totalAyahs; a++) {
    const key = `${surahId}:${a}`;
    const rec = passageStates[key];
    const ayahModel = selectAyahProgressViewModel(surahId, a, rec);
    ayahs.push(ayahModel);

    if (rec) {
      tracked++;
      if (rec.currentState === MemorizationState.MASTERED) mastered++;
      else if (rec.currentState === MemorizationState.PRACTICING) practicing++;
      else if (
        rec.currentState === MemorizationState.LEARNING ||
        rec.currentState === MemorizationState.INTRODUCED
      )
        learning++;

      if (
        rec.currentState === MemorizationState.REVIEW_DUE ||
        ayahModel.urgency === ReviewUrgency.REVIEW_OVERDUE ||
        ayahModel.urgency === ReviewUrgency.CRITICAL_WEAKNESS
      ) {
        needsReview++;
      }

      if (ayahModel.urgency === ReviewUrgency.CRITICAL_WEAKNESS) {
        hasCriticalWeakness = true;
      }
    }
  }

  const unstarted = surahMeta.totalAyahs - tracked;
  const completionPercentage =
    surahMeta.totalAyahs > 0 ? Math.round((mastered / surahMeta.totalAyahs) * 100) : 0;

  return {
    surahId,
    nameArabic: surahMeta.nameArabic,
    nameEnglish: surahMeta.nameEnglish,
    totalAyahs: surahMeta.totalAyahs,
    revelationType: surahMeta.revelationType,
    juzNumber: surahMeta.juzStart,
    trackedAyahsCount: tracked,
    masteredAyahsCount: mastered,
    learningAyahsCount: learning,
    practicingAyahsCount: practicing,
    needsReviewCount: needsReview,
    unstartedAyahsCount: unstarted,
    completionPercentage,
    hasCriticalWeakness,
    ayahs,
  };
}

/**
 * Projects all 114 Surahs
 */
export function selectAllSurahsProgress(
  profile?: StudentMemorizationProfile
): readonly SurahProgressViewModel[] {
  return ALL_114_SURAHS_MANIFEST.map((s) => selectSurahProgressViewModel(s.number, profile));
}

/**
 * Aggregates the daily revision queue grouped by priority
 */
export function selectRevisionOverview(
  profile?: StudentMemorizationProfile
): RevisionOverviewViewModel {
  if (!profile || !profile.passageStates) {
    return {
      totalQueueCount: 0,
      criticalCount: 0,
      overdueCount: 0,
      dueTodayCount: 0,
      upcomingCount: 0,
      stableCount: 0,
      items: [],
    };
  }

  const items: RevisionQueueItemViewModel[] = [];
  const now = Date.now();

  for (const [key, record] of Object.entries(profile.passageStates)) {
    const [sId, aNum] = key.split(':').map(Number);
    if (!sId || !aNum) continue;

    const surahMeta = ALL_114_SURAHS_MANIFEST.find((s) => s.number === sId);
    const surahNameArabic = surahMeta ? surahMeta.nameArabic : `سورة ${sId}`;
    const textSnippet = getVerifiedAyahText(sId, aNum);

    const isOverdue = record.nextReviewAt > 0 && record.nextReviewAt < now;
    let urgency = ReviewUrgency.NO_REVIEW_REQUIRED;
    let reasonCodeArabic = 'تعاهد دوري مجدول';

    if (record.currentState === MemorizationState.NEEDS_REINFORCEMENT) {
      urgency = ReviewUrgency.CRITICAL_WEAKNESS;
      reasonCodeArabic = 'موضع تكرر فيه الخطأ ويحتاج تثبيتاً عاجلاً';
    } else if (isOverdue) {
      urgency = ReviewUrgency.REVIEW_OVERDUE;
      reasonCodeArabic = 'مراجعة متأخرة عن موعدها المحدد';
    } else if (record.currentState === MemorizationState.REVIEW_DUE) {
      urgency = ReviewUrgency.REVIEW_DUE;
      reasonCodeArabic = 'مستحقة في ورد مراجعة اليوم';
    } else if (record.nextReviewAt > 0 && record.nextReviewAt - now < 86400000 * 2) {
      urgency = ReviewUrgency.REVIEW_SOON;
      reasonCodeArabic = 'تقترب من موعد المراجعة';
    } else if (record.currentState === MemorizationState.MASTERED) {
      urgency = ReviewUrgency.NO_REVIEW_REQUIRED;
      reasonCodeArabic = 'حفظ راسخ في مرحلة الجدولة المتباعدة';
    }

    const daysOverdue = isOverdue
      ? Math.max(1, Math.round((now - record.nextReviewAt) / 86400000))
      : 0;

    items.push({
      passageKey: key,
      surahId: sId,
      surahNameArabic,
      ayahNumber: aNum,
      textSnippet,
      urgency,
      urgencyMeta: REVIEW_URGENCY_METAS[urgency],
      scheduledReviewTime: record.nextReviewAt,
      daysOverdue,
      recentAccuracy: Math.round((record.recentAccuracy || 0) * 100),
      reasonCodeArabic,
    });
  }

  // Sort queue by urgency priority: CRITICAL -> OVERDUE -> DUE -> UPCOMING -> STABLE
  const priorityOrder: Record<ReviewUrgency, number> = {
    [ReviewUrgency.CRITICAL_WEAKNESS]: 1,
    [ReviewUrgency.REVIEW_OVERDUE]: 2,
    [ReviewUrgency.REVIEW_DUE]: 3,
    [ReviewUrgency.REVIEW_SOON]: 4,
    [ReviewUrgency.NO_REVIEW_REQUIRED]: 5,
  };

  items.sort((a, b) => {
    const diff = (priorityOrder[a.urgency] || 99) - (priorityOrder[b.urgency] || 99);
    if (diff !== 0) return diff;
    return a.scheduledReviewTime - b.scheduledReviewTime;
  });

  const criticalCount = items.filter((i) => i.urgency === ReviewUrgency.CRITICAL_WEAKNESS).length;
  const overdueCount = items.filter((i) => i.urgency === ReviewUrgency.REVIEW_OVERDUE).length;
  const dueTodayCount = items.filter((i) => i.urgency === ReviewUrgency.REVIEW_DUE).length;
  const upcomingCount = items.filter((i) => i.urgency === ReviewUrgency.REVIEW_SOON).length;
  const stableCount = items.filter((i) => i.urgency === ReviewUrgency.NO_REVIEW_REQUIRED).length;

  return {
    totalQueueCount: criticalCount + overdueCount + dueTodayCount,
    criticalCount,
    overdueCount,
    dueTodayCount,
    upcomingCount,
    stableCount,
    items,
  };
}

/**
 * Extracts focal points and recurrent weaknesses
 */
export function selectWeaknessOverview(
  profile?: StudentMemorizationProfile
): WeaknessOverviewViewModel {
  if (!profile || !profile.passageStates) {
    return { totalWeaknessCount: 0, weaknesses: [] };
  }

  const weaknesses: WeaknessItemViewModel[] = [];

  for (const [key, record] of Object.entries(profile.passageStates)) {
    if (
      record.errorOccurrences > 0 ||
      record.currentState === MemorizationState.NEEDS_REINFORCEMENT ||
      record.currentState === MemorizationState.WEAKENING
    ) {
      const [sId, aNum] = key.split(':').map(Number);
      const surahMeta = ALL_114_SURAHS_MANIFEST.find((s) => s.number === sId);
      const surahNameArabic = surahMeta ? surahMeta.nameArabic : `سورة ${sId}`;
      const textSnippet = getVerifiedAyahText(sId, aNum);

      weaknesses.push({
        passageKey: key,
        surahId: sId,
        surahNameArabic,
        ayahNumber: aNum,
        textSnippet,
        recurrenceCount: record.errorOccurrences || 1,
        lastOccurredTimestamp: record.lastErrorAt || record.lastAttemptAt || Date.now(),
        errorNatureArabic: 'ملاحظة صوتية أو تجويدية تم تأكيدها في جلسة التسميع',
        suggestedPedagogicalAction: 'تكرار الآية 3 مرات متتالية مع الاستماع لصوت الشيخ قبل التسميع القادم',
      });
    }
  }

  weaknesses.sort((a, b) => b.recurrenceCount - a.recurrenceCount);

  return {
    totalWeaknessCount: weaknesses.length,
    weaknesses,
  };
}

/**
 * Projects recent session history from memorization events
 */
export function selectSessionHistory(
  events: readonly MemorizationEvent[] = []
): SessionHistoryViewModel {
  if (!events || events.length === 0) {
    return { totalSessionsCount: 0, recentSessions: [] };
  }

  const sessionMap = new Map<string, MemorizationEvent[]>();
  for (const ev of events) {
    const sId = ev.sessionId || 'session_default';
    if (!sessionMap.has(sId)) {
      sessionMap.set(sId, []);
    }
    sessionMap.get(sId)!.push(ev);
  }

  const sessions: SessionHistoryItemViewModel[] = [];

  for (const [sessionId, evList] of sessionMap.entries()) {
    const first = evList[0];
    const surahId = first.surahId;
    const surahMeta = ALL_114_SURAHS_MANIFEST.find((s) => s.number === surahId);
    const surahNameArabic = surahMeta ? surahMeta.nameArabic : `سورة ${surahId}`;

    const ayahs = Array.from(new Set(evList.map((e) => e.ayahNumber))).sort((a, b) => a - b);
    const ayahRange =
      ayahs.length === 1
        ? `الآية ${ayahs[0]}`
        : `الآيات ${ayahs[0]} - ${ayahs[ayahs.length - 1]}`;

    let confirmedCount = 0;
    let correctedCount = 0;
    let inconclusiveCount = 0;

    for (const e of evList) {
      if (e.evidenceStatus === 'CONFIRMED' && e.eventType === 'AYAH_COMPLETED') {
        confirmedCount++;
      } else if (e.eventType === 'ERROR_CONFIRMED' || e.eventType === 'RETRY') {
        correctedCount++;
      } else if (e.evidenceStatus === 'INCONCLUSIVE') {
        inconclusiveCount++;
      }
    }

    sessions.push({
      sessionId,
      timestamp: first.timestamp,
      surahId,
      surahNameArabic,
      ayahRange,
      attemptCount: evList.length,
      confirmedCount,
      correctedCount,
      inconclusiveCount,
      summaryArabic: `تمت تلاوة ${ayahRange} بإجمالي ${evList.length} محاولة وتكرار.`,
    });
  }

  sessions.sort((a, b) => b.timestamp - a.timestamp);

  return {
    totalSessionsCount: sessions.length,
    recentSessions: sessions.slice(0, 10),
  };
}

/**
 * Projects macro analytics
 */
export function selectProgressAnalytics(
  profile?: StudentMemorizationProfile,
  events: readonly MemorizationEvent[] = []
): ProgressAnalyticsViewModel {
  const passageStates = profile?.passageStates || {};
  let mastered = 0;
  let stable = 0;
  let practicing = 0;
  let learning = 0;
  let totalConfirmedSuccess = 0;
  let totalConfirmedErrors = 0;

  for (const rec of Object.values(passageStates)) {
    if (rec.currentState === MemorizationState.MASTERED) mastered++;
    else if (rec.currentState === MemorizationState.STABLE) stable++;
    else if (rec.currentState === MemorizationState.PRACTICING) practicing++;
    else if (
      rec.currentState === MemorizationState.LEARNING ||
      rec.currentState === MemorizationState.INTRODUCED
    ) {
      learning++;
    }

    totalConfirmedSuccess += rec.confirmedSuccessCount || 0;
    totalConfirmedErrors += rec.confirmedErrorCount || 0;
  }

  const tracked = mastered + stable + practicing + learning;
  const unstarted = TOTAL_QURAN_AYAHS - tracked;

  const totalDecisions = totalConfirmedSuccess + totalConfirmedErrors;
  const cumulativeAccuracy =
    totalDecisions > 0 ? Math.round((totalConfirmedSuccess / totalDecisions) * 100) : 100;

  const globalCompletion = Math.round((mastered / TOTAL_QURAN_AYAHS) * 100);

  return {
    totalQuranAyahs: TOTAL_QURAN_AYAHS,
    totalAyahsMastered: mastered,
    totalAyahsStable: stable,
    totalAyahsPracticing: practicing,
    totalAyahsLearning: learning,
    totalAyahsUnstarted: unstarted,
    globalCompletionPercentage: globalCompletion,
    cumulativeAccuracyPercentage: cumulativeAccuracy,
    totalConfirmedSessions: new Set(events.map((e) => e.sessionId)).size,
    totalRecitationAttempts: events.length,
    verifiedTajweedPracticeCount: totalConfirmedSuccess,
  };
}

/**
 * Master Student Progress Root Selector
 */
export function selectStudentProgressViewModel(params: {
  student: StudentIdentity;
  profile?: StudentMemorizationProfile;
  syncSummary?: SyncStatusSummary;
  events?: readonly MemorizationEvent[];
}): StudentProgressViewModel {
  const { student, profile, syncSummary, events = [] } = params;

  // Active memorization range
  const activeRange = (profile?.activeMemorizationRange || []).map((r) => {
    const sMeta = ALL_114_SURAHS_MANIFEST.find((s) => s.number === r.surahId);
    return {
      surahId: r.surahId,
      surahNameArabic: sMeta ? sMeta.nameArabic : `سورة ${r.surahId}`,
      startAyah: r.startAyah,
      endAyah: r.endAyah,
    };
  });

  // Default to Surah Al-Fatihah if no active range configured
  const finalActiveRange =
    activeRange.length > 0
      ? activeRange
      : [
          {
            surahId: 1,
            surahNameArabic: 'الفاتحة',
            startAyah: 1,
            endAyah: 7,
          },
        ];

  // Sync state label
  let syncLabel = 'تمت المزامنة';
  const isOnline = syncSummary ? syncSummary.isOnline : true;
  const pendingCount = syncSummary ? syncSummary.pendingCount : 0;
  const conflictCount = syncSummary ? syncSummary.conflictCount : 0;
  const isSyncing = syncSummary ? syncSummary.syncStatus === NetworkSyncState.SYNCING : false;
  const isSynced = isOnline && pendingCount === 0 && conflictCount === 0;

  if (!isOnline) {
    syncLabel = 'محفوظ محليًا (بدون اتصال)';
  } else if (conflictCount > 0) {
    syncLabel = 'يوجد تعارض في التلاوة يتطلب مراجعتك';
  } else if (isSyncing) {
    syncLabel = 'جاري المزامنة...';
  } else if (pendingCount > 0) {
    syncLabel = `${pendingCount} تغييرات بانتظار المزامنة`;
  }

  const identityStatusLabel = student.isAnonymous
    ? 'طالب محلي (حفظ في المتصفح)'
    : 'طالب مسجل (مزامنة سحابية)';

  return {
    studentId: student.studentId,
    isAnonymous: student.isAnonymous ?? true,
    identityStatusLabel,
    activeMemorizationRange: finalActiveRange,
    analytics: selectProgressAnalytics(profile, events),
    revisionOverview: selectRevisionOverview(profile),
    weaknessOverview: selectWeaknessOverview(profile),
    recentSessions: selectSessionHistory(events).recentSessions,
    lastActiveTimestamp: profile?.lastActivityAt || null,
    syncStatus: {
      isOnline,
      isSynced,
      isSyncing,
      pendingCount,
      conflictCount,
      statusLabelArabic: syncLabel,
    },
  };
}
