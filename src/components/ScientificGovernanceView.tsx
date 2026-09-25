import React, { useState } from 'react';
import { UserRole, AdminPermission, ROLE_PERMISSIONS, AuditLogEntry } from '../domain/admin/types.ts';
import { ShieldCheck, UserCheck, KeyRound, FileCheck, History } from 'lucide-react';

const SAMPLE_AUDIT_TRAIL: AuditLogEntry[] = [
  {
    id: 'audit-001',
    actorUserId: 'scholar-al-azhar-01',
    actorRole: UserRole.SCIENTIFIC_REVIEWER,
    action: 'VERIFY_QURAN_SURAH_PAYLOAD',
    targetEntity: 'Surah',
    targetEntityId: 'surah:1',
    timestamp: '2025-01-01T10:00:00Z',
    ipAddressMasked: '196.221.***.***',
    diffSummary: 'اعتماد نص سورة الفاتحة برواية حفص عن عاصم من طريق الشاطبية، طبعة مجمع الملك فهد.',
  },
  {
    id: 'audit-002',
    actorUserId: 'sysadmin-01',
    actorRole: UserRole.SYSTEM_ADMIN,
    action: 'ROTATE_STORAGE_SECURITY_KEYS',
    targetEntity: 'Infrastructure',
    targetEntityId: 'vault:prod-storage',
    timestamp: '2025-01-02T14:30:00Z',
    ipAddressMasked: '10.0.***.***',
    diffSummary: 'تجديد مفاتيح التخزين السحابي الدورية وتطبيق قيود التشفير في وضع السكون.',
  },
  {
    id: 'audit-003',
    actorUserId: 'curriculum-lead',
    actorRole: UserRole.CONTENT_ADMIN,
    action: 'UPDATE_LESSON_PEDAGOGY',
    targetEntity: 'Lesson',
    targetEntityId: 'lesson:makhraj-al-halq',
    timestamp: '2025-01-03T09:15:00Z',
    ipAddressMasked: '197.38.***.***',
    diffSummary: 'إضافة رسم توضيحي لمخرج الحلق وتحديث تمرين التدريب على حرفي الحاء والعين.',
  },
];

export const ScientificGovernanceView: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SCIENTIFIC_REVIEWER);

  const permissions = ROLE_PERMISSIONS[selectedRole];

  return (
    <div className="space-y-8">
      {/* Governance & RBAC */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-semibold mb-2 border border-purple-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              حوكمة البيانات والصلاحيات (Segregation of Duties)
            </div>
            <h2 className="text-xl font-bold text-stone-900 font-arabic-heading">
              الفصل الصارم بين الإدارة التقنية والاعتماد العلمي الشرعي
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              لا يمتلك مدير النظام صلاحية تعديل أو اعتماد آية قرآنية، ولا يمتلك مدخل المحتوى صلاحية تجاوز المراجع العلمي المجاز.
            </p>
          </div>
        </div>

        {/* Roles Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            {
              role: UserRole.SCIENTIFIC_REVIEWER,
              title: 'المراجع العلمي الشرعي',
              sub: 'Scientific Reviewer',
              desc: 'صلاحية حصرية لاعتماد وتوثيق بيانات القرآن وأحكام التجويد',
            },
            {
              role: UserRole.SYSTEM_ADMIN,
              title: 'مدير النظام التقني',
              sub: 'System Admin',
              desc: 'إدارة البنية التحتية، ونشر الخوادم، وسجلات التدقيق',
            },
            {
              role: UserRole.CONTENT_ADMIN,
              title: 'مدير المحتوى والمناهج',
              sub: 'Content Admin',
              desc: 'إعداد الدروس التربوية والتمارين العامة',
            },
            {
              role: UserRole.STUDENT,
              title: 'المتعلّم / الطالب',
              sub: 'Student',
              desc: 'الوصول لبيانات التلاوة الخاصة وسجل الورد اليومي فقط',
            },
          ].map((item) => (
            <button
              key={item.role}
              onClick={() => setSelectedRole(item.role)}
              className={`p-4 rounded-xl text-right border transition ${
                selectedRole === item.role
                  ? 'bg-stone-900 text-white border-stone-950 shadow-xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200/80'
              }`}
            >
              <div className="font-bold text-xs">{item.title}</div>
              <div className={`text-[10px] font-mono mt-0.5 ${selectedRole === item.role ? 'text-stone-300' : 'text-stone-400'}`}>
                {item.sub}
              </div>
              <p className={`text-[11px] mt-2 leading-relaxed ${selectedRole === item.role ? 'text-stone-300' : 'text-stone-500'}`}>
                {item.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Permissions Breakdown */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-emerald-800" />
            الصلاحيات الممنوحة للدور المختار ({selectedRole}):
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.length > 0 ? (
              permissions.map((perm) => (
                <span
                  key={perm}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-medium ${
                    perm === AdminPermission.VERIFY_QURAN_DATA
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                      : 'bg-white text-stone-800 border-stone-200'
                  }`}
                >
                  {perm}
                  {perm === AdminPermission.VERIFY_QURAN_DATA && ' (صلاحية حصرية)'}
                </span>
              ))
            ) : (
              <span className="text-xs text-stone-500 italic p-1">
                لا توجد صلاحيات إدارية (وصول مقيد لبيانات الطالب الشخصية فقط).
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Immutable Audit Trail */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 font-arabic-heading flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-800" />
              سجل التدقيق المحصن (Audit Log Trail)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              توثيق غير قابل للتعديل لكل عملية اعتماد أو تعديل في المنظومة.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-stone-100 text-stone-600 border border-stone-200">
            Append-Only Log
          </span>
        </div>

        <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
          {SAMPLE_AUDIT_TRAIL.map((log) => (
            <div key={log.id} className="p-4 bg-white hover:bg-stone-50/70 transition space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span>
                  {log.id} &bull; {log.timestamp}
                </span>
                <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700">{log.action}</span>
              </div>
              <div className="text-stone-900 font-semibold">{log.diffSummary}</div>
              <div className="flex items-center gap-4 text-[11px] text-stone-500">
                <span>المستخدم: {log.actorUserId}</span>
                <span>الدور: {log.actorRole}</span>
                <span>العنصر المستهدف: {log.targetEntityId}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
