import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRoleHomePath } from '@/lib/auth/home-path';
import { hasLoginPin, isPhoneAuthEmail } from '@/lib/auth/login-pin';
import LoginPinForm from './LoginPinForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'رمز الدخول · سباير ميديكال',
  robots: { index: false, follow: false },
};

/** ضبطُ رمز الدخول أو تغييره — للمريض والمختصّ (خارج تخطيط لوحة المريض). */
export default async function LoginPinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login/phone');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  const homePath = getRoleHomePath(profile?.role);
  const phoneAccount = isPhoneAuthEmail(user.email);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href={homePath} className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">رمز الدخول</h1>
          <div className="scr-page-spacer" />
        </div>
        {phoneAccount ? (
          <LoginPinForm homePath={homePath} hasPin={!!(await hasLoginPin(user.id))} />
        ) : (
          <p className="scr-page-subtitle">حسابك يدخل بالبريد الإلكتروني وكلمة المرور، فلا يحتاج رمز دخول.</p>
        )}
      </div>
    </main>
  );
}
