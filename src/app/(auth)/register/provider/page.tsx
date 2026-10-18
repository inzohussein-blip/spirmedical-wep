import ProviderRegisterClient from './ProviderRegisterClient';

export const metadata = {
  title: 'تسجيل خدمة · سباير ميديكال',
  description: 'سجّل مختبرك أو صيدليتك أو عيادتك أو مستشفاك في سباير ميديكال',
};

export default async function ProviderRegisterPage(props: { searchParams: Promise<{ error?: string; type?: string }> }) {
  const { error, type } = await props.searchParams;
  return <ProviderRegisterClient initialError={error} initialType={type} />;
}
