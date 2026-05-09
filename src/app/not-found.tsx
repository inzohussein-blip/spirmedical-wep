import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <p className="mb-2 font-serif-italic text-7xl font-medium text-emerald">
          404
        </p>
        <h2 className="mb-3 text-2xl font-extrabold">الصفحة غير موجودة</h2>
        <p className="mb-6 text-ink-3">
          الرابط الذي تبحث عنه غير صحيح أو تم نقله.
        </p>
        <Link href="/">
          <Button>العودة للرئيسية</Button>
        </Link>
      </div>
    </main>
  );
}
