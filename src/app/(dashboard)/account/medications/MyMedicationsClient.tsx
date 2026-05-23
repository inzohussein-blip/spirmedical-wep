'use client';

import { useState, useTransition } from 'react';
import { 
  Pill, Plus, Edit, Trash2, Power, X, Save, Bell, BellOff, 
  Clock, Calendar, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { 
  addUserMedication, removeUserMedication, toggleUserMedicationActive,
  type UserMedicationInput,
} from '@/app/(dashboard)/services/pharmacies/actions';

interface Medication {
  id: string;
  medication_id: string | null;
  custom_name: string | null;
  dosage: string | null;
  frequency: string | null;
  timing: string[] | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  is_chronic: boolean;
  is_active: boolean;
  enable_reminders: boolean;
  medications?: { name_ar: string; form: string | null; strength: string | null };
}

interface Props {
  medications: Medication[];
}

const TIMING_LABELS: Record<string, string> = {
  morning: 'صباحاً',
  noon: 'ظهراً',
  evening: 'مساءً',
  before_sleep: 'قبل النوم',
  with_food: 'مع الطعام',
};

export default function MyMedicationsClient({ medications }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleActive(id: string) {
    startTransition(async () => {
      await toggleUserMedicationActive(id);
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`حذف "${name}" من قائمتك؟`)) return;
    startTransition(async () => {
      const result = await removeUserMedication(id);
      if (result.ok) {
        setFeedback({ ok: true, msg: 'تم الحذف' });
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  return (
    <div>
      {/* Add button */}
      <button
        type="button"
        onClick={() => setShowAdd(true)}
        style={{
          width: '100%',
          padding: 12,
          background: '#0F6E56',
          color: 'white',
          border: 0,
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 16,
          marginBottom: 12,
        }}
      >
        <Plus size={18} strokeWidth={2.5} />
        أضف دواء جديد
      </button>

      {feedback && (
        <div style={{
          padding: '10px 14px',
          background: feedback.ok ? '#E1F5EE' : '#FCEBEB',
          color: feedback.ok ? '#04342C' : '#791F1F',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 12,
        }}>
          {feedback.msg}
        </div>
      )}

      {medications.length === 0 ? (
        <div className="scr-empty" style={{ marginTop: 24 }}>
          <div className="scr-empty-icon">
            <Pill size={42} strokeWidth={1.5} />
          </div>
          <h2 className="scr-empty-title">لا توجد أدوية محفوظة</h2>
          <p className="scr-empty-desc">
            احفظ أدويتك المعتادة للبحث السريع عنها في الصيدليات.
          </p>
        </div>
      ) : (
        <div className="scr-list-stack">
          {medications.map((med) => {
            const name = med.custom_name || med.medications?.name_ar || 'دواء';
            const subtitle = [
              med.dosage,
              med.frequency,
            ].filter(Boolean).join(' · ');
            
            return (
              <div 
                key={med.id} 
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 12,
                  opacity: med.is_active ? 1 : 0.55,
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: med.is_chronic ? '#FAEEDA' : '#E1F5EE',
                  color: med.is_chronic ? '#A57100' : '#0F6E56',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Pill size={20} strokeWidth={2.2} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                    {name}
                  </div>
                  {subtitle && (
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                      {subtitle}
                    </div>
                  )}
                  
                  {/* Timing badges */}
                  {med.timing && med.timing.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {med.timing.map((t) => (
                        <span 
                          key={t}
                          style={{
                            padding: '2px 6px',
                            background: 'var(--paper-2)',
                            borderRadius: 8,
                            fontSize: 10,
                            color: 'var(--ink-2)',
                            fontWeight: 600,
                          }}
                        >
                          {TIMING_LABELS[t] || t}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {med.is_chronic && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#FAEEDA',
                        color: '#412402',
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 700,
                      }}>
                        مزمن
                      </span>
                    )}
                    {med.enable_reminders && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#E1F5EE',
                        color: '#04342C',
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                      }}>
                        <Bell size={10} strokeWidth={2.5} />
                        تذكير
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(med.id)}
                    title={med.is_active ? 'إيقاف' : 'تفعيل'}
                    style={{
                      background: 'var(--paper-2)',
                      border: 0,
                      padding: 6,
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <Power size={12} strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(med.id, name)}
                    title="حذف"
                    style={{
                      background: '#FCEBEB',
                      color: '#A32D2D',
                      border: 0,
                      padding: 6,
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <AddMedicationModal 
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            setFeedback({ ok: true, msg: 'تمّت الإضافة' });
            setTimeout(() => setFeedback(null), 2000);
          }}
        />
      )}
    </div>
  );
}

// ─── Add Medication Modal ───
function AddMedicationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState<UserMedicationInput>({
    custom_name: '',
    dosage: '',
    frequency: '',
    timing: [],
    is_chronic: false,
    enable_reminders: false,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleTiming(t: string) {
    const current = formData.timing || [];
    setFormData({
      ...formData,
      timing: current.includes(t) ? current.filter((x) => x !== t) : [...current, t],
    });
  }

  function handleSave() {
    if (!formData.custom_name?.trim()) {
      setError('يرجى إدخال اسم الدواء');
      return;
    }
    setError(null);
    
    startTransition(async () => {
      const result = await addUserMedication(formData);
      if (result.ok) {
        onSaved();
      } else {
        setError(result.error || 'فشل الحفظ');
      }
    });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 440,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>إضافة دواء</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={inputLabelStyle}>اسم الدواء *</label>
            <input
              type="text"
              value={formData.custom_name || ''}
              onChange={(e) => setFormData({ ...formData, custom_name: e.target.value })}
              placeholder="مثال: بنادول 500mg"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={inputLabelStyle}>الجرعة</label>
              <input
                type="text"
                value={formData.dosage || ''}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="1 قرص"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={inputLabelStyle}>التكرار</label>
              <input
                type="text"
                value={formData.frequency || ''}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="3 مرات يومياً"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={inputLabelStyle}>أوقات الجرعات</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(TIMING_LABELS).map(([key, label]) => {
                const selected = formData.timing?.includes(key) || false;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleTiming(key)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: selected ? '#0F6E56' : 'var(--line)',
                      background: selected ? '#0F6E56' : 'var(--white)',
                      color: selected ? 'white' : 'var(--ink-2)',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={inputLabelStyle}>ملاحظات</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="ملاحظات إضافية..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 14, padding: 10, background: 'var(--paper-2)', borderRadius: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_chronic || false}
                onChange={(e) => setFormData({ ...formData, is_chronic: e.target.checked })}
              />
              مزمن
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.enable_reminders || false}
                onChange={(e) => setFormData({ ...formData, enable_reminders: e.target.checked })}
              />
              تفعيل التذكير
            </label>
          </div>
        </div>

        {error && (
          <div style={{
            padding: 10,
            background: '#FCEBEB',
            color: '#791F1F',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <AlertTriangle size={12} strokeWidth={2.5} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{
              flex: 1,
              padding: 12,
              background: '#0F6E56',
              color: 'white',
              border: 0,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Save size={14} strokeWidth={2.2} />
            {isPending ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              padding: '12px 20px',
              background: 'var(--paper-3)',
              color: 'var(--ink-2)',
              border: 0,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  border: '1px solid var(--line)',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
};

const inputLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--ink-2)',
  display: 'block',
  marginBottom: 4,
};
