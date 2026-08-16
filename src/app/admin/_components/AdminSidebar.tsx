'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission, type Permission } from '@/lib/admin-types';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  permission?: Permission;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', icon: '📊', label: 'لوحة التحكم' },
  { href: '/admin/users/create', icon: '➕', label: 'إنشاء حساب جديد', permission: 'admins.manage' },
  { href: '/admin/seed-data', icon: '📦', label: 'البيانات الأولية', permission: 'admins.manage' },
  { href: '/admin/emergencies', icon: '🚨', label: 'الطوارئ الأمنية', permission: 'orders.view' },
  { href: '/admin/specialists/pending', icon: '⏳', label: 'موافقات الاختصاصيين', permission: 'specialists.approve' },
  { href: '/admin/specialists', icon: '👨‍⚕️', label: 'الاختصاصيون', permission: 'specialists.view' },
  { href: '/admin/doctors', icon: '🩺', label: 'أطباء العائلة', permission: 'specialists.view' },
  { href: '/admin/hospitals', icon: '🏥', label: 'المستشفيات', permission: 'specialists.view' },
  { href: '/admin/pharmacies', icon: '💊', label: 'الصيدليات', permission: 'specialists.view' },
  { href: '/admin/medications', icon: '📋', label: 'كتالوج الأدوية', permission: 'specialists.view' },
  // ─── V25.21: الخدمات الجديدة ───
  // كانت أربعاً من تسع، والخمس الباقية صفحاتٌ مبنيّة تعمل لكن لا رابط
  // إليها في أيّ مكان — لا يبلغها المشرف إلّا بكتابة المسار يدوياً.
  { href: '/admin/dental', icon: '🦷', label: 'عيادات الأسنان', permission: 'specialists.view' },
  { href: '/admin/optical', icon: '👓', label: 'متاجر النظارات', permission: 'specialists.view' },
  { href: '/admin/mental-health', icon: '🧠', label: 'الصحة النفسية', permission: 'specialists.view' },
  { href: '/admin/nutrition', icon: '🥗', label: 'التغذية', permission: 'specialists.view' },
  { href: '/admin/nurses', icon: '👩‍⚕️', label: 'الممرضون', permission: 'specialists.view' },
  { href: '/admin/physio', icon: '🦵', label: 'العلاج الطبيعي', permission: 'specialists.view' },
  { href: '/admin/labs', icon: '🔬', label: 'المختبرات', permission: 'specialists.view' },
  { href: '/admin/cosmetic', icon: '💄', label: 'منتجات التجميل', permission: 'specialists.view' },
  { href: '/admin/locations', icon: '📍', label: 'المواقع', permission: 'specialists.view' },
  { href: '/admin/patients', icon: '👤', label: 'المرضى (CRM)', permission: 'patients.view' },
  { href: '/admin/orders', icon: '📋', label: 'الطلبات', permission: 'orders.view' },
  { href: '/admin/notifications', icon: '💬', label: 'الإشعارات' },
  { href: '/admin/stories', icon: '📸', label: 'القصص الترويجية' },
  { href: '/admin/reports', icon: '📈', label: 'التقارير', permission: 'reports.view' },
  { href: '/admin/campaigns', icon: '📧', label: 'الحملات', permission: 'campaigns.manage' },
  { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { href: '/admin/coupons', icon: '🎁', label: 'الكوبونات', permission: 'coupons.manage' },
  // ─── V25.14: Beta Launch ───
  { href: '/admin/launch-checklist', icon: '🚀', label: 'قائمة الإطلاق' },
  { href: '/admin/beta-codes', icon: '🎟️', label: 'رموز Beta' },
  { href: '/admin/feedback', icon: '💬', label: 'الملاحظات' },
  { href: '/admin/bugs', icon: '🐛', label: 'الأعطال' },
  // ─── النظام ───
  { href: '/admin/audit-log', icon: '📜', label: 'سجل العمليات' },
  { href: '/admin/admins', icon: '👥', label: 'إدارة المديرين', permission: 'admins.manage' },
  { href: '/admin/settings', icon: '⚙️', label: 'الإعدادات', permission: 'settings.edit' },
  { href: '/admin/settings/theme', icon: '🎨', label: 'تخصيص الألوان', permission: 'settings.edit' },
];

interface Props {
  userName: string;
  userRole: string;
  roleLabel: string;
  roleIcon: string;
}

export default function AdminSidebar({ userName, userRole, roleLabel, roleIcon }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // يُغلق الدُّرج عند الانتقال إلى صفحة أخرى
  useEffect(() => { setOpen(false); }, [pathname]);

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
        {open ? '✕' : '☰'}
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
          🏥 Spir Admin
        </div>
        <div style={{ fontSize: 11, opacity: 0.75 }}>
          {roleIcon} {roleLabel}
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
              color: isActive ? 'var(--emerald-deep, #073B30)' : 'var(--white)',
              background: isActive ? 'var(--white)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
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
