'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission, type Permission } from '@/lib/admin-types';
import { Icon } from '@/components/admin-ui';
import EmojiIcon from '@/components/ui/EmojiIcon';
import {
  IconMenu2 as Menu, IconX as X,
} from '@tabler/icons-react';
import type { IconName } from '@/lib/icons';

interface NavItem {
  href: string;
  icon: IconName;
  label: string;
  permission?: Permission;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', icon: 'dashboard', label: 'لوحة التحكم' },
  { href: '/admin/users/create', icon: 'createUser', label: 'إنشاء حساب جديد', permission: 'admins.manage' },
  { href: '/admin/seed-data', icon: 'seedData', label: 'البيانات الأولية', permission: 'admins.manage' },
  { href: '/admin/emergencies', icon: 'emergency', label: 'الطوارئ الأمنية', permission: 'orders.view' },
  { href: '/admin/specialists/pending', icon: 'pending', label: 'موافقات الاختصاصيين', permission: 'specialists.approve' },
  { href: '/admin/specialists', icon: 'specialists', label: 'الاختصاصيون', permission: 'specialists.view' },
  { href: '/admin/doctors', icon: 'doctors', label: 'أطباء العائلة', permission: 'specialists.view' },
  { href: '/admin/hospitals', icon: 'hospitals', label: 'المستشفيات', permission: 'specialists.view' },
  { href: '/admin/pharmacies', icon: 'pharmacies', label: 'الصيدليات', permission: 'specialists.view' },
  { href: '/admin/medications', icon: 'medications', label: 'كتالوج الأدوية', permission: 'specialists.view' },
  // ─── V25.21: الخدمات الجديدة ───
  // كانت أربعاً من تسع، والخمس الباقية صفحاتٌ مبنيّة تعمل لكن لا رابط
  // إليها في أيّ مكان — لا يبلغها المشرف إلّا بكتابة المسار يدوياً.
  { href: '/admin/dental', icon: 'dental', label: 'عيادات الأسنان', permission: 'specialists.view' },
  { href: '/admin/optical', icon: 'optical', label: 'متاجر النظارات', permission: 'specialists.view' },
  { href: '/admin/mental-health', icon: 'mentalHealth', label: 'الصحة النفسية', permission: 'specialists.view' },
  { href: '/admin/nutrition', icon: 'nutrition', label: 'التغذية', permission: 'specialists.view' },
  { href: '/admin/nurses', icon: 'nurses', label: 'الممرضون', permission: 'specialists.view' },
  { href: '/admin/physio', icon: 'physio', label: 'العلاج الطبيعي', permission: 'specialists.view' },
  { href: '/admin/labs', icon: 'labs', label: 'المختبرات', permission: 'specialists.view' },
  { href: '/admin/cosmetic', icon: 'cosmetic', label: 'منتجات التجميل', permission: 'specialists.view' },
  { href: '/admin/locations', icon: 'locations', label: 'المواقع', permission: 'specialists.view' },
  { href: '/admin/service-areas', icon: 'serviceAreas', label: 'مناطق الخدمة', permission: 'settings.edit' },
  { href: '/admin/services', icon: 'services', label: 'تشغيل الخدمات', permission: 'settings.edit' },
  { href: '/admin/patients', icon: 'patients', label: 'المرضى (CRM)', permission: 'patients.view' },
  { href: '/admin/orders', icon: 'orders', label: 'الطلبات', permission: 'orders.view' },
  { href: '/admin/notifications', icon: 'notifications', label: 'الإشعارات' },
  { href: '/admin/whatsapp', icon: 'whatsapp', label: 'التحقّق عبر واتساب' },
  { href: '/admin/stories', icon: 'stories', label: 'القصص الترويجية' },
  { href: '/admin/reports', icon: 'reports', label: 'التقارير', permission: 'reports.view' },
  { href: '/admin/campaigns', icon: 'campaigns', label: 'الحملات', permission: 'campaigns.manage' },
  { href: '/admin/analytics', icon: 'analytics', label: 'Analytics' },
  { href: '/admin/coupons', icon: 'coupons', label: 'الكوبونات', permission: 'coupons.manage' },
  // ─── V25.14: Beta Launch ───
  { href: '/admin/launch-checklist', icon: 'launch', label: 'قائمة الإطلاق' },
  { href: '/admin/beta-codes', icon: 'betaCodes', label: 'رموز Beta' },
  { href: '/admin/feedback', icon: 'feedback', label: 'الملاحظات' },
  { href: '/admin/bugs', icon: 'bugs', label: 'الأعطال' },
  // ─── النظام ───
  { href: '/admin/audit-log', icon: 'auditLog', label: 'سجل العمليات' },
  { href: '/admin/admins', icon: 'admins', label: 'إدارة المديرين', permission: 'admins.manage' },
  { href: '/admin/settings', icon: 'settings', label: 'الإعدادات', permission: 'settings.edit' },
  { href: '/admin/settings/theme', icon: 'theme', label: 'تخصيص الألوان', permission: 'settings.edit' },
];

interface Props {
  userName: string;
  userRole: string;
  roleLabel: string;
  roleIcon: string;
}

export default function AdminSidebar({ userName, userRole, roleLabel, roleIcon }: Props) {
  const pathname = usePathname();
  // الدُّرجُ مفتوحٌ «على صفحة»: الانتقالُ إلى أخرى يُغلقه بلا أثرٍ يضبط الحالة (كان setState في useEffect —
  // تحذيرُ React Compiler، ورسمةٌ زائدة بالدُّرج مفتوحاً على الصفحة الجديدة قبل أن يُغلق).
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean | ((v: boolean) => boolean)) =>
    setOpenOn((typeof next === 'function' ? next(open) : next) ? pathname : null);

  return (
    <>
      {/* زرّ القائمة — لا يظهر إلا على الشاشات الصغيرة (CSS) */}
      <button
        type="button"
        className="admin-menu-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
        aria-expanded={open}
      >
        {open ? <X size={20} strokeWidth={2} aria-hidden /> : <Menu size={20} strokeWidth={2} aria-hidden />}
      </button>

      {/* طبقة معتِمة تُغلق الدُّرج باللمس خارجه */}
      {open && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

    <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
      {/* Logo */}
      <div style={{
        padding: '8px 12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 2 }}>
          Spir Admin
        </div>
        <div style={{ fontSize: 11, opacity: 0.75 }}>
          <EmojiIcon e={roleIcon} /> {roleLabel}
        </div>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
        if (item.permission && !hasPermission(userRole, item.permission)) {
          return null;
        }

        const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              color: isActive ? 'var(--emerald-deep, var(--emerald-deep, #056559))' : 'var(--white)',
              background: isActive ? 'var(--white)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <span className="admin-nav-icon"><Icon name={item.icon} size={18} /></span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{
                background: 'var(--amber)',
                color: 'var(--white)',
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 100,
                fontWeight: 800,
              }}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      {/* Footer */}
      <div style={{
        marginTop: 'auto',
        paddingTop: 16,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: 11,
        opacity: 0.6,
        textAlign: 'center',
      }}>
        Spir Medical Admin v2
      </div>
    </aside>
    </>
  );
}
