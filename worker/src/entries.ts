import { Hono } from 'hono';
import { z } from 'zod';
import {
  ApiError, amountSchema, entryJson, entrySelect, epochSchema, idSchema,
  invalid, kindSchema, notFound, parseId, parseKind, queryInteger,
  readJson, safeAmount, scaleSchema, twdSchema,
  type AppEnv, type EntryRow, type Kind,
} from './common';

export const entries = new Hono<AppEnv>();
const entryCreate = z.object({
  kind: kindSchema, occurredAtMs: epochSchema,
  amountMinor: amountSchema.min(1), currencyCode: twdSchema,
  currencyScale: scaleSchema, tagId: idSchema, description: z.string(),
}).strict();
const entryUpdate = entryCreate.omit({ kind: true }).extend({ amountMinor: amountSchema });
const sorts = ['dateDesc', 'dateAsc', 'amountDesc', 'amountAsc'] as const;
type Sort = typeof sorts[number];

async function getEntry(db: D1Database, accountId: string, kind: Kind, id: string): Promise<EntryRow> {
  const row = await db.prepare(`${entrySelect} WHERE e.account_id = ? AND e.kind = ? AND e.id = ?`)
    .bind(accountId, kind, id).first<EntryRow>();
  return row ?? notFound();
}

async function assertTag(db: D1Database, accountId: string, kind: Kind, tagId: string): Promise<void> {
  const row = await db.prepare(`SELECT 1 FROM tags WHERE account_id = ? AND kind = ?
    AND id = ? AND archived_at_ms IS NULL`).bind(accountId, kind, tagId).first();
  if (!row) invalid('tagId', '請選擇未封存的同類型標籤');
}

function encodeCursor(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeCursor(raw: string, filter: string): { value: number; id: string } {
  if (raw.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(raw)) {
    throw new ApiError(400, 'INVALID_CURSOR', '分頁游標無效');
  }
  try {
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== 'object') throw new Error();
    const parsed = data as { filter?: unknown; value?: unknown; id?: unknown };
    if (parsed.filter !== filter || !Number.isSafeInteger(parsed.value) || (parsed.value as number) < 0 ||
        typeof parsed.id !== 'string' || !parsed.id) throw new Error();
    return { value: parsed.value as number, id: parsed.id };
  } catch {
    throw new ApiError(400, 'INVALID_CURSOR', '分頁游標無效');
  }
}

function period(query: URLSearchParams) {
  const fromMs = queryInteger(query, 'fromMs')!;
  const toMs = queryInteger(query, 'toMs')!;
  if (fromMs >= toMs) invalid('toMs', '結束時間必須晚於開始時間');
  return { fromMs, toMs };
}

entries.get('/entries/summary', async (c) => {
  const query = new URL(c.req.url).searchParams;
  const kind = parseKind(query.get('kind') ?? undefined);
  const { fromMs, toMs } = period(query);
  if (query.get('currencyCode') !== 'TWD') invalid('currencyCode');
  const accountId = c.get('accountId');
  const args = [accountId, kind, fromMs, toMs, 'TWD'];
  const totals = await c.env.DB.prepare(`SELECT COALESCE(SUM(amount_minor), 0) AS total_minor,
    COUNT(*) AS count FROM ledger_entries WHERE account_id = ? AND kind = ?
    AND occurred_at_ms >= ? AND occurred_at_ms < ? AND currency_code = ?`)
    .bind(...args).first<{ total_minor: number; count: number }>();
  const rows = await c.env.DB.prepare(`SELECT e.tag_id, t.name AS tag_name,
    t.archived_at_ms, SUM(e.amount_minor) AS total_minor, COUNT(*) AS count
    FROM ledger_entries e JOIN tags t ON t.account_id = e.account_id
      AND t.id = e.tag_id AND t.kind = e.kind
    WHERE e.account_id = ? AND e.kind = ? AND e.occurred_at_ms >= ?
      AND e.occurred_at_ms < ? AND e.currency_code = ?
    GROUP BY e.tag_id, t.name, t.archived_at_ms
    ORDER BY total_minor DESC, e.tag_id`).bind(...args).all<{
      tag_id: string; tag_name: string; archived_at_ms: number | null;
      total_minor: number; count: number;
    }>();
  return c.json({
    kind, currencyCode: 'TWD', currencyScale: 2,
    totalMinor: safeAmount(totals?.total_minor ?? 0), count: totals?.count ?? 0,
    byTag: rows.results.map((row) => ({
      tagId: row.tag_id, tagName: row.tag_name, archivedAtMs: row.archived_at_ms,
      totalMinor: safeAmount(row.total_minor), count: row.count,
    })),
  });
});

