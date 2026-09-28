import assert from 'node:assert/strict';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { build } from 'esbuild';

const output = join(tmpdir(), `angular-ledger-worker-${process.pid}.mjs`);
await build({ entryPoints: ['worker/src/index.ts'], outfile: output,
  bundle: true, platform: 'node', format: 'esm', target: 'node22' });
const { createApp } = await import(pathToFileURL(output).href);
after(() => unlink(output));
const migration = await readFile('migrations/0001_init.sql', 'utf8');

function makeDb() {
  const sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys = ON;');
  sql.exec(migration);
  sql.prepare('INSERT INTO accounts (id, access_subject) VALUES (?, ?)').run('account-a', 'subject-a');
  sql.prepare('INSERT INTO accounts (id, access_subject) VALUES (?, ?)').run('account-b', 'subject-b');
  return {
    sql,
    prepare(query) {
      return {
        bind(...params) {
          const statement = sql.prepare(query);
          return {
            async first() { return statement.get(...params) ?? null; },
            async all() { return { results: statement.all(...params) }; },
            async run() { return { meta: { changes: Number(statement.run(...params).changes) } }; },
          };
        },
      };
    },
  };
}

const app = createApp(async (request) => request.headers.get('X-Test-Subject') ?? 'unlinked');

async function call(db, path, { method = 'GET', body, subject = 'subject-a', origin } = {}) {
  const headers = { 'X-Test-Subject': subject };
  if (!['GET', 'HEAD'].includes(method)) headers.Origin = origin ?? 'https://ledger.test';
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await app.request(`https://ledger.test${path}`,
    { method, headers, body: body === undefined ? undefined : JSON.stringify(body) },
    { DB: db, ACCESS_TEAM_DOMAIN: 'https://test.cloudflareaccess.com', ACCESS_AUD: 'aud' });
  const data = response.status === 204 ? null : await response.json();
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  return { status: response.status, data };
}

test('身分與帳本隔離', async () => {
  const db = makeDb();
  assert.deepEqual((await call(db, '/api/v1/me')).data, { account: { id: 'account-a' } });
  assert.equal((await call(db, '/api/v1/me', { subject: 'unlinked' })).status, 403);
  const response = await createApp().request('https://ledger.test/api/v1/me', {},
    { DB: db, ACCESS_TEAM_DOMAIN: 'https://test.cloudflareaccess.com', ACCESS_AUD: 'aud' });
  assert.equal(response.status, 401);
  db.sql.close();
});

test('本機測試登入只接受明確開啟的 loopback 請求', async () => {
  const db = makeDb();
  db.sql.prepare('INSERT INTO accounts (id, access_subject) VALUES (?, ?)')
    .run('local-account', 'local-dev-subject');
  const localEnv = { DB: db, LOCAL_DEV_SUBJECT: 'local-dev-subject',
    LOCAL_DEV_ORIGIN: 'http://127.0.0.1:4200' };
  const local = await createApp().request('http://127.0.0.1:8787/api/v1/me', {}, localEnv);
  assert.equal(local.status, 200);
  assert.deepEqual(await local.json(), { account: { id: 'local-account' } });
  const missingFlag = await createApp().request('http://127.0.0.1:8787/api/v1/me', {}, { DB: db });
  assert.equal(missingFlag.status, 401);
  const remote = await createApp().request('https://ledger.test/api/v1/me', {}, localEnv);
  assert.equal(remote.status, 401);
  const allowedWrite = await createApp().request('http://127.0.0.1:8787/api/v1/tags', {
    method: 'POST', headers: { Origin: 'http://127.0.0.1:4200', 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'expense', name: '測試', iconName: 'food' }),
  }, localEnv);
  assert.equal(allowedWrite.status, 201);
  const localhostWrite = await createApp().request('http://127.0.0.1:8787/api/v1/tags', {
    method: 'POST', headers: { Origin: 'http://localhost:4200', 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'expense', name: '另一個本機網址', iconName: 'food' }),
  }, localEnv);
  assert.equal(localhostWrite.status, 201);
  const foreignWrite = await createApp().request('http://127.0.0.1:8787/api/v1/tags', {
    method: 'POST', headers: { Origin: 'https://elsewhere.test', 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'expense', name: '不允許', iconName: 'food' }),
  }, localEnv);
  assert.equal(foreignWrite.status, 400);
  db.sql.close();
});

