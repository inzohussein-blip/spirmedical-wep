'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

interface RatingInput {
  appointment_id: string;
  overall_rating: number;
  punctuality_rating?: number;
  professionalism_rating?: number;
  cleanliness_rating?: number;
  review_text?: string;
  tags?: string[];
  is_anonymous?: boolean;
}

export async function submitRating(input: RatingInput) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  // Validation
  if (input.overall_rating < 1 || input.overall_rating > 5) {
    return { ok: false, error: 'التقييم العام يجب أن يكون بين 1 و 5' };
  }

  // تأكد أن الموعد للمستخدم وأنه completed
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, user_id, status, specialist_id, assigned_specialist_id')
    .eq('id', input.appointment_id)
    .single();

  if (!appointment) return { ok: false, error: 'الموعد غير موجود' };
  if (appointment.user_id !== user.id) return { ok: false, error: 'غير مسموح' };

  // 🆕 V31: لا يُسمح بالتقييم إلا بعد إكمال الموعد فعلياً
  if (appointment.status !== 'completed') {
    return { ok: false, error: 'يمكن التقييم بعد إكمال الموعد فقط' };
  }

  // تحقق من عدم وجود تقييم سابق
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('appointment_id', input.appointment_id)
    .maybeSingle();

  if (existing) return { ok: false, error: 'تم تقييم هذا الموعد مسبقاً' };

  // ✨ V25.6: يستخدم assigned_specialist_id (الجديد) أو specialist_id (legacy)
  const specialistId = appointment.assigned_specialist_id ?? appointment.specialist_id;

  const { error } = await supabase.from('ratings').insert({
    appointment_id: input.appointment_id,
    user_id: user.id,
    specialist_id: specialistId,
    overall_rating: input.overall_rating,
    punctuality_rating: input.punctuality_rating ?? null,
    professionalism_rating: input.professionalism_rating ?? null,
    cleanliness_rating: input.cleanliness_rating ?? null,
    review_text: input.review_text?.trim() || null,
    tags: input.tags ?? [],
    is_anonymous: input.is_anonymous ?? false,
    is_published: true,
  } as never);

  if (error) return { ok: false, error: error.message };

  // ─── حفظ أيضاً في جدول المزوّد الخاصّ ───
  //
  // لكلّ نوع مزوّدٍ جدولُ تقييمٍ خاصّ عليه مُشغِّلٌ يحدّث `rating_avg` و
  // `rating_count` على صفّ المزوّد نفسه. و`ratings` العامّ **لا يُشغّل شيئاً**
  // — فما لا يُفرَّع إلى جدوله الخاصّ لا يظهر متوسّطه في أيّ مكان.
  //
  // كانت الكتلة تغطّي ثلاثة أنواع (مستشفى/أسنان/بصريات)، فبقيت خمسة بلا
  // كاتب: **الأطباء والتمريض والعلاج الطبيعي والصحة النفسية والتغذية**.
  // ومعنى ذلك أنّ `doctors.rating_avg` صفرٌ أبداً — بينما صفحة الأطباء
  // تُرتّب به (`.order('rating_avg')`) وتعرضه على كلّ بطاقة.
  //
  // (وهذا يُكمل ما أصلحه الترحيل 0019: هناك صُحّحت صلاحية المُشغِّل نفسه،
  //  وهنا يُوصَل ما يُطلقه.)
  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{ data: Record<string, unknown> | null }>;
        };
      };
      insert: (d: object) => Promise<{ error: unknown }>;
    };
  };

  // إعادة جلب الـ appointment مع الأعمدة الإضافية (hospital_id, dental_clinic_id, optical_store_id)
  const { data: fullAppt } = await supabaseAny
    .from('appointments')
    .select(
      'id, hospital_id, dental_clinic_id, optical_store_id, doctor_id, ' +
      'mental_specialist_id, nutritionist_id, physio_specialist_id, ' +
      'assigned_specialist_id, required_specialist_type',
    )
    .eq('id', input.appointment_id)
    .single();

  if (fullAppt) {
    const hospitalId = fullAppt.hospital_id as string | null;
    const dentalClinicId = fullAppt.dental_clinic_id as string | null;
    const opticalStoreId = fullAppt.optical_store_id as string | null;
    const doctorId = fullAppt.doctor_id as string | null;
    const mentalSpecialistId = fullAppt.mental_specialist_id as string | null;
    const nutritionistId = fullAppt.nutritionist_id as string | null;
    const physioSpecialistId = fullAppt.physio_specialist_id as string | null;
    const assignedSpecialistId = fullAppt.assigned_specialist_id as string | null;
    const requiredType = fullAppt.required_specialist_type as string | null;

    // التقييم العام حُفظ في `ratings` أعلاه؛ النسخة المتخصّصة إضافية.
    // نُسجّل فشلها بدل ابتلاعه — فالصمت هنا هو ما أخفى خلل أسماء الأعمدة سابقاً.
    const logFacilityFailure = (table: string, err: unknown) => {
      if (!err) return;
      const message = (err as { message?: string })?.message ?? String(err);
      logger.error('Facility rating insert failed', {
        table,
        appointment_id: input.appointment_id,
        error: message,
      });
    };

    if (hospitalId) {
      const { error: facilityError } = await supabaseAny.from('hospital_ratings').insert({
        user_id: user.id,
        hospital_id: hospitalId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        cleanliness_rating: input.cleanliness_rating || null,
        staff_rating: input.professionalism_rating || null,
        wait_time_rating: input.punctuality_rating || null,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
      logFacilityFailure('hospital_ratings', facilityError);
    } else if (dentalClinicId) {
      const { error: facilityError } = await supabaseAny.from('dental_ratings').insert({
        user_id: user.id,
        dental_clinic_id: dentalClinicId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        // أسماء أعمدة dental_ratings (0005): hygiene_rating / expertise_rating
        hygiene_rating: input.cleanliness_rating || null,
        expertise_rating: input.professionalism_rating || null,
        price_rating: null,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
      logFacilityFailure('dental_ratings', facilityError);
    } else if (opticalStoreId) {
      const { error: facilityError } = await supabaseAny.from('optical_ratings').insert({
        user_id: user.id,
        optical_store_id: opticalStoreId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        // اسم عمود optical_ratings (0005): quality_rating (لا product_quality_rating)
        quality_rating: input.cleanliness_rating || null,
        service_rating: input.professionalism_rating || null,
        price_rating: null,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
      logFacilityFailure('optical_ratings', facilityError);
    } else if (doctorId) {
      const { error: facilityError } = await supabaseAny.from('doctor_ratings').insert({
        user_id: user.id,
        doctor_id: doctorId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        expertise_rating: input.professionalism_rating || null,
        punctuality_rating: input.punctuality_rating || null,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
      logFacilityFailure('doctor_ratings', facilityError);
    } else if (mentalSpecialistId) {
      const { error: facilityError } = await supabaseAny.from('mental_health_ratings').insert({
        user_id: user.id,
        specialist_id: mentalSpecialistId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        professionalism_rating: input.professionalism_rating || null,
        comment: input.review_text?.trim() || null,
        is_anonymous: input.is_anonymous ?? false,
        is_public: !input.is_anonymous,
      });
      logFacilityFailure('mental_health_ratings', facilityError);
    } else if (nutritionistId) {
      const { error: facilityError } = await supabaseAny.from('nutritionist_ratings').insert({
        user_id: user.id,
        nutritionist_id: nutritionistId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
      logFacilityFailure('nutritionist_ratings', facilityError);
    } else if (physioSpecialistId) {
      const { error: facilityError } = await supabaseAny.from('physio_ratings').insert({
        user_id: user.id,
        specialist_id: physioSpecialistId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        skill_rating: input.professionalism_rating || null,
        punctuality_rating: input.punctuality_rating || null,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
      logFacilityFailure('physio_ratings', facilityError);
    } else if (requiredType === 'nurse' && assignedSpecialistId) {
      // `nurse_ratings.specialist_id` يشير إلى `users` لا إلى جدول ممرّضين
      // (لا وجود له)، فالمعرّف هنا معرّفُ المستخدم المُسنَد.
      const { error: facilityError } = await supabaseAny.from('nurse_ratings').insert({
        user_id: user.id,
        specialist_id: assignedSpecialistId,
        appointment_id: input.appointment_id,
        rating: input.overall_rating,
        hygiene_rating: input.cleanliness_rating || null,
        expertise_rating: input.professionalism_rating || null,
        punctuality_rating: input.punctuality_rating || null,
        comment: input.review_text?.trim() || null,
        is_public: !input.is_anonymous,
      });
      logFacilityFailure('nurse_ratings', facilityError);
    }
  }

  revalidatePath(`/appointments/${input.appointment_id}`);
  revalidatePath('/appointments');
  return { ok: true };
}
