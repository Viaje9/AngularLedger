import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-statistics-charts',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './statistics-charts.component.html',
  styleUrl: './statistics-charts.component.css',
})
export class StatisticsChartsComponent implements OnInit {

  ngOnInit(): void { }

}
