import { adminLogin } from './actions';

export const metadata = {
  title: 'دخول الإدارة · Spir Medical',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(1000px 500px at 50% -10%, rgba(14,92,77,0.18), transparent 60%), #0F1A1C',
        padding: 24,
        fontFamily: 'Tajawal, system-ui, sans-serif',
        direction: 'rtl',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#15201F',
          borderRadius: 20,
          padding: '40px 32px',
          boxShadow: '0 24px 60px -20px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* الشعار */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 16px',
              borderRadius: 18,
              background: 'linear-gradient(135deg, #0E7A66, #0A5446)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}
          >
            👑
          </div>
          <h1 style={{ color: '#F4EFE2', fontSize: 22, fontWeight: 800, margin: 0 }}>
            لوحة الإدارة
          </h1>
          <p style={{ color: 'rgba(244,239,226,0.55)', fontSize: 13, marginTop: 6 }}>
            Spir Medical · دخول المسؤولين
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(168,46,61,0.15)',
              border: '1px solid rgba(168,46,61,0.4)',
              color: '#F2B8C0',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              marginBottom: 18,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form action={adminLogin}>
          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{ color: 'rgba(244,239,226,0.8)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              البريد الإلكتروني
            </span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="admin@spirmedical.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: '#0F1A1C',
                color: '#F4EFE2',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                direction: 'ltr',
                textAlign: 'left',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 22 }}>
            <span style={{ color: 'rgba(244,239,226,0.8)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              كلمة المرور
            </span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: '#0F1A1C',
                color: '#F4EFE2',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                direction: 'ltr',
                textAlign: 'left',
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #0E7A66, #0A5446)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            تسجيل الدخول
          </button>
        </form>

        <p style={{ color: 'rgba(244,239,226,0.4)', fontSize: 11, textAlign: 'center', marginTop: 20 }}>
          هذه الصفحة مخصّصة للمسؤولين فقط
        </p>
      </div>
    </div>
  );
}
