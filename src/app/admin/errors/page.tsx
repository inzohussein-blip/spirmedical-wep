import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { DISPLAY_LOCALE } from '@/lib/format/locale';
import { DataTable, Icon, Panel, StatCard, StatGrid, StatusPill, type Tone } from '@/components/admin-ui';
import type { IconName } from '@/lib/icons';
import type { ErrorSource } from '@/lib/ops/system-errors';
import { getErrorsOverview, isErrorSource, type StatusFilter, type SystemErrorRow } from '@/lib/ops/errors-overview';
import { BulkActions, ResolveButton } from './ErrorActions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'رصد الأخطاء · إدارة' };

/**
 * 🚨 /admin/errors — رصدُ الأخطاء (0057، طلبُ المالك 18 تشرين الأول): أخطاءُ الخادم والسجلّ، وفشلٌ عند
 * المستخدمين في متصفّحاتهم، والكرون، وفشلُ البناء على Vercel وفحوصِ GitHub — مجمَّعةً بتكرارها، ومعها
 * فشلُ طابور الإشعارات. ما يُحلّ ثمّ يعود يُفتح وحده.
 */
const SOURCE_META: Record<ErrorSource, { label: string; icon: IconName; hint: string }> = {
  server: { label: 'الخادم', icon: 'errServer', hint: 'صفحةٌ أو إجراءٌ انهار' },
  log: { label: 'السجلّ', icon: 'errLog', hint: 'logger.error على الخادم' },
  client: { label: 'عند المستخدمين', icon: 'errClient', hint: 'خطأٌ في المتصفّح' },
  cron: { label: 'المهامّ المجدولة', icon: 'errCron', hint: 'كرونٌ فشل أو انهار' },
  build: { label: 'البناء والنشر', icon: 'errBuild', hint: 'Vercel' },
  ci: { label: 'فحوص GitHub', icon: 'errCi', hint: 'GitHub Actions' },
};

const LEVEL: Record<string, { label: string; tone: Tone }> = {
  fatal: { label: 'حرِج', tone: 'rose' },
  error: { label: 'خطأ', tone: 'amber' },
  warning: { label: 'تنبيه', tone: 'neutral' },
};

const STATUS_LABEL: Record<StatusFilter, string> = { open: 'مفتوحة', resolved: 'محلولة', all: 'الكلّ' };

