/**
 * @file TeacherSessionEngineImpl.ts
 * @module application/teacher
 * @description Pure TypeScript implementation of the TeacherSessionEngine state machine.
 * Lifecycle: LISTEN -> ALIGN -> ANALYZE -> DECIDE -> INTERRUPT_IF_NEEDED -> CORRECT -> REPEAT -> CONFIRM -> CONTINUE -> RECORD_PROGRESS
 */

import {
  ITeacherSessionEngine,
  TeacherEngineState,
  TeacherEngineEvent,
  TeacherActionOutput,
} from '../../domain/teacher/types.ts';
import { RecitationSession, RecitationSessionStatus } from '../../domain/recitation/types.ts';
import { ConfidenceLevel, PedagogicalDecision, resolvePedagogicalDecision } from '../../domain/confidence/types.ts';
import { LahnCategory, RecitationErrorDetail } from '../../domain/errors/types.ts';
import { StructuredLogger } from '../../infrastructure/logging/StructuredLogger.ts';
import { IQuranDataProvider } from '../../infrastructure/interfaces/IQuranDataProvider.ts';
import { VerifiedQuranDataProvider } from '../../infrastructure/quran/VerifiedQuranDataProvider.ts';
import { VerificationStatus } from '../../domain/quran/types.ts';

export class TeacherSessionEngineImpl implements ITeacherSessionEngine {
  private state: TeacherEngineState = TeacherEngineState.IDLE;
  private currentSession: RecitationSession | null = null;
  private pendingError: RecitationErrorDetail | null = null;
  private listeners: ((state: TeacherEngineState, action: TeacherActionOutput) => void)[] = [];
  private logger = new StructuredLogger('TeacherSessionEngine');
  private quranDataProvider: IQuranDataProvider;

  constructor(quranDataProvider?: IQuranDataProvider) {
    this.quranDataProvider = quranDataProvider || new VerifiedQuranDataProvider(true);
  }

  getCurrentState(): TeacherEngineState {
    return this.state;
  }

  getSession(): RecitationSession | null {
    return this.currentSession;
  }

  registerStateChangeListener(
    listener: (state: TeacherEngineState, action: TeacherActionOutput) => void
  ): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emitAction(action: TeacherActionOutput): void {
    this.logger.info(`Engine transition to [${this.state}]: ${action.logEventDescription}`, {
      state: this.state,
      sessionId: this.currentSession?.id,
    });
    for (const listener of this.listeners) {
      listener(this.state, action);
    }
  }

  async dispatch(event: TeacherEngineEvent): Promise<TeacherActionOutput> {
    switch (event.type) {
      case 'START_SESSION': {
        // Enforce Phase 2 verifiedOnly integrity constraint
        const surah = await this.quranDataProvider.getSurah(
          event.session.surahNumber,
          event.session.selectedRiwayah,
          { verifiedOnly: true }
        );

        if (!surah || surah.verification.verificationStatus !== VerificationStatus.VERIFIED) {
          this.state = TeacherEngineState.IDLE;
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: true,
            teacherVoicePromptArabic: 'عذرًا، لا يمكن بدء جلسة التسميع لعدم اكتمال الاعتماد والتحقق الشرعي والتشفيري لبيانات هذه السورة.',
            logEventDescription: `حظر بدء الجلسة: السورة [${event.session.surahNumber}] غير معتمدة رسمياً في الحزمة الموثقة`,
          };
          this.emitAction(action);
          return action;
        }

        this.currentSession = event.session;
        this.currentSession.status = RecitationSessionStatus.ACTIVE_LISTENING;
        this.state = TeacherEngineState.LISTEN;

        const action: TeacherActionOutput = {
          state: this.state,
          shouldInterruptAudio: false,
          teacherVoicePromptArabic: 'تفضل بالقراءة على بركة الله، أستمع إليك كلمة بكلمة.',
          logEventDescription: `بدء جلسة التلاوة المعتمدة لسورة ${surah.nameArabic} (${surah.number})، الآيات من ${event.session.fromAyah} إلى ${event.session.toAyah}`,
        };
        this.emitAction(action);
        return action;
      }

      case 'AUDIO_CHUNK_RECEIVED': {
        if (this.state === TeacherEngineState.LISTEN) {
          this.state = TeacherEngineState.ALIGN;
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: false,
            logEventDescription: 'استلام مقطع صوتي والانتقال إلى محاذاة الكلمات',
          };
          this.emitAction(action);
          return action;
        }
        break;
      }

