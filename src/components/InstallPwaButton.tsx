import React, { useState, useEffect } from 'react';
import { Download, Check, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPwaButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // If iOS Safari or unsupported prompt, show friendly guidance tip
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        setShowIosTip(true);
        setTimeout(() => setShowIosTip(false), 6000);
      } else {
        alert('لتثبيت التطبيق على جهازك: اضغط على خيارات المتصفح (⋮ أو ⎋) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".');
      }
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200/80">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>مثبّت كتطبيق</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleInstallClick}
        title="تثبيت التطبيق على هاتفك أو حاسوبك"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>تثبيت التطبيق 📱</span>
      </button>

      {showIosTip && (
        <div className="absolute left-0 mt-2 w-64 p-3 bg-stone-900 text-white text-xs rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
          <p className="font-semibold text-amber-400 mb-1">طريقة التثبيت على الآيفون:</p>
          <p className="text-stone-300">
            اضغط على زر المشاركة <strong>(Share / ⎋)</strong> في أسفل المتصفح، ثم اختر <strong>"إضافة إلى الشاشة الرئيسية (Add to Home Screen)"</strong>.
          </p>
        </div>
      )}
    </div>
  );
};
