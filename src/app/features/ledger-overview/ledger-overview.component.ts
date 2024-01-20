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

  ngOnInit(): void { }

}
