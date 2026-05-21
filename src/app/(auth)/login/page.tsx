// ═══════════════════════════════════════════════════════════════
// 🔐 صفحة تسجيل الدخول
// ═══════════════════════════════════════════════════════════════
// الحماية: تتم في (auth)/layout.tsx تلقائياً
// ═══════════════════════════════════════════════════════════════

import LoginClient from './LoginClient';

export const metadata = {
  title: 'تسجيل الدخول · سباير ميديكال',
  description: 'سجّل الدخول إلى حسابك في Spir Medical',
};

export default function LoginPage() {
  return <LoginClient />;
}
