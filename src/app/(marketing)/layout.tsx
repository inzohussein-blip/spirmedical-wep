/**
 * ════════════════════════════════════════════════════════════════════
 * 🌐 Marketing Route Group Layout (V25.40)
 * ════════════════════════════════════════════════════════════════════
 *
 * Layout للصفحات التسويقية:
 *   • /blog, /blog/[slug], /blog/category/[name]
 *   • /legal/*, /about, /contact, /faq, /feedback, /help
 *
 * يستورد:
 *   • shared.css (من root layout)
 *   • marketing.css (هنا)
 *
 * ملاحظة: /about, /contact, /faq, /feedback, /help قد تستخدم scr-* 
 *         في بعض الأحيان. لذلك نستورد app.css أيضاً كـ safety net.
 *         بعد refactor كامل، يمكن إزالة app.css.
 * ════════════════════════════════════════════════════════════════════
 */

// 🌐 Marketing-specific CSS (V25.40)
import '@/app/styles/marketing.css';

// 📱 App CSS أيضاً (safety net للصفحات القديمة التي تستخدم scr-*)
// TODO V25.41: refactor /about, /faq, /contact, /feedback, /help لـ mkt-*
//              ثم نحذف هذا الـ import
import '@/app/styles/app.css';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
