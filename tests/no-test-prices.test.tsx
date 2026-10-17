import { readFileSync } from 'fs';
import { join } from 'path';
import { render } from '@testing-library/react';
import { isUnpricedService } from '@/lib/config/pricing';
import OrderClinicalDetails from '@/components/orders/OrderClinicalDetails';

/**
 * 🚫 التحاليلُ وسحبُ الدم بلا سعرٍ في أيّ واجهة (قرار المالك، 17 تشرين الأول).
 *
 * كان `SHOW_PRICES = false` يُخفي بعضها، وتتجاوزه بطاقةُ الرئيسية («من 15$» — بالدولار)
 * والمعالج («من 15,000 د.ع» و«السعر التقديري») وتفاصيلُ الطلب («المبلغ المقدّر»)، والأسئلةُ
 * الشائعة تقول «الأسعار معروضة بوضوح قبل تأكيد الحجز».
 */
const ROOT = process.cwd();
const code = (p: string) =>
  readFileSync(join(ROOT, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

describe('🚫 isUnpricedService', () => {
  it.each([
    [{ id: 'blood-draw' }],
    [{ id: 'covid-test', category: 'lab' }],
    [{ service_id: 'blood-draw' }],
    [{ service_type: 'سحب دم + تحاليل' }],
    [{ service_type: 'تحليل فيتامين د' }],
    [{ required_specialist_type: 'lab_analyst' }],
  ])('🚨 %j بلا سعر', (s) => expect(isUnpricedService(s)).toBe(true));

  it.each([[{ id: 'home-nursing', category: 'home' }], [{ service_type: 'تمريض منزلي' }]])(
    '%j ليس منها', (s) => expect(isUnpricedService(s)).toBe(false));
});

describe('🚫 تفاصيلُ الطلب', () => {
  it('🚨 طلبُ سحب دم لا يعرض «المبلغ المقدّر»', () => {
    const { container } = render(
      <OrderClinicalDetails order={{ service_type: 'سحب دم + تحاليل', estimated_price: 25000, duration_minutes: 30 }} />,
    );
    expect(container.textContent).not.toMatch(/د\.ع|المبلغ/);
  });

  it('طلبُ تمريض يعرضه كما كان', () => {
    const { container } = render(
      <OrderClinicalDetails order={{ service_type: 'تمريض منزلي', estimated_price: 30000, duration_minutes: 60 }} />,
    );
    expect(container.textContent).toMatch(/المبلغ المقدّر/);
  });
});

describe('🚫 لا سعرَ في الواجهات', () => {
  it('🚨 بطاقةُ سحب الدم في الرئيسية بلا سعر', () => {
    const src = code('src/components/dashboard-v3/FeaturedServiceCardV3.tsx');
    expect(src).not.toMatch(/priceFrom|من \$|IconCash/);
    expect(code('src/app/(dashboard)/dashboard/page.tsx')).not.toMatch(/priceFrom/);
  });

  it('🚨 تدفّقُ سحب الدم وسجلُّ التحاليل لا يرسمان مبلغاً', () => {
    for (const p of [
      'src/components/appointments/BloodDrawFlow.tsx',
      'src/app/(dashboard)/account/lab-history/page.tsx',
      'src/app/(dashboard)/account/lab-history/[id]/page.tsx',
    ]) {
      const src = code(p);
      expect(src).not.toMatch(/SHOW_PRICES|د\.ع/);
      expect(src).not.toMatch(/\{formatTestPrice\(/);
    }
  });

  it('🚨 المعالجُ وصفحةُ التتبّع يسألان isUnpricedService', () => {
    const w = code('src/components/appointments/AppointmentWizard.tsx');
    expect(w).toMatch(/!isUnpricedService\(service\) && <span className="aw-service-price">/);
    expect(w).toMatch(/!isUnpricedService\(data\.service\) && \(\s*<div className="summary-price">/);
    expect(code('src/app/(dashboard)/appointments/[id]/track/page.tsx')).toMatch(/isUnpricedService\(appointment\) \? null/);
  });

  it('🚨 الموقعُ لا يَعِد بأسعارٍ معروضة', () => {
    expect(code('src/app/(marketing)/faq/FAQClient.tsx')).not.toMatch(/الأسعار معروضة/);
    expect(code('src/app/page.tsx')).not.toMatch(/أسعار شفافة/);
    expect(code('src/lib/data/blog-articles.ts')).not.toMatch(/سعر مخفّض/);
  });
});
