import { Routes } from '@angular/router';
import { StatisticsChartsComponent } from './statistics-charts/statistics-charts.component';

export const SEARCH_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '', pathMatch: 'full', redirectTo: 'statisticsCharts'
      },
      {
        path: 'statisticsCharts',
        component: StatisticsChartsComponent,
      },
    ],
  },
];


