# D1 資料表草案

狀態：**資料設計說明**。原始草案在 [`db/schema.draft.sql`](../db/schema.draft.sql)，正式初版 migration 在 [`migrations/0001_init.sql`](../migrations/0001_init.sql)。migration 已套用到本機與 Cloudflare 測試 D1。

已確認：收入與支出共用 `ledger_entries`，以 `kind` 區分；刪除標籤改為封存。新版的預算與常用備註存 D1，不再以瀏覽器 `localStorage` 為資料來源。舊記帳資料全部是 TWD；第一版預算沿用現行 TWD 計算方式。金額以整數最小單位及幣別代碼表示；[線上 Firestore 稽核](firestore-data-audit.md)已檢查舊資料的數值與標籤關聯。舊瀏覽器預算與常用備註的搬遷由使用者另外處理，不在這次範圍內。

## 資料來源與用途

| 表 | 對應目前資料 | 主要用途 |
| --- | --- | --- |
| `accounts` | `users/{uid}` 的身分對應 | 將 Cloudflare Access 身分連到一份個人帳本；保留舊 Firebase UID 供匯入核對。 |
| `tags` | `users/{uid}/tags/{id}` | 保存收支類型、名稱、圖示與排序。 |
| `ledger_entries` | `users/{uid}/expenseList/{id}` 與 `incomeList/{id}` | 統一儲存收入和支出，以 `kind` 區分。 |
| `budget_settings` | 新版對應目前瀏覽器的 `budgetAmount`、`selectedDate`、`showBudget`；舊值不在本次匯入 | 新版預算設定，每個帳本最多一筆。 |
| `saved_descriptions` | 新版對應目前瀏覽器的 `keepDescItems`；舊清單不在本次匯入 | 新版常用備註清單。 |

## 欄位清單

下表列的是 **D1 草案實際會儲存的欄位**。`TEXT` 是文字，`INTEGER` 是整數；「可空」表示建立帳本或資料搬遷時，該值可以暫時不存在。

### `accounts`：帳本與登入身分

| D1 欄位 | 型別／可空 | 來源或用途 |
| --- | --- | --- |
| `id` | `TEXT`，不可空；主鍵 | 新系統的帳本 ID，由搬遷程序建立。它不等於 Firebase UID 或電子郵件。 |
| `access_subject` | `TEXT`，可空；不可重複 | Cloudflare Access 驗證後的使用者識別；首次綁定前可以為空。 |
| `legacy_firebase_uid` | `TEXT`，可空；不可重複 | 舊 `users/{uid}` 路徑中的 `uid`，用於匯入與核對。 |

### `tags`：收入／支出標籤

| D1 欄位 | 型別／可空 | 來源或用途 |
| --- | --- | --- |
| `account_id` | `TEXT`，不可空；複合主鍵之一 | 指向 `accounts.id`，標示這個標籤屬於哪份帳本。 |
| `id` | `TEXT`，不可空；複合主鍵之一 | 舊 `tags/{id}` 的文件 ID；新標籤也需產生 ID。 |
| `kind` | `TEXT`，不可空 | 舊 `transactionType`；只允許 `expense` 或 `income`。 |
| `name` | `TEXT`，不可空 | 舊 `tagName`，畫面顯示的標籤名稱。 |
| `icon_name` | `TEXT`，不可空 | 舊 `tagIconName`，例如畫面使用的圖示 class 名稱。 |
| `sort_order` | `INTEGER`，不可空 | 舊 `sort`，控制同類型標籤的顯示順序。 |
| `archived_at_ms` | `INTEGER`，可空 | 新增欄位；未封存為空，封存時記錄 Unix epoch 毫秒。 |

`(account_id, id)` 是主鍵；同一個帳本內不能有兩個相同 ID 的標籤。

### `ledger_entries`：收入與支出

