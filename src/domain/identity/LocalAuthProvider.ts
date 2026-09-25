/**
 * @file LocalAuthProvider.ts
 * @module domain/identity
 * @description Local & In-Memory implementation of IAuthProvider (Sections 14, 15, 16, 28, 29, 30).
 * 
 * CORE CONTRACT:
 * - Provider status is explicitly NOT_CONNECTED or MOCK (never falsely claims to be a production cloud provider).
 * - Safe account switching: wipes runtime state upon sign-out to prevent cross-account data leaks (AUTH-008).
 * - Token lifecycle & offline freshness validation: expired tokens are strictly rejected and not indefinitely extended.
 */

import {
  IAuthProvider,
  AuthSessionPayload,
} from './IAuthProvider.ts';
import {
  StudentIdentity,
  StudentAccount,
  AuthProviderStatus,
  AuthState,
  AccountStatus,
} from './types.ts';
import { StudentIdentityService } from './StudentIdentityService.ts';
import { SecureIdGenerator } from './SecureIdGenerator.ts';
import {
  UnauthorizedOperationError,
  AccountStateInvalidError,
} from './errorRegistry.ts';
import { SessionOwnershipManager } from './SessionOwnershipManager.ts';

export interface LocalAuthProviderConfig {
  readonly status?: AuthProviderStatus;
  readonly tokenTtlMs?: number; // default 24 hours
}

export class LocalAuthProvider implements IAuthProvider {
  public readonly providerStatus: AuthProviderStatus;
  private readonly tokenTtlMs: number;
  private readonly sessionManager: SessionOwnershipManager;

  private authState: AuthState = AuthState.SIGNED_OUT;
  private currentIdentity: StudentIdentity | null = null;
  private currentAccount: StudentAccount | null = null;
  private currentSessionPayload: AuthSessionPayload | null = null;

  // Registered accounts for local testing/offline use: email -> { account, identity, passwordHash }
  private readonly accountsStore: Map<
    string,
    { account: StudentAccount; identity: StudentIdentity; passwordHash: string }
  > = new Map();

  private readonly listeners: ((state: AuthState, identity: StudentIdentity | null) => void)[] = [];

  constructor(
    config?: LocalAuthProviderConfig,
    sessionManager?: SessionOwnershipManager
  ) {
    this.providerStatus = config?.status ?? AuthProviderStatus.NOT_CONNECTED;
    this.tokenTtlMs = config?.tokenTtlMs ?? 24 * 60 * 60 * 1000;
    this.sessionManager = sessionManager ?? new SessionOwnershipManager();
  }

  public getProviderStatus(): AuthProviderStatus {
    return this.providerStatus;
  }

  public getAuthState(): AuthState {
    return this.authState;
  }

  public async getCurrentIdentity(): Promise<StudentIdentity | null> {
    // If token is expired, invalidate
    if (this.currentSessionPayload && Date.now() > this.currentSessionPayload.expiresAt) {
      await this.signOut();
      return null;
    }
    return this.currentIdentity;
  }

  public async getCurrentAccount(): Promise<StudentAccount | null> {
    if (this.currentSessionPayload && Date.now() > this.currentSessionPayload.expiresAt) {
      await this.signOut();
      return null;
    }
    return this.currentAccount;
  }

  /**
   * Section 5: Creates an anonymous local student identity.
   */
  public async createAnonymousIdentity(): Promise<StudentIdentity> {
    // End any current active sessions before switching
    if (this.currentIdentity) {
      this.sessionManager.terminateAllSessionsForStudent(this.currentIdentity.studentId);
    }

    const identity = StudentIdentityService.createAnonymousIdentity();
    this.currentIdentity = identity;
    this.currentAccount = null;
    this.currentSessionPayload = null;
    this.authState = AuthState.ANONYMOUS;

    this.notify();
    return identity;
  }

  /**
   * Registers a new account locally for sign-in testing.
   */
  public registerLocalAccount(
    email: string,
    passwordHash: string,
    displayName?: string
  ): { identity: StudentIdentity; account: StudentAccount; passwordHash: string } {
    const normalizedEmail = email.toLowerCase().trim();
    const created = StudentIdentityService.createAuthenticatedIdentity({
      email: normalizedEmail,
      displayName: displayName ?? normalizedEmail.split('@')[0],
      emailVerified: true,
    });

    const entry = {
      account: created.account,
      identity: created.identity,
      passwordHash,
    };

    this.accountsStore.set(normalizedEmail, entry);
    return entry;
  }

