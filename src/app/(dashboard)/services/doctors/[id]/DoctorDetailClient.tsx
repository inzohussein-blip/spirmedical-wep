'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, MapPin, Phone, Star, Stethoscope, Video, Home,
  Award, Languages, CheckCircle2, Calendar, MessageCircle,
  Sparkles, Loader2, Building2,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { subscribeToDoctor, startConsultation } from './actions';
import { track } from '@/lib/analytics';
import ShareButton from '@/components/pwa/ShareButton';
import LazyImage from '@/components/ui/LazyImage';

interface Doctor {
  id: string;
  full_name: string;
  title: string;
  gender: 'male' | 'female' | null;
  specialty: string;
  sub_specialty: string | null;
  years_experience: number;
  qualifications: string[] | null;
  available_for_home_visit: boolean;
  available_for_video: boolean;
  available_for_clinic: boolean;
  home_visit_price: number;
  video_consult_price: number;
  monthly_subscription_price: number | null;
  yearly_subscription_price: number | null;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_city: string | null;
  clinic_phone: string | null;
  languages: string[];
  rating_avg: number;
  rating_count: number;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface Subscription {
  id: string;
  plan: 'monthly' | 'yearly';
  expires_at: string;
  visits_used: number;
  consultations_used: number;
}

interface Props {
  doctor: Doctor;
  activeSubscription: Subscription | null;
}

const SPECIALTIES: Record<string, { label: string; emoji: string }> = {
  family_medicine: { label: 'طب عائلة', emoji: '👨‍👩‍👧‍👦' },
  pediatrics: { label: 'أطفال', emoji: '👶' },
  internal: { label: 'باطنية', emoji: '🩺' },
  cardiology: { label: 'قلبية', emoji: '❤️' },
  gynecology: { label: 'نسائية', emoji: '👩' },
  orthopedics: { label: 'عظام', emoji: '🦴' },
  dermatology: { label: 'جلدية', emoji: '🧴' },
  psychiatry: { label: 'نفسية', emoji: '🧠' },
  general: { label: 'طب عام', emoji: '⚕️' },
};

export default function DoctorDetailClient({ doctor, activeSubscription }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const specMeta = SPECIALTIES[doctor.specialty];

  const handleSubscribe = (plan: 'monthly' | 'yearly') => {
    const price = plan === 'monthly'
      ? doctor.monthly_subscription_price
      : doctor.yearly_subscription_price;

    if (!price) return;

    if (!confirm(
      `تأكيد الاشتراك ${plan === 'monthly' ? 'الشهري' : 'السنوي'} مع ${doctor.title} ${doctor.full_name}\n\nالسعر: ${price.toLocaleString('ar-IQ')} د.ع\nالدفع: كاش عند الاستلام\n\nهل تريد المتابعة؟`
    )) return;

    startTransition(async () => {
      const result = await subscribeToDoctor(doctor.id, plan);
      if (result.success) {
        track('subscription_started', {
          doctor_id: doctor.id,
          subscription_plan: plan,
          total_price: price,
        });
        toast.success('تم الاشتراك بنجاح!');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل الاشتراك');
      }
    });
  };

  const handleStartConsultation = () => {
    startTransition(async () => {
      const result = await startConsultation(doctor.id);
      if (result.success && result.consultationId) {
        track('consultation_started', {
          doctor_id: doctor.id,
          consultation_id: result.consultationId,
        });
        router.push(`/consultations/${result.consultationId}`);
      } else {
        toast.error(result.error || 'فشل بدء الاستشارة');
      }
    });
  };

  return (
    <main className="app-screen">
      <div className="scr-content" style={{ paddingBottom: 90 }}>
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/services/doctors" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title" style={{ fontSize: 15 }}>
            {doctor.title} {doctor.full_name.split(' ').slice(0, 2).join(' ')}
          </h1>
          <ShareButton
            variant="icon"
            size="sm"
            title={`${doctor.title} ${doctor.full_name}`}
            text={`طبيب على Spir Medical - ${doctor.specialty || 'طب عام'}`}
            url={`/services/doctors/${doctor.id}`}
            label="مشاركة"
          />
        </div>

        {/* Hero card */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--emerald), var(--emerald-deep))',
            color: 'var(--paper-3)',
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              insetInlineEnd: -30,
              width: 140,
              height: 140,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '50%',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                fontSize: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {doctor.avatar_url ? (
                <LazyImage
                  src={doctor.avatar_url}
                  alt={doctor.full_name || 'طبيب'}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                doctor.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                {doctor.title} {doctor.full_name}
                {doctor.is_verified && <CheckCircle2 size={16} fill="currentColor" />}
              </h2>
              <p style={{ fontSize: 13, opacity: 0.9, margin: '2px 0 0' }}>
                {specMeta?.emoji} {specMeta?.label || doctor.specialty}
                {doctor.sub_specialty && ` · ${doctor.sub_specialty}`}
              </p>
              {doctor.rating_count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <Star size={12} fill="currentColor" />
                  <span style={{ fontSize: 12, fontWeight: 800 }}>{doctor.rating_avg.toFixed(1)}</span>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>({doctor.rating_count})</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginTop: 14,
              position: 'relative',
            }}
          >
            {doctor.years_experience > 0 && (
              <StatBox icon={<Award size={14} />} value={`${doctor.years_experience}`} label="سنة خبرة" />
            )}
            {doctor.languages.length > 0 && (
              <StatBox icon={<Languages size={14} />} value={doctor.languages.length.toString()} label="لغة" />
            )}
            {doctor.clinic_city && (
              <StatBox icon={<MapPin size={14} />} value={doctor.clinic_city} label="المدينة" />
            )}
          </div>
        </div>

        {/* Active subscription banner */}
        {activeSubscription && (
          <div
            style={{
              background: 'var(--emerald-soft)',
              border: '1px solid var(--emerald)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Sparkles size={20} color="var(--emerald)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--emerald-deep)' }}>
                لديك اشتراك نشط {activeSubscription.plan === 'monthly' ? 'شهري' : 'سنوي'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--emerald)', marginTop: 2 }}>
                ينتهي في {new Date(activeSubscription.expires_at).toLocaleDateString('ar-IQ')}
                {' · '}{activeSubscription.consultations_used} استشارات مُستخدمة
              </div>
            </div>
          </div>
        )}

        {/* Bio */}
        {doctor.bio && (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 6px', color: 'var(--ink)' }}>
              نبذة
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.7 }}>
              {doctor.bio}
            </p>
          </div>
        )}

