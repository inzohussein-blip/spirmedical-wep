'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUpWithEmail } from '@/lib/auth/email-auth';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════
// 📝 تسجيل مريض جديد - بسيط وسريع
// ═══════════════════════════════════════════════════════════

export default function PatientRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'verifying'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'male' as 'male' | 'female',
    agreeTerms: false,
  });

  // ─────────────────────────────────────────────────────────
  // معالجة التسجيل
  // ─────────────────────────────────────────────────────────

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // ✅ التحقق من الحقول
    if (!formData.fullName.trim()) {
      setError('الاسم الكامل مطلوب');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('البريد الإلكتروني غير صحيح');
      return;
    }

    if (formData.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (!formData.agreeTerms) {
      setError('يجب قبول الشروط والأحكام');
      return;
    }

    setLoading(true);

    try {
      const result = await signUpWithEmail({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        gender: formData.gender,
        role: 'patient',
      });

      if (result.success) {
        setStep('verifying');
        // بعد 3 ثواني، أعد التوجيه
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        setError(result.error || 'فشل التسجيل');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Step 1: نموذج التسجيل
  // ─────────────────────────────────────────────────────────

  if (step === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-700 mb-2">حساب مريض جديد</h1>
            <p className="text-gray-600">تسجيل سريع وآمن (2 دقيقة)</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-4 bg-white p-6 rounded-lg shadow">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="أحمد محمد"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={loading}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الجنس</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={loading}
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">8 أحرف على الأقل</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={loading}
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                className="mt-1"
                disabled={loading}
              />
              <label className="text-sm text-gray-600">
                أوافق على{' '}
                <Link href="/legal/terms" className="text-emerald-600 hover:underline">
                  الشروط والأحكام
                </Link>{' '}
                و{' '}
                <Link href="/legal/privacy" className="text-emerald-600 hover:underline">
                  سياسة الخصوصية
                </Link>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
            </button>
          </form>

          {/* Already Have Account */}
          <p className="text-center mt-6 text-gray-700">
            لديك حساب بالفعل؟{' '}
            <Link href="/auth/login" className="text-emerald-600 hover:underline font-medium">
              سجّل الدخول
            </Link>
          </p>

          {/* Back to Role Selection */}
          <p className="text-center mt-4">
            <Link href="/auth/register" className="text-sm text-gray-600 hover:underline">
              ← العودة
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // Step 2: انتظار التحقق
  // ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">تم إنشاء حسابك بنجاح!</h1>
        </div>

        <p className="text-gray-600 mb-6">
          تم إرسال رابط التفعيل إلى بريدك الإلكتروني <br />
          <span className="font-medium">{formData.email}</span>
        </p>

        <p className="text-sm text-gray-500 mb-6">جاري التحويل إلى صفحة التحقق...</p>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">لم تستقبل الإيميل؟</p>
          <button
            onClick={() => {
              setStep('form');
            }}
            className="text-emerald-600 hover:underline font-medium"
          >
            انقر هنا لإعادة الإرسال
          </button>
        </div>
      </div>
    </div>
  );
}
