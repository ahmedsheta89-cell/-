/**
 * @file ProgressMetric.tsx
 * @module components/progress/design_system
 * @description Pure typographic metric counter adhering to the Zero-Pill discipline.
 * Avoids candy badge borders, rainbow chips, and gamified animations.
 */

import React from 'react';

interface ProgressMetricProps {
  label: string;
  value: number | string;
  subtext?: string;
  trend?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'emerald' | 'amber' | 'stone';
}

export const ProgressMetric: React.FC<ProgressMetricProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'default',
}) => {
  const toneValueColors: Record<string, string> = {
    default: 'text-stone-900',
    emerald: 'text-emerald-900',
    amber: 'text-amber-900',
    stone: 'text-stone-700',
  };

  return (
    <div className="flex flex-col p-4 bg-stone-50/70 rounded-xl border border-stone-200/60" dir="rtl">
      <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-1">
        <span>{label}</span>
        {Icon && <Icon className="w-4 h-4 text-stone-400" />}
      </div>
      <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${toneValueColors[tone]}`}>
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] text-stone-500 mt-1 leading-normal">
          {subtext}
        </div>
      )}
    </div>
  );
};
