// ═══════════════════════════════════════════════════════════════
// 🧰 صفحة الأدوات الطبية الشاملة (V25.30)
// ═══════════════════════════════════════════════════════════════
// Index لكل الأدوات: حاسبة المخاطر، مدقّق الأعراض،
// الإسعافات الأولية، جدول التطعيمات، المحفظة
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الأدوات الطبية - Spir Medical',
  description: 'أدوات طبية مجانية: حاسبة المخاطر، مدقّق الأعراض، الإسعافات الأولية، جدول التطعيمات',
};

interface Tool {
  id: string;
  icon: string;
  title: string;
  desc: string;
  href: string;
  variant: 'emerald' | 'amber';
  badge?: string;
}

const ALL_TOOLS: Tool[] = [
  {
    id: 'risk-calculator',
    icon: '🧮',
    title: 'حاسبة المخاطر',
    desc: 'قيّم حالتك الصحية في ٣٠ ثانية',
    href: '/tools/risk-calculator',
    variant: 'emerald',
    badge: 'الأكثر استخداماً',
  },
  {
    id: 'symptom-checker',
    icon: '🩺',
    title: 'مدقّق الأعراض',
    desc: 'حدّد توجّهك الطبي المناسب',
    href: '/tools/symptom-checker',
    variant: 'amber',
  },
  {
    id: 'first-aid',
    icon: '🩹',
    title: 'الإسعافات الأولية',
    desc: 'دليل ١٠+ حالات إسعافية',
    href: '/tools/first-aid',
    variant: 'emerald',
  },
  {
    id: 'vaccinations',
    icon: '💉',
    title: 'جدول التطعيمات',
    desc: '١٨ لقاح حسب العمر',
    href: '/tools/vaccinations',
    variant: 'amber',
  },
  {
    id: 'wallet',
    icon: '💰',
    title: 'المحفظة الإلكترونية',
    desc: 'رصيدك · مكافآت · تاريخ',
    href: '/tools/wallet',
    variant: 'emerald',
    badge: 'جديد',
  },
];

export default function ToolsPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">الأدوات الطبية</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle" style={{ marginBottom: 16 }}>
          أدوات مجانية لمساعدتك في رعاية صحتك
        </p>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}>
          {ALL_TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className={`service-card service-${tool.variant}`}
              aria-label={tool.title}
            >
              {tool.badge && (
                <span style={{
                  position: 'absolute',
                  top: 8,
                  insetInlineEnd: 8,
                  fontSize: 9,
                  fontWeight: 900,
                  background: tool.variant === 'emerald' ? 'var(--amber)' : 'var(--emerald)',
                  color: 'var(--paper-3)',
                  padding: '2px 6px',
                  borderRadius: 100,
                }}>
                  {tool.badge}
                </span>
              )}

              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {tool.icon}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 900,
                marginBottom: 4,
                color: 'var(--ink)',
              }}>
                {tool.title}
              </div>
              <div style={{
                fontSize: 10,
                color: 'var(--ink-3)',
                lineHeight: 1.5,
              }}>
                {tool.desc}
              </div>
            </Link>
          ))}
        </div>

        {/* Tip */}
        <div style={{
          background: 'var(--paper-3)',
          borderRadius: 12,
          padding: 14,
          fontSize: 11,
          color: 'var(--ink-2)',
          lineHeight: 1.8,
        }}>
          ⚠️ <strong>تنبيه:</strong> الأدوات مساعِدة فقط ولا تُغني عن استشارة طبيب مختص.
          في حال الطوارئ يُرجى الاتصال بـ <Link href="/sos" style={{ color: 'var(--rose)', fontWeight: 800 }}>SOS</Link> فوراً.
        </div>
      </div>
    </main>
  );
}
