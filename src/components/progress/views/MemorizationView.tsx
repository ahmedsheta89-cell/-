/**
 * @file MemorizationView.tsx
 * @module components/progress/views
 * @description Comprehensive Quran memorization explorer across all 114 Surahs.
 * Allows filtering by Juz, Surah, and pedagogical memorization state.
 */

import React, { useState, useMemo } from 'react';
import { SurahProgressViewModel } from '../../../domain/progress/types.ts';
import { SurahProgressRow } from '../design_system/SurahProgressRow.tsx';
import { EmptyState } from '../design_system/EmptyState.tsx';
import { Search, BookOpen, Layers, ShieldCheck, Info } from 'lucide-react';

interface MemorizationViewProps {
  surahs: readonly SurahProgressViewModel[];
  onPracticeAyah?: (surahId: number, ayahNumber: number) => void;
}

export const MemorizationView: React.FC<MemorizationViewProps> = ({
  surahs,
  onPracticeAyah,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJuz, setSelectedJuz] = useState<number | 'ALL'>('ALL');
  const [filterState, setFilterState] = useState<'ALL' | 'MASTERED' | 'LEARNING' | 'NEEDS_REVIEW'>('ALL');

  // Filtered Surahs
  const filteredSurahs = useMemo(() => {
    return surahs.filter((s) => {
      // 1. Search filter
      const matchesSearch =
        s.nameArabic.includes(searchTerm) ||
        s.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.surahId.toString() === searchTerm.trim();

      if (!matchesSearch) return false;

      // 2. Juz filter
      if (selectedJuz !== 'ALL' && s.juzNumber !== selectedJuz) {
        return false;
      }

      // 3. State filter
      if (filterState === 'MASTERED' && s.masteredAyahsCount === 0) return false;
      if (filterState === 'LEARNING' && s.learningAyahsCount + s.practicingAyahsCount === 0) return false;
      if (filterState === 'NEEDS_REVIEW' && s.needsReviewCount === 0) return false;

      return true;
    });
  }, [surahs, searchTerm, selectedJuz, filterState]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header & Pedagogical Disclaimer */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900 font-arabic-heading">
              متابعة حفظ القرآن الكريم (114 سورة)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              تصفح سور المصحف الشريف والآيات الكريمة وفق رواية حفص عن عاصم من طريق الشاطبية
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>بيانات موثقة من مجمع الملك فهد</span>
          </div>
        </div>

        {/* Inviolable Mastered Disclaimer */}
        <div className="p-3 bg-stone-50 border border-stone-200/70 rounded-xl text-xs text-stone-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-stone-800">تنويه تربوي شرعي: </span>
            <span>
              تصنيف «الإتقان» في هذا النظام هو حالة جدولية مبنية على خوارزميات التكرار المتباعد لتنظيم أوقات التسميع، ولا يمثل إجازة بالسند المتصل أو شهادة إتقان شرعية.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search and Filters (Clean zero-pill buttons) */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث باسم السورة (مثلاً: الفاتحة، الكهف) أو رقمها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-2 bg-stone-50/70 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700 min-h-[44px]"
            />
          </div>

          {/* Juz Selector */}
          <div className="w-full sm:w-48">
            <select
              value={selectedJuz}
              onChange={(e) =>
                setSelectedJuz(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="w-full px-3 py-2 bg-stone-50/70 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700 min-h-[44px]"
            >
              <option value="ALL">جميع الأجزاء (30 جزءًا)</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <option key={j} value={j}>
                  الجزء {j}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* State Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
          <span className="text-stone-400 text-[11px] whitespace-nowrap ml-2">تصفية:</span>
          {(
            [
              { id: 'ALL', label: 'الكل' },
              { id: 'MASTERED', label: 'المتقن جدولياً' },
              { id: 'LEARNING', label: 'قيد الحفظ والتمرين' },
              { id: 'NEEDS_REVIEW', label: 'مستحق للمراجعة' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterState(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                filterState === tab.id
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Surahs List */}
      <div className="space-y-3">
        {filteredSurahs.length === 0 ? (
          <EmptyState
            title="لا توجد سور مطابقة لخيارات البحث"
            description="جرّب تعديل كلمات البحث أو تصفية الأجزاء لعرض المزيد من السور الكريمة."
            actionLabel="إعادة تعيين البحث"
            onAction={() => {
              setSearchTerm('');
              setSelectedJuz('ALL');
              setFilterState('ALL');
            }}
          />
        ) : (
          filteredSurahs.map((surah) => (
            <SurahProgressRow
              key={surah.surahId}
              surah={surah}
              onPracticeAyah={onPracticeAyah}
              defaultExpanded={filteredSurahs.length === 1}
            />
          ))
        )}
      </div>
    </div>
  );
};
