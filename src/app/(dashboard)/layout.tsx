import { requireSession } from '@/lib/auth/session';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import BugReportButton from '@/components/feedback/BugReportButton';
import PageTransitionProvider from '@/components/pwa/PageTransitionProvider';

export const dynamic = 'force-dynamic';

/**
 * Dashboard Layout — للمستخدمين العاديين (patients)
 *
 * Roles المسموحة: patient فقط
 * - specialist يُحوّل لـ /specialist
 * - admin يُحوّل لـ /admin44
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession({
    allowedRoles: ['patient'],
  });

  return (
    <AuthenticatedShell
      session={session}
      shellRole="patient"
      notificationRole="patient"
    >
      {/* 🎯 V25.32: page transitions سلسة */}
      <PageTransitionProvider>
        {children}
      </PageTransitionProvider>
      {/* ✨ V25.18: زر الإبلاغ عن الأعطال (floating) */}
      <BugReportButton />
    </AuthenticatedShell>
  );
}
