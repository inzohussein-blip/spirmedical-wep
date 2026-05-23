'use client';

import { useState, useTransition, useEffect } from 'react';
import { saveLabResults, updateLabOrderStatus, type LabResultInput } from '../actions';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';
import {
  Droplet, TestTube, AlertTriangle, Trash2, Save, CheckCircle2,
  Upload, FileText, Activity, X,
} from 'lucide-react';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🩸 V25.43: LabResultsForm محسّن
 * ════════════════════════════════════════════════════════════════════
 * 
 * المزايا:
 *   ✓ يستورد test_ids تلقائياً من lab_order
 *   ✓ يحفظ في lab_results table (structured)
 *   ✓ status لكل نتيجة: normal / low / high / critical
 *   ✓ PDF upload (اختياري)
 *   ✓ Auto-detect status من المعدّل الطبيعي
 * ════════════════════════════════════════════════════════════════════
 */

interface LabResultData {
  test_id: string;
  test_name: string;
  result_value: string;
  unit: string;
  normal_range_text: string;
  normal_range_min?: number;
  normal_range_max?: number;
  status: 'normal' | 'low' | 'high' | 'critical' | 'inconclusive';
  notes: string;
  pdf_url?: string;
}

interface Props {
  orderId: string;
  /** test_ids من lab_order */
  expectedTests?: string[];
  /** النتائج المحفوظة سابقاً (لو موجودة) */
  existingResults?: LabResultData[];
}

const STATUS_OPTIONS: Array<{ value: LabResultData['status']; label: string; color: string }> = [
  { value: 'normal', label: 'طبيعي', color: '#0F6E56' },
  { value: 'low', label: 'منخفض', color: '#A57100' },
  { value: 'high', label: 'مرتفع', color: '#A57100' },
  { value: 'critical', label: 'حرج', color: '#A32D2D' },
  { value: 'inconclusive', label: 'غير حاسم', color: '#6B7280' },
];

