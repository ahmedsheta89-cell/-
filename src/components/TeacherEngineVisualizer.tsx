import React, { useState } from 'react';
import { TeacherSessionEngineImpl } from '../application/teacher/TeacherSessionEngineImpl.ts';
import { TeacherEngineState, TeacherActionOutput } from '../domain/teacher/types.ts';
import { ConfidenceLevel } from '../domain/confidence/types.ts';
import { LahnCategory, RecitationErrorType } from '../domain/errors/types.ts';
import { RiwayahType } from '../domain/quran/types.ts';
import { RecitationMode, RecitationSession, RecitationSessionStatus } from '../domain/recitation/types.ts';
import { AL_FATIHAH_AYAHS } from '../infrastructure/providers/InMemoryQuranDataProvider.ts';
import { Play, Mic, CheckCircle, RotateCcw, AlertTriangle, MessageSquare, Volume2, ArrowLeft } from 'lucide-react';

const ENGINE_STATES_LIST: TeacherEngineState[] = [
  TeacherEngineState.IDLE,
  TeacherEngineState.LISTEN,
  TeacherEngineState.ALIGN,
  TeacherEngineState.ANALYZE,
  TeacherEngineState.DECIDE,
  TeacherEngineState.INTERRUPT_IF_NEEDED,
  TeacherEngineState.CORRECT,
  TeacherEngineState.REPEAT,
  TeacherEngineState.CONFIRM,
  TeacherEngineState.CONTINUE,
  TeacherEngineState.RECORD_PROGRESS,
];

