const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export function consentPage(clientId: string, consent: string, nonce: string) {
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><title>授權記帳查詢 · AngularLedger</title>
  <style nonce="${nonce}">
  *{box-sizing:border-box}body{margin:0;background:#f7f5f2;color:#26221f;font-family:"PingFang TC","Microsoft JhengHei",sans-serif;line-height:1.7}
  main{max-width:580px;margin:10vh auto;padding:32px 28px}header{display:flex;align-items:center;gap:12px;margin-bottom:56px;font-size:15px;font-weight:600}
  .mark{display:grid;place-items:center;width:34px;height:34px;background:#b91c1c;color:#fff;border-radius:9px;font-family:Georgia,serif;font-size:23px}
  .eyebrow{font-size:12px;letter-spacing:.12em;color:#a42323;font-weight:700}h1{font-size:30px;line-height:1.45;margin:12px 0 20px;font-weight:650;letter-spacing:-.03em}
  .intro{color:#665e57;font-size:15px;margin-bottom:28px}.permissions{border-top:1px solid #ded8d1;border-bottom:1px solid #ded8d1;padding:22px 0;margin:0 0 24px;list-style:none}
  .permissions li+li{margin-top:14px}.permissions strong{display:block;font-size:15px}.permissions span{font-size:14px;color:#665e57}
  .client{font-size:12px;color:#756b61;overflow-wrap:anywhere;margin-bottom:24px}form{display:flex;gap:12px}button{flex:1;min-height:48px;padding:12px;border-radius:9px;border:1px solid #ccc4bb;background:transparent;color:#403831;font:inherit;font-size:15px;cursor:pointer}
  button[value=allow]{background:#b91c1c;border-color:#b91c1c;color:white;font-weight:600}button:hover{filter:brightness(.94)}button:focus-visible{outline:3px solid #c46044;outline-offset:3px}
  footer{font-size:12px;color:#756b61;margin-top:20px}@media(max-width:600px){main{margin:2vh auto;padding:28px 24px}header{margin-bottom:40px}h1{font-size:27px}}
  </style></head><body><main><header><span class="mark" aria-hidden="true">L</span>AngularLedger</header>
  <div class="eyebrow">CHATGPT · 帳本連接</div><h1>允許 ChatGPT<br>查詢你的帳本？</h1>
  <p class="intro">連接後，你可以直接在對話裡查支出、找記帳明細，或比較每月收支。查到的記帳內容會提供給 ChatGPT 回答你的問題。</p>
  <ul class="permissions"><li><strong>查詢收入、支出與分類</strong><span>包含日期、金額、備註與期間統計。</span></li>
  <li><strong>僅開放讀取</strong><span>無法新增、修改或刪除任何記帳。</span></li>
  <li><strong>自動保持連接</strong><span>使用時自動續期；連續 90 天未使用才需重新授權。你可以隨時撤銷。</span></li></ul>
  <p class="client">連接的應用程式：${escapeHtml(clientId)}</p>
  <form method="post" action="/oauth/authorize"><input type="hidden" name="consent" value="${consent}">
  <button name="decision" value="deny">取消</button><button name="decision" value="allow">允許查詢</button></form>
  <footer>授權範圍僅限目前登入帳號的帳本。</footer></main></body></html>`;
}
