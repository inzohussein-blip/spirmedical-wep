import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';
import { DISPLAY_LOCALE } from '@/lib/format/locale';
import { SAMPLE_STAGE } from './stages';

export const metadata = { title: 'العيّنات · نافذة الخدمة' };
export const dynamic = 'force-dynamic';

/**
 * 🧪 عيّناتُ المختبر (الدفعة 2): ما سلّمه المحلّلون إليه. بعميل الخدمة مقيّداً بمعرّف المختبر —
 * `lab_orders` لا يقرؤها المختبرُ تحت RLS (صفُّ المريض)، ولا يخرج منها إلّا ما يلزم للتحليل.
 */
export default async function ProviderSamples() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('role, provider_type').eq('id', user.id).single();
  const isLab = me?.role === 'provider' && me.provider_type === 'lab';
  const admin = isAdminRole(me?.role);

  if (!isLab && !admin) {
    return (
      <main className="app-screen">
        <div className="scr-content pv">
          <h1 className="pv-title">العيّنات</h1>
          <p className="pv-note">هذه الصفحة للمختبرات: تصلها عيّناتُ المرضى الذين اختاروها، وترفع النتائج.</p>
        </div>
      </main>
    );
  }

  let q = createAdminClient()
    .from('lab_orders')
    .select('id, status, test_ids, patient_age, patient_gender, updated_at, lab_name_snapshot')
    .in('status', ['sent_to_lab', 'processing', 'results_ready'])
    .order('updated_at', { ascending: false })
    .limit(100);
  if (!admin) q = q.eq('lab_specialist_id', user.id);
  const { data: orders } = await q;
  const rows = orders ?? [];
  const open = rows.filter((o) => o.status !== 'results_ready');
  const done = rows.filter((o) => o.status === 'results_ready');

  const card = (o: (typeof rows)[number]) => {
    const stage = SAMPLE_STAGE[o.status ?? ''] ?? SAMPLE_STAGE.sent_to_lab;
    const names = (o.test_ids ?? []).map((id) => BLOOD_TESTS.find((t) => t.id === id)?.nameAr ?? id);
    return (
      <li key={o.id}>
        <Link href={`/provider/samples/${o.id}`} className="pv-sample">
          <span className="pv-sample-head">
            <span className="pv-sample-code">#{o.id.slice(0, 8)}</span>
            <span className={`pv-pill pv-pill-${stage.tone}`}>{stage.label}</span>
          </span>
          <span className="pv-sample-tests">{names.join('، ') || 'بلا تحاليل محدّدة'}</span>
          <span className="pv-sample-meta">
            {[o.patient_gender === 'female' ? 'أنثى' : o.patient_gender === 'male' ? 'ذكر' : null, o.patient_age ? `${o.patient_age} سنة` : null,
              o.updated_at ? new Date(o.updated_at).toLocaleString(DISPLAY_LOCALE, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Baghdad' }) : null]
              .filter(Boolean).join(' · ')}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <main className="app-screen">
      <div className="scr-content pv">
        <h1 className="pv-title">العيّنات</h1>
        <section className="pv-card" aria-label="بانتظار التحليل">
          <h2 className="pv-card-title">بانتظارك ({open.length})</h2>
          {open.length ? <ul className="pv-samples">{open.map(card)}</ul>
            : <p className="pv-note">لا عيّناتٍ في الطريق. حين يسلّمك محلّلٌ عيّنةَ مريضٍ اختار مختبرَك تظهر هنا ويصلك إشعار.</p>}
        </section>
        {done.length > 0 && (
          <section className="pv-card" aria-label="النتائج المرفوعة">
            <h2 className="pv-card-title">رُفعت نتائجُها ({done.length})</h2>
            <ul className="pv-samples">{done.map(card)}</ul>
          </section>
        )}
      </div>
    </main>
  );
}
