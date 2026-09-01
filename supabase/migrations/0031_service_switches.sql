-- ════════════════════════════════════════════════════════════════════════
-- 0031: مفاتيح تشغيل الخدمات — يُطفئها المشرف فتبقى معروضةً «قريباً»
-- ════════════════════════════════════════════════════════════════════════
--
-- كانت الشارة `'قريباً'` معرَّفةً في `src/lib/services-v3.ts` كقيمةٍ ساكنة
-- في الكود: لإطفاء خدمةٍ كان لا بدّ من تعديل ملفٍّ ونشرِ إصدار. وكان
-- الإخفاء بصرياً وحده — `BentoServicesGridV3` تعرض البطاقة بلا رابط،
-- لكنّ كتابة المسار في شريط العنوان تفتح الخدمة كاملةً.
--
-- الجدول أدناه ينقل القرار إلى قاعدة البيانات، والحجب إلى تخطيط المجموعة
-- (`(dashboard)/layout.tsx`) لا إلى البطاقة — فلا يُفلت منه مسارٌ مكتوب.
--
-- المعرّفات هي `ServiceConfig.id` نفسها لا نسخةٌ عنها؛ ويحرس تطابقَهما
-- `tests/service-switches.test.ts`.

CREATE TABLE IF NOT EXISTS public.service_switches (
  service_id  text PRIMARY KEY,
  is_enabled  boolean NOT NULL DEFAULT true,
  -- نصٌّ اختياريّ يظهر للمستخدم مكان «قريباً» (مثال: «تعود الخدمة الأحد»)
  note_ar     text,
  updated_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT service_switches_id_not_blank CHECK (btrim(service_id) <> ''),
  CONSTRAINT service_switches_note_len CHECK (note_ar IS NULL OR length(note_ar) <= 120)
);

DROP TRIGGER IF EXISTS service_switches_updated_at ON public.service_switches;
CREATE TRIGGER service_switches_updated_at
  BEFORE UPDATE ON public.service_switches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.service_switches ENABLE ROW LEVEL SECURITY;

-- الجميع يقرأ: البطاقة تُعرض للزائر أيضاً، وعليها أن تعرف حالتها.
-- ولا سرَّ في «هذه الخدمة مطفأة» — هو ما نريد إظهاره أصلاً.
DROP POLICY IF EXISTS service_switches_public_read ON public.service_switches;
CREATE POLICY service_switches_public_read ON public.service_switches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS service_switches_admin_manage ON public.service_switches;
CREATE POLICY service_switches_admin_manage ON public.service_switches
  FOR ALL USING (private.is_admin((SELECT auth.uid())))
  WITH CHECK (private.is_admin((SELECT auth.uid())));

GRANT SELECT ON public.service_switches TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_switches TO authenticated;

-- ─── البذرة: كلّ الخدمات مشتغلة ───
--
-- الغياب يعني «مشتغلة» في الكود أيضاً (fail-open مقصود: عطبٌ في قراءة
-- الجدول يجب ألّا يُطفئ المنصّة كلّها). والبذرة هنا كي تظهر الخدمات في
-- لوحة المشرف بلا أن يضيفها واحدةً واحدة.
INSERT INTO public.service_switches (service_id, is_enabled) VALUES
  ('blood-draw', true),
  ('nursing', true),
  ('doctor', true),
  ('hospital', true),
  ('pharmacy', true),
  ('consult', true),
  ('reminders', true),
  ('prescriptions', true),
  ('health', true),
  ('physio', true),
  ('dental', true),
  ('optical', true),
  ('mental-health', true),
  ('nutrition', true),
  ('cosmetic', true),
  ('vaccines', true),
  ('risk-calculator', true),
  ('symptom-checker', true),
  ('first-aid', true),
  ('vaccinations-schedule', true)
ON CONFLICT (service_id) DO NOTHING;

-- ملاحظة: `sos` غير مُدرَجة عمداً.
-- شاشة الطوارئ لا يجوز أن تُطفأ من لوحةٍ إدارية بنقرةٍ واحدة. ويمنع الكودُ
-- إدراجَها كذلك (`NON_SWITCHABLE` في `src/lib/service-switches.ts`)، فحتى
-- إدراجٌ يدويٌّ في الجدول لا يُطفئها.
