import { Routes } from '@angular/router';
import { StatisticsChartsComponent } from './statistics-charts/statistics-charts.component';
import { SearchLedgerComponent } from './search-ledger/search-ledger.component';

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
      {
        path: 'searchLedger',
        component: SearchLedgerComponent,
      },
    ],
  },
];


