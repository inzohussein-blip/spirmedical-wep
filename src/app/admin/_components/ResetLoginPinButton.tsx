'use client';

import { useState, useTransition } from 'react';
import { adminResetLoginPin } from '../_actions/login-pin';
import { activationMessage, credentialsMessage, waChatLink } from '@/lib/whatsapp/share';

import EmojiIcon from '@/components/ui/EmojiIcon';
/**
 * «الدخول وواتساب» في صفحتَي المريض والمختصّ.
 *
 * - **رابطُ الاستعادة** (حين يعمل التحقّقُ العكسيّ): يُرسله المديرُ من واتسابه، فيثبت صاحبُ
 *   الحساب رقمَه ويختار رمزه بنفسه — لا يعرف المديرُ الرمز.
 * - **رمزٌ مؤقّت** (احتياطاً): يُعرض مرّةً، ومعه زرُّ إرساله عبر واتساب.
 */
const btnGhost: React.CSSProperties = {
  width: '100%', minHeight: 44, padding: '10px', background: 'transparent',
  color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 10,
  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};
const btnWa: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%', minHeight: 44, padding: '10px', background: '#1FA855', color: '#fff',
  border: 0, borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: 'none', marginBottom: 8,
};

export default function ResetLoginPinButton({
  userId,
  phone,
  name,
  role,
  activationUrl,
  loginUrl,
}: {
  userId: string;
  phone?: string | null;
  name?: string | null;
  role?: string | null;
  /** رابطُ /login/reset-pin حين يعمل التحقّقُ عبر واتساب، وإلّا null */
  activationUrl?: string | null;
  loginUrl?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [pin, setPin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const displayName = name || 'صاحب الحساب';

  const reset = () => {
    if (!confirm('سيُستبدل رمزُ دخول هذا الحساب برمزٍ مؤقّت. متابعة؟')) return;
    setError(null);
    startTransition(async () => {
      const res = await adminResetLoginPin(userId);
      if (res.ok) setPin(res.pin);
      else setError(res.error);
    });
  };

  return (
    <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20, marginTop: 16 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}><EmojiIcon e="🔑" /> الدخول وواتساب</h2>

      {phone && activationUrl && !pin && (
        <>
          <a
            href={waChatLink(phone, activationMessage({ name: displayName, role: role ?? '', url: activationUrl }))}
            target="_blank"
            rel="noopener noreferrer"
            style={btnWa}
            data-testid="wa-reset-link"
          >
            <EmojiIcon e="💬" /> إرسال رابط استعادة الرمز
          </a>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12, lineHeight: 1.7 }}>
            يؤكّد رقمه برسالة واتساب ويختار رمزه بنفسه — الأسلم.
          </div>
        </>
      )}

      {pin ? (
        <div role="status">
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 8 }}>
            يدخل به برقمه، ثمّ يغيّره من «رمز الدخول». لن يُعرض مرّةً أخرى.
          </div>
          <div dir="ltr" style={{ fontSize: 24, fontWeight: 800, letterSpacing: 6, textAlign: 'center', marginBottom: 10 }}>
            {pin}
          </div>
          {phone && (
            <a
              href={waChatLink(phone, credentialsMessage({ name: displayName, role: role ?? '', phone, pin, loginUrl: loginUrl ?? '' }))}
              target="_blank"
              rel="noopener noreferrer"
              style={btnWa}
              data-testid="wa-send-pin"
            >
              <EmojiIcon e="💬" /> إرسال الرمز عبر واتساب
            </a>
          )}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 10 }}>
            {activationUrl ? 'أو رمزٌ مؤقّت تعطيه له (يُلغى القديم):' : 'لمن نسي رمزه: يُنشأ رمزٌ مؤقّت ويُلغى القديم.'}
          </div>
          <button type="button" onClick={reset} disabled={pending} style={btnGhost}>
            {pending ? 'جارٍ…' : 'إنشاء رمز دخولٍ مؤقّت'}
          </button>
        </>
      )}
      {error && <div role="alert" style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, marginTop: 10 }}>{error}</div>}
    </div>
  );
}
