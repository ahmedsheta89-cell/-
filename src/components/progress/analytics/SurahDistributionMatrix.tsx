/**
 * @file SurahDistributionMatrix.tsx
 * @module components/progress/analytics
 * @description 30-Juz visual density grid showing student memorization distribution.
 */

import React from 'react';
import { SurahProgressViewModel } from '../../../domain/progress/types.ts';
import { ProgressCard } from '../design_system/ProgressCard.tsx';

interface SurahDistributionMatrixProps {
  surahs: readonly SurahProgressViewModel[];
  onSelectSurah?: (surahId: number) => void;
}

export const SurahDistributionMatrix: React.FC<SurahDistributionMatrixProps> = ({
  surahs,
  onSelectSurah,
}) => {
  // Aggregate by Juz (1..30)
  const juzAggregates = Array.from({ length: 30 }, (_, idx) => {
    const juzNum = idx + 1;
    const juzSurahs = surahs.filter((s) => s.juzNumber === juzNum);
    const totalAyahs = juzSurahs.reduce((acc, s) => acc + s.totalAyahs, 0);
    const masteredAyahs = juzSurahs.reduce((acc, s) => acc + s.masteredAyahsCount, 0);
    const learningAyahs = juzSurahs.reduce(
      (acc, s) => acc + s.learningAyahsCount + s.practicingAyahsCount,
      0
    );
    const percentage = totalAyahs > 0 ? Math.round((masteredAyahs / totalAyahs) * 100) : 0;

    return {
      juzNumber: juzNum,
      surahsCount: juzSurahs.length,
      totalAyahs,
      masteredAyahs,
      learningAyahs,
      percentage,
    };
  });

  return (
    <ProgressCard
      title="خريطة أجزاء القرآن الكريم (30 جزءًا)"
      subtitle="نظرة شاملة على مسار الحفظ والتعاهد عبر أجزاء المصحف الشريف"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5" dir="rtl">
        {juzAggregates.map((juz) => {
          const isStarted = juz.masteredAyahs > 0 || juz.learningAyahs > 0;
          const isMastered = juz.percentage >= 95;

          return (
            <div
              key={juz.juzNumber}
              className={`p-3 rounded-xl border text-center transition-all ${
                isMastered
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-semibold'
                  : isStarted
                  ? 'bg-amber-50/40 border-amber-200/80 text-stone-900'
                  : 'bg-stone-50/60 border-stone-200/60 text-stone-500'
              }`}
            >
              <div className="text-[11px] font-medium text-stone-500">الجزء</div>
              <div className="text-base font-bold font-mono my-0.5">{juz.juzNumber}</div>
              <div className="text-[10px] text-stone-400 font-mono">
                {juz.masteredAyahs} / {juz.totalAyahs} آية
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-stone-200/80 h-1 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full ${isMastered ? 'bg-emerald-800' : 'bg-amber-700'}`}
                  style={{ width: `${juz.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ProgressCard>
  );
};
