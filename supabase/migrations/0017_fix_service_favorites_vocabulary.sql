-- ════════════════════════════════════════════════════════════════════
-- ⭐ توحيد مفردات `service_favorites.service_type`
-- ════════════════════════════════════════════════════════════════════
--
-- الخلل: قيد `CHECK` كان يسمح بـ:
--     'hospital','dental','optical','doctor','pharmacy',
--     'mental','nutrition','physio'
-- بينما التطبيق يُرسل من صفحات التفاصيل:
--     'hospital','dental','optical','doctor','pharmacy',
--     'mental_health','nutritionist','physio'
--
-- فقيمتان من الثماني **لا تطابقان القيد**:
--
--   • قلبٌ على عيادة نفسية  → INSERT بـ'mental_health'  ⇒ 23514
--   • قلبٌ على أخصائي تغذية → INSERT بـ'nutritionist'   ⇒ 23514
--
-- والفشل **صامت**: `toggleServiceFavorite` يُعيد `{ok:false}`، وزرّ
-- `ServiceFavoriteButton` كان يتجاهل هذه الحالة تماماً — لا رسالة ولا
-- تغيّر في القلب. أي أنّ المستخدم يضغط فلا يحدث شيء، إلى الأبد.
--
-- ── لماذا نُصلح القاعدة لا التطبيق ──
-- `nutritionist` هي المفردة المعتمدة أصلاً في `users.specialist_type`
-- و`appointments.required_specialist_type`، و`mental_health` تطابق مسار
-- `/services/mental-health` وجدول `mental_health_specialists`. فتغيير
-- التطبيق إلى `nutrition`/`mental` كان سيُنشئ مفردةً ثانيةً متوازية —
-- وهي جذر هذا الخلل ابتداءً.
--
-- الجدول فارغ (0 صفوف) وقت الترحيل، لكنّ التحويل مكتوبٌ ليكون آمناً
-- على أيّ نسخةٍ فيها صفوف قديمة.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. حوّل أيّ صفوف بالمفردة القديمة ───
-- يسبق إسقاطَ القيد كي لا تبقى قيمةٌ لا يقبلها القيد الجديد.
UPDATE public.service_favorites SET service_type = 'mental_health'
WHERE service_type = 'mental';

UPDATE public.service_favorites SET service_type = 'nutritionist'
WHERE service_type = 'nutrition';

-- ─── 2. استبدل القيد بمفردة التطبيق ───
ALTER TABLE public.service_favorites
  DROP CONSTRAINT IF EXISTS service_favorites_service_type_check;

ALTER TABLE public.service_favorites
  ADD CONSTRAINT service_favorites_service_type_check
  CHECK (service_type IN (
    'hospital', 'dental', 'optical', 'doctor', 'pharmacy',
    'mental_health', 'nutritionist', 'physio'
  ));

COMMENT ON COLUMN public.service_favorites.service_type IS
  'نوع الخدمة — يطابق ServiceType في src/components/services/favorites-actions.ts. '
  'يحرس التطابقَ tests/favorites-integrity.test.ts.';


-- ════════════════════════════════════════════════════════════════════
-- 🗑️ `user_favorites` — فرعٌ يتيم
-- ════════════════════════════════════════════════════════════════════
--
-- نظاما مفضّلات متوازيان كانا يعيشان معاً:
--
--   • `service_favorites`  ← الحيّ: يكتب فيه `ServiceFavoriteButton`
--     من صفحات التفاصيل الثماني، ويعرضه `/account/favorites` الموصول
--     من صفحة الحساب.
--   • `user_favorites`     ← اليتيم: `toggleFavorite` **لا مُستدعي له**
--     في الشجرة كلّها، وصفحة `/favorites` لا يشير إليها أيّ رابط. فلا
--     سبيل لهذا الجدول أن يكتسب صفّاً واحداً.
--
-- أُزيل فرع الكود اليتيم (الصفحة والإجراءات) وحُوِّل `/favorites` إلى
-- `/account/favorites` حفاظاً على أيّ إشارةٍ مرجعية قديمة.
--
-- الجدول نفسه يُترك قائماً — إسقاطه غير قابل للتراجع ولا يشتري شيئاً
-- (0 صفوف، ولا كود يمسّه). هذا التعليق يمنع إحياءه سهواً.
-- ════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.user_favorites IS
  'مهجور (V33) — استُبدل بـ`service_favorites`. لا يقرؤه ولا يكتبه أيّ كود. '
  'لا تُضِف إليه؛ أضِف نوعاً جديداً إلى `service_favorites` بدلاً من ذلك.';
