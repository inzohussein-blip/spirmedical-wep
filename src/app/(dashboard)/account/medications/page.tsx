// ═══════════════════════════════════════════════════════════════
// 💊 V25.46: My Medications Page
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowRight, Pill, Plus, Search } from 'lucide-react';
import MyMedicationsClient from './MyMedicationsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'أدويتي · سباير ميديكال' };

export default async function MyMedicationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
            select: (cols: string) => any;
    };
  };

  
  const result = await supabaseAny
    .from('user_medications')
    .select(`
      *,
      medications (id, name_ar, name_en, generic_name, form, strength)
    `)
    .eq('user_id', user.id)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false });

  const medications = (result.data as Array<{
    id: string;
    medication_id: string | null;
    custom_name: string | null;
    dosage: string | null;
    frequency: string | null;
    timing: string[] | null;
    notes: string | null;
    start_date: string | null;
    end_date: string | null;
    is_chronic: boolean;
    is_active: boolean;
    enable_reminders: boolean;
    created_at: string;
    medications?: { name_ar: string; form: string | null; strength: string | null };
  }>) ?? [];

  const activeCount = medications.filter((m) => m.is_active).length;
  const chronicCount = medications.filter((m) => m.is_chronic).length;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">أدويتي</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">قائمة الأدوية المعتادة + تذكير الجرعات</p>

        {/* Stats */}
        {medications.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 8,
            marginTop: 8,
          }}>
            <div className="service-card service-emerald">
              <div className="service-icon"><Pill size={22} strokeWidth={2} /></div>
              <div className="service-title">{activeCount}</div>
              <div className="service-desc">دواء نشط</div>
            </div>
            <div className="service-card service-amber">
              <div className="service-icon"><Pill size={22} strokeWidth={2} /></div>
              <div className="service-title">{chronicCount}</div>
              <div className="service-desc">مزمن</div>
            </div>
          </div>
        )}

        <MyMedicationsClient medications={medications} />

        {medications.length > 0 && (
          <Link 
            href="/services/pharmacies/search"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 16,
              padding: 12,
              background: 'var(--paper-2)',
              borderRadius: 10,
              textDecoration: 'none',
              color: 'var(--ink)',
              fontSize: 13,
              fontWeight: 700,
              border: '1px solid var(--line)',
            }}
          >
            <Search size={16} strokeWidth={2.2} aria-hidden />
            ابحث عن أدويتك في الصيدليات ←
          </Link>
        )}
      </div>
    </main>
  );
}
