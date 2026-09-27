# Firestore 搬遷資料稽核

方式：透過 Firestore API **唯讀**掃描線上 `(default)` 資料庫；未修改任何雲端文件。完整 Firestore 匯出已建立，匯出作業成功；備份位置及個人資料統計不記錄在此文件。尚未逐筆比對匯出檔與線上資料，也未做備份還原測試。

## 資料類型與處理

| 位置 | 本次搬遷處理 |
| --- | --- |
| `users/{uid}` | 人工核對舊 UID 與新登入身分，只搬遷已確認的帳號。 |
| `users/{uid}/tags` | 搬入 D1 `tags`。 |
| `users/{uid}/expenseList` | 搬入 D1 `ledger_entries`，`kind = expense`。 |
| `users/{uid}/incomeList` | D1 支援收入；依已確認帳號的來源資料處理。 |
| 根層 `tagList` | 現行程式未讀取；本次不匯入。 |
| `users/{uid}/setting` | 舊預算設定不在這次範圍內；新版設定由 D1 儲存。 |

部分 `setting` 位於父 `users/{uid}` 文件已不存在的路徑下。Firestore 允許子集合文件在父文件刪除後仍存在；因此只從現有使用者文件往下列舉，可能漏掉資料。稽核時另以 collection group 查詢確認。

## 金額、日期與關聯

逐筆檢查來源記帳與標籤後，結果如下：

- `price` 是可解析的**非負整數字串**，包含需要保留的零元記帳；換算後未超過 JavaScript 安全整數範圍。
- 舊記帳資料全部是 TWD。匯入時將 `price` 乘以 100，寫入 `amount_minor`，並設定 `currency_code = 'TWD'`、`currency_scale = 2`。
- `date` 是有效的 Firestore 時間戳，沒有毫秒以下的非零精度；這裡不記錄個人記帳日期範圍。
- 支出的 `tagId` 都能找到**同帳本、`expense` 類型**的標籤；沒有孤兒標籤或收支類型不符。
- 支出均有文字型 `description`；標籤均有有效的 `transactionType`、`tagName`、`tagIconName` 和整數型 `sort`。
- 部分舊支出另有 `tagRef` 欄位；現行 model 和 D1 以 `tagId` 關聯標籤，因此不搬這個額外欄位。

## 匯入核對

匯入程式逐筆驗證欄位與關聯；匯入後重新匯出遠端 D1，與已確認帳號的線上 Firestore 來源逐筆比對一致，外鍵檢查沒有錯誤。這項核對不等於對 Firestore 原生備份做還原測試。

舊瀏覽器的預算與常用備註由使用者另外處理；線上的舊 `setting` 文件也不在這次預算匯入範圍。根層 `tagList` 看起來是舊資料，目前程式沒有讀取它；正式清理 Firebase 前應保留原始備份。
