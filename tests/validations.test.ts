import { phoneSchema, normalizePhone } from '@/lib/validations/auth';
import { appointmentSchema } from '@/lib/validations/appointment';

describe('Phone validation', () => {
  it('يقبل رقم عراقي صحيح بصيغة 07XX', () => {
    const result = phoneSchema.safeParse({ phone: '07712345678' });
    expect(result.success).toBe(true);
  });

  it('يقبل رقم عراقي بصيغة +9647', () => {
    const result = phoneSchema.safeParse({ phone: '+9647712345678' });
    expect(result.success).toBe(true);
  });

  it('يرفض رقم قصير', () => {
    const result = phoneSchema.safeParse({ phone: '0771' });
    expect(result.success).toBe(false);
  });

  it('يرفض رقم غير عراقي', () => {
    const result = phoneSchema.safeParse({ phone: '+1234567890' });
    expect(result.success).toBe(false);
  });
});

describe('normalizePhone', () => {
  it('يحوّل 07XX لـ +9647XX', () => {
    expect(normalizePhone('07712345678')).toBe('+9647712345678');
  });

  it('يحافظ على +964', () => {
    expect(normalizePhone('+9647712345678')).toBe('+9647712345678');
  });

  it('يزيل المسافات والشرطات', () => {
    expect(normalizePhone('077 1234 5678')).toBe('+9647712345678');
    expect(normalizePhone('077-1234-5678')).toBe('+9647712345678');
  });
});

describe('Appointment validation', () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString();

  it('يقبل بيانات صحيحة', () => {
    const result = appointmentSchema.safeParse({
      service_type: 'سحب دم منزلي',
      scheduled_at: futureDate,
      address: 'بغداد - حي الجامعة - شارع 14',
      notes: 'فحص شامل',
    });
    expect(result.success).toBe(true);
  });

  it('يرفض تاريخ في الماضي', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const result = appointmentSchema.safeParse({
      service_type: 'سحب دم منزلي',
      scheduled_at: pastDate,
      address: 'بغداد - حي الجامعة',
    });
    expect(result.success).toBe(false);
  });

  it('يرفض عنوان قصير', () => {
    const result = appointmentSchema.safeParse({
      service_type: 'سحب دم منزلي',
      scheduled_at: futureDate,
      address: 'بغداد',
    });
    expect(result.success).toBe(false);
  });
});
