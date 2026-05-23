/**
 * ════════════════════════════════════════════════════════════════════
 * 🌐 Marketing Route Group Layout (V25.42 - النهائي بدون safety net)
 * ════════════════════════════════════════════════════════════════════
 *
 * Layout للصفحات التسويقية:
 *   • /blog, /blog/[slug], /blog/category/[name]
 *   • /legal/*, /about, /contact, /faq, /feedback, /help
 *
 * يستورد:
 *   • shared.css (من root layout - تلقائياً)
 *   • marketing.css (هنا)
 *
 * ✅ V25.42: تم refactor /about, /contact, /faq, /feedback
 *           لاستخدام .mkt-* بدلاً من .scr-*
 *           لذلك تم إزالة app.css safety net
 *           
 * 🚀 المكسب: الزائر يحمّل ~130 KB أقل من قبل!
 * ════════════════════════════════════════════════════════════════════
 */

// 🌐 Marketing-specific CSS فقط
import '@/app/styles/marketing.css';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
