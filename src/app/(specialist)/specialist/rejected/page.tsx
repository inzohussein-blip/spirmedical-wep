import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '../../../(auth)/login/actions';

export const metadata = {
  title: 'الحساب مرفوض · سباير ميديكال',
};

export const dynamic = 'force-dynamic';

export default async function RejectedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, approval_status, rejection_reason')
    .eq('id', user.id)
    .single();

  if (profile?.approval_status === 'approved') redirect('/specialist');
  if (profile?.approval_status === 'pending') redirect('/specialist/pending');

  return (
    <main style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>❌</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 8px' }}>
          عذراً، لم تتم الموافقة
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 16 }}>
          نأسف لإخبارك أن طلبك للانضمام كأخصائي لم يُقبل في الوقت الحالي.
        </p>

        {profile?.rejection_reason && (
          <div style={{ background: 'var(--rose-soft)', padding: 14, borderRadius: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--rose)', fontWeight: 800, marginBottom: 4 }}>السبب:</div>
            <div style={{ fontSize: 13, color: 'var(--ink)' }}>{profile.rejection_reason}</div>
          </div>
        )}

        <a
          href={`https://wa.me/9647700000000?text=${encodeURIComponent(`السلام عليكم، أريد الاستفسار عن سبب رفض تسجيلي كاختصاصي. الاسم: ${profile?.full_name ?? '-'}`)}`}
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
          💬 تواصل للاستفسار
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
