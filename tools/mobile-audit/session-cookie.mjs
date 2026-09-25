// يُنتج كعكة الجلسة كما تكتبها @supabase/ssr 0.5.x: base64- + base64url(JSON)
const UID = '11111111-1111-4111-8111-111111111111';
const session = {
  access_token: 'mock-access', token_type: 'bearer', expires_in: 360000,
  expires_at: Math.floor(Date.now() / 1000) + 360000, refresh_token: 'mock-refresh',
  user: { id: UID, aud: 'authenticated', role: 'authenticated', email: 'patient@example.test', app_metadata: { role: process.env.MOCK_ROLE || 'patient' }, user_metadata: { role: process.env.MOCK_ROLE || 'patient' } },
};
const b64url = Buffer.from(JSON.stringify(session)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
process.stdout.write('base64-' + b64url);
