# AngularLedger 遷移至 Cloudflare

更新日期：2026-09-27

## 目標與範圍

這是個人使用的記帳網站。目標是讓 Angular 前端、登入保護、API 與資料庫都能在不依賴 Firebase 的情況下運作，最後部署到 Cloudflare。開發與核對期間保留目前的 Firebase 資料與線上網站，不提前切換正式流量。

預定架構：Angular 靜態網站由 Cloudflare Workers 提供；同一個 Worker 處理 `/api/*`；記帳資料存於 D1；Cloudflare Access 在 Cloudflare 上保護網站與 API。API 採規格先行：以 OpenAPI 檔案定義請求與回應，Hey API 依規格產生前端型別與呼叫程式，Worker 使用 Hono 實作端點。瀏覽器不直接呼叫 Access API 登入；Access 先檢查登入與授權，再把請求交給 Worker。Worker 應驗證 Access JWT，從已驗證身分判定資料擁有者，不接受瀏覽器傳來的使用者 ID 作為授權依據。本機可測 Worker 的資料與授權邏輯；Access 真實登入流程須在受 Access 保護的測試網址驗證。

## API 技術選擇

已決定採用 **OpenAPI + Hey API + Hono**，依下列順序實作：

1. 將 [Worker API 契約草案](worker-api-contract.md)寫成 `openapi/openapi.yaml`，以 OpenAPI 規格作為前後端共同的 API 契約。
2. 使用 **Hey API** 從規格產生 Angular 要用的 TypeScript 型別與 API client；產生的檔案不手動修改。已升級至 Angular 19／TypeScript 5.8 並通過產生碼的正式建置。
3. 使用 **Hono** 在 Cloudflare Worker 實作 `/api/v1/*` 路由、輸入驗證與錯誤回應，並接上 Access 身分驗證和 D1。實作及契約測試須對照 OpenAPI 規格。

Hey API 負責產生呼叫端程式碼，不會替 Worker 實作資料庫操作或登入驗證。

## 目前狀態

