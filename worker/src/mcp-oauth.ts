import { Hono } from 'hono';
import { accessSubject } from './auth';
import { ApiError, type AppEnv, type Bindings } from './common';
import { consentPage } from './mcp-consent';

export const READ_SCOPE = 'ledger:read';
const CONSENT_TTL = 10 * 60_000;
const CODE_TTL = 5 * 60_000;
const ACCESS_TTL = 60 * 60_000;
const REFRESH_TTL = 90 * 24 * 60 * 60_000;
function hasDuplicates(params: URLSearchParams) {
  let duplicate = false;
  params.forEach((_, key) => { if (params.getAll(key).length !== 1) duplicate = true; });
  return duplicate;
}

export function oauthConfig(env: Bindings) {
  const mcp = new URL(env.MCP_ORIGIN ?? '');
  const ledger = new URL(env.LEDGER_ORIGIN ?? '');
  for (const url of [mcp, ledger]) {
    const local = url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)
      && env.LOCAL_DEV_SUBJECT === 'local-dev-subject';
    if ((!local && url.protocol !== 'https:') || url.pathname !== '/' || url.search || url.hash
      || url.username || url.password) throw new Error('Invalid OAuth origin');
  }
  const redirects: unknown = JSON.parse(env.MCP_REDIRECT_URIS ?? '[]');
  if (!env.MCP_CLIENT_ID || !Array.isArray(redirects)
    || !redirects.every((value) => {
      if (typeof value !== 'string') return false;
      const url = new URL(value);
      return !url.hash && !url.username && !url.password && (url.protocol === 'https:'
        || (env.LOCAL_DEV_SUBJECT === 'local-dev-subject' && url.protocol === 'http:'
          && ['127.0.0.1', 'localhost'].includes(url.hostname)));
    })) throw new Error('Invalid OAuth client');
  return { issuer: mcp.origin, ledger: ledger.origin, resource: `${mcp.origin}/mcp`,
    clientId: env.MCP_CLIENT_ID, redirects: redirects as string[] };
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomToken() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
interface Grant {
  token_hash: string; kind: string; account_id: string; access_subject: string;
  client_id: string; redirect_uri: string; resource: string; scope: string;
  code_challenge: string; state: string; expires_at_ms: number;
}
async function saveGrant(db: D1Database, grant: Omit<Grant, 'token_hash'>) {
  const token = randomToken();
  await db.prepare(`INSERT INTO mcp_oauth_grants (token_hash, kind, account_id,
    access_subject, client_id, redirect_uri, resource, scope, code_challenge, state, expires_at_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(await sha256(token), grant.kind,
      grant.account_id, grant.access_subject, grant.client_id, grant.redirect_uri,
      grant.resource, grant.scope, grant.code_challenge, grant.state, grant.expires_at_ms).run();
  return token;
}

// 只掛在既有、受 Cloudflare Access 保護的網站；MCP Worker 不掛此路由。
export function authorizationRoutes(resolveSubject = accessSubject) {
  const app = new Hono<AppEnv>();
  app.use('/oauth/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    // no-referrer 會讓瀏覽器表單 POST 的 Origin 變成 null；同站保留 Origin，跨站不送 referrer。
    c.header('Referrer-Policy', 'same-origin');
    c.header('Content-Security-Policy', "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    if (!c.env.MCP_ORIGIN) return c.json({ error: 'MCP_NOT_CONFIGURED' }, 503);
    const config = oauthConfig(c.env);
    if (new URL(c.req.url).origin !== config.ledger) return c.json({ error: 'invalid_request' }, 400);
    const subject = await resolveSubject(c.req.raw, c.env);
    const account = await c.env.DB.prepare('SELECT id FROM accounts WHERE access_subject = ?')
      .bind(subject).first<{ id: string }>();
    if (!account) throw new ApiError(403, 'ACCOUNT_NOT_LINKED', '帳本尚未綁定');
    c.set('accountId', account.id);
    c.set('accessSubject', subject);
    await next();
  });
  app.get('/oauth/authorize', async (c) => {
    const config = oauthConfig(c.env);
    const params = new URL(c.req.url).searchParams;
    const redirect = params.get('redirect_uri') ?? '';
    // redirect_uri 與 client_id 必須完全相符；錯誤不可導向未驗證網址。
    if (params.get('client_id') !== config.clientId || !config.redirects.includes(redirect)
      || params.get('response_type') !== 'code' || params.get('scope') !== READ_SCOPE
      || params.get('resource') !== config.resource || params.get('code_challenge_method') !== 'S256'
      || !/^[A-Za-z0-9_-]{43}$/.test(params.get('code_challenge') ?? '')
      || !(params.get('state')?.length) || params.get('state')!.length > 2048
      || hasDuplicates(params)) {
      return c.json({ error: 'invalid_request' }, 400);
    }
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM mcp_oauth_grants WHERE expires_at_ms <= ?').bind(Date.now()),
      c.env.DB.prepare('DELETE FROM mcp_oauth_sessions WHERE expires_at_ms <= ?').bind(Date.now()),
    ]);
    const consent = await saveGrant(c.env.DB, {
      kind: 'consent', account_id: c.get('accountId'), access_subject: c.get('accessSubject'),
      client_id: config.clientId, redirect_uri: redirect, resource: config.resource,
      scope: READ_SCOPE, code_challenge: params.get('code_challenge')!, state: params.get('state')!,
      expires_at_ms: Date.now() + CONSENT_TTL,
    });
    const nonce = randomToken();
    c.header('Content-Security-Policy', `default-src 'none'; style-src 'nonce-${nonce}'; form-action 'self' ${new URL(redirect).origin}; frame-ancestors 'none'; base-uri 'none'`);
    return c.html(consentPage(config.clientId, consent, nonce));
  });
  app.post('/oauth/authorize', async (c) => {
    const config = oauthConfig(c.env);
    if (c.req.header('Origin') !== config.ledger) return c.json({ error: 'invalid_request' }, 400);
    const form = await boundedForm(c.req.raw);
    const decision = form.get('decision');
    if (!['allow', 'deny'].includes(decision ?? '')) return c.json({ error: 'invalid_request' }, 400);
    const grant = await c.env.DB.prepare(`DELETE FROM mcp_oauth_grants
      WHERE token_hash = ? AND kind = 'consent' AND access_subject = ? AND account_id = ?
      AND expires_at_ms > ? RETURNING *`).bind(await sha256(form.get('consent') ?? ''),
        c.get('accessSubject'), c.get('accountId'), Date.now()).first<Grant>();
    if (!grant || grant.client_id !== config.clientId || !config.redirects.includes(grant.redirect_uri)
      || grant.resource !== config.resource) return c.json({ error: 'invalid_request' }, 400);
    const redirect = new URL(grant.redirect_uri);
    redirect.searchParams.set('state', grant.state);
    redirect.searchParams.set('iss', config.issuer);
    if (decision === 'deny') redirect.searchParams.set('error', 'access_denied');
    else redirect.searchParams.set('code', await saveGrant(c.env.DB, {
      ...grant, kind: 'code', expires_at_ms: Date.now() + CODE_TTL,
    }));
    return c.redirect(redirect.href, 302);
  });
  app.get('/oauth/connections', async (c) => {
    const grants = await c.env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM mcp_oauth_sessions WHERE account_id = ? AND access_subject = ? AND expires_at_ms > ?)
      + (SELECT COUNT(*) FROM mcp_oauth_grants WHERE account_id = ? AND access_subject = ?
        AND kind = 'access' AND session_id IS NULL AND expires_at_ms > ?) AS count`)
      .bind(c.get('accountId'), c.get('accessSubject'), Date.now(), c.get('accountId'), c.get('accessSubject'), Date.now())
      .first<{ count: number }>();
    return c.html(`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ChatGPT 記帳授權</title><body><main><h1>ChatGPT 記帳授權</h1><p>目前有 ${grants?.count ?? 0} 個有效的唯讀連接。</p><p>撤銷後，ChatGPT 必須重新取得你的同意才能查詢帳本。</p><form action="/oauth/connections" method="post"><button type="submit">撤銷全部查詢授權</button></form></main></body></html>`);
  });
  app.post('/oauth/connections', async (c) => {
    if (c.req.header('Origin') !== oauthConfig(c.env).ledger) return c.json({ error: 'invalid_request' }, 400);
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM mcp_oauth_sessions WHERE account_id = ? AND access_subject = ?')
        .bind(c.get('accountId'), c.get('accessSubject')),
      c.env.DB.prepare('DELETE FROM mcp_oauth_grants WHERE account_id = ? AND access_subject = ?')
        .bind(c.get('accountId'), c.get('accessSubject')),
    ]);
    return c.redirect('/oauth/connections', 303);
  });
  return app;
}

