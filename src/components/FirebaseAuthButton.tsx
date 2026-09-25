import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, signOutCurrentUser } from '../infrastructure/firebase/firebaseClient.ts';
import {
  LogIn,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const FirebaseAuthButton: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [localStudentName, setLocalStudentName] = useState<string>(() => {
    return localStorage.getItem('quran_teacher_student_name') || '';
  });
  const [showModal, setShowModal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConsoleHelper, setShowConsoleHelper] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveLocalName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim();
    if (clean) {
      localStorage.setItem('quran_teacher_student_name', clean);
      setLocalStudentName(clean);
      setShowModal(false);
      setAuthError(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setShowConsoleHelper(false);
    try {
      await signInWithGoogle();
      setShowModal(false);
    } catch (err: any) {
      console.warn('Google sign-in exception:', err);
      const msg = err?.message || String(err);
      if (
        msg.includes('unauthorized-domain') ||
        msg.includes('invalid') ||
        msg.includes('operation-not-allowed')
      ) {
        setAuthError('يتطلب ربط Google على GitHub Pages تفعيل النطاق في كونسول Firebase.');
        setShowConsoleHelper(true);
      } else {
        setAuthError('تعذر إتمام الدخول بـ Google. يمكنك المتابعة بتسجيل اسم الطالب محلياً.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutCurrentUser();
      localStorage.removeItem('quran_teacher_student_name');
      setLocalStudentName('');
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

  // Active state: Firebase Google User or Local Student Name
  const activeName = firebaseUser?.displayName || localStudentName;
  const isCloudActive = !!firebaseUser;

  if (activeName) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50/90 border border-emerald-200/90 px-3 py-1 rounded-xl text-xs shadow-2xs">
        {firebaseUser?.photoURL ? (
          <img
            src={firebaseUser.photoURL}
            alt={activeName}
            className="w-6 h-6 rounded-full border border-emerald-400"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-2xs">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex flex-col text-right">
          <span className="font-bold text-emerald-950 text-2xs truncate max-w-[120px]">
            {activeName}
          </span>
          <span className="text-3xs text-emerald-700 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isCloudActive ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
            {isCloudActive ? 'سحابة Firebase' : 'حفظ محلي موثق'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          title="تغيير الحساب أو الخروج"
          className="text-stone-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Guest / Login button
  return (
    <>
      <button
        onClick={() => {
          setNameInput(localStudentName || '');
          setAuthError(null);
          setShowConsoleHelper(false);
          setShowModal(true);
        }}
        className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        title="تسجيل هوية الطالب للحفظ وتوثيق الشهادات"
      >
        <UserIcon className="w-3.5 h-3.5 text-emerald-300" />
        <span>تسجيل الطالب / الحساب</span>
      </button>

      {/* Login / Identity Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-l from-emerald-950 to-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-arabic-heading">
                    تسجيل هوية الطالب والشهادات
                  </h3>
                  <p className="text-2xs text-stone-300">لحفظ سجلات التسميع وإصدار شهادات الإتقان باسمك</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Option 1: Fast Student Name (100% Reliable Offline-First) */}
              <form onSubmit={handleSaveLocalName} className="space-y-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <label htmlFor="studentNameInput" className="font-bold text-xs text-stone-900">
                    الدخول السريع باسم الطالب (موصى به فوراً):
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    id="studentNameInput"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="اكتب اسمك الكريم (مثال: أحمد شتة)"
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    حفظ وتأكيد
                  </button>
                </div>
                <p className="text-3xs text-stone-500 leading-normal">
                  يعمل فوراً بدون أي نوافذ منبثقة، وتصدر جميع شهادات التسميع والتقارير باسمك المختار.
                </p>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-stone-200 w-full"></div>
                <span className="bg-white px-3 text-3xs text-stone-400 font-bold uppercase tracking-wider shrink-0">
                  أو المزامنة السحابية
                </span>
              </div>

              {/* Option 2: Google Sign-In with Error Guard */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <span>مزامنة عبر حساب Google (Firebase Cloud)</span>
                </button>

                {authError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-2xs text-amber-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{authError}</span>
                    </div>
                    {showConsoleHelper && (
                      <p className="text-3xs text-stone-600 leading-relaxed">
                        نظراً لعمل الموقع على نطاق GitHub Pages الخارجي، يمكنك إما المتابعة بكتابة اسمك بالأعلى مباشرة، أو إضافة النطاق في كونسول Firebase من الرابط أدناه:
                        <br />
                        <a
                          href="https://console.firebase.google.com/project/zeta-torch-nz37z/authentication/settings"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline font-bold inline-flex items-center gap-1 mt-1"
                        >
                          <span>إعدادات النطاقات في Firebase Console</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
