import assert from 'node:assert/strict';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { refreshAuthorization } from '@modelcontextprotocol/sdk/client/auth.js';

const outputs = ['index', 'mcp-index', 'mcp-oauth'].map((name) => join(tmpdir(), `ledger-${name}-${process.pid}.mjs`));
for (const [index, name] of ['index', 'mcp-index', 'mcp-oauth'].entries()) {
  await build({ entryPoints: [`worker/src/${name}.ts`], outfile: outputs[index], bundle: true,
    platform: 'node', format: 'esm', target: 'node22' });
}
const { createApp } = await import(pathToFileURL(outputs[0]).href);
const { createMcpApp } = await import(pathToFileURL(outputs[1]).href);
const { sha256 } = await import(pathToFileURL(outputs[2]).href);
after(() => Promise.all(outputs.map((path) => unlink(path))));
const migrations = await Promise.all(['0001_init.sql', '0002_mcp_oauth.sql', '0003_mcp_refresh.sql'].map((name) => readFile(`migrations/${name}`, 'utf8')));
const site = createApp(async (request) => request.headers.get('X-Test-Subject') ?? 'unlinked');
const mcp = createMcpApp();
const verifier = 'a'.repeat(43);
const origin = 'https://mcp.test';
const ledger = 'https://ledger.test';
const redirect = 'https://chatgpt.com/connector/oauth/test-callback';

function fixture() {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys = ON');
  migrations.forEach((migration) => sql.exec(migration));
  sql.exec(`INSERT INTO accounts (id, access_subject) VALUES ('a', 'subject-a'), ('b', 'subject-b');
    INSERT INTO tags (account_id, id, kind, name, icon_name, sort_order) VALUES
      ('a', 'food', 'expense', '飲食', 'food', 0), ('b', 'food', 'expense', '私人分類', 'food', 0),
      ('a', 'salary', 'income', '薪資', 'money', 0);`);
  const insert = sql.prepare(`INSERT INTO ledger_entries (account_id, kind, id, occurred_at_ms,
    amount_minor, currency_code, currency_scale, tag_id, description) VALUES (?, ?, ?, ?, ?, 'TWD', 2, ?, ?)`);
  insert.run('a', 'expense', 'start', Date.parse('2026-10-01T00:00:00+08:00'), 12345, 'food', '咖啡');
  insert.run('a', 'expense', 'second', Date.parse('2026-10-02T10:00:00+08:00'), 20000, 'food', '午餐');
  insert.run('a', 'expense', 'outside', Date.parse('2026-11-01T00:00:00+08:00'), 99999, 'food', '下個月');
  insert.run('b', 'expense', 'private', Date.parse('2026-10-02T10:00:00+08:00'), 50000, 'food', '另一帳本');
  insert.run('a', 'income', 'pay', Date.parse('2026-10-03T10:00:00+08:00'), 5000000, 'salary', '薪資');
  const db = {
    prepare(query) {
      return { bind(...params) {
        const statement = sql.prepare(query);
        return {
          async first() { return statement.get(...params) ?? null; },
          async all() { const results = statement.all(...params); return { results,
            meta: { changes: Number(sql.prepare('SELECT changes() AS n').get().n) } }; },
          async run() { return { meta: { changes: Number(statement.run(...params).changes) } }; },
        };
      } };
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all());
        sql.exec('COMMIT'); return results;
      } catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
  };
  return { sql, env: { DB: db, MCP_ORIGIN: origin, LEDGER_ORIGIN: ledger,
    MCP_CLIENT_ID: 'ledger-chatgpt', MCP_REDIRECT_URIS: JSON.stringify([redirect]) } };
}
async function form(app, env, path, params, extra = {}) {
  return app.request(path, { method: 'POST', headers: {
    'Content-Type': 'application/x-www-form-urlencoded', ...extra,
  }, body: new URLSearchParams(params).toString() }, env);
}
async function consent(env, overrides = {}, subject = 'subject-a') {
  const params = new URLSearchParams({ response_type: 'code', client_id: env.MCP_CLIENT_ID,
    redirect_uri: redirect, resource: `${origin}/mcp`, scope: 'ledger:read', state: 'state-test',
    code_challenge: await sha256(verifier), code_challenge_method: 'S256', ...overrides });
  const response = await site.request(`${ledger}/oauth/authorize?${params}`, {
    headers: { 'X-Test-Subject': subject },
  }, env);
  const html = await response.text();
  return { response, consent: html.match(/name="consent" value="([^"]+)"/)?.[1] };
}
async function approve(env, token, decision = 'allow', subject = 'subject-a', requestOrigin = ledger) {
  return form(site, env, `${ledger}/oauth/authorize`, { consent: token, decision },
    { Origin: requestOrigin, 'X-Test-Subject': subject });
}
async function exchange(env, code, overrides = {}) {
  return form(mcp, env, `${origin}/oauth/token`, { grant_type: 'authorization_code',
    client_id: env.MCP_CLIENT_ID, redirect_uri: redirect, resource: `${origin}/mcp`,
    code_verifier: verifier, code, ...overrides });
}
async function grantCredentials(env, subject = 'subject-a') {
  const pending = await consent(env, {}, subject);
  assert.equal(pending.response.status, 200);
  const approval = await approve(env, pending.consent, 'allow', subject);
  assert.equal(approval.status, 302);
  const callback = new URL(approval.headers.get('Location'));
  assert.equal(callback.searchParams.get('state'), 'state-test');
  assert.equal(callback.searchParams.get('iss'), origin);
  const response = await exchange(env, callback.searchParams.get('code'));
  assert.equal(response.status, 200);
  return response.json();
}
async function grantToken(env, subject = 'subject-a') { return (await grantCredentials(env, subject)).access_token; }
async function refresh(env, token, overrides = {}) {
  return form(mcp, env, `${origin}/oauth/token`, { grant_type: 'refresh_token',
    client_id: env.MCP_CLIENT_ID, refresh_token: token, ...overrides });
}
async function connect(env, token) {
  const client = new Client({ name: 'ledger-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
    fetch: (input, init) => mcp.request(new Request(input, init), undefined, env),
  });
  await client.connect(transport);
  return client;
}
const range = { kind: 'expense', startDate: '2026-10-01', endDateExclusive: '2026-11-01' };

