# Worker 開發與部署準備

目前已實作 [OpenAPI 規格](../openapi/openapi.yaml)列出的 21 個操作。Angular 畫面已改用 Hey API 產生的 client 呼叫 Worker API，預算與常用備註也改存 D1。前端已移除 AngularFire、Firebase 設定與 FCM。登入狀態由 `GET /api/v1/me` 確認，正式登入及登出由 Cloudflare Access 處理。

## 本機指令

```sh
npm ci
npm run dev:local
```

- 開啟 `http://127.0.0.1:4200` 或 `http://localhost:4200`。這個指令會先對獨立的本機 D1 套用 migration、建立 `local-account` 測試帳號，再啟動 Angular 開發伺服器與 Hono Worker；Angular 的 `/api/**` 會代理至本機 Worker。按 `Ctrl+C` 停止兩個服務。
- 本機資料保存在忽略版控的 `.wrangler/local/`，重開後仍在；啟動指令不會連到 Cloudflare staging D1，也不會自動複製正式或測試站的私人資料。若手動匯入資料，資料只存於本機 D1。第一次進站會由 `/api/v1/me` 直接取得本機測試帳號，無須 Cloudflare Access。這是本機測試登入，不能驗證真實 Access 登入流程。
- 本機 API 只綁定 `127.0.0.1:8787`，Angular 只綁定 `127.0.0.1:4200`。本機測試登入只在 Worker 收到 loopback HTTP 請求，且啟動指令注入指定測試身分時啟用；部署用的 `wrangler.jsonc` 不含這項設定。
- 需要分開啟動時，先執行 `npm run db:migrate:local` 和 `npm run db:seed:local`，再在兩個終端執行 `npm run dev:api:local`、`npm run dev:web:local`。
- `api:generate` 由 OpenAPI 規格重建 `src/app/api/generated/`；不要手動修改產生檔。
- `api:test` 使用 Node 22 內建 SQLite 與測試身分檢查 Hono 路由、SQL 和帳本隔離；它不是 Cloudflare Access 的真實登入測試。
- `npm run build` 與 `build:cloudflare` 都使用根目錄 base href，供 Wrangler 靜態資產設定使用。
- `npm run ci:cloudflare` 依序檢查 Worker 型別、執行 API 測試並建置 Angular；Cloudflare Builds 會執行這個指令，成功後才部署 Worker。

## Cloudflare 測試環境

### 自動建置與部署

現有的 staging Worker 已透過 Cloudflare Workers Builds 連接 GitHub 的 `Viaje9/AngularLedger`。目前只有 `codex/cloudflare-migration` 分支的推送會觸發這個 Worker 的正式建置；Cloudflare 先執行 `npm run ci:cloudflare`，成功後執行 `npx wrangler deploy`。根目錄設為 `/`，其他分支的 Preview builds 已關閉，避免預覽版與現有 D1 共用資料。

建置使用儲存庫的 `.nvmrc` 指定 Node 22；Cloudflare 的自動依賴安裝會依鎖檔安裝套件。Worker 的 Access secrets 與 D1 binding 保持在 Cloudflare；建置不需要 Firebase 設定。D1 migrations 不在部署時自動執行，若將來調整資料表，須先核對備份並另行套用 migration。

GitHub `master` 尚未切到這套部署；舊 GitHub Pages workflow 已在遷移分支移除，合併前不要把 `master` 的推送當成 Cloudflare 部署。

先前在錯誤帳號建立的 Worker 與 D1 已刪除。核對 Cloudflare 帳號後，已建立測試 D1、套用 `0001_init.sql` 並部署測試網站。部署目標由 `wrangler.jsonc` 指定；操作前仍應確認目前的 Wrangler 登入帳號。

Cloudflare Access 已保護測試 Worker 的正式與預覽網址，只允許指定帳號使用 One-time PIN 登入，工作階段為 24 小時。Worker 已設定 `ACCESS_TEAM_DOMAIN` 與 `ACCESS_AUD` secrets。未登入時，首頁和 `/api/v1/me` 均導向 Access 登入頁。實際帳號、應用程式 ID、團隊網域與秘密值不記錄在此文件。

首次登入後已核對 Access 身分並建立測試帳本，設定 `accounts.access_subject`；身分與帳本的實際 ID 不記錄在此文件。

本分支已停用 Angular Service Worker；部署後，新版前端啟動時會移除同網域既有的 `/ngsw-worker.js` 註冊及 `ngsw:/:` 快取。這只影響離線資產快取，不會清除記帳資料。登入與登出網址暫時保留 `ngsw-bypass`，讓尚未載入新版的瀏覽器仍能經網路通過 Access。

### 最近 10 天試匯入

先以台灣時間最近 10 天為範圍，唯讀查詢已核對帳號的 `expenseList`、`incomeList` 和 `tags`。寫入前已保留完整 Firestore 備份，並匯出空白測試 D1；備份路徑不記錄在可公開的文件。舊 Firestore 資料沒有更動。

使用 [匯入轉換腳本](../scripts/import-firestore-window.mjs)產生 D1 SQL，先在本機 SQLite 套用 migration、檢查金額與外鍵，再匯入遠端測試 D1。遠端 D1 的筆數、金額與日期範圍均與來源相符，外鍵檢查沒有錯誤；受 Access 保護的網站也已讀到試匯入資料。此處不記錄個人記帳筆數、金額或日期。

這次是小範圍功能試匯入，不能代表完整資料量的查詢效能。匯入 SQL 含私人記帳內容，不應提交到 Git。

### 完整歷史資料匯入

依使用者確認，只搬遷目前已綁定 Cloudflare Access 的帳號；其他帳號不匯入此帳本。先唯讀分頁列舉完整來源，匯出測試 D1 備份，並確認先前試匯入的資料與來源逐筆相同。

從完整 Firestore 來源產生差異 SQL，只補入缺少的記帳資料。先在本機 SQLite 套用至 D1 備份，確認筆數、金額與外鍵，再寫入遠端。寫入後重新匯出遠端 D1，逐筆比對帳本、標籤和記帳資料，均與來源一致，外鍵檢查沒有錯誤。舊 Firestore 資料未更動；受 Access 保護的網站也已顯示較早年份的記帳資料。舊瀏覽器的預算與常用備註不在這次搬遷範圍。

此次匯入的 SQL、來源資料與 D1 匯出檔含私人記帳內容，只存放在本機私人暫存目錄，均不得提交至 Git。完整記帳資料已可用於測試效能；正式切換、主要讀寫流程與實際速度仍須另外驗證。

## 測試環境仍待完成

1. 在受 Access 保護的測試網址驗證新增標籤、記帳、設定預算等完整讀寫流程；未綁定帳本 `403` 與跨帳本 `404` 目前只由本機 API 測試覆蓋。
2. 使用完整歷史資料驗證搜尋、統計與畫面速度，再規劃正式切換；目前已完成個人帳號的完整記帳資料匯入。

本機 Worker 測試 5 組、Angular Karma 測試 5 組在前一階段已通過。本次登入導覽修改通過 Cloudflare 前端建置，且遠端已驗證未登入導向 Access、One-time PIN 登入和帳本綁定後進入支出總覽；完整記帳讀寫流程仍待驗證。
