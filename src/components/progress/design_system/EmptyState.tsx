/**
 * @file EmptyState.tsx
 * @module components/progress/design_system
 * @description Dignified empty state display that reassures the student rather than treating empty data as an error.
 */

import React from 'react';
import { BookOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = BookOpen,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`py-12 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto ${className}`}
      dir="rtl"
    >
      <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3 border border-stone-200/60">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-stone-800 font-arabic-heading mb-1">
        {title}
      </h4>
      <p className="text-xs text-stone-500 leading-relaxed max-w-xs mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-emerald-700 min-h-[44px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
