-- ═══════════════════════════════════════════════════════════════════
-- 0052 — ألوانُ المنصّة: المديرُ (admin) يحفظها كالمدير العامّ
-- ═══════════════════════════════════════════════════════════════════
-- قرار المالك (16 تشرين الأول): صلاحيّاتُ `admin` = `super_admin` كما في
-- `src/lib/admin-types.ts`. الكودُ يسمح للمدير بحفظ الألوان (`isSuperAdmin`)،
-- لكنّ سياستَي التحديث والإدراج تشترطان `super_admin`، فكان الحفظُ يحدّث 0 صفّ
-- بلا خطأ ويُقال «تمّ». قِيس بـ`SET ROLE authenticated` كمدير: 0 من 1.
--
-- إضافيٌّ: يوسّع السياستين فقط؛ كودُ `main` الحاليّ يعمل معه كما هو.
-- ═══════════════════════════════════════════════════════════════════

ALTER POLICY theme_update_super_admin ON public.app_theme_settings
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = (SELECT auth.uid()) AND users.role IN ('super_admin'::user_role, 'admin'::user_role)
  ));

ALTER POLICY theme_insert_super_admin ON public.app_theme_settings
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = (SELECT auth.uid()) AND users.role IN ('super_admin'::user_role, 'admin'::user_role)
  ));
