-- 討論草案：尚未作為 Wrangler migration，也未套用至 D1。
-- access_subject 由 Worker 從已驗證的 Cloudflare Access 身分取得。
CREATE TABLE accounts (
  id TEXT NOT NULL PRIMARY KEY,
  access_subject TEXT UNIQUE,
  legacy_firebase_uid TEXT UNIQUE
);

CREATE TABLE tags (
  account_id TEXT NOT NULL,
  id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  archived_at_ms INTEGER,
  PRIMARY KEY (account_id, id),
  UNIQUE (account_id, id, kind),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

CREATE INDEX idx_tags_list
  ON tags(account_id, kind, archived_at_ms, sort_order, id);

CREATE TABLE ledger_entries (
  account_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
  id TEXT NOT NULL,
  occurred_at_ms INTEGER NOT NULL CHECK (typeof(occurred_at_ms) = 'integer'),
  amount_minor INTEGER NOT NULL CHECK (typeof(amount_minor) = 'integer' AND amount_minor >= 0),
  currency_code TEXT NOT NULL CHECK (length(currency_code) = 3 AND currency_code = upper(currency_code)),
  currency_scale INTEGER NOT NULL CHECK (currency_scale BETWEEN 0 AND 6),
  tag_id TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (account_id, kind, id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
  FOREIGN KEY (account_id, tag_id, kind)
    REFERENCES tags(account_id, id, kind) ON DELETE RESTRICT
);

CREATE INDEX idx_ledger_entries_by_date
  ON ledger_entries(account_id, kind, occurred_at_ms, id);

-- 沒有這筆資料代表尚未設定預算；新版由 API 讀寫，不再以 localStorage 為資料來源。
-- 第一版預算只使用 TWD（currency_scale = 2），保留既有預算週期與計算方式。
CREATE TABLE budget_settings (
  account_id TEXT NOT NULL PRIMARY KEY,
  amount_minor INTEGER NOT NULL CHECK (typeof(amount_minor) = 'integer' AND amount_minor >= 0),
  currency_code TEXT NOT NULL CHECK (length(currency_code) = 3 AND currency_code = upper(currency_code)),
  currency_scale INTEGER NOT NULL CHECK (currency_scale BETWEEN 0 AND 6),
  cycle_day INTEGER CHECK (cycle_day BETWEEN 1 AND 31),
  show_budget INTEGER NOT NULL DEFAULT 0 CHECK (show_budget IN (0, 1)),
  CHECK (show_budget = 0 OR (amount_minor > 0 AND cycle_day IS NOT NULL)),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

-- 常用備註是獨立於記帳紀錄的個人清單。
CREATE TABLE saved_descriptions (
  account_id TEXT NOT NULL,
  id TEXT NOT NULL,
  description TEXT NOT NULL CHECK (length(trim(description)) > 0),
  created_at_ms INTEGER NOT NULL CHECK (typeof(created_at_ms) = 'integer'),
  PRIMARY KEY (account_id, id),
  UNIQUE (account_id, description),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
);

CREATE INDEX idx_saved_descriptions_recent
  ON saved_descriptions(account_id, created_at_ms DESC, id);
