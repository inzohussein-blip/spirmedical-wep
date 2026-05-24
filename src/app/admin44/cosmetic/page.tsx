// ═══════════════════════════════════════════════════════════════
// 💄 V26.1: Admin - إدارة منتجات التجميل
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CosmeticAdminClient from './CosmeticAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة منتجات التجميل - Admin' };

export default async function AdminCosmeticPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      
      select: (cols: string) => any;
    };
  };

  
  const productsQuery = await supabaseAny
    .from('cosmetic_products')
    .select('*')
    .order('created_at', { ascending: false });

  const products = (productsQuery.data as Array<{
    id: string;
    name: string;
    name_en: string | null;
    brand: string;
    category: string;
    price: number;
    discount_price: number | null;
    image_emoji: string;
    is_active: boolean;
    is_in_stock: boolean;
    is_recommended: boolean;
    rating_avg: number;
    rating_count: number;
    country_of_origin: string | null;
    created_at: string;
  }>) ?? [];

  // إحصاءات
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.is_active).length;
  const inStockCount = products.filter((p) => p.is_in_stock).length;
  const recommendedCount = products.filter((p) => p.is_recommended).length;

  return (
    <div style={{ padding: 16, maxWidth: 1280, margin: '0 auto', fontFamily: 'Tajawal, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link 
          href="/admin44" 
          style={{ 
            color: '#5F6368', textDecoration: 'none', fontSize: 13,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          ← العودة للوحة الإدارة
        </Link>
        <h1 style={{ 
          fontSize: 26, fontWeight: 900, margin: '8px 0 4px', color: '#202124',
        }}>
          💄 إدارة منتجات التجميل
        </h1>
        <p style={{ fontSize: 13, color: '#5F6368', margin: 0 }}>
          إدارة الكتالوج + الأسعار + المنتجات الموصى بها
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        <StatCard label="إجمالي المنتجات" value={totalCount} color="#9334E6" bg="#F3E8FD" />
        <StatCard label="نشطة" value={activeCount} color="#01875F" bg="#E6F3EF" />
        <StatCard label="متوفّرة" value={inStockCount} color="#1A73E8" bg="#E8F0FE" />
        <StatCard label="موصى بها" value={recommendedCount} color="#FBBC04" bg="#FEF7E0" />
      </div>

      <CosmeticAdminClient products={products} />
    </div>
  );
}

function StatCard({ 
  label, value, color, bg 
}: { 
  label: string; 
  value: string | number; 
  color: string; 
  bg: string;
}) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 11, color: '#5F6368', fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color }}>
        {value}
      </div>
    </div>
  );
}
