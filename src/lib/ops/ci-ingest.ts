import { z } from 'zod';

/** ما يرسله `report-failures.yml` إلى `/api/ops/ingest` */
export const ingestSchema = z.object({
  kind: z.enum(['ci', 'build']),
  status: z.enum(['failure', 'success']),
  /** اسمُ سير العمل، أو بيئةُ النشر (Production/Preview) */
  name: z.string().trim().min(1).max(100),
  branch: z.string().trim().min(1).max(200),
  url: z.string().url().max(500).optional(),
  sha: z.string().max(64).optional(),
  description: z.string().max(500).optional(),
});

export const ingestKey = (name: string, branch: string) => `${name}:${branch}`;

/** فشلٌ يوقف الإنتاج: سيرٌ على main أو نشرُ الإنتاج */
export const isCritical = (kind: 'ci' | 'build', name: string, branch: string) =>
  kind === 'ci' ? branch === 'main' : name.toLowerCase() === 'production';

/** `app_settings` — آخرُ تقريرٍ وصل من GitHub: هكذا تعرف الصفحةُ أنّ الربطَ يعمل ولو لم يفشل شيء */
export const INGEST_SEEN_KEY = 'ops_ingest_last';

export interface IngestSeen {
  at: string;
  kind: 'ci' | 'build';
  status: 'failure' | 'success';
  name: string;
  branch: string;
}

export async function markIngestSeen(v: Omit<IngestSeen, 'at'>): Promise<void> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/server-service');
    await createServiceClient().from('app_settings').upsert(
      {
        key: INGEST_SEEN_KEY,
        value: { ...v, at: new Date().toISOString() },
        description_ar: 'آخرُ تقريرٍ من GitHub إلى رصد الأخطاء (يُكتب آليّاً)',
      },
      { onConflict: 'key' },
    );
  } catch { /* المؤشّرُ ثانويّ — لا يُسقط التقرير */ }
}
