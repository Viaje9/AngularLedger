import type { Context } from 'hono';
import { z } from 'zod';

export interface Bindings {
  DB: D1Database;
  ASSETS: Fetcher;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  LOCAL_DEV_SUBJECT?: string;
  LOCAL_DEV_ORIGIN?: string;
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: { accountId: string };
};

export type ApiCode =
  | 'INVALID_INPUT' | 'INVALID_CURSOR' | 'UNAUTHENTICATED'
  | 'ACCOUNT_NOT_LINKED' | 'NOT_FOUND' | 'TAG_ORDER_CONFLICT'
  | 'DUPLICATE_RESOURCE' | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE' | 'INTERNAL_ERROR';

export class ApiError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 500,
    readonly code: ApiCode,
    message: string,
    readonly details?: Record<string, string>,
  ) { super(message); }
}

export const invalid = (field: string, message = '欄位格式不正確'): never => {
  throw new ApiError(400, 'INVALID_INPUT', message, { field });
};
export const notFound = (): never => { throw new ApiError(404, 'NOT_FOUND', '資料不存在'); };

const safeInt = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const kindSchema = z.enum(['expense', 'income']);
export type Kind = z.infer<typeof kindSchema>;
export const idSchema = z.string().min(1);
export const epochSchema = safeInt;
export const amountSchema = safeInt;
export const twdSchema = z.literal('TWD');
export const scaleSchema = z.literal(2);

export function parseKind(value: string | undefined): Kind {
  const result = kindSchema.safeParse(value);
  return result.success ? result.data : invalid('kind');
}

export function parseId(value: string | undefined): string {
  const result = idSchema.safeParse(value);
  return result.success ? result.data : notFound();
}

export function queryInteger(params: URLSearchParams, name: string, required = true): number | undefined {
  const raw = params.get(name);
  if (raw === null && !required) return undefined;
  if (raw === null || !/^(0|[1-9]\d*)$/.test(raw)) return invalid(name);
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) return invalid(name);
  return value;
}

export function queryBoolean(params: URLSearchParams, name: string): boolean {
  const raw = params.get(name);
  if (raw === null || raw === 'false') return false;
  if (raw === 'true') return true;
  return invalid(name);
}

export async function readJson<T extends z.ZodType>(c: Context<AppEnv>, schema: T): Promise<z.output<T>> {
  const type = c.req.header('content-type') ?? '';
  if (!/^application\/json(?:\s*;|\s*$)/i.test(type)) {
    throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', '請使用 JSON');
  }
  const declaredLength = Number(c.req.header('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 64 * 1024) {
    throw new ApiError(413, 'PAYLOAD_TOO_LARGE', '請求內容過大');
  }
  let source: string;
  try { source = await c.req.text(); }
  catch { return invalid('body'); }
  if (new TextEncoder().encode(source).length > 64 * 1024) {
    throw new ApiError(413, 'PAYLOAD_TOO_LARGE', '請求內容過大');
  }
  let body: unknown;
  try { body = JSON.parse(source); }
  catch { return invalid('body', 'JSON 格式不正確'); }
  const result = schema.safeParse(body);
  if (!result.success) {
    return invalid(result.error.issues[0]?.path.join('.') || 'body');
  }
  return result.data;
}

export function safeAmount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ApiError(500, 'INTERNAL_ERROR', '金額超出安全範圍');
  }
  return value;
}

export interface TagRow {
  id: string; kind: Kind; name: string; icon_name: string;
  sort_order: number; archived_at_ms: number | null;
}

export const tagJson = (r: TagRow) => ({
  id: r.id, kind: r.kind, name: r.name, iconName: r.icon_name,
  sortOrder: r.sort_order, archivedAtMs: r.archived_at_ms,
});

export interface EntryRow {
  id: string; kind: Kind; occurred_at_ms: number; amount_minor: number;
  currency_code: string; currency_scale: number; tag_id: string;
  description: string; tag_name: string; tag_icon_name: string;
  tag_sort_order: number; tag_archived_at_ms: number | null;
}

export const entryJson = (r: EntryRow) => ({
  id: r.id, kind: r.kind, occurredAtMs: r.occurred_at_ms,
  amountMinor: r.amount_minor, currencyCode: r.currency_code,
  currencyScale: r.currency_scale, tagId: r.tag_id, description: r.description,
  tag: {
    id: r.tag_id, kind: r.kind, name: r.tag_name,
    iconName: r.tag_icon_name, sortOrder: r.tag_sort_order,
    archivedAtMs: r.tag_archived_at_ms,
  },
});

export const entrySelect = `SELECT e.id, e.kind, e.occurred_at_ms, e.amount_minor,
  e.currency_code, e.currency_scale, e.tag_id, e.description,
  t.name AS tag_name, t.icon_name AS tag_icon_name,
  t.sort_order AS tag_sort_order, t.archived_at_ms AS tag_archived_at_ms
  FROM ledger_entries e JOIN tags t
    ON t.account_id = e.account_id AND t.id = e.tag_id AND t.kind = e.kind`;
