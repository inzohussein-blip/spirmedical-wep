import { NextResponse } from 'next/server';
import { getVerificationState } from '@/lib/whatsapp/inbound-verify';

/**
 * GET /api/whatsapp/verify/<id> — حالةُ الرمز لصفحة الانتظار (تسأل كلَّ ثانيتين).
 * المعرّفُ uuid عشوائيّ يعرفه صاحبُ الطلب وحده، والجوابُ حالةٌ لا رقم.
 */
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  if (!UUID.test(id)) return NextResponse.json({ state: 'expired' }, { status: 400 });
  const state = await getVerificationState(id);
  return NextResponse.json({ state }, { headers: { 'Cache-Control': 'no-store' } });
}
