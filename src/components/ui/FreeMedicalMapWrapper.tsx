'use client';

import dynamic from 'next/dynamic';
import type { FreeMedicalMapProps } from './FreeMedicalMap';

/**
 * ═══════════════════════════════════════════════════════════════
 * FreeMedicalMapWrapper — استدعاء آمن للخريطة من أي صفحة
 * ═══════════════════════════════════════════════════════════════
 *
 * هذا هو الـ wrapper الذي يجب أن تستخدمه في صفحاتك (Server أو Client):
 *   import { FreeMedicalMapWrapper } from '@/components/ui/FreeMedicalMapWrapper';
 *
 *   <FreeMedicalMapWrapper
 *     marker={{
 *       id: 'order-123',
 *       lat: 33.3152,
 *       lng: 44.3661,
 *       title: 'منزل المريض',
 *       subtitle: 'حي الكرادة، بغداد',
 *       variant: 'patient'
 *     }}
 *   />
 *
 * لماذا dynamic + ssr:false؟
 *   • Leaflet يعتمد على window و document
 *   • على السيرفر لا يوجد DOM → يفشل
 *   • dynamic({ ssr: false }) يجعل المكوّن يُحمَّل فقط في المتصفح
 *   • يظهر loading placeholder حتى التحميل
 * ═══════════════════════════════════════════════════════════════
 */

const FreeMedicalMap = dynamic(
  () =>
    import('./FreeMedicalMap').then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => <MapLoadingPlaceholder />,
  }
);

export function FreeMedicalMapWrapper(props: FreeMedicalMapProps) {
  return <FreeMedicalMap {...props} />;
}

/* ─── Loading placeholder ──────────────────────────────── */

function MapLoadingPlaceholder() {
  return (
    <div className="fm-loading">
      <div className="fm-loading-spinner" aria-hidden />
      <div className="fm-loading-text">جارٍ تحميل الخريطة...</div>

      <style jsx>{`
        .fm-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          height: 320px;
          background: var(--paper-3, #FAF6EB);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 12px;
          color: var(--ink-3, #6E7878);
        }
        .fm-loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--paper-2, #EDE6D3);
          border-top-color: var(--btn-primary-bg, #0E5C4D);
          border-radius: 50%;
          animation: fm-spin 0.8s linear infinite;
        }
        .fm-loading-text {
          font-size: 12px;
          font-weight: 700;
        }
        @keyframes fm-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Re-export types
export type { FreeMedicalMapProps } from './FreeMedicalMap';
