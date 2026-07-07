import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import {
  ArrowRight, Calendar, MapPin, Building2, TestTube, FileText,
  CheckCircle2, Clock, AlertCircle, Phone, Lock, Download, AlertTriangle,
} from 'lucide-react';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';
import { SHOW_PRICES } from '@/lib/config/pricing';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `تفاصيل الطلب · سباير ميديكال`,
  };
}

/**
 * ════════════════════════════════════════════════════════════════════
 * 🩸 V25.43: Lab Order Detail Page
 * ════════════════════════════════════════════════════════════════════
 * 
 * يعرض:
 *   • تفاصيل lab_order (التحاليل، المختبر، التسعير)
 *   • appointment status
 *   • lab_results (لو متاحة)
 *   • تنبيه الصيام
 *   • زرّ تواصل مع المختبر
 * ════════════════════════════════════════════════════════════════════
 */

const STATUS_META: Record<string, { label: string; color: string; description: string }> = {
  pending: { 
    label: 'قيد الانتظار', 
    color: '#A57100', 
    description: 'انتظار وصول الـ specialist للسحب' 
  },
  sample_collected: { 
    label: 'تمّ السحب', 
    color: '#A57100', 
    description: 'العينة جُمعت ويتم نقلها للمختبر' 
  },
  sent_to_lab: { 
    label: 'في المختبر', 
    color: '#A57100', 
    description: 'العينة وصلت للمختبر للتحليل' 
  },
  processing: { 
    label: 'قيد التحليل', 
    color: '#A57100', 
    description: 'يتم تحليل العينة الآن' 
  },
  results_ready: { 
    label: 'النتائج جاهزة', 
    color: '#0F6E56', 
    description: 'النتائج جاهزة للعرض' 
  },
  delivered: { 
    label: 'مكتمل', 
    color: '#0F6E56', 
    description: 'تمّ تسليم النتائج' 
  },
  cancelled: { 
    label: 'ملغى', 
    color: '#A32D2D', 
    description: 'تمّ إلغاء الطلب' 
  },
};

const RESULT_STATUS_META: Record<string, { label: string; color: string; bgColor: string }> = {
  normal: { label: 'طبيعي', color: '#0F6E56', bgColor: '#E1F5EE' },
  low: { label: 'منخفض', color: '#A57100', bgColor: '#FAEEDA' },
  high: { label: 'مرتفع', color: '#A57100', bgColor: '#FAEEDA' },
  critical: { label: 'حرج', color: '#A32D2D', bgColor: '#FCEBEB' },
  inconclusive: { label: 'غير حاسم', color: '#6B7280', bgColor: '#F3F4F6' },
};

