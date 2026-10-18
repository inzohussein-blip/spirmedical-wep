import GuestClient from './GuestClient';
import { getActiveStories } from '@/lib/stories/get-stories';

export const metadata = {
  title: 'تصفّح كزائر · Spir Medical',
  description: 'استكشف الخدمات بدون تسجيل',
};

export default async function Page() {
  return <GuestClient stories={await getActiveStories()} />;
}
