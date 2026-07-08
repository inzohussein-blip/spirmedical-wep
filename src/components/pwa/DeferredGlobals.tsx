'use client';

// ════════════════════════════════════════════════════════════════════
// ⏳ DeferredGlobals — تأجيل مكوّنات JS العامة غير الحرجة للرسم الأول.
// ════════════════════════════════════════════════════════════════════
//
// يُركّب مرّة واحدة في الجذر (src/app/layout.tsx). كل مكوّن هنا يُرجع null حتى
// يقرّر effect إظهاره (banner تحديث، حالة الشبكة، طلب تثبيت...)، فلا واجهة أوّلية
// ولا محتوى SSR. باستيرادها عبر next/dynamic({ ssr:false }) تخرج من حزمة الدخول
// الرئيسية وتُحمَّل في chunks غير متزامنة بعد الـ hydration → حزمة أولى أخفّ على
// كل صفحة (نفس مبدأ فصل CSS الخرائط، لكن على JS).
//
// ملاحظة: التقاط beforeinstallprompt يبقى في ServiceWorkerRegistrar الثابت
// (الجذر) لأنّ الحدث يُطلق مرّة واحدة مبكّراً؛ مكوّنات التثبيت هنا تقرأ من المتجر
// الموحّد (src/lib/pwa.ts) فيصحّ تأجيلها.

import dynamic from 'next/dynamic';

const SmartInstallPrompt = dynamic(() => import('./SmartInstallPrompt'), { ssr: false });
const IOSInstallPrompt = dynamic(() => import('./IOSInstallPrompt'), { ssr: false });
const SessionSync = dynamic(() => import('./SessionSync'), { ssr: false });
const SWUpdateBanner = dynamic(() => import('@/components/ui/SWUpdateBanner'), { ssr: false });
const NetworkStatusDetector = dynamic(() => import('@/components/ui/NetworkStatusDetector'), { ssr: false });
const WebVitalsReporter = dynamic(() => import('@/components/seo/WebVitalsReporter'), { ssr: false });
const PerformanceMonitor = dynamic(() => import('@/components/dev/PerformanceMonitor'), { ssr: false });

export default function DeferredGlobals() {
  return (
    <>
      <NetworkStatusDetector />
      <SWUpdateBanner />
      <SmartInstallPrompt />
      <IOSInstallPrompt />
      <SessionSync />
      <WebVitalsReporter />
      <PerformanceMonitor />
    </>
  );
}
