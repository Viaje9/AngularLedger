# ChatGPT 記帳查詢 MCP 第一版

狀態：已實作，已通過本機 SDK、SQLite、Wrangler HTTP、瀏覽器授權與打包驗證。尚未部署 MCP Worker、套用遠端 migration 或在 ChatGPT 安裝私人 Plugin。

## 結構

```text
ChatGPT → 公開 MCP Worker /mcp → 已授權的帳本 → 共用既有查詢 SQL → D1
             ↓ OAuth 授權
         既有記帳網站 /oauth/authorize → Cloudflare Access 登入 → 使用者同意
```

MCP 使用獨立 Worker 與既有 D1；既有網站和 `/api/v1/*` 保持 Cloudflare Access 保護。MCP Worker 沒有靜態網站或任何公開記帳 CRUD API。共用查詢路由僅接受伺服器產生的固定 GET URL，模型不能指定 URL、HTTP 方法、SQL 或帳本 ID。

## 工具

| 名稱 | 查詢內容 |
| --- | --- |
| `list_tags` | 收入或支出分類，預設含已封存分類 |
| `search_entries` | 日期、分類、備註包含搜尋；日期或金額排序；每頁 1–100 筆 |
| `get_entry` | 以搜尋取得的 kind 與 id 查單筆 |
| `summarize_entries` | 完整區間總額、筆數、各分類加總，可用 tagId／q 篩選 |

日期固定 `Asia/Taipei`：`startDate` 包含起點，`endDateExclusive` 不包含終點。例如十月使用 `2026-10-01` 到 `2026-11-01`。回應附上時區、日期範圍與 UTC 毫秒。明細另有台北時間字串及保留精度的金額字串；統計以 `amountMinor`／`currencyScale` 解讀，第一版只統計 TWD。`nextCursor` 必須搭配相同查詢條件，不能拿單頁加總代替整個期間總額。

四個工具都標記 `readOnlyHint: true`、`destructiveHint: false`、`openWorldHint: false`。未註冊任何新增、修改、刪除工具。每個 HTTP 請求從有效的權杖確認帳本，並確認它仍綁定原 Access subject。

## 授權規則

- OAuth authorization code + PKCE S256，scope 僅 `ledger:read`。第一版使用事先設定的 public client，不開放 DCR；ChatGPT 設定中填入相同 client ID，無 client secret。
- `redirect_uri` 採完全相符的允許清單；`resource` 必須是 MCP 的完整 `/mcp` 網址。
- 同意頁使用現有 Cloudflare Access 身分，必須按「允許查詢」。POST 檢查同網域 Origin，一次性 consent 綁定已驗證的帳本與使用者。
- consent 有效 10 分鐘，authorization code 有效 5 分鐘且只能兌換一次，access token 有效 1 小時。
- D1 只存上述憑證的 SHA-256 雜湊，不記錄明文權杖；授權碼與 consent 以原子 `DELETE … RETURNING` 消耗。
- 提供 `refresh_token` 與標準 `grant_type=refresh_token`。客戶端在短期權杖過期後可自動換發，不需每天重連。refresh token 每次使用都輪替，期限延長至該次續期後 90 天；連續 90 天未續期才需重新授權。續期只能沿用原 client／resource／`ledger:read` scope。
- 每次授權建立獨立 session。refresh token 只存雜湊，舊 token 雜湊保留在輪替歷史；重用舊 token 會撤銷整個 session 和所有 access token。客戶端需串行續期，並保存回應中的新 refresh token；同時重用或重試已成功消耗的舊 token 也會觸發撤銷。
- 換發 session 與 access token 使用 D1 batch 交易，失敗時回滾。每次續期仍檢查帳本身分，Access subject 變更後不能續期。
- 網站 `/oauth/connections` 可查看有效連接數量並撤銷全部查詢授權；同時撤銷 refresh token、access token 與尚未兌換的 code／consent。此頁仍需要 Cloudflare Access 登入。
- `/oauth/revoke` 支援 access token 或 refresh token，均撤銷整個連接。MCP token 無法通過網站 API 的 Access JWT 驗證。
- MCP Worker 有 Cloudflare Rate Limiting binding：每個 IP 雜湊與帳本各 120 次／60 秒，按 Cloudflare 地區計數，超限回 429／Retry-After。IP 限流用於未登入端點的基礎防護，共用出口可能共用配額；不是精確的全球限額。
- 到期 grant／session 在進入授權頁時清理，續期時也清理同 session 的過期 access token。舊版沒有 refresh token 的權杖可用到原到期時間，需要重新授權一次才取得自動續期能力。部署時不要啟用包含請求本文、授權碼、Bearer token 或記帳內容的自訂日誌。

## 本機使用

```sh
npm run dev:local
# 在另一個終端
npm run dev:mcp:local
```

現有 dev:local 會套用三份 migration；網站 API 在 `127.0.0.1:8787`，MCP 在 `127.0.0.1:8788/mcp`，共用 `.wrangler/local`。本機 OAuth client 為 `ledger-local`，callback 為 `http://127.0.0.1:9999/callback`，只供本機測試；自行啟動 callback listener 或在 MCP Inspector 使用相符 callback。這些 HTTP 與本機身分設定不能部署到遠端。

