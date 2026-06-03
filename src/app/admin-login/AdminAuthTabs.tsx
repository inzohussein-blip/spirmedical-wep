'use client';

import { useState } from 'react';

type Tab = 'login' | 'create';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#0F1A1C',
  color: '#F4EFE2',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  color: 'rgba(244,239,226,0.8)',
  fontSize: 13,
  fontWeight: 600,
  display: 'block',
  marginBottom: 6,
};

export default function AdminAuthTabs({
  loginAction,
  createAction,
  error,
  created,
  defaultTab,
}: {
  loginAction: (formData: FormData) => void;
  createAction: (formData: FormData) => void;
  error?: string;
  created?: boolean;
  defaultTab: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div>
      {/* التبويبات */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          background: '#0F1A1C',
          borderRadius: 12,
          padding: 4,
          marginBottom: 22,
        }}
      >
        <TabButton active={tab === 'login'} onClick={() => setTab('login')}>
          تسجيل الدخول
        </TabButton>
        <TabButton active={tab === 'create'} onClick={() => setTab('create')}>
          إنشاء حساب
        </TabButton>
      </div>

      {created && (
        <Alert type="success">
          ✅ تم إنشاء الحساب بنجاح — يمكنك الآن تسجيل الدخول
        </Alert>
      )}
      {error && <Alert type="error">{error}</Alert>}

      {/* ─── تبويب الدخول ─── */}
      {tab === 'login' && (
        <form action={loginAction}>
          <Field label="البريد الإلكتروني" name="email" type="email" placeholder="admin@spir-medical.com" autoComplete="email" />
          <Field label="كلمة المرور" name="password" type="password" placeholder="••••••••" autoComplete="current-password" />
          <SubmitButton>تسجيل الدخول</SubmitButton>
        </form>
      )}

      {/* ─── تبويب إنشاء حساب ─── */}
      {tab === 'create' && (
        <form action={createAction}>
          <Field label="الاسم الكامل" name="fullName" type="text" placeholder="مثال: حسين علي" autoComplete="name" />
          <Field label="البريد الإلكتروني" name="email" type="email" placeholder="admin@spir-medical.com" autoComplete="email" />
          <Field label="كلمة المرور" name="password" type="password" placeholder="8 أحرف على الأقل" autoComplete="new-password" />

          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={labelStyle}>الصلاحية (الرول)</span>
            <select name="role" defaultValue="support" style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="super_admin">👑 مدير عام (كل الصلاحيات)</option>
              <option value="admin">🛡️ مدير</option>
              <option value="manager">📊 مدير عمليات</option>
              <option value="support">🎧 دعم فني</option>
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: 18 }}>
            <span style={labelStyle}>
              المفتاح السرّي <span style={{ color: '#F2B8C0' }}>*</span>
            </span>
            <input
              type="password"
              name="secretKey"
              required
              placeholder="مفتاح الإنشاء السرّي"
              style={inputStyle}
            />
            <span style={{ fontSize: 11, color: 'rgba(244,239,226,0.4)', display: 'block', marginTop: 5 }}>
              مطلوب لإنشاء حسابات الإدارة — يعرفه المالك فقط
            </span>
          </label>

          <SubmitButton>إنشاء الحساب</SubmitButton>
        </form>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px',
        borderRadius: 9,
        border: 'none',
        background: active ? 'linear-gradient(135deg, #0E7A66, #0A5446)' : 'transparent',
        color: active ? '#fff' : 'rgba(244,239,226,0.6)',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
}) {
  const ltr = type === 'email' || type === 'password';
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        name={name}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{ ...inputStyle, ...(ltr ? { direction: 'ltr', textAlign: 'left' } : {}) }}
      />
    </label>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
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
        marginTop: 4,
      }}
    >
      {children}
    </button>
  );
}

function Alert({ type, children }: { type: 'success' | 'error'; children: React.ReactNode }) {
  const c =
    type === 'success'
      ? { bg: 'rgba(14,122,102,0.15)', border: 'rgba(14,122,102,0.4)', text: '#9FE0CE' }
      : { bg: 'rgba(168,46,61,0.15)', border: 'rgba(168,46,61,0.4)', text: '#F2B8C0' };
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        marginBottom: 18,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}
