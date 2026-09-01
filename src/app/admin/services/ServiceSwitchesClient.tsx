'use client';

import { useState, useTransition } from 'react';
import { setServiceEnabled } from './actions';

export interface Row {
  id: string;
  title: string;
  description: string;
  route: string;
  group: 'مميّزة' | 'خدمة' | 'أداة';
  isEnabled: boolean;
  note: string | null;
}

export default function ServiceSwitchesClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const offCount = rows.filter((r) => !r.isEnabled).length;

  function apply(row: Row, isEnabled: boolean, note: string | null) {
    startTransition(async () => {
      const res = await setServiceEnabled(row.id, isEnabled, note);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error ?? 'تعذّر الحفظ' });
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, isEnabled, note: note || null } : r))
      );
      setEditing(null);
      setMsg({
        kind: 'ok',
        text: isEnabled ? `شُغّلت «${row.title}»` : `أُطفئت «${row.title}» وتظهر «قريباً»`,
      });
    });
  }

  const btn: React.CSSProperties = {
    minHeight: 44, padding: '0 14px', fontSize: 13, fontWeight: 800,
    borderRadius: 10, cursor: 'pointer',
  };

  const groups: Row['group'][] = ['مميّزة', 'خدمة', 'أداة'];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {msg && (
        <div
          role="status"
          style={{
            padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: msg.kind === 'ok' ? '#E7F5EF' : '#FCEBEB',
            color: msg.kind === 'ok' ? '#0B5B45' : '#791F1F',
            border: `1px solid ${msg.kind === 'ok' ? '#B6E0CF' : '#F5B4B4'}`,
          }}
        >
          {msg.text}
        </div>
      )}

      <div
        style={{
          padding: '10px 14px', background: '#F3F6FA', border: '1px solid #D6E0EC',
          borderRadius: 10, fontSize: 13, color: '#324A63', lineHeight: 1.8,
        }}
      >
        الخدمة المطفأة <strong>تبقى ظاهرة</strong> في الشبكة بشارة «قريباً»، ولا
        تُفتح — لا بالنقر ولا بكتابة المسار. ويمكنك إضافة سببٍ يظهر للمستخدم
        مكان النصّ الافتراضيّ.
        {offCount > 0 && (
          <>
            {' '}
            <strong>مطفأةٌ الآن: {offCount}</strong>
          </>
        )}
      </div>

      {groups.map((g) => {
        const items = rows.filter((r) => r.group === g);
        if (!items.length) return null;
        return (
          <section key={g}>
            <h2 style={{ fontSize: 14, fontWeight: 900, margin: '0 0 8px' }}>
              {g === 'مميّزة' ? '⭐ الخدمة المميّزة' : g === 'خدمة' ? '🏥 الخدمات' : '🛠️ الأدوات'}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#888780' }}>
                {' '}({items.length})
              </span>
            </h2>

            <div style={{ display: 'grid', gap: 8 }}>
              {items.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 12, background: 'var(--white, #fff)',
                    border: '1px solid var(--line, #E8E6DE)', borderRadius: 10,
                    opacity: r.isEnabled ? 1 : 0.75,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                        background: r.isEnabled ? '#0F766E' : '#9AA0A6',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>
                        {r.title}
                        {!r.isEnabled && (
                          <span
                            style={{
                              marginInlineStart: 8, fontSize: 11, fontWeight: 700,
                              background: '#F1F3F4', color: '#5F6368',
                              padding: '2px 7px', borderRadius: 9999,
                            }}
                          >
                            قريباً
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#888780' }}>
                        {r.route}
                        {r.note ? ` · «${r.note}»` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => apply(r, !r.isEnabled, r.note)}
                      aria-pressed={!r.isEnabled}
                      style={{
                        ...btn,
                        background: r.isEnabled ? '#FCEBEB' : '#E7F5EF',
                        border: `1px solid ${r.isEnabled ? '#F5B4B4' : '#B6E0CF'}`,
                        color: r.isEnabled ? '#791F1F' : '#0B5B45',
                      }}
                    >
                      {r.isEnabled ? 'إطفاء' : 'تشغيل'}
                    </button>

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setEditing(editing === r.id ? null : r.id);
                        setDraftNote(r.note ?? '');
                      }}
                      style={{
                        ...btn, background: 'var(--white, #fff)',
                        border: '1px solid var(--line, #E8E6DE)', color: 'var(--ink, #26251F)',
                      }}
                    >
                      {r.note ? 'تعديل السبب' : 'إضافة سبب'}
                    </button>
                  </div>

                  {editing === r.id && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <input
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        maxLength={120}
                        placeholder="يظهر للمستخدم مكان النصّ الافتراضيّ — مثال: تعود الخدمة الأحد"
                        aria-label={`سبب إطفاء ${r.title}`}
                        style={{
                          flex: 1, minWidth: 220, minHeight: 44, padding: '10px 12px',
                          fontSize: 14, borderRadius: 8,
                          border: '1px solid var(--line, #E8E6DE)',
                        }}
                      />
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => apply(r, r.isEnabled, draftNote)}
                        style={{ ...btn, background: 'var(--emerald-deep, #0F766E)', color: '#fff', border: 'none' }}
                      >
                        حفظ
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
