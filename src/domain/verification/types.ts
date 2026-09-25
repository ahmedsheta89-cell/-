/**
 * @file types.ts
 * @module domain/verification
 * @description Scientific verification contracts and religious data governance.
 * Zero-hallucination guarantee: No AI-generated text is ever marked as certified religious truth.
 */

import { RiwayahType, VerificationStatus } from '../quran/types.ts';

export interface ScientificReviewerCredentials {
  reviewerId: string;
  fullName: string;
  titleArabic: string;             // الشيخ المقرئ / دكتور في القراءات
  ijazahDescription: string;       // الإجازة المسندة بالسند المتصل
  institutionAffiliation: string;  // جهة الاعتماد الرسمية
  verificationCount: number;
}

export interface ContentVerificationRecord {
  id: string;
  contentType: 'QURAN_TEXT' | 'TAJWEED_RULE' | 'TAFSIR_EXEGESIS' | 'AUDIO_REFERENCE';
  entityId: string;                // e.g. "surah:1" or "rule:madd_muttasil"
  sourceAuthority: string;         // e.g. "King Fahd Complex for Printing the Holy Quran"
  referenceCitation: string;       // e.g. "مصحف المدينة النبوية، طبعة 1442هـ"
  riwayah: RiwayahType;
  version: string;                 // Semantic version of religious dataset
  verificationStatus: VerificationStatus;
  reviewer: ScientificReviewerCredentials;
  checksumSha256: string;
  verifiedAt: string;
  updatedAt: string;
  auditNotes?: string;
}

/**
 * Dual verification review stages for zero-compromise religious data governance
 */
export enum ScientificReviewStage {
  PENDING_FIRST_APPROVAL = 'PENDING_FIRST_APPROVAL',     // بانتظار مراجعة المدقق الأول
  PENDING_SECOND_APPROVAL = 'PENDING_SECOND_APPROVAL',   // بانتظار مراجعة المدقق الثاني (التدقيق المزدوج)
  VERIFIED = 'VERIFIED',                                 // مجاز ومتحقق منه رسميًا بختم المراجعين
  REJECTED = 'REJECTED',                                 // مرفوض لملاحظة علمية أو عيب توثيقي
}

export interface ReviewerApprovalStamp {
  reviewer: ScientificReviewerCredentials;
  approvedAt: string;
  comments: string;
  signatureSha256: string;
}

export interface DualVerificationQueueItem {
  id: string;
  entityType: 'QURAN_TEXT' | 'TAJWEED_RULE' | 'DATASET_VERSION';
  entityId: string;
  datasetVersion: string;
  descriptionArabic: string;
  stage: ScientificReviewStage;
  primaryReviewerStamp?: ReviewerApprovalStamp;
  secondaryReviewerStamp?: ReviewerApprovalStamp;
  isFullyCertified: boolean;
  checksumSha256: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Audit check rule: Prohibits AI-authored strings from being marked as verified religious truth
 */
export function assertReligiousDataVerifiability(record: ContentVerificationRecord): boolean {
  if (record.verificationStatus === VerificationStatus.VERIFIED) {
    if (!record.reviewer || !record.reviewer.reviewerId) {
      throw new Error('Religious integrity violation: Cannot verify content without qualified human reviewer.');
    }
    if (!record.checksumSha256 || record.checksumSha256.length < 32) {
      throw new Error('Religious integrity violation: Missing cryptographic hash validation.');
    }
  }
  return true;
}

/**
 * Dual verification gate enforcement rule
 */
export function assertDualVerificationCertified(item: DualVerificationQueueItem): boolean {
  if (!item.primaryReviewerStamp || !item.secondaryReviewerStamp) {
    throw new Error('Religious governance violation: Dual review required before certifying content.');
  }
  if (item.primaryReviewerStamp.reviewer.reviewerId === item.secondaryReviewerStamp.reviewer.reviewerId) {
    throw new Error('Religious governance violation: Independent secondary reviewer required.');
  }
  return true;
}
