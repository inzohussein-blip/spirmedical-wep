import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { SPECIALIST_META, type SpecialistType } from '@/lib/specialist-types';
import { decrypt } from '@/lib/encryption';
import OrderActionsBar from './OrderActionsBar';
import LabResultsForm from './role-forms/LabResultsForm';
import NursingActions from './role-forms/NursingActions';
import PrescriptionForm from './role-forms/PrescriptionForm';
import DrugConsultation from './role-forms/DrugConsultation';
import SessionPlan from './role-forms/SessionPlan';
import SessionNotes from './role-forms/SessionNotes';
import MealPlan from './role-forms/MealPlan';
import {
  User, Phone, Calendar, MapPin, FileText, ClipboardList,
} from 'lucide-react';

export const metadata = {
  title: 'تفاصيل الطلب · لوحة الاختصاصي',
};

export const dynamic = 'force-dynamic';

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'جديد', color: 'scr-tag-amber' },
  confirmed: { label: 'مؤكّد', color: 'scr-tag-success' },
  in_progress: { label: 'قيد التنفيذ', color: 'scr-tag-amber' },
  completed: { label: 'مكتمل', color: 'scr-tag-success' },
  cancelled: { label: 'ملغى', color: 'scr-tag-emergency' },
};

export default async function SpecialistOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('specialist_type, approval_status')
    .eq('id', user.id)
    .single();

  const specialistType = (profile?.specialist_type ?? 'doctor') as SpecialistType;
  const meta = SPECIALIST_META[specialistType] ?? SPECIALIST_META.doctor;

  const { data: order } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!order) notFound();

  // جلب بيانات المريض
  const { data: patient } = await supabase
    .from('users')
    .select('id, full_name, phone, governorate, medical_info')
    .eq('id', order.user_id)
    .single();

  // فك تشفير الملاحظات لو موجودة
  let notesText: string | null = null;
  if (order.notes_encrypted) {
    try { notesText = decrypt(order.notes_encrypted); } catch { notesText = '(تعذّر فك التشفير)'; }
  }

  const status = STATUS_META[order.status] ?? STATUS_META.pending;
  const date = new Date(order.scheduled_at);
  const isMine = order.assigned_specialist_id === user.id;
  const canAccept = !order.assigned_specialist_id && order.status === 'pending';
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  const orderAny = order as Record<string, unknown>;

  // اختر الفورم الخاص بالاختصاص
  function RoleForm() {
    if (!isMine || isCompleted || isCancelled) return null;
    if (!order) return null; // safeguard

    const commonProps = {
      orderId: order.id,
      initialData: null as never,
    };

    switch (specialistType) {
      case 'lab_analyst':
        return <LabResultsForm {...commonProps} initialData={(orderAny.lab_results_data ?? null) as never} />;
      case 'nurse':
        return <NursingActions {...commonProps} initialData={(orderAny.nursing_actions ?? null) as never} />;
      case 'doctor':
        return <PrescriptionForm {...commonProps} initialData={(orderAny.prescription_data ?? null) as never} patientId={order.user_id} />;
      case 'pharmacist':
        return <DrugConsultation {...commonProps} initialData={(orderAny.prescription_data ?? null) as never} />;
      case 'physio':
        return <SessionPlan {...commonProps} initialData={(orderAny.session_plan ?? null) as never} />;
      case 'psychologist':
        return <SessionNotes {...commonProps} initialData={(orderAny.session_plan ?? null) as never} />;
      case 'nutritionist':
        return <MealPlan {...commonProps} initialData={(orderAny.session_plan ?? null) as never} />;
      default:
        return null;
    }
  }

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/specialist/orders" className="scr-back-btn">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">تفاصيل الطلب</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* بانر الاختصاص */}
        <div style={{
          background: meta.gradient,
          color: 'var(--white)',
          padding: '14px 18px',
          borderRadius: 14,
          marginTop: 12,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: 28 }}>{meta.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{order.service_type}</div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>{meta.label}</div>
          </div>
          <span className={`scr-tag ${status.color}`} style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--white)' }}>
            {status.label}
          </span>
        </div>

        {/* معلومات المريض */}
        <div className="scr-section-head">
          <div className="scr-section-title">المريض</div>
        </div>
        <div className="scr-list-stack">
          <div className="scr-list-item">
            <div className="scr-list-item-icon">
              <User size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">{patient?.full_name ?? 'مريض'}</div>
              <div className="scr-list-item-subtitle">{patient?.governorate ?? '—'}</div>
            </div>
            {patient?.phone && (
              <a href={`tel:${patient.phone}`} className="scr-action-btn">
                <Phone size={16} strokeWidth={2.2} />
              </a>
            )}
          </div>
        </div>

        {/* تفاصيل الموعد */}
        <div className="scr-section-head" style={{ marginTop: 16 }}>
          <div className="scr-section-title">تفاصيل الموعد</div>
        </div>
        <div className="scr-list-stack">
          <div className="scr-list-item">
            <div className="scr-list-item-icon">
              <Calendar size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">
                {date.toLocaleDateString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="scr-list-item-subtitle">
                {date.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          {order.address && (
            <div className="scr-list-item">
              <div className="scr-list-item-icon">
                <MapPin size={22} strokeWidth={2} />
              </div>
              <div className="scr-list-item-content">
                <div className="scr-list-item-title">العنوان</div>
                <div className="scr-list-item-subtitle">{order.address}</div>
              </div>
            </div>
          )}
          {notesText && (
            <div className="scr-list-item">
              <div className="scr-list-item-icon">
                <FileText size={22} strokeWidth={2} />
              </div>
              <div className="scr-list-item-content">
                <div className="scr-list-item-title">ملاحظات المريض</div>
                <div className="scr-list-item-subtitle">{notesText}</div>
              </div>
            </div>
          )}
        </div>

        {/* السجل الطبي (للطبيب فقط) */}
        {specialistType === 'doctor' && patient?.medical_info && (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={16} strokeWidth={2.2} />
                ملف المريض الطبي
              </div>
            </div>
            <div style={{ background: 'var(--paper-3)', padding: 12, borderRadius: 12, fontSize: 12, lineHeight: 1.8 }}>
              <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(patient.medical_info, null, 2)}
              </pre>
            </div>
          </>
        )}

        {/* الفورم الخاص بالاختصاص */}
        <RoleForm />

        {/* أزرار الإجراءات */}
        <OrderActionsBar
          orderId={order.id}
          status={order.status}
          isMine={isMine}
          canAccept={canAccept}
          patientPhone={patient?.phone ?? null}
        />
      </div>
    </main>
  );
}
