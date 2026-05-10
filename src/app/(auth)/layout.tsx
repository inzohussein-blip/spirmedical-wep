/**
 * Auth Layout — صفحات الدخول/التسجيل/البوابة
 *
 * يلف كل صفحات auth بـ auth-shell (شكل هاتف 480px مع ظل في الوسط)
 * نفس فلسفة AppShell لكن بدون header/bottom-nav
 *
 * صفحات auth جزء من التطبيق وليست من الموقع التسويقي
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-viewport">
      <div className="auth-shell">{children}</div>
    </div>
  );
}
