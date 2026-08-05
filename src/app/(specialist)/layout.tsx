import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { AuthenticatedShell } from '@/components/layout/AuthenticatedShell';
import PageTransitionProvider from '@/components/pwa/PageTransitionProvider';

// 📱 App-specific CSS (V25.40)
import '@/app/styles/app.css';

export const dynamic = 'force-dynamic';

/**
 * Specialist Layout — للأطباء والمختبرات
 *
 * Roles المسموحة: specialist فقط
 * - patient يُحوّل لـ /dashboard
 * - admin يُحوّل لـ /admin
 */
export default async function SpecialistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession({
    allowedRoles: ['specialist'],
  });

  // 🔒 بوّابة الاعتماد: `requireSession` كان يقرأ `approval_status` ولا يفرضه،
  // فكان مختصٌّ **قيد المراجعة أو مرفوض** يفتح طابور الطلبات ويرى أسماء المرضى
  // وهواتفهم وعناوينهم وتفاصيلهم السريرية. الأفعال (قبول الطلب) كانت محميّة،
  // لكنّ **القراءة** لم تكن. نمنعها هنا لكل صفحات المختصّ دفعةً واحدة.
  const pathname = headers().get('x-pathname') ?? '';
  const isStatusPage =
    pathname.startsWith('/specialist/pending') ||
    pathname.startsWith('/specialist/rejected');

  if (!isStatusPage && session.profile.approval_status !== 'approved') {
    redirect(
      session.profile.approval_status === 'rejected'
        ? '/specialist/rejected'
        : '/specialist/pending'
    );
  }

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
