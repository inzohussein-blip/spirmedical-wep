import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewAppointmentClient from './NewAppointmentClient';

export const metadata = {
  title: 'حجز موعد جديد · سباير ميديكال',
  description: 'احجز موعداً طبياً (سحب دم، تحاليل، استشارة) بسهولة في أي محافظة عراقية',
};

export const dynamic = 'force-dynamic';

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: { service?: string; clinic?: string; type?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // جلب رقم الهاتف من حساب المستخدم
  const { data: profile } = await supabase
    .from('users')
    .select('phone, full_name')
    .eq('id', user.id)
    .single();

  return (
    <NewAppointmentClient
      service={searchParams.service || ''}
      userPhone={profile?.phone || ''}
      userAddress=""
      clinicId={searchParams.clinic}
      consultationType={searchParams.type}
    />
  );
}
