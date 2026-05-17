'use client';

import { useState, useTransition } from 'react';
import { updateMedicalInfo } from './actions';
import type { MedicalInfo } from './types';
import {
  User, Stethoscope, AlertTriangle, ScrollText, Droplet, Calendar,
  Ruler, Scale, Trash2, AlertCircle, CheckCircle2, Save, Lock,
} from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SEVERITY_LABEL: Record<string, string> = {
  mild: 'خفيف',
  moderate: 'متوسط',
  severe: 'شديد',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 13,
  fontFamily: 'inherit',
  background: 'var(--white)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--ink-3)',
  display: 'block',
  marginBottom: 4,
};

export default function MedicalRecordClient({ initial }: { initial: MedicalInfo }) {
  const [info, setInfo] = useState<MedicalInfo>(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'conditions' | 'allergies' | 'history'>('basic');

  function handleSave() {
    setError('');
    setSuccess(false);
    startTransition(async () => {
      const result = await updateMedicalInfo(info);
      if (!result.ok) {
        setError(result.error || 'تعذّر حفظ البيانات');
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  // ─── Chronic conditions ───
  function addCondition() {
    setInfo({ ...info, chronic_conditions: [...info.chronic_conditions, { name: '', since: '', severity: 'mild' }] });
  }
  function updateCondition(i: number, field: string, value: string) {
    const next = [...info.chronic_conditions];
    next[i] = { ...next[i], [field]: value };
    setInfo({ ...info, chronic_conditions: next });
  }
  function removeCondition(i: number) {
    setInfo({ ...info, chronic_conditions: info.chronic_conditions.filter((_, idx) => idx !== i) });
  }

  // ─── Allergies ───
  function addAllergy() {
    setInfo({ ...info, allergies: [...info.allergies, { name: '', reaction: '' }] });
  }
  function updateAllergy(i: number, field: string, value: string) {
    const next = [...info.allergies];
    next[i] = { ...next[i], [field]: value };
    setInfo({ ...info, allergies: next });
  }
  function removeAllergy(i: number) {
    setInfo({ ...info, allergies: info.allergies.filter((_, idx) => idx !== i) });
  }

  // ─── Surgeries ───
  function addSurgery() {
    setInfo({ ...info, past_surgeries: [...info.past_surgeries, { name: '', date: '', hospital: '' }] });
  }
  function updateSurgery(i: number, field: string, value: string) {
    const next = [...info.past_surgeries];
    next[i] = { ...next[i], [field]: value };
    setInfo({ ...info, past_surgeries: next });
  }
  function removeSurgery(i: number) {
    setInfo({ ...info, past_surgeries: info.past_surgeries.filter((_, idx) => idx !== i) });
  }

  // ─── Family history ───
  function addFamily() {
    setInfo({ ...info, family_history: [...info.family_history, { condition: '', relation: '' }] });
  }
  function updateFamily(i: number, field: string, value: string) {
    const next = [...info.family_history];
    next[i] = { ...next[i], [field]: value };
    setInfo({ ...info, family_history: next });
  }
  function removeFamily(i: number) {
    setInfo({ ...info, family_history: info.family_history.filter((_, idx) => idx !== i) });
  }

  return (
    <>
      {/* Tabs */}
      <div className="scr-pills" style={{ marginTop: 14 }}>
        <button type="button" onClick={() => setActiveTab('basic')} className={`scr-pill ${activeTab === 'basic' ? 'active' : ''}`}>
          <User size={13} strokeWidth={2.2} aria-hidden />
          <span>أساسي</span>
        </button>
        <button type="button" onClick={() => setActiveTab('conditions')} className={`scr-pill ${activeTab === 'conditions' ? 'active' : ''}`}>
          <Stethoscope size={13} strokeWidth={2.2} aria-hidden />
          <span>أمراض</span>
        </button>
        <button type="button" onClick={() => setActiveTab('allergies')} className={`scr-pill ${activeTab === 'allergies' ? 'active' : ''}`}>
          <AlertTriangle size={13} strokeWidth={2.2} aria-hidden />
          <span>حساسية</span>
        </button>
        <button type="button" onClick={() => setActiveTab('history')} className={`scr-pill ${activeTab === 'history' ? 'active' : ''}`}>
          <ScrollText size={13} strokeWidth={2.2} aria-hidden />
          <span>تاريخ</span>
        </button>
      </div>

      {/* Basic Info */}
      {activeTab === 'basic' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 14, marginTop: 8 }}>
          <div className="scr-section-title" style={{ marginBottom: 12 }}>المعلومات الأساسية</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>
                <Droplet size={11} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} fill="currentColor" />
                فصيلة الدم
              </label>
              <select value={info.blood_type || ''} onChange={(e) => setInfo({ ...info, blood_type: e.target.value })} style={inputStyle}>
                <option value="">—</option>
                {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                <Calendar size={11} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} />
                تاريخ الميلاد
              </label>
              <input
                type="date"
                value={info.birth_date || ''}
                onChange={(e) => setInfo({ ...info, birth_date: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>
                <Ruler size={11} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} />
                الطول (سم)
              </label>
              <input
                type="number"
                value={info.height_cm ?? ''}
                onChange={(e) => setInfo({ ...info, height_cm: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="175"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                <Scale size={11} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} />
                الوزن (كغم)
              </label>
              <input
                type="number"
                value={info.weight_kg ?? ''}
                onChange={(e) => setInfo({ ...info, weight_kg: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="70"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chronic Conditions */}
      {activeTab === 'conditions' && (
        <div style={{ marginTop: 8 }}>
          <div className="scr-section-head">
            <div className="scr-section-title">الأمراض المزمنة ({info.chronic_conditions.length})</div>
            <button type="button" onClick={addCondition} className="scr-section-link" style={{ background: 'transparent', border: 0, cursor: 'pointer', fontWeight: 800, color: 'var(--emerald)' }}>+ إضافة</button>
          </div>

          {info.chronic_conditions.length === 0 ? (
            <div className="scr-empty" style={{ padding: '20px 0' }}>
              <div className="scr-empty-icon" aria-hidden="true">
                <Stethoscope size={42} strokeWidth={1.5} />
              </div>
              <p className="scr-empty-desc">لا توجد أمراض مزمنة. اضغط &ldquo;+ إضافة&rdquo; لتسجيل واحد.</p>
            </div>
          ) : (
            <div className="scr-list-stack">
              {info.chronic_conditions.map((c, i) => (
                <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateCondition(i, 'name', e.target.value)}
                      placeholder="اسم المرض (مثال: السكري)"
                      style={inputStyle}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input
                        type="text"
                        value={c.since}
                        onChange={(e) => updateCondition(i, 'since', e.target.value)}
                        placeholder="منذ متى؟"
                        style={inputStyle}
                      />
                      <select value={c.severity} onChange={(e) => updateCondition(i, 'severity', e.target.value)} style={inputStyle}>
                        {Object.keys(SEVERITY_LABEL).map((s) => (
                          <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCondition(i)}
                      style={{ padding: '6px 10px', border: 0, borderRadius: 8, background: 'var(--rose-soft)', color: 'var(--rose)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      <Trash2 className="ml-1" style={{display:"inline-block",verticalAlign:"-2px",marginLeft:"2px"}} size={11} strokeWidth={2.2} />حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Allergies */}
      {activeTab === 'allergies' && (
        <div style={{ marginTop: 8 }}>
          <div className="scr-section-head">
            <div className="scr-section-title">الحساسية ({info.allergies.length})</div>
            <button type="button" onClick={addAllergy} className="scr-section-link" style={{ background: 'transparent', border: 0, cursor: 'pointer', fontWeight: 800, color: 'var(--emerald)' }}>+ إضافة</button>
          </div>

          {info.allergies.length === 0 ? (
            <div className="scr-empty" style={{ padding: '20px 0' }}>
              <div className="scr-empty-icon" aria-hidden="true">
                <AlertTriangle size={42} strokeWidth={1.5} />
              </div>
              <p className="scr-empty-desc">لا حساسية مسجّلة.</p>
            </div>
          ) : (
            <div className="scr-list-stack">
              {info.allergies.map((a, i) => (
                <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <input
                      type="text"
                      value={a.name}
                      onChange={(e) => updateAllergy(i, 'name', e.target.value)}
                      placeholder="اسم المسبب (مثال: البنسلين)"
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      value={a.reaction}
                      onChange={(e) => updateAllergy(i, 'reaction', e.target.value)}
                      placeholder="نوع التفاعل (مثال: طفح جلدي)"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() => removeAllergy(i)}
                      style={{ padding: '6px 10px', border: 0, borderRadius: 8, background: 'var(--rose-soft)', color: 'var(--rose)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      <Trash2 className="ml-1" style={{display:"inline-block",verticalAlign:"-2px",marginLeft:"2px"}} size={11} strokeWidth={2.2} />حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History (surgeries + family) */}
      {activeTab === 'history' && (
        <div style={{ marginTop: 8 }}>
          <div className="scr-section-head">
            <div className="scr-section-title">العمليات السابقة ({info.past_surgeries.length})</div>
            <button type="button" onClick={addSurgery} className="scr-section-link" style={{ background: 'transparent', border: 0, cursor: 'pointer', fontWeight: 800, color: 'var(--emerald)' }}>+ إضافة</button>
          </div>

          {info.past_surgeries.length === 0 ? (
            <div className="scr-empty" style={{ padding: '12px 0' }}>
              <p className="scr-empty-desc" style={{ fontSize: 11 }}>لا عمليات مسجّلة.</p>
            </div>
          ) : (
            <div className="scr-list-stack" style={{ marginBottom: 16 }}>
              {info.past_surgeries.map((s, i) => (
                <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <input type="text" value={s.name} onChange={(e) => updateSurgery(i, 'name', e.target.value)} placeholder="نوع العملية" style={inputStyle} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input type="date" value={s.date} onChange={(e) => updateSurgery(i, 'date', e.target.value)} style={inputStyle} />
                      <input type="text" value={s.hospital} onChange={(e) => updateSurgery(i, 'hospital', e.target.value)} placeholder="المستشفى" style={inputStyle} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSurgery(i)}
                      style={{ padding: '6px 10px', border: 0, borderRadius: 8, background: 'var(--rose-soft)', color: 'var(--rose)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      <Trash2 className="ml-1" style={{display:"inline-block",verticalAlign:"-2px",marginLeft:"2px"}} size={11} strokeWidth={2.2} />حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="scr-section-head">
            <div className="scr-section-title">التاريخ العائلي ({info.family_history.length})</div>
            <button type="button" onClick={addFamily} className="scr-section-link" style={{ background: 'transparent', border: 0, cursor: 'pointer', fontWeight: 800, color: 'var(--emerald)' }}>+ إضافة</button>
          </div>

          {info.family_history.length === 0 ? (
            <div className="scr-empty" style={{ padding: '12px 0' }}>
              <p className="scr-empty-desc" style={{ fontSize: 11 }}>لا تاريخ عائلي مسجّل.</p>
            </div>
          ) : (
            <div className="scr-list-stack">
              {info.family_history.map((f, i) => (
                <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input type="text" value={f.condition} onChange={(e) => updateFamily(i, 'condition', e.target.value)} placeholder="المرض" style={inputStyle} />
                    <input type="text" value={f.relation} onChange={(e) => updateFamily(i, 'relation', e.target.value)} placeholder="القرابة (مثال: الأب)" style={inputStyle} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFamily(i)}
                    style={{ marginTop: 8, padding: '6px 10px', border: 0, borderRadius: 8, background: 'var(--rose-soft)', color: 'var(--rose)', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    <Trash2 className="ml-1" style={{display:"inline-block",verticalAlign:"-2px",marginLeft:"2px"}} size={11} strokeWidth={2.2} />حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      {error && (
        <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} strokeWidth={2.4} />
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={14} strokeWidth={2.4} />
          تم حفظ السجل الطبي بنجاح
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="scr-empty-cta"
        style={{ width: '100%', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Save size={16} strokeWidth={2.2} />
        {isPending ? 'جارٍ الحفظ...' : 'حفظ السجل الطبي'}
      </button>

      <div className="scr-info-banner" style={{ marginTop: 12 }}>
        <Lock size={14} strokeWidth={2.2} aria-hidden />
        <span>كل بياناتك مُشفّرة. مرئية لك فقط (ولأي طبيب توافق على مشاركة سجلك معه).</span>
      </div>
    </>
  );
}
