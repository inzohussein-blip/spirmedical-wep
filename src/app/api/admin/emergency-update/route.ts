import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * POST /api/admin/emergency-update
 * تحديث حالة طوارئ من قِبل Admin
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, status, resolution_notes } = body;

  if (!id || !['open', 'responding', 'resolved', 'false_alarm'].includes(status)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };
  if (status === 'resolved' || status === 'false_alarm') {
    updates.resolved_at = new Date().toISOString();
  }
  if (resolution_notes) {
    updates.resolution_notes = resolution_notes;
  }

  const { error } = await supabase
    .from('nurse_emergency_logs')
    .update(updates)
    .eq('id', id);

  if (error) {
    logger.error('Failed to update emergency', { id, error: error.message });
    return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
  }

  logger.info('Emergency status updated', { id, status, by: user.id });

  return NextResponse.json({ success: true });
}
