import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.css',
})
export class AddExpenseComponent implements OnInit {

  ngOnInit(): void { }

}
