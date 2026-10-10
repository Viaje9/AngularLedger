-- OAuth 狀態與權杖只保存 SHA-256 雜湊；不改動記帳資料。
CREATE TABLE mcp_oauth_grants (
  token_hash TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('consent', 'code', 'access')),
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  access_subject TEXT NOT NULL,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  resource TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope = 'ledger:read'),
  code_challenge TEXT NOT NULL,
  state TEXT NOT NULL,
  expires_at_ms INTEGER NOT NULL
);
CREATE INDEX idx_mcp_oauth_expiry ON mcp_oauth_grants(expires_at_ms);
