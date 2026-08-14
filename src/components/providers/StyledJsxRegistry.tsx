'use client';

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎨 سِجلّ styled-jsx لموجّه التطبيق (App Router)
 * ═══════════════════════════════════════════════════════════════════
 *
 * واحدٌ وعشرون مكوّناً في المشروع يكتب تنسيقه داخل `<style jsx>` —
 * ٢٩٢٣ سطر CSS، منها ٧٥٠ سطراً في رحلة سحب الدم وحدها.
 *
 * وفي App Router **لا يُحقن أيٌّ منها**. المحوّل يعمل ويُضيف صنف النطاق
 * (`jsx-xxxxxxxx`) إلى العناصر، لكنّ القواعد نفسها لا تصل الصفحة: لا في
 * HTML الخادم ولا بعد الترطيب. النتيجة صفحاتٌ تُعرض بأنماط المتصفّح
 * الافتراضية — أزرارٌ رمادية وحقولٌ متلاصقة — بينما التنسيق مكتوبٌ
 * وموجودٌ في الملفّ.
 *
 * قِسته باختبارٍ معزول: مكوّن عميلٍ فيه قاعدة واحدة، فظهر صنف النطاق على
 * العنصر وبقيت الخلفية شفّافة والحشو صفراً.
 *
 * السبب أنّ styled-jsx يحتاج سِجلّاً يجمع الأنماط ويحقنها عبر
 * `useServerInsertedHTML` — وهو ما يوفّره هذا المكوّن، حسب توثيق Next.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { StyleRegistry, createStyleRegistry } from 'styled-jsx';

export default function StyledJsxRegistry({ children }: { children: React.ReactNode }) {
  const [registry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = registry.styles();
    registry.flush();
    return <>{styles}</>;
  });

  return <StyleRegistry registry={registry}>{children}</StyleRegistry>;
}
