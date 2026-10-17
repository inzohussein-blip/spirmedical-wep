import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isUnpricedService } from '@/lib/config/pricing';
import OrderTrackClient from './OrderTrackClient';

export const metadata = {
  title: 'تتبّع الموعد · سباير ميديكال',
  description: 'تتبّع موعدك مباشرة',
};

export const dynamic = 'force-dynamic';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('id, status, estimated_price, created_at, scheduled_at, service_id, service_type, required_specialist_type')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !appointment) notFound();

  return (
    <OrderTrackClient
      id={appointment.id}
      initialStatus={appointment.status}
      estimatedPrice={isUnpricedService(appointment) ? null : appointment.estimated_price}
      createdAt={appointment.created_at}
    />
  );
}
