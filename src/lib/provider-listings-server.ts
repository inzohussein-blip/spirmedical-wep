import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { LISTING_SOURCE, type ListingKind } from '@/lib/provider-listings';

/**
 * 🏥 قراءاتُ الدفعة 3 على الخادم (عميلُ الخدمة، مقيّدةً بالمالك): المنشآتُ التي يملكها حسابُ الخدمة، وطلبُ ربطه
 * الحيّ. `provider_listing_claims` لعميل الخدمة وحده (0062).
 */
export interface OwnedListing {
  id: string;
  name: string;
  city: string | null;
}

type ListingRow = { id: string; name?: string | null; full_name?: string | null; clinic_name?: string | null; city?: string | null; clinic_city?: string | null };

export function listingDisplay(kind: ListingKind, r: ListingRow): OwnedListing {
  if (kind === 'doctor') {
    const name = [r.clinic_name?.trim(), r.full_name?.trim()].filter(Boolean).join(' — ') || 'عيادة';
    return { id: r.id, name, city: r.clinic_city ?? null };
  }
  return { id: r.id, name: r.name?.trim() || LISTING_SOURCE[kind].label, city: r.city ?? null };
}

/** الجداولُ الثلاثة بأعمدة ملكيّةٍ مختلفة — منشئُ استعلامٍ واحد بلا أنواعٍ لكلّ جدول */
const listingTable = (kind: ListingKind): any => createAdminClient().from(LISTING_SOURCE[kind].table);

const COLUMNS: Record<ListingKind, string> = {
  pharmacy: 'id, name, city',
  doctor: 'id, full_name, clinic_name, clinic_city',
  hospital: 'id, name, city',
};

export { listingTable };

export async function getOwnedListings(userId: string, kind: ListingKind): Promise<OwnedListing[]> {
  const src = LISTING_SOURCE[kind];
  const { data, error } = await listingTable(kind)
    .select(COLUMNS[kind])
    .eq(src.owner, userId)
    .limit(20);
  if (error) {
    logger.warn('getOwnedListings failed', { kind, error: error.message });
    return [];
  }
  return ((data ?? []) as unknown as ListingRow[]).map((r) => listingDisplay(kind, r));
}

export async function getListing(kind: ListingKind, id: string): Promise<(OwnedListing & { owner: string | null; active: boolean }) | null> {
  const src = LISTING_SOURCE[kind];
  const { data } = await listingTable(kind)
    .select(`${COLUMNS[kind]}, ${src.owner}, is_active`)
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as ListingRow & Record<string, unknown>;
  return { ...listingDisplay(kind, row), owner: (row[src.owner] as string | null) ?? null, active: row.is_active !== false };
}

/** منشآتٌ بلا مالك تطابق البحث — لاختيار ما يُربط */
export async function searchUnownedListings(kind: ListingKind, q: string): Promise<OwnedListing[]> {
  const src = LISTING_SOURCE[kind];
  const term = q.replace(/[%_,()]/g, ' ').trim().slice(0, 60);
  let query = listingTable(kind)
    .select(COLUMNS[kind])
    .is(src.owner, null)
    .eq('is_active', true)
    .limit(20);
  if (term) {
    query = kind === 'doctor'
      ? query.or(`full_name.ilike.%${term}%,clinic_name.ilike.%${term}%,clinic_city.ilike.%${term}%`)
      : query.or(`name.ilike.%${term}%,city.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) {
    logger.warn('searchUnownedListings failed', { kind, error: error.message });
    return [];
  }
  return ((data ?? []) as unknown as ListingRow[]).map((r) => listingDisplay(kind, r));
}

export interface ListingClaim {
  id: string;
  listing_kind: ListingKind;
  listing_id: string | null;
  proposed: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

/** آخرُ طلب ربطٍ للحساب (الحيّ أوّلاً، وإلّا آخرُ مرفوض ليرى سببه) */
export async function getLatestClaim(userId: string): Promise<ListingClaim | null> {
  const { data } = await createAdminClient()
    .from('provider_listing_claims')
    .select('id, listing_kind, listing_id, proposed, status, rejection_reason, created_at')
    .eq('provider_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
  const rows = (data ?? []) as unknown as ListingClaim[];
  return rows.find((r) => r.status !== 'rejected') ?? rows[0] ?? null;
}

const EDITABLE: Record<ListingKind, string> = {
  pharmacy: 'id, name, phone, whatsapp, address, description, is_24h, opens_at, closes_at, has_delivery',
  doctor: 'id, full_name, clinic_name, clinic_phone, clinic_address, bio',
  hospital: 'id, name, phone, whatsapp, address, description, visiting_hours',
};

/** بياناتُ المنشأة التي يحرّرها مالكُها — مقيّدةً به */
export async function getOwnedListingDetails(userId: string, kind: ListingKind): Promise<Record<string, unknown> | null> {
  const { data } = await listingTable(kind)
    .select(EDITABLE[kind])
    .eq(LISTING_SOURCE[kind].owner, userId)
    .limit(1)
    .maybeSingle();
  return (data as Record<string, unknown> | null) ?? null;
}
