import React, { useState } from 'react';
import { DOMAIN_MODULES_REGISTRY, DomainModuleId } from '../domain/modules.ts';
import { Shield, Lock, Layers, Cpu, Server, CheckCircle2 } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<DomainModuleId>(DomainModuleId.QURAN);
  const currentMod = DOMAIN_MODULES_REGISTRY[selectedModule];

  return (
    <div className="space-y-8">
      {/* Principle Banner */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-stone-800">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            الميثاق المعماري الصارم
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-arabic-heading text-white leading-snug">
            Verified Religious Data + Deterministic Rules + Audio/Phonetic Analysis + AI Teaching Layer
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            القرآن الكريم وحي معصوم محفوظ؛ لا يجوز للذكاء الاصطناعي اختراع نص، أو تعديل آية، أو إصدار حكم ديني من تلقاء نفسه.
            تعتمد المنظومة على عزل تام بين البيانات الدينية المعتمدة، والمحرك الحتمي للقواعد، والمحاذاة الفونيمية، بينما يقتصر دور الـAI على الشرح البيداغوجي التربوي المصاحب.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-stone-800/70 p-3.5 rounded-xl border border-stone-700/60">
              <div className="text-xs text-stone-400 mb-1">البيانات الدينية</div>
              <div className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                محصنة وغير قابلة للتوليد
              </div>
            </div>
            <div className="bg-stone-800/70 p-3.5 rounded-xl border border-stone-700/60">
              <div className="text-xs text-stone-400 mb-1">استقلال الخدمات</div>
              <div className="text-sm font-semibold text-sky-300 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-sky-400" />
                Zero Vendor Lock-in
              </div>
            </div>
            <div className="bg-stone-800/70 p-3.5 rounded-xl border border-stone-700/60">
              <div className="text-xs text-stone-400 mb-1">الروايات المعتمدة</div>
              <div className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                حفص وقابلة لتعدد الروايات
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Architecture Diagram */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <h3 className="text-lg font-bold text-stone-900 font-arabic-heading mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-800" />
          طبقات المعمارية النظيفة (Clean Architecture Layers)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70">
            <div className="text-xs font-semibold text-amber-800 mb-1">1. النطاق الأصيل (Domain Core)</div>
            <p className="text-xs text-stone-600 mb-2">
              نماذج القرآن، التجويد، الحفظ، مصفوفة الثقة، دورة المعلم، وتصنيف الأخطاء.
            </p>
            <span className="inline-block text-[11px] font-medium text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded">
              خالٍ من أي Vendor أو UI
            </span>
          </div>

          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200/70">
            <div className="text-xs font-semibold text-sky-800 mb-1">2. خدمات التطبيق (Application)</div>
            <p className="text-xs text-stone-600 mb-2">
              تنسيق جلسات التسميع، محرك دورة المعلم (TeacherSessionEngine)، وتتبع التقدم.
            </p>
            <span className="inline-block text-[11px] font-medium text-sky-900 bg-sky-100/70 px-2 py-0.5 rounded">
              Pure Business Workflows
            </span>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/70">
            <div className="text-xs font-semibold text-purple-800 mb-1">3. واجهات البنية التحتية (Ports)</div>
            <p className="text-xs text-stone-600 mb-2">
              AuthProvider, DatabaseProvider, AIProvider, QuranDataProvider, AudioProvider.
            </p>
            <span className="inline-block text-[11px] font-medium text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded">
              Dependency Inversion
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
            <div className="text-xs font-semibold text-emerald-800 mb-1">4. المحولات والواجهات (Adapters)</div>
            <p className="text-xs text-stone-600 mb-2">
              Web SPA، ومهيئات التخزين والذكاء الاصطناعي مع قابلية ربط تطبيقات الموبايل.
            </p>
            <span className="inline-block text-[11px] font-medium text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded">
              Web & Mobile Ready
            </span>
          </div>
        </div>
      </div>

      {/* 18 Domain Modules Interactive Explorer */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-stone-900 font-arabic-heading flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-800" />
              الوحدات الـ 18 المحددة للنطاق (Domain Modules Catalog)
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              فصل كامل للمسؤوليات مع تحديد التبعيات الصريحة وما إذا كانت الوحدة حتمية حصريًا.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
            18 Modules Defined
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Module Selector List */}
          <div className="lg:col-span-4 max-h-96 overflow-y-auto space-y-1.5 pr-1">
            {Object.values(DOMAIN_MODULES_REGISTRY).map((mod) => {
              const isSelected = mod.id === selectedModule;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod.id)}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-900 text-white font-medium shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/50'
                  }`}
                >
                  <div className="truncate">
                    <span className="block font-semibold">{mod.nameArabic}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-stone-400'}`}>
                      {mod.nameEnglish}
                    </span>
                  </div>
                  {mod.isDeterministicOnly && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-200/70 text-stone-600'
                      }`}
                    >
                      حتمي
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Module Detailed Card */}
          <div className="lg:col-span-8 bg-stone-50/80 rounded-xl p-5 border border-stone-200/80 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div>
                  <h4 className="text-base font-bold text-stone-900 font-arabic-heading">{currentMod.nameArabic}</h4>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">{currentMod.id} &bull; {currentMod.nameEnglish}</div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    currentMod.isDeterministicOnly
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {currentMod.isDeterministicOnly ? 'قواعد حتمية قطعية' : 'معالجة صوتية / ذكاء اصطناعي'}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-stone-800 mb-1">وصف الوحدة:</div>
                <p className="text-xs text-stone-600 leading-relaxed">{currentMod.description}</p>
              </div>

              <div>
                <div className="text-xs font-semibold text-stone-800 mb-2">المسؤوليات المعمارية:</div>
                <ul className="space-y-1.5">
                  {currentMod.responsibilities.map((resp, idx) => (
                    <li key={idx} className="text-xs text-stone-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-1.5 shrink-0" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded-lg bg-white border border-stone-200/70 text-xs">
                  <span className="font-semibold text-stone-700 block mb-1">التبعيات الواردة (Inbound):</span>
                  <div className="flex flex-wrap gap-1">
                    {currentMod.inboundDependencies.length > 0 ? (
                      currentMod.inboundDependencies.map((dep) => (
                        <span key={dep} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                          {dep}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-stone-400">لا توجد</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-stone-200/70 text-xs">
                  <span className="font-semibold text-stone-700 block mb-1">التبعيات الصادرة (Outbound):</span>
                  <div className="flex flex-wrap gap-1">
                    {currentMod.outboundDependencies.length > 0 ? (
                      currentMod.outboundDependencies.map((dep) => (
                        <span key={dep} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                          {dep}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-stone-400">نطاق أساسي مستقل</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