test('OAuth discovery 與未授權 MCP challenge；公開 Worker 沒有網站寫入入口', async () => {
  const { sql, env } = fixture();
  const metadata = await mcp.request(`${origin}/.well-known/oauth-authorization-server`, {}, env);
  const data = await metadata.json();
  assert.equal(data.authorization_endpoint, `${ledger}/oauth/authorize`);
  assert.deepEqual(data.code_challenge_methods_supported, ['S256']);
  assert.deepEqual(data.token_endpoint_auth_methods_supported, ['none']);
  assert.ok(data.grant_types_supported.includes('refresh_token'));
  const protectedResource = await mcp.request(`${origin}/.well-known/oauth-protected-resource/mcp`, {}, env);
  assert.equal((await protectedResource.json()).resource, `${origin}/mcp`);
  const response = await mcp.request(`${origin}/mcp`, { method: 'POST' }, env);
  assert.equal(response.status, 401);
  assert.match(response.headers.get('WWW-Authenticate'), /oauth-protected-resource\/mcp/);
  assert.equal((await mcp.request(`${origin}/api/v1/entries`, { method: 'POST' }, env)).status, 404);
  assert.equal((await mcp.request(`${origin}/oauth/authorize`, {}, env)).status, 404);
  assert.equal((await createMcpApp().request(`${origin}/mcp`, {}, { DB: env.DB })).status, 503);
  sql.close();
});

test('授權拒絕、帳本身分、redirect、scope、PKCE、CSRF 與一次性 consent', async () => {
  const { sql, env } = fixture();
  for (const overrides of [{ redirect_uri: 'https://evil.test' }, { scope: 'ledger:write' },
    { resource: ledger }, { code_challenge_method: 'plain' }, { client_id: 'other' }]) {
    assert.equal((await consent(env, overrides)).response.status, 400);
  }
  assert.equal((await consent(env, {}, 'unlinked')).response.status, 403);
  const pending = await consent(env);
  assert.equal(pending.response.headers.get('Referrer-Policy'), 'same-origin');
  assert.match(pending.response.headers.get('Content-Security-Policy'), /form-action 'self' https:\/\/chatgpt.com/);
  assert.equal((await approve(env, pending.consent, 'allow', 'subject-b')).status, 400);
  assert.equal((await approve(env, pending.consent, 'allow', 'subject-a', 'https://evil.test')).status, 400);
  const rejected = await approve(env, pending.consent, 'deny');
  assert.equal(new URL(rejected.headers.get('Location')).searchParams.get('error'), 'access_denied');
  assert.equal((await approve(env, pending.consent)).status, 400);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM mcp_oauth_grants WHERE kind != 'consent'").get().n, 0);
  sql.close();
});

