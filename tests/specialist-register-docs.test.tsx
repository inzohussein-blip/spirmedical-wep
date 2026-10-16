/**
 * 🩺 تسجيلُ المختصّ: الهويّةُ وحدها مطلوبة، والوثائقُ تُرفع فعلاً، وشاشةُ تحميل، وأخطاءُ الخادم تُعرض.
 *
 * قبل هذا: النموذجُ طلب ثلاثَ وثائق ثمّ أهملها كلَّها (لا رفعَ في الكود)، ولم يقرأ `?error=`
 * الذي يعيد به الإجراءُ أخطاءه — فيضغط المختصُّ «إنشاء» ولا يرى شيئاً.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen, fireEvent, act } from '@testing-library/react';

const uploads: { bucket: string; path: string; type: string }[] = [];
const upserts: Record<string, unknown>[] = [];
let uploadError: { message: string } | null = null;

jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => {
          if (uploadError) return { error: uploadError };
          uploads.push({ bucket, path, type: file.type });
          return { error: null };
        },
        createSignedUrl: async (path: string) => ({ data: { signedUrl: `https://signed/${path}` } }),
      }),
    },
    from: () => {
      const q: any = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({ data: { documents: { certificate: { path: 'old/cert.pdf', type: 'application/pdf', size: 1, uploaded_at: 'x' } } } }),
        upsert: async (row: Record<string, unknown>) => { upserts.push(row); return { error: null }; },
      };
      return q;
    },
  }),
}));
jest.mock('@/lib/logger', () => ({ logger: { error: () => {}, warn: () => {}, info: () => {} } }));

const docs = require('@/lib/specialist-documents');

const file = (name: string, type: string, size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

beforeEach(() => {
  uploads.length = 0;
  upserts.length = 0;
  uploadError = null;
});

describe('① الهويّة وحدها مطلوبة', () => {
  it('🚨 بلا هويّة ← خطأ قبل إنشاء الحساب', () => {
    const fd = new FormData();
    fd.set('certificateDocument', file('c.pdf', 'application/pdf'));
    expect(docs.readSpecialistDocs(fd)).toEqual({ error: 'إثبات الشخصية مطلوب' });
  });

  it('🚨 الهويّة وحدها تكفي (الشهادة والصورة اختياريّتان)', () => {
    const fd = new FormData();
    fd.set('idDocument', file('id.jpg', 'image/jpeg'));
    fd.set('profilePhoto', new File([], '')); // حقلٌ لم يُختر يصل فارغاً
    const r = docs.readSpecialistDocs(fd);
    expect('files' in r && Object.keys(r.files)).toEqual(['id']);
  });

  it('نوعٌ لا تقبله الحاوية، أو ملفٌّ فوق 1.2MB ← خطأ', () => {
    const a = new FormData();
    a.set('idDocument', file('id.webp', 'image/webp'));
    expect(docs.readSpecialistDocs(a).error).toMatch(/صورة أو PDF/);
    const b = new FormData();
    b.set('idDocument', file('id.jpg', 'image/jpeg', 2 * 1024 * 1024));
    expect(docs.readSpecialistDocs(b).error).toMatch(/كبير/);
  });

  it('السقفُ واحد بين المتصفّح والخادم، ودون حدّ Vercel', () => {
    const { UPLOAD_MAX_BYTES } = require('@/lib/forms/prepare-upload');
    expect(docs.SPECIALIST_DOC_MAX_BYTES).toBe(UPLOAD_MAX_BYTES);
    expect(3 * UPLOAD_MAX_BYTES).toBeLessThan(4.5 * 1024 * 1024);
    expect(read('next.config.js')).toMatch(/bodySizeLimit: '4\.5mb'/);
  });
});

describe('② الوثائق تُرفع فعلاً إلى حاويةٍ خاصّة', () => {
  it('🚨 تُرفع بمسار <user_id>/ وتُسجَّل في طلب الانضمام مع ما سبق', async () => {
    const kinds = await docs.storeSpecialistDocs('u-1', { id: file('id.jpg', 'image/jpeg') }, new Date(1000));
    expect(kinds).toEqual(['id']);
    expect(uploads).toEqual([{ bucket: 'nurse-credentials', path: 'u-1/id-1000.jpg', type: 'image/jpeg' }]);
    const row = upserts[0] as { user_id: string; documents: Record<string, { path: string }> };
    expect(row.user_id).toBe('u-1');
    expect(row.documents.id.path).toBe('u-1/id-1000.jpg');
    expect(row.documents.certificate.path).toBe('old/cert.pdf'); // دمجٌ لا استبدال
  });

  it('فشلُ الرفع لا يرمي (الحساب أُنشئ) ولا يُسجَّل', async () => {
    uploadError = { message: 'boom' };
    await expect(docs.storeSpecialistDocs('u-1', { id: file('id.jpg', 'image/jpeg') })).resolves.toEqual([]);
    expect(upserts).toHaveLength(0);
  });

  it('🚨 الإجراء يقرأ الوثائق قبل الإنشاء ويرفعها قبل التوجيه', () => {
    const src = read('src/app/(auth)/register/actions.ts');
    const body = src.slice(src.indexOf('export async function registerSpecialist'));
    const readAt = body.indexOf('readSpecialistDocs(formData)');
    const createAt = body.indexOf('createOrGetAccount(');
    const storeAt = body.indexOf('storeSpecialistDocs(userId');
    const routeAt = body.indexOf('routeAfterRegister(');
    expect(readAt).toBeGreaterThan(-1);
    expect(readAt).toBeLessThan(createAt);
    expect(storeAt).toBeGreaterThan(createAt);
    expect(storeAt).toBeLessThan(routeAt);
  });

  it('الإدارة ترى الوثائق بروابط موقّعة، وتُنبَّه إن غابت الهويّة', () => {
    const src = read('src/app/admin/specialists/[id]/page.tsx');
    expect(src).toMatch(/signedSpecialistDocs\(specialist\.id\)/);
    expect(src).toMatch(/لم تُرفع/);
  });
});

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('③ النموذج: ترتيب، اختياريّ، شاشةُ تحميل، وخطأُ الخادم', () => {
  let resolveSubmit: () => void = () => {};
  const registerSpecialist = jest.fn(() => new Promise<void>((r) => { resolveSubmit = r; }));
  jest.doMock('@/app/(auth)/register/actions', () => ({ registerSpecialistForm: (fd: FormData) => registerSpecialist(fd) }));
  jest.doMock('@/lib/auth/otp-mode', () => ({ readOtpMode: () => 'disabled' }));
  jest.doMock('next/link', () => {
    const MockLink = ({ children, href, ...rest }: any) => <a href={href} {...rest}>{children}</a>;
    MockLink.displayName = 'MockLink';
    return MockLink;
  });
  const Client = require('@/app/(auth)/register/specialist/SpecialistRegisterClient').default;

  beforeEach(() => {
    registerSpecialist.mockClear();
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('أربعةُ أقسامٍ مرقّمة بالترتيب', () => {
    render(<Client />);
    const legends = Array.from(document.querySelectorAll('legend')).map((l) => l.textContent);
    expect(legends).toEqual(['1بياناتك', '2بيانات الدخول', '3اختصاصك', '4إثبات الشخصية']);
  });

  it('🚨 الهويّة وحدها مُعلَّمة مطلوبة، والبقيّة «اختياري»', () => {
    render(<Client />);
    const label = (id: string) => document.querySelector(`label[for="${id}"].auth-field-label`)!;
    expect(label('idDocument').querySelector('.auth-required')).not.toBeNull();
    expect(label('certificateDocument').querySelector('.auth-required')).toBeNull();
    expect(label('profilePhoto').querySelector('.auth-required')).toBeNull();
    expect(screen.getByText('اختياري').closest('details')).not.toBeNull();
  });

  it('🚨 خطأُ الخادم من الرابط يُعرض', () => {
    render(<Client initialError="هذا الرقم مسجّل مسبقاً" />);
    expect(screen.getByRole('alert').textContent).toMatch(/مسجّل مسبقاً/);
  });

  it('بلا هويّة ← خطأٌ عند الحقل ولا إرسال', async () => {
    render(<Client />);
    await act(async () => { fireEvent.submit(document.querySelector('form')!); });
    expect(screen.getByText('إثبات الشخصية مطلوب')).toBeTruthy();
    expect(registerSpecialist).not.toHaveBeenCalled();
  });

  it('🚨 إرسالٌ صحيح بالهويّة وحدها ← شاشةُ تحميل والهويّة في الطلب', async () => {
    render(<Client />);
    fireEvent.change(document.getElementById('fullName')!, { target: { value: 'أحمد محمد' } });
    fireEvent.click(screen.getByLabelText('ذكر'));
    fireEvent.change(document.getElementById('phone')!, { target: { value: '07712345678' } });
    fireEvent.change(document.getElementById('password')!, { target: { value: '582913' } });
    fireEvent.change(document.getElementById('specialization')!, { target: { value: 'nurse' } });
    fireEvent.change(document.getElementById('idDocument')!, { target: { files: [file('id.pdf', 'application/pdf')] } });
    fireEvent.click(document.querySelector('input[type="checkbox"]')!);

    await act(async () => { fireEvent.submit(document.querySelector('form')!); });

    expect(registerSpecialist).toHaveBeenCalledTimes(1);
    const fd = registerSpecialist.mock.calls[0][0] as unknown as FormData;
    expect((fd.get('idDocument') as File).name).toBe('id.pdf');
    expect(fd.get('certificateDocument')).toBeNull();
    expect(screen.getByRole('status').textContent).toMatch(/ننشئ حسابك/);
    expect((document.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);

    await act(async () => { resolveSubmit(); });
  });
});

