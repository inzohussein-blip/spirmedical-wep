import { requireSession } from '@/lib/auth/session';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';

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
      {children}
    </AuthenticatedShell>
  );
}
