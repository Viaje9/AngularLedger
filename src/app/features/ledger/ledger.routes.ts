import { Routes } from '@angular/router';
import { LedgerOverviewComponent } from './ledger-overview/ledger-overview.component';
import { LedgerComponent } from './ledger.component';
import { AddExpenseComponent } from './add-expense/add-expense.component';
import { BudgetComponent } from './budget/budget.component';

export const LEDGER_ROUTES: Routes = [
  {
    path: '',
    component: LedgerComponent,
    children: [
      {
        path: '',
        component: LedgerOverviewComponent,
      },
      {
        path: 'addExpense',
        component: AddExpenseComponent,
      },
      {
        path: 'budget',
        component: BudgetComponent,
      },
    ],
  },
];


