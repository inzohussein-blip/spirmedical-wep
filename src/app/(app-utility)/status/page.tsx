// ═══════════════════════════════════════════════════════════════
// 🟢 Status Page (V25.12)
// ═══════════════════════════════════════════════════════════════
// صفحة عامة تعرض حالة الخدمات في الوقت الحقيقي
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import StatusClient from './StatusClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'حالة الخدمات · سباير ميديكال',
  description: 'حالة جميع خدمات سباير ميديكال في الوقت الحقيقي',
};

export default function StatusPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">حالة الخدمات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          مراقبة مباشرة لكل خدمات Spir Medical
        </p>

        <StatusClient />

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
