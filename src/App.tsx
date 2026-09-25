/**
 * @file App.tsx
 * @description Master Architecture & Foundation Dashboard for Quran Teacher AI.
 * Demonstrates clean architecture, 18 domain modules, immutable Quran contracts,
 * TeacherSessionEngine lifecycle, error taxonomies, and scientific verification governance.
 */

import React, { useState } from 'react';
import { SyncProvider } from './context/SyncContext.tsx';
import { Header } from './components/Header.tsx';
import { ArchitectureView } from './components/ArchitectureView.tsx';
import { VerifiedQuranDashboard } from './components/VerifiedQuranDashboard.tsx';
import { RecitationSessionView } from './components/RecitationSessionView.tsx';
import { RealTimeRecitationView } from './components/RealTimeRecitationView.tsx';
import { MemorizationRevisionDashboard } from './components/MemorizationRevisionDashboard.tsx';
import { QuranDataContractView } from './components/QuranDataContractView.tsx';
import { TeacherEngineVisualizer } from './components/TeacherEngineVisualizer.tsx';
import { ErrorTaxonomyView } from './components/ErrorTaxonomyView.tsx';
import { ScientificGovernanceView } from './components/ScientificGovernanceView.tsx';
import { TestRunnerView } from './components/TestRunnerView.tsx';
import { RoadmapView } from './components/RoadmapView.tsx';
import { StudentProgressDashboard } from './components/StudentProgressDashboard.tsx';
import { UnifiedClassroomView } from './components/classroom/UnifiedClassroomView.tsx';
import { TeacherAdminControlDashboard } from './components/admin/TeacherAdminControlDashboard.tsx';
import {
  Layers,
  BookOpen,
  Cpu,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Map,
  Sparkles,
  Mic,
  GraduationCap,
  TrendingUp,
  Settings,
} from 'lucide-react';

type TabId =
  | 'UNIFIED_CLASSROOM'
  | 'TEACHER_ADMIN'
  | 'STUDENT_PROGRESS'
  | 'REALTIME_TEACHER'
  | 'MEMORIZATION_INTELLIGENCE'
  | 'RECITATION_SESSION'
  | 'VERIFIED_QURAN'
  | 'ARCHITECTURE'
  | 'TEACHER_ENGINE'
  | 'ERROR_TAXONOMY'
  | 'QURAN_CONTRACT'
  | 'GOVERNANCE'
  | 'TEST_SUITE'
  | 'ROADMAP';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('UNIFIED_CLASSROOM');
  const [classroomSurah, setClassroomSurah] = useState<number>(1);
  const [classroomAyah, setClassroomAyah] = useState<number>(1);

  const handleStartRecitationFromDashboard = (surahId: number, startAyah: number) => {
    setClassroomSurah(surahId);
    setClassroomAyah(startAyah || 1);
    setActiveTab('UNIFIED_CLASSROOM');
  };

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'UNIFIED_CLASSROOM', label: '🎙️ غرفة التسميع الموحدة (مباشر)', icon: Mic },
    { id: 'TEACHER_ADMIN', label: '🛡️ لوحة التحكم وضوابط الذكاء (Admin)', icon: Settings },
    { id: 'STUDENT_PROGRESS', label: '📊 لوحة تقدم الطالب والتعاهد (Phase 8D)', icon: TrendingUp },
    { id: 'REALTIME_TEACHER', label: 'التفاعل الحي وتوجيه المعلم (Phase 7C)', icon: Sparkles },
    { id: 'MEMORIZATION_INTELLIGENCE', label: 'ذكاء الحفظ والمراجعة (Phase 7D)', icon: GraduationCap },
    { id: 'RECITATION_SESSION', label: 'جلسة التسميع والاستماع (Phase 3)', icon: Mic },
    { id: 'VERIFIED_QURAN', label: 'القرآن والتجويد الموثق (Phase 2)', icon: ShieldCheck },
    { id: 'ARCHITECTURE', label: 'المعمارية والوحدات الـ 18', icon: Layers },
    { id: 'TEACHER_ENGINE', label: 'محاكي دورة المعلم (Engine)', icon: Cpu },
    { id: 'ERROR_TAXONOMY', label: 'تصنيف الأخطاء ونموذج الثقة', icon: AlertTriangle },
    { id: 'QURAN_CONTRACT', label: 'عقد بيانات الآيات (الفاتحة)', icon: BookOpen },
    { id: 'GOVERNANCE', label: 'الحوكمة والتحقق الشرعي', icon: ShieldCheck },
    { id: 'TEST_SUITE', label: 'فحص النطاق والاختبارات', icon: CheckCircle2 },
    { id: 'ROADMAP', label: 'خريطة الطريق للمراحل القادمة', icon: Map },
  ];

  return (
    <SyncProvider>
      <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans selection:bg-emerald-900 selection:text-white" dir="rtl">
        <Header onNavigateToAdmin={() => setActiveTab('TEACHER_ADMIN')} />

        {/* Primary Navigation Bar */}
        <nav className="border-b border-stone-200 bg-white shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto py-2.5 no-scrollbar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-stone-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'UNIFIED_CLASSROOM' && (
            <UnifiedClassroomView
              initialSurah={classroomSurah}
              initialAyah={classroomAyah}
            />
          )}
          {activeTab === 'TEACHER_ADMIN' && <TeacherAdminControlDashboard />}
          {activeTab === 'STUDENT_PROGRESS' && (
            <StudentProgressDashboard
              onStartRecitation={handleStartRecitationFromDashboard}
            />
          )}
          {activeTab === 'REALTIME_TEACHER' && <RealTimeRecitationView />}
          {activeTab === 'MEMORIZATION_INTELLIGENCE' && <MemorizationRevisionDashboard />}
          {activeTab === 'RECITATION_SESSION' && <RecitationSessionView />}
          {activeTab === 'VERIFIED_QURAN' && <VerifiedQuranDashboard />}
          {activeTab === 'ARCHITECTURE' && <ArchitectureView />}
          {activeTab === 'QURAN_CONTRACT' && <QuranDataContractView />}
          {activeTab === 'TEACHER_ENGINE' && <TeacherEngineVisualizer />}
          {activeTab === 'ERROR_TAXONOMY' && <ErrorTaxonomyView />}
          {activeTab === 'GOVERNANCE' && <ScientificGovernanceView />}
          {activeTab === 'TEST_SUITE' && <TestRunnerView />}
          {activeTab === 'ROADMAP' && <RoadmapView />}
        </main>

        {/* Footer */}
        <footer className="border-t border-stone-200/80 bg-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500 space-y-2">
            <p className="font-arabic-heading font-semibold text-stone-700">
              Quran Teacher AI &bull; معلّم القرآن الرقمي
            </p>
            <p>
              تأسيس معماري رصين خاضع لقواعد التحقق العلمي والشرعي الصارم &bull; المرحلة الأولى (Foundation Phase)
            </p>
            <div className="text-[11px] text-stone-400 font-mono">
              Clean Architecture &bull; Domain-Driven Design &bull; Zero Religious Hallucination Guarantee
            </div>
          </div>
        </footer>
      </div>
    </SyncProvider>
  );
}
