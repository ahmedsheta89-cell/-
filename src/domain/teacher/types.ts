/**
 * @file types.ts
 * @module domain/teacher
 * @description TeacherSessionEngine domain contracts.
 * Governs the interactive pedagogy state machine independently of UI and vendor platforms.
 */

import { RecitationSession, RecitationSessionStatus } from '../recitation/types.ts';
import { RecitationErrorDetail } from '../errors/types.ts';
import { ConfidenceAssessment, PedagogicalDecision } from '../confidence/types.ts';

export enum TeacherEngineState {
  IDLE = 'IDLE',
  LISTEN = 'LISTEN',                               // الاستماع لتدفق الصوت
  ALIGN = 'ALIGN',                                 // مطابقة الصوت مع النص المتوقع
  ANALYZE = 'ANALYZE',                             // الفحص الحتمي للحركات والحروف والتجويد
  DECIDE = 'DECIDE',                               // تطبيق مصفوفة الثقة واتخاذ القرار
  INTERRUPT_IF_NEEDED = 'INTERRUPT_IF_NEEDED',     // إيقاف التلاوة بلطف عند ثبوت الخطأ
  CORRECT = 'CORRECT',                             // شرح الخطأ وتقديم المثال الصوتي/البصري
  REPEAT = 'REPEAT',                               // استقبال إعادة الطالب
  CONFIRM = 'CONFIRM',                             // تقييم محاولة الإعادة
  CONTINUE = 'CONTINUE',                           // استئناف التلاوة
  RECORD_PROGRESS = 'RECORD_PROGRESS',             // تسجيل الإحصائيات في ملف الطالب
}

export type TeacherEngineEvent =
  | { type: 'START_SESSION'; session: RecitationSession }
  | { type: 'AUDIO_CHUNK_RECEIVED'; audioData: ArrayBuffer; timestampMs: number }
  | { type: 'ALIGNMENT_COMPLETED'; matchedWordId: string; confidence: ConfidenceAssessment }
  | { type: 'ANALYSIS_COMPLETED'; errors: RecitationErrorDetail[]; confidence: ConfidenceAssessment }
  | { type: 'DECISION_MADE'; decision: PedagogicalDecision; error?: RecitationErrorDetail }
  | { type: 'RECITATION_FINDING_TRIGGERED'; finding: any; decision: any }
  | { type: 'INTERRUPT_EMITTED' }
  | { type: 'CORRECTION_DELIVERED'; explanationArabic: string }
  | { type: 'REPETITION_RECEIVED'; isAccepted: boolean }
  | { type: 'CONFIRMATION_EVALUATED'; success: boolean }
  | { type: 'RESUME_RECITATION' }
  | { type: 'FINISH_SESSION' }
  | { type: 'ABORT_SESSION'; reason: string };

export interface TeacherActionOutput {
  state: TeacherEngineState;
  shouldInterruptAudio: boolean;
  teacherVoicePromptArabic?: string;
  highlightedWordId?: string;
  displayCard?: {
    titleArabic: string;
    explanationArabic: string;
    makhrajImageUri?: string;
    tajweedRuleCode?: string;
  };
  logEventDescription: string;
}

export interface ITeacherSessionEngine {
  getCurrentState(): TeacherEngineState;
  getSession(): RecitationSession | null;
  dispatch(event: TeacherEngineEvent): Promise<TeacherActionOutput>;
  registerStateChangeListener(listener: (state: TeacherEngineState, action: TeacherActionOutput) => void): () => void;
}
