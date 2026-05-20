import GuestClient from './GuestClient';

export const metadata = {
  title: 'تصفّح كزائر · Spir Medical',
  description: 'استكشف الخدمات بدون تسجيل',
};

export default function Page() {
  return <GuestClient />;
}
