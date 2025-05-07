import { Component, type OnInit } from '@angular/core';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { getToken, Messaging } from '@angular/fire/messaging';
import { version } from '@src/app/core/constants/version';
import { AuthService } from '@src/app/core/services/auth.service';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { environment } from '@src/environments/environment';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css',
})
export class SettingComponent implements OnInit {
  version = version;

  constructor(
    private messaging: Messaging,
    private firestore: Firestore,
    private auth: AuthService,
    private modalService: ModalService,
    private authService: AuthService,
    private ledgerService: LedgerService,
  ) {}

  ngOnInit(): void {}

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
      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidKey,
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
