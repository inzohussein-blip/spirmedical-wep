-- ════════════════════════════════════════════════════════════════════════
-- 0029: ثلاثة مشغِّلاتٍ تكتب في أعمدةٍ لا وجود لها — فتُسقط المعاملة كلّها
-- ════════════════════════════════════════════════════════════════════════
--
-- ظهر هذا أثناء تجربةٍ على `lab_orders` في معاملةٍ مُلغاة:
--
--   ERROR: column "user_id" of relation "notification_queue" does not exist
--   CONTEXT: PL/pgSQL function notify_lab_results_ready() line 8
--
-- الدوالّ الثلاث تُدرج في `notification_queue` بهذه الأعمدة:
--
--     user_id, template_key, title, body, icon, data, created_at, scheduled_at
--
-- والجدول الحقيقيّ يحمل:
--
--     recipient_user_id, recipient_phone (NOT NULL), channel (NOT NULL),
--     template_key, body (NOT NULL), scheduled_for, related_type, related_id
--
-- فخمسةٌ من الثمانية غير موجودة، واثنان إلزاميّان غائبان. كُتِبت الدوالّ
-- على شكل جدول إشعاراتٍ دَفعيّة (push) لم يوجد في هذا المشروع قطّ، بينما
-- `enqueueNotification` في `src/lib/notifications.ts` تكتب الشكل الصحيح.
--
-- وهذه مشغِّلات AFTER، فاستثناؤها يُسقط العبارة المُشغِّلة نفسها لا الإشعارَ
-- وحده. المُثبَت تجريبياً في معاملةٍ مُلغاة:
--
--   1_insert_pharmacy_without_owner ....... OK
--   2_reservation_status_change ........... FAIL: column "user_id" ...
--   3_insert_pharmacy_with_owner .......... FAIL: column "user_id" ...
--   4_lab_order_results_ready ............. FAIL: column "user_id" ...
--
-- أي أنّ:
--   • كلّ تغييرٍ لحالة حجز صيدلية (تأكيد، توفّر جزئيّ، جاهز للاستلام،
--     إلغاء) يفشل — والحجز يبقى «قيد الانتظار» أبداً.
--   • كلّ حجزٍ جديدٍ في صيدليةٍ لها مالك يفشل من أصله.
--   • كلّ انتقال طلب مختبر إلى `results_ready` يفشل، فلا يرى المريض أنّ
--     نتائجه جاهزة.
--
-- ولم ينكشف شيءٌ من هذا حتى الآن لسببين عارضين لا لسلامةٍ في الكود:
-- الحجوزات صفر، و`owner_user_id` فارغٌ في الصيدليات الثلاثين كلّها —
-- فالسطر الأوّل نجح وحده لأنّ الدالّة تخرج قبل الإدراج حين لا مالك. وفي
-- `saveLabResults` يُسجَّل فشل تحديث الطلب ولا يُعاد، فيمضي كلّ شيءٍ صامتاً.

-- ─── ملاحظةٌ على محاولةٍ أولى في هذا الترحيل ───
--
-- كتبتُ أوّلاً دالّةً مساعدة `enqueue_push_notification(uuid, ...)` بصفة
-- `SECURITY DEFINER` تستدعيها المشغِّلات الثلاث. وكان ذلك خطأً من وجهين:
--
--   • المشغِّل يعمل بصلاحية المستخدم (INVOKER)، واستدعاؤه دالّةً أخرى
--     يتطلّب `EXECUTE` عليها. وقد سُحب `EXECUTE` من `authenticated` كي لا
--     تبلغها REST — فصار كلّ نداءٍ يرفع 42501، ويبتلعه معالج الاستثناء،
--     فتنجو العمليةُ ويضيع الإشعار صامتاً. أثبتته تجربةٌ بدور
--     `authenticated` حقيقيّ: التحديث `OK` والطابور **صفر**.
--   • ودالّةٌ DEFINER تكتب بمعرّفٍ يمرّره المستدعي هي الشكل الذي يمنعه
--     `tests/rpc-authorization.test.ts` أصلاً.
--
-- فأُسقطت، وصارت كلّ دالّة مشغِّلٍ `SECURITY DEFINER` تُدرج بنفسها. وإطلاق
-- المشغِّل لا يتطلّب `EXECUTE` (الصلاحية تُفحص عند `CREATE TRIGGER`)،
-- والدوالّ لا تأخذ وسائطَ من أحد بل تقرأ `NEW` وحدها.
DROP FUNCTION IF EXISTS public.enqueue_push_notification(uuid, text, text, text, uuid);

