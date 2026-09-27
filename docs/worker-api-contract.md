# Worker API 契約草案

狀態：**API 設計說明**。端點與資料格式已寫入 [OpenAPI 規格](../openapi/openapi.yaml)，Hey API 已產生 Angular client，Hono Worker 已部署到測試環境。這份文件保留規則與設計理由；Cloudflare Access 登入已在測試環境驗證，完整讀寫流程仍待驗證。資料欄位見 [D1 資料表草案](d1-schema-draft.md)，舊資料範圍見 [Firestore 資料稽核](firestore-data-audit.md)。

## 共通約定

- API 前綴為 `/api/v1`，與 Angular 網站同網域。請求和有內容的回應使用 `application/json`、`camelCase` 欄位；所有 API 回應加上 `Cache-Control: no-store`。
- 瀏覽器使用 Cloudflare Access 登入後的同網域 Cookie 呼叫 API。前端**不傳** `accountId`、Firebase UID、電子郵件或自行指定的 Access 身分。Worker 從已驗證身分找到唯一的 D1 `accounts.id`，每筆查詢與寫入都以此值限定範圍。
- 此部署會讓 Worker 同時提供靜態資產與 `/api/*`。Cloudflare 文件指出，這種靜態資產配置下使用者 Worker 取不到 `ctx.access`；因此 API 從 `Cf-Access-Jwt-Assertion` 取得 Access JWT，驗證簽章、`iss`、`aud`、有效時間及非空的使用者 `sub`，再查 `accounts.access_subject`。拒絕沒有使用者 `sub` 的服務權杖。首次將舊帳本綁定到 `sub` 由管理腳本人工核對，不提供公開的「認領帳本」API。若 Access 使用者被移除再重建，`sub` 可能改變，須重新人工綁定。[Cloudflare Worker 靜態資產與 Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)、[Access JWT 驗證](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)、[Access `sub` 說明](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/)
- 本機只用測試身分與測試資料檢查 Worker 的授權邏輯；`wrangler dev` 的 Access 身分模擬不能當成這種靜態資產部署的端到端驗證。真實登入、Access 政策與 JWT 標頭必須在受 Access 保護的 Cloudflare 測試網址檢查，通過後才接真實資料。[Cloudflare 本機模擬說明](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)、[靜態資產的 `ctx.access` 限制](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
- 有本文的寫入請求只接受 JSON；所有寫入請求檢查同網域 `Origin`。API 不開放跨網域 CORS。未通過驗證的請求不得讀取 D1。前端不直接讀取或保存 Access JWT。
- `id` 是不透明字串。新增標籤、記帳和常用備註時由 Worker 產生；匯入程式另行保留舊 Firestore 文件 ID。API 不允許前端指定 `id`。
- 金額一律是安全整數 `amountMinor`，搭配 `currencyCode`（三碼大寫）和 `currencyScale`（0–6）。例如 TWD 123.45 是 `12345`、`TWD`、`2`。第一版畫面與預算只使用 TWD；新記帳寫入目前只接受 `TWD`、`2`。日後增加幣別時再擴充允許清單與統計規則。
- 時間一律是 UTC Unix epoch **毫秒整數** `occurredAtMs`。區間參數 `fromMs` 含起點、`toMs` 不含終點，且 `fromMs < toMs`。Angular 依使用者所在時區算出一天或一個預算週期的邊界，再傳給 API；Worker 不用瀏覽器傳入的日期字串猜時區。
- 成功的新增回應 `201`，讀取和更新回應 `200`，刪除回應 `204` 且沒有本文。單筆查詢找不到，或該資料屬於其他帳本，一律回 `404`。

## 端點一覽

| 方法與路徑 | 用途 |
| --- | --- |
| `GET /api/v1/me` | 確認登入身分已綁定帳本。 |
| `GET /api/v1/tags?kind=expense` | 列出未封存標籤；可加 `includeArchived=true`。 |
| `GET /api/v1/tags/{id}` | 取得單一標籤，包含已封存者。 |
| `POST /api/v1/tags` | 新增標籤。 |
| `PATCH /api/v1/tags/{id}` | 修改名稱與圖示。 |
| `PUT /api/v1/tags/order` | 一次更新同類型未封存標籤的順序。 |
| `POST /api/v1/tags/{id}/archive` | 封存標籤，保留歷史記帳關聯。 |
| `POST /api/v1/tags/{id}/restore` | 還原標籤，排到同類型標籤最後。 |
| `GET /api/v1/entries` | 依類型、日期、標籤和備註查詢記帳。 |
| `GET /api/v1/entries/summary` | 取得期間總額及各標籤加總；預算與統計共用。 |
| `GET /api/v1/entries/{kind}/{id}` | 取得單筆記帳。 |
| `POST /api/v1/entries` | 新增收入或支出。 |
| `PUT /api/v1/entries/{kind}/{id}` | 完整更新單筆記帳。 |
| `DELETE /api/v1/entries/{kind}/{id}` | 刪除單筆記帳。 |
| `GET /api/v1/budget` | 取得預算設定。 |
| `PUT /api/v1/budget` | 建立或完整更新預算設定。 |
| `DELETE /api/v1/budget` | 清除預算設定。 |
| `GET /api/v1/saved-descriptions` | 列出常用備註。 |
| `POST /api/v1/saved-descriptions` | 新增常用備註；文字已存在則回原資料。 |
| `POST /api/v1/saved-descriptions/from-entries` | 使用者主動從既有支出備註補入常用清單。 |
| `DELETE /api/v1/saved-descriptions/{id}` | 移除常用備註，不更動記帳。 |

`kind` 僅可為 `expense` 或 `income`。URL 中的 `{id}` 需編碼；伺服器必須依已驗證帳本範圍查找，不可只靠 `id` 查詢。

## 身分

`GET /api/v1/me` 成功時回：

```json
{"account":{"id":"account_01"}}
```

JWT 有效但尚未綁定帳本時回 `403 ACCOUNT_NOT_LINKED`。Angular 可顯示設定中狀態；綁定由管理腳本完成，不由此端點建立帳本。

## 標籤

標籤 JSON 使用以下格式；`archivedAtMs` 未封存時為 `null`：

```json
{"id":"tag_01","kind":"expense","name":"飲食","iconName":"fas fa-utensils","sortOrder":0,"archivedAtMs":null}
```

- `GET /tags` 必須傳 `kind`；預設只列未封存標籤，依 `sortOrder`、`id` 升冪。回應為 `{"items":[...標籤]}`。`includeArchived=true` 時先列未封存標籤，再列已封存標籤；歷史畫面也可直接讀單一標籤。
- `POST /tags` 本文為 `{"kind":"expense","name":"飲食","iconName":"fas fa-utensils"}`；名稱去除前後空白後不得為空，`sortOrder` 由伺服器設為該類型最後。回傳新標籤。
- `PATCH /tags/{id}` 本文可含 `name`、`iconName`，至少一項；`kind` 與 `id` 不能改。回傳修改後標籤。
- `PUT /tags/order` 本文為 `{"kind":"expense","tagIds":["tag_02","tag_01"]}`；必須恰好包含該帳本此類型**所有未封存**標籤，不能重複或加入其他帳本的 ID。以單一交易依陣列順序寫入 `sortOrder = 0, 1, ...`；回 `{"items":[...排序後標籤]}`。清單過期或不完整回 `409 TAG_ORDER_CONFLICT`。
- `POST /tags/{id}/archive` 設定 `archivedAtMs`；重複封存回既有結果。封存後不能指定給新記帳，既有記帳仍能查到標籤名稱。`POST /tags/{id}/restore` 清空封存時間並排到最後；重複還原回既有結果。

## 記帳

單筆記帳回應包含查詢時組合的標籤資訊：

```json
{
  "id":"entry_01",
  "kind":"expense",
  "occurredAtMs":1790409600000,
  "amountMinor":12300,
  "currencyCode":"TWD",
  "currencyScale":2,
  "tagId":"tag_01",
  "description":"午餐",
  "tag":{"id":"tag_01","kind":"expense","name":"飲食","iconName":"fas fa-utensils","sortOrder":0,"archivedAtMs":null}
}
```

- `GET /entries` 必填 `kind`、`fromMs`、`toMs`。可選 `tagId`、`q`（備註文字，去除前後空白後做區分大小寫的包含搜尋）、`sort`（`dateDesc`、`dateAsc`、`amountDesc`、`amountAsc`；預設 `dateDesc`）、`limit`（預設 50、上限 100）、`cursor`。回 `{"items":[...記帳],"nextCursor":null}`；若仍有下一頁，`nextCursor` 為不透明字串。相同金額或時間以 `id` 固定排序；cursor 只能沿用相同篩選及排序條件，否則回 `400 INVALID_CURSOR`。第一版查詢範圍中的記帳均為 TWD；日後新增多幣別時，金額排序須先限定幣別。
- `GET /entries/summary` 必填 `kind`、`fromMs`、`toMs`、`currencyCode`。第一版 `currencyCode` 只接受 `TWD`。回應範例：

```json
{
  "kind":"expense",
  "currencyCode":"TWD",
  "currencyScale":2,
  "totalMinor":12300,
  "count":1,
  "byTag":[{"tagId":"tag_01","tagName":"飲食","archivedAtMs":null,"totalMinor":12300,"count":1}]
}
```

沒有資料時 `totalMinor`、`count` 為 0，`byTag` 為空陣列。預算畫面取支出 `totalMinor`，依現有週期與每日剩餘算法在 Angular 計算；統計畫面使用 `byTag`，點開標籤明細再用 `GET /entries?tagId=...` 分頁查詢。

- `POST /entries` 本文如下；`description` 可為空字串。`amountMinor` 新增時須大於 0；舊資料匯入的零元支出仍可讀取和編輯其他欄位。指定的標籤必須屬於同帳本、同 `kind` 且未封存。回 `201` 與完整單筆記帳。

```json
{"kind":"expense","occurredAtMs":1790409600000,"amountMinor":12300,"currencyCode":"TWD","currencyScale":2,"tagId":"tag_01","description":"午餐"}
```

- `PUT /entries/{kind}/{id}` 送出上例除 `kind` 外的全部欄位，回完整記帳；URL 的 `kind` 不能改，資料不存在時回 `404`。舊資料若原本是零元，且 `amountMinor` 未變，仍可修改其他欄位；其他寫入要求金額大於 0。若原標籤已封存且 `tagId` 沒變，仍可修改日期、金額或備註；換標籤時必須選未封存標籤。`DELETE` 永久刪除該筆記帳，回 `204`；再次刪除回 `404`。舊資料匯入直接寫 D1，不透過這個新增 API。

## 預算與常用備註

`GET /budget` 回 `{"budget":null}` 或下列物件。`PUT /budget` 的本文直接傳預算物件，例如 `{"amountMinor":100000,"currencyCode":"TWD","currencyScale":2,"cycleDay":15,"showBudget":true}`；採完整覆蓋，回 `{"budget":...}`。第一版固定 `TWD`／`2`；`amountMinor >= 0`，`cycleDay` 為 `null` 或 1–31，`showBudget` 為布林值。只有金額大於 0 且已選週期起始日，才能設 `showBudget=true`。`DELETE /budget` 回 `204`，再次清除也回 `204`。

```json
{"budget":{"amountMinor":100000,"currencyCode":"TWD","currencyScale":2,"cycleDay":15,"showBudget":true}}
```

預算週期與顯示算法沿用目前 Angular 畫面；金額傳輸使用 TWD 最小單位。舊瀏覽器與舊 Firestore `setting` 的預算資料不由這組 API 自動匯入。

`GET /saved-descriptions` 回 `{"items":[...備註]}`，依 `createdAtMs`、`id` 由新到舊排序。Angular 可在本機記憶體中依目前畫面的包含搜尋方式過濾，不再寫 `localStorage`。

```json
{"items":[{"id":"desc_01","description":"午餐","createdAtMs":1790409600000}]}
```

`POST /saved-descriptions` 本文為 `{"description":"午餐"}`；伺服器去除前後空白後不可為空。同帳本已有完全相同文字時，回 `200` 與原物件；新增時回 `201` 與新物件。`DELETE /saved-descriptions/{id}` 回 `204`，再次刪除回 `404`；不修改既有記帳的 `description`。

設定頁的「儲存支出備註」使用 `POST /saved-descriptions/from-entries`，不需本文。Worker 只讀取目前帳本 D1 中非空白的支出備註，去除前後空白、排除重複，**只新增**尚未存在的常用備註，不刪除原有清單；回 `{"added":12,"alreadyPresent":5}`。重複執行不會建立重複文字。這是使用者主動操作，不會在 Firestore 搬遷時自動執行，也不讀取舊瀏覽器 `localStorage`。

## 錯誤格式

Worker 產生的錯誤一律為：

```json
{"error":{"code":"INVALID_INPUT","message":"金額格式不正確","details":{"field":"amountMinor"}}}
```

| HTTP 狀態 | `code` 範例 | 意義 |
| --- | --- | --- |
| 400 | `INVALID_INPUT`、`INVALID_CURSOR` | 欄位、日期區間或查詢參數錯誤。 |
| 401 | `UNAUTHENTICATED` | Access JWT 缺失、無效或過期。Access 也可能在請求到 Worker 前先導向登入頁。 |
| 403 | `ACCOUNT_NOT_LINKED` | JWT 有效，但尚未綁定 D1 帳本。 |
| 404 | `NOT_FOUND` | 資源不存在或不屬於目前帳本。 |
| 409 | `TAG_ORDER_CONFLICT`、`DUPLICATE_RESOURCE` | 排序清單過期或其他資料衝突。 |
| 413 | `PAYLOAD_TOO_LARGE` | 請求本文過大。 |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | 寫入請求不是 JSON。 |
| 500 | `INTERNAL_ERROR` | 非預期伺服器錯誤；回應不包含堆疊或資料庫細節。 |

前端只依穩定的 `code` 做流程判斷，`message` 用於顯示。Worker 不回傳其他帳本是否存在，也不將 Access JWT、完整記帳資料或敏感欄位寫入一般請求紀錄。

## 與現有畫面的對照

| 現有流程 | 新 API |
| --- | --- |
| `AuthService` 登入狀態 | Cloudflare Access 保護網站；`GET /me` 確認帳本綁定。 |
| 每日收支與編輯 | `GET /entries` 日期區間、`GET/POST/PUT/DELETE /entries`。 |
| 標籤管理及拖曳排序 | `GET/POST/PATCH /tags`、`PUT /tags/order`、封存與還原。 |
| 搜尋及統計 | `GET /entries` 篩選／分頁、`GET /entries/summary` 加總。 |
| 預算週期及剩餘金額 | `GET/PUT /budget`、支出 `GET /entries/summary`。 |
| 常用備註及「儲存支出備註」 | `GET/POST/DELETE /saved-descriptions`、`POST /saved-descriptions/from-entries`。 |

推播、離線寫入同步及舊瀏覽器資料搬遷不在這份 API 契約內。本機 API 測試與測試網站登入、讀取已驗證；完整讀寫流程仍需在受 Access 保護的網站檢查。
