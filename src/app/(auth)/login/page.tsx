/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 Login Page (Server Component Wrapper)
 * ═══════════════════════════════════════════════════════════════
 *
 * Server Component رفيع — كل المنطق في <LoginForm>.
 *
 * الاستيراد الجديد: نستخدم features/auth بدلاً من LoginClient المحلي.
 * الإصدار القديم (LoginClient.tsx) محفوظ في نفس المجلد كـ legacy backup.
 */

import { LoginForm } from '@/features/auth';

export const metadata = {
  title: 'تسجيل الدخول · سباير ميديكال',
  description: 'سجّل الدخول إلى حسابك في Spir Medical',
};

export default function LoginPage() {
  return <LoginForm />;
}
