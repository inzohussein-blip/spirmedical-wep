import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '../../../(auth)/login/actions';

export const metadata = {
  title: 'حسابك قيد المراجعة · سباير ميديكال',
};

export const dynamic = 'force-dynamic';

export default async function PendingApprovalPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, approval_status, specialist_type, created_at')
    .eq('id', user.id)
    .single();

  // إذا تمت الموافقة أعدها للوحة
  if (profile?.approval_status === 'approved') {
    redirect('/specialist');
  }
  if (profile?.approval_status === 'rejected') {
    redirect('/specialist/rejected');
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>⏳</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 8px' }}>
          حسابك قيد المراجعة
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 20 }}>
          أهلاً <strong style={{ color: 'var(--ink)' }}>{profile?.full_name ?? 'بك'}</strong>،
          <br />
          تم استلام تسجيلك بنجاح وسيُراجع من قبل إدارة Spir Medical خلال <strong>24-48 ساعة</strong>.
        </p>

        <div style={{ background: 'var(--paper-3)', padding: 16, borderRadius: 12, textAlign: 'right', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 8 }}>الخطوات القادمة:</div>
          <ul style={{ margin: 0, padding: '0 18px', fontSize: 12, lineHeight: 2, color: 'var(--ink)' }}>
            <li>سنراجع وثائقك ومؤهلاتك</li>
            <li>قد نتواصل معك للحصول على معلومات إضافية</li>
            <li>عند الموافقة، ستصلك رسالة عبر WhatsApp</li>
            <li>بعدها يمكنك استقبال الطلبات وتقديم خدماتك</li>
          </ul>
        </div>

        <a
          href={`https://wa.me/9647700000000?text=${encodeURIComponent(`السلام عليكم، أريد الاستفسار عن حالة تسجيلي كاختصاصي في Spir Medical. الاسم: ${profile?.full_name ?? '-'}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#25D366',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 800,
            textDecoration: 'none',
            marginBottom: 12,
          }}
        >
          💬 تواصل عبر WhatsApp
        </a>

        <form action={signOut}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--line)',
              borderRadius: 10,
              background: 'transparent',
              color: 'var(--ink-3)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            تسجيل الخروج
          </button>
        </form>
      </div>
    </main>
  );
}
