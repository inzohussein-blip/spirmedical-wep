import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';
import LabResultsEditor from '@/components/labs/LabResultsEditor';
import { saveResultsAsLab } from '../actions';
import { SAMPLE_STAGE } from '../stages';
import ReceiveSample from './ReceiveSample';

export const metadata = { title: 'عيّنة · نافذة الخدمة' };
export const dynamic = 'force-dynamic';

/**
 * عيّنةٌ واحدة: ما يلزم المختبرَ للتحليل (التحاليل، العمر، الجنس، الصيام) — لا اسمَ المريض ولا هاتفَه ولا عنوانَه:
 * العيّنةُ تصل برقمها من المحلّل. ثمّ «استلمتُ العيّنة» فإدخالُ النتائج.
 */
export default async function ProviderSample(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('role, provider_type').eq('id', user.id).single();
  const admin = isAdminRole(me?.role);
  if (!admin && !(me?.role === 'provider' && me.provider_type === 'lab')) notFound();

  const db = createAdminClient();
  const { data: order } = await db
    .from('lab_orders')
    .select('id, status, test_ids, patient_age, patient_gender, needs_fasting, fasting_hours, fasting_confirmed, lab_specialist_id')
    .eq('id', id)
    .maybeSingle();
  if (!order || (!admin && order.lab_specialist_id !== user.id)) notFound();
  if (!['sent_to_lab', 'processing', 'results_ready'].includes(order.status ?? '')) notFound();

  const { data: saved } = await db.from('lab_results').select('*').eq('lab_order_id', id);
  const existing = (saved ?? []).map((r) => ({
    test_id: r.test_id ?? '',
    test_name: r.test_name ?? '',
    result_value: r.result_value || '',
    unit: r.unit || '',
    normal_range_text: r.normal_range_text || '',
    normal_range_min: r.normal_range_min ?? undefined,
    normal_range_max: r.normal_range_max ?? undefined,
    status: (r.status ?? 'normal') as 'normal' | 'low' | 'high' | 'critical' | 'inconclusive',
    notes: r.notes || '',
  }));
  const testIds = order.test_ids ?? [];
  const names = testIds.map((t) => BLOOD_TESTS.find((b) => b.id === t)?.nameAr ?? t);
  const stage = SAMPLE_STAGE[order.status ?? ''] ?? SAMPLE_STAGE.sent_to_lab;

  return (
    <main className="app-screen">
      <div className="scr-content pv">
        <Link href="/provider/samples" className="pv-back">→ العيّنات</Link>
        <header className="pv-sample-title">
          <h1 className="pv-title">عيّنة #{order.id.slice(0, 8)}</h1>
          <span className={`pv-pill pv-pill-${stage.tone}`}>{stage.label}</span>
        </header>

        <section className="pv-card" aria-label="بيانات العيّنة">
          <dl className="pv-facts">
            <div><dt>التحاليل</dt><dd>{names.join('، ') || '—'}</dd></div>
            <div><dt>الجنس</dt><dd>{order.patient_gender === 'female' ? 'أنثى' : order.patient_gender === 'male' ? 'ذكر' : '—'}</dd></div>
            <div><dt>العمر</dt><dd>{order.patient_age ? `${order.patient_age} سنة` : '—'}</dd></div>
            {order.needs_fasting && (
              <div><dt>الصيام</dt><dd>{order.fasting_hours ? `${order.fasting_hours} ساعة` : 'مطلوب'}{order.fasting_confirmed ? ' · أكّده المريض' : ''}</dd></div>
            )}
          </dl>
        </section>

        {order.status === 'sent_to_lab' ? (
          <section className="pv-card">
            <p className="pv-note">سلّمك المحلّلُ هذه العيّنة. أكّد استلامَها، ثمّ أدخل النتائج حين تجهز.</p>
            <ReceiveSample orderId={order.id} />
          </section>
        ) : (
          <section className="pv-card" aria-label="النتائج">
            {order.status === 'results_ready' && (
              <p className="pv-ok">النتائج مرفوعة ويراها المريض. التعديلُ يستبدلها ويُخطره.</p>
            )}
            <LabResultsEditor save={saveResultsAsLab.bind(null, order.id)} expectedTests={testIds} existingResults={existing} />
          </section>
        )}
      </div>
    </main>
  );
}
