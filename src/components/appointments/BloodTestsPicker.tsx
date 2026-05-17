'use client';

// ═══════════════════════════════════════════════════════════════════
// BloodTestsPicker - مكوّن اختيار التحاليل
// ═══════════════════════════════════════════════════════════════════
// يظهر داخل AppointmentWizard لما المستخدم يختار "سحب دم منزلي"
// - بحث ذكي بالاسم/الكود/الكلمات المفتاحية
// - باقات جاهزة (Bundles)
// - اختيار متعدد للتحاليل المفردة
// - حساب تلقائي للسعر والصيام والوقت المتوقّع
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Droplet, Sparkles, Wrench, Search, Lightbulb, Flame, Clock, Ban,
} from 'lucide-react';
import {
  BLOOD_TESTS,
  TEST_BUNDLES,
  TEST_CATEGORIES,
  type BloodTest,
  type TestBundle,
  type TestCategory,
  searchTests,
  needsFasting,
  longestResultTime,
  formatTestPrice,
  calculateBundleDiscount,
} from '@/lib/services/blood-tests-data';

export interface BloodTestsSelection {
  testIds: string[];          // التحاليل المختارة
  bundleId: string | null;    // باقة جاهزة (لو اختار وحدة)
  totalPrice: number;         // السعر النهائي
  needsFasting: boolean;
  fastingHours: number;
  resultTime: string;
}

interface Props {
  value: BloodTestsSelection;
  onChange: (sel: BloodTestsSelection) => void;
}

type Mode = 'bundles' | 'custom';

