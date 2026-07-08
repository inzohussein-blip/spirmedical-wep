'use client';

// ═══════════════════════════════════════════════════════════════
// 🔎 صفحة البحث الموحّد (V27) — تستبدل مسار /search الميت الذي كان يعطي 404.
// تبحث فوراً (client-side) عبر كتالوج الخدمات والأدوات والفحوصات المخبرية،
// وتوجّه كل نتيجة إلى مسارها الحقيقي الموجود. لا اعتماد على قاعدة البيانات.
// ═══════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, X } from 'lucide-react';
import type { Icon as TablerIcon } from '@tabler/icons-react';
import {
  FEATURED_SERVICE,
  CORE_SERVICES,
  SMART_TOOLS,
  EMERGENCY_SERVICE,
} from '@/lib/services-v3';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';

type ResultKind = 'خدمة' | 'أداة' | 'فحص';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: ResultKind;
  color: string;
  softBg: string;
  Icon?: TablerIcon;
  emoji?: string;
  haystack: string;
}

// تطبيع عربي: أحرف صغيرة + إزالة التشكيل + توحيد الألف/الياء/الهمزة/التاء المربوطة.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْٰ]/g, '') // تشكيل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCatalog(): SearchItem[] {
  const services: SearchItem[] = [FEATURED_SERVICE, ...CORE_SERVICES].map((s) => ({
    id: `svc-${s.id}`,
    title: s.title,
    subtitle: s.description,
    href: s.route,
    kind: 'خدمة',
    color: s.color,
    softBg: s.softBg,
    Icon: s.icon,
    haystack: normalize(`${s.title} ${s.description}`),
  }));

  const tools: SearchItem[] = SMART_TOOLS.map((t) => ({
    id: `tool-${t.id}`,
    title: t.title,
    subtitle: t.description,
    href: t.route,
    kind: 'أداة',
    color: t.color,
    softBg: t.softBg,
    Icon: t.icon,
    haystack: normalize(`${t.title} ${t.description}`),
  }));

  const emergency: SearchItem = {
    id: `svc-${EMERGENCY_SERVICE.id}`,
    title: EMERGENCY_SERVICE.title,
    subtitle: EMERGENCY_SERVICE.description,
    href: EMERGENCY_SERVICE.route,
    kind: 'خدمة',
    color: EMERGENCY_SERVICE.color,
    softBg: EMERGENCY_SERVICE.softBg,
    Icon: EMERGENCY_SERVICE.icon,
    haystack: normalize(`${EMERGENCY_SERVICE.title} ${EMERGENCY_SERVICE.description} طوارئ اسعاف`),
  };

  const tests: SearchItem[] = BLOOD_TESTS.map((t) => ({
    id: `test-${t.id}`,
    title: t.nameAr,
    subtitle: t.description,
    href: `/appointments/new?service=blood-draw&test=${t.id}`,
    kind: 'فحص',
    color: '#EA4335',
    softBg: '#FCE8E6',
    emoji: t.emoji,
    haystack: normalize(`${t.nameAr} ${t.code} ${t.description} ${t.keywords.join(' ')}`),
  }));

  return [...services, emergency, ...tools, ...tests];
}

const KIND_ORDER: ResultKind[] = ['خدمة', 'فحص', 'أداة'];

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const catalog = useMemo(buildCatalog, []);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const terms = q.split(' ').filter(Boolean);
    return catalog.filter((item) => terms.every((t) => item.haystack.includes(t)));
  }, [catalog, query]);

  const grouped = useMemo(() => {
    const map = new Map<ResultKind, SearchItem[]>();
    for (const r of results) {
      const arr = map.get(r.kind) ?? [];
      arr.push(r);
      map.set(r.kind, arr);
    }
    return KIND_ORDER.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
  }, [results]);

  const trimmed = query.trim();

  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">البحث</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Search input */}
        <div className="scr-search" role="search" style={{ marginBottom: 16 }}>
          <div className="scr-search-icon" aria-hidden="true">⌕</div>
          <input
            type="search"
            autoFocus
            placeholder="ابحث عن خدمة، أو فحص، أو أداة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="البحث"
          />
          {trimmed.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="مسح"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4 }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* States */}
        {trimmed.length === 0 && (
          <p className="scr-page-subtitle" style={{ textAlign: 'center', marginTop: 40, color: 'var(--ink-3)' }}>
            اكتب للبحث في الخدمات والفحوصات والأدوات
          </p>
        )}

        {trimmed.length > 0 && results.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
            <p style={{ fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>
              لا نتائج لـ «{trimmed}»
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
              جرّب كلمة أخرى، أو تصفّح كل الخدمات
            </p>
            <button
              type="button"
              onClick={() => router.push('/services')}
              style={{
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                border: 'none',
                borderRadius: 12,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              تصفّح الخدمات
            </button>
          </div>
        )}

        {/* Results */}
        {grouped.map(([kind, items]) => (
          <section key={kind} style={{ marginBottom: 20 }}>
            <h2
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: 'var(--ink-3)',
                marginBottom: 8,
                paddingInlineStart: 4,
              }}
            >
              {kind === 'خدمة' ? 'الخدمات' : kind === 'فحص' ? 'الفحوصات المخبرية' : 'الأدوات'}{' '}
              <span style={{ opacity: 0.6 }}>({items.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="scr-list-item scr-list-item-clickable"
                  aria-label={item.title}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: item.softBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 22,
                    }}
                  >
                    {item.Icon ? <item.Icon size={22} color={item.color} /> : item.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--ink-3)" style={{ transform: 'scaleX(-1)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
