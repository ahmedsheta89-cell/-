/**
 * @file types.ts
 * @module domain/admin
 * @description Administration and Governance domain types.
 * Strict segregation of duties: System Admins manage infrastructure,
 * Scientific Reviewers manage religious validity, Content Admins manage curricula.
 */

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER_ASSISTANT = 'TEACHER_ASSISTANT',
  CONTENT_ADMIN = 'CONTENT_ADMIN',
  SCIENTIFIC_REVIEWER = 'SCIENTIFIC_REVIEWER',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
}

export enum AdminPermission {
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  EDIT_LESSONS = 'EDIT_LESSONS',
  VERIFY_QURAN_DATA = 'VERIFY_QURAN_DATA',       // Exclusive to SCIENTIFIC_REVIEWER
  DEPLOY_RULES = 'DEPLOY_RULES',
  VIEW_SYSTEM_HEALTH = 'VIEW_SYSTEM_HEALTH',
  CONFIG_AI_PARAMS = 'CONFIG_AI_PARAMS',
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  actorRole: UserRole;
  action: string;
  targetEntity: string;
  targetEntityId: string;
  timestamp: string;
  ipAddressMasked: string;
  diffSummary?: string;
  metadata?: Record<string, unknown>;
}

export const ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  [UserRole.STUDENT]: [],
  [UserRole.TEACHER_ASSISTANT]: [AdminPermission.VIEW_SYSTEM_HEALTH],
  [UserRole.CONTENT_ADMIN]: [
    AdminPermission.EDIT_LESSONS,
    AdminPermission.VIEW_SYSTEM_HEALTH,
  ],
  [UserRole.SCIENTIFIC_REVIEWER]: [
    AdminPermission.VERIFY_QURAN_DATA,
    AdminPermission.EDIT_LESSONS,
    AdminPermission.VIEW_AUDIT_LOGS,
  ],
  [UserRole.SYSTEM_ADMIN]: [
    AdminPermission.MANAGE_USERS,
    AdminPermission.VIEW_AUDIT_LOGS,
    AdminPermission.DEPLOY_RULES,
    AdminPermission.VIEW_SYSTEM_HEALTH,
    AdminPermission.CONFIG_AI_PARAMS,
  ],
};
