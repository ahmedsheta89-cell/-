/**
 * @file RevisionScheduleView.tsx
 * @module components/progress/views
 * @description Dedicated view for the student's Spaced Repetition Revision Schedule.
 * Grouped strictly into Phase 7D's 5 canonical urgency levels with reasons.
 */

import React, { useState, useMemo } from 'react';
import { RevisionOverviewViewModel, RevisionQueueItemViewModel } from '../../../domain/progress/types.ts';
import { ReviewUrgency } from '../../../domain/memorization_revision/types.ts';
import { RevisionCard } from '../design_system/RevisionCard.tsx';
import { EmptyState } from '../design_system/EmptyState.tsx';
import { ProgressCard } from '../design_system/ProgressCard.tsx';
import { Clock, AlertCircle, CheckCircle2, RotateCcw, Calendar, Play } from 'lucide-react';

interface RevisionScheduleViewProps {
  overview: RevisionOverviewViewModel;
  onStartReview?: (item: RevisionQueueItemViewModel) => void;
  onStartAllDueReviews?: () => void;
}

export const RevisionScheduleView: React.FC<RevisionScheduleViewProps> = ({
  overview,
  onStartReview,
  onStartAllDueReviews,
}) => {
  const [activeTab, setActiveTab] = useState<'DUE' | 'CRITICAL' | 'OVERDUE' | 'UPCOMING' | 'STABLE'>('DUE');

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'CRITICAL':
        return overview.items.filter((i) => i.urgency === ReviewUrgency.CRITICAL_WEAKNESS);
      case 'OVERDUE':
        return overview.items.filter((i) => i.urgency === ReviewUrgency.REVIEW_OVERDUE);
      case 'DUE':
        return overview.items.filter(
          (i) =>
            i.urgency === ReviewUrgency.CRITICAL_WEAKNESS ||
            i.urgency === ReviewUrgency.REVIEW_OVERDUE ||
            i.urgency === ReviewUrgency.REVIEW_DUE
        );
      case 'UPCOMING':
        return overview.items.filter((i) => i.urgency === ReviewUrgency.REVIEW_SOON);
      case 'STABLE':
        return overview.items.filter((i) => i.urgency === ReviewUrgency.NO_REVIEW_REQUIRED);
      default:
        return overview.items;
    }
  }, [overview, activeTab]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900 font-arabic-heading">
            جدول التعاهد والمراجعة اليومي
          </h2>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
            تنظيم تكرار الآيات استنادًا لخوارزميات التكرار المتباعد لتثبيت الحفظ وفق درجات الاستقرار
          </p>
        </div>

        {overview.totalQueueCount > 0 && onStartAllDueReviews && (
          <button
            onClick={onStartAllDueReviews}
            className="px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors min-h-[44px]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>بدء ورد مراجعة اليوم ({overview.totalQueueCount} آيات)</span>
          </button>
        )}
      </div>

      {/* 2. Interactive Urgency Tabs (Zero-Pill clean buttons) */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-stone-200/80 no-scrollbar text-xs">
        <button
          onClick={() => setActiveTab('DUE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 min-h-[44px] ${
            activeTab === 'DUE'
              ? 'bg-emerald-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>ورد اليوم المستحق ({overview.totalQueueCount})</span>
        </button>

        {overview.criticalCount > 0 && (
          <button
            onClick={() => setActiveTab('CRITICAL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 min-h-[44px] ${
              activeTab === 'CRITICAL'
                ? 'bg-rose-900 text-white shadow-xs'
                : 'text-rose-800 hover:bg-rose-50'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>أولوية قصوى ({overview.criticalCount})</span>
          </button>
        )}

        {overview.overdueCount > 0 && (
          <button
            onClick={() => setActiveTab('OVERDUE')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 min-h-[44px] ${
              activeTab === 'OVERDUE'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>مراجعات متأخرة ({overview.overdueCount})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 min-h-[44px] ${
            activeTab === 'UPCOMING'
              ? 'bg-stone-800 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>قادمة قريباً ({overview.upcomingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('STABLE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 min-h-[44px] ${
            activeTab === 'STABLE'
              ? 'bg-stone-800 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>مستقرة جدولياً ({overview.stableCount})</span>
        </button>
      </div>

      {/* 3. Items Queue */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <EmptyState
            title="لا توجد آيات في هذا التصنيف حالياً"
            description="جميع الآيات في هذه الفئة مستوفاة لشروط الجدولة ولا تتطلب تدخلاً عاجلاً."
          />
        ) : (
          filteredItems.map((item) => (
            <RevisionCard
              key={item.passageKey}
              item={item}
              onStartReview={onStartReview}
            />
          ))
        )}
      </div>
    </div>
  );
};
