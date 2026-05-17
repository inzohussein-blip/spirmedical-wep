'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addPatientTag, removePatientTag, addPatientNote, deletePatientNote } from '../actions';
import { toggleSuspendUser } from '../../specialists/actions';

interface Tag { id: string; tag: string; color: string; }
interface Note {
  id: string; note: string;
  note_type: 'general' | 'warning' | 'vip' | 'follow_up';
  is_pinned: boolean;
  created_at: string;
  admin_name: string;
}

interface Props {
  patientId: string;
  tags: Tag[];
  notes: Note[];
  isSuspended: boolean;
}

const NOTE_TYPE_META = {
  general: { label: 'عام', icon: '📝', color: 'var(--paper-3)' },
  warning: { label: 'تحذير', icon: '⚠️', color: 'var(--rose-soft)' },
  vip: { label: 'VIP', icon: '⭐', color: 'var(--amber-soft, #F8E5C7)' },
  follow_up: { label: 'متابعة', icon: '🔔', color: 'var(--emerald-soft)' },
};

const SUGGESTED_TAGS = ['VIP', 'مزمن', 'دائم', 'حذر', 'حامل', 'كبير سن', 'طوارئ متكررة'];

export default function PatientCRMClient({ patientId, tags, notes, isSuspended }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  // Tags
  const [newTag, setNewTag] = useState('');

  // Notes
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'warning' | 'vip' | 'follow_up'>('general');
  const [isPinned, setIsPinned] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  function handleAddTag(tag?: string) {
    const value = (tag ?? newTag).trim();
    if (!value) return;
    setError('');
    startTransition(async () => {
      const result = await addPatientTag(patientId, value);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setNewTag('');
      router.refresh();
    });
  }

  function handleRemoveTag(tagId: string) {
    if (!confirm('حذف هذا التصنيف؟')) return;
    startTransition(async () => {
      await removePatientTag(tagId, patientId);
      router.refresh();
    });
  }

  function handleAddNote() {
    setError('');
    if (!newNote.trim()) return;
    startTransition(async () => {
      const result = await addPatientNote(patientId, newNote, noteType, isPinned);
      if (!result.ok) { setError(result.error || 'حدث خطأ'); return; }
      setNewNote('');
      setNoteType('general');
      setIsPinned(false);
      setShowNoteForm(false);
      router.refresh();
    });
  }

  function handleDeleteNote(noteId: string) {
    if (!confirm('حذف هذه الملاحظة؟')) return;
    startTransition(async () => {
      await deletePatientNote(noteId, patientId);
      router.refresh();
    });
  }

  function handleToggleSuspend() {
    const reason = isSuspended ? undefined : prompt('سبب التعليق؟');
    if (!isSuspended && !reason) return;
    if (!confirm(isSuspended ? 'إلغاء تعليق المريض؟' : 'تعليق المريض؟')) return;
    startTransition(async () => {
      await toggleSuspendUser(patientId, !isSuspended, reason ?? undefined);
      router.refresh();
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid var(--line)',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Tags */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px' }}>🏷️ التصنيفات</h3>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {tags.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>لا توجد تصنيفات</p>
          ) : (
            tags.map((t) => (
              <span key={t.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, padding: '4px 10px', borderRadius: 100,
                background: 'var(--paper-3)', color: 'var(--ink)', fontWeight: 700,
              }}>
                {t.tag}
                <button onClick={() => handleRemoveTag(t.id)} style={{
                  background: 'transparent', border: 0, cursor: 'pointer',
                  fontSize: 12, color: 'var(--rose)', padding: 0, marginRight: 2,
                }}>×</button>
              </span>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="تصنيف جديد..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={() => handleAddTag()} disabled={isPending || !newTag.trim()} style={{
            padding: '8px 14px', background: 'var(--emerald-deep)', color: '#fff',
            border: 0, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>+</button>
        </div>

        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>اقتراحات:</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {SUGGESTED_TAGS.filter((t) => !tags.find((tt) => tt.tag === t)).map((t) => (
            <button key={t} onClick={() => handleAddTag(t)} disabled={isPending} style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 100,
              background: 'transparent', border: '1px dashed var(--line)',
              color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'inherit',
            }}>+ {t}</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>📝 الملاحظات ({notes.length})</h3>
          {!showNoteForm && (
            <button onClick={() => setShowNoteForm(true)} style={{
              padding: '4px 10px', background: 'var(--emerald-soft)', color: 'var(--emerald-deep)',
              border: 0, borderRadius: 100, fontSize: 11, fontWeight: 800, cursor: 'pointer',
            }}>+ ملاحظة</button>
          )}
        </div>

        {showNoteForm && (
          <div style={{ background: 'var(--paper-3)', padding: 10, borderRadius: 10, marginBottom: 12 }}>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="اكتب ملاحظة..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <select value={noteType} onChange={(e) => setNoteType(e.target.value as never)} style={{ ...inputStyle, flex: 1 }}>
                {Object.entries(NOTE_TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '0 8px' }}>
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
                📌 تثبيت
              </label>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleAddNote} disabled={isPending || !newNote.trim()} style={{
                flex: 1, padding: '8px', background: 'var(--emerald-deep)', color: '#fff',
                border: 0, borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
              }}>حفظ</button>
              <button onClick={() => { setShowNoteForm(false); setNewNote(''); }} style={{
                padding: '8px 14px', background: 'transparent', border: '1px solid var(--line)',
                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>إلغاء</button>
            </div>
          </div>
        )}

        {notes.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>لا توجد ملاحظات</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.map((n) => {
              const meta = NOTE_TYPE_META[n.note_type];
              return (
                <div key={n.id} style={{
                  background: meta.color, padding: 10, borderRadius: 8,
                  borderRight: n.is_pinned ? '3px solid var(--amber)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)' }}>
                      {n.is_pinned && '📌 '}{meta.icon} {meta.label}
                    </span>
                    <button onClick={() => handleDeleteNote(n.id)} style={{
                      background: 'transparent', border: 0, color: 'var(--rose)',
                      cursor: 'pointer', fontSize: 11, padding: 0,
                    }}>🗑</button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.6 }}>{n.note}</p>
                  <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>
                    {n.admin_name} · {new Date(n.created_at).toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px' }}>⚙️ إجراءات</h3>
        {error && (
          <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            ⚠️ {error}
          </div>
        )}
        <button onClick={handleToggleSuspend} disabled={isPending} style={{
          width: '100%', padding: '10px',
          background: isSuspended ? 'var(--emerald-deep)' : 'var(--rose)',
          color: '#fff', border: 0, borderRadius: 10,
          fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {isSuspended ? '▶️ إلغاء تعليق المريض' : '⛔ تعليق المريض'}
        </button>
      </div>
    </div>
  );
}
