import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User as UserIcon, Crown, LogIn, Flame, ShieldCheck } from 'lucide-react';

interface FirebaseAuthButtonProps {
  onOpenAdminDashboard?: () => void;
}

export const FirebaseAuthButton: React.FC<FirebaseAuthButtonProps> = ({
  onOpenAdminDashboard,
}) => {
  const { user, isAdmin, loading, studentName, openAuthModal } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-xl text-xs text-stone-500 animate-pulse border border-stone-200">
        <span className="w-2 h-2 rounded-full bg-stone-400"></span>
        <span className="text-2xs">التحقق السحابي...</span>
      </div>
    );
  }

  // Case 1: Super Admin (ahmed.sheta89@gmail.com)
  if (isAdmin) {
    return (
      <button
        onClick={openAuthModal}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer active:scale-95 bg-gradient-to-l from-amber-600 via-amber-700 to-amber-800 text-white border-amber-400/60 hover:brightness-110 shadow-amber-900/20"
        title="حساب المشرف العام المعتمد - اضغط لإدارة الجلسة"
      >
        <div className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-2xs shadow-xs">
          <Crown className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col text-right leading-tight">
          <span className="text-2xs font-black truncate max-w-[130px]">
            {user?.displayName || 'أحمد شتة'}
          </span>
          <span className="text-[10px] text-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse"></span>
            <span>المشرف العام (Firebase)</span>
          </span>
        </div>
      </button>
    );
  }

  // Case 2: Authenticated Student (signed in with their own Google or Email)
  if (user) {
    return (
      <button
        onClick={openAuthModal}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer active:scale-95 bg-emerald-900 text-white border-emerald-700 hover:bg-emerald-800 shadow-emerald-950/20"
        title="حساب الطالب الموثق - اضغط لإدارة بياناتك والخروج"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={studentName}
            className="w-5 h-5 rounded-full border border-emerald-300 object-cover"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold text-2xs">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex flex-col text-right leading-tight">
          <span className="text-2xs font-bold truncate max-w-[120px]">
            {studentName}
          </span>
          <span className="text-[10px] text-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>طالب متصل سحابياً</span>
          </span>
        </div>
      </button>
    );
  }

  // Case 3: Guest / Visitor (Not logged in)
  return (
    <button
      onClick={openAuthModal}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer active:scale-95 bg-white hover:bg-emerald-50/80 text-stone-800 border-emerald-300 hover:border-emerald-500 shadow-xs"
      title="اضغط لتسجيل الدخول السحابي وحفظ تلاواتك"
    >
      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-2xs">
        <LogIn className="w-3.5 h-3.5 text-emerald-700" />
      </div>
      <div className="flex flex-col text-right leading-tight">
        <span className="text-2xs font-bold text-emerald-950">
          تسجيل الدخول سحابياً
        </span>
        <span className="text-[10px] text-stone-500 flex items-center gap-1">
          <Flame className="w-2.5 h-2.5 text-amber-500" />
          <span>حفظ التسميع بـ Firebase</span>
        </span>
      </div>
    </button>
  );
};
