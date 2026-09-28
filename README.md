
AngularLedger 是個人記帳網站。新版前端使用 Angular 19，透過 Hey API 產生的 client 呼叫 Cloudflare Worker 上的 Hono API，資料存於 D1。舊 Firebase 資料仍保留，正式切換與資料搬遷尚未完成。

## 本機啟動

使用 Node 22，執行 `npm ci` 後以 `npm run dev:local` 啟動 Angular、Hono Worker 與本機 D1，開啟 `http://127.0.0.1:4200`。本機使用獨立的測試帳號與資料庫，不需 Cloudflare Access；詳見[本機開發說明](docs/worker-setup.md#本機指令)。

## 專案文件

- [Cloudflare 遷移計畫](docs/cloudflare-migration-plan.md)
- [D1 資料表草案](docs/d1-schema-draft.md)
- [Worker API 設計說明](docs/worker-api-contract.md)
- [OpenAPI 規格](openapi/openapi.yaml)
- [Worker 開發與部署準備](docs/worker-setup.md)
