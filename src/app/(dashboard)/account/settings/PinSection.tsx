'use client';

import { useState, useTransition } from 'react';
import { setPin, disablePin, changePin } from '@/lib/services/pin-actions';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  pinEnabled: boolean;
}

type Mode = 'idle' | 'enable-1' | 'enable-2' | 'change-old' | 'change-new1' | 'change-new2' | 'disable';

export default function PinSection({ pinEnabled: initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [mode, setMode] = useState<Mode>('idle');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [, startTransition] = useTransition();

  function reset() {
    setPin1(''); setPin2(''); setOldPin('');
    setError(''); setMode('idle');
  }

  function handleEnableSubmit() {
    setError('');
    if (mode === 'enable-1') {
      if (!/^\d{4}$/.test(pin1)) {
        setError('الـ PIN يجب أن يكون ٤ أرقام');
        return;
      }
      setMode('enable-2');
      return;
    }
    if (mode === 'enable-2') {
      if (pin1 !== pin2) {
        setError('الـ PIN غير متطابق');
        setPin2('');
        return;
      }
      startTransition(async () => {
        const result = await setPin(pin1);
        if (!result.ok) {
          setError(result.error || 'تعذّر تفعيل PIN');
          return;
        }
        setEnabled(true);
        setSuccess('تم تفعيل PIN بنجاح');
        setTimeout(() => setSuccess(''), 3000);
        reset();
      });
    }
  }

  function handleDisable() {
    setError('');
    if (!/^\d{4}$/.test(oldPin)) {
      setError('أدخل PIN الحالي');
      return;
    }
    startTransition(async () => {
      const result = await disablePin(oldPin);
      if (!result.ok) {
        setError(result.error || 'تعذّر تعطيل PIN');
        return;
      }
      setEnabled(false);
      setSuccess('تم تعطيل PIN');
      setTimeout(() => setSuccess(''), 3000);
      reset();
    });
  }

  function handleChange() {
    setError('');
    if (mode === 'change-old') {
      if (!/^\d{4}$/.test(oldPin)) {
        setError('أدخل PIN الحالي');
        return;
      }
      setMode('change-new1');
      return;
    }
    if (mode === 'change-new1') {
      if (!/^\d{4}$/.test(pin1)) {
        setError('PIN يجب أن يكون ٤ أرقام');
        return;
      }
      setMode('change-new2');
      return;
    }
    if (mode === 'change-new2') {
      if (pin1 !== pin2) {
        setError('PIN غير متطابق');
        setPin2('');
        return;
      }
      startTransition(async () => {
        const result = await changePin(oldPin, pin1);
        if (!result.ok) {
          setError(result.error || 'تعذّر تغيير PIN');
          return;
        }
        setSuccess('تم تغيير PIN');
        setTimeout(() => setSuccess(''), 3000);
        reset();
      });
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    border: '1px solid var(--line)',
    borderRadius: 10,
    fontSize: 22,
    textAlign: 'center',
    fontFamily: 'inherit',
    letterSpacing: '0.5em',
    fontWeight: 800,
  };

  return (
    <>
      <div className="scr-list-item">
        <div className="scr-list-item-icon" aria-hidden="true">🔢</div>
        <div className="scr-list-item-content">
          <div className="scr-list-item-title">قفل بـ PIN</div>
          <div className="scr-list-item-subtitle">
            {enabled ? 'مفعّل · يُطلب PIN عند فتح التطبيق' : 'حماية إضافية عند فتح التطبيق'}
          </div>
        </div>
        {!enabled ? (
          <button
            type="button"
            onClick={() => setMode('enable-1')}
            className="scr-action-btn"
            style={{ background: 'var(--emerald)', color: '#fff', border: 0 }}
          >
            تفعيل
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setMode('change-old')}
              className="scr-action-btn"
            >
              تغيير
            </button>
            <button
              type="button"
              onClick={() => setMode('disable')}
              className="scr-action-btn"
              style={{ color: 'var(--rose)' }}
            >
              تعطيل
            </button>
          </div>
        )}
      </div>

      {/* Dialog */}
      {mode !== 'idle' && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={reset}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--white)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 38, marginBottom: 8 }}>🔢</div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>
                {mode === 'enable-1' && 'اختر PIN جديد'}
                {mode === 'enable-2' && 'أكِّد الـ PIN'}
                {mode === 'change-old' && 'أدخل PIN الحالي'}
                {mode === 'change-new1' && 'اختر PIN جديد'}
                {mode === 'change-new2' && 'أكِّد الـ PIN الجديد'}
                {mode === 'disable' && 'أدخل PIN لتعطيله'}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>
                ٤ أرقام للحماية
              </p>
            </div>

            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              autoFocus
              value={
                mode === 'enable-1' || mode === 'change-new1' ? pin1 :
                mode === 'enable-2' || mode === 'change-new2' ? pin2 :
                oldPin
              }
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (mode === 'enable-1' || mode === 'change-new1') setPin1(v);
                else if (mode === 'enable-2' || mode === 'change-new2') setPin2(v);
                else setOldPin(v);
                setError('');
              }}
              placeholder="••••"
              style={inputStyle}
              dir="ltr"
            />

            {error && (
              <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginTop: 10, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AlertTriangle size={14} strokeWidth={2.4} />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={reset}
                style={{ flex: 1, padding: '12px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--white)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={
                  mode.startsWith('enable') ? handleEnableSubmit :
                  mode.startsWith('change') ? handleChange :
                  handleDisable
                }
                className="scr-empty-cta"
                style={{ flex: 1 }}
              >
                {mode === 'enable-1' || mode === 'change-old' || mode === 'change-new1' ? 'التالي ←' :
                 mode === 'enable-2' || mode === 'change-new2' ? 'حفظ' :
                 'تعطيل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div style={{
          background: 'var(--emerald-soft)',
          color: 'var(--emerald-deep)',
          padding: '10px 14px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          marginTop: 12,
          textAlign: 'center',
        }}>
          {success}
        </div>
      )}
    </>
  );
}