test('授權碼綁定 client、redirect、resource 與 PKCE；只能兌換一次且不存明文權杖', async () => {
  const { sql, env } = fixture();
  const pending = await consent(env);
  const approved = await approve(env, pending.consent);
  const code = new URL(approved.headers.get('Location')).searchParams.get('code');
  for (const overrides of [{ code_verifier: 'b'.repeat(43) }, { resource: ledger },
    { redirect_uri: 'https://evil.test' }, { client_id: 'other' }]) {
    assert.equal((await exchange(env, code, overrides)).status, 400);
  }
  const response = await exchange(env, code);
  assert.equal(response.status, 200);
  assert.equal((await exchange(env, code)).status, 400);
  const token = await response.json();
  assert.equal(token.scope, 'ledger:read');
  assert.equal(token.expires_in, 3600);
  assert.ok(token.refresh_token);
  const stored = sql.prepare("SELECT * FROM mcp_oauth_grants WHERE kind = 'access'").get();
  assert.equal(stored.token_hash, await sha256(token.access_token));
  assert.ok(!JSON.stringify(stored).includes(token.access_token));
  sql.close();
});

test('官方 SDK 初始化、四個唯讀工具、日期邊界、分頁、明細與完整期間加總', async () => {
  const { sql, env } = fixture();
  const client = await connect(env, await grantToken(env));
  try {
    const tools = (await client.listTools()).tools;
    assert.deepEqual(tools.map((tool) => tool.name), ['list_tags', 'search_entries', 'get_entry', 'summarize_entries']);
    assert.ok(tools.every((tool) => tool.annotations.readOnlyHint === true && tool.annotations.destructiveHint === false));
    const tags = await client.callTool({ name: 'list_tags', arguments: { kind: 'expense' } });
    assert.equal(tags.structuredContent.items[0].name, '飲食');
    const page = await client.callTool({ name: 'search_entries', arguments: { ...range, limit: 1, sort: 'dateAsc' } });
    assert.equal(page.structuredContent.items[0].id, 'start');
    assert.equal(page.structuredContent.items[0].amount, '123.45');
    assert.equal(page.structuredContent.items[0].occurredAtLocal, '2026-10-01T00:00:00.000+08:00');
    assert.equal(page.structuredContent.hasMore, true);
    const next = await client.callTool({ name: 'search_entries', arguments: { ...range, limit: 1, sort: 'dateAsc',
      cursor: page.structuredContent.nextCursor } });
    assert.equal(next.structuredContent.items[0].id, 'second');
    assert.equal(next.structuredContent.hasMore, false);
    const summary = await client.callTool({ name: 'summarize_entries', arguments: range });
    assert.equal(summary.structuredContent.totalMinor, 32345);
    assert.equal(summary.structuredContent.count, 2);
    assert.equal(summary.structuredContent.byTag[0].totalMinor, 32345);
    const filtered = await client.callTool({ name: 'summarize_entries', arguments: { ...range, tagId: 'food', q: '咖啡' } });
    assert.equal(filtered.structuredContent.totalMinor, 12345);
    const income = await client.callTool({ name: 'summarize_entries', arguments: { ...range, kind: 'income' } });
    assert.equal(income.structuredContent.totalMinor, 5000000);
    const entry = await client.callTool({ name: 'get_entry', arguments: { kind: 'expense', id: 'start' } });
    assert.equal(entry.structuredContent.entry.description, '咖啡');
  } finally { await client.close(); sql.close(); }
});

