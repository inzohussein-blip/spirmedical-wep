'use client';

import { useMemo, useState, useTransition } from 'react';
import { Panel, StatCard, StatGrid, StatusPill } from '@/components/admin-ui';
import { SPECIALIST_META, type SpecialistType } from '@/lib/specialist-types';
import { DISPLAY_LOCALE } from '@/lib/format/locale';
import { assignFromDispatch } from './actions';

interface Point { lat: number; lng: number }
export interface Board {
  sla_minutes: number;
  open: { id: string; service_type: string; required_type: string; address: string; scheduled_at: string; created_at: string; age_minutes: number; location: Point | null }[];
  active: { id: string; status: string; service_type: string; required_type: string; address: string; scheduled_at: string; specialist_id: string | null; specialist_name: string | null }[];
  specialists: { id: string; name: string | null; type: string; phone: string; online: boolean; last_seen: string | null; location: Point | null; active_orders: number }[];
}

/** المسافة بالكيلومتر (هافرساين) — لترتيب المرشّحين الأقرب أوّلاً */
function km(a: Point, b: Point): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const n = (v: number) => v.toLocaleString(DISPLAY_LOCALE);
const time = (iso: string) => new Date(iso).toLocaleString(DISPLAY_LOCALE, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const typeLabel = (t: string) => SPECIALIST_META[t as SpecialistType]?.label ?? t;

export default function DispatchBoard({ board }: { board: Board }) {
  const late = board.open.filter((o) => o.age_minutes > board.sla_minutes).length;
  const online = board.specialists.filter((s) => s.online).length;

  return (
    <>
      <StatGrid min={150}>
        <StatCard icon="orders" label="بانتظار مختص" value={n(board.open.length)} tone={board.open.length ? 'amber' : undefined} />
        <StatCard icon="emergency" label={`متأخّرة > ${n(board.sla_minutes)} د`} value={n(late)} tone={late ? 'rose' : undefined} />
        <StatCard icon="specialists" label="جارية الآن" value={n(board.active.length)} />
        <StatCard icon="nurses" label="مختصّون متاحون" value={`${n(online)} / ${n(board.specialists.length)}`} tone={online ? 'brand' : 'rose'} />
      </StatGrid>

      <Panel title="تنتظر مختصّاً" icon="orders">
        {board.open.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--ink-3)', fontSize: 14 }}>لا طلبات تنتظر — كلُّها مُسنَدة.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {board.open.map((o) => (
              <OpenOrder key={o.id} order={o} sla={board.sla_minutes} specialists={board.specialists} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="جارية" icon="specialists" action={{ href: '/admin/orders', label: 'كلّ الطلبات' }}>
        {board.active.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--ink-3)', fontSize: 14 }}>لا طلبات جارية.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {board.active.map((o) => (
              <div key={o.id} className="dsp-row">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{o.service_type} · {o.specialist_name ?? '—'}</div>
                  <div className="dsp-sub">{time(o.scheduled_at)} · {o.address}</div>
                </div>
                <StatusPill status={o.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="المختصّون الميدانيّون" icon="nurses">
        <div style={{ display: 'grid', gap: 8 }}>
          {board.specialists.map((s) => (
            <div key={s.id} className="dsp-row">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>
                  <span aria-hidden className="dsp-dot" style={{ background: s.online ? '#34A853' : 'var(--line)' }} />
                  {s.name ?? '—'} · {typeLabel(s.type)}
                </div>
                <div className="dsp-sub">
                  {s.online ? 'متاح' : 'غير متاح'}
                  {s.last_seen ? ` · آخر ظهور ${time(s.last_seen)}` : ' · لم يستعمل التطبيق بعد'}
                  {` · ${n(s.active_orders)} جارية`}
                </div>
              </div>
              <a href={`tel:${s.phone}`} className="dsp-btn" aria-label={`اتصال بـ ${s.name ?? 'المختص'}`}>اتصال</a>
            </div>
          ))}
        </div>
      </Panel>

      <style>{`
        .dsp-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px solid var(--line-2, #E8EAED); border-radius: 12px; background: var(--white); }
        .dsp-sub { font-size: 12px; color: var(--ink-3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dsp-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-inline-end: 6px; vertical-align: middle; }
        .dsp-btn { flex: none; min-height: 40px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--white); font-weight: 700; font-size: 13px; color: var(--ink); display: inline-flex; align-items: center; text-decoration: none; cursor: pointer; }
        .dsp-btn-primary { background: var(--emerald-deep, #056559); color: #fff; border-color: transparent; }
        .dsp-select { min-height: 40px; min-width: 0; max-width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: 0 8px; font-size: 16px; background: var(--white); }
        @media (max-width: 700px) { .dsp-row { flex-wrap: wrap; } }
      `}</style>
    </>
  );
}

function OpenOrder({ order, sla, specialists }: { order: Board['open'][number]; sla: number; specialists: Board['specialists'] }) {
  // المرشّحون: النوعُ المطلوب، المتاحُ أوّلاً، ثمّ الأقربُ، ثمّ الأقلُّ حِملاً
  const candidates = useMemo(() => {
    return specialists
      .filter((s) => s.type === order.required_type)
      .map((s) => ({ ...s, dist: order.location && s.location ? km(order.location, s.location) : null }))
      .sort((a, b) => Number(b.online) - Number(a.online) || (a.dist ?? 1e9) - (b.dist ?? 1e9) || a.active_orders - b.active_orders);
  }, [specialists, order.required_type, order.location]);
  const [pick, setPick] = useState(candidates[0]?.id ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const late = order.age_minutes > sla;

  return (
    <div className="dsp-row" style={late ? { borderColor: 'var(--rose)', background: 'var(--rose-soft)' } : undefined}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700 }}>
          {order.service_type} · {typeLabel(order.required_type)}
        </div>
        <div className="dsp-sub">
          ينتظر منذ <b style={{ color: late ? 'var(--rose)' : undefined }}>{n(order.age_minutes)} دقيقة</b> · الموعد {time(order.scheduled_at)} · {order.address}
        </div>
        {msg && <div role="status" style={{ fontSize: 12, marginTop: 4, color: msg.startsWith('✓') ? 'var(--emerald-deep)' : 'var(--rose)' }}>{msg}</div>}
      </div>
      {candidates.length === 0 ? (
        <span style={{ fontSize: 12, color: 'var(--rose)' }}>لا مختصَّ معتمَداً من هذا النوع</span>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
          <select className="dsp-select" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="اختر المختص">
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.online ? '● ' : '○ '}
                {c.name ?? '—'}
                {c.dist !== null ? ` · ${c.dist.toFixed(1)} كم` : ''}
                {c.active_orders ? ` · ${c.active_orders} جارية` : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="dsp-btn dsp-btn-primary"
            disabled={pending || !pick}
            onClick={() =>
              start(async () => {
                setMsg(null);
                const r = await assignFromDispatch(order.id, pick);
                setMsg(r.ok ? '✓ أُسند — وصل الإشعار للمراجع والمختص' : r.error ?? 'تعذّر الإسناد');
              })
            }
          >
            {pending ? '…' : 'إسناد'}
          </button>
        </div>
      )}
    </div>
  );
}
