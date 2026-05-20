import GuestOrdersClient from './GuestOrdersClient';

export const metadata = {
  title: 'طلباتي · Spir Medical',
  description: 'سجّل لإنشاء طلبات',
};

export default function Page() {
  return <GuestOrdersClient />;
}