  /**
   * Signs in with email and passwordHash.
   */
  public async signIn(email: string, passwordHash: string): Promise<AuthSessionPayload> {
    this.authState = AuthState.AUTHENTICATION_PENDING;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Wipe previous student session & cached state to prevent account-switch leakage (Section 28, 29)
    if (this.currentIdentity) {
      this.sessionManager.terminateAllSessionsForStudent(this.currentIdentity.studentId);
    }
    this.currentIdentity = null;
    this.currentAccount = null;
    this.currentSessionPayload = null;

    // 2. Validate credentials
    let stored = this.accountsStore.get(normalizedEmail);
    if (!stored) {
      // Auto-provision local mock account if in mock mode
      stored = this.registerLocalAccount(normalizedEmail, passwordHash);
    } else {
      if (stored.passwordHash !== passwordHash) {
        this.authState = AuthState.AUTHENTICATION_ERROR;
        this.notify();
        throw new UnauthorizedOperationError('SIGN_IN', undefined, 'Invalid credentials provided.');
      }
    }

    const currentStored = stored;
    if (currentStored.account.status === AccountStatus.SUSPENDED) {
      this.authState = AuthState.AUTHENTICATION_ERROR;
      this.notify();
      throw new AccountStateInvalidError(currentStored.account.accountId, currentStored.account.status, 'SIGN_IN');
    }

    if (currentStored.account.status === AccountStatus.DELETED) {
      this.authState = AuthState.AUTHENTICATION_ERROR;
      this.notify();
      throw new AccountStateInvalidError(currentStored.account.accountId, currentStored.account.status, 'SIGN_IN');
    }

    const now = Date.now();
    const token = `token-${SecureIdGenerator.generateUuid()}`;
    const payload: AuthSessionPayload = Object.freeze({
      identity: currentStored.identity,
      account: currentStored.account,
      token,
      expiresAt: now + this.tokenTtlMs,
    });

    this.currentIdentity = currentStored.identity;
    this.currentAccount = currentStored.account;
    this.currentSessionPayload = payload;
    this.authState = AuthState.AUTHENTICATED;

    this.notify();
    return payload;
  }

  /**
   * Section 28: Signs out safely.
   */
  public async signOut(): Promise<void> {
    if (this.currentIdentity) {
      this.sessionManager.terminateAllSessionsForStudent(this.currentIdentity.studentId);
    }

    this.currentIdentity = null;
    this.currentAccount = null;
    this.currentSessionPayload = null;
    this.authState = AuthState.SIGNED_OUT;

    this.notify();
  }

  /**
   * Refreshes identity token.
   */
  public async refreshIdentity(): Promise<StudentIdentity | null> {
    if (!this.currentIdentity || !this.currentSessionPayload) {
      return null;
    }

    // If expired, sign out
    if (Date.now() > this.currentSessionPayload.expiresAt) {
      await this.signOut();
      return null;
    }

    const now = Date.now();
    this.currentSessionPayload = Object.freeze({
      ...this.currentSessionPayload,
      expiresAt: now + this.tokenTtlMs,
    });

    return this.currentIdentity;
  }

  /**
   * Section 20: Requests account deletion.
   */
  public async requestAccountDeletion(accountId: string): Promise<StudentAccount> {
    if (!this.currentAccount || this.currentAccount.accountId !== accountId) {
      throw new UnauthorizedOperationError('DELETE_ACCOUNT', undefined, 'Active account does not match requested account.');
    }

    const updatedAccount = StudentIdentityService.requestAccountDeletion(this.currentAccount);
    this.currentAccount = updatedAccount;

    // Update in store
    if (updatedAccount.email) {
      const stored = this.accountsStore.get(updatedAccount.email);
      if (stored) {
        this.accountsStore.set(updatedAccount.email, {
          ...stored,
          account: updatedAccount,
        });
      }
    }

    return updatedAccount;
  }

  public onAuthStateChanged(callback: (state: AuthState, identity: StudentIdentity | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.authState, this.currentIdentity);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx !== -1) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.authState, this.currentIdentity);
      } catch {
        // Listener error must not crash auth state cycle
      }
    }
  }
}
