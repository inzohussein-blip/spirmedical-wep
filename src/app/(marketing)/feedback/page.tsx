// ⚡ V27 Performance: ISR caching (86400s)
export const revalidate = 86400;

import FeedbackClient from './FeedbackClient';

export const metadata = {
  title: 'شاركنا رأيك · Spir Medical',
  description: 'ساعدنا في تطوير الخدمة - شاركنا اقتراحاتك وملاحظاتك',
};

export default function FeedbackPage() {
  return <FeedbackClient />;
}
