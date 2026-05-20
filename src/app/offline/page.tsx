import OfflineClient from './OfflineClient';

export const metadata = {
  title: 'غير متصل · سباير ميديكال',
  description: 'لا يوجد اتصال بالإنترنت - بعض الميزات قد لا تعمل',
};

export default function OfflinePage() {
  return <OfflineClient />;
}
