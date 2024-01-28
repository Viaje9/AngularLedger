import { Component, type OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '@src/app/core/services/auth.service';
import { ModalService } from '@src/app/core/services/modal.service';

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

constructor(
  private modalService: ModalService,
  private authService: AuthService
) { }

  ngOnInit(): void { }

  logout(){
    this.modalService.openConfirm({
      content: '確定要登出嗎？',
      onOk: () => {
        this.authService.logout();
      }
    })
  }

}
