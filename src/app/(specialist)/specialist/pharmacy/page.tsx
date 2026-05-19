// ═══════════════════════════════════════════════════════════════
// 💊 صفحة إدارة الصيدلية للصيدلاني (V25.7)
// ═══════════════════════════════════════════════════════════════
// عرض مخزون الصيدلية + إضافة/تعديل/تعليم متوفر/غير متوفر
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PharmacyManagementClient from './PharmacyManagementClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة الصيدلية - Spir Medical' };

export default async function PharmacyManagementPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // تحقق أنه صيدلاني
  const { data: profile } = await supabase
    .from('users')
    .select('role, specialist_type, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'specialist' || profile.specialist_type !== 'pharmacist') {
    return (
      <main className="app-screen">
        <div className="scr-content" style={{ paddingTop: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>غير مصرّح</h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
            هذه الصفحة للصيدلاني فقط
          </p>
          <Link
            href="/specialist"
            style={{
              display: 'inline-block',
              marginTop: 16,
              padding: '10px 20px',
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            العودة للوحة
          </Link>
        </div>
      </main>
    );
  }

  // جلب الصيدلية المرتبطة بالصيدلاني
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (!pharmacy) {
    return (
      <main className="app-screen">
        <div className="scr-content" style={{ paddingTop: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>لم يتم ربط صيدلية بحسابك</h2>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
            تواصل مع إدارة Spir Medical لربط صيدليتك
          </p>
        </div>
      </main>
    );
  }

  // جلب المخزون
  const { data: inventory } = await supabase
    .from('pharmacy_inventory')
    .select(`
      id,
      is_available,
      custom_price,
      brand_variant,
      notes,
      searched_count,
      added_at,
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
        requires_prescription
      )
    `)
    .eq('pharmacy_id', pharmacy.id)
    .order('updated_at', { ascending: false });

  // جلب الكتالوج الكامل (للإضافة)
  const { data: allMedications } = await supabase
    .from('medications')
    .select('id, name_ar, name_en, category, strength, manufacturer')
    .order('name_ar')
    .limit(500);

  return (
    <PharmacyManagementClient
      pharmacy={pharmacy}
      inventory={(inventory || []) as unknown as Array<{
        id: string;
        is_available: boolean;
        custom_price: number | null;
        brand_variant: string | null;
        notes: string | null;
        searched_count: number;
        added_at: string;
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
        } | null;
      }>}
      allMedications={allMedications || []}
    />
  );
}