test('拒絕跨帳本、任意寫入、額外參數、非法日期、錯誤 cursor 和超過上限', async () => {
  const { sql, env } = fixture();
  const client = await connect(env, await grantToken(env));
  try {
    const foreign = await client.callTool({ name: 'get_entry', arguments: { kind: 'expense', id: 'private' } });
    assert.equal(foreign.isError, true);
    assert.match(foreign.content[0].text, /NOT_FOUND/);
    for (const args of [{ ...range, accountId: 'b' }, { ...range, limit: 101 },
      { ...range, startDate: '2026-02-30' }, { ...range, endDateExclusive: '2026-09-01' },
      { ...range, cursor: 'invalid' }]) {
      assert.equal((await client.callTool({ name: 'search_entries', arguments: args })).isError, true);
    }
    assert.equal((await client.callTool({ name: 'delete_entry', arguments: { id: 'start' } })).isError, true);
    assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM ledger_entries').get().n, 5);
  } finally { await client.close(); sql.close(); }
});

test('權杖撤銷、到期、帳本重新綁定後無法使用；不能拿 MCP 權杖呼叫網站寫入', async () => {
  const { sql, env } = fixture();
  const token = await grantToken(env);
  const headers = { Authorization: `Bearer ${token}` };
  assert.equal((await mcp.request(`${origin}/mcp`, { headers: { ...headers, Origin: 'https://evil.test' } }, env)).status, 403);
  assert.equal((await createApp().request(`${ledger}/api/v1/entries`, {
    method: 'POST', headers: { ...headers, Origin: ledger },
  }, env)).status, 401);
  const revoke = await form(mcp, env, `${origin}/oauth/revoke`, { token, client_id: env.MCP_CLIENT_ID });
  assert.equal(revoke.status, 200);
  assert.equal((await mcp.request(`${origin}/mcp`, { headers }, env)).status, 401);
  const expired = await grantToken(env);
  sql.prepare("UPDATE mcp_oauth_grants SET expires_at_ms = 0 WHERE kind = 'access'").run();
  assert.equal((await mcp.request(`${origin}/mcp`, { headers: { Authorization: `Bearer ${expired}` } }, env)).status, 401);
  const rebound = await grantToken(env);
  sql.prepare("UPDATE accounts SET access_subject = 'replacement' WHERE id = 'a'").run();
  assert.equal((await mcp.request(`${origin}/mcp`, { headers: { Authorization: `Bearer ${rebound}` } }, env)).status, 401);
  sql.close();
});

test('到期授權碼不能換 token；表單與 MCP 有輸入大小上限', async () => {
  const { sql, env } = fixture();
  const pending = await consent(env);
  const approved = await approve(env, pending.consent);
  const code = new URL(approved.headers.get('Location')).searchParams.get('code');
  sql.prepare("UPDATE mcp_oauth_grants SET expires_at_ms = 0 WHERE kind = 'code'").run();
  assert.equal((await exchange(env, code)).status, 400);
  assert.equal((await form(mcp, env, `${origin}/oauth/token`, { huge: 'a'.repeat(9000) })).status, 413);
  const token = await grantToken(env);
  const oversized = await mcp.request(`${origin}/mcp`, { method: 'POST', headers: {
    Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
  }, body: JSON.stringify({ payload: 'a'.repeat(65536) }) }, env);
  assert.equal(oversized.status, 413);
  sql.close();
});

