-- ════════════════════════════════════════════════════════════════════
-- 🚀 Migration 31: Beta Launch System (V25.14)
-- ════════════════════════════════════════════════════════════════════
-- نظام كامل لإطلاق Beta:
--   1. launch_checklist - قائمة مهام الإطلاق
--   2. beta_codes - رموز دعوات Beta
--   3. user_feedback - استطلاعات + اقتراحات
--   4. bug_reports - تقارير الأعطال من المستخدمين
--   5. changelog_entries - ما الجديد
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Launch Checklist ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.launch_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'technical',       -- تقني
    'content',         -- محتوى
    'legal',           -- قانوني
    'marketing',       -- تسويق
    'operations',      -- عمليات
    'security'         -- أمان
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.users(id),
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checklist_category ON public.launch_checklist(category, is_completed, order_index);

ALTER TABLE public.launch_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_admin" ON public.launch_checklist;
CREATE POLICY "checklist_admin"
  ON public.launch_checklist FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 2. Beta Codes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beta_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  used_by UUID[] DEFAULT ARRAY[]::UUID[],
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_codes_active ON public.beta_codes(code, is_active);

ALTER TABLE public.beta_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beta_admin" ON public.beta_codes;
CREATE POLICY "beta_admin"
  ON public.beta_codes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "beta_select_public" ON public.beta_codes;
CREATE POLICY "beta_select_public"
  ON public.beta_codes FOR SELECT
  USING (is_active = TRUE);

