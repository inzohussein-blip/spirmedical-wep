import GuestClient from './GuestClient';
import { getActiveStories } from '@/lib/stories/get-stories';
import { getStripSettings } from '@/lib/stories/get-strip-settings';

export const metadata = {
  title: 'تصفّح كزائر · Spir Medical',
  description: 'استكشف الخدمات بدون تسجيل',
};

export default async function Page() {
  const [stories, look] = await Promise.all([getActiveStories(), getStripSettings()]);
  return <GuestClient stories={look.enabled ? stories : []} look={look} />;
}