entries.get('/entries', async (c) => {
  const query = new URL(c.req.url).searchParams;
  const kind = parseKind(query.get('kind') ?? undefined);
  const { fromMs, toMs } = period(query);
  const tagId = query.get('tagId') || undefined;
  if (query.has('tagId') && !tagId) invalid('tagId');
  const q = query.get('q')?.trim() || undefined;
  if (q && q.length > 200) invalid('q');
  const sortRaw = query.get('sort') ?? 'dateDesc';
  if (!sorts.includes(sortRaw as Sort)) invalid('sort');
  const sort = sortRaw as Sort;
  const limit = queryInteger(query, 'limit', false) ?? 50;
  if (limit < 1 || limit > 100) invalid('limit');
  const filter = JSON.stringify({ kind, fromMs, toMs, tagId, q, sort, limit });
  const cursorRaw = query.get('cursor');
  const cursor = cursorRaw ? decodeCursor(cursorRaw, filter) : undefined;
  if (query.has('cursor') && !cursor) {
    throw new ApiError(400, 'INVALID_CURSOR', '分頁游標無效');
  }
  const field = sort.startsWith('amount') ? 'e.amount_minor' : 'e.occurred_at_ms';
  const direction = sort.endsWith('Asc') ? 'ASC' : 'DESC';
  const comparator = direction === 'ASC' ? '>' : '<';
  const where = ['e.account_id = ?', 'e.kind = ?', 'e.occurred_at_ms >= ?', 'e.occurred_at_ms < ?'];
  const args: (string | number)[] = [c.get('accountId'), kind, fromMs, toMs];
  if (tagId) { where.push('e.tag_id = ?'); args.push(tagId); }
  if (q) { where.push('instr(e.description, ?) > 0'); args.push(q); }
  if (cursor) {
    where.push(`(${field} ${comparator} ? OR (${field} = ? AND e.id > ?))`);
    args.push(cursor.value, cursor.value, cursor.id);
  }
  const rows = await c.env.DB.prepare(`${entrySelect} WHERE ${where.join(' AND ')}
    ORDER BY ${field} ${direction}, e.id ASC LIMIT ?`)
    .bind(...args, limit + 1).all<EntryRow>();
  const hasMore = rows.results.length > limit;
  const page = rows.results.slice(0, limit);
  const last = page.at(-1);
  const value = last && (field === 'e.amount_minor' ? last.amount_minor : last.occurred_at_ms);
  return c.json({
    items: page.map(entryJson),
    nextCursor: hasMore && last ? encodeCursor({ filter, value, id: last.id }) : null,
  });
});

entries.post('/entries', async (c) => {
  const body = await readJson(c, entryCreate);
  const accountId = c.get('accountId');
  await assertTag(c.env.DB, accountId, body.kind, body.tagId);
  const id = crypto.randomUUID();
  const result = await c.env.DB.prepare(`INSERT INTO ledger_entries
    (account_id, kind, id, occurred_at_ms, amount_minor, currency_code,
     currency_scale, tag_id, description)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS
      (SELECT 1 FROM tags WHERE account_id = ? AND kind = ? AND id = ?
       AND archived_at_ms IS NULL)`)
    .bind(accountId, body.kind, id, body.occurredAtMs, body.amountMinor,
      body.currencyCode, body.currencyScale, body.tagId, body.description,
      accountId, body.kind, body.tagId).run();
  if (!result.meta.changes) invalid('tagId', '請選擇未封存的同類型標籤');
  return c.json(entryJson(await getEntry(c.env.DB, accountId, body.kind, id)), 201);
});

entries.get('/entries/:kind/:id', async (c) => {
  const kind = parseKind(c.req.param('kind'));
  const id = parseId(c.req.param('id'));
  return c.json(entryJson(await getEntry(c.env.DB, c.get('accountId'), kind, id)));
});

entries.put('/entries/:kind/:id', async (c) => {
  const kind = parseKind(c.req.param('kind'));
  const id = parseId(c.req.param('id'));
  const body = await readJson(c, entryUpdate);
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const existing = await getEntry(db, accountId, kind, id);
  if (body.amountMinor === 0 && existing.amount_minor !== 0) invalid('amountMinor');
  if (body.tagId !== existing.tag_id) await assertTag(db, accountId, kind, body.tagId);
  const result = await db.prepare(`UPDATE ledger_entries SET occurred_at_ms = ?, amount_minor = ?,
    currency_code = ?, currency_scale = ?, tag_id = ?, description = ?
    WHERE account_id = ? AND kind = ? AND id = ?
      AND (tag_id = ? OR EXISTS
        (SELECT 1 FROM tags WHERE account_id = ? AND kind = ? AND id = ?
         AND archived_at_ms IS NULL))`)
    .bind(body.occurredAtMs, body.amountMinor, body.currencyCode,
      body.currencyScale, body.tagId, body.description, accountId, kind, id,
      body.tagId, accountId, kind, body.tagId).run();
  if (!result.meta.changes) {
    await getEntry(db, accountId, kind, id);
    invalid('tagId', '請選擇未封存的同類型標籤');
  }
  return c.json(entryJson(await getEntry(db, accountId, kind, id)));
});

entries.delete('/entries/:kind/:id', async (c) => {
  const kind = parseKind(c.req.param('kind'));
  const id = parseId(c.req.param('id'));
  const result = await c.env.DB.prepare(`DELETE FROM ledger_entries
    WHERE account_id = ? AND kind = ? AND id = ?`)
    .bind(c.get('accountId'), kind, id).run();
  if (!result.meta.changes) notFound();
  return c.body(null, 204);
});