        {/* Qualifications */}
        {doctor.qualifications && doctor.qualifications.length > 0 && (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)' }}>
              المؤهلات والشهادات
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {doctor.qualifications.map((q, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    padding: '6px 0',
                    borderBottom: idx < doctor.qualifications!.length - 1 ? '1px solid var(--line)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Award size={12} color="var(--emerald)" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clinic info */}
        {(doctor.clinic_name || doctor.clinic_address) && (
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>
              <Building2 size={14} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 4 }} />
              العيادة
            </h3>
            {doctor.clinic_name && (
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                {doctor.clinic_name}
              </div>
            )}
            {doctor.clinic_address && (
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                {doctor.clinic_address}
              </div>
            )}
            {doctor.clinic_phone && (
              <a
                href={`tel:${doctor.clinic_phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 8,
                  padding: '6px 12px',
                  background: 'var(--paper-3)',
                  color: 'var(--emerald)',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                <Phone size={12} />
                {doctor.clinic_phone}
              </a>
            )}
          </div>
        )}

        {/* Booking options */}
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>
          خيارات الحجز
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {/* Home visit */}
          {doctor.available_for_home_visit && (
            <Link
              href={`/appointments/new?service=home-doctor-visit&doctor=${doctor.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                background: 'var(--white)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--emerald-soft)',
                  color: 'var(--emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Home size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>زيارة منزلية</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>الطبيب يأتي لمنزلك</div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--emerald)' }}>
                  {doctor.home_visit_price.toLocaleString('ar-IQ')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>د.ع · كاش</div>
              </div>
            </Link>
          )}

          {/* Chat consultation */}
          <button
            type="button"
            onClick={handleStartConsultation}
            disabled={isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              cursor: isPending ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              textAlign: 'start',
              width: '100%',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--amber-soft)',
                color: 'var(--amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageCircle size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>استشارة نصّية</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                أرسل أسئلة وصور · رد خلال 24 ساعة
              </div>
            </div>
            <div style={{ textAlign: 'end' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--emerald)' }}>
                {activeSubscription ? 'مجاناً' : doctor.video_consult_price.toLocaleString('ar-IQ')}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                {activeSubscription ? 'ضمن الاشتراك' : 'د.ع · كاش'}
              </div>
            </div>
          </button>
        </div>

        {/* Subscriptions */}
        {!activeSubscription && (doctor.monthly_subscription_price || doctor.yearly_subscription_price) && (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px' }}>
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 4, color: 'var(--emerald)' }} />
              اشتراك طبيب العائلة
            </h3>
            <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 10px' }}>
              استشارات غير محدودة + متابعة دورية + أولوية في الردّ
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {doctor.monthly_subscription_price && (
                <button
                  type="button"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={isPending}
                  style={{
                    padding: 16,
                    background: 'var(--white)',
                    border: '2px solid var(--emerald)',
                    borderRadius: 14,
                    cursor: isPending ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'var(--emerald)',
                      color: 'var(--paper-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Calendar size={22} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'start' }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>اشتراك شهري</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      30 يوم · استشارات + 2 زيارة
                    </div>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--emerald)' }}>
                      {doctor.monthly_subscription_price.toLocaleString('ar-IQ')}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>د.ع</div>
                  </div>
                </button>
              )}

              {doctor.yearly_subscription_price && (
                <button
                  type="button"
                  onClick={() => handleSubscribe('yearly')}
                  disabled={isPending}
                  style={{
                    padding: 16,
                    background: 'linear-gradient(135deg, var(--emerald), var(--emerald-deep))',
                    color: 'var(--paper-3)',
                    border: 'none',
                    borderRadius: 14,
                    cursor: isPending ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      insetInlineEnd: 12,
                      background: 'var(--amber)',
                      color: 'var(--paper-3)',
                      fontSize: 9,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    ⭐ الأفضل
                  </span>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={22} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'start' }}>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>اشتراك سنوي</div>
                    <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                      365 يوم · استشارات + 12 زيارة
                    </div>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>
                      {doctor.yearly_subscription_price.toLocaleString('ar-IQ')}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.85 }}>د.ع/سنة</div>
                  </div>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div
      style={{
        padding: 8,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: 10,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2, opacity: 0.85 }}>
        {icon}
      </div>
      <div style={{ fontSize: 13, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 9, opacity: 0.75, marginTop: 1 }}>{label}</div>
    </div>
  );
}