async function boundedForm(request: Request) {
  if (!/^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(request.headers.get('Content-Type') ?? '')) {
    throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', '請使用表單');
  }
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new ApiError(413, 'PAYLOAD_TOO_LARGE', '請求內容過大'); }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const params = new URLSearchParams(new TextDecoder().decode(bytes));
  if (hasDuplicates(params)) {
    throw new ApiError(400, 'INVALID_INPUT', '表單欄位重複');
  }
  return params;
}

// MCP public Worker 的 OAuth discovery/token；不提供網站登入或記帳寫入 API。
export function tokenRoutes() {
  const app = new Hono<AppEnv>();
  app.get('/.well-known/oauth-protected-resource/mcp', (c) => {
    const config = oauthConfig(c.env);
    return c.json({ resource: config.resource, authorization_servers: [config.issuer],
      scopes_supported: [READ_SCOPE], bearer_methods_supported: ['header'] });
  });
  app.get('/.well-known/oauth-authorization-server', (c) => {
    const config = oauthConfig(c.env);
    return c.json({ issuer: config.issuer, authorization_endpoint: `${config.ledger}/oauth/authorize`,
      token_endpoint: `${config.issuer}/oauth/token`, revocation_endpoint: `${config.issuer}/oauth/revoke`,
      response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'],
      authorization_response_iss_parameter_supported: true, scopes_supported: [READ_SCOPE] });
  });
  app.post('/oauth/token', async (c) => {
    const config = oauthConfig(c.env);
    const params = await boundedForm(c.req.raw);
    if (params.get('client_id') !== config.clientId) return c.json({ error: 'invalid_client' }, 400);
    if (params.get('grant_type') === 'refresh_token') {
      if ((params.has('resource') && params.get('resource') !== config.resource)
        || (params.has('scope') && params.get('scope') !== READ_SCOPE)
        || !/^[A-Za-z0-9_-]{43}$/.test(params.get('refresh_token') ?? '')) {
        return c.json({ error: 'invalid_grant' }, 400);
      }
      const hash = await sha256(params.get('refresh_token')!);
      const session = await c.env.DB.prepare(`SELECT s.* FROM mcp_oauth_sessions s
        JOIN accounts a ON a.id = s.account_id AND a.access_subject = s.access_subject
        WHERE s.refresh_hash = ? AND s.client_id = ? AND s.resource = ? AND s.scope = ? AND s.expires_at_ms > ?`)
        .bind(hash, config.clientId, config.resource, READ_SCOPE, Date.now()).first<Session>();
      if (!session) {
        // 已輪替的 refresh token 被再次使用：撤銷整個連接與已發出的 access token。
        await c.env.DB.prepare(`DELETE FROM mcp_oauth_sessions WHERE client_id = ? AND resource = ?
          AND id IN (SELECT session_id FROM mcp_oauth_refresh_history WHERE token_hash = ?)`)
          .bind(config.clientId, config.resource, hash).run();
        return c.json({ error: 'invalid_grant' }, 400);
      }
      const pair = await rotateSession(c.env.DB, session, hash);
      return pair ? c.json(pair) : c.json({ error: 'invalid_grant' }, 400);
    }
    if (params.get('grant_type') !== 'authorization_code') return c.json({ error: 'unsupported_grant_type' }, 400);
    if (params.get('resource') !== config.resource || !config.redirects.includes(params.get('redirect_uri') ?? '')
      || !/^[A-Za-z0-9._~-]{43,128}$/.test(params.get('code_verifier') ?? '')) {
      return c.json({ error: 'invalid_grant' }, 400);
    }
    const grant = await c.env.DB.prepare(`DELETE FROM mcp_oauth_grants WHERE token_hash = ?
      AND kind = 'code' AND client_id = ? AND redirect_uri = ? AND resource = ?
      AND code_challenge = ? AND expires_at_ms > ? RETURNING *`).bind(
        await sha256(params.get('code') ?? ''), config.clientId, params.get('redirect_uri'),
        config.resource, await sha256(params.get('code_verifier')!), Date.now()).first<Grant>();
    if (!grant) return c.json({ error: 'invalid_grant' }, 400);
    const linked = await c.env.DB.prepare('SELECT id FROM accounts WHERE id = ? AND access_subject = ?')
      .bind(grant.account_id, grant.access_subject).first();
    if (!linked) return c.json({ error: 'invalid_grant' }, 400);
    return c.json(await createSession(c.env.DB, grant));
  });
  app.post('/oauth/revoke', async (c) => {
    const config = oauthConfig(c.env);
    const params = await boundedForm(c.req.raw);
    if (params.get('client_id') !== config.clientId) return c.json({ error: 'invalid_client' }, 400);
    const hash = await sha256(params.get('token') ?? '');
    await c.env.DB.batch([
      c.env.DB.prepare(`DELETE FROM mcp_oauth_sessions WHERE client_id = ? AND resource = ? AND (
        refresh_hash = ? OR id IN (SELECT session_id FROM mcp_oauth_grants WHERE token_hash = ?)
        OR id IN (SELECT session_id FROM mcp_oauth_refresh_history WHERE token_hash = ?))`)
        .bind(config.clientId, config.resource, hash, hash, hash),
      c.env.DB.prepare(`DELETE FROM mcp_oauth_grants WHERE token_hash = ? AND client_id = ?
        AND resource = ? AND kind = 'access'`).bind(hash, config.clientId, config.resource),
    ]);
    return c.body(null, 200);
  });
  return app;
}

