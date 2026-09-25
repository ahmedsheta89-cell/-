/**
 * @file SurahProgressRow.tsx
 * @module components/progress/design_system
 * @description Row component for exploring Surah-level memorization progress.
 */

import React, { useState } from 'react';
import { SurahProgressViewModel, AyahProgressViewModel } from '../../../domain/progress/types.ts';
import { ChevronDown, ChevronUp, BookOpen, AlertTriangle } from 'lucide-react';
import { AyahProgressCard } from './AyahProgressCard.tsx';

interface SurahProgressRowProps {
  surah: SurahProgressViewModel;
  onPracticeAyah?: (surahId: number, ayahNumber: number) => void;
  defaultExpanded?: boolean;
}

export const SurahProgressRow: React.FC<SurahProgressRowProps> = ({
  surah,
  onPracticeAyah,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className="bg-white rounded-xl border border-stone-200/80 overflow-hidden transition-all hover:border-stone-300"
      dir="rtl"
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-stone-50/40 hover:bg-stone-50/80 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        aria-expanded={expanded}
      >
        {/* Left/Start side: Surah identifier & name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-700 font-mono font-bold text-xs flex items-center justify-center border border-stone-200/60">
            {surah.surahId}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-stone-900 font-arabic-heading">
                سورة {surah.nameArabic}
              </h4>
              <span className="text-[11px] text-stone-400">
                ({surah.revelationType === 'MECCAN' ? 'مكية' : 'مدنية'} · {surah.totalAyahs} آيات)
              </span>
              {surah.hasCriticalWeakness && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-800" title="يوجد موضع يحتاج تركيز وتصحيح">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              الجزء {surah.juzNumber} · {surah.masteredAyahsCount} متقنة · {surah.learningAyahsCount + surah.practicingAyahsCount} قيد الحفظ · {surah.needsReviewCount} للمراجعة
            </div>
          </div>
        </div>

        {/* Right side: Progress Bar & Toggle */}
        <div className="flex items-center gap-4 self-end sm:self-center">
          <div className="w-32 sm:w-40 flex flex-col items-end gap-1">
            <span className="text-xs font-mono font-bold text-stone-700">
              {surah.completionPercentage}%
            </span>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-800 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, surah.completionPercentage))}%` }}
              />
            </div>
          </div>

          <div className="text-stone-400 p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Ayahs List */}
      {expanded && (
        <div className="p-4 border-t border-stone-100 bg-stone-50/20 space-y-3">
          <div className="text-xs text-stone-500 font-medium pb-1 flex items-center justify-between">
            <span>آيات السورة الكريمة ({surah.ayahs.length}):</span>
            <span className="text-[11px] text-stone-400">بيانات موثقة من مصحف المدينة النبوية</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {surah.ayahs.map((ayah: AyahProgressViewModel) => (
              <AyahProgressCard
                key={ayah.passageKey}
                ayah={ayah}
                onPracticeClick={() => onPracticeAyah?.(surah.surahId, ayah.ayahNumber)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
