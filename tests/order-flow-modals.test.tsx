import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';

/**
 * 📝 حارس نافذة رفع الطلب والنوافذ المنبثقة — قِيس بعرض 360×640:
 *
 * ① صفحةُ الطلب: شريطُ التنقّل السفليّ (71px) فوق شريط الإرسال الثابت —
 *    يتراكبان في سحب الدم، ويحجب شريطُ «التالي» في التمريض الشريطَ كلَّه.
 * ② شريطُ سحب الدم الثابت حمل التفصيلَ والثقةَ ورقائقَ الحقول الناقصة:
 *    98px يصير ~٢٥٠px عند الخطأ — ثلثُ الشاشة يحجب النموذجَ المطلوبَ إكمالُه.
 * ③ المعالج العامّ: `.service-card` عامّةٌ في shared.css تقلب البطاقةَ عموداً
 *    (٤ شاشات لعشر خدمات)؛ و«سحب دم»/«تمريض» منه تتخطّى تدفّقيهما.
 * ④ النوافذ: بلا role="dialog"، بلا Escape، والصفحةُ تتمرّر خلفها، و✕ بحجم
 *    22px بلا اسم.
 */

let mockPath = '/appointments/new';
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPath,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, ...rest }: any) => <a href={typeof href === 'string' ? href : ''} {...rest}>{children}</a>;
});

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('① صفحة الطلب مهمّةٌ مُركَّزة: لا شريط تنقّلٍ فوق شريط الإرسال', () => {
  const { AppShell } = require('@/components/layout/AppShell');
  const nav = () => document.querySelector('nav.app-bottom-nav');

  it.each(['/appointments/new', '/appointments/new/extra'])('🚨 %s: الشريط السفليّ غير معروض', (p) => {
    mockPath = p;
    render(<AppShell userName="حسن">محتوى</AppShell>);
    expect(nav()).toBeNull();
  });

  it.each(['/dashboard', '/appointments', '/appointments/a1', '/appointments/newer'])('%s: الشريط باقٍ', (p) => {
    mockPath = p;
    render(<AppShell userName="حسن">محتوى</AppShell>);
    expect(nav()).not.toBeNull();
  });

  it('الأشرطةُ الثابتة تستقرّ على الحافّة بمنطقة الأمان لا فوق شريطٍ غائب', () => {
    const bd = read('src/components/appointments/BloodDrawFlow.tsx');
    const footer = bd.slice(bd.indexOf('.bd-sticky-footer {'), bd.indexOf('}', bd.indexOf('.bd-sticky-footer {')));
    expect(footer).toMatch(/bottom:\s*0;/);
    expect(footer).toMatch(/safe-area-inset-bottom/);
    const nursing = read('src/components/appointments/NursingFlow.tsx');
    expect(nursing).toMatch(/padding: '10px 16px calc\(10px \+ env\(safe-area-inset-bottom\)\)'/);
  });
});

describe('② شريطُ سحب الدم سطرٌ واحد', () => {
  const bd = read('src/components/appointments/BloodDrawFlow.tsx');
  const start = bd.indexOf('<div className="bd-sticky-footer">');
  const end = bd.indexOf('<style jsx>');
  const footer = bd.slice(start, end);

  it('التفصيلُ وسطرُ الثقة خارج الشريط الثابت', () => {
    expect(start).toBeGreaterThan(0);
    expect(footer).not.toMatch(/bd-price-card|bd-trust-row|bd-missing-chip/);
    expect(bd.slice(0, start)).toMatch(/className="bd-price-card"/);
    expect(bd.slice(0, start)).toMatch(/className="bd-trust-row"/);
  });

  it('الحقولُ الناقصة في الشريط بصيغتها المدمجة', () => {
    expect(footer).toMatch(/<MissingFieldsSummary\s+compact/);
  });
});

