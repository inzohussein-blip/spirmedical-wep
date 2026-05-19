'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Plus, Edit3, Trash2, Users, X, Calendar,
  Phone, AlertCircle, Heart, Save, Loader2, ChevronLeft,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { addFamilyMember, updateFamilyMember, deleteFamilyMember } from './actions';

interface FamilyMember {
  id: string;
  full_name: string;
  relation: string;
  gender: 'male' | 'female' | null;
  date_of_birth: string | null;
  phone: string | null;
  blood_type: string | null;
  chronic_conditions: string[] | null;
  allergies: string[] | null;
  current_medications: string | null;
  notes: string | null;
  avatar_emoji: string;
}

const RELATIONS = [
  { id: 'spouse',      label: 'الزوج/الزوجة',  emoji: '💑' },
  { id: 'father',      label: 'الأب',           emoji: '👨' },
  { id: 'mother',      label: 'الأم',           emoji: '👩' },
  { id: 'son',         label: 'الابن',          emoji: '👦' },
  { id: 'daughter',    label: 'الابنة',         emoji: '👧' },
  { id: 'brother',     label: 'الأخ',           emoji: '🧑' },
  { id: 'sister',      label: 'الأخت',          emoji: '👩' },
  { id: 'grandfather', label: 'الجد',           emoji: '🧓' },
  { id: 'grandmother', label: 'الجدة',          emoji: '👵' },
  { id: 'other',       label: 'أخرى',           emoji: '👤' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface Props {
  members: FamilyMember[];
  appointmentsCounts: Record<string, { total: number; completed: number; pending: number }>;
}

export default function FamilyClient({ members, appointmentsCounts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);

  const handleDelete = (member: FamilyMember) => {
    if (!confirm(`هل تريد حذف "${member.full_name}" من قائمة العائلة؟`)) return;
    startTransition(async () => {
      const result = await deleteFamilyMember(member.id);
      if (result.success) {
        toast.success('تم الحذف');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل الحذف');
      }
    });
  };

  const calculateAge = (dob: string | null): string => {
    if (!dob) return '';
    const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (years < 1) return 'أقل من سنة';
    return `${years} سنة`;
  };

  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">العائلة</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          أضف أفراد عائلتك لتسجيل طلبات لهم
        </p>

        {/* Add button */}
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          style={{
            width: '100%',
            padding: 14,
            background: 'linear-gradient(135deg, var(--emerald), var(--emerald-deep))',
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 16,
          }}
        >
          <Plus size={16} />
          إضافة فرد عائلة
        </button>

        {/* List */}
        {members.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Users size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لم تُضف أحداً بعد</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              أضف زوجتك، والديك، أبناءك لتسجيل طلبات لهم بسهولة
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map((m) => {
              const counts = appointmentsCounts[m.id];
              const age = calculateAge(m.date_of_birth);
              const relMeta = RELATIONS.find(r => r.id === m.relation);

              return (
                <div
                  key={m.id}
                  style={{
                    background: 'var(--white)',
                    borderRadius: 14,
                    border: '1px solid var(--line)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'var(--paper-3)',
                        fontSize: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {m.avatar_emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>
                        {m.full_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        {relMeta?.label || m.relation}
                        {age && ` · ${age}`}
                        {m.blood_type && ` · ${m.blood_type}`}
                      </div>

                      {/* Quick stats */}
                      {counts && counts.total > 0 && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <span style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            background: 'var(--emerald-soft)',
                            color: 'var(--emerald)',
                            borderRadius: 6,
                            fontWeight: 700,
                          }}>
                            {counts.total} طلب
                          </span>
                          {counts.pending > 0 && (
                            <span style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              background: 'var(--amber-soft)',
                              color: 'var(--amber)',
                              borderRadius: 6,
                              fontWeight: 700,
                            }}>
                              {counts.pending} نشط
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(m);
                          setShowModal(true);
                        }}
                        aria-label="تعديل"
                        style={{
                          width: 32,
                          height: 32,
                          background: 'var(--paper-3)',
                          color: 'var(--ink-2)',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m)}
                        disabled={isPending}
                        aria-label="حذف"
                        style={{
                          width: 32,
                          height: 32,
                          background: 'var(--rose-soft)',
                          color: 'var(--rose)',
                          border: 'none',
                          borderRadius: 6,
                          cursor: isPending ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Health alerts */}
                  {(m.chronic_conditions?.length || m.allergies?.length) && (
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--amber-soft)',
                      borderTop: '1px solid var(--line)',
                      fontSize: 11,
                    }}>
                      {m.chronic_conditions && m.chronic_conditions.length > 0 && (
                        <div style={{ marginBottom: 4, color: 'var(--amber)' }}>
                          <Heart size={11} style={{ display: 'inline', verticalAlign: -1, marginInlineEnd: 4 }} />
                          أمراض مزمنة: {m.chronic_conditions.join('، ')}
                        </div>
                      )}
                      {m.allergies && m.allergies.length > 0 && (
                        <div style={{ color: 'var(--rose)' }}>
                          <AlertCircle size={11} style={{ display: 'inline', verticalAlign: -1, marginInlineEnd: 4 }} />
                          حساسية: {m.allergies.join('، ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick actions */}
                  <Link
                    href={`/appointments/new?family=${m.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--emerald-soft)',
                      color: 'var(--emerald)',
                      textDecoration: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <span>حجز خدمة لـ {m.full_name}</span>
                    <ChevronLeft size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <MemberModal
          editing={editing}
          isPending={isPending}
          startTransition={startTransition}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════
// Modal Component
// ═══════════════════════════════════════════════════════════════
function MemberModal({
  editing,
  isPending,
  startTransition,
  onClose,
  onSaved,
}: {
  editing: FamilyMember | null;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(editing?.full_name ?? '');
  const [relation, setRelation] = useState(editing?.relation ?? 'son');
  const [gender, setGender] = useState<'male' | 'female' | ''>(editing?.gender ?? '');
  const [dob, setDob] = useState(editing?.date_of_birth ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [bloodType, setBloodType] = useState(editing?.blood_type ?? '');
  const [chronicConditions, setChronicConditions] = useState(
    editing?.chronic_conditions?.join('، ') ?? ''
  );
  const [allergies, setAllergies] = useState(
    editing?.allergies?.join('، ') ?? ''
  );
  const [medications, setMedications] = useState(editing?.current_medications ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');

  const selectedRelation = RELATIONS.find(r => r.id === relation);

  // Auto-suggest emoji based on relation
  const avatarEmoji = editing?.avatar_emoji ?? selectedRelation?.emoji ?? '👤';

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }

    startTransition(async () => {
      const data = {
        full_name: fullName.trim(),
        relation,
        gender: gender || null,
        date_of_birth: dob || null,
        phone: phone.trim() || null,
        blood_type: bloodType || null,
        chronic_conditions: chronicConditions
          .split(/[،,]/)
          .map(s => s.trim())
          .filter(Boolean),
        allergies: allergies
          .split(/[،,]/)
          .map(s => s.trim())
          .filter(Boolean),
        current_medications: medications.trim() || null,
        notes: notes.trim() || null,
        avatar_emoji: avatarEmoji,
      };

      const result = editing
        ? await updateFamilyMember(editing.id, data)
        : await addFamilyMember(data);

      if (result.success) {
        toast.success(editing ? 'تم التحديث' : 'تمت الإضافة');
        onSaved();
      } else {
        toast.error(result.error || 'فشلت العملية');
      }
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          width: '100%',
          maxWidth: 500,
          maxHeight: '92vh',
          borderRadius: '20px 20px 0 0',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, flex: 1 }}>
            {editing ? 'تعديل فرد العائلة' : 'إضافة فرد عائلة'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: 32,
              height: 32,
              background: 'var(--paper-3)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 60 }}>
          {/* Relation picker */}
          <Label>صلة القرابة *</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
            {RELATIONS.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRelation(r.id)}
                style={{
                  padding: '10px 4px',
                  background: relation === r.id ? 'var(--emerald-soft)' : 'var(--white)',
                  border: '1px solid',
                  borderColor: relation === r.id ? 'var(--emerald)' : 'var(--line)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 18 }}>{r.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 700 }}>{r.label}</span>
              </button>
            ))}
          </div>

          {/* Name */}
          <Label>الاسم الكامل *</Label>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="مثلاً: محمد علي حسين"
            autoFocus
          />

          {/* Gender */}
          <Label>الجنس</Label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[
              { id: 'male', label: 'ذكر' },
              { id: 'female', label: 'أنثى' },
            ].map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGender(g.id as 'male' | 'female')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: gender === g.id ? 'var(--emerald)' : 'var(--white)',
                  color: gender === g.id ? 'var(--paper-3)' : 'var(--ink-2)',
                  border: '1px solid',
                  borderColor: gender === g.id ? 'var(--emerald)' : 'var(--line)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Date of birth */}
          <Label>تاريخ الميلاد</Label>
          <Input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />

          {/* Phone */}
          <Label>رقم الهاتف (اختياري)</Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XXXXXXXXX"
          />

          {/* Blood type */}
          <Label>فصيلة الدم</Label>
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setBloodType('')}
              style={{
                padding: '6px 12px',
                background: !bloodType ? 'var(--ink-2)' : 'var(--white)',
                color: !bloodType ? 'var(--paper-3)' : 'var(--ink-3)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              غير محدد
            </button>
            {BLOOD_TYPES.map(bt => (
              <button
                key={bt}
                type="button"
                onClick={() => setBloodType(bt)}
                style={{
                  padding: '6px 12px',
                  background: bloodType === bt ? 'var(--rose)' : 'var(--white)',
                  color: bloodType === bt ? 'var(--paper-3)' : 'var(--ink-2)',
                  border: '1px solid',
                  borderColor: bloodType === bt ? 'var(--rose)' : 'var(--line)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  fontWeight: 800,
                  minWidth: 42,
                }}
              >
                {bt}
              </button>
            ))}
          </div>

          {/* Chronic conditions */}
          <Label>أمراض مزمنة (اختياري)</Label>
          <Input
            type="text"
            value={chronicConditions}
            onChange={(e) => setChronicConditions(e.target.value)}
            placeholder="السكري، ضغط الدم (افصل بفاصلة)"
          />

          {/* Allergies */}
          <Label>حساسيات (اختياري)</Label>
          <Input
            type="text"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="البنسلين، الفول السوداني (افصل بفاصلة)"
          />

          {/* Current medications */}
          <Label>أدوية حالية (اختياري)</Label>
          <textarea
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            placeholder="مثلاً: Glucophage 500mg مرتين يومياً"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          {/* Notes */}
          <Label>ملاحظات إضافية (اختياري)</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي معلومات طبية مهمة"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Save button (fixed) */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          padding: 16,
          background: 'var(--paper)',
          borderTop: '1px solid var(--line)',
        }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{
              width: '100%',
              padding: 14,
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 12,
              cursor: isPending ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {isPending ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Save size={16} />
            )}
            {editing ? 'حفظ التغييرات' : 'إضافة'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      fontSize: 11,
      fontWeight: 800,
      color: 'var(--ink-3)',
      display: 'block',
      marginBottom: 4,
    }}>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--white)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 13,
  fontFamily: 'inherit',
  marginBottom: 12,
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />;
}
