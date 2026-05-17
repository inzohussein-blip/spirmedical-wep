import { phoneSchema, otpSchema, normalizePhone } from '@/lib/validations/auth';
import {
  appointmentSchema,
  appointmentUpdateSchema,
  appointmentStatusEnum,
} from '@/lib/validations/appointment';

describe('Auth validation', () => {
  describe('phoneSchema', () => {
    it('يقبل أرقام عراقية صحيحة', () => {
      const validPhones = ['07712345678', '+9647712345678', '07812345678', '07912345678'];
      for (const phone of validPhones) {
        expect(phoneSchema.safeParse({ phone }).success).toBe(true);
      }
    });

    it('يرفض أرقام غير عراقية', () => {
      const invalidPhones = ['+1234567890', '+447700900000', '0123456', 'abc123', ''];
      for (const phone of invalidPhones) {
        expect(phoneSchema.safeParse({ phone }).success).toBe(false);
      }
    });
  });

  describe('otpSchema', () => {
    it('يقبل رمز ٦ أرقام', () => {
      expect(
        otpSchema.safeParse({ phone: '+9647712345678', token: '123456' }).success
      ).toBe(true);
    });

    it('يرفض رمز قصير', () => {
      expect(
        otpSchema.safeParse({ phone: '+9647712345678', token: '12345' }).success
      ).toBe(false);
    });

    it('يرفض رمز فيه أحرف', () => {
      expect(
        otpSchema.safeParse({ phone: '+9647712345678', token: 'abc123' }).success
      ).toBe(false);
    });
  });

  describe('normalizePhone', () => {
    it('07XX → +9647XX', () => {
      expect(normalizePhone('07712345678')).toBe('+9647712345678');
    });

    it('+9647XX يبقى كما هو', () => {
      expect(normalizePhone('+9647712345678')).toBe('+9647712345678');
    });

    it('يزيل المسافات والشرطات', () => {
      expect(normalizePhone('077 1234 5678')).toBe('+9647712345678');
      expect(normalizePhone('077-1234-5678')).toBe('+9647712345678');
    });
  });
});

describe('Appointment validation', () => {
  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const pastDate = new Date(Date.now() - 86400000).toISOString();

  describe('appointmentSchema', () => {
    it('يقبل بيانات صحيحة كاملة', () => {
      expect(
        appointmentSchema.safeParse({
          service_type: 'سحب دم منزلي',
          scheduled_at: futureDate,
          address: 'بغداد - حي الجامعة - شارع 14',
          notes: 'فحص شامل',
        }).success
      ).toBe(true);
    });

    it('يقبل بدون ملاحظات', () => {
      expect(
        appointmentSchema.safeParse({
          service_type: 'استشارة',
          scheduled_at: futureDate,
          address: 'بغداد - الكرادة - شارع المدينة',
        }).success
      ).toBe(true);
    });

    it('يرفض تاريخ ماضي', () => {
      expect(
        appointmentSchema.safeParse({
          service_type: 'سحب دم منزلي',
          scheduled_at: pastDate,
          address: 'بغداد - حي الجامعة - شارع 14',
        }).success
      ).toBe(false);
    });

    it('يرفض تاريخ غير صالح', () => {
      expect(
        appointmentSchema.safeParse({
          service_type: 'سحب دم منزلي',
          scheduled_at: 'not-a-date',
          address: 'بغداد - حي الجامعة - شارع 14',
        }).success
      ).toBe(false);
    });

    it('يرفض عنوان قصير', () => {
      expect(
        appointmentSchema.safeParse({
          service_type: 'سحب دم',
          scheduled_at: futureDate,
          address: 'بغداد',
        }).success
      ).toBe(false);
    });

    it('يرفض ملاحظات أطول من ١٠٠٠ حرف', () => {
      expect(
        appointmentSchema.safeParse({
          service_type: 'سحب دم',
          scheduled_at: futureDate,
          address: 'بغداد - حي الجامعة - شارع 14',
          notes: 'A'.repeat(1001),
        }).success
      ).toBe(false);
    });
  });

  describe('appointmentUpdateSchema', () => {
    it('يقبل تحديث جزئي (status فقط)', () => {
      expect(appointmentUpdateSchema.safeParse({ status: 'confirmed' }).success).toBe(
        true
      );
    });

    it('يرفض status غير صالح', () => {
      expect(
        appointmentUpdateSchema.safeParse({ status: 'invalid_status' }).success
      ).toBe(false);
    });
  });

  describe('appointmentStatusEnum', () => {
    it('يقبل كل الحالات الـ٥', () => {
      const valid = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      for (const status of valid) {
        expect(appointmentStatusEnum.safeParse(status).success).toBe(true);
      }
    });

    it('يرفض حالة خارجية', () => {
      expect(appointmentStatusEnum.safeParse('rejected').success).toBe(false);
    });
  });
});
