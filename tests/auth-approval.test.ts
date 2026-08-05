import { resolveApprovalStatus } from '@/lib/auth/approval';

/**
 * 🔒 اختبارات حماية ضدّ تصعيد الصلاحيات في التسجيل
 *
 * الثغرة التي تحرسها: كان شرط «لا يوجد ملف سابق» يمنح المختصّ `approved`
 * متى وُجد له ملف. والبحث يتمّ بالهاتف، والكتابة upsert تستبدل الدور والاعتماد.
 * فكان مسار الاستغلال: سجّل كمريض برقم ما → أعد التسجيل كمختصّ بالرقم نفسه →
 * **مختصّ معتمَد فوراً** بلا مراجعة إدارة، ومعه بيانات المرضى وقبول الطلبات.
 */

describe('🔒 المختصّ لا يُعتمد ذاتياً أبداً', () => {
  it('مختصّ جديد بلا ملف سابق → pending', () => {
    expect(resolveApprovalStatus('specialist', null)).toBe('pending');
    expect(resolveApprovalStatus('specialist', undefined)).toBe('pending');
  });

  it('🚨 مسار الاستغلال: مريض معتمَد يعيد التسجيل كمختصّ → pending لا approved', () => {
    const patientProfile = { role: 'patient', approval_status: 'approved' };
    expect(resolveApprovalStatus('specialist', patientProfile)).toBe('pending');
  });

  it('مختصّ قيد المراجعة يعيد التسجيل → يبقى pending', () => {
    expect(
      resolveApprovalStatus('specialist', { role: 'specialist', approval_status: 'pending' })
    ).toBe('pending');
  });

  it('🚨 مختصّ مرفوض يعيد التسجيل → لا يتجاوز الرفض', () => {
    expect(
      resolveApprovalStatus('specialist', { role: 'specialist', approval_status: 'rejected' })
    ).toBe('pending');
  });

  it('مختصّ معتمَد سابقاً يعيد التسجيل → يحتفظ باعتماده (لا تُسقطه إعادة التسجيل)', () => {
    expect(
      resolveApprovalStatus('specialist', { role: 'specialist', approval_status: 'approved' })
    ).toBe('approved');
  });

  it('ملف بحقول ناقصة/غريبة → pending (الافتراض الآمن)', () => {
    expect(resolveApprovalStatus('specialist', {})).toBe('pending');
    expect(resolveApprovalStatus('specialist', { role: 'admin', approval_status: 'approved' })).toBe('pending');
    expect(resolveApprovalStatus('specialist', { role: 'specialist', approval_status: null })).toBe('pending');
  });
});

describe('🔒 المرضى معتمدون تلقائياً', () => {
  it('مريض جديد → approved', () => {
    expect(resolveApprovalStatus('patient', null)).toBe('approved');
  });

  it('مريض بملف سابق أياً كانت حالته → approved', () => {
    expect(resolveApprovalStatus('patient', { role: 'specialist', approval_status: 'rejected' })).toBe('approved');
  });
});
