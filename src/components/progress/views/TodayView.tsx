/**
 * @file TodayView.tsx
 * @module components/progress/views
 * @description The student's primary daily dashboard view for Phase 8D.
 * Surfaces today's active memorization, daily revision queue, and focal points.
 */

import React from 'react';
import { StudentProgressViewModel, RevisionQueueItemViewModel, WeaknessItemViewModel } from '../../../domain/progress/types.ts';
import { ProgressCard } from '../design_system/ProgressCard.tsx';
import { ProgressMetric } from '../design_system/ProgressMetric.tsx';
import { RevisionCard } from '../design_system/RevisionCard.tsx';
import { WeaknessCard } from '../design_system/WeaknessCard.tsx';
import { SessionSummary } from '../design_system/SessionSummary.tsx';
import { EmptyState } from '../design_system/EmptyState.tsx';
import {
  BookOpen,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

interface TodayViewProps {
  progress: StudentProgressViewModel;
  onNavigateToRevision: () => void;
  onNavigateToMemorization: () => void;
  onStartRecitationSession?: (surahId: number, startAyah: number, endAyah: number) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  progress,
  onNavigateToRevision,
  onNavigateToMemorization,
  onStartRecitationSession,
}) => {
  const activePassage = progress.activeMemorizationRange[0] || {
    surahId: 1,
    surahNameArabic: 'الفاتحة',
    startAyah: 1,
    endAyah: 7,
  };

  const dueItems = progress.revisionOverview.items
    .filter((i) => i.urgency !== 'NO_REVIEW_REQUIRED')
    .slice(0, 3);

  const topWeaknesses = progress.weaknessOverview.weaknesses.slice(0, 2);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Dignified Welcome & Spiritual Intent */}
      <div className="bg-gradient-to-l from-emerald-950 via-emerald-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium">
            <Sparkles className="w-4 h-4" />
            <span>تعاهد القرآن الكريم وتثبيته في الصدور</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-arabic-heading tracking-tight">
            السلام عليكم ورحمة الله وبركاته
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            «تَعَاهَدُوا هذَا القُرْآنَ، فَوَالَّذِي نَفْسُ مُحَمَّدٍ بِيَدِهِ لَهُوَ أَشَدُّ تَفَلُّتًا مِنَ الإِبِلِ فِي عُقُلِهَا» &bull; مرحبًا بك في وردك اليومي.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                onStartRecitationSession?.(
                  activePassage.surahId,
                  activePassage.startAyah,
                  activePassage.endAyah
                )
              }
              className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-white min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current text-emerald-900" />
              <span>
                متابعة الحفظ: سورة {activePassage.surahNameArabic} ({activePassage.startAyah} - {activePassage.endAyah})
              </span>
            </button>

            <button
              onClick={onNavigateToRevision}
              className="px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all border border-emerald-700/60 flex items-center gap-2 cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>مراجعة اليوم ({progress.revisionOverview.totalQueueCount} آيات)</span>
            </button>
          </div>
        </div>

        <div className="absolute left-6 -bottom-6 opacity-10 text-white hidden sm:block pointer-events-none">
          <BookOpen className="w-48 h-48" />
        </div>
      </div>

      {/* 2. Key Pedagogical Metrics (Zero-Pill) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <ProgressMetric
          label="إتقان مرحلي (جدولة متباعدة)"
          value={progress.analytics.totalAyahsMastered}
          subtext="آيات مستقرة على فترات متباعدة"
          icon={CheckCircle2}
          tone="emerald"
        />
        <ProgressMetric
          label="قيد التعلّم والتمرين"
          value={progress.analytics.totalAyahsLearning + progress.analytics.totalAyahsPracticing}
          subtext="آيات جاري ترسيخها"
          icon={BookOpen}
          tone="stone"
        />
        <ProgressMetric
          label="مستحق للتعاهد اليوم"
          value={progress.revisionOverview.totalQueueCount}
          subtext={`${progress.revisionOverview.criticalCount} أولويات قصوى`}
          icon={Clock}
          tone={progress.revisionOverview.criticalCount > 0 ? 'amber' : 'default'}
        />
        <ProgressMetric
          label="المواضع التي تحتاج عناية"
          value={progress.weaknessOverview.totalWeaknessCount}
          subtext="ملاحظات متكررة في التسميع"
          icon={AlertTriangle}
          tone={progress.weaknessOverview.totalWeaknessCount > 0 ? 'amber' : 'default'}
        />
      </div>

      {/* 3. Daily Revision Queue Highlights */}
      <ProgressCard
        title="ورد المراجعة والتعاهد لليوم"
        subtitle="آيات مجدولة بحسب التكرار المتباعد لتثبيت الحفظ وصيانته من التفلت"
        action={
          <button
            onClick={onNavigateToRevision}
            className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 min-h-[44px]"
          >
            <span>عرض جدول المراجعة كاملاً</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        }
      >
        {dueItems.length === 0 ? (
          <EmptyState
            title="لا توجد مراجعات متأخرة اليوم"
            description="الحمد لله، جميع الآيات المجدولة في حالة استقرار تام. يمكنك تسميع آيات جديدة أو تثبيت المحفوظ."
            actionLabel="استعراض المصحف الشريف"
            onAction={onNavigateToMemorization}
          />
        ) : (
          <div className="space-y-3">
            {dueItems.map((item) => (
              <RevisionCard
                key={item.passageKey}
                item={item}
                onStartReview={() =>
                  onStartRecitationSession?.(item.surahId, item.ayahNumber, item.ayahNumber)
                }
              />
            ))}
          </div>
        )}
      </ProgressCard>

      {/* 4. Focal Points & Weaknesses (Gentle Reinforcement) */}
      {topWeaknesses.length > 0 && (
        <ProgressCard
          title="مواضع تحتاج عناية خاصة"
          subtitle="توجيهات تربوية لطيفة لمواضع تكرر فيها التردد أو اللحن الخفي"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topWeaknesses.map((w) => (
              <WeaknessCard
                key={w.passageKey}
                weakness={w}
                onPracticeClick={() =>
                  onStartRecitationSession?.(w.surahId, w.ayahNumber, w.ayahNumber)
                }
              />
            ))}
          </div>
        </ProgressCard>
      )}

      {/* 5. Recent Recitation Sessions */}
      {progress.recentSessions.length > 0 && (
        <ProgressCard
          title="سجل الجلسات الأخيرة"
          subtitle="تاريخ التلاوات والتسميع الموثق عبر المتصفح"
        >
          <div className="space-y-3">
            {progress.recentSessions.slice(0, 3).map((s) => (
              <SessionSummary key={s.sessionId} session={s} />
            ))}
          </div>
        </ProgressCard>
      )}
    </div>
  );
};
