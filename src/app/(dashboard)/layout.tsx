import { requireSession } from '@/lib/auth/session';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import BugReportButton from '@/components/feedback/BugReportButton';
import PageTransitionProvider from '@/components/pwa/PageTransitionProvider';
import FloatingActionButton from '@/components/ui/FloatingActionButton';

// 📱 App-specific CSS (V25.40)
// scr-*, hero-card-*, fab-*, account-*, checkout-*, etc.
import '@/app/styles/app.css';

export const dynamic = 'force-dynamic';

/**
 * Dashboard Layout — للمستخدمين العاديين (patients)
 *
 * Roles المسموحة: patient فقط
 * - specialist يُحوّل لـ /specialist
 * - admin يُحوّل لـ /admin
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
      {/* 🎯 V25.34: FAB ديناميكي حسب الصفحة */}
      <FloatingActionButton />
      {/* ✨ V25.18: زر الإبلاغ عن الأعطال (floating) */}
      <BugReportButton />
    </AuthenticatedShell>
  );
}
