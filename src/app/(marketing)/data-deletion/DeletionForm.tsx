'use client';

import { useState } from 'react';
import { submitDeletionRequest } from './actions';

const CONFIRM_PHRASE = 'أؤكد حذف بياناتي';

export default function DeletionForm({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  const [confirmInput, setConfirmInput] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const phraseMatches = confirmInput.trim() === CONFIRM_PHRASE;
  const canSubmit = phraseMatches && acknowledged;

  if (success) {
    return (
      <div
        style={{
          background: 'rgba(14,122,102,0.1)',
          border: '1px solid rgba(14,122,102,0.35)',
          borderRadius: 12,
          padding: '24px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <h3 style={{ margin: '0 0 8px', color: '#0A5446' }}>تم استلام طلبك</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.8, margin: 0 }}>
          رقم طلبك: <strong style={{ direction: 'ltr', display: 'inline-block' }}>{success}</strong>
          <br />
          سيراجع فريقنا الطلب ويتواصل معك للتحقّق من هويتك قبل تنفيذ الحذف.
          احتفظ برقم الطلب للمتابعة.
        </p>
      </div>
    );
  }

  return (
    <form action={submitDeletionRequest} className="deletion-form">
      {error && (
        <div
          style={{
            background: 'rgba(168,46,61,0.1)',
            border: '1px solid rgba(168,46,61,0.35)',
            color: '#A82E3D',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 14,
            marginBottom: 18,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* تحذير صارم */}
      <div
        style={{
          background: 'rgba(184,84,12,0.08)',
          border: '1px solid rgba(184,84,12,0.3)',
          borderRadius: 12,
          padding: '16px 18px',
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 800, color: '#B8540C', marginBottom: 6, fontSize: 15 }}>
          ⚠️ تنبيه: الحذف نهائي ولا يمكن التراجع عنه
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7, margin: 0 }}>
          حذف بياناتك يعني فقدان سجلّاتك الطبية، مواعيدك، نتائج تحاليلك، وكل المعلومات
          المرتبطة بحسابك بشكل دائم. لن نتمكّن من استرجاعها بعد التنفيذ.
        </p>
      </div>

      <Field label="الاسم الكامل (كما في الحساب)" name="fullName" type="text" placeholder="مثال: حسين علي محمد" required />
      <Field label="البريد الإلكتروني المسجّل" name="email" type="email" placeholder="you@email.com" required ltr />
      <Field label="رقم الهاتف المسجّل (للتحقّق)" name="phone" type="tel" placeholder="07XXXXXXXXX" required ltr />

      <label style={{ display: 'block', marginBottom: 18 }}>
        <span style={labelStyle}>سبب طلب الحذف</span>
        <textarea
          name="reason"
          required
          minLength={10}
          rows={3}
          placeholder="يرجى توضيح سبب رغبتك في حذف بياناتك..."
          style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
        />
      </label>

      {/* عبارة التأكيد الإلزامية */}
      <label style={{ display: 'block', marginBottom: 18 }}>
        <span style={labelStyle}>
          للتأكيد، اكتب العبارة التالية حرفياً:{' '}
          <strong style={{ color: '#A82E3D' }}>{CONFIRM_PHRASE}</strong>
        </span>
        <input
          type="text"
          name="confirmText"
          required
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          placeholder={CONFIRM_PHRASE}
          style={{
            ...inputStyle,
            borderColor: confirmInput
              ? phraseMatches
                ? 'rgba(14,122,102,0.6)'
                : 'rgba(168,46,61,0.6)'
              : 'var(--line)',
          }}
        />
        {confirmInput && !phraseMatches && (
          <span style={{ fontSize: 12, color: '#A82E3D', display: 'block', marginTop: 4 }}>
            العبارة غير مطابقة
          </span>
        )}
      </label>

      {/* إقرار */}
      <label
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          marginBottom: 24,
          cursor: 'pointer',
          fontSize: 13,
          color: 'var(--ink-2)',
          lineHeight: 1.6,
        }}
      >
        <input
          type="checkbox"
          name="acknowledge"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
        />
        <span>
          أُقرّ بأنّني فهمت أنّ هذا الإجراء نهائي، وأنّ جميع بياناتي الطبية ستُحذف بشكل
          دائم بعد التحقّق من هويتي، وأنّه لا يمكن استرجاعها.
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 10,
          border: 'none',
          background: canSubmit ? '#A82E3D' : 'var(--line)',
          color: canSubmit ? '#fff' : 'var(--ink-3)',
          fontSize: 15,
          fontWeight: 800,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          transition: 'all 0.2s',
        }}
      >
        إرسال طلب الحذف
      </button>

      <p style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
        سيصل طلبك لفريق الشركة، وسنتواصل معك للتحقّق من هويتك قبل أيّ إجراء.
      </p>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--ink-1)',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: 'var(--white)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  color: 'var(--ink-1)',
};

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
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={labelStyle}>
        {label}
        {required && <span style={{ color: '#A82E3D' }}> *</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        style={{ ...inputStyle, ...(ltr ? { direction: 'ltr', textAlign: 'left' } : {}) }}
      />
    </label>
  );
}
