import React, { useState } from 'react';
import {
  X,
  Flame,
  Crown,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  LogOut,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  signInWithEmail,
  signUpWithEmail,
  PLATFORM_ADMIN_EMAIL,
} from '../../infrastructure/firebase/firebaseClient.ts';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdmin?: () => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({
  isOpen,
  onClose,
  onNavigateToAdmin,
}) => {
  const { user, isAdmin, studentName, loginWithGoogle, logout, updateStudentName } = useAuth();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'ADMIN' | 'PROFILE'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        setSuccessMsg(`مرحباً بك: ${loggedUser.displayName || loggedUser.email}`);
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMsg('حدث خطأ أثناء الاتصال بسحابة Firebase.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      if (tab === 'LOGIN') {
        const u = await signInWithEmail(email, password);
        setSuccessMsg(`تم تسجيل الدخول: ${u.email}`);
      } else {
        const u = await signUpWithEmail(email, password, nameInput || 'طالب جديد');
        setSuccessMsg(`تم إنشاء حساب جديد بنجاح: ${u.email}`);
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (msg.includes('email-already-in-use')) {
        setErrorMsg('هذا البريد مسجل مسبقاً، يرجى اختيار تسجيل الدخول.');
      } else if (msg.includes('weak-password')) {
        setErrorMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      } else {
        setErrorMsg('تعذر إتمام العملية السحابية.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    await updateStudentName(nameInput);
    setSuccessMsg('تم حفظ وتحديث الاسم بنجاح!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logout();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-150"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900 flex flex-col max-h-[90vh]">
        {/* Fixed Header */}
        <div className="bg-gradient-to-l from-emerald-950 via-stone-900 to-emerald-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-arabic-heading flex items-center gap-2">
                <span>بوابة الدخول السحابي بـ Firebase</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-3xs font-mono border border-emerald-500/30">
                  Cloud Sync
                </span>
              </h3>
              <p className="text-2xs text-stone-300">
                حفظ جلسات التسميع، متابعة الحفظ، ولوحة الإشراف العام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {/* Alerts */}
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

          {/* Current User Status Banner */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">حالة المستخدم الحالية:</span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-2xs bg-emerald-100 text-emerald-900 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{user ? 'متصل بسحابة Firebase' : 'زائر (غير مسجل)'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">الهوية والبريد:</span>
              <span className="font-bold text-stone-900 font-mono">
                {user ? user.email || user.displayName : 'طالب جديد'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">نوع الصلاحية:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md text-3xs ${
                isAdmin
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : user
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-stone-200 text-stone-700'
              }`}>
                {isAdmin ? '👑 المشرف العام للمنصة (Super Admin)' : user ? 'طالب مسجّل' : 'طالب زائر'}
              </span>
            </div>
          </div>

          {/* Admin Banner if Admin is logged in */}
          {isAdmin && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/15 border border-amber-300 text-amber-950 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>أهلاً بك يا أستاذ أحمد شتة (المشرف العام)</span>
              </div>
              <p className="text-2xs text-stone-600 leading-relaxed">
                حسابك موثق بصلاحيات كاملة لإدارة المنصة، مراقبة جميع الطلاب المسجلين، وضبط صمامات أمان الذكاء الاصطناعي.
              </p>
              {onNavigateToAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToAdmin();
                  }}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-amber-200" />
                  <span>فتح لوحة تحكم المشرف العام الآن</span>
                </button>
              )}
            </div>
          )}

          {/* Mode Switcher Tabs */}
          {!user && (
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTab('LOGIN')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'LOGIN' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => setTab('REGISTER')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'REGISTER' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                حساب جديد
              </button>
              <button
                type="button"
                onClick={() => setTab('ADMIN')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'ADMIN' ? 'bg-amber-100 text-amber-950 font-black shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                بوابة المشرف 👑
              </button>
            </div>
          )}

          {/* Google One-Click Auth */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
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
              <span>تسجيل الدخول السريع بـ Google (للطلاب والمشرف)</span>
            </button>
            <p className="text-3xs text-stone-500 text-center leading-relaxed">
              يدخل كل طالب بحسابه الخاص لتسجيل درجاته وتلاواته، ويدخل المشرف بحسابه لإدارة المنصة.
            </p>
          </div>

          {/* Special Admin Tab */}
          {tab === 'ADMIN' && !user && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950 font-arabic-heading">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>دخول المشرف العام المعتمد:</span>
              </div>
              <p className="text-2xs text-stone-600 leading-relaxed font-mono">
                {PLATFORM_ADMIN_EMAIL}
              </p>
              <p className="text-3xs text-stone-500 leading-relaxed">
                اضغط على زر Google أعلاه وسجل الدخول ببريدك هذا لتحصل تلقائياً وفورياً على صلاحيات المشرف العام الكاملة.
              </p>
            </div>
          )}

          {/* Email and Password Forms */}
          {(tab === 'LOGIN' || tab === 'REGISTER') && !user && (
            <form onSubmit={handleEmailAuth} className="space-y-3 pt-2 border-t border-stone-200">
              <p className="text-2xs font-bold text-stone-600">أو التسجيل عبر البريد الإلكتروني:</p>

              {tab === 'REGISTER' && (
                <div>
                  <label className="block text-2xs font-bold text-stone-700 mb-1">اسم الطالب:</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="مثال: عبد الرحمن محمد"
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 pr-9 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {tab === 'LOGIN' ? 'تسجيل الدخول بالبريد' : 'إنشاء حساب جديد'}
              </button>
            </form>
          )}

          {/* Name in Certificates Editor */}
          {user && (
            <div className="space-y-3 pt-3 border-t border-stone-200">
              <form onSubmit={handleSaveName} className="space-y-2">
                <label className="block text-2xs font-bold text-stone-700">
                  الاسم المعتمد في الشهادات والتقارير:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput || studentName}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-700 outline-none font-bold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    حفظ
                  </button>
                </div>
              </form>

              {/* Sign Out Button */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                <span className="text-3xs text-stone-500">للخروج من الحساب والتبديل لحساب آخر:</span>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-2xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج السحابي</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
