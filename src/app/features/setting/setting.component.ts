import { Component, type OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

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

  ngOnInit(): void { }

}
