import React, { useState, useEffect } from 'react';
import { ShieldCheck, BookOpen, Globe, Share2, ExternalLink, Settings, Crown } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge.tsx';
import { InstallPwaButton } from './InstallPwaButton.tsx';
import { FirebaseAuthButton } from './FirebaseAuthButton.tsx';
import { PublicShareModal } from './classroom/PublicShareModal.tsx';
import { isUserAdmin, auth, PLATFORM_ADMIN_EMAIL } from '../infrastructure/firebase/firebaseClient.ts';
import { onAuthStateChanged } from 'firebase/auth';

interface HeaderProps {
  onNavigateToAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToAdmin }) => {
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return isUserAdmin(auth.currentUser);
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(isUserAdmin(user));
    });
    return () => unsub();
  }, []);

  return (
    <>
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900 text-emerald-100 flex items-center justify-center font-serif text-xl shadow-xs overflow-hidden">
                <img src="/favicon.svg" alt="شعار القرآن" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-stone-900 font-arabic-heading tracking-tight">
                    Quran Teacher AI <span className="text-stone-400 font-normal">|</span> معلّم القرآن الرقمي
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    الإصدار الذكي الموحّد
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  تسميع مباشر بالمايكروفون + تصحيح فوري بالتجويد + حفظ أوفلاين وسحابي (Firebase)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              <FirebaseAuthButton onOpenAdminDashboard={onNavigateToAdmin} />

              {isAdmin && onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-amber-500"
                  title="الدخول المباشر للوحة تحكم المشرف العام (ahmed.sheta89@gmail.com)"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-200" />
                  <span>لوحة الإدارة</span>
                </button>
              )}

              <button
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                title="عرض ونسخ رابط GitHub Pages المباشر للمنصة"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-300" />
                <span>رابط GitHub Pages العام</span>
              </button>
              <InstallPwaButton />
              <SyncStatusBadge />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100/80 rounded-lg text-xs text-stone-700 border border-stone-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>رواية حفص عن عاصم</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {showShareModal && <PublicShareModal onClose={() => setShowShareModal(false)} />}
    </>
  );
};
