/**
 * @file MemorizationRevisionDashboard.tsx
 * @module components
 * @description Phase 7D Memorization & Spaced Revision Dashboard, Queue, and Passage Detail UI (Part 32).
 */

import React, { useState, useMemo } from 'react';
import {
  StudentMemorizationProfile,
  PassageLearningRecord,
  MemorizationState,
  ReviewUrgency,
  RevisionScheduleResult,
  RevisionSetMode,
  DailyRevisionPlan,
} from '../domain/memorization_revision/types.ts';
import { RevisionScheduler } from '../domain/memorization_revision/RevisionScheduler.ts';
import { RevisionSetGenerator } from '../domain/memorization_revision/RevisionSetGenerator.ts';
import { LongitudinalProfileStore } from '../domain/memorization_revision/LongitudinalProfileStore.ts';
import { MemorizationStateEngine } from '../domain/memorization_revision/MemorizationStateEngine.ts';
import { ALL_114_SURAHS_MANIFEST } from '../infrastructure/quran/VerifiedQuranDataProvider.ts';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  X,
} from 'lucide-react';

interface Props {
  profile?: StudentMemorizationProfile;
  onSelectPassageToRecite?: (surahId: number, ayahNumber: number) => void;
}

export const MemorizationRevisionDashboard: React.FC<Props> = ({
  profile,
  onSelectPassageToRecite,
}) => {
  const [selectedPassageKey, setSelectedPassageKey] = useState<string | null>(null);
  const [planMode, setPlanMode] = useState<RevisionSetMode>(RevisionSetMode.MIXED);

  const defaultProfile = useMemo(() => {
    const store = new LongitudinalProfileStore('std-ahmed-001');
    const engine = new MemorizationStateEngine();
    const now = Date.now();
    for (let ayah = 1; ayah <= 7; ayah++) {
      let rec = engine.initializePassageRecord(1, ayah);
      if (ayah <= 3) {
        // Mastered & Stable
        rec = {
          ...rec,
          currentState: ayah === 1 ? MemorizationState.MASTERED : MemorizationState.STABLE,
          independentReviewCount: ayah === 1 ? 5 : 2,
          practiceClusterCount: 4,
          confirmedSuccessCount: 6,
          lastAttemptAt: now - (ayah * 3600 * 1000 * 12),
          lastConfirmedAt: now - (ayah * 3600 * 1000 * 12),
          lastReviewAt: now - (ayah * 3600 * 1000 * 12),
          nextReviewAt: now + (24 * 3600 * 1000 * ayah),
        };
      } else if (ayah === 4) {
        // Review due soon
        rec = {
          ...rec,
          currentState: MemorizationState.STABLE,
          independentReviewCount: 1,
          practiceClusterCount: 2,
          confirmedSuccessCount: 2,
          lastAttemptAt: now - (23 * 3600 * 1000),
          lastConfirmedAt: now - (23 * 3600 * 1000),
          lastReviewAt: now - (23 * 3600 * 1000),
          nextReviewAt: now + (1 * 3600 * 1000),
        };
      } else if (ayah === 5) {
        // Needs reinforcement
        rec = {
          ...rec,
          currentState: MemorizationState.NEEDS_REINFORCEMENT,
          recentErrorOccurrences: 1,
          practiceClusterCount: 3,
          confirmedSuccessCount: 1,
          lastAttemptAt: now - (10 * 3600 * 1000),
          lastReviewAt: now - (10 * 3600 * 1000),
          nextReviewAt: now - (2 * 3600 * 1000),
        };
      }
      store.setActiveRanges([{ surahId: 1, startAyah: 1, endAyah: 7 }]);
      (store as any).passageStates.set(`${1}:${ayah}`, rec);
    }
    return store.getProfileSnapshot();
  }, []);

  const activeProfile = profile ?? defaultProfile;

  const scheduler = useMemo(() => new RevisionScheduler(), []);
  const planGenerator = useMemo(() => new RevisionSetGenerator(scheduler), [scheduler]);

  // All records list
  const records = useMemo(() => Object.values(activeProfile.passageStates), [activeProfile.passageStates]);

  // Evaluated schedules
  const evaluatedSchedules = useMemo(() => {
    return scheduler.evaluateStudent(records);
  }, [scheduler, records]);

  // Generated Daily Plan
  const dailyPlan: DailyRevisionPlan = useMemo(() => {
    return planGenerator.generateDailyPlan(records, {
      studentId: activeProfile.studentId,
      mode: planMode,
      maxTargets: 8,
      maxMinutes: 30,
    });
  }, [planGenerator, records, activeProfile.studentId, planMode]);

  // State grouping counts
  const stateCounts = useMemo(() => {
    const counts: Record<MemorizationState, number> = {
      [MemorizationState.NOT_STARTED]: 0,
      [MemorizationState.INTRODUCED]: 0,
      [MemorizationState.LEARNING]: 0,
      [MemorizationState.PRACTICING]: 0,
      [MemorizationState.STABLE]: 0,
      [MemorizationState.REVIEW_DUE]: 0,
      [MemorizationState.WEAKENING]: 0,
      [MemorizationState.NEEDS_REINFORCEMENT]: 0,
      [MemorizationState.MASTERED]: 0,
    };
    records.forEach((r) => {
      counts[r.currentState] = (counts[r.currentState] || 0) + 1;
    });
    return counts;
  }, [records]);

  // Selected passage details
  const selectedRecord = selectedPassageKey ? activeProfile.passageStates[selectedPassageKey] : null;
  const selectedSchedule = selectedRecord ? scheduler.evaluatePassage(selectedRecord) : null;

  const getSurahName = (surahId: number) => {
    const s = ALL_114_SURAHS_MANIFEST.find((m) => m.number === surahId);
    return s ? `سورة ${s.nameArabic}` : `سورة ${surahId}`;
  };

  const renderStateBadge = (state: MemorizationState) => {
    switch (state) {
      case MemorizationState.MASTERED:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">تمكّن تربوي</span>;
      case MemorizationState.STABLE:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">مستقر ومثبت</span>;
      case MemorizationState.PRACTICING:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">قيد التدريب</span>;
      case MemorizationState.LEARNING:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">قيد التعلّم</span>;
      case MemorizationState.INTRODUCED:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">جديد / مُتلقَّى</span>;
      case MemorizationState.REVIEW_DUE:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">حان موعد المراجعة</span>;
      case MemorizationState.WEAKENING:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">تراجع نسبي</span>;
      case MemorizationState.NEEDS_REINFORCEMENT:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">يحتاج تثبيت</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">لم يبدأ</span>;
    }
  };

  const renderUrgencyBadge = (urgency: ReviewUrgency) => {
    switch (urgency) {
      case ReviewUrgency.REVIEW_NOW:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white">مراجعة الآن</span>;
      case ReviewUrgency.REVIEW_DUE:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500 text-white">مراجعة اليوم</span>;
      case ReviewUrgency.REVIEW_SOON:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">مراجعة قريبًا</span>;
      case ReviewUrgency.STABLE:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">مستقر</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs text-slate-600 bg-slate-100">مسار معتاد</span>;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 text-slate-900 dir-rtl" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-700" />
              <h1 className="text-2xl font-bold text-slate-900 font-arabic">لوحة الحفظ والتكرار المتباعد التربوي</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              خوارزمية ذكية لجدولة المراجعة وتتبع استقرار الآيات بناءً على أدلة التلاوة الفعلية
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              أدلة صوتية موثقة
            </span>
          </div>
        </div>

        {/* State Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <div className="text-2xl font-bold text-slate-800">{stateCounts[MemorizationState.INTRODUCED]}</div>
            <div className="text-xs text-slate-500 mt-1">جديد / مُتلقَّى</div>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
            <div className="text-2xl font-bold text-amber-900">{stateCounts[MemorizationState.LEARNING]}</div>
            <div className="text-xs text-amber-700 mt-1">قيد التعلّم</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 text-center">
            <div className="text-2xl font-bold text-indigo-900">{stateCounts[MemorizationState.PRACTICING]}</div>
            <div className="text-xs text-indigo-700 mt-1">قيد التدريب</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
            <div className="text-2xl font-bold text-blue-900">{stateCounts[MemorizationState.STABLE]}</div>
            <div className="text-xs text-blue-700 mt-1">مستقر ومثبت</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-center">
            <div className="text-2xl font-bold text-orange-900">{stateCounts[MemorizationState.REVIEW_DUE]}</div>
            <div className="text-xs text-orange-700 mt-1">حان موعده</div>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
            <div className="text-2xl font-bold text-rose-900">
              {stateCounts[MemorizationState.WEAKENING] + stateCounts[MemorizationState.NEEDS_REINFORCEMENT]}
            </div>
            <div className="text-xs text-rose-700 mt-1">يحتاج تثبيت</div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
            <div className="text-2xl font-bold text-emerald-900">{stateCounts[MemorizationState.MASTERED]}</div>
            <div className="text-xs text-emerald-700 mt-1">تمكّن تربوي</div>
          </div>
        </div>
      </div>

      {/* Daily Revision Plan Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">خطة المراجعة اليومية المقترحة</h2>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
              {dailyPlan.date}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">النمط:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setPlanMode(RevisionSetMode.MIXED)}
                className={`px-2.5 py-1 rounded-md transition ${planMode === RevisionSetMode.MIXED ? 'bg-white font-semibold text-emerald-800 shadow-xs' : 'text-slate-600'}`}
              >
                شامل
              </button>
              <button
                type="button"
                onClick={() => setPlanMode(RevisionSetMode.WEAKNESS)}
                className={`px-2.5 py-1 rounded-md transition ${planMode === RevisionSetMode.WEAKNESS ? 'bg-white font-semibold text-emerald-800 shadow-xs' : 'text-slate-600'}`}
              >
                تثبيت الضعف
              </button>
              <button
                type="button"
                onClick={() => setPlanMode(RevisionSetMode.SPACED)}
                className={`px-2.5 py-1 rounded-md transition ${planMode === RevisionSetMode.SPACED ? 'bg-white font-semibold text-emerald-800 shadow-xs' : 'text-slate-600'}`}
              >
                تكرار متباعد
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <span>الزمن التقديري: {dailyPlan.estimatedMinutes} دقيقة</span>
            <span>عدد المقاطع المستهدفة: {dailyPlan.weakTargets.length + dailyPlan.revisionTargets.length + dailyPlan.newTargets.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weak Targets */}
            <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  مقاطع تحتاج تثبيت ({dailyPlan.weakTargets.length})
                </span>
              </div>
              {dailyPlan.weakTargets.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">لا توجد مواضع ضعف مسجلة</p>
              ) : (
                <div className="space-y-2">
                  {dailyPlan.weakTargets.map((t) => (
                    <div
                      key={t.passageKey}
                      onClick={() => setSelectedPassageKey(t.passageKey)}
                      className="cursor-pointer bg-white p-2.5 rounded-lg border border-rose-200 hover:border-rose-400 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {getSurahName(t.surahId)} — الآية {t.ayahNumber}
                        </div>
                        <div className="text-[10px] text-rose-700 mt-0.5">أولوية: {t.priority}</div>
                      </div>
                      <RotateCcw className="w-4 h-4 text-rose-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Spaced Revision Targets */}
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  مراجعة دورية مستحقة ({dailyPlan.revisionTargets.length})
                </span>
              </div>
              {dailyPlan.revisionTargets.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">لا توجد مراجعات مستحقة حاليًا</p>
              ) : (
                <div className="space-y-2">
                  {dailyPlan.revisionTargets.map((t) => (
                    <div
                      key={t.passageKey}
                      onClick={() => setSelectedPassageKey(t.passageKey)}
                      className="cursor-pointer bg-white p-2.5 rounded-lg border border-amber-200 hover:border-amber-400 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {getSurahName(t.surahId)} — الآية {t.ayahNumber}
                        </div>
                        <div className="text-[10px] text-amber-700 mt-0.5">أولوية: {t.priority}</div>
                      </div>
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Learning Targets */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  مقاطع جديدة للتعزيز ({dailyPlan.newTargets.length})
                </span>
              </div>
              {dailyPlan.newTargets.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">لا توجد مقاطع جديدة قيد التعزيز</p>
              ) : (
                <div className="space-y-2">
                  {dailyPlan.newTargets.map((t) => (
                    <div
                      key={t.passageKey}
                      onClick={() => setSelectedPassageKey(t.passageKey)}
                      className="cursor-pointer bg-white p-2.5 rounded-lg border border-blue-200 hover:border-blue-400 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {getSurahName(t.surahId)} — الآية {t.ayahNumber}
                        </div>
                        <div className="text-[10px] text-blue-700 mt-0.5">أولوية: {t.priority}</div>
                      </div>
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revision Queue Table */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">طابور المراجعة الشامل والآيات المسجلة</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              مرتبة تنازليًا حسب الأولوية الرياضية المحسوبة
            </p>
          </div>
        </div>

        {evaluatedSchedules.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">لم تُسجل أي جلسات تلاوة بعد لهذا الطالب.</p>
            <p className="text-xs text-slate-400 mt-1">ابدأ جلسة تسميع لتسجيل السجل التعليمي التراكمي.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-3 pr-2">المقطع القرآني</th>
                  <th className="pb-3 px-2">الحالة التربوية</th>
                  <th className="pb-3 px-2">مستوى الإلحاح</th>
                  <th className="pb-3 px-2">الدقة الأخيرة</th>
                  <th className="pb-3 px-2">المراجعات المستقلة</th>
                  <th className="pb-3 px-2">الأولوية</th>
                  <th className="pb-3 pl-2 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluatedSchedules.map((item) => {
                  const rec = activeProfile.passageStates[item.passageKey];
                  if (!rec) return null;
                  return (
                    <tr
                      key={item.passageKey}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setSelectedPassageKey(item.passageKey)}
                    >
                      <td className="py-3 pr-2 font-medium text-slate-900">
                        {getSurahName(rec.surahId)} — الآية {rec.ayahNumber}
                      </td>
                      <td className="py-3 px-2">{renderStateBadge(rec.currentState)}</td>
                      <td className="py-3 px-2">{renderUrgencyBadge(item.urgency)}</td>
                      <td className="py-3 px-2">
                        <span className={`font-mono font-semibold ${rec.recentAccuracy >= 0.85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {Math.round(rec.recentAccuracy * 100)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-700">
                        {rec.independentReviewCount}
                      </td>
                      <td className="py-3 px-2 font-mono font-semibold text-slate-800">
                        {item.priorityFactors.totalPriority}
                      </td>
                      <td className="py-3 pl-2 text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectPassageToRecite) {
                              onSelectPassageToRecite(rec.surahId, rec.ayahNumber);
                            }
                          }}
                          className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition"
                        >
                          تسميع الآن
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Passage Detail Modal */}
      {selectedRecord && selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setSelectedPassageKey(null)}
              className="absolute top-4 left-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              <h3 className="text-lg font-bold text-slate-900">
                {getSurahName(selectedRecord.surahId)} — الآية {selectedRecord.ayahNumber}
              </h3>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {renderStateBadge(selectedRecord.currentState)}
              {renderUrgencyBadge(selectedSchedule.urgency)}
            </div>

            {/* Explanation */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed mb-4">
              <span className="font-bold text-slate-900 block mb-1">سبب الجدولة والتوجيه التربوي:</span>
              {selectedSchedule.naturalLanguageExplanationArabic}
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">الدقة الأخيرة</span>
                <span className="text-base font-bold text-slate-800 font-mono">
                  {Math.round(selectedRecord.recentAccuracy * 100)}%
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">الدقة التاريخية</span>
                <span className="text-base font-bold text-slate-800 font-mono">
                  {Math.round(selectedRecord.historicalAccuracy * 100)}%
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">مؤشر الاستقرار (S)</span>
                <span className="text-base font-bold text-indigo-700 font-mono">
                  {selectedRecord.stabilityIndex.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">المراجعات المستقلة</span>
                <span className="text-base font-bold text-slate-800 font-mono">
                  {selectedRecord.independentReviewCount}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">مجموعات التدريب</span>
                <span className="text-base font-bold text-slate-800 font-mono">
                  {selectedRecord.practiceClusterCount}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">الملاحظات المؤكدة</span>
                <span className="text-base font-bold text-rose-700 font-mono">
                  {selectedRecord.errorOccurrences} (حديث: {selectedRecord.recentErrorOccurrences})
                </span>
              </div>
            </div>

            {/* Next Review Interval */}
            <div className="bg-emerald-50/70 rounded-xl p-3 border border-emerald-200 text-xs text-emerald-900 mb-4 flex items-center justify-between">
              <div>
                <span className="font-semibold block">الموعد المستهدف للمراجعة القادمة:</span>
                <span className="font-mono text-[11px] text-emerald-800">
                  {selectedRecord.nextReviewAt > 0
                    ? new Date(selectedRecord.nextReviewAt).toLocaleString('ar-EG')
                    : 'فور انتهاء الجلسة الأولى'}
                </span>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                كل {selectedSchedule.intervalHours} ساعة
              </span>
            </div>

            {/* Pedagogical Transparency Disclaimer (Part 7 & 32) */}
            <div className="bg-slate-100 p-3 rounded-lg text-[11px] text-slate-600 leading-relaxed mb-4 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>تنبيه توجيهي:</strong> حالة «التمكّن» هي معيار جدولة تربوي للتكرار المتباعد،
                ولا تمثل إجازة قرآنية مسندة أو شهادة دينية أو حفظًا مطلقًا لا ينسى.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPassageKey(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                إغلاق
              </button>
              {onSelectPassageToRecite && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectPassageToRecite(selectedRecord.surahId, selectedRecord.ayahNumber);
                    setSelectedPassageKey(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  بدء التسميع الآن
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
