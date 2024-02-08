import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { SharedModule } from '@src/app/shared/shared.module';

@Component({
  selector: 'app-add-income',
  standalone: true,
  imports: [
    SharedModule,
  ],
  templateUrl: './add-income.component.html',
  styleUrl: './add-income.component.css',
})
export class AddIncomeComponent implements OnInit {

  ngOnInit(): void { }

}
