import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';

/**
 * 👩‍⚕️ طريقُ المختصّ إلى المنصّة — وما يراه المشرفُ حين يكون مسدوداً
 *
 * قِيس في 25 أيلول: صفرُ مختصّين. وتتبُّعُ المسارين كشف أنّ كليهما مكسور:
 *
 * ① **الإدارةُ تُنشئ المختصّ** ببريدٍ `@spir.app`، ودخولُ الهاتف كلُّه يبحث عن
 *    `@phone.spirmedical.local`. فبعد الرمز يفشل الدخول، ويُنشأ حسابٌ ثانٍ
 *    يتيمٌ بلا ملفّ (إدراجُه يصطدم بالرقم ويُبلَع صامتاً).
 * ② **وبطاقةُ الإدارة تقول «الرقم + كلمة سرّ مؤقّتة»**، وحقلُ الدخول `type="email"`
 *    يرفض الرقم في المتصفّح أصلاً، والبريدُ الاصطناعيّ لا يُعرض لأحد.
 * ③ **لا أحدَ يرى الصفر**: اللوحةُ تعرض «اختصاصيون نشطون: ٠» بين بطاقاتٍ أخرى.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('① بريدٌ اصطناعيّ واحد', () => {
  it('🚨 إنشاءُ الإدارة يستعمل phoneToEmail المشترك', () => {
    const route = read('src/app/api/admin/users/create/route.ts');
    expect(route).toMatch(/import \{ phoneToEmail \} from '@\/lib\/auth\/phone-credentials'/);
    expect(route).not.toMatch(/function phoneToEmail/);
    const code = route.split('\n').filter((l) => !/^\s*(\/\/|\*)/.test(l)).join('\n');
    expect(code).not.toContain('@spir.app');
  });

  it('🚨 بعد الرمز: ملفٌّ قائمٌ بالرقم يُدخَل ولا يُنشأ حسابٌ ثانٍ', () => {
    const src = read('src/app/(auth)/login/actions.ts');
    const verify = src.slice(src.indexOf('let userId: string | undefined = signInData?.user?.id;'));
    const lookup = verify.search(/\.from\('users'\)\s*\.select\('id'\)\s*\.eq\('phone', phone\)/);
    const create = verify.indexOf('admin.auth.admin.createUser(');
    expect(lookup).toBeGreaterThan(-1);
    expect(create).toBeGreaterThan(lookup);
    expect(verify.slice(lookup, create)).toMatch(/updateUserById\(existingByPhone\.id, \{ password \}\)/);
    expect(verify.slice(lookup, create + 40)).toMatch(/if \(!userId\) \{/);
  });
});

describe('② الدخولُ بالرقم وكلمة السرّ', () => {
  const { loginIdentifierToEmail } = require('@/lib/auth/login-identifier');
  const { phoneToEmail } = require('@/lib/auth/phone-credentials');

  it.each([
    ['07701234567', '+9647701234567'],
    ['0770 123 4567', '+9647701234567'],
    ['+964 770 123 4567', '+9647701234567'],
    ['7701234567', '+9647701234567'],
  ])('🚨 %s → بريدُ الهاتف', (input, e164) => {
    expect(loginIdentifierToEmail(input)).toBe(phoneToEmail(e164));
  });

  it('البريدُ يمرّ كما هو، والنصُّ غير الرقميّ لا يُحوَّل', () => {
    expect(loginIdentifierToEmail(' a@b.com ')).toBe('a@b.com');
    expect(loginIdentifierToEmail('12345')).toBe('12345');
  });

  it('🚨 signInWithEmail يمرّر المُدخَل عبر المحوِّل', () => {
    expect(read('src/lib/auth/email-auth.ts')).toMatch(/email: loginIdentifierToEmail\(email\)/);
  });

  it('🚨 حقلُ الدخول لا يرفض الرقم في المتصفّح', () => {
    const page = read('src/app/(auth)/login/page.tsx');
    const input = page.slice(page.indexOf('id="login-email"') - 80, page.indexOf('id="login-email"'));
    expect(input).toContain('type="text"');
    expect(page).toContain('البريد الإلكتروني أو رقم الهاتف');
  });
});

describe('③ المشرفُ يرى ما يسدّ الطريق', () => {
  const OpsHealthCards = require('@/app/admin/_components/OpsHealthCards').default;
  jest.mock('next/link', () => {
    // eslint-disable-next-line react/display-name
    return ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>;
  });

  const healthy = {
    coverage: [{ type: 'nurse', label: 'تمريضي/ة', approved: 2, waiting: 0 }],
    queue: { failed24h: 0, retrying: 0, lastError: null, lastErrorChannel: null, lastErrorQueuedAt: null },
  };

  it('🚨 نوعٌ بلا مختصّ → تنبيهٌ بالاسم وعدد المنتظرين ورابطا الحلّ', () => {
    render(<OpsHealthCards health={{ ...healthy, coverage: [{ type: 'lab_analyst', label: 'مُحلِّل مختبر', approved: 0, waiting: 3 }] }} />);
    const alert = screen.getByTestId('ops-no-specialists');
    expect(alert).toHaveTextContent('مُحلِّل مختبر');
    expect(alert).toHaveTextContent('٣ بانتظار الخدمة');
    expect(screen.getByRole('link', { name: 'إنشاء حساب مختصّ' })).toHaveAttribute('href', '/admin/users/create');
  });

  it('🚨 رسائلُ فاشلة → العددُ ونصُّ الخطأ', () => {
    render(<OpsHealthCards health={{ ...healthy, queue: { failed24h: 0, retrying: 3, lastError: 'Authentication Error', lastErrorChannel: 'whatsapp', lastErrorQueuedAt: null } }} />);
    const card = screen.getByTestId('ops-queue-health');
    expect(card).toHaveTextContent('٣ تُعاد محاولتُها');
    expect(card).toHaveTextContent('Authentication Error');
  });

  it('كلُّ شيءٍ سليم → لا شيء', () => {
    const { container } = render(<OpsHealthCards health={healthy} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('🚨 اللوحةُ تعرضها', () => {
    const page = read('src/app/admin/page.tsx');
    expect(page).toMatch(/const opsHealth = await getOpsHealth\(\)/);
    expect(page).toMatch(/<OpsHealthCards health=\{opsHealth\} \/>/);
  });
});

describe('④ getOpsHealth يحسب من القاعدة', () => {
  beforeEach(() => jest.resetModules());

  it('🚨 المعتمَدون غيرُ الموقوفين لكلّ نوع، والمنتظرون غيرُ المُخطَرين', async () => {
    const seen: Record<string, Record<string, unknown>> = {};
    jest.doMock('@/lib/supabase/server', () => ({
      createAdminClient: () => ({
        from(table: string) {
          const f: Record<string, unknown> = {};
          const key = () => `${table}:${f.status ?? ''}:${f.head ? 'head' : ''}`;
          const api: any = {
            select(_c: string, o?: { head?: boolean }) { if (o?.head) f.head = true; return api; },
            eq(c: string, v: unknown) { f[c] = v; return api; },
            or(v: string) { f.or = v; return api; },
            is(c: string, v: unknown) { f[`is:${c}`] = v; return api; },
            gte: () => api, gt: () => api, not: () => api, neq: () => api, order: () => api,
            limit: () => Promise.resolve({ data: [{ error_message: 'Authentication Error', channel: 'whatsapp', created_at: 'x' }], error: null }),
            then(res: (v: unknown) => unknown) {
              seen[key()] = { ...f };
              if (table === 'users') return Promise.resolve(res({ data: [{ specialist_type: 'nurse' }], error: null }));
              if (table === 'service_waitlist') return Promise.resolve(res({ data: [{ specialist_type: 'lab_analyst' }, { specialist_type: 'lab_analyst' }], error: null }));
              return Promise.resolve(res({ count: f.status === 'failed' ? 1 : 3, error: null }));
            },
          };
          return api;
        },
      }),
    }));
    const { getOpsHealth } = await import('@/lib/admin/ops-health');
    const h = await getOpsHealth();

    expect(h.coverage.find((c) => c.type === 'nurse')).toMatchObject({ approved: 1, waiting: 0 });
    expect(h.coverage.find((c) => c.type === 'lab_analyst')).toMatchObject({ approved: 0, waiting: 2 });
    expect(h.queue).toMatchObject({ failed24h: 1, retrying: 3, lastError: 'Authentication Error' });

    expect(seen['users::']).toMatchObject({ role: 'specialist', approval_status: 'approved', or: 'is_suspended.is.null,is_suspended.eq.false' });
    expect(seen['service_waitlist::']).toMatchObject({ 'is:notified_at': null });
  });
});
