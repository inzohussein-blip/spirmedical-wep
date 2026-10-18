import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { Icon } from '@/components/admin-ui';
import { PROVIDER_META, isProviderType } from '@/lib/providers';

export const metadata = { title: 'نافذة الخدمة · سباير ميديكال' };
export const dynamic = 'force-dynamic';

/**
 * 🏥 رئيسيّةُ حساب الخدمة (0060). الدفعةُ الأولى: الملفّ وتحاليلُ المختبر وطلباتُ من اختاروه.
 * استلامُ العيّنة من المحلّل ورفعُ النتائج في الدفعة الثانية — والصفحةُ تقول ذلك ولا تَعِد بما لم يُبنَ.
 */
export default async function ProviderHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, provider_type, clinic_name, clinic_city, governorate')
    .eq('id', user.id)
    .single();

  const asAdmin = isAdminRole(profile?.role);
  const type = isProviderType(profile?.provider_type) ? profile.provider_type : null;
  const meta = type ? PROVIDER_META[type] : null;
  const isLab = type === 'lab';

  // طلباتُ من اختاروا هذا المختبر: بعميل الخدمة مقيّدةً بمعرّفه (المريضُ صاحبُ الصفّ تحت RLS)
  const [{ count: tests }, { count: chosenOrders }] = await Promise.all([
    isLab
      ? supabase.from('specialist_lab_tests').select('test_id', { count: 'exact', head: true }).eq('specialist_id', user.id)
      : Promise.resolve({ count: null }),
    isLab
      ? createAdminClient().from('lab_orders').select('id', { count: 'exact', head: true }).eq('lab_specialist_id', user.id)
      : Promise.resolve({ count: null }),
  ]);

  const steps = [
    { done: !!profile?.clinic_name?.trim(), title: `اكتب ${meta?.nameLabel ?? 'اسم المنشأة'}`, desc: 'يراه المريض عند الاختيار.', href: '/provider/account' },
    { done: !!(profile?.clinic_city?.trim() || profile?.governorate?.trim()), title: 'حدّد المدينة', desc: 'يختار المريضُ الأقربَ إليه.', href: '/provider/account' },
    ...(isLab
      ? [{ done: (tests ?? 0) > 0, title: 'حدّد تحاليلَ مختبرك', desc: 'يظهر مختبرُك للمريض حين يختار تحاليلَ يُجريها.', href: '/provider/lab-tests' }]
      : []),
  ];
  const pending = steps.filter((s) => !s.done);

  return (
    <main className="app-screen">
      <div className="scr-content pv">
        <header className="pv-hero">
          <span className="pv-hero-icon"><Icon name={meta?.icon ?? 'hospitals'} size={30} /></span>
          <div className="pv-hero-text">
            <div className="pv-hello">أهلاً</div>
            <div className="pv-name">{profile?.clinic_name?.trim() || profile?.full_name || 'حسابُ خدمة'}</div>
            <div className="pv-type">{asAdmin && !meta ? 'مدير — معاينةُ نافذة الخدمة' : meta?.label}</div>
          </div>
        </header>

        {pending.length > 0 && (
          <section className="pv-card" aria-label="جهّز حسابك">
            <h2 className="pv-card-title">جهّز حسابك</h2>
            <ul className="pv-steps">
              {steps.map((s) => (
                <li key={s.title} className={s.done ? 'pv-step pv-done' : 'pv-step'}>
                  <span className="pv-check" aria-hidden="true">{s.done ? '✓' : ''}</span>
                  <Link href={s.href} className="pv-step-link">
                    <span className="pv-step-title">{s.title}</span>
                    <span className="pv-step-desc">{s.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {isLab && (
          <section className="pv-card" aria-label="المختبر">
            <h2 className="pv-card-title">مختبرُك</h2>
            <div className="pv-stats">
              <Link href="/provider/lab-tests" className="pv-stat">
                <span className="pv-stat-value">{tests ?? 0}</span>
                <span className="pv-stat-label">تحليلاً تُجريه</span>
              </Link>
              <div className="pv-stat">
                <span className="pv-stat-value">{chosenOrders ?? 0}</span>
                <span className="pv-stat-label">طلباً اختارك فيه المريض</span>
              </div>
            </div>
            <p className="pv-note">
              المسار: يختار المريضُ تحاليلَه ومختبرَك ← يسحب المحلّلُ العيّنةَ ويسلّمها لك ← ترفع النتائج.
              استلامُ العيّنات ورفعُ النتائج من هنا قادمٌ في التحديث التالي.
            </p>
          </section>
        )}

        {meta && !isLab && (
          <section className="pv-card">
            <h2 className="pv-card-title">{meta.label}</h2>
            <p className="pv-note">
              {meta.description}. استقبالُ الطلبات لحسابات {meta.label} قادمٌ في تحديثٍ لاحق — جهّز ملفّك الآن ليظهر حين يُفعَّل.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
