import { Hono } from 'hono';
import { z } from 'zod';
import {
  ApiError, invalid, kindSchema, notFound, parseId, parseKind,
  queryBoolean, readJson, tagJson, type AppEnv, type TagRow,
} from './common';

export const tags = new Hono<AppEnv>();
const tagCreate = z.object({ kind: kindSchema, name: z.string(), iconName: z.string() }).strict();
const tagPatch = z.object({ name: z.string().optional(), iconName: z.string().optional() })
  .strict().refine((value) => value.name !== undefined || value.iconName !== undefined);
const tagOrder = z.object({ kind: kindSchema, tagIds: z.array(z.string().min(1)) }).strict();

async function getTag(db: D1Database, accountId: string, id: string): Promise<TagRow> {
  const row = await db.prepare(`SELECT id, kind, name, icon_name, sort_order, archived_at_ms
    FROM tags WHERE account_id = ? AND id = ?`).bind(accountId, id).first<TagRow>();
  return row ?? notFound();
}

async function list(db: D1Database, accountId: string, kind: string, includeArchived = false) {
  const where = includeArchived ? '' : 'AND archived_at_ms IS NULL';
  const rows = await db.prepare(`SELECT id, kind, name, icon_name, sort_order, archived_at_ms
    FROM tags WHERE account_id = ? AND kind = ? ${where}
    ORDER BY (archived_at_ms IS NOT NULL), sort_order, id`).bind(accountId, kind).all<TagRow>();
  return rows.results.map(tagJson);
}

tags.get('/tags', async (c) => {
  const query = new URL(c.req.url).searchParams;
  const kind = parseKind(query.get('kind') ?? undefined);
  const includeArchived = queryBoolean(query, 'includeArchived');
  return c.json({ items: await list(c.env.DB, c.get('accountId'), kind, includeArchived) });
});

tags.post('/tags', async (c) => {
  const body = await readJson(c, tagCreate);
  const name = body.name.trim();
  if (!name) return invalid('name');
  const id = crypto.randomUUID();
  const accountId = c.get('accountId');
  await c.env.DB.prepare(`INSERT INTO tags (account_id, id, kind, name, icon_name, sort_order, archived_at_ms)
    VALUES (?, ?, ?, ?, ?,
      (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM tags
       WHERE account_id = ? AND kind = ? AND archived_at_ms IS NULL), NULL)`)
    .bind(accountId, id, body.kind, name, body.iconName, accountId, body.kind).run();
  return c.json(tagJson(await getTag(c.env.DB, accountId, id)), 201);
});

tags.put('/tags/order', async (c) => {
  const body = await readJson(c, tagOrder);
  if (new Set(body.tagIds).size !== body.tagIds.length) return invalid('tagIds');
  const db = c.env.DB;
  const accountId = c.get('accountId');
  const current = await list(db, accountId, body.kind);
  if (current.length !== body.tagIds.length ||
      !body.tagIds.every((id) => current.some((tag) => tag.id === id))) {
    throw new ApiError(409, 'TAG_ORDER_CONFLICT', '標籤清單已變更，請重新整理');
  }
  if (body.tagIds.length) {
    const cases = body.tagIds.map(() => 'WHEN ? THEN ?').join(' ');
    const slots = body.tagIds.map(() => '?').join(', ');
    const caseBindings = body.tagIds.flatMap((id, index) => [id, index]);
    // 單一 UPDATE 保證整組排序原子性；子查詢防止讀取後標籤集合變動。
    const result = await db.prepare(`UPDATE tags SET sort_order = CASE id ${cases} END
      WHERE account_id = ? AND kind = ? AND archived_at_ms IS NULL
        AND (SELECT COUNT(*) FROM tags WHERE account_id = ? AND kind = ? AND archived_at_ms IS NULL) = ?
        AND (SELECT COUNT(*) FROM tags WHERE account_id = ? AND kind = ?
             AND archived_at_ms IS NULL AND id IN (${slots})) = ?`)
      .bind(...caseBindings, accountId, body.kind, accountId, body.kind, body.tagIds.length,
        accountId, body.kind, ...body.tagIds, body.tagIds.length).run();
    if (result.meta.changes !== body.tagIds.length) {
      throw new ApiError(409, 'TAG_ORDER_CONFLICT', '標籤清單已變更，請重新整理');
    }
  }
  return c.json({ items: await list(db, accountId, body.kind) });
});

tags.get('/tags/:id', async (c) =>
  c.json(tagJson(await getTag(c.env.DB, c.get('accountId'), parseId(c.req.param('id'))))));

tags.patch('/tags/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const body = await readJson(c, tagPatch);
  const accountId = c.get('accountId');
  await getTag(c.env.DB, accountId, id);
  const columns: string[] = [];
  const values: string[] = [];
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return invalid('name');
    columns.push('name = ?'); values.push(name);
  }
  if (body.iconName !== undefined) {
    columns.push('icon_name = ?'); values.push(body.iconName);
  }
  await c.env.DB.prepare(`UPDATE tags SET ${columns.join(', ')} WHERE account_id = ? AND id = ?`)
    .bind(...values, accountId, id).run();
  return c.json(tagJson(await getTag(c.env.DB, accountId, id)));
});

tags.post('/tags/:id/archive', async (c) => {
  const id = parseId(c.req.param('id'));
  const accountId = c.get('accountId');
  await getTag(c.env.DB, accountId, id);
  await c.env.DB.prepare(`UPDATE tags SET archived_at_ms = ?
    WHERE account_id = ? AND id = ? AND archived_at_ms IS NULL`)
    .bind(Date.now(), accountId, id).run();
  return c.json(tagJson(await getTag(c.env.DB, accountId, id)));
});

tags.post('/tags/:id/restore', async (c) => {
  const id = parseId(c.req.param('id'));
  const accountId = c.get('accountId');
  await getTag(c.env.DB, accountId, id);
  await c.env.DB.prepare(`UPDATE tags SET archived_at_ms = NULL,
    sort_order = (SELECT COALESCE(MAX(other.sort_order), -1) + 1 FROM tags AS other
                  WHERE other.account_id = tags.account_id AND other.kind = tags.kind
                    AND other.archived_at_ms IS NULL)
    WHERE account_id = ? AND id = ? AND archived_at_ms IS NOT NULL`)
    .bind(accountId, id).run();
  return c.json(tagJson(await getTag(c.env.DB, accountId, id)));
});