      case 'ALIGNMENT_COMPLETED': {
        if (this.state === TeacherEngineState.ALIGN) {
          this.state = TeacherEngineState.ANALYZE;
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: false,
            highlightedWordId: event.matchedWordId,
            logEventDescription: `تمت المحاذاة بنجاح مع الكلمة [${event.matchedWordId}]، بدء الفحص الحتمي`,
          };
          this.emitAction(action);
          return action;
        }
        break;
      }

      case 'ANALYSIS_COMPLETED': {
        if (this.state === TeacherEngineState.ANALYZE) {
          this.state = TeacherEngineState.DECIDE;
          const hasErrors = event.errors.length > 0;
          this.pendingError = hasErrors ? event.errors[0] : null;

          const isCritical = this.pendingError?.category === LahnCategory.JALI;
          const decision = hasErrors
            ? resolvePedagogicalDecision(event.confidence.level, isCritical)
            : PedagogicalDecision.PROCEED_WITHOUT_JUDGMENT;

          // Process next step automatically based on decision
          if (decision === PedagogicalDecision.DIRECT_CORRECTION && this.pendingError) {
            this.state = TeacherEngineState.INTERRUPT_IF_NEEDED;
            const action: TeacherActionOutput = {
              state: this.state,
              shouldInterruptAudio: true,
              teacherVoicePromptArabic: 'توقف رعاك الله، استمع للتصويب.',
              highlightedWordId: `${this.pendingError.surahNumber}:${this.pendingError.ayahNumber}:${this.pendingError.wordIndex}`,
              displayCard: {
                titleArabic: this.pendingError.nameArabic,
                explanationArabic: this.pendingError.descriptionArabic,
              },
              logEventDescription: `قرار تصحيح مباشر (ثقة عالية) للخطأ [${this.pendingError.nameArabic}]`,
            };
            this.emitAction(action);
            return action;
          } else if (decision === PedagogicalDecision.REQUEST_REPETITION) {
            this.state = TeacherEngineState.REPEAT;
            const action: TeacherActionOutput = {
              state: this.state,
              shouldInterruptAudio: false,
              teacherVoicePromptArabic: 'لم تتضح الكلمة تمامًا، أعد قراءتها برفق.',
              logEventDescription: 'قرار طلب إعادة الكلمة (ثقة متوسطة تفاديًا للتخطئة غير المتيقنة)',
            };
            this.emitAction(action);
            return action;
          } else {
            // Confidence low or no error: proceed
            this.state = TeacherEngineState.LISTEN;
            const action: TeacherActionOutput = {
              state: this.state,
              shouldInterruptAudio: false,
              logEventDescription: 'متابعة الاستماع لعدم ثبوت لحن جلي قاطع',
            };
            this.emitAction(action);
            return action;
          }
        }
        break;
      }

      case 'RECITATION_FINDING_TRIGGERED': {
        const finding = event.finding;
        const decision = event.decision;

        if (decision.shouldInterruptAudioNow) {
          this.state = TeacherEngineState.INTERRUPT_IF_NEEDED;
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: true,
            teacherVoicePromptArabic:
              decision.recommendedPedagogicalPromptArabic ||
              finding.classification?.pedagogicalTipArabic ||
              'توقف رعاك الله، استمع للتصويب.',
            highlightedWordId: finding.wordId,
            displayCard: {
              titleArabic: finding.classification?.ruleNameArabic || 'تنبيه تصحيحي',
              explanationArabic:
                finding.classification?.descriptionArabic ||
                finding.classification?.pedagogicalTipArabic ||
                decision.reasonArabic,
            },
            logEventDescription: `قرار مقاطعة فورية من منسق التلاوة للكلمة [${finding.expectedText}]: ${decision.reasonArabic}`,
          };
          this.emitAction(action);
          return action;
        } else if (decision.deferredToAyahEnd) {
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: false,
            logEventDescription: `تأجيل التنبيه لنهاية الآية تفادياً لقطع التدفق الذهني للكلمة [${finding.expectedText}]`,
          };
          this.emitAction(action);
          return action;
        } else {
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: false,
            logEventDescription: `تسجيل ملاحظة تدريبية هادئة دون مقاطعة للكلمة [${finding.expectedText}]`,
          };
          this.emitAction(action);
          return action;
        }
      }

      case 'INTERRUPT_EMITTED': {
        if (this.state === TeacherEngineState.INTERRUPT_IF_NEEDED) {
          this.state = TeacherEngineState.CORRECT;
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: true,
            teacherVoicePromptArabic: this.pendingError?.pedagogicalTipArabic || 'انتبه إلى ضبط الحرف والمخرج الصحيح.',
            displayCard: this.pendingError
              ? {
                  titleArabic: this.pendingError.nameArabic,
                  explanationArabic: this.pendingError.pedagogicalTipArabic,
                }
              : undefined,
            logEventDescription: 'توجيه الشرح التعليمي للخطأ المرصود',
          };
          this.emitAction(action);
          return action;
        }
        break;
      }

      case 'CORRECTION_DELIVERED': {
        if (this.state === TeacherEngineState.CORRECT) {
          this.state = TeacherEngineState.REPEAT;
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: false,
            teacherVoicePromptArabic: 'اقرأ الكلمة الآن مستعينًا بالله.',
            logEventDescription: 'انتظار إعادة الطالب للمقطع المستهدف',
          };
          this.emitAction(action);
          return action;
        }
        break;
      }

      case 'REPETITION_RECEIVED': {
        if (this.state === TeacherEngineState.REPEAT) {
          this.state = TeacherEngineState.CONFIRM;
          const passed = event.isAccepted;
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: false,
            teacherVoicePromptArabic: passed
              ? 'أحسنت، بارك الله فيك ونفع بك! استمر.'
              : 'كررها مرة أخرى متأنيًا في مخرج الحرف.',
            logEventDescription: `تقييم محاولة الإعادة: ${passed ? 'تم التصويب بنجاح' : 'يلزم إعادة أخرى'}`,
          };
          this.emitAction(action);
          return action;
        }
        break;
      }

      case 'CONFIRMATION_EVALUATED': {
        if (this.state === TeacherEngineState.CONFIRM) {
          if (event.success) {
            this.state = TeacherEngineState.CONTINUE;
            this.pendingError = null;
            const action: TeacherActionOutput = {
              state: this.state,
              shouldInterruptAudio: false,
              teacherVoicePromptArabic: 'واصل التلاوة رعاك الله.',
              logEventDescription: 'إجازة التصويب والانتقال إلى استئناف القراءة',
            };
            this.emitAction(action);
            return action;
          } else {
            this.state = TeacherEngineState.CORRECT;
            const action: TeacherActionOutput = {
              state: this.state,
              shouldInterruptAudio: true,
              teacherVoicePromptArabic: 'تأمل المخرج والحركة مجددًا.',
              logEventDescription: 'إعادة التوجيه مرة أخرى بحلم ولين',
            };
            this.emitAction(action);
            return action;
          }
        }
        break;
      }

      case 'RESUME_RECITATION': {
        if (this.state === TeacherEngineState.CONTINUE) {
          this.state = TeacherEngineState.LISTEN;
          const action: TeacherActionOutput = {
            state: this.state,
            shouldInterruptAudio: false,
            logEventDescription: 'عودة إلى حالة الاستماع والمتابعة التلقائية',
          };
          this.emitAction(action);
          return action;
        }
        break;
      }

      case 'FINISH_SESSION': {
        this.state = TeacherEngineState.RECORD_PROGRESS;
        if (this.currentSession) {
          this.currentSession.status = RecitationSessionStatus.COMPLETED;
          this.currentSession.endedAt = new Date().toISOString();
        }
        const action: TeacherActionOutput = {
          state: this.state,
          shouldInterruptAudio: true,
          teacherVoicePromptArabic: 'تمت جلسة التسميع بحمد الله، جرى توثيق التقدم والإتقان في سجلك المبارك.',
          logEventDescription: 'حفظ الإحصاءات وإغلاق جلسة التسميع بنجاح',
        };
        this.emitAction(action);
        return action;
      }

      case 'ABORT_SESSION': {
        this.state = TeacherEngineState.IDLE;
        if (this.currentSession) {
          this.currentSession.status = RecitationSessionStatus.CANCELLED;
        }
        const action: TeacherActionOutput = {
          state: this.state,
          shouldInterruptAudio: true,
          logEventDescription: `إلغاء الجلسة: ${event.reason}`,
        };
        this.emitAction(action);
        return action;
      }
    }

    // Default fallback if event is not handled in current state
    return {
      state: this.state,
      shouldInterruptAudio: false,
      logEventDescription: `Ignored unhandled event [${event.type}] in state [${this.state}]`,
    };
  }
}
