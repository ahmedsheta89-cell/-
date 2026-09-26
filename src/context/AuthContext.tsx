import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  isUserAdmin,
  signInWithGoogle as fbSignInWithGoogle,
  signInWithEmail as fbSignInWithEmail,
  signUpWithEmail as fbSignUpWithEmail,
  authenticateAsPlatformAdmin as fbAuthenticateAsPlatformAdmin,
  signOutCurrentUser,
  PLATFORM_ADMIN_EMAIL,
  registerOrUpdateStudentProfile,
  AppUser,
} from '../infrastructure/firebase/firebaseClient.ts';

export interface UnifiedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role?: string;
}

interface AuthContextValue {
  user: UnifiedUser | null;
  isAdmin: boolean;
  loading: boolean;
  studentName: string;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<UnifiedUser | null>;
  loginWithEmail: (email: string, pass: string) => Promise<UnifiedUser>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<UnifiedUser>;
  loginAsAdminDirectly: () => Promise<UnifiedUser>;
  logout: () => Promise<void>;
  updateStudentName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('quran_teacher_custom_name') || 'طالب جديد';
  });

  // Restore existing session on mount
  useEffect(() => {
    const adminAuth = localStorage.getItem('quran_teacher_admin_auth');
    if (adminAuth === PLATFORM_ADMIN_EMAIL) {
      setUser({
        uid: 'ahmed-sheta89-admin',
        email: PLATFORM_ADMIN_EMAIL,
        displayName: 'أحمد شتة (المشرف العام)',
        role: 'ADMIN',
      });
      setStudentName('أحمد شتة (المشرف العام)');
    } else {
      const storedUid = localStorage.getItem('quran_teacher_uid');
      const storedName = localStorage.getItem('quran_teacher_custom_name');
      if (storedUid && storedName) {
        setUser({
          uid: storedUid,
          email: `${storedUid.slice(0, 10)}@student.quran`,
          displayName: storedName,
          role: 'STUDENT',
        });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const isAdminUser = currentUser.email?.toLowerCase().trim() === PLATFORM_ADMIN_EMAIL.toLowerCase();
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || (isAdminUser ? 'أحمد شتة (المشرف العام)' : 'طالب مسجّل'),
          photoURL: currentUser.photoURL,
          role: isAdminUser ? 'ADMIN' : 'STUDENT',
        });
        if (currentUser.displayName) {
          setStudentName(currentUser.displayName);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = isUserAdmin(user);

  const loginWithGoogle = async (): Promise<UnifiedUser | null> => {
    const loggedUser = await fbSignInWithGoogle();
    if (loggedUser) {
      const unified: UnifiedUser = {
        uid: loggedUser.uid,
        email: loggedUser.email,
        displayName: loggedUser.displayName,
        photoURL: loggedUser.photoURL,
        role: loggedUser.role,
      };
      setUser(unified);
      if (loggedUser.displayName) {
        setStudentName(loggedUser.displayName);
      }
      return unified;
    }
    return null;
  };

  const loginWithEmail = async (email: string, pass: string): Promise<UnifiedUser> => {
    const res = await fbSignInWithEmail(email, pass);
    const unified: UnifiedUser = {
      uid: res.uid,
      email: res.email,
      displayName: res.displayName,
      role: res.role,
    };
    setUser(unified);
    if (res.displayName) {
      setStudentName(res.displayName);
    }
    return unified;
  };

  const registerWithEmail = async (email: string, pass: string, name: string): Promise<UnifiedUser> => {
    const res = await fbSignUpWithEmail(email, pass, name);
    const unified: UnifiedUser = {
      uid: res.uid,
      email: res.email,
      displayName: res.displayName,
      role: res.role,
    };
    setUser(unified);
    if (res.displayName) {
      setStudentName(res.displayName);
    }
    return unified;
  };

  const loginAsAdminDirectly = async (): Promise<UnifiedUser> => {
    const res = await fbAuthenticateAsPlatformAdmin();
    const unified: UnifiedUser = {
      uid: res.uid,
      email: res.email,
      displayName: res.displayName,
      role: 'ADMIN',
    };
    setUser(unified);
    setStudentName('أحمد شتة (المشرف العام)');
    return unified;
  };

  const logout = async () => {
    await signOutCurrentUser();
    setUser(null);
    setStudentName('طالب زائر');
  };

  const updateStudentName = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setStudentName(clean);
    localStorage.setItem('quran_teacher_custom_name', clean);
    if (user) {
      setUser({ ...user, displayName: clean });
    }
    await registerOrUpdateStudentProfile(clean);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        studentName,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginAsAdminDirectly,
        logout,
        updateStudentName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