export default async function LabOrderDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

    const supabaseAny = supabase as any;
  
  // جلب الطلب مع كل التفاصيل
  const { data: order } = await supabaseAny
    .from('lab_orders')
    .select(`
      *,
      appointments (*),
      lab_results (*)
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!order) {
    notFound();
  }

  const status = STATUS_META[order.status] ?? STATUS_META.pending;
  const appointment = order.appointments;
  
    const results = (order.lab_results || []) as Array<any>;
  
  // تواريخ
  const orderDate = new Date(order.created_at).toLocaleDateString('ar-IQ', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  
  const scheduledDate = appointment?.scheduled_at 
    ? new Date(appointment.scheduled_at).toLocaleDateString('ar-IQ', {
        day: 'numeric', month: 'long', year: 'numeric', 
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  // علِّم النتائج كمشاهدة عند الزيارة
  if (results.some((r) => !r.viewed_by_patient)) {
    await supabaseAny
      .from('lab_results')
      .update({ viewed_by_patient: true, viewed_at: new Date().toISOString() })
      .eq('lab_order_id', order.id)
      .eq('viewed_by_patient', false);
  }

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account/lab-history" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">تفاصيل الطلب</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Status Card */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: 16,
          marginTop: 12,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: status.color,
            }} />
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
              {status.label}
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
            {status.description}
          </div>
          {scheduledDate && (
            <div style={{ 
              marginTop: 12, 
              paddingTop: 12, 
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--ink-3)',
            }}>
              <Calendar size={13} strokeWidth={2.2} aria-hidden />
              <span>الموعد: {scheduledDate}</span>
            </div>
          )}
        </div>

        {/* Fasting warning */}
        {order.needs_fasting && order.status === 'pending' && (
          <div className="scr-info-banner" style={{ 
            background: '#FAEEDA', 
            borderColor: '#F0D7A4',
            marginBottom: 12,
          }}>
            <AlertTriangle size={14} strokeWidth={2.2} aria-hidden style={{ color: '#A57100' }} />
            <span style={{ color: '#412402', fontWeight: 600 }}>
              مهم: صيام {order.fasting_hours} ساعة قبل سحب الدم
            </span>
          </div>
        )}

        {/* Tests List */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">
            <TestTube size={16} strokeWidth={2} style={{ marginLeft: 6, verticalAlign: '-3px' }} aria-hidden />
            التحاليل المطلوبة ({order.test_ids.length})
          </div>
        </div>

        <div className="scr-list-stack">
          {order.test_ids.map((testId: string) => {
            const test = BLOOD_TESTS.find((t) => t.id === testId);
            const result = results.find((r) => r.test_id === testId);
            
            return (
              <div key={testId} className="scr-list-item" style={{ alignItems: 'flex-start' }}>
                <div className="scr-list-item-icon" aria-hidden="true">
                  <TestTube size={20} strokeWidth={2} />
                </div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">
                    {test?.nameAr || testId}
                  </div>
                  <div className="scr-list-item-subtitle" style={{ fontSize: 11 }}>
                    {test?.code}
                  </div>
                  
                  {/* Result */}
                  {result ? (
                    <div style={{
                      marginTop: 8,
                      padding: 10,
                      background: RESULT_STATUS_META[result.status]?.bgColor || '#F3F4F6',
                      borderRadius: 8,
                      fontSize: 12,
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}>
                        <strong style={{ 
                          color: RESULT_STATUS_META[result.status]?.color || '#374151',
                          fontSize: 14,
                        }}>
                          {result.result_value} {result.unit}
                        </strong>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: RESULT_STATUS_META[result.status]?.color || '#6B7280',
                          color: 'white',
                        }}>
                          {RESULT_STATUS_META[result.status]?.label || 'غير محدد'}
                        </span>
                      </div>
                      {result.normal_range_text && (
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                          المعدّل الطبيعي: {result.normal_range_text}
                        </div>
                      )}
                      {result.notes && (
                        <div style={{ 
                          fontSize: 11, 
                          color: 'var(--ink-2)', 
                          marginTop: 6,
                          paddingTop: 6,
                          borderTop: '1px solid rgba(0,0,0,0.05)',
                        }}>
                          {result.notes}
                        </div>
                      )}
                      {result.pdf_url && (
                        <a
                          href={result.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 8,
                            fontSize: 11,
                            color: '#0F6E56',
                            textDecoration: 'underline',
                          }}
                        >
                          <Download size={11} strokeWidth={2.5} aria-hidden />
                          تحميل PDF
                        </a>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      marginTop: 8,
                      padding: 8,
                      background: 'var(--paper-2)',
                      borderRadius: 6,
                      fontSize: 11,
                      color: 'var(--ink-3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Clock size={11} strokeWidth={2.2} aria-hidden />
                      <span>النتيجة لم تجهز بعد</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lab Info */}
        {order.lab_name_snapshot && (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">
                <Building2 size={16} strokeWidth={2} style={{ marginLeft: 6, verticalAlign: '-3px' }} aria-hidden />
                المختبر
              </div>
            </div>
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {order.lab_name_snapshot}
              </div>
            </div>
          </>
        )}

        {/* Pricing — يُخفى في واجهة المريض عبر SHOW_PRICES */}
        {SHOW_PRICES && (
        <>
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">
            <FileText size={16} strokeWidth={2} style={{ marginLeft: 6, verticalAlign: '-3px' }} aria-hidden />
            الفاتورة
          </div>
        </div>
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--ink-2)' }}>سحب الدم المنزلي</span>
            <span style={{ fontWeight: 600 }}>{order.draw_fee.toLocaleString('ar-IQ')} د.ع</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--ink-2)' }}>التحاليل ({order.test_ids.length})</span>
            <span style={{ fontWeight: 600 }}>{order.tests_total.toLocaleString('ar-IQ')} د.ع</span>
          </div>
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#0F6E56' }}>
              <span>خصم</span>
              <span style={{ fontWeight: 600 }}>-{order.discount.toLocaleString('ar-IQ')} د.ع</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 10,
            marginTop: 4,
            borderTop: '1px solid var(--line)',
            fontSize: 16,
            fontWeight: 700,
          }}>
            <span>الإجمالي</span>
            <span style={{ color: '#0F6E56' }}>{order.total_price.toLocaleString('ar-IQ')} د.ع</span>
          </div>
        </div>
        </>
        )}

        {/* Footer */}
        <div className="scr-info-banner" style={{ marginTop: 16 }}>
          <Lock size={14} strokeWidth={2.2} aria-hidden />
          <span>نتائجك مُشفّرة ومحفوظة بأمان · رقم الطلب: {order.id.slice(0, 8)}</span>
        </div>
      </div>
    </main>
  );
}
