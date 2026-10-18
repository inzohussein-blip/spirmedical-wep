-- ═══════════════════════════════════════════════════════════════════
-- 0058 — 🔴 لا يرفع مستخدمٌ نفسَه: حراسةُ أعمدة الصلاحيّة في `users` (18 تشرين الأول)
-- ═══════════════════════════════════════════════════════════════════
-- قِيس على الإنتاج قبله (BEGIN … ROLLBACK، كمريضٍ عبر `authenticated`):
--   UPDATE users SET role = 'super_admin', approval_status = 'approved' WHERE id = auth.uid()
--   ← صفٌّ واحد، والدورُ صار super_admin.
-- السبب: سياسةُ `users_update_merged` تسمح لصاحب الصفّ بتحديثه (لتعديل اسمه ومحافظته وإعداداته)،
-- و`authenticated` يملك UPDATE على كلّ الأعمدة. فأيُّ مريضٍ يصير مديراً من المتصفّح بمفتاح anon،
-- ومختصٌّ قيد المراجعة يعتمد نفسه، ومريضٌ يكتب رصيدَ محفظته.
--
-- `WITH CHECK` لا يرى `OLD` (انظر 0038/0039)، فالحارسُ مُشغِّل: غيرُ المدير لا يغيّر عموداً من هذه.
-- والمستثنى: عميلُ الخدمة (التسجيل، التحقّق، الإدارة من الخادم) والدوالُّ المُفوَّضة (مالكُها postgres)
-- — `current_user` فيها غيرُ authenticated/anon — والمديرون.
--
-- طُبّق على الإنتاج 18 تشرين الأول وقِيس: التصعيدُ نفسُه صار مرفوضاً (42501)، وتعديلُ الاسم يمرّ.
--
-- كودُ main لا يكتب هذه الأعمدة بعميل RLS لصاحب الصفّ (قِيس: كلُّ ما يكتبها يمرّ بعميل الخدمة)،
-- فالترحيلُ آمنٌ قبل الدمج.

CREATE OR REPLACE FUNCTION private.guard_users_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- عميلُ الخدمة ودوالُّ المالك والمديرون: لا قيد. الدورُ من صفّ المستدعي **قبل** التحديث (لقطةُ
  -- العبارة)، فمن يرفع نفسه يُقرأ بدوره القديم. وبلا `private.is_admin`: لا EXECUTE لـauthenticated عليها.
  IF current_user NOT IN ('authenticated', 'anon')
     OR EXISTS (SELECT 1 FROM public.users u
                 WHERE u.id = (SELECT auth.uid())
                   AND u.role IN ('super_admin', 'admin', 'manager', 'support')) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- صفُّ المستخدم يُنشئه مُشغِّلُ التسجيل؛ إدراجُه بنفسه (session.ts عند غيابه) مريضٌ عاديّ فقط
    IF NEW.role IS DISTINCT FROM 'patient'
       OR NEW.specialist_type IS NOT NULL
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

-- `zz_`: يعمل بعد مُشغِّلات BEFORE الأخرى (تُرتَّب بالاسم) — فيرى ما ستكتبه فعلاً
CREATE OR REPLACE TRIGGER zz_guard_users_privileged_columns
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION private.guard_users_privileged_columns();
