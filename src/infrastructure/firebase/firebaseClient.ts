/**
 * @file firebaseClient.ts
 * @module infrastructure/firebase
 * @description Centralized Firebase Client with hardened Firestore & Authentication initialization,
 * strict error handling conforming to FirestoreErrorInfo, and cloud synchronization helpers.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: Passing firestoreDatabaseId is required by AI Studio environment */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Operation Types conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const current = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: current?.uid,
      email: current?.email,
      emailVerified: current?.emailVerified,
      isAnonymous: current?.isAnonymous,
      tenantId: current?.tenantId,
      providerInfo:
        current?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore on startup
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('Firestore connection validated successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
    return false;
  }
}

/**
 * Sign in student / teacher with Google Popup
 */
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;
    if (user) {
      // Sync user profile to Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'طالب القرآن الكريم',
          photoURL: user.photoURL || '',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return user;
  } catch (err: unknown) {
    console.error('Google Sign-In Error:', err);
    throw err;
  }
}

/**
 * Sign out current user
 */
export async function signOutCurrentUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Save Student Learning Profile to Firestore
 */
export async function syncStudentProfileToFirestore(
  studentId: string,
  data: {
    currentSurah?: number;
    currentAyah?: number;
    totalAyahsMemorized?: number;
    overallRetentionRate?: number;
  }
): Promise<void> {
  const current = auth.currentUser;
  if (!current) return;

  const path = `users/${current.uid}/profiles/${studentId}`;
  try {
    const profileRef = doc(db, 'users', current.uid, 'profiles', studentId);
    await setDoc(
      profileRef,
      {
        studentId,
        userId: current.uid,
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Save Recitation Session to Firestore
 */
export async function recordRecitationSessionToFirestore(session: {
  sessionId: string;
  surahNumber: number;
  ayahNumber: number;
  mode: 'OPEN_MUSHAF' | 'BLIND_TEST';
  accuracyScore: number;
  tajweedScore: number;
  fluencyScore: number;
  hesitationCount: number;
  errorCount: number;
}): Promise<void> {
  const current = auth.currentUser;
  if (!current) return;

  const path = `users/${current.uid}/recitations/${session.sessionId}`;
  try {
    const recRef = doc(db, 'users', current.uid, 'recitations', session.sessionId);
    await setDoc(recRef, {
      ...session,
      userId: current.uid,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Save Mastery Certificate to Firestore
 */
export async function saveCertificateToFirestore(cert: {
  certificateId: string;
  studentName: string;
  surahNumber: number;
  surahName: string;
  accuracyScore: number;
  verificationHash: string;
}): Promise<void> {
  const current = auth.currentUser;
  if (!current) return;

  const path = `certificates/${cert.certificateId}`;
  try {
    const certRef = doc(db, 'certificates', cert.certificateId);
    await setDoc(certRef, {
      ...cert,
      userId: current.uid,
      issuedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
