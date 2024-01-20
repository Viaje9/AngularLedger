import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.css',
})
export class BudgetComponent implements OnInit {

  ngOnInit(): void { }

}
