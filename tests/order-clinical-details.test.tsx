import { render, screen } from '@testing-library/react';
import OrderClinicalDetails from '@/components/orders/OrderClinicalDetails';

/**
 * 🩺 اختبارات عرض التفاصيل السريرية
 *
 * الخلفية: هذه البيانات تُلتقط عند الطلب لكنها لم تكن تُعرض لأحد — فيصل الممرّض
 * دون معرفة حساسية المريض ولا احتياطات العدوى. الاختبارات تضمن ظهور التنبيهات
 * الحرجة فعلاً، وعدم ظهور ضجيج حين لا توجد بيانات.
 */

describe('🩺 تنبيهات السلامة', () => {
  it('يعرض الحساسيات المُعلَنة بأسمائها العربية', () => {
    render(
      <OrderClinicalDetails
        order={{
          allergy_form: { penicillin: true, latex: true, filled_at: '2026-01-01' },
          allergy_form_filled: true,
        }}
      />
    );
    expect(screen.getByText(/حساسية مُعلَنة/)).toBeInTheDocument();
    expect(screen.getByText(/البنسلين/)).toBeInTheDocument();
    expect(screen.getByText(/اللاتكس/)).toBeInTheDocument();
  });

  it('يُدرج حساسية «أخرى» النصّية', () => {
    render(
      <OrderClinicalDetails
        order={{ allergy_form: { other: 'حساسية موسمية', filled_at: 'x' }, allergy_form_filled: true }}
      />
    );
    expect(screen.getByText(/حساسية موسمية/)).toBeInTheDocument();
  });

  it('يعرض تنبيه العدوى كتنبيه احتياطات', () => {
    render(
      <OrderClinicalDetails order={{ infectious_disease_alert: { hepatitis_b: true, tb: true } }} />
    );
    expect(screen.getByText(/تنبيه عدوى/)).toBeInTheDocument();
    expect(screen.getByText(/التهاب الكبد B/)).toBeInTheDocument();
    expect(screen.getByText(/السلّ/)).toBeInTheDocument();
  });

  it('يؤكّد صراحةً أنّ الاستمارة مملوءة بلا حساسية (لا فراغ ملتبس)', () => {
    render(<OrderClinicalDetails order={{ allergy_form: { filled_at: 'x' }, allergy_form_filled: true }} />);
    expect(screen.getByText(/لا حساسية مُعلَنة/)).toBeInTheDocument();
  });

  it('لا يعرض بانر تنبيه حين تكون القيم false فقط (بل الطمأنة)', () => {
    render(
      <OrderClinicalDetails
        order={{ allergy_form: { penicillin: false, filled_at: 'x' }, allergy_form_filled: true }}
      />
    );
    // لا بانر تنبيه (role="alert") — الطمأنة فقط
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/لا حساسية مُعلَنة/)).toBeInTheDocument();
  });
});

describe('🩺 تفاصيل التنفيذ', () => {
  it('يعرض الصيام والمدة والمبلغ', () => {
    render(
      <OrderClinicalDetails
        order={{ needs_fasting: true, fasting_hours: 12, duration_minutes: 30, estimated_price: 15000 }}
      />
    );
    expect(screen.getByText(/صيام مطلوب/)).toBeInTheDocument();
    expect(screen.getByText(/12 ساعة قبل السحب/)).toBeInTheDocument();
    expect(screen.getByText(/30 دقيقة/)).toBeInTheDocument();
    expect(screen.getByText(/د\.ع/)).toBeInTheDocument();
  });

  it('يوفّر رابط خرائط حين تتوفّر الإحداثيات', () => {
    render(<OrderClinicalDetails order={{ location_lat: 33.31, location_lng: 44.36 }} />);
    const link = screen.getByRole('link', { name: /فتح في الخرائط/ });
    expect(link).toHaveAttribute('href', expect.stringContaining('33.31,44.36'));
  });

  it('يعرض تفضيل الكادر ويتجاهل «لا تفضيل»', () => {
    const { rerender } = render(<OrderClinicalDetails order={{ nurse_gender_preference: 'female' }} />);
    expect(screen.getByText(/كادر أنثى/)).toBeInTheDocument();

    rerender(<OrderClinicalDetails order={{ nurse_gender_preference: 'any' }} />);
    expect(screen.queryByText(/تفضيل الكادر/)).not.toBeInTheDocument();
  });

  it('يعرض المستلزمات والزيارة المتكرّرة', () => {
    render(
      <OrderClinicalDetails
        order={{
          supplies_request: { items: [{ name: 'قفازات', quantity: 2 }], total: 3000 },
          recurring_schedule: { enabled: true, interval_hours: 24 },
        }}
      />
    );
    expect(screen.getByText(/قفازات ×2/)).toBeInTheDocument();
    expect(screen.getByText(/كل 24 ساعة/)).toBeInTheDocument();
  });

  it('لا يعرض جدولة متكرّرة معطّلة', () => {
    render(<OrderClinicalDetails order={{ recurring_schedule: { enabled: false, interval_hours: 24 } }} />);
    expect(screen.queryByText(/زيارة متكرّرة/)).not.toBeInTheDocument();
  });
});

describe('🩺 لا ضجيج بلا بيانات', () => {
  it('لا يرسم شيئاً لطلب بلا تفاصيل سريرية', () => {
    const { container } = render(<OrderClinicalDetails order={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('يتحمّل قيم JSONB غير المتوقّعة بلا انهيار', () => {
    const { container } = render(
      <OrderClinicalDetails
        order={{ allergy_form: 'نصّ لا كائن' as never, infectious_disease_alert: null }}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
