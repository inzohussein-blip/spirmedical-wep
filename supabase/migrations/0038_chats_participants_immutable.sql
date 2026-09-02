-- ════════════════════════════════════════════════════════════════════════
-- 0038: مريضٌ يُسلِّم محادثته الطبّية إلى غريب
-- ════════════════════════════════════════════════════════════════════════
--
-- الثغرة من عائلة 0036 و0037 نفسها، لكنّ علاجها مختلف.
--
-- سياسةُ التعديل على `chats`:
--
--     USING (auth.uid() = patient_id OR auth.uid() = specialist_id)
--
-- بلا `WITH CHECK`. فالصفُّ الجديد لا يُفحص إلّا بأنّ المعدِّل طرفٌ فيه —
-- والمهاجم يبقى `patient_id` فيبقى طرفاً. أمّا `specialist_id` فعمودٌ
-- كسائر الأعمدة: يُبدَّل بمن شاء.
--
-- ─── المُثبَت في معاملةٍ مُلغاة ───
--
--     ①_تحويلٌ بلا مُرشِّح ......... نجح، صفوف=١
--     ②_مختصّ المحادثة الآن ....... الغريب ← اختراق
--     ③_الغريب يقرأ الرسائل ....... ١
--
-- أي أنّ الغريب صار طرفاً في المحادثة، فسياسةُ القراءة على `messages`
-- تفتح له كلَّ ما بين المريض وطبيبه. `PATCH /chats` بجسم فيه
-- `specialist_id` بلا مُرشِّح، من PostgREST مباشرة.
--
-- ─── لماذا لا يكفي `WITH CHECK` هنا ───
--
-- `WITH CHECK` لا يرى إلّا الصفَّ **الجديد**، ولا سبيل له إلى `OLD`. وشرطُ
-- «أنا طرفٌ في الصفّ الجديد» يمرّ في هذا الهجوم بعينه، لأنّ المهاجم لم
-- يُخرج نفسه. المطلوب مقارنةُ الجديد بالقديم — وهذا لا يكون إلّا بمُشغِّل.
--
-- ─── الإصلاح ───
--
-- ① مُشغِّلٌ يُجمِّد عمودَي الطرفين بعد الإنشاء.
-- ② و`WITH CHECK` صريحٌ مع ذلك، فلا يُخرج أحدٌ نفسه من محادثةٍ ويُبقيها
--    قائمةً بين طرفين لا يملكها أيٌّ منهما.
--
-- ─── المُقاس بعد الإصلاح، في معاملةٍ مُلغاةٍ أيضاً ───
--
--     ①_الهجوم بلا مُرشِّح ......... مرفوض 42501
--     ②_الهجوم بمُرشِّح ............ مرفوض 42501
--     ③_المريض يصفّر عدّاده ........ صفوف=١
--     ④_المختصّ يُغلق ويُثبّت ....... صفوف=١
--     ⑤_الغريب يقرأ الرسائل ........ ٠
--     ⑦_المختصّ أخيراً ............. الأصليّ
--
-- ولا يكسر هذا شيئاً: الطرفان يُكتبان عند الإنشاء وحده
-- (`src/lib/chat/open-chat.ts`)، وكلُّ تعديلٍ في التطبيق يمسّ العدّادات
-- والحالة والتثبيت والأولوية لا غير — وقد مرّ كلاهما أعلاه.
--
-- أمّا استثناءُ المشرف في المُشغِّل فحارسٌ مُسبَق لا بابٌ مفتوح: لا سياسةَ
-- تعديلٍ للمشرف على `chats` اليوم، فقياسُ «⑥ المشرف يُعيد الإسناد» أرجع
-- صفراً — تحجبه سياسةُ RLS قبل أن يبلغ المُشغِّل. ولا يمرّ به أحدٌ بمفتاح
-- الخدمة كذلك: `auth.uid()` حينها فارغة، و`is_admin(NULL)` كاذبة.

CREATE OR REPLACE FUNCTION private.chats_participants_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF private.is_admin((SELECT auth.uid())) THEN
    RETURN NEW;
  END IF;

  IF NEW.patient_id IS DISTINCT FROM OLD.patient_id
     OR NEW.specialist_id IS DISTINCT FROM OLD.specialist_id THEN
    RAISE EXCEPTION 'طرفا المحادثة لا يُبدَّلان بعد إنشائها'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chats_participants_immutable ON public.chats;
CREATE TRIGGER chats_participants_immutable
BEFORE UPDATE ON public.chats
FOR EACH ROW
EXECUTE FUNCTION private.chats_participants_immutable();

DROP POLICY IF EXISTS "Users update their chats" ON public.chats;
CREATE POLICY "Users update their chats" ON public.chats
  FOR UPDATE
  USING ((SELECT auth.uid()) = patient_id OR (SELECT auth.uid()) = specialist_id)
  WITH CHECK ((SELECT auth.uid()) = patient_id OR (SELECT auth.uid()) = specialist_id);
