import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ApiError, type Bindings } from './common';

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function accessSubject(request: Request, env: Bindings): Promise<string> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', '尚未登入');
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Access 設定不完整');
  }
  const issuer = env.ACCESS_TEAM_DOMAIN.replace(/\/$/, '');
  const url = new URL(issuer);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.cloudflareaccess.com') || url.pathname !== '/') {
    throw new ApiError(500, 'INTERNAL_ERROR', 'Access 網域設定不正確');
  }
  let jwks = keySets.get(issuer);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    keySets.set(issuer, jwks);
  }
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer, audience: env.ACCESS_AUD, algorithms: ['RS256'],
    });
    if (typeof payload.sub !== 'string' || !payload.sub.trim()) {
      throw new Error('Missing user subject');
    }
    return payload.sub;
  } catch {
    throw new ApiError(401, 'UNAUTHENTICATED', '登入驗證失敗');
  }
}
