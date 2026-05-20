// ═══════════════════════════════════════════════════════════════
// 📰 ما الجديد (V25.14) - عام
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  ArrowRight, Sparkles, Wrench, Bug,
  AlertTriangle, Calendar,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const metadata = {
  title: 'ما الجديد · سباير ميديكال',
  description: 'سجل التحديثات والميزات الجديدة في سباير ميديكال',
};

export default async function ChangelogPage() {
  const supabase = createClient();
  const { data: entries } = await supabase
    .from('changelog_entries')
    .select('*')
    .eq('is_published', true)
    .order('release_date', { ascending: false })
    .limit(30);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">ما الجديد</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          سجل التحديثات والميزات الجديدة
        </p>

        {!entries || entries.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon">
              <Sparkles size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد تحديثات بعد</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              ستظهر هنا التحديثات والميزات الجديدة
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {entries.map((entry, idx) => (
              <article
                key={entry.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: 16,
                  position: 'relative',
                  borderInlineStartWidth: 4,
                  borderInlineStartStyle: 'solid',
                  borderInlineStartColor: idx === 0 ? 'var(--emerald)' : 'var(--ink-3)',
                }}
              >
                {idx === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    insetInlineEnd: 12,
                    background: 'var(--emerald)',
                    color: 'var(--paper-3)',
                    padding: '2px 8px',
                    borderRadius: 100,
                    fontSize: 9,
                    fontWeight: 900,
                  }}>
                    الأحدث ✨
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                    {entry.title}
                  </h2>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: 'var(--ink-3)',
                  marginBottom: 12,
                }}>
                  <code style={{
                    background: 'var(--paper-3)',
                    padding: '1px 8px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}>
                    {entry.version}
                  </code>
                  <Calendar size={11} />
                  {new Date(entry.release_date).toLocaleDateString('ar-IQ', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </div>

                {entry.summary && (
                  <p style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    margin: '0 0 14px',
                    lineHeight: 1.7,
                  }}>
                    {entry.summary}
                  </p>
                )}

                {entry.features && entry.features.length > 0 && (
                  <Section
                    icon={<Sparkles size={14} color="var(--emerald)" />}
                    title="ميزات جديدة"
                    color="var(--emerald)"
                    items={entry.features}
                  />
                )}

                {entry.improvements && entry.improvements.length > 0 && (
                  <Section
                    icon={<Wrench size={14} color="var(--amber)" />}
                    title="تحسينات"
                    color="var(--amber)"
                    items={entry.improvements}
                  />
                )}

                {entry.fixes && entry.fixes.length > 0 && (
                  <Section
                    icon={<Bug size={14} color="var(--ink-2)" />}
                    title="إصلاحات"
                    color="var(--ink-2)"
                    items={entry.fixes}
                  />
                )}

                {entry.breaking_changes && entry.breaking_changes.length > 0 && (
                  <Section
                    icon={<AlertTriangle size={14} color="var(--rose)" />}
                    title="⚠️ تغييرات مهمّة"
                    color="var(--rose)"
                    items={entry.breaking_changes}
                  />
                )}
              </article>
            ))}
          </div>
        )}

        <div style={{
          marginTop: 24,
          padding: 14,
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--ink-2)',
        }}>
          💡 هل لديك اقتراح؟
          <Link
            href="/feedback"
            style={{ color: 'var(--emerald)', fontWeight: 800, marginInlineStart: 6 }}
          >
            شاركنا رأيك
          </Link>
        </div>

        <div style={{ height: 60 }} />
      </div>
    </main>
  );
}

function Section({ icon, title, color, items }: {
  icon: React.ReactNode;
  title: string;
  color: string;
  items: string[];
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h3 style={{
        fontSize: 12,
        fontWeight: 800,
        color,
        margin: '0 0 6px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {icon}
        {title}
      </h3>
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 12,
              color: 'var(--ink-2)',
              padding: '4px 0 4px 16px',
              position: 'relative',
              lineHeight: 1.6,
            }}
          >
            <span style={{
              position: 'absolute',
              insetInlineStart: 0,
              top: 4,
              color,
            }}>
              •
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
