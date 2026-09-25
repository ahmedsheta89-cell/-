/**
 * @file ConflictQuarantineModal.tsx
 * @module components/progress/sync
 * @description Non-destructive human conflict resolution modal.
 * Strictly guarantees that ZERO AI models participate in resolving synchronization divergences.
 */

import React, { useState } from 'react';
import { SyncConflictRecord } from '../../../domain/sync/types.ts';
import { AlertTriangle, Check, X, ShieldAlert, Laptop, Cloud } from 'lucide-react';

interface ConflictQuarantineModalProps {
  conflicts: readonly SyncConflictRecord[];
  onResolve: (
    conflictId: string,
    choice: 'LOCAL_WINS' | 'REMOTE_WINS' | 'MANUAL_SPLIT',
    notes?: string
  ) => Promise<void>;
  onClose: () => void;
}

export const ConflictQuarantineModal: React.FC<ConflictQuarantineModalProps> = ({
  conflicts,
  onResolve,
  onClose,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [notes, setNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  if (conflicts.length === 0) {
    return null;
  }

  const current = conflicts[selectedIdx] || conflicts[0];
  const localEvent = current.localEnvelope?.payload;
  const remoteEvent = current.remoteEnvelope?.payload;

  const handleChoice = async (choice: 'LOCAL_WINS' | 'REMOTE_WINS' | 'MANUAL_SPLIT') => {
    setIsResolving(true);
    try {
      await onResolve(current.conflictId, choice, notes);
      setNotes('');
      if (conflicts.length <= 1) {
        onClose();
      } else {
        setSelectedIdx(0);
      }
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-arabic-heading">
                حل تعارض تلاوة متزامنة ({selectedIdx + 1} من {conflicts.length})
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                رُصد اختلاف بين هذا الجهاز وجهاز آخر في نفس موضع الآية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-2.5 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Side-by-side comparison of events without exposing raw hashes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Local Record */}
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 pb-1 border-b border-stone-200/60">
              <Laptop className="w-4 h-4 text-emerald-800" />
              <span>التلاوة المسجلة على هذا الجهاز (المحلي)</span>
            </div>
            <div className="text-xs text-stone-600 space-y-1">
              <div>السورة والآية: {localEvent?.surahId ? `سورة ${localEvent.surahId} : آية ${localEvent.ayahNumber}` : 'غير محدد'}</div>
              <div>نوع الحدث: {localEvent?.eventType || 'تسميع'}</div>
              <div>حالة التحقق: {localEvent?.evidenceStatus || 'مؤكد'}</div>
              <div className="text-[11px] text-stone-400">
                التاريخ: {localEvent?.timestamp ? new Date(localEvent.timestamp).toLocaleString('ar-EG') : 'غير متوفر'}
              </div>
            </div>
          </div>

          {/* Remote Record */}
          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 pb-1 border-b border-stone-200/60">
              <Cloud className="w-4 h-4 text-blue-800" />
              <span>التلاوة الواردة من الجهاز الآخر (السحابي)</span>
            </div>
            <div className="text-xs text-stone-600 space-y-1">
              <div>السورة والآية: {remoteEvent?.surahId ? `سورة ${remoteEvent.surahId} : آية ${remoteEvent.ayahNumber}` : 'غير محدد'}</div>
              <div>نوع الحدث: {remoteEvent?.eventType || 'تسميع'}</div>
              <div>حالة التحقق: {remoteEvent?.evidenceStatus || 'مؤكد'}</div>
              <div className="text-[11px] text-stone-400">
                التاريخ: {remoteEvent?.timestamp ? new Date(remoteEvent.timestamp).toLocaleString('ar-EG') : 'غير متوفر'}
              </div>
            </div>
          </div>
        </div>

        {/* Human Notes Input */}
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1.5">
            ملاحظة المعلم أو الطالب (اختياري):
          </label>
          <input
            type="text"
            placeholder="مثال: اعتمدت التلاوة المحلية لأنها الأحدث في ورد العصر..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Action Buttons: 3 explicit human choices */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            disabled={isResolving}
            onClick={() => handleChoice('LOCAL_WINS')}
            className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>اعتماد التلاوة المحلية</span>
          </button>

          <button
            disabled={isResolving}
            onClick={() => handleChoice('REMOTE_WINS')}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>اعتماد تلاوة الجهاز الآخر</span>
          </button>

          <button
            disabled={isResolving}
            onClick={() => handleChoice('MANUAL_SPLIT')}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            <span>فصل السجلين للمراجعة لاحقًا</span>
          </button>
        </div>
      </div>
    </div>
  );
};
