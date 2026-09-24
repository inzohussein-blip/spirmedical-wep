'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { areaCovering, type ServiceArea } from '@/lib/service-areas';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🧭 تغطية الخدمة لنقطةٍ يختارها المريض
 * ════════════════════════════════════════════════════════════════════
 *
 * كان جدول `service_areas` بلا مستهلك: يرسم المشرف حدود التغطية والتطبيق
 * لا يسأل عنها. فيكتشف المريض أنّ الخدمة لا تصله بعد الحجز لا قبله — وهو
 * ذاتُ العطب الذي بُني الجدول لعلاجه.
 *
 * ─── فشلٌ مفتوح، مرّتين ───
 *
 *  ١) إن تعذّرت القراءة (انقطاع، جدولٌ غير مُرحَّل) ⇒ لا تحذير.
 *  ٢) وإن لم يُرسم أيّ نطاقٍ بعدُ ⇒ لا تحذير كذلك.
 *
 * والثانية أهمّ: بدونها يصير الجدولُ الفارغ — وهو حاله اليوم — معناه «لا
 * مكان مخدوم»، فيرى كلّ مريضٍ في العراق تحذيراً بأنّ منطقته خارج النطاق.
 * فالتغطية لا تُقيّد إلّا بعد أن يرسم المشرفُ نطاقاً واحداً على الأقل.
 *
 * ─── تحذيرٌ لا منع ───
 *
 * النتيجة تُعرض للمريض ولا تُوقف الحجز. تحويلُها إلى منعٍ قرارٌ تشغيليّ
 * لا تقنيّ: نطاقٌ ناقصُ الرسم يُسقط حجوزاً حقيقيّةً بلا أن يرى أحدٌ ما
 * سقط. فتُرك القرار لصاحب المنصّة.
 */

export type CoverageState =
  | { status: 'idle' }
  | { status: 'loading' }
  /** لا نطاقات مرسومة — التغطية غير مقيّدة */
  | { status: 'unrestricted' }
  | { status: 'inside'; areaName: string }
  | { status: 'outside' };

let cachedAreas: ServiceArea[] | null = null;
let inflight: Promise<ServiceArea[]> | null = null;

/** جلبةٌ واحدة لكلّ جلسة تصفّح: الحدود لا تتغيّر أثناء ملء نموذج */
async function loadAreas(): Promise<ServiceArea[]> {
  if (cachedAreas) return cachedAreas;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .from('service_areas')
        .select('id, name_ar, governorate, polygon, color, is_active, notes, created_at')
        .eq('is_active', true);

      cachedAreas = error || !data ? [] : (data as ServiceArea[]);
    } catch {
      cachedAreas = [];
    } finally {
      inflight = null;
    }
    return cachedAreas ?? [];
  })();

  return inflight;
}

export function useServiceCoverage(
  coords: { lat: number; lng: number } | null
): CoverageState {
  const [areas, setAreas] = useState<ServiceArea[] | null>(null);

  useEffect(() => {
    let alive = true;
    loadAreas().then((a) => {
      if (alive) setAreas(a);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!coords) return { status: 'idle' };
  if (areas === null) return { status: 'loading' };
  if (areas.length === 0) return { status: 'unrestricted' };

  const hit = areaCovering(areas, coords.lat, coords.lng);
  return hit ? { status: 'inside', areaName: hit.name_ar } : { status: 'outside' };
}