-- ─── ١) نتائج المختبر جاهزة ───
CREATE OR REPLACE FUNCTION public.notify_lab_results_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM 'results_ready' AND NEW.status = 'results_ready')
     OR (OLD.status IS DISTINCT FROM 'delivered' AND NEW.status = 'delivered') THEN
    -- الإشعار لا يجوز أن يُسقط تحديث الطلب. فشلُه تحذيرٌ في السجلّ لا إجهاض.
    BEGIN
      INSERT INTO public.notification_queue (
        recipient_user_id, recipient_phone, channel, template_key,
        body, scheduled_for, related_type, related_id
      )
      SELECT NEW.user_id, u.phone, 'push', 'lab_results_ready',
             COALESCE((SELECT t.body_ar FROM public.notification_templates t
                        WHERE t.key = 'lab_results_ready' AND t.is_active),
                      'نتائج فحوصاتك جاهزة الآن! انقر لعرضها.'),
             now(), 'lab_order', NEW.id
        FROM public.users u
       WHERE u.id = NEW.user_id AND u.phone IS NOT NULL AND u.phone <> '';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_lab_results_ready فشل لطلب %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── ٢) حجز دواءٍ جديد → إشعار مالك الصيدلية ───
CREATE OR REPLACE FUNCTION public.notify_pharmacy_new_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  pharmacy_owner uuid;
BEGIN
  SELECT owner_user_id INTO pharmacy_owner
    FROM public.pharmacies WHERE id = NEW.pharmacy_id;

  IF pharmacy_owner IS NOT NULL THEN
    BEGIN
      INSERT INTO public.notification_queue (
        recipient_user_id, recipient_phone, channel, template_key,
        body, scheduled_for, related_type, related_id
      )
      SELECT pharmacy_owner, u.phone, 'push', 'pharmacy_reservation_new',
             COALESCE((SELECT t.body_ar FROM public.notification_templates t
                        WHERE t.key = 'pharmacy_reservation_new' AND t.is_active),
                      'لديك حجز جديد من مريض - يرجى الرد'),
             now(), 'pharmacy_reservation', NEW.id
        FROM public.users u
       WHERE u.id = pharmacy_owner AND u.phone IS NOT NULL AND u.phone <> '';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'notify_pharmacy_new_reservation فشل لحجز %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

-- ─── ٣) تغيّر حالة الحجز → إشعار المريض ───
CREATE OR REPLACE FUNCTION public.notify_user_reservation_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_key  text;
  v_body text;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'confirmed' THEN
      v_key := 'pharmacy_reservation_confirmed';
      v_body := 'الصيدلية أكّدت توفّر الأدوية';
    WHEN 'partially_available' THEN
      v_key := 'pharmacy_reservation_partial';
      v_body := 'بعض الأدوية فقط متوفّرة - يُرجى المراجعة';
    WHEN 'ready_for_pickup' THEN
      v_key := 'pharmacy_reservation_ready';
      v_body := 'يمكنك المرور لاستلامه';
    WHEN 'cancelled' THEN
      v_key := 'pharmacy_reservation_rejected';
      v_body := COALESCE(NEW.cancellation_reason, 'للأسف الأدوية غير متوفّرة حالياً');
    ELSE
      RETURN NEW;
  END CASE;

  BEGIN
    INSERT INTO public.notification_queue (
      recipient_user_id, recipient_phone, channel, template_key,
      body, scheduled_for, related_type, related_id
    )
    SELECT NEW.user_id, u.phone, 'push', v_key,
           COALESCE((SELECT t.body_ar FROM public.notification_templates t
                      WHERE t.key = v_key AND t.is_active), v_body),
           now(), 'pharmacy_reservation', NEW.id
      FROM public.users u
     WHERE u.id = NEW.user_id AND u.phone IS NOT NULL AND u.phone <> '';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_user_reservation_status فشل لحجز %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;
