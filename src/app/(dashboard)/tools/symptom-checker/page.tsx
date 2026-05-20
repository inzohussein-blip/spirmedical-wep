import SymptomCheckerClient from './SymptomCheckerClient';

export const metadata = {
  title: 'مدقّق الأعراض · سباير ميديكال',
  description: 'حدّد توجّهك الطبي',
};

export default function Page() {
  return <SymptomCheckerClient />;
}