export async function bearerIdentity(request: Request, env: Bindings) {
  const config = oauthConfig(env);
  const raw = request.headers.get('Authorization') ?? '';
  if (!/^Bearer [A-Za-z0-9_-]{43}$/i.test(raw)) return null;
  const token = raw.slice(7);
  return env.DB.prepare(`SELECT g.account_id, g.access_subject FROM mcp_oauth_grants g
    JOIN accounts a ON a.id = g.account_id AND a.access_subject = g.access_subject
    LEFT JOIN mcp_oauth_sessions s ON s.id = g.session_id
    WHERE g.token_hash = ? AND g.kind = 'access' AND g.resource = ? AND g.client_id = ?
      AND g.scope = ? AND g.expires_at_ms > ? AND (g.session_id IS NULL OR s.expires_at_ms > ?)`)
      .bind(await sha256(token), config.resource, config.clientId, READ_SCOPE, Date.now(), Date.now())
      .first<{ account_id: string; access_subject: string }>();
}

interface Session {
  id: string; account_id: string; access_subject: string; client_id: string;
  resource: string; scope: string; refresh_hash: string; expires_at_ms: number;
}
function accessInsert(db: D1Database, sessionId: string, refreshHash: string, accessHash: string, now: number) {
  return db.prepare(`INSERT INTO mcp_oauth_grants (token_hash, kind, account_id, access_subject,
    client_id, redirect_uri, resource, scope, code_challenge, state, expires_at_ms, session_id)
    SELECT ?, 'access', account_id, access_subject, client_id, '', resource, scope, '', '', ?, id
    FROM mcp_oauth_sessions WHERE id = ? AND refresh_hash = ?`)
    .bind(accessHash, now + ACCESS_TTL, sessionId, refreshHash);
}
const tokenResponse = (access: string, refresh: string) => ({ access_token: access,
  refresh_token: refresh, token_type: 'Bearer', expires_in: ACCESS_TTL / 1000, scope: READ_SCOPE });

