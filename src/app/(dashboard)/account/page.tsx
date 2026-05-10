import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../../(auth)/login/actions';

export const dynamic = 'force-dynamic';

const ACCOUNT_SECTIONS = [
  { id: 'history', icon: '📜', title: 'الطلبات السابقة', desc: 'سجل التحاليل والاستشارات', href: '/appointments?status=completed' },
  { id: 'family', icon: '👨‍👩‍👧', title: 'حسابي وعائلتي', desc: 'إدارة الأقارب والمتابعين', href: '/account/family', locked: true },
  { id: 'subscription', icon: '💎', title: 'العضوية', desc: 'باقات مميزة وطبيب العائلة', href: '/account/subscription', locked: true },
  { id: 'medical-record', icon: '📋', title: 'سجلي الطبي', desc: 'تاريخك الصحي ومؤشراتك', href: '/account/medical-record', locked: true },
  { id: 'settings', icon: '⚙', title: 'الإعدادات', desc: 'تخصيص التطبيق', href: '/account/settings' },
  { id: 'help', icon: '💬', title: 'مساعدة والدعم', desc: 'تواصل معنا', href: '/account/help' },
  { id: 'about', icon: 'ℹ', title: 'حول التطبيق', desc: 'الشروط والخصوصية', href: '/legal/terms' },
];

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone, role')
    .eq('id', user!.id)
    .single();

  const fullName = profile?.full_name || 'مستخدم';
  const initial = fullName.charAt(0);
  const phone = profile?.phone ? `+964 ${profile.phone}` : '';
  const roleLabel = profile?.role === 'specialist' ? 'أخصائي' : 'مراجع';

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">حسابي</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-account-card">
          <div className="scr-avatar" style={{ width: 44, height: 44, fontSize: 16 }} aria-hidden="true">
            {initial}
          </div>
          <div className="scr-account-info">
            <h2>{fullName}</h2>
            <p>{roleLabel}{phone ? ` · ${phone}` : ''}</p>
          </div>
        </div>

        <div className="scr-account-list">
          {ACCOUNT_SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={section.locked ? '#' : section.href}
              className={`scr-account-row ${section.locked ? 'locked' : ''}`}
              aria-disabled={section.locked}
            >
              <div className="scr-account-icon" aria-hidden="true">{section.icon}</div>
              <div className="scr-account-row-info">
                <div className="scr-account-row-title">{section.title}</div>
                <div className="scr-account-row-desc">
                  {section.desc}{section.locked ? ' · قريباً' : ''}
                </div>
              </div>
              <div className="scr-account-row-arrow" aria-hidden="true">‹</div>
            </Link>
          ))}
        </div>

        {/* Sign Out */}
        <form action={signOut} style={{ marginTop: 16 }}>
          <button
            type="submit"
            className="scr-account-row"
            style={{
              width: '100%',
              cursor: 'pointer',
              border: '1px solid var(--rose-soft)',
              background: 'var(--rose-soft)',
              color: 'var(--rose)',
              fontWeight: 800,
              justifyContent: 'center',
            }}
          >
            <span aria-hidden="true">⎋</span>
            <span>تسجيل الخروج</span>
          </button>
        </form>

      </div>
    </main>
  );
}
