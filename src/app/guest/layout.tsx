import { AppShell } from '@/components/layout/AppShell';

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell userRole="guest" isGuest={true}>
      {children}
    </AppShell>
  );
}
