import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSavedLocations } from './actions';
import SavedLocationsClient from './SavedLocationsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'مواقعي المحفوظة · Spir Medical',
};

export default async function SavedLocationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account/locations');
  }

  const locations = await getSavedLocations();

  return <SavedLocationsClient initialLocations={locations} />;
}
