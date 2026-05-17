/**
 * ═══════════════════════════════════════════════════════════════
 * AuthenticatedShell — موحّد لـ (dashboard) و (specialist)
 * ═══════════════════════════════════════════════════════════════
 * يجمع كل الـ wrappers المشتركة:
 *   - PinGate (قفل PIN)
 *   - AppShell (الـ layout الأساسي)
 *   - NotificationToast (الإشعارات)
 *   - PushPermissionPrompt (طلب push)
 *
 * يأخذ session من session helper ويبسّط الـ layouts
 */

import { signOut } from '@/app/(auth)/login/actions';
import { AppShell } from '@/components/layout/AppShell';
import NotificationToast from '@/components/notifications/NotificationToast';
import PushPermissionPrompt from '@/components/notifications/PushPermissionPrompt';
import PinGate from '@/components/security/PinGate';
import type { AuthenticatedSession } from '@/lib/auth/session';

interface AuthenticatedShellProps {
  session: AuthenticatedSession;
  /**
   * نوع المستخدم في الـ UI (الـ bottom nav)
   * patient لـ (dashboard) و specialist لـ (specialist)
   */
  shellRole: 'patient' | 'specialist';
  /**
   * userRole للـ NotificationToast
   */
  notificationRole: 'patient' | 'specialist';
  children: React.ReactNode;
}

export function AuthenticatedShell({
  session,
  shellRole,
  notificationRole,
  children,
}: AuthenticatedShellProps) {
  return (
    <PinGate pinEnabled={session.pinEnabled}>
      <AppShell
        userName={session.profile.full_name}
        userRole={shellRole}
        signOutAction={signOut}
        isGuest={false}
      >
        {children}
      </AppShell>
      <NotificationToast userId={session.user.id} userRole={notificationRole} />
      <PushPermissionPrompt />
    </PinGate>
  );
}
