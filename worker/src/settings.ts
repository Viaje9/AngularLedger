import { Hono } from 'hono';
import { z } from 'zod';
import {
  amountSchema, invalid, notFound, parseId, readJson, scaleSchema, twdSchema,
  type AppEnv,
} from './common';

export const settings = new Hono<AppEnv>();
const budgetInput = z.object({
  amountMinor: amountSchema, currencyCode: twdSchema, currencyScale: scaleSchema,
  cycleDay: z.number().int().min(1).max(31).nullable(), showBudget: z.boolean(),
}).strict().refine((value) => !value.showBudget ||
  (value.amountMinor > 0 && value.cycleDay !== null), { path: ['showBudget'] });
const descriptionInput = z.object({ description: z.string() }).strict();

interface BudgetRow {
  amount_minor: number; currency_code: string; currency_scale: number;
  cycle_day: number | null; show_budget: number;
}
interface DescriptionRow { id: string; description: string; created_at_ms: number }

const budgetJson = (row: BudgetRow) => ({
  amountMinor: row.amount_minor, currencyCode: row.currency_code,
  currencyScale: row.currency_scale, cycleDay: row.cycle_day,
  showBudget: row.show_budget === 1,
});
const descriptionJson = (row: DescriptionRow) => ({
  id: row.id, description: row.description, createdAtMs: row.created_at_ms,
});

async function getBudget(db: D1Database, accountId: string) {
  return db.prepare(`SELECT amount_minor, currency_code, currency_scale, cycle_day,
    show_budget FROM budget_settings WHERE account_id = ?`).bind(accountId).first<BudgetRow>();
}

settings.get('/budget', async (c) => {
  const row = await getBudget(c.env.DB, c.get('accountId'));
  return c.json({ budget: row ? budgetJson(row) : null });
});

settings.put('/budget', async (c) => {
  const body = await readJson(c, budgetInput);
  const accountId = c.get('accountId');
  await c.env.DB.prepare(`INSERT INTO budget_settings
    (account_id, amount_minor, currency_code, currency_scale, cycle_day, show_budget)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id) DO UPDATE SET amount_minor = excluded.amount_minor,
      currency_code = excluded.currency_code, currency_scale = excluded.currency_scale,
      cycle_day = excluded.cycle_day, show_budget = excluded.show_budget`)
    .bind(accountId, body.amountMinor, body.currencyCode, body.currencyScale,
      body.cycleDay, body.showBudget ? 1 : 0).run();
  const row = await getBudget(c.env.DB, accountId);
  if (!row) throw new Error('Budget write did not persist');
  return c.json({ budget: budgetJson(row) });
});

settings.delete('/budget', async (c) => {
  await c.env.DB.prepare('DELETE FROM budget_settings WHERE account_id = ?')
    .bind(c.get('accountId')).run();
  return c.body(null, 204);
});

settings.get('/saved-descriptions', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT id, description, created_at_ms
    FROM saved_descriptions WHERE account_id = ?
    ORDER BY created_at_ms DESC, id DESC`).bind(c.get('accountId')).all<DescriptionRow>();
  return c.json({ items: rows.results.map(descriptionJson) });
});

settings.post('/saved-descriptions', async (c) => {
  const body = await readJson(c, descriptionInput);
  const description = body.description.trim();
  if (!description) return invalid('description');
  const accountId = c.get('accountId');
  const id = crypto.randomUUID();
  const result = await c.env.DB.prepare(`INSERT OR IGNORE INTO saved_descriptions
    (account_id, id, description, created_at_ms) VALUES (?, ?, ?, ?)`)
    .bind(accountId, id, description, Date.now()).run();
  const row = await c.env.DB.prepare(`SELECT id, description, created_at_ms FROM saved_descriptions
    WHERE account_id = ? AND description = ?`)
    .bind(accountId, description).first<DescriptionRow>();
  if (!row) throw new Error('Saved description write did not persist');
  return c.json(descriptionJson(row), result.meta.changes ? 201 : 200);
});

settings.post('/saved-descriptions/from-entries', async (c) => {
  const accountId = c.get('accountId');
  const source = `SELECT DISTINCT trim(description) AS description FROM ledger_entries
    WHERE account_id = ? AND kind = 'expense' AND length(trim(description)) > 0`;
  const count = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM (${source})`)
    .bind(accountId).first<{ total: number }>();
  const result = await c.env.DB.prepare(`INSERT OR IGNORE INTO saved_descriptions
    (account_id, id, description, created_at_ms)
    SELECT ?, lower(hex(randomblob(16))), source.description, ? FROM (${source}) AS source`)
    .bind(accountId, Date.now(), accountId).run();
  const added = result.meta.changes;
  return c.json({ added, alreadyPresent: Math.max(0, (count?.total ?? 0) - added) });
});

settings.delete('/saved-descriptions/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const result = await c.env.DB.prepare(`DELETE FROM saved_descriptions
    WHERE account_id = ? AND id = ?`).bind(c.get('accountId'), id).run();
  if (!result.meta.changes) notFound();
  return c.body(null, 204);
});
