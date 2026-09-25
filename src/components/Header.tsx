import React, { useState } from 'react';
import { ShieldCheck, BookOpen, Globe, Share2 } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge.tsx';
import { InstallPwaButton } from './InstallPwaButton.tsx';
import { FirebaseAuthButton } from './FirebaseAuthButton.tsx';
import { PublicShareModal } from './classroom/PublicShareModal.tsx';

export const Header: React.FC = () => {
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  return (
    <>
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900 text-emerald-100 flex items-center justify-center font-serif text-xl shadow-xs">
                <BookOpen className="w-5 h-5 text-emerald-200" />
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
              <FirebaseAuthButton />
              <button
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="عرض ونسخ الرابط العام للمنصة"
              >
                <Globe className="w-3.5 h-3.5 text-amber-700" />
                <span>رابط المنصة العام</span>
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



