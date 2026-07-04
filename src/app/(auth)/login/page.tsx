'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signInWithEmail } from '@/lib/auth/email-auth';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════
// 🔐 صفحة الدخول - Email-First
// ═══════════════════════════════════════════════════════════

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPhone, setShowPhone] = useState(false);

  // ─────────────────────────────────────────────────────────
  // دخول بـ Email
  // ─────────────────────────────────────────────────────────

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signInWithEmail(email, password);

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'فشل الدخول');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────
  // دخول بـ Google
  // ─────────────────────────────────────────────────────────

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      // عند النجاح يعيد التوجيه لجوجل؛ نصل هنا فقط عند خطأ
      if (oauthError) {
        setError('الدخول عبر Google غير متاح حالياً');
        setLoading(false);
      }
    } catch (err) {
      setError('الدخول عبر Google غير متاح حالياً');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-700">سباير ميديكال</h1>
          <p className="text-gray-600 mt-2 text-lg">رحباً بعودتك</p>
        </div>

        {/* Email Login Form */}
        {!showPhone && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={loading}
              />
            </div>

            {/* Forgot Password Link */}
            <Link
              href="/auth/forgot-password"
              className="text-sm text-emerald-600 hover:underline"
            >
              هل نسيت كلمة المرور؟
            </Link>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>
        )}

        {/* Divider */}
        {!showPhone && (
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">أو</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        )}

        {/* Google Login */}
        {!showPhone && (
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            دخول عبر Google
          </button>
        )}

        {/* Phone Option */}
        {!showPhone && (
          <button
            onClick={() => setShowPhone(true)}
            className="w-full mt-4 text-emerald-600 hover:underline text-sm"
          >
            أفضل الدخول عبر الهاتف؟
          </button>
        )}

        {/* Back to Email Button */}
        {showPhone && (
          <button
            onClick={() => {
              setShowPhone(false);
              setError('');
            }}
            className="w-full text-emerald-600 hover:underline text-sm"
          >
            العودة للدخول عبر الإيميل
          </button>
        )}

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-gray-700">
          ليس لديك حساب؟{' '}
          <Link href="/auth/register" className="text-emerald-600 hover:underline font-medium">
            انضم الآن
          </Link>
        </p>

        {/* Footer Links */}
        <div className="text-center mt-6 text-xs text-gray-500 space-x-2">
          <Link href="/legal/privacy" className="hover:underline">
            الخصوصية
          </Link>
          <span>•</span>
          <Link href="/legal/terms" className="hover:underline">
            الشروط
          </Link>
        </div>
      </div>
    </div>
  );
}
