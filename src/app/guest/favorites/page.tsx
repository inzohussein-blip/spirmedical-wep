import GuestFavoritesClient from './GuestFavoritesClient';

export const metadata = {
  title: 'المفضّلة · Spir Medical',
  description: 'سجّل لحفظ مفضّلاتك',
};

export default function Page() {
  return <GuestFavoritesClient />;
}
