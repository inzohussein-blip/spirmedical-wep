/**
 * 🖥️ واجهةُ الإدارة: إنشاءُ الحساب وتسليمُه عبر واتساب.
 *
 * - الخطأ يبقى في النموذج (كان ينقل إلى شاشة «فشل» تمحو كلَّ الحقول).
 * - بعد الإنشاء: زرُّ «رابط التفعيل» حين يعمل التحقّقُ العكسيّ، وزرُّ الرمز المؤقّت دائماً.
 * - صفحتا المريض والمختصّ: «إرسال رابط استعادة الرمز» يظهر حين يعمل التحقّق فقط.
 */
import { render, screen, fireEvent, act } from '@testing-library/react';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>;
  MockLink.displayName = 'MockLink';
  return MockLink;
});
jest.mock('@/app/admin/_actions/login-pin', () => ({ adminResetLoginPin: async () => ({ ok: true, pin: '731905' }) }));

const CreateUserClient = require('@/app/admin/users/create/CreateUserClient').default;
const ResetLoginPinButton = require('@/app/admin/_components/ResetLoginPinButton').default;

function mockFetch(body: unknown) {
  (global as any).fetch = jest.fn(async () => ({ json: async () => body }));
}

async function fillSpecialist() {
  fireEvent.click(screen.getByText('مختصّ / مزوّد خدمة'));
  fireEvent.change(document.getElementById('specialistType')!, { target: { value: 'nurse' } });
  fireEvent.change(document.getElementById('fullName')!, { target: { value: 'علي حسين' } });
  fireEvent.change(document.getElementById('phone')!, { target: { value: '07701234567' } });
  await act(async () => { fireEvent.submit(document.querySelector('form')!); });
}

describe('إنشاءُ الحساب', () => {
  it('🚨 خطأُ الخادم يبقى في النموذج بحقوله، ومعه رابطُ الحساب القائم', async () => {
    mockFetch({ success: false, error: 'هذا الرقم مسجّلٌ سابقاً (مريض)', existing_user_id: 'old', existing_role: 'patient' });
    render(<CreateUserClient callerRole="admin" />);
    await fillSpecialist();
    expect(screen.getByRole('alert').textContent).toMatch(/مسجّلٌ سابقاً/);
    expect((document.getElementById('fullName') as HTMLInputElement).value).toBe('علي حسين');
    expect(screen.getByText('فتح الحساب القائم ←').getAttribute('href')).toBe('/admin/patients/old');
  });

  it('تحقّقٌ محلّيّ: رقمٌ ناقص لا يُرسَل', async () => {
    mockFetch({ success: true });
    render(<CreateUserClient callerRole="admin" />);
    fireEvent.click(screen.getByText('مختصّ / مزوّد خدمة'));
    fireEvent.change(document.getElementById('phone')!, { target: { value: '0770' } });
    await act(async () => { fireEvent.submit(document.querySelector('form')!); });
    expect((global as any).fetch).not.toHaveBeenCalled();
    expect(screen.getByText(/11 خانة/)).toBeTruthy();
  });

  it('🚨 النجاح: رابطُ التفعيل عبر واتساب إلى رقم المختصّ، والرمزُ احتياطاً', async () => {
    mockFetch({
      success: true, user_id: 'n1', phone: '+9647701234567', full_name: 'علي حسين', role: 'specialist',
      login_method: 'phone_pin', temp_pin: '482913', login_url: 'https://s/login/phone',
      activation_url: 'https://s/login/reset-pin?phone=07701234567',
    });
    render(<CreateUserClient callerRole="admin" />);
    await fillSpecialist();
    const act1 = screen.getByTestId('wa-activation').getAttribute('href')!;
    expect(act1).toMatch(/^https:\/\/wa\.me\/9647701234567\?text=/);
    expect(decodeURIComponent(act1)).toContain('https://s/login/reset-pin?phone=07701234567');
    expect(decodeURIComponent(act1)).not.toContain('482913');
    expect(decodeURIComponent(screen.getByTestId('wa-credentials').getAttribute('href')!)).toContain('482913');
    expect(screen.getByText('فتح الحساب').getAttribute('href')).toBe('/admin/specialists/n1');
  });

  it('بلا تحقّقٍ عكسيّ: زرُّ بيانات الدخول وحده', async () => {
    mockFetch({ success: true, user_id: 'n1', phone: '+9647701234567', full_name: 'علي', role: 'specialist', login_method: 'phone_pin', temp_pin: '482913', login_url: 'u' });
    render(<CreateUserClient callerRole="admin" />);
    await fillSpecialist();
    expect(screen.queryByTestId('wa-activation')).toBeNull();
    expect(screen.getByTestId('wa-credentials').textContent).toMatch(/إرسال بيانات الدخول/);
  });

  it('المديرُ (لا العامّ) ينشئ مديراً ومشرفاً ودعماً — لا مديراً عامّاً', () => {
    render(<CreateUserClient callerRole="admin" />);
    fireEvent.click(screen.getByText('فريق الإدارة'));
    const opts = Array.from((document.getElementById('staffRole') as HTMLSelectElement).options).map((o) => o.value);
    expect(opts).toEqual(['admin', 'manager', 'support']);
  });
});

describe('صفحتا المريض والمختصّ', () => {
  it('🚨 رابطُ الاستعادة يظهر حين يعمل التحقّق، ويُرسَل إلى رقم الحساب', () => {
    render(<ResetLoginPinButton userId="u" phone="+9647701234567" name="زينب" role="patient" activationUrl="https://s/login/reset-pin?phone=07701234567" />);
    const href = screen.getByTestId('wa-reset-link').getAttribute('href')!;
    expect(href).toMatch(/^https:\/\/wa\.me\/9647701234567/);
    expect(decodeURIComponent(href)).toContain('/login/reset-pin?phone=07701234567');
  });

  it('معطّل ← لا رابط؛ والرمزُ المؤقّت يُرسَل عبر واتساب بعد إنشائه', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ResetLoginPinButton userId="u" phone="+9647701234567" name="زينب" role="patient" activationUrl={null} loginUrl="https://s/login/phone" />);
    expect(screen.queryByTestId('wa-reset-link')).toBeNull();
    await act(async () => { fireEvent.click(screen.getByText('إنشاء رمز دخولٍ مؤقّت')); });
    expect(decodeURIComponent(screen.getByTestId('wa-send-pin').getAttribute('href')!)).toContain('731905');
  });
});
