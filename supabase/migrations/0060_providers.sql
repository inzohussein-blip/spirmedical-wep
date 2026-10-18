-- ═══════════════════════════════════════════════════════════════════
-- 0060 — حساباتُ الخدمة: نوعُها، وحراستُه، ومختبرُ التحاليل صار «خدمة» (قرار المالك، 18 تشرين الأول)
-- ═══════════════════════════════════════════════════════════════════
-- المختصّ = فردٌ يذهب إلى المريض: محلّلٌ يسحب الدم (`lab_analyst`) أو ممرّضٌ منزليّ (`nurse`).
-- الخدمة = منشأة: مختبرٌ يُجري التحاليل ويرفع النتائج، صيدلية، عيادة، مستشفى. اسمُها `clinic_name`.
--
-- إضافيٌّ كلُّه لكود main: لا يقرأ `provider_type`، وذراعُ المختصّ في سياسة `specialist_lab_tests` باقٍ حتى
-- يُدمج الكودُ الجديد (يُزال في ترحيل التحويل بعده).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS provider_type text
    CHECK (provider_type IS NULL OR provider_type IN ('lab', 'pharmacy', 'clinic', 'hospital'));

-- الدورُ والنوعُ معاً: حسابُ خدمةٍ بلا نوع، أو نوعٌ على غير حساب خدمة — حالتان لا تقعان
ALTER TABLE public.users
  ADD CONSTRAINT users_provider_type_matches_role
    CHECK ((role = 'provider') = (provider_type IS NOT NULL));

CREATE INDEX IF NOT EXISTS users_provider_type_idx ON public.users (provider_type) WHERE provider_type IS NOT NULL;

-- حراسةُ 0058 تشمل نوعَ الخدمة: صاحبُ الحساب لا يغيّر نوعَه ولا يُدرج نفسه خدمةً
CREATE OR REPLACE FUNCTION private.guard_users_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon')
     OR EXISTS (SELECT 1 FROM public.users u
                 WHERE u.id = (SELECT auth.uid())
                   AND u.role IN ('super_admin', 'admin', 'manager', 'support')) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'patient'
       OR NEW.specialist_type IS NOT NULL
       OR NEW.provider_type IS NOT NULL
       OR coalesce(NEW.approval_status, 'approved') <> 'approved'
       OR coalesce(NEW.is_suspended, false)
       OR coalesce(NEW.wallet_balance, 0) <> 0
       OR coalesce(NEW.loyalty_points, 0) <> 0
       OR coalesce(NEW.wa_verified, false)
       OR coalesce(NEW.email_verified, false)
       OR coalesce(NEW.nursing_union_verified, false)
       OR coalesce(NEW.health_ministry_verified, false)
       OR NEW.credentials_verified_at IS NOT NULL
       OR NEW.admin_internal_notes IS NOT NULL THEN
      RAISE EXCEPTION 'privileged users columns are managed by the platform' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.specialist_type IS DISTINCT FROM OLD.specialist_type
     OR NEW.provider_type IS DISTINCT FROM OLD.provider_type
     OR NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
     OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
     OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason
     OR NEW.suspended_by IS DISTINCT FROM OLD.suspended_by
     OR NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance
     OR NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points
     OR NEW.phone IS DISTINCT FROM OLD.phone
     OR NEW.wa_verified IS DISTINCT FROM OLD.wa_verified
     OR NEW.wa_verified_at IS DISTINCT FROM OLD.wa_verified_at
     OR NEW.wa_id IS DISTINCT FROM OLD.wa_id
     OR NEW.email_verified IS DISTINCT FROM OLD.email_verified
     OR NEW.email_verified_at IS DISTINCT FROM OLD.email_verified_at
     OR NEW.password_hash IS DISTINCT FROM OLD.password_hash
     OR NEW.nursing_union_verified IS DISTINCT FROM OLD.nursing_union_verified
     OR NEW.health_ministry_verified IS DISTINCT FROM OLD.health_ministry_verified
     OR NEW.credentials_verified_at IS DISTINCT FROM OLD.credentials_verified_at
     OR NEW.credentials_verified_by IS DISTINCT FROM OLD.credentials_verified_by
     OR NEW.admin_internal_notes IS DISTINCT FROM OLD.admin_internal_notes THEN
    RAISE EXCEPTION 'privileged users columns are managed by the platform' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- تحاليلُ المختبر: يكتبها حسابُ الخدمة من نوع «مختبر». ذراعُ المختصّ (lab_analyst) باقٍ مؤقّتاً لكود main.
ALTER POLICY specialist_lab_tests_insert ON public.specialist_lab_tests
  WITH CHECK (
    specialist_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.users u
       WHERE u.id = (SELECT auth.uid())
         AND ((u.role = 'provider' AND u.provider_type = 'lab')
              OR (u.role = 'specialist' AND u.specialist_type = 'lab_analyst'))
    )
  );