本次額外 smoke test 使用 `/tmp/angular-ledger-mcp-smoke` 的獨立假帳本與 8797／8798 連接埠，沒有讀取既有本機或遠端私人記帳資料。

## 部署與 ChatGPT 連接

1. 核對 `wrangler.mcp.jsonc` 的 Cloudflare 帳號與 D1 目標。設定使用已核對的 staging D1；不要把它當成新的空白資料庫。匯出備份後，依序套用尚未執行的 `0002_mcp_oauth.sql` 與 `0003_mcp_refresh.sql`。這兩份 migration 只新增 OAuth 表、欄位與索引，不修改記帳紀錄。
2. 為獨立 MCP Worker 選擇穩定 HTTPS 網址；此 Worker 的 `/mcp`、discovery、token、revoke 端點不能被互動式 Cloudflare Access 登入攔截。既有記帳網站的 Access 政策保持原狀。
3. 在網站 Worker 和 MCP Worker 設定完全相同的四個變數：

   | 名稱 | 內容 |
   | --- | --- |
   | `MCP_ORIGIN` | MCP 的 HTTPS origin，沒有路徑，例如選定的 Worker 網域 |
   | `LEDGER_ORIGIN` | 現有、受 Access 保護的網站 HTTPS origin，沒有路徑 |
   | `MCP_CLIENT_ID` | 固定的 public client ID，例如 `angular-ledger-chatgpt` |
   | `MCP_REDIRECT_URIS` | JSON 陣列，放 ChatGPT 連接管理頁實際顯示的完整 callback URI |

   未設定 MCP_ORIGIN 時，新 OAuth 路由回 503；既有網站 API 不受影響。設定錯誤的 origin/client 不會退回未驗證模式。不能猜 callback；本伺服器有 issuer identification，仍需複製該連接頁顯示的確切 URI。

4. 建置／部署網站 Worker，使 `/oauth/authorize` 與 `/oauth/connections` 生效；依 `wrangler.mcp.jsonc` 部署獨立 MCP Worker。GitHub 原有建置只部署網站 Worker，不會自動部署 MCP Worker。此處沒有把遠端 migration 放進 CI。
5. 在 ChatGPT 的 [Plugins](https://chatgpt.com/plugins) 加入 custom MCP server，輸入實際 HTTPS `/mcp` URL，選 OAuth，設定上述 client ID，使用 public client（無 secret）。取得連接頁顯示的 callback，更新允許清單後再完成連接。帳號／workspace 政策需允許 custom MCP。
6. 透過 MCP Inspector 與 ChatGPT 實際驗證登入及同意、四個工具、撤銷後拒絕，再建立私人 Plugin。第一版無須公開上架或另做聊天 UI；ChatGPT 可直接呈現工具結果。

遠端網址、ChatGPT callback、遠端 Access 登入與 Plugin 安裝尚未驗證，因此本次不產生包含猜測網址的安裝包。

## 驗收提問

- 「列出我的支出分類」→ `list_tags`
- 「列出 2026 年 10 月金額最高的十筆支出」→ `search_entries`，`amountDesc`／`limit: 10`
- 「2026 年 10 月咖啡花了多少？」→ `summarize_entries`，先釐清備註關鍵字或分類，顯示使用的篩選
- 「查上一筆記帳的完整內容」→ `get_entry`
- 「比較 2026 年 9 月與 10 月的支出」→ 分別呼叫期間統計
- 「刪除這筆記帳」→ 說明目前只開放查詢，沒有寫入工具

## 已驗證與待驗證

22 組本機測試（16 組 MCP／OAuth、6 組既有 API）覆蓋官方 SDK 初始化、工具 schema／annotation、四個工具、台北日期邊界、分頁、完整／篩選統計、跨帳本隔離、PKCE、單次換碼、拒絕授權、Origin、到期／撤銷／重新綁定、輸入大小與限流；續期測試涵蓋官方 MCP 客戶端遇到 401 自動續期、輪替、重用、併發、撤銷、閒置到期與交易回滾。另以 Wrangler 真實本機 HTTP 驗證 OAuth → MCP → 撤銷，以 Playwright 驗證授權表單到 callback，並通過 Angular 建置及 Cloudflare dry-run 打包。Angular 建置仍有 500 kB 初始 bundle budget 與既有 CommonJS 套件警告。

尚待遠端部署後驗證：Cloudflare Access 的真實登入／POST 身分標頭、ChatGPT OAuth callback 與工具選擇、ChatGPT 實際自動續期，以及私人 Plugin 安裝。SQLite 單元測試與本機 loopback 身分不代表這些遠端驗收已完成。

參考：[OpenAI MCP server](https://developers.openai.com/plugins/build/mcp-server)、[OAuth 授權](https://developers.openai.com/plugins/build/auth)、[連接與測試 Plugin](https://developers.openai.com/plugins/deploy/connect-chatgpt)、[Cloudflare 限流](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)。