- 工作分支：`codex/cloudflare-migration`。
- Firestore 預設資料庫已完成完整匯出，作業回報 `SUCCESSFUL`；備份位置不記錄在可公開的文件。已確認匯出檔存在，尚未做還原測試。
- 已完成線上 Firestore 唯讀稽核；舊支出金額、日期與標籤關聯的檢查結果見 [Firestore 資料稽核](firestore-data-audit.md)。這不是匯出檔的逐筆比對。
- 此匯出不包含 Firebase Authentication 帳號及瀏覽器 `localStorage`。Firestore 的原生匯出格式也不能直接當成 D1 匯入檔。
- 舊版 Angular 原先直接使用 Firebase Auth、Firestore、FCM 與離線快取，預算與常用備註存於 `localStorage`。新版前端已移除這些依賴，舊線上網站與 Firebase 資料目前仍保留。
- Angular 已升級至 19.2，TypeScript 已升級至 5.8；Hey API 已依 [OpenAPI 規格](../openapi/openapi.yaml)產生 Angular client。標籤、每日收支、搜尋、統計、預算與常用備註畫面已改接 Worker API，Cloudflare 前端建置通過；已在受 Access 保護的測試網址驗證每日收支讀取，完整讀寫流程仍待驗證。
- Hono Worker 已實作規格中的 21 個 API 操作，包含 Access JWT 驗證與 D1 帳本隔離；[D1 migration](../migrations/0001_init.sql)已在本機套用，API 測試 5 組通過，Wrangler dry-run 打包通過。本機未登入請求實測回 401。設定與指令見 [Worker 開發與部署準備](worker-setup.md)。
- 先前誤部署帳號中的空白測試 D1 與 Worker 已刪除。已在正確的 Cloudflare 帳號建立測試 D1、套用建表 migration、部署測試網站，並設定 Access 只允許指定帳號登入。已在真實登入後綁定帳本，先試匯入最近 10 天，再補入這個帳號的全部歷史記帳資料；遠端 D1 匯出檔已與 Firestore 來源逐筆比對一致。其他帳號未匯入。核對方式見 [Worker 開發與部署準備](worker-setup.md#完整歷史資料匯入)。主要讀寫流程、效能與正式切換仍待驗證。

## 執行順序

### 1. 定義資料與 API 契約

盤點 `users/{uid}/tags`、`expenseList`、`incomeList` 的欄位與實際資料。設計 D1 的帳本、標籤、收支、預算設定及常用備註資料表，保留舊文件 ID 與標籤關聯，明確規定日期、金額、排序及時區的表示方式。列出 Angular 畫面需要的查詢與操作，將 API 格式整理成 [OpenAPI 規格](../openapi/openapi.yaml)；每個操作明列參數、請求本文、成功與錯誤回應。此階段只處理本機檔案，不改動雲端資料。

資料表設計理由見 [D1 資料表草案](d1-schema-draft.md)，API 格式見 [OpenAPI 規格](../openapi/openapi.yaml)，設計理由見 [Worker API 設計說明](worker-api-contract.md)；收入與支出共用一張表、標籤改封存，以及新版預算與常用備註存 D1 已確認。舊記帳資料全部是 TWD；第一版預算沿用現有 TWD 計算方式。正式 migration 已套用至測試 D1。

完成條件：資料欄位與轉換規則可對照現有 Firestore 文件；OpenAPI 規格涵蓋標籤封存、收支讀寫、預算設定與常用備註管理，以及區間統計所需資料；規格可通過驗證並由 Hey API 產生型別與 client。規格確立後以它作為 API 的主要契約，Markdown 文件保留設計理由與搬遷說明。

### 2. 建立 Worker 與 D1

加入 D1 migration、Hono Worker API 和本機開發設定。Hono 依 OpenAPI 規格實作路由；Hey API 只產生 client 與型別，不會自動實作 D1 查詢、Access 驗證或 Worker 端點。API 的輸入驗證與契約測試須對照 OpenAPI 規格。本機以測試身分與測試資料驗證 API 授權邏輯，這不等於 Cloudflare Access 真實登入。Worker 的最小版本完成後，先部署到 Cloudflare 測試網址並啟用 Access，只允許指定身分進入；在測試網址實際登入，確認 Worker 收到並驗證 Access JWT，再確認未登入者和未綁定帳本者無法讀取資料。其後完成標籤、收支、預算及常用備註 API；標籤排序的批次更新須維持一致性。測試階段不匯入真實記帳資料。

完成條件：本機 D1 可從空資料庫建立；API 的主要讀寫流程與權限檢查可驗證，錯誤能回傳清楚的狀態。Cloudflare 測試網址另已實際驗證 Access 登入、JWT 驗證與帳本隔離。

### 3. 改寫 Angular 資料存取

先確認 Hey API 產生器、client 與此專案 Angular／TypeScript 版本的相容性，再由 OpenAPI 規格產生前端程式碼；產物不手改。讓 `LedgerService` 使用產生的 API client，將 Firestore `Timestamp` 與文件快照型別移出畫面和 model。替換登入狀態與登出流程，逐步移除 AngularFire、Firebase 設定及 FCM 程式。調整原本依賴 `getDocsFromCache` 的查詢，避免頁面只讀到舊快取或空資料。

完成條件：標籤管理、每日收支、編輯刪除、搜尋、統計、預算及常用備註相關畫面可從新 API 正常使用；建置產物不再依賴 Firebase。

### 4. 匯入與核對資料

先保留 Firestore 原始備份，再產生可供 D1 匯入的轉換資料。建立舊 Firebase UID 與新登入身分的明確對應，不能只憑電子郵件猜測。匯入時保留文件 ID，將舊記帳幣別設為 TWD，逐項核對使用者、標籤、收入與支出的筆數、日期、金額及關聯。舊瀏覽器的預算和常用備註由使用者另外處理，不列入這次搬遷；新版由空資料開始設定。也確認是否需要另存 Firebase Authentication 帳號資料。

完成條件：新舊資料的筆數與抽樣內容一致；能用新身分看到原本的個人資料；搬遷失敗時仍可回到原系統。

### 5. 部署與切換

調整目前為 GitHub Pages 設定的 `/AngularLedger/` base path 和部署工作流程。沿用步驟 2 建立的 Cloudflare 測試網址部署完整版本，驗證重新整理深層路由、登入、API、手機畫面及主要記帳流程，再切換正式網址。切換後觀察錯誤與資料差異，確認穩定後才移除 Firebase 相關資源。

完成條件：正式網站可以完整操作，資料核對完成，且部署及還原步驟已有紀錄。

## 切換前仍需決定

- **離線操作**：目前 Firestore 有本機快取。第一版是否只支援連線使用，或需要離線新增／修改及重新連線同步？Angular 的靜態 PWA 快取本身不等於資料同步。
- **通知**：是否仍需要推播？若需要，須另設計不依賴 FCM 的 Web Push；不需要則移除該功能。
- **既有本機資料**：新版的預算與常用備註改存 D1。舊瀏覽器資料由使用者另外處理，不在這次搬遷範圍；更換網址後，原網址的 `localStorage` 不會自動出現在新網址。

## 參考資料

- [Cloudflare Workers 部署 Angular](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/angular/)
- [Workers 的單頁應用程式路由](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Cloudflare Access 保護 Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Hey API OpenAPI 產生器](https://heyapi.dev/docs/openapi/typescript/get-started)
- [Hey API Angular client](https://heyapi.dev/docs/openapi/typescript/clients/angular)
- [Angular 版本相容表](https://angular.dev/reference/versions)
- [Firestore 官方匯出說明](https://firebase.google.com/docs/firestore/manage-data/export-import)
