/**
 * 🧩 مكوّناتُ لوحة الإدارة — بدل النمط السطريّ المكرَّر (1,916 موضعاً في 44 صفحة).
 *
 * كلُّ صفحةٍ كانت تكتب بطاقتها وقائمتها وجدولها وشارةَ حالتها بيدها: ألوانٌ متقاربةٌ لا متطابقة، وأحجامُ
 * خطٍّ 11px، وشبكاتٌ بأعمدةٍ ثابتة لا تنطوي على الهاتف. هنا كلٌّ منها مرّةً، وتنسيقُها في admin.css
 * (البادئة `aui-`) فيعمل استعلامُ الوسائط — النمطُ السطريّ لا يُجاوَز إلّا بـ!important.
 */
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import {
  IconChevronLeft as ChevronLeft,
} from '@tabler/icons-react';
import { ICONS, ICON_COLOR, ICON_STROKE, ICON_TONES, type IconName } from '@/lib/icons';

export type Tone = 'brand' | 'violet' | 'amber' | 'rose' | 'neutral';

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const C = ICONS[name];
  return <C size={size} strokeWidth={ICON_STROKE} aria-hidden />;
}

/**
 * بلاطةُ أيقونة بأسلوب تطبيق المريض: لونُ المفهوم على خلفيّته الفاتحة (`ICON_COLOR`) —
 * المستشفى أزرق أينما ظهر. `tone` صريحاً يغلبه (تنبيهٌ أحمر لعددٍ يحتاج انتباهاً).
 */
function IconTile({ icon, tone }: { icon: IconName; tone?: Tone }) {
  if (tone) return <span className={`aui-stat-icon aui-tone-${tone}`}><Icon name={icon} size={22} /></span>;
  const t = ICON_TONES[ICON_COLOR[icon]];
  const style = { '--tone': t.fg, '--tone-soft': t.bg } as CSSProperties;
  return <span className="aui-stat-icon" style={style}><Icon name={icon} size={22} /></span>;
}

/** رقمٌ واحد مع أيقونته — للوحة وإحصاءات الأقسام */
export function StatCard({
  icon, label, value, hint, tone, href,
}: { icon: IconName; label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; href?: string }) {
  const body = (
    <>
      <IconTile icon={icon} tone={tone} />
      <span className="aui-stat-value">{value}</span>
      <span className="aui-stat-label">{label}</span>
      {hint && <span className="aui-stat-hint">{hint}</span>}
    </>
  );
  return href ? <Link href={href} className="aui-stat aui-stat-link">{body}</Link> : <div className="aui-stat">{body}</div>;
}

/** شبكةُ إحصاءات: تنطوي وحدها (auto-fit) — لا 'repeat(4, 1fr)' ثابتة */
export function StatGrid({ children, min = 160 }: { children: ReactNode; min?: number }) {
  return <div className="aui-stat-grid" style={{ ['--aui-min' as string]: `${min}px` }}>{children}</div>;
}

