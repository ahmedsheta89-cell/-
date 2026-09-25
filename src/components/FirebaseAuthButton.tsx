import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, signOutCurrentUser } from '../infrastructure/firebase/firebaseClient.ts';
import { LogIn, LogOut, User as UserIcon, CloudCheck, AlertCircle } from 'lucide-react';

export const FirebaseAuthButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: unknown) {
      console.warn('Sign-in cancelled or failed:', err);
      setError('تعذر تسجيل الدخول، يرجى المحاولة ثانية');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutCurrentUser();
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-lg text-xs text-stone-500 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-stone-400"></span>
        <span>جاري التحقق...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 rounded-xl text-xs">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'الطالب'}
            className="w-6 h-6 rounded-full border border-emerald-300"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex flex-col text-right">
          <span className="font-bold text-emerald-950 text-2xs truncate max-w-[100px]">
            {user.displayName || 'طالب مسجل'}
          </span>
          <span className="text-3xs text-emerald-700 flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            سحابة Firebase
          </span>
        </div>
        <button
          onClick={handleSignOut}
          title="تسجيل الخروج"
          className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleSignIn}
        className="px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        title="تسجيل الدخول لحفظ التقدم في سحابة فيربيس عبر الأجهزة"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"
          />
        </svg>
        <span>ربط بحساب Google</span>
      </button>
      {error && (
        <div className="absolute right-0 top-full mt-1 bg-rose-50 text-rose-700 text-2xs p-1.5 rounded border border-rose-200 shadow-md whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
};
