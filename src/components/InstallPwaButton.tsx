import React, { useState, useEffect } from 'react';
import { Download, Check, Smartphone, Monitor, Apple, X, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Global reference so prompt isn't lost during re-renders
declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export const InstallPwaButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== 'undefined' ? window.__deferredPwaPrompt || null : null)
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Detect if already installed or running as PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const pEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = pEvent;
      setDeferredPrompt(pEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
      window.__deferredPwaPrompt = null;
      setTimeout(() => setShowModal(false), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__deferredPwaPrompt;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setInstallSuccess(true);
        }
        setDeferredPrompt(null);
        window.__deferredPwaPrompt = null;
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowModal(true);
      }
    } else {
      // Show interactive guided install modal
      setShowModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300 shadow-2xs">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>التطبيق مثبّت ومفعّل</span>
      </div>
    );
  }

  // Device type detection
  const isIos = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="تثبيت منصة معلّم القرآن مباشرة كتطبيق مستقل على هاتفك أو حاسوبك"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer border border-amber-400/50"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-100" />
        <span>تثبيت التطبيق 📱</span>
      </button>

      {/* Interactive Installation Guide Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center"
          dir="rtl"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-emerald-950 via-stone-900 to-emerald-900 text-white p-5 flex items-center justify-between border-b border-emerald-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-arabic-heading">
                    تثبيت معلّم القرآن على جهازك
                  </h3>
                  <p className="text-2xs text-stone-300">يعمل بدون إنترنت وشاشته كاملة كتطبيق مستقل</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {installSuccess ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-950">تم التثبيت بنجاح!</h4>
                  <p className="text-xs text-emerald-800">
                    يمكنك الآن فتح التطبيق من شاشة هاتفك أو سطح المكتب مباشرة.
                  </p>
                </div>
              ) : (
                <>
                  {deferredPrompt && (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                      <p className="text-xs text-amber-950 font-bold">المتصفح جاهز للتثبيت التلقائي المباشر:</p>
                      <button
                        onClick={handleInstallClick}
                        className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-300" />
                        <span>اضغط هنا للتثبيت الفوري المباشر</span>
                      </button>
                    </div>
                  )}

                  {/* Device Specific Guidelines */}
                  <div className="space-y-3">
                    {/* Desktop Instructions */}
                    <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs text-stone-900">
                        <Monitor className="w-4 h-4 text-emerald-700" />
                        <span>من أجهزة الحاسوب (Chrome / Edge):</span>
                      </div>
                      <p className="text-2xs text-stone-600 leading-relaxed">
                        اضغط على أيقونة التثبيت <strong>(🖥️ أو ⬇️)</strong> في أقصى يمين شريط العنوان بأعلى المتصفح، أو اضغط على قائمة الخيارات <strong>(⋮)</strong> واختر <strong>"تثبيت معلّم القرآن / Install"</strong>.
                      </p>
                    </div>

                    {/* Android Instructions */}
                    {isAndroid && (
                      <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-stone-900">
                          <Smartphone className="w-4 h-4 text-emerald-700" />
                          <span>هواتف أندرويد (Android):</span>
                        </div>
                        <p className="text-2xs text-stone-600 leading-relaxed">
                          اضغط على قائمة خيارات المتصفح <strong>(⋮)</strong> بأعلى الشاشة، ثم اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong>.
                        </p>
                      </div>
                    )}

                    {/* iOS Instructions */}
                    {isIos && (
                      <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-stone-900">
                          <Apple className="w-4 h-4 text-stone-900" />
                          <span>هواتف آيفون وآيباد (iPhone / Safari):</span>
                        </div>
                        <p className="text-2xs text-stone-600 leading-relaxed">
                          1. اضغط على زر المشاركة <strong>(Share / ⎋)</strong> في أسفل شاشة Safari.<br />
                          2. مرر للأسفل واضغط على <strong>"إضافة إلى الشاشة الرئيسية (Add to Home Screen)"</strong>.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-3xs text-emerald-900 leading-relaxed">
                    <strong>مميزات التثبيت:</strong> يعمل التطبيق بدون شريط المتصفح، ويحفظ المصحف والتسجيلات أوفلاين، ويفتح بضغطة واحدة من الشاشة الرئيسية.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
