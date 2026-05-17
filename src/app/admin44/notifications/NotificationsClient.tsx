'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendManualWhatsApp } from './actions';

export default function NotificationsClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleSend() {
    setError(''); setSuccess('');
    if (!/^07\d{9}$/.test(phone.trim())) {
      setError('رقم الهاتف غير صحيح (مثال: 07XXXXXXXXX)');
      return;
    }
    if (body.trim().length < 5) {
      setError('الرسالة قصيرة جداً');
      return;
    }
    startTransition(async () => {
      const result = await sendManualWhatsApp(phone, body);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setSuccess('✅ تمت إضافة الرسالة لقائمة الإرسال');
      setPhone(''); setBody('');
      router.refresh();
      setTimeout(() => { setShowForm(false); setSuccess(''); }, 2000);
    });
  }

  return (
    <>
      <button onClick={() => setShowForm(true)} style={{
        padding: '10px 20px', background: 'var(--emerald-deep)', color: '#fff',
        border: 0, borderRadius: 10, fontSize: 13, fontWeight: 800,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>
        💬 إرسال رسالة جديدة
      </button>

      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100,
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 16, padding: 24,
            width: 480, maxWidth: '90vw', zIndex: 101,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px' }}>
              💬 إرسال رسالة WhatsApp
            </h2>

            {error && (
              <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                {success}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>
                رقم الهاتف *
              </label>
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXXX" dir="ltr"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>
                نص الرسالة * <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>({body.length} حرف)</span>
              </label>
              <textarea
                value={body} onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="مرحباً..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                💡 يدعم WhatsApp: *bold* _italic_ ~strikethrough~
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSend} disabled={isPending} style={{
                flex: 1, padding: '12px', background: 'var(--emerald-deep)', color: '#fff',
                border: 0, borderRadius: 10, fontSize: 13, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {isPending ? '...' : '📤 إرسال'}
              </button>
              <button onClick={() => { setShowForm(false); setError(''); setSuccess(''); }} style={{
                padding: '12px 20px', background: 'transparent', border: '1px solid var(--line)',
                borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                إلغاء
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
  borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
};
