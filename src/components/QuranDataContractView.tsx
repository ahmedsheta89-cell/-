import React, { useState } from 'react';
import { AL_FATIHAH_AYAHS, SURAH_AL_FATIHAH } from '../infrastructure/providers/InMemoryQuranDataProvider.ts';
import { QuranAyah, QuranWord, RiwayahType } from '../domain/quran/types.ts';
import { ShieldCheck, Hash, BookMarked, Eye } from 'lucide-react';

export const QuranDataContractView: React.FC = () => {
  const [selectedAyah, setSelectedAyah] = useState<QuranAyah>(AL_FATIHAH_AYAHS[0]);
  const [selectedWord, setSelectedWord] = useState<QuranWord | null>(
    AL_FATIHAH_AYAHS[0].words.length > 0 ? AL_FATIHAH_AYAHS[0].words[0] : null
  );

  return (
    <div className="space-y-8">
      {/* Verification Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              وثيقة التحقيق والاعتماد الشرعي
            </div>
            <h2 className="text-xl font-bold text-stone-900 font-arabic-heading">
              سورة {SURAH_AL_FATIHAH.nameArabic} &bull; {SURAH_AL_FATIHAH.totalAyahs} آيات &bull; {SURAH_AL_FATIHAH.revelationType === 'MECCAN' ? 'مكية' : 'مدنية'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              المرجع: {SURAH_AL_FATIHAH.verification.sourceAuthority} ({SURAH_AL_FATIHAH.verification.editionVersion})
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-3 py-1.5 bg-stone-100 rounded-lg text-stone-700 border border-stone-200 font-mono">
              رواية: {SURAH_AL_FATIHAH.verification.riwayah}
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-200 font-mono flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" />
              SHA-256: {SURAH_AL_FATIHAH.verification.checksumSha256.substring(0, 12)}...
            </div>
          </div>
        </div>

        {/* Surah Display */}
        <div className="pt-6 space-y-4 text-center">
          <div className="py-2 text-xs text-stone-400 font-arabic-heading">
            أعوذ بالله من الشيطان الرجيم
          </div>
          <div className="p-6 sm:p-8 bg-stone-50/70 rounded-2xl border border-stone-200/70">
            <p className="font-quran text-2xl sm:text-3xl text-stone-900 leading-loose" dir="rtl">
              {AL_FATIHAH_AYAHS.map((ayah) => {
                const isSelected = ayah.id === selectedAyah.id;
                return (
                  <span
                    key={ayah.id}
                    onClick={() => {
                      setSelectedAyah(ayah);
                      if (ayah.words.length > 0) setSelectedWord(ayah.words[0]);
                    }}
                    className={`cursor-pointer transition-all px-1.5 py-0.5 rounded-lg inline-block ${
                      isSelected
                        ? 'bg-emerald-100/90 text-emerald-950 font-semibold ring-1 ring-emerald-300'
                        : 'hover:bg-stone-200/50'
                    }`}
                  >
                    {ayah.textUthmani}{' '}
                    <span className="text-emerald-800 text-lg font-serif mx-1">
                      ﴿{ayah.ayahNumber}﴾
                    </span>
                  </span>
                );
              })}
            </p>
          </div>
          <div className="text-xs text-stone-500">
            انقر على أي آية أو كلمة لاستعراض عقد البيانات الفونيمي والوسوم التجويدية
          </div>
        </div>
      </div>

      {/* Deep Contract Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ayah & Words List */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 font-arabic-heading flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-emerald-800" />
              تفصيل كلمات الآية ﴿{selectedAyah.ayahNumber}﴾
            </h3>
            <span className="text-xs text-stone-500 font-mono">ID: {selectedAyah.id}</span>
          </div>

          <div className="text-sm font-quran text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200">
            {selectedAyah.textUthmani}
          </div>

          {selectedAyah.words.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-stone-700">الكلمات المفهرسة والمقسمة:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedAyah.words.map((word) => {
                  const isWordSelected = selectedWord?.id === word.id;
                  return (
                    <button
                      key={word.id}
                      onClick={() => setSelectedWord(word)}
                      className={`p-2.5 rounded-xl text-center border transition-all ${
                        isWordSelected
                          ? 'bg-emerald-900 text-white border-emerald-950 shadow-xs'
                          : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                      }`}
                    >
                      <div className="font-quran text-lg leading-tight">{word.textUthmani}</div>
                      <div className={`text-[10px] mt-1 ${isWordSelected ? 'text-emerald-200' : 'text-stone-400'}`}>
                        كلمة {word.wordIndexInAyah}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-stone-400 p-4 bg-stone-50 rounded-xl text-center">
              تم تخزين نص الآية كاملاً ضمن مستودع الفحص الأولي.
            </div>
          )}
        </div>

        {/* Word Contract Details */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 font-arabic-heading flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-800" />
              عقد الكلمة والوحدات الفونيمية (Phonetic Breakdown)
            </h3>
            {selectedWord && <span className="text-xs text-stone-500 font-mono">Word ID: {selectedWord.id}</span>}
          </div>

          {selectedWord ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <div className="text-xs text-stone-500">النص العثماني المضبوط</div>
                  <div className="font-quran text-2xl text-stone-900">{selectedWord.textUthmani}</div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-stone-500">النص المجرد للبحث</div>
                  <div className="text-sm font-semibold text-stone-800">{selectedWord.textSimple}</div>
                </div>
              </div>

              {/* Phonetic units */}
              <div>
                <div className="text-xs font-semibold text-stone-700 mb-2">
                  الوحدات الصوتية الفونيمية (Phonetic Units - Character & Diacritic):
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedWord.phoneticUnits.length > 0 ? (
                    selectedWord.phoneticUnits.map((pu, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 bg-stone-100 rounded-lg border border-stone-200 text-center min-w-[52px]"
                      >
                        <div className="font-quran text-lg font-bold text-stone-900 leading-tight">{pu.char}</div>
                        <div className="text-[10px] text-stone-500 font-mono mt-0.5">{pu.harakah || 'مجرد'}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-stone-400">لا توجد وحدات فرعية مجزأة لهذا العقد.</div>
                  )}
                </div>
              </div>

              {/* Tajweed Annotations */}
              <div>
                <div className="text-xs font-semibold text-stone-700 mb-2">وسوم التجويد الحتمية للكلمة:</div>
                {selectedWord.tajweedAnnotations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedWord.tajweedAnnotations.map((tj) => (
                      <div key={tj.id} className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs">
                        <div className="font-bold text-amber-900 flex items-center justify-between">
                          <span>{tj.ruleNameArabic}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                            {tj.ruleCategory}
                          </span>
                        </div>
                        <p className="text-stone-600 mt-1">{tj.description}</p>
                        {tj.durationHarakah && (
                          <div className="mt-1 text-[11px] text-amber-800 font-medium">
                            المقدار: {tj.durationHarakah} حركات
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-stone-500 p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                    أحكام الحروف في هذه الكلمة تجري على الأصل (الإظهار والترقيق والمد الطبيعي).
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-stone-400 p-6 text-center">اختر كلمة من القائمة أعلاه للاستعراض.</div>
          )}
        </div>
      </div>
    </div>
  );
};