test('標籤新增、查詢、排序、修改、封存與還原', async () => {
  const db = makeDb();
  const first = await call(db, '/api/v1/tags', { method: 'POST',
    body: { kind: 'expense', name: ' 飲食 ', iconName: 'food' } });
  const second = await call(db, '/api/v1/tags', { method: 'POST',
    body: { kind: 'expense', name: '交通', iconName: 'car' } });
  assert.equal(first.status, 201);
  assert.equal(first.data.name, '飲食');
  const id = first.data.id;
  assert.equal((await call(db, `/api/v1/tags?kind=expense`)).data.items.length, 2);
  assert.equal((await call(db, `/api/v1/tags/${id}`)).data.id, id);
  assert.equal((await call(db, `/api/v1/tags/${id}`, { subject: 'subject-b' })).status, 404);
  const order = await call(db, '/api/v1/tags/order', { method: 'PUT',
    body: { kind: 'expense', tagIds: [second.data.id, id] } });
  assert.deepEqual(order.data.items.map((tag) => tag.id), [second.data.id, id]);
  assert.equal((await call(db, '/api/v1/tags/order', { method: 'PUT',
    body: { kind: 'expense', tagIds: [id] } })).status, 409);
  const edited = await call(db, `/api/v1/tags/${id}`, { method: 'PATCH', body: { name: '午餐' } });
  assert.equal(edited.data.name, '午餐');
  assert.ok((await call(db, `/api/v1/tags/${id}/archive`, { method: 'POST' })).data.archivedAtMs);
  assert.equal((await call(db, '/api/v1/tags?kind=expense')).data.items.length, 1);
  assert.equal((await call(db, '/api/v1/tags?kind=expense&includeArchived=true')).data.items.length, 2);
  assert.equal((await call(db, `/api/v1/tags/${id}/restore`, { method: 'POST' })).data.archivedAtMs, null);
  db.sql.close();
});

