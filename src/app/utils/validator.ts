export function isValidDate(dateString: string) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  // 正則表達式匹配 YYYY-MM-DD 格式
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

  // 檢查基本格式
  if (!regex.test(dateString)) {
    return false;
  }

  // 構造日期對象來檢查日期的有效性（例如檢查2月是否有29天）
  const date = new Date(dateString);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() 從 0 開始計算
  const day = date.getDate().toString().padStart(2, '0');

  // 檢查解析後的日期是否與輸入一致
  return dateString === `${year}-${month}-${day}`;
}
