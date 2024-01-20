import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-ledger-overview',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './ledger-overview.component.html',
  styleUrl: './ledger-overview.component.css',
})
export class LedgerOverviewComponent implements OnInit {
  ledgerItems = [
    {
      id: 1,
      category: 'test',
      name: 'test',
      description: 'test',
      amount: 100,
      date: new Date(),
    }
  ]
  ngOnInit(): void {
    this.ledgerItems = Array.from({ length: 30 }, (_, i) => i + 1).map((i) => ({
      id: i,
      category: 'test',
      name: 'test',
      description: 'test',
      amount: 100,
      date: new Date(),
    }))
  }

}