| D1 欄位 | 型別／可空 | 來源或用途 |
| --- | --- | --- |
| `account_id` | `TEXT`，不可空；複合主鍵之一 | 指向 `accounts.id`，標示這筆記帳屬於哪份帳本。 |
| `kind` | `TEXT`，不可空；複合主鍵之一 | 由來源 collection 決定：`expenseList` → `expense`，`incomeList` → `income`。 |
| `id` | `TEXT`，不可空；複合主鍵之一 | 舊收支文件 ID；新記帳也需產生 ID。 |
| `occurred_at_ms` | `INTEGER`，不可空 | 舊 `date`（Firestore `Timestamp`）換算為 Unix epoch 毫秒，用於日期排序和區間查詢。 |
| `amount_minor` | `INTEGER`，不可空；不得小於 0 | 以該筆記帳指定的小數位換算後的整數金額。舊資料幣別已確認為 TWD，匯入前仍須檢查 `price` 數值。 |
| `currency_code` | `TEXT`，不可空 | 這筆記帳的三碼幣別代碼，例如 `TWD`、`JPY`、`USD`。 |
| `currency_scale` | `INTEGER`，不可空 | 這筆記帳採用的小數位數，例如 0、2、3；與金額一起保存，避免日後規則變更時無法解讀舊資料。 |
| `tag_id` | `TEXT`，不可空 | 舊 `tagId`，指向同帳本、同收支類型的 `tags.id`。 |
| `description` | `TEXT`，不可空；預設空字串 | 舊 `description`，記帳備註。 |

`(account_id, kind, id)` 是主鍵。`tagInfo` 是目前畫面查詢時組合出的標籤資料，D1 不重複儲存；API 查詢時再與 `tags` 結合。

### `budget_settings`：預算設定

| D1 欄位 | 型別／可空 | 來源或用途 |
| --- | --- | --- |
| `account_id` | `TEXT`，不可空；主鍵 | 指向 `accounts.id`，每份帳本最多一組預算設定。沒有資料列代表尚未設定。 |
| `amount_minor` | `INTEGER`，不可空；不得小於 0 | 新版預算金額，以 TWD 最小單位儲存；畫面仍沿用目前的預算輸入方式。 |
| `currency_code` | `TEXT`，不可空 | 第一版固定使用 `TWD`。 |
| `currency_scale` | `INTEGER`，不可空 | 第一版固定使用 `2`。 |
| `cycle_day` | `INTEGER`，可空；1–31 | 每月預算週期起始日；空值代表尚未選擇。 |
| `show_budget` | `INTEGER`，不可空；0 或 1 | 是否顯示預算；只有金額大於 0 且有週期起始日才能設為 1。 |

第一版預算只使用 TWD；沿用目前每月指定日期為週期起點、以週期支出扣除預算並計算每日剩餘的方式。多幣別預算與匯率計算留待日後有需求時另行設計。

### `saved_descriptions`：常用備註

| D1 欄位 | 型別／可空 | 來源或用途 |
| --- | --- | --- |
| `account_id` | `TEXT`，不可空；複合主鍵之一 | 指向 `accounts.id`，標示清單屬於哪份帳本。 |
| `id` | `TEXT`，不可空；複合主鍵之一 | 新版由 API 產生的備註 ID；不沿用舊本機數字 ID。 |
| `description` | `TEXT`，不可空；不可為空白 | 備註文字；同帳本內相同文字只存一筆。對應目前 `keepDescItems[].name`，但舊清單不在本次匯入。 |
| `created_at_ms` | `INTEGER`，不可空 | 建立時間，用於讓較新的備註排前面。 |

常用備註可獨立新增或移除；刪除它不會修改已儲存的記帳備註。

### 目前未納入資料表的欄位

- `users/{uid}` 可能有 `email`、`displayName`、`fcmToken`。目前草案只保存 UID 對應；`fcmToken` 不搬入 D1。

## 重要規則

