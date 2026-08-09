-- ════════════════════════════════════════════════════════════════════
-- 🧪 إثبات مسار الطلب على مستوى قاعدة البيانات
-- ════════════════════════════════════════════════════════════════════
--
-- لماذا هذا السكربت موجود:
-- الحارسات في `tests/` تفحص **الكود** (أسماء أعمدة، قيم مقيَّدة، توصيل).
-- لكنّها لا تُثبت أنّ سياسات RLS تسمح فعلاً بالتدفّق الحقيقي. وقد تبيّن
-- أنّ ذلك ليس افتراضاً آمناً: كانت البوّابة الأولى (`GRANT`) مغلقة على
-- الجداول الـ91 كلّها، فالسياسات الـ246 لم تُقيَّم قطّ وكل استعلام يُردّ
-- بـ`42501`. لم يكشف ذلك أيّ اختبار كود.
--
-- يشغَّل بمفتاح `service_role` (لوحة Supabase / MCP). ينشئ بيانات
-- اختبارية ثمّ يمسحها بالكامل.
--
-- ما يُثبته:
--   1. المريض يستطيع رفع طلب (GRANT + سياسة الإدراج).
--   2. المشغّل `trg_auto_required_specialist` يوجّه الطلب تلقائياً.
--   3. المريض يرى طلبه.
--   4. مريضٌ آخر **لا** يراه (عزل RLS).
--   5. المختصّ من النوع الصحيح يراه في طابوره.
--   6. مختصّ من نوعٍ آخر **لا** يراه (دقّة التوجيه).
--
-- النتيجة المتوقّعة: 1 · lab_analyst · 1 · 0 · 1 · 0
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── تهيئة ───
DO $$
DECLARE
  patient uuid := '11111111-1111-1111-1111-111111111111';
  other   uuid := '22222222-2222-2222-2222-222222222222';
  analyst uuid := '33333333-3333-3333-3333-333333333333';
  nurse   uuid := '44444444-4444-4444-4444-444444444444';
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  VALUES
    (patient,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','probe-patient@example.test','',now(),now(),now(),'{}','{}'),
    (other  ,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','probe-other@example.test'  ,'',now(),now(),now(),'{}','{}'),
    (analyst,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','probe-analyst@example.test','',now(),now(),now(),'{}','{}'),
    (nurse  ,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','probe-nurse@example.test'  ,'',now(),now(),now(),'{}','{}')
  ON CONFLICT (id) DO NOTHING;

  -- المشغّل `on_auth_user_created` أنشأ صفوف public.users تلقائياً
  UPDATE public.users SET role='specialist', specialist_type='lab_analyst',
         approval_status='approved', is_suspended=false WHERE id=analyst;
  UPDATE public.users SET role='specialist', specialist_type='nurse',
         approval_status='approved', is_suspended=false WHERE id=nurse;
END $$;

-- ─── 1+2: المريض يرفع طلباً، والمشغّل يوجّهه ───
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

INSERT INTO public.appointments (user_id, service_type, service_id, scheduled_at, address, status)
VALUES ('11111111-1111-1111-1111-111111111111','سحب دم منزلي','blood-draw',
        now() + interval '2 days','بغداد - الكرادة','pending');

SELECT 'الطلب أُنشئ ووُجّه' AS step, required_specialist_type
FROM public.appointments;                                    -- متوقّع: lab_analyst

-- ─── 3: صاحب الطلب يراه ───
SELECT 'صاحب الطلب' AS who, count(*) AS visible FROM public.appointments;   -- 1

-- ─── 4: مريضٌ آخر لا يراه ───
SET LOCAL request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
SELECT 'مريض آخر' AS who, count(*) AS visible FROM public.appointments;     -- 0

-- ─── 5: المختصّ الصحيح يراه ───
SET LOCAL request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
SELECT 'محلّل مختبر' AS who, count(*) AS visible
FROM public.appointments WHERE required_specialist_type='lab_analyst' AND status='pending';  -- 1

-- ─── 6: مختصّ من نوعٍ آخر لا يراه ───
SET LOCAL request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
SELECT 'ممرّض' AS who, count(*) AS visible
FROM public.appointments WHERE status='pending';                                             -- 0

-- ─── تنظيف ───
RESET ROLE;
DELETE FROM auth.users WHERE email LIKE 'probe-%@example.test';

COMMIT;
