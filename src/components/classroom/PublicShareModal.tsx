import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, X, Globe, Smartphone, QrCode } from 'lucide-react';

interface PublicShareModalProps {
  onClose: () => void;
}

export const PublicShareModal: React.FC<PublicShareModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const publicUrl = 'https://ais-pre-qdqetqvxmjhthpqbhl3o4o-100774856489.europe-west1.run.app';

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله، أدعوكم لتجربة منصة معلّم القرآن الرقمي الذكية (تسميع مباشر وتصحيح فوري لأحكام التجويد ومخارج الحروف مع تقارير دقيقة لقوة الحفظ):\n${publicUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-stone-900 my-auto">
        <div className="bg-gradient-to-l from-emerald-950 to-stone-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-arabic-heading">
                رابط المنصة العام للمشاركة والتجربة
              </h3>
              <p className="text-xs text-stone-300">متاح لجميع الطلاب والمعلمين للتجربة المباشرة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            يمكنك مشاركة هذا الرابط العام مع الطلاب، المعلمين، والمشرفين للدخول إلى المنصة وتجربة التسميع الذكي، واختبار الحفظ الغيبي، وإصدار التقارير الموثقة:
          </p>

          <div className="p-3 bg-stone-100 rounded-2xl border border-stone-300 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-stone-700 select-all truncate">
              {publicUrl}
            </span>
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة عبر واتساب</span>
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-stone-300"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح الرابط في نافذة جديدة</span>
            </a>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>يعمل على الهاتف والحاسوب:</strong> يدعم التطبيق التثبيت السريع كـ PWA، ويعمل مباشرة عبر المتصفح باستخدام معالجة الميكروفون المباشرة بدون أي إضافات خارجية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
