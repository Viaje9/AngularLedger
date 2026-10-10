-- 每次授權建立獨立連接；只存 refresh token 雜湊，輪替歷史用於偵測重用。
CREATE TABLE mcp_oauth_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  access_subject TEXT NOT NULL,
  client_id TEXT NOT NULL,
  resource TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope = 'ledger:read'),
  refresh_hash TEXT UNIQUE NOT NULL,
  expires_at_ms INTEGER NOT NULL
);
CREATE INDEX idx_mcp_sessions_expiry ON mcp_oauth_sessions(expires_at_ms);
ALTER TABLE mcp_oauth_grants ADD COLUMN session_id TEXT REFERENCES mcp_oauth_sessions(id) ON DELETE CASCADE;
CREATE INDEX idx_mcp_grants_session ON mcp_oauth_grants(session_id);
CREATE TABLE mcp_oauth_refresh_history (
  token_hash TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES mcp_oauth_sessions(id) ON DELETE CASCADE
);
