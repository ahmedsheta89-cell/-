/**
 * @file LoadingState.tsx & ErrorState.tsx
 * @module components/progress/design_system
 * @description Peaceful loading skeleton and gentle error state displays.
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'جاري استرجاع سجلات الحفظ والتعاهد الموثقة...',
}) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center space-y-3" dir="rtl">
      <RefreshCw className="w-6 h-6 text-emerald-800 animate-spin" />
      <p className="text-xs text-stone-500 font-medium">{message}</p>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'تعذر تحميل بيانات التقدم',
  message,
  onRetry,
}) => {
  return (
    <div
      className="p-6 bg-rose-50/60 border border-rose-200/80 rounded-2xl max-w-lg mx-auto text-center space-y-3"
      dir="rtl"
    >
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold text-rose-900 font-arabic-heading">{title}</h4>
      <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة المحاولة</span>
        </button>
      )}
    </div>
  );
};