const fmt = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat(DISPLAY_LOCALE, { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Baghdad' }).format(new Date(iso))
    : '—';

const detailOf = (r: SystemErrorRow) =>
  r.detail && typeof r.detail === 'object' && !Array.isArray(r.detail) ? (r.detail as Record<string, unknown>) : {};

/** رابطُ GitHub/Vercel للبناء والفحوص — https وحده */
const externalUrl = (r: SystemErrorRow) => {
  const u = detailOf(r).url;
  return typeof u === 'string' && /^https:\/\//.test(u) ? u : null;
};

export default async function ErrorsPage(props: { searchParams: Promise<{ source?: string; status?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!isAdminRole(profile?.role)) redirect('/admin');

  const sp = await props.searchParams;
  const source = isErrorSource(sp.source) ? sp.source : null;
  const status: StatusFilter = sp.status === 'resolved' || sp.status === 'all' ? sp.status : 'open';
  const o = await getErrorsOverview({ source, status });
  const totalOpen = Object.values(o.openBySource).reduce((a, b) => a + b, 0);
  const queueFailed = o.queue.reduce((a, g) => a + g.count, 0);

  const href = (next: { source?: ErrorSource | null; status?: StatusFilter }) => {
    const q = new URLSearchParams();
    const s = next.source === undefined ? source : next.source;
    const st = next.status ?? status;
    if (s) q.set('source', s);
    if (st !== 'open') q.set('status', st);
    const qs = q.toString();
    return `/admin/errors${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="err-page">
      <h1 className="err-title"><Icon name="errors" size={24} /> رصد الأخطاء</h1>
      <p className="err-sub">
        {totalOpen === 0 ? 'لا خطأَ مفتوحاً الآن.' : `${totalOpen} مفتوحاً · ${o.last24h} ظهر أو تكرّر في آخر 24 ساعة.`}
        {' '}الخطأُ المتكرّر صفٌّ واحد بعدد مرّاته، وما يُحلّ ثمّ يعود يُفتح وحده.
      </p>

      {o.failed && (
        <div className="err-alert" role="alert">تعذّرت قراءةُ سجلّ الأخطاء — الأرقامُ أدناه قد لا تكون كاملة.</div>
      )}

      <StatGrid min={150}>
        {(Object.keys(SOURCE_META) as ErrorSource[]).map((s) => (
          <StatCard
            key={s}
            icon={SOURCE_META[s].icon}
            label={SOURCE_META[s].label}
            value={o.openBySource[s]}
            hint={SOURCE_META[s].hint}
            tone={o.openBySource[s] > 0 ? 'rose' : undefined}
            href={href({ source: s, status: 'open' })}
          />
        ))}
        <StatCard
          icon="errQueue"
          label="رسائلُ لم تُسلَّم"
          value={queueFailed}
          hint="واتساب والدفع · 24 ساعة"
          tone={queueFailed > 0 ? 'rose' : undefined}
          href="#queue"
        />
      </StatGrid>

      <nav className="err-filters" aria-label="تصفية">
        <div className="err-chips">
          <Link href={href({ source: null })} className={`err-chip${!source ? ' err-chip-on' : ''}`}>كلُّ المصادر</Link>
          {(Object.keys(SOURCE_META) as ErrorSource[]).map((s) => (
            <Link key={s} href={href({ source: s })} className={`err-chip${source === s ? ' err-chip-on' : ''}`}>
              {SOURCE_META[s].label}
            </Link>
          ))}
        </div>
        <div className="err-chips">
          {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((st) => (
            <Link key={st} href={href({ status: st })} className={`err-chip${status === st ? ' err-chip-on' : ''}`}>
              {STATUS_LABEL[st]}
            </Link>
          ))}
        </div>
      </nav>

      <BulkActions source={source} openCount={source ? o.openBySource[source] : totalOpen} />

      <DataTable
        rows={o.rows}
        rowKey={(r) => r.id}
        empty={status === 'open' ? 'لا أخطاءَ مفتوحة هنا ✓' : 'لا نتائج'}
        columns={[
          {
            key: 'message',
            header: 'الخطأ',
            primary: true,
            render: (r) => {
              const url = externalUrl(r);
              return (
                <div className="err-msg-cell">
                  <span className="err-message" dir="auto">{r.message}</span>
                  {r.path && <bdi className="err-path" dir="ltr">{r.path}</bdi>}
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="err-link">
                      فتحُ السجلّ في {r.source === 'build' ? 'Vercel' : 'GitHub'}
                    </a>
                  )}
                  <details className="err-details">
                    <summary>التفاصيل</summary>
                    <pre dir="ltr">{JSON.stringify(r.detail, null, 2)}</pre>
                  </details>
                </div>
              );
            },
          },
          {
            key: 'source',
            header: 'المصدر',
            render: (r) => (
              <span className="err-source">
                <Icon name={SOURCE_META[r.source].icon} size={16} />
                {SOURCE_META[r.source].label}
              </span>
            ),
          },
          {
            key: 'level',
            header: 'الشدّة',
            render: (r) => <StatusPill label={(LEVEL[r.level] ?? LEVEL.error).label} tone={(LEVEL[r.level] ?? LEVEL.error).tone} />,
          },
          { key: 'count', header: 'المرّات', render: (r) => <span className="err-count">{r.occurrences}</span> },
          {
            key: 'seen',
            header: 'آخرُ ظهور',
            render: (r) => (
              <span className="err-when">
                {fmt(r.last_seen_at)}
                {r.occurrences > 1 && <span className="err-first">أوّلُه {fmt(r.first_seen_at)}</span>}
              </span>
            ),
          },
          {
            key: 'action',
            header: 'الحالة',
            render: (r) => (
              <span className="err-state">
                {r.resolved_at && <span className="err-resolved">حُلّ {fmt(r.resolved_at)}</span>}
                <ResolveButton id={r.id} resolved={!!r.resolved_at} />
              </span>
            ),
          },
        ]}
      />

      <div id="queue">
        <Panel title="رسائلُ لم تُسلَّم (24 ساعة)" icon="errQueue" action={{ href: '/admin/notifications', label: 'الإشعارات' }}>
          {o.queue.length === 0 ? (
            <p className="err-empty">لا رسالةَ فشلت في آخر 24 ساعة.</p>
          ) : (
            <ul className="err-queue">
              {o.queue.map((g) => (
                <li key={`${g.channel}|${g.error}`}>
                  <StatusPill label={g.channel === 'whatsapp' ? 'واتساب' : g.channel === 'push' ? 'دفع' : g.channel} tone="neutral" />
                  <span className="err-message" dir="auto">{g.error}</span>
                  <span className="err-count">×{g.count}</span>
                  <span className="err-first">{fmt(g.lastAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="مصادرُ الرصد" icon="settings">
        <ul className="err-sources">
          <li><b>الخادم والسجلّ والمهامّ المجدولة:</b> تُسجَّل وحدها من التطبيق نفسه.</li>
          <li><b>عند المستخدمين:</b> خطأٌ في صفحةٍ أو في المتصفّح يُرسَل من جهاز المستخدم (خمسٌ لكلّ صفحة على الأكثر، بلا ضجيج الإضافات).</li>
          <li>
            <b>البناء وفحوص GitHub:</b>{' '}
            {o.ingest
              ? `متّصل ✓ — آخرُ تقرير ${fmt(o.ingest.at)} (${o.ingest.kind === 'ci' ? 'فحص' : 'نشر'} «${o.ingest.name}» على ${o.ingest.branch}: ${o.ingest.status === 'success' ? 'نجح' : 'فشل'}).`
              : 'لم يصل تقريرٌ بعد. يبدأ تلقائياً بعد أوّل فحصٍ أو نشرٍ يلي دمجَ سير العمل «Report failures» في main — لا سرَّ يُضبط.'}
          </li>
          <li><b>بريدُ التنبيه:</b> فشلُ main أو نشرِ الإنتاج أو الكرون يُرسَل للمالك حين يُضبط <code>RESEND_API_KEY</code> و<code>ADMIN_OWNER_EMAIL</code> في Vercel.</li>
        </ul>
      </Panel>
    </div>
  );
}
