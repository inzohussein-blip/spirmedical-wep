/**
 * ═══════════════════════════════════════════════════════════════
 * ThemeProvider — يحقن CSS Variables في الصفحة
 * ═══════════════════════════════════════════════════════════════
 *
 * يعمل على Server-side فقط لتفادي FOUC (Flash of Unstyled Content)
 * يستبدل قيم الـ button tokens بالقيم من Supabase
 *
 * الاستخدام في layout.tsx:
 *   <ThemeProvider>
 *     {children}
 *   </ThemeProvider>
 */

import { getActiveTheme } from '@/lib/theme/get-theme';

export async function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getActiveTheme();

  // نحقن الـ CSS variables عبر <style> tag في الـ <head>
  // هذا يعمل على Server-side فيُرسل HTML كامل بالألوان الصحيحة
  // بدون FOUC أبداً
  const cssVars = `
:root {
  --emerald: ${theme.primary_color};
  --emerald-deep: ${theme.primary_dark};
  --emerald-soft: ${theme.primary_soft};
  --amber: ${theme.accent_color};
  --rose: ${theme.danger_color};

  /* Button tokens - تشير لـ theme variables الجديدة */
  --btn-primary-bg: ${theme.primary_color};
  --btn-primary-bg-hover: ${theme.primary_dark};
  --btn-primary-fg: #FAF6EB;
  --btn-danger-bg: ${theme.danger_color};
  --btn-danger-bg-hover: ${darkenHex(theme.danger_color, 0.15)};
  --btn-danger-fg: #FAF6EB;
}
  `.trim();

  return (
    <>
      <style
        id="spir-theme"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: cssVars }}
      />
      {children}
    </>
  );
}

/**
 * يجعل اللون أغمق بنسبة معينة (0-1)
 * يُستخدم لتوليد :hover state تلقائياً
 */
function darkenHex(hex: string, amount: number): string {
  // إزالة #
  const c = hex.replace('#', '');
  // فك RGB
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  // طبّق التعتيم
  const newR = Math.max(0, Math.floor(r * (1 - amount)));
  const newG = Math.max(0, Math.floor(g * (1 - amount)));
  const newB = Math.max(0, Math.floor(b * (1 - amount)));

  // ارجعها هيكس
  return (
    '#' +
    [newR, newG, newB]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}
