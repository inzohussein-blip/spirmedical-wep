import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OrderTrackClient from './OrderTrackClient';

export const metadata = {
  title: 'تتبّع الموعد · سباير ميديكال',
  description: 'تتبّع موعدك مباشرة',
};

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('id, status, estimated_price, created_at, scheduled_at')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !appointment) notFound();

  return (
    <OrderTrackClient
      id={appointment.id}
      initialStatus={appointment.status}
      estimatedPrice={appointment.estimated_price}
      createdAt={appointment.created_at}
    />
  );
}
