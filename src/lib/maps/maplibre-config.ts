/**
 * ════════════════════════════════════════════════════════════════════
 * 🗺️ MapLibre Config (V33 — إعادة بناء الخرائط)
 * ════════════════════════════════════════════════════════════════════
 *
 * مصدر واحد لإعدادات الخرائط بعد الانتقال من Leaflet + OpenStreetMap
 * (raster) إلى MapLibre GL JS + OpenFreeMap (vector).
 *
 * لماذا التغيير؟
 *   • خوادم بلاط OpenStreetMap العامّة تمنع الاستخدام التجاري الكثيف
 *     (سياسة الاستخدام) وقد تُرجع 418/403 لنطاق تجاري → «الخريطة لا تعمل».
 *   • MapLibre (vector) أوضح وأنعم (retina/zoom سلس) ويبدو احترافياً.
 *   • OpenFreeMap: بلاط vector مجاني بلا مفتاح API وبلا حدّ، ويسمح
 *     بالاستخدام التجاري (https://openfreemap.org). كل الموارد (style/
 *     glyphs/sprites/tiles) تُخدَم من نطاق واحد → CSP بسيط.
 * ════════════════════════════════════════════════════════════════════
 */

import type { Map as MlMap } from 'maplibre-gl';

export const IRAQ_CENTER = { lat: 33.3152, lng: 44.3661 }; // بغداد

/** نمط ملوّن (شوارع/معالم) — للعرض العام والخرائط المركزية */
export const MAP_STYLE_STREETS = 'https://tiles.openfreemap.org/styles/liberty';
/** نمط فاتح نظيف — لمنتقيات الموقع (تباين أعلى للمؤشّر) */
export const MAP_STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron';

/** تحميل مكتبة MapLibre ديناميكياً (client-only، تبقى خارج حزمة الخادم) */
export async function loadMapLibre() {
  const mod = await import('maplibre-gl');
  return mod.default;
}

/**
 * يبني عنصر HTML لمؤشّر مخصّص من buildMarkerSvg (يعاد استخدامه كما كان مع Leaflet).
 * MapLibre يقبل أي عنصر DOM كمؤشّر عبر new Marker({ element }).
 */
export function markerElement(html: string, className = ''): HTMLDivElement {
  const el = document.createElement('div');
  if (className) el.className = className;
  el.innerHTML = html;
  el.style.cursor = 'pointer';
  el.style.lineHeight = '0';
  return el;
}

/**
 * إصلاح الأبعاد: MapLibre لا يراقب تغيّر حجم الـ container تلقائياً.
 * نستدعي resize() عدّة مرّات (flex/modal/lazy) + ResizeObserver.
 * يُرجع دالة تنظيف تُوقف المراقبة.
 */
export function attachResizeFix(map: MlMap, container: HTMLElement): () => void {
  const doResize = () => {
    try {
      map.resize();
    } catch {
      /* الخريطة قد تكون أُزيلت */
    }
  };
  const timers = [
    setTimeout(doResize, 0),
    setTimeout(doResize, 150),
    setTimeout(doResize, 400),
  ];
  requestAnimationFrame(doResize);

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(doResize);
    ro.observe(container);
  }

  return () => {
    timers.forEach(clearTimeout);
    if (ro) ro.disconnect();
  };
}
