'use client';

// ════════════════════════════════════════════════════════════════════
// 📲 StandaloneAppGuard — فصل التطبيق عن التسويق في وضع التثبيت (PWA).
// ════════════════════════════════════════════════════════════════════
//
// الهدف: عند تثبيت التطبيق على الهاتف، يعمل **التطبيق فقط** — لا صفحات
// التسويق. يفتح الـ manifest على /app (الراوتر الذكي)، وهذا الحارس يضمن أنّ
// أي وصول لاحق (رابط، مشاركة، اختصار) لصفحة تسويقية داخل التطبيق المثبّت
// (display-mode: standalone) يُعاد فوراً إلى /app.
//
// في المتصفّح العادي (غير مثبّت) لا يفعل شيئاً — يبقى الموقع التسويقي عاماً.
// المسارات المشتركة (login/register/otp...) والمسارات داخل التطبيق لا تُمَسّ.

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// صفحات تسويقية بحتة تُبعَد عن التطبيق المثبّت. نستثني عمداً /legal لأنّ التطبيق
// نفسه يربطها (/legal/privacy|terms|disclaimer من الإعدادات/الموافقة/معالج الحجز)
// — فإبعادها يكسر صفحات قانونية مطلوبة داخل التطبيق.
const MARKETING_ONLY_PREFIXES = [
  '/about',
  '/blog',
  '/faq',
  '/contact',
  '/help',
  '/changelog',
  '/feedback',
  '/status',
];

function isMarketingOnlyPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return MARKETING_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export default function StandaloneAppGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay() && isMarketingOnlyPath(pathname)) {
      setRedirecting(true);
      router.replace('/app');
    }
  }, [pathname, router]);

  if (!redirecting) return null;

  // شاشة انتقال قصيرة (بدل وميض صفحة التسويق) بألوان التطبيق.
  return (
    <div
      role="status"
      aria-label="جارٍ فتح التطبيق"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4EFE2',
        color: '#0E5C4D',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(14, 92, 77, 0.2)',
          borderTopColor: '#0E5C4D',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
