/**
 * @file ProgressCoverageChart.tsx
 * @module components/progress/analytics
 * @description Macro coverage breakdown of the Holy Quran (6,236 Ayahs total).
 * Strict adherence: no pseudo-neuroscience, honest descriptive metrics with provenance.
 */

import React from 'react';
import { ProgressAnalyticsViewModel } from '../../../domain/progress/types.ts';
import { ProgressCard } from '../design_system/ProgressCard.tsx';
import { ShieldCheck, Info } from 'lucide-react';

interface ProgressCoverageChartProps {
  analytics: ProgressAnalyticsViewModel;
}

export const ProgressCoverageChart: React.FC<ProgressCoverageChartProps> = ({ analytics }) => {
  const segments = [
    {
      label: 'إتقان مرحلي (جدولة متباعدة)',
      count: analytics.totalAyahsMastered,
      color: 'bg-emerald-800',
      textColor: 'text-emerald-900',
    },
    {
      label: 'مستقر في الحفظ',
      count: analytics.totalAyahsStable,
      color: 'bg-emerald-600',
      textColor: 'text-emerald-700',
    },
    {
      label: 'مرحلة التمرين',
      count: analytics.totalAyahsPracticing,
      color: 'bg-teal-600',
      textColor: 'text-teal-700',
    },
    {
      label: 'قيد التعلّم والتلقي',
      count: analytics.totalAyahsLearning,
      color: 'bg-amber-600',
      textColor: 'text-amber-700',
    },
    {
      label: 'لم يبدأ بعد',
      count: analytics.totalAyahsUnstarted,
      color: 'bg-stone-200',
      textColor: 'text-stone-500',
    },
  ];

  return (
    <ProgressCard
      title="تغطية الحفظ الإجمالية في المصحف الشريف"
      subtitle="توزيع الآيات الكريمة الـ 6,236 وفق الحالات التربوية المعتمدة"
    >
      <div className="space-y-5" dir="rtl">
        {/* Multi-segment Progress Bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-stone-100 p-0.5 border border-stone-200/80">
          {segments.map((s, idx) => {
            const pct = (s.count / analytics.totalQuranAyahs) * 100;
            if (pct <= 0) return null;
            return (
              <div
                key={idx}
                className={`${s.color} h-full transition-all duration-300 first:rounded-r-full last:rounded-l-full`}
                style={{ width: `${pct}%` }}
                title={`${s.label}: ${s.count} آية (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend / Breakdown List (Zero-Pill clean typography) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {segments.map((s, idx) => {
            const pct = ((s.count / analytics.totalQuranAyahs) * 100).toFixed(1);
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-stone-50/60 border border-stone-200/60"
              >
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-3 h-3 rounded-full ${s.color} shrink-0`} />
                  <span className="text-stone-700 font-medium">{s.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="font-bold text-stone-900">{s.count}</span>
                  <span className="text-stone-400">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Honest Provenance Note */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-[11px] text-stone-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-stone-700">مصدر المؤشرات: </span>
            هذه الأرقام هي حصر دقيق لجلسات التسميع الموثقة المسجلة في قاعدة بيانات المتصفح، ولا تقدم المنظومة تخمينات ذهنية أو ادعاءات عصبية غير مثبتة علميًا.
          </p>
        </div>
      </div>
    </ProgressCard>
  );
};
