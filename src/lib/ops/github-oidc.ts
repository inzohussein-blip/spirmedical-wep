import { createPublicKey, verify, type JsonWebKey } from 'crypto';

/**
 * 🔐 التحقّقُ من رمز OIDC الذي تُصدره GitHub Actions لسير عملٍ في مستودعنا.
 *
 * بلا سرٍّ مشترك يُنسَخ إلى Vercel وGitHub: الرمزُ موقَّعٌ من GitHub، ويحمل اسمَ المستودع وملفَّ السير.
 * فلا يقبل `/api/ops/ingest` إلّا ما أرسله `report-failures.yml` من هذا المستودع.
 */
export const OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
export const OIDC_AUDIENCE = 'spir-medical-ops';
export const OPS_REPOSITORY = 'inzohussein-blip/spirmedical-wep';
export const OPS_WORKFLOW = '.github/workflows/report-failures.yml';

export interface OidcClaims {
  iss: string;
  aud: string | string[];
  exp: number;
  nbf?: number;
  repository: string;
  job_workflow_ref?: string;
  workflow_ref?: string;
  event_name?: string;
}

type Jwk = JsonWebKey & { kid?: string };

let jwksCache: { at: number; keys: Jwk[] } | null = null;
const JWKS_TTL_MS = 3_600_000;

async function getJwks(fetcher: typeof fetch): Promise<Jwk[]> {
  if (jwksCache && Date.now() - jwksCache.at < JWKS_TTL_MS) return jwksCache.keys;
  const res = await fetcher(`${OIDC_ISSUER}/.well-known/jwks`);
  if (!res.ok) throw new Error(`jwks ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  jwksCache = { at: Date.now(), keys };
  return keys;
}

const b64url = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

export type OidcResult = { ok: true; claims: OidcClaims } | { ok: false; reason: string };

export async function verifyGithubOidc(
  token: string,
  { now = Date.now(), fetcher = fetch }: { now?: number; fetcher?: typeof fetch } = {},
): Promise<OidcResult> {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  let header: { alg?: string; kid?: string };
  let claims: OidcClaims;
  try {
    header = JSON.parse(b64url(parts[0]).toString('utf8'));
    claims = JSON.parse(b64url(parts[1]).toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (header.alg !== 'RS256' || !header.kid) return { ok: false, reason: 'alg' };

  let keys: Jwk[];
  try {
    keys = await getJwks(fetcher);
  } catch {
    return { ok: false, reason: 'jwks' };
  }
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    // مفتاحٌ دوّرته GitHub بعد آخر جلب
    jwksCache = null;
    try {
      jwk = (await getJwks(fetcher)).find((k) => k.kid === header.kid);
    } catch { /* يُرفض أدناه */ }
  }
  if (!jwk) return { ok: false, reason: 'kid' };

  const signed = verify(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    createPublicKey({ key: jwk, format: 'jwk' }),
    b64url(parts[2]),
  );
  if (!signed) return { ok: false, reason: 'signature' };

  const sec = Math.floor(now / 1000);
  if (claims.iss !== OIDC_ISSUER) return { ok: false, reason: 'iss' };
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(OIDC_AUDIENCE)) return { ok: false, reason: 'aud' };
  if (typeof claims.exp !== 'number' || claims.exp < sec - 30) return { ok: false, reason: 'expired' };
  if (typeof claims.nbf === 'number' && claims.nbf > sec + 60) return { ok: false, reason: 'nbf' };
  if (claims.repository !== OPS_REPOSITORY) return { ok: false, reason: 'repository' };
  const ref = claims.job_workflow_ref ?? claims.workflow_ref ?? '';
  if (!ref.startsWith(`${OPS_REPOSITORY}/${OPS_WORKFLOW}@`)) return { ok: false, reason: 'workflow' };
  return { ok: true, claims };
}

/** للاختبارات */
export function __resetJwksCache() {
  jwksCache = null;
}
