/**
 * @file SyncStatusBanner.tsx
 * @module components/progress/sync
 * @description Dignified banner displaying Phase 8C offline-first & synchronization status.
 * Avoids exposing internal cryptographic hashes in student views.
 */

import React from 'react';
import { SyncStatusSummary, NetworkSyncState } from '../../../domain/sync/types.ts';
import { CheckCircle2, WifiOff, RefreshCw, AlertTriangle, CloudUpload, Lock } from 'lucide-react';

interface SyncStatusBannerProps {
  summary: SyncStatusSummary;
  onSyncNow?: () => void;
  onViewConflicts?: () => void;
  className?: string;
}

export const SyncStatusBanner: React.FC<SyncStatusBannerProps> = ({
  summary,
  onSyncNow,
  onViewConflicts,
  className = '',
}) => {
  const isOnline = summary.isOnline;
  const isSyncing = summary.syncStatus === NetworkSyncState.SYNCING;
  const hasConflicts = summary.conflictCount > 0;
  const hasPending = summary.pendingCount > 0;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
        hasConflicts
          ? 'bg-amber-50/70 border-amber-300 text-amber-900'
          : !isOnline
          ? 'bg-stone-100 border-stone-200 text-stone-700'
          : hasPending
          ? 'bg-blue-50/60 border-blue-200 text-blue-900'
          : 'bg-emerald-50/40 border-emerald-200/60 text-emerald-900'
      } ${className}`}
      dir="rtl"
    >
      <div className="flex items-center gap-2.5">
        {hasConflicts ? (
          <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
        ) : !isOnline ? (
          <WifiOff className="w-4 h-4 text-stone-500 shrink-0" />
        ) : isSyncing ? (
          <RefreshCw className="w-4 h-4 text-emerald-700 animate-spin shrink-0" />
        ) : hasPending ? (
          <CloudUpload className="w-4 h-4 text-blue-700 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
        )}

        <div>
          <span className="font-bold">
            {hasConflicts
              ? 'يوجد تعارض في التلاوة بين أجهزة متعددة'
              : !isOnline
              ? 'أنت تعمل دون اتصال بالشبكة (البيانات محفوظة على جهازك)'
              : isSyncing
              ? 'جاري مزامنة بيانات التسميع...'
              : hasPending
              ? `يوجد ${summary.pendingCount} سجلات بانتظار المزامنة`
              : 'جميع تلاواتك وسجلات الحفظ متزامنة ومؤمّنة'}
          </span>
          <span className="text-[11px] block sm:inline sm:mr-2 opacity-80">
            {hasConflicts
              ? 'يرجى مراجعة الاختلاف واعتماد النسخة الصحيحة يدويًا'
              : !isOnline
              ? 'المتصفح يحفظ كل أحداث التلاوة محليًا وسيقوم بالمزامنة فور الاتصال'
              : summary.lastSuccessfulSync
              ? `آخر مزامنة ناجحة: ${new Date(summary.lastSuccessfulSync).toLocaleTimeString('ar-EG')}`
              : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        {hasConflicts && onViewConflicts && (
          <button
            onClick={onViewConflicts}
            className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors min-h-[44px]"
          >
            حل التعارض ({summary.conflictCount})
          </button>
        )}

        {isOnline && !isSyncing && onSyncNow && (
          <button
            onClick={onSyncNow}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200/80 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>مزامنة الآن</span>
          </button>
        )}
      </div>
    </div>
  );
};