test('公開端點及已授權帳本都套用限流，不將權杖放入限流 key', async () => {
  const { sql, env } = fixture();
  const token = await grantToken(env);
  const keys = [];
  env.MCP_RATE_LIMITER = { async limit({ key }) {
    keys.push(key);
    return { success: !key.startsWith('account:') };
  } };
  const response = await mcp.request(`${origin}/mcp`, { headers: { Authorization: `Bearer ${token}` } }, env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.deepEqual(keys.map((key) => key.split(':')[0]), ['request', 'account']);
  assert.ok(keys.every((key) => !key.includes(token)));
  env.MCP_RATE_LIMITER = { async limit() { return { success: false }; } };
  assert.equal((await mcp.request(`${origin}/oauth/token`, { method: 'POST' }, env)).status, 429);
  sql.close();
});

test('網站可撤銷全部 MCP 授權，不能撤銷另一帳本或由其他來源觸發', async () => {
  const { sql, env } = fixture();
  const tokenA = await grantToken(env);
  const tokenB = await grantToken(env, 'subject-b');
  const page = await site.request(`${ledger}/oauth/connections`, { headers: { 'X-Test-Subject': 'subject-a' } }, env);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /目前有 1 個/);
  assert.equal((await site.request(`${ledger}/oauth/connections`, {}, env)).status, 403);
  assert.equal((await site.request(`${ledger}/oauth/connections`, { method: 'POST', headers: {
    'X-Test-Subject': 'subject-a', Origin: 'https://evil.test',
  } }, env)).status, 400);
  assert.equal((await site.request(`${ledger}/oauth/connections`, { method: 'POST', headers: {
    'X-Test-Subject': 'subject-a', Origin: ledger,
  } }, env)).status, 303);
  assert.equal((await mcp.request(`${origin}/mcp`, { headers: { Authorization: `Bearer ${tokenA}` } }, env)).status, 401);
  const clientB = await connect(env, tokenB);
  try {
    assert.equal((await clientB.callTool({ name: 'summarize_entries', arguments: range })).structuredContent.totalMinor, 50000);
  } finally { await clientB.close(); sql.close(); }
});

test('短期權杖過期後可用官方 SDK 續期，輪替 refresh token 並延長閒置期限', async () => {
  const { sql, env } = fixture();
  const initial = await grantCredentials(env);
  sql.prepare("UPDATE mcp_oauth_grants SET expires_at_ms = 0 WHERE kind = 'access'").run();
  sql.prepare('UPDATE mcp_oauth_sessions SET expires_at_ms = ?').run(Date.now() + 60_000);
  const metadata = await (await mcp.request(`${origin}/.well-known/oauth-authorization-server`, {}, env)).json();
  const renewed = await refreshAuthorization(origin, { metadata,
    clientInformation: { client_id: env.MCP_CLIENT_ID, token_endpoint_auth_method: 'none' },
    refreshToken: initial.refresh_token, resource: new URL(`${origin}/mcp`),
    fetchFn: (input, init) => mcp.request(new Request(input, init), undefined, env),
  });
  assert.notEqual(renewed.refresh_token, initial.refresh_token);
  assert.notEqual(renewed.access_token, initial.access_token);
  assert.equal(renewed.expires_in, 3600);
  const session = sql.prepare('SELECT * FROM mcp_oauth_sessions').get();
  assert.equal(session.refresh_hash, await sha256(renewed.refresh_token));
  assert.ok(session.expires_at_ms > Date.now() + 89 * 86400_000);
  assert.ok(!JSON.stringify(session).includes(renewed.refresh_token));
  assert.equal((await mcp.request(`${origin}/mcp`, { headers: { Authorization: `Bearer ${initial.access_token}` } }, env)).status, 401);
  const client = await connect(env, renewed.access_token);
  try { assert.equal((await client.callTool({ name: 'summarize_entries', arguments: range })).structuredContent.totalMinor, 32345); }
  finally { await client.close(); sql.close(); }
});

test('重用舊 refresh token 會撤銷整個連接，其他帳本仍可續期', async () => {
  const { sql, env } = fixture();
  const initial = await grantCredentials(env);
  const other = await grantCredentials(env, 'subject-b');
  const renewed = await (await refresh(env, initial.refresh_token)).json();
  assert.ok(renewed.refresh_token);
  assert.equal((await refresh(env, initial.refresh_token)).status, 400);
  assert.equal((await refresh(env, renewed.refresh_token)).status, 400);
  for (const access of [initial.access_token, renewed.access_token]) {
    assert.equal((await mcp.request(`${origin}/mcp`, { headers: { Authorization: `Bearer ${access}` } }, env)).status, 401);
  }
  assert.equal((await refresh(env, other.refresh_token)).status, 200);
  sql.close();
});

