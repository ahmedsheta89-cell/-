import React, { useState } from 'react';
import { ShieldCheck, Globe, Crown } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge.tsx';
import { InstallPwaButton } from './InstallPwaButton.tsx';
import { FirebaseAuthButton } from './FirebaseAuthButton.tsx';
import { PublicShareModal } from './classroom/PublicShareModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  onNavigateToAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToAdmin }) => {
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const { isAdmin } = useAuth();

  return (
    <>
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-emerald-100 flex items-center justify-center shadow-xs border border-emerald-700/40 p-1 shrink-0">
                <img src="./favicon.svg" alt="شعار القرآن" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-stone-900 font-arabic-heading tracking-tight">
                    معلّم القرآن الذكي <span className="text-stone-400 font-normal">|</span> Quran Teacher AI
                  </h1>
                  <span className="px-2.5 py-0.5 text-3xs font-black rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    مزامنة Firebase الحية
                  </span>
                </div>
                <p className="text-2xs sm:text-xs text-stone-500 mt-0.5">
                  مقرأة ذكية بالتجويد المباشر + حفظ السحاب + إشراف تربوي رصين
                </p>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              <FirebaseAuthButton onOpenAdminDashboard={onNavigateToAdmin} />

              {isAdmin && onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-amber-500"
                  title="الدخول المباشر للوحة تحكم المشرف العام (ahmed.sheta89@gmail.com)"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-200" />
                  <span>لوحة الإدارة</span>
                </button>
              )}

              <button
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                title="عرض ونسخ رابط GitHub Pages المباشر للمنصة"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-300" />
                <span>رابط المنصة العام</span>
              </button>

              <InstallPwaButton />
              <SyncStatusBadge />

              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-xl text-xs text-stone-700 border border-stone-200/80 font-medium">
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
