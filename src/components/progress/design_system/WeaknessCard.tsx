/**
 * @file WeaknessCard.tsx
 * @module components/progress/design_system
 * @description Card highlighting recurring focal points that require gentle pedagogical reinforcement.
 */

import React from 'react';
import { WeaknessItemViewModel } from '../../../domain/progress/types.ts';
import { AlertTriangle, Lightbulb } from 'lucide-react';

interface WeaknessCardProps {
  weakness: WeaknessItemViewModel;
  onPracticeClick?: (weakness: WeaknessItemViewModel) => void;
}

export const WeaknessCard: React.FC<WeaknessCardProps> = ({ weakness, onPracticeClick }) => {
  return (
    <div
      className="p-4 rounded-xl border border-stone-200/90 bg-stone-50/50 hover:bg-white hover:border-stone-300 transition-all space-y-2.5"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-900 font-arabic-heading">
            سورة {weakness.surahNameArabic}
          </span>
          <span className="text-stone-300" aria-hidden="true">·</span>
          <span className="text-stone-600 font-mono">الآية {weakness.ayahNumber}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>تكررت الملاحظة {weakness.recurrenceCount} مرات</span>
        </div>
      </div>

      <div className="text-sm font-serif text-stone-800 line-clamp-1 font-arabic-quran">
        {weakness.textSnippet}
      </div>

      <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs text-amber-900 flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">توجيه المعلم: </span>
          <span>{weakness.suggestedPedagogicalAction}</span>
        </div>
      </div>

      {onPracticeClick && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={() => onPracticeClick(weakness)}
            className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 underline underline-offset-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 min-h-[44px] flex items-center"
          >
            تثبيت هذا الموضع الآن
          </button>
        </div>
      )}
    </div>
  );
};
