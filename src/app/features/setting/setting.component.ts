import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css',
})
export class SettingComponent implements OnInit {

  ngOnInit(): void { }

}
