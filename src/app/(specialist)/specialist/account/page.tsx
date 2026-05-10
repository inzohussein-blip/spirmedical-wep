import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../../../(auth)/login/actions';

export const dynamic = 'force-dynamic';

const ACCOUNT_SECTIONS = [
  { id: 'profile', icon: '👤', title: 'الملف المهني', desc: 'معلوماتك وتخصصك', href: '/specialist/account/profile', locked: true },
  { id: 'schedule', icon: '📅', title: 'جدول العمل', desc: 'أيام وأوقات التوفّر', href: '/specialist/account/schedule', locked: true },
  { id: 'earnings', icon: '💰', title: 'الأرباح', desc: 'سجل المدفوعات والتحويلات', href: '/specialist/account/earnings', locked: true },
  { id: 'reviews', icon: '⭐', title: 'تقييمات المرضى', desc: 'عرض ملاحظات المرضى', href: '/specialist/account/reviews', locked: true },
  { id: 'settings', icon: '⚙', title: 'الإعدادات', desc: 'تخصيص التطبيق', href: '/specialist/account/settings', locked: true },
  { id: 'help', icon: '💬', title: 'المساعدة والدعم', desc: 'تواصل معنا', href: '/specialist/account/help', locked: true },
  { id: 'about', icon: 'ℹ', title: 'حول التطبيق', desc: 'الشروط والخصوصية', href: '/legal/terms' },
];

export default async function SpecialistAccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', user!.id)
    .single();

  const fullName = profile?.full_name || 'دكتور';
  const initial = fullName.charAt(0);
  const phone = profile?.phone ? `+964 ${profile.phone}` : '';

  return (
    <main className="app-screen">
      <div className="scr-content">

        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn" aria-label="العودة">
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
            <h2>د. {fullName}</h2>
            <p>أخصائي{phone ? ` · ${phone}` : ''}</p>
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
