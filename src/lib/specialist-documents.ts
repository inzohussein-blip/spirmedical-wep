import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { UPLOAD_MAX_BYTES } from '@/lib/forms/prepare-upload';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🪪 وثائقُ المختصّ عند التسجيل
 * ════════════════════════════════════════════════════════════════════
 *
 * كان نموذجُ التسجيل يطلب ثلاثَ وثائق ثمّ يُهملها كلَّها (لا رفعَ في الكود أصلاً):
 * يظنّ المختصُّ أنّه أرسل هويّته، ولا يجد المراجعُ شيئاً. الآن:
 *   - **الهويّة وحدها مطلوبة** (قرار المالك)، والشهادةُ والصورة اختياريّتان.
 *   - تُرفع إلى الحاوية الخاصّة `nurse-credentials` بمسار `<user_id>/<kind>-<وقت>.<ext>`:
 *     يقرؤها صاحبُها والإدارة وحدهما (سياسات storage.objects القائمة).
 *   - ومسارُها في `specialist_applications.documents` ليعرضها المراجع.
 *
 * الرفعُ بعميل الخدمة: الحسابُ أُنشئ للتوّ في الخادم ولا جلسةَ له بعد.
 * ════════════════════════════════════════════════════════════════════
 */

export const SPECIALIST_DOCS_BUCKET = 'nurse-credentials';

export type SpecialistDocKind = 'id' | 'certificate' | 'photo';

export const SPECIALIST_DOC_FIELDS: Record<SpecialistDocKind, { field: string; label: string; required: boolean }> = {
  id: { field: 'idDocument', label: 'إثبات الشخصية', required: true },
  certificate: { field: 'certificateDocument', label: 'شهادة الاختصاص', required: false },
  photo: { field: 'profilePhoto', label: 'الصورة الشخصية', required: false },
};

/** ما تقبله الحاوية (`allowed_mime_types`) — الصورُ تُحوَّل إلى JPEG في المتصفّح قبل الإرسال. */
export const SPECIALIST_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;

/** سقفُ الملف الواحد — المصدرُ نفسه الذي يضغط إليه المتصفّح. */
export const SPECIALIST_DOC_MAX_BYTES = UPLOAD_MAX_BYTES;

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };

export interface StoredDoc {
  path: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export type StoredDocs = Partial<Record<SpecialistDocKind, StoredDoc>>;

/** ملفٌّ حقيقيّ في FormData (المتصفّح يرسل ملفّاً فارغاً لحقلٍ لم يُختر). */
function fileFrom(formData: FormData, field: string): File | null {
  const v = formData.get(field);
  return v instanceof File && v.size > 0 ? v : null;
}

/**
 * يقرأ الوثائق من النموذج ويتحقّق منها **قبل** إنشاء الحساب.
 * يعيد رسالةَ خطأٍ عربيّة، أو الملفّات.
 */
export function readSpecialistDocs(
  formData: FormData,
): { error: string } | { files: Partial<Record<SpecialistDocKind, File>> } {
  const files: Partial<Record<SpecialistDocKind, File>> = {};
  for (const [kind, meta] of Object.entries(SPECIALIST_DOC_FIELDS) as [SpecialistDocKind, (typeof SPECIALIST_DOC_FIELDS)[SpecialistDocKind]][]) {
    const file = fileFrom(formData, meta.field);
    if (!file) {
      if (meta.required) return { error: `${meta.label} مطلوب` };
      continue;
    }
    if (!(SPECIALIST_DOC_TYPES as readonly string[]).includes(file.type)) {
      return { error: `${meta.label}: الملفّ يجب أن يكون صورة أو PDF` };
    }
    if (file.size > SPECIALIST_DOC_MAX_BYTES) {
      return { error: `${meta.label}: الملفّ كبير — الحدّ 1.2MB` };
    }
    files[kind] = file;
  }
  return { files };
}

/**
 * يرفع الوثائق ويسجّلها في طلب الانضمام. لا يرمي: الحسابُ أُنشئ، وفشلُ الرفع يظهر
 * للمراجع («لم تُرفع الهويّة») بدل أن يُسقط التسجيل بعد إنشاء الحساب.
 * يعيد الأنواعَ التي رُفعت.
 */
export async function storeSpecialistDocs(
  userId: string,
  files: Partial<Record<SpecialistDocKind, File>>,
  now: Date = new Date(),
): Promise<SpecialistDocKind[]> {
  const admin = createAdminClient();
  const stored: StoredDocs = {};

  for (const [kind, file] of Object.entries(files) as [SpecialistDocKind, File][]) {
    const path = `${userId}/${kind}-${now.getTime()}.${EXT[file.type] ?? 'bin'}`;
    const { error } = await admin.storage
      .from(SPECIALIST_DOCS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) {
      logger.error('specialist document upload failed', { userId, kind, error: error.message });
      continue;
    }
    stored[kind] = { path, type: file.type, size: file.size, uploaded_at: now.toISOString() };
  }

  const kinds = Object.keys(stored) as SpecialistDocKind[];
  if (kinds.length === 0) return kinds;

  // يُدمج مع وثائقَ سابقة (إعادةُ تسجيلٍ برمز واتساب لحسابٍ قائم)
  const { data: existing } = await admin
    .from('specialist_applications')
    .select('documents')
    .eq('user_id', userId)
    .maybeSingle();
  const documents = { ...((existing?.documents as StoredDocs | null) ?? {}), ...stored };

  const { error: upsertErr } = await admin
    .from('specialist_applications')
    .upsert(
      {
        user_id: userId,
        status: 'pending',
        documents: documents as never,
        step_1_completed_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' },
    );
  if (upsertErr) {
    logger.error('specialist_applications upsert failed', { userId, error: upsertErr.message });
  }
  return kinds;
}

export interface SignedDoc {
  kind: SpecialistDocKind;
  label: string;
  type: string;
  uploadedAt: string;
  url: string | null;
}

/** وثائقُ المختصّ بروابطَ موقّعة لساعة — لصفحة المراجعة في الإدارة وحدها. */
export async function signedSpecialistDocs(userId: string): Promise<SignedDoc[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('specialist_applications')
    .select('documents')
    .eq('user_id', userId)
    .maybeSingle();
  const docs = (data?.documents as StoredDocs | null) ?? {};

  const out: SignedDoc[] = [];
  for (const kind of Object.keys(SPECIALIST_DOC_FIELDS) as SpecialistDocKind[]) {
    const doc = docs[kind];
    if (!doc?.path) continue;
    const { data: signed } = await admin.storage
      .from(SPECIALIST_DOCS_BUCKET)
      .createSignedUrl(doc.path, 60 * 60);
    out.push({
      kind,
      label: SPECIALIST_DOC_FIELDS[kind].label,
      type: doc.type,
      uploadedAt: doc.uploaded_at,
      url: signed?.signedUrl ?? null,
    });
  }
  return out;
}
