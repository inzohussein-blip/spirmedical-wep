'use client';

/**
 * ═══════════════════════════════════════════════════════════════
 * Seed Data Manager — UI احترافي لإدارة البيانات الأولية
 * ═══════════════════════════════════════════════════════════════
 * 
 * ميزات:
 * - عرض ما هو متاح + ما هو موجود
 * - Selective seeding
 * - Live progress
 * - تقرير تفصيلي
 * - مقارنة قبل/بعد
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IconArrowRight,
  IconCheck,
  IconAlertTriangle,
  IconDatabase,
  IconRefresh,
  IconRocket,
  IconChecks,
} from '@tabler/icons-react';

interface CategoryInfo {
  key: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  available: number;
  existing: number;
}

interface SeedResult {
  category: string;
  label: string;
  attempted: number;
  inserted: number;
  skipped: number;
  errors: string[];
}

interface SeedResponse {
  success: boolean;
  summary?: {
    total_attempted: number;
    total_inserted: number;
    total_skipped: number;
    total_errors: number;
  };
  results?: SeedResult[];
  message?: string;
  error?: string;
}

export default function SeedManagerClient() {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<SeedResponse | null>(null);
  const [confirmMode, setConfirmMode] = useState(false);

  // ─── Load categories on mount ───
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seed');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  }

  function selectAll() {
    setSelected(new Set(categories.map((c) => c.key)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function executeSeed() {
    if (selected.size === 0) return;
    setSeeding(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: Array.from(selected),
          mode: 'insert',
        }),
      });
      const data = (await res.json()) as SeedResponse;
      setResult(data);
      
      // Reload categories to show updated counts
      if (data.success) {
        loadCategories();
      }
    } catch {
      setResult({ success: false, error: 'فشل الاتصال' });
    } finally {
      setSeeding(false);
      setConfirmMode(false);
    }
  }

  const totalSelected = Array.from(selected).reduce((sum, key) => {
    const cat = categories.find((c) => c.key === key);
    return sum + (cat?.available || 0);
  }, 0);

  const totalExisting = categories.reduce((sum, c) => sum + c.existing, 0);
  const totalAvailable = categories.reduce((sum, c) => sum + c.available, 0);

  // ─── Render ───────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100vh', padding: '20px 14px 80px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link
            href="/admin"
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--white)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', color: 'var(--ink)',
              border: '1px solid var(--line-2)',
            }}
          >
            <IconArrowRight size={18} stroke={1.75} style={{ transform: 'scaleX(-1)' }} />
          </Link>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              📦 إدارة البيانات الأولية
            </h1>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 0' }}>
              أضف مستشفيات وصيدليات وأطباء حقيقيين بضغطة واحدة
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div style={{
          background: 'linear-gradient(135deg, #01875F 0%, #073B30 100%)',
          color: 'var(--white)', borderRadius: 14,
          padding: 20, marginBottom: 20,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>متاح للإضافة</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{totalAvailable}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>موجود حالياً</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{totalExisting}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>سيُضاف</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{totalSelected}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={selectAll}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 600,
              background: 'var(--white)', color: 'var(--ink)',
              border: '1px solid var(--line-2)', borderRadius: 8, cursor: 'pointer',
            }}
          >
            ✓ اختيار الكل
          </button>
          <button
            type="button"
            onClick={deselectAll}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 600,
              background: 'var(--white)', color: 'var(--ink-3)',
              border: '1px solid var(--line-2)', borderRadius: 8, cursor: 'pointer',
            }}
          >
            ✗ إلغاء الكل
          </button>
          <button
            type="button"
            onClick={loadCategories}
            disabled={loading}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 600,
              background: 'var(--white)', color: 'var(--ink-3)',
              border: '1px solid var(--line-2)', borderRadius: 8,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <IconRefresh size={14} stroke={1.75} />
            تحديث
          </button>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div style={{
            background: 'var(--white)', borderRadius: 12, padding: 40,
            textAlign: 'center', color: 'var(--ink-3)',
          }}>
            ⏳ جاري التحميل...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}>
            {categories.map((cat) => {
              const isSelected = selected.has(cat.key);
              const willAdd = cat.available;
              
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  style={{
                    background: 'var(--white)',
                    border: `2px solid ${isSelected ? cat.color : 'var(--line-2)'}`,
                    borderRadius: 12, padding: 16,
                    cursor: 'pointer', textAlign: 'right',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: cat.color + '20',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                      }}>
                        {cat.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                          {cat.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>
                          {cat.existing} موجود · {willAdd} متاح
                        </div>
                      </div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: isSelected ? cat.color : 'transparent',
                      border: `2px solid ${isSelected ? cat.color : 'var(--line-2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <IconCheck size={14} stroke={3} color="#fff" />}
                    </div>
                  </div>
                  <p style={{
                    fontSize: 11, color: 'var(--ink-3)', margin: 0,
                    lineHeight: 1.5, textAlign: 'right',
                  }}>
                    {cat.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Action Bar */}
        {selected.size > 0 && !result && (
          <div style={{
            position: 'sticky', bottom: 16,
            background: 'var(--white)', borderRadius: 14,
            padding: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                {selected.size} category مُختارة
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                سيتم إضافة {totalSelected} سجل
              </div>
            </div>

            {!confirmMode ? (
              <button
                type="button"
                onClick={() => setConfirmMode(true)}
                style={{
                  padding: '12px 24px',
                  background: '#01875F', color: '#fff',
                  border: 0, borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <IconRocket size={18} stroke={1.75} />
                ابدأ Seed
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmMode(false)}
                  disabled={seeding}
                  style={{
                    padding: '12px 16px',
                    background: 'var(--white)', color: 'var(--ink-3)',
                    border: '1px solid var(--line-2)', borderRadius: 10,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={executeSeed}
                  disabled={seeding}
                  style={{
                    padding: '12px 24px',
                    background: seeding ? '#9AA0A6' : '#C71C56',
                    color: '#fff',
                    border: 0, borderRadius: 10,
                    fontSize: 13, fontWeight: 700,
                    cursor: seeding ? 'wait' : 'pointer',
                  }}
                >
                  {seeding ? '⏳ جاري الإدراج...' : '✓ تأكيد التنفيذ'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 20 }}>
            {result.success && result.summary ? (
              <div>
                {/* Success Summary */}
                <div style={{
                  background: '#E6F3EF',
                  border: '1px solid #01875F',
                  borderRadius: 14, padding: 20, marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <IconChecks size={28} stroke={2} color="#01875F" />
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#01875F', margin: 0 }}>
                        تم التنفيذ بنجاح!
                      </h2>
                      <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 0' }}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                  }}>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>المُحاول</div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{result.summary.total_attempted}</div>
                    </div>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: '#01875F' }}>تم الإدراج</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#01875F' }}>
                        {result.summary.total_inserted}
                      </div>
                    </div>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: '#B06000' }}>تم التخطّي</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#B06000' }}>
                        {result.summary.total_skipped}
                      </div>
                    </div>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: '#C71C56' }}>أخطاء</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#C71C56' }}>
                        {result.summary.total_errors}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-Category Results */}
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                  📊 التفاصيل
                </h3>
                {result.results?.map((r) => (
                  <div
                    key={r.category}
                    style={{
                      background: 'var(--white)', borderRadius: 10,
                      padding: 14, marginBottom: 8,
                      border: '1px solid var(--line-2)',
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{r.label}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                        <span style={{ color: '#01875F' }}>✓ {r.inserted} مُدرج</span>
                        {r.skipped > 0 && (
                          <span style={{ color: '#B06000' }}>⊘ {r.skipped} موجود</span>
                        )}
                        {r.errors.length > 0 && (
                          <span style={{ color: '#C71C56' }}>✗ {r.errors.length} خطأ</span>
                        )}
                      </div>
                    </div>
                    {r.errors.length > 0 && (
                      <div style={{
                        marginTop: 8, padding: 8,
                        background: '#FCE8E6', borderRadius: 6,
                        fontSize: 10, color: '#C71C56',
                      }}>
                        {r.errors.slice(0, 3).map((e, i) => (
                          <div key={i}>• {e}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* New Action */}
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setSelected(new Set());
                  }}
                  style={{
                    marginTop: 16, padding: '12px 24px',
                    background: '#01875F', color: '#fff',
                    border: 0, borderRadius: 10,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  تنفيذ Seed آخر
                </button>
              </div>
            ) : (
              <div style={{
                background: '#FCE8E6',
                border: '1px solid #C71C56',
                borderRadius: 12, padding: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IconAlertTriangle size={24} stroke={2} color="#C71C56" />
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#C71C56', margin: 0 }}>
                      فشل التنفيذ
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--ink)', margin: '4px 0 0' }}>
                      {result.error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info card */}
        {!result && (
          <div style={{
            background: 'var(--white)', borderRadius: 12, padding: 14,
            border: '1px solid var(--line-2)', marginTop: 20,
            display: 'flex', gap: 10,
          }}>
            <IconDatabase size={20} stroke={1.75} color="var(--ink-3)" />
            <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--ink)' }}>كيف يعمل النظام:</strong>
              <ul style={{ margin: '4px 0 0', padding: '0 18px 0 0' }}>
                <li>تختار الـ categories التي تريد إضافتها</li>
                <li>النظام يفحص الموجود ويتجاوز المُكرّر تلقائياً</li>
                <li>يُدرج فقط السجلات الجديدة (آمن للتنفيذ المتعدّد)</li>
                <li>كل عملية يتم تسجيلها في الـ audit log</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
