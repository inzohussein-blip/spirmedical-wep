import VaccinationsClient from './VaccinationsClient';

export const metadata = {
  title: 'جدول التطعيمات · سباير ميديكال',
  description: '١٨ لقاح حسب العمر',
};

export default function Page() {
  return <VaccinationsClient />;
}
