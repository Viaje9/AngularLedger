#!/usr/bin/env node
// Read a bounded Firestore window and generate a D1 SQL file. This script never writes to Firestore or D1.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { openSync, writeFileSync, closeSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const match = /^--([a-z-]+)=(.+)$/.exec(arg);
  if (!match) throw new Error(`Invalid argument: ${arg}`);
  return [match[1], match[2]];
}));
for (const key of ['uid', 'email', 'account-id', 'start', 'end', 'out']) {
  if (!args[key]) throw new Error(`Missing --${key}`);
}
if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(args.start)
  || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(args.end)
  || !(Date.parse(args.start) < Date.parse(args.end))) {
  throw new Error('Start and end must be ordered UTC timestamps without fractional seconds');
}
if (!/^[A-Za-z0-9_-]+$/.test(args.uid) || !/^[0-9a-f-]{36}$/.test(args['account-id'])) {
  throw new Error('Invalid UID or account ID');
}

const project = 'angular-ledger';
const database = '(default)';
const parent = `projects/${project}/databases/${database}/documents/users/${args.uid}`;
const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
if (!token) throw new Error('No Google Cloud access token');

async function firestore(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!response.ok) throw new Error(`Firestore request failed (${response.status}): ${url.split('?')[0]}`);
  return response.json();
}

function documentId(document, collectionId) {
  const prefix = `${parent}/${collectionId}/`;
  if (!document.name?.startsWith(prefix)) throw new Error(`Unexpected ${collectionId} document path`);
  const id = document.name.slice(prefix.length);
  if (!id || id.includes('/')) throw new Error(`Invalid ${collectionId} document ID`);
  return id;
}

function field(document, name, type) {
  const value = document.fields?.[name]?.[type];
  if (typeof value !== 'string') throw new Error(`Missing ${name}.${type} in ${document.name}`);
  return value;
}

function sqlString(value) {
  if (typeof value !== 'string' || value.includes('\0')) throw new Error('Invalid SQL string');
  return `'${value.replaceAll("'", "''")}'`;
}

function timestampMs(value) {
  const fraction = /\.(\d+)(?:Z|[+-]\d\d:\d\d)$/.exec(value)?.[1] ?? '';
  if ([...fraction.slice(3)].some((digit) => digit !== '0')) {
    throw new Error(`Timestamp is more precise than milliseconds: ${value}`);
  }
  const ms = Date.parse(value);
  if (!Number.isSafeInteger(ms) || ms < Date.parse(args.start) || ms >= Date.parse(args.end)) {
    throw new Error(`Timestamp outside requested range: ${value}`);
  }
  return ms;
}

async function list(collectionId) {
  const documents = [];
  let pageToken;
  do {
    const url = new URL(`https://firestore.googleapis.com/v1/${parent}/${collectionId}`);
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const page = await firestore(url);
    documents.push(...(page.documents ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return documents;
}

async function queryWindow(collectionId) {
  const filter = (op, timestampValue) => ({ fieldFilter: {
    field: { fieldPath: 'date' }, op, value: { timestampValue },
  } });
  const response = await firestore(`https://firestore.googleapis.com/v1/${parent}:runQuery`, {
    method: 'POST',
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId }],
      where: { compositeFilter: { op: 'AND', filters: [
        filter('GREATER_THAN_OR_EQUAL', args.start),
        filter('LESS_THAN', args.end),
      ] } },
    } }),
  });
  if (!Array.isArray(response)) throw new Error('Unexpected Firestore runQuery response');
  if (response.some((row) => row.skippedResults)) throw new Error('Firestore skipped results');
  return response.flatMap((row) => row.document ? [row.document] : []);
}

const user = await firestore(`https://firestore.googleapis.com/v1/${parent}`);
if (field(user, 'email', 'stringValue').toLowerCase() !== args.email.toLowerCase()) {
  throw new Error('Firebase UID does not match the expected email');
}