test('記帳增查改刪、分頁、搜尋與加總', async () => {
  const db = makeDb();
  const tag = (await call(db, '/api/v1/tags', { method: 'POST',
    body: { kind: 'expense', name: '飲食', iconName: 'food' } })).data;
  const base = { kind: 'expense', occurredAtMs: 1790409600000, amountMinor: 12300,
    currencyCode: 'TWD', currencyScale: 2, tagId: tag.id, description: '午餐' };
  assert.equal((await call(db, '/api/v1/entries', { method: 'POST',
    body: { ...base, amountMinor: 0 } })).status, 400);
  const first = await call(db, '/api/v1/entries', { method: 'POST', body: base });
  const second = await call(db, '/api/v1/entries', { method: 'POST',
    body: { ...base, description: '晚餐', amountMinor: 20000 } });
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  const query = `/api/v1/entries?kind=expense&fromMs=1790400000000&toMs=1790500000000`;
  const page = await call(db, `${query}&limit=1`);
  assert.equal(page.data.items.length, 1);
  assert.ok(page.data.nextCursor);
  assert.equal((await call(db, `${query}&limit=1&cursor=${page.data.nextCursor}`)).data.items.length, 1);
  assert.equal((await call(db, `${query}&limit=1&q=x&cursor=${page.data.nextCursor}`)).data.error.code, 'INVALID_CURSOR');
  assert.equal((await call(db, `${query}&q=午餐`)).data.items.length, 1);
  assert.equal((await call(db, `/api/v1/entries/expense/${first.data.id}`)).data.tag.name, '飲食');
  assert.equal((await call(db, `/api/v1/entries/expense/${first.data.id}`, { subject: 'subject-b' })).status, 404);
  const summary = await call(db, `${query.replace('/entries?', '/entries/summary?')}&currencyCode=TWD`);
  assert.equal(summary.data.totalMinor, 32300);
  assert.equal(summary.data.byTag[0].count, 2);
  const updated = await call(db, `/api/v1/entries/expense/${first.data.id}`, { method: 'PUT',
    body: { ...base, amountMinor: 15000, description: '早午餐', kind: undefined } });
  assert.equal(updated.data.amountMinor, 15000);
  assert.equal((await call(db, `/api/v1/entries/expense/${first.data.id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await call(db, `/api/v1/entries/expense/${first.data.id}`, { method: 'DELETE' })).status, 404);
  db.sql.close();
});

test('預算與常用備註完整流程', async () => {
  const db = makeDb();
  assert.equal((await call(db, '/api/v1/budget')).data.budget, null);
  const budget = { amountMinor: 100000, currencyCode: 'TWD', currencyScale: 2,
    cycleDay: 15, showBudget: true };
  assert.equal((await call(db, '/api/v1/budget', { method: 'PUT',
    body: { ...budget, amountMinor: 0 } })).status, 400);
  assert.deepEqual((await call(db, '/api/v1/budget', { method: 'PUT', body: budget })).data.budget, budget);
  assert.equal((await call(db, '/api/v1/budget')).data.budget.cycleDay, 15);
  assert.equal((await call(db, '/api/v1/budget', { method: 'DELETE' })).status, 204);
  assert.equal((await call(db, '/api/v1/budget', { method: 'DELETE' })).status, 204);
  const saved = await call(db, '/api/v1/saved-descriptions', { method: 'POST',
    body: { description: ' 午餐 ' } });
  assert.equal(saved.status, 201);
  assert.equal((await call(db, '/api/v1/saved-descriptions', { method: 'POST',
    body: { description: '午餐' } })).status, 200);
  assert.equal((await call(db, '/api/v1/saved-descriptions')).data.items.length, 1);
  db.sql.prepare(`INSERT INTO tags (account_id, id, kind, name, icon_name, sort_order)
    VALUES ('account-a', 'tag-a', 'expense', '飲食', 'food', 0)`).run();
  const insertEntry = db.sql.prepare(`INSERT INTO ledger_entries
    (account_id, kind, id, occurred_at_ms, amount_minor, currency_code,
     currency_scale, tag_id, description) VALUES ('account-a', 'expense', ?, 1000,
     100, 'TWD', 2, 'tag-a', ?)`);
  insertEntry.run('entry-1', ' 午餐 ');
  insertEntry.run('entry-2', '晚餐');
  insertEntry.run('entry-3', '晚餐');
  assert.deepEqual((await call(db, '/api/v1/saved-descriptions/from-entries',
    { method: 'POST' })).data, { added: 1, alreadyPresent: 1 });
  assert.deepEqual((await call(db, '/api/v1/saved-descriptions/from-entries',
    { method: 'POST' })).data, { added: 0, alreadyPresent: 2 });
  assert.equal((await call(db, '/api/v1/saved-descriptions')).data.items.length, 2);
  assert.equal((await call(db, `/api/v1/saved-descriptions/${saved.data.id}`,
    { method: 'DELETE' })).status, 204);
  assert.equal((await call(db, `/api/v1/saved-descriptions/${saved.data.id}`,
    { method: 'DELETE' })).status, 404);
  assert.equal((await call(db, '/api/v1/budget', { method: 'PUT', body: budget,
    origin: 'https://attacker.test' })).status, 400);
  db.sql.close();
});

test('收入類型、封存標籤與舊零元記帳規則', async () => {
  const db = makeDb();
  const incomeTag = (await call(db, '/api/v1/tags', { method: 'POST',
    body: { kind: 'income', name: '薪資', iconName: 'money' } })).data;
  const expenseTag = (await call(db, '/api/v1/tags', { method: 'POST',
    body: { kind: 'expense', name: '飲食', iconName: 'food' } })).data;
  const base = { kind: 'income', occurredAtMs: 1790409600000, amountMinor: 500000,
    currencyCode: 'TWD', currencyScale: 2, tagId: incomeTag.id, description: '本月' };
  const income = await call(db, '/api/v1/entries', { method: 'POST', body: base });
  assert.equal(income.status, 201);
  assert.equal((await call(db, `/api/v1/entries/expense/${income.data.id}`)).status, 404);
  assert.equal((await call(db, '/api/v1/entries/summary?kind=income&fromMs=1790400000000&toMs=1790500000000&currencyCode=TWD')).data.totalMinor, 500000);
  db.sql.prepare(`INSERT INTO ledger_entries
    (account_id, kind, id, occurred_at_ms, amount_minor, currency_code,
     currency_scale, tag_id, description) VALUES ('account-a', 'expense', 'old-zero',
     1790409600000, 0, 'TWD', 2, ?, '')`).run(expenseTag.id);
  await call(db, `/api/v1/tags/${expenseTag.id}/archive`, { method: 'POST' });
  const update = { occurredAtMs: 1790409600000, amountMinor: 0,
    currencyCode: 'TWD', currencyScale: 2, tagId: expenseTag.id, description: '舊資料' };
  assert.equal((await call(db, '/api/v1/entries/expense/old-zero', { method: 'PUT', body: update })).status, 200);
  assert.equal((await call(db, '/api/v1/entries', { method: 'POST', body: {
    ...base, kind: 'expense', tagId: expenseTag.id,
  } })).status, 400);
  db.sql.close();
});
