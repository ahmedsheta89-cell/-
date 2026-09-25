/**
 * @file InMemoryAuthProvider.ts
 * @module infrastructure/providers
 * @description In-memory authentication provider implementing IAuthProvider.
 */

import { IAuthProvider, AuthUser } from '../interfaces/IAuthProvider.ts';
import { UserRole } from '../../domain/admin/types.ts';

export class InMemoryAuthProvider implements IAuthProvider {
  private currentUser: AuthUser | null = {
    uid: 'student-dev-1',
    email: 'student@quranteacher.ai',
    displayName: 'أحمد طالب القرآن',
    role: UserRole.STUDENT,
    isEmailVerified: true,
  };

  private listeners: ((user: AuthUser | null) => void)[] = [];

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  async signInWithEmail(email: string): Promise<AuthUser> {
    this.currentUser = {
      uid: 'user-' + Date.now(),
      email,
      displayName: email.split('@')[0],
      role: UserRole.STUDENT,
      isEmailVerified: true,
    };
    this.notify();
    return this.currentUser;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.notify();
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  async refreshToken(): Promise<string> {
    return 'mock-token-' + Date.now();
  }

  public setMockRole(role: UserRole): void {
    if (this.currentUser) {
      this.currentUser.role = role;
      this.notify();
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }
}
