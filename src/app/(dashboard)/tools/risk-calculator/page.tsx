import RiskCalculatorClient from './RiskCalculatorClient';

export const metadata = {
  title: 'حاسبة المخاطر · سباير ميديكال',
  description: 'قيّم حالتك الصحية',
};

export default function Page() {
  return <RiskCalculatorClient />;
}
