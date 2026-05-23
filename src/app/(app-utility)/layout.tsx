/**
 * ════════════════════════════════════════════════════════════════════
 * 🔧 App-Utility Route Group (V25.40)
 * ════════════════════════════════════════════════════════════════════
 *
 * Layout للصفحات الخدمية:
 *   • /changelog
 *   • /share-target
 *   • /status
 *
 * هذه الصفحات تستخدم scr-* classes (من app.css)
 * لذلك نستورد app.css هنا
 * ════════════════════════════════════════════════════════════════════
 */

// 📱 App-specific CSS (V25.40)
import '@/app/styles/app.css';

export default function AppUtilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
