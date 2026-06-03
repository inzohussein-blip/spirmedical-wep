import { adminLogin, adminCreate } from './actions';
import AdminAuthTabs from './AdminAuthTabs';

export const metadata = {
  title: 'دخول الإدارة · Spir Medical',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; tab?: string; created?: string };
}) {
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
          maxWidth: 440,
          background: '#15201F',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 24px 60px -20px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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

        <AdminAuthTabs
          loginAction={adminLogin}
          createAction={adminCreate}
          error={searchParams.error}
          created={searchParams.created === '1'}
          defaultTab={searchParams.tab === 'create' ? 'create' : 'login'}
        />
      </div>
    </div>
  );
}
