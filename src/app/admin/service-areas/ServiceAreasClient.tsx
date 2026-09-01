'use client';

import { useState, useTransition, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  approximateAreaKm2,
  MIN_VERTICES,
  type Ring,
  type ServiceArea,
} from '@/lib/service-areas';
import {
  createServiceArea,
  updateServiceArea,
  toggleServiceArea,
  deleteServiceArea,
} from './actions';

// الخريطة client-only: MapLibre يلمس `window` عند التحميل، وحزمتها كبيرة
// فلا تُدرج في حزمة الخادم ولا تُحمَّل قبل ظهور الصفحة.
const ServiceAreaMap = dynamic(() => import('./ServiceAreaMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 460, borderRadius: 12, display: 'grid', placeItems: 'center',
        background: '#F6F5F1', border: '1px solid var(--line, #DADCE0)',
        color: '#77756E', fontSize: 13,
      }}
    >
      تُحمَّل الخريطة…
    </div>
  ),
});

const PALETTE = ['var(--emerald-deep, #056559)', '#B45309', '#1D4ED8', '#9D174D', '#4D7C0F', '#6D28D9'];

interface Props {
  initialAreas: ServiceArea[];
}

export default function ServiceAreasClient({ initialAreas }: Props) {
  const [areas, setAreas] = useState<ServiceArea[]>(initialAreas);
  const [draft, setDraft] = useState<Ring>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // أثناء تعديل منطقة، لا تُرسم نسختُها المحفوظة خلف المسوّدة مضاعفةً
  const backdrop = useMemo(
    () => areas.filter((a) => a.id !== editingId),
    [areas, editingId]
  );

  const km2 = useMemo(() => approximateAreaKm2(draft), [draft]);
  const enough = draft.length >= MIN_VERTICES;

  function resetForm() {
    setDraft([]);
    setEditingId(null);
    setName('');
    setGovernorate('');
    setNotes('');
    setColor(PALETTE[0]);
  }

  function beginEdit(a: ServiceArea) {
    setEditingId(a.id);
    setDraft(a.polygon);
    setName(a.name_ar);
    setGovernorate(a.governorate ?? '');
    setNotes(a.notes ?? '');
    setColor(a.color);
    setMsg(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save() {
    if (!name.trim()) return setMsg({ kind: 'err', text: 'اسم المنطقة مطلوب' });
    if (!enough) {
      return setMsg({
        kind: 'err',
        text: `ارسم ${MIN_VERTICES} نقاطٍ على الأقل بالنقر على الخريطة`,
      });
    }

    startTransition(async () => {
      const payload = {
        name_ar: name,
        governorate: governorate || null,
        polygon: draft,
        color,
        notes: notes || null,
      };

      const res = editingId
        ? await updateServiceArea(editingId, payload)
        : await createServiceArea(payload);

      if (!res.ok) return setMsg({ kind: 'err', text: res.error ?? 'تعذّر الحفظ' });

      // نحدّث القائمة محلّياً كي لا ننتظر رحلةً ثانية للقاعدة
      if (editingId) {
        setAreas((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? { ...a, ...payload, polygon: draft, governorate: governorate || null, notes: notes || null }
              : a
          )
        );
        setMsg({ kind: 'ok', text: 'حُدّثت المنطقة' });
      } else {
        const id = (res as { id?: string }).id;
        if (id) {
          setAreas((prev) => [
            {
              id, name_ar: name.trim(), governorate: governorate || null,
              polygon: draft, color, is_active: true, notes: notes || null,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
        setMsg({ kind: 'ok', text: 'أُضيفت المنطقة' });
      }
      resetForm();
    });
  }

  function onToggle(a: ServiceArea) {
    startTransition(async () => {
      const res = await toggleServiceArea(a.id, !a.is_active);
      if (!res.ok) return setMsg({ kind: 'err', text: res.error ?? 'تعذّر التغيير' });
      setAreas((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, is_active: !a.is_active } : x))
      );
    });
  }

  function onDelete(a: ServiceArea) {
    if (!confirm(`حذف «${a.name_ar}» نهائياً؟`)) return;
    startTransition(async () => {
      const res = await deleteServiceArea(a.id);
      if (!res.ok) return setMsg({ kind: 'err', text: res.error ?? 'تعذّر الحذف' });
      setAreas((prev) => prev.filter((x) => x.id !== a.id));
      if (editingId === a.id) resetForm();
      setMsg({ kind: 'ok', text: 'حُذفت المنطقة' });
    });
  }

  const label: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700,
    color: 'var(--ink-2, #3C4043)', marginBottom: 4,
  };
  const input: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: 14,
    border: '1px solid var(--line, #DADCE0)', borderRadius: 8,
    background: 'var(--white, #fff)', minHeight: 44,
  };
  const btn: React.CSSProperties = {
    padding: '10px 16px', fontSize: 14, fontWeight: 800, borderRadius: 10,
    border: 'none', cursor: 'pointer', minHeight: 44,
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
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
          borderRadius: 10, fontSize: 13, color: '#324A63', lineHeight: 1.7,
        }}
      >
        انقر على الخريطة لإضافة نقطة، وانقر على نقطةٍ موجودة لحذفها. ثلاث نقاطٍ
        فأكثر تصنع منطقة. المناطق المحفوظة تظهر بخطٍّ متقطّع للسياق.
      </div>

      <ServiceAreaMap
        draft={draft}
        onDraftChange={setDraft}
        saved={backdrop}
        color={color}
      />

      <div
        style={{
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          fontSize: 13, color: 'var(--ink-2, #3C4043)',
        }}
      >
        <strong>{draft.length}</strong> نقطة
        {enough && <span>· ~{km2.toFixed(1)} كم²</span>}
        <button
          type="button"
          onClick={() => setDraft((d) => d.slice(0, -1))}
          disabled={draft.length === 0 || pending}
          style={{
            ...btn, background: 'var(--white, #fff)',
            border: '1px solid var(--line, #DADCE0)', color: 'var(--ink, #202124)',
            opacity: draft.length === 0 ? 0.5 : 1,
          }}
        >
          ↩︎ تراجع
        </button>
        <button
          type="button"
          onClick={() => setDraft([])}
          disabled={draft.length === 0 || pending}
          style={{
            ...btn, background: 'var(--white, #fff)',
            border: '1px solid var(--line, #DADCE0)', color: 'var(--ink, #202124)',
            opacity: draft.length === 0 ? 0.5 : 1,
          }}
        >
          ✕ مسح الرسم
        </button>
      </div>

      <div
        style={{
          display: 'grid', gap: 12, padding: 16,
          background: 'var(--white, #fff)',
          border: '1px solid var(--line, #DADCE0)', borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>
          {editingId ? '✏️ تعديل المنطقة' : '➕ منطقة جديدة'}
        </h2>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div>
            <label style={label} htmlFor="sa-name">اسم المنطقة *</label>
            <input
              id="sa-name" style={input} value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الكرادة"
            />
          </div>
          <div>
            <label style={label} htmlFor="sa-gov">المحافظة</label>
            <input
              id="sa-gov" style={input} value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              placeholder="مثال: بغداد"
            />
          </div>
        </div>

        <div>
          <label style={label} htmlFor="sa-notes">ملاحظات داخلية</label>
          <input
            id="sa-notes" style={input} value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="لا تظهر للمستخدمين"
          />
        </div>

        <div>
          <span style={label}>اللون</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {PALETTE.map((c) => (
              <button
                key={c} type="button" onClick={() => setColor(c)}
                aria-label={`اللون ${c}`} aria-pressed={color === c}
                style={{
                  width: 44, height: 44, borderRadius: 10, background: c,
                  border: color === c ? '3px solid var(--ink, #202124)' : '1px solid rgba(0,0,0,.15)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button" onClick={save} disabled={pending}
            style={{ ...btn, background: 'var(--emerald-deep, var(--emerald-deep, var(--emerald-deep, #056559)))', color: '#fff', opacity: pending ? 0.6 : 1 }}
          >
            {pending ? '…' : editingId ? 'حفظ التعديل' : 'حفظ المنطقة'}
          </button>
          {editingId && (
            <button
              type="button" onClick={resetForm} disabled={pending}
              style={{ ...btn, background: 'var(--white, #fff)', border: '1px solid var(--line, #DADCE0)', color: 'var(--ink, #202124)' }}
            >
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 10px' }}>
          المناطق المحفوظة ({areas.length})
        </h2>

        {areas.length === 0 ? (
          <p style={{ fontSize: 13, color: '#888780' }}>
            لا مناطق بعد. ارسم أوّل منطقةٍ على الخريطة أعلاه.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {areas.map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  padding: 12, background: 'var(--white, #fff)',
                  border: '1px solid var(--line, #DADCE0)', borderRadius: 10,
                  opacity: a.is_active ? 1 : 0.55,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 14, height: 14, borderRadius: 4, background: a.color, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{a.name_ar}</div>
                  <div style={{ fontSize: 12, color: '#888780' }}>
                    {a.governorate ? `${a.governorate} · ` : ''}
                    {a.polygon.length} نقطة
                    {!a.is_active && ' · معطّلة'}
                  </div>
                </div>
                <button
                  type="button" onClick={() => beginEdit(a)} disabled={pending}
                  style={{ ...btn, padding: '8px 12px', fontSize: 13, background: 'var(--white, #fff)', border: '1px solid var(--line, #DADCE0)', color: 'var(--ink, #202124)' }}
                >
                  تعديل
                </button>
                <button
                  type="button" onClick={() => onToggle(a)} disabled={pending}
                  style={{ ...btn, padding: '8px 12px', fontSize: 13, background: 'var(--white, #fff)', border: '1px solid var(--line, #DADCE0)', color: 'var(--ink, #202124)' }}
                >
                  {a.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
                <button
                  type="button" onClick={() => onDelete(a)} disabled={pending}
                  style={{ ...btn, padding: '8px 12px', fontSize: 13, background: '#FCEBEB', border: '1px solid #F5B4B4', color: '#791F1F' }}
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
