'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyEmailToken } from '@/lib/auth/email-auth';

// ═══════════════════════════════════════════════════════════
// 📧 صفحة التحقق من الإيميل
// ═══════════════════════════════════════════════════════════

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error');
        setMessage('الرابط غير صحيح');
        return;
      }

      try {
        const result = await verifyEmailToken(token);

        if (result.success) {
          setStatus('success');
          setMessage('تم تفعيل بريدك بنجاح! جاري التحويل...');
          
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(result.error || 'فشل التحقق');
        }
      } catch (err) {
        setStatus('error');
        setMessage('حدث خطأ أثناء التحقق');
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="mb-6 animate-spin">
              <svg className="w-12 h-12 mx-auto text-emerald-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">جاري التحقق...</h1>
            <p className="text-gray-600 mt-2">يرجى الانتظار قليلاً</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✓</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">تم التحقق بنجاح!</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <p className="text-sm text-gray-500 mt-4">سيتم نقلك إلى صفحة الدخول تلقائياً...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✕</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">فشل التحقق</h1>
            <p className="text-gray-600 mt-2">{message}</p>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-medium"
              >
                العودة للدخول
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                className="w-full border-2 border-emerald-600 text-emerald-600 py-3 rounded-lg hover:bg-emerald-50 transition font-medium"
              >
                إنشاء حساب جديد
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
