/**
 * @file AnalyticsView.tsx
 * @module components/progress/analytics
 * @description Master view for Longitudinal Analytics & Progress Visualization.
 * Strictly adheres to empirical honesty, clear provenance, and Zero-Pill aesthetics.
 */

import React from 'react';
import { StudentProgressViewModel, SurahProgressViewModel } from '../../../domain/progress/types.ts';
import { ProgressCoverageChart } from './ProgressCoverageChart.tsx';
import { SurahDistributionMatrix } from './SurahDistributionMatrix.tsx';
import { ProgressMetric } from '../design_system/ProgressMetric.tsx';
import { ProgressCard } from '../design_system/ProgressCard.tsx';
import { ShieldCheck, Mic, Award, CheckCircle2, RotateCcw } from 'lucide-react';

interface AnalyticsViewProps {
  progress: StudentProgressViewModel;
  surahs: readonly SurahProgressViewModel[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ progress, surahs }) => {
  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Top Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <ProgressMetric
          label="نسبة التغطية الكلية"
          value={`${progress.analytics.globalCompletionPercentage}%`}
          subtext="من إجمالي آيات القرآن الكريم"
          tone="emerald"
        />
        <ProgressMetric
          label="دقة التلاوة التراكمية"
          value={`${progress.analytics.cumulativeAccuracyPercentage}%`}
          subtext="وفق معايير التجويد الموثقة"
          icon={CheckCircle2}
          tone="default"
        />
        <ProgressMetric
          label="جلسات التسميع الموثقة"
          value={progress.analytics.totalConfirmedSessions}
          subtext="جلسة تسميع ومراجعة"
          icon={Mic}
          tone="stone"
        />
        <ProgressMetric
          label="أحكام تجويدية مؤكدة"
          value={progress.analytics.verifiedTajweedPracticeCount}
          subtext="موضع تم التحقق منه صوتيًا"
          icon={ShieldCheck}
          tone="emerald"
        />
      </div>

      {/* 2. Macro Quran Coverage Chart */}
      <ProgressCoverageChart analytics={progress.analytics} />

      {/* 3. 30-Juz Distribution Matrix */}
      <SurahDistributionMatrix surahs={surahs} />
    </div>
  );
};
