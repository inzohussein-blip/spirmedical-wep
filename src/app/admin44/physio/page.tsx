// ═══════════════════════════════════════════════════════════════
// 🏃 V26.1: Admin - إدارة أخصائيي العلاج الطبيعي
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PhysioAdminClient from './PhysioAdminClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'إدارة أخصائيي العلاج الطبيعي - Admin' };

export default async function AdminPhysioPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // جلب كل أخصائيي العلاج الطبيعي
  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      
      select: (cols: string) => any;
    };
  };

  
  const physiosQuery = await supabaseAny
    .from('physio_specialists')
    .select('*')
    .order('created_at', { ascending: false });

  const physios = (physiosQuery.data as Array<{
    id: string;
    full_name: string;
    title: string;
    gender: string | null;
    bio: string | null;
    years_experience: number;
    specialties: string[];
    cities: string[];
    home_visit_price: number;
    clinic_visit_price: number;
    rating_avg: number;
    rating_count: number;
    total_sessions: number;
    is_verified: boolean;
    is_active: boolean;
    available_for_home: boolean;
    available_for_clinic: boolean;
    created_at: string;
  }>) ?? [];

  // إحصاءات
  const totalCount = physios.length;
  const verifiedCount = physios.filter((p) => p.is_verified).length;
  const activeCount = physios.filter((p) => p.is_active).length;
  const avgRating = physios.length > 0
    ? (physios.reduce((sum, p) => sum + (p.rating_avg || 0), 0) / physios.length).toFixed(1)
    : '0.0';

  return (
    <div style={{ padding: 16, maxWidth: 1280, margin: '0 auto', fontFamily: 'Tajawal, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link 
          href="/admin44" 
          style={{ 
            color: '#5F6368', 
            textDecoration: 'none', 
            fontSize: 13,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← العودة للوحة الإدارة
        </Link>
        <h1 style={{ 
          fontSize: 26, fontWeight: 900, margin: '8px 0 4px', color: '#202124',
        }}>
          🏃 إدارة أخصائيي العلاج الطبيعي
        </h1>
        <p style={{ fontSize: 13, color: '#5F6368', margin: 0 }}>
          إدارة شاملة للأخصائيين + التحقق + الأسعار
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        <StatCard label="إجمالي الأخصائيين" value={totalCount} color="#01875F" bg="#E6F3EF" />
        <StatCard label="معتمدون" value={verifiedCount} color="#1A73E8" bg="#E8F0FE" />
        <StatCard label="نشطون" value={activeCount} color="#FF6D00" bg="#FFF3E0" />
        <StatCard label="متوسط التقييم" value={`${avgRating} ⭐`} color="#FBBC04" bg="#FEF7E0" />
      </div>

      {/* Client component */}
      <PhysioAdminClient physios={physios} />
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
    <div style={{
      background: bg,
      borderRadius: 14,
      padding: 16,
    }}>
      <div style={{ fontSize: 11, color: '#5F6368', fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color }}>
        {value}
      </div>
    </div>
  );
}