/** لوحةٌ بعنوانٍ ورابطِ «عرض الكل» */
export function Panel({ title, icon, action, children }: {
  title: string; icon?: IconName; action?: { href: string; label: string }; children: ReactNode;
}) {
  return (
    <section className="aui-panel">
      <header className="aui-panel-head">
        <h2 className="aui-panel-title">{icon && <Icon name={icon} size={18} />}{title}</h2>
        {action && (
          <Link href={action.href} className="aui-panel-action">
            {action.label}<ChevronLeft size={16} strokeWidth={ICON_STROKE} aria-hidden />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

/** صفٌّ في قائمة: بدايةٌ (صورة/أيقونة)، عنوانٌ ووصف، ونهايةٌ (شارة) */
export function ListRow({ href, leading, title, subtitle, trailing }: {
  href: string; leading?: ReactNode; title: ReactNode; subtitle?: ReactNode; trailing?: ReactNode;
}) {
  return (
    <Link href={href} className="aui-row">
      {leading}
      <span className="aui-row-text">
        <span className="aui-row-title">{title}</span>
        {subtitle && <span className="aui-row-sub">{subtitle}</span>}
      </span>
      {trailing}
    </Link>
  );
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'جديد', tone: 'amber' },
  confirmed: { label: 'مؤكّد', tone: 'brand' },
  in_progress: { label: 'جارٍ', tone: 'violet' },
  completed: { label: 'مكتمل', tone: 'brand' },
  cancelled: { label: 'ملغى', tone: 'rose' },
  approved: { label: 'معتمَد', tone: 'brand' },
  rejected: { label: 'مرفوض', tone: 'rose' },
  suspended: { label: 'موقوف', tone: 'rose' },
};

/** شارةُ حالة: الاسمُ واللونُ من جدولٍ واحد، لا ثلاثيّةُ شروطٍ في كلّ صفحة */
export function StatusPill({ status, label, tone, labels }: {
  status?: string; label?: string; tone?: Tone;
  /** أسماءٌ خاصّة بالمجال: «pending» طلبٌ «جديد» لكنّه مختصٌّ «قيد المراجعة» */
  labels?: Record<string, string>;
}) {
  const base = (status && STATUS[status]) || { label: label ?? status ?? '—', tone: tone ?? 'neutral' };
  const s = { ...base, label: (status && labels?.[status]) || base.label };
  return <span className={`aui-pill aui-tone-${tone ?? s.tone}`}>{label ?? s.label}</span>;
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** العمودُ الذي يصير عنوانَ البطاقة على الهاتف */
  primary?: boolean;
}

/**
 * جدولٌ على الحاسوب، وبطاقاتٌ على الهاتف — من تعريف الأعمدة نفسه.
 * كان جدولُ الممرّضين بسبعة أعمدة في حاويةٍ تقصّ: على 390 يُخفي نصفَه أو يتمرّر أفقياً.
 */
export function DataTable<T>({ columns, rows, rowKey, empty }: {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; empty?: ReactNode;
}) {
  if (!rows.length) return <div className="aui-empty">{empty ?? 'لا توجد نتائج'}</div>;
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const rest = columns.filter((c) => c !== primary);
  return (
    <div className="aui-table-wrap">
      <table className="aui-table">
        <thead><tr>{columns.map((c) => <th key={c.key} scope="col">{c.header}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)}>{columns.map((c) => <td key={c.key}>{c.render(r)}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <ul className="aui-cards">
        {rows.map((r) => (
          <li key={rowKey(r)} className="aui-card">
            <div className="aui-card-primary">{primary.render(r)}</div>
            <dl className="aui-card-fields">
              {rest.map((c) => (
                <div key={c.key} className="aui-card-field"><dt>{c.header}</dt><dd>{c.render(r)}</dd></div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** إجراءٌ سريع: بطاقةٌ بأيقونةٍ ملوّنة — بدل أشرطةٍ متدرّجة الألوان لكلّ رابط */
export function ActionTile({ href, icon, title, subtitle, tone }: {
  href: string; icon: IconName; title: string; subtitle?: string; tone?: Tone;
}) {
  return (
    <Link href={href} className="aui-action">
      <IconTile icon={icon} tone={tone} />
      <span className="aui-row-text">
        <span className="aui-row-title">{title}</span>
        {subtitle && <span className="aui-row-sub">{subtitle}</span>}
      </span>
      <ChevronLeft size={18} strokeWidth={ICON_STROKE} aria-hidden className="aui-action-chev" />
    </Link>
  );
}

export function ActionGrid({ children }: { children: ReactNode }) {
  return <div className="aui-action-grid">{children}</div>;
}

/** تنبيهٌ يحتاج قراراً (طلباتُ اعتمادٍ معلّقة…) */
export function Callout({ href, icon, title, subtitle, tone = 'amber' }: {
  href: string; icon: IconName; title: string; subtitle?: string; tone?: Tone;
}) {
  return (
    <Link href={href} className={`aui-callout aui-tone-${tone}`}>
      <Icon name={icon} size={22} />
      <span className="aui-row-text">
        <span className="aui-row-title">{title}</span>
        {subtitle && <span className="aui-row-sub">{subtitle}</span>}
      </span>
      <ChevronLeft size={18} strokeWidth={ICON_STROKE} aria-hidden />
    </Link>
  );
}
