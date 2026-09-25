import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  isUserAdmin,
  signInWithGoogle as fbSignInWithGoogle,
  signOutCurrentUser,
  PLATFORM_ADMIN_EMAIL,
  registerOrUpdateStudentProfile,
} from '../infrastructure/firebase/firebaseClient.ts';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  studentName: string;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  updateStudentName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('quran_teacher_custom_name') || 'طالب جديد';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) {
        setStudentName(currentUser.displayName);
      } else if (currentUser?.email) {
        setStudentName(currentUser.email.split('@')[0]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = isUserAdmin(user);

  const loginWithGoogle = async () => {
    const loggedUser = await fbSignInWithGoogle();
    if (loggedUser) {
      setUser(loggedUser);
      if (loggedUser.displayName) {
        setStudentName(loggedUser.displayName);
      }
    }
    return loggedUser;
  };

  const logout = async () => {
    await signOutCurrentUser();
    setUser(null);
    setStudentName('طالب زائر');
    localStorage.removeItem('quran_teacher_custom_name');
  };

  const updateStudentName = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setStudentName(clean);
    localStorage.setItem('quran_teacher_custom_name', clean);
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
