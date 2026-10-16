import SpecialistRegisterClient from './SpecialistRegisterClient';

export const metadata = {
  title: 'تسجيل اختصاصي · سباير ميديكال',
  description: 'انضم كاختصاصي طبي في Spir Medical',
};

// الإجراءُ يعيد أخطاءه في `?error=` — كانت الصفحة لا تقرؤه فلا يرى المختصُّ سببَ الرفض.
export default async function SpecialistRegisterPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;
  return <SpecialistRegisterClient initialError={error} />;
}