-- ─── 3. User Feedback ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'complaint', 'praise', 'feature_request', 'other')),
  category TEXT NOT NULL CHECK (category IN (
    'booking', 'consultation', 'app_ui', 'doctors', 'pharmacy',
    'pricing', 'support', 'performance', 'other'
  )),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),  -- اختياري
  subject TEXT,
  message TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'archived')),
  admin_notes TEXT,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.user_feedback(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON public.user_feedback(user_id, created_at DESC);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_insert_any" ON public.user_feedback;
CREATE POLICY "feedback_insert_any"
  ON public.user_feedback FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "feedback_select_own" ON public.user_feedback;
CREATE POLICY "feedback_select_own"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "feedback_admin" ON public.user_feedback;
CREATE POLICY "feedback_admin"
  ON public.user_feedback FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 4. Bug Reports ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fixed', 'wont_fix', 'duplicate')),
  page_url TEXT,
  browser TEXT,
  device TEXT,
  screenshot_url TEXT,
  user_agent TEXT,
  admin_notes TEXT,
  fixed_in_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  fixed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bugs_status ON public.bug_reports(status, severity, created_at DESC);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bugs_insert_any" ON public.bug_reports;
CREATE POLICY "bugs_insert_any"
  ON public.bug_reports FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "bugs_select_own" ON public.bug_reports;
CREATE POLICY "bugs_select_own"
  ON public.bug_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bugs_admin" ON public.bug_reports;
CREATE POLICY "bugs_admin"
  ON public.bug_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ─── 5. Changelog ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  release_date DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  improvements TEXT[] DEFAULT ARRAY[]::TEXT[],
  fixes TEXT[] DEFAULT ARRAY[]::TEXT[],
  breaking_changes TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_changelog_published ON public.changelog_entries(is_published, release_date DESC);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "changelog_read_published" ON public.changelog_entries;
CREATE POLICY "changelog_read_published"
  ON public.changelog_entries FOR SELECT
  USING (is_published = TRUE);

DROP POLICY IF EXISTS "changelog_admin" ON public.changelog_entries;
CREATE POLICY "changelog_admin"
  ON public.changelog_entries FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ════════════════════════════════════════════════════════════════════
-- 🌱 Seed: 50 بنداً للـ checklist
-- ════════════════════════════════════════════════════════════════════

INSERT INTO public.launch_checklist (category, title, description, priority, order_index, is_completed) VALUES
-- Technical (15)
('technical', 'TypeScript بدون أخطاء', 'npx tsc --noEmit يعطي 0 errors', 'critical', 1, true),
('technical', 'ESLint بدون تحذيرات', 'npx next lint --quiet نظيف', 'critical', 2, true),
('technical', 'Build ناجح في production', 'npx next build ينجح بدون مشاكل', 'critical', 3, true),
('technical', 'الـ Database migrations مُطبّقة', 'كل الـ 31 migration تم تشغيلها على Supabase production', 'critical', 4, false),
('technical', 'RLS policies على كل الجداول الحسّاسة', 'فحص يدوي للجداول الحرجة', 'critical', 5, false),
('technical', 'env vars في Vercel', 'كل المفاتيح المطلوبة مُعرّفة في production', 'critical', 6, false),
('technical', 'Health check يعمل', '/api/monitoring/health يرجع 200', 'high', 7, false),
('technical', 'Push notifications تعمل', 'تجربة push على جهاز حقيقي', 'high', 8, false),
('technical', 'Email يصل بنجاح', 'تجربة Resend مع إيميل حقيقي', 'high', 9, false),
('technical', 'WhatsApp OTP يصل', 'تجربة OTP على رقم حقيقي', 'high', 10, false),
('technical', 'الـ Cron jobs مُجدوَلة', 'appointment reminders + notifications process', 'high', 11, false),
('technical', 'CDN + caching مُهيّأ', 'Vercel CDN يعمل', 'medium', 12, false),
('technical', 'Source maps مرفوعة لـ Sentry', 'لو Sentry مُفعّل', 'low', 13, false),
('technical', 'Lighthouse Score > 90', 'Performance + Accessibility + SEO', 'high', 14, false),
('technical', 'Mobile responsive 100%', 'فحص يدوي على أجهزة فعلية', 'critical', 15, false),

-- Content (10)
('content', 'كل الصفحات مُترجمة عربياً', 'لا يوجد placeholders بالإنجليزية', 'critical', 16, true),
('content', 'كل الـ TODOs محذوفة', 'بحث عن TODO/FIXME في الكود', 'high', 17, true),
('content', '20+ مقال في المدونة', 'محتوى SEO جاهز', 'high', 18, true),
('content', '10+ طبيب جاهز في القاعدة', 'بيانات حقيقية', 'high', 19, true),
('content', '25+ مستشفى جاهز', 'كل المحافظات', 'high', 20, true),
('content', '30+ صيدلية جاهزة', 'تغطية جغرافية', 'high', 21, true),
('content', '50+ دواء في الكتالوج', 'الأدوية الشائعة', 'high', 22, true),
('content', 'صور OG لكل صفحة رئيسية', 'للمشاركة على السوشيال ميديا', 'medium', 23, false),
('content', 'Favicon + Apple touch icons', 'كل الأحجام موجودة', 'medium', 24, false),
('content', 'النص في صفحات الـ Empty States', 'كل النصوص مُراجعة', 'medium', 25, true),

-- Legal (8)
('legal', 'سياسة الخصوصية محدّثة', '/legal/privacy جاهزة', 'critical', 26, true),
('legal', 'شروط الاستخدام محدّثة', '/legal/terms جاهزة', 'critical', 27, true),
('legal', 'سياسة الكوكيز', '/legal/cookies جاهزة', 'critical', 28, true),
('legal', 'سياسة الاسترداد', '/legal/refund جاهزة', 'critical', 29, true),
('legal', 'إخلاء المسؤولية الطبي', '/legal/disclaimer جاهز', 'critical', 30, true),
('legal', 'Cookie consent banner يعمل', 'GDPR compliant', 'critical', 31, true),
('legal', 'مسجّل لدى وزارة الصحة', 'لو يلزم', 'high', 32, false),
('legal', 'مسجّل تجارياً', 'سجل تجاري نشط', 'high', 33, false),

-- Marketing (8)
('marketing', 'Landing page محسّنة', 'الصفحة الرئيسية', 'critical', 34, true),
('marketing', 'صفحة About جاهزة', '/about', 'high', 35, true),
('marketing', 'صفحة FAQ شاملة', '/faq', 'high', 36, true),
('marketing', 'صفحة Contact', '/contact', 'high', 37, true),
('marketing', 'حسابات السوشيال ميديا', 'Twitter, Instagram, Facebook', 'medium', 38, false),
('marketing', 'Domain custom', 'spirmedical.com بدل vercel.app', 'high', 39, false),
('marketing', 'Google Analytics + Search Console', 'تتبّع الزوار', 'high', 40, false),
('marketing', 'حملة Pre-launch جاهزة', 'إعلانات + بريد + سوشيال', 'medium', 41, false),

-- Operations (5)
('operations', 'فريق الدعم جاهز', 'موظفون مدرّبون', 'critical', 42, false),
('operations', 'هاتف الدعم نشط', '+9647700000000', 'critical', 43, false),
('operations', 'WhatsApp Business نشط', 'للرد على المرضى', 'critical', 44, false),
('operations', 'الأطباء وُقّعوا العقود', 'الأطباء على المنصة', 'high', 45, false),
('operations', 'صلاحيات الـ admin مُعرّفة', 'كل أدوار الفريق', 'high', 46, false),

-- Security (4)
('security', 'كلمات السر قوية', 'admin passwords > 16 char', 'critical', 47, false),
('security', '2FA على حسابات الـ admin', 'إن أمكن', 'high', 48, false),
('security', 'Backup يومي يعمل', 'تأكيد من workflow', 'critical', 49, false),
('security', 'Rate limiting مُفعّل', 'حماية من DDoS', 'high', 50, false);

-- ─── Seed: Beta codes ───
INSERT INTO public.beta_codes (code, description, max_uses) VALUES
  ('BETA-EARLY-2026',    'Early adopters - 100 use',     100),
  ('BETA-FAMILY-50',     'Family beta program',          50),
  ('BETA-DOCTORS-30',    'Doctor invites',               30),
  ('BETA-PRESS',         'Press & journalists',          20),
  ('BETA-VIP',           'VIP / Partners',               10)
ON CONFLICT (code) DO NOTHING;

-- ─── Seed: First changelog entry ───
INSERT INTO public.changelog_entries (
  version, release_date, title, summary,
  features, improvements, is_published, created_at
) VALUES (
  'V25.14',
  CURRENT_DATE,
  '🚀 إطلاق Beta',
  'الإصدار الأول من Spir Medical جاهز للجمهور المحدود',
  ARRAY[
    'حجز سحب دم منزلي',
    'حجز خدمات تمريض',
    'طبيب العائلة باشتراك شهري/سنوي',
    'دليل 25+ مستشفى في 18 محافظة',
    '30+ صيدلية + 50+ دواء',
    'استشارات طبية مع الأطباء',
    'إدارة العائلة (حتى 10 أفراد)',
    'نظام نقاط ولاء (4 مستويات)',
    'تنبيهات WhatsApp + Push',
    'سجل طبي شخصي مُشفّر'
  ],
  ARRAY[
    'تصميم محسّن للجوال',
    'سرعة تحميل أعلى',
    'دعم RTL كامل'
  ],
  TRUE,
  now()
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.launch_checklist IS 'قائمة مهام الإطلاق - 50 بنداً';
COMMENT ON TABLE public.beta_codes IS 'رموز دعوات Beta';
COMMENT ON TABLE public.user_feedback IS 'استطلاعات + اقتراحات المستخدمين';
COMMENT ON TABLE public.bug_reports IS 'تقارير الأعطال';
COMMENT ON TABLE public.changelog_entries IS 'ما الجديد - سجل التحديثات';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 31 applied: Beta Launch System';
  RAISE NOTICE '   - launch_checklist: 50 items seeded';
  RAISE NOTICE '   - beta_codes: 5 codes seeded';
  RAISE NOTICE '   - changelog: V25.14 entry';
END $$;
