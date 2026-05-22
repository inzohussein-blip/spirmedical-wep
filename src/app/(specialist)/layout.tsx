import { requireSession } from '@/lib/auth/session';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import PageTransitionProvider from '@/components/pwa/PageTransitionProvider';

export const dynamic = 'force-dynamic';

/**
 * Specialist Layout — للأطباء والمختبرات
 *
 * Roles المسموحة: specialist فقط
 * - patient يُحوّل لـ /dashboard
 * - admin يُحوّل لـ /admin44
 */
export default async function SpecialistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession({
    allowedRoles: ['specialist'],
  });

  return (
    <AuthenticatedShell
      session={session}
      shellRole="specialist"
      notificationRole="specialist"
    >
      {/* 🎯 V25.32: page transitions */}
      <PageTransitionProvider>
        {children}
      </PageTransitionProvider>
    </AuthenticatedShell>
  );
}
