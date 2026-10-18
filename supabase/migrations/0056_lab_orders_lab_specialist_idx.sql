-- 0056 — فهرسٌ للمفتاح الأجنبيّ الجديد في 0055 (lab_orders.lab_specialist_id).
-- كلُّ مفتاحٍ أجنبيّ يغطّيه فهرس (tests/schema-conformance.test.ts): حذفُ مختصٍّ يمسح بالمفتاح
-- (ON DELETE SET NULL) فيمسح الجدولَ كلَّه بلا فهرس.
CREATE INDEX IF NOT EXISTS lab_orders_lab_specialist_id_idx ON public.lab_orders (lab_specialist_id);
