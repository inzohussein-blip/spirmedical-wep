import OrderTrackClient from './OrderTrackClient';

export const metadata = {
  title: 'تتبّع الموعد · سباير ميديكال',
  description: 'تتبّع موعدك مباشرة',
};

export default function Page() {
  return <OrderTrackClient />;
}
