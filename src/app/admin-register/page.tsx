import { requestAdminAccess } from './actions';

export const metadata = {
  title: 'طلب صلاحية إدارة · Spir Medical',
  robots: { index: false, follow: false },
};

export default function AdminRegisterPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const error = searchParams.error;
  const success = searchParams.success === '1';

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
          padding: '40px 32px',
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
            طلب صلاحية إدارة
          </h1>
          <p style={{ color: 'rgba(244,239,226,0.55)', fontSize: 13, marginTop: 6 }}>
            يُراجع طلبك المدير العام قبل التفعيل
          </p>
        </div>

        {success ? (
          <div
            style={{
              background: 'rgba(14,122,102,0.15)',
              border: '1px solid rgba(14,122,102,0.4)',
              color: '#9FE0CE',
              borderRadius: 12,
              padding: '20px 16px',
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 1.7,
            }}
          >
            ✅ تم استلام طلبك بنجاح
            <br />
            <span style={{ fontSize: 12, opacity: 0.8 }}>
              سيُراجعه المدير العام، وعند الموافقة ستتمكّن من الدخول عبر صفحة الإدارة.
            </span>
          </div>
        ) : (
          <>
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

            <form action={requestAdminAccess}>
              <Field label="الاسم الكامل" name="fullName" type="text" placeholder="مثال: حسين علي" required />
              <Field label="البريد الإلكتروني" name="email" type="email" placeholder="you@email.com" ltr required />
              <Field label="كلمة المرور" name="password" type="password" placeholder="8 أحرف على الأقل" ltr required />
              <Field label="سبب الطلب (اختياري)" name="reason" type="text" placeholder="مثال: مسؤول مختبر" />

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
                  marginTop: 6,
                }}
              >
                إرسال الطلب
              </button>
            </form>
          </>
        )}

        <p style={{ color: 'rgba(244,239,226,0.4)', fontSize: 11, textAlign: 'center', marginTop: 20 }}>
          لديك صلاحية بالفعل؟{' '}
          <a href="/admin-login" style={{ color: '#9FE0CE' }}>
            تسجيل الدخول
          </a>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  required,
  ltr,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
  ltr?: boolean;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span
        style={{
          color: 'rgba(244,239,226,0.8)',
          fontSize: 13,
          fontWeight: 600,
          display: 'block',
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: '#F2B8C0' }}> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
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
          ...(ltr ? { direction: 'ltr' as const, textAlign: 'left' as const } : {}),
        }}
      />
    </label>
  );
}
