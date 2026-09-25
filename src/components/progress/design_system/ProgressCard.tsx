/**
 * @file ProgressCard.tsx
 * @module components/progress/design_system
 * @description Master card container adhering to the Zero-Pill & Arabic RTL visual constitution.
 */

import React from 'react';

interface ProgressCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  headerBorder?: boolean;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  headerBorder = true,
}) => {
  return (
    <section
      className={`bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-shadow hover:shadow-sm ${className}`}
      dir="rtl"
    >
      {(title || action) && (
        <div
          className={`px-5 py-4 flex items-center justify-between gap-4 ${
            headerBorder ? 'border-b border-stone-100' : ''
          }`}
        >
          <div>
            {title && (
              <h3 className="text-base font-bold text-stone-900 font-arabic-heading tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
};
