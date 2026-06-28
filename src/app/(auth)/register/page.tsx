import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
// 🎯 اختيار نوع الحساب
// ═══════════════════════════════════════════════════════════

export const metadata = {
  title: 'اختر نوع حسابك · سباير ميديكال',
  description: 'اختر بين حساب مريض أو حساب أخصائي',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-gray-50">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">اختر نوع حسابك</h1>
          <p className="text-gray-600 text-lg">انضم إلينا اليوم وابدأ رحلتك الصحية</p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Patient Option */}
          <Link
            href="/auth/register/patient"
            className="group p-8 bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-emerald-500 transition-all duration-300 transform hover:scale-105"
          >
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition">
                <span className="text-3xl">🏥</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">حساب مريض</h2>

            <p className="text-gray-600 mb-6 leading-relaxed">
              احجز المواعيد مع الأخصائيين، اطلب خدمات طبية منزلية، تواصل مع الأطباء
              والمتخصصين بسهولة.
            </p>

            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                سحب دم منزلي
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                حجز استشارات
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                متابعة صحية
              </li>
            </ul>

            <div className="flex items-center justify-between">
              <span className="text-emerald-600 font-medium group-hover:gap-2 flex items-center transition-all gap-1">
                ابدأ الآن
                <span>←</span>
              </span>
            </div>
          </Link>

          {/* Specialist Option */}
          <Link
            href="/auth/register/specialist"
            className="group p-8 bg-white rounded-2xl shadow-md hover:shadow-xl border-2 border-transparent hover:border-amber-500 transition-all duration-300 transform hover:scale-105"
          >
            <div className="mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">حساب أخصائي</h2>

            <p className="text-gray-600 mb-6 leading-relaxed">
              قدم خدماتك الطبية للمرضى، أدر مواعيدك بسهولة، كسب دخل إضافي من الخدمات
              الطبية.
            </p>

            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-amber-600">✓</span>
                عرض خدماتك
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-600">✓</span>
                إدارة المواعيد
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-600">✓</span>
                كسب دخل إضافي
              </li>
            </ul>

            <div className="flex items-center justify-between">
              <span className="text-amber-600 font-medium group-hover:gap-2 flex items-center transition-all gap-1">
                ابدأ الآن
                <span>←</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Already Registered */}
        <p className="text-center mt-12 text-gray-700">
          لديك حساب بالفعل؟{' '}
          <Link href="/auth/login" className="text-emerald-600 hover:underline font-medium">
            سجّل الدخول
          </Link>
        </p>

        {/* Features */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-6">لماذا تختار سباير ميديكال؟</h3>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl mb-3">🔐</div>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">آمن وموثوق</span>
                <br />
                بياناتك محمية بأعلى معايير الأمان
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">⚡</div>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">سريع وسهل</span>
                <br />
                واجهة بسيطة وسلسة لسهولة الاستخدام
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🌟</div>
              <p className="text-gray-600">
                <span className="font-medium text-gray-900">دعم 24/7</span>
                <br />
                فريق دعم جاهز لمساعدتك في أي وقت
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
