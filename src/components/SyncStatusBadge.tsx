/**
 * @file SyncStatusBadge.tsx
 * @module components
 * @description Minimal and diagnostic Sync Status Badge component for Phase 8C (Section 44).
 * 
 * Displays:
 * - syncStatus: OFFLINE | CONNECTING | ONLINE | SYNCING | DEGRADED | AUTH_REQUIRED | CONFLICT
 * - pendingCount, inFlightCount
 * - lastSuccessfulSync
 * - conflictCount
 * - authRequired
 * - Interactive diagnostic panel with manual sync and conflict inspection
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  Activity,
  Layers,
  ShieldCheck,
  X,
} from 'lucide-react';
import { NetworkSyncState, SyncStatusSummary } from '../domain/sync/types.ts';
import { useSync } from '../context/SyncContext.tsx';

interface SyncStatusBadgeProps {
  summary?: SyncStatusSummary;
  onTriggerSync?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  summary: propSummary,
  onTriggerSync: propOnTriggerSync,
}) => {
  let contextValue: ReturnType<typeof useSync> | null = null;
  try {
    contextValue = useSync();
  } catch {
    // Graceful fallback if rendered outside of SyncProvider
  }

  const summary = propSummary || contextValue?.summary;
  const onTriggerSync = propOnTriggerSync || contextValue?.syncNow;
  const conflicts = contextValue?.conflicts || [];
  const resolveConflict = contextValue?.resolveConflict;

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const status = summary?.syncStatus ?? NetworkSyncState.ONLINE;
  const pendingCount = summary?.pendingCount ?? 0;
  const inFlightCount = summary?.inFlightCount ?? 0;
  const conflictCount = summary?.conflictCount ?? 0;

  const getStatusConfig = () => {
    switch (status) {
      case NetworkSyncState.ONLINE:
        return {
          label: 'متصل ومتزامن',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
        };
      case NetworkSyncState.SYNCING:
        return {
          label: 'جارٍ المزامنة...',
          color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/70',
          icon: RefreshCw,
          iconColor: 'text-blue-600 animate-spin',
        };
      case NetworkSyncState.OFFLINE:
        return {
          label: 'وضع عدم الاتصال (محلي)',
          color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70',
          icon: CloudOff,
          iconColor: 'text-amber-600',
        };
      case NetworkSyncState.CONNECTING:
        return {
          label: 'جارٍ الاتصال...',
          color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/70',
          icon: Cloud,
          iconColor: 'text-blue-500',
        };
      case NetworkSyncState.CONFLICT:
        return {
          label: `تعارض معزول (${conflictCount})`,
          color: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100/70',
          icon: AlertTriangle,
          iconColor: 'text-red-600',
        };
      case NetworkSyncState.AUTH_REQUIRED:
        return {
          label: 'مطلوب تسجيل الدخول للمزامنة',
          color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70',
          icon: ShieldAlert,
          iconColor: 'text-rose-600',
        };
      case NetworkSyncState.DEGRADED:
      default:
        return {
          label: 'المزامنة متوقفة مؤقتاً',
          color: 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200/70',
          icon: AlertTriangle,
          iconColor: 'text-stone-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${config.color}`}
        title="انقر لعرض تفاصيل المزامنة غير المتصلة (Phase 8C)"
      >
        <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
        <span className="font-arabic-heading font-semibold">{config.label}</span>

        {pendingCount > 0 && (
          <span className="bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
            {pendingCount}
          </span>
        )}

        {conflictCount > 0 && (
          <span className="bg-red-200/90 text-red-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
            {conflictCount}
          </span>
        )}

        <ChevronDown className="w-3 h-3 text-stone-500 mr-0.5 opacity-70" />
      </button>

      {/* Popover Diagnostic Window */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-stone-200 p-4 z-50 text-stone-800 text-xs animate-in fade-in zoom-in-95 duration-150" dir="rtl">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-stone-900 text-sm font-arabic-heading">
                المزامنة غير المتصلة (Phase 8C)
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3">
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
              <span className="text-[11px] text-stone-500 block">حالة الاتصال</span>
              <span className="font-bold text-stone-800 mt-0.5 block">{config.label}</span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
              <span className="text-[11px] text-stone-500 block">صندوق الصادر (Outbox)</span>
              <span className="font-bold text-stone-800 mt-0.5 block">
                {pendingCount} معلق {inFlightCount > 0 ? `(${inFlightCount} نشط)` : ''}
              </span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
              <span className="text-[11px] text-stone-500 block">آخر مزامنة ناجحة</span>
              <span className="font-medium text-stone-700 mt-0.5 block">
                {summary?.lastSuccessfulSync
                  ? new Date(summary.lastSuccessfulSync).toLocaleTimeString()
                  : 'لم تتم بعد'}
              </span>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
              <span className="text-[11px] text-stone-500 block">تعارضات الحجر الصحي</span>
              <span className={`font-bold mt-0.5 block ${conflictCount > 0 ? 'text-red-700' : 'text-stone-700'}`}>
                {conflictCount} تعارض
              </span>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 mb-3 text-[11px] text-stone-600 space-y-1">
            <div className="flex items-center gap-1 text-emerald-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>الضمانات المعمارية الصارمة:</span>
            </div>
            <p>&bull; صفر تسجيل صوتي خام (Zero Raw Audio Invariant).</p>
            <p>&bull; توقيع مشفّر SHA-256 مرتبط بالجهاز والتسلسل.</p>
            <p>&bull; حجر التعارضات دون تدخل الذكاء الاصطناعي (Anti-LWW).</p>
          </div>

          {conflicts.length > 0 && (
            <div className="border border-red-200 bg-red-50/60 rounded-lg p-2.5 mb-3 space-y-2">
              <div className="flex items-center gap-1.5 text-red-900 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>التعارضات المعزولة ({conflicts.length})</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {conflicts.map((c) => (
                  <div key={c.conflictId} className="bg-white p-2 rounded border border-red-100 text-[11px]">
                    <div className="font-mono text-stone-700 truncate">{c.eventId}</div>
                    <div className="text-stone-500 text-[10px] mt-0.5">{c.reason}</div>
                    {resolveConflict && c.status === 'OPEN' && (
                      <div className="flex gap-1.5 mt-1.5">
                        <button
                          onClick={() => resolveConflict(c.conflictId, 'LOCAL_WINS', 'اعتماد النسخة المحلية')}
                          className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] hover:bg-emerald-800"
                        >
                          المحلي هو الفائز
                        </button>
                        <button
                          onClick={() => resolveConflict(c.conflictId, 'REMOTE_WINS', 'اعتماد النسخة البعيدة')}
                          className="px-2 py-0.5 bg-blue-700 text-white rounded text-[10px] hover:bg-blue-800"
                        >
                          البعيد هو الفائز
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="text-[11px] text-stone-400 font-mono">بروتوكول v1.0.0</span>
            {onTriggerSync && (
              <button
                onClick={() => {
                  onTriggerSync();
                }}
                disabled={status === NetworkSyncState.SYNCING}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${status === NetworkSyncState.SYNCING ? 'animate-spin' : ''}`} />
                <span>مزامنة فورية الآن</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
