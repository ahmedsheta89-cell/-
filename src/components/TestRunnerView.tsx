import React, { useState, useEffect } from 'react';
import { runDomainTestSuite, TestResult } from '../tests/domain.test.ts';
import { runPhase3TestSuite, Phase3TestResult } from '../tests/recitation_phase3.test.ts';
import { CheckCircle2, XCircle, Play, ShieldCheck, RefreshCw } from 'lucide-react';

export const TestRunnerView: React.FC = () => {
  const [results, setResults] = useState<(TestResult | Phase3TestResult)[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);

  const executeTests = async () => {
    setIsRunning(true);
    // Add brief micro-delay for realistic UI feedback
    setTimeout(async () => {
      const res1 = await runDomainTestSuite();
      const res2 = await runPhase3TestSuite();
      setResults([...res1, ...res2]);
      setIsRunning(false);
      setHasExecuted(true);
    }, 250);
  };

  useEffect(() => {
    // Auto-run tests on component mount to prove architecture works
    executeTests();
  }, []);

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              فحص القيود المعمارية والنطاق
            </div>
            <h2 className="text-xl font-bold text-stone-900 font-arabic-heading">
              منصة اختبارات النطاق الحتمية (Domain & Architecture Test Suite)
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              اختبارات آلية مستقلة للتأكد من انضباط آلة الحالة، ومصفوفة الثقة، ونزاهة النصوص الدينية، وحوكمة الصلاحيات.
            </p>
          </div>

          <button
            onClick={executeTests}
            disabled={isRunning}
            className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 disabled:bg-stone-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                جارٍ تشغيل الاختبارات...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                إعادة تشغيل الاختبارات
              </>
            )}
          </button>
        </div>

        {/* Score Summary */}
        {hasExecuted && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">إجمالي الفحوصات المعمارية</div>
              <div className="text-2xl font-bold text-stone-900 font-mono">{totalCount}</div>
            </div>
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <div className="text-xs text-emerald-800 mb-1">الفحوصات الناجحة</div>
              <div className="text-2xl font-bold text-emerald-900 font-mono">{passedCount}</div>
            </div>
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">حالة المنظومة</div>
              <div className="text-sm font-bold text-emerald-800 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {passedCount === totalCount ? 'سليمة ومتطابقة مع الشروط' : 'توجد إخفاقات'}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Results List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-stone-700">سجل نتائج الفحص التفصيلي:</div>
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
            {results.map((r, idx) => (
              <div key={idx} className="p-3.5 bg-white hover:bg-stone-50/80 transition flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {r.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-stone-900">{r.name}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5 font-mono">
                      Category: {r.category} {r.message && `| Error: ${r.message}`}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                    r.passed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {r.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
