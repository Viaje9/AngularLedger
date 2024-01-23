import { Routes } from '@angular/router';
import { LayoutComponent } from './core/components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('./features/ledger/ledger.routes').then(m => m.LEDGER_ROUTES)
      },
      {
        path: 'setting',
        loadChildren: () => import('./features/setting/setting.routes').then(m => m.SETTING_ROUTES)
      },
    ],
  },
];


