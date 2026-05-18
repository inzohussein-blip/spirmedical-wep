'use client';

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
  { href: '/admin44', icon: '📊', label: 'لوحة التحكم' },
  { href: '/admin44/specialists/pending', icon: '⏳', label: 'موافقات الاختصاصيين', permission: 'specialists.approve' },
  { href: '/admin44/specialists', icon: '👨‍⚕️', label: 'الاختصاصيون', permission: 'specialists.view' },
  { href: '/admin44/patients', icon: '👤', label: 'المرضى (CRM)', permission: 'patients.view' },
  { href: '/admin44/orders', icon: '📋', label: 'الطلبات', permission: 'orders.view' },
  { href: '/admin44/notifications', icon: '💬', label: 'الإشعارات' },
  { href: '/admin44/stories', icon: '📸', label: 'القصص الترويجية' },
  { href: '/admin44/reports', icon: '📈', label: 'التقارير', permission: 'reports.view' },
  { href: '/admin44/campaigns', icon: '📧', label: 'الحملات', permission: 'campaigns.manage' },
  { href: '/admin44/coupons', icon: '🎁', label: 'الكوبونات', permission: 'coupons.manage' },
  { href: '/admin44/audit-log', icon: '📜', label: 'سجل العمليات' },
  { href: '/admin44/admins', icon: '👥', label: 'إدارة المديرين', permission: 'admins.manage' },
  { href: '/admin44/settings', icon: '⚙️', label: 'الإعدادات', permission: 'settings.edit' },
  { href: '/admin44/settings/theme', icon: '🎨', label: 'تخصيص الألوان', permission: 'settings.edit' },
];

interface Props {
  userName: string;
  userRole: string;
  roleLabel: string;
  roleIcon: string;
}

export default function AdminSidebar({ userName, userRole, roleLabel, roleIcon }: Props) {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 260,
      background: 'var(--emerald-deep, #073B30)',
      color: 'var(--white)',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
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

        const isActive = pathname === item.href || (item.href !== '/admin44' && pathname?.startsWith(item.href));

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
                fontSize: 10,
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
        fontSize: 10,
        opacity: 0.6,
        textAlign: 'center',
      }}>
        Spir Medical Admin v2
      </div>
    </aside>
  );
}
