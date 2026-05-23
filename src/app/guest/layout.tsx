import { AppShell } from '@/components/layout/AppShell';

// 📱 App-specific CSS (V25.40)
import '@/app/styles/app.css';

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
