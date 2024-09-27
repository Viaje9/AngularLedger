import { Component, type OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '@src/app/core/services/auth.service';
import { ModalService } from '@src/app/core/services/modal.service';
import { LedgerService } from '@src/app/core/services/ledger.service';
import { version } from '@src/app/core/constants/version';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [
    SharedModule
  ],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css',
})
export class SettingComponent implements OnInit {

  version = version;

  constructor(
    private modalService: ModalService,
    private authService: AuthService,
    private ledgerService: LedgerService
  ) { }

  ngOnInit(): void { }

  logout() {
    this.modalService.openConfirm({
      content: '確定要登出嗎？',
      onOk: () => {
        this.authService.logout();
      }
    })
  }

  getExpenses() {
    this.modalService.openConfirm({
      content: '確定儲存備註嗎？',
      onOk: () => {
        this.ledgerService.getExpenseList().then((res) => {
          const item = res.map(e => {
            return {
              id: e.date.seconds,
              name: e.description,
            }
          }).filter(e => e.name)
          localStorage.setItem('keepDescItems', JSON.stringify(item))
        })
      }
    })

  }

}