- `accounts.id` 是系統內部的固定帳本 ID；`access_subject` 只接受 Worker 驗證後取得的 Access 使用者識別。這個值與舊 Firebase UID 分開保存，避免將電子郵件或舊 UID 當成新的登入憑證。首次綁定須人工核對。
- `tags.id` 和 `ledger_entries.id` 保留 Firestore 文件 ID。收入與支出原本分屬不同 collection，因此收支主鍵使用 `(account_id, kind, id)`，不假設兩邊的文件 ID 永不重複。
- `kind` 僅能是 `expense` 或 `income`。收支資料的複合外鍵要求它引用同帳本、同類型的標籤；不能連到另一個帳本或不同類型的標籤。
- `occurred_at_ms` 是 Unix epoch 毫秒。從 Firestore `Timestamp` 轉換時保留目前 UI 使用的日期與時間；查詢一天或一段期間時使用「起點含、終點不含」的毫秒範圍，由應用程式依使用者時區計算。匯入前須檢查原資料是否需要保留比毫秒更細的精度。
- 金額在輸入與顯示時可以有小數，但儲存與加總使用 `amount_minor` 整數，不使用 `REAL` 浮點數。例如 `TWD 123.45` 搭配 `currency_scale = 2` 會存 `amount_minor = 12345`；`JPY 123` 搭配 0 會存 `123`；`KWD 1.234` 搭配 3 會存 `1234`。不同幣別的金額不能直接相加，統計須依幣別分組；換匯與匯率不在這份草案的範圍。
- 舊記帳資料的幣別已確認全部是 TWD，匯入時設定 `currency_code = 'TWD'`、`currency_scale = 2`。2026-09-27 的線上資料稽核確認所有支出 `price` 都是非負整數字串，且換算後沒有超過 JavaScript 安全整數範圍；`price = '123'` 會轉成 `amount_minor = 12300`。正式匯入程式仍須逐筆檢查金額與幣別，遇到異常時停止。API 也需檢查幣別與小數位是否相符，並限制金額範圍。
- 刪除標籤已決定改為填入 `archived_at_ms`。一般標籤列表只顯示未封存項目，歷史記帳仍可連回原標籤。若舊資料已有找不到標籤的記帳，匯入前要先列出並決定補建封存標籤或其他處理方式。
- 新版預算與常用備註透過 API 讀寫 D1。舊瀏覽器資料由使用者另外處理，不列入本次搬遷；新版預算從未設定狀態開始，常用備註清單為空。推播設定仍待討論。

## 對應目前查詢

| 功能 | D1 查詢方向 |
| --- | --- |
| 標籤列表與排序 | 依 `account_id + kind + archived_at_ms + sort_order` 查詢，使用 `idx_tags_list`。 |
| 每日收支、期間搜尋、統計 | 依 `account_id + kind + occurred_at_ms` 查詢，使用 `idx_ledger_entries_by_date`。 |
| 記帳詳情與編輯 | 使用 `(account_id, kind, id)` 主鍵定位。 |
| 標籤與記帳關聯 | 以 `(account_id, tag_id, kind)` 連到同類型標籤。 |
| 預算設定 | 依 `account_id` 讀寫 `budget_settings` 單筆資料。 |
| 常用備註 | 依 `account_id` 列出、搜尋、新增或移除 `saved_descriptions`。 |

## 討論時要確認

1. 測試 D1 已與線上來源逐筆比對；正式切換前仍需驗證原生備份可還原，並重新核對切換時的資料差異。
2. 若日後開放 TWD 以外的記帳幣別，再決定預算與統計如何處理不同幣別；第一版維持目前的 TWD 預算計算。

## 依據

此設計對照目前的 `LedgerService`、`LedgerItem`、`TagInfo` 和相關畫面查詢。D1 支援並預設執行外鍵限制；migration 已在 Wrangler 本機與遠端測試 D1 套用成功。[Cloudflare 外鍵文件](https://developers.cloudflare.com/d1/sql-api/foreign-keys/)、[D1 數值型別](https://developers.cloudflare.com/d1/worker-api/)、[Unicode CLDR 幣別小數位](https://unicode.org/cldr/charts/49/supplemental/detailed_territory_currency_information.html)
