/**
 * @file IAuthProvider.ts
 * @module infrastructure/interfaces
 * @description Authentication service abstraction decoupled from Firebase / Auth0 / Supabase.
 */

import { UserRole } from '../../domain/admin/types.ts';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isEmailVerified: boolean;
}

export interface IAuthProvider {
  getCurrentUser(): Promise<AuthUser | null>;
  signInWithEmail(email: string, passwordHash: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  refreshToken(): Promise<string>;
}
