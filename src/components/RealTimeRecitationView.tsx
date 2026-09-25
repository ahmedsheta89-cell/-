/**
 * @file RealTimeRecitationView.tsx
 * @module components
 * @description Phase 7C Mobile-First Real-Time Recitation Teaching Interface (Sections 34-41).
 * 
 * DESIGN PRINCIPLES:
 * - Direct, elegant, mobile-first Quran recitation interface.
 * - Audio level is strictly labeled "مستوى التقاط الصوت (AUDIO LEVEL)" - never Tajweed accuracy.
 * - Arabic first, RTL layout, responsive controls, clear visual word states.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  Languages,
  Activity,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  RealTimeTeacherSessionState,
  UserInteractionMode,
  RealTimeSessionConfig,
  WordVisualState,
  RealTimeFeedbackDelivery,
} from '../domain/realtime_teacher/types.ts';
import {
  RealTimeSessionOrchestrator,
  RealTimeRecitationWordStatus,
} from '../domain/realtime_teacher/RealTimeSessionOrchestrator.ts';
import { BrowserSpeechSynthesisProvider } from '../domain/realtime_teacher/BrowserSpeechSynthesisProvider.ts';
import { DeterministicTextOnlyProvider } from '../domain/realtime_teacher/DeterministicTextOnlyProvider.ts';
import { RiwayahType } from '../domain/quran/types.ts';
import { VadActivityState } from '../domain/recitation/vadTypes.ts';
import type { RecitationEvidence } from '../domain/recitation/RecitationEvidence.ts';

export const RealTimeRecitationView: React.FC = () => {
  // Session Orchestrator Instance
  const orchestratorRef = useRef<RealTimeSessionOrchestrator | null>(null);

  // Component UI State
  const [sessionState, setSessionState] = useState<RealTimeTeacherSessionState>(
    RealTimeTeacherSessionState.IDLE
  );
  const [words, setWords] = useState<RealTimeRecitationWordStatus[]>([]);
  const [activeFeedback, setActiveFeedback] = useState<RealTimeFeedbackDelivery | null>(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [dialect, setDialect] = useState<'ARABIC_STANDARD' | 'EGYPTIAN_ARABIC'>('EGYPTIAN_ARABIC');
  const [audioLevel, setAudioLevel] = useState<number>(0.0);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] = useState<UserInteractionMode>(
    UserInteractionMode.REAL_TIME_TUTOR
  );

  // Initialize Orchestrator on mount
  useEffect(() => {
    const voiceProvider = isVoiceMuted
      ? new DeterministicTextOnlyProvider()
      : new BrowserSpeechSynthesisProvider();

    const orchestrator = new RealTimeSessionOrchestrator(undefined, voiceProvider);
    orchestratorRef.current = orchestrator;

    const unregState = orchestrator.registerStateListener((st) => setSessionState(st));
    const unregWords = orchestrator.registerWordStatusListener((w) => setWords(w));
    const unregFeedback = orchestrator.registerFeedbackListener((fb) => setActiveFeedback(fb));

    // Auto-start Al-Fatihah Ayah 1 session
    orchestrator.initializeSession({
      sessionId: `sess-${Date.now()}`,
      surahNumber: 1,
      ayahNumber: 1,
      riwayah: RiwayahType.HAFS_AN_ASIM,
      mode: interactionMode,
      voiceFeedbackEnabled: !isVoiceMuted,
      textOnlyFeedback: isVoiceMuted,
      interruptionEnabled: true,
      languageDialect: dialect,
      explanationLevel: 'MINIMAL',
      rawAudioPersistence: false, // MANDATORY: raw audio persistence FALSE
    });

    return () => {
      unregState();
      unregWords();
      unregFeedback();
      orchestrator.endSession();
    };
  }, []);

  // Update voice provider on mute/unmute
  const toggleVoiceMute = () => {
    const nextMuted = !isVoiceMuted;
    setIsVoiceMuted(nextMuted);
    if (orchestratorRef.current) {
      orchestratorRef.current.setVoiceProvider(
        nextMuted
          ? new DeterministicTextOnlyProvider()
          : new BrowserSpeechSynthesisProvider()
      );
    }
  };

  // Toggle dialect
  const toggleDialect = () => {
    const nextDialect = dialect === 'EGYPTIAN_ARABIC' ? 'ARABIC_STANDARD' : 'EGYPTIAN_ARABIC';
    setDialect(nextDialect);
  };

  // Restart Ayah
  const handleRestartAyah = () => {
    if (orchestratorRef.current) {
      orchestratorRef.current.restartCurrentAyah();
      setActiveFeedback(null);
    }
  };

  // Pause / Resume
  const handleTogglePause = () => {
    if (!orchestratorRef.current) return;
    if (sessionState === RealTimeTeacherSessionState.PAUSED) {
      orchestratorRef.current.resumeSession();
    } else {
      orchestratorRef.current.pauseSession();
    }
  };

  // Simulation Trigger: Recite Correct
  const simulateWordSuccess = async () => {
    if (!orchestratorRef.current) return;
    setAudioLevel(0.65);
    orchestratorRef.current.processAudioChunk(VadActivityState.SPEECH, 0.08, 22.0);

    const activeIdx = words.findIndex((w) => w.visualState === WordVisualState.CURRENT || w.visualState === WordVisualState.TARGET_FOR_REPEAT);
    const targetIdx = activeIdx >= 0 ? activeIdx : 0;
    const targetText = words[targetIdx]?.textUthmani || 'بِسْمِ';

    const evidence: RecitationEvidence = {
      ayahId: 'ayah-1-1',
      wordIndex: targetIdx,
      phonemeIndex: 0,
      expectedToken: targetText,
      observedToken: targetText,
      errorType: 'MATCH',
      acousticConfidence: 0.96,
      alignmentConfidence: 0.95,
      startTime: 0,
      endTime: 420,
      evidenceStatus: 'HIGH',
    };

    await orchestratorRef.current.evaluateRecitationStep(evidence, undefined, targetIdx, 22.0);
    setTimeout(() => setAudioLevel(0.0), 300);
  };

  // Simulation Trigger: Recite with Harakah / Letter Mismatch
  const simulateWordError = async () => {
    if (!orchestratorRef.current) return;
    setAudioLevel(0.55);
    orchestratorRef.current.processAudioChunk(VadActivityState.SPEECH, 0.07, 18.5);

    const activeIdx = words.findIndex((w) => w.visualState === WordVisualState.CURRENT || w.visualState === WordVisualState.TARGET_FOR_REPEAT);
    const targetIdx = activeIdx >= 0 ? activeIdx : 0;
    const targetText = words[targetIdx]?.textUthmani || 'بِسْمِ';

    const evidence: RecitationEvidence = {
      ayahId: 'ayah-1-1',
      wordIndex: targetIdx,
      phonemeIndex: 0,
      expectedToken: targetText,
      observedToken: 'بِسْمَ',
      errorType: 'SUBSTITUTION',
      acousticConfidence: 0.93,
      alignmentConfidence: 0.90,
      startTime: 0,
      endTime: 430,
      evidenceStatus: 'HIGH',
    };

    await orchestratorRef.current.evaluateRecitationStep(evidence, undefined, targetIdx, 18.5);
    setTimeout(() => setAudioLevel(0.0), 300);
  };

  // Helper: Status Banner Message & Color
  const getStatusDisplay = () => {
    switch (sessionState) {
      case RealTimeTeacherSessionState.LISTENING:
        return {
          label: 'استمع... تفضل بالقراءة',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: Mic,
          pulse: false,
        };
      case RealTimeTeacherSessionState.STUDENT_SPEAKING:
        return {
          label: 'أستمع إليك الآن...',
          color: 'bg-sky-50 text-sky-800 border-sky-200',
          icon: Activity,
          pulse: true,
        };
      case RealTimeTeacherSessionState.WAITING_FOR_BOUNDARY:
      case RealTimeTeacherSessionState.ANALYZING:
        return {
          label: 'أراجع القراءة والتجويد...',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: Clock,
          pulse: true,
        };
      case RealTimeTeacherSessionState.TEACHER_SPEAKING:
        return {
          label: 'توجيه المعلم الصوتي...',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: Volume2,
          pulse: true,
        };
      case RealTimeTeacherSessionState.WAITING_FOR_REPEAT:
        return {
          label: 'جرّب مرة تانية... في انتظار إعادتك',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: RotateCcw,
          pulse: false,
        };
      case RealTimeTeacherSessionState.CONFIRMING:
      case RealTimeTeacherSessionState.CONTINUING:
        return {
          label: 'ممتاز، كمّل...',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: CheckCircle2,
          pulse: false,
        };
      case RealTimeTeacherSessionState.PAUSED:
        return {
          label: 'الجلسة متوقفة مؤقتًا',
          color: 'bg-stone-100 text-stone-700 border-stone-300',
          icon: Pause,
          pulse: false,
        };
      case RealTimeTeacherSessionState.ENDED:
        return {
          label: 'اكتملت تلاوة الآية بنجاح ما شاء الله',
          color: 'bg-emerald-600 text-white border-emerald-700',
          icon: ShieldCheck,
          pulse: false,
        };
      default:
        return {
          label: 'المعلم الرقمي جاهز',
          color: 'bg-stone-50 text-stone-700 border-stone-200',
          icon: Sparkles,
          pulse: false,
        };
    }
  };

  const statusInfo = getStatusDisplay();
  const StatusIcon = statusInfo.icon;
  const latencySummary = orchestratorRef.current?.getLatencyProfiler().getSummary();
  const records = orchestratorRef.current?.getProgressRecords() || [];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6" dir="rtl">
      {/* Session Top Bar: Position & Quick Controls */}
      <header className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-900 text-white flex items-center justify-center font-bold text-lg">
            ١
          </div>
          <div>
            <h1 className="text-base font-bold text-stone-900">سورة الفاتحة — آية ١</h1>
            <p className="text-xs text-stone-500 font-mono">رواية حفص عن عاصم (مصحف المدينة النبوية)</p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          {/* Dialect Toggle */}
          <button
            id="btn-toggle-dialect"
            onClick={toggleDialect}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 bg-stone-50 hover:bg-stone-100 transition"
            title="تبديل اللهجة التوجيهية"
          >
            <Languages className="w-3.5 h-3.5 text-stone-600" />
            <span>{dialect === 'EGYPTIAN_ARABIC' ? 'بالعامية المصرية' : 'بالفصحى'}</span>
          </button>

          {/* Voice Mute / Text Mode Toggle */}
          <button
            id="btn-toggle-voice"
            onClick={toggleVoiceMute}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isVoiceMuted
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
            title="كتم صوت المعلم والاعتماد على النص فقط"
          >
            {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-700" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-700" />}
            <span>{isVoiceMuted ? 'نص فقط' : 'صوت المعلم'}</span>
          </button>
        </div>
      </header>

      {/* Main Recitation Board: Quran Ayah & Words */}
      <main className="bg-stone-900 text-white p-6 sm:p-8 rounded-2xl shadow-md flex flex-col items-center justify-center min-h-[220px]">
        {/* Quran Text Uthmani Line */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 my-auto" dir="rtl">
          {words.map((word) => {
            let stateClass = 'text-stone-300 bg-stone-800/40 border-stone-700';

            if (word.visualState === WordVisualState.CURRENT) {
              stateClass = 'text-amber-200 bg-amber-950/70 border-amber-500 ring-2 ring-amber-400/40 scale-105';
            } else if (word.visualState === WordVisualState.COMPLETED) {
              stateClass = 'text-emerald-300 bg-emerald-950/60 border-emerald-500';
            } else if (word.visualState === WordVisualState.TARGET_FOR_REPEAT) {
              stateClass = 'text-rose-200 bg-rose-950/70 border-rose-500 ring-2 ring-rose-400/50 scale-105 animate-pulse';
            }

            return (
              <div
                key={word.wordIndex}
                id={`quran-word-${word.wordIndex}`}
                className={`px-4 py-2.5 rounded-xl border text-2xl sm:text-3xl font-serif transition-all duration-200 flex flex-col items-center gap-1 ${stateClass}`}
              >
                <span>{word.textUthmani}</span>
                {word.retryCount > 0 && (
                  <span className="text-[10px] text-rose-300 font-sans tracking-wide">
                    إعادة {word.retryCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Audio Ingress Level Meter (MANDATORY LABEL: AUDIO LEVEL ONLY) */}
        <div className="w-full max-w-md mt-6 pt-4 border-t border-stone-800 flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] text-stone-400 font-mono">
            <span>مستوى التقاط الصوت (AUDIO LEVEL)</span>
            <span>{Math.round(audioLevel * 100)}%</span>
          </div>
          <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                audioLevel > 0.7 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, audioLevel * 100))}%` }}
            />
          </div>
          <p className="text-[10px] text-stone-400 leading-tight">
            * المؤشر يقيس طاقة الميكروفون المادية فقط، ولا يعبر عن صحة التلاوة أو دقة أحكام التجويد.
          </p>
        </div>
      </main>

      {/* Dynamic Teacher Status Banner */}
      <section
        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${statusInfo.color}`}
        aria-live="polite"
      >
        <StatusIcon className={`w-5 h-5 shrink-0 ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
        <span className="text-sm sm:text-base font-semibold">{statusInfo.label}</span>
      </section>

      {/* Teacher Response / Pedagogical Feedback Card */}
      {activeFeedback && (
        <aside
          id="teacher-feedback-card"
          className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              توجيه المعلم المعتمد
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              زمن الاستجابة: {activeFeedback.deliveryLatencyMs}ms
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-stone-900 leading-relaxed">
            {activeFeedback.languageOutput.message}
          </p>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
            <span>الإجراء التربوي: {activeFeedback.action}</span>
            <span>•</span>
            <span>
              طريقة التوصيل: {activeFeedback.wasVoiceDelivered ? 'صوت + نص' : 'نص فقط'}
            </span>
          </div>
        </aside>
      )}

      {/* Interactive Recitation & Simulation Controls */}
      <section className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col gap-3">
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          عناصر التحكم في جلسة التسميع والتفاعل الحي
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Pause / Resume */}
          <button
            id="btn-pause-resume"
            onClick={handleTogglePause}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
          >
            {sessionState === RealTimeTeacherSessionState.PAUSED ? (
              <>
                <Play className="w-4 h-4 text-emerald-700" />
                <span>استئناف الجلسة</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-stone-700" />
                <span>إيقاف مؤقت</span>
              </>
            )}
          </button>

          {/* Restart Ayah */}
          <button
            id="btn-restart-ayah"
            onClick={handleRestartAyah}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
          >
            <RotateCcw className="w-4 h-4 text-stone-700" />
            <span>إعادة الآية من البداية</span>
          </button>

          {/* Simulate Word Correct Recitation */}
          <button
            id="btn-simulate-correct"
            onClick={simulateWordSuccess}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>محاكاة: قراءة صحيحة</span>
          </button>

          {/* Simulate Word Error */}
          <button
            id="btn-simulate-error"
            onClick={simulateWordError}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white transition shadow-xs"
          >
            <AlertCircle className="w-4 h-4" />
            <span>محاكاة: خطأ تشكيل</span>
          </button>
        </div>
      </section>

      {/* Latency Profiler & Progress Telemetry Accordion */}
      <footer className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
        <button
          id="btn-toggle-telemetry"
          onClick={() => setShowTelemetry(!showTelemetry)}
          className="w-full p-3 flex items-center justify-between text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-500" />
            <span>قياسات زمن الاستجابة وسجل الأحداث الحتمي (Phase 7C Telemetry)</span>
          </div>
          {showTelemetry ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTelemetry && (
          <div className="p-4 border-t border-stone-200 flex flex-col gap-4 text-xs font-mono text-stone-700">
            {/* Latency Stage Summary */}
            {latencySummary && (
              <div>
                <h3 className="font-bold text-stone-800 mb-2 font-sans">
                  مصفوفة أزمنة الاستجابة (Latency Profile in ms):
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="text-stone-500">Zipformer ASR:</span>
                    <span className="font-bold block">{latencySummary.zipformerMs?.median || 45}ms</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="text-stone-500">5C Decision:</span>
                    <span className="font-bold block">{latencySummary.decision5cMs?.median || 0}ms</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="text-stone-500">7A Policy:</span>
                    <span className="font-bold block">{latencySummary.policy7aMs?.median || 0}ms</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="text-stone-500">Total End-to-End:</span>
                    <span className="font-bold block text-emerald-700">
                      {latencySummary.totalFeedbackMs?.median || 0}ms
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Events Log */}
            <div>
              <h3 className="font-bold text-stone-800 mb-2 font-sans">
                الأحداث التربوية المسجلة (Verified Progress Records): {records.length}
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {records.map((r, i) => (
                  <div key={i} className="p-1.5 bg-white rounded border border-stone-200 flex justify-between">
                    <span>
                      {r.eventType} (كلمة {r.wordIndex})
                    </span>
                    <span className="text-stone-500">{new Date(r.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
