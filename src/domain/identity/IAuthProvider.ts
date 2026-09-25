/**
 * @file IAuthProvider.ts
 * @module domain/identity
 * @description Provider-agnostic authentication contract for Quran Teacher AI (Sections 14, 15, 16).
 * 
 * VENDOR-NEUTRALITY INVARIANT:
 * Domain contracts depend purely on IAuthProvider.
 * Never hard-code Firebase, Supabase, Auth0, or any vendor SDK in the domain layer.
 * If no live authentication backend is provisioned, provider status MUST explicitly be NOT_CONNECTED or MOCK.
 */

import {
  StudentIdentity,
  StudentAccount,
  AuthProviderStatus,
  AuthState,
} from './types.ts';

export interface AuthSessionPayload {
  readonly identity: StudentIdentity;
  readonly account: StudentAccount;
  readonly token: string;
  readonly expiresAt: number;
}

export interface IAuthProvider {
  /**
   * Returns provider connection status: REAL, MOCK, or NOT_CONNECTED.
   */
  getProviderStatus(): AuthProviderStatus;

  /**
   * Current authentication runtime state.
   */
  getAuthState(): AuthState;

  /**
   * Resolves the current student identity or null if signed out.
   */
  getCurrentIdentity(): Promise<StudentIdentity | null>;

  /**
   * Resolves the current student account or null if anonymous / signed out.
   */
  getCurrentAccount(): Promise<StudentAccount | null>;

  /**
   * Provisions a cryptographically secure anonymous local identity.
   */
  createAnonymousIdentity(): Promise<StudentIdentity>;

  /**
   * Authenticates an existing student account.
   */
  signIn(email: string, passwordHash: string): Promise<AuthSessionPayload>;

  /**
   * Signs out, terminates active sessions, and wipes cached runtime credentials.
   */
  signOut(): Promise<void>;

  /**
   * Refreshes identity credentials and validates token freshness.
   */
  refreshIdentity(): Promise<StudentIdentity | null>;

  /**
   * Requests account deletion with deterministic lifecycle transition.
   */
  requestAccountDeletion(accountId: string): Promise<StudentAccount>;

  /**
   * Subscribes to auth state transitions. Returns unregister function.
   */
  onAuthStateChanged(callback: (state: AuthState, identity: StudentIdentity | null) => void): () => void;
}
