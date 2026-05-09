import { AppShell } from '@/components/layout/AppShell';

/**
 * Guest Layout - يحيط بكل صفحات /guest/*
 *
 * يستخدم نفس AppShell الذي تستخدمه واجهة المراجع
 * لضمان تجربة بصرية موحّدة.
 */
export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell userRole="guest" isGuest={true}>
      <div className="guest-container">
        {children}
      </div>

      <style>{`
        .guest-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px;
        }
        @media (max-width: 767px) {
          .guest-container { padding: 16px; }
        }
      `}</style>
    </AppShell>
  );
}
