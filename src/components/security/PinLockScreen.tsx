'use client';

import { useState, useEffect } from 'react';
import { verifyPin } from '@/lib/services/pin-actions';

interface Props {
  onUnlock: () => void;
}

export default function PinLockScreen({ onUnlock }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const MAX_ATTEMPTS = 5;
  const isLocked = attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    if (pin.length === 4) {
      handleVerify();
    }
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleVerify() {
    if (isLocked) return;
    setIsVerifying(true);
    setError('');

    const result = await verifyPin(pin);

    if (result.ok) {
      // علِّم الجلسة بأنها unlocked
      sessionStorage.setItem('spir_unlocked', '1');
      onUnlock();
    } else {
      setAttempts((a) => a + 1);
      setError(result.error || 'PIN غير صحيح');
      setPin('');
      // اهتزاز خفيف
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
    setIsVerifying(false);
  }

  function pressDigit(d: string) {
    if (isLocked || isVerifying) return;
    if (pin.length < 4) {
      setPin((p) => p + d);
      setError('');
    }
  }

  function backspace() {
    if (isLocked || isVerifying) return;
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'linear-gradient(135deg, #0E5C4D 0%, #073B30 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      color: '#fff',
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        marginBottom: 16,
      }}>🔒</div>

      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>
        التطبيق مقفل
      </h1>
      <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 28 }}>
        أدخل رمز PIN للمتابعة
      </p>

      {/* PIN Dots */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: pin.length > i ? '#fff' : 'rgba(255,255,255,0.25)',
              transition: 'all 0.2s',
              transform: pin.length === i + 1 ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {error && (
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          padding: '8px 14px',
          borderRadius: 10,
          fontSize: 12,
          marginBottom: 16,
          fontWeight: 700,
        }}>
          ⚠️ {error} {!isLocked && attempts > 0 && `(${MAX_ATTEMPTS - attempts} محاولات متبقية)`}
        </div>
      )}

      {isLocked && (
        <div style={{
          background: 'rgba(168,46,61,0.3)',
          border: '1px solid rgba(255,255,255,0.3)',
          padding: '12px 16px',
          borderRadius: 12,
          fontSize: 12,
          marginBottom: 16,
          fontWeight: 700,
          textAlign: 'center',
        }}>
          🔐 تم قفل التطبيق مؤقتاً<br />
          أعد تشغيل المتصفح أو سجّل خروج وعد
        </div>
      )}

      {/* Keypad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 70px)',
        gap: 12,
        marginTop: 16,
      }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => pressDigit(d)}
            disabled={isLocked || isVerifying}
            style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 26,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.1s',
            }}
            onMouseDown={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
            onMouseUp={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            {d}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => pressDigit('0')}
          disabled={isLocked || isVerifying}
          style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: 26,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          disabled={isLocked || isVerifying || pin.length === 0}
          style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            border: '0',
            background: 'transparent',
            color: '#fff',
            fontSize: 20,
            cursor: 'pointer',
            fontFamily: 'inherit',
            opacity: pin.length === 0 ? 0.3 : 1,
          }}
          aria-label="حذف"
        >
          ⌫
        </button>
      </div>

      {/* روابط طوارئ + نسيت PIN */}
      <div style={{
        marginTop: 32,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}>
        <a
          href="/sos"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            background: '#A82E3D',
            color: '#fff',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          🚨 طوارئ SOS
        </a>

        <a
          href="/login?error=أعد+تسجيل+الدخول+لإعادة+تعيين+PIN"
          onClick={() => {
            try { sessionStorage.clear(); } catch {}
          }}
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'underline',
          }}
        >
          نسيت PIN؟
        </a>
      </div>
    </div>
  );
}
