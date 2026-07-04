'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Edit3, Trash2, Send, X, Save, Loader2, Search,
  MessageCircle, Smartphone, Bell, Mail, Calendar, Users,
  Eye, AlertTriangle,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { createCampaign, updateCampaign, deleteCampaign, sendCampaign } from './actions';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: 'whatsapp' | 'sms' | 'push' | 'email';
  target_segment: unknown;
  message_content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_for: string | null;
  sent_at: string | null;
  recipients_count: number;
  success_count: number;
  created_at: string;
}

interface Props {
  campaigns: Campaign[];
  totalUsers?: number;
}

const TYPE_META = {
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: '#25D366', emoji: '💬' },
  sms:      { icon: Smartphone,    label: 'SMS',     color: 'var(--emerald)', emoji: '📱' },
  push:     { icon: Bell,          label: 'Push',     color: 'var(--amber)',  emoji: '🔔' },
  email:    { icon: Mail,          label: 'Email',    color: '#534AB7',       emoji: '✉️' },
} as const;

const STATUS_META = {
  draft:     { label: 'مسودة',   color: 'var(--ink-3)',   bg: 'var(--paper-3)' },
  scheduled: { label: 'مجدول',   color: '#6B3A08',         bg: 'var(--amber-soft)' },
  sending:   { label: 'يُرسل',   color: '#6B3A08',         bg: 'var(--amber-soft)' },
  sent:      { label: 'أُرسل',   color: 'var(--emerald-deep)', bg: 'var(--emerald-soft)' },
  failed:    { label: 'فشل',     color: 'var(--rose)',     bg: 'var(--rose-soft)' },
} as const;

