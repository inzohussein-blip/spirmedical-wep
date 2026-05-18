'use client';

import { useState, useTransition } from 'react';
import { createPrescription, deletePrescription } from './actions';
import { useConfirm } from '@/components/ui';
import {
  AlertTriangle, ClipboardList, Pill, Calendar, FileText, Trash2,
} from 'lucide-react';

interface Prescription {
  id: string;
  doctor_name: string;
  doctor_specialty: string | null;
  medication: string;
  dosage: string | null;
  frequency: string | null;
  duration_days: number | null;
  notes: string | null;
  prescribed_at: string;
}

export default function PrescriptionsClient({ prescriptions }: { prescriptions: Prescription[] }) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  function resetForm() {
    setDoctorName(''); setSpecialty(''); setMedication('');
    setDosage(''); setFreq(''); setDuration(''); setNotes('');
    setError('');
  }

  function handleSubmit() {
    setError('');
    if (!doctorName.trim()) { setError('أدخل اسم الطبيب'); return; }
    if (!medication.trim()) { setError('أدخل اسم الدواء'); return; }

    startTransition(async () => {
      const result = await createPrescription({
        doctor_name: doctorName.trim(),
        doctor_specialty: specialty.trim() || undefined,
        medication: medication.trim(),
        dosage: dosage.trim() || undefined,
        frequency: freq.trim() || undefined,
        duration_days: duration ? parseInt(duration) : undefined,
        notes: notes.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error || 'تعذّر إضافة الوصفة');
        return;
      }
      resetForm();
      setShowForm(false);
    });
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'حذف الوصفة',
      message: 'هل تريد حذف هذه الوصفة؟',
      variant: 'danger',
      confirmText: 'احذف',
    });
    if (!ok) return;
    startTransition(async () => {
      await deletePrescription(id);
    });
  }

  return (
    <>
      {!showForm ? (
        <button
          type="button"
          className="scr-empty-cta"
          style={{ display: 'block', width: '100%', marginTop: 16 }}
          onClick={() => setShowForm(true)}
        >
          + إضافة وصفة طبية
        </button>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 16, marginTop: 16 }}>
          <div className="scr-section-title" style={{ marginBottom: 12 }}>وصفة جديدة</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>الطبيب *</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="د. أحمد"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>الاختصاص</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="باطنية"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>الدواء *</label>
            <input
              type="text"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="مثال: Panadol 500mg"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>الجرعة</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="حبتان"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>التكرار</label>
              <input
                type="text"
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                placeholder="3 مرات"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>أيام</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="7"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="بعد الأكل"
              rows={2}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} strokeWidth={2.4} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSubmit} disabled={isPending} className="scr-empty-cta" style={{ flex: 1 }}>
              {isPending ? 'جارٍ الحفظ...' : 'حفظ الوصفة'}
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--white)', fontSize: 12, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {prescriptions.length === 0 ? (
        <div className="scr-empty" style={{ marginTop: 32 }}>
          <div className="scr-empty-icon" aria-hidden="true">
            <ClipboardList size={42} strokeWidth={1.5} />
          </div>
          <h2 className="scr-empty-title">لا توجد وصفات بعد</h2>
          <p className="scr-empty-desc">احتفظ بكل وصفاتك الطبية هنا للوصول السريع وتذكير الجرعات.</p>
        </div>
      ) : (
        <>
          <div className="scr-section-head" style={{ marginTop: 24 }}>
            <div className="scr-section-title">وصفاتك ({prescriptions.length})</div>
          </div>
          <div className="scr-list-stack">
            {prescriptions.map((p) => {
              const date = new Date(p.prescribed_at).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' });
              return (
                <article key={p.id} className="scr-list-item">
                  <div className="scr-list-item-icon" aria-hidden="true">
                    <Pill size={22} strokeWidth={2} />
                  </div>
                  <div className="scr-list-item-content">
                    <div className="scr-list-item-title">{p.medication}</div>
                    <div className="scr-list-item-subtitle">
                      {p.doctor_name}{p.doctor_specialty ? ` · ${p.doctor_specialty}` : ''}
                    </div>
                    <div className="scr-list-item-meta">
                      {p.dosage && <span><Pill size={11} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} />{p.dosage}</span>}
                      {p.frequency && <span> · {p.frequency}</span>}
                      {p.duration_days && <span> · {p.duration_days} يوم</span>}
                    </div>
                    <div className="scr-list-item-meta">
                      <Calendar size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                      {date}
                    </div>
                    {p.notes && (
                      <div className="scr-list-item-meta" style={{ marginTop: 4, fontStyle: 'italic' }}>
                        <FileText size={12} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 2 }} />
                        {p.notes}
                      </div>
                    )}
                    <div className="scr-list-item-actions">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                        className="scr-action-btn"
                        style={{ color: 'var(--rose)' }}
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
      <ConfirmDialog />
    </>
  );
}