async function createSession(db: D1Database, grant: Grant) {
  const id = crypto.randomUUID(), access = randomToken(), refresh = randomToken(), now = Date.now();
  const hash = await sha256(refresh);
  await db.batch([
    db.prepare(`INSERT INTO mcp_oauth_sessions (id, account_id, access_subject, client_id,
      resource, scope, refresh_hash, expires_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, grant.account_id, grant.access_subject, grant.client_id, grant.resource, READ_SCOPE, hash, now + REFRESH_TTL),
    accessInsert(db, id, hash, await sha256(access), now),
  ]);
  return tokenResponse(access, refresh);
}

async function rotateSession(db: D1Database, session: Session, oldHash: string) {
  const access = randomToken(), refresh = randomToken(), now = Date.now(), hash = await sha256(refresh);
  // D1 batch 是交易。新 access 只會從成功輪替到本次隨機 hash 的 session 建立。
  const results = await db.batch([
    db.prepare(`INSERT OR IGNORE INTO mcp_oauth_refresh_history (token_hash, session_id)
      SELECT refresh_hash, id FROM mcp_oauth_sessions WHERE id = ? AND refresh_hash = ? AND expires_at_ms > ?`)
      .bind(session.id, oldHash, now),
    db.prepare(`UPDATE mcp_oauth_sessions SET refresh_hash = ?, expires_at_ms = ?
      WHERE id = ? AND refresh_hash = ? AND expires_at_ms > ? AND EXISTS (
        SELECT 1 FROM accounts WHERE id = account_id AND access_subject = mcp_oauth_sessions.access_subject)`)
      .bind(hash, now + REFRESH_TTL, session.id, oldHash, now),
    accessInsert(db, session.id, hash, await sha256(access), now),
    db.prepare('DELETE FROM mcp_oauth_grants WHERE session_id = ? AND expires_at_ms <= ?').bind(session.id, now),
  ]);
  if (!results[1].meta.changes) {
    await db.prepare('DELETE FROM mcp_oauth_sessions WHERE id = ?').bind(session.id).run();
    return null;
  }
  return tokenResponse(access, refresh);
}
