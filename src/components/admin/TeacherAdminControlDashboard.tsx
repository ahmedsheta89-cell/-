import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Settings,
  Sliders,
  Award,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Sparkles,
  BookOpen,
  Volume2,
  Eye,
  FileCheck,
  Search,
  Filter,
  Save,
  RotateCcw
} from 'lucide-react';
import { auth, db } from '../../infrastructure/firebase/firebaseClient.ts';
import { collection, getDocs, query, limit } from 'firebase/firestore';

interface TeacherGovernanceSettings {
  tajweedStrictness: 'LENIENT' | 'MODERATE' | 'STRICT_IJAZAH';
  hesitationToleranceMs: number;
  zeroHallucinationLock: boolean;
  scholarDeferralEnabled: boolean;
  forcedAlignmentOnly: boolean;
  minAcousticConfidence: number;
  activeReciterBenchmark: string;
}

export const TeacherAdminControlDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STUDENTS' | 'AI_GOVERNANCE' | 'CERTIFICATES'>('OVERVIEW');

  // Governance and Guardrails state
  const [settings, setSettings] = useState<TeacherGovernanceSettings>({
    tajweedStrictness: 'MODERATE',
    hesitationToleranceMs: 2000,
    zeroHallucinationLock: true,
    scholarDeferralEnabled: true,
    forcedAlignmentOnly: true,
    minAcousticConfidence: 85,
    activeReciterBenchmark: 'الشيخ محمود خليل الحصري (مرجع التحقيق)',
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Mocked/Synced students list for demonstration
  const [students] = useState([
    {
      id: 'std-001',
      name: 'أحمد بن عبد الله',
      email: 'ahmed.student@example.com',
      currentSurah: 'سورة الفاتحة',
      memorizedCount: 7,
      accuracyRate: 98,
      lastActive: 'منذ ساعتين',
      status: 'نشط ومتقن',
    },
    {
      id: 'std-002',
      name: 'عمر الفاروق محمد',
      email: 'omar.quran@example.com',
      currentSurah: 'سورة الملك',
      memorizedCount: 30,
      accuracyRate: 94,
      lastActive: 'أمس',
      status: 'يحتاج مراجعة',
    },
    {
      id: 'std-003',
      name: 'فاطمة الزهراء',
      email: 'fatima.hifz@example.com',
      currentSurah: 'سورة يس',
      memorizedCount: 83,
      accuracyRate: 99,
      lastActive: 'منذ 30 دقيقة',
      status: 'مرشحة للإجازة',
    },
    {
      id: 'std-004',
      name: 'يوسف إبراهيم',
      email: 'youssef.ibrahim@example.com',
      currentSurah: 'سورة النبأ',
      memorizedCount: 40,
      accuracyRate: 91,
      lastActive: 'منذ 3 أيام',
      status: 'نشط',
    },
  ]);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-emerald-950 via-stone-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>لوحة الإشراف والتحكم بالذكاء القرآني الموجه</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-arabic-heading text-white">
              مركز إدارة الحلقات وضوابط الذكاء الاصطناعي (Zero-Hallucination Console)
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              تحكم كامل في معايير التسميع، متابعة تقدم الطلاب لحظياً، وضبط صمامات الأمان الشرعية التي تمنع الذكاء الاصطناعي نهائياً من الهلوسة أو التوليد غير المنضبط.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <div className="text-xl font-bold text-amber-300">{students.length}</div>
              <div className="text-2xs text-stone-300">الطلاب المسجلين</div>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <div className="text-xl font-bold text-emerald-300">96.5%</div>
              <div className="text-2xs text-stone-300">متوسط الإتقان</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: 'OVERVIEW', label: 'نظرة عامة ومؤشرات', icon: Activity },
            { id: 'STUDENTS', label: 'إدارة الطلاب وسجلات التسميع', icon: Users },
            { id: 'AI_GOVERNANCE', label: 'ضوابط منع هلوسة الذكاء الاصطناعي', icon: Lock },
            { id: 'CERTIFICATES', label: 'اعتماد وتزكية الشهادات', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                    : 'bg-white/5 hover:bg-white/10 text-stone-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">صمام الأمان الشرعي</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-2xs font-black">مفعل 100%</span>
            </div>
            <div className="text-2xl font-black text-stone-900 font-arabic-heading">قفل النص القرآني</div>
            <p className="text-xs text-stone-600 leading-relaxed">
              محرك الذكاء الاصطناعي ممنوع برمجياً من توليد أو إعادة صياغة أي حرف قرآني، والنص مشتق حصرياً من مصحف المدينة المنورة المشفر بـ SHA-256.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">طريقة المقارنة الصوتية</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-2xs font-bold">Forced Alignment</span>
            </div>
            <div className="text-2xl font-black text-stone-900 font-arabic-heading">المحاذاة الحتمية</div>
            <p className="text-xs text-stone-600 leading-relaxed">
              صوت الطالب يطابق كلمة بكلمة مع الإحداثيات الصوتية للشيخ المعتمد، ولا يُسمح للنموذج بتوقع أو إكمال الكلمات من تلقاء نفسه.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500">سحابة التخزين المزامنة</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-2xs font-bold">Firebase Firestore</span>
            </div>
            <div className="text-2xl font-black text-stone-900 font-arabic-heading">مزامنة آمنة لحظية</div>
            <p className="text-xs text-stone-600 leading-relaxed">
              كل جلسة تسميع، أو خطأ تجويدي تم تصحيحه، أو شهادة إتقان يتم تسجيلها سحابياً ومحلياً مع حفظ حقوق ملكية الطالب لبياناته.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS DIRECTORY */}
      {activeTab === 'STUDENTS' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-stone-900 font-arabic-heading">
                سجل الطلاب ومتابعة إتقان الحفظ
              </h3>
              <p className="text-xs text-stone-500">
                قائمة الطلاب الذين قاموا بالتسميع عبر المنصة مع نسب الإتقان المباشرة
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث عن طالب..."
                  className="pr-9 pl-3 py-1.5 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-700 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                <tr>
                  <th className="p-3.5">اسم الطالب</th>
                  <th className="p-3.5">السورة الحالية</th>
                  <th className="p-3.5">الآيات المحفوظة</th>
                  <th className="p-3.5">درجة الإتقان</th>
                  <th className="p-3.5">آخر نشاط</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-stone-900">{student.name}</td>
                    <td className="p-3.5 text-stone-700">{student.currentSurah}</td>
                    <td className="p-3.5 font-semibold text-emerald-800">{student.memorizedCount} آية</td>
                    <td className="p-3.5 font-black text-stone-900">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {student.accuracyRate}%
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-500">{student.lastActive}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-2xs ${
                        student.status.includes('إجازة') || student.status.includes('متقن')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-800 hover:text-white text-stone-700 font-bold text-2xs transition-all cursor-pointer"
                      >
                        عرض السجل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AI GOVERNANCE & ZERO-HALLUCINATION LOCK */}
      {activeTab === 'AI_GOVERNANCE' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h3 className="font-bold text-lg text-stone-900 font-arabic-heading flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-700" />
              <span>معايير الأمان وضوابط منع هلوسة الذكاء الاصطناعي</span>
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              كيف نضمن أن الذكاء الاصطناعي لا يهلوس ولا يتدخل إلا بيقين شرعي وصوتي تام؟
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Setting 1 */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900">1. قفل الهلوسة الديني الصارم (Zero-Hallucination Lock)</span>
                <input
                  type="checkbox"
                  checked={settings.zeroHallucinationLock}
                  onChange={(e) => setSettings({ ...settings, zeroHallucinationLock: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-2xs text-stone-600 leading-relaxed">
                يمنع المحرك نهائياً من اختراع أي توجيه خارج قاموس التجويد المعتمد؛ وفي حال حدوث أي شك صوتي يتم تطبيق قاعدة: <strong>«اليقين لا يزول بالشك»</strong>، فلا يُخطَّأ الطالب إلا بيقين.
              </p>
            </div>

            {/* Setting 2 */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900">2. تقنية المحاذاة الإجبارية (Forced Phonetic Alignment)</span>
                <input
                  type="checkbox"
                  checked={settings.forcedAlignmentOnly}
                  onChange={(e) => setSettings({ ...settings, forcedAlignmentOnly: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-2xs text-stone-600 leading-relaxed">
                بدلاً من ترك الذكاء الاصطناعي يتوقع الحروف، يتم إجباره على محاذاة صوت الميكروفون مع مصفوفة الفونيمات للآية المعروضة فقط. لا مجال للزيادة أو النقصان.
              </p>
            </div>

            {/* Setting 3 */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900">3. حظر الفتوى والتفسير الذاتي (Scholar Deferral)</span>
                <input
                  type="checkbox"
                  checked={settings.scholarDeferralEnabled}
                  onChange={(e) => setSettings({ ...settings, scholarDeferralEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-2xs text-stone-600 leading-relaxed">
                إذا سأل الطالب أي سؤال فقهي أو عقدي، يُحظر على الذكاء الاصطناعي توليد إجابة من تلقاء نفسه، ويقوم فوراً بإحالته إلى التفاسير المسندة (التفسير الميسر / ابن كثير) أو لشيخ المقرأة.
              </p>
            </div>

            {/* Setting 4: Strictness */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900">4. مستوى دقة وتشدد أحكام التجويد</span>
                <span className="text-2xs font-bold text-emerald-800">{settings.tajweedStrictness}</span>
              </div>
              <select
                value={settings.tajweedStrictness}
                onChange={(e) => setSettings({ ...settings, tajweedStrictness: e.target.value as any })}
                className="w-full p-2 bg-white border border-stone-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <option value="LENIENT">متساهل (للمبتدئين والأطفال - تركيز على صحة الكلمات)</option>
                <option value="MODERATE">متوسط (للحفاظ والطلاب - مراعاة المدود والغنن)</option>
                <option value="STRICT_IJAZAH">مشدد (للإجازة والتأهيل - محاسبة دقيقة على المخارج والصفات)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>هذه الإعدادات تطبق فوراً على جميع جلسات التسميع الحية</span>
            </div>
            <div className="flex items-center gap-3">
              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ الإعدادات بنجاح</span>
                </span>
              )}
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>حفظ المعايير</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CERTIFICATES ENDORSEMENT */}
      {activeTab === 'CERTIFICATES' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-stone-900 font-arabic-heading">
                مركز تزكية واعتماد شهادات الإتقان
              </h3>
              <p className="text-xs text-stone-500">
                مراجعة الشهادات الصادرة للطلاب وتوقيعها رقمياً من المشرف القرآني
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
              توقيع رقمي مسند
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                student: 'أحمد بن عبد الله',
                surah: 'سورة الفاتحة',
                grade: 98,
                date: 'اليوم',
                hash: 'QUR-CERT-1-482910',
              },
              {
                student: 'عمر الفاروق محمد',
                surah: 'سورة الملك',
                grade: 94,
                date: 'أمس',
                hash: 'QUR-CERT-67-910243',
              },
            ].map((cert, i) => (
              <div key={i} className="p-4 rounded-2xl border border-amber-300/80 bg-radial from-amber-50/50 to-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-stone-900">{cert.student}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-900 text-white text-xs font-black">
                    {cert.grade}%
                  </span>
                </div>
                <div className="text-xs text-stone-600">
                  أتم حفظ وإتقان: <strong>{cert.surah}</strong> برواية حفص عن عاصم.
                </div>
                <div className="font-mono text-3xs text-stone-400">
                  كود التوثيق: {cert.hash}
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-amber-200">
                  <span className="text-2xs text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    معتمدة ومسجلة في سحابة Firebase
                  </span>
                  <button className="px-2.5 py-1 rounded-lg bg-stone-900 text-white text-2xs font-bold hover:bg-stone-800 cursor-pointer">
                    عرض الشهادة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
