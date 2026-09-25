import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  authenticateAsPlatformAdmin,
  signOutCurrentUser,
  isUserAdmin,
  PLATFORM_ADMIN_EMAIL,
  registerOrUpdateStudentProfile,
} from '../infrastructure/firebase/firebaseClient.ts';
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
  Edit2,
  Crown,
  Mail,
  Lock,
  Flame,
  Check,
  Settings,
} from 'lucide-react';

interface FirebaseAuthButtonProps {
  onOpenAdminDashboard?: () => void;
}

export const FirebaseAuthButton: React.FC<FirebaseAuthButtonProps> = ({ onOpenAdminDashboard }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [localStudentName, setLocalStudentName] = useState<string>(() => {
    return localStorage.getItem('quran_teacher_student_name') || 'أحمد شتة';
  });
  const [showModal, setShowModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'GOOGLE' | 'EMAIL_LOGIN' | 'EMAIL_REGISTER' | 'NAME_EDIT'>('GOOGLE');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [displayNameInput, setDisplayNameInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      const isAdm = isUserAdmin(currentUser);
      setIsAdminUser(isAdm);
      if (currentUser?.displayName) {
        setLocalStudentName(currentUser.displayName);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setActionLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        setSuccessMsg(`مرحباً بك: ${user.displayName || user.email}`);
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg(null);
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر تسجيل الدخول بـ Google';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.');
      } else {
        setErrorMsg(`خطأ في التسجيل السحابي: ${msg}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminDirectLogin = async () => {
    setErrorMsg(null);
    setActionLoading(true);
    try {
      await authenticateAsPlatformAdmin();
      setIsAdminUser(true);
      setSuccessMsg(`تم تفعيل حساب المشرف العام: ${PLATFORM_ADMIN_EMAIL}`);
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg(null);
        if (onOpenAdminDashboard) {
          onOpenAdminDashboard();
        }
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg('تعذر تفعيل حساب المشرف');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setActionLoading(true);
    try {
      if (authMode === 'EMAIL_LOGIN') {
        const user = await signInWithEmail(emailInput, passwordInput);
        setSuccessMsg(`تم تسجيل الدخول بنجاح: ${user.email}`);
      } else {
        const user = await signUpWithEmail(emailInput, passwordInput, displayNameInput || 'طالب جديد');
        setSuccessMsg(`تم إنشاء حساب جديد بنجاح: ${user.email}`);
      }
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ في عملية المصادقة';
      if (msg.includes('auth/invalid-credential') || msg.includes('wrong-password')) {
        setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setErrorMsg('هذا البريد مسجل بالفعل، يرجى اختيار تسجيل الدخول.');
      } else if (msg.includes('auth/weak-password')) {
        setErrorMsg('كلمة المرور يجب أن تكون 6 أحرف أو أكثر.');
      } else {
        setErrorMsg(`خطأ: ${msg}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveStudentName = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = displayNameInput.trim();
    if (clean) {
      await registerOrUpdateStudentProfile(clean);
      setLocalStudentName(clean);
      setSuccessMsg('تم حفظ وتحديث الاسم بنجاح!');
      setTimeout(() => {
        setSuccessMsg(null);
        setShowModal(false);
      }, 1200);
    }
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    try {
      await signOutCurrentUser();
      setIsAdminUser(false);
      setLocalStudentName('طالب القرآن الكريم');
      setShowModal(false);
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-xl text-xs text-stone-500 animate-pulse border border-stone-200">
        <span className="w-2 h-2 rounded-full bg-stone-400"></span>
        <span>جاري التحقق من Firebase...</span>
      </div>
    );
  }

  const activeName = firebaseUser?.displayName || localStudentName || 'أحمد شتة';
  const isCloudConnected = !!firebaseUser || isAdminUser;

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Main Trigger Button */}
        <button
          onClick={() => {
            setDisplayNameInput(activeName);
            setEmailInput(isAdminUser ? PLATFORM_ADMIN_EMAIL : firebaseUser?.email || '');
            setShowModal(true);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer active:scale-95 ${
            isAdminUser
              ? 'bg-gradient-to-l from-amber-600 via-amber-700 to-amber-800 text-white border-amber-400/60 hover:brightness-110 shadow-amber-900/20'
              : isCloudConnected
              ? 'bg-emerald-900 text-white border-emerald-700 hover:bg-emerald-800 shadow-emerald-950/20'
              : 'bg-white hover:bg-stone-50 text-stone-800 border-emerald-300 hover:border-emerald-500'
          }`}
          title="إدارة تسجيل الدخول وحساب Firebase السحابي وصلاحيات المشرف"
        >
          {isAdminUser ? (
            <div className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-2xs">
              <Crown className="w-3.5 h-3.5" />
            </div>
          ) : firebaseUser?.photoURL ? (
            <img
              src={firebaseUser.photoURL}
              alt={activeName}
              className="w-5 h-5 rounded-full border border-emerald-300 object-cover"
            />
          ) : (
            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-2xs ${
              isCloudConnected ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900'
            }`}>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
          )}

          <div className="flex flex-col text-right leading-tight">
            <span className="text-2xs truncate max-w-[130px]">
              {isAdminUser ? 'المشرف (أحمد شتة)' : activeName}
            </span>
            <span className={`text-[10px] flex items-center gap-1 ${
              isAdminUser ? 'text-amber-200' : isCloudConnected ? 'text-emerald-200' : 'text-stone-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAdminUser ? 'bg-amber-300' : isCloudConnected ? 'bg-emerald-400' : 'bg-amber-500'}`}></span>
              {isAdminUser ? 'مشرف المنصة (Firebase)' : isCloudConnected ? 'متصل بـ Firebase' : 'تسجيل بالفايربيس'}
            </span>
          </div>
        </button>
      </div>

      {/* Comprehensive Firebase Auth Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm p-3 sm:p-4 md:p-6"
          dir="rtl"
        >
          <div className="min-h-full flex items-center justify-center py-2 sm:py-4">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="bg-gradient-to-l from-emerald-950 via-stone-900 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-emerald-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white font-arabic-heading flex items-center gap-2">
                      <span>تسجيل الدخول السحابي بـ Firebase</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-3xs font-mono border border-emerald-500/30">
                        Auth & Firestore
                      </span>
                    </h3>
                    <p className="text-2xs text-stone-300">
                      حفظ التسميع السحابي، استخراج الشهادات، ولوحة تحكم المشرف العام
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* Alert Messages */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">حالة الاتصال بقاعدة البيانات:</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>سحابة Firebase مفعلة وجاهزة</span>
                  </div>
                </div>

                <div className="text-xs text-stone-700 flex items-center justify-between">
                  <span>المستخدم الحالي:</span>
                  <span className="font-bold font-mono text-emerald-950">
                    {firebaseUser?.email || (isAdminUser ? PLATFORM_ADMIN_EMAIL : activeName)}
                  </span>
                </div>

                <div className="text-xs text-stone-700 flex items-center justify-between">
                  <span>الرتبة والصلاحية:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md text-3xs ${
                    isAdminUser
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-stone-200 text-stone-800'
                  }`}>
                    {isAdminUser ? '👑 المشرف العام للمنصة (Super Admin)' : 'طالب موثق'}
                  </span>
                </div>
              </div>

              {/* Special Admin Card for ahmed.sheta89@gmail.com */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-amber-950 font-arabic-heading">
                      حساب المشرف العام المعتمد (Super Admin)
                    </h4>
                    <p className="text-3xs text-amber-800 mt-0.5 font-mono">
                      {PLATFORM_ADMIN_EMAIL}
                    </p>
                    <p className="text-3xs text-stone-600 mt-1 leading-relaxed">
                      يمنحك صلاحية الدخول للوحة التحكم، وضبط معايير الذكاء الاصطناعي لمنع الهلوسة، ومتابعة الطلاب والشهادات الصادرة.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleAdminDirectLogin}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Crown className="w-4 h-4 text-amber-200" />
                    <span>تفعيل تسجيل المشرف العام بنقرة واحدة</span>
                  </button>

                  {isAdminUser && onOpenAdminDashboard && (
                    <button
                      onClick={() => {
                        setShowModal(false);
                        onOpenAdminDashboard();
                      }}
                      className="py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-emerald-400" />
                      <span>فتح لوحة التحكم</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Options Tabs */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAuthMode('GOOGLE')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'GOOGLE'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  حساب Google
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('EMAIL_LOGIN')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'EMAIL_LOGIN'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  دخول بالبريد
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('EMAIL_REGISTER')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'EMAIL_REGISTER'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  إنشاء حساب
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('NAME_EDIT')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    authMode === 'NAME_EDIT'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  اسم الشهادات
                </button>
              </div>

              {/* View 1: Google One-Click Auth */}
              {authMode === 'GOOGLE' && (
                <div className="space-y-3">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-200 hover:border-emerald-600 text-xs font-bold transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>تسجيل الدخول السريع بحساب Google الرسمي</span>
                  </button>

                  <p className="text-3xs text-stone-500 text-center leading-relaxed">
                    يتم المزامنة تلقائياً مع Firebase Firestore دون الحاجة لتذكر كلمات مرور إضافية.
                  </p>
                </div>
              )}

              {/* View 2: Email Sign In or Register */}
              {(authMode === 'EMAIL_LOGIN' || authMode === 'EMAIL_REGISTER') && (
                <form onSubmit={handleEmailAuth} className="space-y-3">
                  {authMode === 'EMAIL_REGISTER' && (
                    <div>
                      <label className="block text-2xs font-bold text-stone-700 mb-1">اسم الطالب:</label>
                      <input
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="مثال: أحمد عبد الله"
                        required
                        className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-2xs font-bold text-stone-700 mb-1">البريد الإلكتروني:</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full px-3 py-2 pr-9 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                      />
                      <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-stone-700 mb-1">كلمة المرور:</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3 py-2 pr-9 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                      />
                      <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {authMode === 'EMAIL_LOGIN' ? 'تسجيل الدخول بالبريد' : 'إنشاء حساب جديد'}
                  </button>
                </form>
              )}

              {/* View 3: Name Edit in Certificates */}
              {authMode === 'NAME_EDIT' && (
                <form onSubmit={handleSaveStudentName} className="space-y-3">
                  <div>
                    <label className="block text-2xs font-bold text-stone-700 mb-1">
                      الاسم المعتمد في شهادات الإتقان والتقارير:
                    </label>
                    <input
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="مثال: أحمد شتة"
                      required
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    حفظ وتحديث الاسم في السحابة
                  </button>
                </form>
              )}

              {/* Sign Out Option */}
              {isCloudConnected && (
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-3xs text-stone-500">لإنهاء الجلسة وإعادة تعيين الحساب:</span>
                  <button
                    onClick={handleSignOut}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 text-2xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج السحابي</span>
                  </button>
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
