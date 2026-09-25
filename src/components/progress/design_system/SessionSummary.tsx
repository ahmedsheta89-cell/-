/**
 * @file SessionSummary.tsx
 * @module components/progress/design_system
 * @description Summary card representing a past recitation session.
 */

import React from 'react';
import { SessionHistoryItemViewModel } from '../../../domain/progress/types.ts';
import { CheckCircle2, RotateCcw, Clock, HelpCircle } from 'lucide-react';

interface SessionSummaryProps {
  session: SessionHistoryItemViewModel;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ session }) => {
  const formattedDate = new Date(session.timestamp).toLocaleDateString('ar-EG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="p-4 rounded-xl border border-stone-200/80 bg-white hover:border-stone-300 transition-all space-y-2"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-900 font-arabic-heading">
            سورة {session.surahNameArabic}
          </span>
          <span className="text-stone-300" aria-hidden="true">·</span>
          <span className="text-stone-600 font-mono">{session.ayahRange}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-stone-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
      </div>

      <p className="text-xs text-stone-600 leading-relaxed">
        {session.summaryArabic}
      </p>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
        <span className="flex items-center gap-1 text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>مواضع مؤكدة: {session.confirmedCount}</span>
        </span>
        <span className="text-stone-300" aria-hidden="true">·</span>
        <span className="flex items-center gap-1 text-amber-800">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادات وتصحيح: {session.correctedCount}</span>
        </span>
        {session.inconclusiveCount > 0 && (
          <>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-stone-400">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>إشارات غير جازمة: {session.inconclusiveCount}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};
