import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isProviderType } from '@/lib/providers';
import { LISTING_SOURCE, listingKindFor } from '@/lib/provider-listings';
import { getLatestClaim, getListing, getOwnedListingDetails, getOwnedListings, searchUnownedListings } from '@/lib/provider-listings-server';
import { ClaimButton, EditListingForm, NewListingForm, WithdrawButton } from './ListingForms';

export const metadata = { title: 'منشأتي · نافذة الخدمة' };
export const dynamic = 'force-dynamic';

/**
 * 🏥 «منشأتي» (الدفعة 3): ربطُ الحساب بمنشأته في الدليل — موجودة أو جديدة — بطلبٍ تعتمده الإدارة، ثمّ تحريرُ
 * بياناتها. المنشأةُ دليلٌ فقط (قرار المالك، 22 تشرين الأول): لا تتلقّى طلباتٍ من المريض — يراها ويتواصل معها.
 */
export default async function ProviderListing(props: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: me } = await supabase.from('users').select('role, provider_type').eq('id', user.id).single();
  const kind = isProviderType(me?.provider_type) ? listingKindFor(me.provider_type) : null;

  if (!kind) {
    return (
      <main className="app-screen">
        <div className="scr-content pv">
          <h1 className="pv-title">منشأتي</h1>
          <p className="pv-note">هذه الصفحة للصيدليات والعيادات والمستشفيات: تربط حسابَك بمنشأتك في الدليل وتحرّر بياناتها.
            المختبرُ يحدّد تحاليلَه من «التحاليل».</p>
        </div>
      </main>
    );
  }

  const { q = '' } = await props.searchParams;
  const [owned, claim] = await Promise.all([getOwnedListings(user.id, kind), getLatestClaim(user.id)]);
  const label = LISTING_SOURCE[kind].label;

  if (owned.length > 0) {
    const details = await getOwnedListingDetails(user.id, kind);
    return (
      <main className="app-screen">
        <div className="scr-content pv">
          <h1 className="pv-title">منشأتي</h1>
          <section className="pv-card">
            {owned.map((l) => (
              <div key={l.id} className="pv-sample-head">
                <span className="pv-sample-code">{l.name}</span>
                <span className="pv-pill pv-pill-green">مرتبطة</span>
              </div>
            ))}
            <p className="pv-note">يراها المرضى في الدليل ويتواصلون معها مباشرة. حدِّث بياناتِها هنا.</p>
          </section>
          {details && (
            <section className="pv-card" aria-label="بيانات المنشأة">
              <h2 className="pv-card-title">بياناتُ التواصل</h2>
              <EditListingForm kind={kind} values={details} />
            </section>
          )}
        </div>
      </main>
    );
  }

  if (claim?.status === 'pending') {
    const target = claim.listing_id ? await getListing(kind, claim.listing_id) : null;
    const proposedName = typeof claim.proposed?.name === 'string' ? claim.proposed.name : null;
    return (
      <main className="app-screen">
        <div className="scr-content pv">
          <h1 className="pv-title">منشأتي</h1>
          <section className="pv-card">
            <div className="pv-sample-head">
              <span className="pv-sample-code">{target?.name ?? proposedName ?? label}</span>
              <span className="pv-pill pv-pill-amber">قيد المراجعة</span>
            </div>
            <p className="pv-note">{claim.listing_id ? 'طلبتَ ربطَ حسابك بهذه المنشأة.' : 'طلبتَ إضافةَ منشأتك إلى الدليل.'} تراجعه الإدارة، ويصلك إشعارٌ بالقرار.</p>
            <WithdrawButton />
          </section>
        </div>
      </main>
    );
  }

  const results = await searchUnownedListings(kind, q);
  return (
    <main className="app-screen">
      <div className="scr-content pv">
        <h1 className="pv-title">منشأتي</h1>
        {claim?.status === 'rejected' && (
          <p className="pv-err" role="status">رُفض طلبُك السابق{claim.rejection_reason ? `: ${claim.rejection_reason}` : ''}</p>
        )}
        <section className="pv-card" aria-label="ابحث عن منشأتك">
          <h2 className="pv-card-title">ابحث عن منشأتك في الدليل</h2>
          <form className="pv-search" role="search">
            <input name="q" defaultValue={q} placeholder={`اسمُ ${label} أو المدينة`} aria-label="بحث" />
            <button type="submit" className="pv-btn pv-btn-sm">بحث</button>
          </form>
          {results.length > 0 ? (
            <ul className="pv-samples">
              {results.map((l) => (
                <li key={l.id} className="pv-listing">
                  <span className="pv-listing-text">
                    <span className="pv-sample-code">{l.name}</span>
                    {l.city && <span className="pv-sample-meta">{l.city}</span>}
                  </span>
                  <ClaimButton id={l.id} name={l.name} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="pv-note">{q ? 'لا نتائج — أضِف منشأتك أدناه.' : 'لا منشآتٍ بلا مالك في الدليل.'}</p>
          )}
        </section>
        <section className="pv-card" aria-label="أضِف منشأتك">
          <h2 className="pv-card-title">منشأتي غيرُ موجودة</h2>
          <p className="pv-note">أضِفها، وتظهر في الدليل بعد مراجعة الإدارة.</p>
          <NewListingForm kind={kind} />
        </section>
      </div>
    </main>
  );
}
