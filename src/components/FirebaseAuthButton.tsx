import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  registerOrUpdateStudentProfile,
  signInWithGoogle,
  signOutCurrentUser,
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
} from 'lucide-react';

export const FirebaseAuthButton: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [localStudentName, setLocalStudentName] = useState<string>(() => {
    return localStorage.getItem('quran_teacher_student_name') || 'أحمد شتة';
  });
  const [showModal, setShowModal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Ensure default student name is registered
  useEffect(() => {
    if (!localStorage.getItem('quran_teacher_student_name')) {
      registerOrUpdateStudentProfile('أحمد شتة').catch(() => {});
    }
  }, []);

  const handleSaveLocalName = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim();
    if (clean) {
      await registerOrUpdateStudentProfile(clean);
      setLocalStudentName(clean);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setShowModal(false);
      }, 1000);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutCurrentUser();
      localStorage.removeItem('quran_teacher_student_name');
      setLocalStudentName('طالب القرآن الكريم');
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

  const activeName = firebaseUser?.displayName || localStudentName || 'أحمد شتة';
  const isCloudActive = !!firebaseUser;

  return (
    <>
      <div className="flex items-center gap-2 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200/90 px-3 py-1.5 rounded-xl text-xs shadow-2xs transition-all">
        {firebaseUser?.photoURL ? (
          <img
            src={firebaseUser.photoURL}
            alt={activeName}
            className="w-6 h-6 rounded-full border border-emerald-400"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-2xs shadow-2xs">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <div
          onClick={() => {
            setNameInput(activeName);
            setShowModal(true);
          }}
          className="flex flex-col text-right cursor-pointer"
          title="اضغط لتعديل اسم الطالب في الشهادات والتقارير"
        >
          <div className="flex items-center gap-1">
            <span className="font-bold text-emerald-950 text-2xs truncate max-w-[120px]">
              {activeName}
            </span>
            <Edit2 className="w-2.5 h-2.5 text-stone-400 hover:text-emerald-700" />
          </div>
          <span className="text-3xs text-emerald-700 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isCloudActive ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
            {isCloudActive ? 'سحابة Firebase' : 'طالب موثق (حفظ فوري)'}
          </span>
        </div>
      </div>

      {/* Identity Edit Modal */}
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
                    بيانات وهوية الطالب
                  </h3>
                  <p className="text-2xs text-stone-300">الاسم المعتمد في شهادات الإتقان وتقارير التسميع</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <form onSubmit={handleSaveLocalName} className="space-y-3">
                <div>
                  <label htmlFor="modalStudentNameInput" className="block font-bold text-xs text-stone-800 mb-1.5">
                    الاسم الكامل للطالب:
                  </label>
                  <input
                    id="modalStudentNameInput"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="مثال: أحمد شتة"
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                    autoFocus
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-3xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-emerald-950">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>جاهز للاستخدام المباشر فوراً</span>
                  </div>
                  <p className="leading-relaxed">
                    جميع جلسات التسميع والدرجات وشهادات الإتقان تسجل بهذا الاسم وتُحفظ محلياً وسحابياً دون الحاجة لأي إعدادات إضافية.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>تم الحفظ بنجاح!</span>
                      </>
                    ) : (
                      <span>حفظ وتثبيت الاسم</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
