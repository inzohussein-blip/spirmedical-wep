import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { createAppointment } from './actions';

const SERVICES = [
  'سحب دم منزلي',
  'فحوصات مختبرية',
  'استشارة طبية',
  'تمريض منزلي',
  'صيدلية / توصيل أدوية',
  'حجز موعد مستشفى',
  'طبيب أسرة',
];

export default function NewAppointmentPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // الحد الأدنى للتاريخ: غداً
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/appointments" className="mb-6 inline-block text-sm text-ink-3 hover:text-ink">
        ← العودة للحجوزات
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>حجز جديد</CardTitle>
          <CardDescription>املأ التفاصيل لحجز خدمتك</CardDescription>
        </CardHeader>

        <form action={createAppointment} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="service_type" className="text-sm font-bold">
              نوع الخدمة
            </label>
            <select
              id="service_type"
              name="service_type"
              required
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20"
            >
              <option value="">اختر خدمة...</option>
              {SERVICES.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="موعد الحجز"
            type="datetime-local"
            name="scheduled_at"
            min={minDate}
            required
          />

          <Input
            label="العنوان"
            type="text"
            name="address"
            placeholder="بغداد - حي الجامعة - شارع 123"
            required
            minLength={10}
            hint="أدخل عنواناً تفصيلياً ليتمكن مزوّد الخدمة من الوصول"
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="notes" className="text-sm font-bold">
              ملاحظات (اختياري)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={1000}
              placeholder="أي تفاصيل إضافية..."
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20"
            />
          </div>

          {searchParams.error && (
            <div className="rounded-xl bg-rose-soft px-4 py-3 text-sm font-bold text-rose">
              {searchParams.error}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" size="lg">
              تأكيد الحجز ←
            </Button>
            <Link href="/appointments">
              <Button type="button" variant="ghost" size="lg">
                إلغاء
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
