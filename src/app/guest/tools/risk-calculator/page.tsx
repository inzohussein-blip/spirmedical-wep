import GuestRiskCalculatorClient from './GuestRiskCalculatorClient';

export const metadata = {
  title: 'حاسبة المخاطر · Spir Medical',
  description: 'تقييم المخاطر الصحية',
};

export default function Page() {
  return <GuestRiskCalculatorClient />;
}
