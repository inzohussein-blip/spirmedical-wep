// ⚡ V27 Performance: ISR caching (86400s)
export const revalidate = 86400;

import FAQClient from './FAQClient';

export const metadata = {
  alternates: { canonical: '/faq' },
  title: 'الأسئلة الشائعة · سباير ميديكال',
  description: '20+ سؤال وجواب عن خدمات سباير ميديكال - الحجز، الدفع، الاستشارات، والمزيد',
};

export default function FAQPage() {
  return <FAQClient />;
}
