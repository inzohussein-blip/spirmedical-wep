/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 Login Server Actions (Public API)
 * ═══════════════════════════════════════════════════════════════
 *
 * نقطة دخول موحّدة لـ server actions من features.
 * حالياً re-export من المسار القديم — سيتم نقله هنا في PR لاحق.
 */

// ⚠️ مؤقت: نعيد تصدير من الموقع الحالي
// في PR قادم، ننقل sendOtp من src/app/(auth)/login/actions.ts إلى هنا
// ونحدّث الـ imports في الـ forms
export { sendOtp } from '@/app/(auth)/login/actions';
