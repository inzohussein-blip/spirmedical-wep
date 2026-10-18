-- ═══════════════════════════════════════════════════════════════════
-- 0054 — قصصٌ حقيقيّة تنشرها الإدارة وحدها (قرار المالك، 18 تشرين الأول)
-- ═══════════════════════════════════════════════════════════════════
-- كانت «القصص» روابطَ ثابتة بإطارٍ متدرّج يوحي بمحتوى لم يُشاهَد، وتكرّر شبكةَ الخدمات تحتها.
-- الآن تُفتح بملء الشاشة: صورةٌ اختياريّة، ونصٌّ (description)، وزرُّ إجراء (cta_label → href).
--
-- «من الإدارة وحدها»: سياساتُ stories القائمة تحصر الإدراج والتعديل والحذف في
-- super_admin/admin/manager، والقراءةُ للنشطة المجدولة. والصورُ في حاويةٍ عامّة القراءة
-- **بلا أيّ سياسة كتابة** على storage.objects: لا يكتبها إلّا عميلُ الخدمة من إجراء
-- الإدارة بعد التحقّق من الدور (app/admin/stories/actions.ts).
--
-- إضافيٌّ كلُّه: كودُ main الحاليّ يقرأ `select *` ويكتب ألوانه الخمسة القديمة — يعمل كما هو.

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS cta_label text;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_cta_label_len CHECK (cta_label IS NULL OR char_length(cta_label) <= 24),
  ADD CONSTRAINT stories_description_len CHECK (description IS NULL OR char_length(description) <= 280),
  ADD CONSTRAINT stories_image_url_https CHECK (image_url IS NULL OR image_url ~ '^https://');

-- ألوانُ المفاهيم من لوحة المشروع (lib/icons.ts ICON_TONES)، مع بقاء القديمة صالحة
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS valid_color;
ALTER TABLE public.stories ADD CONSTRAINT valid_color CHECK (color_theme = ANY (ARRAY[
  'emerald', 'amber', 'rose', 'paper', 'ink',
  'blue', 'purple', 'red', 'orange', 'teal', 'green'
]));

-- حاويةُ صور القصص: عامّةُ القراءة، 2MB، صورٌ فقط. لا سياسةَ كتابة عمداً (انظر أعلاه).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stories', 'stories', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- «تغذية» كانت توصل إلى حاسبة المخاطر
UPDATE public.stories
   SET href = '/services/nutrition'
 WHERE title = 'تغذية' AND href = '/tools/risk-calculator';