export const TeacherEngineVisualizer: React.FC = () => {
  const [engine] = useState(() => new TeacherSessionEngineImpl());
  const [currentState, setCurrentState] = useState<TeacherEngineState>(TeacherEngineState.IDLE);
  const [latestAction, setLatestAction] = useState<TeacherActionOutput | null>(null);
  const [logs, setLogs] = useState<string[]>(['جاهز لتشغيل محرك دورة المعلم...']);

  const appendLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString('ar-SA')}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const startSession = async () => {
    const session: RecitationSession = {
      id: 'sess-' + Date.now(),
      studentId: 'student-demo',
      selectedRiwayah: RiwayahType.HAFS_AN_ASIM,
      mode: RecitationMode.MEMORIZATION_RECITE,
      status: RecitationSessionStatus.ACTIVE_LISTENING,
      surahNumber: 1,
      fromAyah: 1,
      toAyah: 7,
      expectedAyahs: AL_FATIHAH_AYAHS,
      expectedWords: AL_FATIHAH_AYAHS.flatMap((a) => a.words),
      currentAyahIndex: 1,
      currentWordIndex: 0,
      audioSegments: [],
      detectedWords: [],
      detectedErrors: [],
      corrections: [],
      repetitions: [],
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalRecitationTimeSeconds: 0,
    };

    const action = await engine.dispatch({ type: 'START_SESSION', session });
    setCurrentState(action.state);
    setLatestAction(action);
    appendLog(action.logEventDescription);
  };

  const simulateAudioAndAlign = async () => {
    // 1. Send Audio Chunk
    let action = await engine.dispatch({
      type: 'AUDIO_CHUNK_RECEIVED',
      audioData: new ArrayBuffer(256),
      timestampMs: 300,
    });
    setCurrentState(action.state);
    setLatestAction(action);
    appendLog(action.logEventDescription);

    // 2. Alignment completed
    setTimeout(async () => {
      action = await engine.dispatch({
        type: 'ALIGNMENT_COMPLETED',
        matchedWordId: '1:1:1',
        confidence: { level: ConfidenceLevel.HIGH, score: 0.96, reasonArabic: 'تطابق فونيمي ممتاز' },
      });
      setCurrentState(action.state);
      setLatestAction(action);
      appendLog(action.logEventDescription);
    }, 400);
  };

  const simulateCleanRecitation = async () => {
    const action = await engine.dispatch({
      type: 'ANALYSIS_COMPLETED',
      errors: [],
      confidence: { level: ConfidenceLevel.HIGH, score: 0.98, reasonArabic: 'قراءة صحيحة' },
    });
    setCurrentState(action.state);
    setLatestAction(action);
    appendLog(action.logEventDescription);
  };

  const simulateLahnJaliError = async () => {
    const action = await engine.dispatch({
      type: 'ANALYSIS_COMPLETED',
      errors: [
        {
          errorType: RecitationErrorType.HARAKAH_MISMATCH,
          category: LahnCategory.JALI,
          nameArabic: 'لحن جلي: تغيير حركة الميم في (بِسْمِ)',
          descriptionArabic: 'قُرئت بفتح الميم بدلاً من كسرها الواجب إعرابًا.',
          surahNumber: 1,
          ayahNumber: 1,
          wordIndex: 1,
          expectedToken: 'بِسْمِ (مكسورة)',
          detectedToken: 'بِسْمَ (مفتوحة)',
          severity: 'CRITICAL',
          pedagogicalTipArabic: 'اكسر الميم بلطف لتمام الكسر مع البسملة.',
        },
      ],
      confidence: { level: ConfidenceLevel.HIGH, score: 0.94, reasonArabic: 'ثقة عالية في اللحن الجلي' },
    });
    setCurrentState(action.state);
    setLatestAction(action);
    appendLog(action.logEventDescription);
  };

  const stepNext = async () => {
    let action: TeacherActionOutput | null = null;
    switch (currentState) {
      case TeacherEngineState.INTERRUPT_IF_NEEDED:
        action = await engine.dispatch({ type: 'INTERRUPT_EMITTED' });
        break;
      case TeacherEngineState.CORRECT:
        action = await engine.dispatch({
          type: 'CORRECTION_DELIVERED',
          explanationArabic: 'تم توضيح حكم كسر الميم ومخرجها',
        });
        break;
      case TeacherEngineState.REPEAT:
        action = await engine.dispatch({ type: 'REPETITION_RECEIVED', isAccepted: true });
        break;
      case TeacherEngineState.CONFIRM:
        action = await engine.dispatch({ type: 'CONFIRMATION_EVALUATED', success: true });
        break;
      case TeacherEngineState.CONTINUE:
        action = await engine.dispatch({ type: 'RESUME_RECITATION' });
        break;
      default:
        break;
    }
    if (action) {
      setCurrentState(action.state);
      setLatestAction(action);
      appendLog(action.logEventDescription);
    }
  };

  const finishSession = async () => {
    const action = await engine.dispatch({ type: 'FINISH_SESSION' });
    setCurrentState(action.state);
    setLatestAction(action);
    appendLog(action.logEventDescription);
  };

  return (
    <div className="space-y-8">
      {/* State Machine Visualizer */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-arabic-heading">
              محاكي دورة المعلم التفاعلية (TeacherSessionEngine)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              آلة الحالة المستقلة تمامًا عن الواجهة؛ تطبق دورة الاستماع، والمحاذاة، والتحليل، والمقاطعة عند الحاجة.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
              الحالة الحالية: <strong className="font-mono text-emerald-800">{currentState}</strong>
            </span>
          </div>
        </div>

        {/* State Track */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-1 min-w-[760px]">
            {ENGINE_STATES_LIST.map((st, idx) => {
              const isCurrent = st === currentState;
              return (
                <div key={st} className="flex items-center">
                  <div
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all ${
                      isCurrent
                        ? 'bg-emerald-900 text-white font-bold shadow-xs ring-2 ring-emerald-400/40'
                        : 'bg-stone-100 text-stone-600 border border-stone-200/60'
                    }`}
                  >
                    {st}
                  </div>
                  {idx < ENGINE_STATES_LIST.length - 1 && (
                    <span className="text-stone-300 mx-1 text-xs">&larr;</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
          <div className="text-xs font-semibold text-stone-700">إجراءات التحكم التفاعلية للتحقق المعماري:</div>
          <div className="flex flex-wrap gap-2">
            {currentState === TeacherEngineState.IDLE && (
              <button
                onClick={startSession}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                <Play className="w-4 h-4" />
                بدء جلسة التسميع (START_SESSION)
              </button>
            )}

            {currentState === TeacherEngineState.LISTEN && (
              <>
                <button
                  onClick={simulateAudioAndAlign}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Mic className="w-4 h-4 text-emerald-400" />
                  التقاط مقطع صوتي ومحاذاته (AUDIO & ALIGN)
                </button>
                <button
                  onClick={finishSession}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-semibold transition"
                >
                  إنهاء الجلسة وتسجيل الإنجاز
                </button>
              </>
            )}

            {currentState === TeacherEngineState.ANALYZE && (
              <>
                <button
                  onClick={simulateCleanRecitation}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  نتيجة الفحص: تلاوة سليمة بدون خطأ
                </button>
                <button
                  onClick={simulateLahnJaliError}
                  className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <AlertTriangle className="w-4 h-4" />
                  نتيجة الفحص: اكتشاف لحن جلي (ثقة عالية)
                </button>
              </>
            )}

            {[
              TeacherEngineState.INTERRUPT_IF_NEEDED,
              TeacherEngineState.CORRECT,
              TeacherEngineState.REPEAT,
              TeacherEngineState.CONFIRM,
              TeacherEngineState.CONTINUE,
            ].includes(currentState) && (
              <button
                onClick={stepNext}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>الخطوة التالية في دورة المعلم ({currentState})</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {currentState === TeacherEngineState.RECORD_PROGRESS && (
              <button
                onClick={() => {
                  setCurrentState(TeacherEngineState.IDLE);
                  setLatestAction(null);
                  appendLog('إعادة ضبط المحاكي للحالة الأولية');
                }}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة تعيين المحاكي
              </button>
            )}
          </div>
        </div>

        {/* Live Pedagogical Output Card */}
        {latestAction && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
              <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-emerald-800" />
                التوجيه الصوتي للمعلم (Teacher Spoken Prompt):
              </div>
              <p className="text-sm font-medium text-stone-900 bg-stone-50 p-3 rounded-lg border border-stone-200/80">
                {latestAction.teacherVoicePromptArabic || 'المعلم يستمع للتلاوة في صمت تدبري...'}
              </p>
              <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                <span>مقاطعة الصوت: {latestAction.shouldInterruptAudio ? 'نعم (مطلوب إيقاف الصوت)' : 'لا'}</span>
                {latestAction.highlightedWordId && (
                  <span className="font-mono">الكلمة المحددة: {latestAction.highlightedWordId}</span>
                )}
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 space-y-2">
              <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-800" />
                البطاقة التعليمية المصاحبة (Pedagogical Display Card):
              </div>
              {latestAction.displayCard ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-amber-900">{latestAction.displayCard.titleArabic}</div>
                  <p className="text-stone-700">{latestAction.displayCard.explanationArabic}</p>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-400">
                  لا توجد بطاقة خطأ معروضة حاليًا؛ القراءة تسير بانتظام.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Engine Event Stream / Logs */}
        <div>
          <div className="text-xs font-semibold text-stone-700 mb-2">سجل أحداث المحرك اللحظي (Audit Trail):</div>
          <div className="bg-stone-900 text-stone-200 p-4 rounded-xl font-mono text-xs max-h-48 overflow-y-auto space-y-1 border border-stone-800" dir="ltr">
            {logs.map((lg, i) => (
              <div key={i} className="leading-relaxed">{lg}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
