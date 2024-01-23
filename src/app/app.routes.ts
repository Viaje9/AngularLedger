import { Routes } from '@angular/router';
import { LayoutComponent } from './core/components/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/ledger-overview/ledger-overview.component').then(m => m.LedgerOverviewComponent)
      },
      {
        path: 'addExpense',
        loadComponent: () => import('./features/add-expense/add-expense.component').then(m => m.AddExpenseComponent)
      },
      {
        path: 'budget',
        loadComponent: () => import('./features/budget/budget.component').then(m => m.BudgetComponent)
      },
      {
        path: 'setting',
        loadChildren: () => import('./features/setting/setting.routes').then(m => m.SETTING_ROUTES)
      },
    ],
  },
];