export default function CampaignsClient({ campaigns }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const s = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const st = !filterStatus || c.status === filterStatus;
      const t = !filterType || c.type === filterType;
      return s && st && t;
    });
  }, [campaigns, searchQuery, filterStatus, filterType]);

  const handleDelete = (c: Campaign) => {
    if (c.status === 'sent' || c.status === 'sending') {
      toast.error('لا يمكن حذف حملة قيد الإرسال أو مُرسلة');
      return;
    }
    if (!confirm(`حذف "${c.name}" نهائياً؟`)) return;
    startTransition(async () => {
      const r = await deleteCampaign(c.id);
      if (r.success) { toast.success('تم الحذف'); router.refresh(); }
      else toast.error(r.error || 'فشل');
    });
  };

  const handleSend = (c: Campaign) => {
    if (c.status === 'sent') {
      toast.info('الحملة مُرسلة بالفعل');
      return;
    }
    if (!confirm(`تأكيد إرسال "${c.name}" للمستهدفين الآن؟`)) return;
    startTransition(async () => {
      const r = await sendCampaign(c.id);
      if (r.success) {
        toast.success(`تم إرسال ${r.queued || 0} رسالة`);
        router.refresh();
      } else {
        toast.error(r.error || 'فشل الإرسال');
      }
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowModal(true); }}
          style={primaryBtn()}
        >
          <Plus size={16} /> حملة جديدة
        </button>

        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', insetInlineStart: 12, top: 12, color: 'var(--ink-3)' }} />
          <input
            type="search"
            placeholder="ابحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchStyle}
          />
        </div>

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
          <option value="">كل الأنواع</option>
          {Object.entries(TYPE_META).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Warning */}
      <div style={{
        background: 'var(--amber-soft)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        fontSize: 11,
        color: 'var(--ink-2)',
        display: 'flex',
        gap: 8,
      }}>
        <AlertTriangle size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>تنبيه:</strong> إرسال الحملات يستهلك رصيد WhatsApp/SMS.
          الـ Push notifications + Email مجانية. تأكد من الجمهور المستهدف قبل الإرسال.
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{
          padding: 40,
          textAlign: 'center',
          background: 'var(--white)',
          borderRadius: 12,
        }}>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {campaigns.length === 0 ? 'لم تُنشأ حملات بعد' : 'لا توجد نتائج'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((c) => {
            const typeMeta = TYPE_META[c.type];
            const statusMeta = STATUS_META[c.status];
            const TypeIcon = typeMeta.icon;

            return (
              <article
                key={c.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 14,
                  borderInlineStartWidth: 4,
                  borderInlineStartStyle: 'solid',
                  borderInlineStartColor: typeMeta.color,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: `${typeMeta.color}15`,
                      color: typeMeta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <TypeIcon size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                        {c.name}
                      </h3>
                      <span style={{
                        padding: '2px 6px',
                        background: statusMeta.bg,
                        color: statusMeta.color,
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 800,
                      }}>
                        {statusMeta.label}
                      </span>
                    </div>

                    {c.description && (
                      <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 6px' }}>
                        {c.description}
                      </p>
                    )}

                    <div style={{
                      fontSize: 11,
                      color: 'var(--ink-2)',
                      padding: 8,
                      background: 'var(--paper-3)',
                      borderRadius: 6,
                      marginBottom: 6,
                      lineHeight: 1.5,
                      maxHeight: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {c.message_content}
                    </div>

                    <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--ink-3)' }}>
                      <span>
                        <Users size={9} style={{ display: 'inline', verticalAlign: -1 }} />
                        {' '}{c.recipients_count} مستهدف
                      </span>
                      {c.success_count > 0 && (
                        <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                          ✓ {c.success_count} وصلت
                        </span>
                      )}
                      <span>
                        <Calendar size={9} style={{ display: 'inline', verticalAlign: -1 }} />
                        {' '}{new Date(c.created_at).toLocaleDateString('ar-IQ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {c.status === 'draft' || c.status === 'scheduled' ? (
                      <button
                        onClick={() => handleSend(c)}
                        disabled={isPending}
                        title="إرسال الآن"
                        style={{ ...iconBtn(), background: 'var(--emerald-soft)', color: 'var(--emerald)' }}
                      >
                        <Send size={12} />
                      </button>
                    ) : null}
                    <button
                      onClick={() => { setEditing(c); setShowModal(true); }}
                      disabled={c.status === 'sent' || c.status === 'sending'}
                      title="تعديل"
                      style={iconBtn()}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={isPending}
                      title="حذف"
                      style={{ ...iconBtn(), background: 'var(--rose-soft)', color: 'var(--rose)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showModal && (
        <CampaignModal
          editing={editing}
          isPending={isPending}
          startTransition={startTransition}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
function CampaignModal({
  editing, isPending, startTransition, onClose, onSaved,
}: {
  editing: Campaign | null;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [type, setType] = useState<Campaign['type']>(editing?.type ?? 'push');
  const [content, setContent] = useState(editing?.message_content ?? '');
  const [scheduledFor, setScheduledFor] = useState(
    editing?.scheduled_for ? editing.scheduled_for.slice(0, 16) : ''
  );

  // Target segment
  const initialSegment = editing?.target_segment as Record<string, unknown> | null;
  const [targetCity, setTargetCity] = useState((initialSegment?.city as string) ?? '');
  const [targetRole, setTargetRole] = useState((initialSegment?.role as string) ?? 'all');
  const [targetMinAge, setTargetMinAge] = useState<string>(
    initialSegment?.min_age ? String(initialSegment.min_age) : ''
  );
  const [targetMaxAge, setTargetMaxAge] = useState<string>(
    initialSegment?.max_age ? String(initialSegment.max_age) : ''
  );

  const charCount = content.length;
  const maxChars = type === 'sms' ? 160 : type === 'push' ? 200 : 1000;

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      toast.error('الاسم والمحتوى مطلوبان');
      return;
    }
    if (content.length > maxChars) {
      toast.error(`المحتوى أطول من المسموح (${maxChars} حرف)`);
      return;
    }

    startTransition(async () => {
      const segment: Record<string, unknown> = {};
      if (targetCity) segment.city = targetCity;
      if (targetRole !== 'all') segment.role = targetRole;
      if (targetMinAge) segment.min_age = parseInt(targetMinAge);
      if (targetMaxAge) segment.max_age = parseInt(targetMaxAge);

      const data = {
        name: name.trim(),
        description: description.trim() || null,
        type,
        message_content: content.trim(),
        target_segment: segment,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        status: (scheduledFor ? 'scheduled' : 'draft') as 'scheduled' | 'draft',
      };

      const result = editing
        ? await updateCampaign(editing.id, data)
        : await createCampaign(data);

      if (result.success) {
        toast.success(editing ? 'تم التحديث' : 'تم الإنشاء');
        onSaved();
      } else {
        toast.error(result.error || 'فشل');
      }
    });
  };

  return (
    <div style={modalOverlay()} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={modalContent()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>
            {editing ? 'تعديل حملة' : 'حملة جديدة'}
          </h3>
          <button onClick={onClose} aria-label="إغلاق" style={closeBtn()}><X size={16} /></button>
        </div>

        <Field label="اسم الحملة *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="حملة عيد الأم 2026"
            style={inputStyle}
          />
        </Field>

        <Field label="وصف">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف داخلي للإدارة"
            style={inputStyle}
          />
        </Field>

        <Field label="نوع الإرسال *">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {Object.entries(TYPE_META).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setType(k as Campaign['type'])}
                style={{
                  padding: '10px 6px',
                  background: type === k ? `${v.color}15` : 'var(--white)',
                  border: '1px solid',
                  borderColor: type === k ? v.color : 'var(--line)',
                  color: type === k ? v.color : 'var(--ink-2)',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 20 }}>{v.emoji}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label={`المحتوى * (${charCount}/${maxChars})`}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="نص الرسالة..."
            style={{
              ...inputStyle,
              resize: 'vertical',
              borderColor: charCount > maxChars ? 'var(--rose)' : 'var(--line)',
            }}
          />
        </Field>

        {/* Target segment */}
        <div style={{
          background: 'var(--paper-3)',
          padding: 12,
          borderRadius: 10,
          marginTop: 10,
          marginBottom: 12,
        }}>
          <h4 style={{
            fontSize: 12,
            fontWeight: 800,
            margin: '0 0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <Users size={14} />
            الجمهور المستهدف
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="المدينة">
              <select value={targetCity} onChange={(e) => setTargetCity(e.target.value)} style={inputStyle}>
                <option value="">الكل</option>
                <option value="بغداد">بغداد</option>
                <option value="البصرة">البصرة</option>
                <option value="الموصل">الموصل</option>
                <option value="النجف">النجف</option>
                <option value="كربلاء">كربلاء</option>
                <option value="أربيل">أربيل</option>
              </select>
            </Field>

            <Field label="الدور">
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} style={inputStyle}>
                <option value="all">الكل</option>
                <option value="patient">المرضى فقط</option>
                <option value="specialist">المختصين فقط</option>
              </select>
            </Field>

            <Field label="عمر من">
              <input
                type="number"
                value={targetMinAge}
                onChange={(e) => setTargetMinAge(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </Field>

            <Field label="عمر إلى">
              <input
                type="number"
                value={targetMaxAge}
                onChange={(e) => setTargetMaxAge(e.target.value)}
                placeholder="100"
                style={inputStyle}
              />
            </Field>
          </div>
        </div>

        <Field label="جدولة الإرسال (اختياري)">
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={secondaryBtn()}>إلغاء</button>
          <button onClick={handleSave} disabled={isPending} style={primaryBtnFull()}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editing ? 'حفظ' : 'إنشاء'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'var(--white)' };
const selectStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: 'var(--white)' };
const searchStyle: React.CSSProperties = { width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' };

function primaryBtn(): React.CSSProperties {
  return { padding: '10px 16px', background: 'var(--emerald)', color: 'var(--paper-3)', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 };
}
function primaryBtnFull(): React.CSSProperties { return { ...primaryBtn(), flex: 2, justifyContent: 'center', padding: 12 }; }
function secondaryBtn(): React.CSSProperties { return { flex: 1, padding: 12, background: 'var(--paper-3)', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }; }
function iconBtn(): React.CSSProperties { return { width: 28, height: 28, background: 'var(--paper-3)', color: 'var(--ink-2)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }; }
function closeBtn(): React.CSSProperties { return { width: 32, height: 32, background: 'var(--paper-3)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }; }
function modalOverlay(): React.CSSProperties { return { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }; }
function modalContent(): React.CSSProperties { return { background: 'var(--paper)', width: '100%', maxWidth: 600, borderRadius: 14, padding: 20, marginTop: 20 }; }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>{label}</label>
      {children}
    </div>
  );
}
