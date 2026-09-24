import { headers } from 'next/headers';
import { requireSession } from '@/lib/auth/session';
import ServiceComingSoon from '@/components/services/ServiceComingSoon';
import { allSwitchableServices } from '@/lib/service-switches';
import { getServiceSwitches } from '@/lib/service-switches.server';
import { isEnabled, noteFor, serviceIdForPath } from '@/lib/service-switches';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
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

  // ─── بوّابة الخدمات المطفأة ───
  //
  // المنع هنا لا في البطاقة. `BentoServicesGridV3` كانت تُسقط الرابط
  // للخدمة المعلَّمة «قريباً»، لكنّ كتابة المسار في شريط العنوان تفتحها
  // كاملةً — وكذلك أيّ رابطٍ محفوظٍ أو نتيجةِ بحث. وبوضعه في التخطيط
  // يشمل المنعُ كلّ صفحات المجموعة دفعةً واحدة، والصفحاتُ الداخلية معها
  // (`/services/dental/<id>` يُمنع بإطفاء `/services/dental`).
  //
  // ولا يُجلب محتوى الصفحة أصلاً: نُرجع شاشة «قريباً» مكان `children`.
  const h = headers();
  const pathname = h.get('x-pathname') ?? '';
  const search = new URLSearchParams(h.get('x-search') ?? '');
  const serviceId = serviceIdForPath(pathname, search);

  if (serviceId) {
    const switches = await getServiceSwitches();
    if (!isEnabled(switches, serviceId)) {
      const cfg = allSwitchableServices().find((s) => s.id === serviceId);
      return (
        <AuthenticatedShell
          session={session}
          shellRole="patient"
          notificationRole="patient"
        >
          <ServiceComingSoon
            title={cfg?.title ?? 'الخدمة'}
            note={noteFor(switches, serviceId)}
          />
        </AuthenticatedShell>
      );
    }
  }

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
    </AuthenticatedShell>
  );
}
