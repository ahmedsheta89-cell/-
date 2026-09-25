/**
 * @file SessionOwnershipManager.ts
 * @module domain/identity
 * @description Manages session ownership enforcement, preventing cross-student session leakage (Sections 8, 9, 27).
 * 
 * CORE SECURITY INVARIANT:
 * A teacher session belongs to exactly ONE studentId and ONE deviceId.
 * Any attempt by Student A to operate, resume, or mutate a session created by Student B
 * is deterministically rejected with AUTH-001 SESSION_OWNERSHIP_MISMATCH.
 */

import { SessionIdentity } from './types.ts';
import {
  SessionOwnershipMismatchError,
  DeviceIdentityMismatchError,
  UnauthorizedOperationError,
} from './errorRegistry.ts';
import { SecureIdGenerator } from './SecureIdGenerator.ts';

export class SessionOwnershipManager {
  private readonly sessions: Map<string, SessionIdentity> = new Map();
  private readonly activeStudentSessions: Map<string, string> = new Map(); // studentId -> activeSessionId

  /**
   * Registers a newly started session.
   */
  public registerSession(params: {
    sessionId?: string;
    studentId: string;
    deviceId: string;
    startedAt?: number;
  }): SessionIdentity {
    const sessionId = params.sessionId ?? SecureIdGenerator.generateSessionId();
    const startedAt = params.startedAt ?? Date.now();

    // End existing active session for this student if present
    const existingActiveSessionId = this.activeStudentSessions.get(params.studentId);
    if (existingActiveSessionId && existingActiveSessionId !== sessionId) {
      this.terminateSession(existingActiveSessionId, params.studentId);
    }

    const session: SessionIdentity = Object.freeze({
      sessionId,
      studentId: params.studentId,
      deviceId: params.deviceId,
      startedAt,
      endedAt: null,
      isActive: true,
    });

    this.sessions.set(sessionId, session);
    this.activeStudentSessions.set(params.studentId, sessionId);
    return session;
  }

  /**
   * Section 9: Explicit ownership assertion.
   * Throws AUTH-001 SESSION_OWNERSHIP_MISMATCH if attemptedStudentId !== session.studentId.
   */
  public assertSessionOwnership(sessionId: string, attemptedStudentId: string): SessionIdentity {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new UnauthorizedOperationError(
        'SESSION_ACCESS',
        attemptedStudentId,
        `Session with id ${sessionId} does not exist or has been purged.`
      );
    }

    if (session.studentId !== attemptedStudentId) {
      throw new SessionOwnershipMismatchError(sessionId, session.studentId, attemptedStudentId);
    }

    return session;
  }

  /**
   * Asserts device identity integrity for the session.
   */
  public assertDeviceIntegrity(sessionId: string, attemptedDeviceId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.deviceId !== attemptedDeviceId) {
      throw new DeviceIdentityMismatchError(sessionId, session.deviceId, attemptedDeviceId);
    }
  }

  /**
   * Retrieves session metadata if it exists.
   */
  public getSession(sessionId: string): SessionIdentity | null {
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Retrieves active session ID for a student.
   */
  public getActiveSessionForStudent(studentId: string): SessionIdentity | null {
    const sessionId = this.activeStudentSessions.get(studentId);
    if (!sessionId) return null;
    return this.sessions.get(sessionId) ?? null;
  }

  /**
   * Terminates a session safely with ownership check.
   */
  public terminateSession(sessionId: string, studentId: string): SessionIdentity {
    const session = this.assertSessionOwnership(sessionId, studentId);
    if (!session.isActive) {
      return session; // already ended
    }

    const updated: SessionIdentity = Object.freeze({
      ...session,
      endedAt: Date.now(),
      isActive: false,
    });

    this.sessions.set(sessionId, updated);
    if (this.activeStudentSessions.get(studentId) === sessionId) {
      this.activeStudentSessions.delete(studentId);
    }
    return updated;
  }

  /**
   * Purges all active runtime sessions for a student upon logout.
   */
  public terminateAllSessionsForStudent(studentId: string): void {
    const activeSessionId = this.activeStudentSessions.get(studentId);
    if (activeSessionId) {
      const session = this.sessions.get(activeSessionId);
      if (session && session.isActive) {
        this.sessions.set(
          activeSessionId,
          Object.freeze({
            ...session,
            endedAt: Date.now(),
            isActive: false,
          })
        );
      }
      this.activeStudentSessions.delete(studentId);
    }
  }

  /**
   * Returns total registered session count.
   */
  public getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Clears all session cache (for testing or complete system reset).
   */
  public clear(): void {
    this.sessions.clear();
    this.activeStudentSessions.clear();
  }
}