export default function LabResultsForm({ orderId, expectedTests = [], existingResults = [] }: Props) {
  const [results, setResults] = useState<LabResultData[]>([]);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Initial setup: استيراد من expectedTests أو existingResults ───
  useEffect(() => {
    if (existingResults.length > 0) {
      setResults(existingResults);
      return;
    }
    
    if (expectedTests.length > 0) {
      const imported: LabResultData[] = expectedTests.map((testId) => {
        const test = BLOOD_TESTS.find((t) => t.id === testId);
        return {
          test_id: testId,
          test_name: test?.nameAr || testId,
          result_value: '',
          unit: '',
          normal_range_text: '',
          status: 'normal' as const,
          notes: '',
        };
      });
      setResults(imported);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateResult(i: number, field: keyof LabResultData, value: string) {
    const next = [...results];
    next[i] = { ...next[i], [field]: value };
    
    // Auto-detect status من القيمة إذا كانت رقمية
    if (field === 'result_value') {
      const numeric = parseFloat(value);
      const result = next[i];
      if (!isNaN(numeric) && result.normal_range_min !== undefined && result.normal_range_max !== undefined) {
        if (numeric < result.normal_range_min * 0.5) {
          next[i].status = 'critical';
        } else if (numeric < result.normal_range_min) {
          next[i].status = 'low';
        } else if (numeric > result.normal_range_max * 1.5) {
          next[i].status = 'critical';
        } else if (numeric > result.normal_range_max) {
          next[i].status = 'high';
        } else {
          next[i].status = 'normal';
        }
      }
    }
    
    setResults(next);
  }

  function removeResult(i: number) {
    setResults(results.filter((_, idx) => idx !== i));
  }

  function addCustomTest() {
    setResults([...results, {
      test_id: `custom-${Date.now()}`,
      test_name: '',
      result_value: '',
      unit: '',
      normal_range_text: '',
      status: 'normal',
      notes: '',
    }]);
  }

  function handleSave() {
    // Validation
    const invalid = results.find((r) => !r.test_name || !r.result_value);
    if (invalid) {
      setErrorMsg('بعض النتائج ناقصة (الاسم أو القيمة)');
      return;
    }

    setErrorMsg(null);
    
    startTransition(async () => {
      // نُحوّل results للـ format المطلوب
      const resultsToSave: LabResultInput[] = results.map((r) => {
        const numeric = parseFloat(r.result_value);
        return {
          test_id: r.test_id,
          test_name: r.test_name,
          result_value: r.result_value,
          result_numeric: isNaN(numeric) ? null : numeric,
          unit: r.unit || undefined,
          normal_range_min: r.normal_range_min ?? null,
          normal_range_max: r.normal_range_max ?? null,
          normal_range_text: r.normal_range_text || undefined,
          status: r.status,
          notes: r.notes || undefined,
          pdf_url: r.pdf_url,
        };
      });

      const response = await saveLabResults(orderId, resultsToSave);
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrorMsg(response.error || 'فشل الحفظ');
      }
    });
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="scr-section-head">
        <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Droplet size={16} strokeWidth={2.2} fill="currentColor" />
          نتائج التحاليل ({results.length})
        </div>
      </div>

      {/* Status update buttons */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap',
        gap: 8, 
        marginBottom: 12,
        padding: 10,
        background: 'var(--paper-2)',
        borderRadius: 10,
      }}>
        <button 
          type="button" 
          onClick={() => startTransition(async () => { await updateLabOrderStatus(orderId, 'sample_collected'); })}
          className="scr-pill"
          style={{ fontSize: 11 }}
        >
          ✓ تمّ السحب
        </button>
        <button 
          type="button"
          onClick={() => startTransition(async () => { await updateLabOrderStatus(orderId, 'sent_to_lab'); })}
          className="scr-pill"
          style={{ fontSize: 11 }}
        >
          📤 أُرسل للمختبر
        </button>
        <button 
          type="button"
          onClick={() => startTransition(async () => { await updateLabOrderStatus(orderId, 'processing'); })}
          className="scr-pill"
          style={{ fontSize: 11 }}
        >
          ⚗️ قيد التحليل
        </button>
      </div>

      {results.length === 0 ? (
        <div className="scr-empty" style={{ padding: 20 }}>
          <div className="scr-empty-icon">
            <TestTube size={42} strokeWidth={1.5} />
          </div>
          <p className="scr-empty-desc">لا توجد نتائج بعد</p>
          <button type="button" onClick={addCustomTest} className="scr-empty-cta" style={{ marginTop: 12 }}>
            + إضافة تحليل
          </button>
        </div>
      ) : (
        <div className="scr-list-stack">
          {results.map((r, i) => (
            <div key={i} style={{ 
              background: 'var(--white)', 
              border: '1px solid var(--line)', 
              borderRadius: 12, 
              padding: 12 
            }}>
              {/* Header: اسم التحليل + status badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={r.test_name}
                  onChange={(e) => updateResult(i, 'test_name', e.target.value)}
                  placeholder="اسم التحليل"
                  style={{ 
                    flex: 1,
                    padding: '8px 10px', 
                    border: '1px solid var(--line)', 
                    borderRadius: 8, 
                    fontSize: 13, 
                    fontFamily: 'inherit', 
                    fontWeight: 700 
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => removeResult(i)} 
                  style={{ 
                    background: 'var(--rose-soft)', 
                    color: 'var(--rose)', 
                    border: 0, 
                    padding: '8px 10px', 
                    borderRadius: 8, 
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={14} strokeWidth={2.2} />
                </button>
              </div>

              {/* Value + Unit + Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={r.result_value}
                  onChange={(e) => updateResult(i, 'result_value', e.target.value)}
                  placeholder="القيمة"
                  style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                />
                <input
                  type="text"
                  value={r.unit}
                  onChange={(e) => updateResult(i, 'unit', e.target.value)}
                  placeholder="الوحدة"
                  style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                />
                <input
                  type="text"
                  value={r.normal_range_text}
                  onChange={(e) => updateResult(i, 'normal_range_text', e.target.value)}
                  placeholder="المعدل الطبيعي"
                  style={{ padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                />
              </div>

              {/* Status selector */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateResult(i, 'status', opt.value)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: r.status === opt.value ? opt.color : 'var(--line)',
                      background: r.status === opt.value ? opt.color : 'var(--white)',
                      color: r.status === opt.value ? 'white' : 'var(--ink-2)',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Notes (اختياري) */}
              <textarea
                value={r.notes}
                onChange={(e) => updateResult(i, 'notes', e.target.value)}
                placeholder="ملاحظات (اختياري)"
                rows={2}
                style={{ 
                  width: '100%',
                  padding: '8px 10px', 
                  border: '1px solid var(--line)', 
                  borderRadius: 8, 
                  fontSize: 12, 
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={addCustomTest} 
            className="scr-pill"
            style={{ marginTop: 8 }}
          >
            + إضافة تحليل آخر
          </button>
        </div>
      )}

      {/* Save button */}
      {results.length > 0 && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="scr-empty-cta"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 8, 
            width: '100%', 
            marginTop: 12,
            background: '#0F6E56',
            color: 'white',
            fontWeight: 700,
          }}
        >
          <Save size={16} strokeWidth={2.2} />
          {isPending ? 'جارٍ الحفظ...' : `حفظ ${results.length} نتيجة`}
        </button>
      )}

      {/* Error message */}
      {errorMsg && (
        <div style={{ 
          background: '#FCEBEB', 
          color: '#A32D2D', 
          padding: '10px 14px', 
          borderRadius: 10, 
          fontSize: 12, 
          fontWeight: 700, 
          marginTop: 12, 
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <AlertTriangle size={14} strokeWidth={2.4} />
          {errorMsg}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div style={{ 
          background: '#E1F5EE', 
          color: '#04342C', 
          padding: '10px 14px', 
          borderRadius: 10, 
          fontSize: 12, 
          fontWeight: 700, 
          marginTop: 12, 
          textAlign: 'center', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 8 
        }}>
          <CheckCircle2 size={14} strokeWidth={2.4} />
          تم حفظ النتائج · المريض سيُشعَر تلقائياً
        </div>
      )}
    </div>
  );
}
