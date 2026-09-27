import { Component } from '@angular/core';
import { version } from '@src/app/core/constants/version';
import { AuthService } from '@src/app/core/services/auth.service';
import { PreferencesService } from '@src/app/core/services/preferences.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-setting',
  imports: [SharedModule],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css'
})
export class SettingComponent {
  version = version;

  constructor(
    private auth: AuthService,
    private modalService: ModalService,
    private preferences: PreferencesService,
  ) {}

  logout() {
    this.modalService.openConfirm({
      content: '確定要登出嗎？',
      onOk: () => this.auth.logout(),
    });
  }

  getExpenses() {
    this.modalService.openConfirm({
      content: '將支出中的備註存成常用備註嗎？',
      onOk: () => {
        this.preferences.saveExpenseDescriptions()
          .then(result => this.modalService.openConfirm({
            content: `已新增 ${result.added} 筆常用備註`,
            showCancelBtn: false,
          }))
          .catch(() => this.modalService.openConfirm({
            content: '儲存備註失敗',
            showCancelBtn: false,
          }));
      },
    });
  }
}
