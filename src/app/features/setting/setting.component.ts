import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.css',
})
export class SettingComponent implements OnInit {

  ngOnInit(): void { }

}
