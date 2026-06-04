import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/family/list
 * إرجاع كل أفراد عائلة المستخدم النشطين
 */
export async function GET() {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ members: [] }, { status: 200 });
    }

    const { data: members } = await supabase
      .from('family_members')
      .select('id, full_name, relation, avatar_emoji, date_of_birth')
      .eq('owner_user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    return NextResponse.json({ members: members || [] });
  } catch {
    return NextResponse.json({ members: [] }, { status: 200 });
  }
}