test('refresh 不接受其他 client/resource 或加大權限，帳本重新綁定與閒置到期後拒絕續期', async () => {
  const { sql, env } = fixture();
  const initial = await grantCredentials(env);
  for (const overrides of [{ client_id: 'other' }, { resource: ledger }, { scope: 'ledger:write' }]) {
    assert.equal((await refresh(env, initial.refresh_token, overrides)).status, 400);
  }
  const renewed = await (await refresh(env, initial.refresh_token, { resource: `${origin}/mcp`, scope: 'ledger:read' })).json();
  assert.ok(renewed.access_token);
  sql.prepare("UPDATE accounts SET access_subject = 'replacement' WHERE id = 'a'").run();
  assert.equal((await refresh(env, renewed.refresh_token)).status, 400);
  const other = await grantCredentials(env, 'subject-b');
  sql.prepare("UPDATE mcp_oauth_sessions SET expires_at_ms = 0 WHERE account_id = 'b'").run();
  assert.equal((await refresh(env, other.refresh_token)).status, 400);
  assert.equal((await mcp.request(`${origin}/mcp`, { headers: { Authorization: `Bearer ${other.access_token}` } }, env)).status, 401);
  sql.close();
});

test('撤銷 access、refresh 或網站全部授權後，不能再續期', async () => {
  const { sql, env } = fixture();
  for (const credential of ['access_token', 'refresh_token']) {
    const initial = await grantCredentials(env);
    assert.equal((await form(mcp, env, `${origin}/oauth/revoke`, {
      client_id: env.MCP_CLIENT_ID, token: initial[credential],
    })).status, 200);
    assert.equal((await refresh(env, initial.refresh_token)).status, 400);
  }
  const initial = await grantCredentials(env);
  const renewed = await (await refresh(env, initial.refresh_token)).json();
  await site.request(`${ledger}/oauth/connections`, { method: 'POST', headers: {
    'X-Test-Subject': 'subject-a', Origin: ledger,
  } }, env);
  assert.equal((await refresh(env, renewed.refresh_token)).status, 400);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM mcp_oauth_refresh_history').get().n, 0);
  sql.close();
});

test('同一 refresh token 同時換發只會成功一次，重用時撤銷連接', async () => {
  const { sql, env } = fixture();
  const initial = await grantCredentials(env);
  const responses = await Promise.all([refresh(env, initial.refresh_token), refresh(env, initial.refresh_token)]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 400]);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM mcp_oauth_sessions').get().n, 0);
  sql.close();
});

test('官方 MCP 客戶端遇到 401 自動續期，不需要互動式登入', async () => {
  const { sql, env } = fixture();
  let credentials = await grantCredentials(env);
  const oldRefresh = credentials.refresh_token;
  sql.prepare("UPDATE mcp_oauth_grants SET expires_at_ms = 0 WHERE kind = 'access'").run();
  const client = new Client({ name: 'auto-refresh-test', version: '1.0.0' });
  const provider = {
    get redirectUrl() { return new URL(redirect); },
    get clientMetadata() { return { redirect_uris: [redirect], token_endpoint_auth_method: 'none' }; },
    clientInformation() { return { client_id: env.MCP_CLIENT_ID }; },
    tokens() { return credentials; },
    saveTokens(tokens) { credentials = tokens; },
    redirectToAuthorization() { throw new Error('不應要求重新登入'); },
    saveCodeVerifier() { throw new Error('不應重新授權'); },
    codeVerifier() { return verifier; },
  };
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`${origin}/mcp`), {
      authProvider: provider, fetch: (input, init) => mcp.request(new Request(input, init), undefined, env),
    }));
    assert.notEqual(credentials.refresh_token, oldRefresh);
    assert.equal((await client.listTools()).tools.length, 4);
  } finally { await client.close(); sql.close(); }
});

test('續期交易中途失敗會回滾，不會消耗原本 refresh token', async () => {
  const { sql, env } = fixture();
  const initial = await grantCredentials(env);
  sql.exec(`CREATE TRIGGER reject_access BEFORE INSERT ON mcp_oauth_grants
    WHEN NEW.kind = 'access' BEGIN SELECT RAISE(ABORT, 'test failure'); END;`);
  assert.equal((await refresh(env, initial.refresh_token)).status, 500);
  assert.equal(sql.prepare('SELECT refresh_hash FROM mcp_oauth_sessions').get().refresh_hash, await sha256(initial.refresh_token));
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM mcp_oauth_refresh_history').get().n, 0);
  sql.exec('DROP TRIGGER reject_access');
  assert.equal((await refresh(env, initial.refresh_token)).status, 200);
  sql.close();
});
