/**
 * @file AyahProgressCard.tsx
 * @module components/progress/design_system
 * @description Card representing a single Ayah's learning and review trajectory.
 * Adheres strictly to Zero-Pill discipline: metadata rendered cleanly with typographic separators.
 */

import React from 'react';
import { AyahProgressViewModel } from '../../../domain/progress/types.ts';
import { MemorizationState, ReviewUrgency } from '../../../domain/memorization_revision/types.ts';
import { CheckCircle2, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

interface AyahProgressCardProps {
  ayah: AyahProgressViewModel;
  onPracticeClick?: (ayah: AyahProgressViewModel) => void;
  showText?: boolean;
}

export const AyahProgressCard: React.FC<AyahProgressCardProps> = ({
  ayah,
  onPracticeClick,
  showText = true,
}) => {
  const isMastered = ayah.state === MemorizationState.MASTERED;
  const isUrgent = ayah.urgency === ReviewUrgency.CRITICAL_WEAKNESS || ayah.urgency === ReviewUrgency.REVIEW_OVERDUE;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isUrgent
          ? 'bg-amber-50/40 border-amber-200/80'
          : isMastered
          ? 'bg-emerald-50/30 border-emerald-200/60'
          : 'bg-white border-stone-200/80 hover:border-stone-300'
      }`}
      dir="rtl"
    >
      {/* Top Header: Location, State, and Urgency */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center gap-2 font-mono font-medium text-stone-700">
          <span>الآية {ayah.ayahNumber}</span>
          <span className="text-stone-300" aria-hidden="true">·</span>
          <span className="text-stone-500 font-sans">{ayah.stateMeta.labelArabic}</span>
        </div>

        {/* Clean, unboxed text urgency with subtle dot */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium">
          {ayah.urgency === ReviewUrgency.CRITICAL_WEAKNESS && (
            <span className="flex items-center gap-1 text-rose-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>أولوية قصوى</span>
            </span>
          )}
          {ayah.urgency === ReviewUrgency.REVIEW_OVERDUE && (
            <span className="flex items-center gap-1 text-amber-800">
              <Clock className="w-3.5 h-3.5" />
              <span>مراجعة متأخرة</span>
            </span>
          )}
          {ayah.urgency === ReviewUrgency.REVIEW_DUE && (
            <span className="flex items-center gap-1 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مستحقة اليوم</span>
            </span>
          )}
          {ayah.urgency === ReviewUrgency.NO_REVIEW_REQUIRED && (
            <span className="text-stone-400">مستقرة جدولياً</span>
          )}
        </div>
      </div>

      {/* Verified Uthmani Text Display */}
      {showText && (
        <div className="my-3 py-2 text-stone-900 font-serif text-lg leading-loose text-center font-arabic-quran selection:bg-emerald-900 selection:text-white">
          {ayah.textUthmani}
        </div>
      )}

      {/* Pedagogical Note / Mastered Disclaimer */}
      {isMastered && (
        <p className="text-[11px] text-emerald-800/80 bg-emerald-100/50 p-2 rounded-lg mb-2 leading-relaxed">
          * حالة جدولية تربوية: تخضع للتعاهد المتباعد، وليست إجازة إسنادية.
        </p>
      )}

      {/* Stats Line: Attempts, Accuracy, Inconclusive */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
        <div className="flex items-center gap-2">
          <span>التكرار: {ayah.totalAttemptsCount}</span>
          <span className="text-stone-300" aria-hidden="true">·</span>
          <span>الدقة: {ayah.historicalAccuracyPercentage}%</span>
          {ayah.inconclusiveCount > 0 && (
            <>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="text-stone-400 flex items-center gap-1" title="إشارات صوتية غير كافية لم تحتسب كأخطاء">
                <HelpCircle className="w-3 h-3" />
                <span>غير جازمة: {ayah.inconclusiveCount}</span>
              </span>
            </>
          )}
        </div>

        {onPracticeClick && (
          <button
            onClick={() => onPracticeClick(ayah)}
            className="text-emerald-900 hover:text-emerald-950 font-semibold underline underline-offset-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 min-h-[44px] inline-flex items-center"
          >
            تسميع الآن
          </button>
        )}
      </div>
    </div>
  );
};
