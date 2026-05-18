import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';
import AppointmentStatusCard from '@/components/appointments/AppointmentStatusCard';
import AppointmentTimeline from '@/components/appointments/AppointmentTimeline';
import AppointmentActions from '@/components/appointments/AppointmentActions';
import {
  Stethoscope, Calendar, Clock, Smartphone, MessageCircle, Send,
  MapPin, FileText, Lock,
} from 'lucide-react';

export const metadata = {
  title: 'تفاصيل الموعد · سباير ميديكال',
};

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

function formatDateArabic(iso: string): string {
  return new Date(iso).toLocaleString('ar-IQ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} ساعة` : `${hours}س ${mins}د`;
}

export default async function AppointmentDetailsPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !appointment) notFound();

  // فك تشفير الملاحظات إذا وُجدت
  let decryptedNotes: string | null = null;
  if (appointment.notes_encrypted) {
    try {
      decryptedNotes = decrypt(appointment.notes_encrypted);
    } catch (e) {
      decryptedNotes = '[تعذّر فك التشفير]';
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper, #F4EFE2)', paddingBottom: '40px' }}>
      <div style={{
        background: 'var(--white, #FFFFFF)',
        borderBottom: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/appointments" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--paper-2, #EDE6D3)',
            border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
            borderRadius: '100px',
            padding: '7px 14px',
            fontSize: '13px',
            color: 'var(--ink-2, #1F2A2C)',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            <span>←</span><span>الحجوزات</span>
          </Link>
          <h1 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
            تفاصيل الحجز
          </h1>
          <div style={{
            background: 'var(--paper-2, #EDE6D3)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--ink-3, #6E7878)',
          }}>
            #{appointment.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {/* Status Card */}
        <AppointmentStatusCard
          status={appointment.status}
          scheduledAt={appointment.scheduled_at}
          serviceName={appointment.service_type}
        />

        {/* Service Info */}
        <div style={{
          background: 'var(--white, #FFFFFF)',
          border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
          borderRadius: '16px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'var(--emerald-soft, #D9E5DF)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--emerald-deep, #073B30)',
            }}>
              <Stethoscope size={28} strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>
                {appointment.service_type}
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--ink-3, #6E7878)', fontFamily: 'JetBrains Mono, monospace' }}>
                #{appointment.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: 'var(--paper-3, #FAF6EB)',
              borderRadius: '10px',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-3, #6E7878)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} strokeWidth={2.2} aria-hidden />
                الموعد
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>{formatDateArabic(appointment.scheduled_at)}</span>
            </div>

            {(appointment as any).duration_minutes && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--paper-3, #FAF6EB)',
                borderRadius: '10px',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-3, #6E7878)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} strokeWidth={2.2} aria-hidden />
                  المدة
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>
                  {formatDuration((appointment as any).duration_minutes)}
                </span>
              </div>
            )}

            {(appointment as any).otp_channel && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--paper-3, #FAF6EB)',
                borderRadius: '10px',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-3, #6E7878)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Smartphone size={13} strokeWidth={2.2} aria-hidden />
                  قناة التواصل
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {(appointment as any).otp_channel === 'whatsapp' ? (
                    <><MessageCircle size={13} strokeWidth={2.2} /> WhatsApp</>
                  ) : (
                    <><Send size={13} strokeWidth={2.2} /> Telegram</>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        {appointment.address && appointment.address !== 'خدمة عن بُعد · بدون عنوان' && (
          <div style={{
            background: 'var(--white, #FFFFFF)',
            border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={16} strokeWidth={2.2} aria-hidden />
              عنوان الخدمة
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'var(--ink-2, #1F2A2C)',
              lineHeight: 1.7,
              margin: 0,
              padding: '12px',
              background: 'var(--paper-3, #FAF6EB)',
              borderRadius: '10px',
            }}>
              {appointment.address}
            </p>
          </div>
        )}

        {/* Notes */}
        {decryptedNotes && (
          <div style={{
            background: 'var(--white, #FFFFFF)',
            border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
            borderRadius: '16px',
            padding: '20px',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} strokeWidth={2.2} aria-hidden />
              ملاحظاتك
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'var(--ink-2, #1F2A2C)',
              lineHeight: 1.7,
              margin: 0,
              padding: '12px',
              background: 'var(--paper-3, #FAF6EB)',
              borderRadius: '10px',
              whiteSpace: 'pre-wrap',
            }}>
              {decryptedNotes}
            </p>
            <div style={{
              fontSize: '10px',
              color: 'var(--ink-3, #6E7878)',
              marginTop: '8px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}>
              <Lock size={11} strokeWidth={2.2} aria-hidden />
              الملاحظات مُشفّرة بـ AES-256
            </div>
          </div>
        )}

        {/* Actions */}
        <AppointmentActions
          appointmentId={appointment.id}
          status={appointment.status}
          specialistPhone={null}
          address={appointment.address}
          serviceName={appointment.service_type}
        />

        {/* Timeline */}
        <AppointmentTimeline
          currentStatus={appointment.status}
          createdAt={appointment.created_at}
          confirmedAt={(appointment as any).confirmed_at}
          scheduledAt={appointment.scheduled_at}
          completedAt={(appointment as any).completed_at}
          cancelledAt={(appointment as any).cancelled_at}
          cancellationReason={(appointment as any).cancellation_reason}
          isBloodDraw={(appointment as any).service_id === 'blood-draw'}
        />
      </div>
    </div>
  );
}
