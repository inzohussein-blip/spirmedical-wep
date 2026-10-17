import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ResetLoginPinButton from '@/app/admin/_components/ResetLoginPinButton';
import { isWaVerifyAvailable } from '@/lib/whatsapp/inbound-verify';
import { resetPinUrl } from '@/lib/whatsapp/share';

import { oneOfOr } from '@/lib/format/vocabulary';
import { toSpecialistType, SPECIALIST_META } from '@/lib/specialist-types';
import SpecialistActions from './SpecialistActions';
import { signedSpecialistDocs, SPECIALIST_DOC_FIELDS } from '@/lib/specialist-documents';
import { SITE_ORIGIN as SITE_URL } from '@/lib/seo/origin';

import EmojiIcon from '@/components/ui/EmojiIcon';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'تفاصيل الاختصاصي · إدارة',
};

const APPROVAL_STATUS = ['pending', 'approved', 'rejected'] as const;

export default async function SpecialistDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: specialist } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'specialist')
    .single();

  if (!specialist) notFound();

  // رابطُ استعادة الرمز عبر واتساب — حين يعمل التحقّقُ العكسيّ ويكون للحساب رقمٌ صالح
  const waResetUrl =
    specialist.phone && /^\+9647\d{9}$/.test(specialist.phone) && (await isWaVerifyAvailable().catch(() => false))
      ? resetPinUrl(SITE_URL, specialist.phone)
      : null;

  // إحصائيات
  const [{ count: totalOrders }, { count: completedOrders }, { data: ratings }] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('assigned_specialist_id', specialist.id),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('assigned_specialist_id', specialist.id).eq('status', 'completed'),
    supabase.from('ratings').select('overall_rating').eq('specialist_id', specialist.id),
  ]);

  // وثائقُ التسجيل بروابطَ موقّعة لساعة (حاويةٌ خاصّة — لا رابطَ عامّاً)
  const documents = await signedSpecialistDocs(specialist.id);

  const avgRating = ratings && ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length).toFixed(1)
    : '—';

  const specialistType = toSpecialistType(specialist.specialist_type);
  const meta = specialistType ? SPECIALIST_META[specialistType] : null;

  return (
    <>
      <Link href={specialist.approval_status === 'pending' ? '/admin/specialists/pending' : '/admin/specialists'} style={{
        fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none', marginBottom: 12, display: 'inline-block',
      }}>
        ← رجوع
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>

        {/* العمود الأيمن: المعلومات */}
        <div>
          {/* Profile Header */}
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: meta?.gradient ?? 'var(--paper-3)',
                color: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                flexShrink: 0,
              }}>
                <EmojiIcon e={meta?.icon ?? '⚕️'} />
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>
                  {specialist.full_name ?? 'بدون اسم'}
                </h1>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>
                  <EmojiIcon e={meta?.icon ?? '⚕️'} /> {meta ? meta.label : 'لم يحدد النوع'}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {/* Approval Status */}
                  <span style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 100,
                    background: specialist.approval_status === 'approved' ? 'var(--emerald-soft)' :
                               specialist.approval_status === 'rejected' ? 'var(--rose-soft)' :
                               'var(--amber-soft, #FEF7E0)',
                    color: specialist.approval_status === 'approved' ? 'var(--emerald-deep)' :
                           specialist.approval_status === 'rejected' ? 'var(--rose)' :
                           'var(--amber-deep, #6B3A08)',
                    fontWeight: 800,
                  }}>
                    {specialist.approval_status === 'approved' ? <><EmojiIcon e="✅" /> معتمد</> :
                     specialist.approval_status === 'rejected' ? '❌ مرفوض' :
                     <><EmojiIcon e="⏳" /> بانتظار الموافقة</>}
                  </span>

                  {specialist.is_suspended && (
                    <span style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 100,
                      background: 'var(--rose-soft)', color: 'var(--rose)', fontWeight: 800,
                    }}>
                      <EmojiIcon e="⛔" /> معلّق
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* المعلومات */}
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>المعلومات</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, fontSize: 13 }}>
              <InfoRow icon="📱" label="الهاتف" value={specialist.phone} dir="ltr" />
              <InfoRow icon="✉️" label="البريد" value={specialist.email ?? '—'} />
              <InfoRow icon="📍" label="المحافظة" value={specialist.governorate ?? '—'} />
              <InfoRow icon="📅" label="سنوات الخبرة" value={specialist.specialist_years_exp ? `${specialist.specialist_years_exp} سنة` : '—'} />
              <InfoRow icon="🕒" label="تاريخ التسجيل" value={new Date(specialist.created_at).toLocaleDateString('ar-IQ-u-nu-latn')} />
              <InfoRow icon="🌐" label="اللغات" value={(specialist.specialist_languages ?? []).join('، ') || '—'} />
            </div>

            {specialist.specialist_bio && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--paper-3)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 4 }}>السيرة الذاتية</div>
                <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.7 }}>{specialist.specialist_bio}</p>
              </div>
            )}

            {specialist.rejection_reason && (
              <div style={{ marginTop: 12, padding: 16, background: 'var(--rose-soft)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--rose)', marginBottom: 4 }}>سبب الرفض السابق</div>
                <p style={{ fontSize: 13, color: 'var(--rose)', margin: 0 }}>{specialist.rejection_reason}</p>
              </div>
            )}

            {specialist.admin_internal_notes && (
              <div style={{ marginTop: 12, padding: 16, background: 'var(--paper-3)', borderRadius: 10, borderRight: '3px solid var(--amber)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-3)', marginBottom: 4 }}>ملاحظات إدارية</div>
                <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.7 }}>{specialist.admin_internal_notes}</p>
              </div>
            )}
          </div>

          {/* الوثائق */}
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>وثائق التسجيل</h2>
            {!documents.some((d) => d.kind === 'id') && (
              <div style={{ padding: 12, background: 'var(--rose-soft)', color: 'var(--rose)', borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                <EmojiIcon e="⚠️" /> لم تُرفع {SPECIALIST_DOC_FIELDS.id.label} — اطلبها قبل الاعتماد.
              </div>
            )}
            {documents.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>لا وثائق.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {documents.map((d) => (
                  <div key={d.kind} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--paper-3)', borderRadius: 10 }}>
                    <span aria-hidden="true" style={{ fontSize: 20 }}>{d.type === 'application/pdf' ? '📄' : '🖼️'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{d.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{new Date(d.uploadedAt).toLocaleDateString('ar-IQ-u-nu-latn')}</div>
                    </div>
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: 'var(--emerald)', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>
                        عرض ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--rose)' }}>تعذّر الرابط</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* الإحصائيات */}
          <div style={{ background: 'var(--white)', borderRadius: 14, padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px' }}>الأداء</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <Stat label="إجمالي الطلبات" value={(totalOrders ?? 0).toString()} />
              <Stat label="المكتملة" value={(completedOrders ?? 0).toString()} />
              <Stat label="التقييم" value={avgRating} />
            </div>
          </div>
        </div>

        {/* العمود الأيسر: الإجراءات */}
        <div style={{ position: 'sticky', top: 24 }}>
          <SpecialistActions
            specialistId={specialist.id}
            approvalStatus={oneOfOr(APPROVAL_STATUS, specialist.approval_status, 'pending')}
            currentType={specialistType}
            isSuspended={specialist.is_suspended ?? false}
          />
          <ResetLoginPinButton
            userId={specialist.id}
            phone={specialist.phone}
            name={specialist.full_name}
            role={specialist.role}
            activationUrl={waResetUrl}
            loginUrl={`${SITE_URL}/login/phone`}
          />
        </div>

      </div>
    </>
  );
}

function InfoRow({ icon, label, value, dir }: { icon: string; label: string; value: string; dir?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 4 }}>
        <EmojiIcon e={icon} /> {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }} dir={dir}>{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--paper-3)', padding: 16, borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--emerald-deep)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
    </div>
  );
}
