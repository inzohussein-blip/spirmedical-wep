'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/lib/auth/email-auth';

// ═══════════════════════════════════════════════════════════
// 🔑 نموذج تعيين كلمة مرور جديدة
// ═══════════════════════════════════════════════════════════
// الجلسة أُنشئت في الصفحة الخادمية من رابط الاستعادة، فهنا نكتفي
// بتحديث كلمة المرور.

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(password);
      if (result.success) {
        setDone(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(result.error || 'فشل تحديث كلمة المرور');
      }
    } catch {
      // إجراءات الخادم ترمي عند انقطاع الشبكة ولا تُرجع { success:false }
      setError('تعذّر الاتصال. تحقّق من الإنترنت وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm text-center">
        تم تحديث كلمة المرور بنجاح! جاري تحويلك لتسجيل الدخول...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          كلمة المرور الجديدة
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="8 أحرف على الأقل"
          autoComplete="new-password"
          required
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
          تأكيد كلمة المرور
        </label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          autoComplete="new-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-700 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
      </button>
    </form>
  );
}
