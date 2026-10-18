import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { isAdminRole } from '@/lib/admin-types';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import PageTransitionProvider from '@/components/pwa/PageTransitionProvider';

import '@/app/styles/app.css';

export const dynamic = 'force-dynamic';

/**
 * 🏥 نافذةُ «الخدمة» (0060): مختبر، صيدلية، عيادة، مستشفى. الثالثةُ بعد المريض والمختصّ.
 * المديرُ يدخلها أيضاً (زرُّها في لوحة الإدارة). وبوّابةُ الاعتماد كتطبيق المختصّ: قيدُ المراجعة
 * أو المرفوض لا يرى إلّا صفحةَ حالته.
 */
export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession({ allowedRoles: ['provider'], allowAdmin: true });

  const pathname = (await headers()).get('x-pathname') ?? '';
  const isStatusPage = pathname.startsWith('/provider/pending') || pathname.startsWith('/provider/rejected');
  if (!isStatusPage && !isAdminRole(session.profile.role) && session.profile.approval_status !== 'approved') {
    redirect(session.profile.approval_status === 'rejected' ? '/provider/rejected' : '/provider/pending');
  }

  return (
    <AuthenticatedShell session={session} shellRole="provider" notificationRole="provider">
      <PageTransitionProvider>{children}</PageTransitionProvider>
    </AuthenticatedShell>
  );
}
