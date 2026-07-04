import { createClient } from '@/lib/supabase/server';
import { approveAdminRequest, rejectAdminRequest } from '@/app/admin-register/actions';

export const metadata = { title: 'طلبات الإدارة · Spir Medical' };

interface AdminRequest {
  id: string;
  full_name: string;
  email: string;
  requested_role: string;
  reason: string | null;
  status: string;
  created_at: string;
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: { approved?: string; rejected?: string; error?: string };
}) {
  const supabase = createClient();
  const sb = supabase as unknown as { from: (t: string) => any };

  const { data: requests } = await sb
    .from('admin_requests')
    .select('id, full_name, email, requested_role, reason, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const list = (requests ?? []) as AdminRequest[];

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto', direction: 'rtl' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>طلبات صلاحية الإدارة</h1>
      <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 24 }}>
        الطلبات المعلّقة بانتظار موافقتك
      </p>

      {searchParams.approved && (
        <Banner type="success">✅ تمّت الموافقة وترقية الحساب</Banner>
      )}
      {searchParams.rejected && <Banner type="info">تمّ رفض الطلب</Banner>}
      {searchParams.error && <Banner type="error">{searchParams.error}</Banner>}

      {list.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--ink-3)',
            background: 'var(--paper-2, #faf8f1)',
            borderRadius: 16,
          }}
        >
          لا توجد طلبات معلّقة حالياً
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {list.map((req) => (
            <div
              key={req.id}
              style={{
                background: '#fff',
                borderRadius: 14,
                padding: 20,
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{req.full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', direction: 'ltr', textAlign: 'right' }}>
                    {req.email}
                  </div>
                  {req.reason && (
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
                      السبب: {req.reason}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                    {new Date(req.created_at).toLocaleString('ar-IQ')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <form action={approveAdminRequest} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="hidden" name="requestId" value={req.id} />
                    <select
                      name="role"
                      defaultValue="support"
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(0,0,0,0.12)',
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="support">دعم</option>
                      <option value="manager">مدير</option>
                      <option value="admin">أدمن</option>
                    </select>
                    <button
                      type="submit"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#0E7A66',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      موافقة
                    </button>
                  </form>

                  <form action={rejectAdminRequest}>
                    <input type="hidden" name="requestId" value={req.id} />
                    <button
                      type="submit"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1px solid #A82E3D',
                        background: 'transparent',
                        color: '#A82E3D',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      رفض
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Banner({ type, children }: { type: 'success' | 'info' | 'error'; children: React.ReactNode }) {
  const colors = {
    success: { bg: 'rgba(14,122,102,0.12)', border: '#0E7A66', text: '#0A5446' },
    info: { bg: 'rgba(120,120,120,0.1)', border: '#888', text: '#555' },
    error: { bg: 'rgba(168,46,61,0.12)', border: '#A82E3D', text: '#A82E3D' },
  }[type];
  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 14,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}