describe('② ملخّص الحقول الناقصة المدمج', () => {
  const mod = require('@/components/forms/MissingFieldsSummary');
  const MissingFieldsSummary = mod.default;

  it('زرٌّ واحد ينقل إلى أوّل حقلٍ ناقص', () => {
    const onJump = jest.fn();
    render(
      <MissingFieldsSummary
        compact
        fields={['address', 'phone', 'date']}
        labels={{ address: 'العنوان', phone: 'الهاتف', date: 'التاريخ' }}
        errors={{}}
        onJump={onJump}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('أكمل 3 حقول: العنوان، الهاتف، التاريخ');
    fireEvent.click(buttons[0]);
    expect(onJump).toHaveBeenCalledWith('address');
  });

  it('العددُ بصيغته العربية', () => {
    expect(mod.missingCountAr(1)).toBe('حقلاً واحداً');
    expect(mod.missingCountAr(2)).toBe('حقلين');
    expect(mod.missingCountAr(5)).toBe('5 حقول');
    expect(mod.missingCountAr(11)).toBe('11 حقلاً');
  });
});

describe('③ المعالج العامّ', () => {
  it('🚨 لا صنفَ في أنماط المعالج يُعرَّف أيضاً في الأنماط العامّة', () => {
    const wiz = read('src/components/appointments/AppointmentWizard.tsx');
    const style = wiz.slice(wiz.indexOf('<style jsx>'));
    const classes = new Set(
      [...style.matchAll(/^\s*\.([a-zA-Z][\w-]*)/gm)].map((m) => m[1]),
    );
    const globalsDir = join(process.cwd(), 'src/app/styles');
    const globals = readdirSync(globalsDir)
      .filter((f) => f.endsWith('.css'))
      .map((f) => read(`src/app/styles/${f}`))
      .join('\n');
    const leaking = [...classes].filter((c) =>
      new RegExp(`(^|[\\s,}])\\.${c}(?![\\w-])`, 'm').test(globals),
    );
    expect(leaking).toEqual([]);
  });

  it('🚨 «سحب دم» و«تمريض» تنقلان إلى تدفّقيهما المخصّصين', () => {
    const AppointmentWizard = require('@/components/appointments/AppointmentWizard').default;
    mockPush.mockClear();
    render(<AppointmentWizard onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByText('سحب دم + تحاليل').closest('button')!);
    expect(mockPush).toHaveBeenCalledWith('/appointments/new?service=blood-draw');
    // لم يُختر كخدمةٍ عامّة
    expect(screen.getByText('سحب دم + تحاليل').closest('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('خدمةٌ عامّة تُختار ولا تُنقل', () => {
    const AppointmentWizard = require('@/components/appointments/AppointmentWizard').default;
    mockPush.mockClear();
    render(<AppointmentWizard onSubmit={jest.fn()} />);
    const card = screen.getByText('استشارة هاتفية').closest('button')!;
    fireEvent.click(card);
    expect(mockPush).not.toHaveBeenCalled();
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('④ سلوك النوافذ المنبثقة (useModalDialog)', () => {
  const { default: ModalShell, ModalCloseButton } = require('@/components/ui/ModalShell');

  function Harness({ onClose = () => {} }: { onClose?: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>افتح</button>
        {open && (
          <ModalShell
            labelledBy="t"
            onClose={() => {
              onClose();
              setOpen(false);
            }}
          >
            <h2 id="t">حجز موعد</h2>
            <ModalCloseButton onClick={() => setOpen(false)} />
            <input aria-label="الاسم" />
          </ModalShell>
        )}
      </>
    );
  }

  it('نافذةٌ مُسمّاة، والتركيزُ فيها لا في حقلٍ (فلا تنبثق لوحةُ المفاتيح)', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('افتح'));
    const dialog = screen.getByRole('dialog', { name: 'حجز موعد' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBe(dialog);
    expect(screen.getByRole('button', { name: 'إغلاق' })).toHaveClass('ms-close');
  });

  it('🚨 الصفحةُ خلفها مقفلةٌ ثمّ تُفكّ؛ وEscape يُغلق ويُعيد التركيز', () => {
    const onClose = jest.fn();
    document.body.style.overflow = 'auto';
    render(<Harness onClose={onClose} />);
    const opener = screen.getByText('افتح');
    opener.focus();
    fireEvent.click(opener);
    expect(document.body.style.overflow).toBe('hidden');
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
    expect(document.activeElement).toBe(opener);
  });

  it('🚨 كلُّ نافذةٍ منبثقة للمريض تُعلن نفسها نافذة', () => {
    // نمطُ النافذة اليدويّ: غلافٌ ثابت يوقف انتشار النقر إلى الخلفيّة.
    const roots = ['src/components', 'src/app/(dashboard)', 'src/app/(marketing)', 'src/app/(auth)'];
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(join(process.cwd(), d))) {
        const p = `${d}/${f}`;
        if (statSync(join(process.cwd(), p)).isDirectory()) walk(p);
        else if (p.endsWith('.tsx')) files.push(p);
      }
    };
    roots.forEach(walk);
    const bare = files.filter((f) => {
      const s = read(f);
      return (
        /onClick=\{\(e\) => e\.stopPropagation\(\)\}/.test(s) &&
        /position: ?'?fixed'?/.test(s) &&
        !/role="(alert)?dialog"|<ModalShell\b|<BottomSheet\b/.test(s)
      );
    });
    expect(bare).toEqual([]);
  });
});

describe('لا وعودَ صوتيّة بلا تسجيل', () => {
  it('زرُّ الإرسال في المحادثة لا يعرض ميكروفوناً', () => {
    const chat = read('src/components/chat/ChatWindow.tsx');
    const btn = chat.slice(chat.indexOf('className="chat-send-btn"'), chat.indexOf('</button>', chat.indexOf('className="chat-send-btn"')));
    expect(btn).not.toMatch(/<Mic\b/);
  });

  it('بحثُ الرئيسية بلا زرّ صوتيّ', () => {
    expect(read('src/components/dashboard-v3/SearchBarV3.tsx')).not.toMatch(/<(Mic|IconMicrophone)\b|aria-label="بحث صوتي"/);
  });
});
