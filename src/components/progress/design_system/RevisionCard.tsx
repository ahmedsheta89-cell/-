/**
 * @file RevisionCard.tsx
 * @module components/progress/design_system
 * @description Card representing a scheduled passage in the student's daily revision queue.
 */

import React from 'react';
import { RevisionQueueItemViewModel } from '../../../domain/progress/types.ts';
import { ReviewUrgency } from '../../../domain/memorization_revision/types.ts';
import { AlertCircle, Clock, CheckCircle2, Play } from 'lucide-react';

interface RevisionCardProps {
  item: RevisionQueueItemViewModel;
  onStartReview?: (item: RevisionQueueItemViewModel) => void;
}

export const RevisionCard: React.FC<RevisionCardProps> = ({ item, onStartReview }) => {
  const isCritical = item.urgency === ReviewUrgency.CRITICAL_WEAKNESS;
  const isOverdue = item.urgency === ReviewUrgency.REVIEW_OVERDUE;

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        isCritical
          ? 'bg-rose-50/40 border-rose-200/80'
          : isOverdue
          ? 'bg-amber-50/40 border-amber-200/80'
          : 'bg-white border-stone-200/80 hover:border-stone-300'
      }`}
      dir="rtl"
    >
      <div className="space-y-1.5 flex-1">
        {/* Top line metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-stone-900 font-arabic-heading">
            سورة {item.surahNameArabic}
          </span>
          <span className="text-stone-300" aria-hidden="true">·</span>
          <span className="text-stone-600 font-mono">الآية {item.ayahNumber}</span>
          <span className="text-stone-300" aria-hidden="true">·</span>

          {/* Urgency indicator */}
          <span
            className={`flex items-center gap-1 font-medium ${
              isCritical
                ? 'text-rose-800'
                : isOverdue
                ? 'text-amber-800'
                : 'text-emerald-800'
            }`}
          >
            {isCritical && <AlertCircle className="w-3.5 h-3.5" />}
            {isOverdue && <Clock className="w-3.5 h-3.5" />}
            {!isCritical && !isOverdue && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{item.urgencyMeta.labelArabic}</span>
          </span>

          {item.daysOverdue > 0 && (
            <span className="text-[11px] text-amber-700 font-medium">
              (متأخرة {item.daysOverdue} يوم)
            </span>
          )}
        </div>

        {/* Quran text snippet */}
        <p className="text-sm font-serif text-stone-800 line-clamp-1 font-arabic-quran">
          {item.textSnippet}
        </p>

        {/* Reason for review */}
        <div className="text-[11px] text-stone-500">
          السبب: {item.reasonCodeArabic}
        </div>
      </div>

      {/* Action button */}
      {onStartReview && (
        <button
          onClick={() => onStartReview(item)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px] shrink-0 ${
            isCritical
              ? 'bg-rose-900 hover:bg-rose-950 text-white'
              : 'bg-emerald-900 hover:bg-emerald-800 text-white'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>ابدأ المراجعة</span>
        </button>
      )}
    </div>
  );
};
