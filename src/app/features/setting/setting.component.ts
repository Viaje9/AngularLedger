import { HttpClient } from '@angular/common/http'; // 新增 HttpClient
import { Component, type OnInit } from '@angular/core';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { getToken, Messaging } from '@angular/fire/messaging';
import { FormsModule } from '@angular/forms'; // 新增表單綁定
import { version } from '@src/app/core/constants/version';
import { AuthService } from '@src/app/core/services/auth.service';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { environment } from '@src/environments/environment';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [SharedModule, FormsModule], // 新增 FormsModule 與 HttpClientModule
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css',
})
export class SettingComponent implements OnInit {
  version = version;
  exportEndpoint: string = ''; // 自訂匯出 API Endpoint

  constructor(
    private messaging: Messaging,
    private firestore: Firestore,
    private auth: AuthService,
    private modalService: ModalService,
    private authService: AuthService,
    private ledgerService: LedgerService,
    private http: HttpClient // 注入 HttpClient
  ) {}

  ngOnInit(): void {}

  // 新增匯出本地資料方法，透過設定的 Endpoint 發送 POST 請求
  exportLocalData(): void {
    // 從 localStorage 取得資料
    const payload = {
      keepDescItems: JSON.parse(localStorage.getItem('keepDescItems') || '[]'),
    };
    // 若未設定 Endpoint，提示使用者
    if (!this.exportEndpoint) {
      this.modalService.openConfirm({ content: '請輸入 API Endpoint' });
      return;
    }
    // 發送 POST 請求
    this.http.post(this.exportEndpoint, payload).subscribe(() => {
      this.modalService.openConfirm({
        title: '匯出成功',
        content: '資料已成功匯出',
      });
    });
  }

  logout() {
    this.modalService.openConfirm({
      content: '確定要登出嗎？',
      onOk: () => {
        this.authService.logout();
      },
    });
  }

  getExpenses() {
    this.modalService.openConfirm({
      content: '確定儲存備註嗎？',
      onOk: () => {
        this.ledgerService.getExpenseList().then((res) => {
          const item = res
            .map((e) => {
              return {
                id: e.date.seconds,
                name: e.description,
              };
            })
            .filter((e) => e.name);
          localStorage.setItem('keepDescItems', JSON.stringify(item));
        });
      },
    });
  }

  async updateFcmToken() {
    try {
      const registration = await navigator.serviceWorker.register(
        `${environment.baseUrl}firebase-messaging-sw.js`,
        {
          scope: environment.baseUrl,
        }
      );
      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidKey,
        serviceWorkerRegistration: registration,
      });

      this.modalService.openConfirm({
        title: 'FCM Token 取得成功',
        content: `Token: ${token}`,
      });

      const userRef = doc(this.firestore, `users/${this.auth.userUid}`);

      await setDoc(userRef, { fcmToken: token }, { merge: true });
    } catch (err) {
      this.modalService.openConfirm({
        title: 'FCM Token 取得失敗',
        content: `${err}`,
      });
    }
  }
}
