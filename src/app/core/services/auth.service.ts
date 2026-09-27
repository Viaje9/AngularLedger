import { Injectable } from '@angular/core';
import { getMe } from '../../api/generated/sdk.gen';

@Injectable({ providedIn: 'root' })
export class AuthService {
  message = '請透過 Cloudflare Access 登入並連結帳本。';
  accountId: string | null = null;

  async isSignedIn(): Promise<boolean> {
    try {
      const { data } = await getMe({ throwOnError: true });
      this.accountId = data.account.id || null;
      return this.accountId !== null;
    } catch (reason) {
      this.accountId = null;
      const code = (reason as { error?: { code?: string } })?.error?.code;
      this.message = code === 'ACCOUNT_NOT_LINKED'
        ? 'Access 已登入，但尚未連結帳本。請先設定帳本身分對應。'
        : '尚未通過 Access 驗證，請重新登入。';
      return false;
    }
  }

  login() {
    window.location.assign('/?ngsw-bypass');
  }

  logout() {
    window.location.assign('/cdn-cgi/access/logout?ngsw-bypass');
  }
}
