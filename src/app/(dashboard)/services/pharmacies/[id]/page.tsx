// ═══════════════════════════════════════════════════════════════
// 💊 صفحة تفاصيل الصيدلية + كتالوج الأدوية (V25.7)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PharmacyDetailClient from './PharmacyDetailClient';
import { checkIsFavorite } from '@/components/services/favorites-actions';

export const dynamic = 'force-dynamic';

export default async function PharmacyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  // ─── جلب بيانات الصيدلية ───
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!pharmacy) {
    notFound();
  }

  // ─── جلب كتالوج الأدوية (آخر 200) ───
  const { data: inventory } = await supabase
    .from('pharmacy_inventory')
    .select(`
      id,
      is_available,
      custom_price,
      brand_variant,
      notes,
      medication:medications (
        id,
        name_ar,
        name_en,
        generic_name,
        manufacturer,
        category,
        form,
        strength,
        package_size,
        requires_prescription,
        image_url
      )
    `)
    .eq('pharmacy_id', params.id)
    .order('is_available', { ascending: false })
    .limit(200);

  // ─── حالة المفضّلة + أهليّة التقييم ───
  // التقييم مربوط بحجزٍ **مُستلَم** (`picked_up`): يمنع تقييم من لم يتعامل مع
  // الصيدلية، ويجعل قيد `UNIQUE (user_id, reservation_id)` فعّالاً — إذ لو كان
  // `reservation_id` فارغاً لسمحت Postgres بصفوفٍ مكرّرة (NULL متمايز).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ratableReservationId: string | null = null;
  let existingRating: number | null = null;

  if (user) {
    const { data: reservation } = await supabase
      .from('pharmacy_reservations')
      .select('id')
      .eq('user_id', user.id)
      .eq('pharmacy_id', params.id)
      .eq('status', 'picked_up')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reservation) {
      ratableReservationId = reservation.id;

      // `pharmacy_ratings` موجود في الترحيلات وغائب عن `src/types/database.ts`
      // (الأنواع مكتوبة يدوياً ومتأخّرة عن المخطّط). قالبٌ ضيّق محصور في هذا
      // الاستعلام وحده — يزول عند إعادة توليد الأنواع من المشروع الحيّ.
      const ratingsTable = supabase as unknown as {
        from: (t: 'pharmacy_ratings') => {
          select: (cols: string) => {
            eq: (c: string, v: string) => {
              eq: (c: string, v: string) => {
                maybeSingle: () => Promise<{ data: { rating: number } | null }>;
              };
            };
          };
        };
      };

      const { data: rating } = await ratingsTable
        .from('pharmacy_ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('reservation_id', reservation.id)
        .maybeSingle();

      existingRating = rating?.rating ?? null;
    }
  }

  return (
    <PharmacyDetailClient
      initialIsFavorite={await checkIsFavorite('pharmacy', params.id)}
      ratableReservationId={ratableReservationId}
      existingRating={existingRating}
      pharmacy={pharmacy}
      inventory={(inventory || []) as unknown as Array<{
        id: string;
        is_available: boolean;
        custom_price: number | null;
        brand_variant: string | null;
        notes: string | null;
        medication: {
          id: string;
          name_ar: string;
          name_en: string | null;
          generic_name: string | null;
          manufacturer: string | null;
          category: string;
          form: string | null;
          strength: string | null;
          package_size: string | null;
          requires_prescription: boolean;
          image_url: string | null;
        } | null;
      }>}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: p } = await supabase
    .from('pharmacies')
    .select('name, city')
    .eq('id', params.id)
    .single();

  return {
    title: p ? `${p.name} - ${p.city} | Spir Medical` : 'صيدلية',
  };
}
