'use client';

import { useState } from 'react';
import { requestPasswordReset } from '@/lib/auth/email-auth';

// ═══════════════════════════════════════════════════════════
// 📧 استعادة عبر البريد (لمن سجّل ببريد وكلمة مرور)
// ═══════════════════════════════════════════════════════════
// استعادة الهاتف تُرسل رمز OTP، وهي لا تنفع من سجّل بالبريد: هاتفه في
// قاعدة البيانات نائبٌ مؤقّت (`+temp_…`) يولّده مشغّل إنشاء الحساب، فلا
// رقم حقيقي يُرسَل إليه رمز. بدون هذا النموذج يبقى مستخدم البريد محبوساً
// خارج حسابه نهائياً إذا نسي كلمة المرور.

export default function EmailResetForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('البريد الإلكتروني غير صحيح');
      return;
    }

    setState('sending');
    try {
      const result = await requestPasswordReset(email.trim());
      // لا نكشف ما إذا كان البريد مُسجّلاً (تفادي تعداد الحسابات)
      if (result.success) {
        setState('sent');
      } else {
        setState('idle');
        setError(result.error || 'تعذّر إرسال الرابط');
      }
    } catch {
      // إجراءات الخادم ترمي عند انقطاع الشبكة ولا تُرجع { success:false }
      setState('idle');
      setError('تعذّر الاتصال. تحقّق من الإنترنت وحاول مرة أخرى.');
    }
  }

  if (state === 'sent') {
    return (
      <div className="auth-helper" style={{ marginTop: 12 }}>
        إذا كان هذا البريد مُسجّلاً، فقد أُرسل إليه رابط لتعيين كلمة مرور جديدة.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: 8 }}>
      {error && (
        <div className="auth-error">
          <div className="auth-error-icon">!</div>
          <span>{error}</span>
        </div>
      )}

      <div className="auth-field">
        <label htmlFor="reset-email" className="auth-field-label">
          البريد الإلكتروني المُسجّل
        </label>
        <input
          id="reset-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <button type="submit" className="auth-cta" disabled={state === 'sending'}>
        {state === 'sending' ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة ←'}
      </button>
    </form>
  );
}