const tags = (await list('tags')).map((document) => {
  const kind = field(document, 'transactionType', 'stringValue');
  if (!['expense', 'income'].includes(kind)) throw new Error(`Invalid tag kind in ${document.name}`);
  const order = Number(field(document, 'sort', 'integerValue'));
  if (!Number.isSafeInteger(order)) throw new Error(`Invalid tag sort in ${document.name}`);
  const name = field(document, 'tagName', 'stringValue');
  const icon = field(document, 'tagIconName', 'stringValue');
  if (!name.trim() || !icon.trim()) throw new Error(`Invalid tag in ${document.name}`);
  return { id: documentId(document, 'tags'), kind, name, icon, order };
});
const tagById = new Map();
for (const tag of tags) {
  if (tagById.has(tag.id)) throw new Error(`Duplicate tag ID: ${tag.id}`);
  tagById.set(tag.id, tag);
}

const entries = [];
for (const [collectionId, kind] of [['expenseList', 'expense'], ['incomeList', 'income']]) {
  for (const document of await queryWindow(collectionId)) {
    const id = documentId(document, collectionId);
    const tagId = field(document, 'tagId', 'stringValue');
    if (tagById.get(tagId)?.kind !== kind) throw new Error(`Missing or mismatched tag for ${kind}/${id}`);
    const price = field(document, 'price', 'stringValue');
    if (!/^(0|[1-9]\d*)$/.test(price)) throw new Error(`Invalid price for ${kind}/${id}`);
    const amountMinor = BigInt(price) * 100n;
    if (amountMinor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`Unsafe price for ${kind}/${id}`);
    const date = timestampMs(field(document, 'date', 'timestampValue'));
    entries.push({ id, kind, date, amountMinor: Number(amountMinor), tagId,
      description: field(document, 'description', 'stringValue') });
  }
}
const entryKeys = new Set();
for (const entry of entries) {
  const key = `${entry.kind}/${entry.id}`;
  if (entryKeys.has(key)) throw new Error(`Duplicate entry ID: ${key}`);
  entryKeys.add(key);
}

tags.sort((a, b) => a.kind.localeCompare(b.kind) || a.order - b.order || a.id.localeCompare(b.id));
entries.sort((a, b) => a.date - b.date || a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
const q = sqlString;
const accountId = q(args['account-id']);
const lines = [
  '-- Generated from read-only Firestore queries; do not commit this file.',
  `UPDATE accounts SET legacy_firebase_uid = ${q(args.uid)} WHERE id = ${accountId} AND legacy_firebase_uid IS NULL;`,
  ...tags.map((tag) => `INSERT INTO tags (account_id, id, kind, name, icon_name, sort_order, archived_at_ms) VALUES (${accountId}, ${q(tag.id)}, ${q(tag.kind)}, ${q(tag.name)}, ${q(tag.icon)}, ${tag.order}, NULL);`),
  ...entries.map((entry) => `INSERT INTO ledger_entries (account_id, kind, id, occurred_at_ms, amount_minor, currency_code, currency_scale, tag_id, description) VALUES (${accountId}, ${q(entry.kind)}, ${q(entry.id)}, ${entry.date}, ${entry.amountMinor}, 'TWD', 2, ${q(entry.tagId)}, ${q(entry.description)});`),
];
const sql = `${lines.join('\n')}\n`;
const fd = openSync(args.out, 'wx', 0o600);
try { writeFileSync(fd, sql); } finally { closeSync(fd); }

const totalMinor = entries.reduce((sum, entry) => sum + BigInt(entry.amountMinor), 0n);
const summary = {
  sourceProject: project,
  sourceUid: args.uid,
  accountId: args['account-id'],
  start: args.start,
  endExclusive: args.end,
  tags: tags.length,
  expenseEntries: entries.filter((entry) => entry.kind === 'expense').length,
  incomeEntries: entries.filter((entry) => entry.kind === 'income').length,
  referencedTags: new Set(entries.map((entry) => entry.tagId)).size,
  totalMinor: totalMinor.toString(),
  sqlSha256: createHash('sha256').update(sql).digest('hex'),
  output: args.out,
};
console.log(JSON.stringify(summary, null, 2));
