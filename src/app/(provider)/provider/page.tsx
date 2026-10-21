import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isAdminRole } from '@/lib/admin-types';
import { Icon } from '@/components/admin-ui';
import { PROVIDER_META, isProviderType } from '@/lib/providers';
import { listingKindFor } from '@/lib/provider-listings';
import { getLatestClaim, getOwnedListings } from '@/lib/provider-listings-server';

export const metadata = { title: 'نافذة الخدمة · سباير ميديكال' };
export const dynamic = 'force-dynamic';

/**
 * 🏥 رئيسيّةُ حساب الخدمة (0060): الملفّ وتحاليلُ المختبر وعيّناتُه (الدفعة 2). الصيدليةُ والعيادة والمستشفى
 * ملفٌّ فقط حتى الدفعة الثالثة — والصفحةُ تقول ذلك ولا تَعِد بما لم يُبنَ.
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
  const listingKind = listingKindFor(type);

  // عيّناتُ المختبر، أو منشأةُ الصيدلية/العيادة/المستشفى وطلبُ ربطها — بعميل الخدمة مقيّدةً بالحساب
  const [{ count: tests }, { count: waiting }, owned, claim] = await Promise.all([
    isLab
      ? supabase.from('specialist_lab_tests').select('test_id', { count: 'exact', head: true }).eq('specialist_id', user.id)
      : Promise.resolve({ count: null }),
    isLab
      ? createAdminClient().from('lab_orders').select('id', { count: 'exact', head: true })
          .eq('lab_specialist_id', user.id).in('status', ['sent_to_lab', 'processing'])
      : Promise.resolve({ count: null }),
    listingKind ? getOwnedListings(user.id, listingKind) : Promise.resolve([]),
    listingKind ? getLatestClaim(user.id) : Promise.resolve(null),
  ]);
  // الطلباتُ المفتوحة لمنشآت الحساب
  const ownedIds = owned.map((l) => l.id);
  const { count: openRequests } = ownedIds.length === 0
    ? { count: 0 }
    : listingKind === 'pharmacy'
      ? await createAdminClient().from('pharmacy_reservations').select('id', { count: 'exact', head: true })
          .in('pharmacy_id', ownedIds).in('status', ['pending', 'confirmed', 'partially_available', 'ready_for_pickup'])
      : await createAdminClient().from('appointments').select('id', { count: 'exact', head: true })
          .in(listingKind === 'doctor' ? 'doctor_id' : 'hospital_id', ownedIds).in('status', ['pending', 'confirmed']);

  const steps = [
    { done: !!profile?.clinic_name?.trim(), title: `اكتب ${meta?.nameLabel ?? 'اسم المنشأة'}`, desc: 'يراه المريض عند الاختيار.', href: '/provider/account' },
    { done: !!(profile?.clinic_city?.trim() || profile?.governorate?.trim()), title: 'حدّد المدينة', desc: 'يختار المريضُ الأقربَ إليه.', href: '/provider/account' },
    ...(isLab
      ? [{ done: (tests ?? 0) > 0, title: 'حدّد تحاليلَ مختبرك', desc: 'يظهر مختبرُك للمريض حين يختار تحاليلَ يُجريها.', href: '/provider/lab-tests' }]
      : []),
    ...(listingKind
      ? [{
          done: owned.length > 0,
          title: claim?.status === 'pending' ? 'ربطُ منشأتك قيد المراجعة' : 'اربط حسابَك بمنشأتك',
          desc: 'ابحث عنها في الدليل أو أضِفها — فتصلك حجوزاتُها بعد اعتماد الإدارة.',
          href: '/provider/listing',
        }]
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
              <Link href="/provider/samples" className="pv-stat">
                <span className="pv-stat-value">{waiting ?? 0}</span>
                <span className="pv-stat-label">عيّنةً بانتظار النتائج</span>
              </Link>
            </div>
            <p className="pv-note">
              المسار: يختار المريضُ تحاليلَه ومختبرَك ← يسحب المحلّلُ العيّنةَ ويسلّمها لك ← تؤكّد الاستلام وترفع النتائج
              من «العيّنات»، فتصل المريضَ في التطبيق.
            </p>
          </section>
        )}

        {meta && listingKind && (
          <section className="pv-card" aria-label="منشأتك">
            <h2 className="pv-card-title">{owned[0]?.name ?? meta.label}</h2>
            <div className="pv-stats">
              <Link href="/provider/requests" className="pv-stat">
                <span className="pv-stat-value">{openRequests ?? 0}</span>
                <span className="pv-stat-label">طلباً مفتوحاً</span>
              </Link>
              <Link href="/provider/listing" className="pv-stat">
                <span className="pv-stat-value">{owned.length > 0 ? 'مرتبطة' : claim?.status === 'pending' ? 'قيد المراجعة' : 'غير مرتبطة'}</span>
                <span className="pv-stat-label">منشأتك في الدليل</span>
              </Link>
            </div>
            <p className="pv-note">
              {meta.description}: يحجز المريضُ من الدليل فيصلك الطلبُ هنا، فتؤكّده أو تعتذر بسببٍ يراه.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