export default function BloodTestsPicker({ value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>(value.bundleId ? 'bundles' : 'custom');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | null>(null);

  // قائمة التحاليل المُفلترة (للبحث + الفئة)
  const filteredTests = useMemo(() => {
    let list = query.trim() ? searchTests(query) : BLOOD_TESTS;
    if (selectedCategory) {
      list = list.filter((t) => t.category === selectedCategory);
    }
    return list;
  }, [query, selectedCategory]);

  // التحاليل الشائعة فقط (للعرض الافتراضي)
  const popularTests = useMemo(
    () => BLOOD_TESTS.filter((t) => t.popular),
    []
  );

  // ─────────────────────────────────────────────────────────────────
  // اختيار باقة
  // ─────────────────────────────────────────────────────────────────
  const selectBundle = (bundle: TestBundle) => {
    const fasting = needsFasting(bundle.testIds);
    onChange({
      testIds: bundle.testIds,
      bundleId: bundle.id,
      totalPrice: bundle.price,
      needsFasting: fasting.required,
      fastingHours: fasting.hours,
      resultTime: longestResultTime(bundle.testIds),
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // تبديل تحليل مفرد (إضافة/حذف)
  // ─────────────────────────────────────────────────────────────────
  const toggleTest = (testId: string) => {
    let newIds: string[];
    if (value.testIds.includes(testId)) {
      newIds = value.testIds.filter((id) => id !== testId);
    } else {
      newIds = [...value.testIds, testId];
    }

    const { total } = calculateBundleDiscount(newIds);
    const fasting = needsFasting(newIds);

    onChange({
      testIds: newIds,
      bundleId: null, // إلغاء الباقة لو كان في وحدة
      totalPrice: total,
      needsFasting: fasting.required,
      fastingHours: fasting.hours,
      resultTime: newIds.length > 0 ? longestResultTime(newIds) : '',
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // مسح كل الاختيارات
  // ─────────────────────────────────────────────────────────────────
  const clearAll = () => {
    onChange({
      testIds: [],
      bundleId: null,
      totalPrice: 0,
      needsFasting: false,
      fastingHours: 0,
      resultTime: '',
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // حساب الخصم لعرض الـ subtotal/discount
  // ─────────────────────────────────────────────────────────────────
  const discountInfo = useMemo(() => {
    if (value.bundleId) {
      const bundle = TEST_BUNDLES.find((b) => b.id === value.bundleId);
      if (bundle) {
        const subtotal = bundle.testIds.reduce((sum, id) => {
          const t = BLOOD_TESTS.find((bt) => bt.id === id);
          return sum + (t?.price || 0);
        }, 0);
        return {
          subtotal,
          discount: subtotal - bundle.price,
          total: bundle.price,
          discountPercent: bundle.savePercent,
        };
      }
    }
    return calculateBundleDiscount(value.testIds);
  }, [value.testIds, value.bundleId]);

  return (
    <div className="bt-picker">
      {/* Header */}
      <div className="bt-header">
        <div className="bt-header-icon">
          <Droplet size={22} strokeWidth={2} fill="currentColor" />
        </div>
        <div>
          <h3>اختر التحاليل المطلوبة</h3>
          <p>+10 تحاليل شائعة · 3 باقات جاهزة بأسعار مخفّضة</p>
        </div>
      </div>

      {/* Mode toggle: Bundles vs Custom */}
      <div className="bt-mode-tabs">
        <button
          type="button"
          className={`bt-mode-tab ${mode === 'bundles' ? 'active' : ''}`}
          onClick={() => setMode('bundles')}
        >
          <Sparkles size={14} strokeWidth={2.2} aria-hidden />
          <span>باقات جاهزة</span>
        </button>
        <button
          type="button"
          className={`bt-mode-tab ${mode === 'custom' ? 'active' : ''}`}
          onClick={() => setMode('custom')}
        >
          <Wrench size={14} strokeWidth={2.2} aria-hidden />
          <span>اختيار حسب الرغبة</span>
        </button>
      </div>

      {/* ─── BUNDLES MODE ─── */}
      {mode === 'bundles' && (
        <div className="bt-bundles">
          {TEST_BUNDLES.map((bundle) => {
            const isSelected = value.bundleId === bundle.id;
            const testsInBundle = bundle.testIds
              .map((id) => BLOOD_TESTS.find((t) => t.id === id))
              .filter(Boolean);

            return (
              <button
                key={bundle.id}
                type="button"
                className={`bt-bundle-card ${isSelected ? 'selected' : ''}`}
                onClick={() => selectBundle(bundle)}
              >
                <div className="bt-bundle-top">
                  <div className="bt-bundle-emoji">{bundle.emoji}</div>
                  <div className="bt-bundle-info">
                    <div className="bt-bundle-head">
                      <h4>{bundle.nameAr}</h4>
                      {bundle.popular && <span className="bt-tag-pop">الأكثر طلباً</span>}
                    </div>
                    <p>{bundle.description}</p>
                  </div>
                  <div className="bt-bundle-radio">{isSelected ? '●' : '○'}</div>
                </div>

                <div className="bt-bundle-tests">
                  {testsInBundle.map((t) => (
                    <span key={t!.id} className="bt-chip">
                      {t!.code}
                    </span>
                  ))}
                </div>

                <div className="bt-bundle-footer">
                  <div className="bt-bundle-price">
                    <span className="bt-price-now">{formatTestPrice(bundle.price)}</span>
                    <span className="bt-save">وفّر {bundle.savePercent}%</span>
                  </div>
                  <span className="bt-bundle-forwhom">
                    <Lightbulb size={12} strokeWidth={2.2} aria-hidden />
                    <span>{bundle.forWhom}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── CUSTOM MODE ─── */}
      {mode === 'custom' && (
        <div className="bt-custom">
          {/* Search */}
          <div className="bt-search-wrap">
            <span className="bt-search-icon">
              <Search size={14} strokeWidth={2.4} aria-hidden />
            </span>
            <input
              type="search"
              className="bt-search"
              placeholder="ابحث: سكر، فيتامين د، كوليسترول..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="bt-search-clear"
                onClick={() => setQuery('')}
                aria-label="مسح"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="bt-categories">
            <button
              type="button"
              className={`bt-cat-pill ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              الكل
            </button>
            {(Object.entries(TEST_CATEGORIES) as [TestCategory, typeof TEST_CATEGORIES[TestCategory]][])
              .map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  className={`bt-cat-pill ${selectedCategory === key ? 'active' : ''}`}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === key ? null : key)
                  }
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
          </div>

          {/* Quick: Popular tests (when no query) */}
          {!query && !selectedCategory && (
            <div className="bt-popular-hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={14} strokeWidth={2.2} />
              الأكثر طلباً — ابدأ من هنا
            </div>
          )}

          {/* Tests grid */}
          {filteredTests.length === 0 ? (
            <div className="bt-empty">
              لم يُعثر على تحليل مطابق · جرّب كلمة أخرى
            </div>
          ) : (
            <div className="bt-tests-list">
              {filteredTests.map((test) => {
                const isSelected = value.testIds.includes(test.id);
                return (
                  <button
                    key={test.id}
                    type="button"
                    className={`bt-test-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleTest(test.id)}
                  >
                    <div className="bt-test-check">
                      {isSelected ? '✓' : ''}
                    </div>
                    <div className="bt-test-emoji">{test.emoji}</div>
                    <div className="bt-test-info">
                      <div className="bt-test-head">
                        <span className="bt-test-code">{test.code}</span>
                        <span className="bt-test-name">{test.nameAr}</span>
                        {test.popular && <span className="bt-tag-pop-sm">شائع</span>}
                      </div>
                      <p className="bt-test-desc">{test.description}</p>
                      <div className="bt-test-meta">
                        <span className="bt-test-price">{formatTestPrice(test.price)}</span>
                        <span className="bt-test-sep">·</span>
                        <span className="bt-test-time" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} strokeWidth={2.2} />
                          {test.resultTime}
                        </span>
                        {test.fastingRequired && (
                          <>
                            <span className="bt-test-sep">·</span>
                            <span className="bt-test-fast" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Ban size={11} strokeWidth={2.4} />
                              صيام {test.fastingHours}س
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Summary bar (الـ fixed sticky في الأسفل) ─── */}
      {(value.testIds.length > 0 || value.bundleId) && (
        <div className="bt-summary">
          <div className="bt-summary-top">
            <div>
              <strong>{value.testIds.length} تحليل مختار</strong>
              <div className="bt-summary-meta">
                {value.needsFasting && (
                  <span className="bt-summary-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Ban size={11} strokeWidth={2.4} />
                    صيام {value.fastingHours}س
                  </span>
                )}
                {value.resultTime && (
                  <span className="bt-summary-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} strokeWidth={2.2} />
                    النتيجة خلال {value.resultTime}
                  </span>
                )}
              </div>
            </div>
            <button type="button" onClick={clearAll} className="bt-clear-btn">
              مسح
            </button>
          </div>

          {discountInfo.discount > 0 && (
            <div className="bt-summary-discount">
              <span>المجموع: <s>{formatTestPrice(discountInfo.subtotal)}</s></span>
              <span className="bt-summary-save">
                خصم {discountInfo.discountPercent}% (-{formatTestPrice(discountInfo.discount)})
              </span>
            </div>
          )}

          <div className="bt-summary-total">
            <span>السعر الإجمالي</span>
            <strong>{formatTestPrice(value.totalPrice)}</strong>
          </div>

          <div className="bt-summary-note" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={12} strokeWidth={2.2} aria-hidden />
            السعر لا يشمل رسوم سحب الدم (15,000 د.ع تُضاف لاحقاً)
          </div>
        </div>
      )}

      <style jsx>{`
        .bt-picker {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Header */
        .bt-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: var(--white, #FFFFFF);
          border-radius: 14px;
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
        }
        .bt-header-icon {
          width: 44px;
          height: 44px;
          background: var(--rose-soft, #F0D7D8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .bt-header h3 {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 2px;
          color: var(--ink, #0F1A1C);
        }
        .bt-header p {
          font-size: 11px;
          color: var(--ink-3, #6E7878);
          margin: 0;
          line-height: 1.4;
        }

        /* Mode tabs */
        .bt-mode-tabs {
          display: flex;
          background: var(--paper-2, #EDE6D3);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }
        .bt-mode-tab {
          flex: 1;
          padding: 9px 12px;
          background: transparent;
          border: 0;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink-3, #6E7878);
          cursor: pointer;
          transition: all 0.15s;
        }
        .bt-mode-tab.active {
          background: var(--white, #FFFFFF);
          color: var(--ink, #0F1A1C);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        }

        /* === BUNDLES === */
        .bt-bundles {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bt-bundle-card {
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 14px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: right;
          width: 100%;
        }
        .bt-bundle-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px -8px rgba(0, 0, 0, 0.12);
        }
        .bt-bundle-card.selected {
          border-color: var(--emerald, #0E5C4D);
          background: var(--emerald-soft, #D9E5DF);
        }
        .bt-bundle-top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .bt-bundle-emoji {
          width: 42px;
          height: 42px;
          background: var(--paper-2, #EDE6D3);
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .bt-bundle-card.selected .bt-bundle-emoji {
          background: var(--white, #FFFFFF);
        }
        .bt-bundle-info { flex: 1; min-width: 0; }
        .bt-bundle-head {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .bt-bundle-head h4 {
          font-size: 13px;
          font-weight: 800;
          margin: 0;
        }
        .bt-bundle-info p {
          font-size: 11px;
          color: var(--ink-3, #6E7878);
          margin: 3px 0 0;
          line-height: 1.4;
        }
        .bt-bundle-radio {
          font-size: 18px;
          color: var(--ink-4, #A4ACAA);
          flex-shrink: 0;
        }
        .bt-bundle-card.selected .bt-bundle-radio {
          color: var(--emerald, #0E5C4D);
        }
        .bt-tag-pop {
          font-size: 9px;
          background: var(--amber, #B8540C);
          color: var(--paper-3, #FAF6EB);
          padding: 2px 6px;
          border-radius: 100px;
          font-weight: 800;
        }
        .bt-bundle-tests {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin: 10px 0;
        }
        .bt-chip {
          font-size: 10px;
          background: var(--paper-2, #EDE6D3);
          color: var(--ink-2, #1F2A2C);
          padding: 3px 8px;
          border-radius: 100px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }
        .bt-bundle-card.selected .bt-chip {
          background: var(--white, #FFFFFF);
        }
        .bt-bundle-footer {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 8px;
          border-top: 1px solid var(--line, rgba(15, 26, 28, 0.08));
        }
        .bt-bundle-price {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bt-price-now {
          font-size: 16px;
          font-weight: 800;
          color: var(--emerald, #0E5C4D);
          font-family: 'JetBrains Mono', monospace;
        }
        .bt-save {
          font-size: 10px;
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          padding: 2px 7px;
          border-radius: 100px;
          font-weight: 800;
        }
        .bt-bundle-forwhom {
          font-size: 10px;
          color: var(--ink-3, #6E7878);
        }

        /* === CUSTOM === */
        .bt-custom {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bt-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .bt-search-icon {
          position: absolute;
          right: 12px;
          font-size: 14px;
          color: var(--ink-3, #6E7878);
        }
        .bt-search {
          flex: 1;
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 12px;
          padding: 11px 38px 11px 14px;
          font-size: 13px;
          font-family: inherit;
          color: var(--ink, #0F1A1C);
          outline: none;
          transition: border-color 0.15s;
        }
        .bt-search:focus {
          border-color: var(--emerald, #0E5C4D);
        }
        .bt-search-clear {
          position: absolute;
          left: 10px;
          background: var(--paper-2, #EDE6D3);
          border: 0;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 11px;
          cursor: pointer;
          color: var(--ink-2, #1F2A2C);
        }
        .bt-categories {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          padding: 2px 0;
          scrollbar-width: none;
        }
        .bt-categories::-webkit-scrollbar { display: none; }
        .bt-cat-pill {
          background: var(--white, #FFFFFF);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 100px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .bt-cat-pill.active {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          border-color: var(--emerald, #0E5C4D);
        }
        .bt-popular-hint {
          font-size: 11px;
          color: var(--ink-3, #6E7878);
          padding: 4px 8px;
        }
        .bt-empty {
          padding: 24px;
          text-align: center;
          color: var(--ink-3, #6E7878);
          font-size: 12px;
          background: var(--paper-2, #EDE6D3);
          border-radius: 12px;
        }
        .bt-tests-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bt-test-card {
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 12px;
          padding: 11px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: right;
          width: 100%;
        }
        .bt-test-card:hover {
          background: var(--paper-3, #FAF6EB);
        }
        .bt-test-card.selected {
          border-color: var(--emerald, #0E5C4D);
          background: var(--emerald-soft, #D9E5DF);
        }
        .bt-test-check {
          width: 22px;
          height: 22px;
          background: var(--paper-2, #EDE6D3);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: var(--paper-3, #FAF6EB);
          flex-shrink: 0;
        }
        .bt-test-card.selected .bt-test-check {
          background: var(--emerald, #0E5C4D);
        }
        .bt-test-emoji {
          width: 38px;
          height: 38px;
          background: var(--paper-2, #EDE6D3);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .bt-test-info { flex: 1; min-width: 0; }
        .bt-test-head {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 3px;
        }
        .bt-test-code {
          font-size: 11px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
          color: var(--emerald, #0E5C4D);
          background: var(--emerald-soft, #D9E5DF);
          padding: 1px 6px;
          border-radius: 100px;
        }
        .bt-test-name {
          font-size: 13px;
          font-weight: 800;
          color: var(--ink, #0F1A1C);
        }
        .bt-tag-pop-sm {
          font-size: 9px;
          color: var(--amber, #B8540C);
          font-weight: 700;
        }
        .bt-test-desc {
          font-size: 10.5px;
          color: var(--ink-3, #6E7878);
          margin: 0 0 5px;
          line-height: 1.4;
        }
        .bt-test-meta {
          display: flex;
          gap: 5px;
          align-items: center;
          font-size: 10px;
          flex-wrap: wrap;
        }
        .bt-test-price {
          font-weight: 800;
          color: var(--emerald, #0E5C4D);
          font-family: 'JetBrains Mono', monospace;
        }
        .bt-test-sep { color: var(--ink-4, #A4ACAA); }
        .bt-test-time { color: var(--ink-3, #6E7878); }
        .bt-test-fast {
          color: var(--amber, #B8540C);
          font-weight: 700;
        }

        /* === SUMMARY === */
        .bt-summary {
          background: var(--emerald-deep, #073B30);
          color: var(--paper-3, #FAF6EB);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }
        .bt-summary-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }
        .bt-summary-top strong {
          font-size: 13px;
          font-weight: 800;
        }
        .bt-summary-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 6px;
        }
        .bt-summary-tag {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.1);
          padding: 3px 7px;
          border-radius: 100px;
          font-weight: 600;
        }
        .bt-clear-btn {
          background: rgba(255, 255, 255, 0.1);
          color: var(--paper-3, #FAF6EB);
          border: 0;
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }
        .bt-summary-discount {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          opacity: 0.9;
        }
        .bt-summary-discount s { opacity: 0.7; }
        .bt-summary-save {
          background: var(--amber, #B8540C);
          padding: 2px 8px;
          border-radius: 100px;
          font-weight: 700;
        }
        .bt-summary-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
        }
        .bt-summary-total span {
          font-size: 12px;
          font-weight: 600;
        }
        .bt-summary-total strong {
          font-size: 18px;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
        }
        .bt-summary-note {
          font-size: 10px;
          opacity: 0.75;
        }
      `}</style>
    </div>
  );
}
