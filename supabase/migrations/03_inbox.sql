-- ════════════════════════════════════════════════════════════════════
-- 💬 Migration 03: INBOX SYSTEM (V24 — مُصحَّح)
-- ════════════════════════════════════════════════════════════════════
-- ManyChat-style inbox for patient-specialist communication
-- 🔧 V24: تحسين update_chat_on_new_message للرسائل غير النصية
-- 🔧 V24: إضافة indexes ناقصة
-- ════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════
-- 💬 CHATS - المحادثات
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,

  -- الحالة
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'archived')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- آخر رسالة
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- العدّادات
  patient_unread_count INTEGER DEFAULT 0,
  specialist_unread_count INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,

  -- إعدادات
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,

  -- تواريخ
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chats_patient ON public.chats(patient_id);
CREATE INDEX IF NOT EXISTS idx_chats_specialist ON public.chats(specialist_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON public.chats(status);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON public.chats(last_message_at DESC);
-- 🆕 V24: indexes ناقصة
CREATE INDEX IF NOT EXISTS idx_chats_appointment ON public.chats(appointment_id)
  WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chats_pinned ON public.chats(is_pinned)
  WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_chats_last_msg_by ON public.chats(last_message_by)
  WHERE last_message_by IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════
-- ✉️ MESSAGES - الرسائل
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- المحتوى
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'system')),
  content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,

  -- الحالة
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,

  -- ردّ على
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(chat_id, is_read) WHERE is_read = FALSE;
-- 🆕 V24: index ناقص على reply_to_id
CREATE INDEX IF NOT EXISTS idx_messages_reply ON public.messages(reply_to_id)
  WHERE reply_to_id IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════
-- ⚡ QUICK REPLIES - قوالب جاهزة للأخصائيين
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quick_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(specialist_id, shortcut)
);

CREATE INDEX IF NOT EXISTS idx_quick_replies_spec ON public.quick_replies(specialist_id, is_active);


-- ════════════════════════════════════════════════════════════════════
-- 📝 CHAT NOTES - ملاحظات الأخصائي عن المريض
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chat_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_notes_chat ON public.chat_notes(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_notes_spec ON public.chat_notes(specialist_id);


-- ════════════════════════════════════════════════════════════════════
-- 🔄 Triggers
-- ════════════════════════════════════════════════════════════════════

-- تحديث updated_at
DROP TRIGGER IF EXISTS chats_updated_at ON public.chats;
CREATE TRIGGER chats_updated_at
BEFORE UPDATE ON public.chats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS quick_replies_updated_at ON public.quick_replies;
CREATE TRIGGER quick_replies_updated_at
BEFORE UPDATE ON public.quick_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- 🔧 V24: تحديث آخر رسالة + العدّادات تلقائياً (مع معاينة ذكية للرسائل غير النصية)
CREATE OR REPLACE FUNCTION public.update_chat_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  chat_patient UUID;
  chat_specialist UUID;
  message_preview TEXT;
BEGIN
  -- احصل على patient_id و specialist_id
  SELECT patient_id, specialist_id INTO chat_patient, chat_specialist
  FROM public.chats WHERE id = NEW.chat_id;

  -- 🆕 V24: معاينة ذكية حسب نوع الرسالة (تتعامل مع NULL content)
  message_preview := COALESCE(
    LEFT(NEW.content, 200),
    CASE NEW.type
      WHEN 'image' THEN '📷 صورة'
      WHEN 'file' THEN '📎 ' || COALESCE(NEW.attachment_name, 'ملف')
      WHEN 'audio' THEN '🎤 رسالة صوتية'
      WHEN 'system' THEN '⚙️ رسالة نظام'
      ELSE 'رسالة'
    END
  );

  -- تحديث الـ chat
  UPDATE public.chats
  SET
    last_message = message_preview,
    last_message_at = NEW.created_at,
    last_message_by = NEW.sender_id,
    total_messages = total_messages + 1,
    -- زيادة عداد الـ unread للطرف المقابل
    patient_unread_count = CASE
      WHEN NEW.sender_id = chat_specialist THEN patient_unread_count + 1
      ELSE patient_unread_count
    END,
    specialist_unread_count = CASE
      WHEN NEW.sender_id = chat_patient THEN specialist_unread_count + 1
      ELSE specialist_unread_count
    END
  WHERE id = NEW.chat_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_update_chat ON public.messages;
CREATE TRIGGER messages_update_chat
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_chat_on_new_message();


-- ════════════════════════════════════════════════════════════════════
-- 🔐 RLS Policies
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_notes ENABLE ROW LEVEL SECURITY;


-- ─── Chats ───
DROP POLICY IF EXISTS "Users see their chats" ON public.chats;
CREATE POLICY "Users see their chats" ON public.chats
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = specialist_id);

DROP POLICY IF EXISTS "Users create their chats" ON public.chats;
CREATE POLICY "Users create their chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = patient_id OR auth.uid() = specialist_id);

DROP POLICY IF EXISTS "Users update their chats" ON public.chats;
CREATE POLICY "Users update their chats" ON public.chats
  FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = specialist_id);


-- ─── Messages ───
DROP POLICY IF EXISTS "Users see chat messages" ON public.messages;
CREATE POLICY "Users see chat messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.patient_id = auth.uid() OR chats.specialist_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = messages.chat_id
      AND (chats.patient_id = auth.uid() OR chats.specialist_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users update own messages" ON public.messages;
CREATE POLICY "Users update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);


-- ─── Quick Replies (Specialists only) ───
DROP POLICY IF EXISTS "Specialists manage own templates" ON public.quick_replies;
CREATE POLICY "Specialists manage own templates" ON public.quick_replies
  USING (auth.uid() = specialist_id)
  WITH CHECK (auth.uid() = specialist_id);


-- ─── Chat Notes (Specialists only) ───
DROP POLICY IF EXISTS "Specialists manage chat notes" ON public.chat_notes;
CREATE POLICY "Specialists manage chat notes" ON public.chat_notes
  USING (auth.uid() = specialist_id)
  WITH CHECK (auth.uid() = specialist_id);


-- ════════════════════════════════════════════════════════════════════
-- ✅ Migration 03 Complete
-- ════════════════════════════════════════════════════════════════════
